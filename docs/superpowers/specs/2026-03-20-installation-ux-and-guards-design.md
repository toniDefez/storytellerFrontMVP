# Design Spec: Installation UX & Form Guards

**Created:** 2026-03-20
**Status:** Approved
**Scope:** Frontend only (storytellerFrontMVP)

---

## Overview

Two related UX improvements:

1. **Installation section UX** — remove copy-paste friction in the setup wizard and add the ability to revoke an installation.
2. **Form guards** — protect create/edit pages from accidental navigation loss and from attempting AI generation without a linked generator.

---

## Prerequisite: Migrate to `createBrowserRouter`

`useBlocker` (React Router v7) requires a data router context — it throws at runtime inside `BrowserRouter`. `src/main.tsx` must be migrated first.

**Migration pattern:**
- Route definitions currently in `App.tsx` move to a `createBrowserRouter(routes)` call.
- `main.tsx` renders `<RouterProvider router={router} />`.
- `<QueryClientProvider>`, `<TooltipProvider>`, and `<Toaster>` remain as wrappers **around** `<RouterProvider>` in `main.tsx` — none require router context, so they stay at the top level.
- No behavior changes, no route changes.

---

## Part 1: Installation Section UX

### 1a. Token auto-fill in Docker command

**Solution:** Lift `token` state from `TokenGenerator` up to `InstallationSection`. Pass it down to both `TokenGenerator` (as controlled props) and `SetupSteps` (to interpolate into the command).

**Behavior:**
- Without token: step 4 shows `<tu-token>` in amber, same visual as today.
- With token: `<tu-token>` is replaced by the real token value in green. A "Copiar comando" button appears alongside the code block.

**State changes:**
- `token: string` and `setToken: (t: string) => void` move to `InstallationSection` (no-installation branch only).
- `TokenGenerator` receives `token` and `setToken` as props (still owns `loading`, `error`, `copied` internally).
- `SetupSteps` receives `token: string` as prop.

**Copiar comando implementation:**
The Docker command in step 4 is rendered as JSX with colored `<span>` elements — the clipboard cannot copy JSX. The "Copiar comando" button must copy a **separately constructed plain-text string**:

```
docker run --name storyteller-generator -e OLLAMA_BASE_URL=http://host.docker.internal:11434 -e RABBIT_URL=amqp://guest:guest@host.docker.internal:5672 -e INSTALLATION_ACCESS_TOKEN=<token> ghcr.io/tonidefez/storyteller-generator
```

Where `<token>` is the current token value. Build this string in the `SetupSteps` component and pass it to `navigator.clipboard.writeText()` on click.

**i18n keys:**
- `installation.copyCommand` — "Copiar comando"
- `installation.commandCopied` — "Copiado"

### 1b. Revoke installation

**Solution:** Add a "Desvincular instalación" button to the linked-installation card.

**Behavior:**
- Button lives in `InstallationSection` (not inside `LinkedHeader`, which is a pure presentational subcomponent). Positioned in the top-right of the card header area.
- Clicking opens a confirmation `AlertDialog`.
- On confirm: calls `DELETE /installation/revoke`. On success: optimistic reset via `resetInstallation()`. The `resetInstallation()` call only affects the single hook instance in `InstallationSection` — other pages (on different routes) are not affected since they unmount on navigation.
- Loading spinner on "Desvincular" button during request. Dialog stays open during loading.
- On error: close dialog, show inline error below the revoke button.

**API changes:**
- Add `revokeInstallation()` to `src/services/api.ts` — `DELETE /installation/revoke`, returns `{ status: string }`.

**`useInstallation` changes:**
- Expose `resetInstallation: () => void` — sets `installation = null` and `hasInstallation = false` synchronously in local state. Does not cancel polling (the next poll cycle will re-confirm).

