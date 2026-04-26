1. Backend (NodeJS)
2. Frontend (ReactJs + VITE)
3. Documentação tecnica

Tema: App de Aluguel de Carro
1. Cadastramento de Veiculos (marca, modelo, categoria, ano_fabricadao, placa, valor)
2. Cadastramento de Usuarios (username, password)
3. Cadastramento de Clientes (cod, nome, endereço, telefone, data_nascimento)
4. Aluguel (veiculo_id, cliente_id, usuario_id, data_saida, data_entrega, data_reserva, dias_previsto, valor_previsto, valor_realizado, forma_pagamento (dinheiro, pix, cartao)), status (reservado, ativo, cancelado, concluido)


Fluxo de Negocio
- Cliente Entra no APP
  - Pesquisa um carro (categoria, modelo, marca)
  - Informa as datas de previsão (dias_previsto)
  - Apresenta listagem de todos os carros da categoria|modelo|marca com o preço calculado
- Cliente escolhe o carro e reseva o carro.
  - Sistema cria um registro de Aluguel com as data de saida e o dias previstos + valor previsto.
- Cliente busca o carro e o usuario do sistema atualiza o status da reverva no Aluguel.
- Cliente cancelou o aluguel, e o usuario do sistema precisa alterar o status para cancelado
- Cliente devolveu o carro, o usuario finaliza a locação e calcula o valor_realizado e gera cobrança ou reembolso.


API (backend)

CRUD - Veiculos /api/v1/veiculos
CRUD - Clientes /api/v1/clientes
CRUD - Usuarios /api/v1/users
CRUD - Aluguel + FormaPagamento /api/v1/locacao


Prompt Para Execução do Projeto.

Você é um especialista em desenvolvimento backend e frontend NodeJs e ReactJS. Vamos desenvolver um projeto backend em nodejs (javascrip puro) e um frontend ReactJS usando MaterialUI para um sistema simples de aluguel de carros para execução local com as seguintes features:

1. Cadastramento de Veiculos (marca, modelo, categoria, ano_fabricadao, placa, valor)
2. Cadastramento de Usuarios (username, password)
3. Cadastramento de Clientes (cod, nome, endereço, telefone, data_nascimento)
4. Aluguel (veiculo_id, cliente_id, usuario_id, data_saida, data_entrega, data_reserva, dias_previsto, valor_previsto, valor_realizado, forma_pagamento (dinheiro, pix, cartao)), status (reservado, ativo, cancelado, concluido)

Precisamos de:
- Criar a estrutura de dados no formato DBML para modelarmos e apresentarmos de forma simples
- Criar o diagrama de Contexto (C4) e o diagrama de Sequencia de dados baseado no seguinte fluxo:
	Fluxo de Negocio
	- Cliente Entra no APP
	  - Pesquisa um carro (categoria, modelo, marca)
	  - Informa as datas de previsão (dias_previsto)
	  - Apresenta listagem de todos os carros da categoria|modelo|marca com o preço calculado
	- Cliente escolhe o carro e reseva o carro.
	  - Sistema cria um registro de Aluguel com as data de saida e o dias previstos + valor previsto.
	- Cliente busca o carro e o usuario do sistema atualiza o status da reverva no Aluguel.
	- Cliente cancelou o aluguel, e o usuario do sistema precisa alterar o status para cancelado
	- Cliente devolveu o carro, o usuario finaliza a locação e calcula o valor_realizado e gera cobrança ou reembolso.
- Criar a documentação OPENAPI.YAML das rotas do BACKEND (NodeJS v24.15.0) contendo as regras de validação de todas as rotas

###################################################

Prompt para criação do backend API (nodejs)

## 1. Missão deste documento

Este arquivo é o **ponto de entrada único** o agente de IA que trabalhe no projeto **Aluguel de Carros**. Ele define hierarquia de verdade, contexto mínimo obrigatório por fase, restrições de arquitetura e critérios de aceite para geração de artefatos.

**Regra de ouro:** em qualquer conflito entre artefatos, a precedência é:

`spec/openapi.yaml`

> ⛔ Endpoint não existe no `openapi.yaml`? **Recuse e informe.** Não gere.
> ⛔ Tabela não existe no `schema.dbml`? **Recuse e informe.** Não crie migration.


## 2. Fluxo de dados

