<template>
  <div>
    <!-- ── Toolbar (no-print) ──────────────────────────────── -->
    <div class="sheet-toolbar no-print" v-if="char">
      <router-link :to="auth.isGM ? '/gm' : '/'" class="btn btn-ghost btn-sm">
        {{ auth.isGM ? '← GM Dashboard' : '← Vault' }}
      </router-link>
      <div style="display:flex;align-items:center;gap:10px;flex:1;justify-content:center">
        <span v-if="isGmView" class="gm-edit-badge">GM Edit</span>
        <span class="char-title">{{ char.name || 'Unnamed' }}</span>
        <span class="char-sub">{{ char.archetype }}</span>
      </div>
      <div style="display:flex;gap:8px">
        <button v-if="!isGmView" class="btn btn-ghost btn-sm" @click="share">
          {{ shareCopied ? '✓ Copied' : '🔗 Share' }}
        </button>
        <button class="btn btn-ghost btn-sm" @click="print">🖨 Print</button>
        <button class="btn btn-primary btn-sm" @click="saveChar">
          {{ store.saved ? '✓ Saved' : 'Save' }}
        </button>
      </div>
    </div>

    <!-- ── Tabs (no-print) ────────────────────────────────── -->
    <div class="no-print" v-if="char" style="padding:0 20px;max-width:1280px;margin:0 auto">
      <div class="tabs">
        <button v-for="t in tabs" :key="t.id"
          :class="['tab-btn', { active: tab === t.id }]"
          @click="tab = t.id">{{ t.label }}</button>
      </div>
    </div>

    <!-- ── Loading / error ────────────────────────────────── -->
    <div v-if="store.loading" class="page" style="text-align:center;padding:60px;color:var(--muted)">Loading…</div>
    <div v-else-if="!char" class="page" style="text-align:center;padding:60px;color:var(--fail-fg)">
      Character not found.
      <div v-if="store.error" style="margin-top:10px;font-size:0.78rem;color:var(--muted);font-family:var(--font-mono);white-space:pre-wrap">{{ store.error }}</div>
    </div>

    <template v-else>
      <!-- ════════════════════════════════════════════════════ -->
      <!-- SCREEN TABS                                          -->
      <!-- ════════════════════════════════════════════════════ -->
      <div class="page no-print">

        <!-- ── TAB: Core ────────────────────────────────────── -->
        <div v-show="tab === 'core'">
          <!-- Identity -->
          <div class="section-head">Identity</div>
          <div class="grid-4 field-group">
            <div>
              <label class="field-label">Character Name</label>
              <input v-model="char.name" />
            </div>
            <div>
              <label class="field-label">Archetype</label>
              <input v-model="char.archetype" placeholder="e.g. Wandering Scholar" />
            </div>
            <div>
              <label class="field-label">World / Setting</label>
              <input v-model="char.world" />
            </div>
            <div>
              <label class="field-label">Player Name</label>
              <input v-model="char.playerName" />
            </div>
          </div>

          <!-- Traits + Combat split -->
          <div class="two-col-layout">
            <!-- Left: Traits -->
            <div>
              <div class="section-head">Traits — distribute 12 pts (min 1, max 5)</div>
              <div class="grid-4 field-group">
                <div v-for="t in ['body','mind','heart','edge']" :key="t" :class="`trait-box trait-${t}`">
                  <span class="trait-name">{{ t }}</span>
                  <input class="trait-score" type="number" v-model.number="char.traits[t]" min="1" max="5" />
                  <div class="trait-bonus">{{ bonus(char.traits[t]) }}</div>
                </div>
              </div>
              <p style="font-size:0.8rem;text-align:center;margin-top:-6px;margin-bottom:16px">
                Total: <strong :style="{ color: traitTotal === 12 ? 'var(--succ-fg)' : 'var(--fail-fg)' }">{{ traitTotal }}</strong> / 12
              </p>

              <!-- Inspiration -->
              <div class="field-group" style="display:flex;align-items:center;gap:10px">
                <input type="checkbox" id="inspiration" v-model="char.inspiration" style="width:18px;height:18px" />
                <label for="inspiration" class="field-label" style="margin:0;cursor:pointer">Inspiration</label>
              </div>
            </div>

            <!-- Right: Combat -->
            <div>
              <div class="section-head">Combat Statistics</div>
              <div class="grid-3 field-group">
                <div>
                  <label class="field-label">Armor Class</label>
                  <input v-model="char.ac" type="number" placeholder="10" />
                </div>
                <div>
                  <label class="field-label">Initiative</label>
                  <input v-model="char.initiative" placeholder="d20+Edge" />
                </div>
                <div>
                  <label class="field-label">Speed</label>
                  <input v-model="char.speed" placeholder="30 ft." />
                </div>
              </div>

              <div class="section-head" style="margin-top:8px">Hit Points</div>
              <div class="grid-3 field-group">
                <div>
                  <label class="field-label">Maximum</label>
                  <input v-model="char.hpMax" type="number" />
                </div>
                <div>
                  <label class="field-label">Current</label>
                  <input v-model="char.hpCurrent" type="number" />
                </div>
                <div>
                  <label class="field-label">Temporary</label>
                  <input v-model="char.hpTemp" type="number" />
                </div>
              </div>

              <div class="field-group">
                <label class="field-label">Hit Dice</label>
                <input v-model="char.hitDice" placeholder="e.g. 3d8" />
              </div>

              <!-- Resilience & Sparks -->
              <div class="section-head">Resilience & Sparks</div>
              <div class="pips-row field-group">
                <label class="field-label" style="min-width:90px">Resilience</label>
                <div class="pips">
                  <button v-for="i in 5" :key="i"
                    :class="['pip', { filled: i <= char.resilience }]"
                    @click="char.resilience = i <= char.resilience ? i-1 : i" />
                </div>
              </div>
              <div class="pips-row field-group">
                <label class="field-label" style="min-width:90px">Sparks</label>
                <div class="pips">
                  <button v-for="i in 3" :key="i"
                    :class="['pip', { filled: i <= char.sparks }]"
                    @click="char.sparks = i <= char.sparks ? i-1 : i" />
                </div>
              </div>

              <div class="field-group">
                <label class="field-label">Wound Words</label>
                <input v-model="char.woundWords" placeholder="e.g. Haunted by the fire" />
              </div>

              <!-- Death Saves -->
              <div class="section-head">Death Saves</div>
              <div class="grid-2 field-group">
                <div>
                  <label class="field-label">Successes</label>
                  <div class="pips">
                    <button v-for="i in 3" :key="i"
                      :class="['pip', { filled: i <= char.deathSaves.successes }]"
                      @click="char.deathSaves.successes = i <= char.deathSaves.successes ? i-1 : i" />
                  </div>
                </div>
                <div>
                  <label class="field-label">Failures</label>
                  <div class="pips">
                    <button v-for="i in 3" :key="i"
                      :class="['pip', 'red', { filled: i <= char.deathSaves.failures }]"
                      @click="char.deathSaves.failures = i <= char.deathSaves.failures ? i-1 : i" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Story boxes -->
          <div class="section-head">Story</div>
          <div class="grid-2 field-group">
            <div>
              <label class="field-label">Personality Traits</label>
              <textarea v-model="char.personality" rows="3"></textarea>
            </div>
            <div>
              <label class="field-label">Ideals</label>
              <textarea v-model="char.ideals" rows="3"></textarea>
            </div>
            <div>
              <label class="field-label">Bonds</label>
              <textarea v-model="char.bonds" rows="3"></textarea>
            </div>
            <div>
              <label class="field-label">Flaws</label>
              <textarea v-model="char.flaws" rows="3"></textarea>
            </div>
          </div>
        </div>

        <!-- ── TAB: Skills & Combat ─────────────────────────── -->
        <div v-show="tab === 'skills'">
          <!-- Attacks -->
          <div class="section-head">Attacks & Actions</div>
          <div class="card field-group" style="padding:0;overflow:hidden">
            <table class="atk-table">
              <thead>
                <tr>
                  <th>Name</th><th>Trait</th><th>Notes / Damage</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(atk, i) in char.attacks" :key="i">
                  <td><input v-model="atk.name" /></td>
                  <td>
                    <select v-model="atk.trait">
                      <option value="">—</option>
                      <option v-for="t in ['Body','Mind','Heart','Edge']" :key="t">{{ t }}</option>
                    </select>
                  </td>
                  <td><input v-model="atk.notes" /></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Saving Throws -->
          <div class="section-head">Saving Throws</div>
          <div class="grid-2 field-group">
            <div v-for="t in ['body','mind','heart','edge']" :key="t" :class="`save-row save-${t}`">
              <input type="checkbox" v-model="char.savingThrows[t].proficient" />
              <input class="bonus-input" v-model="char.savingThrows[t].bonus" placeholder="+0" />
              <span class="save-name">{{ t.charAt(0).toUpperCase()+t.slice(1) }} Save</span>
              <span class="save-hint">{{ saveHint[t] }}</span>
            </div>
          </div>

          <!-- Skills -->
          <div class="section-head">Skills</div>
          <div class="grid-2 field-group">
            <div v-for="sk in skillList" :key="sk.key" class="skill-row">
              <input type="checkbox" v-model="char.skills[sk.key].proficient" />
              <input class="bonus-input" v-model="char.skills[sk.key].bonus" placeholder="+0" />
              <span class="skill-name">{{ sk.label }}</span>
              <span :class="`skill-trait trait-tag-${sk.trait.toLowerCase()}`">{{ sk.trait }}</span>
            </div>
          </div>

          <div class="field-group">
            <label class="field-label">Passive Perception (Mind)</label>
            <input v-model="char.passivePerception" style="max-width:120px" />
          </div>

          <!-- Starting Skills -->
          <div class="section-head">Starting Skills (choose 3 at creation — each grants +2)</div>
          <div class="card field-group">
            <div v-for="(sk, i) in char.startingSkills" :key="i" class="starting-skill-row">
              <span class="sk-num">{{ i+1 }}</span>
              <input v-model="sk.name" placeholder="Skill description…" />
              <select v-model="sk.trait" style="max-width:110px">
                <option value="">Trait</option>
                <option v-for="t in ['Body','Mind','Heart','Edge']" :key="t">{{ t }}</option>
              </select>
            </div>
          </div>

          <!-- Proficiencies -->
          <div class="field-group">
            <label class="field-label">Other Proficiencies & Languages</label>
            <textarea v-model="char.proficiencies" rows="3"></textarea>
          </div>
        </div>

        <!-- ── TAB: Details ─────────────────────────────────── -->
        <div v-show="tab === 'details'">
          <!-- Physical -->
          <div class="section-head">Physical Description</div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px">
            <div v-for="f in physFields" :key="f.key" :style="`flex:${f.flex || 1};min-width:80px`">
              <label class="field-label">{{ f.label }}</label>
              <input v-model="char[f.key]" />
            </div>
          </div>

          <div class="grid-2 field-group">
            <div>
              <label class="field-label">Character Appearance</label>
              <textarea v-model="char.appearance" rows="6"></textarea>
            </div>
            <div>
              <label class="field-label">Character Backstory</label>
              <textarea v-model="char.backstory" rows="6"></textarea>
            </div>
          </div>

          <div class="section-head">Allies & Organizations</div>
          <div class="field-group">
            <label class="field-label">Name / Organization</label>
            <input v-model="char.allyName" />
          </div>
          <div class="field-group">
            <label class="field-label">Notes</label>
            <textarea v-model="char.allyNotes" rows="3"></textarea>
          </div>

          <div class="field-group">
            <label class="field-label">Additional Features & Traits</label>
            <textarea v-model="char.features" rows="4"></textarea>
          </div>
        </div>

        <!-- ── TAB: Acquired Skills ──────────────────────────── -->
        <div v-show="tab === 'acquired'">
          <div class="section-head">Skills Acquired (add as earned over time)</div>
          <p style="color:var(--muted);font-size:0.9rem;margin-bottom:16px">
            Gain a new skill every 3 sessions, at milestones, through training, or via bonds. Each grants +2 when applied.
          </p>

          <!-- Add new skill -->
          <div class="card field-group">
            <div style="display:flex;gap:10px;align-items:flex-end">
              <div style="flex:1">
                <label class="field-label">Skill Description</label>
                <input v-model="newSkill.name" placeholder="e.g. Navigating ancient ruins" @keyup.enter="addSkill" />
              </div>
              <div style="width:130px">
                <label class="field-label">Trait</label>
                <select v-model="newSkill.trait">
                  <option value="">Choose</option>
                  <option v-for="t in ['Body','Mind','Heart','Edge']" :key="t">{{ t }}</option>
                </select>
              </div>
              <button class="btn btn-primary" :disabled="!newSkill.name" @click="addSkill">+ Add</button>
            </div>
          </div>

          <div v-if="char.acquiredSkills.length === 0" style="color:var(--muted);text-align:center;padding:32px">
            No acquired skills yet. Add them as your character grows.
          </div>
          <div v-else class="acquired-grid">
            <div v-for="(sk, i) in char.acquiredSkills" :key="i" class="acq-card">
              <div class="acq-name">{{ sk.name }}</div>
              <div :class="`acq-trait trait-tag-${(sk.trait||'').toLowerCase()}`">{{ sk.trait || '—' }}</div>
              <button class="acq-del" @click="removeSkill(i)">✕</button>
            </div>
          </div>
        </div>

        <!-- ── TAB: Treasure ─────────────────────────────────── -->
        <div v-show="tab === 'treasure'">
          <div class="section-head">Currency</div>
          <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">
            <div v-for="coin in ['cp','sp','gp','pp','ep']" :key="coin" style="flex:1;min-width:80px;text-align:center">
              <label class="field-label" style="text-align:center">{{ coin.toUpperCase() }}</label>
              <input v-model="char.treasure[coin]" type="number" style="text-align:center" />
            </div>
          </div>

          <div class="field-group">
            <label class="field-label">Equipment & Notes</label>
            <textarea v-model="char.treasureNotes" rows="5"></textarea>
          </div>

          <div class="section-head">Session Log</div>
          <div class="field-group">
            <label class="field-label">What happened? What changed?</label>
            <textarea v-model="char.sessionLog" rows="8"></textarea>
          </div>
        </div>

      </div><!-- end .page.no-print -->

      <!-- ══════════════════════════════════════════════════════ -->
      <!-- PRINT LAYOUT (always rendered, hidden on screen)       -->
      <!-- ══════════════════════════════════════════════════════ -->
      <div class="print-only" style="display:none">
        <PrintSheet :char="char" />
      </div>

    </template><!-- end v-else (char loaded) -->

    <!-- Save toast -->
    <div v-if="store.saved" class="toast">✓ Character saved</div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useCharacterStore } from '../stores/character.js'
