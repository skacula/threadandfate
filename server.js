import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000
const CHARS_DIR = path.join(__dirname, 'characters')

app.use(express.json())
app.use(express.static(path.join(__dirname, 'dist')))

// Ensure characters directory exists
if (!fs.existsSync(CHARS_DIR)) fs.mkdirSync(CHARS_DIR, { recursive: true })

// Slugify a name into a safe directory name
function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'character'
}

// Make a unique ID: slug + short timestamp
function makeId(name) {
  const slug = slugify(name)
  const ts = Date.now().toString(36)
  return `${slug}-${ts}`
}

function charPath(id) {
  return path.join(CHARS_DIR, id, 'character.json')
}

// GET /api/characters — list all
app.get('/api/characters', (req, res) => {
  try {
    if (!fs.existsSync(CHARS_DIR)) return res.json([])
    const dirs = fs.readdirSync(CHARS_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory())
    const characters = dirs.map(d => {
      const file = path.join(CHARS_DIR, d.name, 'character.json')
      if (!fs.existsSync(file)) return null
      try {
        const data = JSON.parse(fs.readFileSync(file, 'utf-8'))
        return { id: data.id, name: data.name, archetype: data.archetype,
                 world: data.world, updatedAt: data.meta?.updatedAt }
      } catch { return null }
    }).filter(Boolean)
    res.json(characters)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/characters/:id
app.get('/api/characters/:id', (req, res) => {
  try {
    const file = charPath(req.params.id)
    if (!fs.existsSync(file)) return res.status(404).json({ error: 'Not found' })
    res.json(JSON.parse(fs.readFileSync(file, 'utf-8')))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/characters — create new
app.post('/api/characters', (req, res) => {
  try {
    const body = req.body
    const id = makeId(body.name || 'character')
    const dir = path.join(CHARS_DIR, id)
    fs.mkdirSync(dir, { recursive: true })
    const character = {
      ...body,
      id,
      meta: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    }
    fs.writeFileSync(path.join(dir, 'character.json'), JSON.stringify(character, null, 2))
    res.status(201).json(character)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// PUT /api/characters/:id — update
app.put('/api/characters/:id', (req, res) => {
  try {
    const file = charPath(req.params.id)
    const dir = path.join(CHARS_DIR, req.params.id)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const existing = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf-8')) : {}
    const character = {
      ...existing,
      ...req.body,
      id: req.params.id,
      meta: { createdAt: existing.meta?.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString() }
    }
    fs.writeFileSync(file, JSON.stringify(character, null, 2))
    res.json(character)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// DELETE /api/characters/:id
app.delete('/api/characters/:id', (req, res) => {
  try {
    const dir = path.join(CHARS_DIR, req.params.id)
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true })
    res.json({ deleted: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/characters/:id/json — download raw JSON
app.get('/api/characters/:id/json', (req, res) => {
  try {
    const file = charPath(req.params.id)
    if (!fs.existsSync(file)) return res.status(404).json({ error: 'Not found' })
    const data = fs.readFileSync(file, 'utf-8')
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.id}.json"`)
    res.send(data)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Fallback for SPA routing in production
app.get('*', (req, res) => {
  const index = path.join(__dirname, 'dist', 'index.html')
  if (fs.existsSync(index)) res.sendFile(index)
  else res.status(404).send('Run `npm run build` first, or use `npm run dev` for development.')
})

app.listen(PORT, () => console.log(`Thread & Fate API running on http://localhost:${PORT}`))
