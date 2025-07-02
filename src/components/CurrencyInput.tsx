
import { Input } from "@/components/ui/input"
import { forwardRef } from "react"

interface CurrencyInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, placeholder = "R$ 0,00", className, disabled }, ref) => {
    const formatCurrency = (value: string) => {
      // Remove tudo que não for número
      const numbers = value.replace(/\D/g, '')
      
      if (!numbers) return ''
      
      // Converte para número com 2 casas decimais
      const amount = parseInt(numbers) / 100
      
      // Formata como moeda brasileira
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2
      }).format(amount)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatCurrency(e.target.value)
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

CurrencyInput.displayName = "CurrencyInput"
