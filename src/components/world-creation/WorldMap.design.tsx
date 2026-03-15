/**
 * WorldMap -- Documento de Diseno de Interfaz
 *
 * ============================================================
 * SISTEMA DE MAPA DEL MUNDO -- TRES NIVELES
 * ============================================================
 *
 * El mapa es una representacion espacial del mundo creado a traves
 * del flujo de derivacion Sanderson. Se integra organicamente con
 * las 5 capas (entorno, subsistencia, organizacion, tensiones, tono)
 * y evoluciona en tres niveles de complejidad.
 *
 *
 * ================================================================
 * NIVEL 1 -- MAPA ESQUEMATICO / CONCEPTUAL (MVP)
 * ================================================================
 *
 * Filosofia: Un diagrama de relaciones espaciales, NO un mapa
 * geografico. Piensa en un cruce entre un mind-map y un mapa de
 * metro, con estetica de manuscrito literario.
 *
 *
 * A) DONDE APARECE EN EL FLUJO
 * ----------------------------
 *
 * 1. DURANTE LA CREACION (CreateWorldPage.sanderson.tsx):
 *    - Se genera AUTOMATICAMENTE despues de la derivacion, junto
 *      con las 5 capas.
 *    - Aparece como una nueva seccion DESPUES de las capas derivadas,
 *      antes del boton "Guardar mundo".
 *    - El mapa se genera a partir de las capas de entorno y
 *      organizacion: la IA extrae regiones/lugares mencionados
 *      y sus relaciones implicitas.
 *    - Es EDITABLE en este punto: el usuario puede mover nodos,
 *      renombrar regiones, agregar/eliminar conexiones.
 *
 * 2. EN LA DETAIL PAGE (WorldDetailPage.sanderson.tsx):
 *    - Se agrega una nueva seccion "Mapa" en la barra de navegacion,
 *      entre "Capas" y "Profundidad".
 *    - El mapa se muestra en una card dedicada con fondo sutil.
 *    - Es interactivo: click en un nodo muestra un tooltip con
 *      la descripcion de esa region.
 *    - Boton "Editar mapa" abre el modo de edicion inline.
 *
 * 3. EN EL WORLDCARD (vista de lista):
 *    - NO aparece en el card. El mapa es una feature de detalle.
 *    - Opcionalmente, un icono pequeno (Map pin) indica que el
 *      mundo tiene un mapa generado.
 *
 *
 * B) LAYOUT DEL MAPA ESQUEMATICO
 * ------------------------------
 *
 * +--------------------------------------------------------------+
 * |  SECCION: Mapa del mundo                                     |
 * +--------------------------------------------------------------+
 * |                                                               |
 * |  +--- Toolbar -----------------------------------------------+|
 * |  | [Zoom -] [Zoom +] [Centrar] [Editar] | "Arrastrar nodos" ||
 * |  +-----------------------------------------------------------+|
 * |                                                               |
 * |  +--- Canvas SVG (aspect-ratio 16/10) -----------------------+|
 * |  |                                                            |
 * |  |        [Cupula Norte]                                      |
 * |  |            |                                               |
 * |  |      ......|..........                                     |
 * |  |   [Bosques    ]-----[Cupula Central]                       |
 * |  |   [Cerosos    ]        |         \                         |
 * |  |        |          [Rio Oscuro]   [Zona Nomada]             |
 * |  |   [Campos         ]    |                                   |
 * |  |   [Subterraneos   ]-[Cupula Sur]                           |
 * |  |                                                            |
 * |  |                                        leyenda:            |
 * |  |                                        O ciudad            |
 * |  |                                        [] region natural   |
 * |  |                                        -- ruta             |
 * |  |                                        ~~ rio              |
 * |  +------------------------------------------------------------+|
 * |                                                               |
 * +--------------------------------------------------------------+
 *
 *
 * C) ESTRUCTURA DE DATOS DEL MAPA
 * --------------------------------
 *
 * interface MapNode {
 *   id: string
 *   label: string
 *   description?: string        // texto breve, derivado de las capas
 *   type: 'city' | 'region' | 'landmark' | 'route-point'
 *   position: { x: number; y: number }   // posicion normalizada 0-1
 *   layerOrigin: LayerKey        // de que capa se derivo este nodo
 *   faction?: string             // faccion que controla esta zona
 * }
 *
 * interface MapEdge {
 *   id: string
 *   from: string                 // id del nodo origen
 *   to: string                   // id del nodo destino
 *   type: 'road' | 'river' | 'border' | 'trade-route'
 *   label?: string
 * }
 *
 * interface WorldMap {
 *   nodes: MapNode[]
 *   edges: MapEdge[]
 *   metadata: {
 *     generatedFrom: 'ai' | 'manual'
 *     lastModified: string
 *   }
 * }
 *
 *
 * D) COMPONENTES DEL NIVEL 1
 * --------------------------
 *
 * 1. <SchematicMap />           -- componente principal, canvas SVG
 * 2. <MapNode />                -- nodo individual (draggable)
 * 3. <MapEdge />                -- linea/conexion entre nodos
 * 4. <MapToolbar />             -- controles de zoom, centrado, modo edicion
 * 5. <MapLegend />              -- leyenda de tipos de nodo
 * 6. <MapNodeTooltip />         -- tooltip al hover/click un nodo
 * 7. <MapEmptyState />          -- estado vacio cuando no hay mapa
 *
 *
 * E) ESPECIFICACIONES VISUALES -- NIVEL 1
 * ----------------------------------------
 *
 * CANVAS:
 * - Container: rounded-xl, bg-card, border border-gray-100
 * - Fondo del SVG: bg gradient sutil usando el mismo inferGradient
 *   del mundo pero con opacity 3-5% (apenas un tinte de color)
 * - Textura de fondo: patron de puntos muy sutil (dot grid)
 *   como papel de dibujo. Color: muted-foreground/5
 *   Implementacion CSS:
 *     background-image: radial-gradient(circle, hsl(var(--muted-foreground) / 0.05) 1px, transparent 1px)
 *     background-size: 20px 20px
 * - Aspect ratio: 16/10 en desktop, 4/3 en mobile
 * - Min-height: 320px, max-height: 480px
 * - Overflow: hidden con clip-path rounded
 *
 * NODOS -- CIUDADES (type: 'city'):
 * - Forma: circulo con anillo doble
 * - Tamano: 32px (radio 16px)
 * - Fill: blanco (bg-card)
 * - Stroke exterior: color de la capa de origen (layerOrigin), 2px
 * - Stroke interior: mismo color, opacity 20%, 1px, radio -4px
 * - Sombra: drop-shadow sutil (0 2px 4px rgba(0,0,0,0.08))
 * - Label: debajo del nodo, font-body, text-[10px], font-semibold
 *          text-foreground, text-center, max-width 80px,
 *          bg-card/80 backdrop-blur px-1.5 py-0.5 rounded
 * - Hover: scale 1.15 (spring: stiffness 400, damping 20),
 *          stroke width aumenta a 3px, sombra se intensifica
 * - Seleccionado: ring-2 ring-primary/30, scale 1.1
 * - Dragging: opacity 0.8, cursor grabbing, sombra amplia
 *
 * NODOS -- REGIONES NATURALES (type: 'region'):
 * - Forma: rectangulo redondeado (rounded-lg)
 * - Tamano: 80px x 36px
 * - Fill: color de capa de origen con opacity 8%
 * - Stroke: color de capa de origen, 1.5px, dashed (4 4)
 * - Label: centrado dentro del rectangulo
 *          font-body, text-[10px], font-medium, color de capa
 * - Hover: fill opacity sube a 15%, stroke se vuelve solid
 *
 * NODOS -- LANDMARKS (type: 'landmark'):
 * - Forma: diamante (rombo, rotado 45deg)
 * - Tamano: 20px
 * - Fill: amber-400/60
 * - Stroke: amber-600, 1.5px
 * - Label: al lado derecho del diamante, misma tipografia que ciudades
 *
 * ARISTAS -- RUTAS (type: 'road'):
 * - SVG path con stroke
 * - Color: muted-foreground/25
 * - Ancho: 1.5px
 * - Estilo: solid
 * - Curva: bezier suave entre nodos (no lineas rectas)
 *   Calculo: punto de control en el punto medio desplazado
 *   perpendicularmente un 20% de la distancia
 *
 * ARISTAS -- RIOS (type: 'river'):
 * - Color: blue-400/40
 * - Ancho: 2px
 * - Estilo: wavy (implementado con SVG filter feTurbulence
 *   o con path sinusoidal)
 * - Extremos: rounded (stroke-linecap: round)
 *
 * ARISTAS -- FRONTERAS (type: 'border'):
 * - Color: rose-400/20
 * - Ancho: 1px
 * - Estilo: dashed (6 4)
 *
 * ARISTAS -- RUTAS COMERCIALES (type: 'trade-route'):
 * - Color: amber-500/30
 * - Ancho: 1px
 * - Estilo: dotted (2 4)
 * - Decoracion: pequenos triangulos cada 40px indicando direccion
 *
 * TOOLBAR:
 * - Posicion: dentro del canvas, absolute top-3 left-3
 * - Background: bg-card/90 backdrop-blur-sm
 * - Border: border border-gray-100, rounded-lg
 * - Shadow: shadow-sm
 * - Botones: icon buttons de 28x28px, gap-1
 * - Iconos (lucide): ZoomIn, ZoomOut, Maximize2 (centrar),
 *   Pencil (editar), Lock/Unlock (bloquear nodos)
 * - Separador vertical de 1px entre grupos de botones
 * - Hover: bg-accent, transition-colors
 * - Active: bg-primary/10, text-primary
 * - Tooltip en cada boton (text-[10px])
 *
 * LEYENDA:
 * - Posicion: dentro del canvas, absolute bottom-3 right-3
 * - Background: bg-card/90 backdrop-blur-sm
 * - Tamano: compacta, auto-width
 * - Items: icono + label, text-[9px], text-muted-foreground
 * - Oculta en mobile (espacio limitado)
 *
 * TOOLTIP AL HOVER UN NODO:
 * - Background: bg-popover, shadow-lg, border border-border
 * - Rounded-lg, px-3 py-2
 * - Titulo: font-body, text-xs, font-semibold, text-foreground
 * - Descripcion: font-body, text-[11px], text-muted-foreground
 *   max-width 200px, leading-relaxed
 * - Badge de faccion (si existe): inline-flex, text-[9px],
 *   bg del color de capa, rounded-full, px-2 py-0.5
 * - Aparece con delay 300ms, animacion scale 0.95->1, opacity 0->1
 * - Posicion: inteligente (evita salirse del canvas)
 *
 *
 * F) INTEGRACION CON CREATEWORLDPAGE
 * ------------------------------------
 *
 * LAYOUT ACTUALIZADO:
 *
 * +---------------------------------------------------+
 * |  Header: "Define el corazon de tu mundo"          |
 * +---------------------------------------------------+
 * |                                                   |
 * |  NOMBRE DEL MUNDO                                 |
 * |  [Input]                                          |
 * |                                                   |
 * |  --- El eje central ---                           |
 * |  [Textarea grande]                                |
 * |  [Boton "Derivar mundo"]                          |
 * |                                                   |
 * |  --- Capas derivadas --- (cascada animada)        |
 * |  | Entorno         [chip]                         |
 * |  | Subsistencia    [chip]                         |
 * |  | Organizacion    [chip]                         |
 * |  | Tensiones       [chip]                         |
 * |  | Tono narrativo  [chip]                         |
 * |                                                   |
 * |  --- Mapa del mundo --- (NUEVO, aparece con       |
 * |  |                       delay 1200ms despues     |
 * |  |                       de la ultima capa)       |
 * |  |                                                |
 * |  | +-------------------------------------------+  |
 * |  | | [Canvas SVG con nodos generados por IA]   |  |
 * |  | | [Toolbar: zoom, centrar, editar]          |  |
 * |  | |                                           |  |
 * |  | |    O Cupula Central                       |  |
 * |  | |   / \                                     |  |
 * |  | |  O   O                                    |  |
 * |  | |  ...                                      |  |
 * |  | +-------------------------------------------+  |
 * |  |                                                |
 * |  | Texto: "Mapa generado a partir de las capas.   |
 * |  |  Arrastra los nodos para reorganizar."         |
 * |  |                                                |
 * |  [Boton "Aceptar todo"]                           |
 * |  [Boton "Guardar mundo"]                          |
 * +---------------------------------------------------+
 *
 * COMPORTAMIENTO:
 * - El mapa aparece SOLO cuando todas las capas estan reveladas
 *   (las 5 animaciones de cascada completadas).
 * - Animacion de entrada: fade-in + slide-up, delay 1200ms
 *   (es decir, 200ms despues de la ultima capa que entra a 1000ms)
 * - El mapa es un componente standalone que recibe las capas
 *   derivadas como props y genera los nodos internamente.
 * - Si el usuario edita una capa (entorno u organizacion),
 *   aparece un boton "Regenerar mapa" junto al mapa.
 *   NO se regenera automaticamente (seria disruptivo si el
 *   usuario ya movio nodos manualmente).
 * - El mapa se incluye en los datos que se envian al guardar
 *   el mundo (posiciones de nodos, conexiones).
 *
 *
 * G) INTEGRACION CON WORLDDETAILPAGE
 * ------------------------------------
 *
 * LAYOUT ACTUALIZADO (nav bar):
 *
 * [Capas] [Mapa] [Profundidad] [Personajes] [Escenas]
 *                 ^-- NUEVO
 *
 * SECCION MAPA:
 *
 * +--------------------------------------------------------------+
 * |  Mapa del mundo                                              |
 * |  --- generado a partir de las capas derivadas ---            |
 * +--------------------------------------------------------------+
 * |                                                              |
 * |  +--- Canvas grande (aspect 16/10) -------------------------+|
 * |  |                                                           |
 * |  |  [Mapa esquematico completo con todos los nodos]          |
 * |  |  [Toolbar flotante]                                       |
 * |  |  [Leyenda]                                                |
 * |  |                                                           |
 * |  +-----------------------------------------------------------+|
 * |                                                              |
 * |  [Boton "Editar mapa"]    [Boton "Regenerar desde capas"]    |
 * |                                                              |
 * +--------------------------------------------------------------+
 *
 * - El mapa ocupa el full width de la seccion (max-w-4xl)
 * - Al hacer click en un nodo, se abre el tooltip con la info
 * - "Editar mapa" activa el modo drag-and-drop en los nodos
 * - "Regenerar desde capas" re-genera el mapa desde cero
 *   (con confirmacion modal: "Esto sobreescribira el mapa actual")
 *
 *
 * H) REACTIVIDAD AL CAMBIO DE CAPAS
 * -----------------------------------
 *
 * Regla de diseno: el mapa NO se actualiza automaticamente
 * cuando se edita una capa. Razon: el usuario puede haber
 * personalizado posiciones y conexiones manualmente.
 *
 * En su lugar:
 * 1. Si una capa de entorno u organizacion cambia (edit page),
 *    aparece un badge "Capas modificadas" sobre el mapa.
 * 2. El boton "Regenerar desde capas" se destaca visualmente
 *    (animacion pulse sutil en el borde).
 * 3. Al regenerar, se muestra un diff visual:
 *    - Nodos nuevos aparecen con borde verde pulsante
 *    - Nodos eliminados se muestran tachados con opacity 50%
 *    - El usuario confirma o descarta los cambios
 *
 * Badge "Capas modificadas":
 * - Position: absolute top-3 right-3 (dentro del canvas)
 * - bg-amber-50, border border-amber-200, rounded-full
 * - text-[10px], font-semibold, text-amber-700
 * - Icono: AlertTriangle (lucide), w-3 h-3
 * - Animacion: fade-in + scale spring
 *
 *
 * I) MODO EDICION DEL MAPA
 * -------------------------
 *
 * Cuando se activa "Editar mapa":
 *
 * +--------------------------------------------------------------+
 * |  [Toolbar extendida]                                         |
 * |  [Zoom-][Zoom+][Center] | [+ Nodo][+ Conexion][Borrar] |    |
 * |  [Tipo: Ciudad/Region/Landmark] | [Guardar][Cancelar]        |
 * +--------------------------------------------------------------+
 * |                                                              |
 * |  Canvas con:                                                 |
 * |  - Nodos draggables (cursor: grab)                           |
 * |  - Grid de snap visible (puntos mas prominentes)             |
 * |  - Al hacer click en vacio: crea nodo nuevo                  |
 * |  - Al hacer click en nodo: lo selecciona (ring primary)      |
 * |  - Al hacer click en nodo + shift + click otro:              |
 * |    crea conexion entre ambos                                 |
 * |  - Delete/Backspace: elimina nodo/conexion seleccionado      |
 * |  - Double-click en nodo: edita nombre inline                 |
 * |  - Double-click en label de conexion: edita label inline     |
 * |                                                              |
 * +--------------------------------------------------------------+
 *
 * CONTROLES DE EDICION:
 *
 * Boton "+ Nodo":
 * - Icono: CirclePlus (lucide)
 * - Al activarlo, el cursor cambia a crosshair
 * - Click en el canvas crea un nodo en esa posicion
 * - Aparece un mini-form inline: nombre + tipo (select)
 * - Spring animation al crear (scale 0 -> 1, bounce)
 *
 * Boton "+ Conexion":
 * - Icono: Link (lucide)
 * - Al activarlo, click en nodo A, luego click en nodo B
 * - Se dibuja una linea preview mientras se selecciona B
 * - Al confirmar, aparece select de tipo (road/river/border/trade)
 *
 * Boton "Borrar":
 * - Icono: Trash2 (lucide)
 * - Solo activo cuando hay algo seleccionado
 * - variant: ghost, text-destructive
 * - Elimina con animacion scale 1 -> 0 + opacity fade
 *
 * Edicion inline de nombre:
 * - Double-click en label del nodo
 * - Input aparece in-place, auto-focus, auto-select
 * - bg-card, border-primary, rounded, text-xs
 * - Enter confirma, Escape cancela
 * - El input tiene min-width 60px, max-width 120px
 *
 *
 * J) ANIMACIONES
 * ---------------
 *
 * Entrada del mapa (primera vez):
 * - Container: opacity 0 -> 1, y: 16 -> 0, duration 400ms
 * - Nodos: aparecen secuencialmente, 80ms entre cada uno
 *   scale 0 -> 1 con spring (stiffness 400, damping 22)
 * - Aristas: aparecen DESPUES de ambos nodos extremo,
 *   stroke-dashoffset animado (dibujado progresivo), 300ms
 *   Implementacion: SVG stroke-dasharray = total length,
 *   stroke-dashoffset transiciona de total a 0
 *
 * Drag de nodos:
 * - Spring physics: stiffness 300, damping 25
 * - Las aristas conectadas siguen al nodo en tiempo real
 * - Sombra se amplifica durante drag (shadow-md -> shadow-lg)
 * - Otros nodos tienen opacity 0.7 durante drag (foco visual)
 *
 * Hover en nodos:
 * - Scale: 1 -> 1.12, spring (stiffness 400, damping 20)
 * - Stroke-width: 2 -> 3
 * - Label: font-weight sube a semibold
 *
 * Hover en aristas:
 * - Stroke-width: 1.5 -> 2.5
 * - Opacity: sube a 60%
 * - Nodos conectados reciben highlight leve (ring sutil)
 *
 * Regeneracion de mapa:
 * - Nodos viejos: fade-out + scale down, 200ms stagger
 * - Pausa: 300ms
 * - Nodos nuevos: aparecen con animacion de entrada normal
 *
 *
 * K) RESPONSIVE
 * --------------
 *
 * Mobile (< 640px):
 * - Aspect ratio: 4/3 en vez de 16/10
 * - Toolbar: horizontal, botones mas pequenos (24x24)
 * - Leyenda: oculta (demasiado espacio)
 * - Labels de nodos: text-[8px] para ahorrar espacio
 * - Modo edicion: simplificado
 *   - No hay "+ Conexion" (demasiado impreciso con touch)
 *   - Drag funciona con touch events (onTouchStart/Move/End)
 *   - Long-press en nodo = seleccionar (en vez de click)
 * - El mapa tiene scroll horizontal si el contenido excede
 *   (overflow-x-auto con indicador visual de scroll)
 *
 * Tablet (640px - 1023px):
 * - Aspect ratio: 16/10
 * - Funcionalidad completa
 * - Toolbar en una sola fila
 *
 * Desktop (> 1024px):
 * - Aspect ratio: 16/10
 * - Funcionalidad completa
 * - Leyenda visible
 * - Tooltips con delay corto (200ms)
 *
 *
 * L) ACCESIBILIDAD
 * -----------------
 *
 * - Canvas SVG tiene role="img" con aria-label descriptivo:
 *   "Mapa esquematico del mundo [nombre] con [n] regiones y
 *   [m] conexiones"
 * - Cada nodo es focusable (tabindex="0") con aria-label:
 *   "[tipo] [nombre]: [descripcion breve]"
 * - Enter/Space en nodo: abre tooltip
 * - Flechas: mueven nodo en modo edicion (5px por keypress)
 * - Tab navega entre nodos en orden de creacion
 * - Escape: cierra tooltip, deselecciona nodo, sale de modo edicion
 * - Contraste: todos los labels cumplen WCAG AA (4.5:1)
 * - Los colores de capa tienen variantes de alto contraste
 *   para nodos sobre fondos oscuros
 * - prefers-reduced-motion: desactiva spring animations,
 *   usa fade simple de 150ms
 *
 *
 * M) COLORES DE NODOS POR CAPA DE ORIGEN
 * ----------------------------------------
 *
 * Los nodos heredan el color de la capa Sanderson de la cual
 * fueron derivados, creando un codigo visual de procedencia:
 *
 * - Entorno (environment): emerald-600 -- regiones naturales
 *   (bosques, rios, montanas, climas)
 * - Subsistencia (subsistence): amber-600 -- recursos, granjas,
 *   fuentes de agua, minas
 * - Organizacion (organization): blue-600 -- ciudades, fortalezas,
 *   capitales, sedes de gremios
 * - Tensiones (tensions): rose-600 -- zonas de conflicto, fronteras
 *   disputadas, territorios prohibidos
 * - Tono narrativo (tone): violet-600 -- lugares simbolicos,
 *   ruinas con significado, memoriales
 *
 * Esto conecta visualmente el mapa con las capas de derivacion
 * ya establecidas, manteniendo coherencia en el sistema de diseno.
 *
 *
 * ================================================================
 * NIVEL 2 -- MAPA ILUSTRADO GENERADO POR IA (MEDIO PLAZO)
 * ================================================================
 *
 * Filosofia: Un mapa visual estilo fantasia/pergamino generado
 * por un modelo de imagen (Stable Diffusion, DALL-E, etc.),
 * basado en las regiones y condiciones del mundo.
 *
 *
 * A) DONDE APARECE
 * ----------------
 *
 * - NO reemplaza al mapa esquematico. Son complementarios.
 * - Aparece como una opcion alternativa en la seccion de mapa
 *   de la WorldDetailPage.
 * - Toggle: [Esquematico] / [Ilustrado]
 * - El mapa ilustrado NO es editable en terminos de nodos.
 * - Tiene puntos interactivos (hotspots) que coinciden con
 *   los nodos del mapa esquematico.
 *
 *
 * B) LAYOUT
 * ----------
 *
 * +--------------------------------------------------------------+
 * |  Mapa del mundo                                              |
 * |  [Tab: Esquematico] [Tab: Ilustrado]                         |
 * +--------------------------------------------------------------+
 * |                                                              |
 * |  +--- Imagen generada (aspect 16/10) -----------------------+|
 * |  |                                                           |
 * |  |  [Imagen estilo pergamino/fantasia]                       |
 * |  |                                                           |
 * |  |  Con overlay de hotspots:                                 |
 * |  |    (*) Cupula Central                                     |
 * |  |    (*) Bosques Cerosos                                    |
 * |  |    (*) Rio Oscuro                                         |
 * |  |                                                           |
 * |  +-----------------------------------------------------------+|
 * |                                                              |
 * |  [Boton "Regenerar ilustracion"]                             |
 * |  Texto: "Generado por IA a partir de las capas del mundo."   |
 * |                                                              |
 * +--------------------------------------------------------------+
 *
 *
 * C) ESPECIFICACIONES VISUALES
 * ----------------------------
 *
 * IMAGEN:
 * - Container: rounded-xl, overflow-hidden, shadow-md
 * - Borde decorativo: 4px solid con gradient
 *   from-amber-200 via-amber-100 to-amber-200
 *   (evocando un marco de pergamino)
 * - La imagen tiene un filter CSS leve:
 *   sepia(8%) contrast(105%) -- para unificar el tono
 *
 * HOTSPOTS:
 * - Circulos de 12px, bg-card, border-2 border-primary
 * - Animacion pulsante leve (opacity 0.7 -> 1, 2s, infinite)
 * - Hover: scale 1.3, muestra tooltip
 * - Posiciones mapeadas del esquematico al ilustrado
 *   (requiere que el usuario o la IA establezcan correspondencia)
 *
 * TAB TOGGLE:
 * - Usa el PillSelect existente del sistema de diseno
 * - "Esquematico" con icono GitBranch
 * - "Ilustrado" con icono Image
 * - Animacion de slide al cambiar (framer-motion layoutId)
 *
 * PROMPT DE GENERACION:
 * - Se construye automaticamente a partir de:
 *   1. Eje central del mundo
 *   2. Capa de entorno (completa)
 *   3. Nombres de regiones del mapa esquematico
 *   4. Estilo: "fantasy map, parchment style, top-down view,
 *      hand-drawn illustration, muted earth tones, labeled regions"
 * - El prompt es visible al usuario en un disclosure
 *   "Ver prompt de generacion" (transparencia)
 *
 * LOADING STATE:
 * - Skeleton con animacion shimmer
 * - Aspect ratio mantenido (16/10)
 * - Texto central: "Generando ilustracion del mapa..."
 *   con AIGeneratingIndicator existente reutilizado
 * - Tiempo estimado: 15-30 segundos (mostrar progress)
 *
 *
 * D) INTERACCION CON CAPAS
 * -------------------------
 *
 * - Misma logica que Nivel 1: NO se regenera automaticamente
 * - Badge "Capas modificadas" cuando el mundo cambia
 * - "Regenerar ilustracion" requiere confirmacion
 * - Regenerar consume recursos de GPU (indicar al usuario)
 *
 *
 * ================================================================
 * NIVEL 3 -- EDITOR DE MAPA INTERACTIVO (LARGO PLAZO)
 * ================================================================
 *
 * Filosofia: Una herramienta de dibujo simplificada inspirada
 * en Inkarnate/Wonderdraft, pero con la estetica literaria
 * de StoryTeller. Canvas con herramientas de terreno, marcadores
 * y etiquetas.
 *
 *
 * A) DONDE APARECE
 * ----------------
 *
 * - Pagina dedicada: /worlds/:id/map/editor
 * - Accesible desde el boton "Editor avanzado" en la seccion
 *   de mapa de WorldDetailPage
 * - Layout full-screen (sale del MainLayout sidebar)
 * - Toolbar superior + panel lateral de herramientas
 *
 *
 * B) LAYOUT
 * ----------
 *
 * +--------------------------------------------------------------+
 * |  [<- Volver] Editor de mapa: [Nombre del mundo]   [Guardar]  |
 * +--------------------------------------------------------------+
 * |  |                                                      |    |
 * |  | HERRAMIENTAS         CANVAS                     PROPS|    |
 * |  | +----------+  +-----------------------------+  +----+|    |
 * |  | | Terreno  |  |                             |  | ... ||    |
 * |  | | - Agua   |  |    [Canvas de dibujo]       |  |     ||    |
 * |  | | - Tierra |  |    [Grid visible]           |  |     ||    |
 * |  | | - Bosque |  |    [Layers system]          |  |     ||    |
 * |  | | - Nieve  |  |                             |  |     ||    |
 * |  | | - Arena  |  |                             |  |     ||    |
 * |  | |          |  |                             |  |     ||    |
 * |  | | Marcador |  |                             |  |     ||    |
 * |  | | - Ciudad |  |                             |  |     ||    |
 * |  | | - Ruina  |  +-----------------------------+  +----+|    |
 * |  | | - Puerto |                                         |    |
 * |  | |          |  [Zoom: 100%] [Undo] [Redo]             |    |
 * |  | | Texto    |                                         |    |
 * |  | | - Label  |                                         |    |
 * |  | | - Titulo |                                         |    |
 * |  | +----------+                                         |    |
 * +--------------------------------------------------------------+
 *
 *
 * C) HERRAMIENTAS PRINCIPALES
 * ----------------------------
 *
 * TERRENO (brush painting):
 * - Selector de tipo: agua, tierra, bosque, nieve, arena,
 *   montanas, pantano, lava
 * - Tamano de brush: slider 10-100px
 * - Opacidad: slider 20-100%
 * - Cada tipo tiene una textura/patron SVG propio
 * - Se pinta sobre un canvas (HTML Canvas o WebGL)
 *
 * MARCADORES (stamp placement):
 * - Iconos predefinidos: ciudad, capital, ruina, puerto,
 *   torre, cueva, templo, mercado, fortaleza
 * - Estilo: iconos en linea fina, estilo cartografico
 * - Draggable despues de colocar
 * - Cada marcador puede tener nombre y descripcion
 * - Colores heredan del sistema de capas Sanderson
 *
 * TEXTO (label placement):
 * - Dos tipos: label (pequeno, para regiones) y
 *   titulo (grande, para areas principales)
 * - Font: Lora para titulos, Source Sans 3 para labels
 * - Color: seleccionable con color picker (presets de entidad)
 * - Rotacion: drag handle para rotar texto
 * - Curvatura: opcion para texto que sigue un path (rios, costas)
 *
 * RUTAS (path drawing):
 * - Herramienta de dibujo de lineas con curvas bezier
 * - Tipos: camino, rio, frontera, ruta comercial
 * - Se dibuja punto a punto (click to add, double-click to finish)
 * - Los segmentos son editables (arrastrar control points)
 *
 *
 * D) PANEL DE PROPIEDADES (derecha)
 * ----------------------------------
 *
 * Cuando se selecciona un elemento:
 * - Nombre: input editable
 * - Tipo: selector
 * - Capa de origen: badge (del sistema Sanderson)
 * - Descripcion: textarea pequeno
 * - Faccion: selector (de las facciones del mundo)
 * - Posicion: x, y (inputs numericos)
 * - Estilo: color, opacidad, tamano
 * - Acciones: duplicar, eliminar
 *
 *
 * E) ESPECIFICACIONES VISUALES DEL EDITOR
 * -----------------------------------------
 *
 * HEADER:
 * - bg-card, border-b, h-12
 * - Boton volver: ghost, con flecha
 * - Nombre del mundo: font-display, text-lg
 * - Boton guardar: primary, size sm
 * - Indicador de cambios no guardados: punto amarillo
 *
 * PANEL HERRAMIENTAS (izquierda):
 * - Width: 200px (collapsible en mobile)
 * - bg-card, border-r
 * - Secciones con accordion
 * - Iconos: 20x20, color muted-foreground
 * - Hover: bg-accent
 * - Activo: bg-primary/10, text-primary, border-l-2 border-primary
 *
 * CANVAS:
 * - Fondo: patron de cuadricula sutil
 * - Zoom: ctrl+scroll o pinch
 * - Pan: middle-click drag o space+drag
 * - Snap to grid: toggle, grid de 10px
 *
 * PANEL PROPIEDADES (derecha):
 * - Width: 240px (hidden cuando nada seleccionado)
 * - bg-card, border-l
 * - Aparece con slide-in desde la derecha (300ms)
 * - Labels: text-[11px], uppercase, tracking-widest
 *
 *
 * F) INTEGRACION CON MAPA ESQUEMATICO
 * -------------------------------------
 *
 * - El editor puede IMPORTAR el mapa esquematico (Nivel 1)
 *   como punto de partida.
 * - Los nodos del esquematico se convierten en marcadores.
 * - Las aristas se convierten en rutas.
 * - El usuario pinta terreno alrededor.
 *
 * - El editor puede EXPORTAR de vuelta al esquematico:
 *   los marcadores y rutas se simplifican a nodos y aristas.
 *
 *
 * ================================================================
 * PRIORIDADES DE IMPLEMENTACION
 * ================================================================
 *
 * FASE 1 -- MVP (Nivel 1 esquematico):
 * 1. Definir modelo de datos MapNode + MapEdge en el backend
 * 2. Endpoint de generacion: POST /world/:id/map/generate
 *    (recibe capas, devuelve nodos y aristas)
 * 3. Componente <SchematicMap /> con SVG y drag basico
 * 4. Integracion en CreateWorldPage post-derivacion
 * 5. Integracion en WorldDetailPage como nueva seccion
 * 6. Persistencia: los datos del mapa se guardan con el mundo
 *
 * FASE 2 -- Mejoras del esquematico:
 * 7. Modo edicion completo (agregar/eliminar nodos y conexiones)
 * 8. Edicion inline de nombres
 * 9. Indicador de "capas modificadas"
 * 10. Diff visual al regenerar
 *
 * FASE 3 -- Mapa ilustrado (Nivel 2):
 * 11. Integracion con modelo de imagen (Ollama con SD o API externa)
 * 12. Sistema de hotspots sobre la imagen
 * 13. Toggle esquematico/ilustrado
 *
 * FASE 4 -- Editor avanzado (Nivel 3):
 * 14. Canvas de dibujo con WebGL/Canvas API
 * 15. Sistema de texturas y brushes
 * 16. Sistema de marcadores y rutas
 * 17. Import/export con esquematico
 *
 *
 * ================================================================
 * DEPENDENCIAS TECNICAS (Nivel 1 MVP)
 * ================================================================
 *
 * Nuevas dependencias necesarias:
 * - Ninguna obligatoria. SVG nativo + framer-motion existente
 *   son suficientes para el mapa esquematico.
 *
 * Opcionales para mejorar la experiencia:
 * - @use-gesture/react -- para drag and drop con inercia
 *   (mas natural que onMouseDown/Move/Up manual)
 * - d3-force -- para layout automatico de nodos (force-directed
 *   graph), util para la posicion inicial de los nodos generados
 *   por la IA. Pero es pesado; considerar implementacion manual
 *   simplificada.
 *
 * Enfoque recomendado: empezar con SVG puro + framer-motion
 * drag. Si la experiencia no es fluida, agregar @use-gesture.
 *
 *
 * ================================================================
 * TIPOGRAFIA DEL MAPA
 * ================================================================
 *
 * Labels de nodo (ciudades, landmarks):
 * - font-family: var(--font-body) -- Source Sans 3
 * - font-size: 10px
 * - font-weight: 600
 * - text-transform: none (nombres propios)
 * - fill: var(--foreground)
 * - Sombra de texto: 0 1px 2px white (legibilidad sobre el canvas)
 *
 * Labels de nodo (regiones):
 * - font-family: var(--font-body)
 * - font-size: 10px
 * - font-weight: 500
 * - fill: color de la capa de origen
 *
 * Titulo del mapa (si se agrega en futuro):
 * - font-family: var(--font-display) -- Lora
 * - font-size: 14px
 * - font-weight: 600
 * - font-style: italic
 * - fill: var(--foreground)
 *
 * Labels de aristas:
 * - font-family: var(--font-body)
 * - font-size: 8px
 * - font-weight: 400
 * - font-style: italic
 * - fill: var(--muted-foreground)
 * - Posicion: punto medio de la arista, rotado para seguir
 *   la direccion de la linea
 *
 *
 * ================================================================
 * TOKENS DE COLOR ADICIONALES NECESARIOS
 * ================================================================
 *
 * Agregar a index.css en @theme:
 *
 * --color-map-canvas: hsl(40 20% 97%);        // fondo del mapa
 * --color-map-grid: hsl(var(--muted-foreground) / 0.05);
 * --color-map-edge-road: hsl(var(--muted-foreground) / 0.25);
 * --color-map-edge-river: hsl(210 80% 60% / 0.4);
 * --color-map-edge-border: hsl(0 70% 60% / 0.2);
 * --color-map-edge-trade: hsl(38 90% 50% / 0.3);
 * --color-map-node-shadow: hsl(0 0% 0% / 0.08);
 *
 */

