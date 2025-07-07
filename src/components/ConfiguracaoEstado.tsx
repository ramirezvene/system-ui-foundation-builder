
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, Download, Upload } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { Tables } from "@/integrations/supabase/types"
import { useToast } from "@/hooks/use-toast"

type Estado = Tables<"cadastro_estado">

export default function ConfiguracaoEstado() {
  const [estados, setEstados] = useState<Estado[]>([])
  const [filteredEstados, setFilteredEstados] = useState<Estado[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [editingEstado, setEditingEstado] = useState<Estado | null>(null)
  const [formData, setFormData] = useState({
    st_ativo: 1
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchEstados()
  }, [])

  useEffect(() => {
    const filtered = estados.filter(estado =>
      estado.nome_estado.toLowerCase().includes(searchTerm.toLowerCase()) ||
      estado.estado.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredEstados(filtered)
  }, [estados, searchTerm])

  const fetchEstados = async () => {
    try {
      const { data, error } = await supabase
        .from("cadastro_estado")
        .select("*")
        .order("nome_estado")
      
      if (error) throw error
      setEstados(data || [])
    } catch (error) {
      console.error("Erro ao buscar estados:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar estados",
        variant: "destructive"
      })
    }
  }

  const handleEdit = (estado: Estado) => {
    setEditingEstado(estado)
    setFormData({
      st_ativo: estado.st_ativo || 1
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!editingEstado) return

    try {
      const { error } = await supabase
        .from("cadastro_estado")
        .update({
          st_ativo: formData.st_ativo,
          updated_at: new Date().toISOString()
        })
        .eq("id", editingEstado.id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Estado atualizado com sucesso"
      })

      setIsDialogOpen(false)
      fetchEstados()
    } catch (error) {
      console.error("Erro ao salvar:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar estado",
        variant: "destructive"
      })
    }
  }

  const handleExportCSV = () => {
    const csvContent = [
      ["ID", "Estado", "Nome", "Status", "Data Criação"],
      ...filteredEstados.map(estado => [
        estado.id,
        estado.estado,
        estado.nome_estado,
        estado.st_ativo === 1 ? "Ativo" : "Inativo",
        new Date(estado.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "estados.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getStatusBadge = (status: number) => {
    return (
      <span className={`px-2 py-1 rounded text-sm ${
        status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {status === 1 ? 'Ativo' : 'Inativo'}
      </span>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Configuração de Estados
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
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Pesquisar por estado ou nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data Criação</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEstados.map((estado) => (
              <TableRow key={estado.id}>
                <TableCell>{estado.id}</TableCell>
                <TableCell>{estado.estado}</TableCell>
                <TableCell>{estado.nome_estado}</TableCell>
                <TableCell>{getStatusBadge(estado.st_ativo)}</TableCell>
                <TableCell>{new Date(estado.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Dialog open={isDialogOpen && editingEstado?.id === estado.id} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(estado)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar Estado - {estado.nome_estado}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Código</Label>
                            <Input value={estado.estado} readOnly className="bg-muted" />
                          </div>
                          <div>
                            <Label>Nome</Label>
                            <Input value={estado.nome_estado} readOnly className="bg-muted" />
                          </div>
                        </div>
                        
                        <div>
                          <Label>Status</Label>
                          <select
                            className="w-full px-3 py-2 border border-input rounded-md"
                            value={formData.st_ativo}
                            onChange={(e) => setFormData({...formData, st_ativo: parseInt(e.target.value)})}
                          >
                            <option value={1}>Ativo</option>
                            <option value={0}>Inativo</option>
                          </select>
                        </div>

                        <div className="flex gap-2 pt-4">
                          <Button onClick={handleSave}>Salvar</Button>
                          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
