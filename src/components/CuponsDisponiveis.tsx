
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/integrations/supabase/client"
import { LojaCombobox } from "./LojaCombobox"
import { Tables } from "@/integrations/supabase/types"

type Loja = Tables<"cadastro_loja">

interface CupomData {
  loja: string
  cod_loja: number
  tokens_aprovados: number
  tokens_pendentes: number
  tokens_reprovados: number
  valor_total: number
  valor_aprovado: number
  valor_pendente: number
  valor_reprovado: number
}

interface CuponsDisponiveisProps {
  selectedMonth: number
  selectedYear: number
}

export default function CuponsDisponiveis({ selectedMonth, selectedYear }: CuponsDisponiveisProps) {
  const [cupons, setCupons] = useState<CupomData[]>([])
  const [loading, setLoading] = useState(true)
  const [lojas, setLojas] = useState<Loja[]>([])
  const [selectedLoja, setSelectedLoja] = useState<Loja | null>(null)
  const [cidades, setCidades] = useState<string[]>([])
  const [microregioes, setMicroregioes] = useState<string[]>([])
  const [selectedCidade, setSelectedCidade] = useState<string>("")
  const [selectedMicroregiao, setSelectedMicroregiao] = useState<string>("")

  useEffect(() => {
    fetchLojas()
  }, [])

  useEffect(() => {
    fetchCuponsData()
  }, [selectedMonth, selectedYear, selectedLoja, selectedCidade, selectedMicroregiao])

  const fetchLojas = async () => {
    try {
      const { data, error } = await supabase
        .from("cadastro_loja")
        .select("*")
        .order("loja")

      if (error) throw error
      setLojas(data || [])
      
      // Extrair cidades e microrregiões únicas
      const cidadesUnicas = [...new Set(data?.map(loja => loja.cidade_nome).filter(Boolean))] as string[]
      const microrregioesUnicas = [...new Set(data?.map(loja => loja.microregiao_nome).filter(Boolean))] as string[]
      
      setCidades(cidadesUnicas.sort())
      setMicroregioes(microrregioesUnicas.sort())
    } catch (error) {
      console.error("Erro ao buscar lojas:", error)
    }
  }

  const fetchCuponsData = async () => {
    try {
      setLoading(true)
      const startDate = new Date(selectedYear, selectedMonth - 1, 1)
      const endDate = new Date(selectedYear, selectedMonth, 0)

      let query = supabase
        .from("token_loja")
        .select(`
          cod_loja,
          st_aprovado,
          data_criacao,
          cadastro_loja(loja, cidade_nome, microregiao_nome),
          token_loja_detalhado(vlr_solic, qtde_solic)
        `)
        .gte("data_criacao", startDate.toISOString())
        .lte("data_criacao", endDate.toISOString())

      if (selectedLoja) {
        query = query.eq("cod_loja", selectedLoja.cod_loja)
      }

      const { data: tokens, error } = await query

      if (error) throw error

      // Filtrar tokens baseado nos filtros de cidade e microrregião
      const tokensFiltrados = tokens?.filter(token => {
        const lojaInfo = token.cadastro_loja as any
        
        if (selectedCidade && lojaInfo?.cidade_nome !== selectedCidade) {
          return false
        }
        
        if (selectedMicroregiao && lojaInfo?.microregiao_nome !== selectedMicroregiao) {
          return false
        }
        
        return true
      })

      // Processar dados por loja
      const lojaStats: { [key: number]: CupomData } = {}

      tokensFiltrados?.forEach(token => {
        const lojaInfo = token.cadastro_loja as any
        
        if (!lojaStats[token.cod_loja]) {
          lojaStats[token.cod_loja] = {
            cod_loja: token.cod_loja,
            loja: lojaInfo?.loja || `Loja ${token.cod_loja}`,
            tokens_aprovados: 0,
            tokens_pendentes: 0,
            tokens_reprovados: 0,
            valor_total: 0,
            valor_aprovado: 0,
            valor_pendente: 0,
            valor_reprovado: 0
          }
        }

        // Calcular valor do token
        const detalhes = token.token_loja_detalhado as any[]
        let valorToken = 0
        detalhes?.forEach(detalhe => {
          valorToken += (detalhe.vlr_solic || 0) * (detalhe.qtde_solic || 1)
        })

        lojaStats[token.cod_loja].valor_total += valorToken

        // Contar tokens por status
        if (token.st_aprovado === 1) {
          lojaStats[token.cod_loja].tokens_aprovados++
          lojaStats[token.cod_loja].valor_aprovado += valorToken
        } else if (token.st_aprovado === 0) {
          lojaStats[token.cod_loja].tokens_reprovados++
          lojaStats[token.cod_loja].valor_reprovado += valorToken
        } else {
          lojaStats[token.cod_loja].tokens_pendentes++
          lojaStats[token.cod_loja].valor_pendente += valorToken
        }
      })

      // Converter para array e ordenar por valor total
      const cuponsArray = Object.values(lojaStats)
        .sort((a, b) => b.valor_total - a.valor_total)

      setCupons(cuponsArray)
    } catch (error) {
      console.error("Erro ao buscar dados dos cupons:", error)
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setSelectedLoja(null)
    setSelectedCidade("")
    setSelectedMicroregiao("")
  }

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ]

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Resumo por Loja - {months[selectedMonth - 1]} {selectedYear}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Carregando...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Resumo por Loja - {months[selectedMonth - 1]} {selectedYear}</CardTitle>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <LojaCombobox
                lojas={lojas}
                selectedLoja={selectedLoja}
                onLojaChange={setSelectedLoja}
                placeholder="Buscar por loja (opcional)"
              />
            </div>
            <div>
              <Select value={selectedCidade} onValueChange={setSelectedCidade}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por cidade" />
                </SelectTrigger>
                <SelectContent>
                  {cidades.map((cidade) => (
                    <SelectItem key={cidade} value={cidade}>
                      {cidade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={selectedMicroregiao} onValueChange={setSelectedMicroregiao}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por microrregião" />
                </SelectTrigger>
                <SelectContent>
                  {microregioes.map((microregiao) => (
                    <SelectItem key={microregiao} value={microregiao}>
                      {microregiao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {(selectedLoja || selectedCidade || selectedMicroregiao) && (
            <div className="flex justify-end">
              <button
                onClick={clearFilters}
                className="text-sm text-muted-foreground hover:text-foreground underline"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cupons.map((cupom) => (
            <Card key={cupom.cod_loja} className="border-l-4 border-l-primary h-full">
              <CardContent className="p-4 flex flex-col h-full">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{cupom.loja}</h3>
                    <p className="text-sm text-muted-foreground">Código: {cupom.cod_loja}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">
                      R$ {cupom.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground">Valor Total</p>
                  </div>
                </div>
                
                <div className="space-y-2 mb-3 flex-1">
                  <div className="text-sm">
                    <span className="text-green-600 font-medium">Aprovados: </span>
                    R$ {cupom.valor_aprovado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm">
                    <span className="text-slate-600 font-medium">Pendentes: </span>
                    R$ {cupom.valor_pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm">
                    <span className="text-red-600 font-medium">Reprovados: </span>
                    R$ {cupom.valor_reprovado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-auto">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Aprovados: {cupom.tokens_aprovados}
                  </Badge>
                  <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                    Pendentes: {cupom.tokens_pendentes}
                  </Badge>
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    Reprovados: {cupom.tokens_reprovados}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {cupons.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum dado encontrado para o período selecionado.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
