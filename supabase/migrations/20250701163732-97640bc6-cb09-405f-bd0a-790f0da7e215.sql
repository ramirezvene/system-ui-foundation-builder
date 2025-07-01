
-- Criar tabela cadastro_loja
CREATE TABLE public.cadastro_loja (
  cod_loja INTEGER PRIMARY KEY,
  loja VARCHAR(255) NOT NULL,
  estado VARCHAR(2) NOT NULL
);

-- Criar tabela margem_subgrupo
CREATE TABLE public.margem_subgrupo (
  id INTEGER PRIMARY KEY,
  descricao VARCHAR(255) NOT NULL,
  cond SMALLINT NOT NULL,
  montante NUMERIC(10,2) NOT NULL,
  data_inicio TIMESTAMP NOT NULL,
  data_final TIMESTAMP NOT NULL
);

-- Criar tabela cadastro_produto
CREATE TABLE public.cadastro_produto (
  cod_prod INTEGER PRIMARY KEY,
  produto VARCHAR(255) NOT NULL,
  reg_ms VARCHAR(50),
  cod_barras VARCHAR(50),
  subgrupo VARCHAR(100),
  cod_grupo INTEGER REFERENCES public.margem_subgrupo(id),
  grupo VARCHAR(255),
  ncm VARCHAR(20),
  imposto_rs SMALLINT,
  imposto_sc SMALLINT,
  imposto_pr SMALLINT,
  pmc_rs NUMERIC(10,2),
  pmc_sc NUMERIC(10,2),
  pmc_pr NUMERIC(10,2),
  sugerido_rs NUMERIC(10,2),
  sugerido_sc NUMERIC(10,2),
  sugerido_pr NUMERIC(10,2)
);

-- Criar tabela ncm_aliq
CREATE TABLE public.ncm_aliq (
  ncm VARCHAR(20) PRIMARY KEY,
  aliq_rs NUMERIC(5,2),
  aliq_sc NUMERIC(5,2),
  aliq_pr NUMERIC(5,2),
  pis_cofins NUMERIC(5,2)
);

-- Inserir dados de exemplo para teste
INSERT INTO public.cadastro_loja (cod_loja, loja, estado) VALUES
(1, 'Loja Centro', 'RS'),
(2, 'Loja Norte', 'SC'),
(3, 'Loja Sul', 'PR');

INSERT INTO public.margem_subgrupo (id, descricao, cond, montante, data_inicio, data_final) VALUES
(1, 'Medicamentos', 1, 15.50, '2024-01-01', '2024-12-31'),
(2, 'Cosméticos', 1, 25.00, '2024-01-01', '2024-12-31'),
(3, 'Perfumaria', 1, 30.00, '2024-01-01', '2024-12-31');

INSERT INTO public.cadastro_produto (cod_prod, produto, reg_ms, cod_barras, subgrupo, cod_grupo, grupo, ncm, imposto_rs, imposto_sc, imposto_pr, pmc_rs, pmc_sc, pmc_pr, sugerido_rs, sugerido_sc, sugerido_pr) VALUES
(1, 'Paracetamol 500mg', '123456', '7891234567890', 'Analgésicos', 1, 'Medicamentos', '30049099', 0, 0, 0, 12.50, 13.00, 12.80, 10.00, 10.40, 10.24),
(2, 'Shampoo Anticaspa', '654321', '7899876543210', 'Higiene', 2, 'Cosméticos', '33051000', 18, 18, 18, 25.90, 26.50, 26.20, 20.72, 21.20, 20.96);

INSERT INTO public.ncm_aliq (ncm, aliq_rs, aliq_sc, aliq_pr, pis_cofins) VALUES
('30049099', 0.00, 0.00, 0.00, 9.25),
('33051000', 18.00, 18.00, 18.00, 9.25);

-- Habilitar RLS para as novas tabelas
ALTER TABLE public.cadastro_loja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.margem_subgrupo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cadastro_produto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ncm_aliq ENABLE ROW LEVEL SECURITY;

-- Criar políticas permissivas para todas as operações (já que não há autenticação específica)
CREATE POLICY "Allow all operations on cadastro_loja" ON public.cadastro_loja FOR ALL USING (true);
CREATE POLICY "Allow all operations on margem_subgrupo" ON public.margem_subgrupo FOR ALL USING (true);
CREATE POLICY "Allow all operations on cadastro_produto" ON public.cadastro_produto FOR ALL USING (true);
CREATE POLICY "Allow all operations on ncm_aliq" ON public.ncm_aliq FOR ALL USING (true);
