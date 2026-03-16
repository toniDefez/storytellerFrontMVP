# Layered World Generation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace single-prompt world derivation with a sequential 3-layer generation pipeline (Physical -> Biological -> Society) where each layer receives accumulated context from previous layers, enabling causal coherence and per-layer regeneration.

**Architecture:** The current single RabbitMQ RPC call (`world_derive`) that returns all 5 Sanderson layers at once will be replaced by a new `world_derive_layer` generation type that generates one layer at a time. The Go backend orchestrates the 3-layer sequence (+ synthesis pass), calling the TS generator once per layer. The frontend drives the wizard, calling the backend per-layer and showing results progressively. The existing DB schema stays unchanged -- the 5 Sanderson fields (`environment`, `subsistence`, `organization`, `tensions`, `tone`) are populated by mapping the 3 new layers + synthesis into them.

**Tech Stack:** Go (backend), TypeScript/LangChain/Ollama (generator), React 19/Framer Motion (frontend), RabbitMQ (RPC), PostgreSQL

---

## Mapping: 3 Layers -> Existing DB Fields

The DB schema (`worlds` table) keeps its current columns. The mapping is:

| New Layer | Populates DB Field(s) | Content |
|-----------|----------------------|---------|
| Physical | `environment` | Gravity, tectonics, terrain, climate, hydrology, geology |
| Biological | `subsistence` | Ecosystems, flora, fauna, food chains, AND how these resources enable survival (bridges ecology -> economy) |
| Society | `organization` | Political structure, settlements, economy, culture, technology |
| Society | `tensions` | Conflicts, what's at stake, threats to equilibrium (returned as separate JSON field) |
| Synthesis | `tone` + `name` + `description` + `factions` | Narrative tone, world name, summary, faction list |

**Important:** The society layer LLM prompt returns `{"organization": "...", "tensions": "..."}` as two separate JSON fields, so both DB columns are populated. The biological layer bridges pure ecology with survival implications so that downstream character/scene generators reading `subsistence` get useful context about how beings survive, not just raw ecology.

This avoids any DB migration while shifting to the layered model.

---

## File Map

### TypeScript Generator (`storyteller-generator-v2`)

| File | Action | Responsibility |
|------|--------|---------------|
| `src/consumer/core/models/payloads.ts` | Modify | Add `WorldDeriveLayerPayload`, `WorldDeriveLayerResult`, `WorldSocietyResult`, `WorldLayerType` |
| `src/consumer/core/models/generation.ts` | Modify | Add `WorldDeriveLayer` to `GenerationType` enum |
| `src/consumer/core/services/generation.ts` | Modify | Add `handleWorldDeriveLayer` handler |
| `src/consumer/dispatcher.ts` | Modify | Register new handler in routes map |
| `src/internal/context/world_generator/domain/WorldContentGenerator.ts` | Modify | Add `generateWorldLayer(layer, coreAxis, previousLayers)` method to interface |
| `src/internal/context/world_generator/infra/OllamaWorldContentGenerator.ts` | Modify | Add per-layer prompts + `generateWorldLayer` implementation |

### Go Backend (`storytellerMVP`)

| File | Action | Responsibility |
|------|--------|---------------|
| `internal/generation/domain/model.go` | Modify | Add `GenerationTypeWorldDeriveLayer` constant |
| `internal/generation/domain/payloads.go` | Modify | Add `WorldDeriveLayerPayload`, `WorldDeriveLayerResult` types |
| `internal/api/dto/world.go` | Modify | Add `WorldDeriveLayerPrompt` DTO struct |
| `internal/api/dto/validation.go` | Modify | Add `Validate()` for `WorldDeriveLayerPrompt` (follows existing convention) |
| `internal/world/app/service.go` | Modify | Add `QueueLayerDerivation(ctx, userID, input)` method |
| `internal/api/handlers/world.go` | Modify | Add `HandleWorldDeriveLayer` handler |
| `internal/api/routes.go` | Modify | Register `POST /world/derive-layer` route (line ~54, after existing derive route) |

### React Frontend (`storytellerFrontMVP`)

| File | Action | Responsibility |
|------|--------|---------------|
| `src/services/api.ts` | Modify | Add `deriveWorldLayer()` function + new types + `physical_parameters` in payload |
| `src/constants/physicalParameters.ts` | Create | Category definitions, option values, preset combinations |
| `src/components/world-creation/PhysicalParameterStep.tsx` | Create | Wrapper: category groups, richness indicator, presets, "Surprise me" |
| `src/components/world-creation/CategoryGroup.tsx` | Create | Single category with PillSelect, accordion on mobile, resonance hints |
| `src/components/world-creation/WorldRichnessIndicator.tsx` | Create | Visual indicator of how much context the AI has to work with |
| `src/components/PillSelect.tsx` | Modify | Add optional `icon` field to `PillOption`, add `resonant` / `aiPicked` visual states |
| `src/hooks/useLayeredDerivation.ts` | Create | `useReducer`-based state machine for layer wizard (includes physical selections) |
| `src/pages/home/CreateWorldPage.sanderson.tsx` | Rewrite | Full wizard: axis + physical params -> layered generation -> review |
| `src/components/world-creation/DerivationLayer.tsx` | Modify | Add `generating` / `stale` visual states, add "Regenerar" button |
| `src/components/world-creation/DerivationProgress.tsx` | Modify | Add `generating` node state (pulse animation) |
| `src/components/world-creation/SuggestionChip.tsx` | No change | Existing accept/reject/edit works as-is |
| `src/components/world-creation/AIGeneratingIndicator.tsx` | Modify | Add compact inline variant for per-layer loading |
| `src/components/world-creation/LayerDescription.tsx` | Create | Helper text component explaining each layer |

---

## Chunk 0: Physical Parameter Selection Step (Frontend-only)

This chunk is frontend-only. The physical parameters are passed as additional context to the generation API -- the backend and generator receive them as part of the payload and inject them into the physical layer prompt.

### Design Decisions (from UX research + agent consensus)

1. **Nothing required.** The core axis is the only creative input. Parameters are additive constraints.
2. **"Normal" options excluded.** If you don't select, that IS the default. Every visible pill creates narrative pressure.
3. **Progressive disclosure.** Desktop: all categories visible but collapsible. Mobile: accordion (one at a time).
4. **Richness indicator.** Not a progress bar -- a visual that evolves from "sparse" to "detailed" showing how much the AI has to work with.
5. **Presets fill 2-3 categories, not all 5.** They populate and show the selection screen, never skip it.
6. **Resonance hints.** Pills matching the core axis get a subtle glow. Simple keyword matching (not NLP) for v1.
7. **Friction reframed as "creative tension."** Amber indicator with positive copy, never warning language.
8. **"Surprise me" is global** with per-category undo. AI-picked pills visually distinct from user-picked (dashed vs solid border).

### Task 0A: Create physical parameter constants

**Files:**
- Create: `storytellerFrontMVP/src/constants/physicalParameters.ts`

- [ ] **Step 1: Define the data structure and all categories**

