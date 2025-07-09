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
  estados: Estado[]
): ValidationResult => {
  if (!selectedProduto || !selectedLoja) {
    return { error: "Selecione uma loja e um produto" }
  }

  console.log("Validação - novoPreco:", novoPreco)
  console.log("Validação - precoAtual:", precoAtual)
  
  if (isNaN(novoPreco) || novoPreco <= 0) {
    console.log("Preço inválido - NaN ou <= 0")
    return { error: "Preço solicitado inválido" }
  }

  // Calcular preço mínimo usando a função corrigida
  const precoMinimo = calculateMinPrice(selectedProduto, selectedLoja, subgrupoMargens)
  
  console.log("Validação - precoMinimo:", precoMinimo)
  
  if (novoPreco < precoMinimo) {
    console.log("Preço menor que mínimo")
    return { error: `Desconto reprovado, devido ao preço ser inferior ao Preço Mínimo (R$ ${precoMinimo.toFixed(2)}).` }
  }

  // % Desconto válido
  if (novoPreco >= precoAtual) {
    console.log("Preço maior ou igual ao regular")
    return { error: "Desconto é inválido, preço maior que Valor Regular." }
  }

  // Validar alçada do produto
  if (selectedProduto.alcada !== 0) {
    console.log("Produto possui outras alçadas")
    return { error: "Possuí outras Alçadas para realização de Desconto." }
  }

  // Calcular margem UF loja
  const margemUFLojaPercentual = calculateUFMargin(novoPreco, selectedProduto, selectedLoja)
  
  console.log("Margem UF Loja calculada:", margemUFLojaPercentual, "%")

  // 2. Validações do Subgrupo (se aplicável) - MARGEM ZVDC
  if (selectedProduto.subgrupo_id) {
    const subgrupoMargem = subgrupoMargens.find(s => s.cod_subgrupo === selectedProduto.subgrupo_id)
    if (subgrupoMargem) {
      console.log("Validação subgrupo - margem UF Loja%:", margemUFLojaPercentual, "margem ZVDC permitida:", subgrupoMargem.margem)
      if (margemUFLojaPercentual < subgrupoMargem.margem) {
        return { 
          error: `Desconto excede a margem permitida para o subgrupo (${subgrupoMargem.margem}%).`,
          observacao: subgrupoMargem.observacao || undefined
        }
      }
    }
  }

  // 3. Validações da Loja
  if (selectedLoja.meta_loja !== 1) {
    console.log("Meta loja irregular")
    return { error: "Bloqueado devido a Meta de Desconto estar irregular." }
  }

  if (selectedLoja.dre_negativo !== 1) {
    console.log("DRE irregular")
    return { error: "Bloqueado devido a DRE estar irregular." }
  }

  // 4. Validações do Estado
  const estadoInfo = estados.find(e => e.estado === selectedLoja.estado)
  if (!estadoInfo || estadoInfo.st_ativo !== 1) {
    console.log("Estado não disponível")
    return { error: "Estado não disponível para solicitação de token." }
  }

  // Validações específicas do produto
  if (selectedProduto.st_ruptura !== 0) {
    console.log("Produto com ruptura")
    return { error: "Produto possui Ruptura de Estoque." }
  }

  if (selectedProduto.st_pricing !== 0) {
    console.log("Produto bloqueado para token")
    return { error: "Produto possui Bloqueado para solicitar Token." }
  }

  // Verificar margem UF (produto_margem) - apenas para informação, não para bloqueio
  const produtoMargem = produtoMargens.find(pm => 
    pm.id_produto === selectedProduto.id_produto && 
    pm.tipo_aplicacao === "estado" &&
    pm.codigo_referencia === estadoInfo?.id
  )

  if (produtoMargem) {
    console.log("Validação produto margem UF - margem UF Loja%:", margemUFLojaPercentual, "margem UF:", produtoMargem.margem)
    if (margemUFLojaPercentual < produtoMargem.margem) {
      return { 
        error: "Desconto token reprovado, devido a margem UF.",
        observacao: produtoMargem.observacao || undefined
      }
    }
  }

  console.log("Validação passou - token aprovado")
  return { error: null }
}