// ================================================================
// COMPONENTE PLACEHOLDER -- Nivel 1 MVP
// ================================================================
// Este es el esqueleto del componente principal.
// La implementacion completa se desarrollara en archivos separados.

import { type LayerKey } from './DerivationLayer'

/**
 * Datos de un nodo en el mapa esquematico.
 */
export interface MapNode {
  id: string
  label: string
  description?: string
  type: 'city' | 'region' | 'landmark' | 'route-point'
  position: { x: number; y: number }
  layerOrigin: LayerKey
  faction?: string
}

/**
 * Conexion entre dos nodos.
 */
export interface MapEdge {
  id: string
  from: string
  to: string
  type: 'road' | 'river' | 'border' | 'trade-route'
  label?: string
}

/**
 * Estructura completa del mapa de un mundo.
 */
export interface WorldMapData {
  nodes: MapNode[]
  edges: MapEdge[]
  metadata: {
    generatedFrom: 'ai' | 'manual'
    lastModified: string
    layersHash?: string // hash de las capas para detectar cambios
  }
}

/**
 * Props del componente principal de mapa esquematico.
 */
export interface SchematicMapProps {
  /** Datos del mapa (nodos + aristas) */
  data: WorldMapData
  /** Modo de interaccion */
  mode: 'view' | 'edit'
  /** Callback cuando el usuario modifica el mapa */
  onChange?: (data: WorldMapData) => void
  /** Si las capas han cambiado desde la ultima generacion */
  layersModified?: boolean
  /** Callback para regenerar el mapa */
  onRegenerate?: () => void
  /** Nombre del mundo (para aria-label) */
  worldName: string
  /** Gradiente del mundo (para tinte de fondo) */
  gradient?: string
}

// Placeholder export para que el archivo sea un modulo valido
export default function SchematicMapPlaceholder() {
  return null
}
