<template>
  <!-- PAGE 1 ──────────────────────────────────────────────── -->
  <div class="print-page">
    <div class="print-banner">
      <div>
        <h1 style="font-family:'Cinzel',serif;font-size:16pt;color:#fff;margin:0">THREAD &amp; FATE</h1>
        <div style="font-size:7pt;color:#AEAEB2;letter-spacing:0.1em">STORY-FIRST d20 RPG</div>
      </div>
      <div class="page-label">Character Sheet — Page 1</div>
    </div>

    <!-- Identity -->
    <div class="print-identity">
      <div class="field"><label>Character Name</label><div class="line">{{ c.name }}</div></div>
      <div class="field"><label>Archetype</label><div class="line">{{ c.archetype }}</div></div>
      <div class="field"><label>World / Setting</label><div class="line">{{ c.world }}</div></div>
      <div class="field"><label>Player Name</label><div class="line">{{ c.playerName }}</div></div>
    </div>

    <!-- Three-column layout -->
    <div class="print-cols">
      <!-- COL A: Traits -->
      <div>
        <div v-for="t in traitList" :key="t.key" :class="`print-trait`" :style="`border-top:3px solid ${t.color}`">
          <div class="t-name" :style="`color:${t.color}`">{{ t.label }}</div>
          <div class="t-score">{{ c.traits[t.key] || 3 }}</div>
          <div class="t-bonus">{{ bonus(c.traits[t.key]) }}</div>
          <div style="font-size:6pt;color:#AEAEB2;margin-top:2px">BONUS</div>
        </div>
        <div style="font-size:6pt;text-align:center;color:#AEAEB2;margin:4px 0">Distribute 12 pts · Min 1 · Max 5</div>

        <!-- Inspiration -->
        <div style="border:1px solid #C8C8CC;border-radius:4px;text-align:center;padding:5px;background:#F5F5F7;margin-top:4px">
          <span style="font-family:'Cinzel',serif;font-size:6.5pt;letter-spacing:0.1em;color:#6B6B6E">INSPIRATION</span>
          <div style="font-size:14pt;margin-top:2px">{{ c.inspiration ? '✓' : '☐' }}</div>
        </div>
      </div>

      <!-- COL B: Combat -->
      <div>
        <!-- AC / Init / Speed -->
        <div style="display:flex;gap:4px;margin-bottom:6px">
          <div v-for="stat in combatStats" :key="stat.key"
            style="flex:1;border:1px solid #C8C8CC;border-radius:4px;text-align:center;padding:4px;background:#fff">
            <div style="font-family:'Cinzel',serif;font-size:5.5pt;letter-spacing:0.08em;color:#6B6B6E;text-transform:uppercase">{{ stat.label }}</div>
            <div style="font-size:14pt;font-family:'Cinzel',serif;margin:4px 0">{{ c[stat.key] || '' }}</div>
          </div>
        </div>

        <!-- HP -->
        <div class="p-sec">Hit Points</div>
        <div style="display:flex;align-items:center;gap:4px;margin-bottom:2px">
          <span style="font-size:6pt;color:#6B6B6E">Maximum:</span>
          <div style="flex:1;border-bottom:1px solid #C8C8CC;font-size:8pt">{{ c.hpMax }}</div>
        </div>
        <div class="p-box p-box-sm" style="text-align:center;margin-bottom:3px">
          <div style="font-size:6.5pt;color:#6B6B6E;font-family:'Cinzel',serif;letter-spacing:0.08em">CURRENT HIT POINTS</div>
          <div style="font-size:14pt">{{ c.hpCurrent }}</div>
        </div>
        <div class="p-box p-box-sm" style="text-align:center;margin-bottom:5px">
          <div style="font-size:6.5pt;color:#6B6B6E;font-family:'Cinzel',serif;letter-spacing:0.08em">TEMPORARY HIT POINTS</div>
          <div style="font-size:11pt">{{ c.hpTemp }}</div>
        </div>

        <!-- Hit Dice + Death Saves -->
        <div style="display:flex;gap:4px;margin-bottom:5px">
          <div style="flex:1">
            <div class="p-sec">Hit Dice</div>
            <div class="p-box p-box-sm">Total: {{ c.hitDice }}</div>
          </div>
          <div style="flex:1">
            <div class="p-sec">Death Saves</div>
            <div style="background:#F5F5F7;border:1px solid #C8C8CC;border-radius:3px;padding:3px 5px">
              <div style="font-size:6.5pt;color:#6B6B6E">Successes</div>
              <div class="p-pips">
                <div v-for="i in 3" :key="i" :class="['p-pip', { filled: i <= c.deathSaves.successes }]" />
              </div>
              <div style="font-size:6.5pt;color:#6B6B6E;margin-top:3px">Failures</div>
              <div class="p-pips">
                <div v-for="i in 3" :key="i" :class="['p-pip', { filled: i <= c.deathSaves.failures }]" style="background:#F87171;border-color:#F87171" />
              </div>
            </div>
          </div>
        </div>

        <!-- Resilience & Sparks -->
        <div class="p-sec">Resilience &amp; Sparks</div>
        <div style="background:#fff;border:1px solid #C8C8CC;border-radius:3px;padding:5px;margin-bottom:5px">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
            <span style="font-size:6.5pt;font-weight:bold;color:#6B6B6E;min-width:60px">Resilience</span>
            <div class="p-pips">
              <div v-for="i in 5" :key="i" :class="['p-pip', { filled: i <= c.resilience }]" />
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <span style="font-size:6.5pt;font-weight:bold;color:#6B6B6E;min-width:60px">Sparks</span>
            <div class="p-pips">
              <div v-for="i in 3" :key="i" :class="['p-pip', { filled: i <= c.sparks }]" style="background:#7F77DD;border-color:#7F77DD" />
            </div>
          </div>
        </div>

        <!-- Wound Words -->
        <div style="margin-bottom:5px">
          <div style="font-size:6pt;color:#6B6B6E;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px">Wound Words</div>
          <div class="p-box p-box-sm">{{ c.woundWords }}</div>
        </div>

        <!-- Attacks -->
        <div class="p-sec">Attacks &amp; Actions</div>
        <table class="p-atk-table">
          <thead><tr><th>Name</th><th>Trait</th><th>Notes / Damage</th></tr></thead>
          <tbody>
            <tr v-for="(atk, i) in c.attacks" :key="i">
              <td>{{ atk.name }}</td>
              <td>{{ atk.trait }}</td>
              <td>{{ atk.notes }}</td>
            </tr>
          </tbody>
        </table>

        <!-- Proficiencies -->
        <div class="p-sec">Other Proficiencies &amp; Languages</div>
        <div class="p-box" style="min-height:40px;font-size:8pt">{{ c.proficiencies }}</div>
      </div>

      <!-- COL C: Story & Skills -->
      <div>
        <!-- Story boxes -->
        <div v-for="box in storyBoxes" :key="box.key" style="margin-bottom:6px">
          <div class="p-sec">{{ box.label }}</div>
          <div class="p-box" :style="`min-height:${box.h}px;font-size:8pt`">{{ c[box.key] }}</div>
        </div>

        <!-- Saving Throws -->
        <div class="p-sec">Saving Throws</div>
        <div style="border:1px solid #C8C8CC;border-radius:3px;background:#fff;margin-bottom:5px">
          <div v-for="sv in saveList" :key="sv.key" class="p-skill-row">
            <div :class="['check', { yes: c.savingThrows[sv.key]?.proficient }]" />
            <div class="bonus-box">{{ c.savingThrows[sv.key]?.bonus || '' }}</div>
            <span class="sname">{{ sv.label }}</span>
            <span class="strain">{{ sv.hint }}</span>
          </div>
        </div>

        <!-- Skills list -->
        <div class="p-sec">Skills</div>
        <div style="border:1px solid #C8C8CC;border-radius:3px;background:#fff;margin-bottom:5px">
          <div v-for="sk in skillList" :key="sk.key" class="p-skill-row">
            <div :class="['check', { yes: c.skills[sk.key]?.proficient }]" />
            <div class="bonus-box">{{ c.skills[sk.key]?.bonus || '' }}</div>
            <span class="sname">{{ sk.label }}</span>
            <span class="strain">{{ sk.trait }}</span>
          </div>
        </div>

        <!-- Passive Perception -->
        <div style="background:#EBEBED;border:1px solid #C8C8CC;border-radius:3px;padding:3px 6px;display:flex;align-items:center;gap:8px;margin-bottom:5px">
          <span style="font-size:6.5pt;font-weight:bold;color:#6B6B6E;font-family:'Cinzel',serif;letter-spacing:0.06em">PASSIVE PERCEPTION</span>
          <span style="font-size:9pt;font-weight:bold">{{ c.passivePerception }}</span>
        </div>

        <!-- Starting Skills -->
        <div class="p-sec" style="background:#EEEDFE">Starting Skills (×3)</div>
        <div style="border:1px solid #C8C8CC;border-radius:3px;background:#fff;margin-bottom:5px">
          <div v-for="(sk, i) in c.startingSkills" :key="i"
            style="display:flex;gap:4px;padding:2px 5px;border-bottom:0.5px solid #EBEBED;font-size:7.5pt">
            <span style="color:#7F77DD;font-weight:bold">{{ i+1 }}</span>
            <span style="flex:1">{{ sk.name }}</span>
            <span style="color:#AEAEB2;font-size:6.5pt">{{ sk.trait }}</span>
          </div>
        </div>
      </div>
    </div><!-- end print-cols -->
  </div><!-- end page 1 -->

  <!-- PAGE 2 ──────────────────────────────────────────────── -->
  <div class="print-page">
    <div class="print-banner">
      <div>
        <h1 style="font-family:'Cinzel',serif;font-size:16pt;color:#fff;margin:0">THREAD &amp; FATE</h1>
        <div style="font-size:7pt;color:#AEAEB2;letter-spacing:0.1em">STORY-FIRST d20 RPG</div>
      </div>
      <div class="page-label">Character Sheet — Page 2</div>
    </div>

    <!-- Physical identity -->
    <div class="print-identity">
      <div class="field" style="flex:2"><label>Character Name</label><div class="line">{{ c.name }}</div></div>
      <div v-for="f in ['age','height','weight','eyes','skin','hair']" :key="f" class="field">
        <label>{{ f.charAt(0).toUpperCase()+f.slice(1) }}</label>
        <div class="line">{{ c[f] }}</div>
      </div>
    </div>

    <!-- Two columns -->
    <div style="display:grid;grid-template-columns:2.6in auto;gap:10px">
      <!-- Left -->
      <div>
        <div class="p-sec">Character Appearance</div>
        <!-- Portrait placeholder -->
        <div style="border:1px solid #C8C8CC;border-radius:4px;height:100px;background:#F5F5F7;display:flex;align-items:center;justify-content:center;margin-bottom:5px">
          <span style="font-size:8pt;color:#AEAEB2">Portrait</span>
        </div>
        <div class="p-box" style="min-height:60px;font-size:8pt;margin-bottom:6px">{{ c.appearance }}</div>

        <div class="p-sec">Character Backstory</div>
        <div class="p-box" style="min-height:160px;font-size:8pt">{{ c.backstory }}</div>
      </div>

      <!-- Right -->
      <div>
        <!-- Allies -->
        <div class="p-sec">Allies &amp; Organizations</div>
        <div style="border:1px solid #C8C8CC;border-radius:4px;background:#fff;padding:5px;margin-bottom:6px;min-height:60px">
          <div style="font-size:6.5pt;color:#6B6B6E;margin-bottom:2px">Name: <strong>{{ c.allyName }}</strong></div>
          <div style="font-size:8pt">{{ c.allyNotes }}</div>
        </div>

        <!-- Additional Features -->
        <div class="p-sec">Additional Features &amp; Traits</div>
        <div class="p-box" style="min-height:90px;font-size:8pt;margin-bottom:6px">{{ c.features }}</div>

        <!-- Acquired Skills -->
        <div class="p-sec" style="background:#EEEDFE">Skills Acquired (add as earned)</div>
        <div style="border:1px solid #C8C8CC;border-radius:3px;background:#fff;margin-bottom:6px;display:grid;grid-template-columns:1fr 1fr">
          <div v-for="(sk, i) in c.acquiredSkills" :key="i"
            style="display:flex;gap:4px;padding:2px 5px;border-bottom:0.5px solid #EBEBED;border-right:0.5px solid #EBEBED;font-size:7.5pt">
            <span style="flex:1">{{ sk.name }}</span>
            <span style="color:#AEAEB2;font-size:6.5pt">{{ sk.trait }}</span>
          </div>
          <div v-for="i in Math.max(0, 8 - c.acquiredSkills.length)" :key="`empty-${i}`"
            style="padding:2px 5px;border-bottom:0.5px solid #EBEBED;border-right:0.5px solid #EBEBED;height:18px" />
        </div>

        <!-- Treasure -->
        <div class="p-sec">Treasure &amp; Equipment</div>
        <div style="display:flex;gap:3px;margin-bottom:4px">
          <div v-for="coin in ['cp','sp','gp','pp','ep']" :key="coin"
            style="flex:1;text-align:center;border:1px solid #C8C8CC;border-radius:3px;padding:3px;background:#F5F5F7">
            <div style="font-size:6.5pt;font-weight:bold;color:#6B6B6E">{{ coin.toUpperCase() }}</div>
            <div style="font-size:10pt;font-family:'Cinzel',serif">{{ c.treasure[coin] }}</div>
          </div>
        </div>
        <div class="p-box" style="min-height:40px;font-size:8pt;margin-bottom:6px">{{ c.treasureNotes }}</div>

        <!-- Session Log -->
        <div class="p-sec">Session Log</div>
        <div class="p-box" style="min-height:60px;font-size:8pt">{{ c.sessionLog }}</div>
      </div>
    </div>
  </div><!-- end page 2 -->
