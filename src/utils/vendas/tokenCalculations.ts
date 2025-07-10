
import { Produto, Loja, SubgrupoMargem } from "@/types/vendas"
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
  subgrupoMargens: SubgrupoMargem[]
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
    piscofins = (selectedProduto.piscofins || 0) / 100
  } else if (estado === 'pr') {
    aliq = (selectedProduto.aliq_pr || 0) / 100
    piscofins = (selectedProduto.piscofins || 0) / 100
  }

  const precoMinimo = calculateMinPrice(selectedProduto, selectedLoja, subgrupoMargens)
  const cmgProduto = getCMGForState(selectedProduto, selectedLoja)

  const descontoAlcada = selectedProduto.alcada === 0 ? "SEM ALÇADA" : "COM ALÇADA"
  
  const margemUFLoja = ((novoPreco * (1 - ((aliq / 100) + (piscofins / 100))) - cmgProduto) / (novoPreco * (1 - ((aliq / 100) + (piscofins / 100))))
  const margemUF = `${(margemUFLoja * 100).toFixed(2)}%`
  
  const margemZVDC = selectedProduto.subgrupo_id ? 
    (subgrupoMargens.find(s => s.cod_subgrupo === selectedProduto.subgrupo_id)?.margem + "%" || "N/A") : 
    "N/A"

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
