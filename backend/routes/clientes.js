const express = require('express');
const router = express.Router();
const db = require('../db');
const { paginate, parsePagination } = require('../utils/pagination');
const { clienteInputSchema, clienteIdSchema } = require('../validation/schemas');

// GET /api/clientes
router.get('/', async (req, res) => {
  try {
    const { page = 0, pageSize = 10 } = req.query;
    const paging = parsePagination(req.query);
    if (!paging) return res.status(400).json({
      code: 'VALIDATION_ERROR', message: 'Paginação inválida'
    });
    const { pageNum, size } = paging;
    
    let query = 'SELECT * FROM aluguel.clientes';
    query += ' ORDER BY id ASC';
    query += ` LIMIT $1 OFFSET $2`;
    
    const result = await db.query(query, [size + 1, pageNum * size]); // pageSize+1 for hasNext
    const paginated = paginate(result.rows, pageNum, size);
    res.json(paginated);
  } catch (err) {
    res.status(500).json({ code: 'DB_ERROR', type: 'INTERNAL_SERVER_ERROR', message: 'Erro ao listar clientes', detailedMessage: 'Consulte o administrador do sistema' });
  }
});

// GET /api/clientes/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM aluguel.clientes WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ code: 'CLIENT_NOT_FOUND', type: 'NOT_FOUND', message: 'Cliente não encontrado', detailedMessage: `Cliente com id ${req.params.id} não existe` });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ code: 'DB_ERROR', type: 'INTERNAL_SERVER_ERROR', message: 'Erro ao buscar cliente', detailedMessage: 'Consulte o administrador do sistema' });
  }
});

// POST /api/clientes
router.post('/', async (req, res) => {
  try {
    // Validate input using Joi
    const { error, value } = clienteInputSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        code: 'VALIDATION_ERROR', 
        type: 'BAD_REQUEST', 
        message: 'Dados inválidos', 
        detailedMessage: error.details[0].message 
      });
    }

    const { cod, nome, endereco, telefone, data_nascimento } = value;

    const result = await db.query(
      'INSERT INTO aluguel.clientes (cod, nome, endereco, telefone, data_nascimento) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [cod, nome, endereco || null, telefone || null, data_nascimento || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ code: 'DUPLICATE_COD', type: 'BAD_REQUEST', message: 'Código já cadastrado', detailedMessage: 'O código informado já existe' });
    res.status(500).json({ code: 'DB_ERROR', type: 'INTERNAL_SERVER_ERROR', message: 'Erro ao cadastrar cliente', detailedMessage: 'Consulte o administrador do sistema' });
  }
});

// PUT /api/clientes/:id
router.put('/:id', async (req, res) => {
  try {
    // Validate input using Joi
    const { error, value } = clienteInputSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        code: 'VALIDATION_ERROR', 
        type: 'BAD_REQUEST', 
        message: 'Dados inválidos', 
        detailedMessage: error.details[0].message 
      });
    }

    const { id } = req.params;
    
    // Validate ID
    const { error: idError } = clienteIdSchema.validate({ id });
    if (idError) {
      return res.status(400).json({ 
        code: 'VALIDATION_ERROR', 
        type: 'BAD_REQUEST', 
        message: 'ID inválido', 
        detailedMessage: idError.details[0].message 
      });
    }

    const { cod, nome, endereco, telefone, data_nascimento } = value;
    const existing = await db.query('SELECT * FROM aluguel.clientes WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ code: 'CLIENT_NOT_FOUND', type: 'NOT_FOUND', message: 'Cliente não encontrado', detailedMessage: `Cliente com id ${id} não existe` });

    const c = existing.rows[0];
    const result = await db.query(
      'UPDATE aluguel.clientes SET cod=$1, nome=$2, endereco=$3, telefone=$4, data_nascimento=$5, updated_at=NOW() WHERE id=$6 RETURNING *',
      [
        cod ?? c.cod,
        nome ?? c.nome,
        endereco !== undefined ? endereco : c.endereco,
        telefone !== undefined ? telefone : c.telefone,
        data_nascimento !== undefined ? data_nascimento : c.data_nascimento,
        id,
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ code: 'DUPLICATE_COD', type: 'BAD_REQUEST', message: 'Código já cadastrado', detailedMessage: 'O código informado já existe' });
    res.status(500).json({ code: 'DB_ERROR', type: 'INTERNAL_SERVER_ERROR', message: 'Erro ao atualizar cliente', detailedMessage: 'Consulte o administrador do sistema' });
  }
});

// DELETE /api/clientes/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM aluguel.clientes WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ code: 'CLIENT_NOT_FOUND', type: 'NOT_FOUND', message: 'Cliente não encontrado', detailedMessage: `Cliente com id ${req.params.id} não existe` });
    res.status(204).send();
  } catch (err) {
    if (err.code === '23503') return res.status(400).json({ code: 'CLIENT_IN_USE', type: 'BAD_REQUEST', message: 'Cliente possui aluguéis vinculados', detailedMessage: 'Não é possível excluir um cliente com aluguéis associados' });
    res.status(500).json({ code: 'DB_ERROR', type: 'INTERNAL_SERVER_ERROR', message: 'Erro ao excluir cliente', detailedMessage: 'Consulte o administrador do sistema' });
  }
});

module.exports = router;
