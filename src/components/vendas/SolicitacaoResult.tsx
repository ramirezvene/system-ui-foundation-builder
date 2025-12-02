
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react"
import { SolicitacaoResult, RegraAplicada } from "@/types/vendas"
import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"

const getRegraLabel = (regra: RegraAplicada): string => {
  switch (regra) {
    case "estado": return "Estado"
    case "loja": return "Loja"
    case "produto_loja": return "Produto Loja"
    case "produto_estado": return "Produto Estado"
    case "subgrupo": return "Subgrupo"
    case "token": return "Token"
    default: return "N/A"
  }
}

const getRegraColor = (regra: RegraAplicada): string => {
  switch (regra) {
    case "estado": return "bg-purple-100 text-purple-800 border-purple-200"
    case "loja": return "bg-blue-100 text-blue-800 border-blue-200"
    case "produto_loja": return "bg-orange-100 text-orange-800 border-orange-200"
    case "produto_estado": return "bg-green-100 text-green-800 border-green-200"
    case "subgrupo": return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "token": return "bg-red-100 text-red-800 border-red-200"
    default: return "bg-muted text-muted-foreground"
  }
}

interface SolicitacaoResultCardProps {
  result: SolicitacaoResult
  formatCurrency: (value: number) => string
}

export function SolicitacaoResultCard({ result, formatCurrency }: SolicitacaoResultCardProps) {
  const [tokensUtilizados, setTokensUtilizados] = useState(0)

  useEffect(() => {
    const calcularTokensUtilizados = async () => {
      if (!result.loja) return

      try {
        const { data } = await supabase
          .from("token_loja")
          .select("id")
          .eq("cod_loja", result.loja.cod_loja)
          .eq("st_aprovado", 1)

        setTokensUtilizados(data?.length || 0)
      } catch (error) {
        console.error("Erro ao calcular tokens utilizados:", error)
      }
    }

    calcularTokensUtilizados()
  }, [result.loja])
  // Verificar se é um motivo específico de reprovação que deve ser destacado
  const motivosDestaque = [
    "Maior que desconto máximo",
    "Não possuí margem",
    "Menor que Preço Mínimo",
    "Maior que Preço Regular",
    "Desativado Pricing Produto",
    "Produto Ruptura",
    "Outros descontos, não permite",
    "Estado sem permissão",
    "Loja sem permissão",
    "Não possuí token disponível",
    "Meta Loja Irregular",
    "DRE Loja Irregular"
  ]

  const isDestaque = motivosDestaque.some(motivo => 
    result.retorno.includes(motivo)
  )

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {result.aprovado ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
          Resultado da Solicitação
          <Badge variant={result.aprovado ? "default" : "destructive"}>
            {result.aprovado ? "Aprovado" : "Rejeitado"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informações básicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Loja</h3>
            <p className="text-sm text-muted-foreground">
              {result.loja?.cod_loja} - {result.loja?.loja}
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Produto</h3>
            <p className="text-sm text-muted-foreground">
              {result.produto?.id_produto} - {result.produto?.nome_produto}
            </p>
          </div>
        </div>

        {/* Preços e desconto */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Preço Regular</h3>
            <p className="text-lg font-mono">{formatCurrency(result.precoRegular)}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Preço Solicitado</h3>
            <p className="text-lg font-mono">{formatCurrency(result.precoSolicitado)}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Desconto</h3>
            <p className="text-lg font-mono">{result.desconto.toFixed(2)}%</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Quantidade</h3>
            <p className="text-lg font-mono">{result.quantidade}</p>
          </div>
        </div>

        {/* Informações de margem e custos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Preço Mínimo</h3>
            <p className="text-sm font-mono">{formatCurrency(result.precoMinimo)}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">CMV Produto</h3>
            <p className="text-sm font-mono">{formatCurrency(result.cmgProduto)}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Outros Descontos</h3>
            <p className="text-sm font-mono">{result.descontoAlcada}</p>
          </div>
        </div>

        {/* Informações de margem */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Margem UF</h3>
            <p className="text-sm font-mono">{result.margemUF}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Margem</h3>
            <p className="text-sm font-mono">{result.margem}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Margem Adicional</h3>
            <p className="text-sm font-mono">{result.margemAdc}</p>
          </div>
        </div>

        {/* Informações fiscais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Alíquota UF</h3>
            <p className="text-sm font-mono">{result.aliqUF.toFixed(2)}%</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">PISCOFINS UF</h3>
            <p className="text-sm font-mono">{result.piscofinsUF.toFixed(2)}%</p>
          </div>
        </div>

        {/* Tokens */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Tokens</h3>
            <div className="text-sm space-y-1">
              <div className="font-mono">
                {result.tokenDisponivel + tokensUtilizados} / {tokensUtilizados} / {result.tokenDisponipelAtualizado}
              </div>
              <div className="text-xs text-muted-foreground">
                Total / Usado / Restante
              </div>
            </div>
          </div>
        </div>

        {/* Regra Aplicada */}
        {result.regraAplicada && (
          <div className="grid grid-cols-1 gap-4">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                Regra Aplicada
              </h3>
              <Badge 
                variant="outline" 
                className={`text-sm px-3 py-1 ${getRegraColor(result.regraAplicada)}`}
              >
                {getRegraLabel(result.regraAplicada)}
              </Badge>
            </div>
          </div>
        )}

        {/* Retorno com destaque para reprovações */}
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            Retorno
            {!result.aprovado && isDestaque && (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
          </h3>
          <div className={`p-3 rounded border-l-4 ${
            result.aprovado 
              ? "bg-green-50 border-green-400 text-green-800" 
              : isDestaque 
                ? "bg-red-50 border-red-400 text-red-800" 
                : "bg-muted border-muted-foreground"
          }`}>
            <p className={`text-sm font-medium ${
              !result.aprovado && isDestaque ? "text-red-800" : ""
            }`}>
              {result.retorno}
            </p>
          </div>
          
          {result.observacaoRejeicao && (
            <div className="mt-2">
              <h4 className="font-semibold text-sm mb-1">Observação:</h4>
              <div className={`p-2 rounded border-l-4 ${
                isDestaque 
                  ? "bg-red-50 border-red-400 text-red-700" 
                  : "bg-yellow-50 border-yellow-400 text-yellow-700"
              }`}>
                <p className="text-sm">
                  {result.observacaoRejeicao}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
