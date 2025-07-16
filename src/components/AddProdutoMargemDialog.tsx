
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import { Tables } from "@/integrations/supabase/types"
import { PercentageInput } from "@/components/PercentageInput"
import { CurrencyInput } from "@/components/CurrencyInput"

type CadastroProduto = Tables<"cadastro_produto">

interface AddProdutoMargemDialogProps {
  produtosCadastro: CadastroProduto[]
  onAdd: (data: any) => void
  isOpen: boolean
  onClose: () => void
}

export function AddProdutoMargemDialog({ produtosCadastro, onAdd, isOpen, onClose }: AddProdutoMargemDialogProps) {
  const [formData, setFormData] = useState({
    id_produto: produtosCadastro[0]?.id_produto || 0,
    margem: 0,
    margem_adc: 0,
    desconto: 0,
    tipo_aplicacao: "percentual",
    tipo_margem: "percentual",
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: "2030-12-31",
    observacao: "",
    st_ativo: 1
  })

  const [margemDisplay, setMargemDisplay] = useState("0,00%")
  const [margemAdcDisplay, setMargemAdcDisplay] = useState("0,00%")
  const [descontoDisplay, setDescontoDisplay] = useState("0,00%")

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
    } else {
      setMargemDisplay("R$ 0,00")
      setMargemAdcDisplay("R$ 0,00")
    }
    setFormData(prev => ({ ...prev, margem: 0, margem_adc: 0 }))
  }

  const handleSubmit = () => {
    onAdd(formData)
    // Reset form
    setFormData({
      id_produto: produtosCadastro[0]?.id_produto || 0,
      margem: 0,
      margem_adc: 0,
      desconto: 0,
      tipo_aplicacao: "percentual",
      tipo_margem: "percentual",
      data_inicio: new Date().toISOString().split('T')[0],
      data_fim: "2030-12-31",
      observacao: "",
      st_ativo: 1
    })
    setMargemDisplay("0,00%")
    setMargemAdcDisplay("0,00%")
    setDescontoDisplay("0,00%")
    onClose()
  }

  const selectedProduto = produtosCadastro.find(p => p.id_produto === formData.id_produto)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Produto Margem</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Produto</Label>
            <Select
              value={formData.id_produto.toString()}
              onValueChange={(value) => setFormData(prev => ({ ...prev, id_produto: parseInt(value) }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {produtosCadastro.map((produto) => (
                  <SelectItem key={produto.id_produto} value={produto.id_produto.toString()}>
                    {produto.id_produto} - {produto.nome_produto}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

          <div>
            <Label>Margem</Label>
            {formData.tipo_margem === "percentual" ? (
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
            )}
          </div>

          <div>
            <Label>Margem Adicional</Label>
            {formData.tipo_margem === "percentual" ? (
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
            )}
          </div>

          <div>
            <Label>% Desconto</Label>
            <PercentageInput
              value={descontoDisplay}
              onChange={handleDescontoChange}
              className="w-full"
            />
          </div>

          <div>
            <Label>Tipo Aplicação</Label>
            <Select
              value={formData.tipo_aplicacao}
              onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_aplicacao: value }))}
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
            <Button onClick={handleSubmit}>
              Adicionar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
