import { useEffect, useState } from 'react';
import { CheckCircle, CircleNotch, Lightbulb } from '@phosphor-icons/react';
import { SCIENTIFIC_LOADING_TIPS } from '../data/runningKnowledge';
import { AmbientBackdrop } from './AmbientBackdrop';
import { FlyRunLogo } from './FlyRunLogo';

export type LoaderMode = 'boot' | 'auth' | 'plan' | 'sync';

interface ScientificLoaderProps {
  mode?: LoaderMode;
  message?: string;
  subMessage?: string;
  onSkip?: () => void;
}

const LOADER_CONFIG: Record<
  LoaderMode,
  {
    title: string;
    subtitle: string;
    steps: [string, string, string];
  }
> = {
  boot: {
    title: 'Preparando tu espacio de entrenamiento',
    subtitle: 'Cargando tu progreso, tu sesión recomendada de hoy y tus pasos diarios.',
    steps: [
      'Recuperando tu perfil y progreso diario',
      'Ajustando tu rutina recomendada para hoy',
      'Sincronizando calendario, pasos y nutrición',
    ],
  },
  auth: {
    title: 'Conectando con tu cuenta',
    subtitle: 'Verificando acceso seguro y cargando tus datos en tiempo real.',
    steps: [
      'Verificando sesión segura',
      'Cargando tu nivel y tus objetivos',
      'Abriendo tu panel personalizado',
    ],
  },
  plan: {
    title: 'Diseñando tu plan personalizado',
    subtitle: 'Adaptando velocidades, descansos semanales y calorías a tu objetivo.',
    steps: [
      'Calculando tus ritmos cómodos en km/h y min/km',
      'Organizando tu semana ideal de 4 semanas',
      'Ajustando nutrición e hidratación diaria',
    ],
  },
  sync: {
    title: 'Sincronizando tus plataformas',
    subtitle: 'Actualizando tu actividad diaria desde tus relojes y apps conectadas.',
    steps: [
      'Conectando con tus apps de salud activas',
      'Leyendo pasos, distancia y minutos activos',
      'Actualizando tu resumen de hoy',
    ],
  },
};

export function ScientificLoader({
  mode = 'boot',
  message,
  subMessage,
  onSkip,
}: ScientificLoaderProps) {
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * SCIENTIFIC_LOADING_TIPS.length));
  const [progress, setProgress] = useState(24);

  useEffect(() => {
    setProgress(24);
    const tipTimer = window.setInterval(() => {
      setTipIndex((prev) => (prev + 1) % SCIENTIFIC_LOADING_TIPS.length);
    }, 3400);
    const progTimer = window.setInterval(() => {
      setProgress((prev) => (prev >= 96 ? 96 : prev + 16));
    }, 220);

    return () => {
      window.clearInterval(tipTimer);
      window.clearInterval(progTimer);
    };
  }, [mode, message]);

  const cfg = LOADER_CONFIG[mode];
  const tip = SCIENTIFIC_LOADING_TIPS[tipIndex];
  const activeStepIdx = progress < 48 ? 0 : progress < 82 ? 1 : 2;

  return (
    <div className="loader-screen" role="status" aria-live="polite">
      <AmbientBackdrop />

      <div className="loader-card-pro stack-md">
        <div className="row-between">
          <FlyRunLogo size="sm" subtitle="Running, cardio y bienestar" />
          <span className="pill lovable-badge mono" style={{ fontSize: '0.76rem' }}>
            {progress}%
          </span>
        </div>

        <div className="row-wrap" style={{ gap: '1.05rem', alignItems: 'center' }}>
          {/* Anillo orbital animado con gradiente FlyRun */}
          <div className="loader-emblem-orbit" aria-hidden="true">
            <svg className="loader-orbit-svg" viewBox="0 0 80 80" fill="none">
              <defs>
                <linearGradient id="fr-orbit-grad" x1="6" y1="6" x2="74" y2="74" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#f24e1e" />
                  <stop offset="52%" stopColor="#4f46e5" />
                  <stop offset="100%" stopColor="#0d9468" />
                </linearGradient>
              </defs>
              <circle cx="40" cy="40" r="35" stroke="var(--border-hairline)" strokeWidth="4.5" />
              <circle
                cx="40"
                cy="40"
                r="35"
                stroke="url(#fr-orbit-grad)"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeDasharray="135 90"
              />
            </svg>
            <div className="loader-emblem-core">
              <CircleNotch size={22} weight="duotone" color="var(--accent)" aria-hidden="true" />
            </div>
          </div>

          <div className="stack-sm" style={{ flex: '1 1 240px', gap: '0.2rem' }}>
            <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              {message ?? cfg.title}
            </h1>
            <p className="muted" style={{ margin: 0, fontSize: '0.84rem' }}>
              {subMessage ?? cfg.subtitle}
            </p>
          </div>
        </div>

        <div className="progress-track" aria-label="Progreso de carga">
          <div
            className="progress-fill"
            style={{
              inlineSize: `${progress}%`,
              background: 'var(--lovable-gradient)',
            }}
          />
        </div>

        {/* Pasos en vivo */}
        <div className="loader-steps-list" aria-label="Etapas de preparación">
          {cfg.steps.map((stepLabel, idx) => {
            const isDone = idx < activeStepIdx || progress >= 95;
            const isActive = idx === activeStepIdx && !isDone;
            return (
              <div
                key={stepLabel}
                className={`loader-step-item ${isDone ? 'is-done' : isActive ? 'is-active' : ''}`}
              >
                {isDone ? (
                  <CheckCircle size={16} weight="duotone" color="var(--pine)" aria-hidden="true" />
                ) : (
                  <CircleNotch
                    size={15}
                    weight="bold"
                    color={isActive ? 'var(--cobalt)' : 'var(--text-muted)'}
                    aria-hidden="true"
                  />
                )}
                <span>{stepLabel}</span>
              </div>
            );
          })}
        </div>

        {/* Vista previa skeleton animada */}
        <div className="loader-skeleton-grid" aria-hidden="true">
          <div className="loader-skeleton-box">
            <div className="shimmer-line" style={{ inlineSize: '58%' }} />
            <div className="shimmer-line" style={{ inlineSize: '86%' }} />
            <div className="shimmer-line" style={{ inlineSize: '42%' }} />
          </div>
          <div className="loader-skeleton-box">
            <div className="shimmer-line" style={{ inlineSize: '48%' }} />
            <div className="shimmer-line" style={{ inlineSize: '78%' }} />
            <div className="shimmer-line" style={{ inlineSize: '66%' }} />
          </div>
        </div>

        {/* Consejo breve legible */}
        <div
          className="inset-panel"
          style={{
            padding: '0.68rem 0.9rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.55rem',
            fontSize: '0.82rem',
          }}
        >
          <Lightbulb
            size={18}
            weight="duotone"
            color="var(--accent)"
            style={{ flexShrink: 0, marginTop: '2px' }}
            aria-hidden="true"
          />
          <div>
            <strong style={{ color: 'var(--text-primary)' }}>{tip.title}:</strong>{' '}
            <span className="secondary">{tip.fact}</span>
          </div>
        </div>

        {onSkip && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={onSkip} style={{ alignSelf: 'flex-end' }}>
            Entrar ahora
          </button>
        )}
      </div>
    </div>
  );
}
