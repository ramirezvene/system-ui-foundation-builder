import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react"

interface TokenDetailsCardProps {
  token: {
    codigo_token: string
    st_aprovado: number | null
    data_criacao: string
    data_validacao?: string | null
    cadastro_loja: {
      cod_loja: number
      loja: string
      estado: string
    }
  }
  tokenDetalhes: {
    produto: string | null
    preco_regul: number | null
    vlr_solic: number | null
    desconto: string | null
    qtde_solic: number | null
    preco_min: number | null
    cmg_produto: number | null
    margem_uf: string | null
    margem_zvdc: string | null
    desc_alcada: string | null
    observacao: string | null
  }[]
  formatCurrency: (value: number | null) => string
}

export function TokenDetailsCard({ token, tokenDetalhes, formatCurrency }: TokenDetailsCardProps) {
  const detalhe = tokenDetalhes[0] // Assuming single product for now
  
  if (!detalhe) return null

  const desconto = detalhe.desconto ? parseFloat(detalhe.desconto) : 0
  const quantidade = detalhe.qtde_solic || 0

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {token.st_aprovado === 1 ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : token.st_aprovado === 0 ? (
            <XCircle className="h-5 w-5 text-red-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          )}
          Resultado da Solicitação
          <Badge variant={token.st_aprovado === 1 ? "default" : token.st_aprovado === 0 ? "destructive" : "secondary"}>
            {token.st_aprovado === 1 ? "Aprovado" : token.st_aprovado === 0 ? "Rejeitado" : "Pendente"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informações básicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Loja</h3>
            <p className="text-sm text-muted-foreground">
              {token.cadastro_loja.cod_loja} - {token.cadastro_loja.loja}
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Produto</h3>
            <p className="text-sm text-muted-foreground">
              {detalhe.produto || "N/A"}
            </p>
          </div>
        </div>

        {/* Preços e desconto */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Preço Regular</h3>
            <p className="text-lg font-mono">{formatCurrency(detalhe.preco_regul)}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Preço Solicitado</h3>
            <p className="text-lg font-mono">{formatCurrency(detalhe.vlr_solic)}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Desconto</h3>
            <p className="text-lg font-mono">{desconto.toFixed(2)}%</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Quantidade</h3>
            <p className="text-lg font-mono">{quantidade}</p>
          </div>
        </div>

        {/* Informações de margem e custos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Preço Mínimo</h3>
            <p className="text-sm font-mono">{formatCurrency(detalhe.preco_min)}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">CMV Produto</h3>
            <p className="text-sm font-mono">{formatCurrency(detalhe.cmg_produto)}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Outros Descontos</h3>
            <p className="text-sm font-mono">SEM OUTROS</p>
          </div>
        </div>

        {/* Informações de margem */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Margem UF</h3>
            <p className="text-sm font-mono">{detalhe.margem_uf || "0.00%"}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Margem</h3>
            <p className="text-sm font-mono">{detalhe.margem_zvdc || "0.00%"}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Margem Adicional</h3>
            <p className="text-sm font-mono">0.00%</p>
          </div>
        </div>

        {/* Informações fiscais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Alíquota UF</h3>
            <p className="text-sm font-mono">0.00%</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">PISCOFINS UF</h3>
            <p className="text-sm font-mono">0.00%</p>
          </div>
        </div>

        {/* Tokens */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Tokens</h3>
            <div className="text-sm space-y-1">
              <div className="font-mono">
                Token: {token.codigo_token}
              </div>
              <div className="text-xs text-muted-foreground">
                Código do Token
              </div>
            </div>
          </div>
        </div>

        {/* Retorno */}
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            Retorno
            {token.st_aprovado === 1 ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : token.st_aprovado === 0 ? (
              <XCircle className="h-4 w-4 text-red-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            )}
          </h3>
          <div className={`p-3 rounded border-l-4 ${
            token.st_aprovado === 1
              ? "bg-green-50 border-green-400 text-green-800" 
              : token.st_aprovado === 0
                ? "bg-red-50 border-red-400 text-red-800" 
                : "bg-yellow-50 border-yellow-400 text-yellow-800"
          }`}>
            <p className="text-sm font-medium">
              {token.st_aprovado === 1 
                ? `Aprovado - Token: ${token.codigo_token}` 
                : token.st_aprovado === 0 
                  ? detalhe.desc_alcada || "Rejeitado"
                  : "Pendente de aprovação"
              }
            </p>
          </div>
          
          {detalhe.observacao && (
            <div className="mt-2">
              <h4 className="font-semibold text-sm mb-1">Observação:</h4>
              <div className="p-2 rounded border-l-4 bg-muted border-muted-foreground">
                <p className="text-sm">
                  {detalhe.observacao}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}