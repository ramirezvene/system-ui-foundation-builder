
-- Adicionar coluna tipo_referencia na tabela produto_margem
ALTER TABLE public.produto_margem 
ADD COLUMN tipo_referencia character varying;

-- Atualizar registros existentes para ter um valor padrão
UPDATE public.produto_margem 
SET tipo_referencia = 'estado' 
WHERE tipo_referencia IS NULL;