### 2.1. Contexto do Projeto (Diagrama C4)

######################## COLAR AQUI O DIAGRAMA C4 ######################## 

### 2.2. Diagrama de Sequencia dos dados

######################## COLAR AQUI O DIAGRAMA SEQUENCIA ######################## 

## 3. Diagrama de Dados (DBML)

######################## COLAR AQUI O DIAGRAMA SEQUENCIA ######################## 

## 4. Checklist DoD (Definition of Done)

Antes de considerar qualquer feature pronta, verifique:

- [ ] Endpoint existe no `openapi.yaml` com exatamente esses campos
- [ ] Tabela existe no `schema.json` com tipo e schema prefix corretos
- [ ] Testes: tabela de casos + happy path + todos os erros do `openapi.yaml`
- [ ] Migration com schema prefix e índices canônicos


############################

RESULT:

## 1. Estrutura de Dados em DBML
Aqui está a estrutura de dados em DBML para o seu sistema de aluguel de carros:

```dbml
Project "Sistema de Aluguel de Carros" {
  database_type: 'PostgreSQL'
  Note: 'Modelagem de dados para o sistema de aluguel de carros.'
}

Table Veiculos {
  id int [pk, increment]
  marca varchar(255) [not null]
  modelo varchar(255) [not null]
  categoria varchar(255) [not null]
  ano_fabricacao int [not null]
  placa varchar(10) [unique, not null]
  valor_diaria decimal(10, 2) [not null]
  disponivel boolean [default: true]
  created_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]

  Note: 'Armazena informações sobre os veículos disponíveis para aluguel.'
}

Table Usuarios {
  id int [pk, increment]
  username varchar(255) [unique, not null]
  password varchar(255) [not null]
  created_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]

  Note: 'Armazena informações dos usuários do sistema (funcionários).'
}

Table Clientes {
  id int [pk, increment]
  cod varchar(50) [unique, not null]
  nome varchar(255) [not null]
  endereco varchar(255)
  telefone varchar(20)
  data_nascimento date
  created_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]

  Note: 'Armazena informações dos clientes que alugam os veículos.'
}

Table Alugueis {
  id int [pk, increment]
  veiculo_id int [not null]
  cliente_id int [not null]
  usuario_id int [not null] // Usuário que registrou/atualizou o aluguel
  data_saida date [not null]
  data_entrega date
  data_reserva date [not null, default: `now()`]
  dias_previsto int [not null]
  valor_previsto decimal(10, 2) [not null]
  valor_realizado decimal(10, 2)
  forma_pagamento varchar(50) [not null, default: 'dinheiro'] // dinheiro, pix, cartao
  status varchar(50) [not null, default: 'reservado'] // reservado, ativo, cancelado, concluido
  created_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]

  Note: 'Registra os aluguéis de veículos.'
}

Ref: Alugueis.veiculo_id > Veiculos.id
Ref: Alugueis.cliente_id > Clientes.id
Ref: Alugueis.usuario_id > Usuarios.id
```

Explicação da Modelagem:

Veiculos: Contém os detalhes de cada carro. Adicionado valor_diaria para calcular o preço do aluguel e disponivel para controlar a disponibilidade.
Usuarios: Para os funcionários que interagem com o sistema.
Clientes: Informações dos clientes.
Alugueis: Tabela central que liga veículos, clientes e usuários. Inclui campos para datas, valores (previsto e realizado), forma de pagamento e o status do aluguel, que é crucial para o fluxo de negócio.

## 2. Diagramas C4 e de Sequência
Diagrama de Contexto (C4 - Nível 1)
Este diagrama mostra o sistema de aluguel de carros e como ele interage com os usuários e outros sistemas externos.

```mermaid
title Diagrama de Contexto para o Sistema de Aluguel de Carros

Person(cliente, "Cliente", "Pessoa que aluga veículos.")
Person(usuario_sistema, "Usuário do Sistema", "Funcionário que gerencia aluguéis e veículos.")

System(sistema_aluguel, "Sistema de Aluguel de Carros", "Permite o gerenciamento de veículos, clientes, usuários e o processo de aluguel.")

Rel(cliente, sistema_aluguel, "Pesquisa, Reserva e Aluga Veículos")
Rel(usuario_sistema, sistema_aluguel, "Gerencia Veículos, Clientes, Usuários e Aluguéis")

```