```typescript
export interface PhysicalOption {
  value: string
  icon: string
  labelKey: string       // i18n key for the pill label
  descriptionKey: string // i18n key for hover description
}

export interface PhysicalCategory {
  key: string
  icon: string
  labelKey: string
  hintKey: string
  multiSelect?: boolean
  maxSelections?: number
  options: PhysicalOption[]
}

export type PhysicalSelections = Record<string, string | string[]>

export const PHYSICAL_CATEGORIES: PhysicalCategory[] = [
  {
    key: 'water',
    icon: '\u{1F4A7}',
    labelKey: 'physical.water.label',
    hintKey: 'physical.water.hint',
    options: [
      { value: 'underground',    icon: '\u{1F573}',  labelKey: 'physical.water.underground.label',    descriptionKey: 'physical.water.underground.desc' },
      { value: 'scarce',         icon: '\u{1F3DC}',  labelKey: 'physical.water.scarce.label',         descriptionKey: 'physical.water.scarce.desc' },
      { value: 'perpetual_rain', icon: '\u{1F327}',  labelKey: 'physical.water.perpetual_rain.label', descriptionKey: 'physical.water.perpetual_rain.desc' },
      { value: 'ocean_world',    icon: '\u{1F30A}',  labelKey: 'physical.water.ocean_world.label',    descriptionKey: 'physical.water.ocean_world.desc' },
      { value: 'frozen',         icon: '\u{2744}',   labelKey: 'physical.water.frozen.label',         descriptionKey: 'physical.water.frozen.desc' },
      { value: 'toxic',          icon: '\u{2620}',   labelKey: 'physical.water.toxic.label',          descriptionKey: 'physical.water.toxic.desc' },
    ],
  },
  {
    key: 'light',
    icon: '\u{2728}',
    labelKey: 'physical.light.label',
    hintKey: 'physical.light.hint',
    options: [
      { value: 'dying_sun',        icon: '\u{1F311}', labelKey: 'physical.light.dying_sun.label',        descriptionKey: 'physical.light.dying_sun.desc' },
      { value: 'bioluminescence',  icon: '\u{1F7E2}', labelKey: 'physical.light.bioluminescence.label',  descriptionKey: 'physical.light.bioluminescence.desc' },
      { value: 'twin_suns',        icon: '\u{2600}',  labelKey: 'physical.light.twin_suns.label',        descriptionKey: 'physical.light.twin_suns.desc' },
      { value: 'eternal_twilight', icon: '\u{1F305}', labelKey: 'physical.light.eternal_twilight.label', descriptionKey: 'physical.light.eternal_twilight.desc' },
      { value: 'erratic_cycles',   icon: '\u{1F300}', labelKey: 'physical.light.erratic_cycles.label',   descriptionKey: 'physical.light.erratic_cycles.desc' },
      { value: 'artificial',       icon: '\u{1F4A1}', labelKey: 'physical.light.artificial.label',       descriptionKey: 'physical.light.artificial.desc' },
    ],
  },
  {
    key: 'climate',
    icon: '\u{1F32A}',
    labelKey: 'physical.climate.label',
    hintKey: 'physical.climate.hint',
    options: [
      { value: 'extreme_seasons',  icon: '\u{2744}',  labelKey: 'physical.climate.extreme_seasons.label',  descriptionKey: 'physical.climate.extreme_seasons.desc' },
      { value: 'chaotic',          icon: '\u{1F329}', labelKey: 'physical.climate.chaotic.label',          descriptionKey: 'physical.climate.chaotic.desc' },
      { value: 'tidally_locked',   icon: '\u{1F311}', labelKey: 'physical.climate.tidally_locked.label',   descriptionKey: 'physical.climate.tidally_locked.desc' },
      { value: 'generational',     icon: '\u{23F3}',  labelKey: 'physical.climate.generational.label',     descriptionKey: 'physical.climate.generational.desc' },
      { value: 'toxic_zones',      icon: '\u{2623}',  labelKey: 'physical.climate.toxic_zones.label',      descriptionKey: 'physical.climate.toxic_zones.desc' },
      { value: 'ash_filled',       icon: '\u{1F30B}', labelKey: 'physical.climate.ash_filled.label',       descriptionKey: 'physical.climate.ash_filled.desc' },
    ],
  },
  {
    key: 'terrain',
    icon: '\u{26F0}',
    labelKey: 'physical.terrain.label',
    hintKey: 'physical.terrain.hint',
    multiSelect: true,
    maxSelections: 2,
    options: [
      { value: 'floating_islands', icon: '\u{1F3DD}', labelKey: 'physical.terrain.floating_islands.label', descriptionKey: 'physical.terrain.floating_islands.desc' },
      { value: 'underground',      icon: '\u{1F573}', labelKey: 'physical.terrain.underground.label',      descriptionKey: 'physical.terrain.underground.desc' },
      { value: 'vertical',         icon: '\u{1F3D7}', labelKey: 'physical.terrain.vertical.label',         descriptionKey: 'physical.terrain.vertical.desc' },
      { value: 'infinite_plains',  icon: '\u{1F33E}', labelKey: 'physical.terrain.infinite_plains.label',  descriptionKey: 'physical.terrain.infinite_plains.desc' },
      { value: 'dense_jungle',     icon: '\u{1F332}', labelKey: 'physical.terrain.dense_jungle.label',     descriptionKey: 'physical.terrain.dense_jungle.desc' },
      { value: 'ancient_ruins',    icon: '\u{1F3DA}', labelKey: 'physical.terrain.ancient_ruins.label',    descriptionKey: 'physical.terrain.ancient_ruins.desc' },
    ],
  },
  {
    key: 'gravity',
    icon: '\u{1F30C}',
    labelKey: 'physical.gravity.label',
    hintKey: 'physical.gravity.hint',
    options: [
      { value: 'variable', icon: '\u{1F52E}', labelKey: 'physical.gravity.variable.label', descriptionKey: 'physical.gravity.variable.desc' },
      { value: 'low',      icon: '\u{1F54A}', labelKey: 'physical.gravity.low.label',      descriptionKey: 'physical.gravity.low.desc' },
      { value: 'crushing',  icon: '\u{1FAA8}', labelKey: 'physical.gravity.crushing.label',  descriptionKey: 'physical.gravity.crushing.desc' },
    ],
  },
]

/** Presets fill 2-3 categories, NOT all 5. User fills the rest. */
export interface WorldPreset {
  key: string
  nameKey: string        // i18n key for evocative name
  descriptionKey: string // i18n key for one-line teaser
  icon: string
  selections: Partial<PhysicalSelections>
}

export const WORLD_PRESETS: WorldPreset[] = [
  {
    key: 'dying_light',
    nameKey: 'preset.dying_light.name',
    descriptionKey: 'preset.dying_light.desc',
    icon: '\u{1F312}',
    selections: { light: 'dying_sun', climate: 'ash_filled' },
  },
  {
    key: 'floating_world',
    nameKey: 'preset.floating_world.name',
    descriptionKey: 'preset.floating_world.desc',
    icon: '\u{2601}',
    selections: { terrain: ['floating_islands'], light: 'bioluminescence', gravity: 'low' },
  },
  {
    key: 'deep_below',
    nameKey: 'preset.deep_below.name',
    descriptionKey: 'preset.deep_below.desc',
    icon: '\u{1F573}',
    selections: { terrain: ['underground'], water: 'underground', light: 'bioluminescence' },
  },
  {
    key: 'endless_winter',
    nameKey: 'preset.endless_winter.name',
    descriptionKey: 'preset.endless_winter.desc',
    icon: '\u{2744}',
    selections: { climate: 'extreme_seasons', water: 'frozen' },
  },
]

/** Simple keyword matching for resonance hints. Maps axis keywords to option values. */
export const RESONANCE_KEYWORDS: Record<string, { category: string; value: string }[]> = {
  'lluvia':      [{ category: 'water', value: 'perpetual_rain' }, { category: 'climate', value: 'chaotic' }],
  'rain':        [{ category: 'water', value: 'perpetual_rain' }, { category: 'climate', value: 'chaotic' }],
  'oscur':       [{ category: 'light', value: 'bioluminescence' }, { category: 'light', value: 'eternal_twilight' }],
  'dark':        [{ category: 'light', value: 'bioluminescence' }, { category: 'light', value: 'eternal_twilight' }],
  'frio':        [{ category: 'climate', value: 'extreme_seasons' }, { category: 'water', value: 'frozen' }],
  'cold':        [{ category: 'climate', value: 'extreme_seasons' }, { category: 'water', value: 'frozen' }],
  'hielo':       [{ category: 'water', value: 'frozen' }, { category: 'climate', value: 'extreme_seasons' }],
  'ice':         [{ category: 'water', value: 'frozen' }, { category: 'climate', value: 'extreme_seasons' }],
  'subterr':     [{ category: 'terrain', value: 'underground' }, { category: 'water', value: 'underground' }],
  'underground': [{ category: 'terrain', value: 'underground' }, { category: 'water', value: 'underground' }],
  'flot':        [{ category: 'terrain', value: 'floating_islands' }, { category: 'gravity', value: 'low' }],
  'float':       [{ category: 'terrain', value: 'floating_islands' }, { category: 'gravity', value: 'low' }],
  'ocean':       [{ category: 'water', value: 'ocean_world' }],
  'mar':         [{ category: 'water', value: 'ocean_world' }],
  'ruina':       [{ category: 'terrain', value: 'ancient_ruins' }],
  'ruin':        [{ category: 'terrain', value: 'ancient_ruins' }],
  'ceniza':      [{ category: 'climate', value: 'ash_filled' }, { category: 'light', value: 'dying_sun' }],
  'ash':         [{ category: 'climate', value: 'ash_filled' }, { category: 'light', value: 'dying_sun' }],
  'sol':         [{ category: 'light', value: 'twin_suns' }, { category: 'light', value: 'dying_sun' }],
  'sun':         [{ category: 'light', value: 'twin_suns' }, { category: 'light', value: 'dying_sun' }],
  'selva':       [{ category: 'terrain', value: 'dense_jungle' }],
  'jungle':      [{ category: 'terrain', value: 'dense_jungle' }],
  'desierto':    [{ category: 'water', value: 'scarce' }],
  'desert':      [{ category: 'water', value: 'scarce' }],
  'toxi':        [{ category: 'water', value: 'toxic' }, { category: 'climate', value: 'toxic_zones' }],
  'toxic':       [{ category: 'water', value: 'toxic' }, { category: 'climate', value: 'toxic_zones' }],
  'gravedad':    [{ category: 'gravity', value: 'variable' }, { category: 'gravity', value: 'crushing' }],
  'gravity':     [{ category: 'gravity', value: 'variable' }, { category: 'gravity', value: 'crushing' }],
}

/** Returns resonant option keys based on core axis text (simple keyword matching). */
export function computeResonance(coreAxis: string): Set<string> {
  const normalized = coreAxis.toLowerCase()
  const resonant = new Set<string>()
  for (const [keyword, matches] of Object.entries(RESONANCE_KEYWORDS)) {
    if (normalized.includes(keyword)) {
      for (const match of matches) {
        resonant.add(`${match.category}:${match.value}`)
      }
    }
  }
  return resonant
}
```

- [ ] **Step 2: Verify build**

Run: `cd storytellerFrontMVP && npm run build`

- [ ] **Step 3: Commit**

```bash
git add storytellerFrontMVP/src/constants/physicalParameters.ts
git commit -m "feat(frontend): add physical parameter constants, presets, and resonance keywords"
```

---

### Task 0B: Extend PillSelect with icon and resonance support

**Files:**
- Modify: `storytellerFrontMVP/src/components/PillSelect.tsx`

- [ ] **Step 1: Extend PillOption type**

Change the `PillOption` type to support icon and visual states:

```typescript
export type PillOption = string | { value: string; label: string; icon?: string }

function getOptionIcon(opt: PillOption): string | undefined {
  return typeof opt === 'string' ? undefined : opt.icon
}
```

- [ ] **Step 2: Add icon rendering and resonant/aiPicked visual states to PillSelect**

Add optional props:

```typescript
interface PillSelectProps {
  options: PillOption[]
  value: string
  onChange: (value: string) => void
  descriptions?: Record<string, string>
  allowDeselect?: boolean
  /** Set of option values that resonate with the core axis */
  resonantValues?: Set<string>
  /** Set of option values suggested by AI ("Surprise me") */
  aiPickedValues?: Set<string>
}
```

In the pill button rendering, prepend the icon and add visual states:

```typescript
const isResonant = resonantValues?.has(v)
const isAiPicked = aiPickedValues?.has(v)
const icon = getOptionIcon(opt)

// Resonant: subtle glow ring animation
// AI-picked: dashed border instead of solid
// Selected by user: solid primary (existing)
className={`... ${
  value === v
    ? isAiPicked
      ? 'bg-primary/60 text-primary-foreground border-dashed border-primary shadow-md shadow-primary/15'
      : 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
    : isResonant
      ? 'bg-background text-muted-foreground border-primary/40 ring-1 ring-primary/20 hover:border-primary'
      : 'bg-background text-muted-foreground border-input hover:border-primary hover:text-accent-foreground hover:bg-accent'
}`}

// Icon before label
{icon && <span className="mr-1.5" aria-hidden="true">{icon}</span>}
{getOptionLabel(opt)}
```

