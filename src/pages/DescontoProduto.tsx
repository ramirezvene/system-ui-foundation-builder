
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Upload, Plus } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { Tables } from "@/integrations/supabase/types"
import { useToast } from "@/hooks/use-toast"

type ProdutoMargem = Tables<"produto_margem">
type Produto = Tables<"cadastro_produto">
type Estado = Tables<"cadastro_estado">
type Loja = Tables<"cadastro_loja">

interface ProdutoMargemExtended extends ProdutoMargem {
  produto?: Produto
  referencia_nome?: string
}

export default function DescontoProduto() {
  const [produtoMargens, setProdutoMargens] = useState<ProdutoMargemExtended[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [estados, setEstados] = useState<Estado[]>([])
  const [lojas, setLojas] = useState<Loja[]>([])
  const [editedRows, setEditedRows] = useState<Set<number>>(new Set())
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Buscar produtos margem
      const { data: margemData, error: margemError } = await supabase
        .from("produto_margem")
        .select("*")
        .order("id")
      
      if (margemError) throw margemError

      // Buscar produtos
      const { data: produtosData, error: produtosError } = await supabase
        .from("cadastro_produto")
        .select("*")
        .order("nome_produto")
      
      if (produtosError) throw produtosError

      // Buscar estados
      const { data: estadosData, error: estadosError } = await supabase
        .from("cadastro_estado")
        .select("*")
        .order("nome_estado")
      
      if (estadosError) throw estadosError

      // Buscar lojas
      const { data: lojasData, error: lojasError } = await supabase
        .from("cadastro_loja")
        .select("*")
        .order("loja")
      
      if (lojasError) throw lojasError

      // Combinar dados
      const margemExtended = (margemData || []).map(margem => {
        const produto = produtosData?.find(p => p.id_produto === margem.id_produto)
        let referencia_nome = ""
        
        if (margem.tipo_aplicacao === "estado") {
          const estado = estadosData?.find(e => e.id === margem.codigo_referencia)
          referencia_nome = estado?.estado || ""
        } else {
          const loja = lojasData?.find(l => l.cod_loja === margem.codigo_referencia)
          referencia_nome = loja ? `${loja.cod_loja} - ${loja.loja} - ${loja.estado}` : ""
        }

        return {
          ...margem,
          produto,
          referencia_nome
        }
      })

      setProdutoMargens(margemExtended)
      setProdutos(produtosData || [])
      setEstados(estadosData || [])
      setLojas(lojasData || [])
    } catch (error) {
      console.error("Erro ao buscar dados:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive"
      })
    }
  }

  const handleFieldChange = (id: number, field: keyof ProdutoMargem, value: any) => {
    setProdutoMargens(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
    setEditedRows(prev => new Set(prev).add(id))
  }

  const handleSave = async (id: number) => {
    const item = produtoMargens.find(p => p.id === id)
    if (!item) return

    try {
      const { error } = await supabase
        .from("produto_margem")
        .update({
          margem: item.margem,
          data_inicio: item.data_inicio,
          data_fim: item.data_fim,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)

      if (error) throw error

      setEditedRows(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })

      toast({
        title: "Sucesso",
        description: "Registro salvo com sucesso"
      })
    } catch (error) {
      console.error("Erro ao salvar:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar registro",
        variant: "destructive"
      })
    }
  }

  const handleExportCSV = () => {
    const csvContent = [
      ["Produto", "Tipo Aplicação", "Referência", "Margem", "Data Início", "Data Fim"],
      ...produtoMargens.map(item => [
        item.produto?.nome_produto || "",
        item.tipo_aplicacao,
        item.referencia_nome || "",
        item.margem,
        item.data_inicio,
        item.data_fim
      ])
    ].map(row => row.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "desconto_produtos.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Desconto Produto
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Importar CSV
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Produto</th>
                  <th className="text-left p-2">Tipo Aplicação</th>
                  <th className="text-left p-2">Referência</th>
                  <th className="text-left p-2">Margem (%)</th>
                  <th className="text-left p-2">Data Início</th>
                  <th className="text-left p-2">Data Fim</th>
                  <th className="text-left p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {produtoMargens.map((item) => (
                  <tr key={item.id} className={`border-b ${editedRows.has(item.id) ? 'bg-yellow-50' : ''}`}>
                    <td className="p-2">{item.produto?.nome_produto}</td>
                    <td className="p-2">{item.tipo_aplicacao}</td>
                    <td className="p-2">{item.referencia_nome}</td>
                    <td className="p-2">
                      <Input
                        type="number"
                        step="0.01"
                        value={item.margem}
                        onChange={(e) => handleFieldChange(item.id, 'margem', parseFloat(e.target.value) || 0)}
                        className="w-20"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="date"
                        value={item.data_inicio}
                        onChange={(e) => handleFieldChange(item.id, 'data_inicio', e.target.value)}
                        className="w-32"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="date"
                        value={item.data_fim}
                        onChange={(e) => handleFieldChange(item.id, 'data_fim', e.target.value)}
                        className="w-32"
                      />
                    </td>
                    <td className="p-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleSave(item.id)}
                        disabled={!editedRows.has(item.id)}
                      >
                        Salvar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
