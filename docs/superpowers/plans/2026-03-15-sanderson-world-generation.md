# Sanderson World Generation — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the old World model (era/climate/politics/culture/factions/description) with the Sanderson method (coreAxis → 5 derived layers: environment, subsistence, organization, tensions, tone) across all 3 repos.

**Architecture:** The change flows through 3 services: (1) storyteller-generator-v2 gets a new `world_derive` generation type with a Sanderson-specific LLM prompt that derives 5 layers from a core axis, (2) storytellerMVP backend extends the World model with 6 new fields, adds a new `POST /world/derive` endpoint, and updates all SQL/DTOs/service code, (3) storytellerFrontMVP wires the existing `.sanderson.tsx` components to real API calls and swaps them into the active routes.

**Tech Stack:** Go (backend), TypeScript/LangChain/Ollama (generator), React/TypeScript/Vite (frontend)

---

## File Structure

### storyteller-generator-v2 (TypeScript)
| Action | File | Purpose |
|--------|------|---------|
| Modify | `src/consumer/core/models/generation.ts` | Add `WorldDerive` to GenerationType enum |
| Modify | `src/consumer/core/models/payloads.ts` | Add `WorldDerivePayload` and `WorldDeriveResult` types |
| Modify | `src/internal/context/world_generator/infra/OllamaWorldContentGenerator.ts` | Add `generateWorldDerive()` method with Sanderson prompt |
| Modify | `src/internal/context/world_generator/domain/WorldContentGenerator.ts` | Add `generateWorldDerive` to interface |
| Modify | `src/consumer/core/services/generation.ts` | Add `handleWorldDerive` handler |
| Modify | `src/consumer/dispatcher.ts` | Register `WorldDerive` route |
| Modify | `src/consumer/core/models/payloads.ts` | Update `WorldContext` with Sanderson fields for downstream generators |
| Modify | `src/internal/context/shared/context_builder.ts` | Update `formatWorld()` to use Sanderson fields |

### storytellerMVP (Go)
| Action | File | Purpose |
|--------|------|---------|
| Modify | `docker/postgres/init.sql` | Add 6 columns to worlds table |
| Modify | `internal/world/domain/model.go` | Add 6 fields to World struct, update NewWorld |
| Modify | `internal/api/dto/world.go` | Add fields to WorldInput, WorldOutput; add WorldDerivePrompt DTO |
| Modify | `internal/api/dto/validation.go` | Add WorldDerivePrompt.Validate() |
| Modify | `internal/world/infra/pg_repo.go` | Update all SQL INSERT/SELECT/Scan calls |
| Modify | `internal/world/app/service.go` | Add QueueDerivation method |
| Modify | `internal/api/handlers/world.go` | Add HandleWorldDerive handler |
| Modify | `internal/api/routes.go` | Register `/world/derive` route |
| Modify | `internal/generation/domain/model.go` | Add GenerationTypeWorldDerive constant |
| Modify | `internal/generation/domain/payloads.go` | Add WorldDeriveResult, update WorldContext |
| Modify | `internal/mappings/world.go` | Update WorldToOutputDTO with new fields |

### storytellerFrontMVP (React)
| Action | File | Purpose |
|--------|------|---------|
| Modify | `src/services/api.ts` | Update World type, add deriveWorld() function |
| Modify | `src/pages/home/CreateWorldPage.sanderson.tsx` | Wire to real API, add i18n |
| Modify | `src/App.tsx` | Swap route to Sanderson CreateWorldPage |
| Modify | `src/pages/home/WorldDetailPage.tsx` | Add Sanderson layer rendering for new fields |
| Modify | `src/components/WorldCard.tsx` | Add layer dots for Sanderson worlds |
| Modify | `src/i18n/locales/es.json` | Add Sanderson UI strings |
| Modify | `src/i18n/locales/en.json` | Add Sanderson UI strings |

---

## Chunk 1: Generator — New WorldDerive Generation Type

### Task 1: Add WorldDerive type and payload contracts

**Files:**
- Modify: `storyteller-generator-v2/src/consumer/core/models/generation.ts`
- Modify: `storyteller-generator-v2/src/consumer/core/models/payloads.ts`

- [ ] **Step 1: Add WorldDerive to GenerationType enum**

In `src/consumer/core/models/generation.ts`, add:
```typescript
export enum GenerationType {
  Scene = 'scene',
  Character = 'character',
  Event = 'event',
  World = 'world',
  WorldPrompt = 'world_prompt',
  WorldDerive = 'world_derive',
  Narrative = 'narrative',
}
```

- [ ] **Step 2: Add WorldDerivePayload and WorldDeriveResult to payloads.ts**

In `src/consumer/core/models/payloads.ts`, add after `WorldPromptPayload`:
```typescript
export interface WorldDerivePayload {
  coreAxis: string;
}

export interface WorldDeriveResult {
  name: string;
  coreAxis: string;
  environment: string;
  subsistence: string;
  organization: string;
  tensions: string;
  tone: string;
  factions: string[];
  description: string;
}
```

- [ ] **Step 3: Update WorldContext with Sanderson fields**

Replace the existing `WorldContext` in `src/consumer/core/models/payloads.ts`:
```typescript
export interface WorldContext {
  name: string;
  era: string;
  climate: string;
  politics: string;
  culture: string;
  factions: string[];
  description: string;
  // Sanderson fields (populated for new worlds, empty for legacy)
  coreAxis?: string;
  environment?: string;
  subsistence?: string;
  organization?: string;
  tensions?: string;
  tone?: string;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/consumer/core/models/generation.ts src/consumer/core/models/payloads.ts
git commit -m "feat: add WorldDerive generation type and payload contracts"
```

