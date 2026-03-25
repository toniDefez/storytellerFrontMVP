# Location Graph Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a location graph tab to the world detail page — AI-generates a map of places from the causal graph, user can edit and connect nodes manually.

**Architecture:** Three repos touched in order: (1) Go backend adds DB schema + CRUD + generation endpoint, (2) TS generator adds the location graph handler, (3) React frontend adds the canvas, custom edges, node component, side panels, and tab switcher. Each chunk is independently testable.

**Tech Stack:** Go 1.21 + PostgreSQL, TypeScript + LangChain + Ollama, React 19 + @xyflow/react v12 + Tailwind CSS v4

**Spec:** `docs/superpowers/specs/2026-03-24-location-graph-design.md`

---

## File Map

### storytellerMVP (Go backend)
| File | Action | Responsibility |
|------|--------|----------------|
| `docker/postgres/init.sql` | Modify | Add location_nodes + location_edges tables |
| `internal/location/domain/model.go` | Create | LocationNode, LocationEdge, repo interfaces, errors (incl. ErrSelfLoop) |
| `internal/location/domain/payloads.go` | Create | LocationGeneratePayload, LocationGraphResult |
| `internal/location/infra/pg_repo.go` | Create | PostgreSQL implementations |
| `internal/location/infra/world_context.go` | Create | PgWorldContextAdapter: GetContextForWorld + IsOwner |
| `internal/location/infra/mock_repo.go` | Create | Mock implementations for tests |
| `internal/location/app/service.go` | Create | Business logic: CRUD + generate |
| `internal/location/app/service_test.go` | Create | Service unit tests |
| `internal/api/dto/location.go` | Create | Request/response DTOs |
| `internal/api/handlers/location.go` | Create | 9 HTTP handlers |
| `internal/generation/domain/payloads.go` | Modify | Add LocationGeneratePayload, GenerationTypeLocationGraph |
| `internal/api/application.go` | Modify | Wire LocationService |
| `cmd/server/main.go` | Modify | Instantiate location repos + service |

### storyteller-generator-v2 (TypeScript generator)
| File | Action | Responsibility |
|------|--------|----------------|
| `src/consumer/core/models/payloads.ts` | Modify | Add LocationGeneratePayload, LocationGraphResult types |
| `src/consumer/core/models/generation.ts` | Modify | Add GenerationType.LocationGraph |
| `src/internal/context/location_graph_generator/domain/LocationContentGenerator.ts` | Create | Generator interface |
| `src/internal/context/location_graph_generator/infra/OllamaLocationGraphGenerator.ts` | Create | LLM generation + sanitization |
| `src/internal/context/location_graph_generator/app/LocationGraphGenerator.ts` | Create | Orchestrates the generator |
| `src/consumer/core/services/generation.ts` | Modify | Add handleLocationGraph handler |
| `src/consumer/dispatcher.ts` | Modify | Register GenerationType.LocationGraph |
| `tests/unit/location-graph.test.js` | Create | Unit tests for sanitization + schema |

### storytellerFrontMVP (React frontend)
| File | Action | Responsibility |
|------|--------|----------------|
| `src/services/api.ts` | Modify | Add LocationNode, LocationEdge types + fetch functions |
| `src/hooks/useLocationGraph.ts` | Create | State + API calls for location graph |
| `src/components/world-graph/EdgeFormDialog.tsx` | Create | Dialog for picking edge_type + effort when user draws a new edge |
| `src/components/world-graph/locationEdgeUtils.ts` | Create | Floating edge geometry (getEdgeParams) |
| `src/components/world-graph/LocationNode.tsx` | Create | Custom ReactFlow node, teal accent |
| `src/components/world-graph/LocationEdges.tsx` | Create | WaterwayEdge, WildernessEdge, RoadEdge |
| `src/components/world-graph/LocationNodeDetailPanel.tsx` | Create | Node detail + story layer collapsible |
| `src/components/world-graph/LocationEdgeDetailPanel.tsx` | Create | Edge detail + edit form |
| `src/components/world-graph/LocationSidePanel.tsx` | Create | Wraps node/edge panels |
| `src/components/world-graph/LocationGraphCanvas.tsx` | Create | Main ReactFlow canvas |
| `src/pages/home/WorldDetailPage.tsx` | Modify | Add graphView tab state + tab switcher |
| `src/i18n/locales/es.json` | Modify | Spanish i18n keys |
| `src/i18n/locales/en.json` | Modify | English i18n keys |

---

## Chunk 0: DB Schema

**Repos:** storytellerMVP

- [ ] **Step 1: Add tables to init.sql**

Open `docker/postgres/init.sql`. After the `world_nodes` table definition, add:

```sql
-- --------------------------------------------------------------------------------
-- TABLA: location_nodes
--   Nodos del grafo de localizaciones. Cada localización pertenece a un mundo.
-- --------------------------------------------------------------------------------
CREATE TABLE location_nodes (
  id          SERIAL PRIMARY KEY,
  world_id    INTEGER NOT NULL
    REFERENCES worlds(id)
    ON DELETE CASCADE,
  name        TEXT NOT NULL,
  node_type   TEXT NOT NULL CHECK (
    node_type IN ('settlement','wilderness','ruin','landmark','threshold')
  ),
  description TEXT,
  properties  JSONB NOT NULL DEFAULT '{}',
  canvas_x    REAL NOT NULL DEFAULT 0,
  canvas_y    REAL NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_location_name_per_world UNIQUE (world_id, name)
);

-- --------------------------------------------------------------------------------
-- TABLA: location_edges
--   Aristas del grafo de localizaciones.
-- --------------------------------------------------------------------------------
CREATE TABLE location_edges (
  id             SERIAL PRIMARY KEY,
  world_id       INTEGER NOT NULL
    REFERENCES worlds(id)
    ON DELETE CASCADE,
  source_node_id INTEGER NOT NULL
    REFERENCES location_nodes(id)
    ON DELETE CASCADE,
  target_node_id INTEGER NOT NULL
    REFERENCES location_nodes(id)
    ON DELETE CASCADE,
  edge_type      TEXT NOT NULL CHECK (
    edge_type IN ('road','wilderness','waterway')
  ),
  effort         TEXT NOT NULL DEFAULT 'moderate' CHECK (
    effort IN ('easy','moderate','difficult')
  ),
  bidirectional  BOOLEAN NOT NULL DEFAULT true,
  note           TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT no_self_loop CHECK (source_node_id <> target_node_id),
  CONSTRAINT unique_directed_edge UNIQUE (source_node_id, target_node_id)
);

CREATE INDEX idx_location_nodes_world_id ON location_nodes(world_id);
CREATE INDEX idx_location_edges_world_id ON location_edges(world_id);
CREATE INDEX idx_location_edges_source   ON location_edges(source_node_id);
CREATE INDEX idx_location_edges_target   ON location_edges(target_node_id);
```

- [ ] **Step 2: Recreate the database**

```bash
cd storytellerMVP
make db-recreate
```

Expected: no errors, tables created.

- [ ] **Step 3: Verify tables exist**

```bash
make db-tables
```

Expected: `location_nodes` and `location_edges` appear in the list.

- [ ] **Step 4: Commit**

```bash
git add docker/postgres/init.sql
git commit -m "feat(db): add location_nodes and location_edges tables"
```

---

## Chunk 1: Go Domain + Infra

**Repos:** storytellerMVP

- [ ] **Step 1: Create `internal/location/domain/model.go`**

```go
package domain

import (
  "errors"
  "time"
)

type LocationNodeType string

const (
  NodeTypeSettlement LocationNodeType = "settlement"
  NodeTypeWilderness LocationNodeType = "wilderness"
  NodeTypeRuin       LocationNodeType = "ruin"
  NodeTypeLandmark   LocationNodeType = "landmark"
  NodeTypeThreshold  LocationNodeType = "threshold"
)

type LocationNode struct {
  ID          int              `json:"id"`
  WorldID     int              `json:"world_id"`
  Name        string           `json:"name"`
  NodeType    LocationNodeType `json:"node_type"`
  Description string           `json:"description"`
  Properties  map[string]any   `json:"properties"`
  CanvasX     float64          `json:"canvas_x"`
  CanvasY     float64          `json:"canvas_y"`
  CreatedAt   time.Time        `json:"created_at"`
}

type LocationEdgeType string

const (
  EdgeTypeRoad       LocationEdgeType = "road"
  EdgeTypeWilderness LocationEdgeType = "wilderness"
  EdgeTypeWaterway   LocationEdgeType = "waterway"
)

type LocationEffort string

const (
  EffortEasy       LocationEffort = "easy"
  EffortModerate   LocationEffort = "moderate"
  EffortDifficult  LocationEffort = "difficult"
)

type LocationEdge struct {
  ID           int              `json:"id"`
  WorldID      int              `json:"world_id"`
  SourceNodeID int              `json:"source_node_id"`
  TargetNodeID int              `json:"target_node_id"`
  EdgeType     LocationEdgeType `json:"edge_type"`
  Effort       LocationEffort   `json:"effort"`
  Bidirectional bool            `json:"bidirectional"`
  Note         string           `json:"note"`
  CreatedAt    time.Time        `json:"created_at"`
}

type LocationGraph struct {
  Nodes []LocationNode `json:"nodes"`
  Edges []LocationEdge `json:"edges"`
}

var (
  ErrLocationNodeNotFound = errors.New("location node not found")
  ErrLocationEdgeNotFound = errors.New("location edge not found")
  ErrDuplicateEdge        = errors.New("edge already exists between these nodes")
  ErrSelfLoop             = errors.New("self-loop: source and target node must be different")
)

type LocationNodeRepository interface {
  ListByWorld(worldID int) ([]LocationNode, error)
  GetByID(id int) (LocationNode, error)
  Create(node *LocationNode) (int, error)
  Update(id int, node *LocationNode) error
  UpdatePosition(id int, x, y float64) error
  Delete(id int) error
}

type LocationEdgeRepository interface {
  ListByWorld(worldID int) ([]LocationEdge, error)
  GetByID(id int) (LocationEdge, error)
  Create(edge *LocationEdge) (int, error)
  Update(id int, edge *LocationEdge) error
  Delete(id int) error
  ExistsBetween(sourceID, targetID int) (bool, error)
}
```

The `errors` import is already included in the snippet above.

- [ ] **Step 2: Create `internal/location/infra/pg_repo.go`**

```go
package infra

import (
  "database/sql"
  "encoding/json"
  "strings"

  "github.com/toniDefez/storyteller/internal/location/domain"
)

type PgLocationNodeRepo struct{ db *sql.DB }
type PgLocationEdgeRepo struct{ db *sql.DB }

func NewPgLocationNodeRepo(db *sql.DB) *PgLocationNodeRepo {
  return &PgLocationNodeRepo{db: db}
}

func NewPgLocationEdgeRepo(db *sql.DB) *PgLocationEdgeRepo {
  return &PgLocationEdgeRepo{db: db}
}

func (r *PgLocationNodeRepo) ListByWorld(worldID int) ([]domain.LocationNode, error) {
  rows, err := r.db.Query(
    `SELECT id, world_id, name, node_type, COALESCE(description,''), properties, canvas_x, canvas_y, created_at
     FROM location_nodes WHERE world_id = $1 ORDER BY created_at ASC`, worldID)
  if err != nil {
    return nil, err
  }
  defer rows.Close()

  var nodes []domain.LocationNode
  for rows.Next() {
    var n domain.LocationNode
    var propsRaw []byte
    if err := rows.Scan(&n.ID, &n.WorldID, &n.Name, &n.NodeType,
      &n.Description, &propsRaw, &n.CanvasX, &n.CanvasY, &n.CreatedAt); err != nil {
      return nil, err
    }
    if err := json.Unmarshal(propsRaw, &n.Properties); err != nil {
      n.Properties = map[string]any{}
    }
    nodes = append(nodes, n)
  }
  return nodes, rows.Err()
}

func (r *PgLocationNodeRepo) GetByID(id int) (domain.LocationNode, error) {
  var n domain.LocationNode
  var propsRaw []byte
  err := r.db.QueryRow(
    `SELECT id, world_id, name, node_type, COALESCE(description,''), properties, canvas_x, canvas_y, created_at
     FROM location_nodes WHERE id = $1`, id).
    Scan(&n.ID, &n.WorldID, &n.Name, &n.NodeType, &n.Description, &propsRaw, &n.CanvasX, &n.CanvasY, &n.CreatedAt)
  if err == sql.ErrNoRows {
    return domain.LocationNode{}, domain.ErrLocationNodeNotFound
  }
  if err != nil {
    return domain.LocationNode{}, err
  }
  if err := json.Unmarshal(propsRaw, &n.Properties); err != nil {
    n.Properties = map[string]any{}
  }
  return n, nil
}

func (r *PgLocationNodeRepo) Create(node *domain.LocationNode) (int, error) {
  propsJSON, _ := json.Marshal(node.Properties)
  var id int
  err := r.db.QueryRow(
    `INSERT INTO location_nodes (world_id, name, node_type, description, properties, canvas_x, canvas_y)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    node.WorldID, node.Name, node.NodeType, node.Description,
    propsJSON, node.CanvasX, node.CanvasY).Scan(&id)
  return id, err
}

