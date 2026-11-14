import { describe, expect, it } from 'vitest'
import { fitLogo } from './logo'

describe('fitLogo', () => {
  it('un logo cuadrado ocupa toda la caja', () => {
    expect(fitLogo(70, 1)).toEqual({ width: 70, height: 70 })
  })

  it('un logo horizontal usa todo el ancho y baja el alto', () => {
    expect(fitLogo(70, 2)).toEqual({ width: 70, height: 35 })
  })

  it('un logo vertical usa todo el alto y baja el ancho', () => {
    expect(fitLogo(70, 0.5)).toEqual({ width: 35, height: 70 })
  })

  it('si la proporción no es válida lo trata como cuadrado', () => {
    expect(fitLogo(70, Number.NaN)).toEqual({ width: 70, height: 70 })
    expect(fitLogo(70, 0)).toEqual({ width: 70, height: 70 })
    expect(fitLogo(70, -3)).toEqual({ width: 70, height: 70 })
  })
})
