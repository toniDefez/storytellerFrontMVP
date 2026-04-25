interface ScenePaletteProps {
  onAddMoment: () => void;
  onAddNarrator: () => void;
  onGenerate: () => void;
  generating: boolean;
}

export function ScenePalette({ onAddMoment, onAddNarrator, onGenerate, generating }: ScenePaletteProps) {
  return (
    <div style={{
      position: 'absolute', top: 12, left: 12, zIndex: 10,
      display: 'flex', flexDirection: 'column', gap: 6,
      background: '#fff', padding: 8, border: '1px solid #d1d5db', borderRadius: 8,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <button onClick={onAddMoment}>+ Momento</button>
      <button onClick={onAddNarrator}>+ Narrador</button>
      <button onClick={onGenerate} disabled={generating} style={{ background: '#7c3aed', color: '#fff' }}>
        {generating ? 'Generando…' : '✨ Generar prosa'}
      </button>
    </div>
  );
}
