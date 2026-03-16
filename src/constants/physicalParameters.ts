// ---------------------------------------------------------------------------
// Physical Parameter Constants
// Pure data + one utility function. No React imports needed.
// i18n keys follow nested dot notation: physical.<category>.<option>.<label|desc>
// ---------------------------------------------------------------------------

/* --------------------------------- Types --------------------------------- */

export interface PhysicalOption {
  value: string;
  icon: string;
  labelKey: string;
  descriptionKey: string;
}

export interface PhysicalCategory {
  key: string;
  icon: string;
  labelKey: string;
  hintKey: string;
  multiSelect?: boolean;
  maxSelections?: number;
  options: PhysicalOption[];
}

export type PhysicalSelections = Record<string, string | string[]>;

/* ----------------------------- Categories -------------------------------- */

export const PHYSICAL_CATEGORIES: PhysicalCategory[] = [
  // 1. Water — highest narrative ROI
  {
    key: "water",
    icon: "\u{1F4A7}",          // 💧
    labelKey: "physical.water.label",
    hintKey: "physical.water.hint",
    options: [
      {
        value: "underground",
        icon: "\u{1F573}\uFE0F", // 🕳️
        labelKey: "physical.water.underground.label",
        descriptionKey: "physical.water.underground.desc",
      },
      {
        value: "scarce",
        icon: "\u{1F3DC}\uFE0F", // 🏜️
        labelKey: "physical.water.scarce.label",
        descriptionKey: "physical.water.scarce.desc",
      },
      {
        value: "perpetual_rain",
        icon: "\u{1F327}\uFE0F", // 🌧️
        labelKey: "physical.water.perpetual_rain.label",
        descriptionKey: "physical.water.perpetual_rain.desc",
      },
      {
        value: "ocean_world",
        icon: "\u{1F30A}",       // 🌊
        labelKey: "physical.water.ocean_world.label",
        descriptionKey: "physical.water.ocean_world.desc",
      },
      {
        value: "frozen",
        icon: "\u{2744}\uFE0F",  // ❄️
        labelKey: "physical.water.frozen.label",
        descriptionKey: "physical.water.frozen.desc",
      },
      {
        value: "toxic",
        icon: "\u{2623}\uFE0F",  // ☣️
        labelKey: "physical.water.toxic.label",
        descriptionKey: "physical.water.toxic.desc",
      },
    ],
  },

  // 2. Light
  {
    key: "light",
    icon: "\u{2728}",            // ✨
    labelKey: "physical.light.label",
    hintKey: "physical.light.hint",
    options: [
      {
        value: "dying_sun",
        icon: "\u{1F31C}",       // 🌜
        labelKey: "physical.light.dying_sun.label",
        descriptionKey: "physical.light.dying_sun.desc",
      },
      {
        value: "bioluminescence",
        icon: "\u{1F7E2}",       // 🟢
        labelKey: "physical.light.bioluminescence.label",
        descriptionKey: "physical.light.bioluminescence.desc",
      },
      {
        value: "twin_suns",
        icon: "\u{2600}\uFE0F",  // ☀️
        labelKey: "physical.light.twin_suns.label",
        descriptionKey: "physical.light.twin_suns.desc",
      },
      {
        value: "eternal_twilight",
        icon: "\u{1F305}",       // 🌅
        labelKey: "physical.light.eternal_twilight.label",
        descriptionKey: "physical.light.eternal_twilight.desc",
      },
      {
        value: "erratic_cycles",
        icon: "\u{1F504}",       // 🔄
        labelKey: "physical.light.erratic_cycles.label",
        descriptionKey: "physical.light.erratic_cycles.desc",
      },
      {
        value: "artificial",
        icon: "\u{1F4A1}",       // 💡
        labelKey: "physical.light.artificial.label",
        descriptionKey: "physical.light.artificial.desc",
      },
    ],
  },

  // 3. Climate
  {
    key: "climate",
    icon: "\u{1F32A}\uFE0F",    // 🌪️
    labelKey: "physical.climate.label",
    hintKey: "physical.climate.hint",
    options: [
      {
        value: "extreme_seasons",
        icon: "\u{1F321}\uFE0F", // 🌡️
        labelKey: "physical.climate.extreme_seasons.label",
        descriptionKey: "physical.climate.extreme_seasons.desc",
      },
      {
        value: "chaotic",
        icon: "\u{26A1}",        // ⚡
        labelKey: "physical.climate.chaotic.label",
        descriptionKey: "physical.climate.chaotic.desc",
      },
      {
        value: "tidally_locked",
        icon: "\u{1F311}",       // 🌑
        labelKey: "physical.climate.tidally_locked.label",
        descriptionKey: "physical.climate.tidally_locked.desc",
      },
      {
        value: "generational",
        icon: "\u{23F3}",        // ⏳
        labelKey: "physical.climate.generational.label",
        descriptionKey: "physical.climate.generational.desc",
      },
      {
        value: "toxic_zones",
        icon: "\u{2620}\uFE0F",  // ☠️
        labelKey: "physical.climate.toxic_zones.label",
        descriptionKey: "physical.climate.toxic_zones.desc",
      },
      {
        value: "ash_filled",
        icon: "\u{1F30B}",       // 🌋
        labelKey: "physical.climate.ash_filled.label",
        descriptionKey: "physical.climate.ash_filled.desc",
      },
    ],
  },

  // 4. Terrain (multiSelect, max 2)
  {
    key: "terrain",
    icon: "\u{26F0}\uFE0F",     // ⛰️
    labelKey: "physical.terrain.label",
    hintKey: "physical.terrain.hint",
    multiSelect: true,
    maxSelections: 2,
    options: [
      {
        value: "floating_islands",
        icon: "\u{1F3DD}\uFE0F", // 🏝️
        labelKey: "physical.terrain.floating_islands.label",
        descriptionKey: "physical.terrain.floating_islands.desc",
      },
      {
        value: "underground",
        icon: "\u{1F573}\uFE0F", // 🕳️
        labelKey: "physical.terrain.underground.label",
        descriptionKey: "physical.terrain.underground.desc",
      },
      {
        value: "vertical",
        icon: "\u{1F3D7}\uFE0F", // 🏗️
        labelKey: "physical.terrain.vertical.label",
        descriptionKey: "physical.terrain.vertical.desc",
      },
      {
        value: "infinite_plains",
        icon: "\u{1F33E}",       // 🌾
        labelKey: "physical.terrain.infinite_plains.label",
        descriptionKey: "physical.terrain.infinite_plains.desc",
      },
      {
        value: "dense_jungle",
        icon: "\u{1F333}",       // 🌳
        labelKey: "physical.terrain.dense_jungle.label",
        descriptionKey: "physical.terrain.dense_jungle.desc",
      },
      {
        value: "ancient_ruins",
        icon: "\u{1F3DB}\uFE0F", // 🏛️
        labelKey: "physical.terrain.ancient_ruins.label",
        descriptionKey: "physical.terrain.ancient_ruins.desc",
      },
    ],
  },

  // 5. Gravity
  {
    key: "gravity",
    icon: "\u{1FA90}",           // 🪐
    labelKey: "physical.gravity.label",
    hintKey: "physical.gravity.hint",
    options: [
      {
        value: "variable",
        icon: "\u{1F3A2}",       // 🎢
        labelKey: "physical.gravity.variable.label",
        descriptionKey: "physical.gravity.variable.desc",
      },
      {
        value: "low",
        icon: "\u{1F9D1}\u200D\u{1F680}", // 🧑‍🚀
        labelKey: "physical.gravity.low.label",
        descriptionKey: "physical.gravity.low.desc",
      },
      {
        value: "crushing",
        icon: "\u{1F4A5}",       // 💥
        labelKey: "physical.gravity.crushing.label",
        descriptionKey: "physical.gravity.crushing.desc",
      },
    ],
  },
];

