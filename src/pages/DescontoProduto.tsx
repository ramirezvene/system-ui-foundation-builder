import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Download, Upload, Plus, MessageSquare } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { Tables } from "@/integrations/supabase/types"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CurrencyInput } from "@/components/CurrencyInput"
import { PercentageInput } from "@/components/PercentageInput"

type ProdutoMargem = Tables<"produto_margem">
type Produto = Tables<"cadastro_produto">
type Estado = Tables<"cadastro_estado">
type Loja = Tables<"cadastro_loja">
type SubgrupoMargem = Tables<"subgrupo_margem">

interface ProdutoMargemExtended extends ProdutoMargem {
  produto?: Produto
  referencia_nome?: string
  subgrupo_margem?: SubgrupoMargem
}

interface NovoRegistro {
  id_produto: number
  tipo_aplicacao: string
  codigo_referencia: number
  margem: number
  tipo_margem: string
  data_inicio: string
  data_fim: string
  observacao: string
}

export default function DescontoProduto() {
  const [produtoMargens, setProdutoMargens] = useState<ProdutoMargemExtended[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [estados, setEstados] = useState<Estado[]>([])
  const [lojas, setLojas] = useState<Loja[]>([])
  const [subgrupoMargens, setSubgrupoMargens] = useState<SubgrupoMargem[]>([])
  const [editedRows, setEditedRows] = useState<Set<number>>(new Set())
  const [observacaoDialogs, setObservacaoDialogs] = useState<Set<number>>(new Set())
  const [showNovoRegistro, setShowNovoRegistro] = useState(false)
  const [novoRegistro, setNovoRegistro] = useState<NovoRegistro>({
    id_produto: 0,
    tipo_aplicacao: "estado",
    codigo_referencia: 0,
    margem: 0,
    tipo_margem: "percentual",
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: "2030-12-31",
    observacao: ""
  })
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
        .order("nome_estado")
      
      if (estadosError) throw estadosError

      // Buscar lojas
      const { data: lojasData, error: lojasError } = await supabase
        .from("cadastro_loja")
        .select("*")
        .order("loja")
      
      if (lojasError) throw lojasError

      // Buscar subgrupo margens
      const { data: subgrupoData, error: subgrupoError } = await supabase
        .from("subgrupo_margem")
        .select("*")
        .order("cod_subgrupo")
      
      if (subgrupoError) throw subgrupoError

      // Combinar dados
      const margemExtended = (margemData || []).map(margem => {
        const produto = produtosData?.find(p => p.id_produto === margem.id_produto)
        const subgrupoMargem = subgrupoData?.find(s => s.cod_subgrupo === produto?.subgrupo_id)
        
        let referencia_nome = ""
        
        if (margem.tipo_aplicacao === "estado") {
          const estado = estadosData?.find(e => e.id === margem.codigo_referencia)
          referencia_nome = estado?.estado || ""
        } else {
          const loja = lojasData?.find(l => l.cod_loja === margem.codigo_referencia)
          referencia_nome = loja ? `${loja.cod_loja} - ${loja.loja} - ${loja.estado}` : ""
        }

        return {
          ...margem,
          produto,
          referencia_nome,
          subgrupo_margem
        }
      })

      setProdutoMargens(margemExtended)
      setProdutos(produtosData || [])
      setEstados(estadosData || [])
      setLojas(lojasData || [])
      setSubgrupoMargens(subgrupoData || [])
    } catch (error) {
      console.error("Erro ao buscar dados:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive"
      })
    }
  }

  const calculateDesconto = (margem: number, margemAdc: number | null) => {
    if (!margemAdc) return 0
    return margem - margemAdc
  }

  const handleFieldChange = (id: number, field: keyof ProdutoMargem, value: any) => {
    setProdutoMargens(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
    setEditedRows(prev => new Set(prev).add(id))
  }

  const handleMargemChange = (id: number, value: string, tipoMargem: string) => {
    let numericValue = 0
    
    if (tipoMargem === "percentual") {
      // Remove % e converte vírgula para ponto
      numericValue = parseFloat(value.replace('%', '').replace(',', '.')) || 0
    } else {
      // Remove R$ e converte vírgula para ponto
      numericValue = parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0
    }
    
    handleFieldChange(id, 'margem', numericValue)
  }

  const handleTipoMargemChange = (id: number, tipoMargem: string) => {
    handleFieldChange(id, 'tipo_margem', tipoMargem)
    // Limpar o valor da margem quando o tipo mudar
    handleFieldChange(id, 'margem', 0)
  }

  const formatMargemForDisplay = (margem: number, tipoMargem: string) => {
    if (tipoMargem === "percentual") {
      return margem.toFixed(2).replace('.', ',') + '%'
    } else {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(margem)
    }
  }

  const handleNovoRegistroMargemChange = (value: string) => {
    let numericValue = 0
    
    if (novoRegistro.tipo_margem === "percentual") {
      numericValue = parseFloat(value.replace('%', '').replace(',', '.')) || 0
    } else {
      numericValue = parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0
    }
    
    setNovoRegistro(prev => ({ ...prev, margem: numericValue }))
  }

  const handleNovoRegistroTipoMargemChange = (tipoMargem: string) => {
    setNovoRegistro(prev => ({ ...prev, tipo_margem: tipoMargem, margem: 0 }))
  }

  const handleSave = async (id: number) => {
    const item = produtoMargens.find(p => p.id === id)
    if (!item) return

    try {
      const { error } = await supabase
        .from("produto_margem")
        .update({
          tipo_margem: item.tipo_margem,
          margem: item.margem,
          data_inicio: item.data_inicio,
          data_fim: item.data_fim,
          observacao: item.observacao,
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

  const handleAdicionarRegistro = async () => {
    if (!novoRegistro.id_produto || !novoRegistro.codigo_referencia) {
      toast({
        title: "Erro",
        description: "Produto e referência são obrigatórios",
        variant: "destructive"
      })
      return
    }

    try {
      const { error } = await supabase
        .from("produto_margem")
        .insert(novoRegistro)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Registro adicionado com sucesso"
      })

      setShowNovoRegistro(false)
      setNovoRegistro({
        id_produto: 0,
        tipo_aplicacao: "estado",
        codigo_referencia: 0,
        margem: 0,
        tipo_margem: "percentual",
        data_inicio: new Date().toISOString().split('T')[0],
        data_fim: "2030-12-31",
        observacao: ""
      })
      
      fetchData()
    } catch (error) {
      console.error("Erro ao adicionar registro:", error)
      toast({
        title: "Erro",
        description: "Erro ao adicionar registro",
        variant: "destructive"
      })
    }
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

  const getReferenciasDisponiveis = () => {
    if (novoRegistro.tipo_aplicacao === "estado") {
      return estados.map(estado => ({
        id: estado.id,
        nome: estado.estado
      }))
    } else {
      return lojas.map(loja => ({
        id: loja.cod_loja,
        nome: `${loja.cod_loja} - ${loja.loja} - ${loja.estado}`
      }))
    }
  }

  const handleExportCSV = () => {
    const csvContent = [
      ["ID Produto", "Produto", "Tipo Aplicação", "Referência", "Tipo Margem", "Margem", "% Margem Adc", "% Desc", "Ativo", "Data Início", "Data Fim", "Observação"],
      ...produtoMargens.map(item => [
        item.id_produto,
        item.produto?.nome_produto || "",
        item.tipo_aplicacao,
        item.referencia_nome || "",
        item.tipo_margem,
        item.margem,
        item.subgrupo_margem?.margem_adc || 0,
        calculateDesconto(item.margem, item.subgrupo_margem?.margem_adc || null),
        item.subgrupo_margem?.st_ativo === 1 ? "Ativo" : "Inativo",
        item.data_inicio,
        item.data_fim,
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Desconto Produto
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Importar CSV
            </Button>
            <Button size="sm" onClick={() => setShowNovoRegistro(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {showNovoRegistro && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Novo Registro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Produto</Label>
                  <Select 
                    value={novoRegistro.id_produto?.toString() || ""} 
                    onValueChange={(value) => setNovoRegistro(prev => ({ ...prev, id_produto: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {produtos.map((produto) => (
                        <SelectItem key={produto.id_produto} value={produto.id_produto.toString()}>
                          {produto.id_produto} - {produto.nome_produto}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Tipo Aplicação</Label>
                  <Select 
                    value={novoRegistro.tipo_aplicacao} 
                    onValueChange={(value) => setNovoRegistro(prev => ({ ...prev, tipo_aplicacao: value, codigo_referencia: 0 }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="estado">Estado</SelectItem>
                      <SelectItem value="loja">Loja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Referência</Label>
                  <Select 
                    value={novoRegistro.codigo_referencia?.toString() || ""} 
                    onValueChange={(value) => setNovoRegistro(prev => ({ ...prev, codigo_referencia: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma referência" />
                    </SelectTrigger>
                    <SelectContent>
                      {getReferenciasDisponiveis().map((ref) => (
                        <SelectItem key={ref.id} value={ref.id.toString()}>
                          {ref.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Tipo Margem</Label>
                  <Select 
                    value={novoRegistro.tipo_margem} 
                    onValueChange={handleNovoRegistroTipoMargemChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentual">Percentual</SelectItem>
                      <SelectItem value="valor">Valor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Margem</Label>
                  {novoRegistro.tipo_margem === "percentual" ? (
                    <PercentageInput
                      value={formatMargemForDisplay(novoRegistro.margem, novoRegistro.tipo_margem)}
                      onChange={handleNovoRegistroMargemChange}
                      className="w-full"
                    />
                  ) : (
                    <CurrencyInput
                      value={formatMargemForDisplay(novoRegistro.margem, novoRegistro.tipo_margem)}
                      onChange={handleNovoRegistroMargemChange}
                      className="w-full"
                    />
                  )}
                </div>

                <div>
                  <Label>Data Início</Label>
                  <Input
                    type="date"
                    value={novoRegistro.data_inicio}
                    onChange={(e) => setNovoRegistro(prev => ({ ...prev, data_inicio: e.target.value }))}
                    className="w-full"
                  />
                </div>

                <div>
                  <Label>Data Fim</Label>
                  <Input
                    type="date"
                    value={novoRegistro.data_fim}
                    onChange={(e) => setNovoRegistro(prev => ({ ...prev, data_fim: e.target.value }))}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <Label>Observação (máximo 100 caracteres)</Label>
                <Textarea
                  value={novoRegistro.observacao}
                  onChange={(e) => setNovoRegistro(prev => ({ ...prev, observacao: e.target.value }))}
                  maxLength={100}
                  placeholder="Digite uma observação específica..."
                  className="min-h-20"
                />
                <div className="text-sm text-gray-500 mt-1">
                  {novoRegistro.observacao.length}/100 caracteres
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAdicionarRegistro}>
                  Salvar
                </Button>
                <Button variant="outline" onClick={() => setShowNovoRegistro(false)}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Produto</th>
                <th className="text-left p-3">Tipo Aplicação</th>
                <th className="text-left p-3">Referência</th>
                <th className="text-left p-3">Tipo Margem</th>
                <th className="text-left p-3">% Margem</th>
                <th className="text-left p-3">% Margem Adc</th>
                <th className="text-left p-3">% Desc</th>
                <th className="text-left p-3 w-36">Data Início</th>
                <th className="text-left p-3 w-36">Data Fim</th>
                <th className="text-left p-3">Ativo</th>
                <th className="text-left p-3">Observação</th>
                <th className="text-left p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtoMargens.map((item) => (
                <tr key={item.id} className={`border-b ${editedRows.has(item.id) ? 'bg-yellow-50' : ''}`}>
                  <td className="p-3">{item.id_produto}</td>
                  <td className="p-3">{item.produto?.nome_produto}</td>
                  <td className="p-3">{item.tipo_aplicacao}</td>
                  <td className="p-3">{item.referencia_nome}</td>
                  <td className="p-3">
                    <Select 
                      value={item.tipo_margem} 
                      onValueChange={(value) => handleTipoMargemChange(item.id, value)}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentual">Percentual</SelectItem>
                        <SelectItem value="valor">Valor</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3">
                    {item.tipo_margem === "percentual" ? (
                      <PercentageInput
                        value={formatMargemForDisplay(item.margem, item.tipo_margem)}
                        onChange={(value) => handleMargemChange(item.id, value, item.tipo_margem)}
                        className="w-24"
                      />
                    ) : (
                      <CurrencyInput
                        value={formatMargemForDisplay(item.margem, item.tipo_margem)}
                        onChange={(value) => handleMargemChange(item.id, value, item.tipo_margem)}
                        className="w-32"
                      />
                    )}
                  </td>
                  <td className="p-3">
                    <span className="text-sm">
                      {item.subgrupo_margem?.margem_adc 
                        ? `${item.subgrupo_margem.margem_adc.toFixed(2)}%` 
                        : "N/A"}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="text-sm">
                      {item.subgrupo_margem?.margem_adc 
                        ? `${calculateDesconto(item.margem, item.subgrupo_margem.margem_adc).toFixed(2)}%`
                        : "N/A"}
                    </span>
                  </td>
                  <td className="p-3">
                    <Input
                      type="date"
                      value={item.data_inicio}
                      onChange={(e) => handleFieldChange(item.id, 'data_inicio', e.target.value)}
                      className="w-full"
                    />
                  </td>
                  <td className="p-3">
                    <Input
                      type="date"
                      value={item.data_fim}
                      onChange={(e) => handleFieldChange(item.id, 'data_fim', e.target.value)}
                      className="w-full"
                    />
                  </td>
                  <td className="p-3">
                    <Badge variant={item.subgrupo_margem?.st_ativo === 1 ? "default" : "destructive"}>
                      {item.subgrupo_margem?.st_ativo === 1 ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Dialog open={observacaoDialogs.has(item.id)} onOpenChange={() => toggleObservacaoDialog(item.id)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Observação - {item.produto?.nome_produto}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Label>Observação (máximo 100 caracteres)</Label>
                          <Textarea
                            value={item.observacao || ''}
                            onChange={(e) => handleFieldChange(item.id, 'observacao', e.target.value)}
                            maxLength={100}
                            placeholder="Digite uma observação específica..."
                            className="min-h-20"
                          />
                          <div className="text-sm text-gray-500">
                            {(item.observacao || '').length}/100 caracteres
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </td>
                  <td className="p-3">
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
