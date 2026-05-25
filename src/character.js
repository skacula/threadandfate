export const TRAITS = ['body', 'mind', 'heart', 'edge']

export const SKILL_LIST = [
  { key: 'acrobatics',    label: 'Acrobatics',     trait: 'Edge'  },
  { key: 'animalHandling',label: 'Animal Handling', trait: 'Heart' },
  { key: 'arcana',        label: 'Arcana',          trait: 'Mind'  },
  { key: 'athletics',     label: 'Athletics',       trait: 'Body'  },
  { key: 'deception',     label: 'Deception',       trait: 'Heart' },
  { key: 'history',       label: 'History',         trait: 'Mind'  },
  { key: 'insight',       label: 'Insight',         trait: 'Mind'  },
  { key: 'intimidation',  label: 'Intimidation',    trait: 'Heart' },
  { key: 'investigation', label: 'Investigation',   trait: 'Mind'  },
  { key: 'medicine',      label: 'Medicine',        trait: 'Mind'  },
  { key: 'nature',        label: 'Nature',          trait: 'Mind'  },
  { key: 'perception',    label: 'Perception',      trait: 'Mind'  },
  { key: 'performance',   label: 'Performance',     trait: 'Heart' },
  { key: 'persuasion',    label: 'Persuasion',      trait: 'Heart' },
  { key: 'religion',      label: 'Religion',        trait: 'Mind'  },
  { key: 'sleightOfHand', label: 'Sleight of Hand', trait: 'Edge'  },
  { key: 'stealth',       label: 'Stealth',         trait: 'Edge'  },
  { key: 'survival',      label: 'Survival',        trait: 'Body'  },
]

export function traitBonus(score) {
  const b = (score || 3) - 3
  return (b >= 0 ? '+' : '') + b
}

export function defaultCharacter() {
  const skills = {}
  SKILL_LIST.forEach(s => { skills[s.key] = { proficient: false, bonus: '' } })

  return {
    id: '',
    name: '',
    archetype: '',
    world: '',
    playerName: '',
    meta: { createdAt: '', updatedAt: '' },

    // Traits
    traits: { body: 3, mind: 3, heart: 3, edge: 3 },

    // Combat
    ac: '',
    initiative: '',
    speed: '30 ft.',
    hpMax: '',
    hpCurrent: '',
    hpTemp: '',
    hitDice: '',

    // Resilience tracking
    resilience: 5,
    sparks: 3,
    inspiration: false,
    woundWords: '',
    deathSaves: { successes: 0, failures: 0 },

    // Attacks
    attacks: [
      { name: '', trait: '', notes: '' },
      { name: '', trait: '', notes: '' },
      { name: '', trait: '', notes: '' },
      { name: '', trait: '', notes: '' },
    ],

    // Skills & saves
    proficiencies: '',
    passivePerception: '',
    savingThrows: {
      body:  { proficient: false, bonus: '' },
      mind:  { proficient: false, bonus: '' },
      heart: { proficient: false, bonus: '' },
      edge:  { proficient: false, bonus: '' },
    },
    skills,

    // Starting skills (chosen at creation)
    startingSkills: [
      { name: '', trait: '' },
      { name: '', trait: '' },
      { name: '', trait: '' },
    ],

    // Story
    personality: '',
    ideals: '',
    bonds: '',
    flaws: '',

    // Page 2 — details
    age: '',
    height: '',
    weight: '',
    eyes: '',
    skin: '',
    hair: '',
    appearance: '',
    backstory: '',
    allyName: '',
    allyNotes: '',
    features: '',

    // Acquired skills (grows over time)
    acquiredSkills: [],

    // Treasure
    treasure: { cp: '', sp: '', gp: '', pp: '', ep: '' },
    treasureNotes: '',
    sessionLog: '',
  }
}