/* -------------------------------- Presets -------------------------------- */

export interface WorldPreset {
  key: string;
  nameKey: string;
  descriptionKey: string;
  icon: string;
  selections: Partial<PhysicalSelections>;
}

export const WORLD_PRESETS: WorldPreset[] = [
  {
    key: "dying_light",
    nameKey: "physical.preset.dying_light.name",
    descriptionKey: "physical.preset.dying_light.desc",
    icon: "\u{1F31C}",          // 🌜
    selections: {
      light: "dying_sun",
      climate: "ash_filled",
    },
  },
  {
    key: "floating_world",
    nameKey: "physical.preset.floating_world.name",
    descriptionKey: "physical.preset.floating_world.desc",
    icon: "\u{1F3DD}\uFE0F",   // 🏝️
    selections: {
      terrain: ["floating_islands"],
      light: "bioluminescence",
      gravity: "low",
    },
  },
  {
    key: "deep_below",
    nameKey: "physical.preset.deep_below.name",
    descriptionKey: "physical.preset.deep_below.desc",
    icon: "\u{1F573}\uFE0F",   // 🕳️
    selections: {
      terrain: ["underground"],
      water: "underground",
      light: "bioluminescence",
    },
  },
  {
    key: "endless_winter",
    nameKey: "physical.preset.endless_winter.name",
    descriptionKey: "physical.preset.endless_winter.desc",
    icon: "\u{2744}\uFE0F",    // ❄️
    selections: {
      climate: "extreme_seasons",
      water: "frozen",
    },
  },
];

/* -------------------------- Resonance Keywords --------------------------- */

interface ResonanceTarget {
  category: string;
  value: string;
}

