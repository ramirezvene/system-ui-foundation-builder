
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Upload } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { Tables } from "@/integrations/supabase/types"
import { useToast } from "@/hooks/use-toast"
import { AddProdutoMargemDialog } from "./AddProdutoMargemDialog"
import { EstadoCombobox } from "./EstadoCombobox"
import { LojaCombobox } from "./LojaCombobox"

type ProdutoMargem = Tables<"produto_margem">
type Produto = Tables<"cadastro_produto">
type Estado = Tables<"cadastro_estado">
type Loja = Tables<"cadastro_loja">

interface ProdutoMargemExtended extends ProdutoMargem {
  produto?: Produto
}

export default function DescontoProduto() {
  const [produtoMargens, setProdutoMargens] = useState<ProdutoMargemExtended[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [estados, setEstados] = useState<Estado[]>([])
  const [lojas, setLojas] = useState<Loja[]>([])
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

      // Buscar estados
      const { data: estadosData, error: estadosError } = await supabase
        .from("cadastro_estado")
        .select("*")
        .eq("st_ativo", 1)
        .order("estado")
      
      if (estadosError) throw estadosError

      // Buscar lojas
      const { data: lojasData, error: lojasError } = await supabase
        .from("cadastro_loja")
        .select("*")
        .order("cod_loja")
      
      if (lojasError) throw lojasError

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
      setEstados(estadosData || [])
      setLojas(lojasData || [])
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

  const handleTipoReferenciaChange = (id: number, selectedItem: Estado | Loja | null) => {
    if (!selectedItem) return
    
    const item = produtoMargens.find(p => p.id === id)
    if (!item) return

    let tipoReferenciaValue: string
    if (item.tipo_aplicacao === 'estado') {
      tipoReferenciaValue = (selectedItem as Estado).estado
    } else {
      tipoReferenciaValue = (selectedItem as Loja).cod_loja.toString()
    }

    handleFieldChange(id, 'tipo_referencia', tipoReferenciaValue)
  }

  const handleSave = async (id: number) => {
    const item = produtoMargens.find(p => p.id === id)
    if (!item) return

    try {
      const { error } = await supabase
        .from("produto_margem")
        .update({
          margem: item.margem,
          margem_adc: item.margem_adc,
          desconto: item.desconto,
          tipo_aplicacao: item.tipo_aplicacao,
          tipo_referencia: item.tipo_referencia,
          data_inicio: item.data_inicio,
          data_fim: item.data_fim,
          observacao: item.observacao,
          st_ativo: item.st_ativo,
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

  const getSelectedEstado = (item: ProdutoMargemExtended) => {
    if (item.tipo_aplicacao === 'estado') {
      return estados.find(e => e.estado === item.tipo_referencia) || null
    }
    return null
  }

  const getSelectedLoja = (item: ProdutoMargemExtended) => {
    if (item.tipo_aplicacao === 'loja') {
      return lojas.find(l => l.cod_loja.toString() === item.tipo_referencia) || null
    }
    return null
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Desconto Produto
          <div className="flex gap-2">
            <AddProdutoMargemDialog produtos={produtos} onAdd={fetchData} />
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
                  <select
                    value={item.tipo_aplicacao}
                    onChange={(e) => handleFieldChange(item.id, 'tipo_aplicacao', e.target.value)}
                    disabled={item.st_ativo === 0}
                    className="w-24 p-1 border rounded"
                  >
                    <option value="estado">Estado</option>
                    <option value="loja">Loja</option>
                  </select>
                </TableCell>
                <TableCell>
                  {item.tipo_aplicacao === "estado" ? (
                    <EstadoCombobox
                      estados={estados}
                      selectedEstado={getSelectedEstado(item)}
                      onEstadoChange={(estado) => handleTipoReferenciaChange(item.id, estado)}
                      disabled={item.st_ativo === 0}
                    />
                  ) : (
                    <LojaCombobox
                      lojas={lojas}
                      selectedLoja={getSelectedLoja(item)}
                      onLojaChange={(loja) => handleTipoReferenciaChange(item.id, loja)}
                      disabled={item.st_ativo === 0}
                    />
                  )}
                </TableCell>
                <TableCell>
                  <select
                    value={item.tipo_margem}
                    onChange={(e) => handleFieldChange(item.id, 'tipo_margem', e.target.value)}
                    disabled={item.st_ativo === 0}
                    className="w-24 p-1 border rounded"
                  >
                    <option value="percentual">Percentual</option>
                    <option value="valor">Valor</option>
                  </select>
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
