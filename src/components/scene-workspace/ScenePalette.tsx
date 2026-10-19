interface PaletteOption {
  id: number;
  name: string;
}

interface ScenePaletteProps {
  onAddMoment: () => void;
  onAddNarrator: () => void;
  onAddCharacter: (characterId: number) => void;
  onAddLocation: (locationNodeId: number) => void;
  castOptions: PaletteOption[];
  locationOptions: PaletteOption[];
  onGenerate: () => void;
  generating: boolean;
}

// Un <select> que actúa como botón: elegir una opción la añade y vuelve al
// placeholder, así se puede añadir otro personaje sin pasos extra.
function AddPicker({ label, options, onPick }: { label: string; options: PaletteOption[]; onPick: (id: number) => void }) {
  return (
    <select
      value=""
      disabled={options.length === 0}
      onChange={(e) => { if (e.target.value) onPick(Number(e.target.value)); }}
      title={options.length === 0 ? `No hay opciones para ${label.toLowerCase()}` : undefined}
    >
      <option value="">{`+ ${label}…`}</option>
      {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
    </select>
  );
}

export function ScenePalette({
  onAddMoment, onAddNarrator, onAddCharacter, onAddLocation,
  castOptions, locationOptions, onGenerate, generating,
}: ScenePaletteProps) {
  return (
    <div style={{
      position: 'absolute', top: 12, left: 12, zIndex: 10,
      display: 'flex', flexDirection: 'column', gap: 6,
      background: '#fff', padding: 8, border: '1px solid #d1d5db', borderRadius: 8,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <button onClick={onAddMoment}>+ Momento</button>
      <button onClick={onAddNarrator}>+ Narrador</button>
      <AddPicker label="Personaje" options={castOptions} onPick={onAddCharacter} />
      <AddPicker label="Lugar" options={locationOptions} onPick={onAddLocation} />
      <button onClick={onGenerate} disabled={generating} style={{ background: '#7c3aed', color: '#fff' }}>
        {generating ? 'Generando…' : '✨ Generar prosa'}
      </button>
    </div>
  );
}
