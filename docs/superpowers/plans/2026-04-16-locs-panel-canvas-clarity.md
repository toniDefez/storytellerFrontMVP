# Locs Panel + Canvas Clarity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar la vista Locs de `/worlds/:id` para eliminar el panel permanente cuando no hay selección, reorganizar la jerarquía de acciones en el panel de detalle, sacar editar/eliminar a una `NodeToolbar` contextual sobre el nodo, y añadir level-of-detail al canvas para reducir el ruido visual a zoom bajo.

**Architecture:** 7 cambios focalizados, todos dentro de `src/components/world-graph/` + un hook nuevo en `src/hooks/`. Cero dependencias nuevas (se usa `NodeToolbar` de `@xyflow/react` y `framer-motion` ya instalado). Cada tarea es un commit independiente y deja la app en estado funcional.

**Tech Stack:** React 19, TypeScript, `@xyflow/react` v12 (React Flow), `framer-motion`, Tailwind CSS v4, Vite.

**Spec:** `docs/superpowers/specs/2026-04-16-locs-panel-canvas-clarity-design.md`

**Nota importante sobre testing:** El proyecto no tiene framework de tests configurado (confirmado en CLAUDE.md). La validación de cada tarea es manual en el navegador + `npm run build` (type-check) + `npm run lint`. No hay TDD strict; en su lugar, cada tarea especifica pasos concretos de verificación visual.

**Nota sobre i18n:** `LocationNode.tsx`, `LocationEdges.tsx`, `LocationNodeDetailPanel.tsx` actualmente usan strings hardcoded en español (no `useTranslation`). Para no inflar scope, los strings nuevos siguen el mismo patrón (hardcoded). I18n-ificar es follow-up.

---

## File Structure

**Create:**
- `src/hooks/useZoomLevel.ts` — hook que lee el zoom de React Flow y devuelve `'full' | 'compact'`.
- `src/components/world-graph/LocationGraphContext.tsx` — React Context para pasar callbacks de editar/eliminar desde el canvas hasta las `NodeToolbar` de cada `LocationNode`.

**Modify:**
- `src/components/world-graph/LocationNode.tsx` — integra `NodeToolbar` con botones editar/eliminar (vía context) y renderiza variante `compact` cuando el hook `useZoomLevel` devuelve `'compact'`.
- `src/components/world-graph/LocationEdges.tsx` — oculta la etiqueta de `effort` (Fácil/Moderado/Difícil) cuando el zoom es bajo.
- `src/components/world-graph/LocationGraphCanvas.tsx` — cambia el layout de `flex` a `relative` con panel como overlay absoluto, envuelve el panel con `AnimatePresence` + `motion.div`, añade auto-pan al seleccionar nodo, mueve `MiniMap` y la toolbar flotante a las esquinas izquierdas para no solapar el panel, y provee el `LocationGraphContext`.
- `src/components/world-graph/LocationSidePanel.tsx` — elimina la rama de "no hay selección" (ahora el padre condiciona el render).
- `src/components/world-graph/LocationNodeDetailPanel.tsx` — footer rediseñado (3 filas labeled), elimina botones editar/eliminar, elimina props `onEdit` y `onDelete`.

---

## Task 1: Crear hook `useZoomLevel`

**Files:**
- Create: `src/hooks/useZoomLevel.ts`

**Contexto:** React Flow v12 expone el transform (x, y, zoom) vía `useStore`. Queremos derivar un valor `'full' | 'compact'` a partir del zoom actual, para que los nodos/edges decidan cuánto detalle mostrar.

- [ ] **Step 1.1: Crear el archivo con el hook**

Crear `src/hooks/useZoomLevel.ts`:

```ts
import { useStore } from '@xyflow/react'

export type ZoomLevel = 'full' | 'compact'

const COMPACT_THRESHOLD = 0.65

/**
 * Reads the React Flow viewport zoom and returns the level-of-detail bucket.
 * Must be called inside a `ReactFlowProvider`.
 */
export function useZoomLevel(): ZoomLevel {
  const zoom = useStore((s) => s.transform[2])
  return zoom >= COMPACT_THRESHOLD ? 'full' : 'compact'
}
```

- [ ] **Step 1.2: Verificar que compila**

Run:
```bash
npm run build
```
Expected: `tsc -b && vite build` termina sin errores nuevos. El hook todavía no se consume en ningún sitio, así que no hay warnings de "unused".

- [ ] **Step 1.3: Lint**

Run:
```bash
npm run lint
```
Expected: sin errores nuevos en `src/hooks/useZoomLevel.ts`.

- [ ] **Step 1.4: Commit**

```bash
git add src/hooks/useZoomLevel.ts
git commit -m "feat(locs): add useZoomLevel hook for LOD rendering"
```

---

## Task 2: Variante `compact` en `LocationNode`

**Files:**
- Modify: `src/components/world-graph/LocationNode.tsx`

**Contexto:** Actualmente `LocationNode` tiene dos ramas (child si `depth > 0`, root si `depth = 0`). Añadimos una rama nueva: si `useZoomLevel() === 'compact'`, renderiza una card pequeña (~120×28px) con icono + nombre + borde izquierdo coloreado por `narrative_function`. Prevalece sobre child/root (es la rama que se toma primero). Así un solo pass cubre nodos root y hijos sin duplicar.

