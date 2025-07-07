
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Download, Upload } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { Tables } from "@/integrations/supabase/types"
import { useToast } from "@/hooks/use-toast"

type Estado = Tables<"cadastro_estado">

export default function TokenEstado() {
  const [estados, setEstados] = useState<Estado[]>([])
  const { toast } = useToast()

  useEffect(() => {
    fetchEstados()
  }, [])

  const fetchEstados = async () => {
    try {
      const { data, error } = await supabase
        .from("cadastro_estado")
        .select("*")
        .order("nome_estado")
      
      if (error) throw error
      setEstados(data || [])
    } catch (error) {
      console.error("Erro ao buscar estados:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar estados",
        variant: "destructive"
      })
    }
  }

  const handleStatusChange = async (estadoId: number, novoStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("cadastro_estado")
        .update({
          st_ativo: novoStatus ? 1 : 0,
          updated_at: new Date().toISOString()
        })
        .eq("id", estadoId)

      if (error) throw error

      setEstados(prev => prev.map(estado => 
        estado.id === estadoId 
          ? { ...estado, st_ativo: novoStatus ? 1 : 0 }
          : estado
      ))

      toast({
        title: "Sucesso",
        description: "Estado atualizado com sucesso"
      })
    } catch (error) {
      console.error("Erro ao atualizar estado:", error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar estado",
        variant: "destructive"
      })
    }
  }

  const handleExportCSV = () => {
    const csvContent = [
      ["Estado", "Nome", "Status"],
      ...estados.map(estado => [
        estado.estado,
        estado.nome_estado,
        estado.st_ativo === 1 ? "Ativo" : "Inativo"
      ])
    ].map(row => row.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "token_estados.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Token Estado
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
        <div className="space-y-4">
          {estados.map((estado) => (
            <div key={estado.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <span className="font-medium text-lg">{estado.estado}</span>
                <span className="text-muted-foreground">{estado.nome_estado}</span>
              </div>
              <Switch
                checked={estado.st_ativo === 1}
                onCheckedChange={(checked) => handleStatusChange(estado.id, checked)}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
