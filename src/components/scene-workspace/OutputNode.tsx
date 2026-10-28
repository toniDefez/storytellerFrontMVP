import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import type { ReactNode } from 'react';
import { SceneProseView } from './SceneProseView';
import { SCENE_FORMATS, formatInfo, type SceneFormat } from '@/lib/sceneFormats';

// La escena como nodo de salida del grafo, como en ComfyUI: los eventos y lo
// que se les conecta desembocan aquí, y aquí se ve el resultado. No se guarda
// en el backend: es la vista de la prosa de la escena dentro del lienzo.
export interface OutputNodeData extends Record<string, unknown> {
  prose: string;
  /** Escribiéndose ahora: la prosa es el borrador en directo. */
  live: boolean;
  /** Fase en curso mientras genera ("comprobando los momentos · 31 s"). */
  progress: string;
  generating: boolean;
  /** Lo declarado que el juez no ve en esta prosa. */
  unmet: string[];
  versions: ReactNode;
  onExpand: () => void;
  onPaste: () => void;
  /** El formato de salida: la misma escena como novela, guion de audio, etc. */
  format: SceneFormat;
  onFormatChange: (format: SceneFormat) => void;
  onCopy: () => void;
}

const words = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);

export function OutputNode({ data }: NodeProps<Node<OutputNodeData>>) {
  return (
    <div style={{
      width: 520, height: 640, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      background: '#fff', border: '2px solid #5b21b6', borderRadius: 14,
      boxShadow: '0 8px 24px rgba(91,33,182,0.10)',
    }}>
      <Handle type="target" position={Position.Left} id="out-in" style={{ background: '#0e7490', width: 12, height: 12 }} isConnectable={false} />
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #e9e2f7', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#5b21b6' }}>
            Escena · {formatInfo(data.format).label}
            {formatInfo(data.format).experimental && <span style={{ marginLeft: 8, padding: '1px 6px', borderRadius: 999, background: '#fef3c7', color: '#92400e', textTransform: 'none', letterSpacing: 0 }}>experimental</span>}
          </span>
          <span style={{ fontSize: 13, color: '#5f5868' }}>{words(data.prose)} palabras</span>
        </div>
        <label className="nodrag" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#3a3242' }}>
          Formato
          <select value={data.format} disabled={data.generating} onChange={(e) => data.onFormatChange(e.target.value as SceneFormat)}
            style={{ height: 32, padding: '0 8px', border: '1px solid #ddd5cb', borderRadius: 8, fontSize: 14, background: '#fff' }}>
            {SCENE_FORMATS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
        </label>
        <span style={{ fontSize: 13, color: '#5f5868' }}>{formatInfo(data.format).purpose}</span>
      </div>
      {data.generating && (
        <div role="status" aria-live="polite" style={{ padding: '8px 16px', background: '#f4f0fb', borderBottom: '1px solid #e9e2f7', fontSize: 13, color: '#4c1d95' }}>
          {data.live ? 'Escribiendo en directo' : 'Preparando'} · {data.progress || 'esperando al generador'}. Al terminar se guarda la versión revisada.
        </div>
      )}
      {!data.generating && data.unmet.length > 0 && (
        <div style={{ padding: '8px 16px', background: '#fef2f2', borderBottom: '1px solid #fecaca', fontSize: 13, color: '#b91c1c' }}>
          El juez no ve: {data.unmet.join(' · ')}
        </div>
      )}
      {/* nowheel/nodrag: dentro del nodo se lee y se desplaza el texto, no el lienzo. */}
      <div className="nowheel nodrag" style={{ flex: 1, minHeight: 0, cursor: 'text' }}>
        {data.prose
          ? <SceneProseView content={data.prose} />
          : <div style={{ padding: 24, color: '#6b6371', fontSize: 15, lineHeight: 1.5 }}>
              {data.generating ? 'En un par de segundos empieza a aparecer el texto.' : 'Conecta los eventos y pulsa «Escribir escena».'}
            </div>}
      </div>
      <div className="nodrag" style={{ padding: '10px 16px', borderTop: '1px solid #e9e2f7', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {data.versions}
        <button onClick={data.onCopy} disabled={!data.prose || data.generating} style={secondary}>{formatInfo(data.format).copyLabel}</button>
        {data.format === 'prose' && <button onClick={data.onPaste} disabled={data.generating} style={secondary}>Pegar prosa</button>}
        <button onClick={data.onExpand} style={secondary}>Ampliar</button>
      </div>
    </div>
  );
}

const secondary = {
  height: 40, padding: '0 14px', border: '1px solid #ddd5cb', borderRadius: 10,
  background: '#fff', color: '#1e1a24', fontSize: 14, cursor: 'pointer',
} as const;