Apply same changes to `MultiPillSelect` (for terrain's multi-select).

- [ ] **Step 3: Verify build**

- [ ] **Step 4: Commit**

```bash
git add storytellerFrontMVP/src/components/PillSelect.tsx
git commit -m "feat(frontend): extend PillSelect with icon, resonance glow, and AI-picked states"
```

---

### Task 0C: Create WorldRichnessIndicator component

**Files:**
- Create: `storytellerFrontMVP/src/components/world-creation/WorldRichnessIndicator.tsx`

- [ ] **Step 1: Create the component**

A visual indicator showing how much context the AI has to work with. NOT a progress bar. Uses an evolving visual metaphor (e.g., constellation dots that appear as more parameters are selected).

```typescript
import { motion } from 'framer-motion'

interface WorldRichnessIndicatorProps {
  /** Number of categories with at least one selection (0-5) */
  selectedCount: number
  /** Total categories */
  totalCategories: number
}

const DOTS = 5

export function WorldRichnessIndicator({ selectedCount, totalCategories }: WorldRichnessIndicatorProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        {Array.from({ length: DOTS }).map((_, i) => (
          <motion.div
            key={i}
            animate={{
              scale: i < selectedCount ? 1 : 0.6,
              opacity: i < selectedCount ? 1 : 0.2,
            }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className={`w-2 h-2 rounded-full ${
              i < selectedCount ? 'bg-primary' : 'bg-muted-foreground/30'
            }`}
          />
        ))}
      </div>
      <span className="text-[10px] text-muted-foreground/60 font-medium">
        {selectedCount === 0
          ? 'La IA interpretara libremente'
          : selectedCount < 3
            ? 'La IA tiene algo con lo que trabajar'
            : 'La IA tiene un mundo rico que derivar'}
      </span>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add storytellerFrontMVP/src/components/world-creation/WorldRichnessIndicator.tsx
git commit -m "feat(frontend): add WorldRichnessIndicator component"
```

---

### Task 0D: Create CategoryGroup component

**Files:**
- Create: `storytellerFrontMVP/src/components/world-creation/CategoryGroup.tsx`

- [ ] **Step 1: Create the component**

Renders a single physical category with its label, hint, and PillSelect/MultiPillSelect. On mobile, acts as an accordion (collapsed by default except the first). On desktop, always expanded.

```typescript
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { PillSelect, MultiPillSelect } from '@/components/PillSelect'
import type { PhysicalCategory } from '@/constants/physicalParameters'
import { useTranslation } from 'react-i18next'

interface CategoryGroupProps {
  category: PhysicalCategory
  value: string | string[]
  onChange: (value: string | string[]) => void
  resonantValues?: Set<string>
  aiPickedValues?: Set<string>
  /** Mobile: start collapsed */
  defaultExpanded?: boolean
}

export function CategoryGroup({
  category,
  value,
  onChange,
  resonantValues,
  aiPickedValues,
  defaultExpanded = true,
}: CategoryGroupProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(defaultExpanded)

  const pillOptions = category.options.map(opt => ({
    value: opt.value,
    label: `${opt.icon} ${t(opt.labelKey)}`,
  }))

  const descriptions = Object.fromEntries(
    category.options.map(opt => [opt.value, t(opt.descriptionKey)])
  )

  const hasSelection = category.multiSelect
    ? (value as string[]).length > 0
    : !!value

  return (
    <div className="relative">
      {/* Category header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2.5 w-full text-left py-2 group"
      >
        <span className="text-base" aria-hidden="true">{category.icon}</span>
        <div className="flex-1">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {t(category.labelKey)}
          </span>
          {hasSelection && (
            <span className="ml-2 text-[10px] font-medium text-primary/60 bg-primary/8 px-2 py-0.5 rounded-full">
              {category.multiSelect
                ? `${(value as string[]).length} seleccionado(s)`
                : 'seleccionado'}
            </span>
          )}
        </div>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors lg:hidden"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.span>
      </button>

      {/* Hint text */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="text-xs text-muted-foreground/50 mb-3 leading-relaxed">
              {t(category.hintKey)}
            </p>

            {category.multiSelect ? (
              <MultiPillSelect
                options={pillOptions}
                value={(value as string[]) ?? []}
                onChange={v => {
                  if (category.maxSelections && v.length > category.maxSelections) return
                  onChange(v)
                }}
                descriptions={descriptions}
              />
            ) : (
              <PillSelect
                options={pillOptions}
                value={(value as string) ?? ''}
                onChange={v => onChange(v)}
                descriptions={descriptions}
                allowDeselect
                resonantValues={resonantValues}
                aiPickedValues={aiPickedValues}
              />
            )}

            {category.multiSelect && category.maxSelections && (
              <p className="text-[10px] text-muted-foreground/40 mt-2">
                Max {category.maxSelections} selecciones
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add storytellerFrontMVP/src/components/world-creation/CategoryGroup.tsx
git commit -m "feat(frontend): add CategoryGroup component for physical parameter categories"
```

---

### Task 0E: Create PhysicalParameterStep component

**Files:**
- Create: `storytellerFrontMVP/src/components/world-creation/PhysicalParameterStep.tsx`

- [ ] **Step 1: Create the component**

The main container that renders all categories, presets, "Surprise me" button, richness indicator, and the "Derive world" action.

Key behaviors:
- Presets appear as small cards above the categories. Selecting one fills 2-3 categories and shows the result in the pills below.
- "Surprise me" button fills remaining empty categories with random compatible selections. AI-picked pills get dashed borders.
- Richness indicator shows at the bottom, above the derive button.
- The core axis is shown as a sticky reminder at the top.
- On mobile (<768px), categories use accordion mode (first expanded, rest collapsed).

Props:

```typescript
interface PhysicalParameterStepProps {
  coreAxis: string
  selections: PhysicalSelections
  onSelectionsChange: (selections: PhysicalSelections) => void
  onDerive: () => void
  hasInstallation: boolean
}
```

The component uses `PHYSICAL_CATEGORIES`, `WORLD_PRESETS`, `computeResonance` from constants.

Important: the "Derive world" button label changes based on state:
- Zero selections: "Dejar que el mundo tome forma"
- Some selections: "Dar forma a este mundo"

- [ ] **Step 2: Commit**

```bash
git add storytellerFrontMVP/src/components/world-creation/PhysicalParameterStep.tsx
git commit -m "feat(frontend): add PhysicalParameterStep with presets, surprise-me, and richness indicator"
```

---

### Task 0F: Add i18n strings for physical parameters

**Files:**
- Modify: `storytellerFrontMVP/src/i18n/locales/es.json`
- Modify: `storytellerFrontMVP/src/i18n/locales/en.json`

- [ ] **Step 1: Add all physical parameter translations**

Add under a `physical` key in both locale files. Each category needs:
- `.label` - category name
- `.hint` - one-line evocative question
- Per option: `.label` - short pill text, `.desc` - one-line hover description

Example structure for Spanish:
```json
{
  "physical": {
    "water": {
      "label": "Agua",
      "hint": "De donde viene el agua? Quien la controla?",
      "underground":    { "label": "Solo bajo tierra",    "desc": "Pozos profundos, cenotes, rios ocultos. Quien excava, controla el poder." },
      "scarce":         { "label": "Escasa y disputada",  "desc": "Los oasis son capitales, los pozos son fortalezas. El agua ES la politica." },
      "perpetual_rain": { "label": "Lluvia perpetua",     "desc": "Inundaciones, moho, peso emocional constante. El cielo nunca para." },
      "ocean_world":    { "label": "Oceano sin tierra",   "desc": "Casi todo es mar. La tierra firme es riqueza y mito." },
      "frozen":         { "label": "Congelada",           "desc": "Existe pero bloqueada en hielo. La energia para derretir vale tanto como el agua." },
      "toxic":          { "label": "Toxica",              "desc": "Hay agua pero mata sin tratar. Purificar es poder." }
    },
    "light": {
      "label": "Fuente de luz",
      "hint": "Que ilumina este mundo? Como se mide el tiempo?",
      "dying_sun":        { "label": "Sol moribundo",      "desc": "Una luz roja y debil. Cada generacion nota mas frio. Cuenta atras cosmica." },
      "bioluminescence":  { "label": "Bioluminiscencia",   "desc": "Sin astro. La luz viene del suelo, las plantas, las criaturas." },
      "twin_suns":        { "label": "Soles gemelos",      "desc": "Dias largos, noches breves e intensas. Sombras dobles." },
      "eternal_twilight": { "label": "Crepusculo eterno",  "desc": "Ni dia ni noche. Siempre amanecer. El tiempo se mide diferente." },
      "erratic_cycles":   { "label": "Ciclos erraticos",   "desc": "La luz va y viene sin patron. Dias de semanas, noches impredecibles." },
      "artificial":       { "label": "Luz artificial",     "desc": "Alguien controla la luz. Alguien controla la verdad." }
    },
    "climate": {
      "label": "Clima",
      "hint": "Contra que lucha la gente cada dia?",
      "extreme_seasons": { "label": "Estaciones extremas", "desc": "Inviernos que matan, veranos que abrasan. La vida gira en prepararse." },
      "chaotic":         { "label": "Caos climatico",      "desc": "Tormentas sin aviso, sequias sin patron. El clima es un personaje." },
      "tidally_locked":  { "label": "Mundo bloqueado",     "desc": "Un lado siempre iluminado, otro siempre en sombra. La vida en la frontera." },
      "generational":    { "label": "Gran ciclo",          "desc": "Las estaciones duran generaciones. Nadie vivo recuerda el ultimo verano." },
      "toxic_zones":     { "label": "Zonas toxicas",       "desc": "Algunas zonas son mortales. La vida se concentra donde el aire es seguro." },
      "ash_filled":      { "label": "Ceniza en el aire",   "desc": "Visibilidad reducida, cultura de mascaras, cielos de color ceniza." }
    },
    "terrain": {
      "label": "Terreno",
      "hint": "Que forma tiene la superficie? (maximo 2)",
      "floating_islands": { "label": "Archipielago flotante", "desc": "Islas suspendidas en el vacio. Caer es morir. Los puentes son poder." },
      "underground":      { "label": "Subterraneo",          "desc": "Tuneles, cavernas, ciudades talladas en roca. Sin cielo." },
      "vertical":         { "label": "Estructura vertical",   "desc": "El mundo es una torre. Altitud = clase social. Literalmente." },
      "infinite_plains":  { "label": "Llanura infinita",      "desc": "Horizonte en todas direcciones. Nada se esconde, nada bloquea el viento." },
      "dense_jungle":     { "label": "Selva densa",           "desc": "Visibilidad cero. El camino se abre a machete. La vegetacion es el antagonista." },
      "ancient_ruins":    { "label": "Ruinas ancestrales",    "desc": "El mundo es el cadaver de una civilizacion mayor. Que construyeron?" }
    },
    "gravity": {
      "label": "Gravedad",
      "hint": "Como se siente el peso en este mundo?",
      "variable": { "label": "Caprichosa",      "desc": "Cambia segun la zona. Regiones de piedra flotante junto a regiones aplastantes." },
      "low":      { "label": "Peso ligero",     "desc": "Saltos largos, caidas lentas. Las criaturas pueden ser enormes." },
      "crushing": { "label": "Peso aplastante", "desc": "Moverse cuesta. Estructuras bajas y robustas. El cielo se siente mas cerca." }
    }
  },
  "preset": {
    "dying_light":    { "name": "La Luz Moribunda",    "desc": "Un sol que se apaga sobre un mundo de ceniza" },
    "floating_world": { "name": "El Mundo Flotante",   "desc": "Islas luminosas suspendidas en un cielo sin fin" },
    "deep_below":     { "name": "Las Profundidades",   "desc": "Civilizaciones bajo la roca, iluminadas por la vida misma" },
    "endless_winter": { "name": "El Invierno Eterno",  "desc": "Hielo hasta donde alcanza la vista y el recuerdo" }
  },
  "world.create.richness0": "La IA interpretara libremente",
  "world.create.richness1": "La IA tiene algo con lo que trabajar",
  "world.create.richness2": "La IA tiene un mundo rico que derivar",
  "world.create.deriveButtonEmpty": "Dejar que el mundo tome forma",
  "world.create.deriveButtonFilled": "Dar forma a este mundo",
  "world.create.surpriseMe": "Rellenar lo que falta con sugerencias",
  "world.create.physicalSectionLabel": "Las reglas fisicas",
  "world.create.physicalSectionHint": "Define las condiciones fundamentales de tu mundo. Puedes elegir algunas, todas o ninguna.",
  "world.create.presetLabel": "Punto de partida",
  "world.create.creativeTension": "Tension creativa: combinacion inesperada que enriquece tu mundo"
}
```

English equivalents in `en.json`.

- [ ] **Step 2: Commit**

```bash
git add storytellerFrontMVP/src/i18n/locales/
git commit -m "feat(frontend): add i18n strings for physical parameters, presets, and UX copy"
```

---

### Task 0G: Integrate physical parameters into the API payload

**Files:**
- Modify: `storytellerFrontMVP/src/services/api.ts`
- Modify: `storytellerMVP/internal/api/dto/world.go`
- Modify: `storyteller-generator-v2/src/consumer/core/models/payloads.ts`

- [ ] **Step 1: Update frontend API**

Update `deriveWorldLayer` to accept optional physical parameters:

```typescript
export function deriveWorldLayer(
  coreAxis: string,
  layer: WorldLayerType,
  previousLayers: Partial<Record<WorldLayerType, string>>,
  physicalParameters?: Record<string, string | string[]>,
) {
  return request<DeriveLayerResult>('/world/derive-layer', {
    method: 'POST',
    body: JSON.stringify({
      core_axis: coreAxis,
      layer,
      previous_layers: previousLayers,
      physical_parameters: physicalParameters,
    }),
  })
}
```

- [ ] **Step 2: Update Go DTO**

Add to `WorldDeriveLayerPrompt`:

```go
type WorldDeriveLayerPrompt struct {
	CoreAxis           string                       `json:"core_axis"`
	Layer              string                       `json:"layer"`
	PreviousLayers     map[string]string            `json:"previous_layers"`
	PhysicalParameters map[string]json.RawMessage   `json:"physical_parameters,omitempty"`
}
```

Use `json.RawMessage` because terrain is `string[]` while others are `string`.

- [ ] **Step 3: Update TS generator payload**

Add to `WorldDeriveLayerPayload`:

```typescript
export interface WorldDeriveLayerPayload {
  coreAxis: string;
  layer: WorldLayerType;
  previousLayers: Partial<Record<WorldLayerType, string>>;
  physicalParameters?: Record<string, string | string[]>;
}
```

- [ ] **Step 4: Inject physical parameters into the physical layer prompt**

In `OllamaWorldContentGenerator.ts`, when `layer === 'physical'` and `physicalParameters` is present, append them to the user message:

```typescript
let userMessage = `Eje central del mundo:\n${coreAxis}\n\nDeriva la capa fisica.`;

if (physicalParameters && Object.keys(physicalParameters).length > 0) {
  const paramLines = Object.entries(physicalParameters)
    .map(([key, val]) => `- ${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
    .join('\n');
  userMessage += `\n\nEl usuario ha definido estas condiciones fisicas (RESPETA estas elecciones e integralas en tu derivacion):\n${paramLines}`;
}
```

- [ ] **Step 5: Verify all 3 repos build**

- [ ] **Step 6: Commit**

```bash
# Frontend
git -C storytellerFrontMVP add src/services/api.ts
# Backend
git -C storytellerMVP add internal/api/dto/world.go
# Generator
git -C storyteller-generator-v2 add src/consumer/core/models/payloads.ts src/internal/context/world_generator/infra/OllamaWorldContentGenerator.ts
```

Each repo gets its own commit:
```bash
git commit -m "feat: integrate physical parameters into layer derivation payload"
```

---

## Chunk 1: TypeScript Generator -- Per-Layer Generation

### Task 1: Add payload types for layer derivation

**Files:**
- Modify: `storyteller-generator-v2/src/consumer/core/models/payloads.ts:46-60`
- Modify: `storyteller-generator-v2/src/consumer/core/models/generation.ts`

- [ ] **Step 1: Add new types to payloads.ts**

After the existing `WorldDeriveResult` (line 60), add:

```typescript
export type WorldLayerType = 'physical' | 'biological' | 'society' | 'synthesis';

export interface WorldDeriveLayerPayload {
  coreAxis: string;
  layer: WorldLayerType;
  /** Accumulated output from previous layers, keyed by layer type */
  previousLayers: Partial<Record<WorldLayerType, string>>;
}

export interface WorldDeriveLayerResult {
  layer: WorldLayerType;
  content: string;
  /** Only present in society layer -- tensions split from organization */
  tensions?: string;
  /** Only present in synthesis layer */
  name?: string;
  factions?: string[];
  description?: string;
}
```

- [ ] **Step 2: Add GenerationType to generation.ts**

Add `WorldDeriveLayer = 'world_derive_layer'` to the `GenerationType` enum.

- [ ] **Step 3: Verify build**

Run: `cd storyteller-generator-v2 && npm run build`
Expected: Clean compilation

- [ ] **Step 4: Commit**

```bash
git add storyteller-generator-v2/src/consumer/core/models/payloads.ts storyteller-generator-v2/src/consumer/core/models/generation.ts
git commit -m "feat(generator): add payload types for per-layer world derivation"
```

---

### Task 2: Add per-layer prompts to OllamaWorldContentGenerator

**Files:**
- Modify: `storyteller-generator-v2/src/internal/context/world_generator/domain/WorldContentGenerator.ts`
- Modify: `storyteller-generator-v2/src/internal/context/world_generator/infra/OllamaWorldContentGenerator.ts`

- [ ] **Step 1: Extend the interface**

In `WorldContentGenerator.ts`, add:

```typescript
import type { WorldDeriveLayerResult, WorldLayerType } from '../../../../consumer/core/models/payloads.js';

export interface WorldContentGenerator {
  readonly modelId: string;
  generateWorld(description: string): Promise<string>;
  generateWorldDerive(coreAxis: string): Promise<WorldDeriveResult>;
  generateWorldLayer(
    layer: WorldLayerType,
    coreAxis: string,
    previousLayers: Partial<Record<WorldLayerType, string>>,
  ): Promise<WorldDeriveLayerResult>;
}
```

- [ ] **Step 2: Create the physical layer prompt in OllamaWorldContentGenerator**

Add a private `physicalPrompt` using `ChatPromptTemplate.fromMessages`:

```typescript
private readonly physicalPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `Eres un arquitecto de mundos narrativos. Tu trabajo: dado un EJE CENTRAL (premisa fundamental), derivar la CAPA FISICA del mundo.

La capa fisica establece las condiciones fundamentales sobre las que todo lo demas se construira. Incluye:
- **Gravedad y leyes fisicas**: si difieren de la Tierra, especifica como.
- **Geologia y tectonica**: tipo de terreno, montanas, placas, actividad volcanica/sismica.
- **Clima y atmosfera**: patron climatico dominante, estaciones, circulacion atmosferica. Las montanas crean sombras de lluvia. La latitud determina temperatura.
- **Hidrologia**: rios (SIEMPRE fluyen de mayor a menor elevacion, NUNCA se bifurcan excepto en deltas), lagos, oceanos, acuiferos. Cada rio necesita una cuenca.
- **Recursos geologicos**: minerales, metales, combustibles. Siguen logica geologica (carbon en antiguos pantanos, metales en zonas volcanicas).

REGLAS:
- Todo DEBE ser CONSECUENCIA DIRECTA del eje central. No inventes elementos desconectados.
- Se especifico y evocador: "Mesetas de basalto fracturadas por rios de acido sulfurico" es mejor que "terreno hostil".
- 200-400 palabras. Castellano neutro. Sin metacomentarios.
- Tu respuesta debe ser UNICAMENTE un JSON valido: {{"content": "..."}}`
  ],
  [
    "human",
    "Eje central del mundo:\n{coreAxis}\n\nDeriva la capa fisica."
  ],
]);
```

- [ ] **Step 3: Create the biological layer prompt**

```typescript
private readonly biologicalPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `Eres un arquitecto de mundos narrativos. Dado un EJE CENTRAL y la CAPA FISICA ya establecida, deriva la CAPA BIOLOGICA.

La capa biologica DEBE derivarse de las condiciones fisicas. Incluye:
- **Biomas y ecosistemas**: que tipo de vegetacion y ecosistemas existen, dados el clima y terreno. Un desierto NO puede tener jungla tropical sin explicacion.
- **Flora dominante**: plantas, hongos, organismos fotosinteticos o equivalentes. Adaptaciones al entorno fisico.
- **Fauna y especies**: animales, criaturas. Sus formas corporales reflejan la gravedad, atmosfera y recursos disponibles.
- **Cadenas alimentarias**: quien come a quien. Relaciones depredador-presa, simbiosis.
- **Recursos explotables y subsistencia**: que recursos biologicos (madera, fibras, alimentos, plantas medicinales, bestias de carga) permiten la supervivencia. Como se obtiene comida, materiales de construccion, y energia. Esto es CRITICO: conecta la ecologia con la economia futura.
- **Peligros biologicos**: enfermedades, parasitos, predadores, zonas toxicas.

REGLAS:
- Cada elemento DEBE ser consecuencia de la capa fisica. Si hay baja gravedad, los organismos pueden ser mas grandes. Si no hay luz solar, no hay fotosintesis convencional.
- NUNCA contradigas la capa fisica.
- 200-400 palabras. Castellano neutro. Sin metacomentarios.
- Tu respuesta debe ser UNICAMENTE un JSON valido: {{"content": "..."}}

CAPA FISICA YA ESTABLECIDA (NO contradigas estos hechos):
{physicalLayer}`
  ],
  [
    "human",
    "Eje central del mundo:\n{coreAxis}\n\nDeriva la capa biologica a partir de la capa fisica."
  ],
]);
```

- [ ] **Step 4: Create the society layer prompt**

```typescript
private readonly societyPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `Eres un arquitecto de mundos narrativos. Dado un EJE CENTRAL, la CAPA FISICA y la CAPA BIOLOGICA, deriva la CAPA SOCIAL.

La capa social DEBE derivarse de las condiciones fisicas y biologicas. Incluye:
- **Patrones de asentamiento**: las ciudades aparecen en confluencias de rios, puertos naturales, terreno defendible, o intersecciones de rutas comerciales. NUNCA al azar.
- **Subsistencia y economia**: que cultivan, cazan, extraen. Comercio basado en los recursos fisicos y biologicos ya establecidos.
- **Organizacion politica**: quien gobierna y por que. El control de recursos (agua, minas, rutas) determina el poder.
- **Tecnologia**: nivel tecnologico coherente con los recursos disponibles. Sin hierro no hay Edad del Hierro.
- **Cultura y religion**: creencias que emergen de la relacion con el entorno. Un pueblo que vive bajo tormentas constantes tendra rituales diferentes a uno del desierto.
- **Conflictos y tensiones**: que fuerzas chocan, que esta en juego. Los conflictos DEBEN emerger de la competencia por recursos, territorio, o diferencias ideologicas enraizadas en el entorno.

REGLAS:
- Cada elemento DEBE ser consecuencia de las capas anteriores.
- NUNCA contradigas las capas fisica o biologica.
- 300-500 palabras en total (esta capa es la mas narrativa). Castellano neutro. Sin metacomentarios.
- Tu respuesta debe ser UNICAMENTE un JSON valido: {{"organization": "...", "tensions": "..."}}
- "organization": asentamientos, economia, politica, cultura, tecnologia (200-300 palabras)
- "tensions": conflictos centrales, que esta en juego, amenazas al equilibrio (100-200 palabras)

CAPA FISICA:
{physicalLayer}

CAPA BIOLOGICA:
{biologicalLayer}`
  ],
  [
    "human",
    "Eje central del mundo:\n{coreAxis}\n\nDeriva la capa social a partir de las capas fisica y biologica."
  ],
]);
```

- [ ] **Step 5: Create the synthesis prompt**

```typescript
private readonly synthesisPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `Eres un arquitecto de mundos narrativos. Dadas las tres capas de un mundo (fisica, biologica, social), genera una SINTESIS final.

Tu trabajo:
1. **name**: Un nombre evocador y original para el mundo (NO generico como "Mundo de la lluvia").
2. **description**: Resumen narrativo del mundo completo (150-250 palabras) que entrelace las tres capas.
3. **tone**: La atmosfera emocional de las historias en este mundo. Registro literario, sentimiento dominante.
4. **factions**: 3-5 facciones que emerjan naturalmente de los conflictos y la organizacion social.

REGLAS:
- Todo debe reflejar coherentemente las tres capas.
- Castellano neutro. Sin metacomentarios.
- Tu respuesta debe ser UNICAMENTE un JSON valido:
{{"name": "...", "description": "...", "tone": "...", "factions": ["...", "..."]}}

CAPA FISICA:
{physicalLayer}

CAPA BIOLOGICA:
{biologicalLayer}

CAPA SOCIAL:
{societyLayer}`
  ],
  [
    "human",
    "Eje central del mundo:\n{coreAxis}\n\nGenera la sintesis."
  ],
]);
```

- [ ] **Step 6: Implement the generateWorldLayer method**

Add to `OllamaWorldContentGenerator`:

```typescript
private readonly layerLlms: Record<WorldLayerType, ReturnType<typeof createOllama>> = {
  physical: createOllama(0.65, 1024, "json"),
  biological: createOllama(0.7, 1024, "json"),
  society: createOllama(0.75, 1536, "json"),
  synthesis: createOllama(0.6, 1024, "json"),
};

