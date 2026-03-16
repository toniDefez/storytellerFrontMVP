import { useReducer, useCallback } from 'react'
import { deriveWorldLayer, type WorldLayerType, type DeriveLayerResult } from '../services/api'
import type { PhysicalSelections } from '../constants/physicalParameters'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LayerStatus = 'idle' | 'generating' | 'ready' | 'accepted' | 'rejected' | 'editing' | 'stale'

export interface LayerState {
  status: LayerStatus
  content: string | null
  editedContent: string | null
  tensions?: string       // society layer only
  name?: string           // synthesis metadata
  factions?: string[]
  description?: string
}

export const GENERATION_LAYERS: WorldLayerType[] = ['physical', 'biological', 'society', 'synthesis']

export const LAYER_DISPLAY: Record<WorldLayerType, { icon: string; label: string; labelEn: string; color: string }> = {
  physical:   { icon: '\u{1F30B}', label: 'Capa fisica',    labelEn: 'Physical Layer',   color: 'text-emerald-600' },
  biological: { icon: '\u{1F33F}', label: 'Capa biologica', labelEn: 'Biological Layer', color: 'text-amber-600' },
  society:    { icon: '\u{1F3DB}', label: 'Capa social',    labelEn: 'Society Layer',    color: 'text-blue-600' },
  synthesis:  { icon: '\u{1F3AD}', label: 'Sintesis',       labelEn: 'Synthesis',        color: 'text-violet-600' },
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface DerivationState {
  coreAxis: string
  physicalSelections: PhysicalSelections
  currentStep: number  // 0-3 index into GENERATION_LAYERS
  layers: Record<WorldLayerType, LayerState>
  error: string | null
  phase: 'input' | 'generating' | 'reviewing' | 'saving'
}

function makeEmptyLayer(): LayerState {
  return { status: 'idle', content: null, editedContent: null }
}

function makeInitialLayers(): Record<WorldLayerType, LayerState> {
  return {
    physical: makeEmptyLayer(),
    biological: makeEmptyLayer(),
    society: makeEmptyLayer(),
    synthesis: makeEmptyLayer(),
  }
}

const initialState: DerivationState = {
  coreAxis: '',
  physicalSelections: {},
  currentStep: 0,
  layers: makeInitialLayers(),
  error: null,
  phase: 'input',
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

type Action =
  | { type: 'SET_CORE_AXIS'; coreAxis: string }
  | { type: 'SET_PHYSICAL_SELECTIONS'; selections: PhysicalSelections }
  | { type: 'START_LAYER'; layer: WorldLayerType }
  | { type: 'LAYER_COMPLETE'; layer: WorldLayerType; result: DeriveLayerResult }
  | { type: 'LAYER_ERROR'; layer: WorldLayerType; error: string }
  | { type: 'ACCEPT_LAYER'; layer: WorldLayerType }
  | { type: 'REJECT_LAYER'; layer: WorldLayerType }
  | { type: 'EDIT_LAYER'; layer: WorldLayerType; content: string }
  | { type: 'MARK_DOWNSTREAM_STALE'; fromLayer: WorldLayerType }
  | { type: 'SET_PHASE'; phase: DerivationState['phase'] }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'RESET' }

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function reducer(state: DerivationState, action: Action): DerivationState {
  switch (action.type) {
    case 'SET_CORE_AXIS':
      return { ...state, coreAxis: action.coreAxis }

    case 'SET_PHYSICAL_SELECTIONS':
      return { ...state, physicalSelections: action.selections }

    case 'START_LAYER':
      return {
        ...state,
        phase: 'generating',
        error: null,
        layers: {
          ...state.layers,
          [action.layer]: { ...state.layers[action.layer], status: 'generating' },
        },
      }

    case 'LAYER_COMPLETE': {
      const layerIndex = GENERATION_LAYERS.indexOf(action.layer)
      const nextStep = layerIndex + 1
      return {
        ...state,
        phase: 'reviewing',
        currentStep: nextStep,
        layers: {
          ...state.layers,
          [action.layer]: {
            ...state.layers[action.layer],
            status: 'ready',
            content: action.result.content,
            editedContent: null,
            tensions: action.result.tensions,
            name: action.result.name,
            factions: action.result.factions,
            description: action.result.description,
          },
        },
      }
    }

    case 'LAYER_ERROR': {
      const hasAnyContent = GENERATION_LAYERS.some(l => state.layers[l].content !== null)
      return {
        ...state,
        phase: hasAnyContent ? 'reviewing' : 'input',
        error: action.error,
        layers: {
          ...state.layers,
          [action.layer]: { ...state.layers[action.layer], status: 'idle' },
        },
      }
    }

    case 'ACCEPT_LAYER':
      return {
        ...state,
        layers: {
          ...state.layers,
          [action.layer]: { ...state.layers[action.layer], status: 'accepted' },
        },
      }

    case 'REJECT_LAYER':
      return {
        ...state,
        layers: {
          ...state.layers,
          [action.layer]: { ...state.layers[action.layer], status: 'rejected' },
        },
      }

    case 'EDIT_LAYER':
      return {
        ...state,
        layers: {
          ...state.layers,
          [action.layer]: {
            ...state.layers[action.layer],
            status: 'accepted',
            editedContent: action.content,
          },
        },
      }

    case 'MARK_DOWNSTREAM_STALE': {
      const fromIndex = GENERATION_LAYERS.indexOf(action.fromLayer)
      const updatedLayers = { ...state.layers }
      for (let i = fromIndex + 1; i < GENERATION_LAYERS.length; i++) {
        const key = GENERATION_LAYERS[i]
        if (updatedLayers[key].content !== null) {
          updatedLayers[key] = { ...updatedLayers[key], status: 'stale' }
        }
      }
      return { ...state, layers: updatedLayers }
    }

    case 'SET_PHASE':
      return { ...state, phase: action.phase }

    case 'SET_ERROR':
      return { ...state, error: action.error }

    case 'RESET':
      return {
        ...state,
        currentStep: 0,
        layers: makeInitialLayers(),
        error: null,
        phase: 'input',
      }

    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useLayeredDerivation() {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Helper: get accepted content for a layer (edited takes priority over original)
  const getAcceptedContent = useCallback(
    (layer: WorldLayerType): string | null => {
      const ls = state.layers[layer]
      if (ls.status !== 'accepted' && ls.status !== 'stale') return null
      return ls.editedContent ?? ls.content
    },
    [state.layers],
  )

  // Helper: build previousLayers map from all layers with content
  const buildPreviousLayers = useCallback((): Partial<Record<WorldLayerType, string>> => {
    const result: Partial<Record<WorldLayerType, string>> = {}
    for (const layer of GENERATION_LAYERS) {
      const accepted = getAcceptedContent(layer)
      if (accepted) {
        result[layer] = accepted
      } else if (state.layers[layer].content) {
        result[layer] = state.layers[layer].content!
      }
    }
    return result
  }, [state.layers, getAcceptedContent])

  // Generate a specific layer
  const generateLayer = useCallback(
    async (layer: WorldLayerType) => {
      dispatch({ type: 'START_LAYER', layer })
      try {
        const result = await deriveWorldLayer(
          state.coreAxis,
          layer,
          buildPreviousLayers(),
          state.physicalSelections,
        )
        dispatch({ type: 'LAYER_COMPLETE', layer, result })
      } catch (err) {
        dispatch({
          type: 'LAYER_ERROR',
          layer,
          error: err instanceof Error ? err.message : 'Error',
        })
      }
    },
    [state.coreAxis, state.physicalSelections, buildPreviousLayers],
  )

  // Generate the next pending layer
  const generateNextLayer = useCallback(async () => {
    if (state.currentStep >= GENERATION_LAYERS.length) return
    await generateLayer(GENERATION_LAYERS[state.currentStep])
  }, [state.currentStep, generateLayer])

  // Start derivation (resets and generates first layer)
  const startDerivation = useCallback(async () => {
    dispatch({ type: 'RESET' })
    dispatch({ type: 'START_LAYER', layer: 'physical' })
    try {
      const result = await deriveWorldLayer(state.coreAxis, 'physical', {}, state.physicalSelections)
      dispatch({ type: 'LAYER_COMPLETE', layer: 'physical', result })
    } catch (err) {
      dispatch({
        type: 'LAYER_ERROR',
        layer: 'physical',
        error: err instanceof Error ? err.message : 'Error',
      })
    }
  }, [state.coreAxis, state.physicalSelections])

  // Accept / reject / edit / regenerate actions
  const acceptLayer = useCallback(
    (layer: WorldLayerType) => dispatch({ type: 'ACCEPT_LAYER', layer }),
    [],
  )

  const rejectLayer = useCallback(
    (layer: WorldLayerType) => dispatch({ type: 'REJECT_LAYER', layer }),
    [],
  )

  const editLayer = useCallback(
    (layer: WorldLayerType, content: string) => {
      dispatch({ type: 'EDIT_LAYER', layer, content })
      dispatch({ type: 'MARK_DOWNSTREAM_STALE', fromLayer: layer })
    },
    [],
  )

  const regenerateLayer = useCallback(
    (layer: WorldLayerType) => generateLayer(layer),
    [generateLayer],
  )

  const setCoreAxis = useCallback(
    (coreAxis: string) => dispatch({ type: 'SET_CORE_AXIS', coreAxis }),
    [],
  )

  const setPhysicalSelections = useCallback(
    (selections: PhysicalSelections) => dispatch({ type: 'SET_PHYSICAL_SELECTIONS', selections }),
    [],
  )

  // Computed properties
  const allLayersDecided = GENERATION_LAYERS.every(
    l => ['accepted', 'rejected'].includes(state.layers[l].status),
  )
  const hasAcceptedLayers = GENERATION_LAYERS.some(l => state.layers[l].status === 'accepted')
  const hasStale = GENERATION_LAYERS.some(l => state.layers[l].status === 'stale')
  const isGenerating = GENERATION_LAYERS.some(l => state.layers[l].status === 'generating')
  const canGenerateNext =
    state.currentStep < GENERATION_LAYERS.length &&
    !isGenerating &&
    (state.currentStep === 0 || state.layers[GENERATION_LAYERS[state.currentStep - 1]].status === 'accepted')

  return {
    state,
    setCoreAxis,
    setPhysicalSelections,
    startDerivation,
    generateNextLayer,
    acceptLayer,
    rejectLayer,
    editLayer,
    regenerateLayer,
    getAcceptedContent,
    allLayersDecided,
    hasAcceptedLayers,
    hasStale,
    isGenerating,
    canGenerateNext,
  }
}
