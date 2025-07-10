
-- Adicionar campo UF na tabela subgrupo_margem
ALTER TABLE public.subgrupo_margem 
ADD COLUMN uf VARCHAR(2);

-- Adicionar referência ao cadastro_estado
ALTER TABLE public.subgrupo_margem 
ADD CONSTRAINT fk_subgrupo_margem_estado 
FOREIGN KEY (uf) REFERENCES public.cadastro_estado(estado);

-- Duplicar registros existentes para RS, SC e PR
INSERT INTO public.subgrupo_margem (cod_subgrupo, nome_subgrupo, margem, data_inicio, data_fim, observacao, uf)
SELECT 
    cod_subgrupo,
    nome_subgrupo,
    margem,
    data_inicio,
    data_fim,
    observacao,
    'RS' as uf
FROM public.subgrupo_margem 
WHERE uf IS NULL;

INSERT INTO public.subgrupo_margem (cod_subgrupo, nome_subgrupo, margem, data_inicio, data_fim, observacao, uf)
SELECT 
    cod_subgrupo,
    nome_subgrupo,
    margem,
    data_inicio,
    data_fim,
    observacao,
    'SC' as uf
FROM public.subgrupo_margem 
WHERE uf IS NULL;

INSERT INTO public.subgrupo_margem (cod_subgrupo, nome_subgrupo, margem, data_inicio, data_fim, observacao, uf)
SELECT 
    cod_subgrupo,
    nome_subgrupo,
    margem,
    data_inicio,
    data_fim,
    observacao,
    'PR' as uf
FROM public.subgrupo_margem 
WHERE uf IS NULL;

-- Remover registros sem UF (originais)
DELETE FROM public.subgrupo_margem WHERE uf IS NULL;

-- Tornar o campo UF obrigatório
ALTER TABLE public.subgrupo_margem 
ALTER COLUMN uf SET NOT NULL;

-- Criar índice para melhor performance
CREATE INDEX idx_subgrupo_margem_uf ON public.subgrupo_margem(uf);
CREATE INDEX idx_subgrupo_margem_cod_uf ON public.subgrupo_margem(cod_subgrupo, uf);
