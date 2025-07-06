
-- Adicionar campos na tabela cadastro_loja
ALTER TABLE public.cadastro_loja 
ADD COLUMN meta_loja smallint DEFAULT 1,
ADD COLUMN dre_negativo smallint DEFAULT 1;

-- Adicionar campos na tabela cadastro_produto
ALTER TABLE public.cadastro_produto 
ADD COLUMN st_ruptura smallint DEFAULT 0,
ADD COLUMN st_pricing smallint DEFAULT 0;

-- Atualizar todos os produtos existentes com os novos campos
UPDATE public.cadastro_produto 
SET st_ruptura = 0, st_pricing = 0;
