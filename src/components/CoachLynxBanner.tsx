import { useState } from 'react';
import { ClipboardText, Compass, Flame, Heartbeat, Lightbulb, Target } from '@phosphor-icons/react';
import type { GoogleFitDay, LynxLevelInfo, UserProfile, WorkoutSession } from '../types/fitness';
import { SCIENTIFIC_LOADING_TIPS } from '../data/runningKnowledge';
import {
  calculateWeekly8020Balance,
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
  const firstName = profile.displayName.split(' ')[0];
  const focusInfo = getTrainingFocusInfo(profile.preferredStrategy);
  const goalTitle = getGoalLabel(profile.goal);

  const balance8020 = calculateWeekly8020Balance(workouts);
  const todayChargePct = todayWorkout?.completed
    ? 100
    : Math.min(100, Math.max(12, Math.round(((todayWorkout?.cardioPoints ?? 0) / 110) * 100)));
  const stepsToday = fitToday?.steps ?? 0;
  const stepsPct = Math.min(
    100,
    Math.round((stepsToday / Math.max(1000, profile.dailyStepsTarget)) * 100)
  );

  return (
    <section
      className="card haikei-card-surface spotlight-card stack-md stagger-item"
      aria-label="Resumen de rendimiento del atleta"
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

        <div className="row-wrap">
          {onOpenGoalModal && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={onOpenGoalModal}>
              <Target size={15} weight="duotone" aria-hidden="true" />
              Cambiar meta / enfoque
            </button>
          )}
          <button type="button" className="btn btn-secondary btn-sm" onClick={onOpenExam}>
            <ClipboardText size={15} weight="duotone" aria-hidden="true" />
            Registrar examen físico
          </button>
        </div>
      </div>

      <div className="row-wrap" style={{ gap: '0.45rem' }}>
        <span className="pill lovable-badge">
          <Target size={13} weight="duotone" aria-hidden="true" />
          Meta: {goalTitle}
        </span>
        <span className="pill pill-emerald">
          <Compass size={13} weight="duotone" aria-hidden="true" />
          Entrenas: {focusInfo.shortLabel}
        </span>
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
              fontSize: 'clamp(1.3rem, 2.5vw, 1.68rem)',
              fontWeight: 800,
              letterSpacing: '-0.025em',
            }}
          >
            Hola, {firstName} · Tu estado de hoy
          </h1>
          <p className="secondary" style={{ margin: 0, fontSize: '0.9rem' }}>
            {levelInfo.lynxQuote}
          </p>

          <div style={{ marginTop: '0.25rem' }}>
            <div className="row-between" style={{ fontSize: '0.76rem', marginBlockEnd: '0.28rem' }}>
              <span className="muted">Progreso hacia Nivel {Math.min(10, levelInfo.level + 1)}</span>
              <span className="mono secondary" style={{ fontWeight: 600 }}>
                <AnimatedNumber value={profile.xp} locale /> / {levelInfo.nextLevelXp.toLocaleString('es-ES')} XP ({levelInfo.progressPct}%)
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
            label="Carga de hoy"
            valueText={`${todayWorkout?.cardioPoints ?? 0} PC`}
            subText={todayWorkout?.completed ? 'Completada' : `${todayWorkout?.durationMinutes ?? 0} min`}
            color="var(--accent)"
            size={76}
          />
          <BiometricRing
            percent={balance8020.lowPct}
            label="Equilibrio 80/20"
            valueText={`${balance8020.lowPct}%`}
            subText={`${balance8020.lowMinutes}m Z1-2 · ${balance8020.highMinutes}m int.`}
            color="var(--pine)"
            size={76}
          />
          <BiometricRing
            percent={stepsPct}
            label="Pasos diarios"
            valueText={`${stepsPct}%`}
            subText={`${stepsToday.toLocaleString('es-ES')} / ${profile.dailyStepsTarget.toLocaleString('es-ES')}`}
            color="var(--cobalt)"
            size={76}
          />
        </div>
      </div>

      <div className="inset-panel row-between" style={{ fontSize: '0.82rem', padding: '0.58rem 0.85rem' }}>
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>Criterio fisiológico · {currentTip.title}:</strong>{' '}
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