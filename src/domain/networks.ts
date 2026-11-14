/**
 * Catálogo de redes conocidas. Se usa para tres cosas:
 *  1. mostrar de qué red es el link,
 *  2. proponer un color para el QR,
 *  3. saber qué parámetros del link son solo rastreo en esa red.
 *
 * Cualquier dominio que no esté aquí funciona igual: se trata como "otro sitio".
 */
export interface Network {
  readonly id: string
  readonly name: string
  /** Dominios sin www. Los subdominios cuentan: m.facebook.com pertenece a facebook.com */
  readonly hosts: readonly string[]
  /** Color de marca. Es un punto de partida: si no contrasta con el fondo se oscurece solo. */
  readonly color: string
  /** Parámetros que en esta red solo sirven para rastrear (en minúsculas). */
  readonly trackers?: readonly string[]
}

export const NETWORKS: readonly Network[] = [
  { id: 'instagram', name: 'Instagram', hosts: ['instagram.com', 'instagr.am'], color: '#e1306c' },
  {
    id: 'tiktok',
    name: 'TikTok',
    hosts: ['tiktok.com'],
    color: '#000000',
    trackers: ['_t', '_r', 'is_from_webapp', 'sender_device', 'sender_web_id'],
  },
  {
    id: 'facebook',
    name: 'Facebook',
    hosts: ['facebook.com', 'fb.com', 'fb.me', 'fb.watch'],
    color: '#1877f2',
  },
  { id: 'x', name: 'X (Twitter)', hosts: ['x.com', 'twitter.com'], color: '#000000', trackers: ['s', 't'] },
  {
    id: 'youtube',
    name: 'YouTube',
    hosts: ['youtube.com', 'youtu.be'],
    color: '#ff0000',
    trackers: ['si'],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    hosts: ['linkedin.com', 'lnkd.in'],
    color: '#0a66c2',
    trackers: ['trk', 'trackingid', 'lipi'],
  },
  { id: 'whatsapp', name: 'WhatsApp', hosts: ['wa.me', 'whatsapp.com'], color: '#25d366' },
  {
    id: 'telegram',
    name: 'Telegram',
    hosts: ['t.me', 'telegram.me', 'telegram.org'],
    color: '#26a5e4',
  },
  { id: 'github', name: 'GitHub', hosts: ['github.com'], color: '#181717' },
  { id: 'threads', name: 'Threads', hosts: ['threads.net', 'threads.com'], color: '#000000' },
  { id: 'snapchat', name: 'Snapchat', hosts: ['snapchat.com'], color: '#fffc00' },
  { id: 'pinterest', name: 'Pinterest', hosts: ['pinterest.com', 'pin.it'], color: '#e60023' },
  { id: 'twitch', name: 'Twitch', hosts: ['twitch.tv'], color: '#9146ff' },
  { id: 'discord', name: 'Discord', hosts: ['discord.com', 'discord.gg'], color: '#5865f2' },
  {
    id: 'spotify',
    name: 'Spotify',
    hosts: ['spotify.com', 'spotify.link'],
    color: '#1db954',
    trackers: ['si'],
  },
  { id: 'reddit', name: 'Reddit', hosts: ['reddit.com', 'redd.it'], color: '#ff4500' },
  { id: 'bluesky', name: 'Bluesky', hosts: ['bsky.app'], color: '#1185fe' },
  { id: 'linktree', name: 'Linktree', hosts: ['linktr.ee'], color: '#43e660' },
]

export const OTHER_NETWORK: Network = {
  id: 'other',
  name: 'Otro sitio',
  hosts: [],
  color: '#000000',
}

/**
 * Busca a qué red pertenece un hostname. Compara el dominio completo o un subdominio,
 * así que "box.com" no se confunde con "x.com" ni "instagram.com.evil.com" con Instagram.
 */
export function detectNetwork(hostname: string): Network {
  const host = hostname.toLowerCase().replace(/^www\./, '')
  return (
    NETWORKS.find((network) =>
      network.hosts.some((domain) => host === domain || host.endsWith(`.${domain}`)),
    ) ?? OTHER_NETWORK
  )
}
