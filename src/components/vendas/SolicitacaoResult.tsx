
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle } from "lucide-react"
import { SolicitacaoResult } from "@/types/vendas"

interface SolicitacaoResultCardProps {
  result: SolicitacaoResult
  formatCurrency: (value: number) => string
}

export function SolicitacaoResultCard({ result, formatCurrency }: SolicitacaoResultCardProps) {
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
            <h3 className="font-semibold mb-2">CMG Produto</h3>
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
            <p className="text-sm font-mono">{result.margemZVDC}</p>
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
          <div>
            <h3 className="font-semibold mb-2">Ruptura</h3>
            <p className="text-sm font-mono">{result.ruptura === 0 ? "Não" : "Sim"}</p>
          </div>
        </div>

        {/* Tokens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Token Disponível</h3>
            <p className="text-sm font-mono">{result.tokenDisponivel}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Token Atualizado</h3>
            <p className="text-sm font-mono">{result.tokenDisponipelAtualizado}</p>
          </div>
        </div>

        {/* Retorno */}
        <div>
          <h3 className="font-semibold mb-2">Retorno</h3>
          <p className="text-sm bg-muted p-3 rounded">{result.retorno}</p>
          {result.observacaoRejeicao && (
            <div className="mt-2">
              <h4 className="font-semibold text-sm mb-1">Observação:</h4>
              <p className="text-sm text-muted-foreground bg-yellow-50 p-2 rounded border-l-4 border-yellow-400">
                {result.observacaoRejeicao}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
