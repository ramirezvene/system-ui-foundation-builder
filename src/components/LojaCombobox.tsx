import { useState, useEffect, useMemo } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tables } from "@/integrations/supabase/types";
type Loja = Tables<"cadastro_loja">;
interface LojaComboboxProps {
  lojas: Loja[];
  selectedLoja: Loja | null;
  onLojaChange: (loja: Loja | null) => void;
  placeholder?: string;
  disabled?: boolean;
}
export function LojaCombobox({
  lojas,
  selectedLoja,
  onLojaChange,
  placeholder = "Selecione uma loja",
  disabled = false
}: LojaComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  useEffect(() => {
    if (selectedLoja) {
      setSearchValue(`${selectedLoja.cod_loja} - ${selectedLoja.loja} - ${selectedLoja.estado}`);
    } else {
      setSearchValue("");
    }
  }, [selectedLoja]);
  const filteredAndSortedLojas = useMemo(() => {
    if (!searchValue && !open) {
      return lojas.sort((a, b) => a.cod_loja - b.cod_loja);
    }
    const searchTerm = open ? searchValue.toLowerCase() : "";
    if (!searchTerm) {
      return lojas.sort((a, b) => a.cod_loja - b.cod_loja);
    }
    const filtered = lojas.filter(loja => {
      return loja.cod_loja.toString().includes(searchTerm) || loja.loja.toLowerCase().includes(searchTerm) || loja.estado.toLowerCase().includes(searchTerm);
    });

    // Ordenar com prioridade para matches que começam com o termo de busca
    return filtered.sort((a, b) => {
      const aCodStr = a.cod_loja.toString();
      const bCodStr = b.cod_loja.toString();
      const aLojaStr = a.loja.toLowerCase();
      const bLojaStr = b.loja.toLowerCase();

      // Prioridade 1: Código que começa com o termo de busca
      const aCodStartsWith = aCodStr.startsWith(searchTerm);
      const bCodStartsWith = bCodStr.startsWith(searchTerm);
      if (aCodStartsWith && !bCodStartsWith) return -1;
      if (!aCodStartsWith && bCodStartsWith) return 1;

      // Prioridade 2: Nome da loja que começa com o termo de busca
      const aLojaStartsWith = aLojaStr.startsWith(searchTerm);
      const bLojaStartsWith = bLojaStr.startsWith(searchTerm);
      if (aLojaStartsWith && !bLojaStartsWith) return -1;
      if (!aLojaStartsWith && bLojaStartsWith) return 1;

      // Ordenação final por código crescente
      return a.cod_loja - b.cod_loja;
    });
  }, [lojas, searchValue, open]);
  const handleSelect = (loja: Loja) => {
    onLojaChange(loja);
    setOpen(false);
  };
  const handleClear = () => {
    onLojaChange(null);
    setSearchValue("");
    setOpen(false);
  };
  const handleOpenChange = (newOpen: boolean) => {
    if (disabled) return;
    setOpen(newOpen);
    if (!newOpen && !selectedLoja) {
      setSearchValue("");
    }
  };
  return <div className="flex gap-2">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} disabled={disabled} title={selectedLoja ? `${selectedLoja.cod_loja} - ${selectedLoja.loja} - ${selectedLoja.estado}` : placeholder} className="flex-1 justify-between min-w-[130px] w-full">
            <span className="truncate">
              {selectedLoja ? `${selectedLoja.cod_loja} - ${selectedLoja.loja} - ${selectedLoja.estado}` : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command shouldFilter={false}>
            <CommandInput placeholder="Buscar por código ou nome da loja..." value={open ? searchValue : ""} onValueChange={setSearchValue} />
            <CommandList>
              <CommandEmpty>Nenhuma loja encontrada.</CommandEmpty>
              <CommandGroup>
                {filteredAndSortedLojas.map(loja => <CommandItem key={loja.cod_loja} value={`${loja.cod_loja} - ${loja.loja} - ${loja.estado}`} onSelect={() => handleSelect(loja)}>
                    <Check className={cn("mr-2 h-4 w-4", selectedLoja?.cod_loja === loja.cod_loja ? "opacity-100" : "opacity-0")} />
                    {loja.cod_loja} - {loja.loja} - {loja.estado}
                  </CommandItem>)}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
    </div>;
}