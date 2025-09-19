
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Settings, ShoppingCart, FileText, Eye, BarChart, MapPin, Package } from "lucide-react";
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-primary" />
              <CardTitle>Vendas</CardTitle>
            </div>
            <CardDescription>
              Sistema de solicitação de tokens para vendas com desconto especial.
              Configure preços e margens para aprovação automática.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/vendas">
              <Button className="w-full">
                Acessar Vendas
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              <CardTitle>Solicitação Token</CardTitle>
            </div>
            <CardDescription>
              Solicite tokens de desconto especial para produtos específicos.
              Acompanhe o status das solicitações em tempo real.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/solicitacao-tokens">
              <Button className="w-full">
                Solicitar Token
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calculator className="w-6 h-6 text-primary" />
              <CardTitle>Aprovação Token</CardTitle>
            </div>
            <CardDescription>
              Simule regras de desconto e validação de preços em tempo real. 
              Configure loja, produto e valor para verificar aprovação automática.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/aprovacao-token">
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
              <CardTitle>Desconto Subgrupo</CardTitle>
            </div>
            <CardDescription>
              Gerencie percentuais de margem por subgrupo de produtos. 
              Configure valores, períodos de vigência e filtros personalizados.
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
              <Settings className="w-6 h-6 text-primary" />
              <CardTitle>Token Loja</CardTitle>
            </div>
            <CardDescription>
              Configure a quantidade de tokens disponíveis por loja.
              Gerencie o controle de tokens por unidade.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/configuracao-token-loja">
              <Button className="w-full">
                Configurar Tokens
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="w-6 h-6 text-primary" />
              <CardTitle>Token Estado</CardTitle>
            </div>
            <CardDescription>
              Configure políticas de tokens por estado.
              Gerencie regras específicas por região.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/token-estado">
              <Button className="w-full">
                Configurar por Estado
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="w-6 h-6 text-primary" />
              <CardTitle>Desconto Produto</CardTitle>
            </div>
            <CardDescription>
              Configure descontos específicos por produto.
              Gerencie margens individuais e regras especiais.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/desconto-produto">
              <Button className="w-full">
                Configurar Produtos
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Eye className="w-6 h-6 text-primary" />
              <CardTitle>Visualização Tokens</CardTitle>
            </div>
            <CardDescription>
              Visualize e gerencie todos os tokens solicitados.
              Acompanhe aprovações, rejeições e histórico completo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/visualizacao-tokens">
              <Button className="w-full">
                Visualizar Tokens
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 p-6 bg-card rounded-lg border max-w-7xl">
        <h2 className="text-xl font-semibold mb-4">Funcionalidades do Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-medium mb-2">Sistema de Vendas</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Solicitação de tokens para descontos especiais</li>
              <li>• Aprovação automática baseada em regras</li>
              <li>• Controle de margens por produto e região</li>
              <li>• Histórico completo de transações</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">Configurações</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Gestão de percentuais por subgrupo</li>
              <li>• Controle de tokens por loja e estado</li>
              <li>• Configurações específicas por produto</li>
              <li>• Períodos de vigência personalizáveis</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">Relatórios e Análise</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Relatórios detalhados de performance</li>
              <li>• Visualização de tokens aprovados/rejeitados</li>
              <li>• Top lojas com mais solicitações</li>
              <li>• Análise de valores e percentuais</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
