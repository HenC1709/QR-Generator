import { QRCodeSVG } from 'qrcode.react'
import type { Ref } from 'react'
import type { ErrorLevel } from '../domain/qr'
import { fitLogo, type Logo } from '../lib/logo'

/** Tamaño interno del QR en pantalla. El CSS lo escala; la descarga usa el tamaño que elija la persona. */
const VIEW_SIZE = 320
/** Parte del ancho del QR que ocupa el logo. Con corrección H esto se lee sin problema. */
const LOGO_SHARE = 0.22

const CELLS = 21
const FINDERS = [
  [0, 0],
  [CELLS - 7, 0],
  [0, CELLS - 7],
] as const

/** Puntos fijos del QR de relleno. No es un código real, solo marca el lugar. */
const PLACEHOLDER_DOTS: ReadonlyArray<readonly [number, number]> = (() => {
  const dots: Array<readonly [number, number]> = []
  for (let y = 0; y < CELLS; y++) {
    for (let x = 0; x < CELLS; x++) {
      const nearFinder = (x < 8 && y < 8) || (x >= CELLS - 8 && y < 8) || (x < 8 && y >= CELLS - 8)
      if (!nearFinder && (x * 7 + y * 13 + x * y) % 5 === 0) dots.push([x, y])
    }
  }
  return dots
})()

function Placeholder() {
  return (
    <svg
      className="qr qr-placeholder"
      viewBox={`-2 -2 ${CELLS + 4} ${CELLS + 4}`}
      role="img"
      aria-label="Aquí aparecerá tu QR"
    >
      {FINDERS.map(([x, y]) => (
        <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
          <path fillRule="evenodd" d="M0 0h7v7H0zM1 1v5h5V1z" />
          <rect x="2" y="2" width="3" height="3" />
        </g>
      ))}
      {PLACEHOLDER_DOTS.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />
      ))}
    </svg>
  )
}

interface QrStickerProps {
  svgRef: Ref<SVGSVGElement>
  /** Link que va dentro del QR. null mientras no haya un link válido. */
  value: string | null
  title: string
  detail: string
  fg: string
  bg: string
  level: ErrorLevel
  margin: number
  logo: Logo | null
}

export function QrSticker({ svgRef, value, title, detail, fg, bg, level, margin, logo }: QrStickerProps) {
  const logoSize = logo ? fitLogo(VIEW_SIZE * LOGO_SHARE, logo.aspect) : null

  return (
    <div className="sticker-wrap" data-state={value === null ? 'empty' : 'ready'}>
      <div className="sticker">
        <div className="qr-frame">
          {value !== null ? (
            <QRCodeSVG
              ref={svgRef}
              className="qr"
              value={value}
              size={VIEW_SIZE}
              level={level}
              fgColor={fg}
              bgColor={bg}
              marginSize={margin}
              title={`Código QR de ${detail}`}
              imageSettings={
                logo && logoSize
                  ? { src: logo.src, width: logoSize.width, height: logoSize.height, excavate: true }
                  : undefined
              }
            />
          ) : (
            <Placeholder />
          )}
        </div>
        <p className="sticker-title">{title}</p>
        <p className="sticker-detail" title={detail}>
          {detail}
        </p>
      </div>
      <div className="sticker-fold" aria-hidden="true" />
    </div>
  )
}
