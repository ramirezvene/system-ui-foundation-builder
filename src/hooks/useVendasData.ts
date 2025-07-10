
import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Loja, Produto, ProdutoMargem, SubgrupoMargem, Estado } from "@/types/vendas"

export function useVendasData() {
  const [lojas, setLojas] = useState<Loja[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [produtoMargens, setProdutoMargens] = useState<ProdutoMargem[]>([])
  const [subgrupoMargens, setSubgrupoMargens] = useState<SubgrupoMargem[]>([])
  const [estados, setEstados] = useState<Estado[]>([])
  const [selectedLoja, setSelectedLoja] = useState<Loja | null>(null)
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null)
  const [precoAtual, setPrecoAtual] = useState<number>(0)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedProduto && selectedLoja) {
      const estado = selectedLoja.estado.toLowerCase()
      let preco = 0
      
      if (estado === 'rs') {
        preco = selectedProduto.pmc_rs || 0
      } else if (estado === 'sc') {
        preco = selectedProduto.pmc_sc || 0
      } else if (estado === 'pr') {
        preco = selectedProduto.pmc_pr || 0
      }
      
      setPrecoAtual(preco)
    }
  }, [selectedProduto, selectedLoja])

  const fetchData = async () => {
    try {
      const [lojasRes, produtosRes, produtoMargensRes, subgrupoMargensRes, estadosRes] = await Promise.all([
        supabase.from("cadastro_loja").select("*").order("loja"),
        supabase.from("cadastro_produto").select("*").order("nome_produto"),
        supabase.from("produto_margem").select("*"),
        supabase.from("subgrupo_margem").select("*").order("cod_subgrupo, uf"),
        supabase.from("cadastro_estado").select("*")
      ])
      
      if (lojasRes.error) throw lojasRes.error
      if (produtosRes.error) throw produtosRes.error
      if (produtoMargensRes.error) throw produtoMargensRes.error
      if (subgrupoMargensRes.error) throw subgrupoMargensRes.error
      if (estadosRes.error) throw estadosRes.error

      setLojas(lojasRes.data || [])
      setProdutos(produtosRes.data || [])
      setProdutoMargens(produtoMargensRes.data || [])
      setSubgrupoMargens(subgrupoMargensRes.data || [])
      setEstados(estadosRes.data || [])
    } catch (error) {
      console.error("Erro ao buscar dados:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive"
      })
    }
  }

  return {
    lojas,
    produtos,
    produtoMargens,
    subgrupoMargens,
    estados,
    selectedLoja,
    setSelectedLoja,
    selectedProduto,
    setSelectedProduto,
    precoAtual
  }
}
