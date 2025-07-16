
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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

  const handleStatusToggle = (codLoja: number, newStatus: boolean) => {
    setLojas(prev => prev.map(loja => 
      loja.cod_loja === codLoja ? { ...loja, st_token: newStatus ? 1 : 0 } : loja
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
      ["Código", "Loja", "Estado", "Qtde Token", "Meta Loja", "DRE Loja", "Status Token"],
      ...lojas.map(loja => [
        loja.cod_loja,
        loja.loja,
        loja.estado,
        loja.qtde_token || 0,
        loja.meta_loja === 1 ? "Regular" : "Irregular",
        loja.dre_negativo === 1 ? "Regular" : "Irregular",
        loja.st_token === 1 ? "Ativo" : "Inativo"
      ])
    ].map(row => row.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "token_lojas.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleImportCSV = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".csv"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const text = await file.text()
      const lines = text.split("\n")
      const headers = lines[0].split(",")
      
      try {
        const updates = []
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",")
          if (values.length >= 7) {
            const codLoja = parseInt(values[0])
            const qtdeToken = parseInt(values[3]) || 0
            const stToken = values[6] === "Ativo" ? 1 : 0
            
            updates.push({
              cod_loja: codLoja,
              qtde_token: qtdeToken,
              st_token: stToken
            })
          }
        }

        for (const update of updates) {
          await supabase
            .from("cadastro_loja")
            .update({
              qtde_token: update.qtde_token,
              st_token: update.st_token
            })
            .eq("cod_loja", update.cod_loja)
        }

        await fetchLojas()
        toast({
          title: "Sucesso",
          description: "Dados importados com sucesso"
        })
      } catch (error) {
        console.error("Erro ao importar CSV:", error)
        toast({
          title: "Erro",
          description: "Erro ao importar arquivo CSV",
          variant: "destructive"
        })
      }
    }
    input.click()
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Token Loja
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleImportCSV}>
              <Upload className="w-4 h-4 mr-2" />
              Importar CSV
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Loja</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Qtde Token</TableHead>
              <TableHead>Meta Loja</TableHead>
              <TableHead>DRE Loja</TableHead>
              <TableHead>Status Token</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lojas.map((loja) => (
              <TableRow key={loja.cod_loja} className={editedRows.has(loja.cod_loja) ? 'bg-yellow-50' : ''}>
                <TableCell className="font-medium">{loja.cod_loja}</TableCell>
                <TableCell>{loja.loja}</TableCell>
                <TableCell>{loja.estado}</TableCell>
                <TableCell>{loja.qtde_token || 0}</TableCell>
                <TableCell>
                  <Badge variant={loja.meta_loja === 1 ? "default" : "destructive"} className={
                    loja.meta_loja === 1 ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-red-100 text-red-800 hover:bg-red-200"
                  }>
                    {loja.meta_loja === 1 ? "Regular" : "Irregular"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={loja.dre_negativo === 1 ? "default" : "destructive"} className={
                    loja.dre_negativo === 1 ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-red-100 text-red-800 hover:bg-red-200"
                  }>
                    {loja.dre_negativo === 1 ? "Regular" : "Irregular"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={loja.st_token === 1}
                    onCheckedChange={(checked) => handleStatusToggle(loja.cod_loja, checked)}
                  />
                </TableCell>
                <TableCell>
                  <Button 
                    size="sm" 
                    onClick={() => handleSave(loja.cod_loja)}
                    disabled={!editedRows.has(loja.cod_loja)}
                  >
                    Salvar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
