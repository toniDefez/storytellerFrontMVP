# Locs — Claridad del panel y del canvas

**Fecha:** 2026-04-16
**Scope:** Página `/worlds/:id` → pestaña "Locs" (`LocationGraphCanvas` + `LocationSidePanel` + `LocationNodeDetailPanel` + `LocationNode`)
**Tipo:** Rediseño UX. No afecta a Causal, Personajes ni Historias.

---

## 1. Problema

En la vista Locs de un mundo denso (~20+ nodos) hay tres fricciones:

1. **Panel sobrecargado.** El footer apila 5 acciones outline del mismo peso visual (Completar IA, Generar lugares IA, Añadir manual, Editar, Eliminar). Sin jerarquía, el usuario no sabe cuál es la acción esperada.
2. **Real estate desperdiciado.** El panel fijo de 288px permanece ocupado solo por "Selecciona una localización…" cuando no hay selección. La task más común (explorar el mapa) pierde casi 300px de canvas.
3. **Canvas saturado a zoom bajo.** Cada edge muestra su label ("Fácil/Moderado/Difícil") y cada nodo su ficha completa a cualquier zoom. Al alejarse para tener vista panorámica todo se convierte en una maraña de texto.

## 2. Objetivos

- Jerarquía clara en el panel: una acción primaria obvia, gestión fuera del flujo de lectura.
- Canvas a pantalla completa cuando no hay selección.
- Canvas legible a zoom panorámico (detalle bajo demanda).

## 3. No-objetivos

- Rediseño visual del panel (tipografía editorial, tinte por función narrativa, texturas cartográficas). "Eje B" del brainstorm, spec aparte.
- Node collisions (d3-force, auto-layout, etc.). YAGNI: los screenshots actuales no muestran solapamiento de nodos; el caos es de etiquetas. Se reevalúa cuando aparezca la queja real.
- Shortcuts de teclado globales (ej. `I` para toggle). Posponer hasta que existan patrones globales en la app.
- **Rediseño de `LocationEdgeDetailPanel`**. El panel de edge se deja como está esta iteración. Consistencia (mismos patrones de header/footer/toolbar contextual) se hace en un follow-up separado para no inflar el scope.
- Tocar paneles de Causal/Personajes/Historias. Consistencia posterior.
- Cambiar modelo de datos o APIs.

## 4. Decisiones de diseño

### 4.1 Canvas full-width cuando no hay selección

Estado `selected == null`:

- El panel lateral **no se renderiza**. El canvas ocupa el 100% del ancho disponible dentro del tab.
- No se muestra ninguna affordance permanente ("rail", botón fantasma, etc.). El nodo es su propia affordance: clicar revela el panel.
- Mensaje "Selecciona una localización…" se elimina.

Estado `selected != null`:

- El panel (288px, `w-72`) se **posiciona absoluto** sobre el borde derecho del canvas (`absolute right-0 top-0 bottom-0 z-10`). El canvas siempre está a full-width en layout; el panel lo superpone. Evita el "jump" del canvas al animar la salida.
- Aparece desde la derecha con `framer-motion` (translate-x):
  - `initial={{ x: '100%', opacity: 0 }}`
  - `animate={{ x: 0, opacity: 1 }}`
  - `exit={{ x: '100%', opacity: 0 }}`
  - Transición: `{ type: 'spring', stiffness: 300, damping: 34 }` (~200ms).
- Envuelto en `AnimatePresence` para salida animada.
- Respeta `prefers-reduced-motion` vía `useReducedMotion()`: cambio inmediato sin animación.

**Auto-pan al seleccionar:** cuando `selected` pasa a `'node'`, se centra el viewport para que el nodo quede a la izquierda del panel (no oculto detrás). Implementación:

```ts
const { setCenter, getZoom } = useReactFlow()
useEffect(() => {
  if (selected?.type !== 'node') return
  const n = selected.item
  const zoom = getZoom()
  // 144 = mitad del ancho del panel (288/2). Convertido a coords del mundo vía zoom.
  setCenter(n.canvas_x + 144 / zoom, n.canvas_y, { duration: 300, zoom })
}, [selected])
```

- Solo para selección de nodo (los edges no tienen "centro" obvio; se deja sin auto-pan).
- Si `prefers-reduced-motion` está activo, `duration: 0`.
- No se aplica en la selección inicial al cargar la página (solo en cambios de selección interactiva) para no sobrescribir el `fitView` inicial — se detecta con un flag de "primer render".

