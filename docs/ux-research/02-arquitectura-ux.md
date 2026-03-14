# Arquitectura UX - StoryTeller Frontend MVP

## 1. Mapa de Rutas Actual

```
/                              LoginPage (publica)
/register                      RegisterPage (publica)

[ProtectedRoute + MainLayout]
  /worlds                      HomePage (listado de mundos)
  /worlds/create               CreateWorldPage (manual / IA)
  /worlds/:id                  WorldDetailPage (personajes + escenas)
  /worlds/:id/characters/create      CreateCharacterPage
  /worlds/:worldId/characters/:characterId   CharacterDetailPage
  /worlds/:id/scenes/create          CreateScenePage
  /worlds/:worldId/scenes/:sceneId   SceneDetailPage (eventos + narrativa)
  /settings/installation       InstallationPage
```

## 2. Modelo de Datos

```
Usuario
  +-- Mundo (World)
  |     +-- Personaje (Character)
  |     +-- Escena (Scene)
  |           +-- Personajes en escena
  |           +-- Evento (Event)
  |           +-- Narrativa (generada)
  +-- Instalacion (0 o 1, requerida para IA)
```

---

## 3. Problemas de Arquitectura

### A. Informacion

| # | Problema | Severidad |
|---|----------|-----------|
| A1 | Parametros de ruta inconsistentes (`:id` vs `:worldId`) | ALTA |
| A2 | URLs reflejan jerarquia pero la navegacion no | MEDIA |
| A3 | Sin rutas de edicion | BAJA (MVP) |

### B. Navegacion

| # | Problema | Severidad |
|---|----------|-----------|
| B1 | Sin breadcrumbs | ALTA |
| B2 | Botones de volver inconsistentes (solo 1 de 6 paginas) | ALTA |
| B3 | Redireccion post-creacion suboptima (mundo va a lista, no a detalle) | MEDIA |
| B4 | NotFoundPage redirige a login | BAJA |

### C. Formularios

| # | Problema | Severidad |
|---|----------|-----------|
| C1 | Patron manual/IA consistente y bien ejecutado | POSITIVO |
| C2 | Componentes de formulario duplicados en 3 archivos | MEDIA |
| C3 | Validacion inconsistente (unos validan, otros no) | MEDIA |
| C4 | Resultado IA no editable antes de guardar | MEDIA |

### D. Gestion de Estado

| # | Problema | Severidad |
|---|----------|-----------|
| D1 | Loading states presentes en todas las paginas | POSITIVO |
| D2 | Presentacion de errores inconsistente | MEDIA |
| D3 | Empty states bien resueltos para caso principal | POSITIVO |
| D4 | React Query instalado pero no usado (fetching manual) | BAJA |

### E. Flujo IA

| # | Problema | Severidad |
|---|----------|-----------|
| E1 | Banner NoInstallation bien integrado | POSITIVO |
| E2 | Instrucciones de instalacion demasiado tecnicas | ALTA |
| E3 | useInstallation sin cache (llamada en cada pagina) | BAJA |
| E4 | Sin feedback de progreso durante generacion | MEDIA |
| E5 | No se puede editar/regenerar resultado IA | MEDIA |

### F. Modelo Mental del Escritor

| # | Problema | Severidad |
|---|----------|-----------|
| F1 | Jerarquia Mundo > Personajes + Escenas > Eventos intuitiva | POSITIVO |
| F2 | Descripciones en PillSelect evocadoras e inspiradoras | POSITIVO |
| F3 | Sin vision general del estado del mundo | MEDIA |
| F4 | Sin navegacion lateral entre escenas | MEDIA |
| F5 | Personaje no muestra sus escenas | BAJA |

---

## 4. Recomendaciones Priorizadas

### Prioridad 1 — Critico
1. Implementar breadcrumbs (Mundos > Nombre mundo > Nombre escena)
2. Botones de retroceso consistentes en todas las paginas
3. Reescribir instrucciones de instalacion para no-tecnicos

### Prioridad 2 — Mejora significativa
4. Extraer componentes de formulario compartidos
5. Crear ErrorState y InlineError reutilizables
6. Spinner + texto durante generacion IA
7. Permitir editar resultado IA antes de guardar
8. Unificar parametros de ruta (siempre `:worldId`)

### Prioridad 3 — Refinamiento
9. Redirigir a detalle del mundo recien creado
10. Dashboard del mundo (metricas simples)
11. Navegacion anterior/siguiente en escenas
12. Mostrar escenas del personaje en CharacterDetailPage
13. Homogeneizar empty states con ilustracion + CTA
14. NotFoundPage redirige a /worlds si autenticado
