
import { useState } from "react"
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

interface Produto {
  cod_prod: number
  produto: string
  cod_grupo: number | null
  grupo: string | null
  ncm: number | null
  pmc_rs: number | null
  pmc_sc: number | null
  pmc_pr: number | null
  sugerido_rs: number | null
  sugerido_sc: number | null
  sugerido_pr: number | null
}

interface ProdutoComboboxProps {
  produtos: Produto[]
  selectedProduto: Produto | null
  onProdutoChange: (produto: Produto | null) => void
  placeholder?: string
}

export function ProdutoCombobox({
  produtos,
  selectedProduto,
  onProdutoChange,
  placeholder = "Selecionar produto..."
}: ProdutoComboboxProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedProduto
            ? `${selectedProduto.cod_prod} - ${selectedProduto.produto}`
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Buscar produto..." />
          <CommandList>
            <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
            <CommandGroup>
              {produtos.map((produto) => (
                <CommandItem
                  key={produto.cod_prod}
                  value={`${produto.cod_prod} ${produto.produto}`}
                  onSelect={() => {
                    onProdutoChange(produto.cod_prod === selectedProduto?.cod_prod ? null : produto)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedProduto?.cod_prod === produto.cod_prod ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {produto.cod_prod} - {produto.produto}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
