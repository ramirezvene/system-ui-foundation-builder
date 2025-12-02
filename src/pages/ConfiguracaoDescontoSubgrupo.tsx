import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Download, Upload, Plus, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { PercentageInput } from "@/components/PercentageInput";
import { AddSubgrupoMargemDialog } from "@/components/AddSubgrupoMargemDialog";
import { TableFilter } from "@/components/TableFilter";
type SubgrupoMargem = Tables<"subgrupo_margem">;
export default function ConfiguracaoDescontoSubgrupo() {
  const [subgrupos, setSubgrupos] = useState<SubgrupoMargem[]>([]);
  const [filteredSubgrupos, setFilteredSubgrupos] = useState<SubgrupoMargem[]>([]);
  const [editedRows, setEditedRows] = useState<Set<number>>(new Set());
  const [observacaoDialogs, setObservacaoDialogs] = useState<Set<number>>(new Set());
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const {
    toast
  } = useToast();
  useEffect(() => {
    fetchData();
  }, []);
  const fetchData = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from("subgrupo_margem").select("*").order("cod_subgrupo");
      if (error) throw error;
      setSubgrupos(data || []);
      setFilteredSubgrupos(data || []);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive"
      });
    }
  };
  const handleFieldChange = (cod_subgrupo: number, field: keyof SubgrupoMargem, value: any) => {
    setSubgrupos(prev => prev.map(item => item.cod_subgrupo === cod_subgrupo ? {
      ...item,
      [field]: value
    } : item));
    setEditedRows(prev => new Set(prev).add(cod_subgrupo));
  };
  const handleMargemChange = (cod_subgrupo: number, value: string) => {
    // Remove o símbolo % e converte vírgula para ponto
    const cleanValue = value.replace('%', '').replace(',', '.');
    const numericValue = parseFloat(cleanValue) || 0;
    console.log(`Alterando margem do subgrupo ${cod_subgrupo} de "${value}" para:`, numericValue);
    setSubgrupos(prev => prev.map(item => item.cod_subgrupo === cod_subgrupo ? {
      ...item,
      margem: numericValue
    } : item));
    setEditedRows(prev => new Set(prev).add(cod_subgrupo));
  };
  const handleMargemAdcChange = (cod_subgrupo: number, value: string) => {
    // Remove o símbolo % e converte vírgula para ponto
    const cleanValue = value.replace('%', '').replace(',', '.');
    const numericValue = parseFloat(cleanValue) || 0;
    console.log(`Alterando margem adc do subgrupo ${cod_subgrupo} de "${value}" para:`, numericValue);
    setSubgrupos(prev => prev.map(item => item.cod_subgrupo === cod_subgrupo ? {
      ...item,
      margem_adc: numericValue
    } : item));
    setEditedRows(prev => new Set(prev).add(cod_subgrupo));
  };
  const handleDescontoChange = (cod_subgrupo: number, value: string) => {
    // Remove o símbolo % e converte vírgula para ponto
    const cleanValue = value.replace('%', '').replace(',', '.');
    const numericValue = parseFloat(cleanValue) || 0;
    console.log(`Alterando desconto do subgrupo ${cod_subgrupo} de "${value}" para:`, numericValue);
    setSubgrupos(prev => prev.map(item => item.cod_subgrupo === cod_subgrupo ? {
      ...item,
      desconto: numericValue
    } : item));
    setEditedRows(prev => new Set(prev).add(cod_subgrupo));
  };
  const formatValueForDisplay = (value: number | null) => {
    if (value === null || value === undefined) return '';
    return value.toFixed(2).replace('.', ',') + '%';
  };
  const handleSave = async (cod_subgrupo: number) => {
    const item = subgrupos.find(p => p.cod_subgrupo === cod_subgrupo);
    if (!item) return;
    try {
      const {
        error
      } = await supabase.from("subgrupo_margem").update({
        nome_subgrupo: item.nome_subgrupo,
        margem: item.margem,
        margem_adc: item.margem_adc,
        desconto: item.desconto,
        
        qtde_max: item.qtde_max,
        data_inicio: item.data_inicio,
        data_fim: item.data_fim,
        st_ativo: item.st_ativo,
        observacao: item.observacao
      }).eq("cod_subgrupo", cod_subgrupo);
      if (error) throw error;
      setEditedRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(cod_subgrupo);
        return newSet;
      });
      toast({
        title: "Sucesso",
        description: "Registro salvo com sucesso"
      });
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar registro",
        variant: "destructive"
      });
    }
  };
  const handleExportCSV = () => {
    const csvContent = [["Cód Subgrupo", "Nome Subgrupo", "Qtde Max", "Margem", "Margem Adc", "% Desc", "Data Início", "Data Fim", "Ativo", "Observação"], ...subgrupos.map(item => [item.cod_subgrupo, item.nome_subgrupo, item.qtde_max, item.margem, item.margem_adc, item.desconto, item.data_inicio, item.data_fim, item.st_ativo === 1 ? 'Ativo' : 'Inativo', item.observacao])].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;"
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "desconto_subgrupos.csv");
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
      setPendingImportFile(file);
      setImportConfirmOpen(true);
    };
    input.click();
  };

  const handleConfirmImport = async () => {
    if (!pendingImportFile) return;
    
    const text = await pendingImportFile.text();
    const lines = text.split("\n");
    try {
      const updates = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",");
        if (values.length >= 10) {
          const cod_subgrupo = parseInt(values[0]);
          if (!isNaN(cod_subgrupo)) {
            updates.push({
              cod_subgrupo: cod_subgrupo,
              qtde_min: parseInt(values[2]) || 0,
              qtde_max: parseInt(values[2]) || 0,
              margem: parseFloat(values[3]) || 0,
              margem_adc: values[4] ? parseFloat(values[4]) : null,
              desconto: values[5] ? parseFloat(values[5]) : null,
              data_inicio: values[6],
              data_fim: values[7],
              st_ativo: values[8] === "Ativo" ? 1 : 0,
              observacao: values[9] || null
            });
          }
        }
      }
      for (const update of updates) {
        await supabase.from("subgrupo_margem").update({
          qtde_min: update.qtde_min,
          qtde_max: update.qtde_max,
          margem: update.margem,
          margem_adc: update.margem_adc,
          desconto: update.desconto,
          data_inicio: update.data_inicio,
          data_fim: update.data_fim,
          st_ativo: update.st_ativo,
          observacao: update.observacao
        }).eq("cod_subgrupo", update.cod_subgrupo);
      }
      await fetchData();
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
    } finally {
      setImportConfirmOpen(false);
      setPendingImportFile(null);
    }
  };

  const handleCancelImport = () => {
    setImportConfirmOpen(false);
    setPendingImportFile(null);
  };
  const toggleObservacaoDialog = (cod_subgrupo: number) => {
    setObservacaoDialogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cod_subgrupo)) {
        newSet.delete(cod_subgrupo);
      } else {
        newSet.add(cod_subgrupo);
      }
      return newSet;
    });
  };
  const isFieldEditable = (subgrupo: SubgrupoMargem) => {
    return subgrupo.st_ativo === 1;
  };
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const getMaxCodSubgrupo = () => {
    if (subgrupos.length === 0) return 1;
    return Math.max(...subgrupos.map(sub => sub.cod_subgrupo)) + 1;
  };

  const filterOptions = [
    { value: "cod_subgrupo", label: "Cód Subgrupo" },
    { value: "nome_subgrupo", label: "Nome Subgrupo" },
    { value: "qtde_max", label: "Qtde Max" },
    { value: "margem", label: "Margem" },
    { value: "data_inicio", label: "Data Início" },
    { value: "data_fim", label: "Data Fim" },
    { value: "st_ativo", label: "Status" },
  ];

  const applyFilters = (data: SubgrupoMargem[]) => {
    let filtered = [...data];
    
    Object.entries(activeFilters).forEach(([field, value]) => {
      if (value) {
        filtered = filtered.filter(item => {
          const fieldValue = String(item[field as keyof SubgrupoMargem] || '').toLowerCase();
          return fieldValue.includes(value.toLowerCase());
        });
      }
    });
    
    setFilteredSubgrupos(filtered);
  };

  const handleFilterChange = (field: string, value: string) => {
    const newFilters = { ...activeFilters, [field]: value };
    setActiveFilters(newFilters);
    applyFilters(subgrupos);
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    setFilteredSubgrupos(subgrupos);
  };

  useEffect(() => {
    applyFilters(subgrupos);
  }, [activeFilters, subgrupos]);
  return <div className="w-full h-full p-6">
      <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Configuração Desconto Subgrupo
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
      <CardContent className="space-y-4">
        <TableFilter
          filterOptions={filterOptions}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          activeFilters={activeFilters}
        />
        <div className="p-0">
        <div className="w-full">
          <table className="w-full border-collapse table-fixed">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-3 w-20 text-sm font-medium">Cód Subgrupo</th>
                <th className="text-left p-3 w-1/4 text-sm font-medium">Nome Subgrupo</th>
                <th className="text-left p-3 w-20 text-sm font-medium">Qtde Min</th>
                <th className="text-left p-3 w-20 text-sm font-medium">Qtde Max</th>
                <th className="text-left p-3 w-20 text-sm font-medium">Margem</th>
                <th className="text-left p-3 w-20 text-sm font-medium">Margem Adc</th>
                <th className="text-left p-3 w-20 text-sm font-medium">% Desc</th>
                <th className="text-left p-3 w-28 text-sm font-medium">Data Início</th>
                <th className="text-left p-3 w-28 text-sm font-medium">Data Fim</th>
                <th className="text-left p-3 w-16 text-sm font-medium">Ativo</th>
                <th className="text-left p-3 w-20 text-sm font-medium">Obs</th>
                <th className="text-left p-3 w-20 text-sm font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubgrupos.map(subgrupo => <tr key={subgrupo.cod_subgrupo} className={`border-b hover:bg-gray-50 ${editedRows.has(subgrupo.cod_subgrupo) ? 'bg-yellow-50' : ''}`}>
                  <td className="p-3 font-medium text-sm">{subgrupo.cod_subgrupo}</td>
                  <td className="p-3">
                    <Input value={subgrupo.nome_subgrupo} onChange={e => handleFieldChange(subgrupo.cod_subgrupo, 'nome_subgrupo', e.target.value)} className="w-full bg-gray-100 text-sm h-8" disabled={true} readOnly={true} />
                  </td>
                  <td className="p-3">
                    <Input type="number" value={0} onChange={e => {}} className={`w-full text-sm h-8 ${!isFieldEditable(subgrupo) ? 'opacity-60' : ''}`} disabled={!isFieldEditable(subgrupo)} min="0" />
                  </td>
                  <td className="p-3">
                    <Input type="number" value={subgrupo.qtde_max} onChange={e => handleFieldChange(subgrupo.cod_subgrupo, 'qtde_max', parseInt(e.target.value) || 0)} className={`w-full text-sm h-8 ${!isFieldEditable(subgrupo) ? 'opacity-60' : ''}`} disabled={!isFieldEditable(subgrupo)} min="0" />
                  </td>
                  <td className="p-3">
                    <PercentageInput value={formatValueForDisplay(subgrupo.margem)} onChange={value => handleMargemChange(subgrupo.cod_subgrupo, value)} className={`w-full text-sm h-8 ${!isFieldEditable(subgrupo) ? 'opacity-60' : ''}`} disabled={!isFieldEditable(subgrupo)} />
                  </td>
                  <td className="p-3">
                    <PercentageInput value={formatValueForDisplay(subgrupo.margem_adc)} onChange={value => handleMargemAdcChange(subgrupo.cod_subgrupo, value)} className={`w-full text-sm h-8 ${!isFieldEditable(subgrupo) ? 'opacity-60' : ''}`} disabled={!isFieldEditable(subgrupo)} />
                  </td>
                  <td className="p-3">
                    <PercentageInput value={formatValueForDisplay(subgrupo.desconto)} onChange={value => handleDescontoChange(subgrupo.cod_subgrupo, value)} className={`w-full text-sm h-8 ${!isFieldEditable(subgrupo) ? 'opacity-60' : ''}`} disabled={!isFieldEditable(subgrupo)} />
                  </td>
                  <td className="p-3">
                    <Input type="date" value={subgrupo.data_inicio || ''} onChange={e => handleFieldChange(subgrupo.cod_subgrupo, 'data_inicio', e.target.value)} className={`w-full text-sm h-8 ${!isFieldEditable(subgrupo) ? 'opacity-60' : ''}`} disabled={!isFieldEditable(subgrupo)} />
                  </td>
                  <td className="p-3">
                    <Input type="date" value={subgrupo.data_fim || ''} onChange={e => handleFieldChange(subgrupo.cod_subgrupo, 'data_fim', e.target.value)} className={`w-full text-sm h-8 ${!isFieldEditable(subgrupo) ? 'opacity-60' : ''}`} disabled={!isFieldEditable(subgrupo)} />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center space-x-2">
                      <Switch checked={subgrupo.st_ativo === 1} onCheckedChange={checked => handleFieldChange(subgrupo.cod_subgrupo, 'st_ativo', checked ? 1 : 0)} />
                    </div>
                  </td>
                  <td className="p-3">
                    <Dialog open={observacaoDialogs.has(subgrupo.cod_subgrupo)} onOpenChange={() => toggleObservacaoDialog(subgrupo.cod_subgrupo)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md z-50">
                        <DialogHeader>
                          <DialogTitle>Observação - Subgrupo {subgrupo.cod_subgrupo}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Label>Observação</Label>
                          <Textarea value={subgrupo.observacao || ''} onChange={e => handleFieldChange(subgrupo.cod_subgrupo, 'observacao', e.target.value)} placeholder="Digite uma observação específica..." className="min-h-20" />
                        </div>
                      </DialogContent>
                    </Dialog>
                  </td>
                  <td className="p-3">
                    <Button size="sm" onClick={() => handleSave(subgrupo.cod_subgrupo)} disabled={!editedRows.has(subgrupo.cod_subgrupo)} className="text-xs h-8">
                      Salvar
                    </Button>
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
        </div>
      </CardContent>

      <AddSubgrupoMargemDialog onAdd={fetchData} isOpen={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxCodSubgrupo={getMaxCodSubgrupo()} />

      <Dialog open={importConfirmOpen} onOpenChange={setImportConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmação de Importação</DialogTitle>
            <DialogDescription>
              Deseja prosseguir com esta importação do Subgrupo?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCancelImport}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmImport}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
    </div>;
}