Cerrar (botón `×` o `onPaneClick`):

- Llama a `onSelectNode(null)` → `selected` vuelve a `null` → panel se desmonta con animación de salida.

### 4.2 Jerarquía de acciones en `LocationNodeDetailPanel`

**Header** queda intacto: etiqueta de tipo a la izquierda, botón `×` a la derecha. Editar/eliminar **salen del panel entero** y viven solo en la NodeToolbar (§4.3). Rationale: el panel es para leer y expandir; la gestión del nodo es un scope diferente y tiene su propio lugar sobre el nodo.

**Footer** pasa de 5 botones a 3 filas con jerarquía por fill/color, todas con labels completos (cero dependencia de tooltips para descubrir acciones):

```
[  + Añadir lugar dentro                   ]  ← primario, teal sólido
[  ✨ Generar varios lugares con IA          ]  ← ghost violeta
[  🪄 Completar este lugar con IA             ]  ← ghost teal
```

- **Primario** (fondo teal `bg-[#0f766e] text-white hover:bg-[#0d6b62]`, ancho completo): `+ Añadir lugar dentro`. Abre `LocationNodeFormDialog` con `parentId` actual. Acción de más alta frecuencia del loop de worldbuilding.
- **Ghost violeta** (`variant="outline"` con `text-violet-600 border-violet-300/50`, icono `Sparkles`): `Generar varios lugares con IA`. Llama a `onExpandWithAI(node)`. Loading: texto "Generando lugares…".
- **Ghost teal** (`variant="outline"` con `text-[#14b8a6] border-[#14b8a6]/30`, icono `Wand2`): `Completar este lugar con IA`. Llama a `onEnrichWithAI(node)`. Loading: "Completando…". Clave: el label explicita **"este lugar"** (vs "varios lugares" arriba) para eliminar ambigüedad entre las dos acciones de IA.

Orden intencional: manual primero (explícito, reversible), bulk-IA segundo, enrich-self tercero. Refleja el flujo: "añado estructura → relleno con IA → pulo el nodo actual". Jerarquía visual decreciente (fill sólido → ghost → ghost) guía el ojo.

Loading states (`expandingNodeId`, `enrichingNodeId`) se mantienen igual que hoy.

### 4.3 Toolbar contextual sobre el nodo seleccionado

Se aprovecha `<NodeToolbar>` nativo de `@xyflow/react`, que ya resuelve posicionamiento, seguimiento al drag y flip cerca del borde.

Dentro de `LocationNode`:

```tsx
<NodeToolbar isVisible={data.isSelected} position={Position.Top} offset={8}>
  <div role="toolbar" aria-label="Acciones de localización" className="...">
    <button onClick={...} aria-label="Editar localización" title="Editar">✎</button>
    <button onClick={...} aria-label="Eliminar localización" title="Eliminar">🗑</button>
  </div>
</NodeToolbar>
```

**Nota de diseño:** editar/eliminar viven **solo** aquí (no en el panel). Si al abrir el panel este tapa el nodo y oculta la NodeToolbar, el usuario puede cerrar el panel con `×` (o click en el pane) y reinteractuar. Edge case aceptado — evita duplicar affordances en dos sitios.

Estilo: fondo `bg-background`, shadow sutil, rounded-lg, padding compacto. Iconos a `w-3.5 h-3.5`. Se mantiene el `confirm()` nativo actual para delete; undo-toast es polish futuro.

### 4.4 Contextual zoom (level-of-detail) — 2 niveles

Hook nuevo `useZoomLevel()`:

```ts
export function useZoomLevel(): 'full' | 'compact' {
  const zoom = useStore(s => s.transform[2])
  return zoom >= 0.65 ? 'full' : 'compact'
}
```

**`LocationNode`** consume el hook y renderiza dos variantes:

- **`full`** (zoom ≥ 0.65): renderizado actual — icono + nombre + función narrativa (pill coloreada) + child count + warning hint.
- **`compact`** (zoom < 0.65): card de ~140×36px:
  - Icono emoji a la izquierda.
  - Nombre en 1 línea, `truncate`, font-size algo mayor para compensar el zoom (`text-sm font-medium`).
  - Borde izquierdo coloreado por `narrative_function` (2px) — sustituye a la pill.
  - Sin descripción, sin child count, sin hint.

