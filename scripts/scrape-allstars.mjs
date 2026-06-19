import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Wikipedia API: fetch wikitext for multiple pages in one request (max 50)
async function fetchWikitextBatch(titles) {
  const joined = titles.map(encodeURIComponent).join('|')
  const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${joined}&prop=revisions&rvprop=content&format=json&formatversion=2`
  const res = await fetch(url, { headers: { 'User-Agent': 'wnba-allstar-scraper/1.0 (educational)' } })
  const json = await res.json()
  return json.query.pages.map(p => p.revisions?.[0]?.content ?? '')
}

// Extract only the content of roster sections, ignoring game recap / stats / voting narrative
function extractRosterSection(wikitext) {
  // Prefer the most specific: "Final roster(s)" subsection
  // Fall back to any section whose header contains "roster" or "selection"
  const patterns = [
    /={2,4}[^=]*[Ff]inal [Rr]osters?[^=]*={2,4}([\s\S]*?)(?=\n={1,4}[^=]|$)/,
    /={2,4}[^=]*[Rr]osters?[^=]*={2,4}([\s\S]*?)(?=\n={1,3}[^=]|$)/,
    /={2,4}[^=]*[Ss]elections?[^=]*={2,4}([\s\S]*?)(?=\n={1,3}[^=]|$)/,
  ]
  for (const re of patterns) {
    const m = wikitext.match(re)
    if (m) return m[1]
  }
  return ''
}

// Extract player names from a roster section — links like [[Player Name]] or [[Article|Display Name]]
function extractNames(wikitext) {
  const section = extractRosterSection(wikitext)
  if (!section) return new Set()

  const names = new Set()
  // Capture both article title (m[1]) and optional display text (m[2])
  const linkRe = /\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]/g
  let m
  while ((m = linkRe.exec(section)) !== null) {
    // Prefer display name (e.g. "Natasha Howard" from [[Natasha Howard (basketball)|Natasha Howard]])
    const name = (m[2] ?? m[1]).trim()
    if (
      !name.includes(':') &&
      !name.match(/^\d/) &&
      !name.match(/^(WNBA|NBA|File|Category|List|Season|Game|Team|United States|USA|Atlanta|Chicago|Connecticut|Dallas|Golden|Indiana|Las Vegas|Los Angeles|Minnesota|New York|Phoenix|Portland|Seattle|Toronto|Washington|Phoenix Mercury|Duke|Texas|Head coach|Assistant)/)
    ) {
      names.add(name)
    }
  }
  return names
}

// Normalize name for fuzzy matching (lowercase, strip accents, collapse spaces, drop hyphens)
function normalize(name) {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/-/g, ' ')       // Diggins-Smith → Diggins Smith
    .replace(/[^a-z\s]/g, '') // strip parens, apostrophes, etc.
    .replace(/\s+/g, ' ')
    .trim()
}

async function main() {
  const dataPath = path.join(__dirname, '../src/data/players.json')
  const players = JSON.parse(readFileSync(dataPath, 'utf8'))

  // Fetch recent All-Star game pages
  // 2020 skipped (COVID). Generate all other years 1999–2025.
  const years = Array.from({ length: 27 }, (_, i) => 1999 + i).filter(y => y !== 2020)
  const allPages = [
    ...years.map(y => `${y} WNBA All-Star Game`),
    'WNBA All-Star Game',
  ]

  const allStarNames = new Set()
  const delay = ms => new Promise(r => setTimeout(r, ms))

  // Batch into chunks of 25 to stay well under Wikipedia's 50-title limit
  const chunkSize = 25
  for (let i = 0; i < allPages.length; i += chunkSize) {
    const chunk = allPages.slice(i, i + chunkSize)
    console.log(`Fetching batch ${Math.floor(i / chunkSize) + 1}: ${chunk[0]} … ${chunk[chunk.length - 1]}`)
    try {
      const texts = await fetchWikitextBatch(chunk)
      let batchNames = 0
      for (const wikitext of texts) {
        const names = extractNames(wikitext)
        names.forEach(n => allStarNames.add(n))
        batchNames += names.size
      }
      console.log(`  → extracted ${batchNames} candidate names across ${chunk.length} pages`)
    } catch (e) {
      console.log(`  → batch failed (${e.message})`)
    }
    if (i + chunkSize < allPages.length) await delay(1000)
  }

  console.log(`\nTotal unique candidate names: ${allStarNames.size}`)

  // Match against players.json
  const playerNormMap = new Map(players.map(p => [normalize(p.name), p]))
  const allStarNormSet = new Set([...allStarNames].map(normalize))

  let matched = 0
  let unmatched = 0

  const allStarNormArray = [...allStarNormSet]

  const updated = players.map(p => {
    const norm = normalize(p.name)
    // Exact match, or player name is a leading subset of a wiki name (e.g. "skylar diggins" ⊂ "skylar diggins smith")
    const isAllStar = allStarNormSet.has(norm) ||
      allStarNormArray.some(w => w.startsWith(norm + ' ') || norm.startsWith(w + ' '))
    if (isAllStar) matched++
    else unmatched++
    return { ...p, allStar: isAllStar }
  })

  console.log(`\nMatched: ${matched} / ${players.length} players`)
  console.log('All-stars found:')
  updated.filter(p => p.allStar).forEach(p => console.log(`  ✓ ${p.name}`))

  // Warn about names in Wikipedia that didn't match any player
  const unmatchedWiki = [...allStarNames].filter(n => !playerNormMap.has(normalize(n)))
  if (unmatchedWiki.length < 60) {
    console.log(`\nWikipedia names that didn't match any player (${unmatchedWiki.length}):`)
    unmatchedWiki.slice(0, 30).forEach(n => console.log(`  ? ${n}`))
  }

  writeFileSync(dataPath, JSON.stringify(updated, null, 2))
  console.log(`\n✅ Updated players.json`)
}

main().catch(err => { console.error(err); process.exit(1) })
