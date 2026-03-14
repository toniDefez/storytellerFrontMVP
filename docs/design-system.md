# StoryTeller -- Sistema de Diseno Visual

## Diagnostico del estado actual

### Problemas identificados en el codigo

1. **Tres lenguajes visuales distintos:**
   - Auth (Login/Register): gradientes pastel (blue-pink, green-blue), fondo decorativo SVG, botones gradiente arcoiris, `shadow-2xl`, `backdrop-blur-md`
   - Creacion (CreateWorldPage): fondo blanco con barra violeta superior, inputs `rounded-xl`, tabs personalizados, sombras violeta
   - Detalle (WorldDetailPage): `bg-white/90`, titulos `text-purple-800`, botones sueltos (`bg-red-500`, `bg-green-500`) sin sistema

2. **Botones sin sistema:**
   - Login: `bg-gradient-to-r from-blue-500 to-pink-500`
   - Register: `bg-gradient-to-r from-green-400 to-blue-500`
   - Crear mundo: `bg-gradient-to-r from-violet-600 to-purple-600`
   - Borrar: `bg-red-500` (inline, sin variante)
   - Crear personaje/escena: `bg-green-500` (no tiene relacion con la paleta)
   - ErrorModal: `bg-gradient-to-r from-red-400 to-pink-500`
   - SuccessModal: `bg-gradient-to-r from-green-400 to-blue-500`

3. **Modales inconsistentes:**
   - ConfirmModal: buena estructura (alertdialog, aria), pero sin animacion
   - ErrorModal: sin aria, sin keyboard trap, icono X en vez de icono de error, boton gradiente
   - SuccessModal: sin aria, sin keyboard trap, boton gradiente distinto

4. **Loading = texto plano:** `"Cargando mundos..."`, `"Cargando mundo..."` sin indicador visual

5. **Sin navegacion contextual:** WorldDetailPage no tiene breadcrumbs ni boton volver

6. **Componentes duplicados:** cada pagina redefine `inputClass`, `textareaClass`, `FieldGroup`, `SectionDivider`

---

## 1. Tokens de diseno

Mapeo directo a las CSS variables que usa shadcn/ui. Paleta violeta como primario, slate como neutro.

### Colores (modo claro)

```
--background:        0 0% 98%          /* #fafafa - fondo general */
--foreground:        222 47% 11%       /* #1e293b - texto principal */

--card:              0 0% 100%         /* #ffffff */
--card-foreground:   222 47% 11%       /* #1e293b */

--popover:           0 0% 100%         /* #ffffff */
--popover-foreground: 222 47% 11%      /* #1e293b */

--primary:           263 70% 50%       /* #7c3aed - violeta principal */
--primary-foreground: 0 0% 100%        /* #ffffff */

--secondary:         220 14% 96%       /* #f1f5f9 - slate-100 */
--secondary-foreground: 220 9% 46%     /* #64748b - slate-500 */

--muted:             220 14% 96%       /* #f1f5f9 */
--muted-foreground:  215 16% 47%       /* #64748b */

--accent:            263 80% 95%       /* #ede9fe - violeta muy claro */
--accent-foreground: 263 70% 50%       /* #7c3aed */

--destructive:       0 84% 60%         /* #ef4444 */
--destructive-foreground: 0 0% 100%    /* #ffffff */

--border:            220 13% 91%       /* #e2e8f0 - slate-200 */
--input:             220 13% 91%       /* #e2e8f0 */
--ring:              263 70% 50%       /* #7c3aed - foco violeta */
```

### Colores (modo oscuro) -- preparado, no implementar en MVP

```
--background:        222 47% 7%        /* ~#0f172a */
--foreground:        210 40% 98%       /* #f8fafc */
--card:              222 47% 11%       /* #1e293b */
--primary:           263 70% 58%       /* #8b5cf6 - violeta mas claro para contraste */
--border:            217 33% 18%       /* #334155 */
```

### Colores semanticos adicionales (para badges, WorldCard, etc.)

```
--success:           160 84% 39%       /* #10b981 */
--warning:           38 92% 50%        /* #f59e0b */
--info:              217 91% 60%       /* #3b82f6 */
```

### Gradientes por clima (se mantienen -- identidad visual de WorldCard)