Transición entre modos: `opacity` 120ms (no layout animation — evita thrashing al cambiar zoom rápido).

**Edges** (en `LocationEdges.tsx`):

- Labels (`effort`) se ocultan cuando `zoom < 0.65`. Implementación: cada edge component lee zoom vía `useStore` y renderiza `EdgeLabelRenderer` condicionalmente.
- Las líneas (path coloreado por `edge_type`) siempre visibles.

Rationale: el threshold 0.65 es una primera aproximación razonable. Se afina en QA manual con un mundo denso.

## 5. Archivos afectados

| Archivo | Cambio |
|---|---|
| `src/components/world-graph/LocationSidePanel.tsx` | Devuelve `null` cuando `!selected`. Envuelve render con `motion.div` + `AnimatePresence`. |
| `src/components/world-graph/LocationNodeDetailPanel.tsx` | Footer rediseñado a 3 filas labeled (primario teal + ghost violeta + ghost teal). Elimina editar/eliminar (pasan a NodeToolbar). |
| `src/components/world-graph/LocationGraphCanvas.tsx` | Canvas `flex-1` siempre; panel como overlay absoluto. Integra auto-pan via `setCenter` en change de `selected`. |
| `src/components/world-graph/LocationNode.tsx` | Integra `<NodeToolbar>` con editar/eliminar. Consume `useZoomLevel()`, renderiza variantes `full`/`compact`. |
| `src/components/world-graph/LocationEdges.tsx` | Cada edge oculta `EdgeLabelRenderer` bajo threshold zoom. |
| `src/hooks/useZoomLevel.ts` | **Nuevo.** Hook que lee `transform[2]` del store y devuelve `'full' \| 'compact'`. |
| `src/i18n/locales/es.json`, `en.json` | Nuevas keys: tooltips aria-labels de toolbar/header, label del primario. |

**Sin dependencias nuevas.** `NodeToolbar` y `useStore` ya vienen con `@xyflow/react`. `framer-motion` ya está instalado.

## 6. Accesibilidad

- Icon-buttons (header + toolbar): todos con `aria-label` + `title` descriptivos. Contraste verificado contra `bg-background` (WCAG AA).
- Orden de tab lógico: contenido del panel → footer → header controls.
- `<NodeToolbar>` ya maneja escape/focus correctamente según React Flow docs.
- Animaciones envueltas en `useReducedMotion()`.
- El panel NO es un modal: no focus trap, Tab sigue fluyendo al canvas.
- Nodo compacto: el `aria-label` del nodo debe seguir incluyendo nombre + tipo + función narrativa aunque visualmente se oculten (usuarios con screen reader no ven el zoom).

## 7. Plan de validación (manual)

1. Mundo con 20+ nodos cargado.
2. Sin selección: canvas ocupa todo el ancho, no aparece panel ni rail.
3. Click en un nodo: panel entra desde la derecha animado. Toolbar aparece sobre el nodo (editar/eliminar).
4. Cerrar panel: sale animado, canvas vuelve a 100%.
5. Click `✎` en NodeToolbar → abre form de editar. Click `🗑` → confirm nativo y borra.
6. Footer: primario = manual (abre dialog). ✨ icon = abre generación IA (loading spinner). Wand2 ghost = enrich (loading state).
7. Zoom out hasta `< 0.65`: nodos colapsan a variante compact, labels de edges desaparecen.
8. `prefers-reduced-motion: reduce` activado: sin animaciones, paneles cambian instantáneo.
9. Keyboard-only: Tab navega header → contenido → footer; Enter activa botones; Escape no tiene binding específico (el panel no es modal).

## 8. Asumidos explícitos (corregir en review si no encajan)

- Threshold de zoom = 0.65. Valor inicial, afinable en QA con un mundo denso.
- Footer del panel con 3 filas labeled (todas con texto), no con icon-only. Se priorizó descubribilidad sobre compacidad.
- Editar/eliminar existen **solo** en NodeToolbar. Duplicar en panel se descartó por ruido visual.
- Auto-pan al seleccionar nodo para que el panel no tape al nodo. Sin auto-pan para edges.
- Confirm nativo de delete se mantiene; undo-toast es polish futuro.
- `LocationEdgeDetailPanel` no se toca — consistencia es follow-up.
