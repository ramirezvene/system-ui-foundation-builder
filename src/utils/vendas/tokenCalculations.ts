
import { Produto, Loja, SubgrupoMargem, ProdutoMargem } from "@/types/vendas"
import { calculateMinPrice, getCMGForState } from "./priceCalculations"

export interface AdditionalInfo {
  precoMinimo: number
  cmgProduto: number
  descontoAlcada: string
  margemUF: string
  margemZVDC: string
  aliqUF: number
  piscofinsUF: number
  ruptura: number
}

export const calculateAdditionalInfo = (
  selectedProduto: Produto | null,
  selectedLoja: Loja | null,
  novoPreco: number,
  subgrupoMargens: SubgrupoMargem[],
  produtoMargens?: ProdutoMargem[],
  estadoId?: number
): AdditionalInfo | null => {
  if (!selectedProduto || !selectedLoja) return null

  const estado = selectedLoja.estado.toLowerCase()
  let aliq = 0
  let piscofins = 0
  
  if (estado === 'rs') {
    aliq = selectedProduto.aliq_rs || 0
    piscofins = selectedProduto.piscofins || 0
  } else if (estado === 'sc') {
    aliq = (selectedProduto.aliq_sc || 0) / 100
    piscofins = selectedProduto.piscofins || 0
  } else if (estado === 'pr') {
    aliq = selectedProduto.aliq_pr || 0
    piscofins = selectedProduto.piscofins || 0
  }

  const precoMinimo = calculateMinPrice(selectedProduto, selectedLoja, subgrupoMargens)
  const cmgProduto = getCMGForState(selectedProduto, selectedLoja)

  const descontoAlcada = selectedProduto.alcada === 0 ? "SEM ALÇADA" : "COM ALÇADA"
  
  const margemUFLoja = (novoPreco * (1 - ((aliq / 100) + (piscofins / 100))) - cmgProduto) / (novoPreco * (1 - ((aliq / 100) + (piscofins / 100))))
  const margemUF = `${(margemUFLoja * 100).toFixed(2)}%`
  
  // Hierarquia ZVDC: primeiro produto_margem, depois subgrupo_margem
  let margemZVDC = "N/A"
  const dataAtual = new Date()
  
  // 1. Verificar produto_margem primeiro
  if (produtoMargens && estadoId) {
    const produtoMargem = produtoMargens.find(pm => 
      pm.id_produto === selectedProduto.id_produto && 
      pm.tipo_aplicacao === "estado" &&
      pm.codigo_referencia === estadoId &&
      new Date(pm.data_inicio) <= dataAtual &&
      new Date(pm.data_fim) >= dataAtual
    )
    
    if (produtoMargem) {
      if (produtoMargem.tipo_margem === "percentual") {
        margemZVDC = `${produtoMargem.margem}%`
      } else {
        margemZVDC = `R$ ${produtoMargem.margem.toFixed(2)}`
      }
    }
  }
  
  // 2. Se não encontrou produto_margem, verificar subgrupo_margem
  if (margemZVDC === "N/A" && selectedProduto.subgrupo_id) {
    const subgrupoMargem = subgrupoMargens.find(s => 
      s.cod_subgrupo === selectedProduto.subgrupo_id &&
      (!s.data_inicio || new Date(s.data_inicio) <= dataAtual) &&
      (!s.data_fim || new Date(s.data_fim) >= dataAtual)
    )
    
    if (subgrupoMargem) {
      margemZVDC = `${subgrupoMargem.margem}%`
    }
  }

  return {
    precoMinimo,
    cmgProduto,
    descontoAlcada,
    margemUF,
    margemZVDC,
    aliqUF: aliq,
    piscofinsUF: piscofins,
    ruptura: selectedProduto.st_ruptura || 0
  }
}