- [ ] **Step 2.1: Añadir mapping de colores para el borde compact**

Abrir `src/components/world-graph/LocationNode.tsx`. Tras el bloque `NARRATIVE_FN_COLORS` (alrededor de la línea 19), añadir:

```ts
// Hex colors used as inline style for the left border of compact nodes.
// Inline (not Tailwind classes) because we interpolate into style={{ borderLeft: ... }}.
const NARRATIVE_FN_BORDER: Record<NarrativeFunction, string> = {
  conflict:   '#ef4444',
  origin:     '#f59e0b',
  threshold:  '#8b5cf6',
  atmosphere: '#0ea5e9',
}
```

- [ ] **Step 2.2: Importar el hook**

En el top de `src/components/world-graph/LocationNode.tsx`, añadir el import tras los existentes:

```ts
import { useZoomLevel } from '@/hooks/useZoomLevel'
```

- [ ] **Step 2.3: Consumir el hook y renderizar variante compact**

Dentro de `LocationNode`, justo después de `const handleStyle = isChild ? CHILD_HANDLE_STYLE : HANDLE_STYLE` (línea ~52), añadir:

```ts
const zoomLevel = useZoomLevel()

if (zoomLevel === 'compact') {
  const borderColor = d.narrative_function
    ? NARRATIVE_FN_BORDER[d.narrative_function]
    : '#94a3b8' // slate-400 fallback

  return (
    <div
      className={`
        relative rounded-md border bg-background shadow-sm
        w-[130px] transition-all duration-150
        ${d.isSelected
          ? 'border-[#14b8a6] shadow-[0_0_0_2px_#14b8a620]'
          : 'border-border/60 hover:border-[#14b8a6]/50'}
      `}
      style={{ borderLeft: `3px solid ${borderColor}` }}
      title={d.source_hint || d.name}
    >
      <Handle type="source" position={Position.Top}    id="t"  style={handleStyle} />
      <Handle type="source" position={Position.Right}  id="r"  style={handleStyle} />
      <Handle type="source" position={Position.Bottom} id="b"  style={handleStyle} />
      <Handle type="source" position={Position.Left}   id="l"  style={handleStyle} />
      <Handle type="target" position={Position.Top}    id="tt" style={handleStyle} />
      <Handle type="target" position={Position.Right}  id="tr" style={handleStyle} />
      <Handle type="target" position={Position.Bottom} id="tb" style={handleStyle} />
      <Handle type="target" position={Position.Left}   id="tl" style={handleStyle} />

      <div className="px-2 py-1 flex items-center gap-1.5">
        <span className="text-xs leading-none">{NODE_ICONS[d.node_type]}</span>
        <span className="text-[11px] font-medium text-foreground truncate">{d.name}</span>
      </div>
    </div>
  )
}
```

Dejar el resto del componente (child branch y root branch) intacto debajo.

- [ ] **Step 2.4: Verificar build + lint**

Run:
```bash
npm run build && npm run lint
```
Expected: sin errores nuevos.

- [ ] **Step 2.5: Validación manual en navegador**

1. Arrancar dev server: `npm run dev`.
2. Navegar a `http://localhost:5173/worlds/1`, pestaña **Locs**.
3. Verificar zoom por defecto: los nodos muestran la variante full (icono + nombre + pill de función narrativa + child count).
4. Hacer zoom out con scroll hasta que el zoom baje de 0.65 (el React Flow Controls muestra el zoom en %; aprox. <65%).
5. Esperado: los nodos colapsan a cards compactas de ~130px con icono + nombre + borde izquierdo coloreado (rojo para conflict, ámbar para origin, violeta para threshold, sky para atmosphere).
6. Hacer zoom in: al pasar 0.65, vuelven a la variante full.

- [ ] **Step 2.6: Commit**

```bash
git add src/components/world-graph/LocationNode.tsx
git commit -m "feat(locs): compact LOD variant in LocationNode at low zoom"
```

---

## Task 3: Ocultar etiqueta `effort` en edges bajo zoom threshold

**Files:**
- Modify: `src/components/world-graph/LocationEdges.tsx`

**Contexto:** Cada edge muestra "Fácil/Moderado/Difícil" sobre la línea. A zoom bajo, estas etiquetas saturan el canvas. Usamos el mismo hook `useZoomLevel` para ocultar el label cuando `'compact'`, manteniendo la línea siempre visible.

- [ ] **Step 3.1: Importar el hook en `LocationEdges.tsx`**

En `src/components/world-graph/LocationEdges.tsx`, tras los imports existentes:

```ts
import { useZoomLevel } from '@/hooks/useZoomLevel'
```

- [ ] **Step 3.2: Consumir el hook dentro de `FloatingLocationEdge` y condicionar el label**

Dentro del componente `FloatingLocationEdge` (arranca línea 34), después de la línea `const effort: LocationEffort = d?.effort ?? 'moderate'`, añadir:

```ts
const zoomLevel = useZoomLevel()
const showEffortLabel = zoomLevel === 'full'
```

Luego envolver el segundo `<EdgeLabelRenderer>` (el que pinta la etiqueta effort, líneas 73-83) con la condición:

```tsx
{showEffortLabel && (
  <EdgeLabelRenderer>
    <div
      style={{
        transform: `translate(-50%,-50%) translate(${labelX}px,${labelY + 14}px)`,
        color: EFFORT_COLOR[effort],
      }}
      className="absolute text-[9px] font-semibold pointer-events-none bg-background/80 px-1 rounded"
    >
      {EFFORT_LABEL[effort]}
    </div>
  </EdgeLabelRenderer>
)}
```

El otro `EdgeLabelRenderer` (el de `d?.note` cuando `selected`) se mantiene intacto — siempre se muestra al seleccionar un edge.

- [ ] **Step 3.3: Build + lint**

Run:
```bash
npm run build && npm run lint
```
Expected: sin errores.

- [ ] **Step 3.4: Validación manual**

1. Dev server corriendo.
2. En la vista Locs a zoom default: edges muestran etiquetas "Fácil/Moderado/Difícil".
3. Zoom out hasta < 0.65.
4. Esperado: las líneas siguen visibles con sus estilos (dashed/solid/colores), pero las etiquetas de effort desaparecen.
5. Zoom in: las etiquetas vuelven.

- [ ] **Step 3.5: Commit**

```bash
git add src/components/world-graph/LocationEdges.tsx
git commit -m "feat(locs): hide edge effort labels at low zoom"
```

---

## Task 4: `LocationGraphContext` + `NodeToolbar` en `LocationNode`

**Files:**
- Create: `src/components/world-graph/LocationGraphContext.tsx`
- Modify: `src/components/world-graph/LocationNode.tsx`

**Contexto:** Los custom nodes de React Flow reciben su estado vía `data` (serializable), pero los callbacks (editar, eliminar) no caben ahí limpiamente. Creamos un `LocationGraphContext` que se provee desde el canvas y se consume desde cada `LocationNode` para enganchar los botones de la `NodeToolbar`. La toolbar nativa de React Flow se encarga del posicionamiento y del seguimiento al drag.

- [ ] **Step 4.1: Crear el context**

Crear `src/components/world-graph/LocationGraphContext.tsx`:

```tsx
import { createContext, useContext, type ReactNode } from 'react'

export interface LocationGraphContextValue {
  /** Abre el form dialog en modo "editar" para el nodo indicado. */
  onEditNode: (nodeId: number) => void
  /** Confirma y elimina el nodo indicado. */
  onDeleteNode: (nodeId: number) => void
}

const NOOP_CONTEXT: LocationGraphContextValue = {
  onEditNode: () => {},
  onDeleteNode: () => {},
}

const LocationGraphContext = createContext<LocationGraphContextValue>(NOOP_CONTEXT)

export function LocationGraphProvider({
  value, children,
}: {
  value: LocationGraphContextValue
  children: ReactNode
}) {
  return (
    <LocationGraphContext.Provider value={value}>
      {children}
    </LocationGraphContext.Provider>
  )
}

/**
 * Returns the handlers to edit/delete a location node from within a custom
 * ReactFlow node. Falls back to no-ops if rendered outside a provider
 * (allows individual commits to leave the app runnable during refactor).
 */
export function useLocationGraphContext(): LocationGraphContextValue {
  return useContext(LocationGraphContext)
}
```

- [ ] **Step 4.2: Actualizar imports en `LocationNode.tsx`**

Cambiar la línea 2 de `LocationNode.tsx`:

```ts
// antes:
import { Handle, Position, type NodeProps } from '@xyflow/react'

// después:
import { Handle, Position, NodeToolbar, type NodeProps } from '@xyflow/react'
```

Y añadir tras los imports existentes:

```ts
import { Pencil, Trash2 } from 'lucide-react'
import { useLocationGraphContext } from './LocationGraphContext'
```

- [ ] **Step 4.3: Aceptar `id` en props y consumir el context dentro del componente**

Cambiar la firma del componente (línea ~46):

```ts
// antes:
export const LocationNode = memo(function LocationNode({ data }: NodeProps) {

// después:
export const LocationNode = memo(function LocationNode({ id, data }: NodeProps) {
```

Y tras la línea `const d = data as unknown as LocationNodeData`, añadir:

```ts
const { onEditNode, onDeleteNode } = useLocationGraphContext()
const nodeId = Number(id)
```

- [ ] **Step 4.4: Extraer la toolbar en una constante para reusarla en las 3 variantes**

Justo antes del primer `if (zoomLevel === 'compact')`, añadir:

```tsx
const toolbar = (
  <NodeToolbar isVisible={d.isSelected} position={Position.Top} offset={8}>
    <div
      role="toolbar"
      aria-label="Acciones de localización"
      className="flex gap-0.5 bg-background border border-border/60 rounded-lg shadow-sm p-0.5"
    >
      <button
        onClick={() => onEditNode(nodeId)}
        aria-label="Editar localización"
        title="Editar"
        className="p-1.5 rounded hover:bg-accent transition-colors"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => onDeleteNode(nodeId)}
        aria-label="Eliminar localización"
        title="Eliminar"
        className="p-1.5 rounded hover:bg-destructive/10 text-destructive transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  </NodeToolbar>
)
```

- [ ] **Step 4.5: Insertar `{toolbar}` al principio del JSX de cada variante**

Hay 3 returns dentro de `LocationNode`: compact (de Task 2), child (línea ~56 original), root (línea ~99 original). Envolver cada uno con un Fragment y añadir `{toolbar}` antes del div principal.

