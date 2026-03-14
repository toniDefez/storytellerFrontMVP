# i18n + Settings Page Redesign

## Overview

Add internationalization (Spanish + English) to the StoryTeller frontend using `react-i18next`, and restructure the settings area into a tabbed page (`/settings`) with General (language selector) and Instalacion (generator linking) tabs.

## Goals

- Support Spanish (default) and English
- Auto-detect browser language, allow manual override via UI
- Persist language preference in `localStorage`
- Consolidate settings into a single tabbed page at `/settings`

## Non-Goals

- SSR or URL-based locale routing (SPA with auth, no SEO need)
- Code-splitting translations (project is small, single bundle is fine)
- Translating domain data from the backend (world names, character names, etc.)
- Right-to-left (RTL) language support

## Dependencies

New packages:
- `i18next`
- `react-i18next`
- `i18next-browser-languagedetector`

## Architecture

### i18n Configuration

```
src/
├── i18n/
│   ├── index.ts          # i18next init + browser detector config
│   └── locales/
│       ├── es.json       # Spanish strings (~160 keys)
│       └── en.json       # English strings (~160 keys)
```

**`src/i18n/index.ts`** initializes i18next with:
- `i18next-browser-languagedetector` plugin
- Detection order: `localStorage` → `navigator` → fallback `es`
- localStorage key: `"storyteller-language"`
- Fallback language: `es`
- Interpolation: `escapeValue: false` (React handles XSS via JSX — never use translation strings with `dangerouslySetInnerHTML`)
- Single namespace with nested key structure accessed via dot notation (e.g., `t('common.loading')` traverses `{ common: { loading: "..." } }`)

**`src/main.tsx`** imports `./i18n` before rendering (side-effect import).

### Locale File Structure

Single namespace with nested keys organized by feature area:

```json
{
  "common": {
    "loading": "Cargando...",
    "save": "Guardar",
    "cancel": "Cancelar",
    "delete": "Eliminar",
    "create": "Crear",
    "generate": "Generar",
    "copy": "Copiar",
    "copied": "Copiado",
    "error": "Error"
  },
  "nav": {
    "worlds": "Mundos",
    "settings": "Configuracion",
    "logout": "Cerrar sesion"
  },
  "auth": {
    "login": "Iniciar sesion",
    "register": "Crear cuenta",
    "username": "Usuario",
    "password": "Contraseña",
    "welcome": "Bienvenido",
    "noAccount": "No tienes cuenta?",
    "hasAccount": "Ya tienes cuenta?"
  },
  "worlds": { "..." : "~20 keys" },
  "characters": { "..." : "~15 keys" },
  "scenes": { "..." : "~15 keys" },
  "settings": {
    "title": "Configuracion",
    "tabGeneral": "General",
    "tabInstallation": "Instalacion",
    "language": "Idioma",
    "languageHint": "Selecciona el idioma de la interfaz"
  },
  "installation": { "..." : "~25 keys" },
  "errors": { "..." : "~10 keys" }
}
```

Interpolation used where needed:
```json
"worlds.count": "{{count}} mundos"
```

**Note on accents:** Locale files use proper Spanish orthography (tildes, acentos): "Configuracion" → "Configuración", "Instalacion" → "Instalación", etc. The existing codebase omits accents but i18n is the moment to fix this.

### JSX in Translations

Some strings contain inline markup (e.g., `<code>` tags in setup instructions). Use the `Trans` component from `react-i18next`:

```tsx
// Locale file
"installation.step3Desc": "Agrega el token en el archivo <code>.env</code> del generador:"

// Component
<Trans i18nKey="installation.step3Desc" components={{ code: <code className="..." /> }} />
```

This keeps markup in the component (for styling) while making the text translatable.

### Settings Page Redesign

**Routing change:**
- `/settings/installation` → `/settings` (single settings page)
- Add `<Navigate from="/settings/installation" to="/settings" replace />` in `App.tsx` for stale bookmarks

**Tab state via query param:** Active tab is encoded as `?tab=general` or `?tab=installation` (default: `general`). The redirect from `/settings/installation` maps to `/settings?tab=installation` for a smooth transition.

**`src/pages/settings/SettingsPage.tsx`** (new):
- Uses shadcn `Tabs` component (already installed)
- Two tabs: "General" and "Instalacion"
- Renders `PageBreadcrumb` (owned by parent, not by sections)
- Uses `max-w-2xl mx-auto mt-8` layout wrapper (owned by parent)
- Tab "General": language selector using `PillSelect` with `allowDeselect={false}` (see below)
- Tab "Instalacion": renders `InstallationSection`