### Task 2: Sanderson LLM prompt in OllamaWorldContentGenerator

**Files:**
- Modify: `storyteller-generator-v2/src/internal/context/world_generator/domain/WorldContentGenerator.ts`
- Modify: `storyteller-generator-v2/src/internal/context/world_generator/infra/OllamaWorldContentGenerator.ts`

- [ ] **Step 1: Add generateWorldDerive to interface**

In `src/internal/context/world_generator/domain/WorldContentGenerator.ts`, add:
```typescript
import type { WorldDeriveResult } from '../../../../consumer/core/models/payloads.js';

export interface WorldContentGenerator {
  generateWorld(description: string): Promise<string>;
  generateWorldStructured(description: string): Promise<WorldStructuredResult>;
  generateWorldDerive(coreAxis: string): Promise<WorldDeriveResult>;
  readonly modelId: string;
}
```

- [ ] **Step 2: Add Sanderson derivation prompt and method to OllamaWorldContentGenerator**

In `OllamaWorldContentGenerator.ts`, add after the `structuredPrompt`:

```typescript
private readonly derivePrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `Eres un arquitecto de mundos narrativos que utiliza el método Sanderson de worldbuilding.

Tu trabajo: a partir de un EJE CENTRAL (la premisa fundamental de un mundo), derivar 5 CAPAS que construyan un mundo coherente, rico y con potencial narrativo.

Las 5 capas son:
1. **Entorno**: El paisaje, clima, geografía y condiciones físicas del mundo. Cómo se ve, huele y siente este lugar.
2. **Subsistencia**: Cómo sobreviven las sociedades. Agricultura, recursos, economía, tecnología de supervivencia.
3. **Organización**: Estructura política y social. Quién gobierna, cómo se organizan las comunidades, jerarquías.
4. **Tensiones**: Los conflictos centrales. Qué fuerzas chocan, qué está en juego, qué amenaza el equilibrio.
5. **Tono narrativo**: La atmósfera emocional de las historias en este mundo. El registro literario, el sentimiento dominante.

REGLAS:
- Cada capa DEBE derivarse lógicamente del eje central. No inventes elementos desconectados.
- Las capas deben interconectarse: el entorno afecta la subsistencia, la subsistencia moldea la organización, la organización genera tensiones, y todo culmina en el tono.
- Sé específico y evocador, no genérico. "Ciudades-búnker con cúpulas de filtrado" es mejor que "ciudades protegidas".
- Cada capa: 2-4 frases ricas en detalle narrativo (80-150 palabras).
- El nombre debe ser evocador y original (no genérico como "Mundo de la lluvia").
- Facciones: 3-5 grupos que emerjan naturalmente de las tensiones y la organización.
- Descripción: resumen narrativo del mundo completo (150-250 palabras).
- Castellano neutro. Sin metacomentarios. Sin agradecimientos.

IMPORTANTE: Tu respuesta DEBE ser ÚNICAMENTE un objeto JSON válido, sin texto adicional.
El JSON debe tener exactamente esta estructura:
{{
  "name": "Nombre evocador del mundo",
  "coreAxis": "El eje central tal como lo proporcionó el usuario (copiado textual)",
  "environment": "Descripción del entorno físico...",
  "subsistence": "Cómo sobreviven las sociedades...",
  "organization": "Estructura política y social...",
  "tensions": "Conflictos centrales...",
  "tone": "Atmósfera emocional y registro narrativo...",
  "factions": ["Facción 1", "Facción 2", "Facción 3"],
  "description": "Resumen narrativo completo del mundo..."
}}`
  ],
  [
    "human",
    "Eje central del mundo:\n{coreAxis}\n\nDeriva las 5 capas en formato JSON.",
  ],
]);
```

Then add the method:
```typescript
async generateWorldDerive(coreAxis: string): Promise<WorldDeriveResult> {
  const chain = this.derivePrompt.pipe(this.jsonLlm).pipe(new StringOutputParser());
  const raw = await chain.invoke({ coreAxis });

  const parsed = parseJsonFromLLM<Record<string, unknown>>(raw);

  return {
    name: String(parsed.name ?? ""),
    coreAxis: String(parsed.coreAxis ?? coreAxis),
    environment: String(parsed.environment ?? ""),
    subsistence: String(parsed.subsistence ?? ""),
    organization: String(parsed.organization ?? ""),
    tensions: String(parsed.tensions ?? ""),
    tone: String(parsed.tone ?? ""),
    factions: Array.isArray(parsed.factions)
      ? parsed.factions.map(String)
      : [],
    description: String(parsed.description ?? ""),
  };
}
```

Make sure to add the import at the top:
```typescript
import type { WorldStructuredResult, WorldDeriveResult } from "../../../../consumer/core/models/payloads.js";
```

- [ ] **Step 3: Commit**

```bash
git add src/internal/context/world_generator/domain/WorldContentGenerator.ts src/internal/context/world_generator/infra/OllamaWorldContentGenerator.ts
git commit -m "feat: add Sanderson derivation prompt and generateWorldDerive method"
```

### Task 3: Wire handler and dispatcher

**Files:**
- Modify: `storyteller-generator-v2/src/consumer/core/services/generation.ts`
- Modify: `storyteller-generator-v2/src/consumer/dispatcher.ts`

