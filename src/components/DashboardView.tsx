import { useState } from 'react';
import {
  ArrowRight,
  ArrowsClockwise,
  CalendarBlank,
  CheckCircle,
  CookingPot,
  Footprints,
  PersonSimpleRun,
  PlugsConnected,
  Sparkle,
  Timer,
} from '@phosphor-icons/react';
import type {
  CardioModality,
  GoogleFitDay,
  MacroRecommendation,
  UserProfile,
  WorkoutSession,
} from '../types/fitness';
import {
  calculateTrainingZones,
  getModalityLabel,
  getTrainingFocusInfo,
  type RestLevel,
  type RoutinePowerLevel,
} from '../services/scienceEngine';
import { SIMPLE_PLATFORMS } from './SettingsModal';
import { WorkoutVisualBar } from './WorkoutVisualBar';
import { AnimatedNumber, SpotlightCard } from './MotionPrimitives';
import { TodayRoutineModal } from './TodayRoutineModal';
import { assetUrl } from '../services/assets';

function getSessionBannerPhoto(workout?: WorkoutSession): { src: string; alt: string } {
  if (!workout) {
    return {
      src: assetUrl('images/modality-active-walk.jpg'),
      alt: 'Caminata activa al aire libre',
    };
  }
  if (workout.modality === 'cycling') {
    return {
      src: assetUrl('images/cardio-road-cycling.jpg'),
      alt: 'Ciclista rodando en carretera',
    };
  }
  if (workout.modality === 'soccer') {
    return {
      src: assetUrl('images/cardio-soccer-pitch.jpg'),
      alt: 'Partido de fútbol en campo de césped',
    };
  }
  if (workout.modality === 'walking' || workout.sessionType === 'rest') {
    return {
      src: assetUrl('images/modality-active-walk.jpg'),
      alt: 'Persona caminando a paso activo',
    };
  }
  if (workout.sessionType === 'intervals_z4' || workout.targetZone === 'Z4' || workout.targetZone === 'Z5') {
    return {
      src: assetUrl('images/routine-intervals-vo2.jpg'),
      alt: 'Corredor realizando series rápidas',
    };
  }
  if (workout.sessionType === 'threshold_z3' || workout.targetZone === 'Z3') {
    return {
      src: assetUrl('images/routine-tempo-threshold.jpg'),
      alt: 'Corredor entrenando a ritmo de umbral',
    };
  }
  if (workout.sessionType === 'caco') {
    return {
      src: assetUrl('images/goal-start-caco.jpg'),
      alt: 'Corredora empezando con bloques CaCo',
    };
  }
  return {
    src: assetUrl('images/routine-easy-aerobic.jpg'),
    alt: 'Corredor entrenando rodaje aeróbico suave',
  };
}

interface DashboardViewProps {
  profile: UserProfile;
  todayWorkout?: WorkoutSession;
  tomorrowWorkout?: WorkoutSession;
  fitDays: GoogleFitDay[];
  todayMacros: MacroRecommendation;
  fitSyncLoading: boolean;
  fitNotice: string | null;
  connectedPlatforms: string[];
  onConfigureTodayRoutine: (
    power: RoutinePowerLevel,
    durationMinutes: number,
    modality: CardioModality,
    restLevel: RestLevel
  ) => void;
  onSaveUpdatedWorkout: (updatedWorkout: WorkoutSession) => void;
  onStartTimer: (workout: WorkoutSession, startBlockIndex?: number) => void;
  onCompleteWorkout: (workout: WorkoutSession) => void;
  onSyncPlatforms: () => void;
  onOpenConnections: () => void;
  onNavigate: (tab: 'dashboard' | 'calendar' | 'stats' | 'strategies' | 'nutrition') => void;
}

