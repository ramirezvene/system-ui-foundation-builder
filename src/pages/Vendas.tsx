
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { supabase } from "@/integrations/supabase/client"
import { Tables } from "@/integrations/supabase/types"
import { useToast } from "@/hooks/use-toast"
import { LojaCombobox } from "@/components/LojaCombobox"
import { ProdutoCombobox } from "@/components/ProdutoCombobox"
import { CurrencyInput } from "@/components/CurrencyInput"

type Loja = Tables<"cadastro_loja">
type Produto = Tables<"cadastro_produto">
type ProdutoMargem = Tables<"produto_margem">
type SubgrupoMargem = Tables<"subgrupo_margem">
type Estado = Tables<"cadastro_estado">

interface SolicitacaoResult {
  loja: Loja | null
  produto: Produto | null
  precoRegular: number
  precoSolicitado: number
  desconto: number
  tokenDisponivel: number
  retorno: string
  aprovado: boolean
}

export default function Vendas() {
  const [lojas, setLojas] = useState<Loja[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [produtoMargens, setProdutoMargens] = useState<ProdutoMargem[]>([])
  const [subgrupoMargens, setSubgrupoMargens] = useState<SubgrupoMargem[]>([])
  const [estados, setEstados] = useState<Estado[]>([])
  const [selectedLoja, setSelectedLoja] = useState<Loja | null>(null)
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null)
  const [precoAtual, setPrecoAtual] = useState<number>(0)
  const [novoPreco, setNovoPreco] = useState("")
  const [quantidade, setQuantidade] = useState<string>("1")
  const [solicitacaoResult, setSolicitacaoResult] = useState<SolicitacaoResult | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedProduto && selectedLoja) {
      const estado = selectedLoja.estado.toLowerCase()
      let preco = 0
      
      if (estado === 'rs') {
        preco = selectedProduto.pmc_rs || 0
      } else if (estado === 'sc') {
        preco = selectedProduto.pmc_sc || 0
      } else if (estado === 'pr') {
        preco = selectedProduto.pmc_pr || 0
      }
      
      setPrecoAtual(preco)
    }
  }, [selectedProduto, selectedLoja])

  const fetchData = async () => {
    try {
      const [lojasRes, produtosRes, produtoMargensRes, subgrupoMargensRes, estadosRes] = await Promise.all([
        supabase.from("cadastro_loja").select("*").order("loja"),
        supabase.from("cadastro_produto").select("*").order("nome_produto"),
        supabase.from("produto_margem").select("*"),
        supabase.from("subgrupo_margem").select("*"),
        supabase.from("cadastro_estado").select("*")
      ])
      
      if (lojasRes.error) throw lojasRes.error
      if (produtosRes.error) throw produtosRes.error
      if (produtoMargensRes.error) throw produtoMargensRes.error
      if (subgrupoMargensRes.error) throw subgrupoMargensRes.error
      if (estadosRes.error) throw estadosRes.error

      setLojas(lojasRes.data || [])
      setProdutos(produtosRes.data || [])
      setProdutoMargens(produtoMargensRes.data || [])
      setSubgrupoMargens(subgrupoMargensRes.data || [])
      setEstados(estadosRes.data || [])
    } catch (error) {
      console.error("Erro ao buscar dados:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive"
      })
    }
  }

  const parsePrice = (priceString: string): number => {
    if (!priceString) return 0
    // Remove currency symbols and convert comma to dot for decimal
    const cleanPrice = priceString.replace(/[^\d,]/g, '').replace(',', '.')
    return parseFloat(cleanPrice) || 0
  }

  const validateHierarchy = (): string | null => {
    if (!selectedProduto || !selectedLoja) return "Selecione uma loja e um produto"

    const novoPrecoNum = parsePrice(novoPreco)
    console.log("Validação - novoPreco string:", novoPreco)
    console.log("Validação - novoPrecoNum parsed:", novoPrecoNum)
    console.log("Validação - precoAtual:", precoAtual)
    
    if (isNaN(novoPrecoNum) || novoPrecoNum <= 0) {
      console.log("Preço inválido - NaN ou <= 0")
      return "Preço solicitado inválido"
    }

    // 1. Validações do Produto
    // Preço Mínimo
    const estado = selectedLoja.estado.toLowerCase()
    let precoMinimo = 0
    let cmgProduto = 0
    
    if (estado === 'rs') {
      cmgProduto = selectedProduto.cmg_rs || 0
    } else if (estado === 'sc') {
      cmgProduto = selectedProduto.cmg_sc || 0
    } else if (estado === 'pr') {
      cmgProduto = selectedProduto.cmg_pr || 0
    }

    precoMinimo = cmgProduto * 1.1 // Assumindo margem mínima de 10%
    console.log("Validação - precoMinimo:", precoMinimo)
    console.log("Validação - cmgProduto:", cmgProduto)
    
    if (novoPrecoNum < precoMinimo) {
      console.log("Preço menor que mínimo")
      return "Desconto reprovado, devido ao preço ser inferior ao Preço Mínimo."
    }

    // % Desconto válido
    if (novoPrecoNum >= precoAtual) {
      console.log("Preço maior ou igual ao regular")
      return "Desconto é inválido, preço maior que Valor Regular."
    }

    // Validar alçada do produto
    if (selectedProduto.alcada !== 0) {
      console.log("Produto possui outras alçadas")
      return "Possuí outras Alçadas para realização de Desconto."
    }

    // 2. Validações do Subgrupo (se aplicável)
    if (selectedProduto.subgrupo_id) {
      const subgrupoMargem = subgrupoMargens.find(s => s.cod_subgrupo === selectedProduto.subgrupo_id)
      if (subgrupoMargem) {
        const descontoPercentual = ((precoAtual - novoPrecoNum) / precoAtual) * 100
        console.log("Validação subgrupo - desconto%:", descontoPercentual, "margem permitida:", subgrupoMargem.margem)
        if (descontoPercentual > subgrupoMargem.margem) {
          return `Desconto excede a margem permitida para o subgrupo (${subgrupoMargem.margem}%).`
        }
      }
    }

    // 3. Validações da Loja
    if (selectedLoja.meta_loja !== 1) {
      console.log("Meta loja irregular")
      return "Bloqueado devido a Meta de Desconto estar irregular."
    }

    if (selectedLoja.dre_negativo !== 1) {
      console.log("DRE irregular")
      return "Bloqueado devido a DRE estar irregular."
    }

    // 4. Validações do Estado
    const estadoInfo = estados.find(e => e.estado === selectedLoja.estado)
    if (!estadoInfo || estadoInfo.st_ativo !== 1) {
      console.log("Estado não disponível")
      return "Estado não disponível para solicitação de token."
    }

    // Validações específicas do produto
    if (selectedProduto.st_ruptura !== 0) {
      console.log("Produto com ruptura")
      return "Produto possui Ruptura de Estoque."
    }

    if (selectedProduto.st_pricing !== 0) {
      console.log("Produto bloqueado para token")
      return "Produto possui Bloqueado para solicitar Token."
    }

    // Verificar margem ZVDC vs UF
    const produtoMargem = produtoMargens.find(pm => 
      pm.id_produto === selectedProduto.id_produto && 
      pm.tipo_aplicacao === "estado" &&
      pm.codigo_referencia === estadoInfo?.id
    )

    if (produtoMargem) {
      const descontoPercentual = ((precoAtual - novoPrecoNum) / precoAtual) * 100
      console.log("Validação produto margem - desconto%:", descontoPercentual, "margem ZVDC:", produtoMargem.margem)
      if (descontoPercentual > produtoMargem.margem) {
        return "Desconto token reprovado, devido a margem ZVDC."
      }
    }

    console.log("Validação passou - token aprovado")
    return null
  }

  const handleSolicitarToken = async () => {
    const validationError = validateHierarchy()
    const novoPrecoNum = parsePrice(novoPreco)
    
    const result: SolicitacaoResult = {
      loja: selectedLoja,
      produto: selectedProduto,
      precoRegular: precoAtual,
      precoSolicitado: novoPrecoNum,
      desconto: precoAtual > 0 ? ((precoAtual - novoPrecoNum) / precoAtual * 100) : 0,
      tokenDisponivel: selectedLoja?.qtde_token || 0,
      retorno: validationError || "Solicitado",
      aprovado: !validationError
    }

    setSolicitacaoResult(result)

    if (validationError) {
      toast({
        title: "Validação",
        description: validationError,
        variant: "destructive"
      })
      handleLimpar()
      return
    }

    try {
      // Gerar código do token
      const { data: tokenCode, error: tokenError } = await supabase
        .rpc('generate_token_code')
      
      if (tokenError) throw tokenError

      // Inserir token na tabela token_loja
      const { data: tokenData, error: insertTokenError } = await supabase
        .from("token_loja")
        .insert({
          cod_loja: selectedLoja!.cod_loja,
          codigo_token: tokenCode,
          st_aprovado: null
        })
        .select()
        .single()

      if (insertTokenError) throw insertTokenError

      // Calcular desconto
      const desconto = ((precoAtual - novoPrecoNum) / precoAtual * 100).toFixed(2)

      // Inserir detalhes do token
      const estado = selectedLoja!.estado.toLowerCase()
      let cmgProduto = 0
      
      if (estado === 'rs') {
        cmgProduto = selectedProduto!.cmg_rs || 0
      } else if (estado === 'sc') {
        cmgProduto = selectedProduto!.cmg_sc || 0
      } else if (estado === 'pr') {
        cmgProduto = selectedProduto!.cmg_pr || 0
      }

      const { error: insertDetailError } = await supabase
        .from("token_loja_detalhado")
        .insert({
          codigo_token: tokenData.id,
          produto: `${selectedProduto!.id_produto} - ${selectedProduto!.nome_produto}`,
          qtde_solic: parseInt(quantidade),
          preco_regul: precoAtual,
          vlr_solic: novoPrecoNum,
          desconto: `${desconto}%`,
          cmg_produto: cmgProduto
        })

      if (insertDetailError) throw insertDetailError

      toast({
        title: "Sucesso",
        description: `Token ${tokenCode} solicitado com sucesso!`
      })

      // Atualizar resultado para mostrar o código do token
      setSolicitacaoResult(prev => prev ? {
        ...prev,
        retorno: `Solicitado - Token: ${tokenCode}`
      } : null)

      handleLimpar()

    } catch (error) {
      console.error("Erro ao solicitar token:", error)
      toast({
        title: "Erro",
        description: "Erro ao solicitar token",
        variant: "destructive"
      })
      handleLimpar()
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const handleLimpar = () => {
    setSelectedLoja(null)
    setSelectedProduto(null)
    setNovoPreco("")
    setQuantidade("1")
    setPrecoAtual(0)
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">Vendas - Solicitação de Token</h1>
      
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Nova Solicitação de Token</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Loja</Label>
              <LojaCombobox
                lojas={lojas}
                selectedLoja={selectedLoja}
                onLojaChange={setSelectedLoja}
                placeholder="Selecione uma loja..."
              />
            </div>
            
            <div>
              <Label>Produto</Label>
              <ProdutoCombobox
                produtos={produtos}
                selectedProduto={selectedProduto}
                onProdutoChange={setSelectedProduto}
                placeholder="Selecione um produto..."
              />
            </div>
          </div>

          {selectedProduto && selectedLoja && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Preço Atual da Loja</Label>
                <Input
                  value={formatCurrency(precoAtual)}
                  readOnly
                  className="bg-muted"
                />
              </div>
              
              <div>
                <Label>Novo Preço Solicitado</Label>
                <CurrencyInput
                  value={novoPreco}
                  onChange={setNovoPreco}
                  placeholder="R$ 0,00"
                />
              </div>
              
              <div>
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  min="1"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                />
              </div>
            </div>
          )}

          {novoPreco && precoAtual > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Desconto:</strong> {((precoAtual - parsePrice(novoPreco)) / precoAtual * 100).toFixed(2)}%
              </p>
              <p className="text-sm text-blue-700">
                <strong>Economia:</strong> {formatCurrency(precoAtual - parsePrice(novoPreco))}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSolicitarToken} disabled={!selectedLoja || !selectedProduto || !novoPreco}>
              Solicitar Token
            </Button>
            <Button variant="outline" onClick={handleLimpar}>
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {solicitacaoResult && (
        <Card className="w-full max-w-4xl">
          <CardHeader>
            <CardTitle className={`${solicitacaoResult.aprovado ? 'text-green-600' : 'text-red-600'}`}>
              Resultado da Solicitação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="font-semibold">Loja:</Label>
                <p>{solicitacaoResult.loja?.cod_loja} - {solicitacaoResult.loja?.loja} - {solicitacaoResult.loja?.estado}</p>
              </div>
              
              <div>
                <Label className="font-semibold">Produto:</Label>
                <p>{solicitacaoResult.produto?.id_produto} - {solicitacaoResult.produto?.nome_produto}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="font-semibold">Preço Regular:</Label>
                <p>{formatCurrency(solicitacaoResult.precoRegular)}</p>
              </div>
              
              <div>
                <Label className="font-semibold">Preço Solicitado:</Label>
                <p>{formatCurrency(solicitacaoResult.precoSolicitado)}</p>
              </div>
              
              <div>
                <Label className="font-semibold">% Desconto:</Label>
                <p>{solicitacaoResult.desconto.toFixed(2)}%</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="font-semibold">Token Loja Disponível Mês:</Label>
                <p>{solicitacaoResult.tokenDisponivel}</p>
              </div>
              
              <div>
                <Label className="font-semibold">Retorno:</Label>
                <p className={`font-medium ${solicitacaoResult.aprovado ? 'text-green-600' : 'text-red-600'}`}>
                  {solicitacaoResult.retorno}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