Para la variante compact (añadida en Task 2):

```tsx
if (zoomLevel === 'compact') {
  // ... borderColor y resto ...
  return (
    <>
      {toolbar}
      <div ...>
        {/* contenido actual */}
      </div>
    </>
  )
}
```

Para la variante child (`if (isChild)`):

```tsx
if (isChild) {
  return (
    <>
      {toolbar}
      <div ...>
        {/* contenido actual */}
      </div>
    </>
  )
}
```

Para la variante root (el último return):

```tsx
return (
  <>
    {toolbar}
    <div ...>
      {/* contenido actual */}
    </div>
  </>
)
```

- [ ] **Step 4.6: Build + validación runtime**

Run:
```bash
npm run build && npm run lint
```
Expected: compila y pasa lint sin errores.

Validación manual rápida: con `npm run dev`, abrir `/worlds/1` → Locs y seleccionar un nodo. La NodeToolbar aparece sobre el nodo con los 2 iconos. Click sobre ✎ o 🗑: **no hace nada todavía** (el context devuelve no-ops hasta que Task 5 proveea los handlers reales). La app no crashea. Perfecto, ese es el estado intermedio esperado.

- [ ] **Step 4.7: Commit**

```bash
git add src/components/world-graph/LocationGraphContext.tsx src/components/world-graph/LocationNode.tsx
git commit -m "feat(locs): NodeToolbar with edit/delete via LocationGraphContext"
```

---

## Task 5: Canvas restructure + auto-pan + provider

**Files:**
- Modify: `src/components/world-graph/LocationGraphCanvas.tsx`

**Contexto:** El canvas pasa de `flex-1 + panel fijo` a `relative + panel absoluto overlay`. Se envuelve el panel con `AnimatePresence` + `motion.div` para entrada/salida animada. Se añade el `LocationGraphProvider` con los callbacks de editar/eliminar para que `NodeToolbar` funcione. Se añade `useEffect` de auto-pan al cambiar `selected`. Se mueven `MiniMap` y la toolbar flotante (+ Añadir, Añadir regiones, Regenerar) a esquinas izquierdas para no solapar el panel.

- [ ] **Step 5.1: Actualizar imports**

En `src/components/world-graph/LocationGraphCanvas.tsx`, tras los imports existentes añadir:

```ts
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { LocationGraphProvider, type LocationGraphContextValue } from './LocationGraphContext'
```

Y ampliar el import de `@xyflow/react` (línea 2-17) para incluir `Position` si no estaba, y también `MiniMap` tipo. Actual include ya trae `MiniMap` (línea 6). OK.

- [ ] **Step 5.2: Extraer `setCenter` y `getZoom` de `useReactFlow`**

Línea ~150 actual: `const { fitView } = useReactFlow()`. Cambiar a:

```ts
const { fitView, setCenter, getZoom } = useReactFlow()
const reducedMotion = useReducedMotion()
```

- [ ] **Step 5.3: Añadir auto-pan effect**

Tras el `useEffect` que hace `fitView` al cambiar `visible` (línea ~175-183), añadir un nuevo effect:

```tsx
// Auto-pan: al seleccionar un nodo, centrar el viewport para que el nodo
// quede a la izquierda del panel (que cubre los 288px derechos cuando se abre).
// Solo para nodos; los edges no tienen "centro" obvio.
// En el mount inicial `selected` es null, así que el early-return filtra ese caso.
useEffect(() => {
  if (selected?.type !== 'node') return
  const n = selected.item
  const zoom = getZoom()
  // 144 = panelWidth/2 (288/2). Convertido a coords del mundo via zoom.
  setCenter(n.canvas_x + 144 / zoom, n.canvas_y, {
    duration: reducedMotion ? 0 : 300,
    zoom,
  })
  // Deps: disparar solo cuando cambia el id del nodo seleccionado, no cuando
  // el objeto `selected` se recrea por otras razones (ej. enrich actualiza item).
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [selected?.type === 'node' ? selected.item.id : null])
```

- [ ] **Step 5.4: Construir el `contextValue` para el provider**

Tras el bloque de `useState` y antes del primer `useMemo`, añadir:

```tsx
const contextValue = useMemo<LocationGraphContextValue>(() => ({
  onEditNode: (nodeId: number) => {
    const node = locationNodes.find(n => n.id === nodeId)
    if (node) setFormState({ mode: 'edit', node })
  },
  onDeleteNode: (nodeId: number) => {
    if (window.confirm('¿Eliminar esta localización? Se perderán sus conexiones.')) {
      onDeleteNode(nodeId)
    }
  },
}), [locationNodes, onDeleteNode])
```

Esto añade confirm nativo a la acción destructiva (no había antes — es una mejora pequeña aprovechando el refactor). Edit sigue abriendo el mismo form que hoy.

- [ ] **Step 5.5: Reestructurar el JSX del return principal**

Localizar el `return (...)` que empieza en línea ~278 (el que tiene `<div className="flex h-full">`). Reemplazar toda esa expresión por:

