
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { SolicitacaoResult } from "@/types/vendas"

interface SolicitacaoResultProps {
  result: SolicitacaoResult
  formatCurrency: (value: number) => string
}

export function SolicitacaoResultCard({ result, formatCurrency }: SolicitacaoResultProps) {
  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className={`${result.aprovado ? 'text-green-600' : 'text-red-600'}`}>
          Resultado da Solicitação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="font-semibold">Loja:</Label>
            <p>{result.loja?.cod_loja} - {result.loja?.loja} - {result.loja?.estado}</p>
          </div>
          
          <div>
            <Label className="font-semibold">Produto:</Label>
            <p>{result.produto?.id_produto} - {result.produto?.nome_produto}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="font-semibold">Quantidade:</Label>
            <p>{result.quantidade}</p>
          </div>
          
          <div>
            <Label className="font-semibold">Valor Solicitado:</Label>
            <p>{formatCurrency(result.precoSolicitado)}</p>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3">Informações Adicionais</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label className="font-semibold">Preço Mínimo:</Label>
              <p>{formatCurrency(result.precoMinimo)}</p>
            </div>
            
            <div>
              <Label className="font-semibold">CMG Produto:</Label>
              <p>{formatCurrency(result.cmgProduto)}</p>
            </div>
            
            <div>
              <Label className="font-semibold">Preço Regular:</Label>
              <p>{formatCurrency(result.precoRegular)}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <div>
              <Label className="font-semibold">% Desconto:</Label>
              <p>{result.desconto.toFixed(2)}%</p>
            </div>
            
            <div>
              <Label className="font-semibold">Desconto Alçada:</Label>
              <p>{result.descontoAlcada}</p>
            </div>
            
            <div>
              <Label className="font-semibold">Margem UF Loja:</Label>
              <p>{result.margemUF}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <div>
              <Label className="font-semibold">Margem ZVDC:</Label>
              <p>{result.margemZVDC}</p>
            </div>
            
            <div>
              <Label className="font-semibold">Aliq UF:</Label>
              <p>{(result.aliqUF).toFixed(2)}%</p>
            </div>
            
            <div>
              <Label className="font-semibold">PIS/COFINS UF:</Label>
              <p>{(result.piscofinsUF * 100).toFixed(2)}%</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-4">
            <div>
              <Label className="font-semibold">Ruptura:</Label>
              <p>{result.ruptura === 1 ? 'Sim' : 'Não'}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="font-semibold">Token Disponível (Atual):</Label>
            <p>{result.tokenDisponivel}</p>
          </div>
          
          <div>
            <Label className="font-semibold">Token Disponível (Atualizado):</Label>
            <p className={`font-medium ${result.aprovado ? 'text-blue-600' : 'text-gray-600'}`}>
              {result.tokenDisponipelAtualizado}
            </p>
          </div>
        </div>

        <div>
          <Label className="font-semibold">Retorno:</Label>
          <p className={`font-medium ${result.aprovado ? 'text-green-600' : 'text-red-600'}`}>
            {result.retorno}
          </p>
          {result.observacaoRejeicao && (
            <p className="text-sm text-gray-600 mt-1">
              <strong>Observação:</strong> {result.observacaoRejeicao}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
