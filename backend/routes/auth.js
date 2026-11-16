const express = require('express');
const { randomUUID } = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const config = require('../config');
const authenticate = require('../middleware/auth');
const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
      return res.status(400).json({ code: 'MISSING_CREDENTIALS', message: 'Usuário e senha são obrigatórios' });
    }
    const result = await db.query('SELECT id, username, password, role FROM iam.usuarios WHERE username = $1', [username]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'Credenciais inválidas' });
    }
    const expiresIn = 8 * 60 * 60;
    const token = jwt.sign({ sub: String(user.id), type: 'user' }, config.jwtSecret, {
      algorithm: 'HS256',
      jwtid: randomUUID(),
      expiresIn
    });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role }, expiresIn });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Erro ao processar login' });
  }
});

// Logout revoga o identificador do JWT no PostgreSQL até sua expiração.
router.post('/logout', authenticate, async (req, res) => {
  try {
    await db.query(
      'INSERT INTO iam.tokens_revogados (jti, expires_at) VALUES ($1, to_timestamp($2)) ON CONFLICT (jti) DO NOTHING',
      [req.tokenJti, req.tokenExp]
    );
    res.json({ message: 'Logout realizado com sucesso' });
  } catch (err) {
    console.error('Falha ao revogar token:', err);
    res.status(500).json({ code: 'LOGOUT_ERROR', message: 'Erro ao encerrar sessão' });
  }
});

module.exports = router;
