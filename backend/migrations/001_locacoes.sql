-- Execute uma vez no banco já existente, após backup.
BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'aluguel' AND table_name = 'alugueis' AND column_name = 'end_date'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'aluguel' AND table_name = 'alugueis' AND column_name = 'data_entrega'
  ) THEN
    ALTER TABLE aluguel.alugueis RENAME COLUMN end_date TO data_entrega;
  END IF;
END $$;

-- Verifique se não há mais de uma locação aberta por veículo antes de aplicar.
CREATE UNIQUE INDEX IF NOT EXISTS uq_veiculo_locacao_aberta
ON aluguel.alugueis (veiculo_id)
WHERE status IN ('reservado', 'ativo');

-- Perfis e revogação de tokens para instalações anteriores.
ALTER TABLE iam.usuarios ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'operador';
UPDATE iam.usuarios SET role = 'admin' WHERE username = 'admin';
ALTER TABLE iam.usuarios DROP CONSTRAINT IF EXISTS usuarios_role_check;
ALTER TABLE iam.usuarios ADD CONSTRAINT usuarios_role_check CHECK (role IN ('admin', 'operador'));
CREATE TABLE IF NOT EXISTS iam.tokens_revogados (
    jti UUID PRIMARY KEY,
    expires_at TIMESTAMPTZ NOT NULL
);


-- RF12: fila de solicitações de reserva pública.
CREATE TABLE IF NOT EXISTS aluguel.solicitacoes (
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
CREATE INDEX IF NOT EXISTS idx_solicitacoes_status_criacao
ON aluguel.solicitacoes(status, created_at DESC);

CREATE TABLE IF NOT EXISTS iam.auditoria (
    id BIGSERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES iam.usuarios(id) ON DELETE SET NULL,
    evento VARCHAR(80) NOT NULL,
    recurso VARCHAR(90) NOT NULL,
    codigo_http INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_auditoria_criacao ON iam.auditoria(created_at DESC);

COMMIT;
