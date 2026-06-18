/**
 * Scrape WNBA active roster + headshots from ESPN API
 * Run: node scripts/scrape-players.js
 *
 * Outputs:
 *   src/data/players.json
 *   public/players/{slug}.jpg  (one per player)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { pipeline } from 'stream/promises'
import { createWriteStream } from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT    = path.resolve(__dirname, '..')
const OUT_JSON = path.join(ROOT, 'src/data/players.json')
const OUT_DIR  = path.join(ROOT, 'public/players')

// ── Helpers ──────────────────────────────────────────────────

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.json()
}

async function downloadFile(url, dest) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (!res.ok) return false
    const out = createWriteStream(dest)
    await pipeline(res.body, out)
    return true
  } catch {
    try { fs.unlinkSync(dest) } catch {}
    return false
  }
}

function toSlug(name) {
  return name.toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ── ESPN endpoints ────────────────────────────────────────────

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/basketball/wnba'

async function getTeams() {
  const d = await fetchJson(`${ESPN_BASE}/teams`)
  return d.sports[0].leagues[0].teams.map(t => ({
    id:   t.team.id,
    name: t.team.displayName,
  }))
}

async function getTeamRoster(teamId, teamName) {
  const d = await fetchJson(`${ESPN_BASE}/teams/${teamId}/roster`)
  return (d.athletes || []).map(a => ({
    id:    a.id,
    name:  a.fullName,
    team:  teamName,
    image: a.headshot?.href || null,
  }))
}

async function getAllStarIds() {
  // Find the All-Star game from the current season scoreboard
  const allStarIds = new Set()
  try {
    // Try a range of July dates (All-Star is typically mid-July)
    const year = new Date().getFullYear()
    for (const dateStr of [`${year}0717`, `${year}0718`, `${year}0719`, `${year}0720`, `${year}0721`]) {
      const d = await fetchJson(`${ESPN_BASE}/scoreboard?dates=${dateStr}&limit=5`)
      const events = d.events || []
      const asGame = events.find(e =>
        e.name?.toLowerCase().includes('team') ||
        e.shortName?.toLowerCase().includes('all-star')
      )
      if (asGame) {
        console.log(`  Found All-Star game: "${asGame.name}" (${dateStr})`)
        const summary = await fetchJson(`${ESPN_BASE}/summary?event=${asGame.id}`)
        const teams = summary.boxscore?.players || []
        for (const team of teams) {
          for (const stat of team.statistics || []) {
            for (const a of stat.athletes || []) {
              allStarIds.add(a.athlete.id)
            }
          }
        }
        break
      }
    }
  } catch (e) {
    console.warn('  Could not fetch All-Star game:', e.message)
  }
  return allStarIds
}

// ── Main ─────────────────────────────────────────────────────

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  // 1. Teams
  console.log('Fetching WNBA teams…')
  const teams = await getTeams()
  console.log(`  Found ${teams.length} teams`)

  // 2. All-Star IDs
  console.log('Finding All-Star players…')
  const allStarIds = await getAllStarIds()
  console.log(`  ${allStarIds.size} All-Stars identified`)

  // 3. Rosters + headshots
  const allPlayers = []
  let downloaded = 0
  let failed = 0

  for (const team of teams) {
    console.log(`\nFetching roster: ${team.name}`)
    let roster
    try {
      roster = await getTeamRoster(team.id, team.name)
    } catch (e) {
      console.warn(`  Error: ${e.message}`)
      continue
    }

    for (const player of roster) {
      const slug = toSlug(player.name)
      const dest = path.join(OUT_DIR, `${slug}.jpg`)
      const localPath = `/players/${slug}.jpg`

      process.stdout.write(`  ${player.name}… `)

      let ok = false
      if (!fs.existsSync(dest) && player.image) {
        ok = await downloadFile(player.image, dest)
        if (!ok && player.image.endsWith('.png')) {
          // Try .jpg variant
          ok = await downloadFile(player.image.replace('.png', '.jpg'), dest)
        }
      } else if (fs.existsSync(dest)) {
        ok = true
      }

      if (ok) { downloaded++; process.stdout.write('✓\n') }
      else     { failed++;     process.stdout.write('✗\n') }

      allPlayers.push({
        id:     player.id,
        name:   player.name,
        team:   player.team,
        allStar: allStarIds.has(player.id),
        image:  ok ? localPath : null,
      })
    }

    await sleep(200)
  }

  // Deduplicate by id (a player might appear on multiple team pages during trades)
  const seen = new Set()
  const unique = allPlayers.filter(p => {
    if (seen.has(p.id)) return false
    seen.add(p.id); return true
  })

  // Players with images first
  const sorted = [
    ...unique.filter(p => p.image),
    ...unique.filter(p => !p.image),
  ]

  fs.writeFileSync(OUT_JSON, JSON.stringify(sorted, null, 2))

  console.log(`\n── Done ──`)
  console.log(`  Players: ${sorted.length}`)
  console.log(`  Headshots: ${downloaded} downloaded, ${failed} failed`)
  console.log(`  All-Stars tagged: ${sorted.filter(p => p.allStar).length}`)
  console.log(`  Output: ${OUT_JSON}`)
}

main().catch(err => {
  console.error('Scrape failed:', err)
  process.exit(1)
})
