# Checklist de validação — Entrega 4 (09/11/2026)

Documento de rastreabilidade entre a avaliação técnica e o código da branch `entrega0911`.

> **Situação:** correções implementadas e testes automatizados adicionados. Uma execução
> bem-sucedida no PostgreSQL real e evidências de interface devem ser anexadas antes
> de afirmar homologação funcional. Não inventar resultados nem retroagir commits.

## Requisitos do relatório

| Item | Evidência de implementação | Validação |
| --- | --- | --- |
| RF01 Autenticação | `routes/auth.js` e `middleware/auth.js` | Teste login/401 |
| RF02 Consulta de veículos | `routes/veiculos.js` e página Veículos | Conferir listagem/filtros |
| RF03 Cadastro de veículos | `POST /api/veiculos` | Criar registro |
| RF04 Atualização de veículos | `PUT /api/veiculos/:id` | Editar e impedir reativação em locação aberta |
| RF05 Exclusão de veículos | `DELETE /api/veiculos/:id` | Testar vínculo de locação |
| RF06 Gestão de clientes | `routes/clientes.js` e página Clientes | CRUD na interface |
| RF07 Gestão de usuários | `routes/usuarios.js`, página Usuários | CRUD + papéis |
| RF08 Criação de reservas | `POST /api/alugueis` e índice SQL único | Requisições concorrentes |
| RF09 Consulta de aluguéis | `GET /api/alugueis` e `GET /:id` | Conferir histórico |
| RF10 Ciclo de locação | Rotas de status, finalização, exclusão | Reservar → ativar → concluir/cancelar |
| RF11 Logout | `POST /api/auth/logout` com token revogado | Token antigo retorna 401 |
| RF12 Autoatendimento | **Evolução futura** | Não implementado |
| RF13 Dashboard | `routes/dashboard.js` com agregação SQL | Conferir números com mais de 10 registros |

A porcentagem de requisitos homologados só pode ser calculada após a execução dos testes
e conforme o critério de aceitação do orientador. Não declarar 75% como comprovados
baseado apenas em inspeção de código.

## Passos para gerar evidências

1. Fazer backup dos dados existentes e aplicar `backend/migrations/001_locacoes.sql`.
2. Configurar os arquivos `.env` locais e iniciar o Docker Compose.
3. Executar os testes no banco **exclusivo** `aluguel_test` (comandos no README).
4. Guardar a saída do comando `npm test` com data e identificação da branch.
5. Registrar o status dos jobs no GitHub Actions; anexar resultado do build do React.
6. Usar a interface para fazer login como administrador, criar veículo e cliente,
   registrar reserva, ativar, finalizar e conferir a disponibilidade restaurada.
7. Criar mais de 10 veículos e confrontar as métricas do dashboard com consultas SQL:
   `SELECT COUNT(*) FROM aluguel.veiculos;` e
   `SELECT COALESCE(SUM(valor_realizado),0) FROM aluguel.alugueis WHERE status='concluido';`
8. Testar as permissões de operador: listar sem permitir criar, editar ou excluir usuários.
9. Guardar capturas de tela **sem senhas, JWTs ou dados pessoais reais**.
10. Atualizar a monografia com informações verificadas, diagramas e referências ABNT.

## Pendências acadêmicas

- Refinar diagrama BPMN (raias, exceções e responsabilidades).
- Refinar diagrama de classes UML, distinguindo entidades persistidas e operações.
- Aprofundar fundamentação sobre gestão de locadoras e reservas digitais, com fontes científicas.
- Corrigir referências, sumário, paginação, figuras e legendas para o manual ABNT institucional.
- Tratar explicitamente RF12 como não implementado nesta versão, sem alegar autoatendimento completo.
- Associar resultados e capturas aos testes efetivamente executados.

A monografia original precisa ser fornecida para correção textual e de formatação.