- [ ] **Step 1: Add handleWorldDerive handler**

In `src/consumer/core/services/generation.ts`, add import for `WorldDerivePayload`:
```typescript
import type { CharacterPayload, ScenePayload, EventPayload, NarrativePayload, WorldPromptPayload, WorldDerivePayload } from '../models/payloads.js';
```

Add the handler after `handleWorldPrompt`:
```typescript
export const handleWorldDerive: GenerationHandler = async (req) => {
  const payload = req.payload as WorldDerivePayload;
  const coreAxis = String(payload?.coreAxis ?? '').trim();
  if (!coreAxis) {
    throw new Error('payload.coreAxis is required');
  }
  const result = await worldContentGenerator.generateWorldDerive(coreAxis);
  return { type: GenerationType.WorldDerive, result };
};
```

- [ ] **Step 2: Register in dispatcher**

In `src/consumer/dispatcher.ts`, update imports:
```typescript
import { handleScene, handleCharacter, handleEvent, handleWorld, handleWorldPrompt, handleWorldDerive, handleNarrative, GenerationHandler } from './core/services/generation.js';
```

Add to routes:
```typescript
const routes: Record<GenerationType, GenerationHandler> = {
  [GenerationType.Scene]: handleScene,
  [GenerationType.Character]: handleCharacter,
  [GenerationType.Event]: handleEvent,
  [GenerationType.World]: handleWorld,
  [GenerationType.WorldPrompt]: handleWorldPrompt,
  [GenerationType.WorldDerive]: handleWorldDerive,
  [GenerationType.Narrative]: handleNarrative,
};
```

- [ ] **Step 3: Commit**

```bash
git add src/consumer/core/services/generation.ts src/consumer/dispatcher.ts
git commit -m "feat: wire WorldDerive handler into dispatcher"
```

### Task 4: Update ContextBuilder for Sanderson worlds

**Files:**
- Modify: `storyteller-generator-v2/src/internal/context/shared/context_builder.ts`

- [ ] **Step 1: Update formatWorld to handle both models**

In `context_builder.ts`, update `formatWorld()` to detect Sanderson fields and format accordingly:

```typescript
static formatWorld(world: WorldContext): string {
  let lines = [`## Mundo: ${world.name}\n`];

  // Sanderson model (has coreAxis)
  if (world.coreAxis) {
    lines.push(`**Eje central:** ${world.coreAxis}`);
    if (world.environment) lines.push(`**Entorno:** ${world.environment}`);
    if (world.subsistence) lines.push(`**Subsistencia:** ${world.subsistence}`);
    if (world.organization) lines.push(`**Organización:** ${world.organization}`);
    if (world.tensions) lines.push(`**Tensiones:** ${world.tensions}`);
    if (world.tone) lines.push(`**Tono narrativo:** ${world.tone}`);
  } else {
    // Legacy model
    lines.push(`**Era:** ${world.era}`);
    lines.push(`**Clima:** ${world.climate}`);
    lines.push(`**Política:** ${world.politics}`);
    lines.push(`**Cultura:** ${world.culture}`);
  }

  if (world.factions?.length) {
    lines.push(`**Facciones:** ${world.factions.join(', ')}`);
  }
  if (world.description) {
    lines.push(`\n${world.description}`);
  }

  return lines.join('\n');
}
```

- [ ] **Step 2: Commit**

```bash
git add src/internal/context/shared/context_builder.ts
git commit -m "feat: update ContextBuilder.formatWorld to support Sanderson model"
```

---

## Chunk 2: Backend — Extend World Model and Add Derive Endpoint

### Task 5: Database schema — add Sanderson columns

**Files:**
- Modify: `storytellerMVP/docker/postgres/init.sql`

- [ ] **Step 1: Add 6 new columns to worlds table**

In `docker/postgres/init.sql`, update the worlds table:
```sql
CREATE TABLE worlds (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  era TEXT,
  climate TEXT,
  politics TEXT,
  culture TEXT,
  description TEXT,
  factions TEXT[],
  owner_id INTEGER NOT NULL
    REFERENCES users(id)
    ON DELETE CASCADE,
  core_axis TEXT,
  environment TEXT,
  subsistence TEXT,
  organization TEXT,
  tensions TEXT,
  tone TEXT
);
```

- [ ] **Step 2: Commit**

```bash
git add docker/postgres/init.sql
git commit -m "feat: add Sanderson columns to worlds table schema"
```

### Task 6: Domain model — add Sanderson fields

**Files:**
- Modify: `storytellerMVP/internal/world/domain/model.go`

- [ ] **Step 1: Add 6 fields to World struct and update NewWorld**

```go
type World struct {
	ID           int      `json:"id,omitempty"`
	Name         string   `json:"name"`
	Era          string   `json:"era"`
	Climate      string   `json:"climate"`
	Politics     string   `json:"politics"`
	Culture      string   `json:"culture"`
	Factions     []string `json:"factions"`
	OwnerId      int      `json:"owner_id,omitempty"`
	Description  string   `json:"description"`
	CoreAxis     string   `json:"core_axis,omitempty"`
	Environment  string   `json:"environment,omitempty"`
	Subsistence  string   `json:"subsistence,omitempty"`
	Organization string   `json:"organization,omitempty"`
	Tensions     string   `json:"tensions,omitempty"`
	Tone         string   `json:"tone,omitempty"`
}
```

Update `NewWorld` to accept Sanderson fields:
```go
func NewWorld(name, era, climate, politics, culture string, factions []string, description string, ownerId int) World {
	return World{
		Description: description,
		Name:        name,
		Era:         era,
		Climate:     climate,
		Politics:    politics,
		Culture:     culture,
		Factions:    factions,
		OwnerId:     ownerId,
	}
}

