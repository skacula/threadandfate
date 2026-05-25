import 'dotenv/config'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

app.use(express.json())
app.use(express.static(path.join(__dirname, 'dist')))

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'character'
}

function makeId(name) {
  const slug = slugify(name)
  const ts = Date.now().toString(36)
  return `${slug}-${ts}`
}

// GET /api/characters — list all
app.get('/api/characters', async (req, res) => {
  const { data, error } = await supabase
    .from('characters')
    .select('id, name, archetype, world, player_name, updated_at')
    .order('updated_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })

  res.json(data.map(r => ({
    id: r.id,
    name: r.name,
    archetype: r.archetype,
    world: r.world,
    updatedAt: r.updated_at
  })))
})

// GET /api/characters/:id
app.get('/api/characters/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('characters')
    .select('data')
    .eq('id', req.params.id)
    .single()

  if (error) return res.status(404).json({ error: 'Not found' })
  res.json(data.data)
})

// POST /api/characters — create new
app.post('/api/characters', async (req, res) => {
  const body = req.body
  const id = makeId(body.name || 'character')
  const now = new Date().toISOString()
  const character = { ...body, id, meta: { createdAt: now, updatedAt: now } }

  const { error } = await supabase.from('characters').insert({
    id,
    name: character.name || '',
    archetype: character.archetype || '',
    world: character.world || '',
    player_name: character.playerName || '',
    data: character
  })

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(character)
})

// PUT /api/characters/:id — update
app.put('/api/characters/:id', async (req, res) => {
  const id = req.params.id
  const now = new Date().toISOString()

  // Fetch existing to preserve createdAt
  const { data: existing } = await supabase
    .from('characters')
    .select('data')
    .eq('id', id)
    .single()

  const createdAt = existing?.data?.meta?.createdAt || now
  const character = {
    ...existing?.data,
    ...req.body,
    id,
    meta: { createdAt, updatedAt: now }
  }

  const { error } = await supabase.from('characters').upsert({
    id,
    name: character.name || '',
    archetype: character.archetype || '',
    world: character.world || '',
    player_name: character.playerName || '',
    data: character
  })

  if (error) return res.status(500).json({ error: error.message })
  res.json(character)
})

// DELETE /api/characters/:id
app.delete('/api/characters/:id', async (req, res) => {
  const { error } = await supabase
    .from('characters')
    .delete()
    .eq('id', req.params.id)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ deleted: true })
})

// GET /api/characters/:id/json — download raw JSON export
app.get('/api/characters/:id/json', async (req, res) => {
  const { data, error } = await supabase
    .from('characters')
    .select('data')
    .eq('id', req.params.id)
    .single()

  if (error) return res.status(404).json({ error: 'Not found' })
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Content-Disposition', `attachment; filename="${req.params.id}.json"`)
  res.send(JSON.stringify(data.data, null, 2))
})

// Fallback for SPA routing in production
app.get('*', (req, res) => {
  const index = path.join(__dirname, 'dist', 'index.html')
  res.sendFile(index, err => {
    if (err) res.status(404).send('Run `npm run build` first, or use `npm run dev` for development.')
  })
})

app.listen(PORT, () => console.log(`Thread & Fate API running on http://localhost:${PORT}`))
