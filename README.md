# TCC — Sistema de Gerenciamento de Aluguel de Veículos

Aplicação acadêmica com React, Node.js/Express, PostgreSQL, JWT e Docker Compose.

**Branch de revisão:** `entrega0911`. A branch `main` permanece como histórico original.
**Escopo:** cadastro de veículos, clientes e usuários, reservas e ciclo administrativo
de locação, autenticação de funcionários, dashboard agregado e testes de integração.
**Limitação:** RF12 (reserva em autoatendimento público) está planejado para evolução futura,
não implementado nesta versão. O código não deve ser considerado pronto para produção.

## Requisitos

- Docker e Docker Compose (recomendado)
- Git (opcional)
- Node.js 18+ para executar scripts fora do Docker

## Instalação (ambiente novo)

1. Obtenha a branch de revisão:

```bash
git clone --branch entrega0911 https://github.com/limo442/TCC-GABRIEL.git
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
- adiciona a tabela de tokens JWT revogados.

**Atenção:** se existirem reservas abertas duplicadas, a criação do índice único falhará.
Resolva as duplicidades após verificar os dados reais antes de prosseguir.
Usuários antigos chamados `admin` recebem perfil de administrador na migração.
Senhas antigas de demonstração precisam ser substituídas.

## Testes de integração

O arquivo `backend/tests/integration.test.js` contém testes HTTP usando PostgreSQL:
autenticação, papéis, CRUD de usuários, concorrência de reservas, finalização de locação,
dashboard e revogação de tokens. Os testes **apagam e recriam os schemas** no banco
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
| Autoatendimento público | Não implementado | Não implementado |

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

## Endpoint administrativos

- `POST /api/auth/login` — login público
- `POST /api/auth/logout` — revoga o JWT
- `GET, POST, PUT, DELETE /api/veiculos` — cadastro e manutenção
- `GET, POST, PUT, DELETE /api/clientes` — cadastro e manutenção
- `GET, POST /api/usuarios` e `PUT, DELETE /api/usuarios/:id` — operações de gestão
- `GET, POST, PUT, DELETE /api/alugueis` — ciclo de locação
- `PUT /api/alugueis/:id/status` — ativar ou cancelar
- `PUT /api/alugueis/:id/finalizar` — finalizar e devolver o veículo
- `GET /api/dashboard` — indicadores agregados reais do PostgreSQL

As rotas protegidas exigem `Authorization: Bearer <token>`.
Ao finalizar ou cancelar uma locação, a disponibilidade do veículo é restaurada.

## Escopo acadêmico e evidências

A documentação da Entrega 4 deve apresentar o que foi efetivamente testado. Para
verificações reprodutíveis, consulte `docs/validacao-entrega4.md`.
A monografia deve refletir os recursos realmente implementados e preservar RF12
como evolução futura até existir um fluxo público seguro com identificação do cliente.

**Não publique arquivos .env, senhas, tokens ou dados de clientes reais.**
