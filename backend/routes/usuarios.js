const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { paginate } = require('../utils/pagination');
const requireRole = require('../middleware/roles');
const {
  usuarioInputSchema, usuarioUpdateSchema, usuarioIdSchema, paginationSchema
} = require('../validation/schemas');

const router = express.Router();
const safeFields = 'id, username, role, created_at, updated_at';

router.get('/', async (req, res) => {
  const { error, value } = paginationSchema.validate(req.query);
  if (error) return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Paginação inválida' });
  try {
    const { page, pageSize } = value;
    const result = await db.query(
      `SELECT ${safeFields} FROM iam.usuarios ORDER BY id ASC LIMIT $1 OFFSET $2`,
      [pageSize + 1, page * pageSize]
    );
    res.json(paginate(result.rows, page, pageSize));
  } catch (err) {
    res.status(500).json({ code: 'DB_ERROR', message: 'Erro ao listar usuários' });
  }
});

router.post('/', requireRole('admin'), async (req, res) => {
  const { error, value } = usuarioInputSchema.validate(req.body);
  if (error) return res.status(400).json({ code: 'VALIDATION_ERROR', message: error.details[0].message });
  try {
    const hash = await bcrypt.hash(value.password, 12);
    const result = await db.query(
      `INSERT INTO iam.usuarios (username, password, role)
       VALUES ($1, $2, $3) RETURNING ${safeFields}`,
      [value.username, hash, value.role]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ code: 'DUPLICATE_USERNAME', message: 'Usuário já cadastrado' });
    res.status(500).json({ code: 'DB_ERROR', message: 'Erro ao cadastrar usuário' });
  }
});

router.put('/:id', requireRole('admin'), async (req, res) => {
  const idResult = usuarioIdSchema.validate(req.params);
  const { error, value } = usuarioUpdateSchema.validate(req.body);
  if (idResult.error || error) return res.status(400).json({
    code: 'VALIDATION_ERROR', message: (idResult.error || error).details[0].message
  });

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const previous = await client.query('SELECT * FROM iam.usuarios WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (!previous.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ code: 'USER_NOT_FOUND', message: 'Usuário não encontrado' });
    }
    const current = previous.rows[0];
    const nextRole = value.role || current.role;
    if (current.role === 'admin' && nextRole !== 'admin') {
      // Bloqueia mudança do próprio perfil e remoção do último administrador.
      const admins = await client.query('SELECT id FROM iam.usuarios WHERE role = $1 FOR UPDATE', ['admin']);
      if (req.user.id === current.id || admins.rows.length <= 1) {
        await client.query('ROLLBACK');
        return res.status(409).json({ code: 'LAST_ADMIN', message: 'Não é permitido remover este administrador' });
      }
    }
    const hash = value.password ? await bcrypt.hash(value.password, 12) : current.password;
    const result = await client.query(
      `UPDATE iam.usuarios SET username=$1, password=$2, role=$3, updated_at=NOW()
       WHERE id=$4 RETURNING ${safeFields}`,
      [value.username || current.username, hash, nextRole, req.params.id]
    );
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') return res.status(409).json({ code: 'DUPLICATE_USERNAME', message: 'Usuário já cadastrado' });
    res.status(500).json({ code: 'DB_ERROR', message: 'Erro ao atualizar usuário' });
  } finally {
    client.release();
  }
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  const idResult = usuarioIdSchema.validate(req.params);
  if (idResult.error) return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'ID inválido' });
  if (Number(req.params.id) === req.user.id) {
    return res.status(409).json({ code: 'SELF_DELETE', message: 'Não é possível excluir o próprio usuário' });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const previous = await client.query('SELECT * FROM iam.usuarios WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (!previous.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ code: 'USER_NOT_FOUND', message: 'Usuário não encontrado' });
    }
    if (previous.rows[0].role === 'admin') {
      const admins = await client.query('SELECT id FROM iam.usuarios WHERE role = $1 FOR UPDATE', ['admin']);
      if (admins.rows.length <= 1) {
        await client.query('ROLLBACK');
        return res.status(409).json({ code: 'LAST_ADMIN', message: 'O sistema precisa de pelo menos um administrador' });
      }
    }
    await client.query('DELETE FROM iam.usuarios WHERE id = $1', [req.params.id]);
    await client.query('COMMIT');
    res.status(204).send();
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23503') return res.status(409).json({
      code: 'USER_HAS_RENTALS', message: 'Este usuário possui locações vinculadas e não pode ser excluído'
    });
    res.status(500).json({ code: 'DB_ERROR', message: 'Erro ao excluir usuário' });
  } finally {
    client.release();
  }
});

module.exports = router;
