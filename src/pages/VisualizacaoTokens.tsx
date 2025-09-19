
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Eye, Download, X } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { Tables } from "@/integrations/supabase/types"
import { useToast } from "@/hooks/use-toast"
import { TokenDetailsCard } from "@/components/vendas/TokenDetailsCard"

type TokenLoja = Tables<"token_loja">
type TokenLojaDetalhado = Tables<"token_loja_detalhado">

interface TokenWithLoja extends TokenLoja {
  cadastro_loja: {
    loja: string
    estado: string
    cod_loja: number
  }
}


export default function VisualizacaoTokens() {
  const [tokens, setTokens] = useState<TokenWithLoja[]>([])
  const [filteredTokens, setFilteredTokens] = useState<TokenWithLoja[]>([])
  const [selectedToken, setSelectedToken] = useState<TokenWithLoja | null>(null)
  const [tokenDetalhes, setTokenDetalhes] = useState<TokenLojaDetalhado[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  
  // Filtros
  const [filterCodigoToken, setFilterCodigoToken] = useState("")
  const [filterCodigoLoja, setFilterCodigoLoja] = useState("")
  const [filterEstado, setFilterEstado] = useState("")
  const [filterStatus, setFilterStatus] = useState("todos")
  const [filterDataInicio, setFilterDataInicio] = useState("")
  const [filterDataFim, setFilterDataFim] = useState("")
  
  const { toast } = useToast()

  useEffect(() => {
    fetchTokens()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [tokens, filterCodigoToken, filterCodigoLoja, filterEstado, filterStatus, filterDataInicio, filterDataFim])

  const applyFilters = () => {
    let filtered = tokens

    if (filterCodigoToken) {
      filtered = filtered.filter(token => 
        token.codigo_token.toLowerCase().includes(filterCodigoToken.toLowerCase())
      )
    }

    if (filterCodigoLoja) {
      filtered = filtered.filter(token => 
        token.cadastro_loja.cod_loja.toString().includes(filterCodigoLoja) ||
        token.cadastro_loja.loja.toLowerCase().includes(filterCodigoLoja.toLowerCase())
      )
    }

    if (filterEstado) {
      filtered = filtered.filter(token => 
        token.cadastro_loja.estado.toLowerCase().includes(filterEstado.toLowerCase())
      )
    }

    if (filterStatus && filterStatus !== "todos") {
      const statusValue = filterStatus === "aprovado" ? 1 : filterStatus === "rejeitado" ? 0 : null
      filtered = filtered.filter(token => token.st_aprovado === statusValue)
    }

    if (filterDataInicio) {
      filtered = filtered.filter(token => {
        const tokenDate = new Date(token.data_criacao!)
        const startDate = new Date(filterDataInicio)
        return tokenDate >= startDate
      })
    }

    if (filterDataFim) {
      filtered = filtered.filter(token => {
        const tokenDate = new Date(token.data_criacao!)
        const endDate = new Date(filterDataFim)
        endDate.setHours(23, 59, 59, 999) // Incluir o dia inteiro
        return tokenDate <= endDate
      })
    }

    setFilteredTokens(filtered)
  }

  const clearFilters = () => {
    setFilterCodigoToken("")
    setFilterCodigoLoja("")
    setFilterEstado("")
    setFilterStatus("todos")
    setFilterDataInicio("")
    setFilterDataFim("")
  }

  const fetchTokens = async () => {
    try {
      const { data, error } = await supabase
        .from("token_loja")
        .select(`
          *,
          cadastro_loja (
            loja,
            estado,
            cod_loja
          )
        `)
        .order("data_criacao", { ascending: false })
      
      if (error) throw error
      setTokens(data || [])
    } catch (error) {
      console.error("Erro ao buscar tokens:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar tokens",
        variant: "destructive"
      })
    }
  }

  const fetchTokenDetalhes = async (tokenId: number) => {
    try {
      const { data, error } = await supabase
        .from("token_loja_detalhado")
        .select("*")
        .eq("codigo_token", tokenId)
      
      if (error) throw error
      setTokenDetalhes(data || [])
    } catch (error) {
      console.error("Erro ao buscar detalhes do token:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar detalhes do token",
        variant: "destructive"
      })
    }
  }

  const handleViewDetails = async (token: TokenWithLoja) => {
    setSelectedToken(token)
    await fetchTokenDetalhes(token.id)
    setIsDialogOpen(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const formatCurrency = (value: number | null) => {
    if (!value) return "R$ 0,00"
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatPercentage = (value: string | null) => {
    if (!value) return "0%"
    return `${value}%`
  }

  const getStatusBadge = (status: number | null) => {
    if (status === 1) {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Aprovado</Badge>
    } else if (status === 0) {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejeitado</Badge>
    }
    return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendente</Badge>
  }

  const exportToCSV = () => {
    const headers = [
      'Código Token',
      'Loja ID',
      'Loja Nome',
      'UF',
      'Produto ID',
      'Produto Nome',
      'Preço Regular',
      'Preço Solicitado',
      'Desconto (%)',
      'Quantidade',
      'Preço Mínimo',
      'CMG Produto',
      'Outros Descontos',
      'Margem UF',
      'Margem',
      'Margem Adicional',
      'Impostos (%)',
      'Status',
      'Data Criação',
      'Observação'
    ]

    const csvData = []
    csvData.push(headers.join(','))

    filteredTokens.forEach(token => {
      if (token.id === selectedToken?.id && tokenDetalhes.length > 0) {
        tokenDetalhes.forEach(detalhe => {
          const row = [
            token.codigo_token,
            token.cadastro_loja.cod_loja,
            token.cadastro_loja.loja,
            token.cadastro_loja.estado,
            '', // Produto ID - não disponível na estrutura atual
            detalhe.produto || '',
            detalhe.preco_regul || '',
            detalhe.vlr_solic || '',
            detalhe.desconto || '',
            detalhe.qtde_solic || '',
            detalhe.preco_min || '',
            detalhe.cmg_produto || '',
            '', // Outros descontos
            detalhe.margem_uf || '',
            detalhe.margem_zvdc || '',
            '', // Margem adicional
            '', // Impostos
            token.st_aprovado === 1 ? 'Aprovado' : token.st_aprovado === 0 ? 'Rejeitado' : 'Pendente',
            formatDate(token.data_criacao!),
            detalhe.observacao || ''
          ]
          csvData.push(row.join(','))
        })
      }
    })

    const blob = new Blob([csvData.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `tokens_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">Visualização de Tokens</h1>
      
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tokens Gerados</CardTitle>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </CardHeader>
        <CardContent>
          <Card className="mb-4">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="filterCodigoToken">Código Token</Label>
                  <Input
                    id="filterCodigoToken"
                    placeholder="Buscar código..."
                    value={filterCodigoToken}
                    onChange={(e) => setFilterCodigoToken(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="filterCodigoLoja">Código/Loja</Label>
                  <Input
                    id="filterCodigoLoja"
                    placeholder="Buscar loja..."
                    value={filterCodigoLoja}
                    onChange={(e) => setFilterCodigoLoja(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="filterEstado">Estado</Label>
                  <Input
                    id="filterEstado"
                    placeholder="Buscar estado..."
                    value={filterEstado}
                    onChange={(e) => setFilterEstado(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="filterStatus">Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="aprovado">Aprovado</SelectItem>
                      <SelectItem value="rejeitado">Rejeitado</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="filterDataInicio">Data Início</Label>
                  <Input
                    id="filterDataInicio"
                    type="date"
                    value={filterDataInicio}
                    onChange={(e) => setFilterDataInicio(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="filterDataFim">Data Fim</Label>
                  <Input
                    id="filterDataFim"
                    type="date"
                    value={filterDataFim}
                    onChange={(e) => setFilterDataFim(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex justify-end mt-4">
                <Button onClick={clearFilters} variant="outline" size="sm">
                  <X className="w-4 h-4 mr-2" />
                  Limpar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código Token</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data Criação</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTokens.map((token) => (
                <TableRow key={token.id}>
                  <TableCell className="font-mono">{token.codigo_token}</TableCell>
                  <TableCell>{`${token.cadastro_loja.cod_loja} - ${token.cadastro_loja.loja} - ${token.cadastro_loja.estado}`}</TableCell>
                  <TableCell>{token.cadastro_loja.estado}</TableCell>
                  <TableCell>{getStatusBadge(token.st_aprovado)}</TableCell>
                  <TableCell>{formatDate(token.data_criacao!)}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(token)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Visualizar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              {selectedToken && tokenDetalhes.length > 0 && (
                <TokenDetailsCard
                  token={selectedToken}
                  tokenDetalhes={tokenDetalhes}
                  formatCurrency={formatCurrency}
                />
              )}
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}
