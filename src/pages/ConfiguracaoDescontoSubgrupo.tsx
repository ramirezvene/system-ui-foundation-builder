
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Download, Upload, MessageSquare } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { Tables } from "@/integrations/supabase/types"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

type SubgrupoMargem = Tables<"subgrupo_margem">

interface SubgrupoConfig {
  subgrupo: SubgrupoMargem
  dataInicio: string
  dataFim: string
  margem: number
  observacao: string
  edited: boolean
}

export default function ConfiguracaoDescontoSubgrupo() {
  const [subgrupos, setSubgrupos] = useState<SubgrupoMargem[]>([])
  const [configuracoes, setConfiguracoes] = useState<SubgrupoConfig[]>([])
  const [observacaoDialogOpen, setObservacaoDialogOpen] = useState(false)
  const [currentObservacao, setCurrentObservacao] = useState("")
  const [currentSubgrupoIndex, setCurrentSubgrupoIndex] = useState<number | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchSubgrupos()
  }, [])

  const fetchSubgrupos = async () => {
    try {
      const { data, error } = await supabase
        .from("subgrupo_margem")
        .select("*")
        .order("cod_subgrupo")
      
      if (error) throw error
      
      const configs = (data || []).map(subgrupo => ({
        subgrupo,
        dataInicio: subgrupo.data_inicio || '2025-01-01',
        dataFim: subgrupo.data_fim || '2030-01-01',
        margem: subgrupo.margem,
        observacao: subgrupo.observacao || '',
        edited: false
      }))
      
      setSubgrupos(data || [])
      setConfiguracoes(configs)
    } catch (error) {
      console.error("Erro ao buscar subgrupos:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar subgrupos",
        variant: "destructive"
      })
    }
  }

  const handleConfigChange = (index: number, field: keyof SubgrupoConfig, value: any) => {
    const newConfigs = [...configuracoes]
    newConfigs[index] = { ...newConfigs[index], [field]: value, edited: true }
    setConfiguracoes(newConfigs)
  }

  const handleObservacaoOpen = (index: number) => {
    setCurrentSubgrupoIndex(index)
    setCurrentObservacao(configuracoes[index].observacao)
    setObservacaoDialogOpen(true)
  }

  const handleObservacaoSave = () => {
    if (currentSubgrupoIndex !== null) {
      handleConfigChange(currentSubgrupoIndex, 'observacao', currentObservacao)
    }
    setObservacaoDialogOpen(false)
    setCurrentSubgrupoIndex(null)
    setCurrentObservacao("")
  }

  const handleSave = async (index: number) => {
    const config = configuracoes[index]
    try {
      const { error } = await supabase
        .from("subgrupo_margem")
        .update({
          margem: config.margem,
          data_inicio: config.dataInicio,
          data_fim: config.dataFim,
          observacao: config.observacao
        })
        .eq("cod_subgrupo", config.subgrupo.cod_subgrupo)

      if (error) throw error

      const newConfigs = [...configuracoes]
      newConfigs[index].edited = false
      setConfiguracoes(newConfigs)

      toast({
        title: "Sucesso",
        description: "Configuração salva com sucesso"
      })
    } catch (error) {
      console.error("Erro ao salvar:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar configuração",
        variant: "destructive"
      })
    }
  }

  const handleExportCSV = () => {
    const csvContent = [
      ["Código Subgrupo", "Nome Subgrupo", "Data Início", "Data Fim", "% Margem", "Observação"],
      ...configuracoes.map(config => [
        config.subgrupo.cod_subgrupo,
        config.subgrupo.nome_subgrupo,
        config.dataInicio,
        config.dataFim,
        config.margem.toFixed(2),
        config.observacao || ""
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Subgrupos
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
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Código</th>
                <th className="text-left p-2">Nome Subgrupo</th>
                <th className="text-left p-2">Data Início</th>
                <th className="text-left p-2">Data Fim</th>
                <th className="text-left p-2">% Margem</th>
                <th className="text-left p-2">Observação</th>
                <th className="text-left p-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {configuracoes.map((config, index) => (
                <tr key={config.subgrupo.cod_subgrupo} className={`border-b ${config.edited ? 'bg-yellow-50' : ''}`}>
                  <td className="p-2 font-medium">{config.subgrupo.cod_subgrupo}</td>
                  <td className="p-2">{config.subgrupo.nome_subgrupo}</td>
                  <td className="p-2">
                    <Input
                      type="date"
                      value={config.dataInicio}
                      onChange={(e) => handleConfigChange(index, 'dataInicio', e.target.value)}
                      className="w-36"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="date"
                      value={config.dataFim}
                      onChange={(e) => handleConfigChange(index, 'dataFim', e.target.value)}
                      className="w-36"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={config.margem}
                      onChange={(e) => handleConfigChange(index, 'margem', parseFloat(e.target.value) || 0)}
                      className="w-24"
                    />
                  </td>
                  <td className="p-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleObservacaoOpen(index)}
                      className="w-8 h-8 p-0"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </td>
                  <td className="p-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleSave(index)}
                      disabled={!config.edited}
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

      <Dialog open={observacaoDialogOpen} onOpenChange={setObservacaoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Observação do Subgrupo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={currentObservacao}
              onChange={(e) => setCurrentObservacao(e.target.value)}
              placeholder="Digite a observação específica para este subgrupo..."
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
    </Card>
  )
}
