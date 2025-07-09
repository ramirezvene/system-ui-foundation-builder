
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
    const formatPercentage = (value: string) => {
      // Remove tudo que não for número ou vírgula
      const numbers = value.replace(/[^\d,]/g, '')
      
      if (!numbers) return ''
      
      // Se tem vírgula, separa a parte inteira da decimal
      const parts = numbers.split(',')
      let integerPart = parts[0]
      let decimalPart = parts[1] || ''
      
      // Limita a 2 casas decimais
      if (decimalPart.length > 2) {
        decimalPart = decimalPart.substring(0, 2)
      }
      
      // Monta o resultado
      let result = integerPart
      if (parts.length > 1 || numbers.includes(',')) {
        result += ',' + decimalPart
      }
      
      return result + '%'
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace('%', '')
      const formatted = formatPercentage(rawValue)
      onChange(formatted)
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
