import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Upload, Plus, MessageSquare } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { Tables } from "@/integrations/supabase/types"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PercentageInput } from "@/components/PercentageInput"
import { CurrencyInput } from "@/components/CurrencyInput"
import { AddProdutoMargemDialog } from "@/components/AddProdutoMargemDialog"
import { EstadoCombobox } from "@/components/EstadoCombobox"
import { LojaCombobox } from "@/components/LojaCombobox"

type ProdutoMargem = Tables<"produto_margem">
type CadastroProduto = Tables<"cadastro_produto">
type Estado = Tables<"cadastro_estado">
type Loja = Tables<"cadastro_loja">

interface ProdutoMargemWithProduto extends ProdutoMargem {
  produto?: CadastroProduto
}

export default function DescontoProduto() {
  const [produtos, setProdutos] = useState<ProdutoMargemWithProduto[]>([])
  const [produtosCadastro, setProdutosCadastro] = useState<CadastroProduto[]>([])
  const [estados, setEstados] = useState<Estado[]>([])
  const [lojas, setLojas] = useState<Loja[]>([])
  const [editedRows, setEditedRows] = useState<Set<number>>(new Set())
  const [observacaoDialogs, setObservacaoDialogs] = useState<Set<number>>(new Set())
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from("produto_margem")
        .select(`
          *,
          produto:cadastro_produto!fk_produto_margem_produto(*)
        `)
        .order("id")
      
      if (error) throw error

      // Buscar produtos para o dropdown de adicionar
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

      console.log("Dados carregados:", data)
      setProdutos(data || [])
      setProdutosCadastro(produtosData || [])
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
    console.log(`Alterando campo ${field} do produto ${id} para:`, value)
    setProdutos(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
    setEditedRows(prev => new Set(prev).add(id))
  }

  const handleTipoReferenciaChange = (id: number, selectedItem: Estado | Loja | null) => {
    if (!selectedItem) return
    
    const item = produtos.find(p => p.id === id)
    if (!item) return

    let tipoReferenciaValue: string
    if (item.tipo_aplicacao === 'estado') {
      tipoReferenciaValue = (selectedItem as Estado).estado
    } else {
      tipoReferenciaValue = (selectedItem as Loja).cod_loja.toString()
    }

    handleFieldChange(id, 'tipo_referencia', tipoReferenciaValue)
  }

  const handleMargemChange = (id: number, value: string) => {
    const item = produtos.find(p => p.id === id)
    if (!item) return

    let numericValue = 0
    
    if (item.tipo_margem === 'percentual') {
      // Remove o símbolo % e converte vírgula para ponto
      const cleanValue = value.replace('%', '').replace(',', '.')
      numericValue = parseFloat(cleanValue) || 0
    } else {
      // Para valores monetários, remove R$, pontos de milhares e converte vírgula para ponto
      const cleanValue = value.replace(/R\$\s?/, '').replace(/\./g, '').replace(',', '.')
      numericValue = parseFloat(cleanValue) || 0
    }
    
    console.log(`Alterando margem do produto ${id} de "${value}" para:`, numericValue)
    handleFieldChange(id, 'margem', numericValue)
  }

  const handleMargemAdcChange = (id: number, value: string) => {
    const item = produtos.find(p => p.id === id)
    if (!item) return

    let numericValue = 0
    
    if (item.tipo_margem === 'percentual') {
      // Remove o símbolo % e converte vírgula para ponto
      const cleanValue = value.replace('%', '').replace(',', '.')
      numericValue = parseFloat(cleanValue) || 0
    } else {
      // Para valores monetários, remove R$, pontos de milhares e converte vírgula para ponto
      const cleanValue = value.replace(/R\$\s?/, '').replace(/\./g, '').replace(',', '.')
      numericValue = parseFloat(cleanValue) || 0
    }
    
    console.log(`Alterando margem adc do produto ${id} de "${value}" para:`, numericValue)
    handleFieldChange(id, 'margem_adc', numericValue)
  }

  const handleDescontoChange = (id: number, value: string) => {
    // Remove o símbolo % e converte vírgula para ponto
    const cleanValue = value.replace('%', '').replace(',', '.')
    const numericValue = parseFloat(cleanValue) || 0
    
    console.log(`Alterando desconto do produto ${id} de "${value}" para:`, numericValue)
    handleFieldChange(id, 'desconto', numericValue)
  }

  const formatValueForDisplay = (value: number | null, isPercentual: boolean = false, tipoMargem: string = 'percentual') => {
    if (value === null || value === undefined) return ''
    
    if (isPercentual || tipoMargem === 'percentual') {
      return value.toFixed(2).replace('.', ',') + '%'
    } else {
      // Para valores monetários
      return value.toFixed(2).replace('.', ',')
    }
  }

  const handleSave = async (id: number) => {
    const item = produtos.find(p => p.id === id)
    if (!item) return

    try {
      console.log("Salvando produto:", item)
      
      const { error } = await supabase
        .from("produto_margem")
        .update({
          id_produto: item.id_produto,
          margem: item.margem,
          margem_adc: item.margem_adc,
          desconto: item.desconto,
          tipo_aplicacao: item.tipo_aplicacao,
          tipo_margem: item.tipo_margem,
          tipo_referencia: item.tipo_referencia,
          data_inicio: item.data_inicio,
          data_fim: item.data_fim,
          observacao: item.observacao,
          st_ativo: item.st_ativo
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
      ["ID", "ID Produto", "Nome Produto", "Tipo", "Tipo Ref", "Tipo Margem", "Margem", "Margem Adc", "% Desc", "Data Início", "Data Fim", "Ativo", "Observação"],
      ...produtos.map(item => [
        item.id,
        item.id_produto,
        item.produto?.nome_produto || '',
        item.tipo_aplicacao,
        item.tipo_referencia || '',
        item.tipo_margem,
        item.margem,
        item.margem_adc || '',
        item.desconto || '',
        item.data_inicio,
        item.data_fim,
        item.st_ativo === 1 ? 'Ativo' : 'Inativo',
        item.observacao
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

  const isFieldEditable = (item: ProdutoMargemWithProduto) => {
    return item.st_ativo === 1
  }

  const shouldShowField = (item: ProdutoMargemWithProduto, field: 'margem' | 'margem_adc' | 'desconto') => {
    if (item.tipo_margem === 'valor') {
      return field === 'margem' || field === 'margem_adc'
    } else if (item.tipo_margem === 'percentual') {
      return true // mostra todos os campos
    }
    return false
  }

  const getTipoReferenciaOptions = (tipoAplicacao: string) => {
    if (tipoAplicacao === 'estado') {
      return estados
    } else if (tipoAplicacao === 'loja') {
      return lojas
    }
    return []
  }

  const getTipoReferenciaDisplay = (item: ProdutoMargemWithProduto) => {
    if (item.tipo_aplicacao === 'estado') {
      const estado = estados.find(e => e.estado === item.tipo_referencia)
      return estado ? `${estado.estado} - ${estado.nome_estado}` : item.tipo_referencia
    } else if (item.tipo_aplicacao === 'loja') {
      const loja = lojas.find(l => l.cod_loja.toString() === item.tipo_referencia)
      return loja ? `${loja.cod_loja} - ${loja.loja} - ${loja.estado}` : item.tipo_referencia
    }
    return item.tipo_referencia || ''
  }

  const getSelectedEstado = (item: ProdutoMargemWithProduto) => {
    if (item.tipo_aplicacao === 'estado') {
      return estados.find(e => e.estado === item.tipo_referencia) || null
    }
    return null
  }

  const getSelectedLoja = (item: ProdutoMargemWithProduto) => {
    if (item.tipo_aplicacao === 'loja') {
      return lojas.find(l => l.cod_loja.toString() === item.tipo_referencia) || null
    }
    return null
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Configuração Desconto Produto
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleImportCSV}>
              <Upload className="w-4 h-4 mr-2" />
              Importar CSV
            </Button>
            <AddProdutoMargemDialog produtos={produtosCadastro} onAdd={fetchData} />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">ID</th>
                <th className="text-left p-2">ID Produto</th>
                <th className="text-left p-2">Nome Produto</th>
                <th className="text-left p-2">Tipo</th>
                <th className="text-left p-2">Tipo Ref</th>
                <th className="text-left p-2">Tipo Margem</th>
                <th className="text-left p-2">Margem</th>
                <th className="text-left p-2">Margem Adc</th>
                <th className="text-left p-2">% Desc</th>
                <th className="text-left p-2 w-32">Data Início</th>
                <th className="text-left p-2 w-32">Data Fim</th>
                <th className="text-left p-2">Ativo</th>
                <th className="text-left p-2">Observação</th>
                <th className="text-left p-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((item) => (
                <tr key={item.id} className={`border-b ${editedRows.has(item.id) ? 'bg-yellow-50' : ''} ${!isFieldEditable(item) ? 'bg-gray-50' : ''}`}>
                  <td className="p-2">{item.id}</td>
                  <td className="p-2">
                    <span className="text-sm">{item.id_produto}</span>
                  </td>
                  <td className="p-2">
                    <span className="text-sm">{item.produto?.nome_produto || 'Produto não encontrado'}</span>
                  </td>
                  <td className="p-2">
                    <Select
                      value={item.tipo_aplicacao}
                      onValueChange={(value) => handleFieldChange(item.id, 'tipo_aplicacao', value)}
                      disabled={!isFieldEditable(item)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="estado">Estado</SelectItem>
                        <SelectItem value="loja">Loja</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-2">
                    {item.tipo_aplicacao === 'estado' ? (
                      <EstadoCombobox
                        estados={estados}
                        selectedEstado={getSelectedEstado(item)}
                        onEstadoChange={(estado) => handleTipoReferenciaChange(item.id, estado)}
                        placeholder="Selecionar estado..."
                        disabled={!isFieldEditable(item)}
                      />
                    ) : (
                      <LojaCombobox
                        lojas={lojas}
                        selectedLoja={getSelectedLoja(item)}
                        onLojaChange={(loja) => handleTipoReferenciaChange(item.id, loja)}
                        placeholder="Selecionar loja..."
                        disabled={!isFieldEditable(item)}
                      />
                    )}
                  </td>
                  <td className="p-2">
                    <Select
                      value={item.tipo_margem}
                      onValueChange={(value) => handleFieldChange(item.id, 'tipo_margem', value)}
                      disabled={!isFieldEditable(item)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentual">Percentual</SelectItem>
                        <SelectItem value="valor">Valor</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  {/* Margem */}
                  <td className="p-2">
                    {shouldShowField(item, 'margem') && (
                      item.tipo_margem === 'percentual' ? (
                        <PercentageInput
                          value={formatValueForDisplay(item.margem, true)}
                          onChange={(value) => handleMargemChange(item.id, value)}
                          className="w-24"
                          disabled={!isFieldEditable(item)}
                        />
                      ) : (
                        <Input
                          type="text"
                          value={formatValueForDisplay(item.margem, false, 'valor')}
                          onChange={(e) => handleMargemChange(item.id, e.target.value)}
                          className="w-24"
                          disabled={!isFieldEditable(item)}
                          placeholder="0,00"
                        />
                      )
                    )}
                  </td>
                  {/* Margem Adc */}
                  <td className="p-2">
                    {shouldShowField(item, 'margem_adc') && (
                      item.tipo_margem === 'percentual' ? (
                        <PercentageInput
                          value={formatValueForDisplay(item.margem_adc, true)}
                          onChange={(value) => handleMargemAdcChange(item.id, value)}
                          className="w-24"
                          disabled={!isFieldEditable(item)}
                        />
                      ) : (
                        <Input
                          type="text"
                          value={formatValueForDisplay(item.margem_adc, false, 'valor')}
                          onChange={(e) => handleMargemAdcChange(item.id, e.target.value)}
                          className="w-24"
                          disabled={!isFieldEditable(item)}
                          placeholder="0,00"
                        />
                      )
                    )}
                  </td>
                  {/* % Desc */}
                  <td className="p-2">
                    {shouldShowField(item, 'desconto') && item.tipo_margem === 'percentual' && (
                      <PercentageInput
                        value={formatValueForDisplay(item.desconto, true)}
                        onChange={(value) => handleDescontoChange(item.id, value)}
                        className="w-24"
                        disabled={!isFieldEditable(item)}
                      />
                    )}
                  </td>
                  <td className="p-2">
                    <Input
                      type="date"
                      value={item.data_inicio || ''}
                      onChange={(e) => handleFieldChange(item.id, 'data_inicio', e.target.value)}
                      className="w-full"
                      disabled={!isFieldEditable(item)}
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="date"
                      value={item.data_fim || ''}
                      onChange={(e) => handleFieldChange(item.id, 'data_fim', e.target.value)}
                      className="w-full"
                      disabled={!isFieldEditable(item)}
                    />
                  </td>
                  <td className="p-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={item.st_ativo === 1}
                        onCheckedChange={(checked) => handleFieldChange(item.id, 'st_ativo', checked ? 1 : 0)}
                      />
                      <Label className="text-xs">
                        {item.st_ativo === 1 ? 'Ativo' : 'Inativo'}
                      </Label>
                    </div>
                  </td>
                  <td className="p-2">
                    <Dialog open={observacaoDialogs.has(item.id)} onOpenChange={() => toggleObservacaoDialog(item.id)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Observação - Produto {item.id_produto}</DialogTitle>
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
                  <td className="p-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleSave(item.id)}
                      disabled={!editedRows.has(item.id)}
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