async generateWorldLayer(
  layer: WorldLayerType,
  coreAxis: string,
  previousLayers: Partial<Record<WorldLayerType, string>>,
): Promise<WorldDeriveLayerResult> {
  const llm = this.layerLlms[layer];
  const parser = new StringOutputParser();

  const prompts: Record<WorldLayerType, ChatPromptTemplate> = {
    physical: this.physicalPrompt,
    biological: this.biologicalPrompt,
    society: this.societyPrompt,
    synthesis: this.synthesisPrompt,
  };

  const prompt = prompts[layer];
  const chain = prompt.pipe(llm).pipe(parser);

  const raw = await chain.invoke({
    coreAxis,
    physicalLayer: previousLayers.physical ?? '',
    biologicalLayer: previousLayers.biological ?? '',
    societyLayer: previousLayers.society ?? '',
  });

  const parsed = parseJsonFromLLM<Record<string, unknown>>(raw);

  if (layer === 'synthesis') {
    return {
      layer,
      content: '',
      name: String(parsed.name ?? ''),
      description: String(parsed.description ?? ''),
      factions: Array.isArray(parsed.factions) ? parsed.factions.map(String) : [],
    };
  }

  // For synthesis, tone goes in content
  if (layer === 'synthesis') {
    return { layer, content: String(parsed.tone ?? '') };
  }

  return { layer, content: String(parsed.content ?? '') };
}
```

**Note:** Replace the entire return logic after `parseJsonFromLLM` with this corrected version (handles all layer types):

```typescript
  if (layer === 'synthesis') {
    return {
      layer,
      content: String(parsed.tone ?? ''),
      name: String(parsed.name ?? ''),
      description: String(parsed.description ?? ''),
      factions: Array.isArray(parsed.factions) ? parsed.factions.map(String) : [],
    };
  }

  if (layer === 'society') {
    return {
      layer,
      content: String(parsed.organization ?? ''),
      tensions: String(parsed.tensions ?? ''),
    };
  }

  return { layer, content: String(parsed.content ?? '') };
