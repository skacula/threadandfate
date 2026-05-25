# Thread & Fate — Character Builder

A web app for creating and managing characters in the Thread & Fate light RPG system. Characters are stored as JSON files on disk and accessible through a browser-based sheet.

## Features

- **Character Vault** — dashboard listing all characters with name, archetype, world, and last-updated date
- **Character creation** — guided form to set identity fields and distribute 12 trait points across Body, Mind, Heart, and Edge (each scored 1–5)
- **Full character sheet** with five tabs:
  - **Core Sheet** — identity, traits, combat stats (AC, initiative, speed), hit points, resilience pips, sparks, death saves, and story fields (personality, ideals, bonds, flaws)
  - **Skills & Combat** — attacks & actions table, saving throws, full skill list with proficiency checkboxes and bonus overrides, starting skills, and proficiencies/languages
  - **Details & Backstory** — physical description, appearance, backstory, allies & organizations, additional features
  - **Acquired Skills** — add narrative skills earned through play (each grants +2); skills are tagged by trait
  - **Treasure & Log** — currency (CP/SP/GP/PP/EP), equipment notes, and a free-form session log
- **Auto-save** — changes are persisted automatically 1.5 s after the last edit
- **Print layout** — a print-optimized character sheet rendered via `PrintSheet.vue`
- **JSON export** — download any character as a raw `.json` file

## Tech stack

| Layer | Library |
|---|---|
| Frontend | Vue 3 (Composition API) |
| Routing | Vue Router 4 |
| State | Pinia |
| Build | Vite 5 |
| Backend | Express (Node.js) |
| Storage | Flat-file JSON (one directory per character under `characters/`) |

## Getting started

```bash
npm install

# Development (runs Vite dev server + Express API concurrently)
npm run dev
# Vite:    http://localhost:5173
# API:     http://localhost:3001

# Production
npm run build
npm start          # serves built files + API on port 3001
```

## Project structure

```
src/
  views/
    Home.vue          # Character Vault dashboard
    NewCharacter.vue  # Character creation form
    CharacterView.vue # Full tabbed character sheet
  components/
    PrintSheet.vue    # Print-optimized layout
  stores/
    character.js      # Pinia store — fetch, create, save, delete
  character.js        # Data model, SKILL_LIST, defaultCharacter()
  router.js           # Vue Router config
server.js             # Express REST API
characters/           # Persisted character data (one dir per character)
```

## API endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/characters` | List all characters (summary) |
| GET | `/api/characters/:id` | Load a single character |
| POST | `/api/characters` | Create a new character |
| PUT | `/api/characters/:id` | Update a character |
| DELETE | `/api/characters/:id` | Delete a character |
| GET | `/api/characters/:id/json` | Download character as `.json` |
