<template>
  <div class="page" style="max-width:900px">
    <div v-if="loading" style="text-align:center;padding:80px;color:var(--muted)">Loading…</div>

    <div v-else-if="!char" style="text-align:center;padding:80px">
      <div style="font-size:2rem;opacity:0.3;margin-bottom:16px">⚔</div>
      <h2 style="font-family:var(--font-title);color:var(--faint)">Character not found</h2>
      <p style="color:var(--muted);margin-top:8px">This share link may have been revoked or is invalid.</p>
      <router-link to="/" class="btn btn-primary" style="margin-top:20px">Go to Vault</router-link>
    </div>

    <template v-else>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;flex-wrap:wrap;gap:12px">
        <div>
          <h1 style="font-family:var(--font-title);color:var(--acc);font-size:2rem;letter-spacing:0.04em">
            {{ char.name || 'Unnamed Character' }}
          </h1>
          <p style="color:var(--muted);margin-top:4px">
            {{ [char.archetype, char.world].filter(Boolean).join(' · ') }}
          </p>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:0.75rem;color:var(--faint);font-family:var(--font-mono)">Shared · Read-only</span>
          <router-link to="/" class="btn btn-ghost btn-sm">Open Vault</router-link>
        </div>
      </div>

      <!-- Traits -->
      <div class="section-head">Traits</div>
      <div class="grid-4 field-group">
        <div v-for="t in ['body','mind','heart','edge']" :key="t" :class="`trait-box trait-${t}`">
          <span class="trait-name">{{ t }}</span>
          <div class="trait-score">{{ char.traits?.[t] ?? '—' }}</div>
          <div class="trait-bonus">{{ bonus(char.traits?.[t]) }}</div>
        </div>
      </div>

      <!-- Combat stats -->
      <div class="section-head" style="margin-top:8px">Combat</div>
      <div class="grid-4 field-group">
        <div class="stat-block"><div class="stat-val">{{ char.ac || '—' }}</div><div class="stat-lbl">Armor Class</div></div>
        <div class="stat-block"><div class="stat-val">{{ char.hpMax || '—' }}</div><div class="stat-lbl">HP Max</div></div>
        <div class="stat-block"><div class="stat-val">{{ char.speed || '—' }}</div><div class="stat-lbl">Speed</div></div>
        <div class="stat-block"><div class="stat-val">{{ char.initiative || '—' }}</div><div class="stat-lbl">Initiative</div></div>
      </div>

      <!-- Skills -->
      <div v-if="trainedSkills.length" style="margin-top:4px">
        <div class="section-head">Trained Skills</div>
        <div class="skill-chips">
          <span v-for="s in trainedSkills" :key="s" class="skill-chip">{{ s }}</span>
        </div>
      </div>

      <!-- Story -->
      <div v-if="hasStory" style="margin-top:4px">
        <div class="section-head">Story</div>
        <div class="story-grid">
          <div v-if="char.personality" class="story-block">
            <div class="story-lbl">Personality</div>
            <div class="story-val">{{ char.personality }}</div>
          </div>
          <div v-if="char.ideals" class="story-block">
            <div class="story-lbl">Ideals</div>
            <div class="story-val">{{ char.ideals }}</div>
          </div>
          <div v-if="char.bonds" class="story-block">
            <div class="story-lbl">Bonds</div>
            <div class="story-val">{{ char.bonds }}</div>
          </div>
          <div v-if="char.flaws" class="story-block">
            <div class="story-lbl">Flaws</div>
            <div class="story-val">{{ char.flaws }}</div>
          </div>
        </div>
      </div>

      <!-- Backstory -->
      <div v-if="char.backstory" style="margin-top:4px">
        <div class="section-head">Backstory</div>
        <div class="story-val" style="white-space:pre-wrap">{{ char.backstory }}</div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../lib/supabase.js'
import { traitBonus, SKILL_LIST } from '../character.js'

const skillMap = Object.fromEntries(SKILL_LIST.map(s => [s.key, s.label]))

const route = useRoute()
const char = ref(null)
const loading = ref(true)

onMounted(async () => {
  const { data, error } = await supabase
    .from('characters')
    .select('data')
    .eq('share_token', route.params.token)
    .single()

  if (!error && data) char.value = data.data
  loading.value = false
})

function bonus(score) { return traitBonus(score) }

const trainedSkills = computed(() => {
  if (!char.value?.skills) return []
  return Object.entries(char.value.skills)
    .filter(([, v]) => v.proficient)
    .map(([k]) => skillMap[k] ?? k)
})

const hasStory = computed(() =>
  char.value && ['personality', 'ideals', 'bonds', 'flaws'].some(f => char.value[f])
)
</script>

<style scoped>
.stat-block { text-align: center; background: var(--bg2); border: 1px solid var(--border); border-radius: var(--r); padding: 12px 8px; }
.stat-val { font-family: var(--font-title); font-size: 1.4rem; color: var(--white); }
.stat-lbl { font-size: 0.7rem; color: var(--muted); margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
.skill-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
.skill-chip { background: var(--bg2); border: 1px solid var(--acc); color: var(--acc); font-size: 0.8rem; padding: 4px 10px; border-radius: 99px; }
.story-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; margin-top: 10px; }
.story-block { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--r); padding: 12px; }
.story-lbl { font-size: 0.7rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
.story-val { font-size: 0.9rem; color: var(--text); line-height: 1.5; }
</style>
