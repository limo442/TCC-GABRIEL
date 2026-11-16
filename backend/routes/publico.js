const express = require('express');
const Joi = require('joi');
const db = require('../db');
const router = express.Router();

const requestSchema = Joi.object({
  veiculo_id: Joi.number().integer().positive().required(),
  nome: Joi.string().trim().min(3).max(120).required(),
  email: Joi.string().email().max(180).required(),
  telefone: Joi.string().trim().pattern(/^[\d\s()+-]{8,20}$/).allow(''),
  data_saida: Joi.date().iso().required(),
  dias_previsto: Joi.number().integer().min(1).max(90).required(),
  aceite_politica: Joi.boolean().valid(true).required(),
  website: Joi.string().allow('').default('') // campo de armadilha para bots
});

const policy = {
  version: '2026-11-16',
  finalidade: 'Receber solicitações de reserva e permitir retorno da equipe da locadora.',
  dados: ['nome', 'e-mail', 'telefone opcional', 'veículo', 'data de saída', 'quantidade de dias'],
  compartilhamento: 'A integração externa de localidades não recebe dados dos clientes.',
  direitos: 'Solicite informação, correção ou exclusão à locadora responsável pelo tratamento.',
  responsavel: 'Projeto acadêmico de demonstração; para uso real, informar controlador e canal de privacidade.',
  armazenamento: 'A equipe tem acesso restrito aos pedidos. Não use dados pessoais reais durante a demonstração.',
  base: 'Tratamento para providências preliminares a pedido do titular, conforme avaliação do controlador.'
};

// Limitação de envios por origem para impedir abuso simples na instância de demonstração.
// Não substitui proteção de borda em implantação pública.
const attempts = new Map();
function rateLimit(req, res, next) {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const previous = attempts.get(ip) || [];
  const recent = previous.filter(time => now - time < 60 * 60 * 1000);
  if (recent.length >= 5) {
    return res.status(429).json({ code: 'RATE_LIMIT', message: 'Limite de solicitações por hora alcançado' });
  }
  recent.push(now);
  attempts.set(ip, recent);
  if (attempts.size > 1000) attempts.clear();
  next();
}

router.get('/politica-privacidade', (req, res) => res.json(policy));
router.get('/termos-uso', (req, res) => res.json({
  version: policy.version,
  termos: 'Solicitar não confirma uma reserva. A equipe verifica a disponibilidade e poderá aprovar ou recusar o pedido. Valores finais são confirmados no atendimento.',
  demonstracao: 'Plataforma acadêmica; não insira dados reais sem autorização do responsável pela demonstração.'
}));

// Listagem pública com campos limitados: nunca expor placa ou dados de clientes.
router.get('/veiculos', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, marca, modelo, categoria, ano_fabricacao, valor_diaria
       FROM aluguel.veiculos WHERE disponivel = TRUE ORDER BY id ASC LIMIT 100`
    );
    res.json({ items: result.rows });
  } catch (_) {
    res.status(500).json({ code: 'DB_ERROR', message: 'Erro ao consultar veículos' });
  }
});

// O cliente faz apenas uma solicitação, sem alterar disponibilidade ou criar aluguel.
router.post('/solicitacoes', rateLimit, async (req, res) => {
  const { error, value } = requestSchema.validate(req.body || {}, { abortEarly: false });
  if (error) return res.status(400).json({ code: 'VALIDATION_ERROR', message: error.details[0].message });
  if (value.website) return res.status(400).json({ code: 'INVALID_REQUEST', message: 'Solicitação inválida' });

  const date = new Date(value.data_saida);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) return res.status(400).json({ code: 'INVALID_DATE', message: 'Selecione uma data atual ou futura' });

  try {
    const result = await db.query(
      `INSERT INTO aluguel.solicitacoes
       (veiculo_id, nome, email, telefone, data_saida, dias_previsto, aceite_politica_em)
       SELECT id, $2, $3, $4, $5, $6, NOW()
       FROM aluguel.veiculos WHERE id = $1 AND disponivel = TRUE
       RETURNING id, status, created_at`,
      [value.veiculo_id, value.nome, value.email.toLowerCase(), value.telefone || null,
       value.data_saida, value.dias_previsto]
    );
    if (!result.rows.length) return res.status(409).json({
      code: 'VEHICLE_UNAVAILABLE', message: 'Veículo indisponível para solicitação'
    });
    res.status(201).json({
      protocolo: result.rows[0].id,
      status: result.rows[0].status,
      message: 'Solicitação recebida. Aguarde análise pela equipe; a reserva ainda não foi confirmada.'
    });
  } catch (err) {
    res.status(500).json({ code: 'DB_ERROR', message: 'Não foi possível registrar a solicitação' });
  }
});

module.exports = router;
