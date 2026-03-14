# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StoryTeller Frontend MVP — a React SPA for a storytelling platform where users create and manage "worlds" (manually or via AI generation). AI generation requires a local generator process linked to the user's account. The UI supports Spanish and English (i18n via react-i18next).

## Commands

- `npm run dev` — Start Vite dev server
- `npm run build` — TypeScript check + Vite production build (`tsc -b && vite build`)
- `npm run lint` — ESLint across the project
- `npm run preview` — Preview production build locally

No test framework is configured yet.

## Tech Stack

- **React 19** + **TypeScript** + **Vite 6**
- **React Router v7** for routing
- **Tailwind CSS v4** (via `@tailwindcss/vite` plugin, imported in `src/index.css`)
- **framer-motion** for animations (page transitions in `MainLayout`, `PillSelect` interactions)
- **react-i18next** + **i18next** for internationalization (Spanish/English), with `i18next-browser-languagedetector`
- **@tanstack/react-query** installed but not yet actively used
- ESLint flat config (`eslint.config.js`) with TypeScript and React hooks plugins

## Architecture

```
src/
├── i18n/           # Internationalization
│   ├── index.ts    # i18next config (detector, fallback: es)
│   └── locales/    # es.json, en.json — all UI strings
├── pages/          # Route-level components (feature subfolders)
│   ├── login/      # LoginPage
│   ├── register/   # RegisterPage
│   ├── home/       # HomePage, CreateWorldPage, WorldDetailPage
│   ├── characters/ # CreateCharacterPage, CharacterDetailPage
│   ├── scenes/     # CreateScenePage, SceneDetailPage
│   └── settings/   # SettingsPage (tabs: General + Installation)
├── components/     # Shared reusable components
├── layouts/        # MainLayout (sidebar + Outlet)
├── hooks/          # useInstallation
├── services/       # api.ts — all API calls and TypeScript interfaces
├── utils/          # validation.ts
├── App.tsx         # Route definitions
└── main.tsx        # Entry point (BrowserRouter + QueryClientProvider)
```

### Routing (App.tsx)

- `/` → LoginPage, `/register` → RegisterPage (public)
- Protected routes (inside `MainLayout`):
  - `/worlds` → HomePage
  - `/worlds/create` → CreateWorldPage
  - `/worlds/:id` → WorldDetailPage
  - `/worlds/:id/characters/create` → CreateCharacterPage
  - `/worlds/:worldId/characters/:characterId` → CharacterDetailPage
  - `/worlds/:id/scenes/create` → CreateScenePage
  - `/worlds/:worldId/scenes/:sceneId` → SceneDetailPage
  - `/settings` → SettingsPage (tabs: General with language selector, Installation)
  - `/settings/installation` → redirects to `/settings?tab=installation`
- `*` → NotFoundPage

Protected routes use `ProtectedRoute` which validates JWT against the backend before rendering `<Outlet />`.

### Auth Pattern

- Token stored in `localStorage` key `"token"`
- `ProtectedRoute` calls `POST /validate-token` on mount; redirects to `/` if invalid
- All API calls use the `authHeaders()` helper from `src/services/api.ts` which adds `Authorization: Bearer {token}`

### API Layer (`src/services/api.ts`)

All API calls go through a central `request<T>()` helper that handles auth headers, error parsing, and empty-body responses. Components import named functions from this module — never call `fetch()` directly.

Key types exported: `World`, `Character`, `Scene`, `Event`, `WorldDetail`, `SceneDetail`, `SceneNarrative`, `Installation`.

Notable backend shape quirk: `GET /world-detail/get?id={id}` returns `summary` (not `description`); `WorldDetailPage` normalizes this on the frontend.

**Auth:** `POST /login`, `POST /register`, `POST /validate-token`

**Worlds:** `GET /worlds`, `POST /world`, `POST /world/generate`, `GET /world/get?id={id}`, `GET /world-detail/get?id={id}`, `DELETE /world/delete?id={id}`

**Characters:** `POST /character`, `POST /character/generate`, `GET /character/get?id={id}`

**Scenes:** `POST /scene`, `POST /scene/generate`, `GET /scene/get?id={id}`, `GET /scene-detail/get?id={id}`, `DELETE /scene/delete?id={id}`, `POST /scene-add-character`, `GET /scene/character/get?id={id}`, `GET /scene/narrative/get?id={id}`

**Events:** `POST /event`, `POST /event/generate`

**Installation:** `GET /installation/me` (returns 204 if none), `GET /installation/linking-token`

### AI Generation Flow

AI features (world generation, character generation, scene generation, event generation, narrative generation) require a local generator process. Users link it via a token from `GET /installation/linking-token`. `useInstallation` hook checks `GET /installation/me`; pages show `NoInstallationBanner` if no installation is linked.

## Environment

Single env var: `VITE_API_URL` in `.env` (defaults to `http://localhost:8080`).

## Design Context

### Users
Storytellers, worldbuilders, and creative writers who use the platform to construct fictional worlds with characters, scenes, and events. They may use AI assistance (via a local generator) or build everything manually. They interact with forms, cards, and detail views frequently. The UI is in Spanish (with i18n planned).

### Brand Personality
**Imaginative, refined, inviting.** The platform should feel like opening a beautifully bound journal — warm, literary, and full of possibility. Not cold or technical; not childish or whimsical.

### Aesthetic Direction
- **Visual tone:** Warm literary elegance. Purple primary conveys creativity; warm off-white background avoids sterility. Serif display font (Lora) for titles evokes books and storytelling; clean sans-serif (Source Sans 3) for body keeps things readable.
- **Entity identity:** Worlds = purple, Characters = warm orange, Scenes = bright cyan. Each entity has its own color language with light/muted variants.
- **Climate gradients:** WorldCards use climate-specific gradient headers (arctic cyan, tropical emerald, volcanic red, etc.) — a signature visual feature.
- **Dark sidebar:** Deep slate-950 sidebar contrasts with the warm light content area, creating a "writing desk" feel.
- **Motion:** Spring-physics interactions (framer-motion) for cards and pills; subtle page transitions. Animations feel responsive, not decorative.
- **Anti-references:** Generic SaaS dashboards, cold blue-gray palettes, Notion/Linear clones, glassy AI aesthetics with neon accents.

### Design Principles
1. **Literary warmth over tech coldness** — Every surface should feel handcrafted and warm, not generated or clinical. Serif headings, tinted neutrals, soft shadows.
2. **Entity color as wayfinding** — Purple/orange/cyan consistently identify worlds/characters/scenes across all views. Users should know what entity type they're looking at from color alone.
3. **Progressive disclosure** — Start simple, reveal depth through interaction. Forms use tabs (Manual/IA), cards expand on hover, details load in context.
4. **Motion with purpose** — Animations confirm actions and guide attention. Spring physics for direct manipulation, ease-out for reveals. Always respect prefers-reduced-motion.
5. **Accessibility as foundation** — Focus rings on all interactive elements, semantic HTML, ARIA labels, keyboard navigation, contrast ratios that meet WCAG AA.
