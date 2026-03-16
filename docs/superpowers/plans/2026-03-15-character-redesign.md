# Character Redesign — Derivation from World

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace flat RPG-label character creation with a derivation-based flow where characters emerge from their world's conditions, using a single "dramatic premise" as input.

**Architecture:** Three-repo change following the data flow: Generator v2 (new prompt + structured result) → Go Backend (new fields in domain/DTO/DB) → Frontend (derivation UI replacing pills form). The character generator already receives WorldContext with Sanderson fields (coreAxis, environment, subsistence, organization, tensions, tone) — we enrich the output, not the input.

**Tech Stack:** TypeScript/LangChain (generator), Go/PostgreSQL (backend), React 19/TypeScript/Tailwind/shadcn (frontend)

---

## Chunk 1: Generator v2 — New Character Model & Prompt

This chunk updates the generator to produce richer, world-derived characters.

### Task 1: Update CharacterStructuredResult and CharacterContext in payloads.ts

**Files:**
- Modify: `storyteller-generator-v2/src/consumer/core/models/payloads.ts:18-24` (CharacterContext)
- Modify: `storyteller-generator-v2/src/consumer/core/models/payloads.ts:64-70` (CharacterStructuredResult)

- [ ] **Step 1: Update CharacterStructuredResult**

Replace the current 5-field result with the new 10-field model:

```typescript
export interface CharacterStructuredResult {
  name: string;
  role: string;                    // world-derived function, not RPG label
  socialPosition: string;          // position in world's power structure
  personality: string;             // traits with nuance and contradiction
  internalContradiction: string;   // tension that makes them interesting
  relationToCollectiveLie: string; // how they relate to world's collective lie
  personalFear: string;            // different from world's collective fear
  background: string;              // history anchored to world events/factions
  goals: string[];                 // 2-4 goals connected to world tensions
  factionAffiliation: string;      // which world faction (or marginalized)
}
```

- [ ] **Step 2: Update CharacterContext**

Extend context injected into other generators (scenes, events) so they benefit from richer character data:

```typescript
export interface CharacterContext {
  name: string;
  role: string;
  personality: string;
  background: string;
  goals: string[];
  socialPosition: string;
  internalContradiction: string;
  factionAffiliation: string;
}
```

- [ ] **Step 3: Build to verify compilation**

Run: `cd storyteller-generator-v2 && npm run build`
Expected: No TypeScript errors (downstream files will need updating next)

- [ ] **Step 4: Commit**

```bash
cd storyteller-generator-v2
git add src/consumer/core/models/payloads.ts
git commit -m "feat(character): expand CharacterStructuredResult with derivation fields"
```

---

### Task 2: Update ContextBuilder.formatCharacter to include new fields

**Files:**
- Modify: `storyteller-generator-v2/src/internal/context/shared/context_builder.ts:35-46`

- [ ] **Step 1: Extend formatCharacter()**

