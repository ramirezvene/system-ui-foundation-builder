
import TokenChart from "@/components/TokenChart"
import CuponsDisponiveis from "@/components/CuponsDisponiveis"

export default function Relatorios() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">Relatórios</h1>
      
      <div className="grid gap-6">
        <TokenChart />
        <CuponsDisponiveis />
      </div>
    </div>
  )
}
