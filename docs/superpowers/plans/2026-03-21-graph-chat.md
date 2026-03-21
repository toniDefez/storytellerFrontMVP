# World Graph Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent chat panel to the world graph view so users can converse with their causal tree via natural language using the existing `WorldGraphChat` generator type.

**Architecture:** The Go backend gets a new `GraphChat` service method that loads the causal tree from DB, converts it to `WorldGraphData`, and publishes a `world_graph_chat` generation request via RabbitMQ. The frontend gets a new `GraphSidePanel` component that wraps the existing `NodeDetailPanel` and a chat UI in two tabs, with tab switching driven by node selection state.

**Tech Stack:** Go 1.21, stdlib `testing`, React 19, TypeScript, Tailwind CSS v4, framer-motion, lucide-react, shadcn/ui

---

## File Map

**storytellerMVP (Go backend)**
- Modify: `internal/world/app/service.go` — add `GraphChat` method + `buildGraphData` helper
- Modify: `internal/world/app/service_test.go` — add `TestGraphChat`
- Modify: `internal/api/handlers/world.go` — add `GraphChat` to `WorldService` interface
- Modify: `internal/api/handlers/world_graph.go` — add `HandleGraphChat` handler
- Modify: `internal/api/dto/world.go` — add `GraphChatRequest` and `GraphChatResponse` DTOs
- Modify: `internal/api/routes.go` — register `POST /world/graph/chat`

**storytellerFrontMVP (React frontend)**
- Modify: `src/services/api.ts` — add `graphChat()` function
- Modify: `src/hooks/useWorldGraph.ts` — add `chatHistory`, `chatLoading`, `sendChatMessage`
- Create: `src/components/world-graph/GraphSidePanel.tsx` — tabs wrapper: Chat + Nodo
- Modify: `src/pages/home/WorldDetailPage.tsx` — replace `NodeDetailPanel` conditional with `GraphSidePanel`

---

### Task 1: Add GraphChat to the world service (Go)

**Files:**
- Modify: `internal/world/app/service_test.go`
- Modify: `internal/world/app/service.go`

- [ ] **Step 1: Write the failing test**

Add this test to `internal/world/app/service_test.go`:

```go
func TestGraphChat(t *testing.T) {
	worldRepo := &infra.MockWorldRepo{
		ReturnWorld: &domain.World{ID: 1, OwnerId: 1, Premise: "premisa de prueba"},
	}
	nodeRepo := infra.NewMockNodeRepo()
	nodeRepo.Nodes[1] = domain.WorldNode{
		ID: 1, WorldID: 1,
		Domain: "core", Role: "state", Label: "Fire Spirit Rule",
	}

	genSvc := &mockGenerationService{
		returnJSON: json.RawMessage(`{"result":{"reply":"El árbol tiene 1 nodo raíz: Fire Spirit Rule"}}`),
	}
	instSvc := &mockInstallationSvc{
		inst: installationdomain.Installation{ChannelID: "chan", AccessToken: "token"},
	}
	svc := NewService(worldRepo, nodeRepo, genSvc, instSvc)

	reply, err := svc.GraphChat(context.Background(), 1, 1, "¿qué hay en el grafo?")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if reply == "" {
		t.Fatal("expected non-empty reply")
	}
	if len(genSvc.requests) != 1 {
		t.Fatalf("expected 1 generation request, got %d", len(genSvc.requests))
	}
	if genSvc.requests[0].GenerationType != generationdomain.GenerationTypeWorldGraphChat {
		t.Fatalf("wrong generation type: %s", genSvc.requests[0].GenerationType)
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd storytellerMVP
go test ./internal/world/app/ -run TestGraphChat -v
```

Expected: FAIL — `svc.GraphChat undefined`

- [ ] **Step 3: Implement GraphChat and buildGraphData in service.go**

Add these two functions to `internal/world/app/service.go`. (`strconv` is already imported — no import change needed.)

