import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
type Estado = Tables<"cadastro_estado">;
export default function TokenEstado() {
  const [estados, setEstados] = useState<Estado[]>([]);
  const {
    toast
  } = useToast();
  useEffect(() => {
    fetchEstados();
  }, []);
  const fetchEstados = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from("cadastro_estado").select("*").order("nome_estado");
      if (error) throw error;
      setEstados(data || []);
    } catch (error) {
      console.error("Erro ao buscar estados:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar estados",
        variant: "destructive"
      });
    }
  };
  const handleStatusChange = async (estadoId: number, novoStatus: boolean) => {
    try {
      const {
        error
      } = await supabase.from("cadastro_estado").update({
        st_ativo: novoStatus ? 1 : 0,
        updated_at: new Date().toISOString()
      }).eq("id", estadoId);
      if (error) throw error;
      setEstados(prev => prev.map(estado => estado.id === estadoId ? {
        ...estado,
        st_ativo: novoStatus ? 1 : 0
      } : estado));
      toast({
        title: "Sucesso",
        description: "Estado atualizado com sucesso"
      });
    } catch (error) {
      console.error("Erro ao atualizar estado:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar estado",
        variant: "destructive"
      });
    }
  };
  const handleExportCSV = () => {
    const csvContent = [["Estado", "Nome", "Status"], ...estados.map(estado => [estado.estado, estado.nome_estado, estado.st_ativo === 1 ? "Ativo" : "Inativo"])].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;"
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "token_estados.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return <div className="w-full h-full p-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Token Estado
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Importar CSV
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full">
            <table className="w-full border-collapse table-fixed">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 w-20 text-sm font-medium">Estado</th>
                  <th className="text-left p-3 w-1/2 text-sm font-medium">Nome Estado</th>
                  <th className="text-left p-3 w-24 text-sm font-medium">Status</th>
                  <th className="text-left p-3 w-20 text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {estados.map(estado => <tr key={estado.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium text-sm">{estado.estado}</td>
                    <td className="p-3">
                      <div className="text-sm truncate" title={estado.nome_estado}>
                        {estado.nome_estado}
                      </div>
                    </td>
                    <td className="p-3">
                      <Switch checked={estado.st_ativo === 1} onCheckedChange={checked => handleStatusChange(estado.id, checked)} />
                    </td>
                    <td className="p-3">
                      <span className="text-xs text-muted-foreground">
                        {estado.st_ativo === 1 ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>;
}