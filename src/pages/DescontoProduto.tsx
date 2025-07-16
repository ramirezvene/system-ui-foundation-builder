
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Upload, Plus, MessageSquare } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { Tables } from "@/integrations/supabase/types"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PercentageInput } from "@/components/PercentageInput"

type ProdutoMargem = Tables<"produto_margem">
type CadastroProduto = Tables<"cadastro_produto">

interface ProdutoMargemWithProduto extends ProdutoMargem {
  produto?: CadastroProduto
}

export default function DescontoProduto() {
  const [produtos, setProdutos] = useState<ProdutoMargemWithProduto[]>([])
  const [editedRows, setEditedRows] = useState<Set<number>>(new Set())
  const [observacaoDialogs, setObservacaoDialogs] = useState<Set<number>>(new Set())
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from("produto_margem")
        .select(`
          *,
          produto:cadastro_produto!fk_produto_margem_produto(*)
        `)
        .order("id")
      
      if (error) throw error

      console.log("Dados carregados:", data)
      setProdutos(data || [])
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
    console.log(`Alterando campo ${field} do produto ${id} para:`, value)
    setProdutos(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
    setEditedRows(prev => new Set(prev).add(id))
  }

  const handleMargemChange = (id: number, value: string) => {
    const numericValue = parseFloat(value.replace('%', '').replace(',', '.')) || 0
    console.log(`Alterando margem do produto ${id} para:`, numericValue)
    handleFieldChange(id, 'margem', numericValue)
  }

  const handleMargemAdcChange = (id: number, value: string) => {
    const numericValue = parseFloat(value.replace('%', '').replace(',', '.')) || 0
    console.log(`Alterando margem adc do produto ${id} para:`, numericValue)
    handleFieldChange(id, 'margem_adc', numericValue)
  }

  const handleDescontoChange = (id: number, value: string) => {
    const numericValue = parseFloat(value.replace('%', '').replace(',', '.')) || 0
    console.log(`Alterando desconto do produto ${id} para:`, numericValue)
    handleFieldChange(id, 'desconto', numericValue)
  }

  const formatValueForDisplay = (value: number | null, isPercentual: boolean = false) => {
    if (value === null || value === undefined) return ''
    if (isPercentual) {
      return value.toFixed(2).replace('.', ',') + '%'
    }
    return value.toFixed(2).replace('.', ',')
  }

  const handleSave = async (id: number) => {
    const item = produtos.find(p => p.id === id)
    if (!item) return

    try {
      console.log("Salvando produto:", item)
      
      const { error } = await supabase
        .from("produto_margem")
        .update({
          id_produto: item.id_produto,
          margem: item.margem,
          margem_adc: item.margem_adc,
          desconto: item.desconto,
          tipo_aplicacao: item.tipo_aplicacao,
          tipo_margem: item.tipo_margem,
          data_inicio: item.data_inicio,
          data_fim: item.data_fim,
          observacao: item.observacao,
          st_ativo: item.st_ativo
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

  const handleExportCSV = () => {
    const csvContent = [
      ["ID", "ID Produto", "Nome Produto", "Margem", "Margem Adc", "% Desc", "Tipo Aplicação", "Tipo Margem", "Data Início", "Data Fim", "Ativo", "Observação"],
      ...produtos.map(item => [
        item.id,
        item.id_produto,
        item.produto?.nome_produto || '',
        item.margem,
        item.margem_adc || '',
        item.desconto || '',
        item.tipo_aplicacao,
        item.tipo_margem,
        item.data_inicio,
        item.data_fim,
        item.st_ativo === 1 ? 'Ativo' : 'Inativo',
        item.observacao
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

  const handleAdd = async () => {
    try {
      const { error } = await supabase
        .from("produto_margem")
        .insert({
          id_produto: 0,
          margem: 0,
          margem_adc: 0,
          desconto: 0,
          tipo_aplicacao: "estado",
          tipo_margem: "percentual",
          data_inicio: new Date().toISOString().split('T')[0],
          data_fim: "2030-12-31",
          observacao: "",
          st_ativo: 1
        })

      if (error) throw error

      fetchData()
      toast({
        title: "Sucesso",
        description: "Produto adicionado com sucesso"
      })
    } catch (error) {
      console.error("Erro ao adicionar produto:", error)
      toast({
        title: "Erro",
        description: "Erro ao adicionar produto",
        variant: "destructive"
      })
    }
  }

  const toggleObservacaoDialog = (id: number) => {
    setObservacaoDialogs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const isFieldEditable = (item: ProdutoMargemWithProduto) => {
    return item.st_ativo === 1
  }

  const shouldShowField = (item: ProdutoMargemWithProduto, field: 'margem' | 'margem_adc' | 'desconto') => {
    if (item.tipo_margem === 'valor') {
      return field === 'margem' || field === 'margem_adc'
    } else if (item.tipo_margem === 'percentual') {
      return true // mostra todos os campos
    }
    return false
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Configuração Desconto Produto
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Importar CSV
            </Button>
            <Button size="sm" onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">ID</th>
                <th className="text-left p-2">ID Produto</th>
                <th className="text-left p-2">Nome Produto</th>
                <th className="text-left p-2">Margem</th>
                <th className="text-left p-2">Margem Adc</th>
                <th className="text-left p-2">% Desc</th>
                <th className="text-left p-2">Tipo Aplicação</th>
                <th className="text-left p-2 w-32">Data Início</th>
                <th className="text-left p-2 w-32">Data Fim</th>
                <th className="text-left p-2">Ativo</th>
                <th className="text-left p-2">Observação</th>
                <th className="text-left p-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((item) => (
                <tr key={item.id} className={`border-b ${editedRows.has(item.id) ? 'bg-yellow-50' : ''} ${!isFieldEditable(item) ? 'bg-gray-50' : ''}`}>
                  <td className="p-2">{item.id}</td>
                  <td className="p-2">
                    <span className="text-sm">{item.id_produto}</span>
                  </td>
                  <td className="p-2">
                    <span className="text-sm">{item.produto?.nome_produto || 'N/A'}</span>
                  </td>
                  {/* Margem */}
                  <td className="p-2">
                    {shouldShowField(item, 'margem') && (
                      item.tipo_margem === 'percentual' ? (
                        <PercentageInput
                          value={formatValueForDisplay(item.margem, true)}
                          onChange={(value) => handleMargemChange(item.id, value)}
                          className="w-24"
                          disabled={!isFieldEditable(item)}
                        />
                      ) : (
                        <Input
                          type="number"
                          step="0.01"
                          value={item.margem || ''}
                          onChange={(e) => handleFieldChange(item.id, 'margem', parseFloat(e.target.value) || 0)}
                          className="w-24"
                          disabled={!isFieldEditable(item)}
                          placeholder="Valor mínimo"
                        />
                      )
                    )}
                  </td>
                  {/* Margem Adc */}
                  <td className="p-2">
                    {shouldShowField(item, 'margem_adc') && (
                      item.tipo_margem === 'percentual' ? (
                        <PercentageInput
                          value={formatValueForDisplay(item.margem_adc, true)}
                          onChange={(value) => handleMargemAdcChange(item.id, value)}
                          className="w-24"
                          disabled={!isFieldEditable(item)}
                        />
                      ) : (
                        <Input
                          type="number"
                          step="0.01"
                          value={item.margem_adc || ''}
                          onChange={(e) => handleFieldChange(item.id, 'margem_adc', parseFloat(e.target.value) || 0)}
                          className="w-24"
                          disabled={!isFieldEditable(item)}
                          placeholder="Valor mínimo"
                        />
                      )
                    )}
                  </td>
                  {/* % Desc */}
                  <td className="p-2">
                    {shouldShowField(item, 'desconto') && item.tipo_margem === 'percentual' && (
                      <PercentageInput
                        value={formatValueForDisplay(item.desconto, true)}
                        onChange={(value) => handleDescontoChange(item.id, value)}
                        className="w-24"
                        disabled={!isFieldEditable(item)}
                      />
                    )}
                  </td>
                  <td className="p-2">
                    <Select
                      value={item.tipo_aplicacao}
                      onValueChange={(value) => handleFieldChange(item.id, 'tipo_aplicacao', value)}
                      disabled={!isFieldEditable(item)}
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
                      type="date"
                      value={item.data_inicio || ''}
                      onChange={(e) => handleFieldChange(item.id, 'data_inicio', e.target.value)}
                      className="w-full"
                      disabled={!isFieldEditable(item)}
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="date"
                      value={item.data_fim || ''}
                      onChange={(e) => handleFieldChange(item.id, 'data_fim', e.target.value)}
                      className="w-full"
                      disabled={!isFieldEditable(item)}
                    />
                  </td>
                  <td className="p-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={item.st_ativo === 1}
                        onCheckedChange={(checked) => handleFieldChange(item.id, 'st_ativo', checked ? 1 : 0)}
                      />
                      <Label className="text-xs">
                        {item.st_ativo === 1 ? 'Ativo' : 'Inativo'}
                      </Label>
                    </div>
                  </td>
                  <td className="p-2">
                    <Dialog open={observacaoDialogs.has(item.id)} onOpenChange={() => toggleObservacaoDialog(item.id)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Observação - Produto {item.id_produto}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Label>Observação</Label>
                          <Textarea
                            value={item.observacao || ''}
                            onChange={(e) => handleFieldChange(item.id, 'observacao', e.target.value)}
                            placeholder="Digite uma observação específica..."
                            className="min-h-20"
                            disabled={!isFieldEditable(item)}
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
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
  )
}
