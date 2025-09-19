import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
type Loja = Tables<"cadastro_loja">;
interface LojaWithTokenStats extends Loja {
  tokensUtilizados: number;
  tokensTotal: number;
  tokensRestantes: number;
}
export default function ConfiguracaoTokenLoja() {
  const [lojas, setLojas] = useState<LojaWithTokenStats[]>([]);
  const [editedRows, setEditedRows] = useState<Set<number>>(new Set());
  const {
    toast
  } = useToast();
  useEffect(() => {
    fetchLojas();
  }, []);
  const fetchLojas = async () => {
    try {
      const {
        data: lojasData,
        error: lojasError
      } = await supabase.from("cadastro_loja").select("*").order("cod_loja");
      if (lojasError) throw lojasError;

      // Buscar tokens utilizados por loja
      const {
        data: tokensData,
        error: tokensError
      } = await supabase.from("token_loja").select("cod_loja").eq("st_aprovado", 1);
      if (tokensError) throw tokensError;

      // Calcular estatísticas de tokens
      const tokensUtilizadosPorLoja = tokensData?.reduce((acc, token) => {
        acc[token.cod_loja] = (acc[token.cod_loja] || 0) + 1;
        return acc;
      }, {} as Record<number, number>) || {};
      const lojasComStats = (lojasData || []).map(loja => ({
        ...loja,
        tokensUtilizados: tokensUtilizadosPorLoja[loja.cod_loja] || 0,
        tokensTotal: loja.qtde_token || 0,
        tokensRestantes: Math.max(0, (loja.qtde_token || 0) - (tokensUtilizadosPorLoja[loja.cod_loja] || 0))
      }));
      setLojas(lojasComStats);
    } catch (error) {
      console.error("Erro ao buscar lojas:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar lojas",
        variant: "destructive"
      });
    }
  };
  const handleQtdeTokenChange = (codLoja: number, newQtde: number) => {
    setLojas(prev => prev.map(loja => loja.cod_loja === codLoja ? {
      ...loja,
      qtde_token: newQtde,
      tokensTotal: newQtde,
      tokensRestantes: Math.max(0, newQtde - loja.tokensUtilizados)
    } : loja));
    setEditedRows(prev => new Set(prev).add(codLoja));
  };
  const handleStatusToggle = (codLoja: number, newStatus: boolean) => {
    setLojas(prev => prev.map(loja => loja.cod_loja === codLoja ? {
      ...loja,
      st_token: newStatus ? 1 : 0
    } : loja));
    setEditedRows(prev => new Set(prev).add(codLoja));
  };
  const handleSave = async (codLoja: number) => {
    const loja = lojas.find(l => l.cod_loja === codLoja);
    if (!loja) return;
    try {
      const {
        error
      } = await supabase.from("cadastro_loja").update({
        st_token: loja.st_token,
        qtde_token: loja.qtde_token
      }).eq("cod_loja", codLoja);
      if (error) throw error;
      setEditedRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(codLoja);
        return newSet;
      });
      toast({
        title: "Sucesso",
        description: "Loja atualizada com sucesso"
      });
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar loja",
        variant: "destructive"
      });
    }
  };
  const handleExportCSV = () => {
    const csvContent = [["Código", "Loja", "Estado", "Qtde Token", "Meta Loja", "DRE Loja", "Status Token"], ...lojas.map(loja => [loja.cod_loja, loja.loja, loja.estado, loja.qtde_token || 0, loja.meta_loja === 1 ? "Regular" : "Irregular", loja.dre_negativo === 1 ? "Regular" : "Irregular", loja.st_token === 1 ? "Ativo" : "Inativo"])].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;"
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "token_lojas.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const handleImportCSV = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = async e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      const lines = text.split("\n");
      const headers = lines[0].split(",");
      try {
        const updates = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",");
          if (values.length >= 7) {
            const codLoja = parseInt(values[0]);
            const qtdeToken = parseInt(values[3]) || 0;
            const stToken = values[6] === "Ativo" ? 1 : 0;
            updates.push({
              cod_loja: codLoja,
              qtde_token: qtdeToken,
              st_token: stToken
            });
          }
        }
        for (const update of updates) {
          await supabase.from("cadastro_loja").update({
            qtde_token: update.qtde_token,
            st_token: update.st_token
          }).eq("cod_loja", update.cod_loja);
        }
        await fetchLojas();
        toast({
          title: "Sucesso",
          description: "Dados importados com sucesso"
        });
      } catch (error) {
        console.error("Erro ao importar CSV:", error);
        toast({
          title: "Erro",
          description: "Erro ao importar arquivo CSV",
          variant: "destructive"
        });
      }
    };
    input.click();
  };
  return <div className="w-full h-full p-6">
      <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Token Loja
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleImportCSV}>
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
                <th className="text-left p-3 w-20 text-sm font-medium">Código</th>
                <th className="text-left p-3 w-1/4 text-sm font-medium">Loja</th>
                <th className="text-left p-3 w-20 text-sm font-medium">Estado</th>
                <th className="text-left p-3 w-32 text-sm font-medium">Qtde Token</th>
                <th className="text-left p-3 w-32 text-sm font-medium">Meta Loja</th>
                <th className="text-left p-3 w-32 text-sm font-medium">DRE Loja</th>
                <th className="text-left p-3 w-24 text-sm font-medium">Status Token</th>
                <th className="text-left p-3 w-20 text-sm font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {lojas.map(loja => <tr key={loja.cod_loja} className={`border-b hover:bg-gray-50 ${editedRows.has(loja.cod_loja) ? 'bg-yellow-50' : ''}`}>
                  <td className="p-3 font-medium text-sm">{loja.cod_loja}</td>
                  <td className="p-3">
                    <div className="text-sm truncate" title={loja.loja}>
                      {loja.loja}
                    </div>
                  </td>
                  <td className="p-3 text-sm">{loja.estado}</td>
                  <td className="p-3">
                    <div className="space-y-2">
                      <Input type="number" min="0" value={loja.qtde_token || 0} onChange={e => handleQtdeTokenChange(loja.cod_loja, parseInt(e.target.value) || 0)} className="w-full text-sm h-8" />
                      <div className="text-xs text-muted-foreground">
                        {loja.tokensTotal} / {loja.tokensUtilizados} / {loja.tokensRestantes}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Total / Usado / Restante
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge variant={loja.meta_loja === 1 ? "default" : "destructive"} className={loja.meta_loja === 1 ? "bg-green-100 text-green-800 hover:bg-green-200 text-xs px-2" : "bg-red-100 text-red-800 hover:bg-red-200 text-xs px-2"}>
                      {loja.meta_loja === 1 ? "Regular" : "Irregular"}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Badge variant={loja.dre_negativo === 1 ? "default" : "destructive"} className={loja.dre_negativo === 1 ? "bg-green-100 text-green-800 hover:bg-green-200 text-xs px-2" : "bg-red-100 text-red-800 hover:bg-red-200 text-xs px-2"}>
                      {loja.dre_negativo === 1 ? "Regular" : "Irregular"}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Switch checked={loja.st_token === 1} onCheckedChange={checked => handleStatusToggle(loja.cod_loja, checked)} />
                  </td>
                  <td className="p-3">
                    <Button size="sm" onClick={() => handleSave(loja.cod_loja)} disabled={!editedRows.has(loja.cod_loja)} className="text-xs h-8">
                      Salvar
                    </Button>
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
    </div>;
}