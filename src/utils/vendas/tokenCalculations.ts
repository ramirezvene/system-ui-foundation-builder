
import { Produto, Loja, SubgrupoMargem, ProdutoMargem } from "@/types/vendas"
import { calculateMinPrice, calculateUFMargin } from "./priceCalculations"

export interface AdditionalInfo {
  precoMinimo: number
  subgrupo: string
  margemCalculo: string
  margem: string
  margemAdc: string
  cmvLoja: number
  cmvEstado: number
  icms: number
  pis: number
  cofins: number
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
  const margemCalculo = calculateUFMargin(novoPreco, selectedProduto, selectedLoja)

  const estado = selectedLoja.estado.toLowerCase()
  let cmvEstado = 0
  let icms = 0

  if (estado === 'rs') {
    cmvEstado = selectedProduto.cmg_rs || 0
    icms = selectedProduto.aliq_rs || 0
  } else if (estado === 'sc') {
    cmvEstado = selectedProduto.cmg_sc || 0
    icms = selectedProduto.aliq_sc || 0
  } else if (estado === 'pr') {
    cmvEstado = selectedProduto.cmg_pr || 0
    icms = selectedProduto.aliq_pr || 0
  }

  // CMV Loja (usando o CMV do estado por loja)
  const cmvLoja = cmvEstado

  // PIS e COFINS (usando piscofins combinado e dividindo)
  const piscofins = selectedProduto.piscofins || 0
  const pis = piscofins * 0.38 // Aproximação: PIS representa ~38% do total PIS+COFINS
  const cofins = piscofins * 0.62 // Aproximação: COFINS representa ~62% do total PIS+COFINS

  // Nome do subgrupo
  const subgrupoNome = subgrupoMargem?.nome_subgrupo || selectedProduto.subgrupo_id?.toString() || "N/A"

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
    subgrupo: subgrupoNome,
    margemCalculo: `${margemCalculo.toFixed(2)}%`,
    margem,
    margemAdc,
    cmvLoja,
    cmvEstado,
    icms,
    pis,
    cofins,
    ruptura: selectedProduto.st_ruptura || 0
  }
}
