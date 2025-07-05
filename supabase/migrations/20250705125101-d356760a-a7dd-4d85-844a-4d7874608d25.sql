
-- Adicionar campo data_validacao na tabela token_loja
ALTER TABLE public.token_loja 
ADD COLUMN data_validacao timestamp with time zone;

-- Atualizar tokens já aprovados/reprovados para preencher data_validacao com data_criacao
UPDATE public.token_loja 
SET data_validacao = data_criacao 
WHERE st_aprovado IN (0, 1);
