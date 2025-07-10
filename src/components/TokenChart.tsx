
import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ChartData {
  periodo: string
  total: number
  aprovado: number
  reprovado: number
}

interface TokenChartProps {
  selectedMonth: number
  selectedYear: number
}

export default function TokenChart({ selectedMonth, selectedYear }: TokenChartProps) {
  const [data, setData] = useState<ChartData[]>([])

  useEffect(() => {
    fetchChartData()
  }, [selectedMonth, selectedYear])

  const fetchChartData = async () => {
    try {
      const startDate = new Date(selectedYear, selectedMonth - 1, 1)
      const endDate = new Date(selectedYear, selectedMonth, 0)
      
      const { data: tokensTotal, error: errorTotal } = await supabase
        .from("token_loja")
        .select("data_criacao")
        .gte("data_criacao", startDate.toISOString())
        .lte("data_criacao", endDate.toISOString())

      if (errorTotal) throw errorTotal

      const { data: tokensValidados, error: errorValidados } = await supabase
        .from("token_loja")
        .select("data_validacao, st_aprovado")
        .not("st_aprovado", "is", null)
        .not("data_validacao", "is", null)
        .gte("data_validacao", startDate.toISOString())
        .lte("data_validacao", endDate.toISOString())

      if (errorValidados) throw errorValidados

      const periodos: { [key: string]: { total: number, aprovado: number, reprovado: number } } = {}
      const lastDay = endDate.getDate()
      
      const periodosLabels = [
        { label: "01-10", start: 1, end: 10 },
        { label: "11-20", start: 11, end: 20 },
        { label: `21-${lastDay}`, start: 21, end: lastDay }
      ]

      periodosLabels.forEach(periodo => {
        periodos[periodo.label] = { total: 0, aprovado: 0, reprovado: 0 }
      })

      tokensTotal?.forEach(token => {
        const day = new Date(token.data_criacao!).getDate()
        const periodo = periodosLabels.find(p => day >= p.start && day <= p.end)
        if (periodo) {
          periodos[periodo.label].total++
        }
      })

      tokensValidados?.forEach(token => {
        const day = new Date(token.data_validacao!).getDate()
        const periodo = periodosLabels.find(p => day >= p.start && day <= p.end)
        if (periodo) {
          if (token.st_aprovado === 1) {
            periodos[periodo.label].aprovado++
          } else if (token.st_aprovado === 0) {
            periodos[periodo.label].reprovado++
          }
        }
      })

      const chartData: ChartData[] = periodosLabels.map(periodo => ({
        periodo: periodo.label,
        total: periodos[periodo.label].total,
        aprovado: periodos[periodo.label].aprovado,
        reprovado: periodos[periodo.label].reprovado
      }))

      setData(chartData)
    } catch (error) {
      console.error("Erro ao buscar dados do gráfico:", error)
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-medium">{`Período ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ]

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">
          Tokens por Período - {months[selectedMonth - 1]} {selectedYear}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="periodo" 
              label={{ value: 'Período', position: 'insideBottom', offset: -5 }}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              label={{ value: 'Quantidade', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="total" fill="#044565" name="Total" />
            <Bar dataKey="aprovado" fill="#14c400" name="Aprovados" />
            <Bar dataKey="reprovado" fill="#fc2a0a" name="Reprovados" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