```go
func (s *Service) GraphChat(ctx context.Context, userID int, worldID int, message string) (string, error) {
	if s.GenerationService == nil || s.InstallationSvc == nil {
		return "", errors.New("generation service not configured")
	}

	world, err := s.Repo.GetByID(worldID)
	if err != nil {
		return "", fmt.Errorf("get world: %w", err)
	}
	if world.OwnerId != userID {
		return "", errors.New("forbidden: not the owner")
	}

	inst, err := s.InstallationSvc.GetInstallationByUserID(ctx, userID)
	if err != nil {
		return "", fmt.Errorf("get installation: %w", err)
	}

	nodes, err := s.NodeRepo.GetGraph(worldID)
	if err != nil {
		return "", fmt.Errorf("get graph: %w", err)
	}

	payload, err := json.Marshal(generationdomain.WorldGraphChatPayload{
		Message:      message,
		CurrentGraph: buildGraphData(nodes),
	})
	if err != nil {
		return "", fmt.Errorf("marshal payload: %w", err)
	}

	req := &generationdomain.GenerationRequest{
		ID:             uuid.NewString(),
		UserID:         userID,
		GenerationType: generationdomain.GenerationTypeWorldGraphChat,
		Payload:        payload,
		ChannelID:      inst.ChannelID,
		AccessToken:    inst.AccessToken,
	}

	rawResp, err := s.GenerationService.CreateAndPublish(ctx, req)
	if err != nil {
		return "", fmt.Errorf("generation: %w", err)
	}

	var tsResp struct {
		Result generationdomain.WorldGraphChatResult `json:"result"`
	}
	if err := json.Unmarshal(rawResp, &tsResp); err != nil {
		return "", fmt.Errorf("unmarshal response: %w", err)
	}
	return tsResp.Result.Reply, nil
}

func buildGraphData(nodes []domain.WorldNode) generationdomain.WorldGraphData {
	graphNodes := make([]generationdomain.GraphNode, 0, len(nodes))
	graphEdges := make([]generationdomain.GraphEdge, 0, len(nodes))

	for _, n := range nodes {
		var desc string
		var content domain.WorldNodeContent
		if n.Content != nil {
			_ = json.Unmarshal(n.Content, &content)
			desc = content.Description
		}
		graphNodes = append(graphNodes, generationdomain.GraphNode{
			ID:          strconv.Itoa(n.ID),
			Label:       n.Label,
			Domain:      string(n.Domain),
			Description: desc,
		})
		if n.ParentID != nil {
			edgeLabel := ""
			if n.ParentEdgeType != nil {
				edgeLabel = string(*n.ParentEdgeType)
			}
			graphEdges = append(graphEdges, generationdomain.GraphEdge{
				Source: strconv.Itoa(n.ID),
				Target: strconv.Itoa(*n.ParentID),
				Label:  edgeLabel,
			})
		}
	}
	return generationdomain.WorldGraphData{Nodes: graphNodes, Edges: graphEdges}
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
go test ./internal/world/app/ -run TestGraphChat -v
```

Expected: PASS

- [ ] **Step 5: Run all world tests to check no regressions**

```bash
go test ./internal/world/app/ -v
```

Expected: all PASS

- [ ] **Step 6: Commit**

```bash
cd storytellerMVP
git add internal/world/app/service.go internal/world/app/service_test.go
git commit -m "feat: add GraphChat to world service — builds graph from causal tree and routes to generator"
```

---

### Task 2: Add DTO, handler, and route (Go)

**Files:**
- Modify: `internal/api/dto/world.go`
- Modify: `internal/api/handlers/world.go`
- Modify: `internal/api/handlers/world_graph.go`
- Modify: `internal/api/routes.go`

- [ ] **Step 1: Add DTOs to internal/api/dto/world.go**

Append at the end of the file:

```go
// GraphChatRequest is the body for POST /world/graph/chat?world_id={id}.
type GraphChatRequest struct {
	Message string `json:"message"`
}

// GraphChatResponse is the response for POST /world/graph/chat.
type GraphChatResponse struct {
	Reply string `json:"reply"`
}
```

- [ ] **Step 2: Add GraphChat to the WorldService interface in internal/api/handlers/world.go**

Add this line to the `WorldService` interface after `DeleteSubtree`:

