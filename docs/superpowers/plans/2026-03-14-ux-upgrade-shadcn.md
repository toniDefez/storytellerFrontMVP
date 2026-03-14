# UX/UI Upgrade + shadcn Migration — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the entire StoryTeller frontend to use shadcn/ui components with a unified design system, fixing all UX inconsistencies identified in the audit.

**Architecture:** Initialize shadcn/ui with CSS variables for theming, extract shared form components, replace all custom modals with shadcn Dialog/AlertDialog + Sonner toasts, add Breadcrumb navigation, and migrate each page to use the new component library. The PillSelect component and WorldCard climate gradients are preserved as differentiators.

**Tech Stack:** React 19, TypeScript, Vite 6, Tailwind CSS v4, shadcn/ui, Sonner (toasts), Lucide React (icons), framer-motion (preserved for PillSelect/WorldCard)

---

## Chunk 1: Foundation — shadcn Init + Design Tokens + Shared Components

### Task 1: Initialize shadcn/ui

**Files:**
- Create: `components.json`
- Create: `src/lib/utils.ts`
- Modify: `src/index.css`
- Modify: `package.json`

- [ ] **Step 1: Install shadcn dependencies**

```bash
npx shadcn@latest init
```

Select: TypeScript, New York style, Slate base color, CSS variables YES, `@/` import alias.
This creates `components.json`, `src/lib/utils.ts`, and updates `src/index.css` with CSS variables.

- [ ] **Step 2: Override CSS variables with our design tokens**

In `src/index.css`, ensure these CSS variables are set in the `:root` layer (after shadcn init):

```css
@layer base {
  :root {
    --background: 0 0% 98%;
    --foreground: 222 47% 11%;
    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;
    --popover: 0 0% 100%;
    --popover-foreground: 222 47% 11%;
    --primary: 263 70% 50%;
    --primary-foreground: 0 0% 100%;
    --secondary: 220 14% 96%;
    --secondary-foreground: 220 9% 46%;
    --muted: 220 14% 96%;
    --muted-foreground: 215 16% 47%;
    --accent: 263 80% 95%;
    --accent-foreground: 263 70% 50%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 220 13% 91%;
    --input: 220 13% 91%;
    --ring: 263 70% 50%;
    --radius: 0.5rem;
  }
}
```

Preserve existing custom CSS (fade-in animation, focus-visible, reduced-motion).

- [ ] **Step 3: Install Inter font**

Add to `index.html` `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Add to CSS: `body { font-family: 'Inter', system-ui, sans-serif; }`

- [ ] **Step 4: Install Lucide React for icons**

```bash
npm install lucide-react
```

- [ ] **Step 5: Verify dev server runs**

```bash
npm run dev
```

Confirm no errors, existing pages still render.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: initialize shadcn/ui with design tokens and Inter font"
```

---

### Task 2: Install shadcn components (batch)

**Files:**
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/textarea.tsx`
- Create: `src/components/ui/label.tsx`
- Create: `src/components/ui/card.tsx`
- Create: `src/components/ui/dialog.tsx`
- Create: `src/components/ui/alert-dialog.tsx`
- Create: `src/components/ui/tabs.tsx`
- Create: `src/components/ui/badge.tsx`
- Create: `src/components/ui/separator.tsx`
- Create: `src/components/ui/breadcrumb.tsx`
- Create: `src/components/ui/skeleton.tsx`
- Create: `src/components/ui/alert.tsx`
- Create: `src/components/ui/sheet.tsx`
- Create: `src/components/ui/sonner.tsx`
- Create: `src/components/ui/tooltip.tsx`

- [ ] **Step 1: Install all components**

```bash
npx shadcn@latest add button input textarea label card dialog alert-dialog tabs badge separator breadcrumb skeleton alert sheet sonner tooltip
```

- [ ] **Step 2: Install Sonner dependency**

```bash
npm install sonner
```

- [ ] **Step 3: Add Toaster to main.tsx**

Modify `src/main.tsx` — add `<Toaster />` from sonner after `<App />`:

```tsx
import { Toaster } from '@/components/ui/sonner'

