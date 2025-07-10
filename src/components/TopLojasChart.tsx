
import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TopLojaData {
  loja: string
  solicitacoes: number
  valorTotal: number
}

interface TopLojasChartProps {
  selectedMonth: number
  selectedYear: number
}

export default function TopLojasChart({ selectedMonth, selectedYear }: TopLojasChartProps) {
  const [data, setData] = useState<TopLojaData[]>([])

  useEffect(() => {
    fetchTopLojasData()
  }, [selectedMonth, selectedYear])

  const fetchTopLojasData = async () => {
    try {
      const startDate = new Date(selectedYear, selectedMonth - 1, 1)
      const endDate = new Date(selectedYear, selectedMonth, 0)
      
      // Buscar tokens e detalhes
      const { data: tokens, error } = await supabase
        .from("token_loja")
        .select(`
          id,
          cod_loja,
          cadastro_loja(loja),
          token_loja_detalhado(vlr_solic, qtde_solic)
        `)
        .gte("data_criacao", startDate.toISOString())
        .lte("data_criacao", endDate.toISOString())

      if (error) throw error

      // Processar dados por loja
      const lojaStats: { [key: string]: { solicitacoes: number, valorTotal: number } } = {}
      
      tokens?.forEach(token => {
        const lojaInfo = token.cadastro_loja as any
        const lojaName = lojaInfo?.loja || `Loja ${token.cod_loja}`
        
        if (!lojaStats[lojaName]) {
          lojaStats[lojaName] = { solicitacoes: 0, valorTotal: 0 }
        }
        
        lojaStats[lojaName].solicitacoes++
        
        // Somar valores dos detalhes
        const detalhes = token.token_loja_detalhado as any[]
        detalhes?.forEach(detalhe => {
          const valor = (detalhe.vlr_solic || 0) * (detalhe.qtde_solic || 1)
          lojaStats[lojaName].valorTotal += valor
        })
      })

      // Converter para array e pegar top 3
      const sortedLojas = Object.entries(lojaStats)
        .map(([loja, stats]) => ({
          loja,
          solicitacoes: stats.solicitacoes,
          valorTotal: stats.valorTotal
        }))
        .sort((a, b) => b.solicitacoes - a.solicitacoes)
        .slice(0, 3)

      setData(sortedLojas)
    } catch (error) {
      console.error("Erro ao buscar dados das top lojas:", error)
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-blue-600">
            Solicitações: {data.solicitacoes}
          </p>
          <p className="text-sm text-green-600">
            Valor Total: R$ {data.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Top 3 Lojas - Solicitações</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="loja" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="solicitacoes" fill="#044565" name="Solicitações" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