```

- [ ] **Step 7: Verify build**

Run: `cd storyteller-generator-v2 && npm run build`
Expected: Clean compilation

- [ ] **Step 8: Commit**

```bash
git add storyteller-generator-v2/src/internal/context/world_generator/
git commit -m "feat(generator): add per-layer world generation with cascading prompts"
```

---

### Task 3: Register the new handler in the dispatcher

**Files:**
- Modify: `storyteller-generator-v2/src/consumer/core/services/generation.ts:115-123`
- Modify: `storyteller-generator-v2/src/consumer/dispatcher.ts`

- [ ] **Step 1: Add the handler in generation.ts**

After `handleWorldDerive` (line 123), add:

```typescript
export const handleWorldDeriveLayer: GenerationHandler = async (req) => {
  const payload = req.payload as WorldDeriveLayerPayload;
  const coreAxis = String(payload?.coreAxis ?? '').trim();
  if (!coreAxis) {
    throw new Error('payload.coreAxis is required');
  }
  if (!payload?.layer) {
    throw new Error('payload.layer is required');
  }
  const result = await worldContentGenerator.generateWorldLayer(
    payload.layer,
    coreAxis,
    payload.previousLayers ?? {},
  );
  return { type: GenerationType.WorldDeriveLayer, result };
};
```

Also add the import for `WorldDeriveLayerPayload` at the top.

- [ ] **Step 2: Register in dispatcher.ts**

Add to the `routes` map:

```typescript
[GenerationType.WorldDeriveLayer]: handleWorldDeriveLayer,
```

And import `handleWorldDeriveLayer` from the services.

- [ ] **Step 3: Verify build**

Run: `cd storyteller-generator-v2 && npm run build`

- [ ] **Step 4: Commit**

```bash
git add storyteller-generator-v2/src/consumer/
git commit -m "feat(generator): register world_derive_layer handler in dispatcher"
```

---

## Chunk 2: Go Backend -- Per-Layer Derivation Endpoint

### Task 4: Add Go types for layer derivation

**Files:**
- Modify: `storytellerMVP/internal/generation/domain/model.go:15`
- Modify: `storytellerMVP/internal/generation/domain/payloads.go`

- [ ] **Step 1: Add GenerationType constant**

In `model.go`, add after `GenerationTypeWorldDerive`:

```go
GenerationTypeWorldDeriveLayer GenerationType = "world_derive_layer"
```

- [ ] **Step 2: Add payload types in payloads.go**

Add after `WorldDeriveResult`:

```go
type WorldDeriveLayerPayload struct {
	CoreAxis       string            `json:"coreAxis"`
	Layer          string            `json:"layer"`
	PreviousLayers map[string]string `json:"previousLayers"`
}

