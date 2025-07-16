import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { Toaster } from "@/components/ui/toaster"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { AppHeader } from "@/components/AppHeader"
import Index from "@/pages/Index"
import Vendas from "@/pages/Vendas"
import SolicitacaoTokens from "@/pages/SolicitacaoTokens"
import AprovacaoToken from "@/pages/AprovacaoToken"
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
