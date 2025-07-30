import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { supabase } from "@/integrations/supabase/client"

interface TopProdutosChartProps {
  selectedMonth: number
  selectedYear: number
}

interface ProdutoData {
  nome: string
  solicitacoes: number
  valorTotal: number
}

export default function TopProdutosChart({ selectedMonth, selectedYear }: TopProdutosChartProps) {
  const [data, setData] = useState<ProdutoData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTopProdutos()
  }, [selectedMonth, selectedYear])

  const fetchTopProdutos = async () => {
    setIsLoading(true)
    try {
      // Buscar dados dos tokens por produto para o período selecionado
      const startDate = new Date(selectedYear, selectedMonth - 1, 1)
      const endDate = new Date(selectedYear, selectedMonth, 0)

      const { data: tokensData, error } = await supabase
        .from("token_loja_detalhado")
        .select(`
          produto,
          qtde_solic,
          vlr_solic,
          codigo_token,
          token_loja!inner(data_criacao)
        `)

      if (error) throw error

      // Filtrar por período e agrupar por produto
      const produtoStats = (tokensData || [])
        .filter(item => {
          if (!item.token_loja?.data_criacao) return false
          const tokenDate = new Date(item.token_loja.data_criacao)
          return tokenDate >= startDate && tokenDate <= endDate
        })
        .reduce((acc, item) => {
          const produto = item.produto || 'Produto não informado'
          if (!acc[produto]) {
            acc[produto] = {
              nome: produto,
              solicitacoes: 0,
              valorTotal: 0
            }
          }
          acc[produto].solicitacoes += item.qtde_solic || 0
          acc[produto].valorTotal += item.vlr_solic || 0
          return acc
        }, {} as Record<string, ProdutoData>)

      // Pegar top 3 produtos por quantidade de solicitações
      const topProdutos = Object.values(produtoStats)
        .sort((a, b) => b.solicitacoes - a.solicitacoes)
        .slice(0, 3)
        .map(produto => ({
          ...produto,
          nome: produto.nome.length > 20 ? produto.nome.substring(0, 20) + '...' : produto.nome
        }))

      setData(topProdutos)
    } catch (error) {
      console.error("Erro ao buscar top produtos:", error)
      setData([])
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">
          Top 3 Produtos - Solicitações
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-sm text-muted-foreground">Carregando...</div>
          </div>
        ) : data.length > 0 ? (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="nome" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'solicitacoes' ? `${value} solicitações` : formatCurrency(Number(value)),
                    name === 'solicitacoes' ? 'Solicitações' : 'Valor Total'
                  ]}
                />
                <Bar dataKey="solicitacoes" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
            
            <div className="space-y-2">
              {data.map((produto, index) => (
                <div key={produto.nome} className="flex justify-between items-center text-sm">
                  <span className="font-medium">
                    {index + 1}º. {produto.nome}
                  </span>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">
                      {produto.solicitacoes} sol.
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {formatCurrency(produto.valorTotal)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-sm text-muted-foreground">
              Nenhum dado encontrado para o período selecionado
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}