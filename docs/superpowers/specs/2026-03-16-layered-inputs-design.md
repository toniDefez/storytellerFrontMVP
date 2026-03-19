# Layered Pre-Generation Inputs for Biological & Society Layers

**Date:** 2026-03-16
**Status:** Approved by user (hybrid approach B+C)

## Problem

The world-creation wizard has an asymmetry: the Physical layer has rich pre-generation inputs (5 categories, 4 presets, Surprise Me), but Biological, Society, and Synthesis layers generate with zero user guidance. This breaks the co-creation contract established in the first step and leaves users as passive spectators for 3 of 4 layers.

## Design Decision

Add **graduated input** that decreases in specificity as layers build on each other:

| Layer | Categories | Presets | Rationale |
|-------|-----------|---------|-----------|
| Physical | 5 (existing) | 4 (existing) | Foundation layer, widest possibility space |
| Biological | 3 | 3 | Medium ambiguity — physical constrains but evolutionary strategy is authorial choice |
| Society | 3 | 3 | Low ambiguity — but power structure / conflict type are authorial, not derivable |
| Synthesis | 0 | 0 | Maximum context — the "gift unwrapping" moment. Accept/edit/reject only |

### Key Principles

1. **Sanderson cascade**: Physical rules FORCE interesting biology/society. Don't add controls that are redundant with what physics already implies. Each new category must be **orthogonal** to previous layers.
2. **Graduated engagement**: Input decreases per layer. Physical (5 cats) > Bio (3 cats) > Society (3 cats) > Synthesis (0).
3. **Always optional**: Every category has implicit "Let the world decide" (no selection = AI interprets freely). Plus explicit "Surprise Me" button per step.
4. **Narrative-first options**: Options read like story hooks, not config labels. Hints are questions, not descriptions.

## Biological Layer Design

Appears as an **interstitial step** between accepting Physical and generating Biological.

### Categories

#### 1. Ecological Dominance (`dominance`)
- Hint: "Que tipo de vida manda aqui? Que forma domino la evolucion?"
- Icon: crown
- Single-select

| Value | Icon | Label (ES) | Label (EN) | Desc (ES) | Desc (EN) |
|-------|------|-----------|-----------|-----------|-----------|
| `megafauna` | mammoth | Megafauna | Megafauna | Criaturas enormes. La arquitectura, las rutas, la guerra: todo gira en torno a los gigantes. | Enormous creatures. Architecture, routes, war: everything revolves around the giants. |
| `swarm` | ant | Enjambres | Swarms | Nada es grande, pero todo se mueve en masa. La inteligencia es colectiva, no individual. | Nothing is large, but everything moves in mass. Intelligence is collective, not individual. |
| `flora` | tree | Flora dominante | Dominant flora | Las plantas mandan. Crecen, invaden, devoran. Los animales sobreviven en los huecos que dejan. | Plants rule. They grow, invade, devour. Animals survive in the gaps they leave. |
| `fungal` | mushroom | Redes fungicas | Fungal networks | Hongos y micelios conectan todo. La informacion viaja bajo tierra. Nada muere sin ser reciclado. | Fungi and mycelium connect everything. Information travels underground. Nothing dies without being recycled. |
| `microscopic` | petri | Mundo microscopico | Microscopic world | La vida visible es rara o fragil. Lo que realmente importa no se ve a simple vista. | Visible life is rare or fragile. What truly matters can't be seen with the naked eye. |

#### 2. Relationship with Intelligence (`intelligence`)
- Hint: "Hay criaturas inteligentes ademas de la especie dominante?"
- Icon: brain
- Single-select

