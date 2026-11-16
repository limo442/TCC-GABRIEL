CREATE SCHEMA IF NOT EXISTS iam;
CREATE SCHEMA IF NOT EXISTS aluguel;

-- Create vehicles table
CREATE TABLE aluguel.veiculos (
    id SERIAL PRIMARY KEY,
    marca VARCHAR(255) NOT NULL,
    modelo VARCHAR(255) NOT NULL,
    categoria VARCHAR(255),
    ano_fabricacao INTEGER,
    placa VARCHAR(20) UNIQUE NOT NULL,
    valor_diaria DECIMAL(10, 2) NOT NULL,
    disponivel BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create customers table
CREATE TABLE aluguel.clientes (
    id SERIAL PRIMARY KEY,
    cod VARCHAR(50) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    endereco VARCHAR(255),
    telefone VARCHAR(20),
    data_nascimento DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table (employees)
CREATE TABLE iam.usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'operador' CHECK (role IN ('admin', 'operador')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tokens revogados permanecem bloqueados até a expiração.
CREATE TABLE iam.tokens_revogados (
    jti UUID PRIMARY KEY,
    expires_at TIMESTAMPTZ NOT NULL
);

-- Create rentals table
CREATE TABLE aluguel.alugueis (
    id SERIAL PRIMARY KEY,
    veiculo_id INTEGER REFERENCES aluguel.veiculos(id),
    cliente_id INTEGER REFERENCES aluguel.clientes(id),
    usuario_id INTEGER REFERENCES iam.usuarios(id),
    data_saida TIMESTAMP NOT NULL,
    data_entrega TIMESTAMP,
    dias_previsto INTEGER,
    valor_previsto DECIMAL(10, 2),
    valor_realizado DECIMAL(10, 2),
    forma_pagamento VARCHAR(50),
    status VARCHAR(20) DEFAULT 'reservado',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Impede duas reservas ou locações abertas para o mesmo veículo.
CREATE UNIQUE INDEX uq_veiculo_locacao_aberta
ON aluguel.alugueis (veiculo_id)
WHERE status IN ('reservado', 'ativo');


-- Pedidos públicos não bloqueiam veículos; aprovação transforma o pedido em reserva.
CREATE TABLE aluguel.solicitacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    veiculo_id INTEGER NOT NULL REFERENCES aluguel.veiculos(id),
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL,
    telefone VARCHAR(20),
    data_saida DATE NOT NULL,
    dias_previsto INTEGER NOT NULL CHECK (dias_previsto BETWEEN 1 AND 90),
    status VARCHAR(20) NOT NULL DEFAULT 'pendente'
      CHECK (status IN ('pendente','aprovada','recusada')),
    aceite_politica_em TIMESTAMPTZ NOT NULL,
    atendida_por INTEGER REFERENCES iam.usuarios(id) ON DELETE SET NULL,
    aluguel_id INTEGER REFERENCES aluguel.alugueis(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_solicitacoes_status_criacao ON aluguel.solicitacoes(status, created_at DESC);

-- Registro de operações sem payload, senhas, email, tokens ou endereço IP.
CREATE TABLE iam.auditoria (
    id BIGSERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES iam.usuarios(id) ON DELETE SET NULL,
    evento VARCHAR(80) NOT NULL,
    recurso VARCHAR(90) NOT NULL,
    codigo_http INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_auditoria_criacao ON iam.auditoria(created_at DESC);

-- Insert sample data
INSERT INTO aluguel.veiculos (marca, modelo, categoria, ano_fabricacao, placa, valor_diaria, disponivel) VALUES
('Toyota', 'Corolla', 'Sedan', 2022, 'ABC1234', 150.00, true),
('Honda', 'Civic', 'Sedan', 2023, 'DEF5678', 160.00, true),
('Ford', 'Ranger', 'Pickup', 2022, 'GHI9012', 200.00, true),
('Chevrolet', 'Onix', 'Hatch', 2023, 'JKL3456', 120.00, true),
('Volkswagen', 'Gol', 'Hatch', 2022, 'MNO7890', 110.00, false);

INSERT INTO aluguel.clientes (cod, nome, endereco, telefone, data_nascimento) VALUES
('C001', 'João Silva', 'Rua A, 123', '(11) 91234-5678', '1990-01-01'),
('C002', 'Maria Oliveira', 'Rua B, 456', '(11) 98765-4321', '1985-05-15'),
('C003', 'Carlos Souza', 'Rua C, 789', '(11) 99999-9999', '1992-10-20');

-- Sem senhas padrão públicas: crie o primeiro admin via npm run create-admin.