**Language selector — PillSelect fix:** The current `PillSelect` allows deselecting (clicking active pill sets value to `''`). For language selection, exactly one option must always be selected. Add an `allowDeselect` prop (default `true` for backwards compat) that skips the toggle-off behavior when `false`.

**`src/pages/settings/InstallationSection.tsx`** (renamed from `InstallationPage.tsx`):
- No longer a route-level page, now a section component
- Exported as named export, not default
- **Remove:** `PageBreadcrumb` rendering (moved to parent SettingsPage)
- **Remove:** `max-w-2xl mx-auto mt-8` layout wrapper (parent owns layout)
- **Keep:** Loading spinner for installation data (only affects the Instalacion tab content)
- All current UI preserved (animated steps, token generator, linked state)

**`src/App.tsx`** changes:
- Route `/settings` → `SettingsPage`
- Route `/settings/installation` → `<Navigate to="/settings?tab=installation" replace />`

**`src/layouts/MainLayout.tsx`** changes:
- Nav item: label from `t('nav.settings')`, path `/settings`

### Date Formatting

`formatDate()` becomes locale-aware using the current i18n language:

```tsx
function formatDate(iso: string, locale: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleString(locale === 'en' ? 'en-US' : 'es-ES')
}
```

Usage: `formatDate(installation.last_seen_at, i18n.language)`

### Page Titles

`document.title` is set per-page using a small helper or effect that reads from `t()`. Example:

```tsx
useEffect(() => {
  document.title = `${t('worlds.title')} — StoryTeller`
}, [t])
```

### Component Migration Pattern

Every component with hardcoded Spanish text migrates to `useTranslation()`:

```tsx
// Before
<h2>Mis mundos</h2>

// After
const { t } = useTranslation()
<h2>{t('worlds.title')}</h2>
```

For strings with inline JSX, use `<Trans>` (see "JSX in Translations" above).

### Files to Migrate

| Priority | File | Approx Keys |
|----------|------|-------------|
| P1 | `MainLayout.tsx` | ~5 |
| P1 | `SettingsPage.tsx` (new) | ~4 |
| P1 | `InstallationSection.tsx` | ~25 |
| P2 | `LoginPage.tsx` | ~8 |
| P2 | `RegisterPage.tsx` | ~8 |
| P2 | `HomePage.tsx` | ~10 |
| P2 | `WorldCard.tsx` | ~3 |
| P3 | `CreateWorldPage.tsx` | ~20 |
| P3 | `WorldDetailPage.tsx` | ~15 |
| P3 | `CreateCharacterPage.tsx` | ~15 |
| P3 | `CharacterDetailPage.tsx` | ~10 |
| P3 | `CreateScenePage.tsx` | ~15 |
| P3 | `SceneDetailPage.tsx` | ~15 |
| P4 | `NoInstallationBanner.tsx` | ~3 |
| P4 | `NotFoundPage.tsx` | ~3 |
| P4 | `ConfirmModal.tsx` | ~3 |

### What Does NOT Change

- Protected routing, auth flow, API layer
- shadcn/ui components (except `PillSelect` gains `allowDeselect` prop)
- Animations, design tokens, styles
- Folder structure (except adding `src/i18n/`)
- Backend data (world names, character names, scene content)

## User Flow

1. User opens app → language auto-detected from browser (`es` or `en`), falls back to `es`
2. User navigates to `/settings` → "General" tab → PillSelect to switch language
3. User changes language → entire UI updates instantly, preference saved to localStorage
4. Next session → saved preference used from localStorage

## Error Handling

- Missing translation key → falls back to Spanish string (fallback language)
- Invalid language in localStorage → detector falls back to `es`
- `useTranslation()` is synchronous (translations bundled, no lazy loading) — no loading states needed
- Never use `dangerouslySetInnerHTML` with translation strings

## Testing Strategy

No test framework configured yet. Manual verification:
- Switch language in settings, verify all visible strings update
- Refresh page, verify language persists
- Clear localStorage, verify browser detection works
- Check both languages on every page for missing keys (console warnings from i18next in dev mode)
- Verify date formatting changes with language switch
- Verify `document.title` updates per page and language
- Verify PillSelect cannot deselect language (always one selected)
- Navigate to `/settings/installation` → should redirect to `/settings?tab=installation`