```
Artico:       from-cyan-400 to-blue-500
Tropical:     from-emerald-400 to-teal-500
Desertico:    from-amber-400 to-orange-500
Volcanico:    from-red-500 to-rose-600
Oceanico:     from-blue-400 to-indigo-500
Montanoso:    from-slate-400 to-stone-500
Toxico:       from-lime-400 to-green-600
Templado:     from-violet-400 to-purple-500
Default:      from-violet-500 to-purple-600
```

### Tipografia

```
--font-sans:         'Inter', system-ui, -apple-system, sans-serif
--font-mono:         'JetBrains Mono', ui-monospace, monospace  (para codigo/tokens)

Escala (rem / px):
  xs:    0.75rem  / 12px   -- metadatos, labels uppercase
  sm:    0.875rem / 14px   -- texto secundario, botones sm
  base:  1rem    / 16px    -- texto cuerpo, inputs
  lg:    1.125rem / 18px   -- subtitulos
  xl:    1.25rem  / 20px   -- titulos de seccion
  2xl:   1.5rem  / 24px    -- titulos de pagina
  3xl:   1.875rem / 30px   -- titulos auth

Pesos:
  400 (normal)   -- texto cuerpo
  500 (medium)   -- labels, badges
  600 (semibold) -- subtitulos, botones
  700 (bold)     -- titulos de pagina
```

### Espaciado

Base unit: 4px. Escala consistente:

```
0.5:  2px     -- micro gaps
1:    4px     -- gap entre badges
1.5:  6px     -- padding interno pequeno
2:    8px     -- gap entre items en listas
3:    12px    -- padding de badges/pills
4:    16px    -- padding de cards, gap de grid
5:    20px    -- padding de secciones
6:    24px    -- margen entre secciones
8:    32px    -- margen entre bloques principales
10:   40px    -- padding de formularios
12:   48px    -- margen de pagina
16:   64px    -- separacion de secciones mayores
```

### Border radius

```
--radius:  0.5rem (8px)   -- base de shadcn

Derivados automaticos:
  radius-sm:  calc(var(--radius) - 4px)  = 4px   -- badges, pills
  radius-md:  calc(var(--radius))         = 8px   -- botones, inputs
  radius-lg:  calc(var(--radius) + 4px)   = 12px  -- cards, modales
  radius-xl:  calc(var(--radius) + 8px)   = 16px  -- WorldCard, contenedores principales
  radius-full: 9999px                             -- PillSelect (se mantiene)
```

### Sombras

```
sm:    0 1px 2px 0 rgb(0 0 0 / 0.05)                           -- cards en reposo
md:    0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)  -- cards hover
lg:    0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.04) -- modales
xl:    0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.04) -- solo auth card
```

---

## 2. Componentes shadcn a usar

### Mapeo de reemplazo

| Componente shadcn   | Reemplaza                                    | Notas                                              |
|---------------------|----------------------------------------------|-----------------------------------------------------|
| `Button`            | Todos los `<button>` inline con clases ad-hoc | 4 variantes: primary, secondary, destructive, ghost |
| `Input`             | `inputClass` duplicado en cada pagina        | Con soporte de error integrado                      |
| `Textarea`          | `textareaClass` duplicado                    | Misma base que Input                                |
| `Label`             | `FieldGroup` custom + labels inline          | Labels consistentes con `htmlFor`                   |
| `Card`              | Divs con `bg-white rounded-2xl shadow-xl`    | Card, CardHeader, CardContent, CardFooter           |
| `Dialog`            | ConfirmModal, ErrorModal, SuccessModal       | Un solo componente base con variantes               |
| `AlertDialog`       | ConfirmModal (acciones destructivas)         | Keyboard trap + aria nativo                         |
| `Sonner` (toast)    | SuccessModal, ErrorModal (feedback rapido)   | Reemplaza modales para feedback no-bloqueante       |
| `Alert`             | Errores inline, NoInstallationBanner         | Variantes: default, destructive, warning            |
| `Badge`             | Spans de facciones, tags de escena           | Variantes: default, secondary, outline              |
| `Tabs`              | Tabs manual/IA custom                        | Mantener mismo comportamiento, estilo unificado     |
| `Skeleton`          | Texto "Cargando..."                          | Skeleton de cards y de detalle                      |
| `Breadcrumb`        | No existe actualmente                        | Nuevo: navegacion contextual                        |
| `Separator`         | `SectionDivider` custom                      | Con label opcional                                  |
| `Tooltip`           | No existe actualmente                        | Para iconos de accion sin texto                     |
| `Sheet`             | Sidebar mobile (div custom)                  | Transicion suave + overlay accesible                |
| `DropdownMenu`      | No existe actualmente                        | Para menu de perfil futuro                          |
| `ScrollArea`        | No existe actualmente                        | Para sidebar si crece                               |

