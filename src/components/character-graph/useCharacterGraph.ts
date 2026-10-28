import { useState, useCallback } from 'react'
import type { CharacterNode, VoiceRegister, ChatMessage, DomainSynthesis, CharacterSoul, VoiceExample } from '@/services/api'
import {
  getCharacterGraph, getCharacterById, getCharacterChatHistory,
  createCharacterNode, updateCharacterNode, deleteCharacterNode, updateNodePosition,

  updateVoiceRegister as apiUpdateVoiceRegister,
  generateCharacterNodes, characterChat,
  addNodeFromCatalog as apiAddFromCatalog,
  addNodeFromContextual as apiAddFromContextual,
  synthesizeDomain as apiSynthesizeDomain,
  getSynthesis as apiGetSynthesis,
  getCharacterSoul,
  regenerateCharacterSoul,
  getVoiceExamples,
  saveVoiceExamples as apiSaveVoiceExamples,
  generateVoiceExamples as apiGenerateVoiceExamples,
} from '@/services/api'
import { notifyError } from '@/lib/notifyError'
import { describeError } from '@/services/telemetry'
import { useGenerationProgress } from '@/hooks/useGenerationProgress'

export type CharacterGraphMode = 'graph' | 'talk' | 'voice'

export function useCharacterGraph(characterId: number) {
  const [nodes, setNodes] = useState<CharacterNode[]>([])
  const [voiceRegister, setVoiceRegister] = useState<VoiceRegister>({
    emotional_rhythm: '', social_posture: '', cognitive_tempo: '', expressive_style: '',
  })
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [characterName, setCharacterName] = useState('')
  const [mode, setMode] = useState<CharacterGraphMode>('graph')
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [chatLoading, setChatLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [synthesis, setSynthesis] = useState<DomainSynthesis[]>([])
  const [synthesisLoading, setSynthesisLoading] = useState<string | null>(null)
  const [soul, setSoul] = useState<CharacterSoul | null>(null)
  const [soulLoading, setSoulLoading] = useState(false)
  const [voiceExamples, setVoiceExamples] = useState<VoiceExample[]>([])
  const [premise, setPremise] = useState('')
  const [speechPattern, setSpeechPattern] = useState('')
  const [generatingExamples, setGeneratingExamples] = useState(false)
  const { progress: generatingProgress, start: startProgress, stop: stopProgress } = useGenerationProgress()

  // El error solo se pintaba en la vista vacía: con el grafo abierto, fallar
  // al añadir un nodo o en el chat no decía nada. Ahora sale como aviso.
  const fail = useCallback((context: string) => (err: unknown) => {
    setError(`${context}: ${describeError(err, 'error desconocido')}`)
    notifyError(context)(err)
  }, [])

  const loadGraph = useCallback(async () => {
    setLoading(true)
    try {
      const [graph, char, history, synth, soulResult] = await Promise.all([
        getCharacterGraph(characterId),
        getCharacterById(characterId),
        getCharacterChatHistory(characterId).catch(() => [] as ChatMessage[]),
        apiGetSynthesis(characterId).catch(() => [] as DomainSynthesis[]),
        getCharacterSoul(characterId).catch(() => null),
      ])
      setNodes(graph.nodes ?? [])
      setSynthesis(synth ?? [])
      setSoul(soulResult)
      setVoiceRegister(char.voice_register || { emotional_rhythm: '', social_posture: '', cognitive_tempo: '', expressive_style: '' })
      setCharacterName(char.name)
      setPremise(char.premise || '')
      setSpeechPattern(char.speech_pattern || '')
      setChatMessages(history ?? [])
      const examples = await getVoiceExamples(characterId)
      setVoiceExamples(examples ?? [])
    } catch (err) {
      fail('No se pudo cargar el personaje')(err)
    } finally {
      setLoading(false)
    }
  }, [characterId, fail])

  const addNode = useCallback(async (node: Omit<CharacterNode, 'id'>) => {
    try {
      const created = await createCharacterNode(characterId, node)
      setNodes(prev => [...prev, created])
      setSoul(prev => prev ? { ...prev, is_stale: true } : prev)
      return created
    } catch (err) {
      fail('No se pudo crear el nodo')(err)
      return null
    }
  }, [characterId, fail])

  const editNode = useCallback(async (id: number, updates: Partial<CharacterNode>) => {
    try {
      await updateCharacterNode(id, updates)
      setNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n))
    } catch (err) {
      fail('No se pudo guardar el nodo')(err)
    }
  }, [fail])

  const removeNode = useCallback(async (id: number) => {
    try {
      await deleteCharacterNode(id)
      setNodes(prev => prev.filter(n => n.id !== id))
      setSoul(prev => prev ? { ...prev, is_stale: true } : prev)
      if (selectedNodeId === id) setSelectedNodeId(null)
    } catch (err) {
      fail('No se pudo quitar el nodo')(err)
    }
  }, [selectedNodeId, fail])

  const moveNode = useCallback(async (id: number, x: number, y: number) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, canvas_x: x, canvas_y: y } : n))
    try {
      await updateNodePosition(id, x, y)
    } catch {
      // silent — position is non-critical
    }
  }, [])

  const updateVoice = useCallback(async (vr: VoiceRegister) => {
    setVoiceRegister(vr)
    try {
      await apiUpdateVoiceRegister(characterId, vr)
    } catch (err) {
      fail('No se pudo guardar la voz')(err)
    }
  }, [characterId, fail])

  const saveExamples = useCallback(async (examples: VoiceExample[]) => {
    setVoiceExamples(examples)
    try {
      await apiSaveVoiceExamples(characterId, examples)
    } catch (err) {
      fail('No se pudieron guardar las muestras de voz')(err)
    }
  }, [characterId, fail])

  const generateExamples = useCallback(async () => {
    setGeneratingExamples(true)
    try {
      const examples = await apiGenerateVoiceExamples(characterId)
      setVoiceExamples(examples ?? [])
    } catch (err) {
      fail('No se pudieron generar las muestras de voz')(err)
    } finally {
      setGeneratingExamples(false)
    }
  }, [characterId, fail])

  const clearChat = useCallback(() => {
    setChatMessages([])
  }, [])

  const sendMessage = useCallback(async (text: string) => {
    setChatLoading(true)
    setChatMessages(prev => [...prev, { id: 0, role: 'user' as const, content: text }])
    try {
      const result = await characterChat(characterId, text)
      setChatMessages(prev => [...prev, { id: 0, role: 'character' as const, content: result.reply }])
      return result
    } catch (err) {
      fail('El personaje no pudo responder')(err)
      return null
    } finally {
      setChatLoading(false)
    }
  }, [characterId, fail])

  const generateNodes = useCallback(async (premise: string) => {
    setGenerating(true)
    setError('')
    const requestId = startProgress()
    try {
      const result = await generateCharacterNodes(characterId, premise, undefined, requestId)
      setNodes(prev => [...prev, ...(result.nodes || [])])
      if (result.voice_register) setVoiceRegister(result.voice_register)
      setSoul(prev => prev ? { ...prev, is_stale: true } : prev)
      return result
    } catch (err) {
      fail('No se pudieron generar los nodos del personaje')(err)
      return null
    } finally {
      stopProgress()
      setGenerating(false)
    }
  }, [characterId, fail, startProgress, stopProgress])

  const loadSynthesis = useCallback(async () => {
    try {
      const synth = await apiGetSynthesis(characterId)
      setSynthesis(synth ?? [])
    } catch {
      // silent — synthesis is non-critical
    }
  }, [characterId])

  const addFromCatalog = useCallback(async (catalogNodeId: number) => {
    try {
      const created = await apiAddFromCatalog(characterId, catalogNodeId)
      setNodes(prev => [...prev, created])
      // Mark domain synthesis as stale locally
      setSynthesis(prev => prev.map(s => s.domain === created.domain ? { ...s, is_stale: true } : s))
      setSoul(prev => prev ? { ...prev, is_stale: true } : prev)
      return created
    } catch (err) {
      fail('No se pudo añadir el nodo del catálogo')(err)
      return null
    }
  }, [characterId, fail])

  const addFromContextual = useCallback(async (contextualNodeId: number) => {
    try {
      const created = await apiAddFromContextual(characterId, contextualNodeId)
      setNodes(prev => [...prev, created])
      setSynthesis(prev => prev.map(s => s.domain === created.domain ? { ...s, is_stale: true } : s))
      setSoul(prev => prev ? { ...prev, is_stale: true } : prev)
      return created
    } catch (err) {
      fail('No se pudo añadir el nodo del catálogo del mundo')(err)
      return null
    }
  }, [characterId, fail])

  const regenerateSynthesis = useCallback(async (domain: string) => {
    setSynthesisLoading(domain)
    try {
      const result = await apiSynthesizeDomain(characterId, domain)
      setSynthesis(prev => {
        const exists = prev.find(s => s.domain === result.domain)
        if (exists) return prev.map(s => s.domain === result.domain ? result : s)
        return [...prev, result]
      })
      setSoul(prev => prev ? { ...prev, is_stale: true } : prev)
      return result
    } catch (err) {
      fail('No se pudo regenerar la síntesis')(err)
      return null
    } finally {
      setSynthesisLoading(null)
    }
  }, [characterId, fail])

  const regenerateSoul = useCallback(async () => {
    setSoulLoading(true)
    try {
      const result = await regenerateCharacterSoul(characterId)
      setSoul(result)
    } catch (err) {
      fail('No se pudo generar el alma del personaje')(err)
    } finally {
      setSoulLoading(false)
    }
  }, [characterId, fail])

  const toggleMode = useCallback((target?: 'graph' | 'talk' | 'voice') => {
    setMode(prev => target ?? (prev === 'graph' ? 'talk' : 'graph'))
  }, [])

  return {
    // State
    nodes, voiceRegister, chatMessages, characterName,
    mode, selectedNodeId, loading, chatLoading, generating, generatingProgress, error,
    synthesis, synthesisLoading,
    soul, soulLoading,
    voiceExamples, premise, speechPattern, generatingExamples,
    // Actions
    loadGraph, addNode, editNode, removeNode, moveNode,
    updateVoice, saveExamples, generateExamples, sendMessage, generateNodes,
    clearChat, toggleMode, setSelectedNodeId, setMode,
    loadSynthesis, addFromCatalog, addFromContextual, regenerateSynthesis,
    regenerateSoul,
  }
}