// Inside render:
<BrowserRouter>
  <App />
  <Toaster position="bottom-right" richColors />
</BrowserRouter>
```

- [ ] **Step 4: Verify build passes**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: install 16 shadcn components and configure Sonner toaster"
```

---

### Task 3: Extract shared form components

**Files:**
- Create: `src/components/form/FieldGroup.tsx`
- Create: `src/components/form/SectionDivider.tsx`
- Modify: `src/pages/home/CreateWorldPage.tsx` (remove local definitions, import shared)
- Modify: `src/pages/characters/CreateCharacterPage.tsx` (remove local definitions, import shared)
- Modify: `src/pages/scenes/CreateScenePage.tsx` (remove local definitions, import shared)

- [ ] **Step 1: Create FieldGroup component**

`src/components/form/FieldGroup.tsx`:
```tsx
import { Label } from '@/components/ui/label'

interface FieldGroupProps {
  label: string
  htmlFor?: string
  hint?: string
  children: React.ReactNode
}

export function FieldGroup({ label, htmlFor, hint, children }: FieldGroupProps) {
  return (
    <div className="mb-5">
      <div className="flex items-baseline gap-2 mb-2">
        <Label htmlFor={htmlFor} className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
          {label}
        </Label>
        {hint && <span className="text-[10px] text-muted-foreground/60 italic">{hint}</span>}
      </div>
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Create SectionDivider component**

`src/components/form/SectionDivider.tsx`:
```tsx
import { Separator } from '@/components/ui/separator'

export function SectionDivider({ label }: { label: string }) {
  return (
    <div className="relative my-6 flex items-center gap-3">
      <Separator className="flex-1" />
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.18em]">{label}</span>
      <Separator className="flex-1" />
    </div>
  )
}
```

- [ ] **Step 3: Update CreateWorldPage — remove local FieldGroup/SectionDivider/inputClass/textareaClass, import shared**

Remove lines 45-65 (SectionDivider, FieldGroup, inputClass, textareaClass definitions).
Add imports:
```tsx
import { FieldGroup } from '@/components/form/FieldGroup'
import { SectionDivider } from '@/components/form/SectionDivider'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
```

Replace all `<input className={inputClass} ...>` with `<Input ...>`.
Replace all `<textarea className={textareaClass} ...>` with `<Textarea className="min-h-[90px] resize-none" ...>`.

- [ ] **Step 4: Update CreateCharacterPage — same pattern**

Remove local SectionDivider, FieldGroup, inputClass, textareaClass.
Import shared components. Replace inputs/textareas.

- [ ] **Step 5: Update CreateScenePage — same pattern**

Remove local SectionDivider, FieldGroup, inputClass, textareaClass.
Import shared components. Replace inputs/textareas.

- [ ] **Step 6: Verify dev server — all 3 create pages render**

```bash
npm run dev
```

Navigate to `/worlds/create`, verify form renders. Visual differences are expected (shadcn Input style vs custom).

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "refactor: extract shared FieldGroup and SectionDivider, migrate forms to shadcn Input/Textarea"
```

---

## Chunk 2: Component Migration — Buttons, Cards, Modals, Feedback

### Task 4: Migrate all buttons to shadcn Button

**Files:**
- Modify: `src/pages/login/LoginPage.tsx`
- Modify: `src/pages/register/RegisterPage.tsx`
- Modify: `src/pages/home/HomePage.tsx`
- Modify: `src/pages/home/CreateWorldPage.tsx`
- Modify: `src/pages/home/WorldDetailPage.tsx`
- Modify: `src/pages/characters/CreateCharacterPage.tsx`
- Modify: `src/pages/characters/CharacterDetailPage.tsx`
- Modify: `src/pages/scenes/CreateScenePage.tsx`
- Modify: `src/pages/scenes/SceneDetailPage.tsx`
- Modify: `src/pages/settings/InstallationPage.tsx`
- Modify: `src/pages/NotFoundPage.tsx`

- [ ] **Step 1: Import Button in each page and replace inline button styles**

