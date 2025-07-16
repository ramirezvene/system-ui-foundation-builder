
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Download, Upload, Plus, MessageSquare } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { Tables } from "@/integrations/supabase/types"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PercentageInput } from "@/components/PercentageInput"

type SubgrupoMargem = Tables<"subgrupo_margem">

export default function ConfiguracaoDescontoSubgrupo() {
  const [subgrupos, setSubgrupos] = useState<SubgrupoMargem[]>([])
  const [editedRows, setEditedRows] = useState<Set<number>>(new Set())
  const [observacaoDialogs, setObservacaoDialogs] = useState<Set<number>>(new Set())
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from("subgrupo_margem")
        .select("*")
        .order("cod_subgrupo")
      
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

  const calculateDesconto = (margem: number, margemAdc: number | null) => {
    if (!margemAdc) return 0
    return margem - margemAdc
  }

  const handleFieldChange = (cod_subgrupo: number, field: keyof SubgrupoMargem, value: any) => {
    console.log(`Alterando campo ${field} do subgrupo ${cod_subgrupo} para:`, value)
    setSubgrupos(prev => prev.map(item => 
      item.cod_subgrupo === cod_subgrupo ? { ...item, [field]: value } : item
    ))
    setEditedRows(prev => new Set(prev).add(cod_subgrupo))
  }

  const handleMargemChange = (cod_subgrupo: number, value: string) => {
    // Remove % e converte vírgula para ponto
    const numericValue = parseFloat(value.replace('%', '').replace(',', '.')) || 0
    console.log(`Alterando margem do subgrupo ${cod_subgrupo} para:`, numericValue)
    handleFieldChange(cod_subgrupo, 'margem', numericValue)
  }

  const handleMargemAdcChange = (cod_subgrupo: number, value: string) => {
    // Remove % e converte vírgula para ponto
    const numericValue = parseFloat(value.replace('%', '').replace(',', '.')) || 0
    console.log(`Alterando margem_adc do subgrupo ${cod_subgrupo} para:`, numericValue)
    handleFieldChange(cod_subgrupo, 'margem_adc', numericValue)
  }

  const formatMargemForDisplay = (margem: number) => {
    return margem.toFixed(2).replace('.', ',') + '%'
  }

  const handleSave = async (cod_subgrupo: number) => {
    const item = subgrupos.find(s => s.cod_subgrupo === cod_subgrupo)
    if (!item) return

    try {
      console.log("Salvando subgrupo:", item)
      
      const { error } = await supabase
        .from("subgrupo_margem")
        .update({
          nome_subgrupo: item.nome_subgrupo,
          margem: item.margem,
          margem_adc: item.margem_adc,
          data_inicio: item.data_inicio,
          data_fim: item.data_fim,
          observacao: item.observacao,
          st_ativo: item.st_ativo
        })
        .eq("cod_subgrupo", cod_subgrupo)

      if (error) throw error

      setEditedRows(prev => {
        const newSet = new Set(prev)
        newSet.delete(cod_subgrupo)
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
      ["Código Subgrupo", "Nome Subgrupo", "Margem", "Margem Adc", "Desconto", "Data Início", "Data Fim", "Ativo", "Observação"],
      ...subgrupos.map(item => [
        item.cod_subgrupo,
        item.nome_subgrupo,
        item.margem,
        item.margem_adc || 0,
        calculateDesconto(item.margem, item.margem_adc),
        item.data_inicio,
        item.data_fim,
        item.st_ativo === 1 ? "Ativo" : "Inativo",
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
      const { error } = await supabase
        .from("subgrupo_margem")
        .insert({
          cod_subgrupo: newCodSubgrupo,
          nome_subgrupo: "Novo Subgrupo",
          margem: 0,
          margem_adc: 0,
          data_inicio: new Date().toISOString().split('T')[0],
          data_fim: "2030-12-31",
          observacao: "",
          st_ativo: 1
        })

      if (error) throw error

      fetchData()
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

  const toggleObservacaoDialog = (cod_subgrupo: number) => {
    setObservacaoDialogs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(cod_subgrupo)) {
        newSet.delete(cod_subgrupo)
      } else {
        newSet.add(cod_subgrupo)
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
                <th className="text-left p-2">% Margem</th>
                <th className="text-left p-2">% Margem Adc</th>
                <th className="text-left p-2">% Desc</th>
                <th className="text-left p-2 w-32">Data Início</th>
                <th className="text-left p-2 w-32">Data Fim</th>
                <th className="text-left p-2">Ativo</th>
                <th className="text-left p-2">Observação</th>
                <th className="text-left p-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {subgrupos.map((item) => (
                <tr key={item.cod_subgrupo} className={`border-b ${editedRows.has(item.cod_subgrupo) ? 'bg-yellow-50' : ''}`}>
                  <td className="p-2">{item.cod_subgrupo}</td>
                  <td className="p-2">
                    <Input
                      value={item.nome_subgrupo}
                      onChange={(e) => handleFieldChange(item.cod_subgrupo, 'nome_subgrupo', e.target.value)}
                      className="w-full"
                    />
                  </td>
                  <td className="p-2">
                    <PercentageInput
                      value={formatMargemForDisplay(item.margem)}
                      onChange={(value) => handleMargemChange(item.cod_subgrupo, value)}
                      className="w-24"
                    />
                  </td>
                  <td className="p-2">
                    <PercentageInput
                      value={formatMargemForDisplay(item.margem_adc || 0)}
                      onChange={(value) => handleMargemAdcChange(item.cod_subgrupo, value)}
                      className="w-24"
                    />
                  </td>
                  <td className="p-2">
                    <span className="text-sm">
                      {calculateDesconto(item.margem, item.margem_adc).toFixed(2)}%
                    </span>
                  </td>
                  <td className="p-2">
                    <Input
                      type="date"
                      value={item.data_inicio || ''}
                      onChange={(e) => handleFieldChange(item.cod_subgrupo, 'data_inicio', e.target.value)}
                      className="w-full"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="date"
                      value={item.data_fim || ''}
                      onChange={(e) => handleFieldChange(item.cod_subgrupo, 'data_fim', e.target.value)}
                      className="w-full"
                    />
                  </td>
                  <td className="p-2">
                    <Badge variant={item.st_ativo === 1 ? "default" : "destructive"}>
                      {item.st_ativo === 1 ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="p-2">
                    <Dialog open={observacaoDialogs.has(item.cod_subgrupo)} onOpenChange={() => toggleObservacaoDialog(item.cod_subgrupo)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Observação - {item.nome_subgrupo}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Label>Observação (máximo 100 caracteres)</Label>
                          <Textarea
                            value={item.observacao || ''}
                            onChange={(e) => handleFieldChange(item.cod_subgrupo, 'observacao', e.target.value)}
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
                      onClick={() => handleSave(item.cod_subgrupo)}
                      disabled={!editedRows.has(item.cod_subgrupo)}
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
