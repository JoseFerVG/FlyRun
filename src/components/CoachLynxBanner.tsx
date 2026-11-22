import { useState } from 'react';
import { Award, Flame, Lightbulb, Sparkles } from 'lucide-react';
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

  const mascotImg = todayWorkout?.isExamDay
    ? '/assets/lynx/lynx-exam-clipboard.png'
    : todayWorkout?.completed
    ? '/assets/lynx/lynx-action-run.png'
    : '/assets/lynx/lynx-coach-hero.png';

  return (
    <section className="card card-highlight" aria-label="Resumen de Coach Lince">
      <div className="lynx-hero-grid">
        <img
          src={mascotImg}
          alt="Coach Lince Ibérico de FlyRun"
          width={190}
          height={190}
          className="lynx-portrait"
          fetchPriority="high"
        />

        <div className="stack-md">
          <div className="row-between">
            <div className="row-wrap">
              <span className="pill pill-amber">
                <Award size={14} aria-hidden="true" />
                Nivel {levelInfo.level} · {levelInfo.spanishTitle}
              </span>
              <span className="pill pill-emerald">
                <Flame size={14} aria-hidden="true" />
                Racha {profile.streakDays} días
              </span>
              <span className="pill pill-cyan mono">VDOT {profile.vdot}</span>
            </div>

            <button type="button" className="btn btn-secondary btn-sm" onClick={onOpenExam}>
              Hacer Examen Físico
            </button>
          </div>

          <div>
            <h1 style={{ margin: 0, fontSize: 'clamp(1.25rem, 2.8vw, 1.75rem)', fontWeight: 800 }}>
              ¡Vamos a por ello, {profile.displayName.split(' ')[0]}!
            </h1>
            <p className="secondary" style={{ margin: '0.3rem 0 0', fontSize: '0.94rem' }}>
              “{levelInfo.lynxQuote}”
            </p>
          </div>

          <div className="grid-2" style={{ gap: '0.75rem' }}>
            <div
              style={{
                background: 'rgba(9, 14, 26, 0.72)',
                border: '1px solid rgba(249, 115, 22, 0.25)',
                borderRadius: '14px',
                padding: '0.75rem 0.9rem',
              }}
            >
              <div className="muted" style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>
                Rutina de Hoy
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBlockStart: '0.15rem' }}>
                {todayWorkout ? todayWorkout.title : 'Día de descanso activo'}
              </div>
              <div className="muted" style={{ fontSize: '0.8rem' }}>
                {todayWorkout
                  ? `${todayWorkout.durationMinutes} min · ${todayWorkout.cardioPoints} Puntos Cardio`
                  : 'Cumple tu meta de pasos diarios'}
              </div>
            </div>

            <div
              style={{
                background: 'rgba(9, 14, 26, 0.72)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '14px',
                padding: '0.75rem 0.9rem',
              }}
            >
              <div className="muted" style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>
                Tu Entrenamiento de Mañana
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBlockStart: '0.15rem' }}>
                {tomorrowWorkout ? tomorrowWorkout.title : 'Sesión aeróbica adaptada'}
              </div>
              <div className="muted" style={{ fontSize: '0.8rem' }}>
                {tomorrowWorkout
                  ? `${tomorrowWorkout.strategyTag} · ${tomorrowWorkout.durationMinutes} min`
                  : 'Pendiente de recalibración'}
              </div>
            </div>
          </div>

          <div className="row-between" style={{ gap: '0.75rem' }}>
            <div style={{ flex: '1 1 220px' }}>
              <div className="row-between" style={{ fontSize: '0.78rem', marginBlockEnd: '0.25rem' }}>
                <span className="muted">Progreso al Nivel {Math.min(10, levelInfo.level + 1)}</span>
                <span className="mono" style={{ color: '#fdba74' }}>
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
              <Lightbulb size={14} color="#fbbf24" aria-hidden="true" />
              Consejo científico
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.55rem',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.22)',
              borderRadius: '12px',
              padding: '0.6rem 0.85rem',
              fontSize: '0.82rem',
            }}
          >
            <Sparkles size={15} color="#fbbf24" style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
            <div>
              <strong>{currentTip.title}:</strong> {currentTip.fact}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
