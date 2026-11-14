import { describe, expect, it } from 'vitest'
import { LONG_URL_WARNING, MAX_URL_LENGTH, parseLink } from './link'

function ok(input: string, stripTrackers = true) {
  const result = parseLink(input, { stripTrackers })
  if (!result.ok) throw new Error(`Se esperaba un link válido pero falló con "${result.code}": ${input}`)
  return result
}

function errorCode(input: string) {
  const result = parseLink(input)
  if (result.ok) throw new Error(`Se esperaba un error pero se aceptó: ${result.url}`)
  return result.code
}

describe('parseLink: entradas válidas', () => {
  it('agrega https:// cuando falta', () => {
    expect(ok('instagram.com/natgeo').url).toBe('https://instagram.com/natgeo')
  })

  it('normaliza el esquema y el dominio pero respeta las mayúsculas de la ruta', () => {
    const r = ok('HTTPS://www.Instagram.com/NatGeo')
    expect(r.url).toBe('https://www.instagram.com/NatGeo')
    expect(r.host).toBe('instagram.com')
    expect(r.network.id).toBe('instagram')
  })

  it('acepta links que empiezan con //', () => {
    expect(ok('//instagram.com/natgeo').url).toBe('https://instagram.com/natgeo')
  })

  it('ignora caracteres invisibles, saltos de línea y comillas alrededor', () => {
    expect(ok('  ​instagram.com/natgeo​\n').url).toBe('https://instagram.com/natgeo')
    expect(ok('"instagram.com/natgeo"').url).toBe('https://instagram.com/natgeo')
    expect(ok('<https://instagram.com/natgeo>').url).toBe('https://instagram.com/natgeo')
  })

  it('acepta dominios con ñ o tildes', () => {
    expect(ok('https://españa.es/').host).toBe('xn--espaa-rta.es')
  })

  it('acepta dominios desconocidos como "otro sitio"', () => {
    const r = ok('mi-tienda.com.co/catalogo')
    expect(r.network.id).toBe('other')
    expect(r.url).toBe('https://mi-tienda.com.co/catalogo')
  })

  it('no toca los parámetros que sí importan', () => {
    const link = 'https://wa.me/15551234567?text=Hola%20mundo'
    expect(ok(link).url).toBe(link)
  })
})

describe('parseLink: limpieza de rastreadores', () => {
  it('quita igsh y utm_*', () => {
    const r = ok('https://www.instagram.com/natgeo/?igsh=MWx4&utm_source=qr')
    expect(r.url).toBe('https://www.instagram.com/natgeo/')
    expect(r.removedParams).toEqual(['igsh', 'utm_source'])
  })

  it('deja los demás parámetros exactamente como venían y conserva el #', () => {
    const r = ok('https://example.com/s?q=a%20b&utm_medium=x&z=1#top')
    expect(r.url).toBe('https://example.com/s?q=a%20b&z=1#top')
  })

  it('no distingue mayúsculas en el nombre del parámetro', () => {
    expect(ok('https://example.com/?UTM_Source=x').removedParams).toEqual(['UTM_Source'])
  })

  it('en YouTube quita si pero conserva el tiempo (t)', () => {
    const r = ok('https://youtube.com/watch?v=abc123&t=90&si=xyz')
    expect(r.url).toBe('https://youtube.com/watch?v=abc123&t=90')
    expect(r.removedParams).toEqual(['si'])
  })

  it('en X quita s y t', () => {
    const r = ok('https://x.com/NASA/status/1?s=20&t=abc')
    expect(r.url).toBe('https://x.com/NASA/status/1')
    expect(r.removedParams).toEqual(['s', 't'])
  })

  it('s y t en otros sitios no se tocan', () => {
    const link = 'https://example.com/?s=hola&t=1'
    expect(ok(link).url).toBe(link)
  })

  it('no quita nada si la limpieza está apagada', () => {
    const link = 'https://instagram.com/natgeo?igsh=abc&utm_source=qr'
    const r = ok(link, false)
    expect(r.url).toBe(link)
    expect(r.removedParams).toEqual([])
  })
})

describe('parseLink: errores', () => {
  it('vacío', () => {
    expect(errorCode('')).toBe('empty')
    expect(errorCode('   ')).toBe('empty')
    expect(errorCode('\n')).toBe('empty')
  })

  it('texto que no es un link', () => {
    expect(errorCode('hola')).toBe('invalid')
    expect(errorCode('hola mundo')).toBe('invalid')
    expect(errorCode('instagram')).toBe('invalid')
    expect(errorCode('@natgeo')).toBe('invalid')
    expect(errorCode('localhost:3000')).toBe('invalid')
    expect(errorCode('192.168.0.1')).toBe('invalid')
  })

  it('esquemas que no son http(s)', () => {
    expect(errorCode('javascript:alert(1)')).toBe('protocol')
    expect(errorCode('JaVaScRiPt:alert(1)')).toBe('protocol')
    expect(errorCode('data:text/html;base64,PGgxPg==')).toBe('protocol')
    expect(errorCode('mailto:alguien@correo.com')).toBe('protocol')
    expect(errorCode('ftp://instagram.com/x')).toBe('protocol')
    expect(errorCode('whatsapp://send?phone=15551234567')).toBe('protocol')
  })

  it('usuario o clave dentro del link', () => {
    expect(errorCode('https://instagram.com@evil.com/x')).toBe('credentials')
    expect(errorCode('alguien@gmail.com')).toBe('credentials')
  })

  it('link demasiado largo', () => {
    expect(errorCode(`instagram.com/${'a'.repeat(MAX_URL_LENGTH)}`)).toBe('too-long')
  })
})

describe('parseLink: aviso de link largo', () => {
  it('marca como largo solo lo que pasa del umbral', () => {
    expect(ok('instagram.com/natgeo').long).toBe(false)
    expect(ok(`instagram.com/${'a'.repeat(LONG_URL_WARNING)}`).long).toBe(true)
  })
})