```typescript
static formatCharacter(c: CharacterContext): string {
  const lines = [
    `### ${c.name}`,
    "",
    `- **Rol:** ${c.role}`,
    `- **Personalidad:** ${c.personality}`,
    `- **Trasfondo:** ${c.background}`,
  ];
  if (c.goals.length > 0) {
    lines.push(`- **Objetivos:** ${c.goals.join("; ")}`);
  }
  if (c.socialPosition) {
    lines.push(`- **Posición social:** ${c.socialPosition}`);
  }
  if (c.internalContradiction) {
    lines.push(`- **Contradicción interna:** ${c.internalContradiction}`);
  }
  if (c.factionAffiliation) {
    lines.push(`- **Facción:** ${c.factionAffiliation}`);
  }
  return lines.join("\n");
}
```

- [ ] **Step 2: Build to verify**

Run: `cd storyteller-generator-v2 && npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
cd storyteller-generator-v2
git add src/internal/context/shared/context_builder.ts
git commit -m "feat(character): extend formatCharacter with derivation fields"
```

---

### Task 3: Rewrite OllamaCharacterContentGenerator prompts

**Files:**
- Modify: `storyteller-generator-v2/src/internal/context/character_generator/infra/OllamaCharacterContentGenerator.ts`

- [ ] **Step 1: Rewrite the structuredPrompt system message**

Replace the current prompt (lines 47-80) with a derivation-aware prompt:

```typescript
private readonly structuredPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `Eres un creador de personajes para mundos narrativos.
Objetivo: crear un personaje que sea CONSECUENCIA del mundo, no una decoración sobre él.

Contexto del mundo:
{worldContext}

{existingCharacters}

REGLAS DE DERIVACIÓN (obligatorias):
1. El "role" debe ser una función que el mundo NECESITA — derivada de la subsistencia y el entorno. No uses etiquetas genéricas (guerrero, mago). Describe qué hace esta persona y por qué el mundo la necesita.
2. La "socialPosition" describe dónde está en la estructura de poder del mundo — quién está por encima, quién por debajo, y por qué.
3. La "personality" debe incluir 3-5 rasgos CON MATICES Y CONTRADICCIONES. No adjetivos planos. Cada rasgo debe conectar con las condiciones del mundo.
4. La "internalContradiction" es la tensión que hace interesante al personaje — dos fuerzas opuestas dentro de él, derivadas de su posición en el mundo.
5. La "relationToCollectiveLie" describe cómo se posiciona ante la mentira o creencia dominante del mundo: la cree ciegamente, empieza a dudar, la conoce pero calla, la explota, o la combate activamente.
6. El "personalFear" debe ser DIFERENTE del miedo colectivo del mundo — es un miedo íntimo derivado de su posición.
7. El "background" debe referenciar facciones, tensiones y condiciones concretas del mundo. 150-300 palabras.
8. Los "goals" (2-4) deben conectar con las tensiones del mundo — reforzarlas o desafiarlas.
9. La "factionAffiliation" debe ser una de las facciones del mundo, o describir por qué el personaje está al margen.

IMPORTANTE: Tu respuesta DEBE ser ÚNICAMENTE un objeto JSON válido con esta estructura:
{{
  "name": "Nombre completo (y apodo si aplica)",
  "role": "Función derivada del mundo",
  "socialPosition": "Posición en la estructura de poder",
  "personality": "3-5 rasgos con matices y contradicciones",
  "internalContradiction": "Tensión interna del personaje",
  "relationToCollectiveLie": "Cómo se posiciona ante la creencia dominante",
  "personalFear": "Miedo íntimo diferente del colectivo",
  "background": "Trasfondo anclado al mundo (150-300 palabras)",
  "goals": ["Objetivo 1", "Objetivo 2", "Objetivo 3"],
  "factionAffiliation": "Facción del mundo o marginalidad"
}}

Castellano neutro. Sin metacomentarios.`,
  ],
  [
    "human",
    "Premisa del personaje:\n{prompt}\n\nGenera el personaje en formato JSON.",
  ],
]);
```

- [ ] **Step 2: Update generateCharacterStructured() return mapping**

```typescript
async generateCharacterStructured(
  prompt: string,
  worldContext: string,
  existingCharacters: string,
): Promise<CharacterStructuredResult> {
  const chain = this.structuredPrompt.pipe(this.jsonLlm).pipe(new StringOutputParser());
  const raw = await chain.invoke({
    prompt,
    worldContext,
    existingCharacters: existingCharacters || "No hay personajes previos en este mundo.",
  });

  const parsed = parseJsonFromLLM<Record<string, unknown>>(raw);

  return {
    name: String(parsed.name ?? ""),
    role: String(parsed.role ?? ""),
    socialPosition: String(parsed.socialPosition ?? ""),
    personality: String(parsed.personality ?? ""),
    internalContradiction: String(parsed.internalContradiction ?? ""),
    relationToCollectiveLie: String(parsed.relationToCollectiveLie ?? ""),
    personalFear: String(parsed.personalFear ?? ""),
    background: String(parsed.background ?? ""),
    goals: Array.isArray(parsed.goals) ? parsed.goals.map(String) : [],
    factionAffiliation: String(parsed.factionAffiliation ?? ""),
  };
}
```

- [ ] **Step 3: Also update the markdown prompt (lines 12-45) with derivation rules**

Apply the same derivation philosophy to the unstructured prompt. Replace the instructions section to match: require world-derived role, contradictions, faction references, etc.

- [ ] **Step 4: Lower temperature from 0.8 to 0.65 for more reasoning**

```typescript
private readonly llm = createOllama(0.65, 2048);
private readonly jsonLlm = createOllama(0.65, 2048, "json");
```

- [ ] **Step 5: Build and verify**

Run: `cd storyteller-generator-v2 && npm run build`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
cd storyteller-generator-v2
git add src/internal/context/character_generator/infra/OllamaCharacterContentGenerator.ts
git commit -m "feat(character): rewrite prompts with world-derivation rules"
```

