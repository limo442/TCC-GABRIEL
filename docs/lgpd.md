# Avaliação técnica de proteção de dados pessoais (LGPD)

Sistema de Gerenciamento e Autoatendimento para Aluguel de Veículos — Entrega 5, 16/11/2026.

Este documento registra controles técnicos do protótipo acadêmico. **Não é
certificação de conformidade à LGPD e não substitui avaliação jurídica
do controlador de dados antes de uma implantação real.**

## Inventário simplificado de dados

| Dado | Finalidade | Local | Quem acessa |
| --- | --- | --- | --- |
| Nome e e-mail do solicitante | Receber e analisar pedido de reserva | `aluguel.solicitacoes` | Equipe autenticada |
| Telefone opcional | Contato sobre solicitação | `aluguel.solicitacoes` | Equipe autenticada |
| Veículo desejado, data e duração | Avaliar disponibilidade e estimar valor | `aluguel.solicitacoes` | Equipe autenticada |
| Registro do aceite de privacidade | Demonstrar informação ao usuário | `aceite_politica_em` | Equipe autenticada via banco |
| Cadastro de clientes e aluguéis | Administração do processo de locação | `aluguel.clientes`, `aluguel.alugueis` | Equipe autenticada |
| Nome de usuário, hash de senha e perfil | Controle de acesso | `iam.usuarios` | Serviços de autenticação e administradores |
| Método, rota, código HTTP e data | Auditoria administrativa | `iam.auditoria` | Apenas administradores |

A interface pública consulta veículos sem expor placa ou cadastros de clientes.
O serviço externo de localidades do IBGE não recebe dados de titulares.

## Controles técnicos efetivamente implementados

1. Senhas internas armazenadas com hash bcrypt; autenticação JWT de
   funcionários, expiração e revogação.
2. Controle de acesso administrativo no servidor, incluindo papéis.
3. No autoatendimento, aceite explícito da política antes do envio;
   o pedido fica pendente até avaliação humana.
4. Validação de dados com Joi, tamanho máximo do corpo JSON e limitação
   básica de requisições para o formulário público.
5. Consulta pública minimizada: modelo de veículo, categoria, ano e
   diária, sem placa e sem dados pessoais.
6. Ações relevantes registradas em `iam.auditoria` com método,
   caminho de rota normalizado, código HTTP e data. Não são armazenados
   corpos, senhas, tokens ou endereços IP no registro de auditoria.
7. Operação administrativa de eliminação de solicitações **recusadas**.
   Pedidos convertidos em contratos exigem análise de retenção antes da eliminação.
8. Segredos via arquivos `.env` locais; não publicar credenciais no GitHub.

## Inspeção e execução dos testes

No CI do GitHub Actions foram testados os fluxos de catálogo público,
pedido de reserva, recusa, eliminação de pedido recusado e segregação
de permissões de auditoria. Também foram testados login, logout e papéis.
Esses testes comprovam o comportamento automatizado observado no banco
de testes; não cobrem implantação, backups, criptografia da conexão,
engenharia social ou todos os direitos dos titulares.

## Riscos e atividades obrigatórias antes de uma implantação real

| Tema | Avaliação | Providência operacional |
| --- | --- | --- |
| Identificação do controlador | Pendente | Informar razão social, contato e responsável |
| Base legal e finalidade | Requer validação | Confirmar com o controlador a hipótese aplicável a cada fluxo |
| Direitos do titular | Parcial | Definir canal e prazo para acesso, correção, portabilidade e eliminação |
| Retenção e exclusão | Parcial | Definir e automatizar períodos com aprovação do responsável |
| Segurança em trânsito | Dependente do ambiente | Implantar HTTPS com TLS e proteger credenciais e backups |
| Controle de incidentes | Pendente | Definir resposta, comunicação e responsáveis |
| Hospedagem e operadores | Pendente | Avaliar contratos com infraestrutura e serviços terceiros |
| Gestão de vulnerabilidades | Pendente | Atualizar dependências e avaliar risco periodicamente |
| Produção | Não homologada | Validar autorização de perfis, acesso ao banco e logs de execução |

## Política de Privacidade e Termos

- Texto de orientação na interface: `/politica-privacidade` e `/termos-uso`.
- Endpoints correspondentes: `GET /api/publico/politica-privacidade`
  e `GET /api/publico/termos-uso`.
- Ambos dizem expressamente que é **projeto acadêmico** e que a implantação
  real exige identificação do controlador e informações concretas de contato.
- Para demonstração, usar exclusivamente dados fictícios.

## Referências normativas e técnicas

- BRASIL. Lei nº 13.709, de 14 de agosto de 2018. Lei Geral de Proteção de Dados Pessoais.
- ANPD. Guia orientativo sobre segurança da informação para agentes de tratamento de pequeno porte.
- OWASP Foundation. OWASP API Security Top 10 (2023).

**Conclusão técnica:** há medidas de proteção de dados implementadas e com
evidência de testes automatizados. A conformidade integral à LGPD é
multidimensional, depende do controlador e do ambiente de produção e
não pode ser afirmada apenas por inspeção de código.
