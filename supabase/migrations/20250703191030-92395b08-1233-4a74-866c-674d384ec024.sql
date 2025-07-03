
-- Adicionar campos st_token e qtde_token na tabela cadastro_loja
ALTER TABLE public.cadastro_loja 
ADD COLUMN st_token SMALLINT DEFAULT 1,
ADD COLUMN qtde_token INTEGER DEFAULT 0;

-- Criar tabela token_loja
CREATE TABLE public.token_loja (
  id SERIAL PRIMARY KEY,
  codigo_token VARCHAR(255) UNIQUE NOT NULL,
  cod_loja INTEGER NOT NULL REFERENCES public.cadastro_loja(cod_loja),
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela token_loja_detalhado
CREATE TABLE public.token_loja_detalhado (
  id SERIAL PRIMARY KEY,
  codigo_token INTEGER NOT NULL REFERENCES public.token_loja(id),
  produto VARCHAR(255),
  qtde_solic INTEGER,
  vlr_solic NUMERIC(10,2),
  preco_min NUMERIC(10,2),
  cmg_produto NUMERIC(10,2),
  preco_regul NUMERIC(10,2),
  desconto VARCHAR(50),
  desc_alcada VARCHAR(10),
  margem_uf VARCHAR(50),
  margem_zvdc VARCHAR(50),
  observacao TEXT
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.token_loja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_loja_detalhado ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para permitir todas as operações (similar às outras tabelas)
CREATE POLICY "Allow all operations on token_loja" 
  ON public.token_loja 
  FOR ALL 
  USING (true);

CREATE POLICY "Allow all operations on token_loja_detalhado" 
  ON public.token_loja_detalhado 
  FOR ALL 
  USING (true);

-- Função para gerar código de token único
CREATE OR REPLACE FUNCTION generate_token_code() 
RETURNS TEXT AS $$
DECLARE
  token_code TEXT;
  exists_check INTEGER;
BEGIN
  LOOP
    -- Gerar código hash de 12 caracteres
    token_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 12));
    
    -- Verificar se já existe
    SELECT COUNT(*) INTO exists_check FROM public.token_loja WHERE codigo_token = token_code;
    
    -- Se não existir, sair do loop
    IF exists_check = 0 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN token_code;
END;
$$ LANGUAGE plpgsql;
