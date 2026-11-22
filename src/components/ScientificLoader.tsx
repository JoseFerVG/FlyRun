import { useEffect, useState } from 'react';
import { ArrowsClockwise } from '@phosphor-icons/react';
import { SCIENTIFIC_LOADING_TIPS } from '../data/runningKnowledge';
import { FlyRunLogo } from './FlyRunLogo';

interface ScientificLoaderProps {
  message?: string;
  subMessage?: string;
  onSkip?: () => void;
}

export function ScientificLoader({
  message = 'Preparando tu plan de entrenamiento',
  subMessage = 'Calculando zonas VDOT, distribución semanal 80/20 y carga cardiovascular',
  onSkip,
}: ScientificLoaderProps) {
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * SCIENTIFIC_LOADING_TIPS.length));
  const [progress, setProgress] = useState(26);

  useEffect(() => {
    const tipTimer = window.setInterval(() => {
      setTipIndex((prev) => (prev + 1) % SCIENTIFIC_LOADING_TIPS.length);
    }, 3600);
    const progTimer = window.setInterval(() => {
      setProgress((prev) => (prev >= 94 ? 94 : prev + 14));
    }, 260);

    return () => {
      window.clearInterval(tipTimer);
      window.clearInterval(progTimer);
    };
  }, []);

  const tip = SCIENTIFIC_LOADING_TIPS[tipIndex];

  return (
    <div className="loader-screen" role="status" aria-live="polite">
      <div className="loader-card stack-md">
        <div className="row-between">
          <FlyRunLogo size="sm" subtitle="Entrenamiento de fondo y cardio" />
          <span className="pill">{tip.category}</span>
        </div>

        <div className="stack-sm">
          <h1 style={{ margin: 0, fontSize: '1.22rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            {message}
          </h1>
          <p className="muted" style={{ margin: 0, fontSize: '0.86rem' }}>
            {subMessage}
          </p>
        </div>

        <div className="progress-track" aria-label="Progreso de carga">
          <div className="progress-fill" style={{ inlineSize: `${progress}%` }} />
        </div>

        <div className="inset-panel stack-sm">
          <div className="row-between">
            <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{tip.title}</strong>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setTipIndex((prev) => (prev + 1) % SCIENTIFIC_LOADING_TIPS.length)}
              aria-label="Ver otro apunte técnico"
            >
              <ArrowsClockwise size={14} weight="duotone" aria-hidden="true" />
              Otro apunte
            </button>
          </div>
          <p className="secondary" style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.55 }}>
            {tip.fact}
          </p>
          <p className="muted" style={{ margin: 0, fontSize: '0.74rem' }}>
            Referencia: {tip.source}
          </p>
        </div>

        {onSkip && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={onSkip} style={{ alignSelf: 'flex-start' }}>
            Continuar al panel
          </button>
        )}
      </div>
    </div>
  );
}
