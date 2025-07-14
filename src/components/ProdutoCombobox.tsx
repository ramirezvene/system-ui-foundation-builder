
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

interface ProdutoComboboxProps {
  produtos: Tables<"cadastro_produto">[]
  selectedProduto: Tables<"cadastro_produto"> | null
  onProdutoChange: (produto: Tables<"cadastro_produto"> | null) => void
  placeholder?: string
}

export function ProdutoCombobox({
  produtos,
  selectedProduto,
  onProdutoChange,
  placeholder = "Selecionar produto..."
}: ProdutoComboboxProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  const filteredAndSortedProdutos = useMemo(() => {
    if (!searchValue) {
      return produtos.sort((a, b) => a.id_produto - b.id_produto)
    }

    const filtered = produtos.filter((produto) => {
      const searchTerm = searchValue.toLowerCase()
      return (
        produto.id_produto.toString().includes(searchTerm) ||
        produto.nome_produto.toLowerCase().includes(searchTerm)
      )
    })

    // Ordenar com prioridade para matches que começam com o termo de busca
    return filtered.sort((a, b) => {
      const searchTerm = searchValue.toLowerCase()
      const aIdStr = a.id_produto.toString()
      const bIdStr = b.id_produto.toString()
      const aNameStr = a.nome_produto.toLowerCase()
      const bNameStr = b.nome_produto.toLowerCase()

      // Prioridade 1: ID que começa com o termo de busca
      const aIdStartsWith = aIdStr.startsWith(searchTerm)
      const bIdStartsWith = bIdStr.startsWith(searchTerm)
      
      if (aIdStartsWith && !bIdStartsWith) return -1
      if (!aIdStartsWith && bIdStartsWith) return 1
      
      // Prioridade 2: Nome que começa com o termo de busca
      const aNameStartsWith = aNameStr.startsWith(searchTerm)
      const bNameStartsWith = bNameStr.startsWith(searchTerm)
      
      if (aNameStartsWith && !bNameStartsWith) return -1
      if (!aNameStartsWith && bNameStartsWith) return 1
      
      // Ordenação final por ID crescente
      return a.id_produto - b.id_produto
    })
  }, [produtos, searchValue])

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
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Buscar produto..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
            <CommandGroup>
              {filteredAndSortedProdutos.map((produto) => (
                <CommandItem
                  key={produto.id_produto}
                  value={`${produto.id_produto} ${produto.nome_produto}`}
                  onSelect={() => {
                    onProdutoChange(produto.id_produto === selectedProduto?.id_produto ? null : produto)
                    setOpen(false)
                    setSearchValue("")
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
