import { describe, expect, it } from 'vitest'
import { contrastRatio, ensureContrast, isInverted, parseHex, toHex } from './color'
import { NETWORKS } from './networks'

describe('parseHex / toHex', () => {
  it('lee el formato corto y el largo', () => {
    expect(parseHex('#abc')).toEqual([170, 187, 204])
    expect(parseHex('112233')).toEqual([17, 34, 51])
  })

  it('rechaza lo que no es un color', () => {
    expect(parseHex('rojo')).toBeNull()
    expect(parseHex('#12345')).toBeNull()
    expect(parseHex('')).toBeNull()
  })

  it('ida y vuelta', () => {
    expect(toHex([17, 34, 51])).toBe('#112233')
  })
})

describe('contrastRatio', () => {
  it('negro sobre blanco es 21', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5)
  })

  it('un color contra sí mismo es 1', () => {
    expect(contrastRatio('#336699', '#336699')).toBeCloseTo(1, 5)
  })

  it('no depende del orden', () => {
    expect(contrastRatio('#336699', '#ffeeaa')).toBeCloseTo(contrastRatio('#ffeeaa', '#336699'), 10)
  })
})

describe('isInverted', () => {
  it('detecta QR más claro que el fondo', () => {
    expect(isInverted('#ffffff', '#000000')).toBe(true)
    expect(isInverted('#000000', '#ffffff')).toBe(false)
  })
})

describe('ensureContrast', () => {
  it('deja igual un color que ya contrasta', () => {
    expect(ensureContrast('#000000', '#ffffff')).toBe('#000000')
  })

  it('oscurece un color claro sobre fondo claro', () => {
    const out = ensureContrast('#fffc00', '#ffffff')
    expect(contrastRatio(out, '#ffffff')).toBeGreaterThanOrEqual(4.5)
  })

  it('aclara un color oscuro sobre fondo oscuro', () => {
    const out = ensureContrast('#181717', '#000000')
    expect(contrastRatio(out, '#000000')).toBeGreaterThanOrEqual(4.5)
  })

  it('todos los colores de marca quedan escaneables sobre blanco', () => {
    for (const network of NETWORKS) {
      const adjusted = ensureContrast(network.color, '#ffffff')
      expect(contrastRatio(adjusted, '#ffffff'), network.name).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('si el color no es válido lo devuelve sin tocar', () => {
    expect(ensureContrast('nada', '#ffffff')).toBe('nada')
  })
})
