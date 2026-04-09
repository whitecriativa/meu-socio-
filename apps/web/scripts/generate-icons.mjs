// Gera ícones PWA via SVG → PNG usando sharp (já está nas deps do Next.js)
// Execute: node scripts/generate-icons.mjs
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// SVG baseado na logo Meu Sócio: fundo azul, bolha verde, bolha azul claro
function svgIcon(size) {
  const r = size * 0.18 // border-radius das bolhas
  const pad = size * 0.12

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="#1A35D4"/>
  <!-- Bolha verde (topo) -->
  <rect x="${pad}" y="${size * 0.20}" width="${size * 0.55}" height="${size * 0.22}" rx="${r}" fill="#7ED957"/>
  <!-- Bolha azul claro (baixo, com cauda) -->
  <rect x="${pad}" y="${size * 0.50}" width="${size * 0.50}" height="${size * 0.22}" rx="${r}" fill="#A8D8F0"/>
  <polygon points="${pad + size * 0.04},${size * 0.72} ${pad},${size * 0.80} ${pad + size * 0.14},${size * 0.72}" fill="#A8D8F0"/>
</svg>`
}

writeFileSync(join(__dirname, '../public/icon.svg'), svgIcon(512))
writeFileSync(join(__dirname, '../public/icon-192.svg'), svgIcon(192))
writeFileSync(join(__dirname, '../public/icon-512.svg'), svgIcon(512))
console.log('SVG icons gerados em public/')