func NewSandersonWorld(name, coreAxis, environment, subsistence, organization, tensions, tone, description string, factions []string, ownerId int) World {
	return World{
		Name:         name,
		CoreAxis:     coreAxis,
		Environment:  environment,
		Subsistence:  subsistence,
		Organization: organization,
		Tensions:     tensions,
		Tone:         tone,
		Description:  description,
		Factions:     factions,
		OwnerId:      ownerId,
	}
}
```

- [ ] **Step 2: Commit**

```bash
git add internal/world/domain/model.go
git commit -m "feat: add Sanderson fields to World domain model"
```

### Task 7: DTOs — add Sanderson fields and WorldDerivePrompt

**Files:**
- Modify: `storytellerMVP/internal/api/dto/world.go`
- Modify: `storytellerMVP/internal/api/dto/validation.go`

- [ ] **Step 1: Update DTOs in world.go**

```go
package dto

type WorldInput struct {
	Name         string   `json:"name"`
	Era          string   `json:"era"`
	Climate      string   `json:"climate"`
	Politics     string   `json:"politics"`
	Culture      string   `json:"culture"`
	Factions     []string `json:"factions"`
	Description  string   `json:"description"`
	CoreAxis     string   `json:"core_axis,omitempty"`
	Environment  string   `json:"environment,omitempty"`
	Subsistence  string   `json:"subsistence,omitempty"`
	Organization string   `json:"organization,omitempty"`
	Tensions     string   `json:"tensions,omitempty"`
	Tone         string   `json:"tone,omitempty"`
}

type WorldPrompt struct {
	Description string `json:"description"`
}

type WorldDerivePrompt struct {
	CoreAxis string `json:"core_axis"`
}

