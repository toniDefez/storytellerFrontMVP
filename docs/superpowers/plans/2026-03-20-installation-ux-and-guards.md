# Installation UX & Form Guards — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate copy-paste friction in the setup wizard, add installation revocation, and protect all create/edit pages with installation guards and unsaved-changes dialogs.

**Architecture:** Lift token state in `InstallationSection`, expose `resetInstallation` from the hook, create two shared guard primitives (`useUnsavedChangesGuard` + `UnsavedChangesDialog`), then wire guards into each create/edit page. The router migration to `createBrowserRouter` is the gating prerequisite that unlocks `useBlocker`.

**Tech Stack:** React 19, TypeScript, React Router v7, Tailwind CSS v4, shadcn/ui (`AlertDialog`, `Tooltip`), framer-motion, react-i18next. No test framework — validation is `npm run build` (TypeScript check) + `npm run lint`.

**Spec:** `docs/superpowers/specs/2026-03-20-installation-ux-and-guards-design.md`

---

## Task 0: Migrate to `createBrowserRouter`

**Why:** `useBlocker` throws at runtime inside `BrowserRouter`. This migration is the gating prerequisite for all unsaved-changes guards.

**Files:**
- Modify: `src/main.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Rewrite `src/App.tsx` to export a `createBrowserRouter` router**

Replace the entire file:

```tsx
import { createBrowserRouter, Navigate } from 'react-router-dom'
import LoginPage from './pages/login/LoginPage'
import MainLayout from './layouts/MainLayout'
import RegisterPage from './pages/register/RegisterPage'
import HomePage from './pages/home/HomePage'
import CreateWorldPage from './pages/home/CreateWorldPage'
import EditWorldPage from './pages/home/EditWorldPage'
import ProtectedRoute from './components/ProtectedRoute'
import NotFoundPage from './pages/NotFoundPage'
import WorldDetailPage from './pages/home/WorldDetailPage'
import WorldBiblePage from './pages/home/WorldBiblePage'
import CreateCharacterPage from './pages/characters/CreateCharacterPage.sanderson'
import EditCharacterPage from './pages/characters/EditCharacterPage'
import CharacterDetailPage from './pages/characters/CharacterDetailPage'
import CreateScenePage from './pages/scenes/CreateScenePage'
import EditScenePage from './pages/scenes/EditScenePage'
import SceneDetailPage from './pages/scenes/SceneDetailPage'
import SettingsPage from './pages/settings/SettingsPage'