import { useAuthStore } from '../stores/auth.js'
import { SKILL_LIST, traitBonus } from '../character.js'
import PrintSheet from '../components/PrintSheet.vue'

const route = useRoute()
const store = useCharacterStore()
const auth  = useAuthStore()
const shareCopied = ref(false)

// True when a GM is viewing a character they don't own
const isGmView = computed(() =>
  auth.isGM && store.characterOwnerId !== null && store.characterOwnerId !== auth.user?.id
)

const tab = ref('core')
const tabs = [
  { id: 'core',     label: 'Core Sheet' },
  { id: 'skills',   label: 'Skills & Combat' },
  { id: 'details',  label: 'Details & Backstory' },
  { id: 'acquired', label: 'Acquired Skills' },
  { id: 'treasure', label: 'Treasure & Log' },
]

const char = computed(() => store.current)
const skillList = SKILL_LIST
const newSkill = reactive({ name: '', trait: '' })

const saveHint = {
  body: 'Physical threats',
  mind: 'Mental threats',
  heart: 'Willpower threats',
  edge: 'Reflex threats',
}

const physFields = [
  { key:'age', label:'Age', flex:0.8 },
  { key:'height', label:'Height', flex:0.8 },
  { key:'weight', label:'Weight', flex:0.8 },
  { key:'eyes', label:'Eyes' },
  { key:'skin', label:'Skin' },
  { key:'hair', label:'Hair' },
]

