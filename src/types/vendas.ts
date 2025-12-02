
import { Tables } from "@/integrations/supabase/types"

export type Loja = Tables<"cadastro_loja">
export type Produto = Tables<"cadastro_produto">
export type ProdutoMargem = Tables<"produto_margem">
export type SubgrupoMargem = Tables<"subgrupo_margem">
export type Estado = Tables<"cadastro_estado">

export type RegraAplicada = 
  | "estado" 
  | "loja" 
  | "produto_loja" 
  | "produto_estado" 
  | "subgrupo" 
  | "token"
  | null

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
  margem: string
  margemAdc: string
  aliqUF: number
  piscofinsUF: number
  ruptura: number
  observacaoRejeicao?: string
  regraAplicada?: RegraAplicada
}
