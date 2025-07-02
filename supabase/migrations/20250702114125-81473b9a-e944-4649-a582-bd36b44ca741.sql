
-- Remover tabelas existentes
DROP TABLE IF EXISTS public.ncm_aliq CASCADE;
DROP TABLE IF EXISTS public.margem_subgrupo CASCADE;

-- Criar nova tabela subgrupo_margem
CREATE TABLE public.subgrupo_margem (
  cod_subgrupo INTEGER PRIMARY KEY,
  nome_subgrupo VARCHAR(255) NOT NULL,
  margem NUMERIC(5,2) NOT NULL
);

-- Recriar tabela cadastro_produto com nova estrutura
DROP TABLE IF EXISTS public.cadastro_produto CASCADE;

CREATE TABLE public.cadastro_produto (
  id_produto INTEGER PRIMARY KEY,
  nome_produto VARCHAR(255) NOT NULL,
  subgrupo_id INTEGER REFERENCES public.subgrupo_margem(cod_subgrupo),
  ncm VARCHAR(20),
  alcada SMALLINT DEFAULT 0,
  aliq_rs NUMERIC(5,2),
  aliq_sc NUMERIC(5,2),
  aliq_pr NUMERIC(5,2),
  piscofins NUMERIC(5,2),
  observacao VARCHAR(500),
  pmc_rs DECIMAL(10,2),
  pmc_sc DECIMAL(10,2),
  pmc_pr DECIMAL(10,2),
  cmg_rs DECIMAL(10,2),
  cmg_sc DECIMAL(10,2),
  cmg_pr DECIMAL(10,2)
);

-- Habilitar RLS para as novas tabelas
ALTER TABLE public.subgrupo_margem ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cadastro_produto ENABLE ROW LEVEL SECURITY;

-- Criar políticas permissivas
CREATE POLICY "Allow all operations on subgrupo_margem" ON public.subgrupo_margem FOR ALL USING (true);
CREATE POLICY "Allow all operations on cadastro_produto" ON public.cadastro_produto FOR ALL USING (true);

-- Inserir dados de exemplo
INSERT INTO public.subgrupo_margem (cod_subgrupo, nome_subgrupo, margem) VALUES
(1, 'Medicamentos', 15.50),
(2, 'Cosméticos', 25.00),
(3, 'Perfumaria', 30.00);

INSERT INTO public.cadastro_produto (id_produto, nome_produto, subgrupo_id, ncm, alcada, aliq_rs, aliq_sc, aliq_pr, piscofins, pmc_rs, pmc_sc, pmc_pr, cmg_rs, cmg_sc, cmg_pr) VALUES
(1, 'Paracetamol 500mg', 1, '30049099', 0, 0.00, 0.00, 0.00, 9.25, 12.50, 13.00, 12.80, 8.00, 8.20, 8.10),
(2, 'Shampoo Anticaspa', 2, '33051000', 1, 18.00, 18.00, 18.00, 9.25, 25.90, 26.50, 26.20, 15.00, 15.30, 15.15);