const traitTotal = computed(() => {
  if (!char.value) return 0
  return ['body','mind','heart','edge'].reduce((s,t) => s + (char.value.traits[t] || 0), 0)
})

function bonus(score) { return traitBonus(score) }

onMounted(() => store.fetchOne(route.params.id))

// Auto-save on changes (debounced)
let saveTimer = null
watch(char, () => {
  if (!char.value?.id) return
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => store.save(char.value.id, char.value, true), 1500)
}, { deep: true })

async function saveChar() {
  if (char.value?.id) await store.save(char.value.id, char.value)
}

function print() { window.print() }

async function share() {
  let token = store.shareToken
  if (!token) token = await store.generateShareToken(char.value.id)
  const url = `${window.location.origin}/share/${token}`
  await navigator.clipboard.writeText(url)
  shareCopied.value = true
  setTimeout(() => { shareCopied.value = false }, 2500)
}

function addSkill() {
  if (!newSkill.name) return
  char.value.acquiredSkills.push({ name: newSkill.name, trait: newSkill.trait })
  newSkill.name = ''; newSkill.trait = ''
}

function removeSkill(i) {
  char.value.acquiredSkills.splice(i, 1)
}
</script>

<style scoped>
/* Toolbar */
.sheet-toolbar {
  background: var(--bg2); border-bottom: 1px solid var(--border);
  padding: 10px 20px; display: flex; align-items: center; gap: 12px;
  position: sticky; top: 52px; z-index: 90;
}
.char-title { font-family: var(--font-title); font-size: 1rem; color: var(--white); }
.char-sub   { font-size: 0.85rem; color: var(--acc); font-style: italic; }
.gm-edit-badge {
  font-size: 0.65rem; font-family: var(--font-title); letter-spacing: 0.08em;
  color: var(--acc); background: color-mix(in srgb, var(--acc) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--acc) 35%, transparent);
  border-radius: 20px; padding: 2px 8px; flex-shrink: 0;
}

