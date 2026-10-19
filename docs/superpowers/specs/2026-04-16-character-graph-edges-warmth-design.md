# Character Graph — Edges + Warmth (Fase 0 + Fase 1)

**Fecha:** 2026-04-16
**Scope:** `src/components/character-graph/CharacterGraphCanvas.tsx`, `CharacterGraphPage.tsx`, `GraphMinimap.tsx` (rename), `useCharacterGraph.ts` (consumir `moveNode` desde el canvas).
**Tipo:** Rediseño UX + upgrade técnico sobre `@xyflow/react@12.10.1`. No toca backend, datos, modos Voz/Hablar, ni VoiceTab/CatalogDrawer más allá del enganche de `fitView`.

Este spec entrega dos fases planificadas como sub-proyectos separados en el mismo branch: **Fase 0** (cleanup y trivial wins) y **Fase 1** (edges + warmth visual). Fase 2 (NodeResizer + Save/Restore + containers embossed) y Fase 3 (spine, breathing, torn-paper, intersection-drag, export) quedan fuera y se especificarán aparte.

---

## 1. Problema

El canvas de creación de personaje (5 contenedores de dominio con nodos orbitales) funciona, pero tiene varios defectos visibles. Los dos que el usuario señaló — edges orbital→container convergiendo en un solo píxel, y containers rígidos — son los peores, pero la auditoría UX descubrió una docena de cosas más:

1. **Edges feos.** Cada edge orbital→container usa `type: 'straight'` con `targetHandle: 'right'`, lo cual geometricamente colapsa N edges en un único punto sobre el borde derecho. Se ve como un sunburst. Cuando hay 5+ orbitals stacked verticalmente se cruzan entre sí y atraviesan el cuerpo del container.
2. **`resolveCollisions` empuja containers y pills.** El resolver trata todos los nodos como rectángulos iguales, incluyendo los contenedores fijos y las pills de entry/exit (marcadas `draggable: false` pero no excluidas del array de colisiones). Un orbital arrastrado puede mover CREENCIAS hacia arriba.
3. **Drawer tapa el canvas.** El `CatalogDrawer` de 340px se abre sobre el borde derecho; el canvas no refita. Los containers a `x=100` con width 250 quedan parcialmente ocultos.
4. **Drag efímero.** `useCharacterGraph` ya expone `moveNode(id, x, y)` que persiste vía `updateNodePosition`, pero el canvas nunca lo llama. Recargar pierde el layout.
5. **`GraphMinimap` mal nombrado.** No es un minimap — es un TOC listado por dominio usado en modo "Hablar". No hay minimap real en modo graph.
6. **A11y ≈ 0.** Container y orbital son `<div>` con `onClick`, sin role, tabIndex, aria-label, ni keyboard handler.
7. **Labels de flow en SVG text.** La cadena causal ("lo que da por hecho define lo que teme perder") usa `edge.label` en SVG; Lora no se renderiza bien, no hay hover, no hay click-to-ver-porqué.
8. **`BookOpen` repetido 5 veces** en cada header de container. Dead weight visual.
9. **La cadena psicológica no se siente como flujo.** Son 4 flechas smoothstep estáticas entre containers. No transmite causación.
10. **Fondo neutro.** `hsl(40 20% 97%)` es casi gris. No dice "página de manuscrito".

El #3 pain que la auditoría sacó — containers rígidos 250×300 — es real pero requiere NodeResizer + Save/Restore, y se aborda en Fase 2.

---

## 2. Objetivos

- **Fase 0:** Matar bugs visibles en < 1h. Ship inmediato, sin cambios de aspecto.
- **Fase 1:** El canvas deja de verse como "node-editor demo genérico" y empieza a sentirse como una página de diario literario, sin refactor arquitectónico.

---

## 3. No-objetivos