func (r *PgLocationNodeRepo) Update(id int, node *domain.LocationNode) error {
  propsJSON, _ := json.Marshal(node.Properties)
  _, err := r.db.Exec(
    `UPDATE location_nodes SET name=$1, node_type=$2, description=$3, properties=$4 WHERE id=$5`,
    node.Name, node.NodeType, node.Description, propsJSON, id)
  return err
}

func (r *PgLocationNodeRepo) UpdatePosition(id int, x, y float64) error {
  _, err := r.db.Exec(
    `UPDATE location_nodes SET canvas_x=$1, canvas_y=$2 WHERE id=$3`, x, y, id)
  return err
}

func (r *PgLocationNodeRepo) Delete(id int) error {
  _, err := r.db.Exec(`DELETE FROM location_nodes WHERE id=$1`, id)
  return err
}

// --- Edge repo ---

func (r *PgLocationEdgeRepo) ListByWorld(worldID int) ([]domain.LocationEdge, error) {
  rows, err := r.db.Query(
    `SELECT id, world_id, source_node_id, target_node_id, edge_type, effort, bidirectional, COALESCE(note,''), created_at
     FROM location_edges WHERE world_id = $1 ORDER BY created_at ASC`, worldID)
  if err != nil {
    return nil, err
  }
  defer rows.Close()

  var edges []domain.LocationEdge
  for rows.Next() {
    var e domain.LocationEdge
    if err := rows.Scan(&e.ID, &e.WorldID, &e.SourceNodeID, &e.TargetNodeID,
      &e.EdgeType, &e.Effort, &e.Bidirectional, &e.Note, &e.CreatedAt); err != nil {
      return nil, err
    }
    edges = append(edges, e)
  }
  return edges, rows.Err()
}

func (r *PgLocationEdgeRepo) GetByID(id int) (domain.LocationEdge, error) {
  var e domain.LocationEdge
  err := r.db.QueryRow(
    `SELECT id, world_id, source_node_id, target_node_id, edge_type, effort, bidirectional, COALESCE(note,''), created_at
     FROM location_edges WHERE id=$1`, id).
    Scan(&e.ID, &e.WorldID, &e.SourceNodeID, &e.TargetNodeID,
      &e.EdgeType, &e.Effort, &e.Bidirectional, &e.Note, &e.CreatedAt)
  if err == sql.ErrNoRows {
    return domain.LocationEdge{}, domain.ErrLocationEdgeNotFound
  }
  return e, err
}

