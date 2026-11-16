const express = require('express');
const router = express.Router();
const db = require('../db');
const { paginate, parsePagination } = require('../utils/pagination');
const { 
  aluguelInputSchema, 
  aluguelIdSchema, 
  aluguelUpdateSchema,
  aluguelStatusSchema,
  aluguelFinalizarSchema
} = require('../validation/schemas');

// Allowed status transitions
const STATUS_TRANSITIONS = {
  reservado: ['ativo', 'cancelado'],
  ativo: ['cancelado', 'concluido'],
  cancelado: [],
  concluido: [],
};

// GET /api/alugueis
router.get('/', async (req, res) => {
  try {
    const { status, cliente_id, veiculo_id, page = 0, pageSize = 10 } = req.query;
    const paging = parsePagination(req.query);
    if (!paging) return res.status(400).json({
      code: 'VALIDATION_ERROR', message: 'Paginação inválida'
    });
    const { pageNum, size } = paging;
    
    let query = `
      SELECT a.*, 
        v.marca, v.modelo, v.placa, v.categoria,
        c.nome as cliente_nome, c.cod as cliente_cod,
        u.username as usuario_nome
      FROM aluguel.alugueis a
      JOIN aluguel.veiculos v ON a.veiculo_id = v.id
      JOIN aluguel.clientes c ON a.cliente_id = c.id
      JOIN iam.usuarios u ON a.usuario_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND a.status = $${params.length}`;
    }
    if (cliente_id) {
      params.push(cliente_id);
      query += ` AND a.cliente_id = $${params.length}`;
    }
    if (veiculo_id) {
      params.push(veiculo_id);
      query += ` AND a.veiculo_id = $${params.length}`;
    }

    query += ' ORDER BY a.id DESC';
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(size + 1); // pageSize+1 for hasNext calculation
    params.push(pageNum * size);

    const result = await db.query(query, params);
    const paginated = paginate(result.rows, pageNum, size);
    res.json(paginated);
  } catch (err) {
    res.status(500).json({ code: 'DB_ERROR', type: 'INTERNAL_SERVER_ERROR', message: 'Erro ao listar aluguéis', detailedMessage: 'Consulte o administrador do sistema' });
  }
});

// GET /api/alugueis/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT a.*, 
        v.marca, v.modelo, v.placa, v.categoria, v.valor_diaria,
        c.nome as cliente_nome, c.cod as cliente_cod, c.telefone as cliente_telefone,
        u.username as usuario_nome
      FROM aluguel.alugueis a
      JOIN aluguel.veiculos v ON a.veiculo_id = v.id
      JOIN aluguel.clientes c ON a.cliente_id = c.id
      JOIN iam.usuarios u ON a.usuario_id = u.id
      WHERE a.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ code: 'RENTAL_NOT_FOUND', type: 'NOT_FOUND', message: 'Aluguel não encontrado', detailedMessage: `Aluguel com id ${req.params.id} não existe` });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ code: 'DB_ERROR', type: 'INTERNAL_SERVER_ERROR', message: 'Erro ao buscar aluguel', detailedMessage: 'Consulte o administrador do sistema' });
  }
});

// POST /api/alugueis
router.post('/', async (req, res) => {
  const client = await db.connect();
  try {
    // Validate input using Joi
    const { error, value } = aluguelInputSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        code: 'VALIDATION_ERROR', 
        type: 'BAD_REQUEST', 
        message: 'Dados inválidos', 
        detailedMessage: error.details[0].message 
      });
    }

    const { veiculo_id, cliente_id, usuario_id, data_saida, dias_previsto, valor_previsto, forma_pagamento } = value;

    await client.query('BEGIN');

    // Check vehicle availability
    const veiculo = await client.query('SELECT * FROM aluguel.veiculos WHERE id = $1 FOR UPDATE', [veiculo_id]);
    if (veiculo.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ code: 'VEHICLE_NOT_FOUND', type: 'NOT_FOUND', message: 'Veículo não encontrado', detailedMessage: '' });
    }
    if (!veiculo.rows[0].disponivel) {
      await client.query('ROLLBACK');
      return res.status(400).json({ code: 'VEHICLE_UNAVAILABLE', type: 'BAD_REQUEST', message: 'Veículo não está disponível', detailedMessage: 'O veículo selecionado não está disponível para aluguel' });
    }

    // Mark vehicle as unavailable
    await client.query('UPDATE aluguel.veiculos SET disponivel=FALSE, updated_at=NOW() WHERE id=$1', [veiculo_id]);

    // Create rental
    const result = await client.query(
      'INSERT INTO aluguel.alugueis (veiculo_id, cliente_id, usuario_id, data_saida, dias_previsto, valor_previsto, forma_pagamento, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [veiculo_id, cliente_id, usuario_id, data_saida, dias_previsto, valor_previsto, forma_pagamento, 'reservado']
    );

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') return res.status(409).json({ code: 'VEHICLE_UNAVAILABLE', message: 'Veículo já reservado' });
    if (err.code === '23503') return res.status(400).json({ code: 'INVALID_REFERENCE', message: 'Cliente ou usuário inválido' });
    res.status(500).json({ code: 'DB_ERROR', type: 'INTERNAL_SERVER_ERROR', message: 'Erro ao criar aluguel' });
  } finally {
    client.release();
  }
});

