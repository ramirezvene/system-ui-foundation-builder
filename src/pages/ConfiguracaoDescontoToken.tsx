
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ConfiguracaoEstado from "@/components/ConfiguracaoEstado"
import ConfiguracaoTokenLoja from "@/pages/ConfiguracaoTokenLoja"
import ConfiguracaoDescontoSubgrupo from "@/pages/ConfiguracaoDescontoSubgrupo"
import ConfiguracaoProduto from "@/components/ConfiguracaoProduto"
import TokenEstado from "@/components/TokenEstado"
import DescontoProduto from "@/components/DescontoProduto"

export default function ConfiguracaoDescontoToken() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Configuração de Descontos Automáticos</h1>
      
      <Tabs defaultValue="estado" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="estado">Estado</TabsTrigger>
          <TabsTrigger value="loja">Loja</TabsTrigger>
          <TabsTrigger value="subgrupo">Subgrupo</TabsTrigger>
          <TabsTrigger value="produto">Produto</TabsTrigger>
          <TabsTrigger value="token-estado">Token Estado</TabsTrigger>
          <TabsTrigger value="desconto-produto">Desconto Produto</TabsTrigger>
        </TabsList>
        
        <TabsContent value="estado" className="mt-6">
          <ConfiguracaoEstado />
        </TabsContent>
        
        <TabsContent value="loja" className="mt-6">
          <ConfiguracaoTokenLoja />
        </TabsContent>
        
        <TabsContent value="subgrupo" className="mt-6">
          <ConfiguracaoDescontoSubgrupo />
        </TabsContent>
        
        <TabsContent value="produto" className="mt-6">
          <ConfiguracaoProduto />
        </TabsContent>
        
        <TabsContent value="token-estado" className="mt-6">
          <TokenEstado />
        </TabsContent>
        
        <TabsContent value="desconto-produto" className="mt-6">
          <DescontoProduto />
        </TabsContent>
      </Tabs>
    </div>
  )
}
