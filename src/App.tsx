import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { LinkField } from './components/LinkField'
import { QrSticker } from './components/QrSticker'
import { Segmented } from './components/Segmented'
import { contrastRatio, ensureContrast, isInverted } from './domain/color'
import { LINK_ERRORS, parseLink, type LinkResult } from './domain/link'
import { DEFAULT_BG, DEFAULT_FG, type ErrorLevel, type PngSize } from './domain/qr'
import { useDebounced } from './hooks/useDebounced'
import { canCopyImage, copyPng, downloadPng, downloadSvg, fileBaseName } from './lib/export'
import { LOGO_ERRORS, LogoError, loadLogo, type Logo } from './lib/logo'

type ColorMode = 'black' | 'brand' | 'custom'
type Feedback = { tone: 'ok' | 'error'; text: string }

const COLOR_OPTIONS: ReadonlyArray<{ value: ColorMode; label: string }> = [
  { value: 'black', label: 'Negro' },
  { value: 'brand', label: 'Color de la red' },
  { value: 'custom', label: 'Personalizado' },
]

const MARGIN_OPTIONS: ReadonlyArray<{ value: number; label: string }> = [
  { value: 4, label: 'Normal' },
  { value: 2, label: 'Pequeño' },
  { value: 0, label: 'Sin margen' },
]

const LEVEL_OPTIONS: ReadonlyArray<{ value: ErrorLevel; label: string }> = [
  { value: 'L', label: 'Baja' },
  { value: 'M', label: 'Media' },
  { value: 'Q', label: 'Alta' },
  { value: 'H', label: 'Máxima' },
]

const SIZE_OPTIONS: ReadonlyArray<{ value: PngSize; label: string }> = [
  { value: 512, label: '512 px' },
  { value: 1024, label: '1024 px' },
  { value: 2048, label: '2048 px' },
]

const displayUrl = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '')

function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#ffffff" />
      <g fill="#2536d8">
        <path fillRule="evenodd" d="M10 10h18v18H10zM14 14v10h10V14z" />
        <path fillRule="evenodd" d="M36 10h18v18H36zM40 14v10h10V14z" />
        <path fillRule="evenodd" d="M10 36h18v18H10zM14 40v10h10V40z" />
        <rect x="17" y="17" width="4" height="4" />
        <rect x="43" y="17" width="4" height="4" />
        <rect x="17" y="43" width="4" height="4" />
      </g>
      <g fill="#ffd83a" stroke="#2536d8" strokeWidth="2">
        <rect x="37" y="37" width="7" height="7" />
        <rect x="48" y="39" width="5" height="5" />
        <rect x="39" y="48" width="5" height="5" />
        <rect x="48" y="48" width="5" height="5" />
      </g>
    </svg>
  )
}

interface LinkStatusProps {
  id: string
  result: LinkResult | null
  empty: boolean
}

/** Mensaje bajo el campo: ayuda inicial, error con cómo arreglarlo, o confirmación de lo que se detectó. */
function LinkStatus({ id, result, empty }: LinkStatusProps) {
  let tone: 'idle' | 'ok' | 'error' = 'idle'
  let body: ReactNode

  if (empty || result === null || (!result.ok && result.code === 'empty')) {
    body = <p>Sirve con Instagram, TikTok, Facebook, X, YouTube, WhatsApp, Telegram, LinkedIn o cualquier otra página.</p>
  } else if (!result.ok) {
    tone = 'error'
    body = <p>{LINK_ERRORS[result.code]}</p>
  } else {
    tone = 'ok'
    const name = result.network.id === 'other' ? result.host : result.network.name
    body = (
      <>
        <p>
          <span className="dot" style={{ background: result.network.color }} aria-hidden="true" />
          Link de {name} listo.
        </p>
        {result.removedParams.length > 0 && (
          <p>Quitamos del link lo que solo sirve para rastrear: {result.removedParams.join(', ')}.</p>
        )}
        {result.long && <p>Es un link largo, así que el QR queda más denso. Si puedes, usa uno más corto.</p>}
      </>
    )
  }

  return (
    <div className="status" id={id} data-tone={tone} aria-live="polite">
      {body}
    </div>
  )
}

