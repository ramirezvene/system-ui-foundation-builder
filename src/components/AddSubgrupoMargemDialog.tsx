
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { PercentageInput } from "@/components/PercentageInput"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface AddSubgrupoMargemDialogProps {
  onAdd: () => void
  isOpen: boolean
  onClose: () => void
  maxCodSubgrupo: number
}

export function AddSubgrupoMargemDialog({ onAdd, isOpen, onClose, maxCodSubgrupo }: AddSubgrupoMargemDialogProps) {
  const [formData, setFormData] = useState({
    cod_subgrupo: maxCodSubgrupo,
    nome_subgrupo: "",
    margem: 0,
    margem_adc: 0,
    desconto: 0,
    qtde_max: 0,
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: "2030-12-31",
    observacao: "",
    st_ativo: 1
  })

  const [margemDisplay, setMargemDisplay] = useState("0,00%")
  const [margemAdcDisplay, setMargemAdcDisplay] = useState("0,00%")
  const [descontoDisplay, setDescontoDisplay] = useState("0,00%")
  const { toast } = useToast()

  const handleMargemChange = (value: string) => {
    setMargemDisplay(value)
    const numericValue = parseFloat(value.replace('%', '').replace(',', '.')) || 0
    setFormData(prev => ({ ...prev, margem: numericValue }))
  }

  const handleMargemAdcChange = (value: string) => {
    setMargemAdcDisplay(value)
    const numericValue = parseFloat(value.replace('%', '').replace(',', '.')) || 0
    setFormData(prev => ({ ...prev, margem_adc: numericValue }))
  }

  const handleDescontoChange = (value: string) => {
    setDescontoDisplay(value)
    const numericValue = parseFloat(value.replace('%', '').replace(',', '.')) || 0
    setFormData(prev => ({ ...prev, desconto: numericValue }))
  }

  const handleSubmit = async () => {
    try {
      const { error } = await supabase
        .from("subgrupo_margem")
        .insert({
          cod_subgrupo: formData.cod_subgrupo,
          nome_subgrupo: formData.nome_subgrupo,
          margem: formData.margem,
          margem_adc: formData.margem_adc,
          desconto: formData.desconto,
          qtde_max: formData.qtde_max,
          data_inicio: formData.data_inicio,
          data_fim: formData.data_fim,
          observacao: formData.observacao,
          st_ativo: formData.st_ativo
        })

      if (error) throw error

      onAdd()
      
      // Reset form
      setFormData({
        cod_subgrupo: maxCodSubgrupo + 1,
        nome_subgrupo: "",
        margem: 0,
        margem_adc: 0,
        desconto: 0,
        qtde_max: 0,
        data_inicio: new Date().toISOString().split('T')[0],
        data_fim: "2030-12-31",
        observacao: "",
        st_ativo: 1
      })
      setMargemDisplay("0,00%")
      setMargemAdcDisplay("0,00%")
      setDescontoDisplay("0,00%")
      onClose()

      toast({
        title: "Sucesso",
        description: "Subgrupo adicionado com sucesso"
      })
    } catch (error) {
      console.error("Erro ao adicionar subgrupo:", error)
      toast({
        title: "Erro",
        description: "Erro ao adicionar subgrupo",
        variant: "destructive"
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Subgrupo Margem</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Código Subgrupo</Label>
            <Input
              type="number"
              value={formData.cod_subgrupo}
              onChange={(e) => setFormData(prev => ({ ...prev, cod_subgrupo: parseInt(e.target.value) || 0 }))}
            />
          </div>

          <div>
            <Label>Nome Subgrupo</Label>
            <Input
              value={formData.nome_subgrupo}
              onChange={(e) => setFormData(prev => ({ ...prev, nome_subgrupo: e.target.value }))}
              placeholder="Digite o nome do subgrupo..."
            />
          </div>

          <div>
            <Label>Qtde Max</Label>
            <Input
              type="number"
              value={formData.qtde_max}
              onChange={(e) => setFormData(prev => ({ ...prev, qtde_max: parseInt(e.target.value) || 0 }))}
              min="0"
            />
          </div>

          <div>
            <Label>% Margem</Label>
            <PercentageInput
              value={margemDisplay}
              onChange={handleMargemChange}
              className="w-full"
            />
          </div>

          <div>
            <Label>% Margem Adicional</Label>
            <PercentageInput
              value={margemAdcDisplay}
              onChange={handleMargemAdcChange}
              className="w-full"
            />
          </div>

          <div>
            <Label>% Desconto</Label>
            <PercentageInput
              value={descontoDisplay}
              onChange={handleDescontoChange}
              className="w-full"
            />
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
              maxLength={100}
            />
            <div className="text-sm text-gray-500 mt-1">
              {formData.observacao.length}/100 caracteres
            </div>
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
