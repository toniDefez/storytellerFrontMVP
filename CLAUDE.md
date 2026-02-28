# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StoryTeller Frontend MVP — a React SPA for a storytelling platform where users create and manage "worlds" (manually or via AI generation). The UI is in Spanish.

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
- **@tanstack/react-query** installed but not yet actively used
- ESLint flat config (`eslint.config.js`) with TypeScript and React hooks plugins

## Architecture

```
src/
├── pages/          # Route-level container components (feature folders: login/, register/, home/)
├── components/     # Shared reusable components (inputs, modals, guards, cards)
├── layouts/        # Layout wrappers (MainLayout with sidebar + navbar + Outlet)
├── utils/          # Helpers (validation.ts)
├── App.tsx         # Route definitions
└── main.tsx        # Entry point (BrowserRouter + QueryClientProvider)
```

### Routing (App.tsx)

- `/` → LoginPage, `/register` → RegisterPage (public)
- `/worlds` → HomePage, `/worlds/create` → CreateWorldPage, `/worlds/:id` → WorldDetailPage (protected, inside MainLayout)
- `*` → NotFoundPage

Protected routes use `ProtectedRoute` which validates the JWT token against the backend before rendering `<Outlet />`.

### Auth Pattern

- Token stored in `localStorage` key `"token"`
- `ProtectedRoute` calls `POST /validate-token` on mount; redirects to `/` if invalid
- All API calls include `Authorization: Bearer {token}` header

### API Integration

No service abstraction layer — components call `fetch()` directly using `import.meta.env.VITE_API_URL` (fallback: `http://localhost:8080`).

Key endpoints: `POST /login`, `POST /register`, `POST /validate-token`, `GET /worlds`, `POST /world`, `POST /world/generate`, `GET /world/get?id={id}`, `DELETE /worlds/{id}`.

## Environment

Single env var: `VITE_API_URL` in `.env` (defaults to `http://localhost:8080`).
