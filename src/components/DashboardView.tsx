import { useEffect, useState } from 'react';
import {
  ArrowsClockwise,
  Bicycle,
  CalendarBlank,
  CheckCircle,
  CookingPot,
  Footprints,
  Lightning,
  PersonSimpleRun,
  PlugsConnected,
  SoccerBall,
  Sparkle,
  Target,
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
  POWER_LEVEL_CATALOG,
  REST_LEVEL_CATALOG,
  calculateTrainingZones,
  getGoalLabel,
  getRecommendedPowerForRest,
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
  if (workout.isExamDay || workout.sessionType === 'physical_exam') {
    return {
      src: assetUrl('images/exam-track-400m.jpg'),
      alt: 'Pista de atletismo para examen de nivel',
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
  onStartTimer: (workout: WorkoutSession, startBlockIndex?: number) => void;
  onCompleteWorkout: (workout: WorkoutSession) => void;
  onSyncPlatforms: () => void;
  onOpenConnections: () => void;
  onOpenGoalModal: () => void;
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
  onStartTimer,
  onCompleteWorkout,
  onSyncPlatforms,
  onOpenConnections,
  onOpenGoalModal,
  onNavigate,
}: DashboardViewProps) {
  const fitToday = fitDays[fitDays.length - 1];
  const [inspectedBlockIdx, setInspectedBlockIdx] = useState<number | undefined>(undefined);

  const [restLevel, setRestLevel] = useState<RestLevel>('normal_rest');
  const recommendation = getRecommendedPowerForRest(restLevel, profile);
  const [selectedPower, setSelectedPower] = useState<RoutinePowerLevel>(recommendation.recommendedPower);
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [selectedModality, setSelectedModality] = useState<CardioModality>(
    todayWorkout?.modality && todayWorkout.modality !== 'swimming' ? todayWorkout.modality : 'running'
  );
  const [routineModalOpen, setRoutineModalOpen] = useState(false);

  useEffect(() => {
    const rec = getRecommendedPowerForRest(restLevel, profile);
    setSelectedPower(rec.recommendedPower);
  }, [profile.preferredStrategy, profile.level]);

  const zones = calculateTrainingZones(profile.vdot, profile.maxHR, profile.restHR);
  const todayZoneInfo = zones.find((z) => z.id === todayWorkout?.targetZone) ?? zones[0];
  const stepsPct = Math.min(100, Math.round(((fitToday?.steps ?? 0) / Math.max(1000, profile.dailyStepsTarget)) * 100));
  const focusInfo = getTrainingFocusInfo(profile.preferredStrategy);

  const activePlatformNames = SIMPLE_PLATFORMS.filter((p) =>
    connectedPlatforms.includes(p.id)
  ).map((p) => p.name);

  const handlePickRest = (nextRest: RestLevel) => {
    setRestLevel(nextRest);
    const rec = getRecommendedPowerForRest(nextRest, profile);
    setSelectedPower(rec.recommendedPower);
    if (!todayWorkout?.completed) {
      onConfigureTodayRoutine(rec.recommendedPower, selectedDuration, selectedModality, nextRest);
    }
  };

  const handlePickPower = (nextPower: RoutinePowerLevel) => {
    setSelectedPower(nextPower);
    if (!todayWorkout?.completed) {
      onConfigureTodayRoutine(nextPower, selectedDuration, selectedModality, restLevel);
    }
  };

  const handlePickDuration = (dur: number) => {
    setSelectedDuration(dur);
    if (!todayWorkout?.completed) {
      onConfigureTodayRoutine(selectedPower, dur, selectedModality, restLevel);
    }
  };

  const handlePickModality = (mod: CardioModality) => {
    setSelectedModality(mod);
    if (!todayWorkout?.completed) {
      onConfigureTodayRoutine(selectedPower, selectedDuration, mod, restLevel);
    }
  };

  const handleOpenTodayRoutine = () => {
    if (!todayWorkout?.completed) {
      onConfigureTodayRoutine(selectedPower, selectedDuration, selectedModality, restLevel);
    }
    setRoutineModalOpen(true);
  };

  return (
    <div className="stack-lg">
      <div className="grid-2">
        {/* COLUMNA PRINCIPAL: CONFIGURADOR INTUITIVO "QUIERO ENTRENAR HOY" */}
        <SpotlightCard staggerIndex={0} className="lovable-hero-card stack-md" aria-label="Configurador Entrenar Hoy">
          <div className="row-between">
            <div className="row-wrap" style={{ gap: '0.4rem' }}>
              <span className="pill lovable-badge">
                <Sparkle size={13} weight="duotone" aria-hidden="true" />
                Entrenamiento de Hoy
              </span>
              <span className="pill pill-emerald" style={{ fontSize: '0.72rem' }}>
                {focusInfo.shortLabel}
              </span>
            </div>

            <button type="button" className="btn btn-ghost btn-sm" onClick={onOpenGoalModal}>
              <Target size={14} weight="duotone" aria-hidden="true" />
              {getGoalLabel(profile.goal).split(' ')[0]}
            </button>
          </div>

          {todayWorkout ? (
            <>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', letterSpacing: '-0.025em', fontWeight: 800 }}>
                  {todayWorkout.completed
                    ? `¡Sesión completada! ${todayWorkout.title}`
                    : '¿Listo para entrenar hoy?'}
                </h2>
                <p className="muted" style={{ margin: '0.2rem 0 0', fontSize: '0.84rem' }}>
                  {todayWorkout.completed
                    ? 'Buen trabajo. Puedes editar tu registro si quieres añadir notas.'
                    : 'Elige cómo has descansado y la potencia que te apetece hoy.'}
                </p>
              </div>

              {!todayWorkout.completed && (
                <>
                  {/* PASO 1: ¿Cuánto has descansado? */}
                  <div className="stack-sm">
                    <div className="row-between">
                      <strong style={{ fontSize: '0.85rem' }}>1. ¿Cómo has descansado?</strong>
                      <span className="pill mono" style={{ fontSize: '0.72rem' }}>
                        Recuperación: {recommendation.recoveryScore}%
                      </span>
                    </div>
                    <div className="lovable-choice-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
                      {REST_LEVEL_CATALOG.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          aria-pressed={restLevel === item.id}
                          className="lovable-choice-card"
                          style={{ padding: '0.45rem' }}
                          onClick={() => handlePickRest(item.id)}
                        >
                          <div className="lovable-choice-thumb" style={{ blockSize: '54px' }}>
                            <img src={assetUrl(item.imageFile)} alt="" loading="lazy" />
                          </div>
                          <strong style={{ fontSize: '0.79rem', lineHeight: 1.2 }}>{item.label}</strong>
                          <span className="muted" style={{ fontSize: '0.68rem', lineHeight: 1.2 }}>{item.sleepHint}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* RECOMENDACIÓN SEGÚN DESCANSO */}
                  <div
                    className="inset-panel row-between"
                    style={{
                      borderColor: 'var(--pine-border)',
                      background: 'var(--pine-soft)',
                      padding: '0.6rem 0.85rem',
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', flex: '1 1 240px' }}>
                      <strong style={{ color: 'var(--pine)' }}>
                        <Lightning size={14} weight="duotone" style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} aria-hidden="true" />
                        Recomendada hoy · Potencia {recommendation.recommendedPower}/5:
                      </strong>{' '}
                      <span className="secondary">{recommendation.reason}</span>
                    </div>
                    {selectedPower !== recommendation.recommendedPower && (
                      <button
                        type="button"
                        className="btn btn-emerald btn-sm"
                        onClick={() => handlePickPower(recommendation.recommendedPower)}
                      >
                        Aplicar
                      </button>
                    )}
                  </div>

                  {/* PASO 2: POTENCIA DE LA RUTINA */}
                  <div className="stack-sm">
                    <strong style={{ fontSize: '0.85rem' }}>2. Potencia de la rutina</strong>
                    <div className="lovable-power-grid">
                      {POWER_LEVEL_CATALOG.map((p) => {
                        const isRec = p.power === recommendation.recommendedPower;
                        const zInfo = zones.find((z) => z.id === p.zone) ?? zones[0];
                        return (
                          <button
                            key={p.power}
                            type="button"
                            aria-pressed={selectedPower === p.power}
                            className={`lovable-power-card ${isRec ? 'is-recommended' : ''}`}
                            onClick={() => handlePickPower(p.power)}
                          >
                            <div className="row-between" style={{ gap: '0.25rem' }}>
                              <div className="power-bars" aria-hidden="true">
                                {[1, 2, 3, 4, 5].map((bar) => (
                                  <span
                                    key={bar}
                                    className={`power-bar-pip ${bar <= p.power ? 'is-active' : ''}`}
                                    style={{ blockSize: `${5 + bar * 2}px` }}
                                  />
                                ))}
                              </div>
                              {isRec && (
                                <span className="pill pill-emerald" style={{ fontSize: '0.62rem', padding: '0.06rem 0.38rem' }}>
                                  ★ Recom.
                                </span>
                              )}
                            </div>
                            <strong style={{ fontSize: '0.8rem', lineHeight: 1.2 }}>{p.name}</strong>
                            <span className="mono muted" style={{ fontSize: '0.68rem' }}>
                              {zInfo.speedKmhFormatted}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* PASO 3: DEPORTE Y DURACIÓN */}
                  <div className="inset-panel stack-sm" style={{ padding: '0.65rem 0.85rem' }}>
                    <div className="row-between">
                      <span className="muted" style={{ fontSize: '0.78rem', fontWeight: 600 }}>Deporte hoy</span>
                      <div className="segmented-group" role="group" aria-label="Elegir deporte de hoy">
                        <button
                          type="button"
                          aria-pressed={selectedModality === 'running'}
                          className="segmented-btn is-accent"
                          onClick={() => handlePickModality('running')}
                        >
                          <PersonSimpleRun size={14} weight="duotone" aria-hidden="true" />
                          Running
                        </button>
                        <button
                          type="button"
                          aria-pressed={selectedModality === 'cycling'}
                          className="segmented-btn is-accent"
                          onClick={() => handlePickModality('cycling')}
                        >
                          <Bicycle size={14} weight="duotone" aria-hidden="true" />
                          Bici
                        </button>
                        <button
                          type="button"
                          aria-pressed={selectedModality === 'soccer'}
                          className="segmented-btn is-accent"
                          onClick={() => handlePickModality('soccer')}
                        >
                          <SoccerBall size={14} weight="duotone" aria-hidden="true" />
                          Fútbol
                        </button>
                        <button
                          type="button"
                          aria-pressed={selectedModality === 'walking'}
                          className="segmented-btn is-accent"
                          onClick={() => handlePickModality('walking')}
                        >
                          <Footprints size={14} weight="duotone" aria-hidden="true" />
                          Caminar
                        </button>
                      </div>
                    </div>

                    <div className="row-between">
                      <span className="muted" style={{ fontSize: '0.78rem', fontWeight: 600 }}>Duración</span>
                      <div className="segmented-group" role="group" aria-label="Duración en minutos">
                        {[20, 30, 45, 60].map((mins) => (
                          <button
                            key={mins}
                            type="button"
                            aria-pressed={selectedDuration === mins}
                            className="segmented-btn is-accent mono"
                            onClick={() => handlePickDuration(mins)}
                          >
                            {mins} min
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {(() => {
                const photo = getSessionBannerPhoto(todayWorkout);
                return (
                  <div className="editorial-photo-banner" style={{ blockSize: '116px' }}>
                    <img
                      src={photo.src}
                      alt={photo.alt}
                      width={1200}
                      height={420}
                      fetchPriority="high"
                      className="editorial-photo-img"
                    />
                    <div className="editorial-photo-scrim">
                      <div>
                        <span className="editorial-photo-caption" style={{ display: 'block', fontSize: '0.94rem' }}>
                          {todayWorkout.title}
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.75rem' }}>
                          {todayWorkout.blocks.length} fases · {todayZoneInfo.speedKmhFormatted} · ~{todayWorkout.targetDistanceKm} km
                        </span>
                      </div>
                      <span className="pill mono">{todayWorkout.durationMinutes} min</span>
                    </div>
                  </div>
                );
              })()}

              <WorkoutVisualBar
                blocks={todayWorkout.blocks}
                activeBlockIndex={inspectedBlockIdx}
                onSelectBlock={(idx) => setInspectedBlockIdx((prev) => (prev === idx ? undefined : idx))}
              />

              <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
                {!todayWorkout.completed ? (
                  <button
                    type="button"
                    className="btn lovable-cta-btn"
                    style={{ flex: '1 1 220px', minBlockSize: '46px', fontSize: '0.94rem' }}
                    onClick={handleOpenTodayRoutine}
                  >
                    <PersonSimpleRun size={19} weight="duotone" aria-hidden="true" />
                    ¡Quiero entrenar hoy! · Abrir rutina
                  </button>
                ) : null}

                {!todayWorkout.completed && todayWorkout.blocks.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ flex: '0 1 auto', minBlockSize: '46px' }}
                    onClick={() => onStartTimer(todayWorkout, inspectedBlockIdx ?? 0)}
                  >
                    <Timer size={17} weight="duotone" aria-hidden="true" />
                    Crono directo
                  </button>
                )}

                <button
                  type="button"
                  className={`btn ${todayWorkout.completed ? 'btn-secondary' : 'btn-emerald'}`}
                  style={{ flex: '0 1 auto', minBlockSize: '46px' }}
                  onClick={() => onCompleteWorkout(todayWorkout)}
                >
                  <CheckCircle size={17} weight="duotone" aria-hidden="true" />
                  {todayWorkout.completed ? 'Editar registro' : 'Completar'}
                </button>
              </div>
            </>
          ) : (
            <p className="muted">No hay sesión registrada para hoy.</p>
          )}
        </SpotlightCard>

        {/* COLUMNA DERECHA: PLATAFORMAS (1 CLIC) + MAÑANA + NUTRICIÓN */}
        <div className="stack-md">
          <SpotlightCard staggerIndex={1} className="stack-md" aria-label="Actividad diaria y plataformas">
            <div className="row-between">
              <div className="row-wrap">
                <span className="duotone-icon-box is-pine">
                  <Footprints size={18} weight="duotone" aria-hidden="true" />
                </span>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Actividad y Plataformas</h2>
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
                  {((fitToday?.distanceMeters ?? 0) / 1000).toFixed(2)} km · {fitToday?.calories ?? 0} kcal · {fitToday?.activeMinutes ?? 0} min
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
                blockSize: '54px',
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

          <SpotlightCard staggerIndex={2} className="stack-md" aria-label="Rutina de Mañana">
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

                <WorkoutVisualBar blocks={tomorrowWorkout.blocks} />

                <div className="row-wrap">
                  <span className="pill mono">{tomorrowWorkout.durationMinutes} min</span>
                  <span className="pill mono">{tomorrowWorkout.targetPace}</span>
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
                <h2 style={{ margin: 0, fontSize: '1.02rem' }}>Nutrición hoy</h2>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('nutrition')}>
                Ver comidas
              </button>
            </div>
            <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>
              {todayMacros.dayTypeLabel} ·{' '}
              <strong className="mono">
                <AnimatedNumber value={todayMacros.calories} locale suffix=" kcal" />
              </strong>
            </p>
            <div className="grid-3" style={{ gap: '0.6rem', marginBlockStart: '0.25rem' }}>
              <div className="inset-panel" style={{ padding: '0.55rem 0.7rem' }}>
                <div className="muted" style={{ fontSize: '0.72rem' }}>Carbohidratos</div>
                <div className="mono" style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--accent)' }}>
                  <AnimatedNumber value={todayMacros.carbsGrams} suffix=" g" />
                </div>
              </div>
              <div className="inset-panel" style={{ padding: '0.55rem 0.7rem' }}>
                <div className="muted" style={{ fontSize: '0.72rem' }}>Proteínas</div>
                <div className="mono" style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--pine)' }}>
                  <AnimatedNumber value={todayMacros.proteinGrams} suffix=" g" />
                </div>
              </div>
              <div className="inset-panel" style={{ padding: '0.55rem 0.7rem' }}>
                <div className="muted" style={{ fontSize: '0.72rem' }}>Grasas · Agua</div>
                <div className="mono" style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--cobalt)' }}>
                  <AnimatedNumber value={todayMacros.fatsGrams} suffix=" g" />
                </div>
              </div>
            </div>
          </SpotlightCard>
        </div>
      </div>

      {/* MODAL ILUSTRADO DE LA RUTINA DE HOY */}
      <TodayRoutineModal
        open={routineModalOpen}
        workout={todayWorkout}
        profile={profile}
        powerLevel={selectedPower}
        recommendedPower={recommendation.recommendedPower}
        restLevel={restLevel}
        recommendationReason={recommendation.reason}
        onClose={() => setRoutineModalOpen(false)}
        onStartTimer={onStartTimer}
        onCompleteWorkout={onCompleteWorkout}
      />
    </div>
  );
}
