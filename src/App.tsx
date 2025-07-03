
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import Index from "./pages/Index";
import Emulador from "./pages/Emulador";
import ConfiguracaoDescontoSubgrupo from "./pages/ConfiguracaoDescontoSubgrupo";
import ConfiguracaoTokenLoja from "./pages/ConfiguracaoTokenLoja";
import VisualizacaoTokens from "./pages/VisualizacaoTokens";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <div className="min-h-screen flex w-full">
            <AppSidebar />
            <div className="flex-1 flex flex-col">
              <AppHeader />
              <main className="flex-1 bg-background">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/emulador" element={<Emulador />} />
                  <Route path="/configuracao-desconto-subgrupo" element={<ConfiguracaoDescontoSubgrupo />} />
                  <Route path="/configuracao-token-loja" element={<ConfiguracaoTokenLoja />} />
                  <Route path="/visualizacao-tokens" element={<VisualizacaoTokens />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
