
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/integrations/supabase/client"

interface CupomData {
  loja: string
  cod_loja: number
  tokens_aprovados: number
  tokens_pendentes: number
  tokens_reprovados: number
  valor_total: number
}

interface CuponsDisponiveisProps {
  selectedMonth: number
  selectedYear: number
}

export default function CuponsDisponiveis({ selectedMonth, selectedYear }: CuponsDisponiveisProps) {
  const [cupons, setCupons] = useState<CupomData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCuponsData()
  }, [selectedMonth, selectedYear])

  const fetchCuponsData = async () => {
    try {
      setLoading(true)
      const startDate = new Date(selectedYear, selectedMonth - 1, 1)
      const endDate = new Date(selectedYear, selectedMonth, 0)

      const { data: tokens, error } = await supabase
        .from("token_loja")
        .select(`
          cod_loja,
          st_aprovado,
          data_criacao,
          cadastro_loja(loja),
          token_loja_detalhado(vlr_solic, qtde_solic)
        `)
        .gte("data_criacao", startDate.toISOString())
        .lte("data_criacao", endDate.toISOString())

      if (error) throw error

      // Processar dados por loja
      const lojaStats: { [key: number]: CupomData } = {}

      tokens?.forEach(token => {
        const lojaInfo = token.cadastro_loja as any
        
        if (!lojaStats[token.cod_loja]) {
          lojaStats[token.cod_loja] = {
            cod_loja: token.cod_loja,
            loja: lojaInfo?.loja || `Loja ${token.cod_loja}`,
            tokens_aprovados: 0,
            tokens_pendentes: 0,
            tokens_reprovados: 0,
            valor_total: 0
          }
        }

        // Contar tokens por status
        if (token.st_aprovado === 1) {
          lojaStats[token.cod_loja].tokens_aprovados++
        } else if (token.st_aprovado === 0) {
          lojaStats[token.cod_loja].tokens_reprovados++
        } else {
          lojaStats[token.cod_loja].tokens_pendentes++
        }

        // Calcular valor total
        const detalhes = token.token_loja_detalhado as any[]
        detalhes?.forEach(detalhe => {
          const valor = (detalhe.vlr_solic || 0) * (detalhe.qtde_solic || 1)
          lojaStats[token.cod_loja].valor_total += valor
        })
      })

      // Converter para array e ordenar por valor total
      const cuponsArray = Object.values(lojaStats)
        .sort((a, b) => b.valor_total - a.valor_total)

      setCupons(cuponsArray)
    } catch (error) {
      console.error("Erro ao buscar dados dos cupons:", error)
    } finally {
      setLoading(false)
    }
  }

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ]

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Resumo por Loja - {months[selectedMonth - 1]} {selectedYear}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Carregando...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Resumo por Loja - {months[selectedMonth - 1]} {selectedYear}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cupons.map((cupom) => (
            <Card key={cupom.cod_loja} className="border-l-4 border-l-primary">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{cupom.loja}</h3>
                    <p className="text-sm text-muted-foreground">Código: {cupom.cod_loja}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">
                      R$ {cupom.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground">Valor Total</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Aprovados: {cupom.tokens_aprovados}
                  </Badge>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    Pendentes: {cupom.tokens_pendentes}
                  </Badge>
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    Reprovados: {cupom.tokens_reprovados}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {cupons.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum dado encontrado para o período selecionado.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
