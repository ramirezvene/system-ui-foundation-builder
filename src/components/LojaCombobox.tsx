
import { useState, useEffect } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Tables } from "@/integrations/supabase/types"

type Loja = Tables<"cadastro_loja">

interface LojaComboboxProps {
  lojas: Loja[]
  selectedLoja: Loja | null
  onLojaChange: (loja: Loja | null) => void
  placeholder?: string
}

export function LojaCombobox({ lojas, selectedLoja, onLojaChange, placeholder = "Selecione uma loja" }: LojaComboboxProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")

  useEffect(() => {
    if (selectedLoja) {
      setInputValue(`${selectedLoja.cod_loja} - ${selectedLoja.loja} - ${selectedLoja.estado}`)
    } else {
      setInputValue("")
    }
  }, [selectedLoja])

  const filteredLojas = lojas.filter(loja => {
    const searchTerm = inputValue.toLowerCase()
    return (
      loja.cod_loja.toString().includes(searchTerm) ||
      loja.loja.toLowerCase().includes(searchTerm)
    )
  })

  const handleSelect = (loja: Loja) => {
    onLojaChange(loja)
    setOpen(false)
  }

  const handleClear = () => {
    onLojaChange(null)
    setInputValue("")
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedLoja
            ? `${selectedLoja.cod_loja} - ${selectedLoja.loja} - ${selectedLoja.estado}`
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput 
            placeholder="Buscar por código ou nome da loja..."
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty>Nenhuma loja encontrada.</CommandEmpty>
            <CommandGroup>
              {inputValue && (
                <CommandItem onSelect={handleClear}>
                  <span className="text-muted-foreground">Limpar seleção</span>
                </CommandItem>
              )}
              {filteredLojas.map((loja) => (
                <CommandItem
                  key={loja.cod_loja}
                  value={`${loja.cod_loja} - ${loja.loja} - ${loja.estado}`}
                  onSelect={() => handleSelect(loja)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedLoja?.cod_loja === loja.cod_loja ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {loja.cod_loja} - {loja.loja} - {loja.estado}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
