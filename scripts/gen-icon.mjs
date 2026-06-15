import sharp from 'sharp'

// Reproduit fidèlement le LogoMark du site : tuile sombre #0d0d0f, « S » blanc,
// point vert en bas à droite, fine bordure blanche. Le « S » est tracé en vecteur
// (pas de dépendance police) pour un rendu fiable côté serveur.

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" rx="287" fill="#0d0d0f"/>
  <rect x="5" y="5" width="1014" height="1014" rx="282" fill="none" stroke="#ffffff" stroke-opacity="0.10" stroke-width="6"/>
  <path d="M700 372 C700 296 588 264 498 280 C384 300 336 360 352 432 C368 502 462 524 548 544 C688 576 700 646 684 710 C666 784 556 802 468 784"
    fill="none" stroke="#ffffff" stroke-width="122" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="788" cy="780" r="74" fill="#22c55e"/>
</svg>`

import { writeFileSync } from 'node:fs'
writeFileSync('public/sponsorable-icon.svg', svg)
await sharp(Buffer.from(svg)).png().resize(1024, 1024).toFile('public/sponsorable-icon-1024.png')
const meta = await sharp('public/sponsorable-icon-1024.png').metadata()
console.log('OK', meta.width + 'x' + meta.height, meta.format)
