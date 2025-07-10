
import TokenChart from "@/components/TokenChart"
import TopLojasChart from "@/components/TopLojasChart"
import TokenStatusChart from "@/components/TokenStatusChart"
import CuponsDisponiveis from "@/components/CuponsDisponiveis"
import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tables } from "@/integrations/supabase/types"

type Loja = Tables<"cadastro_loja">

export default function Relatorios() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [lojasFiltradas, setLojasFiltradas] = useState<Loja[]>([])

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

  const years = [2023, 2024, 2025, 2026]

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
        
        <div className="flex gap-4">
          <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <TokenChart 
              selectedMonth={selectedMonth} 
              selectedYear={selectedYear}
              lojasFiltradas={lojasFiltradas}
            />
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
              lojasFiltradas={lojasFiltradas}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1">
          <CuponsDisponiveis 
            selectedMonth={selectedMonth} 
            selectedYear={selectedYear}
            onLojasFiltradas={setLojasFiltradas}
          />
        </div>
      </div>
    </div>
  )
}