### Variantes de Button

```
primary:      bg-primary text-primary-foreground
              Uso: accion principal de cada pagina (Crear mundo, Guardar, Entrar)
              Solo UN boton primary visible por pantalla

secondary:    bg-secondary text-secondary-foreground
              Uso: acciones secundarias (Cancelar, Volver)

destructive:  bg-destructive text-destructive-foreground
              Uso: borrar mundo, borrar escena

ghost:        hover:bg-accent hover:text-accent-foreground
              Uso: navegacion en sidebar, acciones terciarias

outline:      border border-input bg-background hover:bg-accent
              Uso: filtros, toggles

Tamanos:
  sm:   h-8  px-3 text-xs    -- acciones en cards, badges clickables
  md:   h-9  px-4 text-sm    -- default, mayoria de acciones
  lg:   h-10 px-6 text-sm    -- CTAs principales (Crear mundo, Entrar)
  icon: h-9  w-9             -- botones con solo icono (cerrar, menu)
```

### Variantes de Alert

```
default:      border-border bg-background
              Uso: informacion general

destructive:  border-destructive/50 text-destructive bg-destructive/5
              Uso: errores de formulario, errores de API

warning:      border-warning/50 text-warning-foreground bg-warning/5
              Uso: NoInstallationBanner
```

### Variantes de Badge

```
default:      bg-primary text-primary-foreground
              Uso: contadores activos

secondary:    bg-secondary text-secondary-foreground
              Uso: clima, politica, cultura en WorldCard

outline:      border text-foreground
              Uso: facciones

accent:       bg-accent text-accent-foreground
              Uso: tags de escena (location, time, tone)
```

---

## 3. Patrones de pagina

### Auth pages (Login / Register)

**Layout:**
- Pantalla completa centrada, sin sidebar
- Fondo: `bg-background` con un sutil patron geometrico en violeta (SVG decorativo)
  - ELIMINAR los gradientes pastel diferentes por pagina (blue-pink vs green-blue)
  - Un solo fondo unificado para auth
- Card central: `max-w-md`, componente Card de shadcn con `shadow-xl`
- Logo StoryTeller centrado arriba del formulario
- Barra decorativa violeta en top del card (se mantiene, es identidad)

**Estructura:**
```
[fondo sutil]
  [Card max-w-md centrado vertical y horizontal]
    [Logo + nombre app]
    [Titulo: "Iniciar sesion" / "Crear cuenta"]
    [Alert destructive si hay error -- reemplaza texto rojo inline]
    [campos con Label + Input de shadcn]
    [Button primary lg full-width]
    [link a la otra pagina de auth]
  [/Card]
```

**Cambios clave vs actual:**
- UN solo estilo de fondo para login y register (eliminar la diferencia de gradiente)
- Boton: `Button variant="primary" size="lg"` en vez de gradiente custom
- Error: componente `Alert variant="destructive"` en vez de `<p className="text-red-600">`
- Exito de registro: `toast.success()` de Sonner en vez de SuccessModal bloqueante

---

### List page (HomePage -- Mis mundos)

**Layout:**
- Dentro de MainLayout (sidebar + contenido)
- Header de pagina: titulo + contador + boton CTA alineado a la derecha
- Grid de WorldCards responsive (se mantiene la grid actual)

**Estructura:**
```
[Page header]
  [h1 "Mis mundos"]  [Badge secondary "{n} mundos"]  [Button primary "Nuevo mundo"]

[Grid 1/2/3/4 cols responsive]
  [WorldCard]  -- se mantiene con gradientes por clima
  [WorldCard]
  ...
```

**Loading state:**
```
[Page header skeleton: linea de titulo + badge + boton]
[Grid de Skeleton cards]
  Cada skeleton card:
    [rectangulo gradiente 120px alto]  -- simula el header con gradiente
    [linea de texto 60%]               -- simula nombre
    [linea de texto 40%]               -- simula era
    [3 badges skeleton]                -- simula tags
```

