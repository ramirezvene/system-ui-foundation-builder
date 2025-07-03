
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { Tables } from "@/integrations/supabase/types"
import { useToast } from "@/hooks/use-toast"

type TokenLoja = Tables<"token_loja">
type TokenLojaDetalhado = Tables<"token_loja_detalhado">

interface TokenWithLoja extends TokenLoja {
  cadastro_loja: {
    loja: string
    estado: string
  }
}

export default function VisualizacaoTokens() {
  const [tokens, setTokens] = useState<TokenWithLoja[]>([])
  const [filteredTokens, setFilteredTokens] = useState<TokenWithLoja[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedToken, setSelectedToken] = useState<TokenWithLoja | null>(null)
  const [tokenDetalhes, setTokenDetalhes] = useState<TokenLojaDetalhado[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchTokens()
  }, [])

  useEffect(() => {
    const filtered = tokens.filter(token =>
      token.codigo_token.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.cadastro_loja.loja.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.cadastro_loja.estado.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredTokens(filtered)
  }, [tokens, searchTerm])

  const fetchTokens = async () => {
    try {
      const { data, error } = await supabase
        .from("token_loja")
        .select(`
          *,
          cadastro_loja (
            loja,
            estado
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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">Visualização de Tokens</h1>
      
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Tokens Gerados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Pesquisar por código, loja ou estado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código Token</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Data Criação</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTokens.map((token) => (
                <TableRow key={token.id}>
                  <TableCell className="font-mono">{token.codigo_token}</TableCell>
                  <TableCell>{token.cadastro_loja.loja}</TableCell>
                  <TableCell>{token.cadastro_loja.estado}</TableCell>
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
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  Detalhes do Token: {selectedToken?.codigo_token}
                </DialogTitle>
              </DialogHeader>
              
              {selectedToken && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                    <div>
                      <strong>Loja:</strong> {selectedToken.cadastro_loja.loja}
                    </div>
                    <div>
                      <strong>Estado:</strong> {selectedToken.cadastro_loja.estado}
                    </div>
                    <div>
                      <strong>Data:</strong> {formatDate(selectedToken.data_criacao!)}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead>Qtde</TableHead>
                          <TableHead>Vlr Solicitado</TableHead>
                          <TableHead>Preço Mín</TableHead>
                          <TableHead>CMG</TableHead>
                          <TableHead>Preço Reg</TableHead>
                          <TableHead>% Desc</TableHead>
                          <TableHead>Alçada</TableHead>
                          <TableHead>Margem UF</TableHead>
                          <TableHead>Margem ZVDC</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tokenDetalhes.map((detalhe) => (
                          <TableRow key={detalhe.id}>
                            <TableCell>{detalhe.produto}</TableCell>
                            <TableCell>{detalhe.qtde_solic}</TableCell>
                            <TableCell>{formatCurrency(detalhe.vlr_solic)}</TableCell>
                            <TableCell>{formatCurrency(detalhe.preco_min)}</TableCell>
                            <TableCell>{formatCurrency(detalhe.cmg_produto)}</TableCell>
                            <TableCell>{formatCurrency(detalhe.preco_regul)}</TableCell>
                            <TableCell>{detalhe.desconto}</TableCell>
                            <TableCell>{detalhe.desc_alcada}</TableCell>
                            <TableCell>{detalhe.margem_uf}</TableCell>
                            <TableCell>{detalhe.margem_zvdc}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {tokenDetalhes.length > 0 && tokenDetalhes[0].observacao && (
                    <div className="p-4 bg-muted rounded-lg">
                      <strong>Observação:</strong> {tokenDetalhes[0].observacao}
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}