func (r *PgLocationEdgeRepo) Create(edge *domain.LocationEdge) (int, error) {
  // Normalizar dirección: source_id siempre < target_id para edges bidireccionales
  src, tgt := edge.SourceNodeID, edge.TargetNodeID
  if edge.Bidirectional && src > tgt {
    src, tgt = tgt, src
  }
  var id int
  err := r.db.QueryRow(
    `INSERT INTO location_edges (world_id, source_node_id, target_node_id, edge_type, effort, bidirectional, note)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    edge.WorldID, src, tgt, edge.EdgeType, edge.Effort, edge.Bidirectional, edge.Note).Scan(&id)
  if err != nil && isPgUniqueViolation(err) {
    return 0, domain.ErrDuplicateEdge
  }
  return id, err
}

func (r *PgLocationEdgeRepo) Update(id int, edge *domain.LocationEdge) error {
  _, err := r.db.Exec(
    `UPDATE location_edges SET edge_type=$1, effort=$2, bidirectional=$3, note=$4 WHERE id=$5`,
    edge.EdgeType, edge.Effort, edge.Bidirectional, edge.Note, id)
  return err
}

func (r *PgLocationEdgeRepo) Delete(id int) error {
  _, err := r.db.Exec(`DELETE FROM location_edges WHERE id=$1`, id)
  return err
}

func (r *PgLocationEdgeRepo) ExistsBetween(sourceID, targetID int) (bool, error) {
  var exists bool
  err := r.db.QueryRow(
    `SELECT EXISTS(SELECT 1 FROM location_edges
     WHERE (source_node_id=$1 AND target_node_id=$2)
        OR (source_node_id=$2 AND target_node_id=$1))`,
    sourceID, targetID).Scan(&exists)
  return exists, err
}

func isPgUniqueViolation(err error) bool {
  if err == nil {
    return false
  }
  msg := err.Error()
  return strings.Contains(msg, "23505") || strings.Contains(msg, "unique")
}
```

- [ ] **Step 3: Create `internal/location/infra/mock_repo.go`**

```go
package infra

import "github.com/toniDefez/storyteller/internal/location/domain"

type MockLocationNodeRepo struct {
  Nodes       []domain.LocationNode
  ReturnID    int
  Err         error
  UpdatedPos  *[2]float64
  DeletedID   int
}

func (m *MockLocationNodeRepo) ListByWorld(_ int) ([]domain.LocationNode, error) {
  return m.Nodes, m.Err
}
func (m *MockLocationNodeRepo) GetByID(id int) (domain.LocationNode, error) {
  if m.Err != nil { return domain.LocationNode{}, m.Err }
  for _, n := range m.Nodes {
    if n.ID == id { return n, nil }
  }
  return domain.LocationNode{}, domain.ErrLocationNodeNotFound
}
func (m *MockLocationNodeRepo) Create(_ *domain.LocationNode) (int, error) {
  return m.ReturnID, m.Err
}
func (m *MockLocationNodeRepo) Update(_ int, _ *domain.LocationNode) error { return m.Err }
func (m *MockLocationNodeRepo) UpdatePosition(_ int, x, y float64) error {
  m.UpdatedPos = &[2]float64{x, y}
  return m.Err
}
func (m *MockLocationNodeRepo) Delete(id int) error {
  m.DeletedID = id
  return m.Err
}

type MockLocationEdgeRepo struct {
  Edges      []domain.LocationEdge
  ReturnID   int
  Err        error
  ExistsResult bool
}

func (m *MockLocationEdgeRepo) ListByWorld(_ int) ([]domain.LocationEdge, error) {
  return m.Edges, m.Err
}
func (m *MockLocationEdgeRepo) GetByID(id int) (domain.LocationEdge, error) {
  if m.Err != nil { return domain.LocationEdge{}, m.Err }
  for _, e := range m.Edges {
    if e.ID == id { return e, nil }
  }
  return domain.LocationEdge{}, domain.ErrLocationEdgeNotFound
}
func (m *MockLocationEdgeRepo) Create(_ *domain.LocationEdge) (int, error) {
  return m.ReturnID, m.Err
}
func (m *MockLocationEdgeRepo) Update(_ int, _ *domain.LocationEdge) error { return m.Err }
func (m *MockLocationEdgeRepo) Delete(_ int) error { return m.Err }
func (m *MockLocationEdgeRepo) ExistsBetween(_, _ int) (bool, error) {
  return m.ExistsResult, m.Err
}
```

- [ ] **Step 4: Build to catch compilation errors**

```bash
cd storytellerMVP
go build ./...
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add internal/location/
git commit -m "feat(location): domain model + pg/mock repos"
```

---

## Chunk 2: Go Service + Tests

**Repos:** storytellerMVP

- [ ] **Step 1: Create `internal/location/app/service_test.go` (write tests first)**

```go
package app

import (
  "context"
  "testing"

  "github.com/toniDefez/storyteller/internal/location/domain"
  "github.com/toniDefez/storyteller/internal/location/infra"
)

func TestListGraph_RetornaGrafoCompleto(t *testing.T) {
  nodeRepo := &infra.MockLocationNodeRepo{
    Nodes: []domain.LocationNode{{ID: 1, WorldID: 42, Name: "Puerto de Arenmar"}},
  }
  edgeRepo := &infra.MockLocationEdgeRepo{
    Edges: []domain.LocationEdge{{ID: 1, WorldID: 42, SourceNodeID: 1, TargetNodeID: 2}},
  }
  svc := NewService(nodeRepo, edgeRepo, nil, nil, nil)

  graph, err := svc.ListGraph(42)
  if err != nil {
    t.Fatalf("esperaba nil, obtuve %v", err)
  }
  if len(graph.Nodes) != 1 || len(graph.Edges) != 1 {
    t.Fatalf("esperaba 1 nodo y 1 arista, obtuve %d nodos y %d aristas", len(graph.Nodes), len(graph.Edges))
  }
}

func TestCreateNode_RetornaIDCorrecto(t *testing.T) {
  nodeRepo := &infra.MockLocationNodeRepo{ReturnID: 99}
  svc := NewService(nodeRepo, nil, nil, nil, nil)

  id, err := svc.CreateNode(context.Background(), domain.LocationNode{
    WorldID: 1, Name: "Aldea del Norte", NodeType: domain.NodeTypeSettlement,
  })
  if err != nil || id != 99 {
    t.Fatalf("esperaba id=99 err=nil, obtuve id=%d err=%v", id, err)
  }
}

func TestCreateEdge_RechazaBuclePropioI(t *testing.T) {
  svc := NewService(nil, &infra.MockLocationEdgeRepo{}, nil, nil, nil)

  _, err := svc.CreateEdge(context.Background(), domain.LocationEdge{
    SourceNodeID: 5, TargetNodeID: 5,
  })
  if err != domain.ErrSelfLoop {
    t.Fatalf("esperaba ErrSelfLoop, obtuve %v", err)
  }
}

func TestCreateEdge_RechazaDuplicada(t *testing.T) {
  edgeRepo := &infra.MockLocationEdgeRepo{ExistsResult: true}
  svc := NewService(nil, edgeRepo, nil, nil, nil)

  _, err := svc.CreateEdge(context.Background(), domain.LocationEdge{
    SourceNodeID: 1, TargetNodeID: 2,
  })
  if err != domain.ErrDuplicateEdge {
    t.Fatalf("esperaba ErrDuplicateEdge, obtuve %v", err)
  }
}

func TestUpdatePosition_LlamaRepoConCoordenadas(t *testing.T) {
  nodeRepo := &infra.MockLocationNodeRepo{}
  svc := NewService(nodeRepo, nil, nil, nil, nil)

  err := svc.UpdatePosition(context.Background(), 7, 120.5, 340.0)
  if err != nil {
    t.Fatalf("esperaba nil, obtuve %v", err)
  }
  if nodeRepo.UpdatedPos == nil || nodeRepo.UpdatedPos[0] != 120.5 {
    t.Fatal("UpdatePosition no llamó al repo con las coordenadas correctas")
  }
}
```

- [ ] **Step 2: Run tests — deben fallar (aún no hay service.go)**

```bash
cd storytellerMVP
go test ./internal/location/app/ -v
```

Expected: compilation error — `NewService` undefined.

- [ ] **Step 3: Create `internal/location/app/service.go`**

```go
package app

import (
  "context"
  "encoding/json"
  "fmt"

  "github.com/google/uuid"
  generationdomain "github.com/toniDefez/storyteller/internal/generation/domain"
  installationdomain "github.com/toniDefez/storyteller/internal/installations/domain"
  "github.com/toniDefez/storyteller/internal/location/domain"
)

type GenerationService interface {
  CreateAndPublish(ctx context.Context, req *generationdomain.GenerationRequest) (json.RawMessage, error)
}

type WorldNodeFetcher interface {
  ListByWorld(worldID int) (interface{}, error) // replaced by real interface in wiring
}

type InstallationProvider interface {
  GetInstallationByUserID(ctx context.Context, userID int) (installationdomain.Installation, error)
}

// WorldContextFetcher fetches the causal context needed for location generation.
// Implement by querying worlds.premise + world_nodes WHERE world_id = $1.
type WorldContextFetcher interface {
  GetContextForWorld(worldID int) (premise string, nodes []WorldNodeForContext, err error)
  // IsOwner returns true if userID is the owner of worldID.
  // Implement with: SELECT EXISTS(SELECT 1 FROM worlds WHERE id=$1 AND owner_id=$2)
  IsOwner(worldID, userID int) (bool, error)
}

type WorldNodeForContext struct {
  Domain      string
  Label       string
  Description string
  Role        string
}

type Service struct {
  NodeRepo    domain.LocationNodeRepository
  EdgeRepo    domain.LocationEdgeRepository
  GenSvc      GenerationService
  InstallSvc  InstallationProvider
  WorldCtx    WorldContextFetcher
}

func NewService(
  nodeRepo domain.LocationNodeRepository,
  edgeRepo domain.LocationEdgeRepository,
  genSvc GenerationService,
  installSvc InstallationProvider,
  worldCtx WorldContextFetcher,
) *Service {
  return &Service{
    NodeRepo: nodeRepo, EdgeRepo: edgeRepo,
    GenSvc: genSvc, InstallSvc: installSvc,
    WorldCtx: worldCtx,
  }
}

func (s *Service) ListGraph(worldID int) (domain.LocationGraph, error) {
  nodes, err := s.NodeRepo.ListByWorld(worldID)
  if err != nil {
    return domain.LocationGraph{}, err
  }
  edges, err := s.EdgeRepo.ListByWorld(worldID)
  if err != nil {
    return domain.LocationGraph{}, err
  }
  return domain.LocationGraph{Nodes: nodes, Edges: edges}, nil
}

func (s *Service) CreateNode(ctx context.Context, node domain.LocationNode) (int, error) {
  return s.NodeRepo.Create(&node)
}

func (s *Service) UpdateNode(ctx context.Context, id int, node domain.LocationNode) error {
  return s.NodeRepo.Update(id, &node)
}

func (s *Service) UpdatePosition(ctx context.Context, id int, x, y float64) error {
  return s.NodeRepo.UpdatePosition(id, x, y)
}

func (s *Service) DeleteNode(ctx context.Context, id int) error {
  return s.NodeRepo.Delete(id)
}

func (s *Service) CreateEdge(ctx context.Context, edge domain.LocationEdge) (int, error) {
  if edge.SourceNodeID == edge.TargetNodeID {
    return 0, domain.ErrSelfLoop
  }
  exists, err := s.EdgeRepo.ExistsBetween(edge.SourceNodeID, edge.TargetNodeID)
  if err != nil {
    return 0, err
  }
  if exists {
    return 0, domain.ErrDuplicateEdge
  }
  return s.EdgeRepo.Create(&edge)
}

func (s *Service) UpdateEdge(ctx context.Context, id int, edge domain.LocationEdge) error {
  return s.EdgeRepo.Update(id, &edge)
}

func (s *Service) DeleteEdge(ctx context.Context, id int) error {
  return s.EdgeRepo.Delete(id)
}

// IsWorldOwner delegates ownership check to the WorldContextFetcher.
func (s *Service) IsWorldOwner(worldID, userID int) (bool, error) {
  return s.WorldCtx.IsOwner(worldID, userID)
}
```

- [ ] **Step 4: Run tests — deben pasar**

```bash
go test ./internal/location/app/ -v
```

Expected: todos los tests en PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/location/app/
git commit -m "feat(location): service layer + tests"
```

---

## Chunk 3: Go Payloads + Generation Type

**Repos:** storytellerMVP

- [ ] **Step 1: Add to `internal/generation/domain/payloads.go`**

After the existing generation types, add:

```go
// GenerationType for location graph
const GenerationTypeLocationGraph GenerationType = "location_graph"

// LocationNodesByDomain — nodos del grafo causal agrupados para el generador
type LocationNodeForContext struct {
  Label       string `json:"label"`
  Description string `json:"description"`
  Role        string `json:"role"`
}

// LocationGeneratePayload — enviado al generador TS via RabbitMQ
type LocationGeneratePayload struct {
  WorldID       int                                    `json:"worldId"`
  Premise       string                                 `json:"premise"`
  NodesByDomain map[string][]LocationNodeForContext    `json:"nodesByDomain"`
  NodeCountHint int                                    `json:"nodeCountHint"`
}

// LocationNodeResult — resultado de generación de un nodo
type LocationNodeResult struct {
  Name        string                 `json:"name"`
  NodeType    string                 `json:"node_type"`
  Description string                 `json:"description"`
  Properties  map[string]interface{} `json:"properties"`
  CanvasX     float64                `json:"canvas_x"`
  CanvasY     float64                `json:"canvas_y"`
}

// LocationEdgeResult — resultado de generación de una arista (referencias por nombre)
type LocationEdgeResult struct {
  SourceName    string `json:"source_name"`
  TargetName    string `json:"target_name"`
  EdgeType      string `json:"edge_type"`
  Effort        string `json:"effort"`
  Bidirectional bool   `json:"bidirectional"`
  Note          string `json:"note"`
}

// LocationGraphResult — respuesta completa del generador
type LocationGraphResult struct {
  Nodes []LocationNodeResult `json:"nodes"`
  Edges []LocationEdgeResult `json:"edges"`
}
```

- [ ] **Step 2: Build**

```bash
go build ./...
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add internal/generation/domain/payloads.go
git commit -m "feat(generation): add LocationGraph payload types"
```

---

## Chunk 4: Go HTTP Handlers + Routes

**Repos:** storytellerMVP

- [ ] **Step 1: Create `internal/api/dto/location.go`**

```go
package dto

type CreateLocationNodeRequest struct {
  WorldID     int            `json:"world_id"`
  Name        string         `json:"name"`
  NodeType    string         `json:"node_type"`
  Description string         `json:"description"`
  Properties  map[string]any `json:"properties"`
  CanvasX     float64        `json:"canvas_x"`
  CanvasY     float64        `json:"canvas_y"`
}

type UpdateLocationNodeRequest struct {
  Name        string         `json:"name"`
  NodeType    string         `json:"node_type"`
  Description string         `json:"description"`
  Properties  map[string]any `json:"properties"`
}

type UpdateLocationPositionRequest struct {
  CanvasX float64 `json:"canvas_x"`
  CanvasY float64 `json:"canvas_y"`
}

type CreateLocationEdgeRequest struct {
  WorldID       int    `json:"world_id"`
  SourceNodeID  int    `json:"source_node_id"`
  TargetNodeID  int    `json:"target_node_id"`
  EdgeType      string `json:"edge_type"`
  Effort        string `json:"effort"`
  Bidirectional bool   `json:"bidirectional"`
  Note          string `json:"note"`
}

type UpdateLocationEdgeRequest struct {
  EdgeType      string `json:"edge_type"`
  Effort        string `json:"effort"`
  Bidirectional bool   `json:"bidirectional"`
  Note          string `json:"note"`
}

type GenerateLocationGraphRequest struct {
  WorldID       int `json:"world_id"`
  NodeCountHint int `json:"node_count_hint"`
}
```

- [ ] **Step 2: Create `internal/api/handlers/location.go`**

This handler follows the exact pattern of `handlers/world.go`. Key sections:

```go
package handlers

import (
  "encoding/json"
  "net/http"
  "strconv"

  "github.com/toniDefez/storyteller/internal/api/dto"
  "github.com/toniDefez/storyteller/internal/api/httputils"
  "github.com/toniDefez/storyteller/internal/location/app"
  "github.com/toniDefez/storyteller/internal/location/domain"
)

type LocationHandler struct {
  Service *app.Service
}

func (h *LocationHandler) HandleGetGraph(w http.ResponseWriter, r *http.Request) {
  userID := httputils.GetUserID(r)
  worldID, err := strconv.Atoi(r.URL.Query().Get("world_id"))
  if err != nil || worldID == 0 {
    http.Error(w, "world_id requerido", http.StatusBadRequest)
    return
  }
  if ok, err := h.Service.IsWorldOwner(worldID, userID); err != nil || !ok {
    http.Error(w, "no autorizado", http.StatusForbidden)
    return
  }
  graph, err := h.Service.ListGraph(worldID)
  if err != nil {
    http.Error(w, err.Error(), http.StatusInternalServerError)
    return
  }
  httputils.WriteJSON(w, http.StatusOK, graph)
}

func (h *LocationHandler) HandleCreateNode(w http.ResponseWriter, r *http.Request) {
  userID := httputils.GetUserID(r)
  var req dto.CreateLocationNodeRequest
  if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
    http.Error(w, "cuerpo inválido", http.StatusBadRequest)
    return
  }
  if ok, err := h.Service.IsWorldOwner(req.WorldID, userID); err != nil || !ok {
    http.Error(w, "no autorizado", http.StatusForbidden)
    return
  }
  node := domain.LocationNode{
    WorldID: req.WorldID, Name: req.Name,
    NodeType: domain.LocationNodeType(req.NodeType),
    Description: req.Description, Properties: req.Properties,
    CanvasX: req.CanvasX, CanvasY: req.CanvasY,
  }
  id, err := h.Service.CreateNode(r.Context(), node)
  if err != nil {
    http.Error(w, err.Error(), http.StatusInternalServerError)
    return
  }
  node.ID = id
  httputils.WriteJSON(w, http.StatusCreated, node)
}

func (h *LocationHandler) HandleUpdateNode(w http.ResponseWriter, r *http.Request) {
  id, err := strconv.Atoi(r.URL.Query().Get("id"))
  if err != nil || id == 0 {
    http.Error(w, "id requerido", http.StatusBadRequest)
    return
  }
  var req dto.UpdateLocationNodeRequest
  if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
    http.Error(w, "cuerpo inválido", http.StatusBadRequest)
    return
  }
  node := domain.LocationNode{
    Name: req.Name, NodeType: domain.LocationNodeType(req.NodeType),
    Description: req.Description, Properties: req.Properties,
  }
  if err := h.Service.UpdateNode(r.Context(), id, node); err != nil {
    http.Error(w, err.Error(), http.StatusInternalServerError)
    return
  }
  w.WriteHeader(http.StatusNoContent)
}

func (h *LocationHandler) HandleUpdatePosition(w http.ResponseWriter, r *http.Request) {
  id, err := strconv.Atoi(r.URL.Query().Get("id"))
  if err != nil || id == 0 {
    http.Error(w, "id requerido", http.StatusBadRequest)
    return
  }
  var req dto.UpdateLocationPositionRequest
  if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
    http.Error(w, "cuerpo inválido", http.StatusBadRequest)
    return
  }
  if err := h.Service.UpdatePosition(r.Context(), id, req.CanvasX, req.CanvasY); err != nil {
    http.Error(w, err.Error(), http.StatusInternalServerError)
    return
  }
  w.WriteHeader(http.StatusNoContent)
}

func (h *LocationHandler) HandleDeleteNode(w http.ResponseWriter, r *http.Request) {
  id, err := strconv.Atoi(r.URL.Query().Get("id"))
  if err != nil || id == 0 {
    http.Error(w, "id requerido", http.StatusBadRequest)
    return
  }
  if err := h.Service.DeleteNode(r.Context(), id); err != nil {
    http.Error(w, err.Error(), http.StatusInternalServerError)
    return
  }
  w.WriteHeader(http.StatusNoContent)
}

