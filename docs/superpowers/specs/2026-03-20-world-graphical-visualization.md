# World Graphical Visualization — Design Spec

**Date:** 2026-03-20
**Status:** Approved (post-review)

## Goal

Replace the current text-card grid in `WorldDetailPage` with graphical, interactive visualizations that make the world's structure intuitively readable at a glance. Apply the same visual principles used in character creation (SVG + framer-motion, structured LLM output, zero text-matching heuristics).

## Context

The character creation page already has 4 graphical components: `WantNeedFearTriangle`, `FactionOrbitMap`, `ConsciousnessPlane`, `PermeabilityMembrane`. The world detail page still shows all data as flat text cards in a 2-column grid. This spec closes that gap.

The world follows a **Sanderson derivation model**: Physical environment → Biological ecosystem → Society + Tensions → Synthesis. Factions are the intermediary through which world-level forces become personal pressure on characters.

## Approved Design: Option A — Cascade + Enriched Orbit

### Layout in WorldDetailPage

Replace the current Sanderson layers grid with two visual sections placed between the hero (name/description) and the characters/scenes sections:

**Section 1 — Causal Cascade Diagram**
A vertical flow diagram showing the 3-layer causal chain:
```
[🌍 Físico: environment]
        ↓
[🌿 Biológico: subsistence]
        ↓
[🏛 Sociedad: organization]
        ↓
[⚡ Tensiones: tensions]
```
Each layer is a card with a colored left-border. The arrows between them communicate causality, not just categorization. Tone shown as a small label at the bottom. No changes to DB schema — uses existing columns.

**Section 2 — Enriched Faction Orbit Map**
Concentric rings (élite / clase media / margen) with faction nodes. Each node displays:
- Name
- Power basis icon (🔮 ritual · ⚙️ económico · ⚔️ militar · 🌱 tierra · ⚒️ trabajo · 👁 información)
- World wound relation badge (C=causó · B=beneficia · S=sufre · I=ignora)

Edges between nodes:
- Dependencia → dashed amber arrow (directed)
- Conflicto → dashed red line
- Instrumentalización → asymmetric purple line

## New Structured Faction Data

### DB: `worlds` table — new column

Add to `docker/postgres/init.sql` inside the `CREATE TABLE worlds` statement:
```sql
structured_factions JSONB,
faction_relations JSONB,
```

The existing `factions TEXT[]` stays for backward compatibility. `structured_factions` and `faction_relations` are **write-once** — populated only during world generation, never updated via the `Update` path. Implementers must not add these fields to the `pg_repo.go` UPDATE query.

### Data model per faction

`tier` uses the same numeric type as the existing `FactionPowerTier` in `api.ts` and `payloads.ts` (`0 | 1 | 2`) to stay consistent with character components. The `WorldFactionGraph` component maps these to ring positions (0=élite, 1=media, 2=margen) identical to `FactionOrbitMap`.

```typescript
// FactionPowerTier is already defined as 0 | 1 | 2 in api.ts — reuse it
interface StructuredFaction {
  name: string
  tier: FactionPowerTier                // 0=elite, 1=middle, 2=marginal — reuses existing type
  power_basis: 'military' | 'economic' | 'ritual' | 'land' | 'labor' | 'information'
  resource_controlled: string           // short phrase, e.g. "derechos sobre el Acuífero"
  world_wound_relation: 'caused' | 'benefits' | 'suffers' | 'ignores'
  internal_pressure: string             // 1 sentence — institutional contradiction
}

interface FactionRelation {
  source: string                        // faction name
  target: string                        // faction name
  type: 'dependency' | 'conflict' | 'instrumentalization'
  notes: string                         // 1 short phrase
}
```

### LLM output (TS generator)

The world synthesis layer already returns `name`, `tone`, `description`, `factions[]`. Extend it to also return `structuredFactions` and `factionRelations` in the **same call** — no new RabbitMQ round trip.

**Important:** The synthesis LLM is currently configured with 1024 token output limit. Increase to **2048** in `OllamaWorldContentGenerator.ts` to accommodate the extended JSON output with per-faction structured fields.

## Components to Build

### New components (world-specific)

| Component | File | Description |
|-----------|------|-------------|
| `WorldCausalCascade` | `src/components/world-detail/WorldCausalCascade.tsx` | Vertical flow: physical → biological → society → tensions |
| `WorldFactionGraph` | `src/components/world-detail/WorldFactionGraph.tsx` | Enriched orbit map with power_basis icons, wound badges, and typed edges |

### Existing components reused

- `framer-motion` for node entrance animations (same pattern as `FactionOrbitMap`)
- SVG for orbit rings and edges (no new graphics library)
- `FactionPowerTier` type from `api.ts`

## Files to Modify

### TypeScript Generator (`storyteller-generator-v2`)
- `src/consumer/core/models/payloads.ts` — add `StructuredFaction`, `FactionRelation` types; extend `WorldDeriveLayerResult` (synthesis layer result) to include `structuredFactions?: StructuredFaction[]` and `factionRelations?: FactionRelation[]`
- `src/internal/context/world_generator/infra/OllamaWorldContentGenerator.ts` — extend synthesis prompt to return `structuredFactions[]` and `factionRelations[]`; increase synthesis LLM token limit from 1024 to 2048

