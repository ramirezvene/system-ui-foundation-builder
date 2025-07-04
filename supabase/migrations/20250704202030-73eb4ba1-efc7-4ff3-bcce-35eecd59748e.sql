
-- Inserir 200 registros de tokens aleatórios com st_aprovado = null
DO $$
DECLARE
    i INTEGER;
    random_loja INTEGER;
    random_produto_id INTEGER;
    random_valor NUMERIC;
    token_code VARCHAR;
    token_id INTEGER;
    produto_nome VARCHAR;
BEGIN
    FOR i IN 1..200 LOOP
        -- Selecionar uma loja aleatória
        SELECT cod_loja INTO random_loja 
        FROM cadastro_loja 
        ORDER BY RANDOM() 
        LIMIT 1;
        
        -- Gerar código do token
        SELECT generate_token_code() INTO token_code;
        
        -- Inserir token_loja com st_aprovado = null
        INSERT INTO token_loja (codigo_token, cod_loja, st_aprovado, data_criacao)
        VALUES (token_code, random_loja, NULL, NOW() - (RANDOM() * INTERVAL '30 days'))
        RETURNING id INTO token_id;
        
        -- Selecionar um produto aleatório
        SELECT id_produto, nome_produto INTO random_produto_id, produto_nome
        FROM cadastro_produto 
        ORDER BY RANDOM() 
        LIMIT 1;
        
        -- Gerar valor aleatório entre 10.00 e 500.00
        random_valor := (RANDOM() * 490 + 10)::NUMERIC(10,2);
        
        -- Inserir token_loja_detalhado
        INSERT INTO token_loja_detalhado (
            codigo_token, 
            produto, 
            qtde_solic, 
            vlr_solic,
            preco_min,
            cmg_produto,
            preco_regul,
            desconto,
            desc_alcada,
            margem_uf,
            margem_zvdc,
            observacao
        ) VALUES (
            token_id,
            produto_nome,
            1,
            random_valor,
            random_valor * 0.9,
            random_valor * 0.7,
            random_valor * 1.1,
            '10.00%',
            'NÃO',
            '15.00%',
            '20.00%',
            'Token gerado automaticamente'
        );
    END LOOP;
END $$;
