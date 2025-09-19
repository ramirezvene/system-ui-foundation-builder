
import { useState, useMemo } from "react"
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

type Estado = Tables<"cadastro_estado">

interface EstadoComboboxProps {
  estados: Estado[]
  selectedEstado: Estado | null
  onEstadoChange: (estado: Estado | null) => void
  placeholder?: string
  disabled?: boolean
}

export function EstadoCombobox({
  estados,
  selectedEstado,
  onEstadoChange,
  placeholder = "Selecionar estado...",
  disabled = false
}: EstadoComboboxProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  const filteredAndSortedEstados = useMemo(() => {
    if (!searchValue) {
      return estados.sort((a, b) => a.estado.localeCompare(b.estado))
    }

    const filtered = estados.filter((estado) => {
      const searchTerm = searchValue.toLowerCase()
      return (
        estado.estado.toLowerCase().includes(searchTerm) ||
        estado.nome_estado.toLowerCase().includes(searchTerm)
      )
    })

    return filtered.sort((a, b) => a.estado.localeCompare(b.estado))
  }, [estados, searchValue])

  return (
    <Popover open={open} onOpenChange={disabled ? () => {} : setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between truncate"
          disabled={disabled}
        >
          {selectedEstado
            ? `${selectedEstado.estado} - ${selectedEstado.nome_estado}`
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Buscar estado..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>Nenhum estado encontrado.</CommandEmpty>
            <CommandGroup>
              {filteredAndSortedEstados.map((estado) => (
                <CommandItem
                  key={estado.id}
                  value={`${estado.estado} ${estado.nome_estado}`}
                  onSelect={() => {
                    onEstadoChange(estado.id === selectedEstado?.id ? null : estado)
                    setOpen(false)
                    setSearchValue("")
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedEstado?.id === estado.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {estado.estado} - {estado.nome_estado}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