Rules:
- Primary action (submit, create, save): `<Button size="lg" className="w-full">` — replaces all gradient buttons
- Destructive (delete): `<Button variant="destructive" size="sm">` — replaces `bg-red-500` buttons
- Secondary (cancel, back, add character/scene): `<Button variant="secondary" size="sm">` — replaces `bg-green-500` buttons
- Ghost (sidebar nav, tertiary): `<Button variant="ghost">` — replaces text-only buttons
- Loading state: `<Button disabled>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando...</> : 'Crear'}</Button>`

Import `Loader2` from `lucide-react` for spinners.

Each page: add `import { Button } from '@/components/ui/button'` and `import { Loader2 } from 'lucide-react'`.

**LoginPage.tsx**: Replace submit button gradient with `<Button size="lg" className="w-full">Entrar</Button>`.

**RegisterPage.tsx**: Replace submit button gradient with `<Button size="lg" className="w-full">Registrarse</Button>`.

**HomePage.tsx**: Replace "Nuevo mundo" `motion.button` with `<Button>`. Replace empty-state CTA. Keep `motion.div` wrapper for stagger animation but use `<Button>` inside.

**CreateWorldPage.tsx**: Replace submit gradient with `<Button size="lg" className="w-full" disabled={loading}>`. Replace AI generate button. Replace "Guardar este mundo" button.

**WorldDetailPage.tsx**: Replace "Borrar" `bg-red-500` with `<Button variant="destructive" size="sm">`. Replace "+ Crear personaje" and "+ Crear escena" `bg-green-500` with `<Button variant="secondary" size="sm" asChild><Link to="...">`.

**CreateCharacterPage.tsx**: Same pattern as CreateWorldPage.

**CreateScenePage.tsx**: Same pattern as CreateWorldPage.

**SceneDetailPage.tsx**: Replace "Borrar" with destructive Button. Replace "+ Añadir personaje" with secondary Button. Replace "Generar eventos" and "Generar narrativa" gradient buttons with primary Buttons. Replace "Añadir" blue button with `<Button size="sm">`.

**InstallationPage.tsx**: Replace "Generar token" gradient with `<Button size="lg" className="w-full">`. Replace "Copiar" blue button with `<Button variant="secondary" size="sm">`.

**CharacterDetailPage.tsx**: Replace "Volver al mundo" link with `<Button variant="ghost" size="sm" asChild><Link>`.

**NotFoundPage.tsx**: Replace gradient button with `<Button size="lg">`. Change navigate('/') to navigate('/worlds').

- [ ] **Step 2: Verify all pages render with new buttons**

```bash
npm run dev
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: migrate all buttons to shadcn Button with consistent variants"
```

---

### Task 5: Replace modals with shadcn AlertDialog + Sonner toasts

**Files:**
- Delete: `src/components/ErrorModal.tsx`
- Delete: `src/components/SuccessModal.tsx`
- Modify: `src/components/ConfirmModal.tsx` (rewrite using AlertDialog)
- Modify: `src/pages/login/LoginPage.tsx` (remove ErrorModal, use toast)
- Modify: `src/pages/register/RegisterPage.tsx` (remove SuccessModal, use toast)

- [ ] **Step 1: Rewrite ConfirmModal using AlertDialog**

Replace entire `src/components/ConfirmModal.tsx` with:

