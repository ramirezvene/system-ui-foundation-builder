
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { LojaCombobox } from "@/components/LojaCombobox"
import { ProdutoCombobox } from "@/components/ProdutoCombobox"
import { supabase } from "@/integrations/supabase/client"
import { Tables } from "@/integrations/supabase/types"

type Loja = Tables<"cadastro_loja">
type Produto = Tables<"cadastro_produto">
type SubgrupoMargem = Tables<"subgrupo_margem">

export default function Emulador() {
  const [lojas, setLojas] = useState<Loja[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [lojaSelecionada, setLojaSelecionada] = useState<Loja | null>(null)
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null)
  const [subgrupoMargem, setSubgrupoMargem] = useState<SubgrupoMargem | null>(null)
  const [valorSolicitado, setValorSolicitado] = useState("")
  const [margemZVDC, setMargemZVDC] = useState("")
  
  // Campos calculados
  const [precoMinimo, setPrecoMinimo] = useState("")
  const [cmgProduto, setCmgProduto] = useState("")
  const [precoRegular, setPrecoRegular] = useState("")
  const [descontoAlcada, setDescontoAlcada] = useState("")
  const [margemUFLoja, setMargemUFLoja] = useState("")
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

    // Calcular Preço Mínimo
    const precoMin = cmg / (1 - (aliq / 100 + piscofins / 100)) / (1 - margemSubgrupo)
    setPrecoMinimo(precoMin.toFixed(2))

    // CMG Produto
    setCmgProduto(cmg.toFixed(2))

    // Preço Regular
    setPrecoRegular(pmc.toFixed(2))

    // Desconto Alçada
    setDescontoAlcada(produtoSelecionado.alcada === 1 ? "SIM" : "NÃO")

    // Calcular Margem UF Loja se valor solicitado estiver preenchido
    if (valorSolicitado) {
      const valorSolic = parseFloat(valorSolicitado)
      const margemUF = ((valorSolic * (1 - aliq / 100 - piscofins / 100)) - cmg) / (valorSolic * (1 - aliq / 100 - piscofins / 100))
      setMargemUFLoja(`${(margemUF * 100).toFixed(2)}%`)

      // Situação
      setSituacao(valorSolic >= precoMin ? "Aprovado" : "Reprovado")
    } else {
      setMargemUFLoja("")
      setSituacao("")
    }
  }

  const resetCalculatedFields = () => {
    setPrecoMinimo("")
    setCmgProduto("")
    setPrecoRegular("")
    setDescontoAlcada("")
    setMargemUFLoja("")
    setSituacao("")
    setMargemZVDC("")
  }

  const handleReset = () => {
    setLojaSelecionada(null)
    setProdutoSelecionado(null)
    setSubgrupoMargem(null)
    setValorSolicitado("")
    resetCalculatedFields()
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">Emulador</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel de Seleção */}
        <Card>
          <CardHeader>
            <CardTitle>Seleção</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="loja">Loja</Label>
              <LojaCombobox
                lojas={lojas}
                selectedLoja={lojaSelecionada}
                onSelectLoja={setLojaSelecionada}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="produto">Produto</Label>
              <ProdutoCombobox
                produtos={produtos}
                selectedProduto={produtoSelecionado}
                onSelectProduto={setProdutoSelecionado}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valorSolicitado">Valor Solicitado</Label>
              <Input
                id="valorSolicitado"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={valorSolicitado}
                onChange={(e) => setValorSolicitado(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                className={`flex-1 ${situacao === "Aprovado" ? "bg-green-600 hover:bg-green-700" : ""}`}
                disabled={!situacao}
              >
                APROVAR
              </Button>
              <Button variant="outline" onClick={handleReset}>
                LIMPAR
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Painel de Resultados */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Produto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div className="pt-4 border-t">
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
