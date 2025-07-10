
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { Tables } from "@/integrations/supabase/types"
import { useToast } from "@/hooks/use-toast"
import { useNavigate } from "react-router-dom"

type TokenLoja = Tables<"token_loja">
type TokenLojaDetalhado = Tables<"token_loja_detalhado">

interface TokenWithLoja extends TokenLoja {
  cadastro_loja: {
    loja: string
    estado: string
  }
  token_loja_detalhado: TokenLojaDetalhado[]
}

export default function SolicitacaoTokens() {
  const [tokens, setTokens] = useState<TokenWithLoja[]>([])
  const [filteredTokens, setFilteredTokens] = useState<TokenWithLoja[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()
  const navigate = useNavigate()

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
          ),
          token_loja_detalhado (
            *
          )
        `)
        .is("st_aprovado", null)
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

  const handleValidarToken = (token: TokenWithLoja) => {
    navigate("/aprovacao-token", { 
      state: { 
        tokenData: {
          id: token.id,
          codigo_token: token.codigo_token,
          cod_loja: token.cod_loja,
          loja_nome: token.cadastro_loja.loja,
          loja_estado: token.cadastro_loja.estado,
          produto: token.token_loja_detalhado[0]?.produto || "",
          quantidade: token.token_loja_detalhado[0]?.qtde_solic || 1,
          valor_solicitado: token.token_loja_detalhado[0]?.vlr_solic || 0
        }
      }
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const getProdutoInfo = (token: TokenWithLoja) => {
    if (token.token_loja_detalhado && token.token_loja_detalhado.length > 0) {
      return token.token_loja_detalhado[0].produto || "N/A"
    }
    return "N/A"
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">Solicitação de Tokens</h1>
      
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Tokens Pendentes</CardTitle>
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
                <TableHead>ID</TableHead>
                <TableHead>Código Token</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Data Criação</TableHead>
                <TableHead>Validação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTokens.map((token) => (
                <TableRow key={token.id}>
                  <TableCell>{token.id}</TableCell>
                  <TableCell className="font-mono">{token.codigo_token}</TableCell>
                  <TableCell>{token.cod_loja} - {token.cadastro_loja.loja}</TableCell>
                  <TableCell>{token.cadastro_loja.estado}</TableCell>
                  <TableCell>{getProdutoInfo(token)}</TableCell>
                  <TableCell>{formatDate(token.data_criacao!)}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleValidarToken(token)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Validar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredTokens.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum token pendente encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
