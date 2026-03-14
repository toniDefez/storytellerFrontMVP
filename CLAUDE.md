# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StoryTeller Frontend MVP — a React SPA for a storytelling platform where users create and manage "worlds" (manually or via AI generation). AI generation requires a local generator process linked to the user's account. The UI is in Spanish.

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
- **@tanstack/react-query** installed but not yet actively used
- ESLint flat config (`eslint.config.js`) with TypeScript and React hooks plugins

## Architecture

```
src/
├── pages/          # Route-level components (feature subfolders)
│   ├── login/      # LoginPage
│   ├── register/   # RegisterPage
│   ├── home/       # HomePage, CreateWorldPage, WorldDetailPage
│   ├── characters/ # CreateCharacterPage, CharacterDetailPage
│   ├── scenes/     # CreateScenePage, SceneDetailPage
│   └── settings/   # InstallationPage
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
  - `/settings/installation` → InstallationPage
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
