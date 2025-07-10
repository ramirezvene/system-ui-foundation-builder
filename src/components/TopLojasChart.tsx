
import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TopLojaData {
  loja: string
  aprovados: number
  reprovados: number
  valorAprovado: number
  valorReprovado: number
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
      
      const { data: tokens, error } = await supabase
        .from("token_loja")
        .select(`
          id,
          cod_loja,
          st_aprovado,
          cadastro_loja(loja),
          token_loja_detalhado(vlr_solic, qtde_solic)
        `)
        .gte("data_criacao", startDate.toISOString())
        .lte("data_criacao", endDate.toISOString())

      if (error) throw error

      const lojaStats: { [key: string]: { aprovados: number, reprovados: number, valorAprovado: number, valorReprovado: number } } = {}
      
      tokens?.forEach(token => {
        const lojaInfo = token.cadastro_loja as any
        const lojaName = lojaInfo?.loja || `Loja ${token.cod_loja}`
        
        if (!lojaStats[lojaName]) {
          lojaStats[lojaName] = { aprovados: 0, reprovados: 0, valorAprovado: 0, valorReprovado: 0 }
        }
        
        const detalhes = token.token_loja_detalhado as any[]
        let valorToken = 0
        detalhes?.forEach(detalhe => {
          valorToken += (detalhe.vlr_solic || 0) * (detalhe.qtde_solic || 1)
        })
        
        if (token.st_aprovado === 1) {
          lojaStats[lojaName].aprovados++
          lojaStats[lojaName].valorAprovado += valorToken
        } else if (token.st_aprovado === 0) {
          lojaStats[lojaName].reprovados++
          lojaStats[lojaName].valorReprovado += valorToken
        }
      })

      const sortedLojas = Object.entries(lojaStats)
        .map(([loja, stats]) => ({
          loja,
          aprovados: stats.aprovados,
          reprovados: stats.reprovados,
          valorAprovado: stats.valorAprovado,
          valorReprovado: stats.valorReprovado
        }))
        .sort((a, b) => (b.aprovados + b.reprovados) - (a.aprovados + a.reprovados))
        .slice(0, 3)

      setData(sortedLojas)
    } catch (error) {
      console.error("Erro ao buscar dados das top lojas:", error)
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const aprovados = payload.find((p: any) => p.dataKey === 'aprovados')?.value || 0
      const reprovados = payload.find((p: any) => p.dataKey === 'reprovados')?.value || 0
      const valorAprovado = payload[0]?.payload?.valorAprovado || 0
      const valorReprovado = payload[0]?.payload?.valorReprovado || 0
      
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-green-600">
            Aprovados: {aprovados} (R$ {valorAprovado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
          </p>
          <p className="text-sm text-red-600">
            Reprovados: {reprovados} (R$ {valorReprovado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
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
            <Legend />
            <Bar dataKey="aprovados" stackId="a" fill="#22c55e" name="Aprovados" />
            <Bar dataKey="reprovados" stackId="a" fill="#ef4444" name="Reprovados" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
