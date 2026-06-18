import express from 'express'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PLAYERS_FILE = path.join(__dirname, 'src/data/players.json')
const PHOTOS_DIR = path.join(__dirname, 'public/players')

const app = express()
app.use(express.json())

function readPlayers() {
  return JSON.parse(fs.readFileSync(PLAYERS_FILE, 'utf8'))
}

function writePlayers(players) {
  fs.writeFileSync(PLAYERS_FILE, JSON.stringify(players, null, 2))
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const upload = multer({
  storage: multer.diskStorage({
    destination: PHOTOS_DIR,
    filename(req, file, cb) {
      const players = readPlayers()
      const player = players.find(p => p.id === req.params.id)
      const base = player ? slugify(player.name) : req.params.id
      cb(null, `${base}.jpg`)
    },
  }),
  fileFilter(req, file, cb) {
    cb(null, file.mimetype.startsWith('image/'))
  },
})

// GET all players
app.get('/api/players', (req, res) => {
  res.json(readPlayers())
})

// PUT update a player
app.put('/api/players/:id', (req, res) => {
  const players = readPlayers()
  const idx = players.findIndex(p => p.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  players[idx] = { ...players[idx], ...req.body, id: players[idx].id }
  writePlayers(players)
  res.json(players[idx])
})

// POST upload photo for a player
app.post('/api/players/:id/photo', upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' })
  const players = readPlayers()
  const idx = players.findIndex(p => p.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  const imagePath = `/players/${req.file.filename}`
  players[idx].image = imagePath
  writePlayers(players)
  res.json({ image: imagePath })
})

// POST add new player
app.post('/api/players', (req, res) => {
  const players = readPlayers()
  const id = `custom-${Date.now()}`
  const player = { id, name: '', team: '', allStar: false, image: null, ...req.body }
  players.push(player)
  writePlayers(players)
  res.status(201).json(player)
})

// DELETE a player
app.delete('/api/players/:id', (req, res) => {
  const players = readPlayers()
  const idx = players.findIndex(p => p.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  players.splice(idx, 1)
  writePlayers(players)
  res.json({ ok: true })
})

const PORT = 3001
app.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`))