| Value | Icon | Label (ES) | Label (EN) | Desc (ES) | Desc (EN) |
|-------|------|-----------|-----------|-----------|-----------|
| `apex_solo` | crown | Unica especie sapiente | Sole sapient species | Solo una especie piensa. Las demas son recursos, amenazas o paisaje. | Only one species thinks. The rest are resources, threats, or scenery. |
| `rival_species` | swords | Especies rivales | Rival species | Dos o mas inteligencias compiten. Diplomacia interespecies, guerras biologicas. | Two or more intelligences compete. Interspecies diplomacy, biological wars. |
| `symbiotic` | handshake | Simbiosis obligada | Obligate symbiosis | La especie dominante no puede sobrevivir sin otra. Dependen mutuamente. | The dominant species cannot survive without another. They depend on each other. |
| `hive_mind` | network | Mente colmena | Hive mind | La inteligencia no reside en individuos sino en la red. Juntos, comprenden. | Intelligence does not reside in individuals but in the network. Together, they understand. |
| `uplifted` | sparkles | Despertar reciente | Recently awakened | Algo les dio inteligencia hace poco. Instintos animales contra razon nueva. | Something gave them intelligence recently. Animal instincts versus new reason. |

#### 3. Key Biological Resource (`bio_resource`)
- Hint: "Que produce la vida que todos necesitan o desean?"
- Icon: vial
- Single-select

| Value | Icon | Label (ES) | Label (EN) | Desc (ES) | Desc (EN) |
|-------|------|-----------|-----------|-----------|-----------|
| `living_material` | bone | Material vivo | Living material | Hueso, seda, quitina, madera viva. Se construye con lo que crece. Matar es cosechar. | Bone, silk, chitin, living wood. You build with what grows. To kill is to harvest. |
| `secretion` | honey | Secreciones | Secretions | Veneno, miel, resina, tinta. Algo que solo un organismo produce y todos necesitan. | Venom, honey, resin, ink. Something only one organism produces and everyone needs. |
| `spores` | wind | Esporas | Spores | Viajan con el viento, alteran la mente, curan o enferman. Quien controla las esporas controla la salud. | They travel with the wind, alter the mind, heal or sicken. Whoever controls the spores controls health. |
| `bio_light` | lantern | Luz biologica | Biological light | En un mundo oscuro, lo que brilla vale oro. Criaturas-farol, granjas de algas luminosas. | In a dark world, what shines is worth gold. Lantern-creatures, luminous algae farms. |
| `symbiont_access` | dna | Acceso al simbionte | Symbiont access | Conectarse a otra criatura da poder, conocimiento o salud. No todos tienen acceso. | Connecting to another creature grants power, knowledge, or health. Not everyone has access. |

### Biological Presets

| Key | Icon | Name (ES) | Name (EN) | Desc (ES) | Desc (EN) | Selections |
|-----|------|-----------|-----------|-----------|-----------|------------|
| `primordial_jungle` | leaf | La Jungla Primordial | The Primordial Jungle | Flora devoradora, megafauna, y materiales que crecen en los huesos de lo que muere | Devouring flora, megafauna, and materials that grow from the bones of the dead | `dominance: flora, bio_resource: living_material` |
| `the_network` | mushroom | La Red | The Network | Hongos que conectan todo bajo tierra, una mente distribuida que nadie controla | Fungi connecting everything underground, a distributed mind no one controls | `dominance: fungal, intelligence: hive_mind, bio_resource: spores` |
| `beast_and_rider` | horse | Bestia y Jinete | Beast and Rider | Gigantes domesticados, simbiosis forzada, civilizacion sobre algo que no comprende | Domesticated giants, forced symbiosis, civilization atop something it doesn't understand | `dominance: megafauna, intelligence: symbiotic` |

---

## Society Layer Design

Appears as an interstitial step between accepting Biological and generating Society.

### Categories

#### 1. Source of Power (`power_source`)
- Hint: "Que da poder en esta sociedad? Quien lo tiene, quien no?"
- Icon: flame
- Single-select

