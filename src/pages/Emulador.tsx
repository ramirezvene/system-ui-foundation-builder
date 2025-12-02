
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { LojaCombobox } from "@/components/LojaCombobox"
import { ProdutoCombobox } from "@/components/ProdutoCombobox"
import { CurrencyInput } from "@/components/CurrencyInput"
import { SolicitacaoResultCard } from "@/components/vendas/SolicitacaoResult"
import { useVendasData } from "@/hooks/useVendasData"
import { validateHierarchy } from "@/utils/vendas/validations"
import { calculateAdditionalInfo } from "@/utils/vendas/tokenCalculations"
import { SolicitacaoResult } from "@/types/vendas"

export default function Emulador() {
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
    const cleanPrice = priceString.replace(/[^\d,]/g, '').replace(',', '.')
    return parseFloat(cleanPrice) || 0
  }

  const handleEmularValidacao = () => {
    const novoPrecoNum = parsePrice(novoPreco)
    
    console.log("=== EMULAÇÃO DE VALIDAÇÃO ===")
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

    const result: SolicitacaoResult = {
      loja: selectedLoja,
      produto: selectedProduto,
      precoRegular: precoAtual,
      precoSolicitado: novoPrecoNum,
      desconto: precoAtual > 0 ? ((precoAtual - novoPrecoNum) / precoAtual * 100) : 0,
      quantidade: parseInt(quantidade),
      subgrupo: additionalInfo.subgrupo,
      precoMinimo: additionalInfo.precoMinimo,
      margemCalculo: additionalInfo.margemCalculo,
      margem: additionalInfo.margem,
      margemAdc: additionalInfo.margemAdc,
      cmvLoja: additionalInfo.cmvLoja,
      cmvEstado: additionalInfo.cmvEstado,
      icms: additionalInfo.icms,
      pis: additionalInfo.pis,
      cofins: additionalInfo.cofins,
      retorno: validation.error || "Aprovado",
      aprovado: !validation.error,
      observacaoRejeicao: validation.observacao,
      regraAplicada: validation.regraAplicada,
      regraId: validation.regraId
    }

    setSolicitacaoResult(result)

    if (validation.error) {
      let toastMessage = validation.error
      if (validation.observacao) {
        toastMessage += ` Observação: ${validation.observacao}`
      }
      
      toast({
        title: "Validação",
        description: toastMessage,
        variant: "destructive"
      })
    } else {
      toast({
        title: "Sucesso",
        description: "Token seria aprovado!",
        variant: "default"
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
    setSolicitacaoResult(null)
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">Emulador de Validação</h1>
      
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Simular Validação de Token</CardTitle>
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
            <Button onClick={handleEmularValidacao} disabled={!selectedLoja || !selectedProduto || !novoPreco}>
              Emular Validação
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
