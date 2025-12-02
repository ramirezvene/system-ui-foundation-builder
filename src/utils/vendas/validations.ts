
import { Produto, Loja, ProdutoMargem, SubgrupoMargem, Estado, RegraAplicada } from "@/types/vendas"
import { calculateMinPrice, calculateUFMargin } from "./priceCalculations"

export interface ValidationResult {
  error: string | null
  observacao?: string
  regraAplicada?: RegraAplicada
  regraId?: number | string
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
    return { error: "Estado sem permissão solicitação.", regraAplicada: "estado", regraId: estadoInfo?.id }
  }

  // ETAPA 2: Validar Loja
  // 2.1 - Status token da loja
  if (selectedLoja.st_token !== 1) {
    console.log("Loja sem permissão")
    return { error: "Loja sem permissão solicitação.", regraAplicada: "loja", regraId: selectedLoja.cod_loja }
  }

  // 2.2 - Quantidade de tokens disponíveis
  if ((selectedLoja.qtde_token || 0) <= 0) {
    console.log("Loja sem tokens disponíveis")
    return { error: "Não possuí token disponível.", regraAplicada: "token", regraId: selectedLoja.cod_loja }
  }

  // ETAPA 3: Validar Produto
  const dataAtual = new Date()
  console.log("Buscando produto_margem para produto:", selectedProduto.id_produto)
  console.log("Produtos margens disponíveis:", produtoMargens.length)
  
  // Buscar produto_margem ativo considerando data de vigência e vinculação correta
  const produtoMargem = produtoMargens.find(pm => {
    console.log("Verificando produto_margem:", {
      id: pm.id,
      id_produto: pm.id_produto,
      tipo_aplicacao: pm.tipo_aplicacao,
      tipo_referencia: pm.tipo_referencia,
      st_ativo: pm.st_ativo,
      data_inicio: pm.data_inicio,
      data_fim: pm.data_fim,
      tipo_margem: pm.tipo_margem
    })
    
    const dataInicio = new Date(pm.data_inicio)
    const dataFim = new Date(pm.data_fim)
    
    // Verificar vinculação baseada no tipo_aplicacao
    let vinculacaoCorreta = false
    if (pm.tipo_aplicacao === "estado") {
      // Vincular com cadastro_estado.id usando tipo_referencia
      vinculacaoCorreta = pm.tipo_referencia === estadoInfo.id.toString()
      console.log("Vinculação estado:", {
        tipo_referencia: pm.tipo_referencia,
        estadoId: estadoInfo.id.toString(),
        match: vinculacaoCorreta
      })
    } else if (pm.tipo_aplicacao === "loja") {
      // Vincular com cadastro_loja.cod_loja usando tipo_referencia
      vinculacaoCorreta = pm.tipo_referencia === selectedLoja.cod_loja.toString()
      console.log("Vinculação loja:", {
        tipo_referencia: pm.tipo_referencia,
        lojaId: selectedLoja.cod_loja.toString(),
        match: vinculacaoCorreta
      })
    }
    
    const isValid = pm.id_produto === selectedProduto.id_produto && 
                   vinculacaoCorreta &&
                   pm.st_ativo === 1 &&
                   dataInicio <= dataAtual &&
                   dataFim >= dataAtual
    
    console.log("Produto válido?", isValid, {
      produtoMatch: pm.id_produto === selectedProduto.id_produto,
      vinculacaoCorreta: vinculacaoCorreta,
      ativo: pm.st_ativo === 1,
      dataInicioOk: dataInicio <= dataAtual,
      dataFimOk: dataFim >= dataAtual
    })
    
    return isValid
  })

  // Determinar tipo de regra aplicada para produto
  const regraAplicadaProduto: RegraAplicada = produtoMargem?.tipo_aplicacao === "loja" ? "produto_loja" : "produto_estado"
  const regraIdProduto = produtoMargem?.id

  if (produtoMargem) {
    console.log("Produto_margem encontrado - APLICANDO TODAS as validações do produto")
    
    // 3.1 - Status pricing do produto
    if (selectedProduto.st_pricing !== 0) {
      console.log("Produto com pricing desativado")
      return { error: "Desativado Pricing Produto.", regraAplicada: regraAplicadaProduto, regraId: regraIdProduto }
    }

    // 3.2 - Status ruptura do produto
    if (selectedProduto.st_ruptura !== 0) {
      console.log("Produto com ruptura")
      return { error: "Produto Ruptura.", regraAplicada: regraAplicadaProduto, regraId: regraIdProduto }
    }

    // 3.3 - Preço mínimo
    const precoMinimo = calculateMinPrice(selectedProduto, selectedLoja, subgrupoMargens)
    if (novoPreco < precoMinimo) {
      console.log("Preço menor que mínimo")
      return { error: "Menor que Preço Mínimo.", regraAplicada: regraAplicadaProduto, regraId: regraIdProduto }
    }

    // 3.4 - Preço regular
    if (novoPreco >= precoAtual) {
      console.log("Preço maior ou igual que regular")
      return { error: "Maior que Preço Regular.", regraAplicada: regraAplicadaProduto, regraId: regraIdProduto }
    }

    // 3.5 - % Desconto máximo do produto (PRIORIDADE ABSOLUTA)
    const percentualDesconto = ((precoAtual - novoPreco) / precoAtual) * 100
    if (produtoMargem.desconto && percentualDesconto > produtoMargem.desconto) {
      console.log("Desconto maior que máximo do produto - REJEITADO")
      return { 
        error: "Maior que desconto máximo Produto.",
        observacao: produtoMargem.observacao || undefined,
        regraAplicada: regraAplicadaProduto,
        regraId: regraIdProduto
      }
    }

    // 3.6 - Outros descontos (alçada)
    if (selectedProduto.alcada !== 0) {
      console.log("Produto possui outros descontos")
      return { error: "Outros descontos, não permite.", regraAplicada: regraAplicadaProduto, regraId: regraIdProduto }
    }

    // 3.7 - Data de vigência já validada na busca

    // 3.8 e 3.9 - Validação de margem baseada no tipo_margem
    console.log("Validando margem do produto_margem:", {
      tipo_margem: produtoMargem.tipo_margem,
      margem: produtoMargem.margem,
      margem_adc: produtoMargem.margem_adc,
      clienteIdentificado: clienteIdentificado
    })

    if (produtoMargem.tipo_margem === "valor") {
      // Validação por valor - verifica se o preço solicitado é >= margem
      if (clienteIdentificado) {
        // Com cliente identificado, considera margem adicional ou margem
        const margemRequerida = produtoMargem.margem_adc || produtoMargem.margem
        if (novoPreco < margemRequerida) {
          return { 
            error: `Preço solicitado (${novoPreco.toFixed(2)}) menor que margem requerida do produto (${margemRequerida.toFixed(2)}).`,
            observacao: produtoMargem.observacao || undefined,
            regraAplicada: regraAplicadaProduto,
            regraId: regraIdProduto
          }
        }
      } else {
        // Sem cliente identificado, considera apenas margem
        if (novoPreco < produtoMargem.margem) {
          return { 
            error: `Preço solicitado (${novoPreco.toFixed(2)}) menor que margem requerida do produto (${produtoMargem.margem.toFixed(2)}).`,
            observacao: produtoMargem.observacao || undefined,
            regraAplicada: regraAplicadaProduto,
            regraId: regraIdProduto
          }
        }
      }
    } else {
      // Validação por percentual - usa margem UF
      const margemUFLojaPercentual = calculateUFMargin(novoPreco, selectedProduto, selectedLoja)
      
      if (clienteIdentificado) {
        // Com cliente identificado, considera margem adicional ou margem
        const margemRequerida = produtoMargem.margem_adc || produtoMargem.margem
        if (margemUFLojaPercentual < margemRequerida) {
          return { 
            error: `Margem UF Loja (${margemUFLojaPercentual.toFixed(2)}%) menor que margem requerida do produto (${margemRequerida.toFixed(2)}%).`,
            observacao: produtoMargem.observacao || undefined,
            regraAplicada: regraAplicadaProduto,
            regraId: regraIdProduto
          }
        }
      } else {
        // Sem cliente identificado, considera apenas margem
        if (margemUFLojaPercentual < produtoMargem.margem) {
          return { 
            error: `Margem UF Loja (${margemUFLojaPercentual.toFixed(2)}%) menor que margem requerida do produto (${produtoMargem.margem.toFixed(2)}%).`,
            observacao: produtoMargem.observacao || undefined,
            regraAplicada: regraAplicadaProduto,
            regraId: regraIdProduto
          }
        }
      }
    }

    // Se chegou aqui, produto passou em TODAS as validações - vai direto para loja
    console.log("Produto passou em TODAS as validações - indo DIRETO para validação da loja")
    return validateLoja(selectedLoja, regraAplicadaProduto, regraIdProduto)
  }

  // ETAPA 4: Validar Subgrupo (SOMENTE se NÃO encontrou produto_margem ativo/válido)
  console.log("Não encontrou produto_margem ativo/válido - validando subgrupo")
  
  if (selectedProduto.subgrupo_id) {
    const subgrupoMargem = subgrupoMargens.find(s => 
      s.cod_subgrupo === selectedProduto.subgrupo_id &&
      s.st_ativo === 1 &&
      (!s.data_inicio || new Date(s.data_inicio) <= dataAtual) &&
      (!s.data_fim || new Date(s.data_fim) >= dataAtual)
    )
    
    if (!subgrupoMargem) {
      return { error: "Não possúi produto/subgrupo token Desconto.", regraAplicada: "subgrupo" }
    }

    const regraIdSubgrupo = subgrupoMargem.cod_subgrupo

    console.log("Subgrupo_margem encontrado:", {
      cod_subgrupo: subgrupoMargem.cod_subgrupo,
      margem: subgrupoMargem.margem,
      margem_adc: subgrupoMargem.margem_adc,
      desconto: subgrupoMargem.desconto
    })

    // 4.1 - Status ativo do subgrupo já validado no find

    // 4.2 e 4.3 - Validação de margem do subgrupo (sempre por percentual)
    const margemUFLojaPercentual = calculateUFMargin(novoPreco, selectedProduto, selectedLoja)

    if (clienteIdentificado) {
      // Com cliente identificado, considera margem adicional ou margem
      const margemRequerida = subgrupoMargem.margem_adc || subgrupoMargem.margem
      if (margemUFLojaPercentual < margemRequerida) {
        return { 
          error: `Margem UF Loja (${margemUFLojaPercentual.toFixed(2)}%) menor que margem requerida do subgrupo (${margemRequerida.toFixed(2)}%).`,
          observacao: subgrupoMargem.observacao || undefined,
          regraAplicada: "subgrupo",
          regraId: regraIdSubgrupo
        }
      }
    } else {
      // Sem cliente identificado, considera apenas margem
      if (margemUFLojaPercentual < subgrupoMargem.margem) {
        return { 
          error: "Não possuí margem produto/subgrupo.",
          observacao: subgrupoMargem.observacao || undefined,
          regraAplicada: "subgrupo",
          regraId: regraIdSubgrupo
        }
      }
    }

    // 4.4 - % Desconto máximo do subgrupo
    const percentualDesconto = ((precoAtual - novoPreco) / precoAtual) * 100
    if (subgrupoMargem.desconto && percentualDesconto > subgrupoMargem.desconto) {
      console.log("Desconto maior que máximo do subgrupo")
      return { 
        error: "Maior que desconto máximo Subgrupo.",
        observacao: subgrupoMargem.observacao || undefined,
        regraAplicada: "subgrupo",
        regraId: regraIdSubgrupo
      }
    }

    // 4.5 - Data de vigência já validada no find
    // ETAPA 5: Validar Loja final
    return validateLoja(selectedLoja, "subgrupo", regraIdSubgrupo)
  } else {
    return { error: "Não possúi produto/subgrupo token Desconto.", regraAplicada: "subgrupo" }
  }
}

const validateLoja = (selectedLoja: Loja, regraOrigem: RegraAplicada = null, regraIdOrigem?: number | string): ValidationResult => {
  // 5.1 - Meta da loja
  if (selectedLoja.meta_loja !== 1) {
    console.log("Meta loja irregular")
    return { error: "Meta Loja Irregular", regraAplicada: "loja", regraId: selectedLoja.cod_loja }
  }

  // 5.2 - DRE da loja
  if (selectedLoja.dre_negativo !== 1) {
    console.log("DRE irregular")
    return { error: "DRE Loja Irregular", regraAplicada: "loja", regraId: selectedLoja.cod_loja }
  }

  console.log("Validação passou - token aprovado")
  return { error: null, regraAplicada: regraOrigem, regraId: regraIdOrigem }
}