export const router = createBrowserRouter([
  { path: '/', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: 'worlds', element: <HomePage /> },
          { path: 'worlds/create', element: <CreateWorldPage /> },
          { path: 'worlds/:id', element: <WorldDetailPage /> },
          { path: 'worlds/:id/bible', element: <WorldBiblePage /> },
          { path: 'worlds/:id/edit', element: <EditWorldPage /> },
          { path: 'worlds/:id/characters/create', element: <CreateCharacterPage /> },
          { path: 'worlds/:worldId/characters/:characterId', element: <CharacterDetailPage /> },
          { path: 'worlds/:worldId/characters/:characterId/edit', element: <EditCharacterPage /> },
          { path: 'worlds/:id/scenes/create', element: <CreateScenePage /> },
          { path: 'worlds/:worldId/scenes/:sceneId', element: <SceneDetailPage /> },
          { path: 'worlds/:worldId/scenes/:sceneId/edit', element: <EditScenePage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: 'settings/installation', element: <Navigate to="/settings?tab=installation" replace /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
```

- [ ] **Step 2: Rewrite `src/main.tsx` to use `RouterProvider`**

Replace the entire file:

```tsx
import './i18n'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import './index.css'
import { router } from './App'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <RouterProvider router={router} />
        <Toaster position="bottom-right" richColors />
      </TooltipProvider>
    </QueryClientProvider>
  </StrictMode>,
)
```

Note: `Toaster` moves outside `RouterProvider` — it does not need router context and this keeps it at the top level.

- [ ] **Step 3: Verify build passes**

```bash
cd C:/Users/tonid/Desktop/dojoCode/storytellerFrontMVP
npm run build
```

Expected: build succeeds, no TypeScript errors. The app behaviour is identical to before.

- [ ] **Step 4: Commit**

```bash
git add src/main.tsx src/App.tsx
git commit -m "refactor: migrate to createBrowserRouter for useBlocker support"
```

---

## Task 1: API primitive and hook reset

**Files:**
- Modify: `src/services/api.ts` (after line 425, after `getLinkingToken`)
- Modify: `src/hooks/useInstallation.ts`

- [ ] **Step 1: Add `revokeInstallation` to `api.ts`**

After the `getLinkingToken` function (line 425), add:

```ts
export function revokeInstallation() {
  return request<{ status: string }>('/installation/revoke', { method: 'DELETE' })
}
```

- [ ] **Step 2: Add `resetInstallation` to `useInstallation.ts`**

Replace the entire file:

```ts
import { useEffect, useState, useCallback } from 'react'
import { getMyInstallation } from '../services/api'
import type { Installation } from '../services/api'

const POLL_INTERVAL_MS = 30_000

export function useInstallation() {
  const [installation, setInstallation] = useState<Installation | null>(null)
  const [loading, setLoading] = useState(true)
  const [checked, setChecked] = useState(false)

  const check = useCallback(async () => {
    try {
      const inst = await getMyInstallation()
      setInstallation(inst)
    } catch {
      setInstallation(null)
    } finally {
      setLoading(false)
      setChecked(true)
    }
  }, [])

  useEffect(() => {
    check()
    const interval = setInterval(check, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [check])

  const resetInstallation = useCallback(() => {
    setInstallation(null)
  }, [])

  return {
    installation,
    hasInstallation: installation !== null,
    loading,
    checked,
    resetInstallation,
  }
}
```

- [ ] **Step 3: Build and lint**

```bash
npm run build && npm run lint
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/services/api.ts src/hooks/useInstallation.ts
git commit -m "feat: add revokeInstallation API and resetInstallation hook"
```

---

## Task 2: Add i18n keys

**Files:**
- Modify: `src/i18n/locales/es.json`
- Modify: `src/i18n/locales/en.json`

- [ ] **Step 1: Add keys to `es.json`**

Inside the `"installation"` object (after `"bannerLink"` on line 538), add:

```json
    "copyCommand": "Copiar comando",
    "commandCopied": "Copiado",
    "revokeButton": "Desvincular instalación",
    "revokeDialogTitle": "Desvincular instalación",
    "revokeDialogDesc": "Esto desvinculará el generador de tu cuenta. ¿Continuar?",
    "revokeDialogCancel": "Cancelar",
    "revokeDialogConfirm": "Desvincular",
    "revokeError": "Error al desvincular. Inténtalo de nuevo.",
    "guardTitle": "Generador no vinculado",
    "guardDesc": "Esta página requiere el generador local de StoryTeller. Vincúlalo desde la configuración para continuar.",
    "guardGoSettings": "Ir a configuración",
    "guardGoBack": "Volver",
    "tabDisabledTooltip": "Requiere generador vinculado"
```

At the top level of `es.json` (as a sibling of `"installation"`), add a `"guard"` section:

```json
  "guard": {
    "unsavedTitle": "¿Salir sin guardar?",
    "unsavedDesc": "Perderás los cambios realizados.",
    "unsavedStay": "Quedarme",
    "unsavedLeave": "Salir"
  }
```

- [ ] **Step 2: Add keys to `en.json`**

Mirror the same keys in English:

In `"installation"`:
```json
    "copyCommand": "Copy command",
    "commandCopied": "Copied",
    "revokeButton": "Unlink installation",
    "revokeDialogTitle": "Unlink installation",
    "revokeDialogDesc": "This will unlink the generator from your account. Continue?",
    "revokeDialogCancel": "Cancel",
    "revokeDialogConfirm": "Unlink",
    "revokeError": "Failed to unlink. Please try again.",
    "guardTitle": "Generator not linked",
    "guardDesc": "This page requires the StoryTeller local generator. Link it from settings to continue.",
    "guardGoSettings": "Go to settings",
    "guardGoBack": "Go back",
    "tabDisabledTooltip": "Requires linked generator"
```

At the top level of `en.json`:
```json
  "guard": {
    "unsavedTitle": "Leave without saving?",
    "unsavedDesc": "Your changes will be lost.",
    "unsavedStay": "Stay",
    "unsavedLeave": "Leave"
  }
```

- [ ] **Step 3: Build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/i18n/locales/es.json src/i18n/locales/en.json
git commit -m "feat: add i18n keys for installation UX and form guards"
```

---

## Task 3: Shared guard infrastructure

**Files:**
- Create: `src/hooks/useUnsavedChangesGuard.ts`
- Create: `src/components/UnsavedChangesDialog.tsx`

- [ ] **Step 1: Create `useUnsavedChangesGuard.ts`**

```ts
import { useBlocker } from 'react-router-dom'
import type { Blocker } from 'react-router-dom'

export function useUnsavedChangesGuard(isDirty: boolean): { blocker: Blocker } {
  const blocker = useBlocker(isDirty)
  return { blocker }
}
```

- [ ] **Step 2: Create `UnsavedChangesDialog.tsx`**

```tsx
import type { Blocker } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Props {
  blocker: Blocker
}

export function UnsavedChangesDialog({ blocker }: Props) {
  const { t } = useTranslation()
  return (
    <AlertDialog open={blocker.state === 'blocked'}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('guard.unsavedTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('guard.unsavedDesc')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => blocker.reset?.()}>
            {t('guard.unsavedStay')}
          </AlertDialogCancel>
          <AlertDialogAction onClick={() => blocker.proceed?.()}>
            {t('guard.unsavedLeave')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

- [ ] **Step 3: Build and lint**

```bash
npm run build && npm run lint
```

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useUnsavedChangesGuard.ts src/components/UnsavedChangesDialog.tsx
git commit -m "feat: add useUnsavedChangesGuard hook and UnsavedChangesDialog component"
```

---

## Task 4: InstallationSection — token lift + revoke

**File:** `src/pages/settings/InstallationSection.tsx`

This is the largest single-file change. Read the whole file before editing.

- [ ] **Step 1: Lift `token` state to `InstallationSection` and update `TokenGenerator` signature**

Change `TokenGenerator`'s props to accept controlled `token`/`setToken`:

```tsx
function TokenGenerator({
  compact,
  token,
  setToken,
}: {
  compact?: boolean
  token: string
  setToken: (t: string) => void
}) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    setError('')
    setCopied(false)
    try {
      const result = await getLinkingToken()
      setToken(result.token)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('installation.tokenError'))
    } finally {
      setLoading(false)
    }
  }
  // ... rest of the component is unchanged
```

- [ ] **Step 2: Update `SetupSteps` to accept `token` and interpolate it in step 4**

Change the signature and step 4 content:

```tsx
function SetupSteps({ token }: { token: string }) {
  const { t } = useTranslation()
  const [commandCopied, setCommandCopied] = useState(false)

  const codeBlock = "bg-zinc-900 text-zinc-100 p-3 rounded-md font-mono text-xs leading-relaxed ring-1 ring-zinc-800 overflow-x-auto"

  const dockerCommand = `docker run --name storyteller-generator -e OLLAMA_BASE_URL=http://host.docker.internal:11434 -e RABBIT_URL=amqp://guest:guest@host.docker.internal:5672 -e INSTALLATION_ACCESS_TOKEN=${token || '<tu-token>'} ghcr.io/tonidefez/storyteller-generator`

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(dockerCommand)
    setCommandCopied(true)
    setTimeout(() => setCommandCopied(false), 2000)
  }

  // step 4 content — replace the existing static content with:
  // content: (
  //   <>
  //     <p className="text-sm text-muted-foreground mb-2">{t('installation.step4Desc')}</p>
  //     <div className="relative">
  //       <div className={codeBlock}>
  //         <span className="text-emerald-400">$</span>{' '}
  //         docker run --name storyteller-generator{' '}
  //         -e <span className="text-sky-400">OLLAMA_BASE_URL</span>=<span className="text-amber-300">http://host.docker.internal:11434</span>{' '}
  //         -e <span className="text-sky-400">RABBIT_URL</span>=<span className="text-amber-300">amqp://guest:guest@host.docker.internal:5672</span>{' '}
  //         -e <span className="text-sky-400">INSTALLATION_ACCESS_TOKEN</span>=
  //         <span className={token ? 'text-emerald-400' : 'text-amber-300'}>{token || '<tu-token>'}</span>{' '}
  //         ghcr.io/tonidefez/storyteller-generator
  //       </div>
  //       {token && (
  //         <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="mt-2">
  //           <Button variant="outline" size="sm" onClick={handleCopyCommand} className="w-full gap-1.5">
  //             <AnimatePresence mode="wait">
  //               {commandCopied ? (
  //                 <motion.span key="copied" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 text-emerald-600">
  //                   <Check className="h-3.5 w-3.5" />{t('installation.commandCopied')}
  //                 </motion.span>
  //               ) : (
  //                 <motion.span key="copy" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
  //                   <Copy className="h-3.5 w-3.5" />{t('installation.copyCommand')}
  //                 </motion.span>
  //               )}
  //             </AnimatePresence>
  //           </Button>
  //         </motion.div>
  //       )}
  //     </div>
  //     <p className="text-xs text-muted-foreground mt-2">{t('installation.step4Hint')}</p>
  //   </>
  // ),
```

The comments above show the replacement for step 4's `content` field. Write it as real JSX in the steps array.

- [ ] **Step 3: Add revoke state and handler to `InstallationSection`, wire into linked view**

Add these imports at the top of the file:
```tsx
import { revokeInstallation } from '../../services/api'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Trash2 } from 'lucide-react'
```

In `InstallationSection`, add state and handler:

```tsx
const [token, setToken] = useState('')
const [revoking, setRevoking] = useState(false)
const [revokeError, setRevokeError] = useState('')
const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)

const handleRevoke = async () => {
  setRevoking(true)
  setRevokeError('')
  try {
    await revokeInstallation()
    resetInstallation()
    setRevokeDialogOpen(false)
  } catch {
    setRevokeError(t('installation.revokeError'))
    setRevokeDialogOpen(false)
  } finally {
    setRevoking(false)
  }
}
```

Destructure `resetInstallation` from `useInstallation()`.

In the linked-installation view, add the revoke button next to `LinkedHeader` (inside the Card, above `CardHeader`):

```tsx
<div className="flex items-center justify-end px-6 pt-4">
  <Button
    variant="ghost"
    size="sm"
    className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
    onClick={() => setRevokeDialogOpen(true)}
  >
    <Trash2 className="h-4 w-4" />
    {t('installation.revokeButton')}
  </Button>
</div>
```

Add the dialog (before the closing `</motion.div>` of the linked view):

```tsx
<AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>{t('installation.revokeDialogTitle')}</AlertDialogTitle>
      <AlertDialogDescription>{t('installation.revokeDialogDesc')}</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel disabled={revoking}>{t('installation.revokeDialogCancel')}</AlertDialogCancel>
      <AlertDialogAction
        onClick={handleRevoke}
        disabled={revoking}
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        {revoking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        {t('installation.revokeDialogConfirm')}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

{revokeError && (
  <p className="text-sm text-destructive text-center">{revokeError}</p>
)}
```

- [ ] **Step 4: Wire `token`/`setToken` into no-installation branch**

In the no-installation return branch, pass `token` state to both `SetupSteps` and `TokenGenerator`:

```tsx
<SetupSteps token={token} />
<TokenGenerator token={token} setToken={setToken} />
```

The linked view's `TokenGenerator compact` also needs props:
```tsx
<TokenGenerator compact token={token} setToken={setToken} />
```

- [ ] **Step 5: Build and lint**

```bash
npm run build && npm run lint
```

- [ ] **Step 6: Commit**

```bash
git add src/pages/settings/InstallationSection.tsx
git commit -m "feat: token auto-fill in docker command and revoke installation UI"
```

---

## Task 5: `CreateWorldPage` — installation guard + unsaved guard

**File:** `src/pages/home/CreateWorldPage.tsx`

- [ ] **Step 1: Add imports**

```tsx
import { useNavigate } from 'react-router-dom'  // already imported? add if missing
import { useInstallation } from '@/hooks/useInstallation'
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard'
import { UnsavedChangesDialog } from '@/components/UnsavedChangesDialog'
import { Card, CardContent } from '@/components/ui/card'  // add if missing
import { Server } from 'lucide-react'
import { useTranslation } from 'react-i18next'  // add if missing
```

- [ ] **Step 2: Add hook calls inside the component**

```tsx
const { t } = useTranslation()
const navigate = useNavigate()
const { hasInstallation, loading: installLoading, checked } = useInstallation()

const isDirty = phrase.trim().length > 0 || graph !== null
const { blocker } = useUnsavedChangesGuard(isDirty)
```

- [ ] **Step 3: Add installation guard block**

Before the main `return`, add:

```tsx
if (installLoading) {
  return (
    <div className="flex justify-center items-center h-96">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
}

if (checked && !hasInstallation) {
  return (
    <div className="flex justify-center items-start min-h-[80vh] py-4">
      <div className="w-full max-w-xl mx-auto mt-16 px-4">
        <Card>
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Server className="h-7 w-7 text-primary" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-foreground">{t('installation.guardTitle')}</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">{t('installation.guardDesc')}</p>
            <div className="flex flex-col gap-2 pt-2 max-w-xs mx-auto">
              <Button onClick={() => navigate('/settings?tab=installation')}>
                {t('installation.guardGoSettings')}
              </Button>
              <Button variant="ghost" onClick={() => navigate('/worlds')}>
                {t('installation.guardGoBack')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Clear dirty state before programmatic navigation on save**

`useBlocker` intercepts **programmatic** `navigate()` calls too when `isDirty` is true. On successful save, the component must clear the dirty source state **before** calling `navigate()`. Find `handleSubmit` / the save handler in `CreateWorldPage` and add resets before each `navigate(...)` call on the success path:

```tsx
// Before navigate() on success inside the save handler:
setPhrase('')
setGraph(null)
navigate(`/worlds/${newId}`) // or wherever it navigates after save
```

- [ ] **Step 5: Add `<UnsavedChangesDialog>` to the main return**

At the end of the main `return` JSX (just before the outermost closing tag), add:

```tsx
<UnsavedChangesDialog blocker={blocker} />
```

- [ ] **Step 6: Build and lint**

```bash
npm run build && npm run lint
```

- [ ] **Step 7: Commit**

```bash
git add src/pages/home/CreateWorldPage.tsx
git commit -m "feat: installation guard and unsaved changes guard on CreateWorldPage"
```

---

## Task 6: `EditWorldPage` — unsaved guard

**File:** `src/pages/home/EditWorldPage.tsx`

- [ ] **Step 1: Add imports**

```tsx
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard'
import { UnsavedChangesDialog } from '@/components/UnsavedChangesDialog'
```

- [ ] **Step 2: Compute `isDirty` and wire hook**

After the existing state declarations, add:

```tsx
const isDirty =
  worldData !== null && (
    name !== worldData.name ||
    description !== (worldData.description || '') ||
    factions.filter(f => f.trim()).join(',') !== (worldData.factions || []).join(',')
  )

const { blocker } = useUnsavedChangesGuard(isDirty)
```

Note: `worldData` is already in state (set on line 57 via `setWorldData(data)`). The three editable fields are `name`, `description`, and `factions` — the layer fields are read-only and must not be tracked.

- [ ] **Step 3: Clear dirty state before programmatic navigation on save**

Find `handleSubmit` in `EditWorldPage`. Before calling `navigate(...)` on the success path, update `worldData` to reflect the saved values so `isDirty` becomes `false`:

```tsx
// Before navigate() on success:
setWorldData(prev => prev ? { ...prev, name, description, factions: factions.filter(f => f.trim()) } : prev)
navigate(`/worlds/${id}`)
```

- [ ] **Step 4: Add `<UnsavedChangesDialog>` to the return**

At the end of the returned JSX, before the last closing tag, add:

```tsx
<UnsavedChangesDialog blocker={blocker} />
```

- [ ] **Step 5: Build and lint**

```bash
npm run build && npm run lint
```

- [ ] **Step 6: Commit**

```bash
git add src/pages/home/EditWorldPage.tsx
git commit -m "feat: unsaved changes guard on EditWorldPage"
```

---

## Task 7: `CreateCharacterPage.sanderson.tsx` — Tooltip on generate button + unsaved guard

**File:** `src/pages/characters/CreateCharacterPage.sanderson.tsx`

- [ ] **Step 1: Add imports**

```tsx
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard'
import { UnsavedChangesDialog } from '@/components/UnsavedChangesDialog'
```

- [ ] **Step 2: Wire unsaved guard**

Inside the component, add after the existing hook calls:

```tsx
const isDirty = premise.trim().length > 0 || phase !== 'premise'
const { blocker } = useUnsavedChangesGuard(isDirty)
```

- [ ] **Step 3: Wrap the generate button with Tooltip when no installation**

Find the generate button (around line 339–351). The button already has `disabled={!premise.trim() || !hasInstallation}`. Wrap it so the Tooltip fires even when the button is disabled due to missing installation:

```tsx
{!hasInstallation ? (
  <Tooltip>
    <TooltipTrigger asChild>
      <span className="block w-full">
        <Button
          type="button"
          size="lg"
          className="w-full font-semibold tracking-wide bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 hover:shadow-lg hover:shadow-amber-500/20 hover:-translate-y-0.5 transition-all duration-200 pointer-events-none"
          disabled
        >
          <User className="w-4 h-4 mr-2" />
          {t('character.create.deriveButton')}
        </Button>
      </span>
    </TooltipTrigger>
    <TooltipContent>{t('installation.tabDisabledTooltip')}</TooltipContent>
  </Tooltip>
) : (
  <Button
    type="button"
    size="lg"
    className="w-full font-semibold tracking-wide bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 hover:shadow-lg hover:shadow-amber-500/20 hover:-translate-y-0.5 transition-all duration-200"
    disabled={!premise.trim()}
    onClick={handleDerive}
  >
    <User className="w-4 h-4 mr-2" />
    {t('character.create.deriveButton')}
  </Button>
)}
```

- [ ] **Step 4: Clear dirty state before programmatic navigation on save**

Find the save handler (where `navigate(...)` is called after a successful `createCharacter`). Before `navigate(...)` on success, reset `premise` so `isDirty` becomes `false`:

```tsx
// Before navigate() on success:
setPremise('')
navigate(`/worlds/${worldId}/characters/${savedCharacterId}`)
```

- [ ] **Step 5: Add `<UnsavedChangesDialog>` to the return**

At the end of the returned JSX, before the last closing tag, add:

```tsx
<UnsavedChangesDialog blocker={blocker} />
```

- [ ] **Step 6: Build and lint**

```bash
npm run build && npm run lint
```

- [ ] **Step 7: Commit**

```bash
git add src/pages/characters/CreateCharacterPage.sanderson.tsx
git commit -m "feat: installation tooltip and unsaved guard on CreateCharacterPage"
```

---

## Task 8: `EditCharacterPage.tsx` — baseline snapshot + unsaved guard

**File:** `src/pages/characters/EditCharacterPage.tsx`

- [ ] **Step 1: Add imports**

```tsx
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard'
import { UnsavedChangesDialog } from '@/components/UnsavedChangesDialog'
```

- [ ] **Step 2: Add baseline interface (module scope) and state**

Add the interface at **module scope** (outside the component function, near the top of the file, after the imports):

```tsx
interface CharacterBaseline {
  name: string
  role: string
  personalityTags: string[]
  background: string
  goals: string[]
  premise: string
  socialPosition: string
  internalContradiction: string
  relationToCollectiveLie: string
  personalFear: string
  factionAffiliation: string
}
```

Inside the component, after the existing state declarations:

```tsx
const [baseline, setBaseline] = useState<CharacterBaseline | null>(null)
```

- [ ] **Step 3: Capture baseline on fetch**

Inside the `getCharacterById(...).then(data => { ... })` block (around line 57–72), after all the `setState` calls, add:

```tsx
setBaseline({
  name: data.name,
  role: data.role,
  personalityTags: data.personality ? data.personality.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
  background: data.background,
  goals: data.goals?.length ? data.goals : [''],
  premise: data.premise ?? '',
  socialPosition: data.social_position ?? '',
  internalContradiction: data.internal_contradiction ?? '',
  relationToCollectiveLie: data.relation_to_collective_lie ?? '',
  personalFear: data.personal_fear ?? '',
  factionAffiliation: data.faction_affiliation ?? '',
})
```

- [ ] **Step 4: Compute `isDirty` and wire hook**

After the baseline state, add:

```tsx
const isDirty =
  baseline !== null && (
    name !== baseline.name ||
    role !== baseline.role ||
    personalityTags.join(',') !== baseline.personalityTags.join(',') ||
    background !== baseline.background ||
    goals.join(',') !== baseline.goals.join(',') ||
    premise !== baseline.premise ||
    socialPosition !== baseline.socialPosition ||
    internalContradiction !== baseline.internalContradiction ||
    relationToCollectiveLie !== baseline.relationToCollectiveLie ||
    personalFear !== baseline.personalFear ||
    factionAffiliation !== baseline.factionAffiliation
  )

const { blocker } = useUnsavedChangesGuard(isDirty)
```

- [ ] **Step 5: Clear dirty state before programmatic navigation on save**

Find `handleSubmit` in `EditCharacterPage`. Before `navigate(...)` on success, update the baseline to match the saved values so `isDirty` becomes `false`:

```tsx
// Before navigate() on success:
setBaseline({ name, role, personalityTags, background, goals, premise, socialPosition, internalContradiction, relationToCollectiveLie, personalFear, factionAffiliation })
navigate(`/worlds/${originalWorldId}/characters/${characterId}`)
```

- [ ] **Step 6: Add `<UnsavedChangesDialog>` to the return**

At the end of the returned JSX, before the last closing tag:

```tsx
<UnsavedChangesDialog blocker={blocker} />
```

- [ ] **Step 7: Build and lint**

```bash
npm run build && npm run lint
```

- [ ] **Step 8: Commit**

```bash
git add src/pages/characters/EditCharacterPage.tsx
git commit -m "feat: baseline snapshot and unsaved guard on EditCharacterPage"
```

---

## Task 9: `CreateScenePage.tsx` — disable AI tab + unsaved guard

**File:** `src/pages/scenes/CreateScenePage.tsx`

- [ ] **Step 1: Add imports**

```tsx
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard'
import { UnsavedChangesDialog } from '@/components/UnsavedChangesDialog'
```

- [ ] **Step 2: Wire unsaved guard**

```tsx
const isDirty = title.trim().length > 0 || location.trim().length > 0 || tone !== '' || time !== '' || context.trim().length > 0
const { blocker } = useUnsavedChangesGuard(isDirty)
```

- [ ] **Step 3: Wrap the "IA" `TabsTrigger` with the span+Tooltip pattern**

Find the `TabsTrigger value="ai"` (around line 182). Replace it with:

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <span>
      <TabsTrigger
        value="ai"
        disabled={!hasInstallation}
        style={!hasInstallation ? { pointerEvents: 'none' } : undefined}
      >
        {t('scene.create.aiTab')}
      </TabsTrigger>
    </span>
  </TooltipTrigger>
  {!hasInstallation && (
    <TooltipContent>{t('installation.tabDisabledTooltip')}</TooltipContent>
  )}
</Tooltip>
```

- [ ] **Step 4: Clear dirty state before programmatic navigation on save**

Find the manual form submit handler in `CreateScenePage`. Before `navigate(...)` on success, reset the form fields so `isDirty` becomes `false`:

```tsx
// Before navigate() on success:
setTitle('')
setLocation('')
setTime('')
setTone('')
setContext('')
navigate(`/worlds/${worldId}`)
```

- [ ] **Step 5: Add `<UnsavedChangesDialog>` to the return**

```tsx
<UnsavedChangesDialog blocker={blocker} />
```

- [ ] **Step 6: Build and lint**

```bash
npm run build && npm run lint
```

- [ ] **Step 7: Commit**

```bash
git add src/pages/scenes/CreateScenePage.tsx
git commit -m "feat: disable AI tab and unsaved guard on CreateScenePage"
```

---

## Task 10: `EditScenePage.tsx` — unsaved guard

**File:** `src/pages/scenes/EditScenePage.tsx`

- [ ] **Step 1: Add imports**

```tsx
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard'
import { UnsavedChangesDialog } from '@/components/UnsavedChangesDialog'
```

- [ ] **Step 2: Add baseline interface (module scope) and state**

Add the interface at **module scope** (outside the component, after imports):

```tsx
interface SceneBaseline {
  title: string
  location: string
  time: string
  tone: string
  context: string
}
```

Inside the component, after the existing state declarations:

```tsx
const [baseline, setBaseline] = useState<SceneBaseline | null>(null)
```

In `getSceneById(...).then(data => { ... })`, after all `setState` calls, add:

```tsx
setBaseline({
  title: data.title,
  location: data.location,
  time: data.time,
  tone: data.tone,
  context: data.context,
})
```

- [ ] **Step 3: Compute `isDirty` and wire hook**

```tsx
const isDirty =
  baseline !== null && (
    title !== baseline.title ||
    location !== baseline.location ||
    time !== baseline.time ||
    tone !== baseline.tone ||
    context !== baseline.context
  )

const { blocker } = useUnsavedChangesGuard(isDirty)
```

- [ ] **Step 4: Clear dirty state before programmatic navigation on save**

Find `handleSubmit` in `EditScenePage`. Before `navigate(...)` on success, update the baseline to match the saved values:

```tsx
// Before navigate() on success:
setBaseline({ title, location, time, tone, context })
navigate(`/worlds/${worldId}/scenes/${sceneId}`)
```

- [ ] **Step 5: Add `<UnsavedChangesDialog>` to the return**

```tsx
<UnsavedChangesDialog blocker={blocker} />
```

- [ ] **Step 6: Build and lint**

```bash
npm run build && npm run lint
```

- [ ] **Step 7: Commit**

```bash
git add src/pages/scenes/EditScenePage.tsx
git commit -m "feat: baseline snapshot and unsaved guard on EditScenePage"
```

---

## Final Verification

- [ ] Run full build and lint one last time

```bash
npm run build && npm run lint
```

- [ ] Manual smoke test checklist:
  - [ ] App loads; navigate between routes normally
  - [ ] Settings → Installation (no installation): generate a token → step 4 Docker command updates; "Copiar comando" copies full command
  - [ ] Settings → Installation (linked): "Desvincular instalación" button visible; dialog opens; confirming revoke returns to wizard
  - [ ] `/worlds/create` with no installation → blocker card shown, "Volver" → `/worlds`
  - [ ] `/worlds/create` with installation → form shown; type in phrase → navigate away → dialog appears; "Quedarme" stays; "Salir" leaves
  - [ ] Character create with no installation → generate button has tooltip, is disabled
  - [ ] Scene create with no installation → IA tab has tooltip, is disabled
  - [ ] Any edit page: make a change → navigate away → dialog appears
  - [ ] Any edit page: save → navigate without dialog

- [ ] Final commit if any fixes were needed
