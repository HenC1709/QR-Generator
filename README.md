# Hecho con ayuda de Claude (Anthropic).

# QR Social

Pegas el link de cualquier red social (o de cualquier página) y descargas su código QR en PNG o SVG.
Hecho con **React 19 + Vite + TypeScript**. Todo se genera en el navegador: el link no se envía a ningún servidor.

## Qué hace

- Acepta el link con o sin `https://`, con `www`, con espacios o comillas alrededor.
- Reconoce 18 redes (Instagram, TikTok, Facebook, X, YouTube, WhatsApp, Telegram, LinkedIn, GitHub, Threads, Snapchat, Pinterest, Twitch, Discord, Spotify, Reddit, Bluesky y Linktree). Cualquier otro dominio también funciona.
- Quita los parámetros de rastreo (`igsh`, `fbclid`, `utm_*`, `si`...) para que el QR quede más corto y fácil de escanear. Se puede apagar.
- Color del QR: negro, color de la red (se oscurece solo si queda poco contraste) o personalizado, con aviso si el contraste es malo.
- Margen, nivel de corrección de errores y logo en el centro (con logo se fuerza la corrección máxima).
- Descarga en PNG (512, 1024 o 2048 px), SVG o copia la imagen al portapapeles.
- Rechaza `javascript:`, `data:`, links con usuario/clave y links demasiado largos para un QR.

## Cómo correrlo en Windows

Necesitas [Node.js](https://nodejs.org) **22.12 o superior** (la versión LTS sirve). En PowerShell, dentro de la carpeta del proyecto:

```powershell
npm install
npm run dev
```

Abre la dirección que muestra la terminal (normalmente `http://localhost:5173`).

## Comandos

| Comando             | Qué hace                                             |
| ------------------- | ---------------------------------------------------- |
| `npm run dev`       | Servidor de desarrollo con recarga automática        |
| `npm run build`     | Revisa los tipos y genera la carpeta `dist/`         |
| `npm run preview`   | Sirve el build de `dist/` para probarlo              |
| `npm test`          | Corre las pruebas unitarias (Vitest)                 |
| `npm run typecheck` | Solo revisa los tipos de TypeScript                  |

El build usa rutas relativas (`base: './'`), así que la carpeta `dist/` se puede subir tal cual a GitHub Pages, Netlify, Vercel o cualquier hosting estático.

## Estructura

```
src/
  domain/        Lógica pura, sin React ni DOM (fácil de probar)
    link.ts        Valida y limpia el link
    networks.ts    Catálogo de redes
    color.ts       Contraste y ajuste de colores
    qr.ts          Tipos y valores por defecto del QR
  lib/           Cosas que sí tocan el navegador
    export.ts      Descarga PNG/SVG y copia al portapapeles
    logo.ts        Lectura y validación del logo
  hooks/         useDebounced
  components/    LinkField, Segmented, QrSticker
  App.tsx        Pantalla principal
  styles.css     Estilos
```

La separación sigue la misma idea de Clean Architecture que en tus proyectos en C#: `domain/` no depende de nada de afuera, y la interfaz solo lo usa.

## Agregar una red nueva

Abre `src/domain/networks.ts` y agrega una línea a la lista `NETWORKS`:

```ts
{ id: 'kick', name: 'Kick', hosts: ['kick.com'], color: '#53fc18' },
```

Si la red tiene parámetros que solo sirven para rastrear, agrégalos en `trackers`. Después corre `npm test`: hay una prueba que avisa si repites un dominio.

## Pruebas

`npm test` cubre la validación de links (entradas válidas, rastreadores, ataques tipo `instagram.com@evil.com`), la detección de redes, los colores y los nombres de archivo.
.
