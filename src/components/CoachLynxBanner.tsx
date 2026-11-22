import { useState } from 'react';
import { Lightbulb } from 'lucide-react';
import type { LynxLevelInfo, UserProfile, WorkoutSession } from '../types/fitness';
import { SCIENTIFIC_LOADING_TIPS } from '../data/runningKnowledge';

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
    <section className="card stack-md" aria-label="Resumen diario del entrenador">
      <div className="row-between">
        <div className="row-wrap">
          <span className="pill pill-amber">
            Nivel {levelInfo.level} · {levelInfo.spanishTitle}
          </span>
          <span className="pill pill-emerald">
            Racha: {profile.streakDays} {profile.streakDays === 1 ? 'día' : 'días'}
          </span>
          <span className="pill pill-cyan mono">VDOT {profile.vdot}</span>
        </div>

        <button type="button" className="btn btn-secondary btn-sm" onClick={onOpenExam}>
          Registrar examen físico
        </button>
      </div>

      <div>
        <h1 style={{ margin: 0, fontSize: 'clamp(1.3rem, 2.6vw, 1.7rem)', fontWeight: 700, letterSpacing: '-0.025em' }}>
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
              {profile.xp} / {levelInfo.nextLevelXp} XP ({levelInfo.progressPct}%)
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
          <Lightbulb size={14} aria-hidden="true" />
          Siguiente apunte técnico
        </button>
      </div>

      <div className="inset-panel" style={{ fontSize: '0.84rem', padding: '0.65rem 0.9rem' }}>
        <strong style={{ color: 'var(--text-primary)' }}>{currentTip.title}:</strong>{' '}
        <span className="secondary">{currentTip.fact}</span>
      </div>
    </section>
  );
}
