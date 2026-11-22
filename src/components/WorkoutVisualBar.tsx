import type { WorkoutBlock } from '../types/fitness';

interface WorkoutVisualBarProps {
  blocks: WorkoutBlock[];
}

const ZONE_META: Record<WorkoutBlock['zone'], { heightPct: number; color: string }> = {
  Z1: { heightPct: 38, color: '#186a4b' },
  Z2: { heightPct: 54, color: '#2563eb' },
  Z3: { heightPct: 72, color: '#b45309' },
  Z4: { heightPct: 88, color: '#d94814' },
  Z5: { heightPct: 100, color: '#b91c1c' },
};

export function WorkoutVisualBar({ blocks }: WorkoutVisualBarProps) {
  const totalMinutes = Math.max(1, blocks.reduce((acc, b) => acc + Math.max(1, b.durationMinutes), 0));

  return (
    <div
      className="workout-visual-bar"
      role="img"
      aria-label={`Estructura visual de ${blocks.length} bloques de entrenamiento`}
    >
      {blocks.map((block, idx) => {
        const meta = ZONE_META[block.zone] ?? ZONE_META.Z1;
        const widthPct = Math.max(6, (block.durationMinutes / totalMinutes) * 100);
        return (
          <div
            key={`${block.label}-${idx}`}
            className="workout-visual-segment"
            title={`${block.label} (${block.durationMinutes} min · ${block.zone})`}
            style={{
              inlineSize: `${widthPct}%`,
              blockSize: `${meta.heightPct}%`,
              backgroundColor: meta.color,
            }}
          />
        );
      })}
    </div>
  );
}