```tsx
return (
  <LocationGraphProvider value={contextValue}>
    <div className="relative h-full">
      <div className="absolute inset-0 min-w-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          onNodeDragStop={handleNodeDragStop}
          onConnect={handleConnect}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionMode={ConnectionMode.Loose}
          nodesDraggable={true}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          className="bg-[hsl(180_8%_97%)]"
        >
          <Background color="#c8d5d5" gap={24} size={1} />
          <Controls />
          <MiniMap
            position="bottom-left"
            nodeColor="#14b8a6"
            className="!bg-background/90 !border-border/50"
          />
          <div className="absolute top-2 left-2 z-10 flex gap-1.5">
            <button
              onClick={() => setFormState({ mode: 'create' })}
              className="text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 hover:border-[#14b8a6] text-muted-foreground hover:text-[#14b8a6] transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Añadir
            </button>
            <button
              onClick={onAddRegions}
              disabled={generating}
              className="text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 hover:border-violet-400 text-muted-foreground hover:text-violet-600 transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {generating ? 'Generando...' : 'Añadir regiones'}
            </button>
            <button
              onClick={onGenerate}
              disabled={generating}
              className="text-xs bg-background border border-border rounded-lg px-3 py-1.5 hover:border-[#14b8a6] text-muted-foreground hover:text-[#14b8a6] transition-colors disabled:opacity-50"
            >
              {generating ? 'Generando...' : '↺ Regenerar'}
            </button>
          </div>
        </ReactFlow>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            key="locs-side-panel"
            initial={{ x: reducedMotion ? 0 : '100%', opacity: reducedMotion ? 1 : 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: reducedMotion ? 0 : '100%', opacity: reducedMotion ? 1 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 34 }}
            className="absolute right-0 top-0 bottom-0 w-72 z-20 bg-background border-l border-border/50"
          >
            <LocationSidePanel
              selected={selected}
              nodes={locationNodes}
              edges={locationEdges}
              onEditNode={node => setFormState({ mode: 'edit', node })}
              onDeleteNode={onDeleteNode}
              onAddChildNode={node => setFormState({ mode: 'create', parentId: node.id, parentName: node.name })}
              onExpandWithAI={onExpandWithAI}
              expandingNodeId={expandingNodeId}
              onEnrichWithAI={onEnrichWithAI}
              enrichingNodeId={enrichingNodeId}
              onSelectNode={node => onSelectNode(node)}
              onUpdateEdge={onUpdateEdge}
              onDeleteEdge={onDeleteEdge}
              onClose={() => { onSelectNode(null) }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {formState && (
        <LocationNodeFormDialog
          mode={formState.mode}
          editingNode={formState.mode === 'edit' ? formState.node : undefined}
          onConfirm={handleFormConfirm}
          onClose={() => setFormState(null)}
        />
      )}
    </div>
  </LocationGraphProvider>
)
```

Cambios clave respecto al original:
- `<div className="flex h-full">` → `<div className="relative h-full">` envuelto en `LocationGraphProvider`.
- Canvas en un `<div className="absolute inset-0">` (ocupa todo el contenedor).
- Toolbar flotante: `top-2 right-2` → `top-2 left-2`.
- `MiniMap`: añadido `position="bottom-left"`.
- `LocationSidePanel`: ahora envuelto en `AnimatePresence` + `motion.div` condicional por `selected`. El propio panel ya no necesita manejar el caso `!selected` (se hace en Task 6).

- [ ] **Step 5.6: Actualizar el return del caso `locationNodes.length === 0`**

El return de empty state (línea ~234 actual) también usa `flex h-full`. No necesita cambios estructurales porque no hay panel en empty state, pero sí envolver con el provider por consistencia (aunque el context no se consume porque no hay nodos aún):

```tsx
if (locationNodes.length === 0) {
  return (
    <LocationGraphProvider value={contextValue}>
      <div className="flex h-full">
        {/* contenido actual intacto */}
      </div>
    </LocationGraphProvider>
  )
}
```

- [ ] **Step 5.7: Build**

Run:
```bash
npm run build
```
Expected: compila sin errores. Los errores de TypeScript de Task 4 (context faltante) ahora se resuelven porque todos los `LocationNode` se renderizan bajo el provider.

- [ ] **Step 5.8: Lint**

Run:
```bash
npm run lint
```
Expected: sin errores nuevos. Puede haber un warning de `react-hooks/exhaustive-deps` por el effect de auto-pan; ya está silenciado con el `eslint-disable-next-line` de Step 5.3.

- [ ] **Step 5.9: Validación manual**

1. Dev server corriendo, navegar a `http://localhost:5173/worlds/1` → Locs.
2. **Sin selección:** el canvas ocupa el 100% del ancho del tab. No hay panel. La toolbar "+ Añadir / Añadir regiones / Regenerar" aparece arriba-izquierda. El MiniMap está en abajo-izquierda.
3. **Al seleccionar un nodo:** el panel entra deslizándose desde la derecha (~200ms). El viewport se centra suavemente para que el nodo quede a la izquierda del panel (no tapado).
4. **Al seleccionar un edge:** el panel entra igual, pero NO hay auto-pan (el edge no tiene centro obvio).
5. **NodeToolbar:** sobre el nodo seleccionado aparecen 2 botones (✎ y 🗑). Click ✎ abre el form dialog de editar. Click 🗑 muestra confirm nativo; aceptar elimina el nodo (y colapsa el panel).
6. **Cerrar panel:** click en el `×` del panel o click en zona vacía del canvas → panel sale animado hacia la derecha.
7. **Reduced motion:** en DevTools → Rendering → `prefers-reduced-motion: reduce`. Recargar. Al seleccionar/deseleccionar, el panel aparece/desaparece al instante (sin animación). Auto-pan es instantáneo.

