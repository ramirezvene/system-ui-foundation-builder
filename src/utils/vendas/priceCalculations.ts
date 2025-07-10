
import { Produto, Loja, ProdutoMargem, SubgrupoMargem } from "@/types/vendas"

export const calculateMinPrice = (
  produto: Produto,
  loja: Loja,
  subgrupoMargens: SubgrupoMargem[]
): number => {
  const estado = loja.estado.toLowerCase()
  let cmgProduto = 0
  let aliq = 0
  let piscofins = 0
  
  if (estado === 'rs') {
    cmgProduto = produto.cmg_rs || 0
    aliq = (produto.aliq_rs || 0) / 100  // Removido divisão por 100
    piscofins = (produto.piscofins || 0) / 100  // Removido divisão por 100
  } else if (estado === 'sc') {
    cmgProduto = produto.cmg_sc || 0
    aliq = produto.aliq_sc || 0  // Removido divisão por 100
    piscofins = produto.piscofins || 0  // Removido divisão por 100
  } else if (estado === 'pr') {
    cmgProduto = produto.cmg_pr || 0
    aliq = produto.aliq_pr || 0  // Removido divisão por 100
    piscofins = produto.piscofins || 0  // Removido divisão por 100
  }

  // Cálculo exato conforme especificado: (cmgProduto / denominador1) / denominador2
  let precoMinimo = 0
  if (produto.subgrupo_id) {
    const subgrupoMargem = subgrupoMargens.find(s => s.cod_subgrupo === produto.subgrupo_id)
    if (subgrupoMargem) {
      const margemSubgrupo = subgrupoMargem.margem / 100  // Esta divisão mantida porque margem está em %
      const denominador1 = 1 - (aliq + piscofins)
      const denominador2 = 1 - margemSubgrupo
      
      console.log("Cálculo Preço Mínimo:")
      console.log("CMG Produto:", cmgProduto)
      console.log("ALIQ:", aliq)
      console.log("PISCOFINS:", piscofins)
      console.log("Margem Subgrupo:", margemSubgrupo)
      console.log("Denominador1 (1 - (aliq + piscofins)):", denominador1)
      console.log("Denominador2 (1 - margemSubgrupo):", denominador2)
      
      precoMinimo = (cmgProduto / denominador1) / denominador2
      
      console.log("Preço Mínimo Calculado:", precoMinimo)
    }
  }

  return precoMinimo
}

export const calculateUFMargin = (
  novoPreco: number,
  produto: Produto,
  loja: Loja
): number => {
  const estado = loja.estado.toLowerCase()
  let cmgProduto = 0
  let aliq = 0
  let piscofins = 0
  
  if (estado === 'rs') {
    cmgProduto = produto.cmg_rs || 0
    aliq = produto.aliq_rs || 0  // Removido divisão por 100
    piscofins = produto.piscofins || 0  // Removido divisão por 100
  } else if (estado === 'sc') {
    cmgProduto = produto.cmg_sc || 0
    aliq = produto.aliq_sc || 0  // Removido divisão por 100
    piscofins = produto.piscofins || 0  // Removido divisão por 100
  } else if (estado === 'pr') {
    cmgProduto = produto.cmg_pr || 0
    aliq = produto.aliq_pr || 0  // Removido divisão por 100
    piscofins = produto.piscofins || 0  // Removido divisão por 100
  }

  const margemUFLoja = ((novoPreco * (1 - (aliq + piscofins))) - cmgProduto) / (novoPreco * (1 - (aliq + piscofins)))
  return margemUFLoja * 100
}

export const getCMGForState = (produto: Produto, loja: Loja): number => {
  const estado = loja.estado.toLowerCase()
  
  if (estado === 'rs') {
    return produto.cmg_rs || 0
  } else if (estado === 'sc') {
    return produto.cmg_sc || 0
  } else if (estado === 'pr') {
    return produto.cmg_pr || 0
  }
  
  return 0
}
