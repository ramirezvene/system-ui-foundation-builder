
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { LojaCombobox } from "@/components/LojaCombobox"
import { ProdutoCombobox } from "@/components/ProdutoCombobox"
import { CurrencyInput } from "@/components/CurrencyInput"
import { SolicitacaoResultCard } from "@/components/vendas/SolicitacaoResult"
import { useVendasData } from "@/hooks/useVendasData"
import { validateHierarchy } from "@/utils/vendas/validations"
import { calculateAdditionalInfo } from "@/utils/vendas/tokenCalculations"
import { SolicitacaoResult } from "@/types/vendas"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AprovacaoToken() {
  const {
    lojas,
    produtos,
    produtoMargens,
    subgrupoMargens,
    estados,
    selectedLoja,
    setSelectedLoja,
    selectedProduto,
    setSelectedProduto,
    precoAtual
  } = useVendasData()

  const [novoPreco, setNovoPreco] = useState("")
  const [quantidade, setQuantidade] = useState<string>("1")
  const [clienteIdentificado, setClienteIdentificado] = useState(false)
  const [solicitacaoResult, setSolicitacaoResult] = useState<SolicitacaoResult | null>(null)
  const [tokensPendentes, setTokensPendentes] = useState<any[]>([])
  const [selectedToken, setSelectedToken] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchTokensPendentes()
  }, [])

  const fetchTokensPendentes = async () => {
    try {
      const { data, error } = await supabase
        .from("token_loja")
        .select(`
          *,
          token_loja_detalhado (*),
          cadastro_loja (*)
        `)
        .is("st_aprovado", null)
        .order("data_criacao", { ascending: false })

      if (error) throw error
      setTokensPendentes(data || [])
    } catch (error) {
      console.error("Erro ao buscar tokens pendentes:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar tokens pendentes",
        variant: "destructive"
      })
    }
  }

  const handleTokenSelect = (tokenId: string) => {
    const token = tokensPendentes.find(t => t.id.toString() === tokenId)
    if (token) {
      setSelectedToken(token)
      // Auto-preencher campos baseado no token selecionado
      const loja = lojas.find(l => l.cod_loja === token.cod_loja)
      if (loja) {
        setSelectedLoja(loja)
      }
      
      // Buscar produto baseado no token_loja_detalhado
      if (token.token_loja_detalhado?.length > 0) {
        const detalhado = token.token_loja_detalhado[0]
        if (detalhado.produto) {
          // Extrair ID do produto da string "ID - Nome"
          const produtoId = parseInt(detalhado.produto.split(' - ')[0])
          const produto = produtos.find(p => p.id_produto === produtoId)
          if (produto) {
            setSelectedProduto(produto)
          }
        }
        
        setNovoPreco(detalhado.vlr_solic?.toString() || "")
        setQuantidade(detalhado.qtde_solic?.toString() || "1")
      }
    }
  }

  const parsePrice = (priceString: string): number => {
    if (!priceString) return 0
    const cleanPrice = priceString.replace(/[^\d,]/g, '').replace(',', '.')
    return parseFloat(cleanPrice) || 0
  }

  const handleAprovarToken = async () => {
    const novoPrecoNum = parsePrice(novoPreco)
    
    console.log("=== APROVAÇÃO DE TOKEN ===")
    console.log("Cliente identificado:", clienteIdentificado)
    console.log("Produto:", selectedProduto?.id_produto, selectedProduto?.nome_produto)
    console.log("Loja:", selectedLoja?.cod_loja, selectedLoja?.loja)
    console.log("Preço atual:", precoAtual)
    console.log("Novo preço:", novoPrecoNum)
    
    const validation = validateHierarchy(
      selectedProduto,
      selectedLoja,
      novoPrecoNum,
      precoAtual,
      produtoMargens,
      subgrupoMargens,
      estados,
      clienteIdentificado
    )
    
    const estadoInfo = estados.find(e => e.estado === selectedLoja?.estado)
    const additionalInfo = calculateAdditionalInfo(
      selectedProduto,
      selectedLoja,
      novoPrecoNum,
      subgrupoMargens,
      produtoMargens,
      estadoInfo?.id
    )
    
    if (!additionalInfo) return

    const tokenAtualDisponivel = selectedLoja?.qtde_token || 0
    const tokenDisponipelAtualizado = validation.error ? tokenAtualDisponivel : Math.max(0, tokenAtualDisponivel - 1)
    
    const result: SolicitacaoResult = {
      loja: selectedLoja,
      produto: selectedProduto,
      precoRegular: precoAtual,
      precoSolicitado: novoPrecoNum,
      desconto: precoAtual > 0 ? ((precoAtual - novoPrecoNum) / precoAtual * 100) : 0,
      quantidade: parseInt(quantidade),
      tokenDisponivel: tokenAtualDisponivel,
      tokenDisponipelAtualizado: tokenDisponipelAtualizado,
      retorno: validation.error || "Aprovado",
      aprovado: !validation.error,
      precoMinimo: additionalInfo.precoMinimo,
      cmgProduto: additionalInfo.cmgProduto,
      descontoAlcada: additionalInfo.descontoAlcada,
      margemUF: additionalInfo.margemUF,
      margem: additionalInfo.margem,
      margemAdc: additionalInfo.margemAdc,
      aliqUF: additionalInfo.aliqUF,
      piscofinsUF: additionalInfo.piscofinsUF,
      ruptura: additionalInfo.ruptura,
      observacaoRejeicao: validation.observacao
    }

    setSolicitacaoResult(result)

    try {
      let tokenId: number
      let tokenCode: string

      if (selectedToken) {
        // Usar token existente
        tokenId = selectedToken.id
        tokenCode = selectedToken.codigo_token
      } else {
        // Gerar novo código do token
        const { data: newTokenCode, error: tokenError } = await supabase
          .rpc('generate_token_code')
        
        if (tokenError) throw tokenError
        tokenCode = newTokenCode

        // Inserir novo token na tabela token_loja
        const { data: tokenData, error: insertTokenError } = await supabase
          .from("token_loja")
          .insert({
            cod_loja: selectedLoja!.cod_loja,
            codigo_token: tokenCode,
            st_aprovado: validation.error ? 0 : 1
          })
          .select()
          .single()

        if (insertTokenError) throw insertTokenError
        tokenId = tokenData.id
      }

      // Atualizar status do token
      await supabase
        .from("token_loja")
        .update({ 
          st_aprovado: validation.error ? 0 : 1,
          data_validacao: new Date().toISOString()
        })
        .eq("id", tokenId)

      // Calcular desconto
      const desconto = ((precoAtual - novoPrecoNum) / precoAtual * 100).toFixed(2)

      // Inserir ou atualizar detalhes do token
      const detailData = {
        codigo_token: tokenId,
        produto: `${selectedProduto!.id_produto} - ${selectedProduto!.nome_produto}`,
        qtde_solic: parseInt(quantidade),
        preco_regul: precoAtual,
        vlr_solic: novoPrecoNum,
        desconto: `${desconto}%`,
        cmg_produto: additionalInfo.cmgProduto,
        preco_min: additionalInfo.precoMinimo,
        desc_alcada: additionalInfo.descontoAlcada,
        margem_uf: additionalInfo.margemUF,
        margem_zvdc: additionalInfo.margem,
        observacao: validation.error ? `${validation.error}${validation.observacao ? ` - ${validation.observacao}` : ''}` : 'Aprovado'
      }

      if (selectedToken && selectedToken.token_loja_detalhado?.length > 0) {
        // Atualizar detalhes existentes
        await supabase
          .from("token_loja_detalhado")
          .update(detailData)
          .eq("codigo_token", tokenId)
      } else {
        // Inserir novos detalhes
        const { error: insertDetailError } = await supabase
          .from("token_loja_detalhado")
          .insert(detailData)

        if (insertDetailError) throw insertDetailError
      }

      if (!validation.error) {
        // Atualizar quantidade de token disponível na loja apenas se aprovado
        await supabase
          .from("cadastro_loja")
          .update({ qtde_token: tokenDisponipelAtualizado })
          .eq("cod_loja", selectedLoja!.cod_loja)

        toast({
          title: "Sucesso",
          description: `Token ${tokenCode} aprovado com sucesso!`
        })

        setSolicitacaoResult(prev => prev ? {
          ...prev,
          retorno: `Aprovado - Token: ${tokenCode}`
        } : null)
      } else {
        toast({
          title: "Token Reprovado",
          description: `Token ${tokenCode} foi reprovado: ${validation.error}`,
          variant: "destructive"
        })
      }

      // Atualizar lista de tokens pendentes
      fetchTokensPendentes()
      handleLimpar()

    } catch (error) {
      console.error("Erro ao processar token:", error)
      toast({
        title: "Erro",
        description: "Erro ao processar token",
        variant: "destructive"
      })
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
    setClienteIdentificado(false)
    setSelectedToken(null)
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">Aprovação de Token</h1>
      
      {tokensPendentes.length > 0 && (
        <Card className="w-full max-w-4xl">
          <CardHeader>
            <CardTitle>Tokens Pendentes de Aprovação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Selecionar Token Pendente (Opcional)</Label>
              <Select onValueChange={handleTokenSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um token pendente..." />
                </SelectTrigger>
                <SelectContent>
                  {tokensPendentes.map((token) => (
                    <SelectItem key={token.id} value={token.id.toString()}>
                      {token.codigo_token} - {token.cadastro_loja?.loja} - {new Date(token.data_criacao).toLocaleDateString('pt-BR')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedToken && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                  <strong>Token selecionado:</strong> {selectedToken.codigo_token} - 
                  Loja: {selectedToken.cadastro_loja?.loja} - 
                  Criado em: {new Date(selectedToken.data_criacao).toLocaleString('pt-BR')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Detalhes da Solicitação de Token</CardTitle>
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

          {selectedProduto && selectedLoja && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="cliente-identificado"
                checked={clienteIdentificado}
                onCheckedChange={(checked) => setClienteIdentificado(checked as boolean)}
              />
              <Label
                htmlFor="cliente-identificado"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Cliente Identificado (considera margem adicional)
              </Label>
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
            <Button onClick={handleAprovarToken} disabled={!selectedLoja || !selectedProduto || !novoPreco}>
              {selectedToken ? "Validar Token" : "Aprovar Token"}
            </Button>
            <Button variant="outline" onClick={handleLimpar}>
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {solicitacaoResult && (
        <SolicitacaoResultCard 
          result={solicitacaoResult} 
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  )
}
