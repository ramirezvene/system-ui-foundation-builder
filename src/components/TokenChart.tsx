
import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ChartData {
  day: string
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
      
      const { data: tokens, error } = await supabase
        .from("token_loja")
        .select("data_criacao, st_aprovado")
        .gte("data_criacao", startDate.toISOString())
        .lte("data_criacao", endDate.toISOString())

      if (error) throw error

      // Processar dados por dia
      const dailyData: { [key: string]: { total: number, aprovado: number, reprovado: number } } = {}
      
      // Inicializar todos os dias do mês
      for (let day = 1; day <= endDate.getDate(); day++) {
        const dayKey = day.toString().padStart(2, '0')
        dailyData[dayKey] = { total: 0, aprovado: 0, reprovado: 0 }
      }

      // Contar tokens por dia
      tokens?.forEach(token => {
        const day = new Date(token.data_criacao!).getDate().toString().padStart(2, '0')
        dailyData[day].total++
        if (token.st_aprovado === 1) {
          dailyData[day].aprovado++
        } else {
          dailyData[day].reprovado++
        }
      })

      // Converter para array
      const chartData: ChartData[] = Object.entries(dailyData).map(([day, counts]) => ({
        day,
        total: counts.total,
        aprovado: counts.aprovado,
        reprovado: counts.reprovado
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

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Relatório de Tokens</CardTitle>
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
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" label={{ value: 'Dia', position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: 'Quantidade', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
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
