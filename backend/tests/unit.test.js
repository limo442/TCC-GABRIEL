// Testes unitários sem banco de dados: utilitários, permissões e validação Joi.
// Executar com: npm run test:unit
const test = require('node:test');
const assert = require('node:assert/strict');
const { paginate, parsePagination } = require('../utils/pagination');
const requireRole = require('../middleware/roles');
const schemas = require('../validation/schemas');

function validVeiculo() {
  return {
    marca: 'Toyota', modelo: 'Corolla', categoria: 'Sedan',
    ano_fabricacao: 2024, placa: 'ABC1D23', valor_diaria: 150
  };
}
function validCliente() {
  return { cod: 'CLI-001', nome: 'Cliente de Teste', telefone: '(11) 99999-9999' };
}
function validAluguel() {
  return {
    veiculo_id: 1, cliente_id: 2, usuario_id: 3,
    data_saida: '2026-12-15', dias_previsto: 3,
    valor_previsto: 450, forma_pagamento: 'pix'
  };
}
function expectInvalid(schema, data) {
  const { error } = schema.validate(data);
  assert.ok(error, 'Era esperado erro de validação');
}
function expectValid(schema, data) {
  const { error, value } = schema.validate(data);
  assert.equal(error, undefined, error?.message);
  return value;
}
function checkRole(user, allowedRoles) {
  let nextCalled = 0;
  let statusCode = null;
  let responseBody = null;
  const req = { user };
  const res = {
    status(code) { statusCode = code; return this; },
    json(value) { responseBody = value; return this; }
  };
  requireRole(...allowedRoles)(req, res, () => { nextCalled++; });
  return { nextCalled, statusCode, responseBody };
}

// Paginação: limites, formatos e comportamento de próxima página.
test('paginate limita itens e indica próxima página corretamente', () => {
  assert.deepEqual(paginate([1, 2, 3], 0, 2), { hasNext: true, items: [1, 2] });
  assert.deepEqual(paginate([1, 2], 0, 2), { hasNext: false, items: [1, 2] });
  assert.deepEqual(paginate([], 1, 5), { hasNext: false, items: [] });
});
test('parsePagination usa valores padrão em consulta vazia', () => {
  assert.deepEqual(parsePagination({}), { pageNum: 0, size: 10 });
});
test('parsePagination aceita paginação válida', () => {
  assert.deepEqual(parsePagination({ page: '2', pageSize: '100' }), { pageNum: 2, size: 100 });
  assert.deepEqual(parsePagination({ page: 0, pageSize: 1 }), { pageNum: 0, size: 1 });
});
test('parsePagination rejeita números negativos, frações, letras e zeros inválidos', () => {
  for (const value of ['-1', '1.5', 'abc', '', '01', ' 2']) {
    assert.equal(parsePagination({ page: value }), null, String(value));
  }
  for (const value of ['0', '-1', '101', 'xyz', '01']) {
    assert.equal(parsePagination({ pageSize: value }), null, String(value));
  }
});
test('parsePagination rejeita overflow e páginas acima do limite', () => {
  assert.equal(parsePagination({ page: '1000001' }), null);
  assert.equal(parsePagination({ page: '9007199254740992' }), null);
  assert.equal(parsePagination({ pageSize: '9007199254740992' }), null);
});

// Autorização: conceder apenas a papéis permitidos.
test('requireRole permite administrador quando autorizado', () => {
  assert.deepEqual(checkRole({ id: 1, role: 'admin' }, ['admin']), {
    nextCalled: 1, statusCode: null, responseBody: null
  });
});
test('requireRole impede operador na função de administração', () => {
  const result = checkRole({ id: 2, role: 'operador' }, ['admin']);
  assert.equal(result.nextCalled, 0);
  assert.equal(result.statusCode, 403);
  assert.equal(result.responseBody.code, 'FORBIDDEN');
});
test('requireRole recusa usuário sem sessão e aceita múltiplos perfis', () => {
  assert.equal(checkRole(undefined, ['admin']).statusCode, 403);
  assert.equal(checkRole({ role: 'operador' }, ['admin', 'operador']).nextCalled, 1);
});

