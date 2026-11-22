import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { SCIENTIFIC_LOADING_TIPS } from '../data/runningKnowledge';

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
          <div className="brand-mark">
            <span className="brand-monogram" aria-hidden="true">FR</span>
            <div>
              <div className="brand-title">FlyRun</div>
              <div className="muted" style={{ fontSize: '0.76rem' }}>Entrenamiento de fondo y cardio</div>
            </div>
          </div>
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
              <RefreshCw size={13} aria-hidden="true" />
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