**Empty state:**
```
[Contenedor centrado min-h-[60vh]]
  [Icono globo en circulo violeta claro -- se mantiene]
  [h2 "Aun no tienes mundos"]
  [p texto guia]
  [Button primary "Crear mi primer mundo"]
```

**Error state:**
```
[Alert variant="destructive" con icono]
  [titulo: "Error al cargar mundos"]
  [mensaje del error]
  [Button ghost "Reintentar"]
```

---

### Detail page (WorldDetail, CharacterDetail, SceneDetail)

**Layout:**
- Breadcrumbs en la parte superior
- Card principal con la info de la entidad
- Secciones secundarias (personajes, escenas) como cards separadas debajo

**Estructura de WorldDetailPage:**
```
[Breadcrumb]
  Mundos > {nombre del mundo}

[Card principal]
  [CardHeader]
    [div flex justify-between]
      [h1 nombre del mundo]
      [Button variant="destructive" size="sm" "Borrar"]
  [CardContent]
    [Grid 2 cols con los atributos]
      Era: {era}        Clima: {clima}
      Politica: {pol}   Cultura: {cultura}
    [Separator]
    [Descripcion si existe]
    [Separator]
    [Facciones como Badges variant="outline"]

[Card seccion personajes]
  [CardHeader]
    [h2 "Personajes" + Badge con contador]
    [Button variant="secondary" size="sm" "+ Crear personaje"]
  [CardContent]
    [Grid 1/2 cols de character mini-cards]
    o
    [Empty state inline: icono + texto + boton]

[Card seccion escenas]
  -- mismo patron que personajes
```

**Cambios clave vs actual:**
- ELIMINAR `bg-green-500` para "Crear personaje/escena" --> `Button variant="secondary"`
- ELIMINAR `bg-red-500` para "Borrar" --> `Button variant="destructive" size="sm"`
- Badges de facciones: `Badge variant="outline"` en vez de spans custom
- Tags de escena (location, time, tone): `Badge variant="secondary"` con colores semanticos via className
- Confirmacion de borrado: `AlertDialog` de shadcn (ya tiene keyboard trap y aria)

---

### Create/Edit page (formularios)

**Layout:**
- Breadcrumbs en la parte superior
- Un solo Card centrado `max-w-2xl`
- Barra decorativa violeta en top (se mantiene)
- Tabs shadcn para Manual/IA

**Estructura:**
```
[Breadcrumb]
  Mundos > Crear mundo

[Card max-w-2xl centrado]
  [barra decorativa violeta 2px top]
  [CardHeader]
    [h1 "Crear nuevo mundo"]
    [p subtitulo descriptivo]
  [CardContent]
    [Tabs defaultValue="manual"]
      [TabsList]
        [TabsTrigger "Manual"]
        [TabsTrigger "Generar con IA"]
      [TabsContent "manual"]
        [formulario con Label + Input/Textarea de shadcn]
        [PillSelect SE MANTIENE con framer-motion]
        [Separator con label -- reemplaza SectionDivider custom]
        [campos dinamicos de facciones]
        [Button primary lg full-width "Crear mundo"]
      [TabsContent "ai"]
        [Alert warning si no hay instalacion -- reemplaza NoInstallationBanner]
        [Label + Textarea]
        [Button primary lg full-width "Generar con IA"]
        [Card de preview del mundo generado -- si existe]
          [Button primary "Guardar este mundo"]
```

**PillSelect (se mantiene tal cual):**
- Conservar la animacion framer-motion (whileHover, whileTap, AnimatePresence)
- Conservar las descripciones evocadoras
- Actualizar solo los colores para usar las CSS variables:
  - Seleccionado: `bg-primary text-primary-foreground`
  - No seleccionado: `bg-background text-muted-foreground border-input hover:border-primary`
  - Descripcion: `border-l-2 border-primary/40 bg-accent`
- NO migrar a shadcn -- es un componente diferenciador que no tiene equivalente

**Loading state en formularios:**
```
[Button disabled con Spinner integrado]
  [Spinner SVG animado 16px] "Creando mundo..."
```

---

### Settings page (Installation)

**Layout:**
- Breadcrumbs: Configuracion > Instalacion
- Card con pasos de configuracion

**Estructura:**
```
[Breadcrumb]
  Configuracion > Instalacion

[Card max-w-2xl]
  [CardHeader]
    [h1 "Instalacion local"]
    [p descripcion]
  [CardContent]
    [Alert variant dependiendo del estado]
      - Sin instalacion: variant="warning"
      - Con instalacion: variant="default" con check verde
    [Separator]
    [Pasos de configuracion en lista ordenada]
    [Token de vinculacion en Input readonly + boton copiar]
```

