import { readFileSync, writeFileSync, copyFileSync, readdirSync, existsSync } from 'fs'
import { join, extname, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DOWNLOADS = join(process.env.HOME, 'Downloads')
const PUBLIC_PLAYERS = join(__dirname, '../public/players')
const DATA_PATH = join(__dirname, '../src/data/players.json')

function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
}

// Pre-index Downloads files by slug for fuzzy matching
const dlFiles = readdirSync(DOWNLOADS).filter(f =>
  /\.(png|webp|avif|jpg|jpeg)$/i.test(f)
)
const dlBySlug = new Map(dlFiles.map(f => {
  const ext = extname(f)
  const slug = slugify(f.slice(0, -ext.length))
  return [slug, f]
}))

function findDownload(playerName) {
  const slug = slugify(playerName)

  // 1. Exact slug match
  if (dlBySlug.has(slug)) return join(DOWNLOADS, dlBySlug.get(slug))

  // 2. Fuzzy: find a file whose slug shares every word with the player slug
  const words = slug.split('-').filter(w => w.length > 2)
  for (const [fileSlug, fileName] of dlBySlug) {
    if (words.every(w => fileSlug.includes(w))) {
      return join(DOWNLOADS, fileName)
    }
  }
  return null
}

const players = JSON.parse(readFileSync(DATA_PATH, 'utf8'))
const missing = players.filter(p => !p.image)
console.log(`Processing ${missing.length} players with missing images…\n`)

let updated = 0

const result = players.map(p => {
  if (p.image) return p

  const src = findDownload(p.name)
  if (!src) {
    console.log(`  ✗ NOT FOUND: ${p.name}`)
    return p
  }

  const ext = extname(src)
  const slug = slugify(p.name)
  const dest = join(PUBLIC_PLAYERS, `${slug}${ext}`)
  copyFileSync(src, dest)
  const imagePath = `/players/${slug}${ext}`
  console.log(`  ✓ ${p.name} → ${imagePath}`)
  updated++
  return { ...p, image: imagePath }
})

writeFileSync(DATA_PATH, JSON.stringify(result, null, 2))
console.log(`\n✅ Updated ${updated} / ${missing.length} players`)
