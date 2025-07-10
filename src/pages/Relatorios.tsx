
import TokenChart from "@/components/TokenChart"
import TopLojasChart from "@/components/TopLojasChart"
import TokenStatusChart from "@/components/TokenStatusChart"
import CuponsDisponiveis from "@/components/CuponsDisponiveis"
import { useState } from "react"

export default function Relatorios() {
  const [selectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear] = useState(new Date().getFullYear())

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-foreground mb-6">Relatórios</h1>
      
      <div className="grid gap-6">
        {/* Linha principal com gráfico de tokens */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <TokenChart />
          </div>
          <div className="lg:col-span-1">
            <TopLojasChart 
              selectedMonth={selectedMonth} 
              selectedYear={selectedYear} 
            />
          </div>
          <div className="lg:col-span-1">
            <TokenStatusChart 
              selectedMonth={selectedMonth} 
              selectedYear={selectedYear} 
            />
          </div>
        </div>
        
        {/* Segunda linha com cupons disponíveis */}
        <div className="grid grid-cols-1">
          <CuponsDisponiveis />
        </div>
      </div>
    </div>
  )
}
