
import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface CupomDisponivel {
  cod_loja: number
  loja: string
  cupons_aprovados: number
  tokens_disponiveis: number
  cupons_restantes: number
}

export default function CuponsDisponiveis() {
  const [cuponsData, setCuponsData] = useState<CupomDisponivel[]>([])
  const [loading, setLoading] = useState(true)

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

      // Buscar cupons aprovados por loja
      const { data: cuponsAprovados, error: errorCupons } = await supabase
        .from("token_loja")
        .select("cod_loja, st_aprovado")
        .eq("st_aprovado", 1)

      if (errorCupons) throw errorCupons

      // Processar dados
      const cuponsDisponiveis: CupomDisponivel[] = lojas?.map(loja => {
        const cuponsAprovadosLoja = cuponsAprovados?.filter(
          cupom => cupom.cod_loja === loja.cod_loja
        ).length || 0

        const tokensDisponiveis = loja.qtde_token || 0
        const cuponsRestantes = Math.max(0, tokensDisponiveis - cuponsAprovadosLoja)

        return {
          cod_loja: loja.cod_loja,
          loja: loja.loja,
          cupons_aprovados: cuponsAprovadosLoja,
          tokens_disponiveis: tokensDisponiveis,
          cupons_restantes: cuponsRestantes
        }
      }) || []

      // Ordenar por cupons restantes (menor para maior para destacar lojas com poucos cupons)
      cuponsDisponiveis.sort((a, b) => a.cupons_restantes - b.cupons_restantes)
      
      setCuponsData(cuponsDisponiveis)
    } catch (error) {
      console.error("Erro ao buscar cupons disponíveis:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (cuponsRestantes: number) => {
    if (cuponsRestantes === 0) return "text-red-600 font-semibold"
    if (cuponsRestantes <= 5) return "text-orange-600 font-semibold"
    return "text-green-600"
  }

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
                <TableHead>Código</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead className="text-center">Cupons Aprovados</TableHead>
                <TableHead className="text-center">Tokens Disponíveis</TableHead>
                <TableHead className="text-center">Cupons Restantes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cuponsData.map((item) => (
                <TableRow key={item.cod_loja}>
                  <TableCell className="font-medium">{item.cod_loja}</TableCell>
                  <TableCell>{item.loja}</TableCell>
                  <TableCell className="text-center">{item.cupons_aprovados}</TableCell>
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
