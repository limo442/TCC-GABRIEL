const express = require('express');
const Joi = require('joi');
const db = require('../db');
const router = express.Router();

const idSchema = Joi.string().guid({ version: ['uuidv4'] }).required();

router.get('/', async (req, res) => {
  const { status = 'pendente' } = req.query;
  if (!['pendente','aprovada','recusada','todas'].includes(status)) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Status inválido' });
  }
  try {
    const sql = `SELECT s.id, s.nome, s.email, s.telefone, s.data_saida,
                 s.dias_previsto, s.status, s.created_at, s.aluguel_id,
                 v.marca, v.modelo, v.valor_diaria
                 FROM aluguel.solicitacoes s
                 JOIN aluguel.veiculos v ON v.id = s.veiculo_id
                 WHERE ($1::text = 'todas' OR s.status = $1)
                 ORDER BY s.created_at DESC LIMIT 100`;
    const result = await db.query(sql, [status]);
    res.json({ items: result.rows });
  } catch (_) {
    res.status(500).json({ code: 'DB_ERROR', message: 'Erro ao listar solicitações' });
  }
});

router.put('/:id/recusar', async (req, res) => {
  if (idSchema.validate(req.params.id).error) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Identificador inválido' });
  }
  try {
    const result = await db.query(
      `UPDATE aluguel.solicitacoes
       SET status = 'recusada', atendida_por = $2, updated_at = NOW()
       WHERE id = $1 AND status = 'pendente'
       RETURNING id, status`,
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(409).json({
      code: 'INVALID_STATUS', message: 'Pedido inexistente ou já avaliado'
    });
    res.json(result.rows[0]);
  } catch (_) {
    res.status(500).json({ code: 'DB_ERROR', message: 'Erro ao recusar solicitação' });
  }
});

router.put('/:id/aprovar', async (req, res) => {
  if (idSchema.validate(req.params.id).error) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Identificador inválido' });
  }
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const found = await client.query(
      'SELECT * FROM aluguel.solicitacoes WHERE id = $1 FOR UPDATE', [req.params.id]
    );
    const s = found.rows[0];
    if (!s || s.status !== 'pendente') {
      await client.query('ROLLBACK');
      return res.status(409).json({ code: 'INVALID_STATUS', message: 'Pedido inexistente ou já avaliado' });
    }
    const vehicle = await client.query(
      'SELECT id, disponivel, valor_diaria FROM aluguel.veiculos WHERE id = $1 FOR UPDATE',
      [s.veiculo_id]
    );
    if (!vehicle.rows.length || !vehicle.rows[0].disponivel) {
      await client.query('ROLLBACK');
      return res.status(409).json({ code: 'VEHICLE_UNAVAILABLE', message: 'Veículo indisponível' });
    }
    // Cria um cadastro vinculado a este pedido; requer contato posterior para confirmar os dados.
    const customer = await client.query(
      `INSERT INTO aluguel.clientes (cod, nome, telefone)
       VALUES ($1, $2, $3) RETURNING id`,
      ['WEB-' + s.id, s.nome, s.telefone]
    );
    await client.query(
      'UPDATE aluguel.veiculos SET disponivel = FALSE, updated_at = NOW() WHERE id = $1',
      [s.veiculo_id]
    );
    const amount = Number(vehicle.rows[0].valor_diaria) * s.dias_previsto;
    const rental = await client.query(
      `INSERT INTO aluguel.alugueis
       (veiculo_id, cliente_id, usuario_id, data_saida, dias_previsto, valor_previsto, forma_pagamento, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pix', 'reservado')
       RETURNING id, status`,
      [s.veiculo_id, customer.rows[0].id, req.user.id, s.data_saida, s.dias_previsto, amount]
    );
    await client.query(
      `UPDATE aluguel.solicitacoes
       SET status='aprovada', atendida_por=$2, aluguel_id=$3, updated_at=NOW() WHERE id=$1`,
      [s.id, req.user.id, rental.rows[0].id]
    );
    await client.query('COMMIT');
    res.json({ id: s.id, status: 'aprovada', aluguel_id: rental.rows[0].id });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({ code: 'CONFLICT', message: 'Já existe uma reserva aberta para este veículo' });
    }
    res.status(500).json({ code: 'DB_ERROR', message: 'Erro ao aprovar solicitação' });
  } finally {
    client.release();
  }
});

// Pedido de eliminação limitado à fila de propostas recusadas.
// Dados de contratos já confirmados exigem verificação do prazo de retenção aplicável.
router.delete('/:id/dados', async (req, res) => {
  if (idSchema.validate(req.params.id).error) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Identificador inválido' });
  }
  try {
    const result = await db.query(
      `DELETE FROM aluguel.solicitacoes
       WHERE id = $1 AND status = 'recusada' RETURNING id`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(409).json({
      code: 'RETENTION_REVIEW', message: 'Somente pedidos recusados podem ser excluídos nesta operação'
    });
    res.status(204).send();
  } catch (_) {
    res.status(500).json({ code: 'DB_ERROR', message: 'Erro ao remover solicitação' });
  }
});

module.exports = router;