```tsx
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
import { buttonVariants } from '@/components/ui/button'

interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  danger = false,
}: ConfirmModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={danger ? buttonVariants({ variant: 'destructive' }) : undefined}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

- [ ] **Step 2: Update LoginPage — remove ErrorModal, use toast.error()**

Remove `import ErrorModal` and the `<ErrorModal>` JSX.
Remove `showErrorModal` state.
Add `import { toast } from 'sonner'`.
In catch block: replace `setShowErrorModal(true)` with `toast.error('Error de inicio de sesión', { description: 'Credenciales incorrectas' })`.
Remove inline error `{error && <p>...}` — the toast handles it.

- [ ] **Step 3: Update RegisterPage — remove SuccessModal, use toast.success()**

Remove `import SuccessModal` and the `<SuccessModal>` JSX.
Remove `showSuccess` state.
Add `import { toast } from 'sonner'`.
In success: `toast.success('¡Registro exitoso!', { description: 'Tu cuenta ha sido creada.' })` then `setTimeout(() => navigate('/'), 1500)`.

- [ ] **Step 4: Delete ErrorModal.tsx and SuccessModal.tsx**

```bash
rm src/components/ErrorModal.tsx src/components/SuccessModal.tsx
```

- [ ] **Step 5: Verify — login error shows toast, register success shows toast, delete confirmation works**

```bash
npm run dev
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: replace modals with shadcn AlertDialog + Sonner toasts"
```

---

### Task 6: Migrate error/alert patterns to shadcn Alert

**Files:**
- Modify: `src/components/NoInstallationBanner.tsx` (rewrite with Alert)
- Modify: `src/pages/home/CreateWorldPage.tsx` (error div → Alert)
- Modify: `src/pages/characters/CreateCharacterPage.tsx` (error div → Alert)
- Modify: `src/pages/scenes/CreateScenePage.tsx` (error div → Alert)
- Modify: `src/pages/scenes/SceneDetailPage.tsx` (error div → Alert)
- Modify: `src/pages/home/WorldDetailPage.tsx` (error text → Alert)
- Modify: `src/pages/home/HomePage.tsx` (error text → Alert)

- [ ] **Step 1: Rewrite NoInstallationBanner with shadcn Alert**

```tsx
import { useNavigate } from 'react-router-dom'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function NoInstallationBanner() {
  const navigate = useNavigate()

  return (
    <Alert variant="destructive" className="mb-6 border-amber-300 bg-amber-50 text-amber-800 [&>svg]:text-amber-600">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Instalación local no detectada</AlertTitle>
      <AlertDescription className="mt-1">
        Para generar contenido con IA necesitas tener una instalación local vinculada a tu cuenta.
        <Button variant="link" className="h-auto p-0 ml-1 text-amber-700 underline" onClick={() => navigate('/settings/installation')}>
          Configurar instalación
        </Button>
      </AlertDescription>
    </Alert>
  )
}
```

- [ ] **Step 2: Replace error divs in create pages**

In CreateWorldPage, CreateCharacterPage, CreateScenePage — replace:
```tsx
{error && <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}
```
With:
```tsx
{error && (
  <Alert variant="destructive" className="mb-5">
    <AlertDescription>{error}</AlertDescription>
  </Alert>
)}
```

Import `Alert, AlertDescription` from `@/components/ui/alert`.

- [ ] **Step 3: Replace error states in HomePage, WorldDetailPage**

HomePage error state: replace plain text div with Alert centered in the page.
WorldDetailPage: same pattern for the error/not-found states.

- [ ] **Step 4: Verify**

```bash
npm run dev
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: migrate error patterns and NoInstallationBanner to shadcn Alert"
```

---

## Chunk 3: Page-Level Migration — Auth, Layout, Navigation

### Task 7: Unify auth pages (Login + Register)

**Files:**
- Modify: `src/pages/login/LoginPage.tsx`
- Modify: `src/pages/register/RegisterPage.tsx`
- Delete: `src/components/EmailInput.tsx`
- Delete: `src/components/PasswordInput.tsx`

- [ ] **Step 1: Rewrite LoginPage with shadcn components**

Replace the entire JSX with:
- Unified background: `bg-background` with subtle SVG pattern (keep one SVG, same for both pages)
- Card from shadcn: `<Card className="w-full max-w-md shadow-xl">`
- Logo at top of card
- `<Label>` + `<Input>` from shadcn for email and password
- Password toggle stays (rewrite with lucide icons: `Eye`, `EyeOff`)
- `<Button>` for submit
- Remove `ErrorModal` import (already done in Task 5)
- Add inline `<Alert variant="destructive">` for errors (or keep toast from Task 5)

- [ ] **Step 2: Rewrite RegisterPage with same pattern**

Same visual structure as Login for consistency.
Keep validation logic from `utils/validation.ts`.
Show field-level errors under each input using `<p className="text-sm text-destructive mt-1">`.

- [ ] **Step 3: Delete EmailInput.tsx and PasswordInput.tsx**

The validation logic they contained moves inline to the auth pages (it's simple enough).
```bash
rm src/components/EmailInput.tsx src/components/PasswordInput.tsx
```

- [ ] **Step 4: Verify both auth pages render with unified style**

```bash
npm run dev
```

Navigate to `/` and `/register`. Both should have the same background and card style.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: unify auth pages with shadcn Card/Input/Label, delete custom inputs"
```