```go
GraphChat(ctx context.Context, userID int, worldID int, message string) (string, error)
```

- [ ] **Step 3: Add HandleGraphChat to internal/api/handlers/world_graph.go**

Append at the end of the file:

```go
func HandleGraphChat(service WorldService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Método no permitido", http.StatusMethodNotAllowed)
			return
		}
		worldID, err := worldIDFromQuery(r)
		if err != nil {
			httputils.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
		input, err := httputils.ParseBody[dto.GraphChatRequest](r)
		if err != nil || input == nil || input.Message == "" {
			httputils.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "message is required"})
			return
		}
		userID := httputils.GetUserID(r)
		reply, err := service.GraphChat(r.Context(), userID, worldID, input.Message)
		if err != nil {
			httputils.WriteError(w, err)
			return
		}
		httputils.WriteJSON(w, http.StatusOK, dto.GraphChatResponse{Reply: reply})
	}
}
```

- [ ] **Step 4: Register the route in internal/api/routes.go**

Add after the `/world/generate-root` line:

```go
router.HandleSecure("/world/graph/chat", handlers.HandleGraphChat(app.WorldService))
```

- [ ] **Step 5: Build to verify no compilation errors**

```bash
go build ./...
```

Expected: no output (clean build)

- [ ] **Step 6: Run all tests**

```bash
go test ./...
```

Expected: all PASS

- [ ] **Step 7: Commit**

```bash
git add internal/api/dto/world.go internal/api/handlers/world.go internal/api/handlers/world_graph.go internal/api/routes.go
git commit -m "feat: add POST /world/graph/chat endpoint"
```

---

### Task 3: Add graphChat API call to the frontend

**Files:**
- Modify: `src/services/api.ts`

- [ ] **Step 1: Add the graphChat function**

In `src/services/api.ts`, after the `expandNodeCandidates` function, add:

```typescript
export function graphChat(worldId: number, message: string) {
  return request<{ reply: string }>(`/world/graph/chat?world_id=${worldId}`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
}
```

- [ ] **Step 2: Build to verify no TypeScript errors**

```bash
cd storytellerFrontMVP
npm run build
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/services/api.ts
git commit -m "feat: add graphChat API call"
```

---

### Task 4: Add chat state to useWorldGraph

**Files:**
- Modify: `src/hooks/useWorldGraph.ts`

- [ ] **Step 1: Add ChatMessage type, state, and sendChatMessage to useWorldGraph.ts**

Import `graphChat` at the top:

```typescript
import {
  getWorldGraph,
  expandNodeCandidates,
  createNode,
  deleteSubtree,
  getSubtreePreview,
  graphChat,
} from '@/services/api'
```

Add `ChatMessage` type before the `UseWorldGraphReturn` interface:

```typescript
export interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
}
```

Add to `UseWorldGraphReturn` interface:

```typescript
chatHistory: ChatMessage[]
chatLoading: boolean
sendChatMessage: (worldId: number, text: string) => Promise<void>
```

Add inside `useWorldGraph` function (after `ghostParentId` state):

```typescript
const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
const [chatLoading, setChatLoading] = useState(false)
```

Add the `sendChatMessage` callback (after `deleteConfirmed`):

```typescript
const sendChatMessage = useCallback(async (worldId: number, text: string) => {
  setChatHistory(prev => [...prev, { role: 'user', text }])
  setChatLoading(true)
  try {
    const res = await graphChat(worldId, text)
    setChatHistory(prev => [...prev, { role: 'assistant', text: res.reply }])
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error en el chat'
    setChatHistory(prev => [...prev, { role: 'assistant', text: `⚠️ ${msg}` }])
  } finally {
    setChatLoading(false)
  }
}, [])
```

Update the return object to include the new values:

```typescript
return {
  nodes, premise, loading, error,
  selectedNode, ghostCandidates, ghostParentId,
  chatHistory, chatLoading,
  loadGraph, selectNode, expandNode, confirmCandidate,
  dismissGhosts, addNodeManually, removeSubtree, deleteConfirmed,
  sendChatMessage,
}
```

