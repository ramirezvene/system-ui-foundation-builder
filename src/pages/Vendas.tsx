
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

type Loja = Tables<"cadastro_loja">
type Produto = Tables<"cadastro_produto">

export default function Vendas() {
  const [lojas, setLojas] = useState<Loja[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [selectedLoja, setSelectedLoja] = useState<Loja | null>(null)
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null)
  const [precoAtual, setPrecoAtual] = useState<number>(0)
  const [novoPreco, setNovoPreco] = useState<string>("")
  const [quantidade, setQuantidade] = useState<string>("1")
  const { toast } = useToast()

  useEffect(() => {
    fetchLojas()
    fetchProdutos()
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
      toast({
        title: "Erro",
        description: "Erro ao carregar lojas",
        variant: "destructive"
      })
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
      toast({
        title: "Erro",
        description: "Erro ao carregar produtos",
        variant: "destructive"
      })
    }
  }

  const validateSolicitacao = (): string | null => {
    if (!selectedProduto || !selectedLoja) return "Selecione uma loja e um produto"

    // Validar alçada do produto
    if (selectedProduto.alcada !== 1) {
      return "O produto não permite solicitar Token."
    }

    // Validar meta da loja
    if (selectedLoja.meta_loja !== 1) {
      return "Bloqueado devido a Meta de Desconto estar irregular."
    }

    // Validar DRE da loja
    if (selectedLoja.dre_negativo !== 1) {
      return "Bloqueado devido a DRE estar irregular."
    }

    // Validar ruptura do produto
    if (selectedProduto.st_ruptura !== 0) {
      return "Produto possui Ruptura de Estoque."
    }

    // Validar pricing do produto
    if (selectedProduto.st_pricing !== 0) {
      return "Produto possui Bloqueado para solicitar Token."
    }

    // Validar se o novo preço é menor que o atual
    const novoPrecoNum = parseFloat(novoPreco)
    if (isNaN(novoPrecoNum) || novoPrecoNum >= precoAtual) {
      return "O novo preço deve ser menor que o preço atual."
    }

    return null
  }

  const handleSolicitarToken = async () => {
    const validationError = validateSolicitacao()
    if (validationError) {
      toast({
        title: "Validação",
        description: validationError,
        variant: "destructive"
      })
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
      const novoPrecoNum = parseFloat(novoPreco)
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
          cmg_produto: selectedProduto!.cmg_rs || selectedProduto!.cmg_sc || selectedProduto!.cmg_pr || 0
        })

      if (insertDetailError) throw insertDetailError

      toast({
        title: "Sucesso",
        description: `Token ${tokenCode} solicitado com sucesso!`
      })

      // Limpar formulário
      setSelectedLoja(null)
      setSelectedProduto(null)
      setNovoPreco("")
      setQuantidade("1")
      setPrecoAtual(0)

    } catch (error) {
      console.error("Erro ao solicitar token:", error)
      toast({
        title: "Erro",
        description: "Erro ao solicitar token",
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

  return (
    <div className="p-6">
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
                <Input
                  type="number"
                  step="0.01"
                  value={novoPreco}
                  onChange={(e) => setNovoPreco(e.target.value)}
                  placeholder="0.00"
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
                <strong>Desconto:</strong> {((precoAtual - parseFloat(novoPreco || "0")) / precoAtual * 100).toFixed(2)}%
              </p>
              <p className="text-sm text-blue-700">
                <strong>Economia:</strong> {formatCurrency(precoAtual - parseFloat(novoPreco || "0"))}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSolicitarToken} disabled={!selectedLoja || !selectedProduto || !novoPreco}>
              Solicitar Token
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedLoja(null)
                setSelectedProduto(null)
                setNovoPreco("")
                setQuantidade("1")
                setPrecoAtual(0)
              }}
            >
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