---

### Task 8: Add Breadcrumb navigation

**Files:**
- Create: `src/components/PageBreadcrumb.tsx`
- Modify: `src/pages/home/CreateWorldPage.tsx`
- Modify: `src/pages/home/WorldDetailPage.tsx`
- Modify: `src/pages/characters/CreateCharacterPage.tsx`
- Modify: `src/pages/characters/CharacterDetailPage.tsx`
- Modify: `src/pages/scenes/CreateScenePage.tsx`
- Modify: `src/pages/scenes/SceneDetailPage.tsx`
- Modify: `src/pages/settings/InstallationPage.tsx`

- [ ] **Step 1: Create PageBreadcrumb component**

`src/components/PageBreadcrumb.tsx`:
```tsx
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Link } from 'react-router-dom'
import { Fragment } from 'react'

interface BreadcrumbEntry {
  label: string
  href?: string
}

export function PageBreadcrumb({ items }: { items: BreadcrumbEntry[] }) {
  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        {items.map((item, i) => (
          <Fragment key={i}>
            {i > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {i === items.length - 1 ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={item.href!}>{item.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
```

- [ ] **Step 2: Add breadcrumbs to each page**

Examples:
- **CreateWorldPage**: `[{label: 'Mundos', href: '/worlds'}, {label: 'Crear mundo'}]`
- **WorldDetailPage**: `[{label: 'Mundos', href: '/worlds'}, {label: world.name}]`
- **CreateCharacterPage**: `[{label: 'Mundos', href: '/worlds'}, {label: 'Mundo', href: '/worlds/' + worldId}, {label: 'Crear personaje'}]`
  - Note: world name not available without extra fetch — use "Mundo" as fallback or pass via state
- **CharacterDetailPage**: `[{label: 'Mundos', href: '/worlds'}, {label: 'Mundo', href: '/worlds/' + worldId}, {label: character.name}]`
- **CreateScenePage**: same pattern as CreateCharacterPage
- **SceneDetailPage**: `[{label: 'Mundos', href: '/worlds'}, {label: 'Mundo', href: '/worlds/' + worldId}, {label: scene.title}]`
- **InstallationPage**: `[{label: 'Configuración'}, {label: 'Instalación'}]`

Add `<PageBreadcrumb items={[...]} />` as the first element in each page's return.

- [ ] **Step 3: Verify breadcrumbs appear and links work**

```bash
npm run dev
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add breadcrumb navigation to all inner pages"
```

---

### Task 9: Migrate Cards and Badges across detail pages

**Files:**
- Modify: `src/pages/home/WorldDetailPage.tsx`
- Modify: `src/pages/characters/CharacterDetailPage.tsx`
- Modify: `src/pages/scenes/SceneDetailPage.tsx`
- Modify: `src/pages/settings/InstallationPage.tsx`
- Modify: `src/components/WorldCard.tsx`

- [ ] **Step 1: WorldDetailPage — wrap sections in Card**

Replace `<div className="bg-white/90 shadow-2xl rounded-2xl p-8 border border-gray-200">` with:
```tsx
<Card>
  <CardHeader>...</CardHeader>
  <CardContent>...</CardContent>
</Card>
```

Replace faction `<span>` tags with `<Badge variant="outline">`.
Replace character goal tags with `<Badge variant="secondary">`.
Replace scene attribute tags (location/time/tone) with `<Badge>` using appropriate colors via className.

- [ ] **Step 2: CharacterDetailPage — wrap in Card, use Badge for personality**