---

### Task 4: Update CharacterContentGenerator domain interface

**Files:**
- Modify: `storyteller-generator-v2/src/internal/context/character_generator/domain/CharacterContentGenerator.ts`

- [ ] **Step 1: Verify interface still matches**

The interface uses `CharacterStructuredResult` as return type — since we updated that type, the interface auto-updates. Verify it compiles.

- [ ] **Step 2: Full build + test**

Run: `cd storyteller-generator-v2 && npm run build && npm test`
Expected: Build PASS. Tests may need updating if they mock CharacterStructuredResult.

- [ ] **Step 3: Fix any test failures**

Check `storyteller-generator-v2/tests/` for character-related test files. Update mocked return values to include the new fields.

- [ ] **Step 4: Commit**

```bash
cd storyteller-generator-v2
git add -A
git commit -m "feat(character): update domain interface and fix tests"
```

---

## Chunk 2: Go Backend — New Fields in Domain, DTO, DB

### Task 5: Add new columns to PostgreSQL schema

**Files:**
- Modify: `storytellerMVP/docker/postgres/init.sql:36-52`

- [ ] **Step 1: Add new columns to characters table**

After the existing `state JSONB` line, the table definition should include:

```sql
CREATE TABLE characters (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  personality TEXT,
  background TEXT,
  goals TEXT[],
  world_id INTEGER NOT NULL
    REFERENCES worlds(id)
    ON DELETE CASCADE,
  owner_id INTEGER NOT NULL
    REFERENCES users(id)
    ON DELETE CASCADE,
  state JSONB,
  -- New derivation fields
  premise TEXT,
  social_position TEXT,
  internal_contradiction TEXT,
  relation_to_collective_lie TEXT,
  personal_fear TEXT,
  faction_affiliation TEXT,
  CONSTRAINT unique_character_name_per_world
    UNIQUE (world_id, name)
);
```

- [ ] **Step 2: Commit**

```bash
cd storytellerMVP
git add docker/postgres/init.sql
git commit -m "feat(character): add derivation columns to characters schema"
```

---

### Task 6: Update Go domain model

**Files:**
- Modify: `storytellerMVP/internal/character/domain/model.go:12-22`

- [ ] **Step 1: Add new fields to Character struct**

```go
type Character struct {
	ID                      int               `json:"id,omitempty"`
	Name                    string            `json:"name"`
	Role                    string            `json:"role"`
	Personality             string            `json:"personality"`
	Background              string            `json:"background"`
	Goals                   []string          `json:"goals"`
	WorldID                 int               `json:"world_id"`
	State                   map[string]string `json:"state"`
	OwnerId                 int               `json:"owner_id,omitempty"`
	Premise                 string            `json:"premise"`
	SocialPosition          string            `json:"social_position"`
	InternalContradiction   string            `json:"internal_contradiction"`
	RelationToCollectiveLie string            `json:"relation_to_collective_lie"`
	PersonalFear            string            `json:"personal_fear"`
	FactionAffiliation      string            `json:"faction_affiliation"`
}
```

- [ ] **Step 2: Update NewCharacter constructor**

```go
func NewCharacter(name, role, personality, background string, goals []string, worldID int, ownerId int) *Character {
	return &Character{
		Name:        name,
		Role:        role,
		Personality: personality,
		Background:  background,
		Goals:       goals,
		WorldID:     worldID,
		State:       make(map[string]string),
		OwnerId:     ownerId,
	}
}
```

