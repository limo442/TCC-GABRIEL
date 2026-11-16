# TCC — Sistema de Gerenciamento de Aluguel de Veículos

Aplicação acadêmica com React, Node.js/Express, PostgreSQL, JWT e Docker Compose.

**Versão acadêmica — Entrega 5 (16/11/2026):** requisitos funcionais RF01–RF13 implementados no código, incluindo RF12 (consulta pública de veículos, solicitação de reserva e análise da equipe).
**Branches do cronograma:** `entrega2809` e `entrega0911` estão disponíveis; `main` contém o código atual da Entrega 5. As branches foram criadas/revisadas posteriormente e seus nomes não comprovam envio nas datas originais.
**Validação automatizada:** 14 testes de integração aprovados e build React aprovado no [GitHub Actions #81](https://github.com/limo442/TCC-GABRIEL/actions/runs/43906874373) em 16/11/2026.
**Escopo acadêmico:** a solicitação pública só vira reserva após aprovação administrativa. O sistema não processa pagamentos. Testes automatizados não substituem inspeção manual nem certificam conformidade legal integral com a LGPD.

Consulte [matriz da Entrega 5](docs/entrega5.md) e [avaliação de LGPD](docs/lgpd.md). A monografia e o resumo expandido são **documentos separados**, obrigatórios na entrega ao professor.

## Requisitos

- Docker e Docker Compose (recomendado)
- Git (opcional)
- Node.js 18+ para executar scripts fora do Docker

## Instalação (ambiente novo)

1. Clone o repositório. Por padrão, o Git baixa a `main`, a versão que aparece ao abrir o link principal:

```bash
git clone https://github.com/limo442/TCC-GABRIEL.git
cd TCC-GABRIEL
```

2. Copie os três modelos de ambiente. No PowerShell use `Copy-Item` no lugar de `cp`.

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. No arquivo `.env` da **raiz**, substitua `POSTGRES_PASSWORD` por uma senha própria.
   Em `backend/.env`, configure um `JWT_SECRET` aleatório e forte. É possível
   gerar valores aleatórios com:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

   Não copie a saída desse comando para o GitHub. No Docker, a senha do banco
   informada na raiz também é passada ao backend, substituindo `DB_PASSWORD` do arquivo
   `backend/.env`. Para rodar o backend sem Docker, ajuste esse `DB_PASSWORD` manualmente.

4. Suba os serviços:

```bash
docker compose up -d --build
docker compose ps
docker compose logs --tail=60 backend
```

5. Como não há mais senhas públicas de demonstração, crie o administrador inicial:

```bash
docker compose exec -e ADMIN_USERNAME=admin -e ADMIN_PASSWORD="escolha-sua-senha-forte" backend npm run create-admin
```

   Troque `escolha-sua-senha-forte` por sua senha. O script cria o usuário somente
   se ele ainda não existir. Não guarde senhas reais no README ou nos commits.

6. Abra http://localhost:3001 para a interface ou
   http://localhost:8002/api/health para conferir o backend.

## Banco já existente: migração obrigatória

**Antes de atualizar o ambiente existente, faça backup do PostgreSQL.** Nunca execute
`docker compose down -v` em um banco que precisa preservar.

Verifique se a senha do novo `.env` corresponde à senha do PostgreSQL **já inicializado**.
Alterar `POSTGRES_PASSWORD` no Compose não modifica a senha dentro de um volume existente;
se for necessário trocar a senha do usuário PostgreSQL, faça essa operação diretamente no
banco e só depois atualize o arquivo de ambiente.

Aplique a migração uma vez:

```bash
docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U aluguel_user -d aluguel_db < backend/migrations/001_locacoes.sql
```

No Windows PowerShell, o redirecionamento `<` pode ser incompatível. Use:

```powershell
Get-Content -Raw backend/migrations/001_locacoes.sql | docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U aluguel_user -d aluguel_db
```

A migração:
- renomeia `end_date` para `data_entrega`, quando aplicável;
- impede mais de uma reserva/locação aberta para cada veículo;
- adiciona perfis `admin` e `operador`;
- adiciona a tabela de tokens JWT revogados;
- cria a fila de solicitações de autoatendimento e a trilha de auditoria.

**Atenção:** se existirem reservas abertas duplicadas, a criação do índice único falhará.
Resolva as duplicidades após verificar os dados reais antes de prosseguir.
Usuários antigos chamados `admin` recebem perfil de administrador na migração.
Senhas antigas de demonstração precisam ser substituídas.

## Testes de integração

O arquivo `backend/tests/integration.test.js` contém testes HTTP usando PostgreSQL:
autenticação, papéis, CRUD de usuários, concorrência de reservas, finalização de locação,
dashboard, RF12/autoatendimento, privacidade, auditoria, integração simulada com IBGE e revogação de tokens. Os testes **apagam e recriam os schemas** no banco
`aluguel_test`, nunca devem ser executados no banco real.

```bash
docker compose exec postgres psql -U aluguel_user -d postgres -c "CREATE DATABASE aluguel_test;"
docker compose exec -e DB_NAME=aluguel_test backend npm test
```

Se `aluguel_test` já existir, pule a criação. Os testes também estão configurados
em `.github/workflows/ci.yml` para o GitHub Actions, junto da compilação do React.
A existência dos testes no repositório **não equivale a resultados de execução**;
guarde a saída e o status dos jobs como evidências para o TCC.

## Funcionalidades e permissões

| Funcionalidade | Administrador | Operador |
| --- | --- | --- |
| Consultar veículos, clientes, locações e dashboard | Sim | Sim |
| Registrar veículos, clientes e locações | Sim | Sim |
| Consultar usuários | Sim | Sim, para selecionar responsável |
| Criar, alterar e excluir usuários | Sim | Não |
| Consultar solicitações públicas, aprovar e recusar | Sim | Sim |
| Autoatendimento público: catálogo e envio de solicitação | Público, sem login | Público, sem login |

O JWT expira em 8 horas. O logout revoga o token no banco. As rotas administrativas
não aceitam API Keys genéricas. Os usuários são autenticados no banco em cada requisição.

## Estrutura principal

```text
backend/
  app.js
  config.js
  init.sql
  migrations/001_locacoes.sql
  middleware/auth.js
  middleware/roles.js
  routes/
  scripts/create-admin.js
  tests/integration.test.js
frontend/
  src/pages/
  src/services/api.js
.github/workflows/ci.yml
```

## Endpoints da API (rotas administrativas exigem JWT)

- `POST /api/auth/login` — login público
- `POST /api/auth/logout` — revoga o JWT
- `GET, POST, PUT, DELETE /api/veiculos` — cadastro e manutenção
- `GET, POST, PUT, DELETE /api/clientes` — cadastro e manutenção
- `GET, POST /api/usuarios` e `PUT, DELETE /api/usuarios/:id` — operações de gestão
- `GET, POST, PUT, DELETE /api/alugueis` — ciclo de locação
- `PUT /api/alugueis/:id/status` — ativar ou cancelar
- `PUT /api/alugueis/:id/finalizar` — finalizar e devolver o veículo
- `GET /api/dashboard` — indicadores agregados reais do PostgreSQL
- `GET /api/auditoria` — histórico de operações, somente administrador
- `GET /api/solicitacoes`, `PUT /api/solicitacoes/:id/aprovar` e `PUT /api/solicitacoes/:id/recusar` — gestão de pedidos públicos
- `DELETE /api/solicitacoes/:id/dados` — eliminação de pedido recusado por funcionário autenticado
- `GET /api/integracoes/ufs` — localidades do IBGE, somente dados públicos
- **Público, sem JWT:** `GET /api/publico/veiculos`, `POST /api/publico/solicitacoes`, `GET /api/publico/termos-uso`, `GET /api/publico/politica-privacidade`

Páginas públicas no React: `/autoatendimento`, `/termos-uso` e `/politica-privacidade`.
A área administrativa inclui as telas de Solicitações e Auditoria.

As rotas protegidas exigem `Authorization: Bearer <token>`.
Ao finalizar ou cancelar uma locação, a disponibilidade do veículo é restaurada.

## Escopo acadêmico e evidências

A Entrega 4 está preservada em `entrega0911` e seu checklist está em
`docs/validacao-entrega4.md`. A versão de desenvolvimento está em `main`.
Para a Entrega 5, consulte `docs/entrega5.md` e `docs/lgpd.md`.
Os fluxos críticos têm testes de integração no CI, mas a avaliação acadêmica
também exige a monografia final, os diagramas e o resumo expandido, que devem
ser enviados nos locais orientados pelo professor. **Não invente evidências de
operação real ou diga que existe certificação formal de conformidade LGPD.**

**Não publique arquivos .env, senhas, tokens ou dados de clientes reais.**
