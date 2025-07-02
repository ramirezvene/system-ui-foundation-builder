
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { LojaCombobox } from "@/components/LojaCombobox"
import { ProdutoCombobox } from "@/components/ProdutoCombobox"

interface Loja {
  cod_loja: number
  loja: string
  estado: string
}

interface Produto {
  id_produto: number
  nome_produto: string
  subgrupo_id: number | null
  ncm: string | null
  alcada: number | null
  aliq_rs: number | null
  aliq_sc: number | null
  aliq_pr: number | null
  piscofins: number | null
  observacao: string | null
  pmc_rs: number | null
  pmc_sc: number | null
  pmc_pr: number | null
  cmg_rs: number | null
  cmg_sc: number | null
  cmg_pr: number | null
}

interface SubgrupoMargem {
  cod_subgrupo: number
  nome_subgrupo: string
  margem: number
}

export default function Emulador() {
  const { toast } = useToast()
  const [lojas, setLojas] = useState<Loja[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [subgrupos, setSubgrupos] = useState<SubgrupoMargem[]>([])
  const [selectedLoja, setSelectedLoja] = useState<Loja | null>(null)
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null)
  
  const [formData, setFormData] = useState({
    qtdeProduto: "",
    valorSolicitado: "",
    percentualDesconto: "",
    precoMinimo: "",
    cmgProduto: "",
    precoRegular: "",
    descontoAlcada: "",
    margemUfLoja: "",
    margemZvdc: "",
    situacao: "",
    observacao: ""
  })

  useEffect(() => {
    fetchLojas()
    fetchProdutos()
    fetchSubgrupos()
  }, [])

  const fetchLojas = async () => {
    try {
      const { data, error } = await supabase
        .from('cadastro_loja')
        .select('*')
        .order('loja')
      
      if (error) throw error
      setLojas(data || [])
    } catch (error) {
      console.error('Erro ao buscar lojas:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as lojas",
        variant: "destructive"
      })
    }
  }

  const fetchProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from('cadastro_produto')
        .select('*')
        .order('nome_produto')
      
      if (error) throw error
      setProdutos(data || [])
    } catch (error) {
      console.error('Erro ao buscar produtos:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os produtos",
        variant: "destructive"
      })
    }
  }

  const fetchSubgrupos = async () => {
    try {
      const { data, error } = await supabase
        .from('subgrupo_margem')
        .select('*')
        .order('nome_subgrupo')
      
      if (error) throw error
      setSubgrupos(data || [])
    } catch (error) {
      console.error('Erro ao buscar subgrupos:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os subgrupos",
        variant: "destructive"
      })
    }
  }

  const resetCalculatedFields = () => {
    setFormData(prev => ({
      ...prev,
      percentualDesconto: "",
      precoMinimo: "",
      cmgProduto: "",
      precoRegular: "",
      descontoAlcada: "",
      margemUfLoja: "",
      margemZvdc: "",
      situacao: "",
      observacao: ""
    }))
  }

  const calculateFields = (produto: Produto | null, loja: Loja | null, valorSolicitado: string) => {
    if (!produto || !loja) return

    const estado = loja.estado
    let aliq = 0
    let cmg = 0
    let pmc = 0

    // Buscar valores baseados no estado
    switch (estado) {
      case 'RS':
        aliq = (produto.aliq_rs || 0) / 100
        cmg = produto.cmg_rs || 0
        pmc = produto.pmc_rs || 0
        break
      case 'SC':
        aliq = (produto.aliq_sc || 0) / 100
        cmg = produto.cmg_sc || 0
        pmc = produto.pmc_sc || 0
        break
      case 'PR':
        aliq = (produto.aliq_pr || 0) / 100
        cmg = produto.cmg_pr || 0
        pmc = produto.pmc_pr || 0
        break
    }

    const piscofins = (produto.piscofins || 0) / 100
    
    // Buscar margem do subgrupo
    const subgrupo = subgrupos.find(s => s.cod_subgrupo === produto.subgrupo_id)
    const margem = subgrupo ? subgrupo.margem / 100 : 0

    // Calcular Preço Mínimo
    const precoMinimo = cmg / (1 - aliq - piscofins) / (1 - margem)

    // CMG Produto
    const cmgProduto = cmg

    // Preço Regular
    const precoRegular = pmc

    // Desconto Alçada
    const descontoAlcada = produto.alcada === 1 ? "SIM" : "NÃO"

    let margemUfLoja = ""
    let situacao = ""
    let percentualDesconto = ""

    if (valorSolicitado) {
      const valor = parseFloat(valorSolicitado)
      
      // Calcular Margem UF Loja
      const baseCalculo = valor * (1 - aliq - piscofins)
      margemUfLoja = (((baseCalculo - cmg) / baseCalculo) * 100).toFixed(2)

      // Calcular percentual de desconto
      if (precoRegular > 0) {
        percentualDesconto = (((precoRegular - valor) / precoRegular) * 100).toFixed(2)
      }

      // Calcular situação
      situacao = valor >= precoMinimo ? "Aprovado" : "Reprovado"
    }

    setFormData(prev => ({
      ...prev,
      precoMinimo: precoMinimo.toFixed(2),
      cmgProduto: cmgProduto.toFixed(2),
      precoRegular: precoRegular.toFixed(2),
      descontoAlcada: descontoAlcada,
      margemUfLoja: margemUfLoja,
      percentualDesconto: percentualDesconto,
      situacao: situacao
    }))
  }

  const handleLojaChange = (loja: Loja | null) => {
    setSelectedLoja(loja)
    if (!loja) {
      resetCalculatedFields()
    } else {
      calculateFields(selectedProduto, loja, formData.valorSolicitado)
    }
  }

  const handleProdutoChange = (produto: Produto | null) => {
    setSelectedProduto(produto)
    if (!produto) {
      resetCalculatedFields()
    } else {
      calculateFields(produto, selectedLoja, formData.valorSolicitado)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Recalcular campos quando valor solicitado muda
    if (field === 'valorSolicitado') {
      calculateFields(selectedProduto, selectedLoja, value)
    }

    // Se o campo quantidade for limpo, resetar campos calculados
    if (field === 'qtdeProduto' && value === "") {
      resetCalculatedFields()
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">Emulador</h1>
      
      <div className="bg-card rounded-lg border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="idLojaEstado" className="text-sm font-medium">
              ID/Loja/Estado
            </Label>
            <LojaCombobox
              lojas={lojas}
              selectedLoja={selectedLoja}
              onLojaChange={handleLojaChange}
              placeholder="Buscar loja por código ou nome"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="idProduto" className="text-sm font-medium">
              ID/Produto
            </Label>
            <ProdutoCombobox
              produtos={produtos}
              selectedProduto={selectedProduto}
              onProdutoChange={handleProdutoChange}
              placeholder="Buscar produto por código ou nome"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="qtdeProduto" className="text-sm font-medium">
              Qtde.
            </Label>
            <Input
              id="qtdeProduto"
              placeholder="Qtde. Produto"
              value={formData.qtdeProduto}
              onChange={(e) => handleInputChange("qtdeProduto", e.target.value)}
              className="h-10"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="valorSolicitado" className="text-sm font-medium">
              Valor
            </Label>
            <Input
              id="valorSolicitado"
              placeholder="Valor Solicitado"
              type="number"
              step="0.01"
              value={formData.valorSolicitado}
              onChange={(e) => handleInputChange("valorSolicitado", e.target.value)}
              className="h-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="percentualDesconto" className="text-sm font-medium">
              % Desconto
            </Label>
            <Input
              id="percentualDesconto"
              placeholder="Percentual de Desconto"
              value={formData.percentualDesconto}
              disabled
              className="bg-muted h-10"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="precoMinimo" className="text-sm font-medium">
              Preço Mínimo
            </Label>
            <Input
              id="precoMinimo"
              placeholder="Preço Mínimo"
              value={formData.precoMinimo}
              disabled
              className="bg-muted h-10"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cmgProduto" className="text-sm font-medium">
              CMG Produto
            </Label>
            <Input
              id="cmgProduto"
              placeholder="CMG Produto"
              value={formData.cmgProduto}
              disabled
              className="bg-muted h-10"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="precoRegular" className="text-sm font-medium">
              Preço Regular
            </Label>
            <Input
              id="precoRegular"
              placeholder="Preço Regular"
              value={formData.precoRegular}
              disabled
              className="bg-muted h-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="descontoAlcada" className="text-sm font-medium">
              Desconto Alçada
            </Label>
            <Input
              id="descontoAlcada"
              placeholder="Desconto Alçada"
              value={formData.descontoAlcada}
              disabled
              className="bg-muted h-10"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="margemUfLoja" className="text-sm font-medium">
              Margem UF Loja
            </Label>
            <Input
              id="margemUfLoja"
              placeholder="% Margem"
              value={formData.margemUfLoja ? `${formData.margemUfLoja}%` : ""}
              disabled
              className="bg-muted h-10"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="margemZvdc" className="text-sm font-medium">
              Margem ZVDC
            </Label>
            <Input
              id="margemZvdc"
              placeholder="% Margem"
              value={formData.margemZvdc}
              disabled
              className="bg-muted h-10"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="situacao" className="text-sm font-medium">
              Situação
            </Label>
            <Input
              id="situacao"
              placeholder="Situação"
              value={formData.situacao}
              disabled
              className="bg-muted h-10"
            />
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <Label htmlFor="observacao" className="text-sm font-medium">
            Observação
          </Label>
          <textarea
            id="observacao"
            className="w-full min-h-[80px] px-3 py-2 border border-input bg-muted rounded-md text-sm resize-none"
            placeholder="Observação"
            value={formData.observacao}
            disabled
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button className="bg-[#03BA55] hover:bg-[#03BA55]/90 text-white">
            APROVAR
          </Button>
          <Button className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
            RECUSAR
          </Button>
        </div>
      </div>
    </div>
  )
}
