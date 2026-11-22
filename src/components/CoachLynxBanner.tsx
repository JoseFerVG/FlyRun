import { useState } from 'react';
import { ClipboardText, Flame, Heartbeat, Lightbulb } from '@phosphor-icons/react';
import type { LynxLevelInfo, UserProfile, WorkoutSession } from '../types/fitness';
import { SCIENTIFIC_LOADING_TIPS } from '../data/runningKnowledge';
import { HaikeiTopoOverlay } from './AmbientBackdrop';
import { AnimatedNumber } from './MotionPrimitives';

interface CoachLynxBannerProps {
  profile: UserProfile;
  levelInfo: LynxLevelInfo;
  todayWorkout?: WorkoutSession;
  tomorrowWorkout?: WorkoutSession;
  onOpenExam: () => void;
}

export function CoachLynxBanner({
  profile,
  levelInfo,
  todayWorkout,
  tomorrowWorkout,
  onOpenExam,
}: CoachLynxBannerProps) {
  const [tipIndex, setTipIndex] = useState(0);
  const currentTip = SCIENTIFIC_LOADING_TIPS[tipIndex];
  const firstName = profile.displayName.split(' ')[0];

  return (
    <section
      className="card haikei-card-surface spotlight-card stack-md stagger-item"
      aria-label="Resumen diario del entrenador"
    >
      <HaikeiTopoOverlay />

      <div className="row-between">
        <div className="row-wrap">
          <span className="pill pill-amber">
            Nivel {levelInfo.level} · {levelInfo.spanishTitle}
          </span>
          <span className="pill pill-emerald">
            <Flame size={13} weight="duotone" aria-hidden="true" />
            Racha: {profile.streakDays} {profile.streakDays === 1 ? 'día' : 'días'}
          </span>
          <span className="pill pill-cyan mono">
            <Heartbeat size={13} weight="duotone" aria-hidden="true" />
            VDOT <AnimatedNumber value={profile.vdot} decimals={1} />
          </span>
        </div>

        <button type="button" className="btn btn-secondary btn-sm" onClick={onOpenExam}>
          <ClipboardText size={15} weight="duotone" aria-hidden="true" />
          Registrar examen físico
        </button>
      </div>

      <div>
        <h1 style={{ margin: 0, fontSize: 'clamp(1.32rem, 2.6vw, 1.74rem)', fontWeight: 800, letterSpacing: '-0.025em' }}>
          Plan de hoy para {firstName}
        </h1>
        <p className="secondary" style={{ margin: '0.28rem 0 0', fontSize: '0.94rem' }}>
          {levelInfo.lynxQuote}
        </p>
      </div>

      <div className="grid-2" style={{ gap: '0.8rem' }}>
        <div className="inset-panel accent-rail stack-sm">
          <div className="muted" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Hoy toca
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.96rem' }}>
            {todayWorkout ? todayWorkout.title : 'Descanso activo'}
          </div>
          <div className="muted mono" style={{ fontSize: '0.8rem' }}>
            {todayWorkout
              ? `${todayWorkout.durationMinutes} min · ${todayWorkout.cardioPoints} Puntos Cardio`
              : 'Objetivos de pasos diarios'}
          </div>
        </div>

        <div className="inset-panel accent-rail-cobalt stack-sm">
          <div className="muted" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Mañana te espera
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.96rem' }}>
            {tomorrowWorkout ? tomorrowWorkout.title : 'Sesión aeróbica adaptada'}
          </div>
          <div className="muted mono" style={{ fontSize: '0.8rem' }}>
            {tomorrowWorkout
              ? `${tomorrowWorkout.strategyTag} · ${tomorrowWorkout.durationMinutes} min`
              : 'Por confirmar'}
          </div>
        </div>
      </div>

      <div className="row-between" style={{ gap: '0.9rem' }}>
        <div style={{ flex: '1 1 240px' }}>
          <div className="row-between" style={{ fontSize: '0.78rem', marginBlockEnd: '0.3rem' }}>
            <span className="muted">Progreso hacia el Nivel {Math.min(10, levelInfo.level + 1)}</span>
            <span className="mono secondary" style={{ fontWeight: 600 }}>
              <AnimatedNumber value={profile.xp} locale /> / {levelInfo.nextLevelXp.toLocaleString('es-ES')} XP ({levelInfo.progressPct}%)
            </span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ inlineSize: `${levelInfo.progressPct}%` }} />
          </div>
        </div>

        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setTipIndex((i) => (i + 1) % SCIENTIFIC_LOADING_TIPS.length)}
        >
          <Lightbulb size={15} weight="duotone" aria-hidden="true" />
          Siguiente apunte técnico
        </button>
      </div>

      <div className="inset-panel" style={{ fontSize: '0.84rem', padding: '0.68rem 0.92rem' }}>
        <strong style={{ color: 'var(--text-primary)' }}>{currentTip.title}:</strong>{' '}
        <span className="secondary">{currentTip.fact}</span>
      </div>
    </section>
  );
}
