
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Settings, Package } from "lucide-react";
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calculator className="w-6 h-6 text-primary" />
              <CardTitle>Emulador</CardTitle>
            </div>
            <CardDescription>
              Simule regras de desconto e geração de tokens
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
              Configure percentuais de desconto por subgrupo
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

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="w-6 h-6 text-primary" />
              <CardTitle>Configuração NCM</CardTitle>
            </div>
            <CardDescription>
              Gerencie alíquotas por NCM dos produtos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/configuracao-ncm">
              <Button className="w-full">
                Configurar NCM
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 p-6 bg-card rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Funcionalidades do Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2">Emulador de Descontos</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Simulação de regras de desconto em tempo real</li>
              <li>• Validação automática de margens e limites</li>
              <li>• Geração controlada de tokens de aprovação</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">Configurações Avançadas</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Gestão de percentuais por subgrupo de produtos</li>
              <li>• Controle de alíquotas por classificação NCM</li>
              <li>• Configuração de períodos de vigência</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
