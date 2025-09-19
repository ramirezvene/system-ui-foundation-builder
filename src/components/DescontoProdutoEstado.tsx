import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Upload, MessageSquare } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { supabase } from "@/integrations/supabase/client"
import { Tables } from "@/integrations/supabase/types"
import { useToast } from "@/hooks/use-toast"
import { AddProdutoMargemDialog } from "./AddProdutoMargemDialog"
import { EstadoCombobox } from "./EstadoCombobox"
import { CurrencyInput } from "./CurrencyInput"
import { PercentageInput } from "./PercentageInput"
import { TableFilter } from "./TableFilter"

type ProdutoMargem = Tables<"produto_margem">
type Produto = Tables<"cadastro_produto">
type Estado = Tables<"cadastro_estado">

interface ProdutoMargemExtended extends ProdutoMargem {
  produto?: Produto
}

export default function DescontoProdutoEstado() {
  const [produtoMargens, setProdutoMargens] = useState<ProdutoMargemExtended[]>([])
  const [filteredProdutoMargens, setFilteredProdutoMargens] = useState<ProdutoMargemExtended[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [estados, setEstados] = useState<Estado[]>([])
  const [editedRows, setEditedRows] = useState<Set<number>>(new Set())
  const [observacaoDialogs, setObservacaoDialogs] = useState<Set<number>>(new Set())
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Buscar produtos margem apenas do tipo estado
      const { data: margemData, error: margemError } = await supabase
        .from("produto_margem")
        .select("*")
        .eq("tipo_aplicacao", "estado")
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

      // Combinar dados
      const margemExtended = (margemData || []).map(margem => {
        const produto = produtosData?.find(p => p.id_produto === margem.id_produto)
        return {
          ...margem,
          produto
        }
      })

      setProdutoMargens(margemExtended)
      setFilteredProdutoMargens(margemExtended)
      setProdutos(produtosData || [])
      setEstados(estadosData || [])
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

  const handleTipoReferenciaChange = (id: number, selectedEstado: Estado | null) => {
    if (!selectedEstado) return
    handleFieldChange(id, 'tipo_referencia', selectedEstado.estado)
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

  const handleStatusChange = async (id: number, newStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("produto_margem")
        .update({
          st_ativo: newStatus ? 1 : 0,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)

      if (error) throw error

      setProdutoMargens(prev => prev.map(item => 
        item.id === id ? { ...item, st_ativo: newStatus ? 1 : 0 } : item
      ))

      toast({
        title: "Sucesso",
        description: `Status ${newStatus ? 'ativado' : 'desativado'} com sucesso`
      })
    } catch (error) {
      console.error("Erro ao alterar status:", error)
      toast({
        title: "Erro",
        description: "Erro ao alterar status",
        variant: "destructive"
      })
    }
  }

  const handleExportCSV = () => {
    const csvContent = [
      ["ID", "ID Produto", "Nome Produto", "Estado", "Tipo Margem", "Margem", "Margem Adicional", "% Desconto", "Data Início", "Data Fim", "Ativo", "Observação"],
      ...produtoMargens.map(item => [
        item.id,
        item.id_produto,
        item.produto?.nome_produto || "",
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
    link.setAttribute("download", "desconto_produtos_estado.csv")
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
          if (values.length >= 12) {
            const id = parseInt(values[0])
            if (!isNaN(id)) {
              updates.push({
                id: id,
                margem: parseFloat(values[5]) || 0,
                margem_adc: values[6] ? parseFloat(values[6]) : null,
                desconto: values[7] ? parseFloat(values[7]) : null,
                data_inicio: values[8],
                data_fim: values[9],
                st_ativo: values[10] === "Ativo" ? 1 : 0,
                observacao: values[11] || null
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

  const toggleObservacaoDialog = (id: number) => {
    setObservacaoDialogs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const getSelectedEstado = (item: ProdutoMargemExtended) => {
    return estados.find(e => e.estado === item.tipo_referencia) || null
  }

  const filterOptions = [
    { value: "id_produto", label: "ID Produto" },
    { value: "produto.nome_produto", label: "Nome Produto" },
    { value: "tipo_referencia", label: "Estado" },
    { value: "tipo_margem", label: "Tipo Margem" },
    { value: "margem", label: "Margem" },
    { value: "data_inicio", label: "Data Início" },
    { value: "data_fim", label: "Data Fim" },
    { value: "st_ativo", label: "Status" },
  ];

  const applyFilters = (data: ProdutoMargemExtended[]) => {
    let filtered = [...data];
    
    Object.entries(activeFilters).forEach(([field, value]) => {
      if (value) {
        filtered = filtered.filter(item => {
          let fieldValue = '';
          if (field === 'produto.nome_produto') {
            fieldValue = String(item.produto?.nome_produto || '').toLowerCase();
          } else {
            fieldValue = String(item[field as keyof ProdutoMargemExtended] || '').toLowerCase();
          }
          return fieldValue.includes(value.toLowerCase());
        });
      }
    });
    
    setFilteredProdutoMargens(filtered);
  };

  const handleFilterChange = (field: string, value: string) => {
    const newFilters = { ...activeFilters, [field]: value };
    setActiveFilters(newFilters);
    applyFilters(produtoMargens);
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    setFilteredProdutoMargens(produtoMargens);
  };

  useEffect(() => {
    applyFilters(produtoMargens);
  }, [activeFilters, produtoMargens]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Desconto Produto Estado
          <div className="flex gap-2">
            <AddProdutoMargemDialog produtos={produtos} onAdd={fetchData} tipoFixo="estado" />
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
      <CardContent className="space-y-4">
        <TableFilter
          filterOptions={filterOptions}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          activeFilters={activeFilters}
        />
        <div className="p-0">
        <div className="w-full">
          <table className="w-full border-collapse table-fixed">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-3 w-20 text-sm font-medium">ID Produto</th>
                <th className="text-left p-3 w-1/4 text-sm font-medium">Nome Produto</th>
                <th className="text-left p-3 w-32 text-sm font-medium">Estado</th>
                <th className="text-left p-3 w-24 text-sm font-medium">Tipo Margem</th>
                <th className="text-left p-3 w-20 text-sm font-medium">Qtde Min</th>
                <th className="text-left p-3 w-20 text-sm font-medium">Qtde Max</th>
                <th className="text-left p-3 w-20 text-sm font-medium">Margem</th>
                <th className="text-left p-3 w-20 text-sm font-medium">Margem Adc</th>
                <th className="text-left p-3 w-20 text-sm font-medium">% Desc</th>
                <th className="text-left p-3 w-28 text-sm font-medium">Data Início</th>
                <th className="text-left p-3 w-28 text-sm font-medium">Data Fim</th>
                <th className="text-left p-3 w-16 text-sm font-medium">Ativo</th>
                <th className="text-left p-3 w-20 text-sm font-medium">Obs</th>
                <th className="text-left p-3 w-20 text-sm font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProdutoMargens.map((item) => (
                <tr key={item.id} className={`border-b hover:bg-gray-50 ${editedRows.has(item.id) ? 'bg-yellow-50' : ''}`}>
                  <td className="p-3 text-sm">{item.id_produto}</td>
                  <td className="p-3">
                    <div className="text-sm truncate" title={item.produto?.nome_produto}>
                      {item.produto?.nome_produto}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="w-full">
                      <EstadoCombobox
                        estados={estados}
                        selectedEstado={getSelectedEstado(item)}
                        onEstadoChange={(estado) => handleTipoReferenciaChange(item.id, estado)}
                        disabled={item.st_ativo === 0}
                      />
                    </div>
                  </td>
                   <td className="p-3">
                     <select
                       value={item.tipo_margem}
                       onChange={(e) => handleFieldChange(item.id, 'tipo_margem', e.target.value)}
                       disabled={item.st_ativo === 0}
                       className="w-full p-2 border rounded text-sm bg-background"
                     >
                       <option value="percentual">%</option>
                       <option value="valor">R$</option>
                     </select>
                   </td>
                   <td className="p-3">
                     <Input
                       type="number"
                       value={0}
                       className="w-full bg-background text-sm h-8"
                       disabled={false}
                       readOnly={false}
                       min="0"
                     />
                   </td>
                   <td className="p-3">
                     <Input
                       type="number"
                       value={item.qtde_max}
                       onChange={(e) => handleFieldChange(item.id, 'qtde_max', parseInt(e.target.value) || 0)}
                       disabled={item.st_ativo === 0}
                       className="w-full text-sm h-8"
                       min="0"
                     />
                   </td>
                    <td className="p-3">
                      {item.tipo_margem === "percentual" ? (
                        <PercentageInput
                          value={item.margem ? `${item.margem.toFixed(2)}%` : ""}
                          onChange={(value) => {
                            const numericValue = parseFloat(value.replace('%', '').replace(',', '.')) || 0;
                            if (numericValue >= 0 && numericValue <= 100) {
                              handleFieldChange(item.id, 'margem', numericValue);
                            }
                          }}
                          disabled={item.st_ativo === 0}
                          className="w-full text-sm h-8"
                          placeholder="0,00%"
                        />
                      ) : (
                        <CurrencyInput
                          value={item.margem ? new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                            minimumFractionDigits: 2
                          }).format(item.margem) : ""}
                          onChange={(value) => {
                            const numericValue = parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
                            if (numericValue >= 0) {
                              handleFieldChange(item.id, 'margem', numericValue);
                            }
                          }}
                          disabled={item.st_ativo === 0}
                          className="w-full text-sm h-8"
                          placeholder="R$ 0,00"
                        />
                      )}
                    </td>
                   <td className="p-3">
                     {item.tipo_margem === "percentual" ? (
                       <PercentageInput
                         value={item.margem_adc ? `${item.margem_adc.toFixed(2)}%` : ""}
                         onChange={(value) => {
                           const numericValue = parseFloat(value.replace('%', '').replace(',', '.')) || null;
                           if (numericValue === null || (numericValue >= 0 && numericValue <= 100)) {
                             handleFieldChange(item.id, 'margem_adc', numericValue);
                           }
                         }}
                         disabled={item.st_ativo === 0}
                         className="w-full text-sm h-8"
                         placeholder="0,00%"
                       />
                     ) : (
                       <CurrencyInput
                         value={item.margem_adc ? new Intl.NumberFormat('pt-BR', {
                           style: 'currency',
                           currency: 'BRL',
                           minimumFractionDigits: 2
                         }).format(item.margem_adc) : ""}
                         onChange={(value) => {
                           const numericValue = parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || null;
                           if (numericValue === null || numericValue >= 0) {
                             handleFieldChange(item.id, 'margem_adc', numericValue);
                           }
                         }}
                         disabled={item.st_ativo === 0}
                         className="w-full text-sm h-8"
                         placeholder="R$ 0,00"
                       />
                     )}
                   </td>
                  <td className="p-3">
                    <Input
                      type="number"
                      step="0.01"
                      value={item.desconto || ""}
                      onChange={(e) => handleFieldChange(item.id, 'desconto', parseFloat(e.target.value) || null)}
                      disabled={item.st_ativo === 0 || item.tipo_margem === "valor"}
                      className="w-full text-sm h-8"
                    />
                  </td>
                  <td className="p-3">
                    <Input
                      type="date"
                      value={item.data_inicio}
                      onChange={(e) => handleFieldChange(item.id, 'data_inicio', e.target.value)}
                      disabled={item.st_ativo === 0}
                      className="w-full text-sm h-8"
                    />
                  </td>
                  <td className="p-3">
                    <Input
                      type="date"
                      value={item.data_fim}
                      onChange={(e) => handleFieldChange(item.id, 'data_fim', e.target.value)}
                      disabled={item.st_ativo === 0}
                      className="w-full text-sm h-8"
                    />
                  </td>
                   <td className="p-3">
                     <Switch
                       checked={item.st_ativo === 1}
                       onCheckedChange={(checked) => handleFieldChange(item.id, 'st_ativo', checked ? 1 : 0)}
                       disabled={false}
                     />
                   </td>
                  <td className="p-3">
                    <Dialog open={observacaoDialogs.has(item.id)} onOpenChange={() => toggleObservacaoDialog(item.id)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md z-50">
                        <DialogHeader>
                          <DialogTitle>Observação - Produto {item.id}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Label>Observação</Label>
                          <Textarea
                            value={item.observacao || ''}
                            onChange={(e) => handleFieldChange(item.id, 'observacao', e.target.value)}
                            placeholder="Digite uma observação específica..."
                            className="min-h-20"
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  </td>
                  <td className="p-3">
                    <Button 
                      size="sm" 
                      onClick={() => handleSave(item.id)}
                      disabled={!editedRows.has(item.id)}
                      className="text-xs h-8"
                    >
                      Salvar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      </CardContent>
    </Card>
  )
}