type WorldOutput struct {
	ID           int      `json:"id"`
	Name         string   `json:"name"`
	Era          string   `json:"era,omitempty"`
	Climate      string   `json:"climate,omitempty"`
	Politics     string   `json:"politics,omitempty"`
	Culture      string   `json:"culture,omitempty"`
	Factions     []string `json:"factions"`
	Description  string   `json:"description"`
	CoreAxis     string   `json:"core_axis,omitempty"`
	Environment  string   `json:"environment,omitempty"`
	Subsistence  string   `json:"subsistence,omitempty"`
	Organization string   `json:"organization,omitempty"`
	Tensions     string   `json:"tensions,omitempty"`
	Tone         string   `json:"tone,omitempty"`
}
```

- [ ] **Step 2: Add validation for WorldDerivePrompt**

In `validation.go`, add:
```go
func (w WorldDerivePrompt) Validate() error {
	if err := required(w.CoreAxis, "core_axis"); err != nil {
		return err
	}
	return maxLen(w.CoreAxis, "core_axis", 2000)
}
```

- [ ] **Step 3: Commit**

```bash
git add internal/api/dto/world.go internal/api/dto/validation.go
git commit -m "feat: add Sanderson DTOs and validation"
```

### Task 8: Repository — update SQL queries

**Files:**
- Modify: `storytellerMVP/internal/world/infra/pg_repo.go`

- [ ] **Step 1: Update Create to include Sanderson columns**

```go
func (r *PgRepo) Create(w *domain.World) (int, error) {
	var id int
	err := r.DB.QueryRow(`
		INSERT INTO worlds (name, era, climate, politics, culture, owner_id, factions, description,
		                     core_axis, environment, subsistence, organization, tensions, tone)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
		RETURNING id
	`, w.Name, w.Era, w.Climate, w.Politics, w.Culture, w.OwnerId, pq.Array(w.Factions), w.Description,
		w.CoreAxis, w.Environment, w.Subsistence, w.Organization, w.Tensions, w.Tone).Scan(&id)
	return id, err
}
```

- [ ] **Step 2: Update GetByID to scan Sanderson columns**

```go
func (r *PgRepo) GetByID(id int) (domain.World, error) {
	row := r.DB.QueryRow(`
		SELECT id, name, era, climate, politics, culture, factions, owner_id, description,
		       COALESCE(core_axis, ''), COALESCE(environment, ''), COALESCE(subsistence, ''),
		       COALESCE(organization, ''), COALESCE(tensions, ''), COALESCE(tone, '')
		FROM worlds WHERE id = $1
	`, id)

	var w domain.World
	err := row.Scan(&w.ID, &w.Name, &w.Era, &w.Climate, &w.Politics, &w.Culture,
		pq.Array(&w.Factions), &w.OwnerId, &w.Description,
		&w.CoreAxis, &w.Environment, &w.Subsistence, &w.Organization, &w.Tensions, &w.Tone)
	if err != nil {
		return domain.World{}, err
	}
	return w, nil
}
```

- [ ] **Step 3: Update GetWorldsByOwnerId with same pattern**

```go
func (r *PgRepo) GetWorldsByOwnerId(ownerID int) ([]domain.World, error) {
	rows, err := r.DB.Query(`
		SELECT id, name, era, climate, politics, culture, factions, owner_id, description,
		       COALESCE(core_axis, ''), COALESCE(environment, ''), COALESCE(subsistence, ''),
		       COALESCE(organization, ''), COALESCE(tensions, ''), COALESCE(tone, '')
		FROM worlds WHERE owner_id = $1
	`, ownerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var worlds []domain.World
	for rows.Next() {
		var w domain.World
		if err := rows.Scan(&w.ID, &w.Name, &w.Era, &w.Climate, &w.Politics, &w.Culture,
			pq.Array(&w.Factions), &w.OwnerId, &w.Description,
			&w.CoreAxis, &w.Environment, &w.Subsistence, &w.Organization, &w.Tensions, &w.Tone); err != nil {
			return nil, err
		}
		worlds = append(worlds, w)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return worlds, nil
}
```

- [ ] **Step 4: Update GetByNameAndOwner with same pattern**

Same SELECT + Scan pattern as GetByID but with `WHERE name = $1 AND owner_id = $2`.

- [ ] **Step 5: Commit**

```bash
git add internal/world/infra/pg_repo.go
git commit -m "feat: update world repository SQL for Sanderson columns"
```

### Task 9: Generation payloads — add WorldDerive types

**Files:**
- Modify: `storytellerMVP/internal/generation/domain/model.go`
- Modify: `storytellerMVP/internal/generation/domain/payloads.go`

- [ ] **Step 1: Add GenerationTypeWorldDerive constant**

In `model.go`, add:
```go
GenerationTypeWorldDerive GenerationType = "world_derive"
```

- [ ] **Step 2: Add WorldDeriveResult and update WorldContext in payloads.go**

Add after `WorldStructuredResult`:
```go
type WorldDeriveResult struct {
	Name         string   `json:"name"`
	CoreAxis     string   `json:"coreAxis"`
	Environment  string   `json:"environment"`
	Subsistence  string   `json:"subsistence"`
	Organization string   `json:"organization"`
	Tensions     string   `json:"tensions"`
	Tone         string   `json:"tone"`
	Factions     []string `json:"factions"`
	Description  string   `json:"description"`
}
```

Update `WorldContext` to include Sanderson fields:
```go
type WorldContext struct {
	Name         string   `json:"name"`
	Era          string   `json:"era"`
	Climate      string   `json:"climate"`
	Politics     string   `json:"politics"`
	Culture      string   `json:"culture"`
	Factions     []string `json:"factions"`
	Description  string   `json:"description"`
	CoreAxis     string   `json:"coreAxis,omitempty"`
	Environment  string   `json:"environment,omitempty"`
	Subsistence  string   `json:"subsistence,omitempty"`
	Organization string   `json:"organization,omitempty"`
	Tensions     string   `json:"tensions,omitempty"`
	Tone         string   `json:"tone,omitempty"`
}
```

- [ ] **Step 3: Commit**

```bash
git add internal/generation/domain/model.go internal/generation/domain/payloads.go
git commit -m "feat: add WorldDerive generation type and result payload"
```

### Task 10: Service — add QueueDerivation method

**Files:**
- Modify: `storytellerMVP/internal/world/app/service.go`

- [ ] **Step 1: Add QueueDerivation method**

Add after `QueueGeneration`:
```go
func (s *Service) QueueDerivation(ctx context.Context, userID int, input dto.WorldDerivePrompt) (domain.World, error) {
	if s.GenerationService == nil || s.InstallationSvc == nil {
		return domain.World{}, errors.New("generation service not configured")
	}

	inst, err := s.InstallationSvc.GetInstallationByUserID(ctx, userID)
	if err != nil {
		return domain.World{}, fmt.Errorf("get installation: %w", err)
	}

	payload, err := json.Marshal(map[string]string{"coreAxis": input.CoreAxis})
	if err != nil {
		return domain.World{}, fmt.Errorf("marshal payload: %w", err)
	}

	req := &generationdomain.GenerationRequest{
		ID:             uuid.NewString(),
		UserID:         userID,
		GenerationType: generationdomain.GenerationTypeWorldDerive,
		Payload:        payload,
		ChannelID:      inst.ChannelID,
		AccessToken:    inst.AccessToken,
	}

	rawResp, err := s.GenerationService.CreateAndPublish(ctx, req)
	if err != nil {
		return domain.World{}, fmt.Errorf("generation: %w", err)
	}

	var tsResp struct {
		Result generationdomain.WorldDeriveResult `json:"result"`
	}
	if err := json.Unmarshal(rawResp, &tsResp); err != nil {
		return domain.World{}, fmt.Errorf("unmarshal response: %w", err)
	}

	return domain.World{
		Name:         tsResp.Result.Name,
		CoreAxis:     tsResp.Result.CoreAxis,
		Environment:  tsResp.Result.Environment,
		Subsistence:  tsResp.Result.Subsistence,
		Organization: tsResp.Result.Organization,
		Tensions:     tsResp.Result.Tensions,
		Tone:         tsResp.Result.Tone,
		Factions:     tsResp.Result.Factions,
		Description:  tsResp.Result.Description,
	}, nil
}
```

- [ ] **Step 2: Commit**

```bash
git add internal/world/app/service.go
git commit -m "feat: add QueueDerivation service method for Sanderson generation"
```

### Task 11: Handler and route — POST /world/derive

**Files:**
- Modify: `storytellerMVP/internal/api/handlers/world.go`
- Modify: `storytellerMVP/internal/api/routes.go`
- Modify: `storytellerMVP/internal/mappings/world.go`

- [ ] **Step 1: Update WorldService interface**

In `handlers/world.go`, add to the interface:
```go
type WorldService interface {
	Create(ctx context.Context, w dto.WorldInput, ownerId int) (int, error)
	GetByID(id int) (domain.World, error)
	GetWorldsByOwnerId(ownerId int) ([]domain.World, error)
	DeleteByIDAndOwner(ctx context.Context, id int, ownerId int) error
	GetByIDAndOwner(id int, ownerId int) (domain.World, error)
	QueueGeneration(ctx context.Context, userID int, input dto.WorldPrompt) (domain.World, error)
	QueueDerivation(ctx context.Context, userID int, input dto.WorldDerivePrompt) (domain.World, error)
}
```

- [ ] **Step 2: Add HandleWorldDerive handler**

```go
func HandleWorldDerive(service WorldService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Método no permitido", http.StatusMethodNotAllowed)
			return
		}

		var input dto.WorldDerivePrompt
		if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
			http.Error(w, "JSON inválido", http.StatusBadRequest)
			return
		}
		if err := input.Validate(); err != nil {
			httputils.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}

		userID := httputils.GetUserID(r)
		world, err := service.QueueDerivation(r.Context(), userID, input)
		if err != nil {
			httputils.WriteError(w, err)
			return
		}

		output := &dto.WorldOutput{
			Name:         world.Name,
			CoreAxis:     world.CoreAxis,
			Environment:  world.Environment,
			Subsistence:  world.Subsistence,
			Organization: world.Organization,
			Tensions:     world.Tensions,
			Tone:         world.Tone,
			Factions:     world.Factions,
			Description:  world.Description,
		}
		httputils.WriteJSON(w, http.StatusOK, output)
	}
}
```

- [ ] **Step 3: Update HandleWorldCreate to pass Sanderson fields**

In `HandleWorldCreate`, update the output mapping to include new fields:
```go
output := &dto.WorldOutput{
	ID:           id,
	Name:         input.Name,
	Era:          input.Era,
	Climate:      input.Climate,
	Politics:     input.Politics,
	Culture:      input.Culture,
	Factions:     input.Factions,
	Description:  input.Description,
	CoreAxis:     input.CoreAxis,
	Environment:  input.Environment,
	Subsistence:  input.Subsistence,
	Organization: input.Organization,
	Tensions:     input.Tensions,
	Tone:         input.Tone,
}
```

Also update the `Create` method in `service.go` to pass Sanderson fields. In `service.go`, update Create:
```go
func (s *Service) Create(ctx context.Context, worldInput dto.WorldInput, ownerId int) (int, error) {
	var world domain.World
	if worldInput.CoreAxis != "" {
		world = domain.NewSandersonWorld(
			worldInput.Name,
			worldInput.CoreAxis,
			worldInput.Environment,
			worldInput.Subsistence,
			worldInput.Organization,
			worldInput.Tensions,
			worldInput.Tone,
			worldInput.Description,
			worldInput.Factions,
			ownerId,
		)
	} else {
		world = domain.NewWorld(
			worldInput.Name,
			worldInput.Era,
			worldInput.Climate,
			worldInput.Politics,
			worldInput.Culture,
			worldInput.Factions,
			worldInput.Description,
			ownerId,
		)
	}

	exists, err := s.Repo.ExistsByNameAndOwner(world.Name, ownerId)
	if err != nil {
		return 0, err
	}
	if exists {
		return 0, errors.New("ya existe un mundo con ese nombre para este usuario")
	}
	return s.Repo.Create(&world)
}
```

- [ ] **Step 4: Update WorldToOutputDTO in mappings**

```go
func WorldToOutputDTO(w domain.World) dto.WorldOutput {
	return dto.WorldOutput{
		ID:           w.ID,
		Name:         w.Name,
		Era:          w.Era,
		Climate:      w.Climate,
		Politics:     w.Politics,
		Culture:      w.Culture,
		Factions:     w.Factions,
		Description:  w.Description,
		CoreAxis:     w.CoreAxis,
		Environment:  w.Environment,
		Subsistence:  w.Subsistence,
		Organization: w.Organization,
		Tensions:     w.Tensions,
		Tone:         w.Tone,
	}
}
```

- [ ] **Step 5: Register route**

In `routes.go`, add after `/world/generate`:
```go
router.HandleSecure("/world/derive", handlers.HandleWorldDerive(app.WorldService))
```

- [ ] **Step 6: Commit**

```bash
git add internal/api/handlers/world.go internal/api/routes.go internal/mappings/world.go internal/world/app/service.go
git commit -m "feat: add POST /world/derive endpoint and update world create for Sanderson"
```

---

## Chunk 3: Frontend — Wire Sanderson Components to Real API

### Task 12: Update API types and add deriveWorld function

**Files:**
- Modify: `storytellerFrontMVP/src/services/api.ts`

- [ ] **Step 1: Update World interface with Sanderson fields**

```typescript
export interface World {
  id: number
  name: string
  era: string
  climate: string
  politics: string
  culture: string
  factions: string[]
  description: string
  core_axis?: string
  environment?: string
  subsistence?: string
  organization?: string
  tensions?: string
  tone?: string
}
```

- [ ] **Step 2: Add deriveWorld API function**

After `generateWorld`:
```typescript
export interface DeriveWorldResult {
  name: string
  core_axis: string
  environment: string
  subsistence: string
  organization: string
  tensions: string
  tone: string
  factions: string[]
  description: string
}

