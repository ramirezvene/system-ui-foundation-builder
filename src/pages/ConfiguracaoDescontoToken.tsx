
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ConfiguracaoEstado from "@/components/ConfiguracaoEstado"
import ConfiguracaoTokenLoja from "@/pages/ConfiguracaoTokenLoja"
import ConfiguracaoDescontoSubgrupo from "@/pages/ConfiguracaoDescontoSubgrupo"
import ConfiguracaoProduto from "@/components/ConfiguracaoProduto"

export default function ConfiguracaoDescontoToken() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">Configuração Desconto Token</h1>
      
      <Tabs defaultValue="estado" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="estado">Estado</TabsTrigger>
          <TabsTrigger value="loja">Loja</TabsTrigger>
          <TabsTrigger value="subgrupo">Subgrupo</TabsTrigger>
          <TabsTrigger value="produto">Produto</TabsTrigger>
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
      </Tabs>
    </div>
  )
}
