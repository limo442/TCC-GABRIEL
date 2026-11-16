const test = require('node:test');
const assert = require('node:assert/strict');
const { before, after } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const bcrypt = require('bcryptjs');
const db = require('../db');
const app = require('../app');

let server;
let baseUrl;
let adminToken;
let operatorToken;
let createdUserId;
let rentalId;

async function api(route, { method = 'GET', token, body, headers = {} } = {}) {
  const response = await fetch(baseUrl + route, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  });
  const raw = await response.text();
  return { status: response.status, data: raw ? JSON.parse(raw) : null };
}

before(async () => {
  if (process.env.DB_NAME !== 'aluguel_test') {
    throw new Error('Testes bloqueados: DB_NAME deve ser aluguel_test para evitar apagar dados reais.');
  }
  await db.query('DROP SCHEMA IF EXISTS aluguel CASCADE; DROP SCHEMA IF EXISTS iam CASCADE');
  await db.query(fs.readFileSync(path.join(__dirname, '..', 'init.sql'), 'utf8'));
  const hash = await bcrypt.hash('TesteForte123!', 10);
  await db.query(
    "INSERT INTO iam.usuarios(username,password,role) VALUES ($1,$3,'admin'), ($2,$3,'operador')",
    ['test_admin', 'test_operador', hash]
  );
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  await db.end();
});

test('health responde sem autenticação', async () => {
  const r = await api('/health');
  assert.equal(r.status, 200);
  assert.equal(r.data.status, 'ok');
});

test('rotas internas não aceitam requisições anônimas nem API Key', async () => {
  assert.equal((await api('/veiculos')).status, 401);
  assert.equal((await api('/usuarios', { headers: { 'X-API-Key': 'dev-api-key-change-in-production' } })).status, 401);
});

test('login e segregação de permissões', async () => {
  const admin = await api('/auth/login', {
    method: 'POST', body: { username: 'test_admin', password: 'TesteForte123!' }
  });
  const operador = await api('/auth/login', {
    method: 'POST', body: { username: 'test_operador', password: 'TesteForte123!' }
  });
  assert.equal(admin.status, 200);
  assert.equal(admin.data.user.role, 'admin');
  assert.equal(operador.status, 200);
  assert.equal(operador.data.user.role, 'operador');
  adminToken = admin.data.token;
  operatorToken = operador.data.token;
  assert.equal((await api('/usuarios', {
    method: 'POST', token: operatorToken,
    body: { username: 'negado', password: 'SenhaForte123!' }
  })).status, 403);
  assert.equal((await api('/usuarios', { token: operatorToken })).status, 200);
});

