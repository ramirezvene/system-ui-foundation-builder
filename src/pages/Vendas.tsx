
import { useState } from "react"
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

export default function Vendas() {
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
  const { toast } = useToast()

  const parsePrice = (priceString: string): number => {
    if (!priceString) return 0
    // Remove currency symbols and convert comma to dot for decimal
    const cleanPrice = priceString.replace(/[^\d,]/g, '').replace(',', '.')
    return parseFloat(cleanPrice) || 0
  }

  const handleSolicitarToken = async () => {
    const novoPrecoNum = parsePrice(novoPreco)
    
    console.log("=== SOLICITAÇÃO DE TOKEN ===")
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
      retorno: validation.error || "Solicitado",
      aprovado: !validation.error,
      precoMinimo: additionalInfo.precoMinimo,
      cmgProduto: additionalInfo.cmgProduto,
      descontoAlcada: additionalInfo.descontoAlcada,
      margemUF: additionalInfo.margemUF,
      margemZVDC: additionalInfo.margemZVDC,
      aliqUF: additionalInfo.aliqUF,
      piscofinsUF: additionalInfo.piscofinsUF,
      ruptura: additionalInfo.ruptura,
      observacaoRejeicao: validation.observacao
    }

    setSolicitacaoResult(result)

    if (validation.error) {
      // Exibir toast com a validação específica feita
      let toastMessage = validation.error
      if (validation.observacao) {
        toastMessage += ` Observação: ${validation.observacao}`
      }
      
      toast({
        title: "Validação",
        description: toastMessage,
        variant: "destructive"
      })
      
      // Não limpar os campos quando há erro de validação para o usuário poder ajustar
      return
    }

    try {
      // Atualizar quantidade de token disponível na loja
      await supabase
        .from("cadastro_loja")
        .update({ qtde_token: tokenDisponipelAtualizado })
        .eq("cod_loja", selectedLoja!.cod_loja)

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
      const { error: insertDetailError } = await supabase
        .from("token_loja_detalhado")
        .insert({
          codigo_token: tokenData.id,
          produto: `${selectedProduto!.id_produto} - ${selectedProduto!.nome_produto}`,
          qtde_solic: parseInt(quantidade),
          preco_regul: precoAtual,
          vlr_solic: novoPrecoNum,
          desconto: `${desconto}%`,
          cmg_produto: additionalInfo.cmgProduto,
          preco_min: additionalInfo.precoMinimo,
          desc_alcada: additionalInfo.descontoAlcada,
          margem_uf: additionalInfo.margemUF,
          margem_zvdc: additionalInfo.margemZVDC
        })

      if (insertDetailError) throw insertDetailError

      toast({
        title: "Sucesso",
        description: `Token ${tokenCode} solicitado com sucesso!`
      })

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
    setClienteIdentificado(false)
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
        <SolicitacaoResultCard 
          result={solicitacaoResult} 
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  )
}
