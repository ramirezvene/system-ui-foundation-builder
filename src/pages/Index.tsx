
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Settings } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Sistema de Gestão Farmácias São João
        </h1>
        <p className="text-muted-foreground">
          Bem-vindo ao sistema de configuração e emulação de descontos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calculator className="w-6 h-6 text-primary" />
              <CardTitle>Emulador</CardTitle>
            </div>
            <CardDescription>
              Simule regras de desconto e validação de preços em tempo real. 
              Configure loja, produto e valor para verificar aprovação automática 
              baseada nas margens e limites estabelecidos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/emulador">
              <Button className="w-full">
                Acessar Emulador
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="w-6 h-6 text-primary" />
              <CardTitle>Configuração de Desconto</CardTitle>
            </div>
            <CardDescription>
              Gerencie percentuais de margem por subgrupo de produtos. 
              Configure valores, períodos de vigência e filtros personalizados 
              para controle preciso das margens aplicadas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/configuracao-desconto-subgrupo">
              <Button className="w-full">
                Configurar Descontos
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 p-6 bg-card rounded-lg border max-w-4xl">
        <h2 className="text-xl font-semibold mb-4">Funcionalidades do Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2">Emulador de Descontos</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Simulação de regras de desconto em tempo real</li>
              <li>• Validação automática de margens e limites por estado</li>
              <li>• Cálculo preciso de preços mínimos e percentuais</li>
              <li>• Controle de alçada para aprovações especiais</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">Configurações de Margem</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Gestão de percentuais por subgrupo de produtos</li>
              <li>• Controle de períodos de vigência das margens</li>
              <li>• Filtros avançados para localização rápida</li>
              <li>• Edição inline com validação de dados</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
