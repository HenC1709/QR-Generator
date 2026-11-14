import { useRef } from 'react'

interface LinkFieldProps {
  value: string
  onChange: (value: string) => void
  /** id del elemento que explica el estado del campo (mensaje de error o ayuda). */
  describedBy?: string
  invalid?: boolean
}

export function LinkField({ value, onChange, describedBy, invalid = false }: LinkFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const canPaste = typeof navigator.clipboard?.readText === 'function'

  async function paste() {
    try {
      const text = (await navigator.clipboard.readText()).trim()
      if (text) {
        onChange(text)
        return
      }
    } catch {
      // el navegador no dejó leer el portapapeles
    }
    // plan B: dejar el cursor en el campo para pegar con Ctrl+V
    inputRef.current?.focus()
  }

  function clear() {
    onChange('')
    inputRef.current?.focus()
  }

  return (
    <div>
      <label className="label" htmlFor="link">
        Link de tu perfil, publicación o página
      </label>
      <div className="field">
        <input
          ref={inputRef}
          id="link"
          type="text"
          inputMode="url"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="instagram.com/tu_usuario"
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {value ? (
          <button type="button" className="field-btn" onClick={clear}>
            Borrar
          </button>
        ) : (
          canPaste && (
            <button type="button" className="field-btn" onClick={paste}>
              Pegar
            </button>
          )
        )}
      </div>
    </div>
  )
}
