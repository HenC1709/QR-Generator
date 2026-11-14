/** Niveles de corrección de errores del estándar QR: cuánto daño tolera el código y aun así se lee. */
export type ErrorLevel = 'L' | 'M' | 'Q' | 'H'

/** Tamaños (en píxeles) disponibles para descargar el PNG. */
export type PngSize = 512 | 1024 | 2048

export const DEFAULT_FG = '#000000'
export const DEFAULT_BG = '#ffffff'
/** Módulos de margen ("zona de silencio") que pide el estándar. */
export const DEFAULT_MARGIN = 4
