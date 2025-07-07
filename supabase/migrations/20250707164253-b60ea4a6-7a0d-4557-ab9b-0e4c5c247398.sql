
-- Criar tabela para controlar status dos estados
CREATE TABLE public.cadastro_estado (
  id SERIAL PRIMARY KEY,
  estado VARCHAR(2) NOT NULL UNIQUE,
  nome_estado VARCHAR(100) NOT NULL,
  st_ativo SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir estados brasileiros
INSERT INTO public.cadastro_estado (estado, nome_estado) VALUES
('AC', 'Acre'),
('AL', 'Alagoas'),
('AP', 'Amapá'),
('AM', 'Amazonas'),
('BA', 'Bahia'),
('CE', 'Ceará'),
('DF', 'Distrito Federal'),
('ES', 'Espírito Santo'),
('GO', 'Goiás'),
('MA', 'Maranhão'),
('MT', 'Mato Grosso'),
('MS', 'Mato Grosso do Sul'),
('MG', 'Minas Gerais'),
('PA', 'Pará'),
('PB', 'Paraíba'),
('PR', 'Paraná'),
('PE', 'Pernambuco'),
('PI', 'Piauí'),
('RJ', 'Rio de Janeiro'),
('RN', 'Rio Grande do Norte'),
('RS', 'Rio Grande do Sul'),
('RO', 'Rondônia'),
('RR', 'Roraima'),
('SC', 'Santa Catarina'),
('SP', 'São Paulo'),
('SE', 'Sergipe'),
('TO', 'Tocantins');

-- Criar tabela para margens específicas por produto
CREATE TABLE public.produto_margem (
  id SERIAL PRIMARY KEY,
  id_produto INTEGER NOT NULL,
  tipo_aplicacao VARCHAR(10) NOT NULL CHECK (tipo_aplicacao IN ('estado', 'loja')),
  codigo_referencia INTEGER NOT NULL, -- cod_loja ou id do estado
  margem NUMERIC(10,2) NOT NULL,
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim DATE NOT NULL DEFAULT '2030-12-31',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_produto_margem_produto FOREIGN KEY (id_produto) REFERENCES public.cadastro_produto(id_produto)
);

-- Adicionar RLS para as novas tabelas
ALTER TABLE public.cadastro_estado ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on cadastro_estado" ON public.cadastro_estado FOR ALL USING (true);

ALTER TABLE public.produto_margem ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on produto_margem" ON public.produto_margem FOR ALL USING (true);

-- Criar índices para melhor performance
CREATE INDEX idx_produto_margem_produto ON public.produto_margem(id_produto);
CREATE INDEX idx_produto_margem_tipo_codigo ON public.produto_margem(tipo_aplicacao, codigo_referencia);
