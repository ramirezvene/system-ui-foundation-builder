
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Edit } from "lucide-react"
import { FilterCombobox } from "@/components/FilterCombobox"
import { DateRangePickerComponent } from "@/components/DateRangePickerComponent"
import { DateRange } from "react-day-picker"

interface DescontoSubgrupo {
  id: string
  descricao: string
  condicao: string
  montante: number
  dataInicio: string
  dataFim: string
}

export default function ConfiguracaoDescontoSubgrupo() {
  const [selectedFilter, setSelectedFilter] = useState("")
  const [filtro, setFiltro] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  
  const [descontos] = useState<DescontoSubgrupo[]>([
    {
      id: "MED000039",
      descricao: "REFERENCIA ONEROSO CONTROLADO",
      condicao: "OK",
      montante: 10.00,
      dataInicio: "01/01/2025",
      dataFim: "01/01/2030"
    },
    {
      id: "CNV000009",
      descricao: "BEBIDAS",
      condicao: "OK",
      montante: 4.00,
      dataInicio: "01/01/2025",
      dataFim: "01/01/2030"
    },
    {
      id: "DER000001",
      descricao: "DERMO-COSMETICOS",
      condicao: "OK",
      montante: 1.00,
      dataInicio: "01/01/2025",
      dataFim: "01/01/2030"
    },
    {
      id: "MED000033",
      descricao: "REFERENCIA",
      condicao: "OK",
      montante: 0.00,
      dataInicio: "01/01/2025",
      dataFim: "01/01/2030"
    },
    {
      id: "PRF000002",
      descricao: "FRALDAS",
      condicao: "OK",
      montante: 0.00,
      dataInicio: "01/01/2025",
      dataFim: "01/01/2030"
    }
  ])

  const [editingItem, setEditingItem] = useState<DescontoSubgrupo | null>(null)
  const [editForm, setEditForm] = useState({
    montante: "",
    dataInicio: "",
    dataFim: ""
  })

  const handleEdit = (item: DescontoSubgrupo) => {
    setEditingItem(item)
    setEditForm({
      montante: item.montante.toString(),
      dataInicio: item.dataInicio,
      dataFim: item.dataFim
    })
  }

  const handleSave = () => {
    console.log("Salvando alterações:", editForm)
    setEditingItem(null)
  }

  const handleLimpar = () => {
    setSelectedFilter("")
    setFiltro("")
    setDateRange(undefined)
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">
        Configuração Desconto Subgrupo
      </h1>
      
      <div className="bg-card rounded-lg border p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <FilterCombobox
            selectedFilter={selectedFilter}
            onSelectFilter={setSelectedFilter}
          />
          
          {selectedFilter === "data_inicio" || selectedFilter === "data_fim" ? (
            <div className="md:col-span-2">
              <DateRangePickerComponent
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                placeholder="Selecione o período"
              />
            </div>
          ) : (
            <Input
              placeholder="Filtro"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="md:col-span-2"
            />
          )}
          
          <div className="flex gap-2">
            <Button className="bg-primary hover:bg-primary/90 flex-1">
              FILTRAR
            </Button>
            <Button variant="outline" onClick={handleLimpar} className="flex-1">
              LIMPAR
            </Button>
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>ID</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Cond</TableHead>
                <TableHead>Montante</TableHead>
                <TableHead>Data Início</TableHead>
                <TableHead>Data Final</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {descontos.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.id}</TableCell>
                  <TableCell>{item.descricao}</TableCell>
                  <TableCell>{item.condicao}</TableCell>
                  <TableCell>{item.montante.toFixed(2)}%</TableCell>
                  <TableCell>{item.dataInicio}</TableCell>
                  <TableCell>{item.dataFim}</TableCell>
                  <TableCell className="text-center">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Editar Desconto - {item.id}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="montante">Montante (%)</Label>
                            <Input
                              id="montante"
                              type="number"
                              step="0.01"
                              value={editForm.montante}
                              onChange={(e) => setEditForm(prev => ({
                                ...prev,
                                montante: e.target.value
                              }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="dataInicio">Data Início</Label>
                            <Input
                              id="dataInicio"
                              type="date"
                              value={editForm.dataInicio.split("/").reverse().join("-")}
                              onChange={(e) => setEditForm(prev => ({
                                ...prev,
                                dataInicio: e.target.value.split("-").reverse().join("/")
                              }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="dataFim">Data Fim</Label>
                            <Input
                              id="dataFim"
                              type="date"
                              value={editForm.dataFim.split("/").reverse().join("-")}
                              onChange={(e) => setEditForm(prev => ({
                                ...prev,
                                dataFim: e.target.value.split("-").reverse().join("/")
                              }))}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline">Cancelar</Button>
                            <Button onClick={handleSave}>Salvar</Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
          <span>1-5 de 5</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              &lt;
            </Button>
            <Button variant="outline" size="sm" disabled>
              &gt;
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
