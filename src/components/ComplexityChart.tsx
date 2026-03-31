import { useMemo } from 'react';

// Standard Big-O functions, computed over x ∈ [1..N]
const N = 40;
const functions: Record<string, { fn: (n: number) => number; color: string; label: string }> = {
  '1':        { fn: () => 1,                            color: '#22c55e', label: 'O(1)' },
  'log n':    { fn: (n) => Math.log2(n),                color: '#3b82f6', label: 'O(log n)' },
  'sqrt(n)':  { fn: (n) => Math.sqrt(n),                color: '#8b5cf6', label: 'O(√n)' },
  'n':        { fn: (n) => n,                           color: '#eab308', label: 'O(n)' },
  'n log n':  { fn: (n) => n * Math.log2(n),            color: '#f97316', label: 'O(n log n)' },
  'n^2':      { fn: (n) => n * n,                       color: '#ef4444', label: 'O(n²)' },
  'n^3':      { fn: (n) => n * n * n,                   color: '#dc2626', label: 'O(n³)' },
  '2^n':      { fn: (n) => Math.pow(2, n),              color: '#be123c', label: 'O(2ⁿ)' },
};

// Aliases for pattern matching
const aliases: Record<string, string> = {
  '1': '1', 'o(1)': '1', 'θ(1)': '1', 'ω(1)': '1',
  'log n': 'log n', 'logn': 'log n', 'lg n': 'log n',
  'sqrt n': 'sqrt(n)', '√n': 'sqrt(n)', 'sqrt(n)': 'sqrt(n)',
  'n': 'n',
  'n log n': 'n log n', 'n logn': 'n log n', 'n lg n': 'n log n',
  'n^2': 'n^2', 'n²': 'n^2',
  'n^3': 'n^3', 'n³': 'n^3',
  '2^n': '2^n', '2ⁿ': '2^n',
};

function extractComplexities(text: string): string[] {
  const found = new Set<string>();
  // Match O(...), Θ(...), Ω(...) patterns
  const pattern = /[OΘΩ]\(([^)]+)\)/g;
  let m;
  while ((m = pattern.exec(text)) !== null) {
    const inner = m[1].trim().toLowerCase()
      .replace(/\\log/g, 'log')
      .replace(/\\sqrt/g, 'sqrt')
      .replace(/\\cdot/g, ' ');
    const key = aliases[inner];
    if (key) found.add(key);
  }
  return Array.from(found);
}

interface Props {
  text: string;
}

export function ComplexityChart({ text }: Props) {
  const highlighted = useMemo(() => extractComplexities(text), [text]);

  if (highlighted.length < 1) return null;

  // Generate points for each highlighted function
  const W = 280, H = 120;
  const pad = { top: 10, right: 10, bottom: 20, left: 10 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  // Compute max Y across highlighted functions for scaling
  const maxVal = Math.max(
    ...highlighted.map(k => functions[k]?.fn(N) ?? 0),
    1
  );
  // Cap max for exponentials to keep the chart readable
  const cappedMax = Math.min(maxVal, N * N * 2);

  const curves = highlighted.map(key => {
    const f = functions[key];
    if (!f) return null;
    const points: string[] = [];
    for (let i = 1; i <= N; i++) {
      const x = pad.left + ((i - 1) / (N - 1)) * plotW;
      const y = pad.top + plotH - Math.min(f.fn(i) / cappedMax, 1) * plotH;
      points.push(`${x},${y}`);
    }
    return { key, points: points.join(' '), color: f.color, label: f.label };
  }).filter(Boolean) as Array<{ key: string; points: string; color: string; label: string }>;

  if (curves.length === 0) return null;

  const legendCols = 2;
  const legendRowH = 14;
  const legendRows = Math.ceil(curves.length / legendCols);
  const legendH = legendRows * legendRowH + 6;
  const totalH = H + legendH;

  return (
    <div className="mt-3 w-full max-w-[340px]">
      <svg viewBox={`0 0 ${W} ${totalH}`} className="w-full" style={{ height: 'auto' }}>
        {/* Axes */}
        <line x1={pad.left} y1={pad.top + plotH} x2={W - pad.right} y2={pad.top + plotH} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
        <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + plotH} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
        <text x={W / 2} y={H - 2} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={9}>n →</text>

        {/* Curves */}
        {curves.map(c => (
          <polyline key={c.key} points={c.points} fill="none" stroke={c.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
        ))}

        {/* Legend — 2-column grid below the chart */}
        {(() => {
          const colW = W / legendCols;
          return curves.map((c, i) => {
            const col = i % legendCols;
            const row = Math.floor(i / legendCols);
            const x = col * colW + 12;
            const y = H + 8 + row * legendRowH;
            return (
              <g key={c.key}>
                <line x1={x} y1={y} x2={x + 10} y2={y} stroke={c.color} strokeWidth={2} />
                <text x={x + 14} y={y + 3} fill={c.color} fontSize={8} fontFamily="monospace">{c.label}</text>
              </g>
            );
          });
        })()}
      </svg>
    </div>
  );
}
