# Especificacion de Diseno UI -- Metodo Sanderson

## Resumen de Cambios

Este documento describe el rediseno completo de la creacion, visualizacion y listado de mundos
usando el metodo Sanderson: un eje central del que se derivan 5 capas.

---

## A) Pantalla de Creacion (`CreateWorldPage.sanderson.tsx`)

### Estado 1: Inicial (solo el eje central)

```
+-------------------------------------------------------+
|  [BookOpen icon]  Define el corazon de tu mundo       |
|  Un eje central. Cinco capas derivadas. Un mundo.     |
+-------------------------------------------------------+
|                                                       |
|  NOMBRE DEL MUNDO                                     |
|  _________________________________  (underline input) |
|                                                       |
|  EL EJE CENTRAL                                       |
|  La premisa fundamental de tu mundo...                |
|                                                       |
|  +--------------------------------------------------+ |
|  |  "En este mundo, la lluvia nunca cesa..."         | |
|  |                                                   | |
|  |  (border dashed primary/25, min-h 140px)          | |
|  +--------------------------------------------------+ |
|                                                       |
|  [=== Derivar mundo ===]  (boton primary, full width) |
|                                                       |
+-------------------------------------------------------+
```

**Input de nombre**: border-bottom-only, Lora 18px, placeholder italic "Aun sin nombre..."
**Textarea del eje**: borde 2px dashed primary/25, radius-xl, focus: solid primary/40 + shadow
**Boton derivar**: primary, lg, icono Sparkles, disabled si textarea vacio

### Estado 2: Generando (AI working)

```
+-------------------------------------------------------+
|  [Eje central deshabilitado, visible pero opaco]      |
|                                                       |
|       [Animacion de libro abierto]                    |
|       Derivando tu mundo...                           |
|       [===--- barra indeterminada ---===]             |
|                                                       |
+-------------------------------------------------------+
```

**Libro animado**: dos "paginas" que oscilan con rotateY, particulas de "tinta" flotando
**Barra**: gradiente primary/60 que se desliza, w-48, en loop

### Estado 3: Post-derivacion (5 capas reveladas)

```
+-------------------------------------------------------+
|  [Eje central + nombre, todavia visibles y editables] |
|                                                       |
|  ─── Capas derivadas ───                        O eje |
|                                                  O ent|
|  | Entorno (emerald)                             O sub|
|  |   [Chip: "Un paisaje perpetuamente gris..." ] O org|
|  |   (pending: border dashed, bg accent/60)      O ten|
|  |   [Check] [Edit] [X] -- en hover              O ton|
|  |                                                    |
|  | Subsistencia (amber)         (delay: 200ms)        |
|  |   [Chip: "La agricultura depende de..."]           |
|  |                                                    |
|  | Organizacion (blue)          (delay: 400ms)        |
|  |   [Chip: "Ciudades-bunker con cupulas..."]         |
|  |                                                    |
|  | Tensiones (rose)             (delay: 600ms)        |
|  |   [Chip: "Los Gremios acumulan poder..."]          |
|  |                                                    |
|  | Tono narrativo (violet)      (delay: 800ms)        |
|  |   [Chip: "Melancolia resiliente..."]               |
|  |                                                    |
|  [Aceptar todas las sugerencias]  (outline, sm)       |
|                                                       |
|  (cuando todo aceptado:)                              |
|  [========= Guardar mundo =========]  (primary, lg)   |
|                                                       |
+-------------------------------------------------------+
```

### Suggestion Chips -- Estados visuales

| Estado | Fondo | Borde | Texto | Acciones |
|--------|-------|-------|-------|----------|
| Pending | accent/60 | dashed primary/20 | muted-foreground | Check, Edit, X (hover) |
| Accepted | primary/8 | solid primary/25 | foreground | Edit, X (opacity baja) |
| Editing | white | solid primary/40 2px | foreground | Textarea inline |
| Rejected | -- | -- | -- | Colapsa a 0 height |

**Animacion pending -> accepted**: Check badge hace pop-in (spring stiffness 600, damping 15)
**Animacion rejected**: opacity 0, height 0, marginBottom 0 (300ms easeInOut)

### Mini-mapa (DerivationProgress)

**Desktop**: sticky derecha, 6 nodos circulares verticales conectados por linea
**Mobile**: barra horizontal de 5 dots, centrada sobre las capas

| Estado nodo | Visual |
|-------------|--------|
| No revelado | circulo gris, border punteado, dot interno gris |
| Pendiente | border del color de la capa, icono emoji |
| Aceptado | relleno con color de capa, check SVG blanco |
| Activo | ring animado pulsante (scale 1 -> 1.4, opacity loop) |

---

