# World Graph Chat — Design Spec

## Goal

Add a persistent chat panel to the world graph view so users can ask questions about or modify the causal tree via natural language, powered by the existing `WorldGraphChat` generation type.

## Architecture

**Backend (Go — storytellerMVP)**

New method `GraphChat(ctx, userID, worldID int, message string) (string, error)` on `world/app.Service`:
- Loads graph from DB via `NodeRepo.GetGraph`
- Converts `[]WorldNode` → `WorldGraphData` (nodes from labels/domains, edges from parent_id relationships)
- Marshals `WorldGraphChatPayload{Message, CurrentGraph}` and publishes via `GenerationService.CreateAndPublish`
- Unmarshals response, returns `reply` string only (patch ignored for now)

New HTTP handler `HandleGraphChat` in `internal/api/handlers/world_graph.go`:
- `POST /world/graph/chat?world_id=X`
- Body: `{"message": "..."}`
- Response: `{"reply": "..."}`

`WorldService` interface extended with `GraphChat`.

**Frontend (React — storytellerFrontMVP)**

- `api.ts`: `graphChat(worldId, message)` → POST → `{ reply: string }`
- `useWorldGraph`: add `chatHistory: ChatMessage[]` (local state, no persistence), `chatLoading: boolean`, `sendChatMessage(worldId, text)`
- New `GraphSidePanel` component wrapping both tabs — replaces direct `NodeDetailPanel` render in `WorldDetailPage`

## Components

### `GraphSidePanel`

Always-visible 280px right panel. Two tabs:
- **Chat** (default): scrollable message list, sticky input at bottom. Auto-scrolls to latest. Shows user messages right-aligned and assistant messages left-aligned.
- **Nodo**: renders existing `NodeDetailPanel` when a node is selected; empty state when none.

Tab switches automatically: selecting a node switches to "Nodo" tab; closing/deselecting returns to "Chat" tab.

## Data Flow

```
User types message → sendChatMessage(worldId, text)
  → optimistic add to chatHistory (role: user)
  → POST /world/graph/chat?world_id=X {message}
  → append reply to chatHistory (role: assistant)
```

## Error Handling

- API errors shown as a red assistant message in the chat history
- `chatLoading` disables input while waiting

## Out of Scope

- Patch application (adding nodes from chat response) — future work
- Chat persistence across sessions
- Per-node chat context (chat always sees full graph)
