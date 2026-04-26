const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { paginate } = require('../utils/pagination');
const { usuarioInputSchema, usuarioIdSchema } = require('../validation/schemas');

// POST /api/usuarios
router.post('/', async (req, res) => {
  try {
    // Validate input using Joi
    const { error, value } = usuarioInputSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        code: 'VALIDATION_ERROR', 
        type: 'BAD_REQUEST', 
        message: 'Dados inválidos', 
        detailedMessage: error.details[0].message 
      });
    }

    const { username, password } = value;
    
    const hashed = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO iam.usuarios (username, password) VALUES ($1, $2) RETURNING id, username, created_at, updated_at',
      [username, hashed]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ code: 'DUPLICATE_USERNAME', type: 'BAD_REQUEST', message: 'Username já cadastrado', detailedMessage: 'O username informado já existe' });
    res.status(500).json({ code: 'DB_ERROR', type: 'INTERNAL_SERVER_ERROR', message: 'Erro ao cadastrar usuário', detailedMessage: err.message });
  }
});

// GET /api/usuarios
router.get('/', async (req, res) => {
  try {
    const { page = 0, pageSize = 10 } = req.query;
    const pageNum = parseInt(page);
    const size = parseInt(pageSize);
    
    let query = 'SELECT id, username, created_at, updated_at FROM iam.usuarios';
    query += ' ORDER BY id ASC';
    query += ` LIMIT $1 OFFSET $2`;
    
    const result = await db.query(query, [size + 1, pageNum * size]); // pageSize+1 for hasNext
    const paginated = paginate(result.rows, pageNum, size);
    res.json(paginated);
  } catch (err) {
    res.status(500).json({ code: 'DB_ERROR', type: 'INTERNAL_SERVER_ERROR', message: 'Erro ao listar usuários', detailedMessage: err.message });
  }
});

module.exports = router;