- [ ] **Step 5.10: Commit**

```bash
git add src/components/world-graph/LocationGraphCanvas.tsx
git commit -m "feat(locs): animated panel overlay + auto-pan + toolbar repositioning"
```

---

## Task 6: Simplificar `LocationSidePanel`

**Files:**
- Modify: `src/components/world-graph/LocationSidePanel.tsx`

**Contexto:** Ahora el padre (`LocationGraphCanvas`) condiciona el render vía `AnimatePresence`. El panel ya nunca se monta con `selected === null`, así que la rama de "Selecciona una localización…" ya no se alcanza. Además el `w-72` y el `border-l` los gestiona el `motion.div` exterior — el panel pasa a ser solo el contenido.

- [ ] **Step 6.1: Eliminar la rama de no-selección y la clase de ancho/borde exterior**

Abrir `src/components/world-graph/LocationSidePanel.tsx`. Reemplazar el contenido completo del componente (desde la línea 23 hasta el cierre) por:

```tsx
export function LocationSidePanel({ selected, nodes, edges, onEditNode, onDeleteNode, onAddChildNode, onExpandWithAI, expandingNodeId, onEnrichWithAI, enrichingNodeId, onSelectNode, onUpdateEdge, onDeleteEdge, onClose }: Props) {
  if (!selected) return null

  if (selected.type === 'node') {
    const node = selected.item
    const connectedIds = new Set(
      edges.filter(e => e.source_node_id === node.id || e.target_node_id === node.id)
           .map(e => e.source_node_id === node.id ? e.target_node_id : e.source_node_id)
    )
    const connectedNodes = nodes.filter(n => connectedIds.has(n.id))
    const childNodes = nodes.filter(n => n.parent_id === node.id)

    return (
      <div className="h-full overflow-hidden">
        <LocationNodeDetailPanel
          node={node}
          connectedNodes={connectedNodes}
          childNodes={childNodes}
          onAddChild={onAddChildNode}
          onExpandWithAI={onExpandWithAI}
          expandingNodeId={expandingNodeId}
          onEnrichWithAI={onEnrichWithAI}
          enrichingNodeId={enrichingNodeId}
          onSelectChild={onSelectNode}
          onClose={onClose}
        />
      </div>
    )
  }

  const edge = selected.item
  const sourceNode = nodes.find(n => n.id === edge.source_node_id)
  const targetNode = nodes.find(n => n.id === edge.target_node_id)

  return (
    <div className="h-full overflow-hidden">
      <LocationEdgeDetailPanel
        edge={edge}
        sourceNode={sourceNode}
        targetNode={targetNode}
        onUpdate={onUpdateEdge}
        onDelete={onDeleteEdge}
        onClose={onClose}
      />
    </div>
  )
}
```

Cambios:
- Eliminada la rama `if (!selected) return ( <div className="w-64...">Selecciona...</div> )` → ahora es `if (!selected) return null`.
- Quitado `w-72 border-l border-border/50` del wrapper interior (ahora lo pone el `motion.div` en el canvas).
- Eliminados los props `onEditNode` y `onDeleteNode` pasados a `LocationNodeDetailPanel` (que los va a quitar Task 7). El tipo de `Props` en la interface superior aún los incluye; se limpiará en Step 6.2.

- [ ] **Step 6.2: Limpiar la interface `Props`**

En la interface `Props` (líneas 6-21), eliminar las líneas de `onEditNode` y `onDeleteNode`:

```ts
// antes:
onEditNode: (node: LocationNode) => void
onDeleteNode: (id: number) => void

// después: (eliminar ambas líneas)
```

Y eliminar `onEditNode`, `onDeleteNode` de la destructuración de props del componente (línea 23).

- [ ] **Step 6.3: Actualizar la llamada en `LocationGraphCanvas.tsx`**

En `LocationGraphCanvas.tsx` (la llamada a `<LocationSidePanel>` que está dentro del `motion.div`, editada en Task 5), eliminar las props `onEditNode` y `onDeleteNode`:

```tsx
// antes:
<LocationSidePanel
  selected={selected}
  nodes={locationNodes}
  edges={locationEdges}
  onEditNode={node => setFormState({ mode: 'edit', node })}
  onDeleteNode={onDeleteNode}
  ...

// después:
<LocationSidePanel
  selected={selected}
  nodes={locationNodes}
  edges={locationEdges}
  ...
```

- [ ] **Step 6.4: No verificar build todavía**

Task 6 y Task 7 forman un único refactor del panel y deben ejecutarse en secuencia sin build/lint/commit intermedio. Tras Task 6.1-6.3, saltar directamente a Task 7. El `npm run build` y el commit se hacen una sola vez al terminar Task 7, cubriendo ambas tareas.

Razón: entre Task 6 y Task 7 el código tiene una inconsistencia temporal (LocationSidePanel deja de pasar `onEdit`/`onDelete` pero LocationNodeDetailPanel todavía los exige como required). Es intencional que no pase por build en ese momento — tratamos ambos pasos como una operación atómica.

---

## Task 7: Rediseñar footer de `LocationNodeDetailPanel`