func (h *LocationHandler) HandleCreateEdge(w http.ResponseWriter, r *http.Request) {
  var req dto.CreateLocationEdgeRequest
  if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
    http.Error(w, "cuerpo inválido", http.StatusBadRequest)
    return
  }
  edge := domain.LocationEdge{
    WorldID: req.WorldID, SourceNodeID: req.SourceNodeID, TargetNodeID: req.TargetNodeID,
    EdgeType: domain.LocationEdgeType(req.EdgeType), Effort: domain.LocationEffort(req.Effort),
    Bidirectional: req.Bidirectional, Note: req.Note,
  }
  id, err := h.Service.CreateEdge(r.Context(), edge)
  if err == domain.ErrSelfLoop {
    http.Error(w, "bucle propio no permitido", http.StatusBadRequest)
    return
  }
  if err == domain.ErrDuplicateEdge {
    http.Error(w, "arista ya existe", http.StatusConflict)
    return
  }
  if err != nil {
    http.Error(w, err.Error(), http.StatusInternalServerError)
    return
  }
  edge.ID = id
  httputils.WriteJSON(w, http.StatusCreated, edge)
}

func (h *LocationHandler) HandleUpdateEdge(w http.ResponseWriter, r *http.Request) {
  id, err := strconv.Atoi(r.URL.Query().Get("id"))
  if err != nil || id == 0 {
    http.Error(w, "id requerido", http.StatusBadRequest)
    return
  }
  var req dto.UpdateLocationEdgeRequest
  if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
    http.Error(w, "cuerpo inválido", http.StatusBadRequest)
    return
  }
  edge := domain.LocationEdge{
    EdgeType: domain.LocationEdgeType(req.EdgeType), Effort: domain.LocationEffort(req.Effort),
    Bidirectional: req.Bidirectional, Note: req.Note,
  }
  if err := h.Service.UpdateEdge(r.Context(), id, edge); err != nil {
    http.Error(w, err.Error(), http.StatusInternalServerError)
    return
  }
  w.WriteHeader(http.StatusNoContent)
}

func (h *LocationHandler) HandleDeleteEdge(w http.ResponseWriter, r *http.Request) {
  id, err := strconv.Atoi(r.URL.Query().Get("id"))
  if err != nil || id == 0 {
    http.Error(w, "id requerido", http.StatusBadRequest)
    return
  }
  if err := h.Service.DeleteEdge(r.Context(), id); err != nil {
    http.Error(w, err.Error(), http.StatusInternalServerError)
    return
  }
  w.WriteHeader(http.StatusNoContent)
}

func (h *LocationHandler) HandleGenerate(w http.ResponseWriter, r *http.Request) {
  userID := httputils.GetUserID(r)
  var req dto.GenerateLocationGraphRequest
  if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
    http.Error(w, "cuerpo inválido", http.StatusBadRequest)
    return
  }
  if req.NodeCountHint == 0 {
    req.NodeCountHint = 12
  }
  graph, err := h.Service.Generate(r.Context(), userID, req.WorldID, req.NodeCountHint)
  if err != nil {
    http.Error(w, err.Error(), http.StatusInternalServerError)
    return
  }
  httputils.WriteJSON(w, http.StatusOK, graph)
}
```

- [ ] **Step 3: Wire routes in `internal/api/application.go`**

Add `LocationService *locationapp.Service` to the `Application` struct and register routes in `Routes()`:

```go
// En Routes():
locationHandler := &handlers.LocationHandler{Service: app.LocationService}
mux.HandleSecure("GET /location/graph",           locationHandler.HandleGetGraph)
mux.HandleSecure("POST /location/nodes",          locationHandler.HandleCreateNode)
mux.HandleSecure("PUT /location/nodes/update",    locationHandler.HandleUpdateNode)
mux.HandleSecure("DELETE /location/nodes/delete", locationHandler.HandleDeleteNode)
mux.HandleSecure("PATCH /location/nodes/position",locationHandler.HandleUpdatePosition)
mux.HandleSecure("POST /location/edges",          locationHandler.HandleCreateEdge)
mux.HandleSecure("PUT /location/edges/update",    locationHandler.HandleUpdateEdge)
mux.HandleSecure("DELETE /location/edges/delete", locationHandler.HandleDeleteEdge)
mux.HandleSecure("POST /location/generate",       locationHandler.HandleGenerate)
```

- [ ] **Step 4: Create `internal/location/infra/world_context.go`**

Implements `locationapp.WorldContextFetcher`. Queries `worlds` + `world_nodes` tables:

```go
package infra

import (
  "database/sql"

  locationapp "github.com/toniDefez/storyteller/internal/location/app"
)

type PgWorldContextAdapter struct{ db *sql.DB }

func NewPgWorldContextAdapter(db *sql.DB) *PgWorldContextAdapter {
  return &PgWorldContextAdapter{db: db}
}

func (a *PgWorldContextAdapter) GetContextForWorld(worldID int) (string, []locationapp.WorldNodeForContext, error) {
  var premise string
  if err := a.db.QueryRow(`SELECT COALESCE(premise,'') FROM worlds WHERE id=$1`, worldID).Scan(&premise); err != nil {
    return "", nil, err
  }

  rows, err := a.db.Query(
    `SELECT domain, label, COALESCE(content->>'description',''), role
     FROM world_nodes WHERE world_id=$1`, worldID)
  if err != nil {
    return "", nil, err
  }
  defer rows.Close()

  var nodes []locationapp.WorldNodeForContext
  for rows.Next() {
    var n locationapp.WorldNodeForContext
    if err := rows.Scan(&n.Domain, &n.Label, &n.Description, &n.Role); err != nil {
      return "", nil, err
    }
    nodes = append(nodes, n)
  }
  return premise, nodes, rows.Err()
}

func (a *PgWorldContextAdapter) IsOwner(worldID, userID int) (bool, error) {
  var exists bool
  err := a.db.QueryRow(
    `SELECT EXISTS(SELECT 1 FROM worlds WHERE id=$1 AND owner_id=$2)`,
    worldID, userID).Scan(&exists)
  return exists, err
}
```

- [ ] **Step 5: Wire service in `cmd/server/main.go`**

```go
// Añadir imports:
locationapp "github.com/toniDefez/storyteller/internal/location/app"
locationinfra "github.com/toniDefez/storyteller/internal/location/infra"

// Antes de crear app:
locationNodeRepo := locationinfra.NewPgLocationNodeRepo(db)
locationEdgeRepo := locationinfra.NewPgLocationEdgeRepo(db)
worldCtxAdapter := locationinfra.NewPgWorldContextAdapter(db)
locationService := locationapp.NewService(locationNodeRepo, locationEdgeRepo, generationService, installationService, worldCtxAdapter)

// En app:
app := &api.Application{
  // ... existing fields ...
  LocationService: locationService,
}
```

- [ ] **Step 5: Build + run**

```bash
go build ./...
go run ./cmd/server
```

Expected: server starts on :8080 without errors.

- [ ] **Step 6: Commit**

```bash
git add internal/api/ internal/location/ cmd/server/main.go
git commit -m "feat(location): HTTP handlers + routing + wiring"
```

---

## Chunk 5: TypeScript Generator

**Repos:** storyteller-generator-v2

- [ ] **Step 1: Add types to `src/consumer/core/models/payloads.ts`**

```typescript
// Location graph generation
export interface LocationNodeForContext {
  label: string;
  description: string;
  role: string;
}

export interface LocationGeneratePayload {
  worldId: number;
  premise: string;
  nodesByDomain: Record<string, LocationNodeForContext[]>;
  nodeCountHint: number;
}

export interface LocationNodeResult {
  name: string;
  node_type: 'settlement' | 'wilderness' | 'ruin' | 'landmark' | 'threshold';
  description: string;
  properties: Record<string, unknown>;
  canvas_x: number;
  canvas_y: number;
}

export interface LocationEdgeResult {
  source_name: string;
  target_name: string;
  edge_type: 'road' | 'wilderness' | 'waterway';
  effort: 'easy' | 'moderate' | 'difficult';
  bidirectional: boolean;
  note: string;
}

export interface LocationGraphResult {
  nodes: LocationNodeResult[];
  edges: LocationEdgeResult[];
}
```

- [ ] **Step 2: Add to `src/consumer/core/models/generation.ts`**

```typescript
// En el enum GenerationType:
LocationGraph = 'location_graph',
```

- [ ] **Step 3: Create `src/internal/context/location_graph_generator/infra/OllamaLocationGraphGenerator.ts`**

```typescript
import { createOllama } from '../../shared/infra/OllamaFactory.js';
import { parseJsonFromLLM } from '../../shared/infra/parseJsonFromLLM.js';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import type {
  LocationGeneratePayload,
  LocationGraphResult,
  LocationNodeResult,
  LocationEdgeResult,
} from '../../../../consumer/core/models/payloads.js';

const VALID_NODE_TYPES = ['settlement', 'wilderness', 'ruin', 'landmark', 'threshold'] as const;
const VALID_EDGE_TYPES = ['road', 'wilderness', 'waterway'] as const;
const VALID_EFFORTS = ['easy', 'moderate', 'difficult'] as const;

function sanitizeNodes(raw: unknown[]): LocationNodeResult[] {
  return raw.map((n) => {
    const node = n as Record<string, unknown>;
    return {
      name: String(node.name ?? 'Localización'),
      node_type: VALID_NODE_TYPES.includes(node.node_type as any)
        ? (node.node_type as LocationNodeResult['node_type'])
        : 'settlement',
      description: String(node.description ?? ''),
      properties: (typeof node.properties === 'object' && node.properties !== null)
        ? (node.properties as Record<string, unknown>)
        : {},
      canvas_x: typeof node.canvas_x === 'number' ? node.canvas_x : 400,
      canvas_y: typeof node.canvas_y === 'number' ? node.canvas_y : 300,
    };
  });
}

function sanitizeEdges(raw: unknown[], nodeNames: Set<string>): LocationEdgeResult[] {
  const valid: LocationEdgeResult[] = [];
  for (const e of raw) {
    const edge = e as Record<string, unknown>;
    const src = String(edge.source_name ?? '');
    const tgt = String(edge.target_name ?? '');
    // Descartar aristas que referencian nodos inexistentes
    if (!nodeNames.has(src) || !nodeNames.has(tgt)) continue;
    valid.push({
      source_name: src,
      target_name: tgt,
      edge_type: VALID_EDGE_TYPES.includes(edge.edge_type as any)
        ? (edge.edge_type as LocationEdgeResult['edge_type'])
        : 'road',
      effort: VALID_EFFORTS.includes(edge.effort as any)
        ? (edge.effort as LocationEdgeResult['effort'])
        : 'moderate',
      bidirectional: edge.bidirectional !== false,
      note: String(edge.note ?? ''),
    });
  }
  return valid;
}

const PROMPT = ChatPromptTemplate.fromMessages([
  ['system', `Eres un generador de geografías narrativas. Generas grafos de localizaciones para mundos de ficción.
Tu respuesta debe ser SOLO JSON válido con esta estructura:
{{
  "nodes": [{{ "name": "...", "node_type": "settlement|wilderness|ruin|landmark|threshold", "description": "...", "properties": {{ "atmosphere": "...", "social_filter": "...", "behavioral_rule": "...", "control": "...", "duration": "permanent|temporary|declining|emerging" }}, "canvas_x": 0-800, "canvas_y": 0-600 }}],
  "edges": [{{ "source_name": "...", "target_name": "...", "edge_type": "road|wilderness|waterway", "effort": "easy|moderate|difficult", "bidirectional": true, "note": "..." }}]
}}

REGLAS:
- Genera entre {nodeCountHint} y {nodeCountHint} nodos
- Los asentamientos deben estar cerca de recursos físicos (agua, comida, protección)
- Las aristas tipo "waterway" deben seguir ríos y costas del contexto físico
- Las aristas tipo "wilderness" son pasos difíciles entre zonas
- Posiciona los nodos geográficamente (nodos fluviales alineados, desiertos en los márgenes)
- NUNCA inventes nodos que contradigan las propiedades causales del mundo
- Responde SOLO JSON, sin texto adicional`],
  ['human', `Premisa del mundo: {premise}

Propiedades causales del mundo (agrupadas por dominio):
{contextSummary}

Genera el grafo de localizaciones.`],
]);

export class OllamaLocationGraphGenerator {
  private readonly llm = createOllama(0.7, 2048, 'json');