type WorldDeriveLayerResult struct {
	Layer       string   `json:"layer"`
	Content     string   `json:"content"`
	Tensions    string   `json:"tensions,omitempty"`    // society layer only
	Name        string   `json:"name,omitempty"`        // synthesis layer only
	Factions    []string `json:"factions,omitempty"`    // synthesis layer only
	Description string   `json:"description,omitempty"` // synthesis layer only
}
```

- [ ] **Step 3: Verify build**

Run: `cd storytellerMVP && go build ./...`

- [ ] **Step 4: Commit**

```bash
git add storytellerMVP/internal/generation/domain/
git commit -m "feat(backend): add domain types for per-layer world derivation"
```

---

### Task 5: Add DTO and validation

**Files:**
- Modify: `storytellerMVP/internal/api/dto/world.go` (struct definition only)
- Modify: `storytellerMVP/internal/api/dto/validation.go` (Validate method -- follows existing convention, all validations live here)

- [ ] **Step 1: Add DTO struct in world.go**

Add after `WorldDerivePrompt` (line 17):

```go
type WorldDeriveLayerPrompt struct {
	CoreAxis       string            `json:"core_axis"`
	Layer          string            `json:"layer"`
	PreviousLayers map[string]string `json:"previous_layers"`
}
```

- [ ] **Step 2: Add Validate method in validation.go**

Add after the existing `WorldDerivePrompt.Validate()` (line ~64):

```go
func (p WorldDeriveLayerPrompt) Validate() error {
	if strings.TrimSpace(p.CoreAxis) == "" {
		return errors.New("core_axis es obligatorio")
	}
	validLayers := map[string]bool{"physical": true, "biological": true, "society": true, "synthesis": true}
	if !validLayers[p.Layer] {
		return fmt.Errorf("capa invalida: %s (debe ser physical, biological, society o synthesis)", p.Layer)
	}
	return nil
}
```

Note: `strings`, `errors`, and `fmt` are already imported in validation.go.

- [ ] **Step 3: Verify build**

Run: `cd storytellerMVP && go build ./...`

- [ ] **Step 4: Commit**

```bash
git add storytellerMVP/internal/api/dto/world.go storytellerMVP/internal/api/dto/validation.go
git commit -m "feat(backend): add DTO and validation for layer derivation"
```

---

### Task 6: Add service method and handler

**Files:**
- Modify: `storytellerMVP/internal/world/app/service.go`
- Modify: `storytellerMVP/internal/api/handlers/world.go`

- [ ] **Step 1: Add QueueLayerDerivation to the service**

In `service.go`, add after `QueueDerivation`:

```go
func (s *Service) QueueLayerDerivation(ctx context.Context, userID int, input dto.WorldDeriveLayerPrompt) (generationdomain.WorldDeriveLayerResult, error) {
	if s.GenerationService == nil || s.InstallationSvc == nil {
		return generationdomain.WorldDeriveLayerResult{}, errors.New("generation service not configured")
	}

	inst, err := s.InstallationSvc.GetInstallationByUserID(ctx, userID)
	if err != nil {
		return generationdomain.WorldDeriveLayerResult{}, fmt.Errorf("get installation: %w", err)
	}

	// Convert frontend field names (snake_case) to generator field names
	previousLayers := make(map[string]string)
	for k, v := range input.PreviousLayers {
		previousLayers[k] = v
	}

	payload, err := json.Marshal(map[string]interface{}{
		"coreAxis":       input.CoreAxis,
		"layer":          input.Layer,
		"previousLayers": previousLayers,
	})
	if err != nil {
		return generationdomain.WorldDeriveLayerResult{}, fmt.Errorf("marshal payload: %w", err)
	}

	req := &generationdomain.GenerationRequest{
		ID:             uuid.NewString(),
		UserID:         userID,
		GenerationType: generationdomain.GenerationTypeWorldDeriveLayer,
		Payload:        payload,
		ChannelID:      inst.ChannelID,
		AccessToken:    inst.AccessToken,
	}

	rawResp, err := s.GenerationService.CreateAndPublish(ctx, req)
	if err != nil {
		return generationdomain.WorldDeriveLayerResult{}, fmt.Errorf("generation: %w", err)
	}

	var tsResp struct {
		Result generationdomain.WorldDeriveLayerResult `json:"result"`
	}
	if err := json.Unmarshal(rawResp, &tsResp); err != nil {
		return generationdomain.WorldDeriveLayerResult{}, fmt.Errorf("unmarshal response: %w", err)
	}

	return tsResp.Result, nil
}
```

- [ ] **Step 2: Add the handler interface method**

In `handlers/world.go`, extend the `WorldService` interface:

```go
type WorldService interface {
	Create(ctx context.Context, w dto.WorldInput, ownerId int) (int, error)
	GetByID(id int) (domain.World, error)
	GetWorldsByOwnerId(ownerId int) ([]domain.World, error)
	DeleteByIDAndOwner(ctx context.Context, id int, ownerId int) error
	GetByIDAndOwner(id int, ownerId int) (domain.World, error)
	QueueDerivation(ctx context.Context, userID int, input dto.WorldDerivePrompt) (domain.World, error)
	QueueLayerDerivation(ctx context.Context, userID int, input dto.WorldDeriveLayerPrompt) (generationdomain.WorldDeriveLayerResult, error)
}
```

Add `generationdomain "github.com/toniDefez/storyteller/internal/generation/domain"` to imports.

- [ ] **Step 3: Add HandleWorldDeriveLayer**

After `HandleWorldDerive`:

```go
func HandleWorldDeriveLayer(service WorldService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Metodo no permitido", http.StatusMethodNotAllowed)
			return
		}

		var input dto.WorldDeriveLayerPrompt
		if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
			http.Error(w, "JSON invalido", http.StatusBadRequest)
			return
		}
		if err := input.Validate(); err != nil {
			httputils.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}

		userID := httputils.GetUserID(r)
		result, err := service.QueueLayerDerivation(r.Context(), userID, input)
		if err != nil {
			httputils.WriteError(w, err)
			return
		}

		httputils.WriteJSON(w, http.StatusOK, result)
	}
}
```

- [ ] **Step 4: Register the route**

In `internal/api/routes.go`, add after the existing derive route (line ~54, after `"/world/derive"`):

```go
router.HandleSecure("/world/derive-layer", handlers.HandleWorldDeriveLayer(app.WorldService))
```

- [ ] **Step 5: Verify build**

Run: `cd storytellerMVP && go build ./...`

- [ ] **Step 6: Commit**

```bash
git add storytellerMVP/internal/world/app/service.go storytellerMVP/internal/api/handlers/world.go storytellerMVP/cmd/
git commit -m "feat(backend): add /world/derive-layer endpoint for per-layer generation"
```

---

## Chunk 3: Frontend -- API Layer and State Machine

### Task 7: Add API function for layer derivation

**Files:**
- Modify: `storytellerFrontMVP/src/services/api.ts:80-97`

- [ ] **Step 1: Add types and function**

After the existing `deriveWorld` function (line 97), add:

```typescript
export type WorldLayerType = 'physical' | 'biological' | 'society' | 'synthesis'

export interface DeriveLayerResult {
  layer: WorldLayerType
  content: string
  tensions?: string    // society layer only
  name?: string        // synthesis layer only
  factions?: string[]  // synthesis layer only
  description?: string // synthesis layer only
}

export function deriveWorldLayer(
  coreAxis: string,
  layer: WorldLayerType,
  previousLayers: Partial<Record<WorldLayerType, string>>,
) {
  return request<DeriveLayerResult>('/world/derive-layer', {
    method: 'POST',
    body: JSON.stringify({
      core_axis: coreAxis,
      layer,
      previous_layers: previousLayers,
    }),
  })
}
```

- [ ] **Step 2: Verify build**

Run: `cd storytellerFrontMVP && npm run build`

- [ ] **Step 3: Commit**

```bash
git add storytellerFrontMVP/src/services/api.ts
git commit -m "feat(frontend): add deriveWorldLayer API function"
```

---

### Task 8: Create the useLayeredDerivation hook

**Files:**
- Create: `storytellerFrontMVP/src/hooks/useLayeredDerivation.ts`

- [ ] **Step 1: Create the state machine hook**

```typescript
import { useReducer, useCallback } from 'react'
import { deriveWorldLayer, type WorldLayerType, type DeriveLayerResult } from '../services/api'

// --- Types ---

export type LayerStatus = 'idle' | 'generating' | 'ready' | 'accepted' | 'rejected' | 'editing' | 'stale'

export interface LayerState {
  status: LayerStatus
  content: string | null
  editedContent: string | null
  /** For society layer -- tensions split from organization */
  tensions?: string
  /** For synthesis layer metadata */
  name?: string
  factions?: string[]
  description?: string
}

export const GENERATION_LAYERS: WorldLayerType[] = ['physical', 'biological', 'society', 'synthesis']

/** Maps our 3+1 layers to the existing Sanderson display model */
export const LAYER_DISPLAY_MAP: Record<WorldLayerType, { icon: string; label: string; labelEn: string; color: string }> = {
  physical:    { icon: '\u{1F30B}', label: 'Capa fisica',    labelEn: 'Physical Layer',    color: 'text-emerald-600' },
  biological:  { icon: '\u{1F33F}', label: 'Capa biologica', labelEn: 'Biological Layer',  color: 'text-amber-600' },
  society:     { icon: '\u{1F3DB}', label: 'Capa social',    labelEn: 'Society Layer',     color: 'text-blue-600' },
  synthesis:   { icon: '\u{1F3AD}', label: 'Sintesis',       labelEn: 'Synthesis',         color: 'text-violet-600' },
}

export interface DerivationState {
  coreAxis: string
  currentStep: number // 0-3 index into GENERATION_LAYERS
  layers: Record<WorldLayerType, LayerState>
  error: string | null
  /** Overall phase */
  phase: 'input' | 'generating' | 'reviewing' | 'saving'
}

// --- Actions ---

type Action =
  | { type: 'SET_CORE_AXIS'; coreAxis: string }
  | { type: 'START_LAYER'; layer: WorldLayerType }
  | { type: 'LAYER_COMPLETE'; layer: WorldLayerType; result: DeriveLayerResult }
  | { type: 'LAYER_ERROR'; layer: WorldLayerType; error: string }
  | { type: 'ACCEPT_LAYER'; layer: WorldLayerType }
  | { type: 'REJECT_LAYER'; layer: WorldLayerType }
  | { type: 'EDIT_LAYER'; layer: WorldLayerType; content: string }
  | { type: 'MARK_DOWNSTREAM_STALE'; fromLayer: WorldLayerType }
  | { type: 'SET_PHASE'; phase: DerivationState['phase'] }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'RESET' }

function createInitialLayers(): Record<WorldLayerType, LayerState> {
  return {
    physical:   { status: 'idle', content: null, editedContent: null },
    biological: { status: 'idle', content: null, editedContent: null },
    society:    { status: 'idle', content: null, editedContent: null },
    synthesis:  { status: 'idle', content: null, editedContent: null },
  }
}

const initialState: DerivationState = {
  coreAxis: '',
  currentStep: 0,
  layers: createInitialLayers(),
  error: null,
  phase: 'input',
}