| Value | Icon | Label (ES) | Label (EN) | Desc (ES) | Desc (EN) |
|-------|------|-----------|-----------|-----------|-----------|
| `resource_control` | lock | Control del recurso | Resource control | Quien controla lo escaso, manda. Oligarquias del agua, carteles de esporas, monopolios de luz. | Whoever controls the scarce, commands. Water oligarchies, spore cartels, light monopolies. |
| `knowledge` | book | Conocimiento | Knowledge | Saber es poder. Escribas, cientificos, oraculos. La informacion se guarda, se vende. | Knowledge is power. Scribes, scientists, oracles. Information is hoarded, sold. |
| `lineage` | scroll | Sangre y linaje | Blood and lineage | El poder se hereda. Casas nobles, castas biologicas, lineas geneticas con habilidades reales. | Power is inherited. Noble houses, biological castes, genetic lines with real abilities. |
| `combat` | sword | Fuerza y combate | Strength and combat | Quien puede matar, gobierna. Arenas, duelos rituales, meritocracia marcial. | Whoever can kill, rules. Arenas, ritual duels, martial meritocracy. |
| `spiritual` | eye | Conexion espiritual | Spiritual connection | Acceso a algo que otros no perciben. Videntes, chamanes, mediadores con lo no-humano. | Access to something others cannot perceive. Seers, shamans, mediators with the non-human. |

#### 2. Core Tension (`core_tension`)
- Hint: "Cual es la fractura que divide a la sociedad?"
- Icon: scales
- Single-select

| Value | Icon | Label (ES) | Label (EN) | Desc (ES) | Desc (EN) |
|-------|------|-----------|-----------|-----------|-----------|
| `haves_vs_have_nots` | chain | Desigualdad | Inequality | Unos tienen, otros no. El conflicto es vertical: arriba contra abajo. | Some have, others don't. The conflict is vertical: top against bottom. |
| `tradition_vs_change` | hourglass | Tradicion contra cambio | Tradition vs. change | Los viejos metodos funcionan pero limitan. Los nuevos prometen pero arriesgan todo. | Old methods work but limit. New ones promise but risk everything. |
| `isolation_vs_expansion` | compass | Aislamiento contra expansion | Isolation vs. expansion | Quedarse seguros o explorar lo desconocido. Cada opcion tiene un precio. | Stay safe or explore the unknown. Each option has a cost. |
| `species_tension` | faces | Tension entre especies | Interspecies tension | La coexistencia no es facil. Derechos, territorios, quien es "persona" y quien no. | Coexistence is not easy. Rights, territories, who is "person" and who is not. |
| `memory_vs_forgetting` | erased | Memoria contra olvido | Memory vs. forgetting | Algo del pasado importa. Unos quieren recordar, otros quieren enterrarlo. | Something from the past matters. Some want to remember, others want to bury it. |

#### 3. Social Scale (`social_scale`)
- Hint: "Como de grande es la civilizacion?"
- Icon: village
- Single-select

| Value | Icon | Label (ES) | Label (EN) | Desc (ES) | Desc (EN) |
|-------|------|-----------|-----------|-----------|-----------|
| `scattered_bands` | campfire | Bandas dispersas | Scattered bands | Grupos pequenos, sin Estado. La supervivencia es local, las alianzas fragiles. | Small groups, no state. Survival is local, alliances fragile. |
| `city_states` | castle | Ciudades-estado | City-states | Nucleos de poder aislados. Cada ciudad es un mundo. El comercio y la guerra conectan. | Isolated power centers. Each city is a world. Trade and war connect. |
| `empire` | crown | Imperio | Empire | Una estructura enorme que intenta controlarlo todo. Burocracia, resistencia en los margenes. | A massive structure trying to control everything. Bureaucracy, resistance at the margins. |
| `nomadic` | caravan | Civilizacion nomada | Nomadic civilization | Nadie se queda. Las rutas son la estructura. Los puntos de encuentro son capitales temporales. | Nobody stays. Routes are the structure. Meeting points are temporary capitals. |

### Society Presets