### Go Backend (`storytellerMVP`)
- `docker/postgres/init.sql` — add `structured_factions JSONB` and `faction_relations JSONB` inside `CREATE TABLE worlds`
- `internal/world/domain/model.go` — add `StructuredFactions json.RawMessage` and `FactionRelations json.RawMessage` to `World` struct
- `internal/api/dto/world.go` — add `StructuredFactions json.RawMessage` and `FactionRelations json.RawMessage` to `WorldOutput`
- `internal/mappings/world.go` — copy new fields in `WorldToOutputDTO`
- `internal/world/infra/pg_repo.go` — add new columns to INSERT and SELECT queries only (not UPDATE — fields are write-once)
- `internal/world/app/service.go` — map `structuredFactions` and `factionRelations` from generator response into `World` struct
- `internal/generation/domain/payloads.go` — extend `WorldDeriveLayerResult` struct to include `StructuredFactions json.RawMessage \`json:"structuredFactions"\`` and `FactionRelations json.RawMessage \`json:"factionRelations"\`` so `json.Unmarshal` in `service.go` captures the new fields from the TS generator's RabbitMQ response
- `internal/world_detail/domain/model.go` — add `StructuredFactions json.RawMessage` and `FactionRelations json.RawMessage` to `WorldDetail` struct (separate from `World` — this is what the `/world-detail/get` endpoint serializes)
- `internal/world_detail/app/service.go` — copy `StructuredFactions` and `FactionRelations` from `world` entity into the `WorldDetail` struct construction

### React Frontend (`storytellerFrontMVP`)
- `src/services/api.ts` — add `StructuredFaction`, `FactionRelation` types; add optional fields to `World` interface
- `src/components/world-detail/WorldCausalCascade.tsx` — create
- `src/components/world-detail/WorldFactionGraph.tsx` — create
- `src/pages/home/WorldDetailPage.tsx`:
  - Replace text grid with two new components
  - **Important:** The `normalizedWorld` construction block (approx. lines 64–75) manually maps raw API fields into the `World` object. Add `structured_factions: raw.structured_factions as StructuredFaction[] | undefined` and `faction_relations: raw.faction_relations as FactionRelation[] | undefined` to this block, otherwise the new fields will be silently dropped even when the API returns them.
- `src/i18n/locales/es.json` — add translation keys for new component labels (layer names, badge labels)
- `src/i18n/locales/en.json` — add English equivalents

## Data Flow

```
TS Generator (synthesis call, 2048 token limit)
  └─ returns: name, tone, description, factions[], structuredFactions[], factionRelations[]

Go backend: generation/domain/payloads.go (WorldDeriveLayerResult)
  └─ deserializes structuredFactions + factionRelations from RabbitMQ response

Go backend: world/app/service.go
  └─ maps into World struct → stored via pg_repo.go INSERT

Go backend: world_detail/app/service.go
  └─ copies fields into WorldDetail struct → returned by /world-detail/get

Frontend API (getWorldDetail)
  └─ World type includes structured_factions?: StructuredFaction[]
                          faction_relations?: FactionRelation[]
  └─ normalizedWorld block in WorldDetailPage must pass these through

WorldDetailPage
  ├─ WorldCausalCascade (environment, subsistence, organization, tensions, tone)
  └─ WorldFactionGraph (factions[], structured_factions?, faction_relations?)
                         ↑ falls back to heuristics if structured_factions absent
```

## Fallback Strategy

`WorldFactionGraph` accepts both:
- `structuredFactions?: StructuredFaction[]` (preferred — when LLM provides structured data)
- `factions?: string[]` (legacy — heuristic tier inference, no edges, no badges)

This ensures existing worlds display something meaningful immediately, and new worlds get the full graph.

## Visual Palette

Consistent with existing character components:
- Élite ring: purple (`#a855f7`)
- Middle ring: amber (`#d97706`)
- Marginal ring: rose (`#dc2626`)
- Dependency edge: amber dashed arrow
- Conflict edge: rose dashed line
- Instrumentalization edge: purple asymmetric dash

Power basis icons: emoji for simplicity (consistent with character components which use emoji in SVG `<text>` nodes).

## Out of Scope

- Interactive hover tooltips (can be added in a follow-up)
- Click-through to filter characters by faction
- Editing factions directly from the graph
- The `WorldBiblePage` — separate concern
- Adding `StructuredFaction` data to `WorldContext` sent to the character generator (planned future evolution — when character generator uses faction power structure to derive characters more precisely)

## Success Criteria

1. `WorldDetailPage` shows `WorldCausalCascade` and `WorldFactionGraph` instead of the text grid
2. New worlds generated via the TS generator include `structuredFactions` and `factionRelations`
3. Existing worlds (with only `factions[]`) still render the orbit map using heuristic fallback
4. Build passes (`npm run build`) with no TypeScript errors
5. Go backend compiles (`go build ./...`) with new fields
6. `normalizedWorld` block passes `structured_factions` and `faction_relations` through from raw API response
