import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Upload } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { Tables } from "@/integrations/supabase/types"
import { useToast } from "@/hooks/use-toast"

type Loja = Tables<"cadastro_loja">

interface LojaConfig {
  loja: Loja
  status: boolean
  tokenMes: number
  metaLoja: string
  dreNegativo: string
  edited: boolean
}

export default function ConfiguracaoTokenLoja() {
  const [lojas, setLojas] = useState<Loja[]>([])
  const [configuracoes, setConfiguracoes] = useState<LojaConfig[]>([])
  const { toast } = useToast()

  useEffect(() => {
    fetchLojas()
  }, [])

  const fetchLojas = async () => {
    try {
      const { data, error } = await supabase
        .from("cadastro_loja")
        .select("*")
        .order("cod_loja")
      
      if (error) throw error
      
      const configs = (data || []).map(loja => ({
        loja,
        status: loja.st_token === 1,
        tokenMes: loja.qtde_token || 100,
        metaLoja: loja.meta_loja === 1 ? "REGULAR" : "IRREGULAR",
        dreNegativo: loja.dre_negativo === 1 ? "REGULAR" : "IRREGULAR",
        edited: false
      }))
      
      setLojas(data || [])
      setConfiguracoes(configs)
    } catch (error) {
      console.error("Erro ao buscar lojas:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar lojas",
        variant: "destructive"
      })
    }
  }

  const handleConfigChange = (index: number, field: keyof LojaConfig, value: any) => {
    const newConfigs = [...configuracoes]
    newConfigs[index] = { ...newConfigs[index], [field]: value, edited: true }
    setConfiguracoes(newConfigs)
  }

  const handleSave = async (index: number) => {
    const config = configuracoes[index]
    try {
      const { error } = await supabase
        .from("cadastro_loja")
        .update({
          st_token: config.status ? 1 : 0,
          qtde_token: config.tokenMes
        })
        .eq("cod_loja", config.loja.cod_loja)

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
      ["Código Loja", "Loja", "Estado", "Status", "Token/mês", "Meta Loja", "DRE Negativo"],
      ...configuracoes.map(config => [
        config.loja.cod_loja,
        config.loja.loja,
        config.loja.estado,
        config.status ? "Ativo" : "Inativo",
        config.tokenMes,
        config.metaLoja,
        config.dreNegativo
      ])
    ].map(row => row.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "lojas.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Lojas
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
                <th className="text-left p-2">Loja</th>
                <th className="text-left p-2">Estado</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Token/mês</th>
                <th className="text-left p-2">Meta Loja</th>
                <th className="text-left p-2">DRE Negativo</th>
                <th className="text-left p-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {configuracoes.map((config, index) => (
                <tr key={config.loja.cod_loja} className={`border-b ${config.edited ? 'bg-yellow-50' : ''}`}>
                  <td className="p-2 font-medium">{config.loja.cod_loja}</td>
                  <td className="p-2">{config.loja.loja}</td>
                  <td className="p-2">{config.loja.estado}</td>
                  <td className="p-2">
                    <Switch
                      checked={config.status}
                      onCheckedChange={(checked) => handleConfigChange(index, 'status', checked)}
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      value={config.tokenMes}
                      onChange={(e) => handleConfigChange(index, 'tokenMes', parseInt(e.target.value) || 0)}
                      className="w-20"
                    />
                  </td>
                  <td className="p-2">
                    <div className="w-32 px-3 py-2 bg-gray-100 border rounded text-sm text-gray-600">
                      {config.metaLoja}
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="w-32 px-3 py-2 bg-gray-100 border rounded text-sm text-gray-600">
                      {config.dreNegativo}
                    </div>
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
    </Card>
  )
}
