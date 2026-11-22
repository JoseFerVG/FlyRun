import { useEffect, useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { SCIENTIFIC_LOADING_TIPS } from '../data/runningKnowledge';

interface ScientificLoaderProps {
  message?: string;
  subMessage?: string;
  onSkip?: () => void;
}

export function ScientificLoader({
  message = 'Calibrando tu plan científico con Coach Lince...',
  subMessage = 'Analizando zonas VDOT, distribución 80/20 y carga cardiovascular',
  onSkip,
}: ScientificLoaderProps) {
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * SCIENTIFIC_LOADING_TIPS.length));
  const [progress, setProgress] = useState(22);

  useEffect(() => {
    const tipTimer = window.setInterval(() => {
      setTipIndex((prev) => (prev + 1) % SCIENTIFIC_LOADING_TIPS.length);
    }, 3400);
    const progTimer = window.setInterval(() => {
      setProgress((prev) => (prev >= 94 ? 94 : prev + 12));
    }, 280);

    return () => {
      window.clearInterval(tipTimer);
      window.clearInterval(progTimer);
    };
  }, []);

  const tip = SCIENTIFIC_LOADING_TIPS[tipIndex];

  return (
    <div className="loader-screen" role="status" aria-live="polite">
      <div className="loader-card stack-md">
        <img
          src="/assets/lynx/lynx-action-run.png"
          alt="Coach Lince Ibérico corriendo"
          width={136}
          height={136}
          className="loader-avatar"
          fetchPriority="high"
        />

        <div className="stack-sm">
          <span className="pill pill-amber" style={{ alignSelf: 'center' }}>
            <Sparkles size={14} aria-hidden="true" />
            Píldora Científica FlyRun · {tip.category}
          </span>
          <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>{message}</h1>
          <p className="muted" style={{ margin: 0, fontSize: '0.88rem' }}>
            {subMessage}
          </p>
        </div>

        <div className="progress-track" aria-label="Progreso de carga">
          <div className="progress-fill" style={{ inlineSize: `${progress}%` }} />
        </div>

        <div
          style={{
            textAlign: 'left',
            background: 'rgba(9, 14, 26, 0.72)',
            border: '1px solid rgba(249, 115, 22, 0.25)',
            borderRadius: '16px',
            padding: '1rem 1.1rem',
          }}
        >
          <div className="row-between" style={{ marginBlockEnd: '0.35rem' }}>
            <strong style={{ color: '#fdba74', fontSize: '0.92rem' }}>{tip.title}</strong>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setTipIndex((prev) => (prev + 1) % SCIENTIFIC_LOADING_TIPS.length)}
              aria-label="Ver otro dato científico"
            >
              <RefreshCw size={13} aria-hidden="true" />
              Otro dato
            </button>
          </div>
          <p className="secondary" style={{ margin: 0, fontSize: '0.87rem', lineHeight: 1.55 }}>
            {tip.fact}
          </p>
          <p className="muted" style={{ margin: '0.45rem 0 0', fontSize: '0.75rem' }}>
            Evidencia: {tip.source}
          </p>
        </div>

        {onSkip && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={onSkip} style={{ alignSelf: 'center' }}>
            Entrar al panel ahora
          </button>
        )}
      </div>
    </div>
  );
}
