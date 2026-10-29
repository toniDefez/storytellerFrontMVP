/**
 * Ids de React Flow para el terreno del mapa.
 *
 * El mapa mezcla lugares (ids numéricos, de `LocationNode.id`), regiones
 * (`region-<id>`) y sus topónimos (`region-label-<id>`). El terreno es de
 * solo lectura: aquí ya no hay tiradores de vértice.
 */

export function regionNodeId(regionId: number): string {
  return `region-${regionId}`
}

export function regionLabelNodeId(regionId: number): string {
  return `region-label-${regionId}`
}