Replace main container with `<Card>`.
Replace personality `<span>` tags with `<Badge variant="outline">`.

- [ ] **Step 3: SceneDetailPage — wrap each section in Card, use Badge for attributes**

Replace each `<div className="bg-white/90 shadow-xl...">` with `<Card>`.
Replace scene attribute badges (location/time/tone) with `<Badge>`.
Replace event number badges with `<Badge variant="secondary">`.

- [ ] **Step 4: InstallationPage — wrap in Card**

Replace containers with `<Card>`, `<CardHeader>`, `<CardContent>`.

- [ ] **Step 5: WorldCard — use Badge for tags**

Replace inline `<span>` climate/politics/culture tags with `<Badge variant="secondary">`.
Replace faction `<span>` tags with `<Badge variant="outline">`.
Keep the motion.div wrapper and climate gradient header.

- [ ] **Step 6: Verify all detail pages**

```bash
npm run dev
```

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: migrate detail pages to shadcn Card and Badge"
```

---

### Task 10: Migrate create page tabs to shadcn Tabs

**Files:**
- Modify: `src/pages/home/CreateWorldPage.tsx`
- Modify: `src/pages/characters/CreateCharacterPage.tsx`
- Modify: `src/pages/scenes/CreateScenePage.tsx`

- [ ] **Step 1: Replace custom tabs in all 3 pages**

Replace the custom tab div:
```tsx
<div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-8 w-fit">
  <button onClick={() => setMode('manual')} ...>Manual</button>
  <button onClick={() => setMode('ai')} ...>Generar con IA</button>
</div>
```

With shadcn Tabs:
```tsx
<Tabs defaultValue="manual" onValueChange={(v) => setMode(v as 'manual' | 'ai')} className="mb-8">
  <TabsList>
    <TabsTrigger value="manual">Manual</TabsTrigger>
    <TabsTrigger value="ai">Generar con IA</TabsTrigger>
  </TabsList>
  <TabsContent value="manual">
    {/* manual form */}
  </TabsContent>
  <TabsContent value="ai">
    {/* ai form */}
  </TabsContent>
</Tabs>
```

Remove `mode` state — Tabs manages it internally. If `mode` is needed elsewhere, keep the `onValueChange` handler.

- [ ] **Step 2: Wrap create page content in Card**

Wrap the outer container of each create page in `<Card>` with the accent bar:
```tsx
<Card className="max-w-2xl mx-auto overflow-hidden">
  <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500" />
  <CardHeader>
    <CardTitle>Crear nuevo mundo</CardTitle>
    <CardDescription>Define el escenario donde tu historia tomará vida.</CardDescription>
  </CardHeader>
  <CardContent>
    {/* tabs + form */}
  </CardContent>
</Card>
```

- [ ] **Step 3: Verify all create pages**

```bash
npm run dev
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: migrate create page tabs to shadcn Tabs, wrap in Card"
```

---

## Chunk 4: Layout, Skeleton Loading, and Polish

### Task 11: Add skeleton loading states

**Files:**
- Create: `src/components/skeletons/WorldCardSkeleton.tsx`
- Create: `src/components/skeletons/DetailSkeleton.tsx`
- Modify: `src/pages/home/HomePage.tsx`
- Modify: `src/pages/home/WorldDetailPage.tsx`
- Modify: `src/pages/characters/CharacterDetailPage.tsx`
- Modify: `src/pages/scenes/SceneDetailPage.tsx`

- [ ] **Step 1: Create WorldCardSkeleton**

```tsx
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export function WorldCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-[120px] w-full rounded-none" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-5 w-3/5" />
        <Skeleton className="h-3 w-2/5" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
    </Card>
  )
}
```

- [ ] **Step 2: Create DetailSkeleton**

```tsx
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function DetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 mt-8">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-2/3" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Replace loading states in pages**

**HomePage**: Replace `"Cargando mundos..."` text with a grid of 6 `<WorldCardSkeleton />`.

**WorldDetailPage**: Replace loading text with `<DetailSkeleton />`.

**CharacterDetailPage**: Replace loading text with `<DetailSkeleton />`.