/**
 * Maps Spanish / English keywords (lowercase) to physical parameter hints.
 * Used by `computeResonance` to suggest physical options from a core axis string.
 */
export const RESONANCE_KEYWORDS: Record<string, ResonanceTarget[]> = {
  // Water-related
  water:       [{ category: "water", value: "ocean_world" }],
  agua:        [{ category: "water", value: "ocean_world" }],
  ocean:       [{ category: "water", value: "ocean_world" }],
  oceano:      [{ category: "water", value: "ocean_world" }],
  rain:        [{ category: "water", value: "perpetual_rain" }],
  lluvia:      [{ category: "water", value: "perpetual_rain" }],
  drought:     [{ category: "water", value: "scarce" }],
  sequia:      [{ category: "water", value: "scarce" }],
  ice:         [{ category: "water", value: "frozen" }],
  hielo:       [{ category: "water", value: "frozen" }],
  frozen:      [{ category: "water", value: "frozen" }],
  toxic:       [{ category: "water", value: "toxic" }],
  poison:      [{ category: "water", value: "toxic" }],
  veneno:      [{ category: "water", value: "toxic" }],

  // Light-related
  dark:        [{ category: "light", value: "dying_sun" }],
  darkness:    [{ category: "light", value: "dying_sun" }],
  oscuridad:   [{ category: "light", value: "dying_sun" }],
  shadow:      [{ category: "light", value: "eternal_twilight" }],
  sombra:      [{ category: "light", value: "eternal_twilight" }],
  twilight:    [{ category: "light", value: "eternal_twilight" }],
  crepusculo:  [{ category: "light", value: "eternal_twilight" }],
  glow:        [{ category: "light", value: "bioluminescence" }],
  bioluminescence: [{ category: "light", value: "bioluminescence" }],
  sun:         [{ category: "light", value: "twin_suns" }],
  sol:         [{ category: "light", value: "twin_suns" }],
  artificial:  [{ category: "light", value: "artificial" }],

  // Climate-related
  storm:       [{ category: "climate", value: "chaotic" }],
  tormenta:    [{ category: "climate", value: "chaotic" }],
  chaos:       [{ category: "climate", value: "chaotic" }],
  caos:        [{ category: "climate", value: "chaotic" }],
  winter:      [{ category: "climate", value: "extreme_seasons" }],
  invierno:    [{ category: "climate", value: "extreme_seasons" }],
  ash:         [{ category: "climate", value: "ash_filled" }],
  ceniza:      [{ category: "climate", value: "ash_filled" }],
  volcano:     [{ category: "climate", value: "ash_filled" }],
  volcan:      [{ category: "climate", value: "ash_filled" }],

  // Terrain-related
  float:       [{ category: "terrain", value: "floating_islands" }],
  floating:    [{ category: "terrain", value: "floating_islands" }],
  island:      [{ category: "terrain", value: "floating_islands" }],
  isla:        [{ category: "terrain", value: "floating_islands" }],
  underground: [{ category: "terrain", value: "underground" }, { category: "water", value: "underground" }],
  subterraneo: [{ category: "terrain", value: "underground" }, { category: "water", value: "underground" }],
  vertical:    [{ category: "terrain", value: "vertical" }],
  tower:       [{ category: "terrain", value: "vertical" }],
  torre:       [{ category: "terrain", value: "vertical" }],
  jungle:      [{ category: "terrain", value: "dense_jungle" }],
  selva:       [{ category: "terrain", value: "dense_jungle" }],
  ruins:       [{ category: "terrain", value: "ancient_ruins" }],
  ruinas:      [{ category: "terrain", value: "ancient_ruins" }],
  plain:       [{ category: "terrain", value: "infinite_plains" }],
  llanura:     [{ category: "terrain", value: "infinite_plains" }],

  // Gravity-related
  gravity:     [{ category: "gravity", value: "variable" }],
  gravedad:    [{ category: "gravity", value: "variable" }],
  weightless:  [{ category: "gravity", value: "low" }],
  ingravidez:  [{ category: "gravity", value: "low" }],
  crushing:    [{ category: "gravity", value: "crushing" }],
  heavy:       [{ category: "gravity", value: "crushing" }],
  pesado:      [{ category: "gravity", value: "crushing" }],
};

/* ------------------------------ Resonance -------------------------------- */

/**
 * Given a core-axis string (free-form narrative premise), returns a Set of
 * `"category:value"` strings representing resonance hints. The function
 * normalises the input to lowercase and checks for keyword matches.
 */
export function computeResonance(coreAxis: string): Set<string> {
  const normalized = coreAxis.toLowerCase();
  const results = new Set<string>();

  for (const [keyword, targets] of Object.entries(RESONANCE_KEYWORDS)) {
    if (normalized.includes(keyword)) {
      for (const { category, value } of targets) {
        results.add(`${category}:${value}`);
      }
    }
  }

  return results;
}
