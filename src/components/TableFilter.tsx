import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X, Filter } from "lucide-react"
import { FilterCombobox } from "./FilterCombobox"

interface FilterOption {
  value: string
  label: string
}

interface TableFilterProps {
  filterOptions: FilterOption[]
  onFilterChange: (field: string, value: string) => void
  onClearFilters: () => void
  activeFilters: Record<string, string>
}

export function TableFilter({ 
  filterOptions, 
  onFilterChange, 
  onClearFilters, 
  activeFilters 
}: TableFilterProps) {
  const [selectedFilter, setSelectedFilter] = useState("")
  const [filterValue, setFilterValue] = useState("")

  const handleApplyFilter = () => {
    if (selectedFilter && filterValue.trim()) {
      onFilterChange(selectedFilter, filterValue.trim())
      setFilterValue("")
      setSelectedFilter("")
    }
  }

  const handleClearAll = () => {
    onClearFilters()
    setFilterValue("")
    setSelectedFilter("")
  }

  const removeFilter = (field: string) => {
    onFilterChange(field, "")
  }

  const hasActiveFilters = Object.keys(activeFilters).some(key => activeFilters[key])

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium">Filtros da Tabela</span>
      </div>
      
      <div className="flex gap-2">
        <div className="flex-1">
          <FilterCombobox
            selectedFilter={selectedFilter}
            onSelectFilter={setSelectedFilter}
            filterOptions={filterOptions}
          />
        </div>
        <Input
          placeholder="Digite o valor do filtro..."
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
          className="flex-1"
          onKeyPress={(e) => e.key === 'Enter' && handleApplyFilter()}
        />
        <Button onClick={handleApplyFilter} disabled={!selectedFilter || !filterValue.trim()}>
          Aplicar
        </Button>
        {hasActiveFilters && (
          <Button variant="outline" onClick={handleClearAll}>
            <X className="w-4 h-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">Filtros ativos:</span>
          {Object.entries(activeFilters).map(([field, value]) => 
            value && (
              <div key={field} className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded text-sm">
                <span className="font-medium">
                  {filterOptions.find(opt => opt.value === field)?.label || field}:
                </span>
                <span>{value}</span>
                <button 
                  onClick={() => removeFilter(field)}
                  className="ml-1 hover:bg-primary/20 rounded p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}