- NodeResizer sobre containers (Fase 2).
- Save/Restore del viewport completo (Fase 2).
- Sub-flow / `parentId` / orbital-como-hijo-del-container (descartado — rompería el metáfora de "orbitals fuera del contenedor").
- Spine vertical, containers embossed, salience breathing, torn-paper entry/exit, iluminación manuscrita (Fase 3).
- Intersection-drag para reasignar dominio (Fase 3).
- Export PNG (Fase 3).
- Auto-layout dagre/ELK.
- Dark mode / `colorMode` prop.
- Refactor de `CharacterGraphPage` más allá de llamar a `useReactFlow().fitView()` y al rename del outline.
- Tocar VoiceTab, CatalogDrawer interno, o modos Voz/Hablar.
- Backend o modelo de datos.

---

## 4. Decisiones de diseño

### 4.1 Fase 0 — Trivial wins (~1h total)

#### 4.1.1 Whitelist de `resolveCollisions`

`resolveCollisions` (CharacterGraphCanvas.tsx:327-369) acepta todos los nodos. Cambio: filtrar antes del loop para incluir únicamente nodos de tipo `'child'` (orbitals). Containers, entry, exit nunca se mueven por colisión.

```ts
const boxes: Box[] = nodes
  .filter(n => n.type === 'child')
  .map(n => ({ ... }))
```

Al devolver, sólo se actualizan los nodos cuyo id aparece en `boxes`; el resto pasa por identidad.

#### 4.1.2 `fitView()` al abrir/cerrar drawer

Hoy `fitView` corre solo al mount. Al abrirse el `CatalogDrawer`, el canvas no re-encuadra y 340px de containers quedan tapados.

- Exponer `CharacterGraphCanvas` desde `<ReactFlowProvider>` (actualmente ya tiene `<ReactFlow>`, hay que envolverlo para poder usar `useReactFlow()` dentro).
- Añadir prop `drawerOpen: boolean` al canvas.
- `useEffect` sobre `drawerOpen` llama `reactFlow.fitView({ padding: 0.12, duration: 250 })`.
- Respetar `prefers-reduced-motion` → `duration: 0` si reduce-motion está activo.

#### 4.1.3 Persistir posiciones de orbitals

`useCharacterGraph.moveNode(id, x, y)` ya escribe en backend vía `updateNodePosition`. El canvas lo ignora.

- `CharacterGraphPage` pasa `moveNode` al canvas como prop.
- `onNodeDragStop` en canvas: si `node.type === 'child'` y `node.id.startsWith('node-')`, extraer id numérico y llamar `moveNode(id, node.position.x, node.position.y)`.
- `buildElements` en `CharacterGraphCanvas`: al crear cada orbital, preferir `charNode.canvas_x/canvas_y` si ambos son no-null; fallback a `getOrbitalPositions` si no hay posición persistida.
- Containers, entry y exit no se persisten (Fase 2).

#### 4.1.4 Rename `GraphMinimap` → `DecisionFlowOutline`

El componente muestra un listado vertical por dominio con `↓` entre etapas. Es un outline/TOC, no un minimap.

- Renombrar archivo y componente: `GraphMinimap.tsx` → `DecisionFlowOutline.tsx`, export `DecisionFlowOutline`.
- Actualizar el único import en `CharacterGraphPage.tsx`.
- Libera el nombre "MiniMap" para el componente oficial de React Flow en §4.2.4.

#### 4.1.5 A11y básica en container y orbital

Container (`ContainerNode`) y orbital (`OrbitalNode`) son `<div>` con `onClick`. Cambio:

- Container: `role="button"`, `tabIndex={0}`, `aria-label={`Dominio ${label}, ${childCount} nodos`}`, `onKeyDown` que invoca el mismo handler en Enter y Space.
- Orbital: `role="button"`, `tabIndex={0}`, `aria-label={`${label}, intensidad ${salience}/10`}`, `onKeyDown` para seleccionar.
- Focus ring (no tocar el ring de `isSelected`): añadir `outline: 2px solid #f59e0b; outline-offset: 2px` cuando `:focus-visible` — Tailwind `focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500 focus-visible:outline-offset-2`.
- Estos cambios no modifican la navegación por teclado dentro del canvas de React Flow (la hemos dejado out-of-scope porque RF no expone focus por nodo nativamente). Es solo para que Enter/Space funcione si el usuario llega al nodo con Tab.

