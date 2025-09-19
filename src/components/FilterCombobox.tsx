
"use client"

import * as React from "react"
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

interface FilterOption {
  value: string
  label: string
}

interface FilterComboboxProps {
  selectedFilter: string
  onSelectFilter: (filter: string) => void
  filterOptions?: FilterOption[]
}

const defaultFilterOptions = [
  { value: "cod_subgrupo", label: "ID" },
  { value: "nome_subgrupo", label: "Descrição" },
  { value: "condicao", label: "Condição" },
  { value: "margem", label: "Montante" },
  { value: "data_inicio", label: "Data Início" },
  { value: "data_fim", label: "Data Fim" },
]

export function FilterCombobox({ selectedFilter, onSelectFilter, filterOptions = defaultFilterOptions }: FilterComboboxProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedFilter
            ? filterOptions.find((option) => option.value === selectedFilter)?.label
            : "Selecione Filtros"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Buscar filtro..." />
          <CommandList>
            <CommandEmpty>Nenhum filtro encontrado.</CommandEmpty>
            <CommandGroup>
              {filterOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onSelectFilter(currentValue === selectedFilter ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedFilter === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
