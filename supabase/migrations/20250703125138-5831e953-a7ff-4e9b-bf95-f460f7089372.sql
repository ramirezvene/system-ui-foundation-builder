
-- Adicionar campos data_inicio e data_fim na tabela subgrupo_margem
ALTER TABLE public.subgrupo_margem 
ADD COLUMN data_inicio DATE DEFAULT '2025-01-01',
ADD COLUMN data_fim DATE DEFAULT '2030-01-01';

-- Atualizar registros existentes com os valores padrão
UPDATE public.subgrupo_margem 
SET data_inicio = '2025-01-01', data_fim = '2030-01-01' 
WHERE data_inicio IS NULL OR data_fim IS NULL;