</template>

<script setup>
import { SKILL_LIST, traitBonus } from '../character.js'

const props = defineProps({ char: Object })
const c = props.char

const skillList = SKILL_LIST

const traitList = [
  { key: 'body',  label: 'Body',  color: '#F87171' },
  { key: 'mind',  label: 'Mind',  color: '#60A5FA' },
  { key: 'heart', label: 'Heart', color: '#4ADE80' },
  { key: 'edge',  label: 'Edge',  color: '#FBBF24' },
]

const combatStats = [
  { key: 'ac',         label: 'Armor Class' },
  { key: 'initiative', label: 'Initiative'  },
  { key: 'speed',      label: 'Speed'       },
]

const storyBoxes = [
  { key: 'personality', label: 'Personality Traits', h: 42 },
  { key: 'ideals',      label: 'Ideals',              h: 34 },
  { key: 'bonds',       label: 'Bonds',               h: 34 },
  { key: 'flaws',       label: 'Flaws',               h: 34 },
]

const saveList = [
  { key: 'body',  label: 'Body Save',  hint: 'Physical' },
  { key: 'mind',  label: 'Mind Save',  hint: 'Mental'   },
  { key: 'heart', label: 'Heart Save', hint: 'Willpower'},
  { key: 'edge',  label: 'Edge Save',  hint: 'Reflex'   },
]

function bonus(score) { return traitBonus(score) }
</script>