- [ ] **Step 2: Build to verify no TypeScript errors**

```bash
npm run build
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useWorldGraph.ts
git commit -m "feat: add chatHistory and sendChatMessage to useWorldGraph"
```

---

### Task 5: Refactor NodeDetailPanel to remove its own outer wrapper

`NodeDetailPanel` currently renders its own `<div className="w-[280px] shrink-0 border-l ...">`. Since `GraphSidePanel` now owns the container, that div must be replaced with a fragment.

**Files:**
- Modify: `src/components/world-graph/NodeDetailPanel.tsx`

- [ ] **Step 1: Replace outer div with fragment in NodeDetailPanel.tsx**

In `src/components/world-graph/NodeDetailPanel.tsx`, change the outermost returned element from:

```tsx
return (
  <>
    <div className="w-[280px] shrink-0 border-l border-border flex flex-col bg-card overflow-y-auto">
```

To (remove the outer sizing div, keep contents):

```tsx
return (
  <>
    <div className="flex-1 flex flex-col overflow-y-auto">
```

- [ ] **Step 2: Build to verify no TypeScript errors**

```bash
npm run build
```

Expected: no errors (NodeDetailPanel is not yet used standalone so this is a refactor only)

- [ ] **Step 3: Commit**

```bash
git add src/components/world-graph/NodeDetailPanel.tsx
git commit -m "refactor: remove outer sizing div from NodeDetailPanel — container now owned by GraphSidePanel"
```

---

### Task 7: Create GraphSidePanel component

**Files:**
- Create: `src/components/world-graph/GraphSidePanel.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/world-graph/GraphSidePanel.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react'
import { MessageSquare, Network, Send, Loader2 } from 'lucide-react'
import type { WorldNode } from '@/services/api'
import type { ChatMessage } from '@/hooks/useWorldGraph'
import { NodeDetailPanel } from './NodeDetailPanel'

interface GraphSidePanelProps {
  selectedNode: WorldNode | null
  worldId: number
  isExpanding: boolean
  chatHistory: ChatMessage[]
  chatLoading: boolean
  onSendMessage: (text: string) => void
  onClose: () => void
  onExpand: () => void
  onDeleteSubtree: () => Promise<{ count: number; labels: string[] }>
  onDeleteConfirmed: () => Promise<void>
}

export function GraphSidePanel({
  selectedNode, worldId, isExpanding,
  chatHistory, chatLoading,
  onSendMessage, onClose, onExpand, onDeleteSubtree, onDeleteConfirmed,
}: GraphSidePanelProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'node'>('chat')
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-switch tabs when node selection changes
  useEffect(() => {
    if (selectedNode) setActiveTab('node')
    else setActiveTab('chat')
  }, [selectedNode?.id])

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  const handleSend = () => {
    const text = input.trim()
    if (!text || chatLoading) return
    setInput('')
    onSendMessage(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="w-[280px] shrink-0 border-l border-border flex flex-col bg-card overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-border shrink-0">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
            activeTab === 'chat'
              ? 'text-foreground border-b-2 border-foreground -mb-px'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Chat
        </button>
        <button
          onClick={() => setActiveTab('node')}
          disabled={!selectedNode}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-default ${
            activeTab === 'node'
              ? 'text-foreground border-b-2 border-foreground -mb-px'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          Nodo
        </button>
      </div>

      {/* Chat tab */}
      {activeTab === 'chat' && (
        <>
          {/* Message list */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {chatHistory.length === 0 && (
              <p className="text-xs text-muted-foreground text-center mt-6 leading-relaxed">
                Pregunta algo sobre tu mundo o pide que añada nodos al grafo.
              </p>
            )}
            {chatHistory.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-border px-3 py-2 flex gap-2 items-end">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje..."
              rows={2}
              className="flex-1 resize-none text-xs bg-muted/50 border border-border rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-foreground/20 placeholder:text-muted-foreground leading-relaxed"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || chatLoading}
              className="shrink-0 p-2 rounded-lg bg-foreground text-background disabled:opacity-40 disabled:cursor-not-allowed hover:bg-foreground/90 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      )}

      {/* Node tab */}
      {activeTab === 'node' && selectedNode && (
        <NodeDetailPanel
          node={selectedNode}
          worldId={worldId}
          isExpanding={isExpanding}
          onClose={() => { onClose(); setActiveTab('chat') }}
          onExpand={onExpand}
          onDeleteSubtree={onDeleteSubtree}
          onDeleteConfirmed={onDeleteConfirmed}
        />
      )}

      {activeTab === 'node' && !selectedNode && (
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-xs text-muted-foreground text-center">
            Selecciona un nodo en el grafo para ver su detalle.
          </p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Build to verify no TypeScript errors**

```bash
npm run build
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/world-graph/GraphSidePanel.tsx
git commit -m "feat: add GraphSidePanel component with chat and node tabs"
```

---

### Task 8: Wire GraphSidePanel into WorldDetailPage

**Files:**
- Modify: `src/pages/home/WorldDetailPage.tsx`

- [ ] **Step 1: Replace NodeDetailPanel with GraphSidePanel**

In `src/pages/home/WorldDetailPage.tsx`, add the import:

```tsx
import { GraphSidePanel } from '@/components/world-graph/GraphSidePanel'
```

Remove the existing `NodeDetailPanel` import (it's now used only inside `GraphSidePanel`).

Replace the section in the JSX that renders the canvas + conditional `NodeDetailPanel`:

```tsx
{/* Before — remove this */}
<div className="flex" style={{ height: 480 }}>
  <div className="flex-1 relative min-w-0">
    <CausalTreeCanvas ... />
    {graph.ghostCandidates.length > 0 && graph.ghostParentId && (
      <GhostCandidates ... />
    )}
  </div>
  {graph.selectedNode && (
    <NodeDetailPanel ... />
  )}