**Files:**
- Modify: `src/components/world-graph/LocationNodeDetailPanel.tsx`

**Contexto:** Reemplazar los 5 botones del footer por 3 filas con jerarquía clara. Eliminar editar/eliminar del footer (ahora viven en la NodeToolbar). Eliminar las props `onEdit` y `onDelete`. Reordenar semánticamente: añadir manual (primario) → generar varios con IA (ghost violeta) → completar este lugar con IA (ghost teal).

- [ ] **Step 7.1: Actualizar imports de iconos**

En `src/components/world-graph/LocationNodeDetailPanel.tsx`, línea 2:

```ts
// antes:
import { ChevronDown, ChevronRight, Trash2, Pencil, Plus, Sparkles, Wand2 } from 'lucide-react'

// después:
import { ChevronDown, ChevronRight, Plus, Sparkles, Wand2 } from 'lucide-react'
```

Eliminados `Trash2` y `Pencil` (ya no se usan aquí).

- [ ] **Step 7.2: Actualizar la interface `Props`**

En las líneas 29-42, eliminar `onEdit` y `onDelete`:

```ts
// antes:
interface Props {
  node: LocationNode
  connectedNodes: LocationNode[]
  childNodes: LocationNode[]
  onEdit: (node: LocationNode) => void
  onDelete: (id: number) => void
  onAddChild: (parentNode: LocationNode) => void
  onExpandWithAI: (node: LocationNode) => void
  expandingNodeId: number | null
  onEnrichWithAI: (node: LocationNode) => void
  enrichingNodeId: number | null
  onSelectChild: (node: LocationNode) => void
  onClose: () => void
}

// después:
interface Props {
  node: LocationNode
  connectedNodes: LocationNode[]
  childNodes: LocationNode[]
  onAddChild: (parentNode: LocationNode) => void
  onExpandWithAI: (node: LocationNode) => void
  expandingNodeId: number | null
  onEnrichWithAI: (node: LocationNode) => void
  enrichingNodeId: number | null
  onSelectChild: (node: LocationNode) => void
  onClose: () => void
}
```

Y en la destructuración de props (línea 44), quitar `onEdit` y `onDelete`:

```ts
// antes:
export function LocationNodeDetailPanel({ node, connectedNodes, childNodes, onEdit, onDelete, onAddChild, onExpandWithAI, expandingNodeId, onEnrichWithAI, enrichingNodeId, onSelectChild, onClose }: Props) {

// después:
export function LocationNodeDetailPanel({ node, connectedNodes, childNodes, onAddChild, onExpandWithAI, expandingNodeId, onEnrichWithAI, enrichingNodeId, onSelectChild, onClose }: Props) {
```

- [ ] **Step 7.3: Reemplazar el bloque del footer**

Localizar el bloque que empieza en línea ~145 (`<div className="p-4 border-t border-border/50 space-y-2">`) y termina en línea ~181 (`</div>` del footer antes del cierre del componente). Reemplazar **todo ese bloque** por:

```tsx
<div className="p-4 border-t border-border/50 space-y-2">
  <Button
    size="sm"
    className="w-full gap-1.5 bg-[#0f766e] text-white hover:bg-[#0d6b62]"
    onClick={() => onAddChild(node)}
  >
    <Plus className="w-3.5 h-3.5" /> Añadir lugar dentro
  </Button>
  <Button
    variant="outline"
    size="sm"
    className="w-full gap-1.5 text-violet-600 border-violet-300/50 hover:bg-violet-50 hover:border-violet-400/60 disabled:opacity-50"
    onClick={() => onExpandWithAI(node)}
    disabled={isExpanding}
  >
    <Sparkles className="w-3.5 h-3.5" />
    {isExpanding ? 'Generando lugares…' : 'Generar varios lugares con IA'}
  </Button>
  <Button
    variant="outline"
    size="sm"
    className="w-full gap-1.5 text-[#14b8a6] border-[#14b8a6]/30 hover:bg-[#14b8a6]/10 hover:border-[#14b8a6]/50 disabled:opacity-50"
    onClick={() => onEnrichWithAI(node)}
    disabled={isEnriching}
  >
    <Wand2 className="w-3.5 h-3.5" />
    {isEnriching ? 'Completando…' : 'Completar este lugar con IA'}
  </Button>
</div>
```

Cambios vs. el original:
- Primario: botón teal sólido (`bg-[#0f766e] text-white`), texto "+ Añadir lugar dentro" (reemplaza "Añadir lugar manualmente" del original).
- Segundo: ghost violeta con "Generar varios lugares con IA" (label explicita "varios").
- Tercero: ghost teal con "Completar este lugar con IA" (label explicita "este lugar", diferenciando del anterior).
- Eliminados: la fila final con botones Editar (`Pencil`) + Eliminar (`Trash2`).

- [ ] **Step 7.4: Build + lint**

Run:
```bash
npm run build && npm run lint
```
Expected: todo compila. Los tipos de `LocationSidePanel.tsx` (editado en Task 6) y de `LocationGraphCanvas.tsx` ahora cuadran con la interface recortada de `LocationNodeDetailPanel`.

- [ ] **Step 7.5: Validación manual del rediseño completo**