function reducer(state: DerivationState, action: Action): DerivationState {
  switch (action.type) {
    case 'SET_CORE_AXIS':
      return { ...state, coreAxis: action.coreAxis }

    case 'START_LAYER':
      return {
        ...state,
        phase: 'generating',
        error: null,
        layers: {
          ...state.layers,
          [action.layer]: { ...state.layers[action.layer], status: 'generating' },
        },
      }

    case 'LAYER_COMPLETE': {
      const layerState: LayerState = {
        status: 'ready',
        content: action.result.content,
        editedContent: null,
        tensions: action.result.tensions,
        name: action.result.name,
        factions: action.result.factions,
        description: action.result.description,
      }
      const stepIdx = GENERATION_LAYERS.indexOf(action.layer)
      return {
        ...state,
        currentStep: stepIdx + 1,
        phase: 'reviewing',
        layers: { ...state.layers, [action.layer]: layerState },
      }
    }

    case 'LAYER_ERROR': {
      // If no layers have been generated yet, go back to input phase
      const hasAnyContent = GENERATION_LAYERS.some(l => state.layers[l].content !== null)
      return {
        ...state,
        phase: hasAnyContent ? 'reviewing' : 'input',
        error: action.error,
        layers: {
          ...state.layers,
          [action.layer]: { ...state.layers[action.layer], status: 'idle' },
        },
      }
    }

    case 'ACCEPT_LAYER':
      return {
        ...state,
        layers: {
          ...state.layers,
          [action.layer]: { ...state.layers[action.layer], status: 'accepted' },
        },
      }

    case 'REJECT_LAYER':
      return {
        ...state,
        layers: {
          ...state.layers,
          [action.layer]: { ...state.layers[action.layer], status: 'rejected' },
        },
      }

    case 'EDIT_LAYER':
      return {
        ...state,
        layers: {
          ...state.layers,
          [action.layer]: {
            ...state.layers[action.layer],
            editedContent: action.content,
            status: 'accepted',
          },
        },
      }

    case 'MARK_DOWNSTREAM_STALE': {
      const fromIdx = GENERATION_LAYERS.indexOf(action.fromLayer)
      const newLayers = { ...state.layers }
      for (let i = fromIdx + 1; i < GENERATION_LAYERS.length; i++) {
        const key = GENERATION_LAYERS[i]
        if (newLayers[key].status !== 'idle') {
          newLayers[key] = { ...newLayers[key], status: 'stale' }
        }
      }
      return { ...state, layers: newLayers }
    }

    case 'SET_PHASE':
      return { ...state, phase: action.phase }

    case 'SET_ERROR':
      return { ...state, error: action.error }

    case 'RESET':
      return { ...initialState, coreAxis: state.coreAxis }

    default:
      return state
  }
}

// --- Hook ---

export function useLayeredDerivation() {
  const [state, dispatch] = useReducer(reducer, initialState)

  const getAcceptedContent = useCallback((layer: WorldLayerType): string => {
    const ls = state.layers[layer]
    return ls.editedContent ?? ls.content ?? ''
  }, [state.layers])

  const buildPreviousLayers = useCallback((): Partial<Record<WorldLayerType, string>> => {
    const prev: Partial<Record<WorldLayerType, string>> = {}
    for (const layer of GENERATION_LAYERS) {
      const content = getAcceptedContent(layer)
      if (content) prev[layer] = content
    }
    return prev
  }, [getAcceptedContent])

  const generateLayer = useCallback(async (layer: WorldLayerType) => {
    dispatch({ type: 'START_LAYER', layer })
    try {
      const result = await deriveWorldLayer(
        state.coreAxis,
        layer,
        buildPreviousLayers(),
      )
      dispatch({ type: 'LAYER_COMPLETE', layer, result })
    } catch (err) {
      dispatch({
        type: 'LAYER_ERROR',
        layer,
        error: err instanceof Error ? err.message : 'Error generating layer',
      })
    }
  }, [state.coreAxis, buildPreviousLayers])

  const generateNextLayer = useCallback(async () => {
    if (state.currentStep >= GENERATION_LAYERS.length) return
    const layer = GENERATION_LAYERS[state.currentStep]
    await generateLayer(layer)
  }, [state.currentStep, generateLayer])

  const startDerivation = useCallback(async () => {
    dispatch({ type: 'RESET' })
    // Generate first layer (physical)
    dispatch({ type: 'START_LAYER', layer: 'physical' })
    try {
      const result = await deriveWorldLayer(state.coreAxis, 'physical', {})
      dispatch({ type: 'LAYER_COMPLETE', layer: 'physical', result })
    } catch (err) {
      dispatch({
        type: 'LAYER_ERROR',
        layer: 'physical',
        error: err instanceof Error ? err.message : 'Error generating layer',
      })
    }
  }, [state.coreAxis])

  const acceptLayer = useCallback((layer: WorldLayerType) => {
    dispatch({ type: 'ACCEPT_LAYER', layer })
  }, [])

  const rejectLayer = useCallback((layer: WorldLayerType) => {
    dispatch({ type: 'REJECT_LAYER', layer })
  }, [])

  const editLayer = useCallback((layer: WorldLayerType, content: string) => {
    dispatch({ type: 'EDIT_LAYER', layer, content })
    dispatch({ type: 'MARK_DOWNSTREAM_STALE', fromLayer: layer })
  }, [])

  const regenerateLayer = useCallback(async (layer: WorldLayerType) => {
    await generateLayer(layer)
  }, [generateLayer])

  const setCoreAxis = useCallback((coreAxis: string) => {
    dispatch({ type: 'SET_CORE_AXIS', coreAxis })
  }, [])

  // Computed values
  const allLayersDecided = GENERATION_LAYERS.every(
    l => state.layers[l].status === 'accepted' || state.layers[l].status === 'rejected'
  )
  const hasAcceptedLayers = GENERATION_LAYERS.some(l => state.layers[l].status === 'accepted')
  const hasStale = GENERATION_LAYERS.some(l => state.layers[l].status === 'stale')
  const isGenerating = GENERATION_LAYERS.some(l => state.layers[l].status === 'generating')
  const canGenerateNext = state.currentStep < GENERATION_LAYERS.length
    && !isGenerating
    && (state.currentStep === 0 || state.layers[GENERATION_LAYERS[state.currentStep - 1]].status === 'accepted')

  return {
    state,
    setCoreAxis,
    startDerivation,
    generateNextLayer,
    acceptLayer,
    rejectLayer,
    editLayer,
    regenerateLayer,
    getAcceptedContent,

    // Computed
    allLayersDecided,
    hasAcceptedLayers,
    hasStale,
    isGenerating,
    canGenerateNext,
  }
}
```

- [ ] **Step 2: Verify build**

Run: `cd storytellerFrontMVP && npm run build`

- [ ] **Step 3: Commit**

```bash
git add storytellerFrontMVP/src/hooks/useLayeredDerivation.ts
git commit -m "feat(frontend): add useLayeredDerivation state machine hook"
```

---

## Chunk 4: Frontend -- Component Updates

### Task 9: Update DerivationLayer for new layer model

**Files:**
- Modify: `storytellerFrontMVP/src/components/world-creation/DerivationLayer.tsx`

- [ ] **Step 1: Update LAYER_META to support both old and new models**

Replace `LAYER_META` with an export that supports both the new `WorldLayerType` keys and the component interface. The component itself stays mostly the same -- just add visual states for `generating` and `stale`:

Add to the `DerivationLayerProps` interface:

```typescript
interface DerivationLayerProps {
  layerKey: string
  layerMeta: { icon: string; label: string; color: string }
  suggestion: string | null
  cascadeDelay: number
  isRevealed: boolean
  isGenerating?: boolean
  isStale?: boolean
  onReveal: () => void
  onSuggestionAccept: (layerKey: string) => void
  onSuggestionReject: (layerKey: string) => void
  onSuggestionEdit: (layerKey: string, newText: string) => void
  onRegenerate?: (layerKey: string) => void
  chipStatus: ChipStatus | 'generating' | 'stale'
}
```

Key visual changes:
- When `isGenerating`: show a compact inline spinner instead of the SuggestionChip
- When `isStale`: show a warning badge "Contexto cambiado" with a "Regenerar" button
- Add a "Regenerar" (refresh icon) button in the chip actions for accepted layers

- [ ] **Step 2: Verify build**

Run: `cd storytellerFrontMVP && npm run build`

- [ ] **Step 3: Commit**

```bash
git add storytellerFrontMVP/src/components/world-creation/DerivationLayer.tsx
git commit -m "feat(frontend): add generating and stale visual states to DerivationLayer"
```

---

### Task 10: Update DerivationProgress for new states

**Files:**
- Modify: `storytellerFrontMVP/src/components/world-creation/DerivationProgress.tsx`

- [ ] **Step 1: Add generating state visualization**

Add a pulsing animation to the node when a layer is generating:

```typescript
{status === 'generating' && (
  <motion.div
    className={`absolute inset-0 rounded-full ${borderColor} border-2`}
    animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.1, 0.6] }}
    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
  />
)}
```

Also add a `stale` visual: yellow/warning border with a small exclamation icon.

Update the `ChipStatus` type import to include `'generating' | 'stale'` or accept a union type.

- [ ] **Step 2: Verify build**

- [ ] **Step 3: Commit**

```bash
git add storytellerFrontMVP/src/components/world-creation/DerivationProgress.tsx
git commit -m "feat(frontend): add generating/stale states to DerivationProgress"
```

---

### Task 11: Rewrite CreateWorldPage to use the layer wizard

**Files:**
- Modify: `storytellerFrontMVP/src/pages/home/CreateWorldPage.sanderson.tsx`

- [ ] **Step 1: Rewrite the page**

Replace the monolithic state management with `useLayeredDerivation`. The overall structure stays similar but the flow changes:

**Key differences from current:**
1. Instead of `handleDerive` making one call, `startDerivation` generates the physical layer
2. After the user accepts a layer, a "Generar siguiente capa" button appears (calls `generateNextLayer`)
3. Each layer can be regenerated independently with the "Regenerar" button
4. The synthesis layer auto-generates after the society layer is accepted
5. Save maps layers to DB fields:
   - `environment` = physical content
   - `subsistence` = biological content
   - `organization` + `tensions` = society content (split or combined)
   - `tone` = synthesis content
   - `name`, `description`, `factions` = from synthesis metadata

The page component shrinks significantly because the state logic moves to the hook.

**Synthesis auto-generation:** Add a `useEffect` that triggers synthesis generation automatically after society is accepted:

```typescript
useEffect(() => {
  if (
    state.layers.society.status === 'accepted'
    && state.layers.synthesis.status === 'idle'
    && !isGenerating
  ) {
    generateNextLayer() // will generate synthesis (step 3)
  }
}, [state.layers.society.status, state.layers.synthesis.status, isGenerating, generateNextLayer])
```

**LAYER_META replacement:** The old `LAYER_META` export from `DerivationLayer.tsx` (with 5 Sanderson keys) is replaced by `LAYER_DISPLAY_MAP` from the hook (with 4 generation layer keys). Update all imports in `CreateWorldPage` and `DerivationProgress` accordingly. The old `LAYER_META` can be kept as a non-exported constant if needed for backward compatibility, but the page should use the new map.

```typescript
export default function CreateWorldPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { hasInstallation, checked: installationChecked } = useInstallation()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const {
    state,
    setCoreAxis,
    startDerivation,
    generateNextLayer,
    acceptLayer,
    rejectLayer,
    editLayer,
    regenerateLayer,
    getAcceptedContent,
    allLayersDecided,
    hasAcceptedLayers,
    isGenerating,
    canGenerateNext,
    hasStale,
  } = useLayeredDerivation()

  // ... rest of component using these values
  // handleDerive -> startDerivation
  // "Generar siguiente capa" button when canGenerateNext && !isGenerating
  // Save maps layers to existing World fields
}
```

- [ ] **Step 2: Implement the save handler**

```typescript
const handleSave = async () => {
  setSaving(true)
  setSaveError('')

  try {
    const synthesis = state.layers.synthesis
    const society = state.layers.society
    await createWorld({
      name: name || synthesis.name || 'Mundo sin nombre',
      factions: synthesis.factions ?? [],
      description: synthesis.description ?? '',
      core_axis: state.coreAxis,
      environment: getAcceptedContent('physical'),
      subsistence: getAcceptedContent('biological'),
      organization: getAcceptedContent('society'),
      tensions: society.tensions ?? '',
      tone: getAcceptedContent('synthesis'),
    })
    navigate('/worlds')
  } catch (err) {
    setSaveError(err instanceof Error ? err.message : 'Error saving')
  } finally {
    setSaving(false)
  }
}
```

**Note:** The society layer returns `organization` in `content` and `tensions` as a separate field. Both DB columns are populated correctly.

- [ ] **Step 3: Verify build**

Run: `cd storytellerFrontMVP && npm run build`

- [ ] **Step 4: Commit**

```bash
git add storytellerFrontMVP/src/pages/home/CreateWorldPage.sanderson.tsx
git commit -m "feat(frontend): rewrite CreateWorldPage to use layered generation wizard"
```

---

### Task 12: Add layer description helper component

**Files:**
- Create: `storytellerFrontMVP/src/components/world-creation/LayerDescription.tsx`

- [ ] **Step 1: Create the component**

A simple component showing a one-line description of what each layer covers, displayed under the layer header:

```typescript
import type { WorldLayerType } from '../../services/api'

