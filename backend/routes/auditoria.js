const express = require('express');
const router = express.Router();
const requireRole = require('../middleware/roles');
const db = require('../db');

// Apenas administradores podem consultar o histórico operacional.
router.get('/', requireRole('admin'), async (req, res) => {
  try {
    const r = await db.query(
      `SELECT a.id, a.evento, a.recurso, a.codigo_http, a.created_at,
              u.username AS usuario
       FROM iam.auditoria a
       LEFT JOIN iam.usuarios u ON u.id = a.usuario_id
       ORDER BY a.created_at DESC LIMIT 100`
    );
    res.json({ items: r.rows });
  } catch (_) {
    res.status(500).json({ code: 'DB_ERROR', message: 'Erro ao listar auditoria' });
  }
});

module.exports = router;
