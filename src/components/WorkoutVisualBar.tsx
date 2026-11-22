import type { WorkoutBlock } from '../types/fitness';

interface WorkoutVisualBarProps {
  blocks: WorkoutBlock[];
  activeBlockIndex?: number;
  onSelectBlock?: (index: number) => void;
}

function getBlockVisualMeta(block: WorkoutBlock): { heightPct: number; color: string; shortTag: string } {
  const lbl = `${block.label} ${block.intensity}`.toLowerCase();
  const isWarmupCooldownWalk =
    lbl.includes('calentamiento') ||
    lbl.includes('enfriamiento') ||
    lbl.includes('vuelta a la calma') ||
    lbl.includes('caminar') ||
    lbl.includes('caminata') ||
    lbl.includes('recuperaci') ||
    lbl.includes('soltura') ||
    lbl.includes('paseo');

  if (block.zone === 'Z5') return { heightPct: 100, color: '#b91c1c', shortTag: 'Z5' };
  if (block.zone === 'Z4') return { heightPct: 90, color: '#d94814', shortTag: 'Z4' };
  if (block.zone === 'Z3') return { heightPct: 76, color: '#b45309', shortTag: 'Z3' };
  if (block.zone === 'Z2') return { heightPct: 62, color: '#1d4ed8', shortTag: isWarmupCooldownWalk ? 'Z2' : 'CORRE' };
  if (isWarmupCooldownWalk) {
    return { heightPct: 32, color: '#475569', shortTag: lbl.includes('caminar') || lbl.includes('recupera') ? 'ANDA' : 'Z1' };
  }
  return { heightPct: 50, color: '#166547', shortTag: 'Z1' };
}

export function WorkoutVisualBar({ blocks, activeBlockIndex, onSelectBlock }: WorkoutVisualBarProps) {
  const totalMinutes = Math.max(1, blocks.reduce((acc, b) => acc + Math.max(1, b.durationMinutes), 0));

  return (
    <div
      className="workout-visual-bar"
      role="img"
      aria-label={`Estructura visual de ${blocks.length} bloques de entrenamiento`}
    >
      {blocks.map((block, idx) => {
        const meta = getBlockVisualMeta(block);
        const widthPct = Math.max(5.5, (block.durationMinutes / totalMinutes) * 100);
        const isActive = activeBlockIndex === idx;
        const isDone = activeBlockIndex !== undefined && idx < activeBlockIndex;
        const showLabel = widthPct >= 11 || isActive;

        if (onSelectBlock) {
          return (
            <button
              key={`${block.label}-${idx}`}
              type="button"
              onClick={() => onSelectBlock(idx)}
              className="workout-visual-segment"
              title={`${block.label} (${block.durationMinutes} min · ${block.zone})`}
              aria-label={`Ir al bloque ${idx + 1}: ${block.label} (${block.durationMinutes} min)`}
              aria-pressed={isActive}
              style={{
                inlineSize: `${widthPct}%`,
                blockSize: `${meta.heightPct}%`,
                backgroundColor: meta.color,
                border: isActive ? '2px solid #ffffff' : '0',
                boxShadow: isActive ? '0 0 0 2px var(--accent)' : 'none',
                opacity: isDone ? 0.42 : 1,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              {showLabel && (
                <span
                  className="mono"
                  style={{
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    lineHeight: 1,
                    paddingInline: '2px',
                    paddingBlockEnd: '2px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {block.durationMinutes}m
                </span>
              )}
            </button>
          );
        }

        return (
          <div
            key={`${block.label}-${idx}`}
            className="workout-visual-segment"
            title={`${block.label} (${block.durationMinutes} min · ${block.zone})`}
            style={{
              inlineSize: `${widthPct}%`,
              blockSize: `${meta.heightPct}%`,
              backgroundColor: meta.color,
              boxShadow: isActive ? '0 0 0 2px var(--accent)' : 'none',
              opacity: isDone ? 0.42 : 1,
            }}
          >
            {showLabel && (
              <span
                className="mono"
                style={{
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  lineHeight: 1,
                  paddingInline: '2px',
                  whiteSpace: 'nowrap',
                }}
              >
                {meta.shortTag}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}