### 4.2 Fase 1 — Edges + Warmth (~7h)

#### 4.2.1 Simple Floating Edges (orbital ↔ container)

Resuelve el pain #1.

- Nuevo archivo: `src/components/character-graph/edges/FloatingEdge.tsx`.
- Port literal del helper `getEdgeParams` del ejemplo oficial https://reactflow.dev/examples/edges/simple-floating-edges usando la API v12: `useInternalNode(id)`, `internals.positionAbsolute`, `internals.handleBounds`.
- Componente: renderiza `<BaseEdge path={getBezierPath({ sx, sy, sourcePosition, tx, ty, targetPosition })[0]} />` con `style` pasado por props (incluye el color del dominio).
- Registrar en `edgeTypes`: `{ floating: FloatingEdge }`.
- `buildElements`: las edges orbital→container pasan a `type: 'floating'`, se elimina `targetHandle: 'right'`, se conservan `style.stroke`, `style.strokeWidth`, `style.opacity`.
- Los handles invisibles `id="right"`/`id="left"`/`id="top"`/`id="bottom"` sobre `ContainerNode` (líneas 191-196) permanecen: las flow edges entre dominios (§4.2.2) siguen usando `bottom`/`top` con handles explícitos.
- Flow edges entre dominios (origin→fear, fear→drive, etc.): **no** se migran a `floating` — la cadena debe fluir vertical por razones semánticas (CREENCIAS arriba, MÁSCARAS abajo). Su `type` cambia de `smoothstep` a `literaryFlow` en §4.2.2, pero la geometría del path sigue siendo smooth-step internamente (vía `getSmoothStepPath`) y los handles `sourceHandle: 'bottom'` + `targetHandle: 'top'` se conservan.

#### 4.2.2 EdgeLabelRenderer para la cadena causal

Los 4 flow edges tienen labels italicizados tipo "lo que da por hecho define lo que teme perder". Hoy renderizan en SVG text sin Lora real.

- Nuevo archivo: `src/components/character-graph/edges/LiteraryFlowEdge.tsx`.
- Usa `getSmoothStepPath` para el path SVG.
- Renderiza `<BaseEdge />` + un `<EdgeLabelRenderer>` con:
  - Un `<div>` absolutamente posicionado en el midpoint del path (`translate(-50%,-50%) translate(Xpx, Ypx)`).
  - Clase: `pointer-events-auto font-display italic text-[11px] text-stone-500 bg-[hsl(40_20%_97%)]/90 px-2 py-0.5 rounded-sm`.
  - `font-display` resuelve a Lora (definido en Tailwind config).
- Un `<circle>` SVG en el path, en el 20% del recorrido, fill = color del dominio fuente, radio 3. Sirve como "ink pool" — inspiración del bolder audit.
- Registrar en `edgeTypes`: `{ floating: FloatingEdge, literaryFlow: LiteraryFlowEdge }`.
- `buildElements`: las 4 edges entre dominios pasan a `type: 'literaryFlow'`. El `label` sigue en `edge.data.label` (no en `edge.label`), porque el label ahora lo renderiza nuestro componente, no React Flow.

#### 4.2.3 Animación de partícula en la cadena

Una gota que fluye CREENCIAS → MÁSCARAS, reforzando la metáfora de causación.

- Dentro de `LiteraryFlowEdge`, añadir un `<circle r="3" fill={domainColor}>` con `<animateMotion path={edgePath} dur="4s" repeatCount="indefinite" />`.
- Gate por `prefers-reduced-motion`: hook `useReducedMotion()` de framer-motion (ya instalado). Si reducida, renderizar el círculo estático en el mismo 20% del path (sin `animateMotion`).
- Escalonar las 4 edges con un `begin` incremental (0s, 1s, 2s, 3s) para que parezca un flujo continuo por la cadena.
- Si perf empeora visiblemente en máquinas lentas (~40+ nodos), gate adicional por una prop `animated?: boolean` en el edge; default true, false cuando `orbitalCount > 30`.