## B) WorldCard Actualizada (`WorldCard.sanderson.tsx`)

### Layout

```
+---------------------------------------+
|  [Gradient inferido del eje central]  |
|  Nombre del mundo (Lora, bold, white) |
|  "En este mundo..." (Lora, italic)    |
+---------------------------------------+
|  O O O O O   (5 layer dots)           |
|                                       |
|  (en hover se expande:)               |
|  > Tensiones: texto truncado...       |
|  > Tono: texto truncado...            |
|                                       |
|  [Faccion] [Faccion] +1               |
+---------------------------------------+
```

### Generacion de gradiente

Sin "climate" predefinido, el gradiente se genera por dos vias:

1. **gradientHint** de la IA (campo opcional en el modelo, la IA asigna un mood)
2. **inferGradient()**: analisis de palabras clave en el eje central

Mapeo de keywords -> gradientes:

| Patron | Gradiente |
|--------|-----------|
| ceniza, volcan, fuego | from-red-500 to-orange-600 |
| hielo, nieve, glaciar | from-cyan-400 to-blue-600 |
| agua, oceano, lluvia | from-blue-400 to-indigo-600 |
| bosque, selva, verde | from-emerald-400 to-teal-600 |
| desierto, arena, sol | from-amber-400 to-orange-600 |
| oscuridad, sombra | from-slate-600 to-gray-800 |
| magia, hechizo | from-violet-500 to-purple-700 |
| tecnologia, digital | from-sky-400 to-cyan-600 |
| **fallback** | from-violet-500 to-purple-600 |

### Layer dots

5 circulos de 8px (w-2 h-2) en fila:
- Relleno con color de capa si la capa tiene contenido
- bg-muted-foreground/15 si esta vacia
- En hover aparece label "3/5 capas"

### Hover expansion

- AnimatePresence: height 0 -> auto, opacity 0 -> 1 (200ms ease)
- Muestra preview de 2 capas: "tensiones" y "tono" (las mas narrativas)
- Texto en 11px, muted-foreground, line-clamp-1, con icono emoji de la capa

---

## C) WorldDetailPage Actualizada (`WorldDetailPage.sanderson.tsx`)

### Hero Section

```
+----------------------------------------------------------+
|  [Gradient inferido, px-8 py-12]                         |
|                                            [Editar] [X]  |
|  Nombre del mundo (Lora, 4xl, bold, white)               |
|                                                          |
|  " [comilla decorativa grande, white/15]                 |
|    En este mundo llueve ceniza constantemente...         |
|    (Lora, italic, lg, white/80, max-w-2xl)              |
|                                                   "     |
+----------------------------------------------------------+
|  Capas | Profundidad | Personajes (0) | Escenas (0)     |
+----------------------------------------------------------+
```

**Comillas decorativas**: text-5xl, text-white/15, font-display, absolute positioning
**Navegacion**: tabs con underline activa (border-bottom-2 primary), sticky top-0

### Seccion Capas Derivadas

Grid 2 columnas (desktop), 1 columna (mobile):

```
+--- Entorno (emerald) ---+  +--- Subsistencia (amber) ---+
| [barra 4px color]       |  | [barra 4px color]          |
| Emoji + ENTORNO          |  | Emoji + SUBSISTENCIA       |
| Texto completo...        |  | Texto completo...          |
+--------------------------+  +----------------------------+

+--- Organizacion (blue) -+  +--- Tensiones (rose) -------+
| ...                      |  | ...                        |
+--------------------------+  +----------------------------+

+---------- Tono narrativo (violet, full width) -----------+
| ...                                                      |
+----------------------------------------------------------+
```

Cada capa: rounded-xl, bg-white, border gray-100, barra lateral 4px con color
Animacion de entrada: fade-in stagger (100ms delay entre cada una)

### Seccion Profundidad del Mundo

Solo visible si existen campos opcionales. Cards con fondo tematico:

| Campo | Fondo | Icono | Color |
|-------|-------|-------|-------|
| Facciones | accent/50, border primary/10 | -- | foreground |
| Miedo colectivo | rose-50/50, border rose-100 | Skull | rose |
| Mentira colectiva | amber-50/50, border amber-100 | Theater | amber |
| Vulnerabilidad del eje | slate-50/50, border slate-200 | ShieldAlert | slate |

---

## D) Microinteracciones

### 1. Cascada al derivar

```
Tiempo (ms):   0    180   360   540   720   900
               |     |     |     |     |     |
Capa:       Entorno Sub.  Org.  Tens. Tono  (todas visibles)
               |     |     |     |     |
Animacion:   y:20   y:20  y:20  y:20  y:20
             ->0    ->0   ->0   ->0   ->0
             scale:  scale scale scale scale
             0.97   0.97  0.97  0.97  0.97
             ->1    ->1   ->1   ->1   ->1

Spring: stiffness 300, damping 25
```