// PUT /api/alugueis/:id
// Somente campos administrativos: veículo e status exigem regras transacionais próprias.
router.put('/:id', async (req, res) => {
  const { error: idError } = aluguelIdSchema.validate(req.params);
  const { error, value } = aluguelUpdateSchema.validate(req.body);
  if (idError || error) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR', message: (idError || error).details[0].message
    });
  }

  const blocked = ['veiculo_id', 'status', 'data_entrega', 'valor_realizado'];
  if (blocked.some(key => Object.prototype.hasOwnProperty.call(value, key))) {
    return res.status(400).json({
      code: 'OPERACAO_NAO_PERMITIDA',
      message: 'Veículo, status e finalização devem ser alterados nas operações específicas'
    });
  }

  const editable = ['cliente_id', 'usuario_id', 'data_saida', 'dias_previsto', 'valor_previsto', 'forma_pagamento'];
  const fields = editable.filter(key => Object.prototype.hasOwnProperty.call(value, key));
  if (fields.length === 0) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Informe ao menos um campo editável' });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const current = await client.query(
      'SELECT id, status FROM aluguel.alugueis WHERE id = $1 FOR UPDATE', [req.params.id]
    );
    if (!current.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ code: 'RENTAL_NOT_FOUND', message: 'Aluguel não encontrado' });
    }
    if (current.rows[0].status !== 'reservado') {
      await client.query('ROLLBACK');
      return res.status(409).json({
        code: 'RENTAL_LOCKED', message: 'Somente reservas pendentes podem ser editadas'
      });
    }
    const assignments = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');
    const params = [...fields.map(field => value[field]), req.params.id];
    const result = await client.query(
      `UPDATE aluguel.alugueis SET ${assignments}, updated_at = NOW()
       WHERE id = $${params.length} RETURNING *`, params
    );
    await client.query('COMMIT');
    return res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23503') {
      return res.status(400).json({ code: 'INVALID_REFERENCE', message: 'Cliente ou usuário inválido' });
    }
    return res.status(500).json({ code: 'DB_ERROR', message: 'Erro ao atualizar aluguel' });
  } finally {
    client.release();
  }
});

// DELETE /api/alugueis/:id
router.delete('/:id', async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query('SELECT * FROM aluguel.alugueis WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (existing.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ code: 'RENTAL_NOT_FOUND', type: 'NOT_FOUND', message: 'Aluguel não encontrado', detailedMessage: '' }); }

    // Restore vehicle availability if rental was active
    const rental = existing.rows[0];
    if (['reservado', 'ativo'].includes(rental.status)) {
      await client.query('UPDATE aluguel.veiculos SET disponivel=TRUE, updated_at=NOW() WHERE id=$1', [rental.veiculo_id]);
    }
    await client.query('DELETE FROM aluguel.alugueis WHERE id = $1', [req.params.id]);
    await client.query('COMMIT');
    res.status(204).send();
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ code: 'DB_ERROR', type: 'INTERNAL_SERVER_ERROR', message: 'Erro ao excluir aluguel', detailedMessage: 'Consulte o administrador do sistema' });
  } finally {
    client.release();
  }
});

