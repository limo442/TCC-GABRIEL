# Entrega 5 — Sistema concluído e documentação técnica (16/11/2026)

**Repositório:** https://github.com/limo442/TCC-GABRIEL

**Código da Entrega 5:** branch principal `main`, após a integração da revisão.
**Histórico da Entrega 4:** branch `entrega0911`, mantida conforme o cronograma.
**Responsável pela verificação acadêmica:** orientador do TCC.

## 1. Checklist do desenvolvimento

| Requisito funcional | Local de implementação | Situação técnica |
| --- | --- | --- |
| RF01 — Login e autenticação interna | `backend/routes/auth.js`, `middleware/auth.js`, `frontend/src/pages/Login.jsx` | Implementado; teste HTTP |
| RF02 — Consultar veículos | `backend/routes/veiculos.js`, `frontend/src/pages/Veiculos.jsx` | Implementado |
| RF03 — Cadastrar veículos | `POST /api/veiculos` e interface | Implementado |
| RF04 — Atualizar veículos | `PUT /api/veiculos/:id` | Implementado; bloqueio de disponibilidade incoerente testado |
| RF05 — Excluir veículos | `DELETE /api/veiculos/:id` | Implementado; vínculos limitam exclusões |
| RF06 — Gestão de clientes | `backend/routes/clientes.js`, `frontend/src/pages/Clientes.jsx` | Implementado |
| RF07 — Gestão de usuários | `backend/routes/usuarios.js`, `frontend/src/pages/Usuarios.jsx` | Implementado; papéis e CRUD testados |
| RF08 — Criar reservas | `POST /api/alugueis` e índice SQL parcial | Implementado; concorrência testada |
| RF09 — Consultar aluguéis | `GET /api/alugueis` e `GET /api/alugueis/:id` | Implementado |
| RF10 — Gerenciar ciclo de locação | Rotas `/status`, `/finalizar` e `PUT/DELETE` | Implementado; transições testadas |
| RF11 — Encerrar sessão e excluir aluguel | `POST /api/auth/logout` e `DELETE /api/alugueis/:id` | Implementado; revogação de sessão testada |
| RF12 — Autoatendimento do cliente | `frontend/src/pages/Autoatendimento.jsx`, `backend/routes/publico.js`, `backend/routes/solicitacoes.js` | Implementado como **solicitação de reserva sujeita à aprovação**, testado |
| RF13 — Dashboard | `backend/routes/dashboard.js` e `frontend/src/pages/Dashboard.jsx` | Implementado; agregação SQL testada |

**Nota sobre RF12:** solicitação pública não equivale a reserva automaticamente confirmada nem a pagamento digital. A equipe deve aprovar o pedido, processo que cria o registro de aluguel em transação PostgreSQL.

## 2. Correções gerais

- Autenticação JWT verificada contra usuário e revogação no PostgreSQL.
- Permissões por papel: administradores gerenciam usuários e consultam auditoria.
- Reserva de veículo com bloqueio de linha (`FOR UPDATE`) e unicidade para locações abertas.
- Transições de status protegidas por transações e verificação da disponibilidade.
- Totais do dashboard obtidos por agregações no banco, não por listagens paginadas.
- Variáveis e segredos fora do versionamento via `.env`; CORS configurável.
- Migração para bases antigas em `backend/migrations/001_locacoes.sql`.

## 3. Integração externa

`GET /api/integracoes/ufs` consulta a API pública de Localidades do IBGE.
Somente informações públicas de estados são consultadas. Os dados de clientes
não são enviados ao IBGE. O teste de integração usa servidor HTTP simulado,
sem dependência de conectividade externa; execução contra o serviço oficial
precisa ser comprovada separadamente em uma demonstração conectada.

## 4. Verificação da LGPD

Foram incluídos: Política de Privacidade, Termos de Uso, aceitação obrigatória
no formulário, restrição de acesso por JWT, autorização baseada em perfis,
minimização da consulta pública, auditoria sem corpo de requisição,
rejeição de requisições abusivas e rotina de exclusão de pedidos recusados.

Para a **validação completa da aplicação da LGPD em um uso real**, ainda
é necessário definir o controlador, sua base legal conforme a finalidade,
os contatos oficiais para direitos dos titulares, prazos de retenção,
controles de backup e segurança, além de verificar a implementação no
ambiente de operação. Veja `docs/lgpd.md`. Este documento não declara
certificação jurídica de conformidade.

## 5. Evidências automatizadas

- [GitHub Actions #84](https://github.com/limo442/TCC-GABRIEL/actions/runs/43913867138): **17 testes de integração aprovados** e build React aprovado (16/11/2026).
- Fluxos cobertos: autenticação, permissões, CRUD de usuários,
  concorrência de reservas, ciclo de locação, totalização do dashboard,
  logout, catálogo público, pedido e aprovação, exclusão de dados,
  acesso à auditoria e integração com localidades.
- Comandos para executar localmente: consultar `README.md`.
- Testes usam banco descartável `aluguel_test`. **Nunca execute os testes no banco de produção**.

## 6. Entregáveis documentais exigidos pelo cronograma

| Documento | Condição |
| --- | --- |
| Monografia final (introdução, desenvolvimento, diagramas, conclusão e referências) | Atualizar o **mesmo arquivo** do projeto no chat oficial de orientação |
| Resumo expandido | Arquivo novo, seguindo o modelo do chat de orientações gerais |
| Este repositório | Código, migração, matriz de requisitos e evidências de testes |

**Os arquivos acadêmicos não são substituídos pelo README nem por este checklist.**
O orientador determina os critérios e a aceitação da entrega.

## 7. Demonstração recomendada

1. Configurar `.env`, iniciar Docker e criar administrador inicial.
2. Abrir o catálogo público, selecionar veículo e enviar solicitação fictícia.
3. Entrar com conta administrativa, localizar pedido e aprovar.
4. Conferir locação reservada e veículo indisponível.
5. Ativar e finalizar locação; conferir veículo disponível e dashboard atualizado.
6. Consultar auditoria e demonstrar bloqueio das permissões de operador.
7. Apresentar os resultados do GitHub Actions, sem expor senhas ou tokens.

**A apresentação manual e a instalação em ambiente preexistente não são
comprovadas pelo CI.** Backup e migração são necessários ao atualizar bases existentes.
