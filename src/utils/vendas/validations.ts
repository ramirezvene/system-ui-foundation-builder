
import { Produto, Loja, ProdutoMargem, SubgrupoMargem, Estado } from "@/types/vendas"
import { calculateMinPrice, calculateUFMargin } from "./priceCalculations"

export interface ValidationResult {
  error: string | null
  observacao?: string
}

export const validateHierarchy = (
  selectedProduto: Produto | null,
  selectedLoja: Loja | null,
  novoPreco: number,
  precoAtual: number,
  produtoMargens: ProdutoMargem[],
  subgrupoMargens: SubgrupoMargem[],
  estados: Estado[],
  clienteIdentificado: boolean = false
): ValidationResult => {
  if (!selectedProduto || !selectedLoja) {
    return { error: "Selecione uma loja e um produto" }
  }

  console.log("Validação - novoPreco:", novoPreco)
  console.log("Validação - precoAtual:", precoAtual)
  console.log("Validação - clienteIdentificado:", clienteIdentificado)
  
  if (isNaN(novoPreco) || novoPreco <= 0) {
    console.log("Preço inválido - NaN ou <= 0")
    return { error: "Preço solicitado inválido" }
  }

  // ETAPA 1: Validar Estado
  const estadoInfo = estados.find(e => e.estado === selectedLoja.estado)
  if (!estadoInfo || estadoInfo.st_ativo !== 1) {
    console.log("Estado sem permissão")
    return { error: "Estado sem permissão solicitação." }
  }

  // ETAPA 2: Validar Loja
  // 2.1 - Status token da loja
  if (selectedLoja.st_token !== 1) {
    console.log("Loja sem permissão")
    return { error: "Loja sem permissão solicitação." }
  }

  // 2.2 - Quantidade de tokens disponíveis
  if ((selectedLoja.qtde_token || 0) <= 0) {
    console.log("Loja sem tokens disponíveis")
    return { error: "Não possuí token disponível." }
  }

  // ETAPA 3: Validar Produto (PRIORIDADE ABSOLUTA - sempre verificar primeiro)
  const dataAtual = new Date()
  const produtoMargem = produtoMargens.find(pm => 
    pm.id_produto === selectedProduto.id_produto && 
    pm.tipo_aplicacao === "estado" &&
    new Date(pm.data_inicio) <= dataAtual &&
    new Date(pm.data_fim) >= dataAtual &&
    pm.st_ativo === 1
  )

  if (produtoMargem) {
    console.log("Validação produto margem encontrada - PRIORIDADE ABSOLUTA")
    
    // 3.1 - Status pricing do produto
    if (selectedProduto.st_pricing !== 0) {
      console.log("Produto com pricing desativado")
      return { error: "Desativado Pricing Produto." }
    }

    // 3.2 - Status ruptura do produto
    if (selectedProduto.st_ruptura !== 0) {
      console.log("Produto com ruptura")
      return { error: "Produto Ruptura." }
    }

    // 3.3 - Preço mínimo
    const precoMinimo = calculateMinPrice(selectedProduto, selectedLoja, subgrupoMargens)
    if (novoPreco < precoMinimo) {
      console.log("Preço menor que mínimo")
      return { error: "Menor que Preço Mínimo." }
    }

    // 3.4 - Preço regular
    if (novoPreco >= precoAtual) {
      console.log("Preço maior que regular")
      return { error: "Maior que Preço Regular." }
    }

    // 3.5 - % Desconto máximo do produto (PRIORIDADE - deve ser validado aqui)
    const percentualDesconto = ((precoAtual - novoPreco) / precoAtual) * 100
    if (produtoMargem.desconto && percentualDesconto > produtoMargem.desconto) {
      console.log("Desconto maior que máximo do produto - REJEITADO")
      return { 
        error: "Maior que desconto máximo Produto.",
        observacao: produtoMargem.observacao || undefined
      }
    }

    // 3.6 - Outros descontos (alçada)
    if (selectedProduto.alcada !== 0) {
      console.log("Produto possui outros descontos")
      return { error: "Outros descontos, não permite." }
    }

    // 3.7 - Data de vigência já validada no find acima

    // 3.8 e 3.9 - Margem UF considerando cliente identificado
    const margemUFLojaPercentual = calculateUFMargin(novoPreco, selectedProduto, selectedLoja)
    
    if (clienteIdentificado) {
      // 3.8 - Com cliente identificado, considera margem adicional ou margem
      const margemRequerida = produtoMargem.margem_adc || produtoMargem.margem
      if (margemUFLojaPercentual < margemRequerida) {
        return { 
          error: `Margem UF Loja (${margemUFLojaPercentual.toFixed(2)}%) menor que margem requerida do produto (${margemRequerida.toFixed(2)}%).`,
          observacao: produtoMargem.observacao || undefined
        }
      }
    } else {
      // 3.9 - Sem cliente identificado, considera apenas margem
      if (margemUFLojaPercentual < produtoMargem.margem) {
        return { 
          error: `Margem UF Loja (${margemUFLojaPercentual.toFixed(2)}%) menor que margem requerida do produto (${produtoMargem.margem.toFixed(2)}%).`,
          observacao: produtoMargem.observacao || undefined
        }
      }
    }

    // Se chegou aqui e passou em TODAS as validações do produto, vai direto para etapa 5 (Loja)
    // NÃO VAI PARA O SUBGRUPO - o produto tem prioridade absoluta
    console.log("Produto passou em TODAS as validações - indo DIRETO para validação da loja (sem subgrupo)")
    return validateLoja(selectedLoja)
  }

  // ETAPA 4: Validar Subgrupo (SOMENTE se NÃO tem produto_margem ativo)
  console.log("Não encontrou produto_margem ativo - validando subgrupo")
  
  if (selectedProduto.subgrupo_id) {
    const subgrupoMargem = subgrupoMargens.find(s => 
      s.cod_subgrupo === selectedProduto.subgrupo_id &&
      (!s.data_inicio || new Date(s.data_inicio) <= dataAtual) &&
      (!s.data_fim || new Date(s.data_fim) >= dataAtual)
    )
    
    if (!subgrupoMargem) {
      return { error: "Não possúi produto/subgrupo token Desconto." }
    }

    // 4.1 - Status ativo do subgrupo
    if (subgrupoMargem.st_ativo !== 1) {
      console.log("Subgrupo desativado")
      return { error: "Desativado Pricing Subgrupo." }
    }

    const margemUFLojaPercentual = calculateUFMargin(novoPreco, selectedProduto, selectedLoja)

    if (clienteIdentificado) {
      // 4.2 - Com cliente identificado, considera margem adicional ou margem
      const margemRequerida = subgrupoMargem.margem_adc || subgrupoMargem.margem
      if (margemUFLojaPercentual < margemRequerida) {
        return { 
          error: `Margem UF Loja (${margemUFLojaPercentual.toFixed(2)}%) menor que margem requerida do subgrupo (${margemRequerida.toFixed(2)}%).`,
          observacao: subgrupoMargem.observacao || undefined
        }
      }
    } else {
      // 4.3 - Sem cliente identificado, considera apenas margem
      if (margemUFLojaPercentual < subgrupoMargem.margem) {
        return { 
          error: "Não possuí margem produto/subgrupo.",
          observacao: subgrupoMargem.observacao || undefined
        }
      }
    }

    // 4.4 - % Desconto máximo do subgrupo (SOMENTE se não passou pelo produto)
    const percentualDesconto = ((precoAtual - novoPreco) / precoAtual) * 100
    if (subgrupoMargem.desconto && percentualDesconto > subgrupoMargem.desconto) {
      console.log("Desconto maior que máximo do subgrupo")
      return { 
        error: "Maior que desconto máximo Subgrupo.",
        observacao: subgrupoMargem.observacao || undefined
      }
    }

    // 4.5 - Data de vigência já validada no find acima
  } else {
    return { error: "Não possúi produto/subgrupo token Desconto." }
  }

  // ETAPA 5: Validar Loja final
  return validateLoja(selectedLoja)
}

const validateLoja = (selectedLoja: Loja): ValidationResult => {
  // 5.1 - Meta da loja
  if (selectedLoja.meta_loja !== 1) {
    console.log("Meta loja irregular")
    return { error: "Meta Loja Irregular" }
  }

  // 5.2 - DRE da loja
  if (selectedLoja.dre_negativo !== 1) {
    console.log("DRE irregular")
    return { error: "DRE Loja Irregular" }
  }

  console.log("Validação passou - token aprovado")
  return { error: null }
}
