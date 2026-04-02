import { useState, useCallback } from 'react'
import type { CharacterNode, CharacterEdge, VoiceRegister, ChatMessage } from '@/services/api'
import {
  getCharacterGraph, getCharacterById, getCharacterChatHistory,
  createCharacterNode, updateCharacterNode, deleteCharacterNode, updateNodePosition,
  createCharacterEdge, deleteCharacterEdge,
  updateVoiceRegister as apiUpdateVoiceRegister,
  generateCharacterNodes, characterChat,
} from '@/services/api'

export type CharacterGraphMode = 'graph' | 'talk'

export function useCharacterGraph(characterId: number) {
  const [nodes, setNodes] = useState<CharacterNode[]>([])
  const [edges, setEdges] = useState<CharacterEdge[]>([])
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

  const loadGraph = useCallback(async () => {
    setLoading(true)
    try {
      const [graph, char, history] = await Promise.all([
        getCharacterGraph(characterId),
        getCharacterById(characterId),
        getCharacterChatHistory(characterId),
      ])
      setNodes(graph.nodes || [])
      setEdges(graph.edges || [])
      setVoiceRegister(char.voice_register || { emotional_rhythm: '', social_posture: '', cognitive_tempo: '', expressive_style: '' })
      setCharacterName(char.name)
      setChatMessages(history || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading graph')
    } finally {
      setLoading(false)
    }
  }, [characterId])

  const addNode = useCallback(async (node: Omit<CharacterNode, 'id'>) => {
    try {
      const created = await createCharacterNode(characterId, node)
      setNodes(prev => [...prev, created])
      return created
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating node')
      return null
    }
  }, [characterId])

  const editNode = useCallback(async (id: number, updates: Partial<CharacterNode>) => {
    try {
      await updateCharacterNode(id, updates)
      setNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating node')
    }
  }, [])

  const removeNode = useCallback(async (id: number) => {
    try {
      await deleteCharacterNode(id)
      setNodes(prev => prev.filter(n => n.id !== id))
      setEdges(prev => prev.filter(e => e.source_node_id !== id && e.target_node_id !== id))
      if (selectedNodeId === id) setSelectedNodeId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting node')
    }
  }, [selectedNodeId])

  const moveNode = useCallback(async (id: number, x: number, y: number) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, canvas_x: x, canvas_y: y } : n))
    try {
      await updateNodePosition(id, x, y)
    } catch {
      // silent — position is non-critical
    }
  }, [])

  const addEdge = useCallback(async (edge: Omit<CharacterEdge, 'id'>) => {
    try {
      const created = await createCharacterEdge(characterId, edge)
      setEdges(prev => [...prev, created])
      return created
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating edge')
      return null
    }
  }, [characterId])

  const removeEdge = useCallback(async (id: number) => {
    try {
      await deleteCharacterEdge(id)
      setEdges(prev => prev.filter(e => e.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting edge')
    }
  }, [])

  const updateVoice = useCallback(async (vr: VoiceRegister) => {
    setVoiceRegister(vr)
    try {
      await apiUpdateVoiceRegister(characterId, vr)
    } catch {
      // silent — will be saved on next update
    }
  }, [characterId])

  const sendMessage = useCallback(async (text: string) => {
    setChatLoading(true)
    setChatMessages(prev => [...prev, { id: 0, role: 'user' as const, content: text }])
    try {
      const result = await characterChat(characterId, text)
      setChatMessages(prev => [...prev, { id: 0, role: 'character' as const, content: result.reply }])
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error in chat')
      return null
    } finally {
      setChatLoading(false)
    }
  }, [characterId])

  const generateNodes = useCallback(async (premise: string) => {
    setGenerating(true)
    try {
      const result = await generateCharacterNodes(characterId, premise)
      setNodes(prev => [...prev, ...(result.nodes || [])])
      if (result.voice_register) setVoiceRegister(result.voice_register)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generating nodes')
      return null
    } finally {
      setGenerating(false)
    }
  }, [characterId])

  const toggleMode = useCallback(() => {
    setMode(prev => prev === 'graph' ? 'talk' : 'graph')
  }, [])

  return {
    // State
    nodes, edges, voiceRegister, chatMessages, characterName,
    mode, selectedNodeId, loading, chatLoading, generating, error,
    // Actions
    loadGraph, addNode, editNode, removeNode, moveNode,
    addEdge, removeEdge, updateVoice, sendMessage, generateNodes,
    toggleMode, setSelectedNodeId, setMode,
  }
}
