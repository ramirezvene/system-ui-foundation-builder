
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tables } from "@/integrations/supabase/types"
import { PercentageInput } from "@/components/PercentageInput"
import { CurrencyInput } from "@/components/CurrencyInput"
import { ProdutoCombobox } from "@/components/ProdutoCombobox"
import { EstadoCombobox } from "@/components/EstadoCombobox"
import { LojaCombobox } from "@/components/LojaCombobox"
import { supabase } from "@/integrations/supabase/client"

type CadastroProduto = Tables<"cadastro_produto">
type Estado = Tables<"cadastro_estado">
type Loja = Tables<"cadastro_loja">

interface AddProdutoMargemDialogProps {
  produtosCadastro: CadastroProduto[]
  onAdd: (data: any) => void
  isOpen: boolean
  onClose: () => void
}

export function AddProdutoMargemDialog({ produtosCadastro, onAdd, isOpen, onClose }: AddProdutoMargemDialogProps) {
  const [formData, setFormData] = useState({
    id_produto: 0,
    margem: 0,
    margem_adc: 0,
    desconto: 0,
    tipo_aplicacao: "estado",
    tipo_margem: "percentual",
    tipo_referencia: "estado",
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: "2030-12-31",
    observacao: "",
    st_ativo: 1
  })

  const [selectedProduto, setSelectedProduto] = useState<CadastroProduto | null>(null)
  const [selectedEstado, setSelectedEstado] = useState<Estado | null>(null)
  const [selectedLoja, setSelectedLoja] = useState<Loja | null>(null)
  const [estados, setEstados] = useState<Estado[]>([])
  const [lojas, setLojas] = useState<Loja[]>([])

  const [margemDisplay, setMargemDisplay] = useState("0,00%")
  const [margemAdcDisplay, setMargemAdcDisplay] = useState("0,00%")
  const [descontoDisplay, setDescontoDisplay] = useState("0,00%")

  useEffect(() => {
    if (isOpen) {
      fetchEstados()
      fetchLojas()
    }
  }, [isOpen])

  const fetchEstados = async () => {
    try {
      const { data, error } = await supabase
        .from("cadastro_estado")
        .select("*")
        .eq("st_ativo", 1)
        .order("estado")
      
      if (error) throw error
      setEstados(data || [])
    } catch (error) {
      console.error("Erro ao buscar estados:", error)
    }
  }

  const fetchLojas = async () => {
    try {
      const { data, error } = await supabase
        .from("cadastro_loja")
        .select("*")
        .order("cod_loja")
      
      if (error) throw error
      setLojas(data || [])
    } catch (error) {
      console.error("Erro ao buscar lojas:", error)
    }
  }

  const handleMargemChange = (value: string) => {
    setMargemDisplay(value)
    if (formData.tipo_margem === "percentual") {
      const numericValue = parseFloat(value.replace('%', '').replace(',', '.')) || 0
      setFormData(prev => ({ ...prev, margem: numericValue }))
    } else {
      const numericValue = parseFloat(value.replace('R$', '').replace(/\./g, '').replace(',', '.')) / 100 || 0
      setFormData(prev => ({ ...prev, margem: numericValue }))
    }
  }

  const handleMargemAdcChange = (value: string) => {
    setMargemAdcDisplay(value)
    if (formData.tipo_margem === "percentual") {
      const numericValue = parseFloat(value.replace('%', '').replace(',', '.')) || 0
      setFormData(prev => ({ ...prev, margem_adc: numericValue }))
    } else {
      const numericValue = parseFloat(value.replace('R$', '').replace(/\./g, '').replace(',', '.')) / 100 || 0
      setFormData(prev => ({ ...prev, margem_adc: numericValue }))
    }
  }

  const handleDescontoChange = (value: string) => {
    setDescontoDisplay(value)
    const numericValue = parseFloat(value.replace('%', '').replace(',', '.')) || 0
    setFormData(prev => ({ ...prev, desconto: numericValue }))
  }

  const handleTipoMargemChange = (value: string) => {
    setFormData(prev => ({ ...prev, tipo_margem: value }))
    // Reset display values when changing type
    if (value === "percentual") {
      setMargemDisplay("0,00%")
      setMargemAdcDisplay("0,00%")
      setDescontoDisplay("0,00%")
    } else {
      setMargemDisplay("R$ 0,00")
      setMargemAdcDisplay("R$ 0,00")
      setDescontoDisplay("0,00%") // Desconto sempre percentual
    }
    setFormData(prev => ({ ...prev, margem: 0, margem_adc: 0, desconto: 0 }))
  }

  const handleSubmit = () => {
    if (!selectedProduto) return

    const finalFormData = {
      ...formData,
      id_produto: selectedProduto.id_produto
    }

    onAdd(finalFormData)
    
    // Reset form
    setFormData({
      id_produto: 0,
      margem: 0,
      margem_adc: 0,
      desconto: 0,
      tipo_aplicacao: "estado",
      tipo_margem: "percentual",
      tipo_referencia: "estado",
      data_inicio: new Date().toISOString().split('T')[0],
      data_fim: "2030-12-31",
      observacao: "",
      st_ativo: 1
    })
    setSelectedProduto(null)
    setSelectedEstado(null)
    setSelectedLoja(null)
    setMargemDisplay("0,00%")
    setMargemAdcDisplay("0,00%")
    setDescontoDisplay("0,00%")
    onClose()
  }

  const shouldShowField = (field: 'margem' | 'margem_adc' | 'desconto') => {
    if (formData.tipo_margem === 'valor') {
      return field === 'margem' || field === 'margem_adc'
    } else if (formData.tipo_margem === 'percentual') {
      return true // mostra todos os campos
    }
    return false
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Produto Margem</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Produto</Label>
            <ProdutoCombobox
              produtos={produtosCadastro}
              selectedProduto={selectedProduto}
              onProdutoChange={setSelectedProduto}
              placeholder="Selecionar produto..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo</Label>
              <Select
                value={formData.tipo_aplicacao}
                onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_aplicacao: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="estado">Estado</SelectItem>
                  <SelectItem value="loja">Loja</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tipo Ref</Label>
              {formData.tipo_aplicacao === "estado" ? (
                <EstadoCombobox
                  estados={estados}
                  selectedEstado={selectedEstado}
                  onEstadoChange={setSelectedEstado}
                  placeholder="Selecionar estado..."
                />
              ) : (
                <LojaCombobox
                  lojas={lojas}
                  selectedLoja={selectedLoja}
                  onLojaChange={setSelectedLoja}
                  placeholder="Selecionar loja..."
                />
              )}
            </div>
          </div>

          <div>
            <Label>Tipo Margem</Label>
            <Select
              value={formData.tipo_margem}
              onValueChange={handleTipoMargemChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentual">Percentual</SelectItem>
                <SelectItem value="valor">Valor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Margem</Label>
              {shouldShowField('margem') && (
                formData.tipo_margem === "percentual" ? (
                  <PercentageInput
                    value={margemDisplay}
                    onChange={handleMargemChange}
                    className="w-full"
                  />
                ) : (
                  <CurrencyInput
                    value={margemDisplay}
                    onChange={handleMargemChange}
                    className="w-full"
                    placeholder="R$ 0,00"
                  />
                )
              )}
            </div>

            <div>
              <Label>Margem Adc</Label>
              {shouldShowField('margem_adc') && (
                formData.tipo_margem === "percentual" ? (
                  <PercentageInput
                    value={margemAdcDisplay}
                    onChange={handleMargemAdcChange}
                    className="w-full"
                  />
                ) : (
                  <CurrencyInput
                    value={margemAdcDisplay}
                    onChange={handleMargemAdcChange}
                    className="w-full"
                    placeholder="R$ 0,00"
                  />
                )
              )}
            </div>

            <div>
              <Label>% Desc</Label>
              {shouldShowField('desconto') && formData.tipo_margem === 'percentual' && (
                <PercentageInput
                  value={descontoDisplay}
                  onChange={handleDescontoChange}
                  className="w-full"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data Início</Label>
              <Input
                type="date"
                value={formData.data_inicio}
                onChange={(e) => setFormData(prev => ({ ...prev, data_inicio: e.target.value }))}
              />
            </div>
            <div>
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={formData.data_fim}
                onChange={(e) => setFormData(prev => ({ ...prev, data_fim: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.st_ativo === 1}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, st_ativo: checked ? 1 : 0 }))}
            />
            <Label>Ativo</Label>
          </div>

          <div>
            <Label>Observação</Label>
            <Textarea
              value={formData.observacao}
              onChange={(e) => setFormData(prev => ({ ...prev, observacao: e.target.value }))}
              placeholder="Digite uma observação..."
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!selectedProduto}>
              Adicionar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
