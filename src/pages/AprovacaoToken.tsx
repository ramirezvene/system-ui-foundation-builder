
import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useVendasData } from "@/hooks/useVendasData"
import { validateHierarchy } from "@/utils/vendas/validations"
import { calculateAdditionalInfo } from "@/utils/vendas/tokenCalculations"
import { SolicitacaoResult } from "@/types/vendas"

interface TokenData {
  id: number
  codigo_token: string
  cod_loja: number
  loja_nome: string
  loja_estado: string
  produto: string
  quantidade: number
  valor_solicitado: number
}

export default function AprovacaoToken() {
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const {
    lojas,
    produtos,
    produtoMargens,
    subgrupoMargens,
    estados
  } = useVendasData()

  const [tokenData, setTokenData] = useState<TokenData | null>(null)
  const [clienteIdentificado, setClienteIdentificado] = useState(false)
  const [validationResult, setValidationResult] = useState<SolicitacaoResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (location.state?.tokenData) {
      setTokenData(location.state.tokenData)
      performValidation(location.state.tokenData, false)
    } else {
      toast({
        title: "Erro",
        description: "Dados do token não encontrados",
        variant: "destructive"
      })
      navigate("/solicitacao-tokens")
    }
  }, [location.state, lojas.length, produtos.length])

  const performValidation = (data: TokenData, identificado: boolean) => {
    if (!data || lojas.length === 0 || produtos.length === 0) return

    // Encontrar loja e produto pelos dados do token
    const selectedLoja = lojas.find(l => l.cod_loja === data.cod_loja)
    const selectedProduto = produtos.find(p => 
      data.produto.includes(p.id_produto.toString()) && 
      data.produto.includes(p.nome_produto)
    )

    if (!selectedLoja || !selectedProduto) {
      toast({
        title: "Erro",
        description: "Loja ou produto não encontrados",
        variant: "destructive"
      })
      return
    }

    // Calcular preço atual baseado no estado da loja
    const estado = selectedLoja.estado.toLowerCase()
    let precoAtual = 0
    
    if (estado === 'rs') {
      precoAtual = selectedProduto.pmc_rs || 0
    } else if (estado === 'sc') {
      precoAtual = selectedProduto.pmc_sc || 0
    } else if (estado === 'pr') {
      precoAtual = selectedProduto.pmc_pr || 0
    }

    // Executar validação hierárquica
    const validation = validateHierarchy(
      selectedProduto,
      selectedLoja,
      data.valor_solicitado,
      precoAtual,
      produtoMargens,
      subgrupoMargens,
      estados,
      identificado
    )

    // Calcular informações adicionais
    const estadoInfo = estados.find(e => e.estado === selectedLoja.estado)
    const additionalInfo = calculateAdditionalInfo(
      selectedProduto,
      selectedLoja,
      data.valor_solicitado,
      subgrupoMargens,
      produtoMargens,
      estadoInfo?.id
    )

    if (!additionalInfo) return

    const result: SolicitacaoResult = {
      loja: selectedLoja,
      produto: selectedProduto,
      precoRegular: precoAtual,
      precoSolicitado: data.valor_solicitado,
      desconto: precoAtual > 0 ? ((precoAtual - data.valor_solicitado) / precoAtual * 100) : 0,
      quantidade: data.quantidade,
      tokenDisponivel: selectedLoja.qtde_token || 0,
      tokenDisponipelAtualizado: selectedLoja.qtde_token || 0,
      retorno: validation.error || "Aprovado",
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

    setValidationResult(result)
  }

  const handleClienteIdentificadoChange = (checked: boolean) => {
    setClienteIdentificado(checked)
    if (tokenData) {
      performValidation(tokenData, checked)
    }
  }

  const handleAprovar = async () => {
    if (!tokenData || !validationResult?.aprovado) return

    setIsProcessing(true)
    try {
      await supabase
        .from("token_loja")
        .update({ 
          st_aprovado: 1, 
          data_validacao: new Date().toISOString() 
        })
        .eq("id", tokenData.id)

      toast({
        title: "Sucesso",
        description: `Token ${tokenData.codigo_token} aprovado com sucesso!`
      })

      navigate("/solicitacao-tokens")
    } catch (error) {
      console.error("Erro ao aprovar token:", error)
      toast({
        title: "Erro",
        description: "Erro ao aprovar token",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRejeitar = async () => {
    if (!tokenData) return

    setIsProcessing(true)
    try {
      await supabase
        .from("token_loja")
        .update({ 
          st_aprovado: 0, 
          data_validacao: new Date().toISOString() 
        })
        .eq("id", tokenData.id)

      toast({
        title: "Token Rejeitado",
        description: `Token ${tokenData.codigo_token} foi rejeitado.`
      })

      navigate("/solicitacao-tokens")
    } catch (error) {
      console.error("Erro ao rejeitar token:", error)
      toast({
        title: "Erro",
        description: "Erro ao rejeitar token",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (!tokenData) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-foreground mb-6">Carregando...</h1>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">Aprovação de Token</h1>
      
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Token: {tokenData.codigo_token}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="font-semibold">Loja:</Label>
              <Input
                value={`${tokenData.cod_loja} - ${tokenData.loja_nome} - ${tokenData.loja_estado}`}
                readOnly
                className="bg-muted"
              />
            </div>
            
            <div>
              <Label className="font-semibold">Produto:</Label>
              <Input
                value={tokenData.produto}
                readOnly
                className="bg-muted"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="font-semibold">Quantidade:</Label>
              <Input
                value={tokenData.quantidade.toString()}
                readOnly
                className="bg-muted"
              />
            </div>
            
            <div>
              <Label className="font-semibold">Valor Solicitado:</Label>
              <Input
                value={formatCurrency(tokenData.valor_solicitado)}
                readOnly
                className="bg-muted"
              />
            </div>

            <div>
              <Label className="font-semibold">Preço Regular:</Label>
              <Input
                value={validationResult ? formatCurrency(validationResult.precoRegular) : "Calculando..."}
                readOnly
                className="bg-muted"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="cliente-identificado-aprovacao"
              checked={clienteIdentificado}
              onCheckedChange={handleClienteIdentificadoChange}
            />
            <Label
              htmlFor="cliente-identificado-aprovacao"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Cliente Identificado (considera margem adicional)
            </Label>
          </div>

          {validationResult && (
            <>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Desconto:</strong> {validationResult.desconto.toFixed(2)}%
                </p>
                <p className="text-sm text-blue-700">
                  <strong>Economia:</strong> {formatCurrency(validationResult.precoRegular - validationResult.precoSolicitado)}
                </p>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Informações de Validação</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label className="font-semibold">Preço Mínimo:</Label>
                    <p>{formatCurrency(validationResult.precoMinimo)}</p>
                  </div>
                  
                  <div>
                    <Label className="font-semibold">CMG Produto:</Label>
                    <p>{formatCurrency(validationResult.cmgProduto)}</p>
                  </div>
                  
                  <div>
                    <Label className="font-semibold">Desconto Alçada:</Label>
                    <p>{validationResult.descontoAlcada}</p>
                  </div>
                  
                  <div>
                    <Label className="font-semibold">Margem UF Loja:</Label>
                    <p>{validationResult.margemUF}</p>
                  </div>
                  
                  <div>
                    <Label className="font-semibold">Margem ZVDC:</Label>
                    <p>{validationResult.margemZVDC}</p>
                  </div>
                  
                  <div>
                    <Label className="font-semibold">Aliq UF:</Label>
                    <p>{validationResult.aliqUF.toFixed(2)}%</p>
                  </div>
                </div>
              </div>

              <div>
                <Label className="font-semibold">Status da Validação:</Label>
                <p className={`font-medium ${validationResult.aprovado ? 'text-green-600' : 'text-red-600'}`}>
                  {validationResult.retorno}
                </p>
                {validationResult.observacaoRejeicao && (
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Observação:</strong> {validationResult.observacaoRejeicao}
                  </p>
                )}
              </div>
            </>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={handleAprovar} 
              disabled={!validationResult?.aprovado || isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? "Processando..." : "Aprovar"}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRejeitar}
              disabled={isProcessing}
            >
              {isProcessing ? "Processando..." : "Rejeitar"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate("/solicitacao-tokens")}
              disabled={isProcessing}
            >
              Voltar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
