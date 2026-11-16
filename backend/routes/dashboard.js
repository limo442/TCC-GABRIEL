const express = require('express');
const router = express.Router();
const db = require('../db');

// Agregações no PostgreSQL evitam contar apenas a primeira página das listas.
router.get('/', async (req, res) => {
  try {
    const [veiculos, clientes, alugueis, recentes] = await Promise.all([
      db.query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE disponivel = TRUE)::int AS disponiveis FROM aluguel.veiculos`),
      db.query(`SELECT COUNT(*)::int AS total FROM aluguel.clientes`),
      db.query(`SELECT
        COUNT(*) FILTER (WHERE status = 'ativo')::int AS ativos,
        COUNT(*) FILTER (WHERE status = 'reservado')::int AS reservados,
        COUNT(*) FILTER (WHERE status = 'concluido')::int AS concluidos,
        COUNT(*) FILTER (WHERE status = 'cancelado')::int AS cancelados,
        COALESCE(SUM(valor_realizado) FILTER (WHERE status = 'concluido'), 0) AS receita
        FROM aluguel.alugueis`),
      db.query(`SELECT a.*, v.marca, v.modelo, c.nome AS cliente_nome
        FROM aluguel.alugueis a
        JOIN aluguel.veiculos v ON v.id = a.veiculo_id
        JOIN aluguel.clientes c ON c.id = a.cliente_id
        ORDER BY a.id DESC LIMIT 8`)
    ]);

    res.json({
      totalVeiculos: veiculos.rows[0].total,
      disponiveis: veiculos.rows[0].disponiveis,
      totalClientes: clientes.rows[0].total,
      ativos: alugueis.rows[0].ativos,
      reservados: alugueis.rows[0].reservados,
      concluidos: alugueis.rows[0].concluidos,
      cancelados: alugueis.rows[0].cancelados,
      receita: Number(alugueis.rows[0].receita),
      recentRentals: recentes.rows
    });
  } catch (err) {
    res.status(500).json({ code: 'DB_ERROR', message: 'Erro ao carregar indicadores' });
  }
});

module.exports = router;
