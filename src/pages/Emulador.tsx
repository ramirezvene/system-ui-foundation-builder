
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export default function Emulador() {
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
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
            <Input
              id="idLojaEstado"
              placeholder="ID - Nome - UF"
              value={formData.idLojaEstado}
              onChange={(e) => handleInputChange("idLojaEstado", e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="idProduto" className="text-sm font-medium">
              ID/Produto
            </Label>
            <Input
              id="idProduto"
              placeholder="ID - Descrição"
              value={formData.idProduto}
              onChange={(e) => handleInputChange("idProduto", e.target.value)}
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
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="valorSolicitado" className="text-sm font-medium">
              Valor
            </Label>
            <Input
              id="valorSolicitado"
              placeholder="Valor Solicitado"
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
