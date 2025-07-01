
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

interface Produto {
  cod_prod: number
  produto: string
  cod_grupo: number
  grupo: string
  ncm: string
  pmc_rs: number
  pmc_sc: number
  pmc_pr: number
  sugerido_rs: number
  sugerido_sc: number
  sugerido_pr: number
}

interface ProdutoComboboxProps {
  produtos: Produto[]
  selectedProduto: Produto | null
  onProdutoChange: (produto: Produto | null) => void
  placeholder?: string
}

export function ProdutoCombobox({ produtos, selectedProduto, onProdutoChange, placeholder = "Selecione um produto" }: ProdutoComboboxProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")

  useEffect(() => {
    if (selectedProduto) {
      setInputValue(`${selectedProduto.cod_prod} - ${selectedProduto.produto}`)
    } else {
      setInputValue("")
    }
  }, [selectedProduto])

  const filteredProdutos = produtos.filter(produto => {
    const searchTerm = inputValue.toLowerCase()
    return (
      produto.cod_prod.toString().includes(searchTerm) ||
      produto.produto.toLowerCase().includes(searchTerm)
    )
  })

  const handleSelect = (produto: Produto) => {
    onProdutoChange(produto)
    setOpen(false)
  }

  const handleClear = () => {
    onProdutoChange(null)
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
          {selectedProduto
            ? `${selectedProduto.cod_prod} - ${selectedProduto.produto}`
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput 
            placeholder="Buscar por código ou nome do produto..."
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
            <CommandGroup>
              {inputValue && (
                <CommandItem onSelect={handleClear}>
                  <span className="text-muted-foreground">Limpar seleção</span>
                </CommandItem>
              )}
              {filteredProdutos.map((produto) => (
                <CommandItem
                  key={produto.cod_prod}
                  value={`${produto.cod_prod} - ${produto.produto}`}
                  onSelect={() => handleSelect(produto)}
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
