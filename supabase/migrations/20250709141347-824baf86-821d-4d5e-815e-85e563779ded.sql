
-- Adicionar novos campos à tabela produto_margem
ALTER TABLE public.produto_margem 
ADD COLUMN tipo_margem VARCHAR(20) NOT NULL DEFAULT 'percentual' CHECK (tipo_margem IN ('percentual', 'valor')),
ADD COLUMN observacao VARCHAR(100);

-- Adicionar campo observacao à tabela subgrupo_margem
ALTER TABLE public.subgrupo_margem 
ADD COLUMN observacao VARCHAR(100);

-- Criar índice para melhor performance na consulta por id_produto
CREATE INDEX IF NOT EXISTS idx_produto_margem_id_produto ON public.produto_margem(id_produto);