Keep the constructor with existing params for backward compat. New fields are set after construction.

- [ ] **Step 3: Verify compilation**

Run: `cd storytellerMVP && go build ./...`
Expected: Errors in infra/pg_repo.go (SQL queries need updating) — expected, we fix that next.

- [ ] **Step 4: Commit**

```bash
cd storytellerMVP
git add internal/character/domain/model.go
git commit -m "feat(character): add derivation fields to domain model"
```

---

### Task 7: Update DTOs

**Files:**
- Modify: `storytellerMVP/internal/api/dto/character.go`

- [ ] **Step 1: Add new fields to CharacterInput, CharacterOutput**

```go
type CharacterInput struct {
	Name                    string            `json:"name"`
	Role                    string            `json:"role"`
	Personality             string            `json:"personality"`
	Background              string            `json:"background"`
	Goals                   []string          `json:"goals"`
	WorldID                 int               `json:"world_id"`
	State                   map[string]string `json:"state"`
	Premise                 string            `json:"premise"`
	SocialPosition          string            `json:"social_position"`
	InternalContradiction   string            `json:"internal_contradiction"`
	RelationToCollectiveLie string            `json:"relation_to_collective_lie"`
	PersonalFear            string            `json:"personal_fear"`
	FactionAffiliation      string            `json:"faction_affiliation"`
}

type CharacterOutput struct {
	ID                      int               `json:"id"`
	Name                    string            `json:"name"`
	Role                    string            `json:"role"`
	Personality             string            `json:"personality"`
	Background              string            `json:"background"`
	Goals                   []string          `json:"goals"`
	WorldID                 int               `json:"world_id"`
	State                   map[string]string `json:"state"`
	Premise                 string            `json:"premise"`
	SocialPosition          string            `json:"social_position"`
	InternalContradiction   string            `json:"internal_contradiction"`
	RelationToCollectiveLie string            `json:"relation_to_collective_lie"`
	PersonalFear            string            `json:"personal_fear"`
	FactionAffiliation      string            `json:"faction_affiliation"`
}
```

- [ ] **Step 2: Commit**

```bash
cd storytellerMVP
git add internal/api/dto/character.go
git commit -m "feat(character): add derivation fields to DTOs"
```

---

### Task 8: Update PostgreSQL repository (pg_repo.go)

**Files:**
- Modify: `storytellerMVP/internal/character/infra/pg_repo.go`

- [ ] **Step 1: Update Create() INSERT query**

Add the 6 new columns to the INSERT statement and the `$N` placeholders. Add the new field values to the query args.

- [ ] **Step 2: Update GetByID() SELECT query and Scan()**

Add the 6 new columns to the SELECT column list. Add corresponding `&c.Premise`, `&c.SocialPosition`, etc. to the `Scan()` call. Use `sql.NullString` for nullable columns.

- [ ] **Step 3: Update GetByWorldID() SELECT and Scan()**

Same pattern as GetByID — add columns and scan targets.

- [ ] **Step 4: Update GetBySceneID() SELECT and Scan()**

Same pattern.

- [ ] **Step 5: Verify compilation**

Run: `cd storytellerMVP && go build ./...`
Expected: PASS (or errors in mappings — fix in next task)

- [ ] **Step 6: Commit**

```bash
cd storytellerMVP
git add internal/character/infra/pg_repo.go
git commit -m "feat(character): update pg_repo queries for derivation fields"
```

---

### Task 9: Update mappings and service

**Files:**
- Modify: `storytellerMVP/internal/mappings/character.go`
- Modify: `storytellerMVP/internal/character/app/service.go` (QueueGeneration result mapping)

- [ ] **Step 1: Update CharacterToOutputDTO mapping**

Add the 6 new fields to the mapping function.

- [ ] **Step 2: Update QueueGeneration() result unpacking**

Where the service receives `CharacterStructuredResult` from RabbitMQ and converts to domain.Character — add the new fields.

- [ ] **Step 3: Update Create() in service if needed**

If the service sets fields from the DTO input, ensure new fields are mapped.

- [ ] **Step 4: Full build + test**

