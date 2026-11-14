import type { Network } from '../domain/networks'

const SVG_NS = 'http://www.w3.org/2000/svg'

/**
 * Nombre base para los archivos descargados: qr-instagram-natgeo, qr-tiktok-nasa,
 * qr-mi-tienda-com-co... Solo letras minúsculas, números y guiones, así que
 * funciona en Windows, macOS y Linux sin sorpresas.
 */
export function fileBaseName(url: string, network: Network): string {
  let source = ''
  try {
    const parsed = new URL(url)
    source =
      network.id === 'other'
        ? parsed.hostname.replace(/^www\./, '')
        : (parsed.pathname.split('/').filter(Boolean)[0] ?? '')
  } catch {
    // sin nombre extra
  }

  const slug = source
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)
    .replace(/-+$/g, '')

  return ['qr', network.id === 'other' ? '' : network.id, slug].filter(Boolean).join('-')
}

/** Devuelve el SVG como texto listo para guardar en un archivo .svg, con el tamaño pedido. */
export function serializeSvg(svg: SVGSVGElement, size: number): string {
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', SVG_NS)
  clone.setAttribute('width', String(size))
  clone.setAttribute('height', String(size))
  // clase y estilo son solo para la vista previa en pantalla
  clone.removeAttribute('class')
  clone.removeAttribute('style')
  return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}\n`
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('No se pudo preparar la imagen'))
    img.src = src
  })
}

/**
 * Convierte el SVG en un PNG del tamaño exacto pedido.
 * Se dibuja desde el mismo SVG que se ve en pantalla, así que lo que ves es lo que descargas.
 */
export async function svgToPngBlob(svg: SVGSVGElement, size: number): Promise<Blob> {
  const markup = serializeSvg(svg, size)
  const objectUrl = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }))
  try {
    const img = await loadImage(objectUrl)
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('No se pudo crear el lienzo')
    ctx.drawImage(img, 0, 0, size, size)
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('No se pudo crear el PNG'))), 'image/png')
    })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** Descarga el PNG y devuelve el nombre del archivo. */
export async function downloadPng(svg: SVGSVGElement, size: number, baseName: string): Promise<string> {
  const blob = await svgToPngBlob(svg, size)
  const filename = `${baseName}.png`
  downloadBlob(blob, filename)
  return filename
}

/** Descarga el SVG y devuelve el nombre del archivo. */
export function downloadSvg(svg: SVGSVGElement, size: number, baseName: string): string {
  const blob = new Blob([serializeSvg(svg, size)], { type: 'image/svg+xml;charset=utf-8' })
  const filename = `${baseName}.svg`
  downloadBlob(blob, filename)
  return filename
}

export function canCopyImage(): boolean {
  return typeof ClipboardItem !== 'undefined' && typeof navigator.clipboard?.write === 'function'
}

/** Copia el QR como imagen PNG al portapapeles. */
export async function copyPng(svg: SVGSVGElement, size: number): Promise<void> {
  // Se pasa la promesa directamente: Safari exige que el portapapeles se pida dentro del clic.
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': svgToPngBlob(svg, size) })])
}
