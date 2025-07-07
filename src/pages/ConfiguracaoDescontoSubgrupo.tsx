import { useState, useEffect } from "react"
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
import { Edit, Download, Upload } from "lucide-react"
import { FilterCombobox } from "@/components/FilterCombobox"
import { DateRangePickerComponent } from "@/components/DateRangePickerComponent"
import { DateRange } from "react-day-picker"
import { supabase } from "@/integrations/supabase/client"
import { Tables } from "@/integrations/supabase/types"
import { useToast } from "@/hooks/use-toast"

type SubgrupoMargem = Tables<"subgrupo_margem">

interface DescontoSubgrupo extends SubgrupoMargem {
  condicao: string
  dataInicio: string
  dataFim: string
}

export default function ConfiguracaoDescontoSubgrupo() {
  const [selectedFilter, setSelectedFilter] = useState("")
  const [filtro, setFiltro] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [descontos, setDescontos] = useState<DescontoSubgrupo[]>([])
  const [filteredDescontos, setFilteredDescontos] = useState<DescontoSubgrupo[]>([])
  const [editingItem, setEditingItem] = useState<DescontoSubgrupo | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    margem: "",
    dataInicio: "",
    dataFim: ""
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchSubgrupoMargem()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [descontos, selectedFilter, filtro, dateRange])

  const fetchSubgrupoMargem = async () => {
    try {
      const { data, error } = await supabase
        .from("subgrupo_margem")
        .select("*")
        .order("cod_subgrupo")
      
      if (error) throw error
      
      // Transformar dados para incluir campos necessários
      const transformedData: DescontoSubgrupo[] = (data || []).map(item => ({
        ...item,
        condicao: "OK",
        dataInicio: item.data_inicio || "01/01/2025",
        dataFim: item.data_fim || "01/01/2030"
      }))
      
      setDescontos(transformedData)
      setFilteredDescontos(transformedData)
    } catch (error) {
      console.error("Erro ao buscar subgrupos:", error)
    }
  }

  const applyFilters = () => {
    let filtered = [...descontos]

    if (selectedFilter && filtro) {
      switch (selectedFilter) {
        case "cod_subgrupo":
          filtered = filtered.filter(item => 
            item.cod_subgrupo.toString().includes(filtro)
          )
          break
        case "nome_subgrupo":
          filtered = filtered.filter(item => 
            item.nome_subgrupo.toLowerCase().includes(filtro.toLowerCase())
          )
          break
        case "condicao":
          filtered = filtered.filter(item => 
            item.condicao.toLowerCase().includes(filtro.toLowerCase())
          )
          break
        case "margem":
          filtered = filtered.filter(item => 
            item.margem.toString().includes(filtro)
          )
          break
      }
    }

    if (selectedFilter === "data_inicio" || selectedFilter === "data_fim") {
      if (dateRange?.from && dateRange?.to) {
        // Aqui você implementaria a filtragem por data
        // Por agora, mantém todos os registros
        filtered = filtered
      }
    }

    setFilteredDescontos(filtered)
  }

  const handleEdit = (item: DescontoSubgrupo) => {
    setEditingItem(item)
    setEditForm({
      margem: item.margem.toString(),
      dataInicio: item.dataInicio,
      dataFim: item.dataFim
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!editingItem) return

    try {
      const { error } = await supabase
        .from("subgrupo_margem")
        .update({
          margem: parseFloat(editForm.margem),
          data_inicio: editForm.dataInicio.split("/").reverse().join("-"),
          data_fim: editForm.dataFim.split("/").reverse().join("-")
        })
        .eq("cod_subgrupo", editingItem.cod_subgrupo)

      if (error) throw error

      // Atualizar dados locais
      const updatedDescontos = descontos.map(item => 
        item.cod_subgrupo === editingItem.cod_subgrupo 
          ? { ...item, margem: parseFloat(editForm.margem), dataInicio: editForm.dataInicio, dataFim: editForm.dataFim }
          : item
      )
      setDescontos(updatedDescontos)
      setIsDialogOpen(false)
      setEditingItem(null)
      
      toast({
        title: "Sucesso",
        description: "Desconto atualizado com sucesso"
      })
    } catch (error) {
      console.error("Erro ao salvar:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar desconto",
        variant: "destructive"
      })
    }
  }

  const handleCancel = () => {
    setIsDialogOpen(false)
    setEditingItem(null)
    setEditForm({
      margem: "",
      dataInicio: "",
      dataFim: ""
    })
  }

  const handleLimpar = () => {
    setSelectedFilter("")
    setFiltro("")
    setDateRange(undefined)
  }

  const handleFiltrar = () => {
    applyFilters()
  }

  const handleExportCSV = () => {
    const csvContent = [
      ["ID", "Descrição", "Condição", "Montante", "Data Início", "Data Final"],
      ...filteredDescontos.map(item => [
        item.cod_subgrupo,
        item.nome_subgrupo,
        item.condicao,
        `${item.margem.toFixed(2)}%`,
        item.dataInicio,
        item.dataFim
      ])
    ].map(row => row.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "subgrupos.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="bg-card rounded-lg border p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Configuração Desconto Subgrupo</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Importar CSV
          </Button>
        </div>
      </div>
      
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
          <Button onClick={handleFiltrar} className="bg-primary hover:bg-primary/90 flex-1">
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
            {filteredDescontos.map((item) => (
              <TableRow key={item.cod_subgrupo}>
                <TableCell className="font-medium">{item.cod_subgrupo}</TableCell>
                <TableCell>{item.nome_subgrupo}</TableCell>
                <TableCell>{item.condicao}</TableCell>
                <TableCell>{item.margem.toFixed(2)}%</TableCell>
                <TableCell>{item.dataInicio}</TableCell>
                <TableCell>{item.dataFim}</TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(item)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
        <span>1-{filteredDescontos.length} de {descontos.length}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            &lt;
          </Button>
          <Button variant="outline" size="sm" disabled>
            &gt;
          </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Desconto - {editingItem?.cod_subgrupo}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="margem">Montante (%)</Label>
              <Input
                id="margem"
                type="number"
                step="0.01"
                value={editForm.margem}
                onChange={(e) => setEditForm(prev => ({
                  ...prev,
                  margem: e.target.value
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
              <Button variant="outline" onClick={handleCancel}>Cancelar</Button>
              <Button onClick={handleSave}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
