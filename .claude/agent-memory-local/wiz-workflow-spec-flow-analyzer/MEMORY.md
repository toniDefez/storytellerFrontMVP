# StoryTeller Frontend MVP - Spec Flow Analyzer Memory

## Project Identity
- Spanish-language UI, React 19 + TypeScript + Vite 6 + Tailwind CSS v4
- React Router v7, @tanstack/react-query installed but NOT used yet (all fetching is raw useState/useEffect)
- No test framework configured

## Architecture Snapshot
- Auth: JWT in localStorage["token"], validated via POST /validate-token on every protected route mount
- API layer: src/services/api.ts - single request<T>() wrapper, throws Error with server message on non-ok
- All pages do their own fetch state (loading/error/data) with useState - no shared state manager

## Entity Model
World -> Characters (many), Scenes (many)
Scene -> Characters (subset of world characters), Events (ordered by position), Narrative (text)
Event -> character_ids[], action, spot, position

## Route Map
/ (login), /register, /worlds, /worlds/create, /worlds/:id,
/worlds/:id/characters/create, /worlds/:id/scenes/create,
/worlds/:worldId/scenes/:sceneId, /settings/installation

## Key Gaps Found (first full analysis 2026-02-28)
See full analysis output. Critical: no edit flows anywhere, no back navigation on create pages,
no "add character" button visible when world has zero characters and user is on scene page,
login uses "email" field label but API sends it as "username", no character detail page,
no event deletion, narrative is ephemeral (not persisted across page loads),
deleteWorld cascades silently, ProtectedRoute validates on every navigation (perf/UX).

## Patterns to Watch
- All create pages navigate away on success with no success toast - inconsistent with RegisterPage which shows SuccessModal
- ErrorModal used only on LoginPage; all other pages show inline red text
- WorldCard has no keyboard role="button" - pure div onClick
- Faction/Goal list inputs allow empty strings (filtered on submit but not visually indicated)