#### 4.2.4 Official `<MiniMap />` en modo graph

El canvas es ~2140px de alto. El usuario se pierde al hacer zoom. El outline renombrado en §4.1.4 sigue siendo para modo "Hablar".

- Importar `MiniMap` de `@xyflow/react`.
- Renderizar dentro de `<ReactFlow>`:
  ```tsx
  <MiniMap
    position="bottom-right"
    nodeColor={(n) => (n.data.color as string) ?? '#c4b9ae'}
    nodeStrokeWidth={0}
    maskColor="rgba(120, 113, 108, 0.12)"
    bgColor="hsl(40 20% 97%)"
    pannable
    zoomable
    style={{ border: '1px solid #e7e0d8', borderRadius: 8 }}
  />
  ```
- El color de cada nodo se lee de `data.color` (ya existe en containers y orbitals).
- Colocar en `bottom-right`, al lado opuesto del Panel con la leyenda (`top-right`). No colisionan.

#### 4.2.5 Cinco glifos de dominio

Reemplazar `BookOpen` repetido en los 5 headers de container.

- Mantener `lucide-react` como fuente (ya instalada). Mapeo propuesto:
  - `origin` (CREENCIAS): `Sprout` — semilla, lo dado por hecho.
  - `fear` (MIEDOS): `Flame` — lo que se evita, energía contenida.
  - `drive` (DESEOS): `Compass` — orientación, lo perseguido. (Alternativa: `Target`.)
  - `bond` (GRIETAS): `Zap` — fractura, descarga.
  - `mask` (MÁSCARAS): `VenetianMask` — si existe en lucide (verificar). Fallback: `Shield` o `Eye`.
- Añadir `icon: LucideIcon` al `ContainerMeta` en `ALL_CONTAINERS`.
- `ContainerNode` renderiza `<Icon className="w-4 h-4 shrink-0 opacity-40" style={{ color }} />` en lugar del `BookOpen` hardcodeado.
- Tamaño y opacidad idénticos al actual — no es un cambio de jerarquía, solo identidad.

#### 4.2.6 Background layered (paper + dots)

El fondo `hsl(40 20% 97%)` es casi gris. Objetivo: sensación de papel de cuaderno.

- Reemplazar el único `<Background color="#e8e0d4" gap={20} size={1} />` actual por dos layers:
  ```tsx
  <Background id="paper" variant={BackgroundVariant.Lines}
              color="#efe6d7" lineWidth={0.4} gap={32} />
  <Background id="dots"  variant={BackgroundVariant.Dots}
              color="#d6cdbe" gap={20} size={1} />
  ```
- El layer `paper` en `lineWidth` fino evoca rayado sutil de diario; los dots encima mantienen la textura actual.
- Tint del canvas base: cambiar `className="bg-[hsl(40_20%_97%)]"` a `bg-[hsl(40_30%_96%)]` — un punto más cálido, casi imperceptible individualmente pero coherente con los nuevos glifos y la gota flotante.

---

## 5. Componentes modificados / creados

### Nuevos

- `src/components/character-graph/edges/FloatingEdge.tsx`
- `src/components/character-graph/edges/LiteraryFlowEdge.tsx`
- `src/components/character-graph/edges/getEdgeParams.ts` (helper geométrico)

### Renombrados

- `src/components/character-graph/GraphMinimap.tsx` → `src/components/character-graph/DecisionFlowOutline.tsx` (export `DecisionFlowOutline`).

### Modificados

- `CharacterGraphCanvas.tsx`:
  - Envolver con `<ReactFlowProvider>` para poder usar `useReactFlow()` desde un hijo.
  - Registrar `edgeTypes`.
  - `buildElements`: orbital edges → `type: 'floating'`; flow edges → `type: 'literaryFlow'`.
  - `ContainerNode`: icono por dominio, a11y props.
  - `OrbitalNode`: a11y props + focus-visible.
  - `resolveCollisions`: whitelist a `type === 'child'`.
  - `buildElements`: preferir `charNode.canvas_x/canvas_y` para orbitals si existen.
  - Añadir `<MiniMap />`.
  - Dos layers de `<Background />`.
  - Nueva prop `drawerOpen` + `useEffect` con `fitView`.
  - Nueva prop `onPersistPosition` (pasada a `moveNode` desde la page).