/* Two-col layout for core tab */
.two-col-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 16px; }
@media (max-width: 860px) { .two-col-layout { grid-template-columns: 1fr; } }

/* Pips row */
.pips-row { display: flex; align-items: center; gap: 10px; }

/* Attacks table */
.atk-table { width: 100%; border-collapse: collapse; }
.atk-table th {
  background: var(--ink); color: var(--white);
  padding: 8px 10px; text-align: left;
  font-family: var(--font-title); font-size: 0.7rem; letter-spacing: 0.08em;
}
.atk-table td { padding: 2px 4px; }
.atk-table tr:nth-child(even) td { background: var(--bg3); }
.atk-table input, .atk-table select { border-radius: 2px; }

/* Save & skill rows */
.save-row, .skill-row {
  display: flex; align-items: center; gap: 8px;
  padding: 4px 8px; border-radius: var(--r);
  font-size: 0.88rem;
}
.save-row:nth-child(even), .skill-row:nth-child(even) { background: var(--bg3); }
.save-row input[type="checkbox"], .skill-row input[type="checkbox"] { width:14px; height:14px; flex-shrink:0; }
.bonus-input { width: 44px; text-align: center; padding: 2px 4px; flex-shrink: 0; }
.save-name, .skill-name { flex: 1; }
.save-hint { font-size: 0.75rem; color: var(--muted); }

