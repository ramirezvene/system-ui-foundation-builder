
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { Tables } from "@/integrations/supabase/types"
import { useToast } from "@/hooks/use-toast"

type Loja = Tables<"cadastro_loja">

export default function ConfiguracaoTokenLoja() {
  const [lojas, setLojas] = useState<Loja[]>([])
  const [filteredLojas, setFilteredLojas] = useState<Loja[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [editingLoja, setEditingLoja] = useState<Loja | null>(null)
  const [formData, setFormData] = useState({
    st_token: 1,
    qtde_token: 0
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchLojas()
  }, [])

  useEffect(() => {
    const filtered = lojas.filter(loja =>
      loja.loja.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loja.estado.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loja.cod_loja.toString().includes(searchTerm)
    )
    setFilteredLojas(filtered)
  }, [lojas, searchTerm])

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
      toast({
        title: "Erro",
        description: "Erro ao carregar lojas",
        variant: "destructive"
      })
    }
  }

  const handleEdit = (loja: Loja) => {
    setEditingLoja(loja)
    setFormData({
      st_token: loja.st_token || 1,
      qtde_token: loja.qtde_token || 0
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!editingLoja) return

    try {
      const { error } = await supabase
        .from("cadastro_loja")
        .update({
          st_token: formData.st_token,
          qtde_token: formData.qtde_token
        })
        .eq("cod_loja", editingLoja.cod_loja)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Configuração atualizada com sucesso"
      })

      setIsDialogOpen(false)
      fetchLojas()
    } catch (error) {
      console.error("Erro ao salvar:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar configuração",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">Configuração Token Loja</h1>
      
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Controle de Tokens por Loja</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Pesquisar por loja, estado ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Status Token</TableHead>
                <TableHead>Qtde Token</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLojas.map((loja) => (
                <TableRow key={loja.cod_loja}>
                  <TableCell>{loja.cod_loja}</TableCell>
                  <TableCell>{loja.loja}</TableCell>
                  <TableCell>{loja.estado}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-sm ${
                      loja.st_token === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {loja.st_token === 1 ? 'Ativo' : 'Inativo'}
                    </span>
                  </TableCell>
                  <TableCell>{loja.qtde_token || 0}</TableCell>
                  <TableCell>
                    <Dialog open={isDialogOpen && editingLoja?.cod_loja === loja.cod_loja} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(loja)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Editar Configuração Token</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Código da Loja</Label>
                              <Input value={loja.cod_loja} readOnly className="bg-muted" />
                            </div>
                            <div>
                              <Label>Loja</Label>
                              <Input value={loja.loja} readOnly className="bg-muted" />
                            </div>
                          </div>
                          
                          <div>
                            <Label>Estado</Label>
                            <Input value={loja.estado} readOnly className="bg-muted" />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Status Token</Label>
                              <select
                                className="w-full px-3 py-2 border border-input rounded-md"
                                value={formData.st_token}
                                onChange={(e) => setFormData({...formData, st_token: parseInt(e.target.value)})}
                              >
                                <option value={1}>Ativo</option>
                                <option value={0}>Inativo</option>
                              </select>
                            </div>
                            <div>
                              <Label>Quantidade Token</Label>
                              <Input
                                type="number"
                                max="999"
                                value={formData.qtde_token}
                                onChange={(e) => setFormData({...formData, qtde_token: parseInt(e.target.value) || 0})}
                              />
                            </div>
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
    </div>
  )
}