**i18n keys:**
- `installation.revokeButton` — "Desvincular instalación"
- `installation.revokeDialogTitle` — "Desvincular instalación"
- `installation.revokeDialogDesc` — "Esto desvinculará el generador de tu cuenta. ¿Continuar?"
- `installation.revokeDialogCancel` — "Cancelar"
- `installation.revokeDialogConfirm` — "Desvincular"
- `installation.revokeError` — "Error al desvincular. Inténtalo de nuevo."

---

## Part 2: Form Guards

### 2a. Unsaved changes guard

**New hook** `src/hooks/useUnsavedChangesGuard.ts`:

```ts
import { useBlocker } from 'react-router-dom'
import type { Blocker } from 'react-router-dom'

function useUnsavedChangesGuard(isDirty: boolean): { blocker: Blocker }
```

- Calls `useBlocker(isDirty)` internally and returns the `blocker` object.
- The consuming page renders `<UnsavedChangesDialog blocker={blocker} />`.

**New component** `src/components/UnsavedChangesDialog.tsx`:

```ts
import type { Blocker } from 'react-router-dom'

interface Props { blocker: Blocker }
```

- Uses shadcn `AlertDialog`. Open when `blocker.state === 'blocked'`.
- "Quedarme" → `blocker.reset()` (stays on page).
- "Salir" → `blocker.proceed()` (confirms navigation).

**`isDirty` per page:**

| Page | `isDirty` condition |
|------|---------------------|
| `CreateWorldPage` | `phrase.trim().length > 0 \|\| graph !== null` |
| `CreateCharacterPage.sanderson.tsx` | `premise.trim().length > 0 \|\| phase !== 'premise'` — `true` during `generating` and `reviewing` phases |
| `CreateScenePage` | any of: name, description, tone, time non-empty or non-default |
| `EditWorldPage` | `name !== loadedName \|\| description !== loadedDescription \|\| factions.join() !== loadedFactions.join()` (only these 3 fields are editable; layers are read-only) |
| `EditCharacterPage` | capture a frozen baseline snapshot of all editable fields on fetch completion; `isDirty` when any current field differs from the snapshot |
| `EditScenePage` | any editable field differs from loaded scene data |

**i18n keys:**
- `guard.unsavedTitle` — "¿Salir sin guardar?"
- `guard.unsavedDesc` — "Perderás los cambios realizados."
- `guard.unsavedStay` — "Quedarme"
- `guard.unsavedLeave` — "Salir"

### 2b. Installation guard on create pages

#### `CreateWorldPage` (100% AI — no manual mode)

- Add `useInstallation`; destructure `{ hasInstallation, loading, checked }`.
- If `loading`: show existing spinner.
- If `checked && !hasInstallation`: render blocker card instead of the phrase form. The phrase form must not render at all.
- Card: `Server` icon + title "Generador no vinculado" + description "Esta página requiere el generador local de StoryTeller. Vincúlalo desde la configuración para continuar." + "Ir a configuración" → `navigate('/settings?tab=installation')` + "Volver" → `navigate('/worlds')` (always `/worlds`, never `navigate(-1)` to handle direct URL access).
- `isDirty` guard still applies when `hasInstallation` is true.

#### `CreateCharacterPage.sanderson.tsx`

- If `!hasInstallation`: show `NoInstallationBanner` at top.
- Disable the generate/submit button when `!hasInstallation`. Wrap with shadcn `Tooltip` showing "Requiere generador vinculado". Since the button is not a native disabled element in the same way as a `TabsTrigger`, standard `TooltipTrigger` wrapping works.
- Premise textarea remains editable.

#### `CreateScenePage`

- Already has `useInstallation` + `NoInstallationBanner`.
- Disable the "IA" `TabsTrigger` when `!hasInstallation`. **Important:** a disabled `TabsTrigger` intercepts pointer events and prevents Radix `Tooltip` from firing. Wrap the disabled `TabsTrigger` inside a non-disabled `<span>` that is the `TooltipTrigger` target:

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <span>
      <TabsTrigger value="ai" disabled={!hasInstallation} style={{ pointerEvents: !hasInstallation ? 'none' : undefined }}>
        IA
      </TabsTrigger>
    </span>
  </TooltipTrigger>
  <TooltipContent>{t('installation.tabDisabledTooltip')}</TooltipContent>
