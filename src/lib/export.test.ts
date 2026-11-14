import { describe, expect, it } from 'vitest'
import { detectNetwork } from '../domain/networks'
import { fileBaseName } from './export'

const name = (url: string) => fileBaseName(url, detectNetwork(new URL(url).hostname))

describe('fileBaseName', () => {
  it('usa la red y el primer tramo de la ruta', () => {
    expect(name('https://instagram.com/natgeo')).toBe('qr-instagram-natgeo')
    expect(name('https://www.tiktok.com/@nasa')).toBe('qr-tiktok-nasa')
    expect(name('https://youtube.com/@NASA')).toBe('qr-youtube-nasa')
  })

  it('sin ruta queda solo la red', () => {
    expect(name('https://instagram.com/')).toBe('qr-instagram')
  })

  it('para sitios desconocidos usa el dominio', () => {
    expect(name('https://www.mi-tienda.com.co/catalogo')).toBe('qr-mi-tienda-com-co')
  })

  it('nunca produce caracteres que Windows no acepta', () => {
    expect(name('https://instagram.com/a%3Cb%3E%3A%22%7C%3F*')).toMatch(/^[a-z0-9-]+$/)
  })

  it('recorta nombres muy largos', () => {
    const result = name(`https://instagram.com/${'a'.repeat(200)}`)
    expect(result.length).toBeLessThanOrEqual('qr-instagram-'.length + 30)
  })
})
