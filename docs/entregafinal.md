# Publicação final — branch `entregafinal`
**TCC:** Sistema de Gerenciamento e Autoatendimento para Aluguel de Veículos
**Instituição:** Universidade de Mogi das Cruzes — Sistemas de Informação
**Autor:** Gabriel Paulosi de Freitas
**Orientador:** Prof. Alessandro Aparecido da Silva Horas
**Data da revisão:** 22/11/2026

## Código publicado no GitHub
- Branch de entrega: [`entregafinal`](https://github.com/limo442/TCC-GABRIEL/tree/entregafinal).
- Código: React, Node.js/Express, PostgreSQL, JWT, Docker Compose.
- Regras e funcionalidades: frota, clientes, usuários, locações, dashboard, portal público, análise de solicitações, auditoria e integração simulada IBGE.
- Testes unitários: `backend/tests/unit.test.js`, cobrindo utilitários de paginação, permissões de acesso e validações Joi.
- Testes de integração: `backend/tests/integration.test.js`.
- Scripts: `npm run test:unit` e `npm run test:coverage` executados a partir de `backend/`.
- CI: `.github/workflows/ci.yml` valida testes e compilação do frontend na branch final.

## Evidência verificável de testes
- [GitHub Actions — Execução nº 45055353103](https://github.com/limo442/TCC-GABRIEL/actions/runs/45055353103) — 22/11/2026 — **sucesso** nos jobs backend e frontend.
- **34 testes aprovados** (17 unitários + 17 de integração), nenhum reprovado.
- **Cobertura de linhas do backend: 57,14%** — meta mínima de 50% atendida.
- Cobertura de ramificações: 56,29%; funções: 39,35%.
- A meta foi configurada no script de testes por `--test-coverage-lines=50`; a aprovação é comprovada no relatório emitido durante o job backend.

## Arquivos para a entrega no chat do projeto
Os arquivos abaixo devem ser publicados no chat indicado pelo professor (o repositório contém apenas a documentação textual de apoio):
1. **Monografia atualizada**, mantendo o arquivo-base da monografia do chat; contém **Apêndice B — Manual do Usuário** e correções alinhadas à implementação atual.
2. **Apresentação do TCC**, em PowerPoint (15 slides), com versão PDF opcional.
3. **Resumo expandido** e os demais documentos solicitados no cronograma, se aplicáveis.

> Esta publicação no GitHub não substitui o envio dos arquivos no chat do projeto, nem altera automaticamente o documento que já está anexado ali. Quem realiza a entrega deve substituir/atualizar o mesmo arquivo da monografia naquele chat, conforme orientação do professor.

## Limites do projeto
O autoatendimento registra **solicitações que exigem aprovação humana**. Não há pagamento eletrônico. Os testes e controles técnicos não constituem homologação para produção nem certificação completa de conformidade com a LGPD. Para dados existentes, efetue backup antes de migrações.
