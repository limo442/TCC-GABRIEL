# Manual do usuário — AutoLocadora
**Apêndice B da monografia | TCC UMC 2026 | versão de referência: 22/11/2026**

Este guia descreve as funcionalidades presentes na aplicação acadêmica. O manual completo, formatado como **Apêndice B**, acompanha a monografia a ser publicada no chat do projeto. Não se trata de sistema homologado para operação comercial.

## Perfis e endereço
- **Público (sem login):** catálogo de veículos, Política de Privacidade, Termos de Uso e solicitação de reserva.
- **Operador:** cadastro/consulta de veículos e clientes, gestão de locações, solicitações e dashboard.
- **Administrador:** todas as operações do operador e gerenciamento de usuários e consulta à auditoria.
- Interface local: `http://localhost:3001`. API de verificação: `http://localhost:8002/api/health`.

## Inicialização em ambiente novo
1. Copie `.env.example` para `.env` na raiz, em `backend/` e em `frontend/`.
2. Configure `POSTGRES_PASSWORD` e `JWT_SECRET` de forma segura, sem versionar arquivos `.env`.
3. Execute `docker compose up -d --build`, confirme com `docker compose ps`.
4. Crie a primeira conta de administrador, usando sua própria senha forte:
   ```bash
   docker compose exec -e ADMIN_USERNAME=admin -e ADMIN_PASSWORD="SUA_SENHA_FORTE" backend npm run create-admin
   ```
5. Abra `http://localhost:3001/login` para gestão ou `http://localhost:3001/autoatendimento` para o portal público.

> Banco existente: antes de aplicar `backend/migrations/001_locacoes.sql`, efetue backup e leia o README. Nunca execute `docker compose down -v` para um banco cujos dados devam ser preservados.

## Rotinas da equipe
1. **Login:** use conta autorizada e acesse o painel lateral; use **Sair** para revogar a sessão.
2. **Veículos:** abra **Veículos → Novo Veículo**, informe marca, modelo, categoria, ano, placa e diária; salve. Pesquise, edite ou exclua quando não houver vínculo impeditivo.
3. **Clientes:** abra **Clientes → Novo Cliente**, preencha código e nome, além dos dados opcionais; depois salve, edite ou exclua quando permitido.
4. **Aluguéis:** selecione **Nova Reserva**, veículo, cliente e responsável; informe data, dias e pagamento. O valor previsto é calculado a partir da diária; a API confirma disponibilidade antes de registrar.
5. **Estados:** use as operações disponíveis para ativar ou cancelar uma locação. Para finalizar, registre data de entrega, valor realizado, forma de pagamento e responsável. O veículo volta a ficar disponível conforme a regra.
6. **Usuários:** administradores podem criar, editar e excluir contas, definindo papel `admin` ou `operador`.
7. **Auditoria:** administradores consultam método, rota padronizada, código HTTP e usuário dos eventos registrados.
8. **Dashboard:** o painel apresenta indicadores consolidados com base nas consultas ao PostgreSQL.

## Fluxo do cliente: autoatendimento supervisionado
1. Acesse `/autoatendimento` e escolha um veículo disponível.
2. Informe nome, e-mail, telefone opcional, data de saída e duração; leia a política e aceite os termos requeridos.
3. Envie e guarde o protocolo: **o pedido ainda não é uma reserva confirmada**.
4. Um funcionário abre **Solicitações**, analisa a pendência e escolhe **Aprovar e criar reserva** ou **Recusar**.
5. A aprovação cria a locação somente se as regras de disponibilidade forem atendidas. Um pedido recusado pode ter seus dados eliminados pela equipe, dentro das regras aplicáveis.
6. **Não há pagamento eletrônico** ou contrato automático no protótipo.

## Solução de problemas
- **Erro 401 / 403:** reveja token, sessão ou permissões do perfil.
- **Formulário recusado:** confira campos obrigatórios, formato de placa, valores positivos e identificadores.
- **Reserva indisponível:** verifique se há outra locação aberta para o veículo.
- **Serviço indisponível:** confira `docker compose ps`, os logs e `/api/health`.
- **Dados de teste:** use somente cadastros fictícios no ambiente acadêmico.

## Testes e evidência da entrega final
```bash
cd backend
npm run test:unit
npm run test:coverage
```
Os testes de integração exigem **DB_NAME=aluguel_test**, pois recriam os esquemas desse banco. Não utilize um banco real. No GitHub Actions de 22/11/2026, foram aprovados **34 testes**, com **57,14% de cobertura de linhas** do backend, conforme [execução nº 45055353103](https://github.com/limo442/TCC-GABRIEL/actions/runs/45055353103). A cobertura de funções foi de 39,35%, distinta da meta de linhas. Testes automatizados não equivalem a homologação em produção.
