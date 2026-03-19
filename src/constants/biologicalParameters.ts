// ---------------------------------------------------------------------------
// Biological Parameter Constants
// Pure data + types. No React imports needed.
// i18n keys follow nested dot notation: biological.<category>.<option>.<label|desc>
// ---------------------------------------------------------------------------

import type { PhysicalCategory, WorldPreset } from './physicalParameters'

/* ----------------------------- Categories -------------------------------- */

export const BIOLOGICAL_CATEGORIES: PhysicalCategory[] = [
  // 1. Ecological Dominance
  {
    key: 'dominance',
    icon: '\u{1F451}',          // 👑
    labelKey: 'biological.dominance.label',
    hintKey: 'biological.dominance.hint',
    options: [
      {
        value: 'megafauna',
        icon: '\u{1F9A3}',       // 🦣
        labelKey: 'biological.dominance.megafauna.label',
        descriptionKey: 'biological.dominance.megafauna.desc',
      },
      {
        value: 'swarm',
        icon: '\u{1F41C}',       // 🐜
        labelKey: 'biological.dominance.swarm.label',
        descriptionKey: 'biological.dominance.swarm.desc',
      },
      {
        value: 'flora',
        icon: '\u{1F333}',       // 🌳
        labelKey: 'biological.dominance.flora.label',
        descriptionKey: 'biological.dominance.flora.desc',
      },
      {
        value: 'fungal',
        icon: '\u{1F344}',       // 🍄
        labelKey: 'biological.dominance.fungal.label',
        descriptionKey: 'biological.dominance.fungal.desc',
      },
      {
        value: 'microscopic',
        icon: '\u{1F52C}',       // 🔬
        labelKey: 'biological.dominance.microscopic.label',
        descriptionKey: 'biological.dominance.microscopic.desc',
      },
    ],
  },

  // 2. Relationship with Intelligence
  {
    key: 'intelligence',
    icon: '\u{1F9E0}',          // 🧠
    labelKey: 'biological.intelligence.label',
    hintKey: 'biological.intelligence.hint',
    options: [
      {
        value: 'apex_solo',
        icon: '\u{1F451}',       // 👑
        labelKey: 'biological.intelligence.apex_solo.label',
        descriptionKey: 'biological.intelligence.apex_solo.desc',
      },
      {
        value: 'rival_species',
        icon: '\u{2694}\uFE0F',  // ⚔️
        labelKey: 'biological.intelligence.rival_species.label',
        descriptionKey: 'biological.intelligence.rival_species.desc',
      },
      {
        value: 'symbiotic',
        icon: '\u{1F91D}',       // 🤝
        labelKey: 'biological.intelligence.symbiotic.label',
        descriptionKey: 'biological.intelligence.symbiotic.desc',
      },
      {
        value: 'hive_mind',
        icon: '\u{1F578}\uFE0F', // 🕸️
        labelKey: 'biological.intelligence.hive_mind.label',
        descriptionKey: 'biological.intelligence.hive_mind.desc',
      },
      {
        value: 'uplifted',
        icon: '\u{2728}',        // ✨
        labelKey: 'biological.intelligence.uplifted.label',
        descriptionKey: 'biological.intelligence.uplifted.desc',
      },
    ],
  },

  // 3. Key Biological Resource
  {
    key: 'bio_resource',
    icon: '\u{1F9EA}',          // 🧪
    labelKey: 'biological.bio_resource.label',
    hintKey: 'biological.bio_resource.hint',
    options: [
      {
        value: 'living_material',
        icon: '\u{1F9B4}',       // 🦴
        labelKey: 'biological.bio_resource.living_material.label',
        descriptionKey: 'biological.bio_resource.living_material.desc',
      },
      {
        value: 'secretion',
        icon: '\u{1F36F}',       // 🍯
        labelKey: 'biological.bio_resource.secretion.label',
        descriptionKey: 'biological.bio_resource.secretion.desc',
      },
      {
        value: 'spores',
        icon: '\u{1F4A8}',       // 💨
        labelKey: 'biological.bio_resource.spores.label',
        descriptionKey: 'biological.bio_resource.spores.desc',
      },
      {
        value: 'bio_light',
        icon: '\u{1F3EE}',       // 🏮
        labelKey: 'biological.bio_resource.bio_light.label',
        descriptionKey: 'biological.bio_resource.bio_light.desc',
      },
      {
        value: 'symbiont_access',
        icon: '\u{1F9EC}',       // 🧬
        labelKey: 'biological.bio_resource.symbiont_access.label',
        descriptionKey: 'biological.bio_resource.symbiont_access.desc',
      },
    ],
  },
]

/* -------------------------------- Presets -------------------------------- */

export const BIOLOGICAL_PRESETS: WorldPreset[] = [
  {
    key: 'primordial_jungle',
    nameKey: 'biological.preset.primordial_jungle.name',
    descriptionKey: 'biological.preset.primordial_jungle.desc',
    icon: '\u{1F33F}',          // 🌿
    selections: {
      dominance: 'flora',
      bio_resource: 'living_material',
    },
  },
  {
    key: 'the_network',
    nameKey: 'biological.preset.the_network.name',
    descriptionKey: 'biological.preset.the_network.desc',
    icon: '\u{1F344}',          // 🍄
    selections: {
      dominance: 'fungal',
      intelligence: 'hive_mind',
      bio_resource: 'spores',
    },
  },
  {
    key: 'beast_and_rider',
    nameKey: 'biological.preset.beast_and_rider.name',
    descriptionKey: 'biological.preset.beast_and_rider.desc',
    icon: '\u{1F40E}',          // 🐴
    selections: {
      dominance: 'megafauna',
      intelligence: 'symbiotic',
    },
  },
]

/* ----------------------- Re-export shared types ------------------------- */

export type { PhysicalCategory, PhysicalSelections, WorldPreset } from './physicalParameters'
