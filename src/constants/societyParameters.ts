// ---------------------------------------------------------------------------
// Society Parameter Constants
// Pure data + types. No React imports needed.
// i18n keys use `society_layer.*` prefix to avoid conflicts with existing keys.
// ---------------------------------------------------------------------------

import type { PhysicalCategory, WorldPreset } from './physicalParameters'

/* ----------------------------- Categories -------------------------------- */

export const SOCIETY_CATEGORIES: PhysicalCategory[] = [
  // 1. Source of Power
  {
    key: 'power_source',
    icon: '\u{1F525}',          // 🔥
    labelKey: 'society_layer.power_source.label',
    hintKey: 'society_layer.power_source.hint',
    options: [
      {
        value: 'resource_control',
        icon: '\u{1F512}',       // 🔒
        labelKey: 'society_layer.power_source.resource_control.label',
        descriptionKey: 'society_layer.power_source.resource_control.desc',
      },
      {
        value: 'knowledge',
        icon: '\u{1F4D6}',       // 📖
        labelKey: 'society_layer.power_source.knowledge.label',
        descriptionKey: 'society_layer.power_source.knowledge.desc',
      },
      {
        value: 'lineage',
        icon: '\u{1F4DC}',       // 📜
        labelKey: 'society_layer.power_source.lineage.label',
        descriptionKey: 'society_layer.power_source.lineage.desc',
      },
      {
        value: 'combat',
        icon: '\u{2694}\uFE0F',  // ⚔️
        labelKey: 'society_layer.power_source.combat.label',
        descriptionKey: 'society_layer.power_source.combat.desc',
      },
      {
        value: 'spiritual',
        icon: '\u{1F441}\uFE0F', // 👁️
        labelKey: 'society_layer.power_source.spiritual.label',
        descriptionKey: 'society_layer.power_source.spiritual.desc',
      },
    ],
  },

  // 2. Core Tension
  {
    key: 'core_tension',
    icon: '\u{2696}\uFE0F',     // ⚖️
    labelKey: 'society_layer.core_tension.label',
    hintKey: 'society_layer.core_tension.hint',
    options: [
      {
        value: 'haves_vs_have_nots',
        icon: '\u{26D3}\uFE0F',  // ⛓️
        labelKey: 'society_layer.core_tension.haves_vs_have_nots.label',
        descriptionKey: 'society_layer.core_tension.haves_vs_have_nots.desc',
      },
      {
        value: 'tradition_vs_change',
        icon: '\u{231B}',        // ⏳
        labelKey: 'society_layer.core_tension.tradition_vs_change.label',
        descriptionKey: 'society_layer.core_tension.tradition_vs_change.desc',
      },
      {
        value: 'isolation_vs_expansion',
        icon: '\u{1F9ED}',       // 🧭
        labelKey: 'society_layer.core_tension.isolation_vs_expansion.label',
        descriptionKey: 'society_layer.core_tension.isolation_vs_expansion.desc',
      },
      {
        value: 'species_tension',
        icon: '\u{1F3AD}',       // 🎭
        labelKey: 'society_layer.core_tension.species_tension.label',
        descriptionKey: 'society_layer.core_tension.species_tension.desc',
      },
      {
        value: 'memory_vs_forgetting',
        icon: '\u{1F4DD}',       // 📝
        labelKey: 'society_layer.core_tension.memory_vs_forgetting.label',
        descriptionKey: 'society_layer.core_tension.memory_vs_forgetting.desc',
      },
    ],
  },

  // 3. Social Scale
  {
    key: 'social_scale',
    icon: '\u{1F3D8}\uFE0F',    // 🏘️
    labelKey: 'society_layer.social_scale.label',
    hintKey: 'society_layer.social_scale.hint',
    options: [
      {
        value: 'scattered_bands',
        icon: '\u{1F3D5}\uFE0F', // 🏕️
        labelKey: 'society_layer.social_scale.scattered_bands.label',
        descriptionKey: 'society_layer.social_scale.scattered_bands.desc',
      },
      {
        value: 'city_states',
        icon: '\u{1F3F0}',       // 🏰
        labelKey: 'society_layer.social_scale.city_states.label',
        descriptionKey: 'society_layer.social_scale.city_states.desc',
      },
      {
        value: 'empire',
        icon: '\u{1F451}',       // 👑
        labelKey: 'society_layer.social_scale.empire.label',
        descriptionKey: 'society_layer.social_scale.empire.desc',
      },
      {
        value: 'nomadic',
        icon: '\u{1F42A}',       // 🐪
        labelKey: 'society_layer.social_scale.nomadic.label',
        descriptionKey: 'society_layer.social_scale.nomadic.desc',
      },
    ],
  },
]

/* -------------------------------- Presets -------------------------------- */

export const SOCIETY_PRESETS: WorldPreset[] = [
  {
    key: 'feudal_resource',
    nameKey: 'society_layer.preset.feudal_resource.name',
    descriptionKey: 'society_layer.preset.feudal_resource.desc',
    icon: '\u{1F3F0}',          // 🏰
    selections: {
      power_source: 'resource_control',
      core_tension: 'haves_vs_have_nots',
      social_scale: 'city_states',
    },
  },
  {
    key: 'nomad_sages',
    nameKey: 'society_layer.preset.nomad_sages.name',
    descriptionKey: 'society_layer.preset.nomad_sages.desc',
    icon: '\u{1F9ED}',          // 🧭
    selections: {
      power_source: 'knowledge',
      social_scale: 'nomadic',
      core_tension: 'tradition_vs_change',
    },
  },
  {
    key: 'fractured_coexistence',
    nameKey: 'society_layer.preset.fractured_coexistence.name',
    descriptionKey: 'society_layer.preset.fractured_coexistence.desc',
    icon: '\u{1F91D}',          // 🤝
    selections: {
      core_tension: 'species_tension',
      social_scale: 'city_states',
    },
  },
]

/* ----------------------- Re-export shared types ------------------------- */

export type { PhysicalCategory, PhysicalSelections, WorldPreset } from './physicalParameters'
