
import { Produto, Loja, SubgrupoMargem, ProdutoMargem } from "@/types/vendas"
import { calculateMinPrice, calculateUFMargin } from "./priceCalculations"

export interface AdditionalInfo {
  precoMinimo: number
  cmgProduto: number
  descontoAlcada: string
  margemUF: string
  margem: string
  margemAdc: string
  aliqUF: number
  piscofinsUF: number
  ruptura: number
}

export const calculateAdditionalInfo = (
  selectedProduto: Produto | null,
  selectedLoja: Loja | null,
  novoPreco: number,
  subgrupoMargens: SubgrupoMargem[],
  produtoMargens: ProdutoMargem[],
  estadoId?: number
): AdditionalInfo | null => {
  if (!selectedProduto || !selectedLoja) {
    return null
  }

  // Buscar produto_margem ativo para o produto
  const dataAtual = new Date()
  const produtoMargem = produtoMargens.find(pm => {
    const dataInicio = new Date(pm.data_inicio)
    const dataFim = new Date(pm.data_fim)
    
    let vinculacaoCorreta = false
    if (pm.tipo_aplicacao === "estado") {
      vinculacaoCorreta = pm.tipo_referencia === estadoId?.toString()
    } else if (pm.tipo_aplicacao === "loja") {
      vinculacaoCorreta = pm.tipo_referencia === selectedLoja.cod_loja.toString()
    }
    
    return pm.id_produto === selectedProduto.id_produto && 
           vinculacaoCorreta &&
           pm.st_ativo === 1 &&
           dataInicio <= dataAtual &&
           dataFim >= dataAtual
  })

  // Buscar subgrupo_margem se não encontrou produto_margem
  const subgrupoMargem = !produtoMargem && selectedProduto.subgrupo_id 
    ? subgrupoMargens.find(s => 
        s.cod_subgrupo === selectedProduto.subgrupo_id &&
        s.st_ativo === 1 &&
        (!s.data_inicio || new Date(s.data_inicio) <= dataAtual) &&
        (!s.data_fim || new Date(s.data_fim) >= dataAtual)
      )
    : null

  const precoMinimo = calculateMinPrice(selectedProduto, selectedLoja, subgrupoMargens)
  const margemUF = calculateUFMargin(novoPreco, selectedProduto, selectedLoja)

  const estado = selectedLoja.estado.toLowerCase()
  let cmgProduto = 0
  let aliqUF = 0

  if (estado === 'rs') {
    cmgProduto = selectedProduto.cmg_rs || 0
    aliqUF = selectedProduto.aliq_rs || 0
  } else if (estado === 'sc') {
    cmgProduto = selectedProduto.cmg_sc || 0
    aliqUF = selectedProduto.aliq_sc || 0
  } else if (estado === 'pr') {
    cmgProduto = selectedProduto.cmg_pr || 0
    aliqUF = selectedProduto.aliq_pr || 0
  }

  // Obter margens baseadas na fonte (produto_margem ou subgrupo_margem)
  let margem = "N/A"
  let margemAdc = "N/A"
  
  if (produtoMargem) {
    // Usar margens do produto_margem
    if (produtoMargem.tipo_margem === "valor") {
      margem = `R$ ${produtoMargem.margem.toFixed(2)}`
      if (produtoMargem.margem_adc) {
        margemAdc = `R$ ${produtoMargem.margem_adc.toFixed(2)}`
      }
    } else {
      margem = `${produtoMargem.margem.toFixed(2)}%`
      if (produtoMargem.margem_adc) {
        margemAdc = `${produtoMargem.margem_adc.toFixed(2)}%`
      }
    }
  } else if (subgrupoMargem) {
    // Usar margens do subgrupo_margem (sempre percentual)
    margem = `${subgrupoMargem.margem.toFixed(2)}%`
    if (subgrupoMargem.margem_adc) {
      margemAdc = `${subgrupoMargem.margem_adc.toFixed(2)}%`
    }
  }

  return {
    precoMinimo,
    cmgProduto,
    descontoAlcada: selectedProduto.alcada === 0 ? "SEM OUTROS" : "COM OUTROS",
    margemUF: `${margemUF.toFixed(2)}%`,
    margem,
    margemAdc,
    aliqUF,
    piscofinsUF: selectedProduto.piscofins || 0,
    ruptura: selectedProduto.st_ruptura || 0
  }
}