</div>
```

```tsx
{/* After */}
<div className="flex" style={{ height: 480 }}>
  <div className="flex-1 relative min-w-0">
    <CausalTreeCanvas
      nodes={graph.nodes}
      selectedNodeId={graph.selectedNode?.id}
      onSelectNode={graph.selectNode}
    />
    {graph.ghostCandidates.length > 0 && graph.ghostParentId && (
      <GhostCandidates
        candidates={graph.ghostCandidates}
        parentLabel={graph.nodes.find(n => n.id === graph.ghostParentId)?.label ?? ''}
        onConfirm={c => graph.confirmCandidate(Number(id), graph.ghostParentId!, c)}
        onDismiss={graph.dismissGhosts}
      />
    )}
  </div>
  <GraphSidePanel
    selectedNode={graph.selectedNode}
    worldId={Number(id)}
    isExpanding={isExpanding}
    chatHistory={graph.chatHistory}
    chatLoading={graph.chatLoading}
    onSendMessage={(text) => graph.sendChatMessage(Number(id), text)}
    onClose={() => graph.selectNode(null)}
    onExpand={async () => {
      setIsExpanding(true)
      try { await graph.expandNode(Number(id), graph.selectedNode!.id) }
      finally { setIsExpanding(false) }
    }}
    onDeleteSubtree={() => graph.removeSubtree(Number(id), graph.selectedNode!.id)}
    onDeleteConfirmed={() => graph.deleteConfirmed(Number(id), graph.selectedNode!.id)}
  />
</div>
```

- [ ] **Step 2: Build to verify no TypeScript errors**

```bash
npm run build
```

Expected: no errors

- [ ] **Step 3: Manual smoke test**

```bash
npm run dev
```

Open `http://localhost:5173`, navigate to a world with a graph:
- [ ] Panel right side always shows the Chat tab by default
- [ ] Type a message and press Enter — user bubble appears, then loading spinner, then assistant reply
- [ ] Click a node — tab auto-switches to "Nodo" showing the node detail
- [ ] Close the node — tab reverts to "Chat"
- [ ] Previous chat messages persist while switching tabs

- [ ] **Step 4: Commit**

```bash
git add src/pages/home/WorldDetailPage.tsx
git commit -m "feat: wire GraphSidePanel into WorldDetailPage — chat always visible, node tab on selection"
```