export function DashboardView({
  profile,
  todayWorkout,
  tomorrowWorkout,
  fitDays,
  todayMacros,
  fitSyncLoading,
  fitNotice,
  connectedPlatforms,
  onConfigureTodayRoutine,
  onSaveUpdatedWorkout,
  onStartTimer,
  onCompleteWorkout,
  onSyncPlatforms,
  onOpenConnections,
  onNavigate,
}: DashboardViewProps) {
  const fitToday = fitDays[fitDays.length - 1];
  const [routineModalOpen, setRoutineModalOpen] = useState(false);

  const zones = calculateTrainingZones(profile.vdot, profile.maxHR, profile.restHR);
  const todayZoneInfo = zones.find((z) => z.id === todayWorkout?.targetZone) ?? zones[0];
  const stepsPct = Math.min(100, Math.round(((fitToday?.steps ?? 0) / Math.max(1000, profile.dailyStepsTarget)) * 100));
  const focusInfo = getTrainingFocusInfo(profile.preferredStrategy);

  const activePlatformNames = SIMPLE_PLATFORMS.filter((p) =>
    connectedPlatforms.includes(p.id)
  ).map((p) => p.name);

  return (
    <div className="stack-lg">
      {/* FILA 1: TARJETA COMPACTA DE RUTINA (AL PULSAR ABRE EL CONFIGURADOR DEDICADO) + ACTIVIDAD DIARIA */}
      <div className="grid-2">
        <SpotlightCard staggerIndex={0} className="lovable-hero-card stack-md" aria-label="Rutina de hoy">
          <div className="row-between">
            <span className="pill lovable-badge">
              <Sparkle size={13} weight="duotone" aria-hidden="true" />
              Rutina de Hoy
            </span>
            <span className="pill pill-emerald" style={{ fontSize: '0.72rem' }}>
              {focusInfo.shortLabel}
            </span>
          </div>

          {todayWorkout ? (
            <>
              <button
                type="button"
                onClick={() => setRoutineModalOpen(true)}
                className="editorial-photo-banner"
                style={{
                  blockSize: '148px',
                  inlineSize: '100%',
                  border: 0,
                  padding: 0,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                aria-label="Abrir configurador completo de la rutina de hoy"
              >
                <img
                  src={getSessionBannerPhoto(todayWorkout).src}
                  alt={getSessionBannerPhoto(todayWorkout).alt}
                  width={1200}
                  height={420}
                  fetchPriority="high"
                  className="editorial-photo-img"
                />
                <div className="editorial-photo-scrim">
                  <div>
                    <span className="editorial-photo-caption" style={{ display: 'block', fontSize: '1.05rem' }}>
                      {todayWorkout.completed ? `Completada: ${todayWorkout.title}` : todayWorkout.title}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.88)', fontSize: '0.78rem' }}>
                      {getModalityLabel(todayWorkout.modality).split(' ')[0]} · {todayWorkout.durationMinutes} min · {todayZoneInfo.speedKmhFormatted}
                    </span>
                  </div>
                  <span className="pill lovable-badge">
                    Entrar a la rutina
                    <ArrowRight size={13} weight="bold" aria-hidden="true" />
                  </span>
                </div>
              </button>

              <WorkoutVisualBar blocks={todayWorkout.blocks} />

              <p className="muted" style={{ margin: 0, fontSize: '0.83rem' }}>
                Pulsa para elegir si prefieres correr, bici, fútbol o caminar hoy, ajustar la potencia según tu descanso o iniciar el cronómetro por voz.
              </p>

              <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
                <button
                  type="button"
                  className="btn lovable-cta-btn"
                  style={{ flex: '1 1 200px', minBlockSize: '44px' }}
                  onClick={() => setRoutineModalOpen(true)}
                >
                  <PersonSimpleRun size={18} weight="duotone" aria-hidden="true" />
                  {todayWorkout.completed ? 'Ver rutina de hoy' : 'Elegir deporte, potencia y empezar'}
                </button>

                {!todayWorkout.completed && todayWorkout.blocks.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ minBlockSize: '44px' }}
                    onClick={() => onStartTimer(todayWorkout, 0)}
                  >
                    <Timer size={16} weight="duotone" aria-hidden="true" />
                    Crono
                  </button>
                )}

                <button
                  type="button"
                  className={`btn ${todayWorkout.completed ? 'btn-secondary' : 'btn-emerald'}`}
                  style={{ minBlockSize: '44px' }}
                  onClick={() => onCompleteWorkout(todayWorkout)}
                >
                  <CheckCircle size={16} weight="duotone" aria-hidden="true" />
                  {todayWorkout.completed ? 'Editar' : 'Hecho'}
                </button>
              </div>
            </>
          ) : (
            <p className="muted">No hay sesión registrada para hoy.</p>
          )}
        </SpotlightCard>

        {/* ACTIVIDAD DEL DÍA Y PLATAFORMAS */}
        <SpotlightCard staggerIndex={1} className="stack-md" aria-label="Actividad diaria y plataformas">
          <div className="row-between">
            <div className="row-wrap">
              <span className="duotone-icon-box is-pine">
                <Footprints size={18} weight="duotone" aria-hidden="true" />
              </span>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.06rem' }}>Tu día y Plataformas</h2>
                <div className="muted" style={{ fontSize: '0.78rem' }}>
                  {activePlatformNames.length > 0
                    ? `Conectado a ${activePlatformNames.join(' · ')}`
                    : 'Conecta Wahoo, Google Fit o Strava en 1 clic'}
                </div>
              </div>
            </div>

            <div className="row-wrap" style={{ gap: '0.4rem' }}>
              <button
                type="button"
                className="btn btn-emerald btn-sm"
                onClick={onSyncPlatforms}
                disabled={fitSyncLoading}
              >
                <ArrowsClockwise size={15} weight="duotone" aria-hidden="true" />
                {fitSyncLoading ? 'Sincronizando…' : 'Sincronizar'}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onOpenConnections}
              >
                <PlugsConnected size={15} weight="duotone" aria-hidden="true" />
                Conectar
              </button>
            </div>
          </div>

          {activePlatformNames.length > 0 && (
            <div className="row-wrap" style={{ gap: '0.35rem' }}>
              {activePlatformNames.map((name) => (
                <span key={name} className="pill pill-emerald" style={{ fontSize: '0.72rem' }}>
                  {name} ✓
                </span>
              ))}
            </div>
          )}

          <div className="row-between">
            <div>
              <div className="kpi-value" style={{ color: 'var(--pine)' }}>
                <AnimatedNumber value={fitToday?.steps ?? 0} locale />{' '}
                <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>pasos hoy</span>
              </div>
              <div className="muted" style={{ fontSize: '0.8rem' }}>
                {((fitToday?.distanceMeters ?? 0) / 1000).toFixed(2)} km · {fitToday?.calories ?? 0} kcal activas · {fitToday?.activeMinutes ?? 0} min
              </div>
            </div>
            <span className="pill pill-emerald mono">{stepsPct}% objetivo</span>
          </div>

          <div className="progress-track">
            <div className="progress-fill progress-fill-emerald" style={{ inlineSize: `${stepsPct}%` }} />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '0.4rem',
              alignItems: 'end',
              blockSize: '60px',
              paddingBlockStart: '0.25rem',
            }}
            aria-label="Pasos de los últimos 7 días"
          >
            {fitDays.slice(-7).map((day) => {
              const hPct = Math.max(14, Math.min(100, Math.round((day.steps / Math.max(4000, profile.dailyStepsTarget)) * 100)));
              return (
                <div
                  key={day.date}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.2rem',
                    blockSize: '100%',
                    justifyContent: 'flex-end',
                  }}
                >
                  <div
                    title={`${day.date}: ${day.steps.toLocaleString('es-ES')} pasos`}
                    style={{
                      inlineSize: '100%',
                      blockSize: `${hPct}%`,
                      borderRadius: '4px 4px 2px 2px',
                      background:
                        day.steps >= profile.dailyStepsTarget ? 'var(--pine)' : 'var(--border-strong)',
                    }}
                  />
                  <span className="muted mono" style={{ fontSize: '0.66rem' }}>{day.date.slice(8)}</span>
                </div>
              );
            })}
          </div>

          {fitNotice && (
            <div className="muted" style={{ fontSize: '0.78rem', color: 'var(--pine)', fontWeight: 600 }}>
              {fitNotice}
            </div>
          )}
        </SpotlightCard>
      </div>

      {/* FILA 2: AVANCE DE MAÑANA Y NUTRICIÓN DEL DÍA */}
      <div className="grid-2">
        <SpotlightCard staggerIndex={2} className="stack-sm" aria-label="Rutina de Mañana">
          <div className="row-between">
            <span className="pill pill-cyan">
              <CalendarBlank size={14} weight="duotone" aria-hidden="true" />
              Mañana en tu plan
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => onNavigate('calendar')}
            >
              Ver calendario
            </button>
          </div>

          {tomorrowWorkout ? (
            <>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.08rem', letterSpacing: '-0.015em' }}>{tomorrowWorkout.title}</h2>
                <p className="muted" style={{ margin: '0.2rem 0 0', fontSize: '0.83rem' }}>
                  {tomorrowWorkout.subtitle}
                </p>
              </div>
              <div className="row-wrap">
                <span className="pill mono">{tomorrowWorkout.durationMinutes} min</span>
                <span className="pill">{getModalityLabel(tomorrowWorkout.modality).split(' ')[0]}</span>
              </div>
            </>
          ) : null}
        </SpotlightCard>

        <SpotlightCard staggerIndex={3} className="stack-sm">
          <div className="row-between">
            <div className="row-wrap">
              <span className="duotone-icon-box" style={{ inlineSize: '30px', blockSize: '30px' }}>
                <CookingPot size={16} weight="duotone" aria-hidden="true" />
              </span>
              <h2 style={{ margin: 0, fontSize: '1.02rem' }}>Nutrición para hoy</h2>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('nutrition')}>
              Ver menú del día
            </button>
          </div>
          <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>
            {todayMacros.dayTypeLabel} ·{' '}
            <strong className="mono">
              <AnimatedNumber value={todayMacros.calories} locale suffix=" kcal" />
            </strong>
          </p>
          <div className="grid-3" style={{ gap: '0.6rem', marginBlockStart: '0.2rem' }}>
            <div className="inset-panel" style={{ padding: '0.52rem 0.7rem' }}>
              <div className="muted" style={{ fontSize: '0.72rem' }}>Carbohidratos</div>
              <div className="mono" style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--accent)' }}>
                <AnimatedNumber value={todayMacros.carbsGrams} suffix=" g" />
              </div>
            </div>
            <div className="inset-panel" style={{ padding: '0.52rem 0.7rem' }}>
              <div className="muted" style={{ fontSize: '0.72rem' }}>Proteínas</div>
              <div className="mono" style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--pine)' }}>
                <AnimatedNumber value={todayMacros.proteinGrams} suffix=" g" />
              </div>
            </div>
            <div className="inset-panel" style={{ padding: '0.52rem 0.7rem' }}>
              <div className="muted" style={{ fontSize: '0.72rem' }}>Grasas · Agua</div>
              <div className="mono" style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--cobalt)' }}>
                {todayMacros.fatsGrams} g · {todayMacros.hydrationLiters} L
              </div>
            </div>
          </div>
        </SpotlightCard>
      </div>

      {/* SITIO ESPECÍFICO DE RUTINA INTERACTIVA */}
      <TodayRoutineModal
        open={routineModalOpen}
        workout={todayWorkout}
        profile={profile}
        onConfigureRoutine={onConfigureTodayRoutine}
        onSaveUpdatedWorkout={onSaveUpdatedWorkout}
        onClose={() => setRoutineModalOpen(false)}
        onStartTimer={onStartTimer}
        onCompleteWorkout={onCompleteWorkout}
      />
    </div>
  );
}