// PUT /api/alugueis/:id/status
router.put('/:id/status', async (req, res) => {
  const client = await db.connect();
  try {
    // Validate input using Joi
    const { error, value } = aluguelStatusSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        code: 'VALIDATION_ERROR', 
        type: 'BAD_REQUEST', 
        message: 'Dados inválidos', 
        detailedMessage: error.details[0].message 
      });
    }

    const { status, usuario_id } = value;
    const { id } = req.params;
    
    // Validate ID
    const { error: idError } = aluguelIdSchema.validate({ id });
    if (idError) {
      return res.status(400).json({ 
        code: 'VALIDATION_ERROR', 
        type: 'BAD_REQUEST', 
        message: 'ID inválido', 
        detailedMessage: idError.details[0].message 
      });
    }

    await client.query('BEGIN');
    const existing = await client.query('SELECT * FROM aluguel.alugueis WHERE id = $1 FOR UPDATE', [id]);
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ code: 'RENTAL_NOT_FOUND', type: 'NOT_FOUND', message: 'Aluguel não encontrado', detailedMessage: '' });
    }

    const rental = existing.rows[0];
    const allowed = STATUS_TRANSITIONS[rental.status] || [];
    if (!allowed.includes(status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ code: 'INVALID_TRANSITION', type: 'BAD_REQUEST', message: 'Transição de status não permitida', detailedMessage: `Não é possível mudar de \"${rental.status}\" para \"${status}\"` });
    }

    // If canceling, restore vehicle availability
    if (status === 'cancelado') {
      await client.query('UPDATE aluguel.veiculos SET disponivel=TRUE, updated_at=NOW() WHERE id=$1', [rental.veiculo_id]);
    }

    const result = await client.query(
      'UPDATE aluguel.alugueis SET status=$1, usuario_id=$2, updated_at=NOW() WHERE id=$3 RETURNING *',
      [status, req.user.id, id]
    );

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ code: 'DB_ERROR', type: 'INTERNAL_SERVER_ERROR', message: 'Erro ao atualizar status', detailedMessage: 'Consulte o administrador do sistema' });
  } finally {
    client.release();
  }
});

// PUT /api/alugueis/:id/finalizar
router.put('/:id/finalizar', async (req, res) => {
  const client = await db.connect();
  try {
    // Validate input using Joi
    const { error, value } = aluguelFinalizarSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        code: 'VALIDATION_ERROR', 
        type: 'BAD_REQUEST', 
        message: 'Dados inválidos', 
        detailedMessage: error.details[0].message 
      });
    }

    const { data_entrega, valor_realizado, forma_pagamento, usuario_id } = value;
    const { id } = req.params;
    
    // Validate ID
    const { error: idError } = aluguelIdSchema.validate({ id });
    if (idError) {
      return res.status(400).json({ 
        code: 'VALIDATION_ERROR', 
        type: 'BAD_REQUEST', 
        message: 'ID inválido', 
        detailedMessage: idError.details[0].message 
      });
    }

    await client.query('BEGIN');
    const existing = await client.query('SELECT * FROM aluguel.alugueis WHERE id = $1 FOR UPDATE', [id]);
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ code: 'RENTAL_NOT_FOUND', type: 'NOT_FOUND', message: 'Aluguel não encontrado', detailedMessage: '' });
    }

    const rental = existing.rows[0];
    if (rental.status !== 'ativo') {
      await client.query('ROLLBACK');
      return res.status(400).json({ code: 'INVALID_STATUS', type: 'BAD_REQUEST', message: 'Apenas aluguéis ativos podem ser finalizados', detailedMessage: `Status atual: ${rental.status}` });
    }

    // Restore vehicle availability
    await client.query('UPDATE aluguel.veiculos SET disponivel=TRUE, updated_at=NOW() WHERE id=$1', [rental.veiculo_id]);

    const result = await client.query(
      `UPDATE aluguel.alugueis SET status='concluido', data_entrega=$1, valor_realizado=$2, forma_pagamento=$3, usuario_id=$4, updated_at=NOW()
       WHERE id=$5 RETURNING *`,
      [data_entrega, valor_realizado, forma_pagamento, req.user.id, id]
    );

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ code: 'DB_ERROR', type: 'INTERNAL_SERVER_ERROR', message: 'Erro ao finalizar aluguel', detailedMessage: 'Consulte o administrador do sistema' });
  } finally {
    client.release();
  }
});

module.exports = router;
