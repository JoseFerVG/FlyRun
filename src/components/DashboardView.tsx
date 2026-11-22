import { useEffect, useState } from 'react';
import {
  ArrowsClockwise,
  Bicycle,
  CalendarBlank,
  CheckCircle,
  CookingPot,
  Footprints,
  Heartbeat,
  PersonSimpleRun,
  PlusCircle,
  SoccerBall,
  Timer,
  Trophy,
} from '@phosphor-icons/react';
import type {
  CardioModality,
  GoogleFitDay,
  MacroRecommendation,
  UserProfile,
  WorkoutSession,
} from '../types/fitness';
import {
  calculateWeekly8020Balance,
  getModalityLabel,
  type DailyReadiness,
} from '../services/scienceEngine';
import { WorkoutVisualBar } from './WorkoutVisualBar';
import { AnimatedNumber, SpotlightCard } from './MotionPrimitives';
import { assetUrl } from '../services/assets';

function getSessionBannerPhoto(workout?: WorkoutSession): { src: string; alt: string; badge: string } {
  if (!workout) {
    return {
      src: assetUrl('images/modality-active-walk.jpg'),
      alt: 'Caminata activa al aire libre',
      badge: 'Descanso activo',
    };
  }
  if (workout.isExamDay || workout.sessionType === 'physical_exam') {
    return {
      src: assetUrl('images/exam-track-400m.jpg'),
      alt: 'Calles numeradas de pista de atletismo de 400 metros',
      badge: 'Examen oficial',
    };
  }
  if (workout.modality === 'cycling') {
    return {
      src: assetUrl('images/cardio-road-cycling.jpg'),
      alt: 'Ciclista rodando en carretera',
      badge: 'Ciclismo equivalente',
    };
  }
  if (workout.modality === 'soccer') {
    return {
      src: assetUrl('images/cardio-soccer-pitch.jpg'),
      alt: 'Partido de fútbol en campo de césped',
      badge: 'Fútbol intermitente',
    };
  }
  if (workout.modality === 'walking' || workout.sessionType === 'rest') {
    return {
      src: assetUrl('images/modality-active-walk.jpg'),
      alt: 'Persona caminando a paso activo en parque',
      badge: 'Caminata y pasos',
    };
  }
  if (workout.sessionType === 'intervals_z4' || workout.sessionType === 'threshold_z3') {
    return {
      src: assetUrl('images/hero-track-runner.jpg'),
      alt: 'Corredores entrenando series en pista de atletismo',
      badge: 'Calidad 20%',
    };
  }
  return {
    src: assetUrl('images/modality-running-road.jpg'),
    alt: 'Corredores entrenando rodaje aeróbico en asfalto',
    badge: 'Base aeróbica 80%',
  };
}

interface DashboardViewProps {
  profile: UserProfile;
  workouts: WorkoutSession[];
  todayWorkout?: WorkoutSession;
  tomorrowWorkout?: WorkoutSession;
  fitDays: GoogleFitDay[];
  todayMacros: MacroRecommendation;
  fitSyncLoading: boolean;
  fitNotice: string | null;
  readiness: DailyReadiness;
  onReadinessChange: (r: DailyReadiness) => void;
  onStartTimer: (workout: WorkoutSession) => void;
  onCompleteWorkout: (workout: WorkoutSession) => void;
  onLogExtraActivity: () => void;
  onSwapTodayModality: (workoutId: string, modality: CardioModality) => void;
  onChangeCaCoRatio: (workoutId: string, runMin: number, walkMin: number) => void;
  onSyncGoogleFit: () => void;
  onManualStepsUpdate: (steps: number) => void;
  onNavigate: (tab: 'dashboard' | 'calendar' | 'stats' | 'strategies' | 'nutrition') => void;
}