// Joi: entradas válidas e limites das entidades principais.
test('veículo válido aceita placa Mercosul e campos opcionais', () => {
  assert.equal(expectValid(schemas.veiculoInputSchema, validVeiculo()).placa, 'ABC1D23');
  assert.equal(expectValid(schemas.veiculoInputSchema, { ...validVeiculo(), disponivel: false }).disponivel, false);
});
test('veículo rejeita placa inválida, diária negativa, ano e nome insuficientes', () => {
  for (const payload of [
    { ...validVeiculo(), placa: 'ABC-1234' },
    { ...validVeiculo(), valor_diaria: -1 },
    { ...validVeiculo(), valor_diaria: 0 },
    { ...validVeiculo(), ano_fabricacao: 1899 },
    { ...validVeiculo(), marca: 'T' }
  ]) expectInvalid(schemas.veiculoInputSchema, payload);
});
test('cliente exige código e nome; valida telefone e aceita dados opcionais nulos', () => {
  assert.equal(expectValid(schemas.clienteInputSchema, validCliente()).cod, 'CLI-001');
  expectValid(schemas.clienteInputSchema, {
    ...validCliente(), telefone: null, endereco: null, data_nascimento: null
  });
  expectInvalid(schemas.clienteInputSchema, { nome: 'Cliente de Teste' });
  expectInvalid(schemas.clienteInputSchema, { ...validCliente(), telefone: 'abc!' });
  expectInvalid(schemas.clienteInputSchema, { ...validCliente(), nome: 'Jo' });
});
test('usuário exige login e senha mínimos; papel padrão é operador', () => {
  const user = expectValid(schemas.usuarioInputSchema, {
    username: 'operador1', password: 'SenhaForte123'
  });
  assert.equal(user.role, 'operador');
  expectInvalid(schemas.usuarioInputSchema, { username: 'ab', password: '12345678' });
  expectInvalid(schemas.usuarioInputSchema, { username: 'operador1', password: '123' });
  expectInvalid(schemas.usuarioInputSchema, { username: 'operador1', password: '12345678', role: 'root' });
  expectInvalid(schemas.usuarioUpdateSchema, {});
  expectValid(schemas.usuarioUpdateSchema, { role: 'admin' });
});
test('reserva válida aceita PIX e recusa IDs, períodos e valores inválidos', () => {
  expectValid(schemas.aluguelInputSchema, validAluguel());
  for (const data of [
    { ...validAluguel(), veiculo_id: 0 },
    { ...validAluguel(), cliente_id: -1 },
    { ...validAluguel(), dias_previsto: 0 },
    { ...validAluguel(), valor_previsto: 0 },
    { ...validAluguel(), forma_pagamento: 'boleto' },
    { ...validAluguel(), data_saida: 'data-errada' }
  ]) expectInvalid(schemas.aluguelInputSchema, data);
});
test('alterações de status seguem valores aceitos pela API', () => {
  expectValid(schemas.aluguelStatusSchema, { status: 'ativo', usuario_id: 2 });
  expectValid(schemas.aluguelStatusSchema, { status: 'cancelado', usuario_id: 2 });
  expectInvalid(schemas.aluguelStatusSchema, { status: 'concluido', usuario_id: 2 });
  expectInvalid(schemas.aluguelStatusSchema, { status: 'ativo', usuario_id: 0 });
});
test('finalização exige data, valor, pagamento e responsável', () => {
  const complete = {
    data_entrega: '2026-12-20', valor_realizado: 350,
    forma_pagamento: 'cartao', usuario_id: 1
  };
  expectValid(schemas.aluguelFinalizarSchema, complete);
  expectInvalid(schemas.aluguelFinalizarSchema, { ...complete, valor_realizado: -0.01 });
  expectInvalid(schemas.aluguelFinalizarSchema, { ...complete, usuario_id: undefined });
  expectInvalid(schemas.aluguelFinalizarSchema, { ...complete, data_entrega: 'ontem' });
});
test('identificadores das entidades devem ser inteiros positivos', () => {
  for (const schema of [
    schemas.veiculoIdSchema, schemas.clienteIdSchema,
    schemas.usuarioIdSchema, schemas.aluguelIdSchema
  ]) {
    expectValid(schema, { id: 1 });
    expectInvalid(schema, { id: -2 });
    expectInvalid(schema, { id: 0 });
    expectInvalid(schema, { id: 'abc' });
  }
});
test('paginação Joi aceita limites e rejeita intervalo excedido', () => {
  assert.equal(expectValid(schemas.paginationSchema, {}).pageSize, 10);
  expectValid(schemas.paginationSchema, { page: 0, pageSize: 100 });
  expectInvalid(schemas.paginationSchema, { page: -1, pageSize: 10 });
  expectInvalid(schemas.paginationSchema, { page: 0, pageSize: 101 });
});
