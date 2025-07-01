
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Edit } from "lucide-react"

interface ConfigNCM {
  ncm: string
  aliqRs: string
  aliqSc: string
  aliqPr: string
  pisCofins: string
}

export default function ConfiguracaoNCM() {
  const [filtros, setFiltros] = useState("")
  const [filtro, setFiltro] = useState("")
  
  const [configsNCM] = useState<ConfigNCM[]>([
    {
      ncm: "3004.39.29",
      aliqRs: "17%",
      aliqSc: "22%",
      aliqPr: "17%",
      pisCofins: "0%"
    },
    {
      ncm: "3004.90.39",
      aliqRs: "0%",
      aliqSc: "25%",
      aliqPr: "17%",
      pisCofins: "9,25%"
    },
    {
      ncm: "3004.90.79",
      aliqRs: "17%",
      aliqSc: "25%",
      aliqPr: "0%",
      pisCofins: "0%"
    },
    {
      ncm: "3006.60.00",
      aliqRs: "0%",
      aliqSc: "25%",
      aliqPr: "22%",
      pisCofins: "9,25%"
    },
    {
      ncm: "3004.90.45",
      aliqRs: "0%",
      aliqSc: "19%",
      aliqPr: "0%",
      pisCofins: "0%"
    }
  ])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">
        Configuração NCM
      </h1>
      
      <div className="bg-card rounded-lg border p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Selecione Filtros"
              value={filtros}
              onChange={(e) => setFiltros(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <Input
              placeholder="Filtro"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>
          <Button className="bg-primary hover:bg-primary/90">
            FILTRAR
          </Button>
          <Button variant="outline">
            LIMPAR
          </Button>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>NCM</TableHead>
                <TableHead>Aliq RS</TableHead>
                <TableHead>Aliq SC</TableHead>
                <TableHead>Aliq PR</TableHead>
                <TableHead>PIS-COFINS</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {configsNCM.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.ncm}</TableCell>
                  <TableCell>{item.aliqRs}</TableCell>
                  <TableCell>{item.aliqSc}</TableCell>
                  <TableCell>{item.aliqPr}</TableCell>
                  <TableCell>{item.pisCofins}</TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="sm" disabled>
                      <Edit className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
          <span>1-5 de 5</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              &lt;
            </Button>
            <Button variant="outline" size="sm" disabled>
              &gt;
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
