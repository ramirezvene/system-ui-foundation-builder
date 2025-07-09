
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Upload } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { Tables } from "@/integrations/supabase/types"
import { useToast } from "@/hooks/use-toast"

type Loja = Tables<"cadastro_loja">

export default function ConfiguracaoTokenLoja() {
  const [lojas, setLojas] = useState<Loja[]>([])
  const [editedRows, setEditedRows] = useState<Set<number>>(new Set())
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

  const handleLojaChange = (codLoja: number, field: keyof Loja, value: any) => {
    setLojas(prev => prev.map(loja => 
      loja.cod_loja === codLoja ? { ...loja, [field]: value } : loja
    ))
    setEditedRows(prev => new Set(prev).add(codLoja))
  }

  const handleSave = async (codLoja: number) => {
    const loja = lojas.find(l => l.cod_loja === codLoja)
    if (!loja) return

    try {
      const { error } = await supabase
        .from("cadastro_loja")
        .update({
          st_token: loja.st_token,
          qtde_token: loja.qtde_token
          // Removidos meta_loja e dre_negativo para bloquear edição
        })
        .eq("cod_loja", codLoja)

      if (error) throw error

      setEditedRows(prev => {
        const newSet = new Set(prev)
        newSet.delete(codLoja)
        return newSet
      })

      toast({
        title: "Sucesso",
        description: "Loja atualizada com sucesso"
      })
    } catch (error) {
      console.error("Erro ao salvar:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar loja",
        variant: "destructive"
      })
    }
  }

  const handleExportCSV = () => {
    const csvContent = [
      ["Código", "Loja", "Estado", "Status Token", "Qtde Token", "Meta Loja", "DRE Negativo"],
      ...lojas.map(loja => [
        loja.cod_loja,
        loja.loja,
        loja.estado,
        loja.st_token === 1 ? "Ativo" : "Inativo",
        loja.qtde_token || 0,
        loja.meta_loja === 1 ? "Regular" : "Irregular",
        loja.dre_negativo === 1 ? "Regular" : "Irregular"
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
          Configuração Token Loja
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
                <th className="text-left p-2">Status Token</th>
                <th className="text-left p-2">Qtde Token</th>
                <th className="text-left p-2">Meta Loja</th>
                <th className="text-left p-2">DRE Negativo</th>
                <th className="text-left p-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {lojas.map((loja) => (
                <tr key={loja.cod_loja} className={`border-b ${editedRows.has(loja.cod_loja) ? 'bg-yellow-50' : ''}`}>
                  <td className="p-2 font-medium">{loja.cod_loja}</td>
                  <td className="p-2">{loja.loja}</td>
                  <td className="p-2">{loja.estado}</td>
                  <td className="p-2">
                    <Select
                      value={loja.st_token?.toString() || "1"}
                      onValueChange={(value) => handleLojaChange(loja.cod_loja, 'st_token', parseInt(value))}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Ativo</SelectItem>
                        <SelectItem value="0">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      min="0"
                      value={loja.qtde_token || 0}
                      onChange={(e) => handleLojaChange(loja.cod_loja, 'qtde_token', parseInt(e.target.value) || 0)}
                      className="w-20"
                    />
                  </td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      loja.meta_loja === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {loja.meta_loja === 1 ? "Regular" : "Irregular"}
                    </span>
                  </td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      loja.dre_negativo === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {loja.dre_negativo === 1 ? "Regular" : "Irregular"}
                    </span>
                  </td>
                  <td className="p-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleSave(loja.cod_loja)}
                      disabled={!editedRows.has(loja.cod_loja)}
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