</Tooltip>
```

#### Edit pages (`EditWorldPage`, `EditCharacterPage`, `EditScenePage`)

- No installation guard — editing is purely manual.

**i18n keys:**
- `installation.guardTitle` — "Generador no vinculado"
- `installation.guardDesc` — "Esta página requiere el generador local de StoryTeller. Vincúlalo desde la configuración para continuar."
- `installation.guardGoSettings` — "Ir a configuración"
- `installation.guardGoBack` — "Volver"
- `installation.tabDisabledTooltip` — "Requiere generador vinculado"

---

## Files Changed

| File | Change type |
|------|-------------|
| `src/main.tsx` | Migrate to `createBrowserRouter` + `RouterProvider`; keep `QueryClientProvider`, `TooltipProvider`, `Toaster` as wrappers around `RouterProvider` |
| `src/App.tsx` | Extract route config for `createBrowserRouter` |
| `src/services/api.ts` | Add `revokeInstallation()` |
| `src/hooks/useInstallation.ts` | Expose `resetInstallation()` |
| `src/hooks/useUnsavedChangesGuard.ts` | New |
| `src/components/UnsavedChangesDialog.tsx` | New — `import type { Blocker } from 'react-router-dom'` |
| `src/pages/settings/InstallationSection.tsx` | Token lift, revoke button + dialog |
| `src/pages/home/CreateWorldPage.tsx` | Installation guard + unsaved changes guard |
| `src/pages/home/EditWorldPage.tsx` | Unsaved changes guard (name, description, factions only) |
| `src/pages/characters/CreateCharacterPage.sanderson.tsx` | NoInstallationBanner + disable generate button with Tooltip + unsaved changes guard |
| `src/pages/characters/EditCharacterPage.tsx` | Baseline snapshot on fetch + unsaved changes guard |
| `src/pages/scenes/CreateScenePage.tsx` | Disable AI tab with Tooltip wrapper pattern + unsaved changes guard |
| `src/pages/scenes/EditScenePage.tsx` | Unsaved changes guard |
| `src/i18n/locales/es.json` | New keys |
| `src/i18n/locales/en.json` | New keys |

---

## Out of Scope

- No backend changes.
- No changes to detail pages, `NoInstallationBanner`, or routes.

---

## Acceptance Criteria

- [ ] `main.tsx` uses `createBrowserRouter` + `RouterProvider`; `TooltipProvider` and `Toaster` wrap `RouterProvider`; app behavior unchanged
- [ ] Token auto-fills in step 4 Docker command after generation
- [ ] "Copiar comando" copies a plain-text reconstructed command string (not JSX output)
- [ ] "Desvincular" button with confirmation `AlertDialog` on linked-installation card
- [ ] Revoking optimistically resets local hook state; UI transitions to setup wizard
- [ ] `CreateWorldPage` shows blocker card (not phrase form) when `checked && !hasInstallation`
- [ ] Blocker card "Volver" navigates to `/worlds`
- [ ] Generate button disabled with shadcn `Tooltip` in `CreateCharacterPage.sanderson.tsx` when no installation
- [ ] Disabled `TabsTrigger` wrapped in `<span>` + `TooltipTrigger` in `CreateScenePage`; tooltip fires correctly
- [ ] `useBlocker` works without throwing (data router in place)
- [ ] Navigating away with `isDirty === true` triggers `UnsavedChangesDialog`
- [ ] "Quedarme" → `blocker.reset()`; "Salir" → `blocker.proceed()`
- [ ] `isDirty` is `true` during and after generation phase in character/scene flows
- [ ] `EditWorldPage` `isDirty` only tracks name, description, factions (layers are read-only)
- [ ] `EditCharacterPage` captures baseline snapshot on fetch for all editable fields
- [ ] Save/submit clears the guard
- [ ] All new i18n keys in both `es.json` and `en.json`
- [ ] `npm run lint` and `npm run build` pass
