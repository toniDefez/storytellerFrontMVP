import type { SceneOutput } from '../../services/api';

interface VersionDropdownProps {
  outputs: SceneOutput[];
  current: number | null;
  onSelect: (version: number) => void;
}

export function SceneVersionDropdown({ outputs, current, onSelect }: VersionDropdownProps) {
  if (!outputs.length) return null;
  return (
    <select
      value={current ?? ''}
      onChange={(e) => onSelect(Number(e.target.value))}
      style={{ padding: 4, borderRadius: 4 }}
    >
      {outputs.map((o) => (
        <option key={o.version} value={o.version}>
          v{o.version} · {new Date(o.created_at).toLocaleString()}
        </option>
      ))}
    </select>
  );
}
