
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Download, Upload } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { Tables } from "@/integrations/supabase/types"
import { useToast } from "@/hooks/use-toast"

type SubgrupoMargem = Tables<"subgrupo_margem">

interface SubgrupoConfig {
  subgrupo: SubgrupoMargem
  periodo: string
  percentualDesconto: number
  margemTipo: string
}

export default function ConfiguracaoDescontoSubgrupo() {
  const [subgrupos, setSubgrupos] = useState<SubgrupoMargem[]>([])
  const [configuracoes, setConfiguracoes] = useState<SubgrupoConfig[]>([])
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
        periodo: `${subgrupo.data_inicio || '01/07/25'} a ${subgrupo.data_fim || '31/07/25'}`,
        percentualDesconto: subgrupo.margem,
        margemTipo: "Margem UF"
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
    newConfigs[index] = { ...newConfigs[index], [field]: value }
    setConfiguracoes(newConfigs)
  }

  const handleSave = async (index: number) => {
    const config = configuracoes[index]
    try {
      const { error } = await supabase
        .from("subgrupo_margem")
        .update({
          margem: config.percentualDesconto
        })
        .eq("cod_subgrupo", config.subgrupo.cod_subgrupo)

      if (error) throw error

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
      ["Subgrupo", "Período", "% Desconto", "Margem Tipo"],
      ...configuracoes.map(config => [
        config.subgrupo.nome_subgrupo,
        config.periodo,
        config.percentualDesconto.toFixed(1),
        config.margemTipo
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
                <th className="text-left p-2">Subgrupo</th>
                <th className="text-left p-2">Período</th>
                <th className="text-left p-2">% Desconto</th>
                <th className="text-left p-2">Margem Tipo</th>
                <th className="text-left p-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {configuracoes.map((config, index) => (
                <tr key={config.subgrupo.cod_subgrupo} className="border-b">
                  <td className="p-2 font-medium">{config.subgrupo.nome_subgrupo}</td>
                  <td className="p-2">
                    <Input
                      value={config.periodo}
                      onChange={(e) => handleConfigChange(index, 'periodo', e.target.value)}
                      className="w-40"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={config.percentualDesconto}
                      onChange={(e) => handleConfigChange(index, 'percentualDesconto', parseFloat(e.target.value) || 0)}
                      className="w-20"
                    />
                  </td>
                  <td className="p-2">
                    <span className="text-muted-foreground">{config.margemTipo}</span>
                  </td>
                  <td className="p-2">
                    <Button size="sm" onClick={() => handleSave(index)}>
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
