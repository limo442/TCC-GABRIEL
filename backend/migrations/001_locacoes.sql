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

COMMIT;
