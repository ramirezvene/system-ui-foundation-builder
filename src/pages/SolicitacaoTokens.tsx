
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

interface TokenWithLoja extends TokenLoja {
  cadastro_loja: {
    loja: string
    estado: string
  }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const handleAprovarToken = () => {
    navigate("/aprovacao-token")
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">Solicitação de Tokens</h1>
      
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Tokens Pendentes</span>
            <Button onClick={handleAprovarToken}>
              Aprovar Tokens
            </Button>
          </CardTitle>
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
                <TableHead>Data Criação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTokens.map((token) => (
                <TableRow key={token.id}>
                  <TableCell>{token.id}</TableCell>
                  <TableCell className="font-mono">{token.codigo_token}</TableCell>
                  <TableCell>{token.cod_loja} - {token.cadastro_loja.loja}</TableCell>
                  <TableCell>{token.cadastro_loja.estado}</TableCell>
                  <TableCell>{formatDate(token.data_criacao!)}</TableCell>
                </TableRow>
              ))}
              {filteredTokens.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
