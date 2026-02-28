# Implementation Plan: Frontend Screens Improvement

**Created:** 2026-02-28
**Status:** Draft
**Estimated Effort:** L

## Summary

Complete the StoryTeller frontend to cover the full storytelling flow: World → Characters → Scenes → Events → Narrative. Currently only 5 screens exist (login, register, world list, create world, world detail stub) using 8 of 20 backend endpoints. This plan adds the missing screens, fixes existing bugs, and extracts a shared API service layer.

## Research Findings

### Current State (5 screens, 8/20 endpoints)

| Screen | Route | Endpoints Used |
|--------|-------|----------------|
| LoginPage | `/` | `POST /login` (hardcoded URL) |
| RegisterPage | `/register` | `POST /register` (hardcoded URL) |
| HomePage | `/worlds` | `GET /worlds` |
| CreateWorldPage | `/worlds/create` | `POST /world`, `POST /world/generate` |
| WorldDetailPage | `/worlds/:id` | `GET /world/get?id=`, `DELETE /worlds/{id}` (WRONG URL) |

### Existing Patterns
- **Styling**: Tailwind CSS v4, gradient backgrounds (`from-blue-100 via-purple-100 to-pink-100`), rounded cards (`rounded-2xl`), gradient buttons
- **Data fetching**: Raw `fetch()` in `useEffect` with `useState` for loading/error/data. TanStack React Query is installed but unused
- **Auth**: JWT in `localStorage`, manual `Authorization: Bearer` header on every call
- **UI language**: Spanish
- **API URL**: `import.meta.env.VITE_API_URL || 'http://localhost:8080'` — duplicated in every file
- **Forms**: Manual + AI generation toggle (see CreateWorldPage) — this pattern should be reused for Character and Scene creation

### Bugs to Fix
1. **Delete URL wrong**: `WorldDetailPage.tsx:48` uses `DELETE /worlds/${id}` but backend expects `DELETE /world/delete?id=${id}`
2. **Sidebar links are plain `<a>`**: `MainLayout.tsx:27-33` uses `<a href>` causing full page reloads instead of React Router navigation
3. **Edit button leads nowhere**: `WorldDetailPage.tsx:76` navigates to `/worlds/${id}/edit` which has no route

### Missing Screens (mapped to backend endpoints)

| Screen | Route | Endpoints |
|--------|-------|-----------|
| WorldDetailPage (improved) | `/worlds/:id` | `GET /world-detail/get?id=` (returns world+characters+scenes) |
| CreateCharacterPage | `/worlds/:id/characters/create` | `POST /character`, `POST /character/generate` |
| CreateScenePage | `/worlds/:id/scenes/create` | `POST /scene`, `POST /scene/generate` |
| SceneDetailPage | `/worlds/:worldId/scenes/:sceneId` | `GET /scene-detail/get?id=`, `POST /scene-add-character`, `DELETE /scene/delete?id=` |
| GenerateEventsView (in SceneDetail) | (same page) | `POST /event`, `POST /event/generate` |
| NarrativeView (in SceneDetail) | (same page) | `GET /scene/narrative/get?id=` |
| InstallationPage | `/settings/installation` | `GET /installation/linking-token` |

### Endpoint Coverage After Plan

All 20 backend endpoints will be used:
- Auth: `/login`, `/register`, `/validate-token` (3)
- World: `/world`, `/worlds`, `/world/generate`, `/world/get`, `/world/delete`, `/world-detail/get` (6)
- Character: `/character`, `/character/generate`, `/character/get` (3)
- Scene: `/scene`, `/scene/generate`, `/scene/get`, `/scene/delete`, `/scene-add-character`, `/scene/character/get`, `/scene-detail/get` (7)
- Event: `/event`, `/event/generate` (2)
- Narrative: `/scene/narrative/get` (1)
- Installation: `/installation/linking-token` (1)
- Health: `/healthz` (not needed in frontend)

## Questions to Resolve

### Important (P2)
1. **Remove Edit button?** — There's no update/PUT endpoint in the backend for worlds, characters, or scenes. The "Editar" button in WorldDetailPage goes nowhere. **Suggested default:** Remove it for now.

## Implementation Order

### Step 1: API Service Layer
- **Implement:** `src/services/api.ts` — centralized fetch wrapper with auth headers, typed functions for all 20 endpoints. Already partially created.
- **Validation:** TypeScript compiles, all existing pages can import from it

### Step 2: Fix Bugs
- **Implement:**
  - `src/pages/home/WorldDetailPage.tsx` — fix delete URL from `/worlds/${id}` to use `api.deleteWorld(id)`
  - `src/layouts/MainLayout.tsx` — replace `<a href>` with React Router `Link` or `useNavigate`
  - Remove broken Edit button from WorldDetailPage
- **Validation:** Sidebar navigation doesn't cause full page reload. Delete works against real backend.