test('administrador cria, edita e exclui usuários', async () => {
  const create = await api('/usuarios', {
    method: 'POST', token: adminToken,
    body: { username: 'criado_teste', password: 'SenhaForte123!', role: 'operador' }
  });
  assert.equal(create.status, 201);
  assert.equal(create.data.role, 'operador');
  assert.equal('password' in create.data, false);
  createdUserId = create.data.id;

  const editDenied = await api(`/usuarios/${createdUserId}`, {
    method: 'PUT', token: operatorToken, body: { username: 'invalido' }
  });
  assert.equal(editDenied.status, 403);
  const updated = await api(`/usuarios/${createdUserId}`, {
    method: 'PUT', token: adminToken, body: { username: 'editado_teste', role: 'admin' }
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.data.role, 'admin');

  assert.equal((await api(`/usuarios/${createdUserId}`, {
    method: 'DELETE', token: adminToken
  })).status, 204);
  assert.equal((await api('/usuarios/1', { method: 'DELETE', token: adminToken })).status, 409);
  assert.equal((await api('/usuarios/1', {
    method: 'PUT', token: adminToken, body: { role: 'operador' }
  })).status, 409);
});

test('reserva concorrente não duplica veículo', async () => {
  const payload = {
    veiculo_id: 1, cliente_id: 1, usuario_id: 1,
    data_saida: '2026-11-20', dias_previsto: 2,
    valor_previsto: 300, forma_pagamento: 'pix'
  };
  const requests = await Promise.all([
    api('/alugueis', { method: 'POST', token: adminToken, body: payload }),
    api('/alugueis', { method: 'POST', token: adminToken, body: payload })
  ]);
  assert.deepEqual(requests.map(x => x.status).sort(), [201, 400]);
  rentalId = requests.find(x => x.status === 201).data.id;
  const count = await db.query("SELECT COUNT(*)::int AS n FROM aluguel.alugueis WHERE veiculo_id=1 AND status IN ('reservado','ativo')");
  assert.equal(count.rows[0].n, 1);
});

test('integridade da disponibilidade e edição das locações', async () => {
  const veiculo = await api('/veiculos/1', { token: adminToken });
  assert.equal(veiculo.status, 200);
  const attempt = await api('/veiculos/1', {
    method: 'PUT', token: adminToken,
    body: {
      marca: veiculo.data.marca, modelo: veiculo.data.modelo,
      categoria: veiculo.data.categoria,
      ano_fabricacao: veiculo.data.ano_fabricacao,
      placa: veiculo.data.placa,
      valor_diaria: Number(veiculo.data.valor_diaria),
      disponivel: true
    }
  });
  assert.equal(attempt.status, 409);

  const forbidden = await api(`/alugueis/${rentalId}`, {
    method: 'PUT', token: adminToken, body: { veiculo_id: 2 }
  });
  assert.equal(forbidden.status, 400);
});

test('transições de locação e disponibilidade do veículo', async () => {
  const invalid = await api(`/alugueis/${rentalId}/finalizar`, {
    method: 'PUT', token: adminToken,
    body: { data_entrega: '2026-11-22', valor_realizado: 300, forma_pagamento: 'pix', usuario_id: 1 }
  });
  assert.equal(invalid.status, 400);

  const activate = await api(`/alugueis/${rentalId}/status`, {
    method: 'PUT', token: adminToken, body: { status: 'ativo', usuario_id: 1 }
  });
  assert.equal(activate.status, 200);

  const finish = await api(`/alugueis/${rentalId}/finalizar`, {
    method: 'PUT', token: adminToken,
    body: { data_entrega: '2026-11-22', valor_realizado: 320, forma_pagamento: 'pix', usuario_id: 1 }
  });
  assert.equal(finish.status, 200);
  assert.equal(finish.data.status, 'concluido');
  const vehicle = await db.query('SELECT disponivel FROM aluguel.veiculos WHERE id = 1');
  assert.equal(vehicle.rows[0].disponivel, true);
});

test('dashboard conta todo o banco, inclusive mais que dez veículos', async () => {
  for (let n = 0; n < 12; n += 1) {
    await db.query(
      'INSERT INTO aluguel.veiculos (marca, modelo, placa, valor_diaria) VALUES ($1,$2,$3,$4)',
      ['Teste', 'Carro', `TST${String(n).padStart(4, '0')}`, 100]
    );
  }
  const result = await api('/dashboard', { token: adminToken });
  assert.equal(result.status, 200);
  assert.equal(result.data.totalVeiculos, 17);
  assert.equal(result.data.concluidos, 1);
  assert.equal(result.data.receita, 320);
  assert.equal(result.data.recentRentals.length, 1);
});

test('logout revoga o token no servidor', async () => {
  const loggedOut = await api('/auth/logout', { method: 'POST', token: operatorToken });
  assert.equal(loggedOut.status, 200);
  const afterLogout = await api('/veiculos', { token: operatorToken });
  assert.equal(afterLogout.status, 401);
});


test('portal público expõe catálogo mínimo, termos e política de privacidade', async () => {
  const list = await api('/publico/veiculos');
  assert.equal(list.status, 200);
  assert.equal(list.data.items.length > 0, true);
  assert.equal('placa' in list.data.items[0], false);
  assert.equal((await api('/publico/termos-uso')).status, 200);
  assert.equal((await api('/publico/politica-privacidade')).status, 200);
});

test('RF12: solicitação pública, aprovação administrativa e conversão em reserva', async () => {
  const body = {
    veiculo_id: 2, nome: 'Pessoa de Teste', email: 'exemplo@example.com',
    telefone: '', data_saida: '2026-12-03', dias_previsto: 3,
    aceite_politica: true
  };
  const rejected = await api('/publico/solicitacoes', {
    method: 'POST', body: { ...body, aceite_politica: false }
  });
  assert.equal(rejected.status, 400);

  const requested = await api('/publico/solicitacoes', { method: 'POST', body });
  assert.equal(requested.status, 201);
  const id = requested.data.protocolo;
  assert.ok(id);
  const listDenied = await api('/solicitacoes');
  assert.equal(listDenied.status, 401);
  const requests = await api('/solicitacoes', { token: adminToken });
  assert.equal(requests.status, 200);
  assert.equal(requests.data.items.some(item => item.id === id), true);

  const approved = await api(`/solicitacoes/${id}/aprovar`, {
    method: 'PUT', token: adminToken
  });
  assert.equal(approved.status, 200);
  assert.equal(approved.data.status, 'aprovada');
  const vehicle = await db.query('SELECT disponivel FROM aluguel.veiculos WHERE id = 2');
  assert.equal(vehicle.rows[0].disponivel, false);
  assert.equal((await api(`/solicitacoes/${id}/aprovar`, {
    method: 'PUT', token: adminToken
  })).status, 409);
});

test('solicitação recusada pode ter dados eliminados por usuário autenticado', async () => {
  const requested = await api('/publico/solicitacoes', {
    method: 'POST',
    body: { veiculo_id: 3, nome: 'Outra Pessoa de Teste', email: 'teste@example.com',
      data_saida: '2026-12-04', dias_previsto: 1, aceite_politica: true }
  });
  assert.equal(requested.status, 201);
  const id = requested.data.protocolo;
  assert.equal((await api(`/solicitacoes/${id}/recusar`, {
    method: 'PUT', token: adminToken
  })).status, 200);
  assert.equal((await api(`/solicitacoes/${id}/dados`, {
    method: 'DELETE', token: adminToken
  })).status, 204);
  const count = await db.query('SELECT COUNT(*)::int AS n FROM aluguel.solicitacoes WHERE id = $1', [id]);
  assert.equal(count.rows[0].n, 0);
});

test('auditoria exige perfil de administrador', async () => {
  assert.equal((await api('/auditoria', { token: operatorToken })).status, 403);
  assert.equal((await api('/auditoria', { token: adminToken })).status, 200);
});
