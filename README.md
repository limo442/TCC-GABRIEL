# 🚗 TCC-GABRIEL - Sistema de Gestão de Aluguéis de Carros

[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-18+-61dafb.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Sistema completo para gestão de aluguéis de carros com interface web moderna, API RESTful e banco de dados PostgreSQL.

## 📋 Sobre o Projeto

O TCC-GABRIEL é uma aplicação full-stack desenvolvida como Trabalho de Conclusão de Curso, implementando um sistema completo de gestão de locadora de veículos. O sistema permite o cadastro e gerenciamento de veículos, clientes, usuários e aluguéis, com interface intuitiva e segura.

### 🎯 Funcionalidades Principais

- ✅ **Autenticação JWT** com login/logout seguro
- ✅ **Dashboard** com estatísticas em tempo real
- ✅ **CRUD completo** para Veículos, Clientes, Usuários e Aluguéis
- ✅ **Interface responsiva** com design moderno
- ✅ **API RESTful** documentada
- ✅ **Banco de dados PostgreSQL** com esquemas organizados
- ✅ **Containerização Docker** para fácil deploy

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** 18+ com Express.js
- **PostgreSQL** 15+ com esquemas organizados
- **JWT** para autenticação
- **bcrypt** para hash de senhas
- **Joi** para validação de dados

### Frontend
- **React** 18+ com React Router 6
- **Tailwind CSS** para estilização
- **Axios** para requisições HTTP
- **Sonner** para notificações
- **Lucide React** para ícones

### Infraestrutura
- **Docker** & Docker Compose
- **Nginx** (implicito no desenvolvimento)
- **ESLint** para qualidade de código

## 📋 Pré-requisitos

Antes de começar, você precisa ter instalado:

- **Docker** 20.10+
- **Docker Compose** 2.0+
- **Git** (opcional, para clonar o repositório)

```bash
# Verificar instalação do Docker
docker --version
docker-compose --version
```

## 🚀 Como Executar

### 1. Clonando o Repositório

```bash
git clone https://github.com/gabrielpaulosi/tcc-gabriel.git
cd tcc-gabriel
```

### 2. Construindo e Executando com Docker

```bash
# Construir e iniciar todos os serviços
docker-compose up --build

# Ou em background (recomendado para desenvolvimento)
docker-compose up -d --build
```

### 3. Verificando se Está Funcionando

```bash
# Verificar status dos containers
docker-compose ps

# Ver logs dos serviços
docker-compose logs backend
docker-compose logs frontend
```

### 4. Acessando a Aplicação

- **Frontend (React)**: http://localhost:3001
- **Backend API**: http://localhost:8002/api/health
- **Banco PostgreSQL**: localhost:5433

## 🔐 Credenciais de Acesso

### Usuários de Teste

| Usuário | Senha | Permissões |
|---------|-------|------------|
| `admin` | `admin123` | Administrador completo |
| `operator1` | `op123` | Operador básico |

### Acesso ao Banco de Dados

```bash
# Conectar ao PostgreSQL via Docker
docker-compose exec postgres psql -U aluguel_user -d aluguel_db

# Ou via linha de comando
psql -h localhost -p 5433 -U aluguel_user -d aluguel_db
# Senha: aluguel_pass123
```

## 📁 Estrutura do Projeto

```
tcc-gabriel/
├── docker-compose.yml          # Configuração Docker
├── backend/                    # API Node.js/Express
│   ├── Dockerfile
│   ├── package.json
│   ├── app.js                  # Servidor principal
│   ├── init.sql                # Script de inicialização DB
│   ├── routes/                 # Endpoints da API
│   │   ├── auth.js            # Autenticação
│   │   ├── veiculos.js        # CRUD veículos
│   │   ├── clientes.js        # CRUD clientes
│   │   ├── usuarios.js        # CRUD usuários
│   │   └── alugueis.js        # CRUD aluguéis
│   ├── middleware/
│   │   └── auth.js            # Middleware JWT
│   ├── validation/
│   │   └── schemas.js         # Validações Joi
│   └── utils/
│       └── pagination.js      # Utilitários
└── frontend/                   # Aplicação React
    ├── Dockerfile
    ├── package.json
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── App.js             # Roteamento principal
    │   ├── index.js           # Ponto de entrada
    │   ├── components/
    │   │   ├── Layout.jsx     # Layout com sidebar
    │   │   └── ui/            # Componentes reutilizáveis
    │   ├── pages/             # Páginas da aplicação
    │   │   ├── Dashboard.jsx  # Dashboard principal
    │   │   ├── Login.jsx      # Página de login
    │   │   ├── Veiculos.jsx   # Gestão de veículos
    │   │   ├── Clientes.jsx   # Gestão de clientes
    │   │   ├── Usuarios.jsx   # Gestão de usuários
    │   │   └── Alugueis.jsx   # Gestão de aluguéis
    │   └── services/
    │       └── api.js         # Cliente HTTP
    └── tailwind.config.js     # Configuração Tailwind
```

## 📚 API Documentation

### Base URL
```
http://localhost:8002/api
```

### Autenticação
Todas as rotas (exceto login) requerem header `Authorization: Bearer <token>`

### Endpoints Principais

#### 🔐 Autenticação
```http
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

#### 🚗 Veículos
```http
GET    /veiculos       # Listar veículos
POST   /veiculos       # Criar veículo
GET    /veiculos/:id   # Buscar veículo
PUT    /veiculos/:id   # Atualizar veículo
DELETE /veiculos/:id   # Excluir veículo
```

#### 👥 Clientes
```http
GET    /clientes       # Listar clientes
POST   /clientes       # Criar cliente
PUT    /clientes/:id   # Atualizar cliente
DELETE /clientes/:id   # Excluir cliente
```

#### 👤 Usuários
```http
GET    /usuarios       # Listar usuários
POST   /usuarios       # Criar usuário
```

#### 📋 Aluguéis
```http
GET    /alugueis              # Listar aluguéis
POST   /alugueis              # Criar aluguel
PUT    /alugueis/:id          # Atualizar aluguel
PUT    /alugueis/:id/status   # Alterar status
PUT    /alugueis/:id/finalizar # Finalizar aluguel
DELETE /alugueis/:id          # Excluir aluguel
```

### Códigos de Status

- `200` - Sucesso
- `201` - Criado
- `400` - Dados inválidos
- `401` - Não autorizado
- `404` - Não encontrado
- `500` - Erro interno

## 🗄️ Banco de Dados

### Esquemas

- **`iam`** - Identity and Access Management (usuários)
- **`aluguel`** - Dados de negócio (veículos, clientes, aluguéis)

### Tabelas Principais

```sql
-- iam.usuarios
CREATE TABLE iam.usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- aluguel.veiculos
CREATE TABLE aluguel.veiculos (
    id SERIAL PRIMARY KEY,
    marca VARCHAR(255) NOT NULL,
    modelo VARCHAR(255) NOT NULL,
    categoria VARCHAR(255),
    ano_fabricacao INTEGER,
    placa VARCHAR(20) UNIQUE NOT NULL,
    valor_diaria DECIMAL(10, 2) NOT NULL,
    disponivel BOOLEAN DEFAULT true
);

-- aluguel.clientes
CREATE TABLE aluguel.clientes (
    id SERIAL PRIMARY KEY,
    cod VARCHAR(50) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    endereco VARCHAR(255),
    telefone VARCHAR(20),
    data_nascimento DATE
);

-- aluguel.alugueis
CREATE TABLE aluguel.alugueis (
    id SERIAL PRIMARY KEY,
    veiculo_id INTEGER REFERENCES aluguel.veiculos(id),
    cliente_id INTEGER REFERENCES aluguel.clientes(id),
    usuario_id INTEGER REFERENCES iam.usuarios(id),
    data_saida TIMESTAMP NOT NULL,
    dias_previsto INTEGER,
    valor_previsto DECIMAL(10, 2),
    valor_realizado DECIMAL(10, 2),
    forma_pagamento VARCHAR(50),
    status VARCHAR(20) DEFAULT 'reservado'
);
```

## 🔧 Desenvolvimento

### Comandos Úteis

```bash
# Parar todos os serviços
docker-compose down

# Reconstruir apenas o backend
docker-compose build backend

# Ver logs em tempo real
docker-compose logs -f

# Acessar container do backend
docker-compose exec backend sh

# Resetar banco de dados
docker-compose down -v
docker-compose up -d
```

### Ambiente de Desenvolvimento

```bash
# Instalar dependências (se executar localmente)
cd backend && npm install
cd ../frontend && npm install

# Executar backend localmente
cd backend && npm start

# Executar frontend localmente
cd frontend && npm start
```

### Variáveis de Ambiente

#### Backend (.env)
```env
DB_HOST=postgres
DB_PORT=5432
DB_USER=aluguel_user
DB_PASSWORD=aluguel_pass123
DB_NAME=aluguel_db
NODE_PORT=8002
JWT_SECRET=your-super-secret-jwt-key-change-in-production-please
API_KEYS=dev-api-key-change-in-production,test-api-key-123
CORS_ORIGINS=http://localhost:3001
```

#### Frontend (.env)
```env
REACT_APP_BACKEND_URL=http://localhost:8002
```

## 🧪 Testes

### Testes de Integração

```bash
# Testar API endpoints
curl http://localhost:8002/api/health
curl -H "Authorization: Bearer <token>" http://localhost:8002/api/veiculos
```

### Testes de Interface

1. **Login/Logout**: Verificar autenticação JWT
2. **CRUD Operations**: Criar, ler, atualizar, excluir registros
3. **Navegação**: Testar roteamento entre páginas
4. **Responsividade**: Verificar layout em diferentes telas

## 🤝 Como Contribuir

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Código

- **ESLint** configurado para qualidade
- **Prettier** para formatação consistente
- **Conventional Commits** para mensagens

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Gabriel** - *Trabalho de Conclusão de Curso*

- **GitHub**: [@gabriel-tcc](https://github.com/gabriel-tcc)
- **LinkedIn**: [Gabriel TCC](https://linkedin.com/in/gabriel-tcc)

## 🙏 Agradecimentos

- Orientador acadêmico
- Professores do curso
- Comunidade open source

---

<div align="center">

**TCC-GABRIEL** 🚗✨

*Sistema de Gestão de Aluguéis de Carros*

Desenvolvido com ❤️ usando tecnologias modernas

</div>