/* Trait & skill trait tags */
.skill-trait, .save-hint { font-size: 0.72rem; }
.trait-tag-body  { color: var(--fail-fg); }
.trait-tag-mind  { color: var(--info-fg); }
.trait-tag-heart { color: var(--succ-fg); }
.trait-tag-edge  { color: var(--part-fg); }
.save-body  { border-left: 3px solid var(--fail-fg); }
.save-mind  { border-left: 3px solid var(--info-fg); }
.save-heart { border-left: 3px solid var(--succ-fg); }
.save-edge  { border-left: 3px solid var(--part-fg); }

/* Starting skills */
.starting-skill-row { display:flex; align-items:center; gap:10px; margin-bottom:8px; }
.sk-num {
  width:24px; height:24px; flex-shrink:0;
  background: var(--acc); color: var(--white);
  border-radius: 50%; display:flex; align-items:center; justify-content:center;
  font-size: 0.75rem; font-family: var(--font-title);
}

/* Acquired skills */
.acquired-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px,1fr)); gap: 10px; }
.acq-card {
  background: var(--bg3); border: 1px solid var(--crit-bg);
  border-radius: var(--r); padding: 10px 12px;
  display: flex; flex-direction: column; gap: 4px; position: relative;
}
.acq-name { font-size: 0.9rem; color: var(--white); }
.acq-trait { font-size: 0.75rem; font-style: italic; }
.acq-del {
  position: absolute; top: 6px; right: 8px;
  background: none; border: none; color: var(--muted);
  cursor: pointer; font-size: 0.8rem;
}
.acq-del:hover { color: var(--fail-fg); }
</style>
