import { useId } from 'react'

interface Option<T> {
  value: T
  label: string
}

interface SegmentedProps<T extends string | number> {
  label: string
  value: T
  options: readonly Option<T>[]
  onChange: (value: T) => void
  disabled?: boolean
}

/** Grupo de opciones tipo "píldora". Usa radios nativos, así que funciona con teclado y lector de pantalla. */
export function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: SegmentedProps<T>) {
  const id = useId()

  return (
    <div>
      <p className="control-title" id={`${id}-title`}>
        {label}
      </p>
      <div className="seg" role="radiogroup" aria-labelledby={`${id}-title`}>
        {options.map((option) => (
          <label key={option.value}>
            <input
              type="radio"
              name={id}
              value={option.value}
              checked={option.value === value}
              disabled={disabled}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