  async generate(payload: LocationGeneratePayload): Promise<LocationGraphResult> {
    const contextSummary = Object.entries(payload.nodesByDomain)
      .map(([domain, nodes]) =>
        `[${domain.toUpperCase()}]\n` +
        nodes.map(n => `- ${n.label}: ${n.description}`).join('\n')
      )
      .join('\n\n');

    const chain = PROMPT.pipe(this.llm).pipe(new StringOutputParser());
    const raw = await chain.invoke({
      premise: payload.premise,
      contextSummary,
      nodeCountHint: payload.nodeCountHint,
    });

    const parsed = parseJsonFromLLM(raw) as Record<string, unknown>;
    const nodes = sanitizeNodes(Array.isArray(parsed.nodes) ? parsed.nodes : []);
    const nodeNames = new Set(nodes.map(n => n.name));
    const edges = sanitizeEdges(Array.isArray(parsed.edges) ? parsed.edges : [], nodeNames);

    return { nodes, edges };
  }
}
```

- [ ] **Step 4: Create `src/internal/context/location_graph_generator/app/LocationGraphGenerator.ts`**

```typescript
import type { LocationGeneratePayload, LocationGraphResult } from '../../../../consumer/core/models/payloads.js';
import { OllamaLocationGraphGenerator } from '../infra/OllamaLocationGraphGenerator.js';

export class LocationGraphGenerator {
  private readonly generator = new OllamaLocationGraphGenerator();

  async generate(payload: LocationGeneratePayload): Promise<LocationGraphResult> {
    return this.generator.generate(payload);
  }
}
```

- [ ] **Step 5: Add handler to `src/consumer/core/services/generation.ts`**

```typescript
import { LocationGraphGenerator } from '../../internal/context/location_graph_generator/app/LocationGraphGenerator.js';

export const handleLocationGraph: GenerationHandler = async (req) => {
  const payload = req.payload as LocationGeneratePayload;
  const generator = new LocationGraphGenerator();
  const result = await generator.generate(payload);
  return { result };
};
```

- [ ] **Step 6: Register in `src/consumer/dispatcher.ts`**

```typescript
import { handleLocationGraph } from './core/services/generation.js';

// En routes:
[GenerationType.LocationGraph]: handleLocationGraph,
```

- [ ] **Step 7: Create `tests/unit/location-graph.test.js`**

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Test sanitización de nodos
describe('location graph - sanitización de nodos', () => {
  it('asigna settlement por defecto a node_type inválido', () => {
    const raw = [{ name: 'Test', node_type: 'INVALID', description: 'desc', canvas_x: 100, canvas_y: 200, properties: {} }];
    const VALID = ['settlement', 'wilderness', 'ruin', 'landmark', 'threshold'];
    const result = raw.map(n => ({
      ...n,
      node_type: VALID.includes(n.node_type) ? n.node_type : 'settlement',
    }));
    assert.equal(result[0].node_type, 'settlement');
  });

  it('descarta aristas con nombres de nodos inexistentes', () => {
    const nodeNames = new Set(['Puerto A', 'Ciudad B']);
    const edges = [
      { source_name: 'Puerto A', target_name: 'Ciudad B' },
      { source_name: 'Puerto A', target_name: 'Lugar Fantasma' },
    ];
    const valid = edges.filter(e => nodeNames.has(e.source_name) && nodeNames.has(e.target_name));
    assert.equal(valid.length, 1);
    assert.equal(valid[0].target_name, 'Ciudad B');
  });

  it('canvas_x/y por defecto si no es número', () => {
    const raw = [{ name: 'Nodo', node_type: 'ruin', description: '', canvas_x: 'malo', canvas_y: null, properties: {} }];
    const result = raw.map(n => ({
      ...n,
      canvas_x: typeof n.canvas_x === 'number' ? n.canvas_x : 400,
      canvas_y: typeof n.canvas_y === 'number' ? n.canvas_y : 300,
    }));
    assert.equal(result[0].canvas_x, 400);
    assert.equal(result[0].canvas_y, 300);
  });
});
```

- [ ] **Step 8: Build + run tests**

```bash
cd storyteller-generator-v2
npm run build
npm test
```

Expected: build succeeds, new tests pass.

- [ ] **Step 9: Commit**

```bash
git add src/ tests/
git commit -m "feat(generator): location graph generation handler"
```

---

## Chunk 6: Frontend API + Hook

**Repos:** storytellerFrontMVP

- [ ] **Step 1: Add types + functions to `src/services/api.ts`**

After the existing `WorldNode` / `WorldGraph` types:

```typescript
export type LocationNodeType = 'settlement' | 'wilderness' | 'ruin' | 'landmark' | 'threshold'
export type LocationEdgeType = 'road' | 'wilderness' | 'waterway'
export type LocationEffort = 'easy' | 'moderate' | 'difficult'

export interface LocationNodeProperties {
  atmosphere?: string
  social_filter?: string
  behavioral_rule?: string
  control?: string
  duration?: 'permanent' | 'temporary' | 'declining' | 'emerging'
}

export interface LocationNode {
  id: number
  world_id: number
  name: string
  node_type: LocationNodeType
  description: string
  properties: LocationNodeProperties
  canvas_x: number
  canvas_y: number
}

export interface LocationEdge {
  id: number
  world_id: number
  source_node_id: number
  target_node_id: number
  edge_type: LocationEdgeType
  effort: LocationEffort
  bidirectional: boolean
  note: string
}

export interface LocationGraph {
  nodes: LocationNode[]
  edges: LocationEdge[]
}

export function getLocationGraph(worldId: number) {
  return request<LocationGraph>(`/location/graph?world_id=${worldId}`)
}

export function createLocationNode(node: Omit<LocationNode, 'id'>) {
  return request<LocationNode>('/location/nodes', { method: 'POST', body: JSON.stringify(node) })
}

export function updateLocationNode(id: number, data: Pick<LocationNode, 'name' | 'node_type' | 'description' | 'properties'>) {
  return request<void>(`/location/nodes/update?id=${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

export function updateLocationNodePosition(id: number, canvas_x: number, canvas_y: number) {
  return request<void>(`/location/nodes/position?id=${id}`, { method: 'PATCH', body: JSON.stringify({ canvas_x, canvas_y }) })
}

export function deleteLocationNode(id: number) {
  return request<void>(`/location/nodes/delete?id=${id}`, { method: 'DELETE' })
}

export function createLocationEdge(edge: Omit<LocationEdge, 'id'>) {
  return request<LocationEdge>('/location/edges', { method: 'POST', body: JSON.stringify(edge) })
}

export function updateLocationEdge(id: number, data: Pick<LocationEdge, 'edge_type' | 'effort' | 'bidirectional' | 'note'>) {
  return request<void>(`/location/edges/update?id=${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

export function deleteLocationEdge(id: number) {
  return request<void>(`/location/edges/delete?id=${id}`, { method: 'DELETE' })
}

export function generateLocationGraph(worldId: number, nodeCountHint = 12) {
  return request<LocationGraph>('/location/generate', {
    method: 'POST',
    body: JSON.stringify({ world_id: worldId, node_count_hint: nodeCountHint }),
  })
}
```

- [ ] **Step 2: Create `src/hooks/useLocationGraph.ts`**

```typescript
import { useState, useCallback } from 'react'
import type { LocationNode, LocationEdge } from '@/services/api'
import {
  getLocationGraph, createLocationNode, updateLocationNode,
  updateLocationNodePosition, deleteLocationNode,
  createLocationEdge, updateLocationEdge, deleteLocationEdge,
  generateLocationGraph,
} from '@/services/api'

export type SelectedLocation =
  | { type: 'node'; item: LocationNode }
  | { type: 'edge'; item: LocationEdge }
  | null

export function useLocationGraph(worldId: number | null) {
  const [nodes, setNodes] = useState<LocationNode[]>([])
  const [edges, setEdges] = useState<LocationEdge[]>([])
  const [selected, setSelected] = useState<SelectedLocation>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const loadGraph = useCallback(async () => {
    if (!worldId) return
    setLoading(true)
    try {
      const graph = await getLocationGraph(worldId)
      setNodes(graph.nodes)
      setEdges(graph.edges)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando localizaciones')
    } finally {
      setLoading(false)
    }
  }, [worldId])

  const generate = useCallback(async () => {
    if (!worldId) return
    setGenerating(true)
    setError('')
    try {
      const graph = await generateLocationGraph(worldId)
      setNodes(graph.nodes)
      setEdges(graph.edges)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error generando localizaciones')
    } finally {
      setGenerating(false)
    }
  }, [worldId])

  const addNode = useCallback(async (node: Omit<LocationNode, 'id'>) => {
    const created = await createLocationNode(node)
    setNodes(prev => [...prev, created])
    return created
  }, [])

  const editNode = useCallback(async (id: number, data: Pick<LocationNode, 'name' | 'node_type' | 'description' | 'properties'>) => {
    await updateLocationNode(id, data)
    setNodes(prev => prev.map(n => n.id === id ? { ...n, ...data } : n))
  }, [])

  const moveNode = useCallback(async (id: number, x: number, y: number) => {
    await updateLocationNodePosition(id, x, y)
    setNodes(prev => prev.map(n => n.id === id ? { ...n, canvas_x: x, canvas_y: y } : n))
  }, [])

  const removeNode = useCallback(async (id: number) => {
    await deleteLocationNode(id)
    setNodes(prev => prev.filter(n => n.id !== id))
    setEdges(prev => prev.filter(e => e.source_node_id !== id && e.target_node_id !== id))
    if (selected?.type === 'node' && selected.item.id === id) setSelected(null)
  }, [selected])

  const addEdge = useCallback(async (edge: Omit<LocationEdge, 'id'>) => {
    const created = await createLocationEdge(edge)
    setEdges(prev => [...prev, created])
    return created
  }, [])

  const editEdge = useCallback(async (id: number, data: Pick<LocationEdge, 'edge_type' | 'effort' | 'bidirectional' | 'note'>) => {
    await updateLocationEdge(id, data)
    setEdges(prev => prev.map(e => e.id === id ? { ...e, ...data } : e))
  }, [])

  const removeEdge = useCallback(async (id: number) => {
    await deleteLocationEdge(id)
    setEdges(prev => prev.filter(e => e.id !== id))
    if (selected?.type === 'edge' && selected.item.id === id) setSelected(null)
  }, [selected])

  return {
    nodes, edges, selected, setSelected,
    loading, generating, error,
    loadGraph, generate,
    addNode, editNode, moveNode, removeNode,
    addEdge, editEdge, removeEdge,
  }
}
```

- [ ] **Step 3: Build to verify types**

```bash
cd storytellerFrontMVP
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/services/api.ts src/hooks/useLocationGraph.ts
git commit -m "feat(location): API types + useLocationGraph hook"
```

---

## Chunk 7: Frontend Node + Edges

**Repos:** storytellerFrontMVP

- [ ] **Step 1: Create `src/components/world-graph/locationEdgeUtils.ts`**

Floating edge geometry — calculates where edges connect to node borders:

```typescript
import type { Node, Position } from '@xyflow/react'

interface EdgeParams {
  sx: number; sy: number; tx: number; ty: number
  sourcePos: Position; targetPos: Position
}

function getNodeCenter(node: Node) {
  return {
    x: node.internals?.positionAbsolute?.x ?? node.position.x + (node.measured?.width ?? 150) / 2,
    y: node.internals?.positionAbsolute?.y ?? node.position.y + (node.measured?.height ?? 60) / 2,
  }
}

function getIntersectionPoint(
  node: Node,
  intersectionPoint: { x: number; y: number }
): { x: number; y: number; position: Position } {
  const { Position } = require('@xyflow/react')
  const nx = node.internals?.positionAbsolute?.x ?? node.position.x
  const ny = node.internals?.positionAbsolute?.y ?? node.position.y
  const w = (node.measured?.width ?? 150) / 2
  const h = (node.measured?.height ?? 60) / 2
  const cx = nx + w
  const cy = ny + h

  const dx = intersectionPoint.x - cx
  const dy = intersectionPoint.y - cy

  if (Math.abs(dx / w) > Math.abs(dy / h)) {
    return dx > 0
      ? { x: cx + w, y: cy + dy * (w / Math.abs(dx)), position: Position.Right }
      : { x: cx - w, y: cy + dy * (w / Math.abs(dx)), position: Position.Left }
  } else {
    return dy > 0
      ? { x: cx + dx * (h / Math.abs(dy)), y: cy + h, position: Position.Bottom }
      : { x: cx + dx * (h / Math.abs(dy)), y: cy - h, position: Position.Top }
  }
}

export function getEdgeParams(source: Node, target: Node): EdgeParams {
  const sourceCenter = getNodeCenter(source)
  const targetCenter = getNodeCenter(target)
  const src = getIntersectionPoint(source, targetCenter)
  const tgt = getIntersectionPoint(target, sourceCenter)
  return {
    sx: src.x, sy: src.y,
    tx: tgt.x, ty: tgt.y,
    sourcePos: src.position,
    targetPos: tgt.position,
  }
}
```

Note: replace the `require` with a proper import of `Position` from `@xyflow/react`.

- [ ] **Step 2: Create `src/components/world-graph/LocationNode.tsx`**

```tsx
import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import type { LocationNodeType } from '@/services/api'

const NODE_ICONS: Record<LocationNodeType, string> = {
  settlement: '🏘',
  wilderness: '🌲',
  ruin: '🏚',
  landmark: '⛰',
  threshold: '🚪',
}

const NODE_TYPE_LABEL: Record<LocationNodeType, string> = {
  settlement: 'Asentamiento',
  wilderness: 'Naturaleza',
  ruin: 'Ruina',
  landmark: 'Punto de referencia',
  threshold: 'Paso',
}

export interface LocationNodeData {
  name: string
  node_type: LocationNodeType
  description: string
  isSelected?: boolean
}

export const LocationNode = memo(function LocationNode({ data }: NodeProps) {
  const d = data as LocationNodeData

  return (
    <div
      className={`
        rounded-xl border bg-background shadow-sm min-w-[140px] max-w-[180px]
        transition-all duration-150
        ${d.isSelected
          ? 'border-[#14b8a6] shadow-[0_0_0_2px_#14b8a620]'
          : 'border-border/60 hover:border-[#14b8a6]/50'}
      `}
    >
      {/* Barra teal superior */}
      <div className="h-[3px] rounded-t-xl bg-[#14b8a6]" />

      {/* Contenido */}
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-sm">{NODE_ICONS[d.node_type]}</span>
          <span className="text-[10px] uppercase tracking-widest text-[#14b8a6] font-semibold">
            {NODE_TYPE_LABEL[d.node_type]}
          </span>
        </div>
        <div className="font-semibold text-sm text-foreground leading-tight">{d.name}</div>
        {d.description && (
          <p className="text-[11px] text-muted-foreground mt-1 leading-snug line-clamp-2">
            {d.description}
          </p>
        )}
      </div>
    </div>
  )
})
```

- [ ] **Step 3: Create `src/components/world-graph/LocationEdges.tsx`**

```tsx
import { memo } from 'react'
import {
  BaseEdge,
  getBezierPath,
  EdgeLabelRenderer,
  useInternalNode,
  MarkerType,
  type EdgeProps,
} from '@xyflow/react'
import { getEdgeParams } from './locationEdgeUtils'
import type { LocationEffort } from '@/services/api'

interface LocationEdgeData {
  effort: LocationEffort
  bidirectional: boolean
  note?: string
}

const EFFORT_LABEL: Record<LocationEffort, string> = {
  easy: 'Fácil',
  moderate: 'Moderado',
  difficult: 'Difícil',
}

const EFFORT_COLOR: Record<LocationEffort, string> = {
  easy: '#0f766e',
  moderate: '#0e7490',
  difficult: '#92400e',
}

function FloatingLocationEdge({
  id, source, target, data, selected,
  style = {},
}: EdgeProps & { data: LocationEdgeData; stroke: string; dashArray?: string }) {
  const sourceNode = useInternalNode(source)
  const targetNode = useInternalNode(target)

  if (!sourceNode || !targetNode) return null

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(sourceNode as any, targetNode as any)
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX: sx, sourceY: sy, sourcePosition: sourcePos, targetX: tx, targetY: ty, targetPosition: targetPos })

  const d = data as LocationEdgeData
  const effort: LocationEffort = d?.effort ?? 'moderate'

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={d?.bidirectional === false ? `url(#arrow-${id})` : undefined}
        style={{
          ...style,
          strokeWidth: selected ? 2.5 : 1.5,
          filter: selected ? 'drop-shadow(0 0 4px currentColor)' : undefined,
        }}
      />
      {selected && d?.note && (
        <EdgeLabelRenderer>
          <div
            style={{ transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)` }}
            className="absolute text-[10px] bg-background border border-border rounded px-1.5 py-0.5 pointer-events-none"
          >
            {d.note}
          </div>
        </EdgeLabelRenderer>
      )}
      <EdgeLabelRenderer>
        <div
          style={{
            transform: `translate(-50%,-50%) translate(${labelX}px,${labelY + 14}px)`,
            color: EFFORT_COLOR[effort],
          }}
          className="absolute text-[9px] font-semibold pointer-events-none bg-background/80 px-1 rounded"
        >
          {EFFORT_LABEL[effort]}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

export const WaterwayEdge = memo((props: EdgeProps) => (
  <FloatingLocationEdge
    {...props}
    data={props.data as LocationEdgeData}
    stroke="#14b8a6"
    dashArray="8,5"
    style={{ stroke: '#14b8a6', strokeDasharray: '8,5' }}
  />
))

export const WildernessEdge = memo((props: EdgeProps) => (
  <FloatingLocationEdge
    {...props}
    data={props.data as LocationEdgeData}
    stroke="#92400e"
    dashArray="5,7"
    style={{ stroke: '#92400e', strokeDasharray: '5,7' }}
  />
))

export const RoadEdge = memo((props: EdgeProps) => (
  <FloatingLocationEdge
    {...props}
    data={props.data as LocationEdgeData}
    stroke="#14b8a6"
    style={{ stroke: '#14b8a6' }}
  />
))
```

- [ ] **Step 4: Build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/world-graph/locationEdgeUtils.ts \
        src/components/world-graph/LocationNode.tsx \
        src/components/world-graph/LocationEdges.tsx
git commit -m "feat(location): LocationNode + custom floating edges"
```

---

## Chunk 8: Frontend Side Panels

**Repos:** storytellerFrontMVP

- [ ] **Step 1: Create `src/components/world-graph/LocationNodeDetailPanel.tsx`**

```tsx
import { useState } from 'react'
import { ChevronDown, ChevronRight, Trash2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { LocationNode } from '@/services/api'

interface Props {
  node: LocationNode
  connectedNodes: LocationNode[]
  onEdit: (node: LocationNode) => void
  onDelete: (id: number) => void
  onClose: () => void
}

export function LocationNodeDetailPanel({ node, connectedNodes, onEdit, onDelete, onClose }: Props) {
  const [storyLayerOpen, setStoryLayerOpen] = useState(false)
  const p = node.properties

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <span className="text-xs uppercase tracking-widest text-[#14b8a6] font-semibold">
          {node.node_type}
        </span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <h3 className="font-[var(--font-display)] text-lg font-semibold">{node.name}</h3>

        {node.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{node.description}</p>
        )}

        {connectedNodes.length > 0 && (
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Conexiones</div>
            <div className="flex flex-wrap gap-1.5">
              {connectedNodes.map(n => (
                <span key={n.id} className="text-xs bg-[#14b8a6]/10 text-[#0f766e] border border-[#14b8a6]/20 px-2 py-0.5 rounded-full">
                  {n.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Capa narrativa colapsable */}
        {(p.atmosphere || p.social_filter || p.behavioral_rule || p.control || p.duration) && (
          <div className="border border-border/50 rounded-lg overflow-hidden">
            <button
              onClick={() => setStoryLayerOpen(o => !o)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-muted-foreground hover:bg-accent/30 transition-colors"
            >
              <span>Capa narrativa</span>
              {storyLayerOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {storyLayerOpen && (
              <div className="px-3 pb-3 pt-1 space-y-2">
                {p.atmosphere && <div className="text-xs"><span className="text-muted-foreground">👃 </span><span className="italic">{p.atmosphere}</span></div>}
                {p.social_filter && <div className="text-xs"><span className="text-muted-foreground">👥 </span>{p.social_filter}</div>}
                {p.behavioral_rule && <div className="text-xs"><span className="text-muted-foreground">🚫 </span>{p.behavioral_rule}</div>}
                {p.control && <div className="text-xs"><span className="text-muted-foreground">👑 </span>{p.control}</div>}
                {p.duration && <div className="text-xs"><span className="text-muted-foreground">⏳ </span>{p.duration}</div>}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border/50 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => onEdit(node)}>
          <Pencil className="w-3.5 h-3.5" /> Editar
        </Button>
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => onDelete(node.id)}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/world-graph/LocationEdgeDetailPanel.tsx`**

```tsx
import { useState } from 'react'
import { Trash2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { LocationEdge, LocationEdgeType, LocationEffort } from '@/services/api'

interface Props {
  edge: LocationEdge
  sourceNode?: { name: string }
  targetNode?: { name: string }
  onUpdate: (id: number, data: Pick<LocationEdge, 'edge_type' | 'effort' | 'bidirectional' | 'note'>) => Promise<void>
  onDelete: (id: number) => void
  onClose: () => void
}

const EDGE_TYPE_LABELS: Record<LocationEdgeType, string> = {
  road: 'Camino',
  wilderness: 'Naturaleza',
  waterway: 'Vía fluvial',
}

const EFFORT_LABELS: Record<LocationEffort, string> = {
  easy: 'Fácil',
  moderate: 'Moderado',
  difficult: 'Difícil',
}

export function LocationEdgeDetailPanel({ edge, sourceNode, targetNode, onUpdate, onDelete, onClose }: Props) {
  const [effort, setEffort] = useState<LocationEffort>(edge.effort)
  const [edgeType, setEdgeType] = useState<LocationEdgeType>(edge.edge_type)
  const [bidirectional, setBidirectional] = useState(edge.bidirectional)
  const [note, setNote] = useState(edge.note ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onUpdate(edge.id, { edge_type: edgeType, effort, bidirectional, note })
    setSaving(false)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <span className="text-xs uppercase tracking-widest text-[#14b8a6] font-semibold">Conexión</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {sourceNode && targetNode && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{sourceNode.name}</span>
            <span>{bidirectional ? '↔' : '→'}</span>
            <span>{targetNode.name}</span>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Tipo de ruta</label>
            <div className="flex gap-1.5">
              {(['road', 'wilderness', 'waterway'] as LocationEdgeType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setEdgeType(t)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${edgeType === t ? 'bg-[#14b8a6] text-white border-[#14b8a6]' : 'border-border text-muted-foreground hover:border-[#14b8a6]/50'}`}
                >
                  {EDGE_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Dificultad</label>
            <div className="flex gap-1.5">
              {(['easy', 'moderate', 'difficult'] as LocationEffort[]).map(e => (
                <button
                  key={e}
                  onClick={() => setEffort(e)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${effort === e ? 'bg-[#14b8a6] text-white border-[#14b8a6]' : 'border-border text-muted-foreground hover:border-[#14b8a6]/50'}`}
                >
                  {EFFORT_LABELS[e]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="bidir" checked={bidirectional} onChange={e => setBidirectional(e.target.checked)} className="w-3.5 h-3.5" />
            <label htmlFor="bidir" className="text-xs text-muted-foreground">Bidireccional</label>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Nota (opcional)</label>
            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Este paso cierra en invierno..."
              className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-background focus:outline-none focus:border-[#14b8a6]"
            />
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-border/50 flex gap-2">
        <Button size="sm" className="flex-1 gap-1.5 bg-[#14b8a6] hover:bg-[#0f766e]" onClick={handleSave} disabled={saving}>
          <Save className="w-3.5 h-3.5" /> {saving ? 'Guardando...' : 'Guardar'}
        </Button>
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => onDelete(edge.id)}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `src/components/world-graph/LocationSidePanel.tsx`**

```tsx
import type { LocationNode, LocationEdge } from '@/services/api'
import type { SelectedLocation } from '@/hooks/useLocationGraph'
import { LocationNodeDetailPanel } from './LocationNodeDetailPanel'
import { LocationEdgeDetailPanel } from './LocationEdgeDetailPanel'

interface Props {
  selected: SelectedLocation
  nodes: LocationNode[]
  edges: LocationEdge[]
  onEditNode: (node: LocationNode) => void
  onDeleteNode: (id: number) => void
  onUpdateEdge: (id: number, data: Pick<LocationEdge, 'edge_type' | 'effort' | 'bidirectional' | 'note'>) => Promise<void>
  onDeleteEdge: (id: number) => void
  onClose: () => void
}

export function LocationSidePanel({ selected, nodes, edges, onEditNode, onDeleteNode, onUpdateEdge, onDeleteEdge, onClose }: Props) {
  if (!selected) return (
    <div className="w-64 border-l border-border/50 flex flex-col items-center justify-center gap-3 p-6">
      <p className="text-sm text-muted-foreground italic text-center">
        Selecciona una localización o conexión para ver sus detalles
      </p>
      <button
        onClick={() => onEditNode({ id: 0 } as LocationNode)} // triggers "add" flow in canvas
        className="text-xs px-3 py-1.5 rounded-lg border border-[#14b8a6]/50 text-[#14b8a6] hover:bg-[#14b8a6]/10 transition-colors"
      >
        + Añadir localización
      </button>
    </div>
  )

  if (selected.type === 'node') {
    const node = selected.item
    const connectedIds = new Set(
      edges.filter(e => e.source_node_id === node.id || e.target_node_id === node.id)
           .map(e => e.source_node_id === node.id ? e.target_node_id : e.source_node_id)
    )
    const connectedNodes = nodes.filter(n => connectedIds.has(n.id))

    return (
      <div className="w-72 border-l border-border/50 overflow-hidden">
        <LocationNodeDetailPanel
          node={node}
          connectedNodes={connectedNodes}
          onEdit={onEditNode}
          onDelete={onDeleteNode}
          onClose={onClose}
        />
      </div>
    )
  }

  const edge = selected.item
  const sourceNode = nodes.find(n => n.id === edge.source_node_id)
  const targetNode = nodes.find(n => n.id === edge.target_node_id)

  return (
    <div className="w-72 border-l border-border/50 overflow-hidden">
      <LocationEdgeDetailPanel
        edge={edge}
        sourceNode={sourceNode}
        targetNode={targetNode}
        onUpdate={onUpdateEdge}
        onDelete={onDeleteEdge}
        onClose={onClose}
      />
    </div>
  )
}
```

- [ ] **Step 4: Create `src/components/world-graph/EdgeFormDialog.tsx`**

A modal dialog that appears when the user draws a connection between two nodes. User picks `edge_type` + `effort` + `bidirectional`, then confirms to save.

```tsx
import { useState } from 'react'
import type { LocationEdgeType, LocationEffort } from '@/services/api'
import { Button } from '@/components/ui/button'

interface Props {
  open: boolean
  onConfirm: (edgeType: LocationEdgeType, effort: LocationEffort, bidirectional: boolean) => void
  onCancel: () => void
}

const EDGE_TYPES: { value: LocationEdgeType; label: string }[] = [
  { value: 'road', label: 'Camino' },
  { value: 'wilderness', label: 'Naturaleza' },
  { value: 'waterway', label: 'Vía fluvial' },
]

const EFFORTS: { value: LocationEffort; label: string }[] = [
  { value: 'easy', label: 'Fácil' },
  { value: 'moderate', label: 'Moderado' },
  { value: 'difficult', label: 'Difícil' },
]

export function EdgeFormDialog({ open, onConfirm, onCancel }: Props) {
  const [edgeType, setEdgeType] = useState<LocationEdgeType>('road')
  const [effort, setEffort] = useState<LocationEffort>('moderate')
  const [bidirectional, setBidirectional] = useState(true)

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-xl p-5 max-w-xs w-full mx-4 shadow-xl space-y-4">
        <h3 className="font-semibold text-sm">Nueva conexión</h3>

        <div>
          <label className="text-xs text-muted-foreground block mb-1.5">Tipo de ruta</label>
          <div className="flex gap-1.5">
            {EDGE_TYPES.map(t => (
              <button key={t.value} onClick={() => setEdgeType(t.value)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${edgeType === t.value ? 'bg-[#14b8a6] text-white border-[#14b8a6]' : 'border-border text-muted-foreground hover:border-[#14b8a6]/50'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-1.5">Dificultad</label>
          <div className="flex gap-1.5">
            {EFFORTS.map(e => (
              <button key={e.value} onClick={() => setEffort(e.value)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${effort === e.value ? 'bg-[#14b8a6] text-white border-[#14b8a6]' : 'border-border text-muted-foreground hover:border-[#14b8a6]/50'}`}>
                {e.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="ef-bidir" checked={bidirectional} onChange={e => setBidirectional(e.target.checked)} className="w-3.5 h-3.5" />
          <label htmlFor="ef-bidir" className="text-xs text-muted-foreground">Bidireccional</label>
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <Button variant="outline" size="sm" onClick={onCancel}>Cancelar</Button>
          <Button size="sm" className="bg-[#14b8a6] hover:bg-[#0f766e]"
            onClick={() => onConfirm(edgeType, effort, bidirectional)}>
            Añadir
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/world-graph/LocationNodeDetailPanel.tsx \
        src/components/world-graph/LocationEdgeDetailPanel.tsx \
        src/components/world-graph/LocationSidePanel.tsx \
        src/components/world-graph/EdgeFormDialog.tsx
git commit -m "feat(location): node + edge detail panels + edge form dialog"
```

---

## Chunk 9: LocationGraphCanvas + WorldDetailPage Tab

**Repos:** storytellerFrontMVP

- [ ] **Step 1: Create `src/components/world-graph/LocationGraphCanvas.tsx`**

```tsx
import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  MarkerType,
  type Node,
  type Edge,
  type Connection,
  type OnConnect,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { LocationNode } from './LocationNode'
import type { LocationNodeData } from './LocationNode'
import { WaterwayEdge, WildernessEdge, RoadEdge } from './LocationEdges'
import { LocationSidePanel } from './LocationSidePanel'
import type { LocationNode as LocationNodeType, LocationEdge as LocationEdgeType } from '@/services/api'
import type { SelectedLocation } from '@/hooks/useLocationGraph'

// Definir fuera del componente para evitar re-renders
const nodeTypes = { location: LocationNode }
const edgeTypes = { waterway: WaterwayEdge, wilderness: WildernessEdge, road: RoadEdge }

interface Props {
  worldId: number | null
  nodes: LocationNodeType[]
  edges: LocationEdgeType[]
  selected: SelectedLocation
  onSelectNode: (node: LocationNodeType | null) => void
  onSelectEdge: (edge: LocationEdgeType | null) => void
  onMoveNode: (id: number, x: number, y: number) => Promise<void>
  onConnect: (source: number, target: number) => Promise<void>
  onEditNode: (node: LocationNodeType) => void
  onDeleteNode: (id: number) => void
  onUpdateEdge: (id: number, data: Pick<LocationEdgeType, 'edge_type' | 'effort' | 'bidirectional' | 'note'>) => Promise<void>
  onDeleteEdge: (id: number) => void
  onGenerate: () => void
  generating: boolean
}

function buildFlowNodes(locationNodes: LocationNodeType[], selectedId?: number): Node<LocationNodeData>[] {
  return locationNodes.map(n => ({
    id: String(n.id),
    type: 'location',
    position: { x: n.canvas_x, y: n.canvas_y },
    data: {
      name: n.name,
      node_type: n.node_type,
      description: n.description,
      isSelected: n.id === selectedId,
    },
  }))
}

function buildFlowEdges(locationEdges: LocationEdgeType[], selectedId?: number): Edge[] {
  return locationEdges.map(e => ({
    id: String(e.id),
    source: String(e.source_node_id),
    target: String(e.target_node_id),
    type: e.edge_type,
    selected: e.id === selectedId,
    data: { effort: e.effort, bidirectional: e.bidirectional, note: e.note },
    markerEnd: e.bidirectional ? undefined : { type: MarkerType.ArrowClosed, color: '#14b8a6' },
  }))
}

export function LocationGraphCanvas({
  worldId, nodes: locationNodes, edges: locationEdges,
  selected, onSelectNode, onSelectEdge,
  onMoveNode, onConnect: onConnectProp,
  onEditNode, onDeleteNode, onUpdateEdge, onDeleteEdge,
  onGenerate, generating,
}: Props) {
  const selectedNodeId = selected?.type === 'node' ? selected.item.id : undefined
  const selectedEdgeId = selected?.type === 'edge' ? selected.item.id : undefined

  const flowNodes = useMemo(() => buildFlowNodes(locationNodes, selectedNodeId), [locationNodes, selectedNodeId])
  const flowEdges = useMemo(() => buildFlowEdges(locationEdges, selectedEdgeId), [locationEdges, selectedEdgeId])

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges)

  useEffect(() => { setNodes(flowNodes) }, [flowNodes, setNodes])
  useEffect(() => { setEdges(flowEdges) }, [flowEdges, setEdges])

  const dragTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleNodeDragStop = useCallback((_: React.MouseEvent, node: Node) => {
    const id = Number(node.id)
    if (dragTimer.current) clearTimeout(dragTimer.current)
    dragTimer.current = setTimeout(() => {
      onMoveNode(id, node.position.x, node.position.y)
    }, 500)
  }, [onMoveNode])

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const loc = locationNodes.find(n => n.id === Number(node.id))
    if (!loc) return
    onSelectNode(selected?.type === 'node' && selected.item.id === loc.id ? null : loc)
  }, [locationNodes, selected, onSelectNode])

  const handleEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    const loc = locationEdges.find(e => e.id === Number(edge.id))
    if (!loc) return
    onSelectEdge(selected?.type === 'edge' && selected.item.id === loc.id ? null : loc)
  }, [locationEdges, selected, onSelectEdge])

  const handleConnect: OnConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return
    if (connection.source === connection.target) return
    onConnectProp(Number(connection.source), Number(connection.target))
  }, [onConnectProp])

  const handlePaneClick = useCallback(() => {
    onSelectNode(null)
  }, [onSelectNode])

  const selectedItem = selected?.type === 'node'
    ? selected.item
    : selected?.type === 'edge' ? selected.item : null

  if (locationNodes.length === 0) {
    return (
      <div className="flex h-full">
        <div className="flex-1 flex items-center justify-center bg-[hsl(180_8%_97%)] text-center p-8">
          <div className="space-y-3 max-w-xs">
            <p className="text-sm text-muted-foreground font-[var(--font-display)] italic">
              El mapa está vacío
            </p>
            <p className="text-xs text-muted-foreground">
              Genera las localizaciones a partir del grafo causal de tu mundo
            </p>
            {worldId != null && (
              <button
                onClick={onGenerate}
                disabled={generating}
                className="text-xs text-[#14b8a6] underline underline-offset-2 hover:text-[#0f766e] transition-colors disabled:opacity-50"
              >
                {generating ? 'Generando...' : 'Generar desde el grafo causal →'}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 relative min-w-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          onNodeDragStop={handleNodeDragStop}
          onConnect={handleConnect}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionMode={ConnectionMode.Loose}
          nodesDraggable={true}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          className="bg-[hsl(180_8%_97%)]"
        >
          <Background color="#c8d5d5" gap={24} size={1} />
          <Controls />
          <MiniMap
            nodeColor="#14b8a6"
            className="!bg-background/90 !border-border/50"
          />
          {/* Botón regenerar en toolbar */}
          <div className="absolute top-2 right-2 z-10">
            <button
              onClick={onGenerate}
              disabled={generating}
              className="text-xs bg-background border border-border rounded-lg px-3 py-1.5 hover:border-[#14b8a6] text-muted-foreground hover:text-[#14b8a6] transition-colors disabled:opacity-50"
            >
              {generating ? 'Generando...' : '↺ Regenerar'}
            </button>
          </div>
        </ReactFlow>
      </div>

      <LocationSidePanel
        selected={selected}
        nodes={locationNodes}
        edges={locationEdges}
        onEditNode={onEditNode}
        onDeleteNode={onDeleteNode}
        onUpdateEdge={onUpdateEdge}
        onDeleteEdge={onDeleteEdge}
        onClose={() => { onSelectNode(null) }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Modify `src/pages/home/WorldDetailPage.tsx` — add tab state**

Find the section where `CausalTreeCanvas` is rendered. Add before it:

```tsx
// 1. Import at top of file:
import { useState } from 'react' // (may already exist)
import { LocationGraphCanvas } from '@/components/world-graph/LocationGraphCanvas'
import { EdgeFormDialog } from '@/components/world-graph/EdgeFormDialog'
import { useLocationGraph } from '@/hooks/useLocationGraph'

// 2. Inside component, after worldId is available:
const [graphView, setGraphView] = useState<'causal' | 'locations'>('causal')
// Pending connection: set when user draws an edge; EdgeFormDialog completes it
const [pendingConn, setPendingConn] = useState<{ src: number; tgt: number } | null>(null)
// Regenerate confirmation
const [confirmRegen, setConfirmRegen] = useState(false)

const {
  nodes: locationNodes, edges: locationEdges,
  selected: locationSelected, setSelected: setLocationSelected,
  loading: locationLoading, generating: locationGenerating,
  loadGraph: loadLocationGraph, generate: generateLocations,
  moveNode, addEdge, editNode, removeNode,
  editEdge, removeEdge,
} = useLocationGraph(worldId)

// 3. Load location graph on mount:
useEffect(() => {
  if (worldId) loadLocationGraph()
}, [worldId, loadLocationGraph])

// 4. Replace the single <CausalTreeCanvas> with:
```

```tsx
<div className="flex flex-col h-full">
  {/* Tab switcher */}
  <div className="flex border-b border-border/50 bg-background px-4 gap-0">
    <button
      onClick={() => setGraphView('causal')}
      className={`text-xs font-medium px-4 py-2.5 border-b-2 transition-colors ${
        graphView === 'causal'
          ? 'border-primary text-primary'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      Grafo Causal
    </button>
    <button
      onClick={() => setGraphView('locations')}
      className={`text-xs font-medium px-4 py-2.5 border-b-2 transition-colors ${
        graphView === 'locations'
          ? 'border-[#14b8a6] text-[#14b8a6]'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      Localizaciones
    </button>
  </div>

  {/* Canvases — ambos montados, solo uno visible */}
  <div className="flex-1 relative overflow-hidden">
    <div
      style={{
        position: 'absolute', inset: 0,
        visibility: graphView === 'causal' ? 'visible' : 'hidden',
        pointerEvents: graphView === 'causal' ? 'auto' : 'none',
      }}
    >
      <CausalTreeCanvas {/* ...existing props... */} />
    </div>

    <div
      style={{
        position: 'absolute', inset: 0,
        visibility: graphView === 'locations' ? 'visible' : 'hidden',
        pointerEvents: graphView === 'locations' ? 'auto' : 'none',
      }}
    >
      <LocationGraphCanvas
        worldId={worldId}
        nodes={locationNodes}
        edges={locationEdges}
        selected={locationSelected}
        onSelectNode={node => setLocationSelected(node ? { type: 'node', item: node } : null)}
        onSelectEdge={edge => setLocationSelected(edge ? { type: 'edge', item: edge } : null)}
        onMoveNode={moveNode}
        onConnect={(src, tgt) => setPendingConn({ src, tgt })}
        onEditNode={editNode}
        onDeleteNode={removeNode}
        onUpdateEdge={editEdge}
        onDeleteEdge={removeEdge}
        onGenerate={() => setConfirmRegen(true)}
        generating={locationGenerating}
      />
    </div>
  </div>
</div>

{/* EdgeFormDialog — opens when user draws a new connection */}
<EdgeFormDialog
  open={pendingConn !== null}
  onConfirm={(edgeType, effort, bidirectional) => {
    if (pendingConn && worldId) {
      addEdge({
        world_id: worldId,
        source_node_id: pendingConn.src,
        target_node_id: pendingConn.tgt,
        edge_type: edgeType,
        effort,
        bidirectional,
        note: '',
      })
    }
    setPendingConn(null)
  }}
  onCancel={() => setPendingConn(null)}
/>

{/* Regenerate confirmation dialog */}
{confirmRegen && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-background border border-border rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
      <h3 className="font-semibold text-base mb-2">¿Regenerar el mapa?</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Se eliminará el mapa actual y se generará uno nuevo desde el grafo causal.
      </p>
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => setConfirmRegen(false)}
          className="text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-accent"
        >
          Cancelar
        </button>
        <button
          onClick={() => { setConfirmRegen(false); generateLocations() }}
          className="text-sm px-3 py-1.5 rounded-lg bg-[#14b8a6] text-white hover:bg-[#0f766e]"
        >
          Regenerar
        </button>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 4: Dev server smoke test**

```bash
npm run dev
```

Open http://localhost:5173, navigate to a world detail page. Verify:
- [ ] Tab switcher visible (Grafo Causal | Localizaciones)
- [ ] Switching tabs doesn't lose viewport state on the causal graph
- [ ] Locations tab shows empty state with "Generar" button when no nodes exist

- [ ] **Step 5: Commit**

```bash
git add src/components/world-graph/LocationGraphCanvas.tsx \
        src/pages/home/WorldDetailPage.tsx
git commit -m "feat(location): LocationGraphCanvas + tab switcher in WorldDetailPage"
```

---

## Chunk 10: Generate service + i18n

**Repos:** storytellerMVP + storytellerFrontMVP

- [ ] **Step 1: Implement `Service.Generate` in `internal/location/app/service.go`**

Add this method (requires access to world nodes — wire `WorldCtx` in main.go):

```go
func (s *Service) Generate(ctx context.Context, userID, worldID, nodeCountHint int) (domain.LocationGraph, error) {
  // Verificar instalación del usuario
  inst, err := s.InstallSvc.GetInstallationByUserID(ctx, userID)
  if err != nil {
    return domain.LocationGraph{}, fmt.Errorf("instalación no encontrada: %w", err)
  }

  // Obtener premisa + nodos causales del mundo agrupados por dominio
  premise, worldNodes, err := s.WorldCtx.GetContextForWorld(worldID)
  if err != nil {
    return domain.LocationGraph{}, err
  }

  // Agrupar nodos por dominio
  nodesByDomain := map[string][]generationdomain.LocationNodeForContext{}
  for _, n := range worldNodes {
    nodesByDomain[n.Domain] = append(nodesByDomain[n.Domain], generationdomain.LocationNodeForContext{
      Label: n.Label, Description: n.Description, Role: n.Role,
    })
  }

  payload := generationdomain.LocationGeneratePayload{
    WorldID: worldID, Premise: premise,
    NodesByDomain: nodesByDomain, NodeCountHint: nodeCountHint,
  }

  payloadJSON, err := json.Marshal(payload)
  if err != nil {
    return domain.LocationGraph{}, err
  }

  raw, err := s.GenSvc.CreateAndPublish(ctx, &generationdomain.GenerationRequest{
    Type:         generationdomain.GenerationTypeLocationGraph,
    Payload:      payloadJSON,
    ChannelID:    inst.ChannelID,
    CorrelationID: uuid.New().String(),
  })
  if err != nil {
    return domain.LocationGraph{}, err
  }

  var result generationdomain.LocationGraphResult
  if err := json.Unmarshal(raw, &result); err != nil {
    return domain.LocationGraph{}, err
  }

  return s.saveGeneratedGraph(ctx, worldID, result)
}

func (s *Service) saveGeneratedGraph(ctx context.Context, worldID int, result generationdomain.LocationGraphResult) (domain.LocationGraph, error) {
  // Insertar nodos, construir name→id map, insertar aristas
  nameToID := map[string]int{}
  var savedNodes []domain.LocationNode

  for _, nr := range result.Nodes {
    node := domain.LocationNode{
      WorldID: worldID, Name: nr.Name,
      NodeType: domain.LocationNodeType(nr.NodeType),
      Description: nr.Description, Properties: nr.Properties,
      CanvasX: nr.CanvasX, CanvasY: nr.CanvasY,
    }
    id, err := s.NodeRepo.Create(&node)
    if err != nil { continue } // skip duplicates
    node.ID = id
    nameToID[nr.Name] = id
    savedNodes = append(savedNodes, node)
  }

  var savedEdges []domain.LocationEdge
  for _, er := range result.Edges {
    src, okSrc := nameToID[er.SourceName]
    tgt, okTgt := nameToID[er.TargetName]
    if !okSrc || !okTgt { continue } // skip unresolved
    edge := domain.LocationEdge{
      WorldID: worldID, SourceNodeID: src, TargetNodeID: tgt,
      EdgeType: domain.LocationEdgeType(er.EdgeType),
      Effort: domain.LocationEffort(er.Effort),
      Bidirectional: er.Bidirectional, Note: er.Note,
    }
    id, err := s.EdgeRepo.Create(&edge)
    if err != nil { continue }
    edge.ID = id
    savedEdges = append(savedEdges, edge)
  }

  return domain.LocationGraph{Nodes: savedNodes, Edges: savedEdges}, nil
}
```

- [ ] **Step 2: Add i18n keys to `src/i18n/locales/es.json`**

```json
"location": {
  "tabLabel": "Localizaciones",
  "emptyTitle": "El mapa está vacío",
  "emptyDescription": "Genera las localizaciones a partir del grafo causal de tu mundo",
  "generateButton": "Generar desde el grafo causal →",
  "regenerateButton": "↺ Regenerar",
  "generating": "Generando...",
  "nodeType": {
    "settlement": "Asentamiento",
    "wilderness": "Naturaleza",
    "ruin": "Ruina",
    "landmark": "Punto de referencia",
    "threshold": "Paso"
  },
  "edgeType": {
    "road": "Camino",
    "wilderness": "Naturaleza",
    "waterway": "Vía fluvial"
  },
  "effort": {
    "easy": "Fácil",
    "moderate": "Moderado",
    "difficult": "Difícil"
  },
  "storyLayer": "Capa narrativa",
  "connections": "Conexiones",
  "saveEdge": "Guardar",
  "editNode": "Editar"
}
```

- [ ] **Step 3: Add same keys to `src/i18n/locales/en.json`**

```json
"location": {
  "tabLabel": "Locations",
  "emptyTitle": "The map is empty",
  "emptyDescription": "Generate locations from your world's causal graph",
  "generateButton": "Generate from causal graph →",
  "regenerateButton": "↺ Regenerate",
  "generating": "Generating...",
  "nodeType": {
    "settlement": "Settlement",
    "wilderness": "Wilderness",
    "ruin": "Ruin",
    "landmark": "Landmark",
    "threshold": "Threshold"
  },
  "edgeType": {
    "road": "Road",
    "wilderness": "Wilderness",
    "waterway": "Waterway"
  },
  "effort": {
    "easy": "Easy",
    "moderate": "Moderate",
    "difficult": "Difficult"
  },
  "storyLayer": "Story layer",
  "connections": "Connections",
  "saveEdge": "Save",
  "editNode": "Edit"
}
```

- [ ] **Step 4: Final build — all repos**

```bash
# Go backend
cd storytellerMVP && go build ./... && go test ./...

# TS generator
cd storyteller-generator-v2 && npm run build && npm test

# Frontend
cd storytellerFrontMVP && npm run build && npm run lint
```

Expected: all pass.

- [ ] **Step 5: Final commit**

```bash
# storytellerMVP
git add internal/location/app/service.go
git commit -m "feat(location): Generate service method + world context wiring"

# storytellerFrontMVP
git add src/i18n/
git commit -m "feat(location): i18n keys for location graph"
```

---

## Summary

| Chunk | Repo | Deliverable |
|-------|------|-------------|
| 0 | storytellerMVP | DB tables |
| 1 | storytellerMVP | Domain model + pg/mock repos |
| 2 | storytellerMVP | Service + tests |
| 3 | storytellerMVP | Payload types + GenerationType |
| 4 | storytellerMVP | HTTP handlers + routes |
| 5 | storyteller-generator-v2 | Location graph generator + tests |
| 6 | storytellerFrontMVP | API types + useLocationGraph hook |
| 7 | storytellerFrontMVP | LocationNode + floating edges |
| 8 | storytellerFrontMVP | Side panels |
| 9 | storytellerFrontMVP | Canvas + WorldDetailPage tab |
| 10 | All | Generate endpoint + i18n |
