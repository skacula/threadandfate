<template>
  <div class="page" style="max-width:600px">
    <router-link to="/" class="btn btn-ghost btn-sm" style="margin-bottom:20px">← Back</router-link>
    <h1 style="font-family:var(--font-title);color:var(--acc);margin-bottom:6px">Create Character</h1>
    <p style="color:var(--muted);margin-bottom:28px">Fill in the basics to begin. You can add full details on the character sheet.</p>

    <div class="card">
      <div class="field-group">
        <label class="field-label">Character Name *</label>
        <input v-model="form.name" placeholder="e.g. Elowen Ashbrook" autofocus />
      </div>
      <div class="field-group">
        <label class="field-label">Archetype</label>
        <input v-model="form.archetype" placeholder="e.g. Wandering Scholar" />
      </div>
      <div class="field-group">
        <label class="field-label">World / Setting</label>
        <input v-model="form.world" placeholder="e.g. A crumbling empire" />
      </div>
      <div class="field-group">
        <label class="field-label">Player Name</label>
        <input v-model="form.playerName" placeholder="Your name" />
      </div>

      <div style="margin-top:8px;margin-bottom:20px;">
        <div class="section-head" style="margin-bottom:12px">Traits — Distribute 12 points (min 1, max 5)</div>
        <div class="grid-4">
          <div v-for="t in traits" :key="t" :class="`trait-box trait-${t}`">
            <span class="trait-name">{{ t }}</span>
            <input class="trait-score" type="number" v-model.number="form.traits[t]" min="1" max="5" />
            <div class="trait-bonus">{{ bonus(form.traits[t]) }}</div>
          </div>
        </div>
        <p style="font-size:0.8rem;color:var(--muted);margin-top:8px;text-align:center">
          Total: <strong :style="{ color: total === 12 ? 'var(--succ-fg)' : 'var(--fail-fg)' }">{{ total }}</strong> / 12
        </p>
      </div>

      <div v-if="error" style="color:var(--fail-fg);margin-bottom:12px;font-size:0.9rem">{{ error }}</div>

      <div style="display:flex;gap:10px;justify-content:flex-end">
        <router-link to="/" class="btn btn-ghost">Cancel</router-link>
        <button class="btn btn-primary" :disabled="!form.name || total !== 12" @click="create">
          Create &amp; Open Sheet
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCharacterStore } from '../stores/character.js'
import { defaultCharacter, traitBonus } from '../character.js'

const store = useCharacterStore()
const router = useRouter()
const error = reactive({ value: '' })

const traits = ['body', 'mind', 'heart', 'edge']
const form = reactive({ ...defaultCharacter(), name: '', traits: { body:3, mind:3, heart:3, edge:3 } })

const total = computed(() => traits.reduce((s, t) => s + (form.traits[t] || 0), 0))

function bonus(score) { return traitBonus(score) }

async function create() {
  if (!form.name) return
  if (total.value !== 12) return
  try {
    const char = await store.create(form)
    router.push(`/character/${char.id}`)
  } catch (e) { error.value = e.message }
}
</script>