export function deriveWorld(coreAxis: string) {
  return request<DeriveWorldResult>('/world/derive', {
    method: 'POST',
    body: JSON.stringify({ core_axis: coreAxis }),
  })
}
```

- [ ] **Step 3: Commit**

```bash
git add src/services/api.ts
git commit -m "feat: add deriveWorld API function and Sanderson fields to World type"
```

### Task 13: Wire CreateWorldPage.sanderson to real API

**Files:**
- Modify: `storytellerFrontMVP/src/pages/home/CreateWorldPage.sanderson.tsx`

- [ ] **Step 1: Replace mock handleDerive with real API call**

Replace the `handleDerive` function body (lines 223-256) to use the real API:
```typescript
const handleDerive = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!coreAxis.trim()) return

  setPhase('generating')
  setError('')

  try {
    const result = await deriveWorld(coreAxis)
    setDerived({
      environment: result.environment,
      subsistence: result.subsistence,
      organization: result.organization,
      tensions: result.tensions,
      tone: result.tone,
    })
    if (result.name && !name) {
      setName(result.name)
    }
    setChipStatuses({
      environment: 'pending',
      subsistence: 'pending',
      organization: 'pending',
      tensions: 'pending',
      tone: 'pending',
    })
    setRevealedLayers(new Set())
    setPhase('reviewing')
  } catch (err) {
    setError(err instanceof Error ? err.message : t('world.create.deriveError'))
    setPhase('axis')
  }
}
```

Add import at top:
```typescript
import { deriveWorld, createWorld } from '../../services/api'
```

- [ ] **Step 2: Replace mock handleSave with real API call**

```typescript
const handleSave = async () => {
  if (!derived) return
  setSaving(true)
  setError('')

  try {
    const acceptedData: Record<string, string> = {}
    for (const layer of LAYER_ORDER) {
      if (chipStatuses[layer] === 'accepted') {
        acceptedData[layer] = derived[layer]
      }
    }

    await createWorld({
      name: name || 'Mundo sin nombre',
      era: '',
      climate: '',
      politics: '',
      culture: '',
      factions: [],
      description: '',
      core_axis: coreAxis,
      environment: acceptedData.environment || '',
      subsistence: acceptedData.subsistence || '',
      organization: acceptedData.organization || '',
      tensions: acceptedData.tensions || '',
      tone: acceptedData.tone || '',
    })
    navigate('/worlds')
  } catch (err) {
    setError(err instanceof Error ? err.message : t('world.create.error'))
  } finally {
    setSaving(false)
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/home/CreateWorldPage.sanderson.tsx
git commit -m "feat: wire CreateWorldPage Sanderson to real API calls"
```

### Task 14: Swap routes to Sanderson pages

**Files:**
- Modify: `storytellerFrontMVP/src/App.tsx`

- [ ] **Step 1: Read current App.tsx to find the route imports and definitions**

- [ ] **Step 2: Change the CreateWorldPage import**

Replace the old import:
```typescript
// Old:
const CreateWorldPage = lazy(() => import('./pages/home/CreateWorldPage'))
// New:
const CreateWorldPage = lazy(() => import('./pages/home/CreateWorldPage.sanderson'))
```

Keep the route path `/worlds/create` unchanged.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: swap CreateWorldPage route to Sanderson version"
```

### Task 15: Update WorldDetailPage for Sanderson fields

**Files:**
- Modify: `storytellerFrontMVP/src/pages/home/WorldDetailPage.tsx`

- [ ] **Step 1: Add Sanderson layer display to the hero section**

After the existing attributes badges, add a conditional section for Sanderson worlds:
```typescript
{/* Sanderson layers */}
{world.core_axis && (
  <div className="mt-6">
    <p className="text-sm text-muted-foreground italic mb-3">
      "{world.core_axis}"
    </p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {[
        { key: 'environment', label: 'Entorno', color: 'emerald' },
        { key: 'subsistence', label: 'Subsistencia', color: 'amber' },
        { key: 'organization', label: 'Organización', color: 'blue' },
        { key: 'tensions', label: 'Tensiones', color: 'rose' },
        { key: 'tone', label: 'Tono narrativo', color: 'violet' },
      ].filter(l => world[l.key as keyof World]).map(layer => (
        <div key={layer.key} className={`rounded-xl bg-white border border-gray-100 p-4 border-l-4 border-l-${layer.color}-500`}>
          <h4 className={`text-xs font-semibold uppercase tracking-widest text-${layer.color}-600 mb-1`}>
            {layer.label}
          </h4>
          <p className="text-sm text-foreground leading-relaxed line-clamp-4">
            {world[layer.key as keyof World] as string}
          </p>
        </div>
      ))}
    </div>
  </div>
)}
```

- [ ] **Step 2: Update gradient logic to work with Sanderson worlds**

For Sanderson worlds without a climate field, use a default gradient or infer from core_axis. Add after the existing CLIMATE_GRADIENT:
```typescript
function inferGradient(world: World): string {
  if (world.climate && CLIMATE_GRADIENT[world.climate]) {
    return CLIMATE_GRADIENT[world.climate]
  }
  // Infer from core_axis keywords
  const text = (world.core_axis || world.description || '').toLowerCase()
  if (/ceniza|volcan|fuego/.test(text)) return 'from-red-500 to-orange-600'
  if (/hielo|nieve|glaciar/.test(text)) return 'from-cyan-400 to-blue-600'
  if (/agua|oceano|lluvia/.test(text)) return 'from-blue-400 to-indigo-600'
  if (/bosque|selva|verde/.test(text)) return 'from-emerald-400 to-teal-600'
  if (/desierto|arena|sol/.test(text)) return 'from-amber-400 to-orange-600'
  if (/oscuridad|sombra/.test(text)) return 'from-slate-600 to-gray-800'
  if (/magia|hechizo/.test(text)) return 'from-violet-500 to-purple-700'
  return DEFAULT_GRADIENT
}
```

Replace `const gradient = CLIMATE_GRADIENT[world.climate] ?? DEFAULT_GRADIENT` with:
```typescript
const gradient = inferGradient(world)
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/home/WorldDetailPage.tsx
git commit -m "feat: add Sanderson layer rendering to WorldDetailPage"
```

### Task 16: Add i18n strings for Sanderson UI

**Files:**
- Modify: `storytellerFrontMVP/src/i18n/locales/es.json`
- Modify: `storytellerFrontMVP/src/i18n/locales/en.json`

- [ ] **Step 1: Add Spanish strings**

Add under the `world.create` namespace in `es.json`:
```json
{
  "world": {
    "create": {
      "sandersonTitle": "Define el corazón de tu mundo",
      "sandersonSubtitle": "Un eje central. Cinco capas derivadas. Un mundo completo.",
      "worldNameLabel": "Nombre del mundo",
      "worldNamePlaceholder": "Aún sin nombre...",
      "coreAxisLabel": "El eje central",
      "coreAxisDescription": "La premisa fundamental de tu mundo. Una sola idea de la que todo lo demás se deriva.",
      "coreAxisPlaceholder": "En este mundo, la lluvia nunca cesa y los continentes están cubiertos de lodo vivo que traga ciudades enteras...",
      "deriveButton": "Derivar mundo",
      "derivedLayersLabel": "Capas derivadas",
      "acceptAll": "Aceptar todas las sugerencias",
      "saveWorld": "Guardar mundo",
      "saving": "Guardando...",
      "reEditAxis": "Volver a editar el eje central",
      "deriveError": "Error al derivar el mundo",
      "confirmed": "Confirmado",
      "layerEnvironment": "Entorno",
      "layerSubsistence": "Subsistencia",
      "layerOrganization": "Organización",
      "layerTensions": "Tensiones",
      "layerTone": "Tono narrativo"
    }
  }
}
```

- [ ] **Step 2: Add English strings**

Same keys in `en.json`:
```json
{
  "world": {
    "create": {
      "sandersonTitle": "Define your world's heart",
      "sandersonSubtitle": "One core axis. Five derived layers. A complete world.",
      "worldNameLabel": "World name",
      "worldNamePlaceholder": "Unnamed for now...",
      "coreAxisLabel": "The core axis",
      "coreAxisDescription": "The fundamental premise of your world. A single idea from which everything else derives.",
      "coreAxisPlaceholder": "In this world, the rain never stops and the continents are covered in living mud that swallows entire cities...",
      "deriveButton": "Derive world",
      "derivedLayersLabel": "Derived layers",
      "acceptAll": "Accept all suggestions",
      "saveWorld": "Save world",
      "saving": "Saving...",
      "reEditAxis": "Edit core axis again",
      "deriveError": "Error deriving world",
      "confirmed": "Confirmed",
      "layerEnvironment": "Environment",
      "layerSubsistence": "Subsistence",
      "layerOrganization": "Organization",
      "layerTensions": "Tensions",
      "layerTone": "Narrative tone"
    }
  }
}
```

- [ ] **Step 3: Replace hardcoded strings in CreateWorldPage.sanderson.tsx with t() calls**

Go through the file and replace all Spanish hardcoded strings with their i18n keys.

- [ ] **Step 4: Commit**

```bash
git add src/i18n/locales/es.json src/i18n/locales/en.json src/pages/home/CreateWorldPage.sanderson.tsx
git commit -m "feat: add i18n strings for Sanderson world creation flow"
```

### Task 17: Verify build

- [ ] **Step 1: Run TypeScript check + build on frontend**

```bash
cd /c/Users/tonid/Desktop/dojoCode/storytellerFrontMVP && npm run build
```

Expected: clean build with no errors.

- [ ] **Step 2: Run Go build on backend**

```bash
cd /c/Users/tonid/Desktop/dojoCode/storytellerMVP && go build ./...
```

Expected: clean build with no errors.

- [ ] **Step 3: Run TypeScript build on generator**

```bash
cd /c/Users/tonid/Desktop/dojoCode/storyteller-generator-v2 && npx tsc --noEmit
```

Expected: clean build with no errors.

---

## Summary of Changes by Repo

### storyteller-generator-v2
- New `WorldDerive` generation type
- New Sanderson LLM prompt (5 layers from core axis)
- Handler + dispatcher wiring
- Updated ContextBuilder for both world models

### storytellerMVP
- 6 new DB columns: `core_axis`, `environment`, `subsistence`, `organization`, `tensions`, `tone`
- Extended World domain model + DTOs
- New `POST /world/derive` endpoint
- Updated repository SQL
- Updated Create to handle both models

### storytellerFrontMVP
- Updated `World` type + new `deriveWorld()` API function
- Wired CreateWorldPage.sanderson to real API
- Swapped route to Sanderson page
- Updated WorldDetailPage to render layers
- i18n strings for ES/EN