const descriptions: Record<WorldLayerType, { es: string; en: string }> = {
  physical: {
    es: 'Gravedad, terreno, clima, rios, recursos geologicos. Las condiciones fisicas fundamentales.',
    en: 'Gravity, terrain, climate, rivers, geological resources. The fundamental physical conditions.',
  },
  biological: {
    es: 'Ecosistemas, flora, fauna, cadenas alimentarias. La vida que emerge de las condiciones fisicas.',
    en: 'Ecosystems, flora, fauna, food chains. The life that emerges from physical conditions.',
  },
  society: {
    es: 'Asentamientos, economia, politica, cultura, conflictos. Como se organizan los seres inteligentes.',
    en: 'Settlements, economy, politics, culture, conflicts. How intelligent beings organize.',
  },
  synthesis: {
    es: 'Nombre, tono narrativo, facciones. La identidad final del mundo.',
    en: 'Name, narrative tone, factions. The world\'s final identity.',
  },
}

interface LayerDescriptionProps {
  layer: WorldLayerType
  lang?: 'es' | 'en'
}

export function LayerDescription({ layer, lang = 'es' }: LayerDescriptionProps) {
  return (
    <p className="text-xs text-muted-foreground/60 leading-relaxed mt-0.5 mb-2">
      {descriptions[layer][lang]}
    </p>
  )
}
```

- [ ] **Step 2: Verify build**

- [ ] **Step 3: Commit**

```bash
git add storytellerFrontMVP/src/components/world-creation/LayerDescription.tsx
git commit -m "feat(frontend): add LayerDescription helper component"
```

---

## Chunk 5: Integration and Cleanup

### Task 13: Update i18n strings

**Files:**
- Modify: `storytellerFrontMVP/src/i18n/locales/es.json`
- Modify: `storytellerFrontMVP/src/i18n/locales/en.json`

- [ ] **Step 1: Add new translation keys**

Add under `world.create`:

```json
{
  "world.create.generateNextLayer": "Generar siguiente capa",
  "world.create.regenerateLayer": "Regenerar esta capa",
  "world.create.staleWarning": "El contexto ha cambiado. Considera regenerar.",
  "world.create.layerPhysical": "Capa fisica",
  "world.create.layerBiological": "Capa biologica",
  "world.create.layerSociety": "Capa social",
  "world.create.layerSynthesis": "Sintesis",
  "world.create.generatingLayer": "Generando {{layer}}...",
  "world.create.layerProgress": "Capa {{current}} de {{total}}"
}
```

And English equivalents in `en.json`.

- [ ] **Step 2: Commit**

```bash
git add storytellerFrontMVP/src/i18n/locales/
git commit -m "feat(frontend): add i18n strings for layered generation"
```

---

### Task 14: Update ContextBuilder for new layer format

**Files:**
- Modify: `storyteller-generator-v2/src/internal/context/shared/context_builder.ts`

- [ ] **Step 1: Add formatters for the new layers**

The existing `formatWorld` already works with the DB fields. But downstream generators (character, scene) that read `WorldContext` will now receive content generated by the layered pipeline. The `environment` field will contain physical layer content, `subsistence` will contain biological content, etc.

No changes needed to `ContextBuilder` -- the mapping happens at save time in the frontend, and the DB fields match what `formatWorld` already reads.

Verify this by checking that `ContextBuilder.formatWorld` works with the existing `WorldContext` type. It does -- no changes needed.

- [ ] **Step 2: Commit (skip if no changes)**

---

### Task 15: End-to-end manual test

- [ ] **Step 1: Start all services**

```bash
# Terminal 1: DB + RabbitMQ + Ollama
cd storytellerMVP && make up-all

# Terminal 2: Go backend
cd storytellerMVP && go run ./cmd/server

# Terminal 3: TS generator
cd storyteller-generator-v2 && npm run start

# Terminal 4: Frontend
cd storytellerFrontMVP && npm run dev
```

- [ ] **Step 2: Test the full flow**

1. Navigate to `/worlds/create`
2. Enter a core axis: "En este mundo, el agua solo existe bajo tierra"
3. Click "Derivar mundo" -> Physical layer generates
4. Review physical layer, accept it
5. Click "Generar siguiente capa" -> Biological layer generates (should reference underground water)
6. Accept biological layer
7. Generate society layer (should reference underground agriculture, well control, etc.)
8. Accept society layer
9. Synthesis auto-generates
10. Accept all, save world
11. Verify saved world at `/worlds/:id` has correct field content

- [ ] **Step 3: Test per-layer regeneration**

1. After generating all layers, edit the physical layer text
2. Verify downstream layers show "stale" badge
3. Click "Regenerar" on biological layer
4. Verify new biological content references the edited physical content

- [ ] **Step 4: Test error recovery**

1. Stop the TS generator mid-generation
2. Verify the frontend shows an error for the failing layer, not a global crash
3. Restart generator, click "Regenerar" on the failed layer

---

### Task 16: Remove legacy single-prompt derive (optional, defer)

**Do NOT do this yet.** Keep the old `POST /world/derive` endpoint and `generateWorldDerive` method as fallback. Remove in a future PR once the layered approach is validated in production.

---

## Summary of Affected Pieces

### Files Modified (18)

| # | File | Repo | Changes |
|---|------|------|---------|
| 1 | `src/consumer/core/models/payloads.ts` | generator | New types |
| 2 | `src/consumer/core/models/generation.ts` | generator | New enum value |
| 3 | `src/consumer/core/services/generation.ts` | generator | New handler |
| 4 | `src/consumer/dispatcher.ts` | generator | Route registration |
| 5 | `src/internal/.../WorldContentGenerator.ts` | generator | Interface extension |
| 6 | `src/internal/.../OllamaWorldContentGenerator.ts` | generator | 4 new prompts + method |
| 7 | `internal/generation/domain/model.go` | backend | New constant |
| 8 | `internal/generation/domain/payloads.go` | backend | New types |
| 9 | `internal/api/dto/world.go` | backend | New DTO struct |
| 10 | `internal/api/dto/validation.go` | backend | Validate() for new DTO |
| 11 | `internal/world/app/service.go` | backend | New service method |
| 12 | `internal/api/handlers/world.go` | backend | New handler |
| 13 | `internal/api/routes.go` | backend | Register new route |
| 14 | `src/services/api.ts` | frontend | New API function + physical params |
| 15 | `src/components/PillSelect.tsx` | frontend | Icon, resonance, AI-picked visual states |
| 16 | `src/pages/home/CreateWorldPage.sanderson.tsx` | frontend | Rewrite to wizard |
| 17 | `src/components/world-creation/DerivationLayer.tsx` | frontend | New visual states |
| 18 | `src/components/world-creation/DerivationProgress.tsx` | frontend | Generating/stale node states |

### Files Created (6)

| # | File | Repo |
|---|------|------|
| 1 | `src/constants/physicalParameters.ts` | frontend |
| 2 | `src/components/world-creation/PhysicalParameterStep.tsx` | frontend |
| 3 | `src/components/world-creation/CategoryGroup.tsx` | frontend |
| 4 | `src/components/world-creation/WorldRichnessIndicator.tsx` | frontend |
| 5 | `src/hooks/useLayeredDerivation.ts` | frontend |
| 6 | `src/components/world-creation/LayerDescription.tsx` | frontend |

### Files NOT Changed

- DB schema (`init.sql`) -- no migration needed
- `SuggestionChip.tsx` -- works as-is
- `ContextBuilder.ts` -- field mapping handles compatibility
- Old `POST /world/derive` endpoint -- kept as fallback