1. Dev server corriendo. Recargar `/worlds/1` → Locs.
2. **Sin selección:** canvas full-width (como en Task 5).
3. **Seleccionar un nodo:** panel entra. Verificar el footer:
   - Primera fila: botón teal sólido "+ Añadir lugar dentro". Click → abre form dialog en modo create con `parentId` = nodo actual.
   - Segunda fila: ghost violeta "✨ Generar varios lugares con IA". Click → spinner "Generando lugares…", al volver aparecen los nuevos hijos en el canvas.
   - Tercera fila: ghost teal "🪄 Completar este lugar con IA". Click → spinner "Completando…", al volver el panel se actualiza con más contenido enriquecido (descripción, source_hint, etc.).
   - No hay botones Editar/Eliminar en el footer.
4. **Sobre el nodo seleccionado:** verificar que la NodeToolbar sigue mostrando los 2 iconos (✎ y 🗑) y que funcionan (Task 4/5).
5. **Cerrar panel con `×`:** el panel sale animado y la NodeToolbar sigue sobre el nodo (porque el nodo aún está seleccionado en React Flow). Click en pane del canvas → nodo deseleccionado → NodeToolbar desaparece.

- [ ] **Step 7.6: Commit (incluye los cambios de Task 6)**

```bash
git add src/components/world-graph/LocationSidePanel.tsx src/components/world-graph/LocationNodeDetailPanel.tsx
git commit -m "refactor(locs): clean action hierarchy in node detail panel"
```

---

## Task 8: Validación final end-to-end

**Files:** (none modified)

**Contexto:** Última pasada completa por el flujo antes de considerar done. No toca código; solo verifica la suma.

- [ ] **Step 8.1: Recorrido completo**

Con el dev server corriendo:

1. `/worlds/1` → **Mundos** tab: navegar.
2. **Causal** tab: cargar → verificar que sigue funcionando normal (esta PR no lo toca).
3. **Locs** tab:
   - Estado inicial: canvas full-width, sin panel. Toolbar y MiniMap en las esquinas izquierdas.
   - Zoom in/out: a zoom < 0.65 los nodos colapsan a compact y se ocultan etiquetas de edges.
   - Click en un nodo: panel entra desde la derecha, viewport hace auto-pan para mantener el nodo visible, NodeToolbar aparece sobre el nodo.
   - Click en `✎` de NodeToolbar: abre form editar.
   - Click en `🗑` de NodeToolbar: confirm → borra el nodo (panel se cierra automáticamente, la NodeToolbar desaparece con el nodo).
   - Volver a seleccionar otro nodo: footer muestra las 3 filas nuevas (primaria + 2 ghosts con labels explícitos).
   - Click `+ Añadir lugar dentro`: abre form create con parent.
   - Click `✨ Generar varios lugares con IA`: dispara expand IA.
   - Click `🪄 Completar este lugar con IA`: dispara enrich IA.
   - Click en pane: panel sale, auto-pan no vuelve a disparar.
4. **Personajes**, **Historias** tabs: verificar que siguen funcionando normal (esta PR no las toca).

- [ ] **Step 8.2: Accesibilidad quick-check**

1. Keyboard-only nav (Tab): desde el canvas, Tab llega a los botones de la NodeToolbar si un nodo está seleccionado. Tab sigue fluyendo hacia el panel si está abierto: orden contenido → footer → controls del header.
2. Screen reader labels: los botones de NodeToolbar tienen `aria-label` ("Editar localización", "Eliminar localización"). Los 3 botones del footer tienen texto visible.
3. Reduced motion: DevTools → Rendering → `prefers-reduced-motion: reduce`. Recargar. Confirmar:
   - Panel aparece/desaparece sin animación.
   - Auto-pan es instantáneo (no hay transición de 300ms).

- [ ] **Step 8.3: Build de producción**

Run:
```bash
npm run build
```
Expected: `tsc -b && vite build` termina sin errores. El output de Vite muestra los chunks.

- [ ] **Step 8.4: Crear PR (si procede)**

Si todo OK:

```bash
git log --oneline -10
# Verificar que están los commits de las 7 tareas:
# - refactor(locs): clean action hierarchy in node detail panel
# - feat(locs): animated panel overlay + auto-pan + toolbar repositioning
# - feat(locs): NodeToolbar with edit/delete via LocationGraphContext
# - feat(locs): hide edge effort labels at low zoom
# - feat(locs): compact LOD variant in LocationNode at low zoom
# - feat(locs): add useZoomLevel hook for LOD rendering
# - docs(locs): add panel + canvas clarity design spec
```

Push y abrir PR contra `main` (o la rama base que corresponda). Título sugerido: `feat(locs): panel + canvas clarity (spec 2026-04-16)`.

---

## Resumen de commits esperados al terminar

1. `docs(locs): add panel + canvas clarity design spec` — ya hecho
2. `feat(locs): add useZoomLevel hook for LOD rendering`
3. `feat(locs): compact LOD variant in LocationNode at low zoom`
4. `feat(locs): hide edge effort labels at low zoom`
5. `feat(locs): NodeToolbar with edit/delete via LocationGraphContext`
6. `feat(locs): animated panel overlay + auto-pan + toolbar repositioning`
7. `refactor(locs): clean action hierarchy in node detail panel`

Total: 7 commits (1 docs + 6 code), 6 archivos modificados + 2 nuevos.