---

## 4. Sistema de feedback

### Exito

**Accion completada (crear, guardar, borrar):**
- Usar `toast.success()` de Sonner
- Posicion: `bottom-right`
- Duracion: 4 segundos
- Formato: titulo corto + descripcion opcional
- Ejemplo: `toast.success("Mundo creado", { description: "Aethermoor esta listo para tu historia." })`
- ELIMINAR SuccessModal -- es demasiado intrusivo para confirmaciones simples

**Registro exitoso (caso especial):**
- `toast.success()` + navegacion automatica a login despues de 1.5s
- NO usar modal bloqueante

### Errores

**Errores de validacion de formulario:**
- Inline debajo de cada campo: texto rojo `text-destructive text-sm`
- Usar la prop `error` del Input de shadcn (borde rojo + mensaje)
- NO usar modal ni toast para validacion

**Errores de API (red/server):**
- `toast.error()` de Sonner
- Posicion: `bottom-right`
- Duracion: 6 segundos (mas tiempo que exito)
- Con boton "Reintentar" si la accion es retriable
- ELIMINAR ErrorModal -- reemplazar por toast

**Errores de carga de pagina (fetch inicial):**
- Componente Alert inline dentro de la pagina
- `Alert variant="destructive"` con icono, mensaje y boton "Reintentar"
- Reemplaza el texto plano `"text-red-500"` actual

### Loading states

**Carga de pagina (listas, detalles):**
- Skeleton screens que reflejan la estructura de la pagina
- Componentes necesarios:
  - `SkeletonWorldCard`: replica la forma de WorldCard (header gradiente + lineas)
  - `SkeletonDetail`: replica la estructura de detalle (titulo + grid + secciones)
  - `SkeletonList`: grid de SkeletonWorldCards (6 items)

**Acciones en progreso (submit de formulario):**
- Button deshabilitado con spinner inline
- Formato: `[spinner SVG 16px animado] "Creando mundo..."`
- El spinner reemplaza el icono del boton si lo tiene
- NUNCA deshabilitar el boton sin indicador visual de que algo pasa

**Generacion IA (mas largo):**
- Skeleton del resultado esperado + texto "Generando con IA..."
- Barra de progreso indeterminada (motion.div con animacion horizontal)
- El usuario debe saber que algo pasa -- la generacion puede tardar 10-30s

### Empty states

**Patron unificado para todas las listas vacias:**
```
[contenedor centrado con padding generoso]
  [icono relevante en circulo accent 64px]
  [h3 titulo descriptivo]
  [p texto de guia - tono amigable]
  [Button primary con icono + para crear el primer item]
```

**Textos especificos:**
- Mundos: "Aun no tienes mundos" / "Crea tu primer mundo y empieza a construir tu historia."
- Personajes: "Este mundo aun no tiene personajes" / "Los personajes dan vida a tu mundo."
- Escenas: "Este mundo aun no tiene escenas" / "Las escenas son los momentos clave de tu historia."

---

## 5. Navegacion

### Breadcrumbs

**Componente:** `Breadcrumb` de shadcn

**Estructura por ruta:**

```
/worlds                                    -->  (sin breadcrumbs, es la raiz)
/worlds/create                             -->  Mundos > Crear mundo
/worlds/:id                                -->  Mundos > {nombre del mundo}
/worlds/:id/characters/create              -->  Mundos > {nombre} > Crear personaje
/worlds/:worldId/characters/:characterId   -->  Mundos > {nombre} > {nombre personaje}
/worlds/:id/scenes/create                  -->  Mundos > {nombre} > Crear escena
/worlds/:worldId/scenes/:sceneId           -->  Mundos > {nombre} > {titulo escena}
/settings/installation                     -->  Configuracion > Instalacion
```

**Diseno:**
- Posicion: primera linea del area de contenido, antes del titulo
- Separador: `/` o chevron `>`
- Items intermedios: links clickables `text-muted-foreground hover:text-foreground`
- Item actual: `text-foreground font-medium` (no clickable)
- Tamano: `text-sm`

**Implementacion sugerida:**
- Crear un hook `useBreadcrumbs()` que lea la ruta actual y resuelva los nombres
- Para rutas con `:id`, el nombre viene del fetch de la pagina (pasar via contexto o prop)

