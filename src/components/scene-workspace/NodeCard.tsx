import type { ReactNode } from 'react';

// El mismo marco para todos los nodos del taller, como en ComfyUI: una
// cabecera con el tipo en su color y el contenido a un tamaño que se lee sin
// acercar el lienzo (antes, 10–13 px).
export function NodeCard({ label, color, width = 220, selected, aside, children }: {
  label: string;
  color: string;
  width?: number;
  selected?: boolean;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div style={{
      width, boxSizing: 'border-box', background: '#fff', borderRadius: 12,
      border: selected ? `2px solid ${color}` : '1px solid #e5ded4',
      boxShadow: '0 1px 2px rgba(30,26,36,0.06)', fontFamily: 'var(--font-body, inherit)',
    }}>
      <div style={{
        padding: '8px 12px', borderBottom: '1px solid #f0eae2', display: 'flex', justifyContent: 'space-between', gap: 8,
        fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color,
      }}>
        <span>{label}</span>
        {aside && <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 500 }}>{aside}</span>}
      </div>
      <div style={{ padding: '10px 12px', fontSize: 15, lineHeight: 1.45, color: '#1e1a24' }}>{children}</div>
    </div>
  );
}