### Step 3: Improve WorldDetailPage
- **Implement:** `src/pages/home/WorldDetailPage.tsx` — use `getWorldDetail(id)` endpoint which returns `{world, characters[], scenes[]}`. Display character cards with link to create. Display scene cards with link to scene detail and create.
- **Depends on:** Steps 1, 2
- **Validation:** World detail page shows real characters and scenes (or empty state with create buttons)

### Step 4: CreateCharacterPage
- **Implement:** `src/pages/characters/CreateCharacterPage.tsx` — two modes: manual form (name, role, personality, background, goals, state) and AI generation (description + world context). Same toggle pattern as CreateWorldPage. Receives `worldId` from route params.
- **Depends on:** Step 1
- **Validation:** Can create a character manually. AI generation calls `/character/generate` and shows preview before saving.

### Step 5: CreateScenePage
- **Implement:** `src/pages/scenes/CreateScenePage.tsx` — two modes: manual form (title, location, time, tone, context) and AI generation. Receives `worldId` from route params.
- **Depends on:** Step 1
- **Validation:** Can create a scene manually. AI generation calls `/scene/generate` and shows preview.

### Step 6: SceneDetailPage
- **Implement:** `src/pages/scenes/SceneDetailPage.tsx` — uses `getSceneDetail(id)` to show scene info, characters in scene, and events list. Includes:
  - "Add character to scene" button (picks from world characters via modal/dropdown)
  - "Delete scene" button
  - Events list ordered by position
  - "Generate events" section with description input + character selection
  - "Generate narrative" button that calls `/scene/narrative/get?id=` and displays the result
- **Depends on:** Steps 1, 3, 4, 5
- **Validation:** Full flow works: see scene → add characters → generate events → generate narrative

### Step 7: InstallationPage
- **Implement:** `src/pages/settings/InstallationPage.tsx` — simple page that calls `getLinkingToken()` and displays the JWT for the user to copy into their local generator `.env`. Shows instructions for setting up the local generator.
- **Depends on:** Step 1
- **Validation:** Linking token is displayed and copyable

### Step 8: Route Wiring + Sidebar Navigation
- **Implement:**
  - `src/App.tsx` — add all new routes under the protected layout
  - `src/layouts/MainLayout.tsx` — update sidebar to include Settings/Installation link, ensure all links use React Router
- **Depends on:** Steps 3-7
- **Validation:** All routes navigable, no 404s for defined pages

### Final: Cleanup
- [ ] Remove duplicate `World` interface definitions (use from api.ts)
- [ ] Remove hardcoded API URLs in LoginPage.tsx and RegisterPage.tsx
- [ ] Verify `npm run build` compiles without errors
- [ ] Verify `npm run lint` passes
- **Validation:** Build clean, lint clean

## New File Inventory

```
src/
├── services/
│   └── api.ts                              # NEW - centralized API client
├── pages/
│   ├── characters/
│   │   └── CreateCharacterPage.tsx          # NEW - manual + AI character creation
│   ├── scenes/
│   │   ├── CreateScenePage.tsx              # NEW - manual + AI scene creation
│   │   └── SceneDetailPage.tsx             # NEW - scene with events + narrative
│   └── settings/
│       └── InstallationPage.tsx            # NEW - linking token display
```

## Modified Files

```
src/App.tsx                                 # Add new routes
src/layouts/MainLayout.tsx                  # Fix sidebar links, add settings link
src/pages/home/WorldDetailPage.tsx          # Use world-detail endpoint, fix delete, remove edit
src/pages/home/HomePage.tsx                 # Use api.ts instead of raw fetch
src/pages/home/CreateWorldPage.tsx          # Use api.ts instead of raw fetch
src/pages/login/LoginPage.tsx               # Use api.ts instead of hardcoded URL
src/pages/register/RegisterPage.tsx         # Use api.ts instead of hardcoded URL
src/components/ProtectedRoute.tsx           # Use api.ts
```

## Acceptance Criteria

- [ ] User can create a world (manual or AI) and see it in the list
- [ ] User can view world detail with its characters and scenes
- [ ] User can create characters in a world (manual or AI)
- [ ] User can create scenes in a world (manual or AI)
- [ ] User can view scene detail with events and characters
- [ ] User can add characters to a scene
- [ ] User can generate events for a scene
- [ ] User can generate narrative for a scene
- [ ] User can get a linking token for their local generator
- [ ] All sidebar navigation works without full page reloads
- [ ] Delete world and delete scene work correctly
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes

## Security Considerations

- JWT tokens should never be logged or exposed in error messages
- API service should handle 401 responses by clearing token and redirecting to login

## Performance Considerations

- TanStack React Query is installed but unused. Current plan keeps raw fetch for consistency with existing code. Migration to React Query can be a follow-up improvement.
- Consider adding loading skeletons instead of plain text spinners

---

## Next Steps

When ready to implement, run:
- `/wiz:work plans/frontend-screens-improvement.md` - Execute the plan
- `/wiz:deepen-plan` - Get more detail on specific sections
