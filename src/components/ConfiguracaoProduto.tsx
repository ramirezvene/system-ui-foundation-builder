
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ProdutoCombobox } from "@/components/ProdutoCombobox"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { Tables } from "@/integrations/supabase/types"
import { useToast } from "@/hooks/use-toast"

type Produto = Tables<"cadastro_produto">
type ProdutoMargem = Tables<"produto_margem">
type Estado = Tables<"cadastro_estado">
type Loja = Tables<"cadastro_loja">

interface ProdutoMargemDetalhado extends ProdutoMargem {
  produto_nome?: string
  referencia_nome?: string
}

export default function ConfiguracaoProduto() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [estados, setEstados] = useState<Estado[]>([])
  const [lojas, setLojas] = useState<Loja[]>([])
  const [margens, setMargens] = useState<ProdutoMargemDetalhado[]>([])
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMargem, setEditingMargem] = useState<ProdutoMargemDetalhado | null>(null)
  const [formData, setFormData] = useState({
    tipo_aplicacao: "estado" as "estado" | "loja",
    codigo_referencia: "",
    margem: "",
    data_inicio: "",
    data_fim: ""
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Buscar produtos
      const { data: produtosData, error: produtosError } = await supabase
        .from("cadastro_produto")
        .select("*")
        .order("nome_produto")
      
      if (produtosError) throw produtosError
      setProdutos(produtosData || [])

      // Buscar estados
      const { data: estadosData, error: estadosError } = await supabase
        .from("cadastro_estado")
        .select("*")
        .eq("st_ativo", 1)
        .order("nome_estado")
      
      if (estadosError) throw estadosError
      setEstados(estadosData || [])

      // Buscar lojas
      const { data: lojasData, error: lojasError } = await supabase
        .from("cadastro_loja")
        .select("*")
        .eq("st_token", 1)
        .order("loja")
      
      if (lojasError) throw lojasError
      setLojas(lojasData || [])

      // Buscar margens
      await fetchMargens()
    } catch (error) {
      console.error("Erro ao buscar dados:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive"
      })
    }
  }

  const fetchMargens = async () => {
    try {
      const { data, error } = await supabase
        .from("produto_margem")
        .select("*")
        .order("created_at", { ascending: false })
      
      if (error) throw error

      // Enriquecer dados com nomes
      const margensDetalhadas = await Promise.all(
        (data || []).map(async (margem) => {
          const produto = produtos.find(p => p.id_produto === margem.id_produto)
          let referenciaNome = ""
          
          if (margem.tipo_aplicacao === "estado") {
            const estado = estados.find(e => e.id === margem.codigo_referencia)
            referenciaNome = estado?.nome_estado || ""
          } else {
            const loja = lojas.find(l => l.cod_loja === margem.codigo_referencia)
            referenciaNome = loja?.loja || ""
          }

          return {
            ...margem,
            produto_nome: produto?.nome_produto || "",
            referencia_nome: referenciaNome
          }
        })
      )

      setMargens(margensDetalhadas)
    } catch (error) {
      console.error("Erro ao buscar margens:", error)
    }
  }

  const handleOpenDialog = (margem?: ProdutoMargemDetalhado) => {
    if (margem) {
      setEditingMargem(margem)
      setSelectedProduto(produtos.find(p => p.id_produto === margem.id_produto) || null)
      setFormData({
        tipo_aplicacao: margem.tipo_aplicacao as "estado" | "loja",
        codigo_referencia: margem.codigo_referencia.toString(),
        margem: margem.margem.toString(),
        data_inicio: margem.data_inicio,
        data_fim: margem.data_fim
      })
    } else {
      setEditingMargem(null)
      setSelectedProduto(null)
      setFormData({
        tipo_aplicacao: "estado",
        codigo_referencia: "",
        margem: "",
        data_inicio: new Date().toISOString().split('T')[0],
        data_fim: "2030-12-31"
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!selectedProduto || !formData.codigo_referencia || !formData.margem) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      })
      return
    }

    try {
      const data = {
        id_produto: selectedProduto.id_produto,
        tipo_aplicacao: formData.tipo_aplicacao,
        codigo_referencia: parseInt(formData.codigo_referencia),
        margem: parseFloat(formData.margem),
        data_inicio: formData.data_inicio,
        data_fim: formData.data_fim
      }

      if (editingMargem) {
        const { error } = await supabase
          .from("produto_margem")
          .update(data)
          .eq("id", editingMargem.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from("produto_margem")
          .insert(data)

        if (error) throw error
      }

      toast({
        title: "Sucesso",
        description: `Margem ${editingMargem ? 'atualizada' : 'criada'} com sucesso`
      })

      setIsDialogOpen(false)
      fetchMargens()
    } catch (error) {
      console.error("Erro ao salvar:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar margem",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase
        .from("produto_margem")
        .delete()
        .eq("id", id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Margem excluída com sucesso"
      })

      fetchMargens()
    } catch (error) {
      console.error("Erro ao excluir:", error)
      toast({
        title: "Erro",
        description: "Erro ao excluir margem",
        variant: "destructive"
      })
    }
  }

  const getReferenceOptions = () => {
    if (formData.tipo_aplicacao === "estado") {
      return estados.map(estado => ({
        value: estado.id.toString(),
        label: estado.nome_estado
      }))
    } else {
      return lojas.map(loja => ({
        value: loja.cod_loja.toString(),
        label: loja.loja
      }))
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Configuração de Produto
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Margem
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Referência</TableHead>
              <TableHead>Margem (%)</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {margens.map((margem) => (
              <TableRow key={margem.id}>
                <TableCell>{margem.id_produto} - {margem.produto_nome}</TableCell>
                <TableCell className="capitalize">{margem.tipo_aplicacao}</TableCell>
                <TableCell>{margem.referencia_nome}</TableCell>
                <TableCell>{margem.margem.toFixed(2)}%</TableCell>
                <TableCell>{margem.data_inicio} até {margem.data_fim}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(margem)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(margem.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingMargem ? 'Editar' : 'Nova'} Margem de Produto
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Produto</Label>
                <ProdutoCombobox
                  produtos={produtos}
                  selectedProduto={selectedProduto}
                  onProdutoChange={setSelectedProduto}
                  placeholder="Selecionar produto..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Aplicação</Label>
                  <select
                    className="w-full px-3 py-2 border border-input rounded-md"
                    value={formData.tipo_aplicacao}
                    onChange={(e) => setFormData({
                      ...formData, 
                      tipo_aplicacao: e.target.value as "estado" | "loja",
                      codigo_referencia: ""
                    })}
                  >
                    <option value="estado">Estado</option>
                    <option value="loja">Loja</option>
                  </select>
                </div>
                <div>
                  <Label>Referência</Label>
                  <select
                    className="w-full px-3 py-2 border border-input rounded-md"
                    value={formData.codigo_referencia}
                    onChange={(e) => setFormData({...formData, codigo_referencia: e.target.value})}
                  >
                    <option value="">Selecionar...</option>
                    {getReferenceOptions().map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label>Margem (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.margem}
                  onChange={(e) => setFormData({...formData, margem: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data Início</Label>
                  <Input
                    type="date"
                    value={formData.data_inicio}
                    onChange={(e) => setFormData({...formData, data_inicio: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Data Fim</Label>
                  <Input
                    type="date"
                    value={formData.data_fim}
                    onChange={(e) => setFormData({...formData, data_fim: e.target.value})}
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
      </CardContent>
    </Card>
  )
}