La cascada crea una sensacion de "despliegue" -- como si las capas se
revelaran una detras de otra, emergiendo del eje central.

### 2. Chip: pending -> accepted

```
Frame 0:    [Chip con border dashed, bg accent/60]
            Usuario hace click en Check
Frame 1:    Border transiciona: dashed -> solid (200ms ease)
            Background transiciona: accent/60 -> primary/8 (200ms)
Frame 2:    Badge de check hace pop-in:
            scale: 0 -> 1 (spring stiffness 600, damping 15)
            Aparece en esquina superior derecha del chip
Frame 3:    Botones de accion cambian a opacidad baja (40%)
```

### 3. Chip: pending -> editing

```
Frame 0:    Chip en estado pending
            Usuario hace click en Pencil
Frame 1:    Chip se transforma: scale 0.95, opacity 0 (chipSpring)
Frame 2:    Aparece textarea inline: scale 0.95 -> 1 (chipSpring)
            Border 2px solid primary/40
            Textarea con autofocus
Frame 3:    Enter confirma (auto-acepta), Escape cancela
```

### 4. Feedback de generacion (AI working)

```
Libro animado:
- Pagina izquierda: rotateY oscila 0 -> -15 -> 0 (2s loop)
- Pagina derecha:   rotateY oscila 0 -> 15 -> 0  (2s loop, delay 300ms)
- Lomo central: estatico, primary/30

Particulas de tinta (5 puntos):
- Cada uno: y -2 -> -20 -> -2 (loop 2.5s)
- x oscila +/- 6px
- opacity: 0 -> 0.7 -> 0 (fade in-out)
- Delay stagger: 350ms entre cada particula

Barra de progreso:
- Gradiente from-transparent via-primary/60 to-transparent
- Se desliza x: -100% -> 200% (2s loop)
- Width: 40% del contenedor

Texto:
- "Derivando tu mundo..." en Lora italic
- Opacity pulsa: 0.5 -> 1 -> 0.5 (3s loop)
```

### 5. Transicion estado vacio -> mundo construido

```
Fase 'axis':
  Solo nombre + textarea visible
  Card compacta, contenido minimo

Fase 'generating':
  Textarea se deshabilita (opacity reducida)
  AIGeneratingIndicator aparece con y: 10 -> 0, opacity 0 -> 1

Fase 'reviewing':
  AIGeneratingIndicator sale: y: 0 -> -10, opacity 1 -> 0
  Separador "Capas derivadas" aparece con gradiente que se materializa
  Capas entran en cascada (180ms entre cada una)
  Mini-mapa aparece en la derecha (desktop) / arriba (mobile)

  Cuando todas aceptadas:
  Boton "Guardar mundo" entra: y: 12 -> 0 (spring 300, damping 22)
  Con gradiente bg: from-primary to-primary/90

Guardado exitoso:
  Navegacion a /worlds con la transicion de pagina estandar del MainLayout
  (opacity 0 -> 1, y: 10 -> 0, duration 0.22s ease-out)
```

---

## Tokens de Diseno Relevantes

| Token | Valor | Uso |
|-------|-------|-----|
| --font-display | Lora, Georgia, serif | Titulos, nombre de mundo, eje central |
| --font-body | Source Sans 3, system-ui | Cuerpo, labels, botones |
| --primary | 263 70% 50% (purple) | Color principal, botones, acentos |
| --background | 40 20% 98% (warm off-white) | Fondo general |
| --accent | 263 80% 95% | Fondos sutiles, chips pending |
| entity-character | 25 95% 53% (warm orange) | Todo lo de personajes |
| entity-scene | 199 89% 48% (bright cyan) | Todo lo de escenas |

## Archivos Creados

| Archivo | Proposito |
|---------|-----------|
| `src/components/world-creation/SuggestionChip.tsx` | Chip de sugerencia con estados pending/accepted/editing/rejected |
| `src/components/world-creation/DerivationLayer.tsx` | Capa individual con animacion de cascada y collapse |
| `src/components/world-creation/DerivationProgress.tsx` | Mini-mapa vertical/horizontal de progreso |
| `src/components/world-creation/AIGeneratingIndicator.tsx` | Feedback visual tematico durante generacion |
| `src/pages/home/CreateWorldPage.sanderson.tsx` | Pagina de creacion completa |
| `src/components/WorldCard.sanderson.tsx` | Card actualizada para listado |
| `src/pages/home/WorldDetailPage.sanderson.tsx` | Pagina de detalle completa |