Run: `cd storytellerMVP && go build ./... && make test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd storytellerMVP
git add internal/mappings/character.go internal/character/app/service.go
git commit -m "feat(character): update mappings and service for derivation fields"
```

---

## Chunk 3: Frontend — New Character Creation Flow

### Task 10: Update Character type in api.ts

**Files:**
- Modify: `storytellerFrontMVP/src/services/api.ts:100-109`

- [ ] **Step 1: Extend Character interface**

```typescript
export interface Character {
  id: number
  name: string
  role: string
  personality: string
  background: string
  goals: string[]
  world_id: number
  state: Record<string, string>
  premise: string
  social_position: string
  internal_contradiction: string
  relation_to_collective_lie: string
  personal_fear: string
  faction_affiliation: string
}
```

- [ ] **Step 2: Verify build**

Run: `cd storytellerFrontMVP && npm run build`
Expected: Errors in pages that use Character — fix in subsequent tasks.

- [ ] **Step 3: Commit**

```bash
cd storytellerFrontMVP
git add src/services/api.ts
git commit -m "feat(character): extend Character type with derivation fields"
```

---

### Task 11: Create WorldContextPanel component

**Files:**
- Create: `storytellerFrontMVP/src/components/character-creation/WorldContextPanel.tsx`

- [ ] **Step 1: Create the component**

A collapsible panel showing the parent world's key fields (coreAxis, tensions, factions, tone) as context for character creation. Uses shadcn Collapsible, Badge, and the world entity color scheme. Fetches world data from the API using the worldId from URL params, or receives it as prop.

- [ ] **Step 2: Verify it renders**

Import in a test page or storybook. Verify it collapses/expands and shows world data correctly.

- [ ] **Step 3: Commit**

```bash
cd storytellerFrontMVP
git add src/components/character-creation/WorldContextPanel.tsx
git commit -m "feat(character): add WorldContextPanel component"
```

---

### Task 12: Create new CreateCharacterPage with derivation flow

**Files:**
- Create: `storytellerFrontMVP/src/pages/characters/CreateCharacterPage.sanderson.tsx`

- [ ] **Step 1: Build the page structure**

The page has 4 phases: `premise` → `generating` → `reviewing` → `saving`.

Phase 1 (premise): WorldContextPanel (collapsed) + name input + premise textarea with rotating placeholder examples + "Derivar personaje" button.

Phase 2 (generating): AIGeneratingIndicator (reuse from world-creation).

Phase 3 (reviewing): 4 DerivationLayers in cascade (reuse from world-creation with character metadata — amber/rose/blue/emerald). Each layer shows the AI-generated content as a SuggestionChip that can be accepted, rejected, or edited. Layers: Rol & Posición, Temperamento, Historia, Voluntad.

Phase 4 (saving): Button "Guardar personaje" that calls createCharacter with all accepted fields.

The AI generation calls `generateCharacter(worldId, premise)` — the existing endpoint. The backend already routes this to the generator v2 which now produces the enriched result.

- [ ] **Step 2: Wire up the API call**

On "Derivar personaje" click, call `generateCharacter(worldId, premise)`. The response now contains all 10 fields. Map them to the 4 display layers:
- Rol & Posición: `role` + `socialPosition` + `factionAffiliation`
- Temperamento: `personality` + `internalContradiction` + `relationToCollectiveLie`
- Historia: `background` + `personalFear`
- Voluntad: `goals`

- [ ] **Step 3: Handle accept/edit/save flow**

User reviews each layer's content. On save, call `createCharacter()` with all fields including the new ones. The `premise` field is sent as-is from the user's input.

- [ ] **Step 4: Build and verify**

Run: `cd storytellerFrontMVP && npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd storytellerFrontMVP
git add src/pages/characters/CreateCharacterPage.sanderson.tsx
git commit -m "feat(character): add derivation-based character creation page"
```

---

### Task 13: Update routing to use new page

**Files:**
- Modify: `storytellerFrontMVP/src/App.tsx`

- [ ] **Step 1: Replace CreateCharacterPage import**

Change the import to use the new `.sanderson` page. Keep the old file as backup.

- [ ] **Step 2: Verify navigation works**

