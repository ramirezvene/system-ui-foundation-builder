
import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ChartData {
  periodo: string
  total: number
  aprovado: number
  reprovado: number
}

export default function TokenChart() {
  const [data, setData] = useState<ChartData[]>([])
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear] = useState(new Date().getFullYear())

  useEffect(() => {
    fetchChartData()
  }, [selectedMonth, selectedYear])

  const fetchChartData = async () => {
    try {
      const startDate = new Date(selectedYear, selectedMonth - 1, 1)
      const endDate = new Date(selectedYear, selectedMonth, 0)
      
      // Buscar tokens usando data_criacao para o total
      const { data: tokensTotal, error: errorTotal } = await supabase
        .from("token_loja")
        .select("data_criacao")
        .gte("data_criacao", startDate.toISOString())
        .lte("data_criacao", endDate.toISOString())

      if (errorTotal) throw errorTotal

      // Buscar tokens aprovados/reprovados usando data_validacao
      const { data: tokensValidados, error: errorValidados } = await supabase
        .from("token_loja")
        .select("data_validacao, st_aprovado")
        .not("st_aprovado", "is", null)
        .not("data_validacao", "is", null)
        .gte("data_validacao", startDate.toISOString())
        .lte("data_validacao", endDate.toISOString())

      if (errorValidados) throw errorValidados

      // Criar períodos de 10 em 10 dias
      const periodos: { [key: string]: { total: number, aprovado: number, reprovado: number } } = {}
      const lastDay = endDate.getDate()
      
      // Definir períodos: 1-10, 11-20, 21+ (até o final do mês)
      const periodosLabels = [
        { label: "01-10", start: 1, end: 10 },
        { label: "11-20", start: 11, end: 20 },
        { label: `21-${lastDay}`, start: 21, end: lastDay }
      ]

      // Inicializar períodos
      periodosLabels.forEach(periodo => {
        periodos[periodo.label] = { total: 0, aprovado: 0, reprovado: 0 }
      })

      // Contar tokens totais por período usando data_criacao
      tokensTotal?.forEach(token => {
        const day = new Date(token.data_criacao!).getDate()
        const periodo = periodosLabels.find(p => day >= p.start && day <= p.end)
        if (periodo) {
          periodos[periodo.label].total++
        }
      })

      // Contar tokens aprovados/reprovados por período usando data_validacao
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

      // Converter para array para o gráfico
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

  const months = [
    { value: 1, label: "Janeiro" },
    { value: 2, label: "Fevereiro" },
    { value: 3, label: "Março" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Maio" },
    { value: 6, label: "Junho" },
    { value: 7, label: "Julho" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Setembro" },
    { value: 10, label: "Outubro" },
    { value: 11, label: "Novembro" },
    { value: 12, label: "Dezembro" }
  ]

  // Tooltip customizado para melhor visualização
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

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Relatório de Tokens por Período</CardTitle>
          <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
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
            <Bar dataKey="total" fill="#8884d8" name="Total" />
            <Bar dataKey="aprovado" fill="#82ca9d" name="Aprovados" />
            <Bar dataKey="reprovado" fill="#ffc658" name="Reprovados" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
