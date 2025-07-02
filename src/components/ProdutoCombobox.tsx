
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
  id_produto: number
  nome_produto: string
  subgrupo_id: number | null
  ncm: string | null
  alcada: number | null
  aliq_rs: number | null
  aliq_sc: number | null
  aliq_pr: number | null
  piscofins: number | null
  observacao: string | null
  pmc_rs: number | null
  pmc_sc: number | null
  pmc_pr: number | null
  cmg_rs: number | null
  cmg_sc: number | null
  cmg_pr: number | null
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
            ? `${selectedProduto.id_produto} - ${selectedProduto.nome_produto}`
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
                  key={produto.id_produto}
                  value={`${produto.id_produto} ${produto.nome_produto}`}
                  onSelect={() => {
                    onProdutoChange(produto.id_produto === selectedProduto?.id_produto ? null : produto)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedProduto?.id_produto === produto.id_produto ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {produto.id_produto} - {produto.nome_produto}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
