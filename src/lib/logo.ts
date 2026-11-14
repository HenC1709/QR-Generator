export interface Logo {
  /** Imagen como data URL: nunca sale del dispositivo. */
  src: string
  /** ancho / alto */
  aspect: number
  name: string
}

export type LogoErrorCode = 'type' | 'size' | 'read'

export const LOGO_ERRORS: Record<LogoErrorCode, string> = {
  type: 'Usa una imagen PNG, JPG, WebP o SVG.',
  size: 'El logo pesa más de 1,5 MB. Prueba con uno más liviano.',
  read: 'No se pudo leer esa imagen. Prueba con otro archivo.',
}

export const MAX_LOGO_BYTES = 1_500_000
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']

export class LogoError extends Error {
  readonly code: LogoErrorCode

  constructor(code: LogoErrorCode) {
    super(LOGO_ERRORS[code])
    this.code = code
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () =>
      typeof reader.result === 'string' ? resolve(reader.result) : reject(new LogoError('read'))
    reader.onerror = () => reject(new LogoError('read'))
    reader.readAsDataURL(file)
  })
}

function measureAspect(src: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () =>
      resolve(img.naturalWidth > 0 && img.naturalHeight > 0 ? img.naturalWidth / img.naturalHeight : 1)
    img.onerror = () => reject(new LogoError('read'))
    img.src = src
  })
}

/** Lee el archivo que eligió el usuario. Lanza LogoError si no sirve. */
export async function loadLogo(file: File): Promise<Logo> {
  if (!ALLOWED_TYPES.includes(file.type)) throw new LogoError('type')
  if (file.size > MAX_LOGO_BYTES) throw new LogoError('size')
  const src = await readAsDataUrl(file)
  const aspect = await measureAspect(src)
  return { src, aspect, name: file.name }
}

/**
 * Calcula el tamaño del logo dentro de una caja cuadrada sin deformarlo.
 * qrcode.react estira la imagen al ancho y alto que le des, por eso hay que respetar la proporción aquí.
 */
export function fitLogo(box: number, aspect: number): { width: number; height: number } {
  const safe = Number.isFinite(aspect) && aspect > 0 ? aspect : 1
  return safe >= 1 ? { width: box, height: box / safe } : { width: box * safe, height: box }
}
