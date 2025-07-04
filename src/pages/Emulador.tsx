
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { LojaCombobox } from "@/components/LojaCombobox"
import { ProdutoCombobox } from "@/components/ProdutoCombobox"
import { CurrencyInput } from "@/components/CurrencyInput"
import { supabase } from "@/integrations/supabase/client"
import { Tables } from "@/integrations/supabase/types"
import { useNavigate } from "react-router-dom"

type Loja = Tables<"cadastro_loja">
type Produto = Tables<"cadastro_produto">
type SubgrupoMargem = Tables<"subgrupo_margem">

export default function Emulador() {
  const navigate = useNavigate()
  const [lojas, setLojas] = useState<Loja[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [lojaSelecionada, setLojaSelecionada] = useState<Loja | null>(null)
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null)
  const [subgrupoMargem, setSubgrupoMargem] = useState<SubgrupoMargem | null>(null)
  const [valorSolicitado, setValorSolicitado] = useState("")
  const [quantidade, setQuantidade] = useState("1")
  const [margemZVDC, setMargemZVDC] = useState("")
  const [tokensNoMes, setTokensNoMes] = useState(0)
  
  // Campos calculados
  const [precoMinimo, setPrecoMinimo] = useState("")
  const [cmgProduto, setCmgProduto] = useState("")
  const [precoRegular, setPrecoRegular] = useState("")
  const [descontoAlcada, setDescontoAlcada] = useState("")
  const [margemUFLoja, setMargemUFLoja] = useState("")
  const [percentualDesconto, setPercentualDesconto] = useState("")
  const [observacao, setObservacao] = useState("")
  const [situacao, setSituacao] = useState("")

  useEffect(() => {
    fetchLojas()
    fetchProdutos()
  }, [])

  useEffect(() => {
    if (produtoSelecionado) {
      fetchSubgrupoMargem(produtoSelecionado.subgrupo_id)
    }
  }, [produtoSelecionado])

  useEffect(() => {
    if (subgrupoMargem) {
      setMargemZVDC(`${subgrupoMargem.margem.toFixed(2)}%`)
    }
  }, [subgrupoMargem])

  useEffect(() => {
    calculateFields()
  }, [lojaSelecionada, produtoSelecionado, subgrupoMargem, valorSolicitado])

  useEffect(() => {
    if (lojaSelecionada) {
      checkTokensThisMonth()
    }
  }, [lojaSelecionada])

  const fetchLojas = async () => {
    try {
      const { data, error } = await supabase
        .from("cadastro_loja")
        .select("*")
        .order("loja")
      
      if (error) throw error
      setLojas(data || [])
    } catch (error) {
      console.error("Erro ao buscar lojas:", error)
    }
  }

  const fetchProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from("cadastro_produto")
        .select("*")
        .order("nome_produto")
      
      if (error) throw error
      setProdutos(data || [])
    } catch (error) {
      console.error("Erro ao buscar produtos:", error)
    }
  }

  const fetchSubgrupoMargem = async (subgrupoId: number | null) => {
    if (!subgrupoId) return
    
    try {
      const { data, error } = await supabase
        .from("subgrupo_margem")
        .select("*")
        .eq("cod_subgrupo", subgrupoId)
        .single()
      
      if (error) throw error
      setSubgrupoMargem(data)
    } catch (error) {
      console.error("Erro ao buscar subgrupo margem:", error)
    }
  }

  const checkTokensThisMonth = async () => {
    if (!lojaSelecionada) return

    try {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

      const { data, error } = await supabase
        .from("token_loja")
        .select("*")
        .eq("cod_loja", lojaSelecionada.cod_loja)
        .gte("data_criacao", startOfMonth.toISOString())
        .lte("data_criacao", endOfMonth.toISOString())

      if (error) throw error
      setTokensNoMes(data?.length || 0)
    } catch (error) {
      console.error("Erro ao verificar tokens do mês:", error)
    }
  }

  const calculateFields = () => {
    if (!lojaSelecionada || !produtoSelecionado || !subgrupoMargem) {
      resetCalculatedFields()
      return
    }

    const estado = lojaSelecionada.estado.toLowerCase()
    let aliq = 0
    let cmg = 0
    let pmc = 0

    // Definir valores baseados no estado da loja
    switch (estado) {
      case 'rs':
        aliq = produtoSelecionado.aliq_rs || 0
        cmg = produtoSelecionado.cmg_rs || 0
        pmc = produtoSelecionado.pmc_rs || 0
        break
      case 'sc':
        aliq = produtoSelecionado.aliq_sc || 0
        cmg = produtoSelecionado.cmg_sc || 0
        pmc = produtoSelecionado.pmc_sc || 0
        break
      case 'pr':
        aliq = produtoSelecionado.aliq_pr || 0
        cmg = produtoSelecionado.cmg_pr || 0
        pmc = produtoSelecionado.pmc_pr || 0
        break
    }

    const piscofins = produtoSelecionado.piscofins || 0
    const margemSubgrupo = subgrupoMargem.margem / 100 // Converter para decimal

    // Calcular Preço Mínimo com a fórmula corrigida
    // (cmg / (1 - (aliq + piscofins))) / (1 - margem_subgrupo)
    const denominador1 = 1 - ((aliq + piscofins))
    const denominador2 = 1 - margemSubgrupo
    const precoMin = (cmg / denominador1) / denominador2
    setPrecoMinimo(precoMin.toFixed(2))

    // CMG Produto
    setCmgProduto(cmg.toFixed(2))

    // Preço Regular
    setPrecoRegular(pmc.toFixed(2))

    // Desconto Alçada
    setDescontoAlcada(produtoSelecionado.alcada === 1 ? "SIM" : "NÃO")

    // Verificar status da loja para observação
    if (lojaSelecionada.st_token === 0) {
      setObservacao("Loja bloqueada para geração de Token.")
    } else {
      setObservacao(produtoSelecionado.observacao || "")
    }

    // Calcular campos se valor solicitado estiver preenchido
    if (valorSolicitado) {
      const valorSolic = parseMoneyValue(valorSolicitado)
      const margemUF = ((valorSolic * (1 - (aliq + piscofins))) - cmg) / (valorSolic * (1 - (aliq + piscofins)))
      setMargemUFLoja(`${(margemUF * 100).toFixed(2)}%`)

      // % Desconto = ((preço regular - valor solicitado) / preço regular) * 100
      const desconto = ((pmc - valorSolic) / pmc) * 100
      setPercentualDesconto(`${desconto.toFixed(2)}%`)

      // Situação
      setSituacao(valorSolic >= precoMin ? "Aprovado" : "Reprovado")
    } else {
      setMargemUFLoja("")
      setPercentualDesconto("")
      setSituacao("")
    }
  }

  const parseMoneyValue = (value: string): number => {
    if (!value) return 0
    return parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0
  }

  const resetCalculatedFields = () => {
    setPrecoMinimo("")
    setCmgProduto("")
    setPrecoRegular("")
    setDescontoAlcada("")
    setMargemUFLoja("")
    setPercentualDesconto("")
    setObservacao("")
    setSituacao("")
    setMargemZVDC("")
  }

  const canApprove = () => {
    if (!lojaSelecionada || !valorSolicitado || !produtoSelecionado || situacao !== "Aprovado") {
      return false
    }
    
    // Se a loja está bloqueada (st_token = 0), não pode aprovar
    if (lojaSelecionada.st_token === 0) {
      return false
    }

    // Verificar limite de tokens por mês
    const limiteTokens = lojaSelecionada.qtde_token || 0
    if (tokensNoMes >= limiteTokens) {
      return false
    }

    return true
  }

  const canReprove = () => {
    return lojaSelecionada && produtoSelecionado && valorSolicitado
  }

  const handleAprovar = async () => {
    if (!canApprove()) return

    try {
      // Gerar código do token
      const { data: tokenCode } = await supabase.rpc('generate_token_code')
      
      if (!tokenCode) {
        throw new Error("Erro ao gerar código do token")
      }

      // Criar registro na tabela token_loja
      const { data: tokenLoja, error: tokenError } = await supabase
        .from("token_loja")
        .insert({
          codigo_token: tokenCode,
          cod_loja: lojaSelecionada!.cod_loja,
          st_aprovado: 1
        })
        .select()
        .single()

      if (tokenError) throw tokenError

      // Criar registro na tabela token_loja_detalhado
      const { error: detalheError } = await supabase
        .from("token_loja_detalhado")
        .insert({
          codigo_token: tokenLoja.id,
          produto: produtoSelecionado!.nome_produto,
          qtde_solic: parseInt(quantidade),
          vlr_solic: parseMoneyValue(valorSolicitado),
          preco_min: parseFloat(precoMinimo),
          cmg_produto: parseFloat(cmgProduto),
          preco_regul: parseFloat(precoRegular),
          desconto: percentualDesconto,
          desc_alcada: descontoAlcada,
          margem_uf: margemUFLoja,
          margem_zvdc: margemZVDC,
          observacao: observacao
        })

      if (detalheError) throw detalheError

      alert(`Token gerado com sucesso: ${tokenCode}`)
      handleReset()
    } catch (error) {
      console.error("Erro ao gerar token:", error)
      alert("Erro ao gerar token. Tente novamente.")
    }
  }

  const handleReprovar = async () => {
    if (!canReprove()) return

    try {
      // Criar registro na tabela token_loja sem código de token
      const { data: tokenLoja, error: tokenError } = await supabase
        .from("token_loja")
        .insert({
          codigo_token: "REPROVADO",
          cod_loja: lojaSelecionada!.cod_loja,
          st_aprovado: 0
        })
        .select()
        .single()

      if (tokenError) throw tokenError

      // Criar registro na tabela token_loja_detalhado
      const { error: detalheError } = await supabase
        .from("token_loja_detalhado")
        .insert({
          codigo_token: tokenLoja.id,
          produto: produtoSelecionado!.nome_produto,
          qtde_solic: parseInt(quantidade),
          vlr_solic: parseMoneyValue(valorSolicitado),
          preco_min: parseFloat(precoMinimo),
          cmg_produto: parseFloat(cmgProduto),
          preco_regul: parseFloat(precoRegular),
          desconto: percentualDesconto,
          desc_alcada: descontoAlcada,
          margem_uf: margemUFLoja,
          margem_zvdc: margemZVDC,
          observacao: observacao
        })

      if (detalheError) throw detalheError

      alert("Solicitação reprovada e registrada com sucesso!")
      handleReset()
    } catch (error) {
      console.error("Erro ao reprovar:", error)
      alert("Erro ao reprovar. Tente novamente.")
    }
  }

  const handleReset = () => {
    setLojaSelecionada(null)
    setProdutoSelecionado(null)
    setSubgrupoMargem(null)
    setValorSolicitado("")
    setQuantidade("1")
    setTokensNoMes(0)
    resetCalculatedFields()
  }

  const handleVoltar = () => {
    navigate("/solicitacao-tokens")
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">Aprovação Token</h1>
      
      <div className="space-y-6">
        {/* Painel de Seleção */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Seleção</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label htmlFor="loja">Loja</Label>
                <LojaCombobox
                  lojas={lojas}
                  selectedLoja={lojaSelecionada}
                  onLojaChange={setLojaSelecionada}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="produto">Produto</Label>
                <ProdutoCombobox
                  produtos={produtos}
                  selectedProduto={produtoSelecionado}
                  onProdutoChange={setProdutoSelecionado}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantidade">Quantidade</Label>
                <Input
                  id="quantidade"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valorSolicitado">Valor Solicitado</Label>
                <CurrencyInput
                  value={valorSolicitado}
                  onChange={setValorSolicitado}
                  placeholder="R$ 0,00"
                />
              </div>
            </div>

            {lojaSelecionada && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">
                  Limite de tokens no mês: {lojaSelecionada.qtde_token || 0} | 
                  Tokens já utilizados: {tokensNoMes} | 
                  Status da loja: {lojaSelecionada.st_token === 1 ? "Ativa" : "Bloqueada"}
                </div>
              </div>
            )}

            <div className="flex gap-4 mt-6">
              <Button 
                className={`px-8 py-3 ${canApprove() ? "bg-green-600 hover:bg-green-700" : ""}`}
                disabled={!canApprove()}
                onClick={handleAprovar}
              >
                APROVAR
              </Button>
              <Button 
                className="px-8 py-3 text-white hover:opacity-90"
                style={{ backgroundColor: "#E52E20" }}
                disabled={!canReprove()}
                onClick={handleReprovar}
              >
                REPROVAR
              </Button>
              <Button variant="outline" onClick={handleVoltar} className="px-8 py-3">
                VOLTAR
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Painel de Resultados */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Informações do Produto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Preço Mínimo</Label>
                <Input value={precoMinimo} readOnly className="bg-muted" />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">CMG Produto</Label>
                <Input value={cmgProduto} readOnly className="bg-muted" />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Preço Regular</Label>
                <Input value={precoRegular} readOnly className="bg-muted" />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">% Desconto</Label>
                <Input value={percentualDesconto} readOnly className="bg-muted" />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Desconto Alçada</Label>
                <Input value={descontoAlcada} readOnly className="bg-muted" />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Margem UF Loja</Label>
                <Input value={margemUFLoja} readOnly className="bg-muted" />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Margem ZVDC</Label>
                <Input value={margemZVDC} readOnly className="bg-muted" />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Situação</Label>
                <Input 
                  value={situacao} 
                  readOnly 
                  className={`bg-muted font-medium ${
                    situacao === "Aprovado" ? "text-green-600" : 
                    situacao === "Reprovado" ? "text-red-600" : ""
                  }`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Observação</Label>
              <Input value={observacao} readOnly className="bg-muted" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
