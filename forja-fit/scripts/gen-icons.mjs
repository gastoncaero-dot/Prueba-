// Genera los iconos PNG del PWA sin dependencias externas.
//   node scripts/gen-icons.mjs
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

const BG = [0x08, 0x09, 0x0b]
const FG = [0xc7, 0xf6, 0x34]

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(buf) {
  let c = 0xffffffff
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function png(size, pixels) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // truecolor RGB
  const raw = Buffer.alloc((size * 3 + 1) * size)
  let p = 0
  for (let y = 0; y < size; y++) {
    raw[p++] = 0 // filter: none
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixels(x, y)
      raw[p++] = r
      raw[p++] = g
      raw[p++] = b
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/** Tres barras ascendentes centradas: la marca de Forja. */
function mark(size) {
  const u = size / 64 // el arte está diseñado en una grilla de 64
  const bars = [
    { x: 12, y: 38, w: 9, h: 14 },
    { x: 27.5, y: 27, w: 9, h: 25 },
    { x: 43, y: 12, w: 9, h: 40 },
  ].map((b) => ({ x: b.x * u, y: b.y * u, w: b.w * u, h: b.h * u, r: 2.5 * u }))

  const inside = (x, y, b) => {
    const cx = Math.min(Math.max(x, b.x + b.r), b.x + b.w - b.r)
    const cy = Math.min(Math.max(y, b.y + b.r), b.y + b.h - b.r)
    const dx = x - cx
    const dy = y - cy
    return dx * dx + dy * dy <= b.r * b.r || (x >= b.x && x <= b.x + b.w && y >= b.y + b.r && y <= b.y + b.h - b.r) || (y >= b.y && y <= b.y + b.h && x >= b.x + b.r && x <= b.x + b.w - b.r)
  }

  return (x, y) => (bars.some((b) => inside(x + 0.5, y + 0.5, b)) ? FG : BG)
}

for (const size of [192, 512]) {
  const file = join(OUT, `icon-${size}.png`)
  writeFileSync(file, png(size, mark(size)))
  console.log('escrito', file)
}
