
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { Toaster } from "@/components/ui/toaster"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { AppHeader } from "@/components/AppHeader"
import Index from "@/pages/Index"
import Vendas from "@/pages/Vendas"
import SolicitacaoTokens from "@/pages/SolicitacaoTokens"
import AprovacaoToken from "@/pages/AprovacaoToken"
import ConfiguracaoDescontoToken from "@/pages/ConfiguracaoDescontoToken"
import ConfiguracaoDescontoSubgrupo from "@/pages/ConfiguracaoDescontoSubgrupo"
import ConfiguracaoTokenLoja from "@/pages/ConfiguracaoTokenLoja"
import TokenEstado from "@/pages/TokenEstado"
import DescontoProduto from "@/pages/DescontoProduto"
import VisualizacaoTokens from "@/pages/VisualizacaoTokens"
import Relatorios from "@/pages/Relatorios"
import { useEffect, useState } from "react"
import { supabase } from "./integrations/supabase/client"

function App() {
  return (
    <SidebarProvider>
      <Router>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <AppHeader />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/vendas" element={<Vendas />} />
                <Route path="/solicitacao-tokens" element={<SolicitacaoTokens />} />
                <Route path="/aprovacao-token" element={<AprovacaoToken />} />
                {/* <Route path="/configuracao-desconto-token" element={<ConfiguracaoDescontoToken />} /> */}
                
                <Route path="/configuracao-desconto-subgrupo" element={<ConfiguracaoDescontoSubgrupo />} />
                <Route path="/configuracao-token-loja" element={<ConfiguracaoTokenLoja />} />
                <Route path="/token-estado" element={<TokenEstado />} />
                <Route path="/desconto-produto" element={<DescontoProduto />} />
                
                <Route path="/visualizacao-tokens" element={<VisualizacaoTokens />} />
                <Route path="/relatorios" element={<Relatorios />} />
              </Routes>
            </main>
          </div>
        </div>
        <Toaster />
      </Router>
    </SidebarProvider>
  )
}

export default App
