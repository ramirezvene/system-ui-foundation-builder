
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Upload, Plus, MessageSquare } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { Tables } from "@/integrations/supabase/types"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PercentageInput } from "@/components/PercentageInput"

type SubgrupoMargem = Tables<"subgrupo_margem">
type Estado = Tables<"cadastro_estado">

export default function ConfiguracaoDescontoSubgrupo() {
  const [subgrupos, setSubgrupos] = useState<SubgrupoMargem[]>([])
  const [estados, setEstados] = useState<Estado[]>([])
  const [editedRows, setEditedRows] = useState<Set<number>>(new Set())
  const [observacaoDialogs, setObservacaoDialogs] = useState<Set<number>>(new Set())
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
    fetchEstados()
  }, [])

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from("subgrupo_margem")
        .select("*")
        .order("cod_subgrupo, uf")
      
      if (error) throw error

      console.log("Dados carregados:", data)
      setSubgrupos(data || [])
    } catch (error) {
      console.error("Erro ao buscar dados:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive"
      })
    }
  }

  const fetchEstados = async () => {
    try {
      const { data, error } = await supabase
        .from("cadastro_estado")
        .select("*")
        .order("estado")
      
      if (error) throw error
      setEstados(data || [])
    } catch (error) {
      console.error("Erro ao buscar estados:", error)
    }
  }

  const handleFieldChange = (index: number, field: keyof SubgrupoMargem, value: any) => {
    console.log(`Alterando campo ${field} do index ${index} para:`, value)
    setSubgrupos(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ))
    setEditedRows(prev => new Set(prev).add(index))
  }

  const handleMargemChange = (index: number, value: string) => {
    // Remove % e converte vírgula para ponto
    const numericValue = parseFloat(value.replace('%', '').replace(',', '.')) || 0
    console.log(`Alterando margem do index ${index} para:`, numericValue)
    handleFieldChange(index, 'margem', numericValue)
  }

  const formatMargemForDisplay = (margem: number) => {
    return margem.toFixed(2).replace('.', ',') + '%'
  }

  const handleSave = async (index: number) => {
    const item = subgrupos[index]
    if (!item) return

    try {
      console.log("Salvando subgrupo:", item)
      
      const { error } = await supabase
        .from("subgrupo_margem")
        .update({
          nome_subgrupo: item.nome_subgrupo,
          margem: item.margem,
          data_inicio: item.data_inicio,
          data_fim: item.data_fim,
          observacao: item.observacao,
          uf: item.uf
        })
        .eq("cod_subgrupo", item.cod_subgrupo)
        .eq("uf", item.uf)

      if (error) throw error

      setEditedRows(prev => {
        const newSet = new Set(prev)
        newSet.delete(index)
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
      ["Código Subgrupo", "Nome Subgrupo", "UF", "Margem", "Data Início", "Data Fim", "Observação"],
      ...subgrupos.map(item => [
        item.cod_subgrupo,
        item.nome_subgrupo,
        item.uf,
        item.margem,
        item.data_inicio,
        item.data_fim,
        item.observacao
      ])
    ].map(row => row.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "desconto_subgrupos.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleAdd = async () => {
    const newCodSubgrupo = Math.max(...subgrupos.map(s => s.cod_subgrupo), 0) + 1

    try {
      // Adicionar para os 3 estados
      const estadosParaAdicionar = ['RS', 'SC', 'PR']
      
      for (const uf of estadosParaAdicionar) {
        const { error } = await supabase
          .from("subgrupo_margem")
          .insert({
            cod_subgrupo: newCodSubgrupo,
            nome_subgrupo: "Novo Subgrupo",
            margem: 0,
            data_inicio: new Date().toISOString().split('T')[0],
            data_fim: "2030-12-31",
            observacao: "",
            uf: uf
          })

        if (error) throw error
      }

      fetchData()
      toast({
        title: "Sucesso",
        description: "Subgrupo adicionado para todos os estados"
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

  const toggleObservacaoDialog = (index: number) => {
    setObservacaoDialogs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Configuração Desconto Subgrupo
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
                <th className="text-left p-2">Código Subgrupo</th>
                <th className="text-left p-2">Nome Subgrupo</th>
                <th className="text-left p-2">UF</th>
                <th className="text-left p-2">% Margem</th>
                <th className="text-left p-2 w-32">Data Início</th>
                <th className="text-left p-2 w-32">Data Fim</th>
                <th className="text-left p-2">Observação</th>
                <th className="text-left p-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {subgrupos.map((item, index) => (
                <tr key={`${item.cod_subgrupo}-${item.uf}`} className={`border-b ${editedRows.has(index) ? 'bg-yellow-50' : ''}`}>
                  <td className="p-2">{item.cod_subgrupo}</td>
                  <td className="p-2">
                    <Input
                      value={item.nome_subgrupo}
                      onChange={(e) => handleFieldChange(index, 'nome_subgrupo', e.target.value)}
                      className="w-full"
                    />
                  </td>
                  <td className="p-2">
                    <Select value={item.uf || ''} onValueChange={(value) => handleFieldChange(index, 'uf', value)}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {estados.map(estado => (
                          <SelectItem key={estado.estado} value={estado.estado}>
                            {estado.estado}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-2">
                    <PercentageInput
                      value={formatMargemForDisplay(item.margem)}
                      onChange={(value) => handleMargemChange(index, value)}
                      className="w-24"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="date"
                      value={item.data_inicio || ''}
                      onChange={(e) => handleFieldChange(index, 'data_inicio', e.target.value)}
                      className="w-full"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="date"
                      value={item.data_fim || ''}
                      onChange={(e) => handleFieldChange(index, 'data_fim', e.target.value)}
                      className="w-full"
                    />
                  </td>
                  <td className="p-2">
                    <Dialog open={observacaoDialogs.has(index)} onOpenChange={() => toggleObservacaoDialog(index)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Observação - {item.nome_subgrupo} ({item.uf})</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Label>Observação (máximo 100 caracteres)</Label>
                          <Textarea
                            value={item.observacao || ''}
                            onChange={(e) => handleFieldChange(index, 'observacao', e.target.value)}
                            maxLength={100}
                            placeholder="Digite uma observação específica..."
                            className="min-h-20"
                          />
                          <div className="text-sm text-gray-500">
                            {(item.observacao || '').length}/100 caracteres
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </td>
                  <td className="p-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleSave(index)}
                      disabled={!editedRows.has(index)}
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
