
-- Adicionar campo st_aprovado na tabela token_loja
ALTER TABLE public.token_loja 
ADD COLUMN st_aprovado SMALLINT DEFAULT 1;
