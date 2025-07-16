import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Upload, Plus } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { Tables } from "@/integrations/supabase/types"
import { useToast } from "@/hooks/use-toast"
import { AddProdutoMargemDialog } from "./AddProdutoMargemDialog"
import { EstadoCombobox } from "./EstadoCombobox"
import { LojaCombobox } from "./LojaCombobox"

type ProdutoMargem = Tables<"produto_margem">
type Produto = Tables<"cadastro_produto">

interface ProdutoMargemExtended extends ProdutoMargem {
  produto?: Produto
}

export default function DescontoProduto() {
  const [produtoMargens, setProdutoMargens] = useState<ProdutoMargemExtended[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [editedRows, setEditedRows] = useState<Set<number>>(new Set())
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Buscar produtos margem
      const { data: margemData, error: margemError } = await supabase
        .from("produto_margem")
        .select("*")
        .order("id")
      
      if (margemError) throw margemError

      // Buscar produtos
      const { data: produtosData, error: produtosError } = await supabase
        .from("cadastro_produto")
        .select("*")
        .order("nome_produto")
      
      if (produtosError) throw produtosError

      // Combinar dados
      const margemExtended = (margemData || []).map(margem => {
        const produto = produtosData?.find(p => p.id_produto === margem.id_produto)
        return {
          ...margem,
          produto
        }
      })

      setProdutoMargens(margemExtended)
      setProdutos(produtosData || [])
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
    setProdutoMargens(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
    setEditedRows(prev => new Set(prev).add(id))
  }

  const handleSave = async (id: number) => {
    const item = produtoMargens.find(p => p.id === id)
    if (!item) return

    try {
      const { error } = await supabase
        .from("produto_margem")
        .update({
          margem: item.margem,
          data_inicio: item.data_inicio,
          data_fim: item.data_fim,
          updated_at: new Date().toISOString()
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
      ["ID", "ID Produto", "Nome Produto", "Tipo Aplicação", "Tipo Referência", "Tipo Margem", "Margem", "Margem Adicional", "% Desconto", "Data Início", "Data Fim", "Ativo", "Observação"],
      ...produtoMargens.map(item => [
        item.id,
        item.id_produto,
        item.produto?.nome_produto || "",
        item.tipo_aplicacao,
        item.tipo_referencia || "",
        item.tipo_margem,
        item.margem,
        item.margem_adc || "",
        item.desconto || "",
        item.data_inicio,
        item.data_fim,
        item.st_ativo === 1 ? "Ativo" : "Inativo",
        item.observacao || ""
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
          if (values.length >= 13) {
            const id = parseInt(values[0])
            if (!isNaN(id)) {
              updates.push({
                id: id,
                margem: parseFloat(values[6]) || 0,
                margem_adc: values[7] ? parseFloat(values[7]) : null,
                desconto: values[8] ? parseFloat(values[8]) : null,
                data_inicio: values[9],
                data_fim: values[10],
                st_ativo: values[11] === "Ativo" ? 1 : 0,
                observacao: values[12] || null
              })
            }
          }
        }

        for (const update of updates) {
          await supabase
            .from("produto_margem")
            .update({
              margem: update.margem,
              margem_adc: update.margem_adc,
              desconto: update.desconto,
              data_inicio: update.data_inicio,
              data_fim: update.data_fim,
              st_ativo: update.st_ativo,
              observacao: update.observacao,
              updated_at: new Date().toISOString()
            })
            .eq("id", update.id)
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
          Desconto Produto
          <div className="flex gap-2">
            <AddProdutoMargemDialog onSuccess={fetchData} />
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
              <TableHead>ID</TableHead>
              <TableHead>ID Produto</TableHead>
              <TableHead>Nome Produto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Tipo Ref</TableHead>
              <TableHead>Tipo Margem</TableHead>
              <TableHead>Margem</TableHead>
              <TableHead>Margem Adc</TableHead>
              <TableHead>% Desc</TableHead>
              <TableHead>Data Início</TableHead>
              <TableHead>Data Fim</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead>Observação</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {produtoMargens.map((item) => (
              <TableRow key={item.id} className={editedRows.has(item.id) ? 'bg-yellow-50' : ''}>
                <TableCell className="font-medium">{item.id}</TableCell>
                <TableCell>{item.id_produto}</TableCell>
                <TableCell>{item.produto?.nome_produto}</TableCell>
                <TableCell>
                  <Select
                    value={item.tipo_aplicacao}
                    onValueChange={(value) => handleFieldChange(item.id, 'tipo_aplicacao', value)}
                    disabled={item.st_ativo === 0}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="estado">Estado</SelectItem>
                      <SelectItem value="loja">Loja</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {item.tipo_aplicacao === "estado" ? (
                    <EstadoCombobox
                      value={item.tipo_referencia}
                      onValueChange={(value) => handleFieldChange(item.id, 'tipo_referencia', value)}
                      disabled={item.st_ativo === 0}
                    />
                  ) : (
                    <LojaCombobox
                      value={item.tipo_referencia}
                      onValueChange={(value) => handleFieldChange(item.id, 'tipo_referencia', value)}
                      disabled={item.st_ativo === 0}
                    />
                  )}
                </TableCell>
                <TableCell>
                  <Select
                    value={item.tipo_margem}
                    onValueChange={(value) => handleFieldChange(item.id, 'tipo_margem', value)}
                    disabled={item.st_ativo === 0}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentual">Percentual</SelectItem>
                      <SelectItem value="valor">Valor</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.margem}
                    onChange={(e) => handleFieldChange(item.id, 'margem', parseFloat(e.target.value) || 0)}
                    disabled={item.st_ativo === 0}
                    className="w-20"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.margem_adc || ""}
                    onChange={(e) => handleFieldChange(item.id, 'margem_adc', parseFloat(e.target.value) || null)}
                    disabled={item.st_ativo === 0}
                    className="w-20"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.desconto || ""}
                    onChange={(e) => handleFieldChange(item.id, 'desconto', parseFloat(e.target.value) || null)}
                    disabled={item.st_ativo === 0 || item.tipo_margem === "valor"}
                    className="w-20"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="date"
                    value={item.data_inicio}
                    onChange={(e) => handleFieldChange(item.id, 'data_inicio', e.target.value)}
                    disabled={item.st_ativo === 0}
                    className="w-32"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="date"
                    value={item.data_fim}
                    onChange={(e) => handleFieldChange(item.id, 'data_fim', e.target.value)}
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
                    onChange={(e) => handleFieldChange(item.id, 'observacao', e.target.value)}
                    className="w-32"
                  />
                </TableCell>
                <TableCell>
                  <Button 
                    size="sm" 
                    onClick={() => handleSave(item.id)}
                    disabled={!editedRows.has(item.id)}
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
