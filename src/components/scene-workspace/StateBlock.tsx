import { useState } from 'react';
import type { CharacterState, StateLine, StateList } from '../../services/api';

// El estado vivo (2026-10-29). Medido con una historia de 20 escenas y dos
// jueces a ciegas: con cómo está y qué sabe cada personaje al entrar, más el
// final de la escena anterior, la app pasa de 16 errores de continuidad a 4
// (el chat que lo ve todo hace 6). El modelo propone y las reglas ordenan,
// pero sus errores se heredan para siempre: aquí el autor tacha, corrige y
// añade, y lo que toca vale para todas las escenas que vienen después.

export interface StateActions {
  /** La escena del taller: solo sus propias líneas se borran; las de antes se tachan desde aquí. */
  sceneId: number;
  add: (characterId: number, list: StateList, text: string) => Promise<void>;
  remove: (characterId: number, list: StateList, text: string) => Promise<void>;
  /** Borra una corrección del autor (una línea suya, no una propuesta). */
  undo: (changeId: number) => Promise<void>;
}

export function StateBlock({ state, inCast, actions }: { state: CharacterState; inCast: boolean; actions?: StateActions }) {
  return (
    <div style={box}>
      {state.dead && (
        <div style={{ fontSize: 12, fontWeight: 600, color: '#b91c1c' }}>
          Ha muerto{inCast ? ' · y está en el reparto de esta escena' : ''}
        </div>
      )}
      <StateList title="Así está" list="estado" lines={state.estado} characterId={state.character_id} actions={actions} />
      <StateList title="Sabe" list="sabe" lines={state.sabe} characterId={state.character_id} actions={actions} />
    </div>
  );
}

function StateList({ title, list, lines, characterId, actions }: {
  title: string; list: StateList; lines: StateLine[]; characterId: number; actions?: StateActions;
}) {
  const [draft, setDraft] = useState('');
  const submit = async () => {
    const text = draft.trim();
    if (!text || !actions) return;
    await actions.add(characterId, list, text);
    setDraft('');
  };
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#9a3412', textTransform: 'uppercase', letterSpacing: 0.4 }}>{title}</div>
      {lines.length === 0 && <div style={{ fontSize: 12, color: '#5f5868' }}>nada todavía</div>}
      {lines.map((l) => (
        <div key={`${l.scene_id}-${l.text}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 4, fontSize: 13 }} className="nodrag">
          {l.origin === 'propuesta' && <span title="propuesto por el modelo" style={{ color: '#ea580c', lineHeight: '18px' }}>•</span>}
          <span style={{ flex: 1, fontStyle: l.origin === 'propuesta' ? 'italic' : 'normal' }}>{l.text}</span>
          {actions && (
            <button
              type="button"
              aria-label={`Quitar «${l.text}»`}
              title={l.origin === 'autor' && l.scene_id === actions.sceneId ? 'Quitar lo que añadiste' : 'Tachar: deja de ser verdad desde esta escena'}
              onClick={() => { void (l.origin === 'autor' && l.id && l.scene_id === actions.sceneId ? actions.undo(l.id) : actions.remove(characterId, list, l.text)); }}
              style={xButton}
            >×</button>
          )}
        </div>
      ))}
      {actions && (
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void submit(); } }}
          placeholder="Añadir…"
          aria-label={`Añadir a ${title.toLowerCase()}`}
          className="nodrag"
          style={input}
        />
      )}
    </div>
  );
}

const box = {
  marginTop: 8, padding: '6px 8px', borderRadius: 8, background: '#fffbeb',
  border: '1px solid #fde68a', fontSize: 13, lineHeight: 1.4,
} as const;

const xButton = {
  border: 'none', background: 'transparent', color: '#9a3412', cursor: 'pointer',
  fontSize: 14, lineHeight: '18px', padding: '0 2px',
} as const;

const input = {
  width: '100%', marginTop: 2, fontSize: 12, padding: '2px 4px', borderRadius: 4,
  border: '1px solid #fde68a', background: '#fff',
} as const;
