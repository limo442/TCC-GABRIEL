const express = require('express');
const router = express.Router();
const db = require('../db');
const { paginate, parsePagination } = require('../utils/pagination');
const { veiculoInputSchema, veiculoIdSchema } = require('../validation/schemas');

// GET /api/veiculos
router.get('/', async (req, res) => {
  try {
    const { disponivel, categoria, marca, modelo } = req.query;
    const paging = parsePagination(req.query);
    if (!paging) return res.status(400).json({
      code: 'VALIDATION_ERROR', message: 'Paginação inválida'
    });
    const { pageNum, size } = paging;
    
    let query = 'SELECT * FROM aluguel.veiculos WHERE 1=1';
    const params = [];

    if (disponivel !== undefined) {
      params.push(disponivel === 'true');
      query += ` AND disponivel = $${params.length}`;
    }
    if (categoria) {
      params.push(`%${categoria}%`);
      query += ` AND LOWER(categoria) LIKE LOWER($${params.length})`;
    }
    if (marca) {
      params.push(`%${marca}%`);
      query += ` AND LOWER(marca) LIKE LOWER($${params.length})`;
    }
    if (modelo) {
      params.push(`%${modelo}%`);
      query += ` AND LOWER(modelo) LIKE LOWER($${params.length})`;
    }

    query += ' ORDER BY id ASC';
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(size + 1); // pageSize+1 for hasNext calculation
    params.push(pageNum * size);

    const result = await db.query(query, params);
    const paginated = paginate(result.rows, pageNum, size);
    res.json(paginated);
  } catch (err) {
    res.status(500).json({ code: 'DB_ERROR', type: 'INTERNAL_SERVER_ERROR', message: 'Erro ao listar veículos', detailedMessage: 'Consulte o administrador do sistema' });
  }
});

// GET /api/veiculos/:id
router.get('/:id', async (req, res) => {
  const { error: idError } = veiculoIdSchema.validate(req.params);
  if (idError) return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'ID inválido' });
  try {
    const result = await db.query('SELECT * FROM aluguel.veiculos WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ code: 'VEHICLE_NOT_FOUND', type: 'NOT_FOUND', message: 'Veículo não encontrado', detailedMessage: `Veículo com id ${req.params.id} não existe` });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ code: 'DB_ERROR', type: 'INTERNAL_SERVER_ERROR', message: 'Erro ao buscar veículo', detailedMessage: 'Consulte o administrador do sistema' });
  }
});

// POST /api/veiculos
router.post('/', async (req, res) => {
  try {
    // Validate input using Joi
    const { error, value } = veiculoInputSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        code: 'VALIDATION_ERROR', 
        type: 'BAD_REQUEST', 
        message: 'Dados inválidos', 
        detailedMessage: error.details[0].message 
      });
    }

    const { marca, modelo, categoria, ano_fabricacao, placa, valor_diaria, disponivel = true } = value;

    const result = await db.query(
      'INSERT INTO aluguel.veiculos (marca, modelo, categoria, ano_fabricacao, placa, valor_diaria, disponivel) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [marca, modelo, categoria, ano_fabricacao, placa, valor_diaria, disponivel]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ code: 'DUPLICATE_PLATE', type: 'BAD_REQUEST', message: 'Placa já cadastrada', detailedMessage: `A placa informada já existe` });
    res.status(500).json({ code: 'DB_ERROR', type: 'INTERNAL_SERVER_ERROR', message: 'Erro ao cadastrar veículo', detailedMessage: 'Consulte o administrador do sistema' });
  }
});

// PUT /api/veiculos/:id
router.put('/:id', async (req, res) => {
  const { error, value } = veiculoInputSchema.validate(req.body);
  const { error: idError } = veiculoIdSchema.validate(req.params);
  if (error || idError) return res.status(400).json({
    code: 'VALIDATION_ERROR',
    message: (error || idError).details[0].message
  });

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query(
      'SELECT * FROM aluguel.veiculos WHERE id = $1 FOR UPDATE', [req.params.id]
    );
    if (!existing.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ code: 'VEHICLE_NOT_FOUND', message: 'Veículo não encontrado' });
    }

    // Um veículo com reserva ou aluguel em aberto não pode ser disponibilizado à força.
    if (value.disponivel === true) {
      const openRentals = await client.query(
        "SELECT id FROM aluguel.alugueis WHERE veiculo_id = $1 AND status IN ('reservado', 'ativo') LIMIT 1",
        [req.params.id]
      );
      if (openRentals.rows.length) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          code: 'VEHICLE_IN_USE',
          message: 'Não é possível disponibilizar um veículo com aluguel em aberto'
        });
      }
    }

    const old = existing.rows[0];
    const result = await client.query(
      `UPDATE aluguel.veiculos
       SET marca=$1, modelo=$2, categoria=$3, ano_fabricacao=$4,
           placa=$5, valor_diaria=$6, disponivel=$7, updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [
        value.marca, value.modelo, value.categoria, value.ano_fabricacao,
        value.placa, value.valor_diaria,
        value.disponivel !== undefined ? value.disponivel : old.disponivel,
        req.params.id
      ]
    );
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') return res.status(409).json({
      code: 'DUPLICATE_PLATE', message: 'Placa já cadastrada'
    });
    res.status(500).json({ code: 'DB_ERROR', message: 'Erro ao atualizar veículo' });
  } finally {
    client.release();
  }
});

// DELETE /api/veiculos/:id
router.delete('/:id', async (req, res) => {
  const { error: idError } = veiculoIdSchema.validate(req.params);
  if (idError) return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'ID inválido' });
  try {
    const result = await db.query('DELETE FROM aluguel.veiculos WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ code: 'VEHICLE_NOT_FOUND', type: 'NOT_FOUND', message: 'Veículo não encontrado', detailedMessage: `Veículo com id ${req.params.id} não existe` });
    res.status(204).send();
  } catch (err) {
    if (err.code === '23503') return res.status(400).json({ code: 'VEHICLE_IN_USE', type: 'BAD_REQUEST', message: 'Veículo possui aluguéis vinculados', detailedMessage: 'Não é possível excluir um veículo com aluguéis associados' });
    res.status(500).json({ code: 'DB_ERROR', type: 'INTERNAL_SERVER_ERROR', message: 'Erro ao excluir veículo', detailedMessage: 'Consulte o administrador do sistema' });
  }
});

module.exports = router;
