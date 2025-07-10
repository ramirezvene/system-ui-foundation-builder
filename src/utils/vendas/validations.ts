
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

  // Validar se a loja possui tokens disponíveis
  if ((selectedLoja.qtde_token || 0) <= 0) {
    console.log("Loja sem tokens disponíveis")
    return { error: "Não possui Token Disponível para a loja." }
  }

  // Validar se a loja possui status token ativo
  if (selectedLoja.st_token !== 1) {
    console.log("Loja com status token inativo")
    return { error: "Loja com status de token inativo." }
  }

  // Validar se o Estado está ativo
  const estadoInfo = estados.find(e => e.estado === selectedLoja.estado)
  if (!estadoInfo || estadoInfo.st_ativo !== 1) {
    console.log("Estado não disponível")
    return { error: "Estado não disponível para solicitação de token." }
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

  // Verificar hierarquia: primeiro produto_margem, depois subgrupo_margem
  const dataAtual = new Date()
  
  // 1. Verificar margem do produto (produto_margem) - primeira prioridade
  const produtoMargem = produtoMargens.find(pm => 
    pm.id_produto === selectedProduto.id_produto && 
    pm.tipo_aplicacao === "estado" &&
    pm.codigo_referencia === estadoInfo?.id &&
    new Date(pm.data_inicio) <= dataAtual &&
    new Date(pm.data_fim) >= dataAtual
  )

  if (produtoMargem) {
    console.log("Validação produto margem - margem UF Loja%:", margemUFLojaPercentual, "margem UF:", produtoMargem.margem)
    
    // Validação ZVDC: valor solicitado não pode ser menor que margem ZVDC
    if (produtoMargem.tipo_margem === "percentual") {
      if (margemUFLojaPercentual < produtoMargem.margem) {
        return { 
          error: produtoMargem.observacao || "Desconto token reprovado, devido a margem UF.",
          observacao: produtoMargem.observacao || undefined
        }
      }
    } else {
      // Se for valor fixo, comparar diretamente com o valor solicitado
      if (novoPreco < produtoMargem.margem) {
        return {
          error: produtoMargem.observacao || `Valor solicitado (R$ ${novoPreco.toFixed(2)}) é menor que a margem ZVDC (R$ ${produtoMargem.margem.toFixed(2)}).`,
          observacao: produtoMargem.observacao || undefined
        }
      }
    }
  } else {
    // 2. Se não tem produto_margem, verificar subgrupo_margem
    if (selectedProduto.subgrupo_id) {
      const subgrupoMargem = subgrupoMargens.find(s => 
        s.cod_subgrupo === selectedProduto.subgrupo_id &&
        (!s.data_inicio || new Date(s.data_inicio) <= dataAtual) &&
        (!s.data_fim || new Date(s.data_fim) >= dataAtual)
      )
      
      if (subgrupoMargem) {
        console.log("Validação subgrupo - margem UF Loja%:", margemUFLojaPercentual, "margem ZVDC permitida:", subgrupoMargem.margem)
        
        // Validação ZVDC: valor solicitado não pode ser menor que margem ZVDC (sempre percentual para subgrupo)
        if (margemUFLojaPercentual < subgrupoMargem.margem) {
          return { 
            error: subgrupoMargem.observacao || `Desconto excede a margem permitida para o subgrupo (${subgrupoMargem.margem}%).`,
            observacao: subgrupoMargem.observacao || undefined
          }
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

  // Validações específicas do produto
  if (selectedProduto.st_ruptura !== 0) {
    console.log("Produto com ruptura")
    return { error: "Produto possui Ruptura de Estoque." }
  }

  if (selectedProduto.st_pricing !== 0) {
    console.log("Produto bloqueado para token")
    return { error: "Produto possui Bloqueado para solicitar Token." }
  }

  console.log("Validação passou - token aprovado")
  return { error: null }
}
