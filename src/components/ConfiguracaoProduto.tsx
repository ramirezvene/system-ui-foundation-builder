
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Download, Upload } from "lucide-react"
import { ProdutoCombobox } from "@/components/ProdutoCombobox"
import { supabase } from "@/integrations/supabase/client"
import { Tables } from "@/integrations/supabase/types"
import { useToast } from "@/hooks/use-toast"

type Produto = Tables<"cadastro_produto">
type Estado = Tables<"cadastro_estado">
type Loja = Tables<"cadastro_loja">

interface ProdutoConfig {
  id?: number
  produto: Produto
  estado?: string
  loja?: string
  pbm: boolean
  permiteDesconto: boolean
  percentualMaximo: number
  margem: number
  alcadaN1: number
  alcadaN2: number
}

export default function ConfiguracaoProduto() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [estados, setEstados] = useState<Estado[]>([])
  const [lojas, setLojas] = useState<Loja[]>([])
  const [configuracoes, setConfiguracoes] = useState<ProdutoConfig[]>([])
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null)
  const [tipoAplicacao, setTipoAplicacao] = useState<"estado" | "loja">("estado")
  const [selectedReferencia, setSelectedReferencia] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Buscar produtos
      const { data: produtosData, error: produtosError } = await supabase
        .from("cadastro_produto")
        .select("*")
        .order("nome_produto")
      
      if (produtosError) throw produtosError
      setProdutos(produtosData || [])

      // Buscar estados ativos
      const { data: estadosData, error: estadosError } = await supabase
        .from("cadastro_estado")
        .select("*")
        .eq("st_ativo", 1)
        .order("nome_estado")
      
      if (estadosError) throw estadosError
      setEstados(estadosData || [])

      // Buscar lojas ativas
      const { data: lojasData, error: lojasError } = await supabase
        .from("cadastro_loja")
        .select("*")
        .eq("st_token", 1)
        .order("loja")
      
      if (lojasError) throw lojasError
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

  const handleAdicionarProduto = () => {
    if (!selectedProduto || !selectedReferencia) {
      toast({
        title: "Erro",
        description: "Selecione um produto e uma referência",
        variant: "destructive"
      })
      return
    }

    const novaConfig: ProdutoConfig = {
      produto: selectedProduto,
      [tipoAplicacao]: selectedReferencia,
      pbm: false,
      permiteDesconto: false,
      percentualMaximo: 10.0,
      margem: 28.0,
      alcadaN1: 5.0,
      alcadaN2: 10.0
    }

    setConfiguracoes(prev => [...prev, novaConfig])
    setSelectedProduto(null)
    setSelectedReferencia("")
  }

  const handleExportCSV = () => {
    const csvContent = [
      ["Estado", "Loja", "Produto", "PBM", "Permite Desc.", "% Máx", "Margem", "Alçada N1", "Alçada N2"],
      ...configuracoes.map(config => [
        config.estado || "",
        config.loja || "",
        config.produto.nome_produto,
        config.pbm ? "Sim" : "Não",
        config.permiteDesconto ? "Sim" : "Não",
        config.percentualMaximo.toFixed(1),
        config.margem.toFixed(1),
        config.alcadaN1.toFixed(1),
        config.alcadaN2.toFixed(1)
      ])
    ].map(row => row.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "produtos.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getReferenciasOptions = () => {
    if (tipoAplicacao === "estado") {
      return estados.map(estado => ({
        value: estado.estado,
        label: estado.nome_estado
      }))
    } else {
      return lojas.map(loja => ({
        value: loja.loja,
        label: loja.loja
      }))
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Produtos
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
        {/* Formulário de adição */}
        <div className="grid grid-cols-4 gap-4 mb-6 p-4 border rounded-lg">
          <div>
            <Label>Tipo</Label>
            <Select value={tipoAplicacao} onValueChange={(value: "estado" | "loja") => setTipoAplicacao(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="estado">Estado</SelectItem>
                <SelectItem value="loja">Loja</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>{tipoAplicacao === "estado" ? "Estado" : "Loja"}</Label>
            <Select value={selectedReferencia} onValueChange={setSelectedReferencia}>
              <SelectTrigger>
                <SelectValue placeholder={`Selecionar ${tipoAplicacao}...`} />
              </SelectTrigger>
              <SelectContent>
                {getReferenciasOptions().map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Produto</Label>
            <ProdutoCombobox
              produtos={produtos}
              selectedProduto={selectedProduto}
              onProdutoChange={setSelectedProduto}
              placeholder="Selecionar produto..."
            />
          </div>

          <div className="flex items-end">
            <Button onClick={handleAdicionarProduto}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Produto
            </Button>
          </div>
        </div>

        {/* Tabela de configurações */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Estado</th>
                <th className="text-left p-2">Loja</th>
                <th className="text-left p-2">Produto</th>
                <th className="text-left p-2">PBM</th>
                <th className="text-left p-2">Permite Desc.?</th>
                <th className="text-left p-2">% Máx</th>
                <th className="text-left p-2">Margem</th>
                <th className="text-left p-2">Alçada N1</th>
                <th className="text-left p-2">Alçada N2</th>
              </tr>
            </thead>
            <tbody>
              {configuracoes.map((config, index) => (
                <tr key={index} className="border-b">
                  <td className="p-2">
                    {config.estado && (
                      <Select defaultValue={config.estado}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {estados.map(estado => (
                            <SelectItem key={estado.id} value={estado.estado}>
                              {estado.estado}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </td>
                  <td className="p-2">
                    {config.loja || ""}
                  </td>
                  <td className="p-2">{config.produto.nome_produto}</td>
                  <td className="p-2">
                    <Switch
                      checked={config.pbm}
                      onCheckedChange={(checked) => {
                        const newConfigs = [...configuracoes]
                        newConfigs[index].pbm = checked
                        setConfiguracoes(newConfigs)
                      }}
                    />
                  </td>
                  <td className="p-2">
                    <Switch
                      checked={config.permiteDesconto}
                      onCheckedChange={(checked) => {
                        const newConfigs = [...configuracoes]
                        newConfigs[index].permiteDesconto = checked
                        setConfiguracoes(newConfigs)
                      }}
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={config.percentualMaximo}
                      onChange={(e) => {
                        const newConfigs = [...configuracoes]
                        newConfigs[index].percentualMaximo = parseFloat(e.target.value) || 0
                        setConfiguracoes(newConfigs)
                      }}
                      className="w-20"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={config.margem}
                      onChange={(e) => {
                        const newConfigs = [...configuracoes]
                        newConfigs[index].margem = parseFloat(e.target.value) || 0
                        setConfiguracoes(newConfigs)
                      }}
                      className="w-20"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={config.alcadaN1}
                      onChange={(e) => {
                        const newConfigs = [...configuracoes]
                        newConfigs[index].alcadaN1 = parseFloat(e.target.value) || 0
                        setConfiguracoes(newConfigs)
                      }}
                      className="w-20"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={config.alcadaN2}
                      onChange={(e) => {
                        const newConfigs = [...configuracoes]
                        newConfigs[index].alcadaN2 = parseFloat(e.target.value) || 0
                        setConfiguracoes(newConfigs)
                      }}
                      className="w-20"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
