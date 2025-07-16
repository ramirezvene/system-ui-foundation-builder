
-- Remover a coluna codigo_referencia da tabela produto_margem
ALTER TABLE public.produto_margem DROP COLUMN codigo_referencia;

-- Verificar se a foreign key existe e está correta
ALTER TABLE public.produto_margem 
DROP CONSTRAINT IF EXISTS fk_produto_margem_produto;

-- Recriar a foreign key corretamente
ALTER TABLE public.produto_margem 
ADD CONSTRAINT fk_produto_margem_produto 
FOREIGN KEY (id_produto) REFERENCES public.cadastro_produto(id_produto);
