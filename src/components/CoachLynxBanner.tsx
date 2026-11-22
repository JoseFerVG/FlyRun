import { useState } from 'react';
import { ClipboardText, Compass, Flame, Lightbulb, Target } from '@phosphor-icons/react';
import type { GoogleFitDay, LynxLevelInfo, UserProfile, WorkoutSession } from '../types/fitness';
import { SCIENTIFIC_LOADING_TIPS } from '../data/runningKnowledge';
import {
  calculateWeekly8020Balance,
  formatShortUserName,
  getGoalLabel,
  getTrainingFocusInfo,
} from '../services/scienceEngine';
import { HaikeiTopoOverlay } from './AmbientBackdrop';
import { AnimatedNumber, BiometricRing } from './MotionPrimitives';

interface CoachLynxBannerProps {
  profile: UserProfile;
  levelInfo: LynxLevelInfo;
  workouts: WorkoutSession[];
  todayWorkout?: WorkoutSession;
  fitToday?: GoogleFitDay;
  onOpenExam: () => void;
  onOpenGoalModal?: () => void;
}

export function CoachLynxBanner({
  profile,
  levelInfo,
  workouts,
  todayWorkout,
  fitToday,
  onOpenExam,
  onOpenGoalModal,
}: CoachLynxBannerProps) {
  const [tipIndex, setTipIndex] = useState(0);
  const currentTip = SCIENTIFIC_LOADING_TIPS[tipIndex];
  const shortName = formatShortUserName(profile.displayName, profile.email);
  const focusInfo = getTrainingFocusInfo(profile.preferredStrategy);
  const goalTitle = getGoalLabel(profile.goal);

  const balance8020 = calculateWeekly8020Balance(workouts);
  const todayChargePct = todayWorkout?.completed
    ? 100
    : Math.min(100, Math.max(15, Math.round(((todayWorkout?.durationMinutes ?? 30) / 50) * 100)));
  const stepsToday = fitToday?.steps ?? 0;
  const stepsPct = Math.min(
    100,
    Math.round((stepsToday / Math.max(1000, profile.dailyStepsTarget)) * 100)
  );

  return (
    <section
      className="card haikei-card-surface spotlight-card stack-md stagger-item"
      aria-label="Resumen de progreso del atleta"
    >
      <HaikeiTopoOverlay />

      <div className="row-between">
        <div className="row-wrap">
          <span className="pill lovable-badge">
            Nivel {levelInfo.level} · {levelInfo.spanishTitle}
          </span>
          <span className="pill pill-emerald">
            <Flame size={13} weight="duotone" aria-hidden="true" />
            Racha: {profile.streakDays} {profile.streakDays === 1 ? 'día' : 'días'}
          </span>
          <span className="pill pill-cyan">
            <Compass size={13} weight="duotone" aria-hidden="true" />
            {focusInfo.shortLabel}
          </span>
        </div>

        <div className="row-wrap">
          {onOpenGoalModal && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={onOpenGoalModal}>
              <Target size={15} weight="duotone" aria-hidden="true" />
              Cambiar meta
            </button>
          )}
          <button type="button" className="btn btn-secondary btn-sm" onClick={onOpenExam}>
            <ClipboardText size={15} weight="duotone" aria-hidden="true" />
            Evaluar nivel
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gap: '1.15rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          alignItems: 'center',
        }}
      >
        <div className="stack-sm">
          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(1.32rem, 2.5vw, 1.7rem)',
              fontWeight: 800,
              letterSpacing: '-0.025em',
            }}
          >
            Hola, {shortName} · Tu progreso de hoy
          </h1>
          <p className="secondary" style={{ margin: 0, fontSize: '0.88rem' }}>
            Meta activa: <strong style={{ color: 'var(--text-primary)' }}>{goalTitle}</strong>. {levelInfo.lynxQuote}
          </p>

          <div style={{ marginTop: '0.25rem' }}>
            <div className="row-between" style={{ fontSize: '0.76rem', marginBlockEnd: '0.28rem' }}>
              <span className="muted">Camino al Nivel {Math.min(10, levelInfo.level + 1)}</span>
              <span className="mono secondary" style={{ fontWeight: 600 }}>
                <AnimatedNumber value={profile.xp} locale /> / {levelInfo.nextLevelXp.toLocaleString('es-ES')} pts ({levelInfo.progressPct}%)
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ inlineSize: `${levelInfo.progressPct}%` }} />
            </div>
          </div>
        </div>

        <div className="biometric-rings-grid" style={{ gap: '0.65rem' }}>
          <BiometricRing
            percent={todayChargePct}
            label="Sesión hoy"
            valueText={todayWorkout?.completed ? 'Hecha' : `${todayWorkout?.durationMinutes ?? 30} min`}
            subText={todayWorkout?.completed ? 'Completada ✓' : 'Objetivo del día'}
            color="var(--accent)"
            size={78}
          />
          <BiometricRing
            percent={balance8020.lowPct}
            label="Ritmo suave"
            valueText={`${balance8020.lowPct}%`}
            subText="Base aeróbica"
            color="var(--pine)"
            size={78}
          />
          <BiometricRing
            percent={stepsPct}
            label="Pasos hoy"
            valueText={`${stepsPct}%`}
            subText={`${stepsToday.toLocaleString('es-ES')} / ${profile.dailyStepsTarget.toLocaleString('es-ES')}`}
            color="var(--cobalt)"
            size={78}
          />
        </div>
      </div>

      <div className="inset-panel row-between" style={{ fontSize: '0.82rem', padding: '0.62rem 0.9rem' }}>
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>Consejo de hoy · {currentTip.title}:</strong>{' '}
          <span className="secondary">{currentTip.fact}</span>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ flexShrink: 0 }}
          onClick={() => setTipIndex((i) => (i + 1) % SCIENTIFIC_LOADING_TIPS.length)}
        >
          <Lightbulb size={14} weight="duotone" aria-hidden="true" />
          Otro consejo
        </button>
      </div>
    </section>
  );
}