| Key | Icon | Name (ES) | Name (EN) | Desc (ES) | Desc (EN) | Selections |
|-----|------|-----------|-----------|-----------|-----------|------------|
| `feudal_resource` | castle | Feudalismo del recurso | Resource feudalism | Casas nobles que controlan lo escaso, ciudades-fortaleza, vasallos y rebeldes | Noble houses controlling the scarce, fortress-cities, vassals and rebels | `power_source: resource_control, core_tension: haves_vs_have_nots, social_scale: city_states` |
| `nomad_sages` | compass | Los Sabios Errantes | The Wandering Sages | Conocimiento oral, caravanas de eruditos, poder en lo que sabes | Oral knowledge, caravans of scholars, power in what you know | `power_source: knowledge, social_scale: nomadic, core_tension: tradition_vs_change` |
| `fractured_coexistence` | handshake | La Coexistencia Rota | Fractured Coexistence | Multiples especies intentando convivir, leyes que nadie respeta del todo | Multiple species attempting coexistence, laws nobody fully respects | `core_tension: species_tension, social_scale: city_states` |

---

## Interaction Flow

```
Core Axis (textarea)
    |
Physical Parameters (5 categories, 4 presets, Surprise Me)
    |
    v  [Generate Physical layer]
    |
Accept/Edit/Reject Physical
    |
    v  [Show Biological input step]
    |
Biological Parameters (3 categories, 3 presets, Surprise Me)  <-- NEW
    |
    v  [Generate Biological layer]
    |
Accept/Edit/Reject Biological
    |
    v  [Show Society input step]
    |
Society Parameters (3 categories, 3 presets, Surprise Me)  <-- NEW
    |
    v  [Generate Society layer]
    |
Accept/Edit/Reject Society
    |
    v  [Auto-generate Synthesis]
    |
Accept/Edit/Reject Synthesis
    |
    v  [Save world]
```

### UX Details

- Input steps appear BETWEEN accepting one layer and generating the next (interstitial pattern)
- Each step uses the same `CategoryGroup` + `PillSelect` components as Physical
- "Surprise Me" randomizes empty categories (same mechanic as Physical)
- No selection = AI interprets freely (implicit "Let the world decide")
- No resonance keywords needed for Bio/Society (diminishing returns)
- The interstitial step should feel lighter than Physical: no sticky core-axis reminder needed (context is accumulated in accepted layers above)

## Architecture

### New Files

```
src/constants/biologicalParameters.ts   — categories, presets, types (same shape as physicalParameters.ts)
src/constants/societyParameters.ts      — categories, presets, types

src/components/world-creation/BiologicalParameterStep.tsx  — mirrors PhysicalParameterStep (lighter)
src/components/world-creation/SocietyParameterStep.tsx     — mirrors PhysicalParameterStep (lighter)
```

### Modified Files

```
src/hooks/useLayeredDerivation.ts
  - Add biologicalSelections and societySelections to state
  - Add setBiologicalSelections and setSocietySelections actions
  - Pass relevant selections to deriveWorldLayer for each layer
  - Add new phase states for interstitial input steps

src/pages/home/CreateWorldPage.sanderson.tsx
  - Render BiologicalParameterStep between Physical accept and Bio generation
  - Render SocietyParameterStep between Biological accept and Society generation

src/services/api.ts
  - Update deriveWorldLayer to accept layer-specific parameters

src/i18n/locales/es.json — add biological.* and society_layer.* keys
src/i18n/locales/en.json — add biological.* and society_layer.* keys
```

### Type Refactoring

Extract shared types from `physicalParameters.ts` into a common shape, since all three layers use identical data structures:

```typescript
// All layers share this shape
export interface ParameterOption {
  value: string
  icon: string
  labelKey: string
  descriptionKey: string
}

export interface ParameterCategory {
  key: string
  icon: string
  labelKey: string
  hintKey: string
  multiSelect?: boolean
  maxSelections?: number
  options: ParameterOption[]
}

export type ParameterSelections = Record<string, string | string[]>
```

## UX Fixes (also in this change)

1. **Core axis `line-clamp-2` removed** — text was being truncated in the sticky reminder
2. **SuggestionChip `pr-20` removed** — accepted suggestions were squeezing text against absolute-positioned buttons. Buttons are now flow-based (below text) instead of overlapping.
3. **DerivationProgress tooltip `max-w-[120px] truncate`** — prevents tooltip from overflowing viewport
4. **Preset selector fixed** — presets now REPLACE (not merge) selections, support toggle-off, and show descriptions
