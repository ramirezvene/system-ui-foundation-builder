
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface Loja {
  cod_loja: number
  loja: string
  estado: string
}

interface Produto {
  cod_prod: number
  produto: string
  cod_grupo: number
  grupo: string
  ncm: string
  pmc_rs: number
  pmc_sc: number
  pmc_pr: number
  sugerido_rs: number
  sugerido_sc: number
  sugerido_pr: number
}

export default function Emulador() {
  const { toast } = useToast()
  const [lojas, setLojas] = useState<Loja[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [selectedLoja, setSelectedLoja] = useState<Loja | null>(null)
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null)
  
  const [formData, setFormData] = useState({
    idLojaEstado: "",
    idProduto: "",
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
        .order('produto')
      
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

  const handleLojaChange = (value: string) => {
    const loja = lojas.find(l => l.cod_loja.toString() === value)
    setSelectedLoja(loja || null)
    setFormData(prev => ({
      ...prev,
      idLojaEstado: loja ? `${loja.cod_loja} - ${loja.loja} - ${loja.estado}` : ""
    }))
  }

  const handleProdutoChange = (value: string) => {
    const produto = produtos.find(p => p.cod_prod.toString() === value)
    setSelectedProduto(produto || null)
    setFormData(prev => ({
      ...prev,
      idProduto: produto ? `${produto.cod_prod} - ${produto.produto}` : "",
      precoRegular: getPrecoRegular(produto, selectedLoja?.estado || 'RS').toString()
    }))
  }

  const getPrecoRegular = (produto: Produto | null, estado: string): number => {
    if (!produto) return 0
    switch (estado) {
      case 'RS': return produto.pmc_rs || 0
      case 'SC': return produto.pmc_sc || 0
      case 'PR': return produto.pmc_pr || 0
      default: return produto.pmc_rs || 0
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Calcular percentual de desconto quando valor solicitado ou preço regular mudarem
    if (field === 'valorSolicitado' || field === 'precoRegular') {
      const valorSolicitado = field === 'valorSolicitado' ? parseFloat(value) : parseFloat(formData.valorSolicitado)
      const precoRegular = field === 'precoRegular' ? parseFloat(value) : parseFloat(formData.precoRegular)
      
      if (valorSolicitado && precoRegular && precoRegular > 0) {
        const percentual = ((precoRegular - valorSolicitado) / precoRegular * 100).toFixed(2)
        setFormData(prev => ({
          ...prev,
          percentualDesconto: percentual
        }))
      }
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
            <Select onValueChange={handleLojaChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma loja" />
              </SelectTrigger>
              <SelectContent>
                {lojas.map((loja) => (
                  <SelectItem key={loja.cod_loja} value={loja.cod_loja.toString()}>
                    {loja.cod_loja} - {loja.loja} - {loja.estado}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="idProduto" className="text-sm font-medium">
              ID/Produto
            </Label>
            <Select onValueChange={handleProdutoChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um produto" />
              </SelectTrigger>
              <SelectContent>
                {produtos.map((produto) => (
                  <SelectItem key={produto.cod_prod} value={produto.cod_prod.toString()}>
                    {produto.cod_prod} - {produto.produto}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              onChange={(e) => handleInputChange("percentualDesconto", e.target.value)}
              disabled
              className="bg-muted"
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
              onChange={(e) => handleInputChange("precoMinimo", e.target.value)}
              disabled
              className="bg-muted"
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
              onChange={(e) => handleInputChange("cmgProduto", e.target.value)}
              disabled
              className="bg-muted"
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
              onChange={(e) => handleInputChange("precoRegular", e.target.value)}
              disabled
              className="bg-muted"
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
              onChange={(e) => handleInputChange("descontoAlcada", e.target.value)}
              disabled
              className="bg-muted"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="margemUfLoja" className="text-sm font-medium">
              Margem UF Loja
            </Label>
            <Input
              id="margemUfLoja"
              placeholder="% Margem"
              value={formData.margemUfLoja}
              onChange={(e) => handleInputChange("margemUfLoja", e.target.value)}
              disabled
              className="bg-muted"
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
              onChange={(e) => handleInputChange("margemZvdc", e.target.value)}
              disabled
              className="bg-muted"
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
              onChange={(e) => handleInputChange("situacao", e.target.value)}
              disabled
              className="bg-muted"
            />
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <Label htmlFor="observacao" className="text-sm font-medium">
            Observação
          </Label>
          <textarea
            id="observacao"
            className="w-full min-h-[80px] px-3 py-2 border border-input bg-background rounded-md text-sm resize-none"
            placeholder="Observação"
            value={formData.observacao}
            onChange={(e) => handleInputChange("observacao", e.target.value)}
            disabled
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button className="bg-success hover:bg-success/90 text-success-foreground">
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