### Boton volver

**Regla:** mostrar boton volver SOLO en paginas de detalle y creacion, NO en listas.

**Donde aparece:**
- CreateWorldPage: volver a `/worlds`
- WorldDetailPage: volver a `/worlds`
- CreateCharacterPage: volver a `/worlds/:id`
- CharacterDetailPage: volver a `/worlds/:id`
- CreateScenePage: volver a `/worlds/:id`
- SceneDetailPage: volver a `/worlds/:id`
- InstallationPage: volver a `/worlds`

**Donde NO aparece:**
- HomePage (es la raiz de la app)
- LoginPage / RegisterPage (flujo lineal)

**Diseno:**
- `Button variant="ghost" size="sm"` con icono flecha izquierda
- Posicion: inline con los breadcrumbs, a la izquierda
- Formato: `[<-- icono] Volver`
- Usar `navigate(-1)` o ruta explicita segun el contexto

---

## 6. Resumen de migracion por componente actual

| Archivo actual              | Accion                                                    |
|-----------------------------|-----------------------------------------------------------|
| `ErrorModal.tsx`            | ELIMINAR -- reemplazar por `toast.error()` de Sonner      |
| `SuccessModal.tsx`          | ELIMINAR -- reemplazar por `toast.success()` de Sonner    |
| `ConfirmModal.tsx`          | REEMPLAZAR por `AlertDialog` de shadcn                    |
| `EmailInput.tsx`            | REEMPLAZAR por `Label` + `Input` de shadcn con error prop |
| `PasswordInput.tsx`         | REEMPLAZAR por `Label` + `Input` de shadcn con error prop |
| `NoInstallationBanner.tsx`  | REEMPLAZAR por `Alert variant="warning"` de shadcn        |
| `PillSelect.tsx`            | MANTENER -- actualizar colores a design tokens            |
| `WorldCard.tsx`             | MANTENER estructura -- envolver en `Card` de shadcn, usar `Badge` para tags |
| `MainLayout.tsx` sidebar    | MANTENER estructura -- mobile sidebar migrar a `Sheet`    |

### Componentes shadcn a instalar

```
npx shadcn@latest add button input textarea label card dialog alert-dialog
npx shadcn@latest add tabs badge separator breadcrumb skeleton tooltip
npx shadcn@latest add sheet scroll-area sonner
```

Total: 15 componentes.

### Orden de implementacion sugerido

1. **Tokens + globals** -- configurar CSS variables en index.css, instalar Inter font
2. **Button + Input + Label + Textarea** -- base de todos los formularios
3. **Card** -- unificar contenedores de todas las paginas
4. **Sonner (toast)** -- eliminar ErrorModal y SuccessModal
5. **AlertDialog** -- reemplazar ConfirmModal
6. **Alert + Badge** -- feedback inline y tags
7. **Tabs** -- unificar tabs de creacion
8. **Skeleton** -- loading states
9. **Breadcrumb** -- navegacion contextual
10. **Sheet** -- sidebar mobile
11. **Separator, Tooltip, ScrollArea** -- refinamientos finales

---

## 7. Accesibilidad -- correcciones prioritarias

### Modales (actualmente rotos)
- ErrorModal y SuccessModal NO tienen `role="dialog"`, NO tienen `aria-modal`, NO tienen keyboard trap
- Solucion: migrar a Dialog/AlertDialog de shadcn que los incluye nativamente

### Inputs
- Los inputs actuales no tienen `id` asociado a `<label htmlFor>`
- Solucion: usar Label de shadcn que vincula automaticamente

### Contraste
- `text-gray-300` como placeholder tiene ratio ~2.5:1 (falla WCAG AA)
- Solucion: usar `text-muted-foreground` que mapea a slate-500 (ratio 4.6:1)

### Focus
- El focus visible global (`outline: 2px solid #7c3aed`) esta bien -- mantener
- Agregar `:focus-visible` en vez de `:focus` en todos los interactivos (ya esta en index.css)

### Reduced motion
- Ya existe media query en index.css -- mantener
- Asegurar que framer-motion respeta `prefers-reduced-motion` (agregar `useReducedMotion()` hook)

### Touch targets
- Los botones de "Eliminar faccion" son muy pequenos (solo un X con padding minimo)
- Minimo: 44x44px para todos los targets tactiles
