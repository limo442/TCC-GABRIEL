const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const config = require('../config');

// POST /api/auth/login - Public route (no auth required)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        code: 'MISSING_CREDENTIALS', 
        type: 'BAD_REQUEST', 
        message: 'Username e senha são obrigatórios',
        detailedMessage: 'Informe username e password no corpo da requisição'
      });
    }

    const result = await db.query('SELECT * FROM iam.usuarios WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ 
        code: 'INVALID_CREDENTIALS', 
        type: 'UNAUTHORIZED', 
        message: 'Credenciais inválidas',
        detailedMessage: 'Username ou senha incorretos'
      });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ 
        code: 'INVALID_CREDENTIALS', 
        type: 'UNAUTHORIZED', 
        message: 'Credenciais inválidas',
        detailedMessage: 'Username ou senha incorretos'
      });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, type: 'user' },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    res.json({ 
      token, 
      user: { id: user.id, username: user.username },
      expiresIn: 86400 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      code: 'INTERNAL_ERROR', 
      type: 'INTERNAL_SERVER_ERROR', 
      message: 'Erro ao processar login',
      detailedMessage: err.message 
    });
  }
});

// POST /api/auth/logout - Public route (optional, client-side token removal)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout realizado com sucesso' });
});

module.exports = router;