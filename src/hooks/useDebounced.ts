import { useEffect, useState } from 'react'

/** Devuelve `value` pero solo después de que deje de cambiar durante `delay` milisegundos. */
export function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