**SceneDetailPage**: Replace loading text with `<DetailSkeleton />`.

- [ ] **Step 4: Verify**

```bash
npm run dev
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add skeleton loading states to replace plain text loaders"
```

---

### Task 12: Migrate sidebar mobile to shadcn Sheet

**Files:**
- Modify: `src/layouts/MainLayout.tsx`

- [ ] **Step 1: Replace mobile sidebar overlay with Sheet**

Replace the mobile sidebar section (the `{sidebarOpen && ...}` block) with:

```tsx
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'

{/* Mobile sidebar */}
<Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
  <SheetContent side="left" className="p-0 w-60">
    <SheetTitle className="sr-only">Navegación</SheetTitle>
    <Sidebar onLogout={handleLogout} />
  </SheetContent>
</Sheet>
```

Remove the manual overlay div and the custom mobile sidebar div.
Replace SVG icons in sidebar with lucide-react icons: `Globe`, `Settings`, `LogOut`, `Menu`, `X`.

- [ ] **Step 2: Verify mobile sidebar opens/closes**

```bash
npm run dev
```

Test at mobile viewport width.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: migrate mobile sidebar to shadcn Sheet, replace SVG icons with lucide"
```

---

### Task 13: Update PillSelect colors to design tokens

**Files:**
- Modify: `src/components/PillSelect.tsx`

- [ ] **Step 1: Update class names to use CSS variable-based colors**

Replace selected pill classes:
- FROM: `bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200`
- TO: `bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20`

Replace unselected pill classes:
- FROM: `bg-white text-gray-600 border-gray-200 hover:border-violet-400 hover:text-violet-700 hover:bg-violet-50`
- TO: `bg-background text-muted-foreground border-input hover:border-primary hover:text-accent-foreground hover:bg-accent`

Replace description bar:
- FROM: `border-l-2 border-violet-400 bg-gradient-to-r from-violet-50 to-transparent`
- TO: `border-l-2 border-primary/40 bg-accent`

Replace description text:
- FROM: `text-[11px] text-violet-700 italic`
- TO: `text-[11px] text-accent-foreground italic`

Apply same changes to MultiPillSelect.

- [ ] **Step 2: Verify PillSelect renders correctly**

```bash
npm run dev
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "refactor: update PillSelect colors to use design tokens"
```

---

### Task 14: Final cleanup and build verification

**Files:**
- Modify: `src/pages/NotFoundPage.tsx` (fix redirect, remove gradient)
- Verify: all files compile

- [ ] **Step 1: Fix NotFoundPage**

- Change navigate('/') to navigate('/worlds')
- Replace gradient background with `bg-background`
- Replace gradient button with `<Button>`
- Replace external image with lucide `FileQuestion` icon

- [ ] **Step 2: Remove unused imports across all files**

Search for any remaining imports of deleted components (ErrorModal, SuccessModal, EmailInput, PasswordInput).

- [ ] **Step 3: Full build check**

```bash
npm run build
```

Fix any TypeScript errors.

- [ ] **Step 4: Lint check**

```bash
npm run lint
```

Fix any lint errors.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: final cleanup, fix NotFoundPage, verify build"
```

---

## Summary

| Task | What | Files touched |
|------|------|---------------|
| 1 | Initialize shadcn + tokens | 4 |
| 2 | Install 16 components + Sonner | 17 |
| 3 | Extract shared form components | 5 |
| 4 | Migrate all buttons | 11 |
| 5 | Replace modals with AlertDialog + toasts | 5 |
| 6 | Migrate error/alert patterns | 7 |
| 7 | Unify auth pages | 4 |
| 8 | Add breadcrumbs | 8 |
| 9 | Migrate Cards and Badges | 5 |
| 10 | Migrate create page tabs | 3 |
| 11 | Add skeleton loading | 6 |
| 12 | Migrate sidebar to Sheet | 1 |
| 13 | Update PillSelect tokens | 1 |
| 14 | Final cleanup + build | all |

**Total: 14 tasks, ~70 files touched**

After completion, run `/critique` and `/polish` skills for final quality pass.
