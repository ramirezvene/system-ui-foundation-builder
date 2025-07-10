
-- Adicionar colunas cidade_nome e microregiao_nome na tabela cadastro_loja
ALTER TABLE public.cadastro_loja 
ADD COLUMN cidade_nome character varying,
ADD COLUMN microregiao_nome character varying;
