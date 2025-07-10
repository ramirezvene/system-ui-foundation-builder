
import { useState, useEffect } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StatusData {
  name: string
  value: number
  valorTotal: number
  color: string
}

interface TokenStatusChartProps {
  selectedMonth: number
  selectedYear: number
}

export default function TokenStatusChart({ selectedMonth, selectedYear }: TokenStatusChartProps) {
  const [data, setData] = useState<StatusData[]>([])
  const [totalValue, setTotalValue] = useState(0)

  useEffect(() => {
    fetchStatusData()
  }, [selectedMonth, selectedYear])

  const fetchStatusData = async () => {
    try {
      const startDate = new Date(selectedYear, selectedMonth - 1, 1)
      const endDate = new Date(selectedYear, selectedMonth, 0)
      
      const { data: tokens, error } = await supabase
        .from("token_loja")
        .select(`
          st_aprovado,
          token_loja_detalhado(vlr_solic, qtde_solic)
        `)
        .gte("data_criacao", startDate.toISOString())
        .lte("data_criacao", endDate.toISOString())

      if (error) throw error

      let aprovados = 0, reprovados = 0, pendentes = 0
      let valorAprovado = 0, valorReprovado = 0, valorPendente = 0

      tokens?.forEach(token => {
        const detalhes = token.token_loja_detalhado as any[]
        let valorToken = 0
        
        detalhes?.forEach(detalhe => {
          valorToken += (detalhe.vlr_solic || 0) * (detalhe.qtde_solic || 1)
        })

        if (token.st_aprovado === 1) {
          aprovados++
          valorAprovado += valorToken
        } else if (token.st_aprovado === 0) {
          reprovados++
          valorReprovado += valorToken
        } else {
          pendentes++
          valorPendente += valorToken
        }
      })

      const total = valorAprovado + valorReprovado + valorPendente
      setTotalValue(total)

      const chartData: StatusData[] = []
      
      if (aprovados > 0) {
        chartData.push({
          name: 'Aprovados',
          value: aprovados,
          valorTotal: valorAprovado,
          color: '#22c55e'
        })
      }
      
      if (pendentes > 0) {
        chartData.push({
          name: 'Pendentes',
          value: pendentes,
          valorTotal: valorPendente,
          color: '#64748b'
        })
      }
      
      if (reprovados > 0) {
        chartData.push({
          name: 'Reprovados',
          value: reprovados,
          valorTotal: valorReprovado,
          color: '#ef4444'
        })
      }

      setData(chartData)
    } catch (error) {
      console.error("Erro ao buscar dados de status:", error)
    }
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const percentage = totalValue > 0 ? ((data.valorTotal / totalValue) * 100).toFixed(1) : '0'
      
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">Quantidade: {data.value}</p>
          <p className="text-sm">Valor: R$ {data.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="text-sm">Percentual: {percentage}%</p>
        </div>
      )
    }
    return null
  }

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle className="text-lg">Status dos Tokens</CardTitle>
        <p className="text-sm text-muted-foreground">
          Valor Total: R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      </CardHeader>
      <CardContent className="flex-1">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={CustomLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value, entry: any) => 
                `${value}: ${entry.payload.value} (R$ ${entry.payload.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`
              }
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