export default function App() {
  const [raw, setRaw] = useState('')
  const [stripTrackers, setStripTrackers] = useState(true)
  const [colorMode, setColorMode] = useState<ColorMode>('brand')
  const [customFg, setCustomFg] = useState('#2536d8')
  const [customBg, setCustomBg] = useState('#ffffff')
  const [margin, setMargin] = useState(4)
  const [level, setLevel] = useState<ErrorLevel>('M')
  const [pngSize, setPngSize] = useState<PngSize>(1024)
  const [logo, setLogo] = useState<Logo | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const svgRef = useRef<SVGSVGElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const debounced = useDebounced(raw, 250)
  const result = useMemo<LinkResult | null>(
    () => (debounced.trim() === '' ? null : parseLink(debounced, { stripTrackers })),
    [debounced, stripTrackers],
  )

  const isEmpty = raw.trim() === ''
  const ready = !isEmpty && result && result.ok ? result : null
  const hasError = !isEmpty && result !== null && !result.ok && result.code !== 'empty'

  const bg = colorMode === 'custom' ? customBg : DEFAULT_BG
  const brandColor = ready?.network.color ?? DEFAULT_FG
  const fg = useMemo(() => {
    if (colorMode === 'custom') return customFg
    if (colorMode === 'brand') return ensureContrast(brandColor, bg)
    return DEFAULT_FG
  }, [colorMode, customFg, brandColor, bg])

  // Con logo encima, el QR necesita la máxima corrección para seguir leyéndose.
  const effectiveLevel: ErrorLevel = logo ? 'H' : level

  const contrastWarning = useMemo(() => {
    if (colorMode !== 'custom') return null
    if (contrastRatio(fg, bg) < 3) return 'Los dos colores se parecen mucho y el QR puede no escanearse. Prueba con uno más oscuro.'
    if (isInverted(fg, bg)) return 'Tu QR es más claro que el fondo. Algunos lectores solo entienden QR oscuros sobre fondo claro.'
    return null
  }, [colorMode, fg, bg])

  const readyUrl = ready?.url ?? null
  useEffect(() => {
    setFeedback(null)
  }, [readyUrl])

  const baseName = ready ? fileBaseName(ready.url, ready.network) : 'qr'
  const shown = ready ? displayUrl(ready.url) : ''
  const stickerTitle = ready ? (ready.network.id === 'other' ? ready.host : ready.network.name) : 'Tu QR va aquí'
  const stickerDetail = ready ? shown : hasError ? 'Corrige el link para verlo' : 'Pega un link para empezar'

  async function handlePng() {
    const svg = svgRef.current
    if (!svg) return
    try {
      const name = await downloadPng(svg, pngSize, baseName)
      setFeedback({ tone: 'ok', text: `Descargado: ${name}` })
    } catch {
      setFeedback({ tone: 'error', text: 'No se pudo crear el PNG. Prueba con el SVG.' })
    }
  }

  function handleSvg() {
    const svg = svgRef.current
    if (!svg) return
    const name = downloadSvg(svg, pngSize, baseName)
    setFeedback({ tone: 'ok', text: `Descargado: ${name}` })
  }

  async function handleCopy() {
    const svg = svgRef.current
    if (!svg) return
    try {
      await copyPng(svg, pngSize)
      setFeedback({ tone: 'ok', text: 'Imagen copiada. Ya la puedes pegar donde quieras.' })
    } catch {
      setFeedback({ tone: 'error', text: 'Tu navegador no dejó copiar la imagen. Usa Descargar PNG.' })
    }
  }

  async function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      setLogo(await loadLogo(file))
      setLogoError(null)
    } catch (error) {
      setLogoError(error instanceof LogoError ? error.message : LOGO_ERRORS.read)
    }
  }

  return (
    <div className="page">
      <header className="top">
        <BrandMark />
        <span className="brand">QR Social</span>
      </header>

      <main className="layout">
        <div className="intro">
          <h1>Un QR para el link de cualquier red social</h1>
          <p className="lede">
            Pega la dirección de tu perfil, tu video o tu página y descarga el código listo para imprimir o compartir.
            Todo se genera en tu dispositivo: el link no se envía a ningún servidor.
          </p>
        </div>

        <section className="card link-card" aria-label="Link">
          <LinkField value={raw} onChange={setRaw} describedBy="link-status" invalid={hasError} />
          <LinkStatus id="link-status" result={result} empty={isEmpty} />
        </section>

        <section className="stage" aria-label="Tu código QR">
          <QrSticker
            svgRef={svgRef}
            value={ready ? ready.url : null}
            title={stickerTitle}
            detail={stickerDetail}
            fg={fg}
            bg={bg}
            level={effectiveLevel}
            margin={margin}
            logo={logo}
          />

          <div className="actions">
            <Segmented label="Tamaño de la descarga" value={pngSize} options={SIZE_OPTIONS} onChange={setPngSize} />
            <button type="button" className="btn btn-primary" disabled={!ready} onClick={handlePng}>
              Descargar PNG
            </button>
            <div className="btn-row">
              <button type="button" className="btn btn-ghost" disabled={!ready} onClick={handleSvg}>
                Descargar SVG
              </button>
              {canCopyImage() && (
                <button type="button" className="btn btn-ghost" disabled={!ready} onClick={handleCopy}>
                  Copiar imagen
                </button>
              )}
            </div>
            <p className="toast" role="status" data-tone={feedback?.tone ?? 'ok'}>
              {feedback?.text}
            </p>
          </div>
        </section>

        <section className="card options-card" aria-labelledby="options-title">
          <h2 id="options-title">Personalizar</h2>

          <div className="control">
            <Segmented label="Color del QR" value={colorMode} options={COLOR_OPTIONS} onChange={setColorMode} />
            {colorMode === 'brand' && (
              <p className="hint">Usamos el color de la red del link. Si es muy claro, lo oscurecemos para que escanee bien.</p>
            )}
            {colorMode === 'custom' && (
              <div className="colors">
                <label className="color">
                  <input type="color" value={customFg} onChange={(event) => setCustomFg(event.target.value)} />
                  <span>QR {customFg}</span>
                </label>
                <label className="color">
                  <input type="color" value={customBg} onChange={(event) => setCustomBg(event.target.value)} />
                  <span>Fondo {customBg}</span>
                </label>
              </div>
            )}
            {contrastWarning && (
              <p className="note" data-tone="warn">
                {contrastWarning}
              </p>
            )}
          </div>

          <div className="control">
            <Segmented label="Margen" value={margin} options={MARGIN_OPTIONS} onChange={setMargin} />
            <p className="hint">El margen ayuda a que el celular encuentre el código. Si vas a imprimirlo, déjalo en normal.</p>
          </div>

          <div className="control">
            <Segmented
              label="Corrección de errores"
              value={effectiveLevel}
              options={LEVEL_OPTIONS}
              onChange={setLevel}
              disabled={logo !== null}
            />
            <p className="hint">
              {logo
                ? 'Con logo usamos Máxima para que el QR siga leyéndose.'
                : 'Más corrección aguanta más rayones o un logo encima, pero el QR queda más denso.'}
            </p>
          </div>

          <div className="control">
            <p className="control-title">Logo en el centro</p>
            <div className="logo-row">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                hidden
                onChange={handleLogoChange}
              />
              <button type="button" className="btn-line" onClick={() => logoInputRef.current?.click()}>
                {logo ? 'Cambiar logo' : 'Agregar logo'}
              </button>
              {logo && (
                <>
                  <span className="logo-name" title={logo.name}>
                    {logo.name}
                  </span>
                  <button
                    type="button"
                    className="btn-line"
                    onClick={() => {
                      setLogo(null)
                      setLogoError(null)
                    }}
                  >
                    Quitar
                  </button>
                </>
              )}
            </div>
            {logoError && (
              <p className="note" data-tone="warn" role="alert">
                {logoError}
              </p>
            )}
          </div>

          <div className="control">
            <label className="check">
              <input type="checkbox" checked={stripTrackers} onChange={(event) => setStripTrackers(event.target.checked)} />
              <span>
                Quitar rastreadores del link
                <small>Elimina parámetros como igsh, fbclid o utm_*. El QR queda más corto y limpio.</small>
              </span>
            </label>
          </div>
        </section>
      </main>
    </div>
  )
}