- `CharacterGraphPage.tsx`:
  - Pasar `drawerOpen={selectedContainer !== null}` al canvas.
  - Pasar `onPersistPosition={moveNode}` al canvas.
  - Actualizar import `GraphMinimap` → `DecisionFlowOutline`.
- `useCharacterGraph.ts`: **no cambia**. `moveNode` ya existe.

---

## 6. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| `animateMotion` en Safari/iOS puede fallar o bajar FPS | Gate por `prefers-reduced-motion`; fallback a punto estático. Si se reporta, añadir feature flag env. |
| `useInternalNode` en v12 no está todavía estable en el ejemplo | Mantener fallback: si `internals.positionAbsolute` es undefined, usar `node.position` (no-absoluto) — produce floating edges ligeramente off cuando hay `parentId`, pero en este canvas no hay parents. |
| Rename de archivo rompe git blame | Usar `git mv` para que git detecte el rename. |
| `VenetianMask` puede no existir en la versión de lucide instalada | Verificar en el archivo de types; fallback a `Drama` o `Shield`. Chequeo en el plan. |
| Orbitals con `canvas_x`/`canvas_y` persistidos quedan dentro del área de otro dominio | No es un bug nuevo — ya puede pasar con el drag actual dentro de sesión. Fase 3 (intersection-drag) lo arregla. |
| MiniMap en `bottom-right` colisiona con futuras panels | Posición configurable por prop, default `bottom-right`. |

---

## 7. Testing / verificación

El repo no tiene framework de tests configurado (confirmado en `CLAUDE.md`). Verificación será manual en el dev server:

1. Arrancar `npm run dev`, abrir un personaje con ≥ 10 nodos repartidos en ≥ 3 dominios.
2. **Fase 0.1:** Arrastrar un orbital cerca de un container — verificar que el container NO se mueve.
3. **Fase 0.2:** Click en container para abrir drawer — verificar que el canvas se reencuadra (containers no quedan cortados).
4. **Fase 0.3:** Arrastrar un orbital, refrescar la página, verificar que la posición persiste.
5. **Fase 0.4:** Build (`npm run build`) — verificar que el rename resuelve en TS y ESLint (`npm run lint`).
6. **Fase 0.5:** Tab desde la barra superior hasta el canvas; Tab dentro — enter/space en un orbital lo selecciona.
7. **Fase 1.1:** Arrastrar un orbital hacia arriba del container: la edge re-ancla al borde superior, no cruza el cuerpo.
8. **Fase 1.2:** Zoom in al 1.0 en una flow edge — los labels se ven en Lora italic, no en sans SVG.
9. **Fase 1.3:** Observar 4 gotas fluyendo por la cadena. Activar reduced-motion en DevTools → desaparecen, aparecen puntos estáticos.
10. **Fase 1.4:** Scroll/zoom en el canvas mientras el MiniMap sigue mostrando los 5 colores de dominio.
11. **Fase 1.5:** Cada container tiene su glifo (sprout, flame, compass, zap, mask/drama).
12. **Fase 1.6:** Fondo tiene sensación de papel rayado suave + dots.

Browser check mínimo: Chrome + Firefox recientes. Sin verificación en Safari móvil (out of scope).

---

## 8. Orden de implementación sugerido

Fase 0 primero, entera, en un commit cohesionado (son cinco cambios pequeños, ninguno depende del siguiente). Fase 1 en 6 commits separados, uno por §4.2.1…§4.2.6, en ese orden — floating edges es el prerequisito visual; el resto son aditivos independientes y se pueden revertir individualmente si algo sale mal.

Fin del spec.
