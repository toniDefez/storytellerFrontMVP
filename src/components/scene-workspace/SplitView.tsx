import { useState, type ReactNode } from 'react';

interface SplitViewProps {
  left: ReactNode;
  right: ReactNode;
}

export type SplitMode = 'split' | 'left-only' | 'right-only';

export function SplitView({ left, right }: SplitViewProps) {
  const [mode, setMode] = useState<SplitMode>('split');
  const showLeft = mode !== 'right-only';
  const showRight = mode !== 'left-only';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', gap: 4, padding: 6, borderBottom: '1px solid #e5e7eb' }}>
        <button onClick={() => setMode('split')} disabled={mode === 'split'}>50 / 50</button>
        <button onClick={() => setMode('left-only')} disabled={mode === 'left-only'}>Canvas</button>
        <button onClick={() => setMode('right-only')} disabled={mode === 'right-only'}>Prosa</button>
      </div>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {showLeft && <div style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRight: showRight ? '1px solid #e5e7eb' : 'none' }}>{left}</div>}
        {showRight && <div style={{ flex: 1, overflow: 'hidden' }}>{right}</div>}
      </div>
    </div>
  );
}
