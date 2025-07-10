
import { Tables } from "@/integrations/supabase/types"

export type Loja = Tables<"cadastro_loja">
export type Produto = Tables<"cadastro_produto">
export type ProdutoMargem = Tables<"produto_margem">
export type Estado = Tables<"cadastro_estado">

// Tipo customizado para SubgrupoMargem incluindo o campo uf
export interface SubgrupoMargem {
  cod_subgrupo: number
  nome_subgrupo: string
  margem: number
  data_inicio: string | null
  data_fim: string | null
  observacao: string | null
  uf: string
}

export interface SolicitacaoResult {
  loja: Loja | null
  produto: Produto | null
  precoRegular: number
  precoSolicitado: number
  desconto: number
  quantidade: number
  tokenDisponivel: number
  tokenDisponipelAtualizado: number
  retorno: string
  aprovado: boolean
  precoMinimo: number
  cmgProduto: number
  descontoAlcada: string
  margemUF: string
  margemZVDC: string
  aliqUF: number
  piscofinsUF: number
  ruptura: number
  observacaoRejeicao?: string
}