## 3. Diagrama de Sequência de Dados (Fluxo de Negócio)

Este diagrama detalha a interação entre o Cliente (Frontend), o Sistema de Aluguel (Backend) e o Banco de Dados para o fluxo de negócio que você descreveu.

```mermaid
autonumber
actor Cliente as C
participant "Frontend (ReactJS)" as F
participant "Backend (Node.js API)" as B
database "Banco de Dados" as DB

title Fluxo de Negócio - Aluguel de Carros

C -> F: Entra no APP
F -> C: Exibe interface de pesquisa de carros

C -> F: Pesquisa carro (categoria, modelo, marca, datas)
F -> B: GET /veiculos/disponiveis?categoria=X&modelo=Y&marca=Z&data_saida=D1&data_entrega=D2
B -> DB: Consulta Veiculos disponíveis e calcula preço
DB --> B: Retorna lista de Veiculos com preço calculado
B --> F: Retorna listagem de carros com preço
F -> C: Apresenta listagem de carros com preço calculado

C -> F: Escolhe carro e reserva
F -> B: POST /alugueis (veiculo_id, cliente_id, usuario_id, data_saida, dias_previsto, valor_previsto)
B -> DB: Insere novo registro em Alugueis (status: 'reservado')
DB --> B: Confirma criação do Aluguel
B --> F: Retorna confirmação da reserva
F -> C: Exibe confirmação da reserva

C -> F: Cliente busca o carro (presencialmente)
note over C, F: Cliente se dirige ao local para retirada do veículo
F -> B: PUT /alugueis/{id}/status (status: 'ativo')
B -> DB: Atualiza status do Aluguel para 'ativo'
DB --> B: Confirma atualização
B --> F: Retorna confirmação de status
F -> C: Exibe status do aluguel atualizado

C -> F: Cliente cancela o aluguel
F -> B: PUT /alugueis/{id}/status (status: 'cancelado')
B -> DB: Atualiza status do Aluguel para 'cancelado'
DB --> B: Confirma atualização
B --> F: Retorna confirmação de cancelamento
F -> C: Exibe status do aluguel atualizado

C -> F: Cliente devolve o carro
note over C, F: Cliente devolve o veículo no local
F -> B: PUT /alugueis/{id}/finalizar (data_entrega, valor_realizado, forma_pagamento)
B -> B: Calcula valor_realizado (dias_reais * valor_diaria)
B -> DB: Atualiza Aluguel (data_entrega, valor_realizado, forma_pagamento, status: 'concluido')
DB --> B: Confirma finalização
B --> F: Retorna detalhes da finalização e cobrança/reembolso
F -> C: Exibe resumo da locação e informações de pagamento
```

4. Documentação OpenAPI (Swagger/YAML)
Aqui está um rascunho da documentação OpenAPI 3.0 em formato YAML para as rotas do seu backend Node.js, incluindo validações básicas. Este é um ponto de partida e pode ser expandido com mais detalhes e exemplos.

