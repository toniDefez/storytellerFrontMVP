import { useState } from 'react';
import i18n from '@/i18n';
import { notifyPlaceError } from '../world-graph/placeErrors';

interface PaletteOption {
  id: number;
  name: string;
}

interface ScenePaletteProps {
  onAddMoment: () => void;
  onAddNarrator: () => void;
  onAddDirection: () => void;
  onAddCharacter: (characterId: number) => void;
  onAddLocation: (locationNodeId: number) => void;
  /** Crea un lugar en el mundo y devuelve su id; sin él no se ofrece «Nuevo lugar…». */
  onCreateLocation?: (name: string) => Promise<number>;
  castOptions: PaletteOption[];
  locationOptions: PaletteOption[];
  onGenerate: () => void;
  generating: boolean;
  /** Qué se escribe: «Escribir escena» o «Escribir · Guion de audio». */
  generateLabel?: string;
}

const control = {
  height: 40, padding: '0 12px', border: '1px solid #ddd5cb', borderRadius: 10,
  background: '#fff', color: '#1e1a24', fontSize: 14, cursor: 'pointer',
} as const;

// Un <select> que actúa como botón: elegir una opción la añade y vuelve al
// placeholder, así se puede añadir otro personaje sin pasos extra.
function AddPicker({ label, options, onPick }: { label: string; options: PaletteOption[]; onPick: (id: number) => void }) {
  return (
    <select
      aria-label={`Añadir ${label.toLowerCase()}`}
      value=""
      disabled={options.length === 0}
      onChange={(e) => { if (e.target.value) onPick(Number(e.target.value)); }}
      title={options.length === 0 ? `No hay opciones para ${label.toLowerCase()}` : undefined}
      style={control}
    >
      <option value="">{`+ ${label}`}</option>
      {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
    </select>
  );
}

const NEW_PLACE = -1;

// Elegir un lugar del mundo o crear uno nuevo sin salir de la escena: el
// lugar nace donde hace falta. Enter crea y lo pone en la escena; Esc cancela.
function LocationPicker({ options, onPick, onCreate }: {
  options: PaletteOption[];
  onPick: (id: number) => void;
  onCreate?: (name: string) => Promise<number>;
}) {
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    const value = name.trim();
    if (!value || busy || !onCreate) return;
    setBusy(true);
    try {
      onPick(await onCreate(value));
      setNaming(false);
      setName('');
    } catch (err) {
      notifyPlaceError(i18n.t, err, 'location.map.createError');
    } finally {
      setBusy(false);
    }
  };
  if (naming) {
    return (
      <input
        autoFocus
        value={name}
        readOnly={busy}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); void submit(); }
          if (e.key === 'Escape') { e.preventDefault(); setNaming(false); setName(''); }
        }}
        onBlur={() => { if (!name.trim() && !busy) setNaming(false); }}
        placeholder="Nombre del lugar · Enter"
        aria-label="Nombre del lugar nuevo"
        style={{ ...control, cursor: 'text', width: 220 }}
      />
    );
  }
  return (
    <select
      aria-label="Añadir lugar"
      value=""
      disabled={options.length === 0 && !onCreate}
      onChange={(e) => {
        const v = Number(e.target.value);
        if (v === NEW_PLACE) setNaming(true);
        else if (v) onPick(v);
      }}
      style={control}
    >
      <option value="">+ Lugar</option>
      {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
      {onCreate && <option value={NEW_PLACE}>Nuevo lugar…</option>}
    </select>
  );
}

// La barra del taller, como la de ComfyUI: añadir nodos y, a la derecha, la
// acción que ejecuta el grafo. El progreso se ve en el nodo de salida.
export function ScenePalette({
  onAddMoment, onAddNarrator, onAddDirection, onAddCharacter, onAddLocation, onCreateLocation,
  castOptions, locationOptions, onGenerate, generating, generateLabel = "Escribir escena",
}: ScenePaletteProps) {
  return (
    <div role="toolbar" aria-label="Taller de escena" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
      <button onClick={onAddMoment} style={control}>+ Evento</button>
      <AddPicker label="Personaje" options={castOptions} onPick={onAddCharacter} />
      <LocationPicker options={locationOptions} onPick={onAddLocation} onCreate={onCreateLocation} />
      <button onClick={onAddNarrator} style={control}>+ Narrador</button>
      <button onClick={onAddDirection} style={control} title="Cómo quieres que se escriba: suelta vale para toda la escena; conectada a un evento, solo para él">+ Indicación</button>
      <button
        onClick={onGenerate}
        disabled={generating}
        style={{ ...control, border: 0, background: generating ? '#b9a9a4' : '#7f2d2d', color: '#fff', fontWeight: 600, padding: '0 18px', display: 'flex', alignItems: 'center', gap: 8 }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4l13 8-13 8z" /></svg>
        {generating ? 'Escribiendo…' : generateLabel}
      </button>
    </div>
  );
}