export function DashboardView({
  profile,
  workouts,
  todayWorkout,
  tomorrowWorkout,
  fitDays,
  todayMacros,
  fitSyncLoading,
  fitNotice,
  readiness,
  onReadinessChange,
  onStartTimer,
  onCompleteWorkout,
  onLogExtraActivity,
  onSwapTodayModality,
  onChangeCaCoRatio,
  onSyncGoogleFit,
  onManualStepsUpdate,
  onNavigate,
}: DashboardViewProps) {
  const fitToday = fitDays[fitDays.length - 1];
  const [stepsInput, setStepsInput] = useState(fitToday?.steps ?? profile.dailyStepsTarget);
  useEffect(() => {
    setStepsInput(fitToday?.steps ?? profile.dailyStepsTarget);
  }, [fitToday?.steps, profile.dailyStepsTarget]);
  const stepsPct = Math.min(100, Math.round(((fitToday?.steps ?? 0) / Math.max(1000, profile.dailyStepsTarget)) * 100));
  const balance8020 = calculateWeekly8020Balance(workouts);

  return (
    <div className="stack-lg">
      <div className="grid-2">
        <SpotlightCard staggerIndex={1} className="stack-md" aria-label="Rutina de Hoy">
          <div className="row-between">
            <span className="pill pill-amber">Hoy · {todayWorkout?.strategyTag ?? 'Descanso'}</span>
            {todayWorkout?.completed ? (
              <span className="pill pill-emerald">
                <CheckCircle size={14} weight="duotone" aria-hidden="true" />
                Completada
              </span>
            ) : (
              <span className="pill mono">
                <AnimatedNumber value={todayWorkout?.cardioPoints ?? 0} suffix=" Puntos Cardio" />
              </span>
            )}
          </div>

          {todayWorkout ? (
            <>
              {(() => {
                const photo = getSessionBannerPhoto(todayWorkout);
                return (
                  <div className="editorial-photo-banner" style={{ blockSize: '138px' }}>
                    <img
                      src={photo.src}
                      alt={photo.alt}
                      width={1200}
                      height={420}
                      fetchPriority="high"
                      className="editorial-photo-img"
                    />
                    <div className="editorial-photo-scrim">
                      <span className="editorial-photo-caption">{photo.badge}</span>
                      <span className="pill mono">{todayWorkout.targetZone}</span>
                    </div>
                  </div>
                );
              })()}

              <div>
                <h2 style={{ margin: 0, fontSize: '1.22rem', letterSpacing: '-0.02em' }}>{todayWorkout.title}</h2>
                <p className="muted" style={{ margin: '0.2rem 0 0', fontSize: '0.86rem' }}>
                  {todayWorkout.subtitle}
                </p>
              </div>

              {/* Check-in diario de fatiga / sensaciones */}
              {!todayWorkout.completed && todayWorkout.sessionType !== 'rest' && (
                <div className="inset-panel stack-sm" style={{ padding: '0.62rem 0.78rem' }}>
                  <div className="row-between">
                    <span className="muted" style={{ fontSize: '0.76rem', fontWeight: 600 }}>
                      ¿Cómo te sientes hoy antes de salir?
                    </span>
                    <div className="segmented-group" role="group" aria-label="Estado de fatiga diaria">
                      {(
                        [
                          { id: 'fresh', label: 'Fresco' },
                          { id: 'normal', label: 'Normal' },
                          { id: 'tired', label: 'Piernas cargadas' },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          aria-pressed={readiness === opt.id}
                          className="segmented-btn is-accent"
                          onClick={() => onReadinessChange(opt.id)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <WorkoutVisualBar blocks={todayWorkout.blocks} />

              <div className="grid-3" style={{ gap: '0.6rem' }}>
                <div className="inset-panel" style={{ padding: '0.6rem 0.75rem' }}>
                  <div className="muted" style={{ fontSize: '0.72rem' }}>Duración</div>
                  <div className="mono" style={{ fontWeight: 700, fontSize: '1.02rem' }}>
                    <AnimatedNumber value={todayWorkout.durationMinutes} suffix=" min" />
                  </div>
                </div>
                <div className="inset-panel" style={{ padding: '0.6rem 0.75rem' }}>
                  <div className="muted" style={{ fontSize: '0.72rem' }}>Zona / Ritmo</div>
                  <div className="mono" style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    {todayWorkout.targetZone} · {todayWorkout.targetPace}
                  </div>
                </div>
                <div className="inset-panel" style={{ padding: '0.6rem 0.75rem' }}>
                  <div className="muted" style={{ fontSize: '0.72rem' }}>Carga metabólica</div>
                  <div className="mono" style={{ fontWeight: 700, fontSize: '1.02rem' }}>
                    <AnimatedNumber value={todayWorkout.metMinutes} suffix=" MET-m" />
                  </div>
                </div>
              </div>

              {todayWorkout.sessionType === 'caco' && !todayWorkout.completed && (
                <div className="row-between">
                  <span className="muted" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                    Proporción CaCo:
                  </span>
                  <div className="segmented-group" role="group" aria-label="Proporción correr y andar">
                    {[
                      [2, 6],
                      [3, 5],
                      [4, 4],
                      [5, 2],
                    ].map(([r, w]) => {
                      const activeRatio = todayWorkout.strategyTag.includes(`${r}'/${w}'`);
                      return (
                        <button
                          key={`${r}-${w}`}
                          type="button"
                          aria-pressed={activeRatio}
                          className="segmented-btn is-accent mono"
                          onClick={() => onChangeCaCoRatio(todayWorkout.id, r, w)}
                        >
                          {r}&apos; / {w}&apos;
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="stack-sm">
                {todayWorkout.blocks.map((block, idx) => (
                  <div
                    key={`${block.label}-${idx}`}
                    className="inset-panel"
                    style={{ padding: '0.65rem 0.85rem' }}
                  >
                    <div className="row-between">
                      <strong style={{ fontSize: '0.88rem' }}>{block.label}</strong>
                      <span className="pill mono" style={{ fontSize: '0.72rem' }}>
                        {block.durationMinutes} min · {block.zone}
                      </span>
                    </div>
                    <div style={{ color: 'var(--accent)', fontSize: '0.78rem', fontWeight: 600 }}>{block.intensity}</div>
                    <p className="muted" style={{ margin: '0.2rem 0 0', fontSize: '0.8rem' }}>
                      {block.description}
                    </p>
                  </div>
                ))}
              </div>

              {!todayWorkout.completed && todayWorkout.sessionType !== 'rest' && (
                <div className="stack-sm">
                  <div className="muted" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                    Cambiar modalidad hoy manteniendo equivalencia de carga:
                  </div>
                  <div className="segmented-group" role="group" aria-label="Modalidad alternativa de hoy">
                    <button
                      type="button"
                      aria-pressed={todayWorkout.modality === 'running'}
                      className="segmented-btn is-accent"
                      onClick={() => onSwapTodayModality(todayWorkout.id, 'running')}
                    >
                      <PersonSimpleRun size={14} weight="duotone" aria-hidden="true" />
                      Running
                    </button>
                    <button
                      type="button"
                      aria-pressed={todayWorkout.modality === 'cycling'}
                      className="segmented-btn is-accent"
                      onClick={() => onSwapTodayModality(todayWorkout.id, 'cycling')}
                    >
                      <Bicycle size={14} weight="duotone" aria-hidden="true" />
                      Bicicleta
                    </button>
                    <button
                      type="button"
                      aria-pressed={todayWorkout.modality === 'soccer'}
                      className="segmented-btn is-accent"
                      onClick={() => onSwapTodayModality(todayWorkout.id, 'soccer')}
                    >
                      <SoccerBall size={14} weight="duotone" aria-hidden="true" />
                      Partido de fútbol
                    </button>
                  </div>
                </div>
              )}

              <div className="row-between">
                <span className="muted" style={{ fontSize: '0.8rem' }}>
                  Modalidad: <strong>{getModalityLabel(todayWorkout.modality)}</strong>
                </span>
                <div className="row-wrap">
                  {!todayWorkout.completed && todayWorkout.blocks.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => onStartTimer(todayWorkout)}
                    >
                      <Timer size={15} weight="duotone" aria-hidden="true" />
                      Cronómetro guiado
                    </button>
                  )}
                  <button
                    type="button"
                    className={`btn ${todayWorkout.completed ? 'btn-secondary' : 'btn-emerald'}`}
                    onClick={() => onCompleteWorkout(todayWorkout)}
                  >
                    <CheckCircle size={17} weight="duotone" aria-hidden="true" />
                    {todayWorkout.completed ? 'Editar registro' : 'Completar sesión'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <p className="muted">No hay sesión registrada para hoy.</p>
          )}
        </SpotlightCard>

        <div className="stack-md">
          <SpotlightCard staggerIndex={2} className="stack-md" aria-label="Rutina de Mañana">
            <div className="row-between">
              <span className="pill pill-cyan">
                <CalendarBlank size={14} weight="duotone" aria-hidden="true" />
                Mañana
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => onNavigate('calendar')}
              >
                Ver calendario completo
              </button>
            </div>

            {tomorrowWorkout ? (
              <>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.12rem', letterSpacing: '-0.015em' }}>{tomorrowWorkout.title}</h2>
                  <p className="muted" style={{ margin: '0.2rem 0 0', fontSize: '0.85rem' }}>
                    {tomorrowWorkout.subtitle}
                  </p>
                </div>

                <WorkoutVisualBar blocks={tomorrowWorkout.blocks} />

                <div className="row-wrap">
                  <span className="pill mono">{tomorrowWorkout.durationMinutes} min</span>
                  <span className="pill mono">{tomorrowWorkout.targetPace}</span>
                  <span className="pill pill-emerald mono">{tomorrowWorkout.cardioPoints} Puntos Cardio</span>
                </div>

                <p className="inset-panel secondary" style={{ margin: 0, fontSize: '0.84rem' }}>
                  <strong>Criterio de mañana:</strong> {tomorrowWorkout.coachTip}
                </p>
              </>
            ) : null}
          </SpotlightCard>

          {/* Balance 80/20 semanal + actividad libre */}
          <SpotlightCard staggerIndex={3} className="stack-sm" aria-label="Balance semanal 80/20">
            <div className="row-between">
              <div className="row-wrap">
                <span className="duotone-icon-box is-pine" style={{ inlineSize: '30px', blockSize: '30px' }}>
                  <Heartbeat size={16} weight="duotone" aria-hidden="true" />
                </span>
                <h2 style={{ margin: 0, fontSize: '1.02rem' }}>Balance semanal 80/20</h2>
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={onLogExtraActivity}>
                <PlusCircle size={15} weight="duotone" aria-hidden="true" />
                Registrar actividad libre
              </button>
            </div>

            <div className="row-between" style={{ fontSize: '0.8rem' }}>
              <span className="mono" style={{ color: 'var(--pine)', fontWeight: 600 }}>
                Suave Z1-Z2: {balance8020.lowPct}% ({balance8020.lowMinutes} min)
              </span>
              <span className="mono" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                Intenso Z3-Z5: {balance8020.highPct}% ({balance8020.highMinutes} min)
              </span>
            </div>

            <div className="split-8020-track" aria-label="Proporción semanal baja vs alta intensidad">
              <div className="split-8020-low" style={{ inlineSize: `${balance8020.lowPct}%` }} />
              <div className="split-8020-high" style={{ inlineSize: `${balance8020.highPct}%` }} />
            </div>
          </SpotlightCard>

          <SpotlightCard staggerIndex={4} className="stack-md" aria-label="Integración Google Fit">
            <div className="row-between">
              <div className="row-wrap">
                <span className="duotone-icon-box is-pine">
                  <Footprints size={18} weight="duotone" aria-hidden="true" />
                </span>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Google Fit · Pasos diarios</h2>
                  <div className="muted" style={{ fontSize: '0.78rem' }}>
                    Meta diaria: {profile.dailyStepsTarget.toLocaleString('es-ES')} pasos ({profile.weeklyWalkGoalSessions} días/sem)
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onSyncGoogleFit}
                disabled={fitSyncLoading}
              >
                <ArrowsClockwise size={15} weight="duotone" aria-hidden="true" />
                {fitSyncLoading ? 'Sincronizando…' : 'Sincronizar Google Fit'}
              </button>
            </div>

            <div className="row-between">
              <div>
                <div className="kpi-value" style={{ color: 'var(--pine)' }}>
                  <AnimatedNumber value={fitToday?.steps ?? 0} locale />{' '}
                  <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>pasos</span>
                </div>
                <div className="muted" style={{ fontSize: '0.8rem' }}>
                  {((fitToday?.distanceMeters ?? 0) / 1000).toFixed(2)} km caminados · {fitToday?.calories ?? 0} kcal activas
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
                paddingBlockStart: '0.35rem',
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

            <div className="row-wrap">
              <label htmlFor="manual-fit-steps" className="sr-only">
                Pasos diarios de hoy
              </label>
              <input
                id="manual-fit-steps"
                name="manualFitSteps"
                type="number"
                inputMode="numeric"
                className="input mono"
                style={{ inlineSize: '140px', padding: '0.4rem 0.65rem' }}
                min={0}
                max={50000}
                step={1}
                value={stepsInput}
                onChange={(e) => setStepsInput(Number(e.target.value))}
              />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => onManualStepsUpdate(stepsInput)}
              >
                Actualizar pasos de hoy
              </button>
              {fitNotice && <span className="muted" style={{ fontSize: '0.76rem' }}>{fitNotice}</span>}
            </div>
          </SpotlightCard>
        </div>
      </div>

      <div className="grid-2">
        <SpotlightCard staggerIndex={5} className="stack-sm">
          <div className="row-between">
            <div className="row-wrap">
              <span className="duotone-icon-box" style={{ inlineSize: '30px', blockSize: '30px' }}>
                <CookingPot size={16} weight="duotone" aria-hidden="true" />
              </span>
              <h2 style={{ margin: 0, fontSize: '1.02rem' }}>Nutrición recomendada hoy (macros)</h2>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('nutrition')}>
              Ver reparto por comidas
            </button>
          </div>
          <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>
            {todayMacros.dayTypeLabel} · Estimación diaria:{' '}
            <strong className="mono">
              <AnimatedNumber value={todayMacros.calories} locale suffix=" kcal" />
            </strong>
          </p>
          <div className="grid-3" style={{ gap: '0.6rem', marginBlockStart: '0.25rem' }}>
            <div className="inset-panel" style={{ padding: '0.6rem 0.75rem' }}>
              <div className="muted" style={{ fontSize: '0.72rem' }}>Carbohidratos</div>
              <div className="mono" style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent)' }}>
                <AnimatedNumber value={todayMacros.carbsGrams} suffix=" g" />
              </div>
              <div className="muted mono" style={{ fontSize: '0.72rem' }}>{todayMacros.carbsPerKg} g/kg</div>
            </div>
            <div className="inset-panel" style={{ padding: '0.6rem 0.75rem' }}>
              <div className="muted" style={{ fontSize: '0.72rem' }}>Proteínas</div>
              <div className="mono" style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--pine)' }}>
                <AnimatedNumber value={todayMacros.proteinGrams} suffix=" g" />
              </div>
              <div className="muted mono" style={{ fontSize: '0.72rem' }}>{todayMacros.proteinPerKg} g/kg</div>
            </div>
            <div className="inset-panel" style={{ padding: '0.6rem 0.75rem' }}>
              <div className="muted" style={{ fontSize: '0.72rem' }}>Grasas</div>
              <div className="mono" style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--cobalt)' }}>
                <AnimatedNumber value={todayMacros.fatsGrams} suffix=" g" />
              </div>
              <div className="muted mono" style={{ fontSize: '0.72rem' }}>Agua: {todayMacros.hydrationLiters} L</div>
            </div>
          </div>
        </SpotlightCard>

        <SpotlightCard staggerIndex={6} className="stack-sm">
          <div className="row-between">
            <div className="row-wrap">
              <span className="duotone-icon-box" style={{ inlineSize: '30px', blockSize: '30px' }}>
                <Trophy size={16} weight="duotone" aria-hidden="true" />
              </span>
              <h2 style={{ margin: 0, fontSize: '1.02rem' }}>Progreso y constancia</h2>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('stats')}>
              Marcas, zonas y examen
            </button>
          </div>
          <div className="grid-3" style={{ gap: '0.6rem', marginBlockStart: '0.25rem' }}>
            <div className="inset-panel" style={{ padding: '0.6rem 0.75rem' }}>
              <div className="muted" style={{ fontSize: '0.72rem' }}>Puntos Cardio</div>
              <div className="mono" style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                <AnimatedNumber value={profile.totalCardioPoints} locale />
              </div>
            </div>
            <div className="inset-panel" style={{ padding: '0.6rem 0.75rem' }}>
              <div className="muted" style={{ fontSize: '0.72rem' }}>Logros</div>
              <div className="mono" style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--amber-zone)' }}>
                {profile.unlockedBadges.length} / 8
              </div>
            </div>
            <div className="inset-panel" style={{ padding: '0.6rem 0.75rem' }}>
              <div className="muted" style={{ fontSize: '0.72rem' }}>Plan semanal</div>
              <div className="mono" style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                {profile.trainingDaysPerWeek} días/sem
              </div>
            </div>
          </div>
          <p className="muted" style={{ margin: '0.2rem 0 0', fontSize: '0.8rem' }}>
            Cada sesión registrada ajusta progresivamente tu VDOT según la sensación de esfuerzo (RPE).
          </p>
        </SpotlightCard>
      </div>
    </div>
  );
}
