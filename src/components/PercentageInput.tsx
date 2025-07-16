
import { Input } from "@/components/ui/input"
import { forwardRef } from "react"

interface PercentageInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export const PercentageInput = forwardRef<HTMLInputElement, PercentageInputProps>(
  ({ value, onChange, placeholder = "0,00%", className, disabled }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value
      
      // Remove o símbolo % se existir
      inputValue = inputValue.replace('%', '')
      
      // Permite apenas números, vírgulas e pontos
      inputValue = inputValue.replace(/[^\d,\.]/g, '')
      
      // Substitui ponto por vírgula para padronização brasileira
      inputValue = inputValue.replace('.', ',')
      
      // Garante apenas uma vírgula
      const parts = inputValue.split(',')
      if (parts.length > 2) {
        inputValue = parts[0] + ',' + parts.slice(1).join('')
      }
      
      // Limita a 2 casas decimais após a vírgula
      if (parts.length === 2 && parts[1].length > 2) {
        inputValue = parts[0] + ',' + parts[1].substring(0, 2)
      }
      
      // Adiciona o símbolo % no final
      const formattedValue = inputValue ? inputValue + '%' : ''
      
      onChange(formattedValue)
    }

    return (
      <Input
        ref={ref}
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
      />
    )
  }
)

PercentageInput.displayName = "PercentageInput"
