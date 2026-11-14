/**
 * Utilidades de color. Son funciones puras (sin React ni DOM) para poder probarlas fácil.
 * El contraste importa porque un QR solo se lee bien si los módulos se distinguen del fondo.
 */

export type Rgb = readonly [number, number, number]

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i

/** Convierte "#abc" o "#aabbcc" en [r, g, b]. Devuelve null si no es un color válido. */
export function parseHex(input: string): Rgb | null {
  const match = HEX.exec(input.trim())
  if (!match) return null
  const digits = match[1].length === 3 ? [...match[1]].map((c) => c + c).join('') : match[1]
  const n = Number.parseInt(digits, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function toHex(rgb: Rgb): string {
  return `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`
}

function channel(value: number): number {
  const s = value / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

/** Luminancia relativa según WCAG: 0 es negro y 1 es blanco. */
export function luminance([r, g, b]: Rgb): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** Contraste entre dos colores hex: 1 si son iguales, 21 para negro sobre blanco. */
export function contrastRatio(a: string, b: string): number {
  const ra = parseHex(a)
  const rb = parseHex(b)
  if (!ra || !rb) return 1
  const la = luminance(ra)
  const lb = luminance(rb)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** true si el QR es más claro que su fondo. Muchos lectores esperan módulos oscuros. */
export function isInverted(fg: string, bg: string): boolean {
  const f = parseHex(fg)
  const b = parseHex(bg)
  if (!f || !b) return false
  return luminance(f) > luminance(b)
}

function mix(from: Rgb, to: Rgb, t: number): Rgb {
  return [
    from[0] + (to[0] - from[0]) * t,
    from[1] + (to[1] - from[1]) * t,
    from[2] + (to[2] - from[2]) * t,
  ]
}

/**
 * Ajusta `fg` lo mínimo necesario para que contraste con `bg`.
 * Si el color es más oscuro que el fondo lo oscurece; si es más claro, lo aclara.
 * Sirve para que el "color de la red" (que a veces es muy claro) siga siendo escaneable.
 */
export function ensureContrast(fg: string, bg: string, min = 4.5): string {
  const f = parseHex(fg)
  const b = parseHex(bg)
  if (!f || !b) return fg
  if (contrastRatio(fg, bg) >= min) return toHex(f)

  const target: Rgb = luminance(f) <= luminance(b) ? [0, 0, 0] : [255, 255, 255]
  for (let step = 1; step <= 20; step++) {
    const candidate = toHex(mix(f, target, step / 20))
    if (contrastRatio(candidate, bg) >= min) return candidate
  }
  return toHex(target)
}