Run: `cd storytellerFrontMVP && npm run dev`
Navigate to `/worlds/:id/characters/create` and verify the new flow loads.

- [ ] **Step 3: Commit**

```bash
cd storytellerFrontMVP
git add src/App.tsx
git commit -m "feat(character): switch routing to derivation-based creation"
```

---

### Task 14: Update CharacterDetailPage to show new fields

**Files:**
- Modify: `storytellerFrontMVP/src/pages/characters/CharacterDetailPage.tsx`

- [ ] **Step 1: Display new derivation fields**

Add sections for: premise (as hero quote), social position, internal contradiction, relation to collective lie, personal fear, faction affiliation. Use the existing card/badge pattern but with character entity color (amber/orange).

- [ ] **Step 2: Verify rendering**

Run dev server, navigate to a character detail page. New fields should render when present, and old characters (without new fields) should still render without errors.

- [ ] **Step 3: Commit**

```bash
cd storytellerFrontMVP
git add src/pages/characters/CharacterDetailPage.tsx
git commit -m "feat(character): display derivation fields in detail page"
```

---

### Task 15: Update EditCharacterPage for new fields

**Files:**
- Modify: `storytellerFrontMVP/src/pages/characters/EditCharacterPage.tsx`

- [ ] **Step 1: Replace pills with text inputs for new fields**

Remove ROLE_VALUES and PERSONALITY_VALUES pill selectors. Replace with:
- Premise: textarea (read-only or editable)
- Role: text input (free text, not pills)
- Social Position: text input
- Personality: textarea
- Internal Contradiction: textarea
- Relation to Collective Lie: text input
- Personal Fear: text input
- Background: textarea (keep existing)
- Goals: dynamic list (keep existing)
- Faction Affiliation: text input

- [ ] **Step 2: Verify build**

Run: `cd storytellerFrontMVP && npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
cd storytellerFrontMVP
git add src/pages/characters/EditCharacterPage.tsx
git commit -m "feat(character): update edit page for derivation fields"
```

---

### Task 16: Update i18n translation keys

**Files:**
- Modify: `storytellerFrontMVP/src/i18n/locales/es.json`
- Modify: `storytellerFrontMVP/src/i18n/locales/en.json`

- [ ] **Step 1: Add new translation keys**

Add keys for all new fields: `character.create.premiseLabel`, `character.create.premisePlaceholder`, `character.create.socialPositionLabel`, `character.create.internalContradictionLabel`, `character.create.relationToCollectiveLieLabel`, `character.create.personalFearLabel`, `character.create.factionAffiliationLabel`, `character.create.deriveButton`, plus detail page labels.

Remove old role/personality pill translation keys (or keep for backward compat).

- [ ] **Step 2: Commit**

```bash
cd storytellerFrontMVP
git add src/i18n/locales/
git commit -m "feat(character): add i18n keys for derivation fields"
```

---

### Task 17: Recreate database and end-to-end verification

- [ ] **Step 1: Recreate database**

Run: `cd storytellerMVP && make db-recreate`
Expected: DB recreated with new columns.

- [ ] **Step 2: Start all services**

```bash
# Terminal 1: Backend
cd storytellerMVP && go run ./cmd/server

# Terminal 2: Generator
cd storyteller-generator-v2 && npm run start

# Terminal 3: Frontend
cd storytellerFrontMVP && npm run dev
```

- [ ] **Step 3: End-to-end test**

1. Create a world using the Sanderson flow (core axis + derive)
2. Navigate to the world detail page
3. Click "Create Character"
4. Enter a dramatic premise
5. Click "Derivar personaje"
6. Verify: AI returns enriched character with all 10 fields
7. Accept/edit the suggestions
8. Save the character
9. Verify: Character detail page shows all new fields

- [ ] **Step 4: Verify backward compatibility**

Navigate to an existing character (created before the redesign). Verify it still renders correctly with empty new fields.

- [ ] **Step 5: Final commit**

```bash
# In each repo, verify clean state
cd storytellerMVP && git status
cd storyteller-generator-v2 && git status
cd storytellerFrontMVP && git status
```
