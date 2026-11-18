import { describe, expect, it } from 'vitest'
import { NETWORKS, OTHER_NETWORK, detectNetwork } from './networks'

describe('detectNetwork', () => {
  it('reconoce el dominio exacto, con www y con subdominios', () => {
    expect(detectNetwork('instagram.com').id).toBe('instagram')
    expect(detectNetwork('www.instagram.com').id).toBe('instagram')
    expect(detectNetwork('m.facebook.com').id).toBe('facebook')
    expect(detectNetwork('vm.tiktok.com').id).toBe('tiktok')
    expect(detectNetwork('open.spotify.com').id).toBe('spotify')
    expect(detectNetwork('kick.com').id).toBe('kick')
    expect(detectNetwork('www.kick.com').id).toBe('kick')
    expect(detectNetwork('clips.kick.com').id).toBe('kick')
  })

  it('reconoce los acortadores y dominios alternos', () => {
    expect(detectNetwork('wa.me').id).toBe('whatsapp')
    expect(detectNetwork('youtu.be').id).toBe('youtube')
    expect(detectNetwork('twitter.com').id).toBe('x')
    expect(detectNetwork('t.me').id).toBe('telegram')
  })

  it('no se deja engañar por dominios parecidos', () => {
    expect(detectNetwork('box.com')).toBe(OTHER_NETWORK)
    expect(detectNetwork('fakeinstagram.com')).toBe(OTHER_NETWORK)
    expect(detectNetwork('instagram.com.evil.com')).toBe(OTHER_NETWORK)
    expect(detectNetwork('met.me')).toBe(OTHER_NETWORK)
    expect(detectNetwork('notkick.com')).toBe(OTHER_NETWORK)
  })

  it('cualquier otro dominio cuenta como "otro sitio"', () => {
    expect(detectNetwork('mi-tienda.com.co')).toBe(OTHER_NETWORK)
  })

  it('no repite dominios entre redes', () => {
    const hosts = NETWORKS.flatMap((n) => n.hosts)
    expect(new Set(hosts).size).toBe(hosts.length)
  })
})
