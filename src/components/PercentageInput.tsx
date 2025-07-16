
import { Input } from "@/components/ui/input"
import { forwardRef, useState, useEffect } from "react"

interface PercentageInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export const PercentageInput = forwardRef<HTMLInputElement, PercentageInputProps>(
  ({ value, onChange, placeholder = "0,00%", className, disabled }, ref) => {
    const [internalValue, setInternalValue] = useState("")
    const [isFocused, setIsFocused] = useState(false)

    useEffect(() => {
      if (!isFocused) {
        // Quando não está focado, mostra o valor formatado
        setInternalValue(value)
      }
    }, [value, isFocused])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value
      
      // Remove o símbolo % se existir
      inputValue = inputValue.replace('%', '')
      
      // Permite apenas números, vírgulas e pontos
      inputValue = inputValue.replace(/[^\d,\.]/g, '')
      
      // Substitui ponto por vírgula para padronização brasileira
      inputValue = inputValue.replace(/\./g, ',')
      
      // Garante apenas uma vírgula
      const parts = inputValue.split(',')
      if (parts.length > 2) {
        inputValue = parts[0] + ',' + parts.slice(1).join('')
      }
      
      // Limita a 2 casas decimais após a vírgula
      if (parts.length === 2 && parts[1].length > 2) {
        inputValue = parts[0] + ',' + parts[1].substring(0, 2)
      }
      
      // Atualiza o valor interno durante a digitação
      setInternalValue(inputValue)
      
      // Adiciona o símbolo % no final apenas para o callback
      const formattedValue = inputValue ? inputValue + '%' : ''
      onChange(formattedValue)
    }

    const handleFocus = () => {
      setIsFocused(true)
      // Remove o % para facilitar a edição
      const cleanValue = value.replace('%', '')
      setInternalValue(cleanValue)
    }

    const handleBlur = () => {
      setIsFocused(false)
      // Formata o valor final quando perde o foco
      if (internalValue) {
        const formattedValue = internalValue + '%'
        setInternalValue(formattedValue)
      }
    }

    return (
      <Input
        ref={ref}
        type="text"
        value={internalValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
      />
    )
  }
)

PercentageInput.displayName = "PercentageInput"