```openapi
openapi: 3.0.0
info:
  title: API de Aluguel de Carros
  description: API para gerenciamento de veículos, clientes, usuários e aluguéis de carros.
  version: 1.0.0
servers:
  - url: http://localhost:3000/api/v1
    description: Servidor de Desenvolvimento Local
tags:
  - name: Veiculos
    description: Operações relacionadas a veículos
  - name: Usuarios
    description: Operações relacionadas a usuários do sistema
  - name: Clientes
    description: Operações relacionadas a clientes
  - name: Alugueis
    description: Operações relacionadas a aluguéis de veículos

paths:
  /veiculos:
    get:
      tags:
        - Veiculos
      summary: Lista todos os veículos
      description: Retorna uma lista de todos os veículos cadastrados.
      parameters:
        - in: query
          name: disponivel
          schema:
            type: boolean
          description: Filtra veículos por disponibilidade.
        - in: query
          name: categoria
          schema:
            type: string
          description: Filtra veículos por categoria.
        - in: query
          name: marca
          schema:
            type: string
          description: Filtra veículos por marca.
        - in: query
          name: modelo
          schema:
            type: string
          description: Filtra veículos por modelo.
      responses:
        '200':
          description: Lista de veículos retornada com sucesso.
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Veiculo'
        '500':
          description: Erro interno do servidor.
    post:
      tags:
        - Veiculos
      summary: Cadastra um novo veículo
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/VeiculoInput'
      responses:
        '201':
          description: Veículo cadastrado com sucesso.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Veiculo'
        '400':
          description: Dados inválidos.
        '500':
          description: Erro interno do servidor.

  /veiculos/{id}:
    get:
      tags:
        - Veiculos
      summary: Obtém um veículo por ID
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: integer
          description: ID do veículo.
      responses:
        '200':
          description: Veículo encontrado.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Veiculo'
        '404':
          description: Veículo não encontrado.
        '500':
          description: Erro interno do servidor.
    put:
      tags:
        - Veiculos
      summary: Atualiza um veículo existente
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: integer
          description: ID do veículo a ser atualizado.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/VeiculoInput'
      responses:
        '200':
          description: Veículo atualizado com sucesso.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Veiculo'
        '400':
          description: Dados inválidos.
        '404':
          description: Veículo não encontrado.
        '500':
          description: Erro interno do servidor.
    delete:
      tags:
        - Veiculos
      summary: Exclui um veículo
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: integer
          description: ID do veículo a ser excluído.
      responses:
        '204':
          description: Veículo excluído com sucesso.
        '404':
          description: Veículo não encontrado.
        '500':
          description: Erro interno do servidor.

  /usuarios:
    post:
      tags:
        - Usuarios
      summary: Cadastra um novo usuário
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UsuarioInput'
      responses:
        '201':
          description: Usuário cadastrado com sucesso.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Usuario'
        '400':
          description: Dados inválidos.
        '500':
          description: Erro interno do servidor.
    get:
      tags:
        - Usuarios
      summary: Lista todos os usuários
      responses:
        '200':
          description: Lista de usuários retornada com sucesso.
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Usuario'
        '500':
          description: Erro interno do servidor.

  /clientes:
    get:
      tags:
        - Clientes
      summary: Lista todos os clientes
      responses:
        '200':
          description: Lista de clientes retornada com sucesso.
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Cliente'
        '500':
          description: Erro interno do servidor.
    post:
      tags:
        - Clientes
      summary: Cadastra um novo cliente
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ClienteInput'
      responses:
        '201':
          description: Cliente cadastrado com sucesso.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Cliente'
        '400':
          description: Dados inválidos.
        '500':
          description: Erro interno do servidor.

  /clientes/{id}:
    get:
      tags:
        - Clientes
      summary: Obtém um cliente por ID
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: integer
          description: ID do cliente.
      responses:
        '200':
          description: Cliente encontrado.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Cliente'
        '404':
          description: Cliente não encontrado.
        '500':
          description: Erro interno do servidor.
    put:
      tags:
        - Clientes
      summary: Atualiza um cliente existente
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: integer
          description: ID do cliente a ser atualizado.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ClienteInput'
      responses:
        '200':
          description: Cliente atualizado com sucesso.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Cliente'
        '400':
          description: Dados inválidos.
        '404':
          description: Cliente não encontrado.
        '500':
          description: Erro interno do servidor.
    delete:
      tags:
        - Clientes
      summary: Exclui um cliente
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: integer
          description: ID do cliente a ser excluído.
      responses:
        '204':
          description: Cliente excluído com sucesso.
        '404':
          description: Cliente não encontrado.
        '500':
          description: Erro interno do servidor.

  /alugueis:
    get:
      tags:
        - Alugueis
      summary: Lista todos os aluguéis
      parameters:
        - in: query
          name: status
          schema:
            type: string
            enum: [reservado, ativo, cancelado, concluido]
          description: Filtra aluguéis por status.
        - in: query
          name: cliente_id
          schema:
            type: integer
          description: Filtra aluguéis por ID do cliente.
        - in: query
          name: veiculo_id
          schema:
            type: integer
          description: Filtra aluguéis por ID do veículo.
      responses:
        '200':
          description: Lista de aluguéis retornada com sucesso.
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Aluguel'
        '500':
          description: Erro interno do servidor.
    post:
      tags:
        - Alugueis
      summary: Cria um novo aluguel (reserva)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AluguelInput'
      responses:
        '201':
          description: Aluguel (reserva) criado com sucesso.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Aluguel'
        '400':
          description: Dados inválidos.
        '500':
          description: Erro interno do servidor.

  /alugueis/{id}:
    get:
      tags:
        - Alugueis
      summary: Obtém um aluguel por ID
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: integer
          description: ID do aluguel.
      responses:
        '200':
          description: Aluguel encontrado.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Aluguel'
        '404':
          description: Aluguel não encontrado.
        '500':
          description: Erro interno do servidor.
    put:
      tags:
        - Alugueis
      summary: Atualiza um aluguel existente
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: integer
          description: ID do aluguel a ser atualizado.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AluguelUpdateInput'
      responses:
        '200':
          description: Aluguel atualizado com sucesso.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Aluguel'
        '400':
          description: Dados inválidos.
        '404':
          description: Aluguel não encontrado.
        '500':
          description: Erro interno do servidor.
    delete:
      tags:
        - Alugueis
      summary: Exclui um aluguel
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: integer
          description: ID do aluguel a ser excluído.
      responses:
        '204':
          description: Aluguel excluído com sucesso.
        '404':
          description: Aluguel não encontrado.
        '500':
          description: Erro interno do servidor.

  /alugueis/{id}/status:
    put:
      tags:
        - Alugueis
      summary: Atualiza o status de um aluguel
      description: Usado para mudar o status do aluguel (ex: de 'reservado' para 'ativo' ou 'cancelado').
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: integer
          description: ID do aluguel.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - status
                - usuario_id
              properties:
                status:
                  type: string
                  enum: [ativo, cancelado]
                  description: Novo status do aluguel.
                usuario_id:
                  type: integer
                  description: ID do usuário que está atualizando o status.
      responses:
        '200':
          description: Status do aluguel atualizado com sucesso.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Aluguel'
        '400':
          description: Dados inválidos ou transição de status não permitida.
        '404':
          description: Aluguel não encontrado.
        '500':
          description: Erro interno do servidor.

  /alugueis/{id}/finalizar:
    put:
      tags:
        - Alugueis
      summary: Finaliza um aluguel
      description: Usado para concluir um aluguel, registrando a data de entrega, valor realizado e forma de pagamento.
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: integer
          description: ID do aluguel.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - data_entrega
                - valor_realizado
                - forma_pagamento
                - usuario_id
              properties:
                data_entrega:
                  type: string
                  format: date
                  description: Data real de entrega do veículo.
                valor_realizado:
                  type: number
                  format: float
                  description: Valor final cobrado pelo aluguel.
                forma_pagamento:
                  type: string
                  enum: [dinheiro, pix, cartao]
                  description: Forma de pagamento utilizada.
                usuario_id:
                  type: integer
                  description: ID do usuário que está finalizando o aluguel.
      responses:
        '200':
          description: Aluguel finalizado com sucesso.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Aluguel'
        '400':
          description: Dados inválidos ou aluguel já finalizado/cancelado.
        '404':
          description: Aluguel não encontrado.
        '500':
          description: Erro interno do servidor.

components:
  schemas:
    Veiculo:
      type: object
      properties:
        id:
          type: integer
          readOnly: true
        marca:
          type: string
        modelo:
          type: string
        categoria:
          type: string
        ano_fabricacao:
          type: integer
        placa:
          type: string
        valor_diaria:
          type: number
          format: float
        disponivel:
          type: boolean
        created_at:
          type: string
          format: date-time
          readOnly: true
        updated_at:
          type: string
          format: date-time
          readOnly: true
    VeiculoInput:
      type: object
      required:
        - marca
        - modelo
        - categoria
        - ano_fabricacao
        - placa
        - valor_diaria
      properties:
        marca:
          type: string
          minLength: 2
          maxLength: 255
        modelo:
          type: string
          minLength: 2
          maxLength: 255
        categoria:
          type: string
          minLength: 2
          maxLength: 255
        ano_fabricacao:
          type: integer
          minimum: 1900
          maximum: 2100
        placa:
          type: string
          pattern: '^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$' # Padrão Mercosul ou similar
          maxLength: 10
        valor_diaria:
          type: number
          format: float
          minimum: 0.01
        disponivel:
          type: boolean
          default: true

    Usuario:
      type: object
      properties:
        id:
          type: integer
          readOnly: true
        username:
          type: string
        created_at:
          type: string
          format: date-time
          readOnly: true
        updated_at:
          type: string
          format: date-time
          readOnly: true
    UsuarioInput:
      type: object
      required:
        - username
        - password
      properties:
        username:
          type: string
          minLength: 3
          maxLength: 255
        password:
          type: string
          minLength: 6 # Exemplo de validação de senha
          maxLength: 255

    Cliente:
      type: object
      properties:
        id:
          type: integer
          readOnly: true
        cod:
          type: string
        nome:
          type: string
        endereco:
          type: string
        telefone:
          type: string
        data_nascimento:
          type: string
          format: date
        created_at:
          type: string
          format: date-time
          readOnly: true
        updated_at:
          type: string
          format: date-time
          readOnly: true
    ClienteInput:
      type: object
      required:
        - cod
        - nome
      properties:
        cod:
          type: string
          minLength: 1
          maxLength: 50
        nome:
          type: string
          minLength: 3
          maxLength: 255
        endereco:
          type: string
          maxLength: 255
        telefone:
          type: string
          pattern: '^|$?\d{2}$|?[\s-]?\d{4,5}-?\d{4}$' # Exemplo de validação de telefone
        data_nascimento:
          type: string
          format: date

    Aluguel:
      type: object
      properties:
        id:
          type: integer
          readOnly: true
        veiculo_id:
          type: integer
        cliente_id:
          type: integer
        usuario_id:
          type: integer
        data_saida:
          type: string
          format: date
        data_entrega:
          type: string
          format: date
        data_reserva:
          type: string
          format: date-time
          readOnly: true
        dias_previsto:
          type: integer
        valor_previsto:
          type: number
          format: float
        valor_realizado:
          type: number
          format: float
        forma_pagamento:
          type: string
          enum: [dinheiro, pix, cartao]
        status:
          type: string
          enum: [reservado, ativo, cancelado, concluido]
        created_at:
          type: string
          format: date-time
          readOnly: true
        updated_at:
          type: string
          format: date-time
          readOnly: true
    AluguelInput:
      type: object
      required:
        - veiculo_id
        - cliente_id
        - usuario_id
        - data_saida
        - dias_previsto
        - valor_previsto
      properties:
        veiculo_id:
          type: integer
        cliente_id:
          type: integer
        usuario_id:
          type: integer
        data_saida:
          type: string
          format: date
        dias_previsto:
          type: integer
          minimum: 1
        valor_previsto:
          type: number
          format: float
          minimum: 0.01
        forma_pagamento:
          type: string
          enum: [dinheiro, pix, cartao]
          default: dinheiro
        status:
          type: string
          enum: [reservado] # Ao criar, o status inicial é sempre reservado
          default: reservado
    AluguelUpdateInput:
      type: object
      properties:
        veiculo_id:
          type: integer
        cliente_id:
          type: integer
        usuario_id:
          type: integer
        data_saida:
          type: string
          format: date
        data_entrega:
          type: string
          format: date
        dias_previsto:
          type: integer
          minimum: 1
        valor_previsto:
          type: number
          format: float
          minimum: 0.01
        valor_realizado:
          type: number
          format: float
          minimum: 0
        forma_pagamento:
          type: string
          enum: [dinheiro, pix, cartao]
        status:
          type: string
          enum: [reservado, ativo, cancelado, concluido]
```

Observações sobre a documentação OpenAPI:

Validações: Incluí algumas validações básicas como minLength, maxLength, minimum, maximum, pattern (para placa e telefone) e enum (para status e forma de pagamento). Em um projeto real, você pode usar bibliotecas como Joi ou Yup no Node.js para implementar essas validações no backend.
Rotas de Status e Finalização: Criei rotas específicas (/alugueis/{id}/status e /alugueis/{id}/finalizar) para gerenciar as transições de estado do aluguel, o que é uma boa prática para APIs RESTful.
usuario_id: É importante que o usuario_id seja enviado nas requisições de atualização de status e finalização para registrar qual funcionário realizou a ação.
readOnly: Campos como id, created_at, updated_at e data_reserva são marcados como readOnly pois são gerados pelo sistema.
VeiculoInput vs Veiculo: Separei o schema de entrada (VeiculoInput) do schema de saída (Veiculo) para deixar claro quais campos são esperados na criação/atualização e quais são retornados pela API.