
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Upload, Plus, MessageSquare } from "lucide-react"
import { ProdutoCombobox } from "@/components/ProdutoCombobox"
import { supabase } from "@/integrations/supabase/client"
import { Tables } from "@/integrations/supabase/types"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

type ProdutoMargem = Tables<"produto_margem">
type Produto = Tables<"cadastro_produto">
type Estado = Tables<"cadastro_estado">
type Loja = Tables<"cadastro_loja">

interface ProdutoMargemExtended extends ProdutoMargem {
  produto?: Produto
  referencia_nome?: string
}

export default function DescontoProduto() {
  const [produtoMargens, setProdutoMargens] = useState<ProdutoMargemExtended[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [estados, setEstados] = useState<Estado[]>([])
  const [lojas, setLojas] = useState<Loja[]>([])
  const [editedRows, setEditedRows] = useState<Set<number>>(new Set())
  const [showAddForm, setShowAddForm] = useState(false)
  const [observacaoDialogOpen, setObservacaoDialogOpen] = useState(false)
  const [currentObservacao, setCurrentObservacao] = useState("")
  const [currentRowId, setCurrentRowId] = useState<number | null>(null)
  const [newRecord, setNewRecord] = useState({
    produto: null as Produto | null,
    tipoAplicacao: "estado" as "estado" | "loja",
    codigoReferencia: "",
    tipoMargem: "percentual" as "percentual" | "valor",
    margem: 0,
    dataInicio: new Date().toISOString().split('T')[0],
    dataFim: "2030-12-31",
    observacao: ""
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Buscar produtos margem
      const { data: margemData, error: margemError } = await supabase
        .from("produto_margem")
        .select("*")
        .order("id")
      
      if (margemError) throw margemError

      // Buscar produtos
      const { data: produtosData, error: produtosError } = await supabase
        .from("cadastro_produto")
        .select("*")
        .order("nome_produto")
      
      if (produtosError) throw produtosError

      // Buscar estados
      const { data: estadosData, error: estadosError } = await supabase
        .from("cadastro_estado")
        .select("*")
        .order("nome_estado")
      
      if (estadosError) throw estadosError

      // Buscar lojas
      const { data: lojasData, error: lojasError } = await supabase
        .from("cadastro_loja")
        .select("*")
        .order("loja")
      
      if (lojasError) throw lojasError

      // Combinar dados
      const margemExtended = (margemData || []).map(margem => {
        const produto = produtosData?.find(p => p.id_produto === margem.id_produto)
        let referencia_nome = ""
        
        if (margem.tipo_aplicacao === "estado") {
          const estado = estadosData?.find(e => e.id === margem.codigo_referencia)
          referencia_nome = estado?.estado || ""
        } else {
          const loja = lojasData?.find(l => l.cod_loja === margem.codigo_referencia)
          referencia_nome = loja ? `${loja.cod_loja} - ${loja.loja} - ${loja.estado}` : ""
        }

        return {
          ...margem,
          produto,
          referencia_nome
        }
      })

      setProdutoMargens(margemExtended)
      setProdutos(produtosData || [])
      setEstados(estadosData || [])
      setLojas(lojasData || [])
    } catch (error) {
      console.error("Erro ao buscar dados:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive"
      })
    }
  }

  const handleFieldChange = (id: number, field: keyof ProdutoMargem, value: any) => {
    setProdutoMargens(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
    setEditedRows(prev => new Set(prev).add(id))
  }

  const handleObservacaoOpen = (id: number, currentObs: string) => {
    setCurrentRowId(id)
    setCurrentObservacao(currentObs || "")
    setObservacaoDialogOpen(true)
  }

  const handleObservacaoSave = () => {
    if (currentRowId) {
      handleFieldChange(currentRowId, 'observacao', currentObservacao)
    }
    setObservacaoDialogOpen(false)
    setCurrentRowId(null)
    setCurrentObservacao("")
  }

  const handleSave = async (id: number) => {
    const item = produtoMargens.find(p => p.id === id)
    if (!item) return

    try {
      const { error } = await supabase
        .from("produto_margem")
        .update({
          tipo_margem: item.tipo_margem,
          margem: item.margem,
          data_inicio: item.data_inicio,
          data_fim: item.data_fim,
          observacao: item.observacao,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)

      if (error) throw error

      setEditedRows(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })

      toast({
        title: "Sucesso",
        description: "Registro salvo com sucesso"
      })
    } catch (error) {
      console.error("Erro ao salvar:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar registro",
        variant: "destructive"
      })
    }
  }

  const handleAddNew = async () => {
    if (!newRecord.produto || !newRecord.codigoReferencia) {
      toast({
        title: "Erro",
        description: "Selecione um produto e uma referência",
        variant: "destructive"
      })
      return
    }

    try {
      const { error } = await supabase
        .from("produto_margem")
        .insert({
          id_produto: newRecord.produto.id_produto,
          tipo_aplicacao: newRecord.tipoAplicacao,
          codigo_referencia: parseInt(newRecord.codigoReferencia),
          tipo_margem: newRecord.tipoMargem,
          margem: newRecord.margem,
          data_inicio: newRecord.dataInicio,
          data_fim: newRecord.dataFim,
          observacao: newRecord.observacao
        })

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Desconto produto cadastrado com sucesso"
      })

      setShowAddForm(false)
      setNewRecord({
        produto: null,
        tipoAplicacao: "estado",
        codigoReferencia: "",
        tipoMargem: "percentual",
        margem: 0,
        dataInicio: new Date().toISOString().split('T')[0],
        dataFim: "2030-12-31",
        observacao: ""
      })
      fetchData()
    } catch (error) {
      console.error("Erro ao cadastrar:", error)
      toast({
        title: "Erro",
        description: "Erro ao cadastrar desconto produto",
        variant: "destructive"
      })
    }
  }

  const getReferenciasOptions = () => {
    if (newRecord.tipoAplicacao === "estado") {
      return estados.map(estado => ({
        value: estado.id.toString(),
        label: estado.estado
      }))
    } else {
      return lojas.map(loja => ({
        value: loja.cod_loja.toString(),
        label: `${loja.cod_loja} - ${loja.loja} - ${loja.estado}`
      }))
    }
  }

  const handleExportCSV = () => {
    const csvContent = [
      ["ID Produto", "Produto", "Tipo Aplicação", "Referência", "Tipo Margem", "Margem", "Data Início", "Data Fim", "Observação"],
      ...produtoMargens.map(item => [
        item.id_produto,
        item.produto?.nome_produto || "",
        item.tipo_aplicacao,
        item.referencia_nome || "",
        item.tipo_margem,
        item.margem,
        item.data_inicio,
        item.data_fim,
        item.observacao || ""
      ])
    ].map(row => row.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "desconto_produtos.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Desconto Produto
            <div className="flex gap-2">
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => setShowAddForm(!showAddForm)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
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
          {showAddForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Adicionar Novo Desconto Produto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label>Produto</Label>
                    <ProdutoCombobox
                      produtos={produtos}
                      selectedProduto={newRecord.produto}
                      onProdutoChange={(produto) => setNewRecord(prev => ({ ...prev, produto }))}
                      placeholder="Selecionar produto..."
                    />
                  </div>
                  
                  <div>
                    <Label>Tipo Aplicação</Label>
                    <Select 
                      value={newRecord.tipoAplicacao} 
                      onValueChange={(value: "estado" | "loja") => 
                        setNewRecord(prev => ({ ...prev, tipoAplicacao: value, codigoReferencia: "" }))
                      }
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
                    <Label>{newRecord.tipoAplicacao === "estado" ? "Estado" : "Loja"}</Label>
                    <Select 
                      value={newRecord.codigoReferencia} 
                      onValueChange={(value) => setNewRecord(prev => ({ ...prev, codigoReferencia: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Selecionar ${newRecord.tipoAplicacao}...`} />
                      </SelectTrigger>
                      <SelectContent>
                        {getReferenciasOptions().map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Tipo Margem</Label>
                    <Select 
                      value={newRecord.tipoMargem} 
                      onValueChange={(value: "percentual" | "valor") => 
                        setNewRecord(prev => ({ ...prev, tipoMargem: value }))
                      }
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
                </div>

                <div className="grid grid-cols-4 gap-4 mt-4">
                  <div>
                    <Label>Margem {newRecord.tipoMargem === "percentual" ? "(%)" : "(R$)"}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newRecord.margem}
                      onChange={(e) => setNewRecord(prev => ({ ...prev, margem: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>

                  <div>
                    <Label>Data Início</Label>
                    <Input
                      type="date"
                      value={newRecord.dataInicio}
                      onChange={(e) => setNewRecord(prev => ({ ...prev, dataInicio: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label>Data Fim</Label>
                    <Input
                      type="date"
                      value={newRecord.dataFim}
                      onChange={(e) => setNewRecord(prev => ({ ...prev, dataFim: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label>Observação</Label>
                    <Textarea
                      value={newRecord.observacao}
                      onChange={(e) => setNewRecord(prev => ({ ...prev, observacao: e.target.value }))}
                      placeholder="Observação específica (opcional)"
                      maxLength={100}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddNew}>
                    Salvar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">ID</th>
                  <th className="text-left p-2">Produto</th>
                  <th className="text-left p-2">Tipo Aplicação</th>
                  <th className="text-left p-2">Referência</th>
                  <th className="text-left p-2">Tipo Margem</th>
                  <th className="text-left p-2">Margem</th>
                  <th className="text-left p-2">Data Início</th>
                  <th className="text-left p-2">Data Fim</th>
                  <th className="text-left p-2">Observação</th>
                  <th className="text-left p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {produtoMargens.map((item) => (
                  <tr key={item.id} className={`border-b ${editedRows.has(item.id) ? 'bg-yellow-50' : ''}`}>
                    <td className="p-2 font-medium">{item.id_produto}</td>
                    <td className="p-2">{item.produto?.nome_produto}</td>
                    <td className="p-2">{item.tipo_aplicacao}</td>
                    <td className="p-2">{item.referencia_nome}</td>
                    <td className="p-2">
                      <Select
                        value={item.tipo_margem}
                        onValueChange={(value: "percentual" | "valor") => handleFieldChange(item.id, 'tipo_margem', value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentual">Percentual</SelectItem>
                          <SelectItem value="valor">Valor</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        step="0.01"
                        value={item.margem}
                        onChange={(e) => handleFieldChange(item.id, 'margem', parseFloat(e.target.value) || 0)}
                        className="w-24"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="date"
                        value={item.data_inicio}
                        onChange={(e) => handleFieldChange(item.id, 'data_inicio', e.target.value)}
                        className="w-32"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="date"
                        value={item.data_fim}
                        onChange={(e) => handleFieldChange(item.id, 'data_fim', e.target.value)}
                        className="w-32"
                      />
                    </td>
                    <td className="p-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleObservacaoOpen(item.id, item.observacao || "")}
                        className="w-8 h-8 p-0"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </td>
                    <td className="p-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleSave(item.id)}
                        disabled={!editedRows.has(item.id)}
                      >
                        Salvar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={observacaoDialogOpen} onOpenChange={setObservacaoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Observação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={currentObservacao}
              onChange={(e) => setCurrentObservacao(e.target.value)}
              placeholder="Digite a observação específica para este produto..."
              maxLength={100}
              rows={4}
            />
            <div className="text-sm text-muted-foreground">
              {currentObservacao.length}/100 caracteres
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setObservacaoDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleObservacaoSave}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
