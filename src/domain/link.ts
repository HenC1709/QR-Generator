import { detectNetwork, type Network } from './networks'

/** Por encima de esto no cabe en un QR escaneable (con corrección H el límite real ronda los 1270 bytes). */
export const MAX_URL_LENGTH = 1000
/** Por encima de esto el QR se vuelve muy denso y cuesta escanearlo. */
export const LONG_URL_WARNING = 300

export type LinkErrorCode = 'empty' | 'invalid' | 'protocol' | 'credentials' | 'too-long'

export const LINK_ERRORS: Record<LinkErrorCode, string> = {
  empty: 'Pega un link para empezar.',
  invalid: 'Eso no parece un link. Pega la dirección completa, por ejemplo instagram.com/tuusuario.',
  protocol: 'Solo se aceptan links que empiecen con http o https.',
  credentials: 'El link trae usuario o clave dentro (algo@sitio). Pega el link sin esa parte.',
  'too-long': `El link pasa de ${MAX_URL_LENGTH} caracteres y no cabe en un QR que se pueda escanear.`,
}

export type LinkResult =
  | {
      ok: true
      /** Link final que va dentro del QR. */
      url: string
      /** Dominio sin www, para mostrar. */
      host: string
      network: Network
      /** Parámetros de rastreo que se quitaron (vacío si no había o si la limpieza está apagada). */
      removedParams: string[]
      /** true si el link es largo y el QR va a quedar denso. */
      long: boolean
    }
  | { ok: false; code: LinkErrorCode }

export interface ParseOptions {
  /** Quita parámetros de rastreo (utm_*, igsh, fbclid...). Por defecto true. */
  stripTrackers?: boolean
}

const INVISIBLE = /[​-‍⁠﻿]/g
const WRAPPERS = /^[<"'“”‘’]+|[>"'“”‘’]+$/g
/** Esquemas que nunca son un link de red social y algunos son peligrosos (javascript:, data:...). */
const BLOCKED_SCHEME = /^(javascript|data|vbscript|file|blob|about|mailto|tel|sms)\s*:/i
const EXPLICIT_SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i
/** Dominio con al menos un punto y una terminación válida (acepta IDN ya convertido a punycode). */
const HOSTNAME = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,}|xn--[a-z0-9-]{1,59})$/

/** Parámetros de rastreo que sobran en cualquier sitio. Además se quita todo lo que empiece con utm_. */
const GLOBAL_TRACKERS: ReadonlySet<string> = new Set([
  'fbclid',
  'gclid',
  'dclid',
  'msclkid',
  'igshid',
  'igsh',
  'mibextid',
  'ref_src',
  'ref_url',
  'mc_cid',
  'mc_eid',
])

function sanitize(input: string): string {
  return input.replace(INVISIBLE, '').trim().replace(WRAPPERS, '').trim()
}

function isTracker(key: string, network: Network): boolean {
  const k = key.toLowerCase()
  return k.startsWith('utm_') || GLOBAL_TRACKERS.has(k) || (network.trackers?.includes(k) ?? false)
}

/**
 * Quita de `url` los parámetros de rastreo y devuelve cuáles quitó. Modifica `url`.
 * Trabaja sobre el texto original de la query para no cambiar la codificación
 * de los parámetros que se quedan (por ejemplo ?text=Hola%20mundo sigue igual).
 */
export function stripTrackingParams(url: URL, network: Network): string[] {
  const raw = url.search.startsWith('?') ? url.search.slice(1) : url.search
  if (raw === '') return []

  const kept: string[] = []
  const removed: string[] = []
  for (const part of raw.split('&')) {
    if (part === '') continue
    const rawKey = part.split('=', 1)[0]
    let key = rawKey
    try {
      key = decodeURIComponent(rawKey.replace(/\+/g, ' '))
    } catch {
      // clave mal codificada: se compara tal cual
    }
    if (isTracker(key, network)) {
      if (!removed.includes(key)) removed.push(key)
    } else {
      kept.push(part)
    }
  }

  if (removed.length === 0) return []
  url.search = kept.length > 0 ? `?${kept.join('&')}` : ''
  return removed
}

/**
 * Convierte lo que el usuario pegó en un link listo para el QR, o dice por qué no sirve.
 * Acepta con o sin https://, con www, con espacios o comillas alrededor, etc.
 */
export function parseLink(input: string, { stripTrackers = true }: ParseOptions = {}): LinkResult {
  const text = sanitize(input)
  if (text === '') return { ok: false, code: 'empty' }
  if (/\s/.test(text)) return { ok: false, code: 'invalid' }
  if (BLOCKED_SCHEME.test(text)) return { ok: false, code: 'protocol' }

  let candidate = text
  if (candidate.startsWith('//')) candidate = `https:${candidate}`
  else if (!EXPLICIT_SCHEME.test(candidate)) candidate = `https://${candidate}`

  let url: URL
  try {
    url = new URL(candidate)
  } catch {
    return { ok: false, code: 'invalid' }
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return { ok: false, code: 'protocol' }
  if (url.username || url.password) return { ok: false, code: 'credentials' }
  if (url.hostname.length > 253 || !HOSTNAME.test(url.hostname)) return { ok: false, code: 'invalid' }

  const network = detectNetwork(url.hostname)
  const removedParams = stripTrackers ? stripTrackingParams(url, network) : []

  const href = url.href
  if (href.length > MAX_URL_LENGTH) return { ok: false, code: 'too-long' }

  return {
    ok: true,
    url: href,
    host: url.hostname.replace(/^www\./, ''),
    network,
    removedParams,
    long: href.length > LONG_URL_WARNING,
  }
}
