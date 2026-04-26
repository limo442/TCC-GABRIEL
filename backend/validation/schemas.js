const Joi = require('joi');

// Common validation patterns
const placaPattern = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/;
const telefonePattern = /^[\d\s\-\(\)]+$/;

// Veiculo schemas
const veiculoInputSchema = Joi.object({
  marca: Joi.string().min(2).max(255).required(),
  modelo: Joi.string().min(2).max(255).required(),
  categoria: Joi.string().min(2).max(255).required(),
  ano_fabricacao: Joi.number().integer().min(1900).max(2100).required(),
  placa: Joi.string().pattern(placaPattern).max(10).required(),
  valor_diaria: Joi.number().min(0.01).required(),
  disponivel: Joi.boolean()
});

const veiculoIdSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

// Usuario schemas
const usuarioInputSchema = Joi.object({
  username: Joi.string().min(3).max(255).required(),
  password: Joi.string().min(6).max(255).required()
});

const usuarioIdSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

// Cliente schemas
const clienteInputSchema = Joi.object({
  cod: Joi.string().min(1).max(50).required(),
  nome: Joi.string().min(3).max(255).required(),
  endereco: Joi.string().max(255).allow('').allow(null),
  telefone: Joi.string().pattern(telefonePattern).allow('').allow(null),
  data_nascimento: Joi.date().iso().allow('').allow(null)
});

const clienteIdSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

// Aluguel schemas
const aluguelInputSchema = Joi.object({
  veiculo_id: Joi.number().integer().positive().required(),
  cliente_id: Joi.number().integer().positive().required(),
  usuario_id: Joi.number().integer().positive().required(),
  data_saida: Joi.date().iso().required(),
  dias_previsto: Joi.number().integer().min(1).required(),
  valor_previsto: Joi.number().min(0.01).required(),
  forma_pagamento: Joi.string().valid('dinheiro', 'pix', 'cartao').default('dinheiro')
});

const aluguelIdSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

const aluguelUpdateSchema = Joi.object({
  veiculo_id: Joi.number().integer().positive(),
  cliente_id: Joi.number().integer().positive(),
  usuario_id: Joi.number().integer().positive(),
  data_saida: Joi.date().iso(),
  data_entrega: Joi.date().iso(),
  dias_previsto: Joi.number().integer().min(1),
  valor_previsto: Joi.number().min(0.01),
  valor_realizado: Joi.number().min(0),
  forma_pagamento: Joi.string().valid('dinheiro', 'pix', 'cartao'),
  status: Joi.string().valid('reservado', 'ativo', 'cancelado', 'concluido')
});

const aluguelStatusSchema = Joi.object({
  status: Joi.string().valid('ativo', 'cancelado').required(),
  usuario_id: Joi.number().integer().positive().required()
});

const aluguelFinalizarSchema = Joi.object({
  data_entrega: Joi.date().iso().required(),
  valor_realizado: Joi.number().min(0).required(),
  forma_pagamento: Joi.string().valid('dinheiro', 'pix', 'cartao').required(),
  usuario_id: Joi.number().integer().positive().required()
});

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(0).default(0),
  pageSize: Joi.number().integer().min(1).max(100).default(10)
});

module.exports = {
  veiculoInputSchema,
  veiculoIdSchema,
  usuarioInputSchema,
  usuarioIdSchema,
  clienteInputSchema,
  clienteIdSchema,
  aluguelInputSchema,
  aluguelIdSchema,
  aluguelUpdateSchema,
  aluguelStatusSchema,
  aluguelFinalizarSchema,
  paginationSchema
};