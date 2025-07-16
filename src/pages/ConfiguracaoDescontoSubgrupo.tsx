
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Upload, Plus } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { Tables } from "@/integrations/supabase/types"
import { useToast } from "@/hooks/use-toast"
import { AddSubgrupoMargemDialog } from "@/components/AddSubgrupoMargemDialog"

type SubgrupoMargem = Tables<"subgrupo_margem">

export default function ConfiguracaoDescontoSubgrupo() {
  const [subgrupoMargens, setSubgrupoMargens] = useState<SubgrupoMargem[]>([])
  const [editedRows, setEditedRows] = useState<Set<number>>(new Set())
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
      setSubgrupoMargens(data || [])
    } catch (error) {
      console.error("Erro ao buscar dados:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive"
      })
    }
  }

  const handleFieldChange = (codSubgrupo: number, field: keyof SubgrupoMargem, value: any) => {
    setSubgrupoMargens(prev => prev.map(item => 
      item.cod_subgrupo === codSubgrupo ? { ...item, [field]: value } : item
    ))
    setEditedRows(prev => new Set(prev).add(codSubgrupo))
  }

  const handleSave = async (codSubgrupo: number) => {
    const item = subgrupoMargens.find(s => s.cod_subgrupo === codSubgrupo)
    if (!item) return

    try {
      const { error } = await supabase
        .from("subgrupo_margem")
        .update({
          margem: item.margem,
          margem_adc: item.margem_adc,
          desconto: item.desconto,
          data_inicio: item.data_inicio,
          data_fim: item.data_fim,
          observacao: item.observacao
        })
        .eq("cod_subgrupo", codSubgrupo)

      if (error) throw error

      setEditedRows(prev => {
        const newSet = new Set(prev)
        newSet.delete(codSubgrupo)
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
      ["Código Subgrupo", "Nome Subgrupo", "Margem %", "Margem Adicional", "% Desconto", "Data Início", "Data Fim", "Ativo", "Observação"],
      ...subgrupoMargens.map(item => [
        item.cod_subgrupo,
        item.nome_subgrupo,
        item.margem,
        item.margem_adc || "",
        item.desconto || "",
        item.data_inicio || "",
        item.data_fim || "",
        item.st_ativo === 1 ? "Ativo" : "Inativo",
        item.observacao || ""
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

  const handleImportCSV = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".csv"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const text = await file.text()
      const lines = text.split("\n")
      
      try {
        const updates = []
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",")
          if (values.length >= 9) {
            const codSubgrupo = parseInt(values[0])
            if (!isNaN(codSubgrupo)) {
              updates.push({
                cod_subgrupo: codSubgrupo,
                margem: parseFloat(values[2]) || 0,
                margem_adc: values[3] ? parseFloat(values[3]) : null,
                desconto: values[4] ? parseFloat(values[4]) : null,
                data_inicio: values[5] || null,
                data_fim: values[6] || null,
                st_ativo: values[7] === "Ativo" ? 1 : 0,
                observacao: values[8] || null
              })
            }
          }
        }

        for (const update of updates) {
          await supabase
            .from("subgrupo_margem")
            .update({
              margem: update.margem,
              margem_adc: update.margem_adc,
              desconto: update.desconto,
              data_inicio: update.data_inicio,
              data_fim: update.data_fim,
              st_ativo: update.st_ativo,
              observacao: update.observacao
            })
            .eq("cod_subgrupo", update.cod_subgrupo)
        }

        await fetchData()
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
          Desconto Subgrupo
          <div className="flex gap-2">
            <AddSubgrupoMargemDialog onSuccess={fetchData} />
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
              <TableHead>Código Subgrupo</TableHead>
              <TableHead>Nome Subgrupo</TableHead>
              <TableHead>Margem %</TableHead>
              <TableHead>Margem Adicional</TableHead>
              <TableHead>% Desconto</TableHead>
              <TableHead>Data Início</TableHead>
              <TableHead>Data Fim</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead>Observação</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subgrupoMargens.map((item) => (
              <TableRow key={item.cod_subgrupo} className={editedRows.has(item.cod_subgrupo) ? 'bg-yellow-50' : ''}>
                <TableCell className="font-medium">{item.cod_subgrupo}</TableCell>
                <TableCell>{item.nome_subgrupo}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.margem}
                    onChange={(e) => handleFieldChange(item.cod_subgrupo, 'margem', parseFloat(e.target.value) || 0)}
                    disabled={item.st_ativo === 0}
                    className="w-20"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.margem_adc || ""}
                    onChange={(e) => handleFieldChange(item.cod_subgrupo, 'margem_adc', parseFloat(e.target.value) || null)}
                    disabled={item.st_ativo === 0}
                    className="w-20"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.desconto || ""}
                    onChange={(e) => handleFieldChange(item.cod_subgrupo, 'desconto', parseFloat(e.target.value) || null)}
                    disabled={item.st_ativo === 0}
                    className="w-20"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="date"
                    value={item.data_inicio || ""}
                    onChange={(e) => handleFieldChange(item.cod_subgrupo, 'data_inicio', e.target.value)}
                    disabled={item.st_ativo === 0}
                    className="w-32"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="date"
                    value={item.data_fim || ""}
                    onChange={(e) => handleFieldChange(item.cod_subgrupo, 'data_fim', e.target.value)}
                    disabled={item.st_ativo === 0}
                    className="w-32"
                  />
                </TableCell>
                <TableCell>
                  <Badge variant={item.st_ativo === 1 ? "default" : "secondary"}>
                    {item.st_ativo === 1 ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Input
                    type="text"
                    value={item.observacao || ""}
                    onChange={(e) => handleFieldChange(item.cod_subgrupo, 'observacao', e.target.value)}
                    className="w-32"
                  />
                </TableCell>
                <TableCell>
                  <Button 
                    size="sm" 
                    onClick={() => handleSave(item.cod_subgrupo)}
                    disabled={!editedRows.has(item.cod_subgrupo)}
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
