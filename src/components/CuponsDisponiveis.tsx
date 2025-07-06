
import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronUp, ChevronDown } from "lucide-react"

interface CupomDisponivel {
  cod_loja: number
  loja: string
  cupons_aprovados: number
  cupons_reprovados: number
  tokens_disponiveis: number
  cupons_restantes: number
}

type SortKey = keyof CupomDisponivel
type SortDirection = 'asc' | 'desc'

export default function CuponsDisponiveis() {
  const [cuponsData, setCuponsData] = useState<CupomDisponivel[]>([])
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('cod_loja')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  useEffect(() => {
    fetchCuponsDisponiveis()
  }, [])

  const fetchCuponsDisponiveis = async () => {
    try {
      setLoading(true)
      
      // Buscar dados das lojas
      const { data: lojas, error: errorLojas } = await supabase
        .from("cadastro_loja")
        .select("cod_loja, loja, qtde_token")

      if (errorLojas) throw errorLojas

      // Buscar todos os cupons por loja
      const { data: cupons, error: errorCupons } = await supabase
        .from("token_loja")
        .select("cod_loja, st_aprovado")

      if (errorCupons) throw errorCupons

      // Processar dados
      const cuponsDisponiveis: CupomDisponivel[] = lojas?.map(loja => {
        const cuponsLoja = cupons?.filter(cupom => cupom.cod_loja === loja.cod_loja) || []
        
        const cuponsAprovados = cuponsLoja.filter(cupom => cupom.st_aprovado === 1).length
        const cuponsReprovados = cuponsLoja.filter(cupom => cupom.st_aprovado === 0).length

        const tokensDisponiveis = loja.qtde_token || 0
        const cuponsRestantes = Math.max(0, tokensDisponiveis - cuponsAprovados)

        return {
          cod_loja: loja.cod_loja,
          loja: loja.loja,
          cupons_aprovados: cuponsAprovados,
          cupons_reprovados: cuponsReprovados,
          tokens_disponiveis: tokensDisponiveis,
          cupons_restantes: cuponsRestantes
        }
      }) || []

      setCuponsData(cuponsDisponiveis)
    } catch (error) {
      console.error("Erro ao buscar cupons disponíveis:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const sortedData = [...cuponsData].sort((a, b) => {
    const aValue = a[sortKey]
    const bValue = b[sortKey]
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue)
      return sortDirection === 'asc' ? comparison : -comparison
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
    }
    
    return 0
  })

  const getStatusColor = (cuponsRestantes: number) => {
    if (cuponsRestantes === 0) return "text-red-600 font-semibold"
    if (cuponsRestantes <= 5) return "text-orange-600 font-semibold"
    return "text-green-600"
  }

  const SortableHeader = ({ sortKey: key, children }: { sortKey: SortKey, children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-gray-50 select-none"
      onClick={() => handleSort(key)}
    >
      <div className="flex items-center justify-between">
        {children}
        <div className="flex flex-col ml-1">
          <ChevronUp 
            className={`h-3 w-3 ${sortKey === key && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} 
          />
          <ChevronDown 
            className={`h-3 w-3 -mt-1 ${sortKey === key && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} 
          />
        </div>
      </div>
    </TableHead>
  )

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Cupons Disponíveis por Loja</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <div className="text-muted-foreground">Carregando...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Cupons Disponíveis por Loja</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader sortKey="cod_loja">Código</SortableHeader>
                <SortableHeader sortKey="loja">Loja</SortableHeader>
                <SortableHeader sortKey="cupons_aprovados">
                  <div className="text-center">Cupons Aprovados</div>
                </SortableHeader>
                <SortableHeader sortKey="cupons_reprovados">
                  <div className="text-center">Cupons Reprovados</div>
                </SortableHeader>
                <SortableHeader sortKey="tokens_disponiveis">
                  <div className="text-center">Tokens Disponíveis</div>
                </SortableHeader>
                <SortableHeader sortKey="cupons_restantes">
                  <div className="text-center">Cupons Restantes</div>
                </SortableHeader>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((item) => (
                <TableRow key={item.cod_loja}>
                  <TableCell className="font-medium">{item.cod_loja}</TableCell>
                  <TableCell>{item.loja}</TableCell>
                  <TableCell className="text-center">{item.cupons_aprovados}</TableCell>
                  <TableCell className="text-center">{item.cupons_reprovados}</TableCell>
                  <TableCell className="text-center">{item.tokens_disponiveis}</TableCell>
                  <TableCell className={`text-center ${getStatusColor(item.cupons_restantes)}`}>
                    {item.cupons_restantes}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {cuponsData.length === 0 && (
          <div className="text-center text-muted-foreground py-4">
            Nenhum dado encontrado
          </div>
        )}
      </CardContent>
    </Card>
  )
}
