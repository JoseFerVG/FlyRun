import { useEffect, useState } from 'react';
import {
  ArrowsClockwise,
  Bicycle,
  CalendarBlank,
  CheckCircle,
  CloudArrowUp,
  CookingPot,
  Footprints,
  Heartbeat,
  Lightning,
  PersonSimpleRun,
  PlusCircle,
  SoccerBall,
  Sparkle,
  Target,
  Timer,
  Trophy,
  UploadSimple,
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
  calculateWeekly8020Balance,
  getGoalLabel,
  getRecommendedPowerForRest,
  getTrainingFocusInfo,
  type CustomRoutineConfig,
  type DailyReadiness,
  type RestLevel,
  type RoutinePowerLevel,
} from '../services/scienceEngine';
import { parseGoogleFitImportFile } from '../services/googleFit';
import { WorkoutVisualBar } from './WorkoutVisualBar';
import { AnimatedNumber, SpotlightCard } from './MotionPrimitives';
import { TodayRoutineModal } from './TodayRoutineModal';
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
  if (workout.sessionType === 'intervals_z4' || workout.targetZone === 'Z4' || workout.targetZone === 'Z5') {
    return {
      src: assetUrl('images/routine-intervals-vo2.jpg'),
      alt: 'Corredor realizando series rápidas en pista',
      badge: 'Potencia Alta / Series',
    };
  }
  if (workout.sessionType === 'threshold_z3' || workout.targetZone === 'Z3') {
    return {
      src: assetUrl('images/routine-tempo-threshold.jpg'),
      alt: 'Corredor entrenando a ritmo de umbral',
      badge: 'Umbral Sostenido',
    };
  }
  if (workout.sessionType === 'caco') {
    return {
      src: assetUrl('images/goal-start-caco.jpg'),
      alt: 'Corredora empezando con bloques CaCo en parque junto al agua',
      badge: 'Progresión CaCo',
    };
  }
  return {
    src: assetUrl('images/routine-easy-aerobic.jpg'),
    alt: 'Corredor entrenando rodaje aeróbico suave',
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
  hasGoogleFitOAuth: boolean;
  readiness: DailyReadiness;
  onReadinessChange: (r: DailyReadiness) => void;
  onConfigureTodayRoutine: (
    power: RoutinePowerLevel,
    durationMinutes: number,
    modality: CardioModality,
    restLevel: RestLevel
  ) => void;
  onStartTimer: (workout: WorkoutSession, startBlockIndex?: number) => void;
  onCompleteWorkout: (workout: WorkoutSession) => void;
  onLogExtraActivity: () => void;
  onSwapTodayModality: (workoutId: string, modality: CardioModality) => void;
  onChangeCaCoRatio: (workoutId: string, runMin: number, walkMin: number) => void;
  onCustomizeRoutine: (workoutId: string, config: CustomRoutineConfig) => void;
  onSyncGoogleFit: () => void;
  onManualStepsUpdate: (steps: number) => void;
  onUploadFitDays: (days: GoogleFitDay[], sourceLabel?: string) => void;
  onOpenGoalModal: () => void;
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
  hasGoogleFitOAuth,
  onConfigureTodayRoutine,
  onStartTimer,
  onCompleteWorkout,
  onLogExtraActivity,
  onCustomizeRoutine,
  onSyncGoogleFit,
  onManualStepsUpdate,
  onUploadFitDays,
  onOpenGoalModal,
  onNavigate,
}: DashboardViewProps) {
  const fitToday = fitDays[fitDays.length - 1];
  const [stepsInput, setStepsInput] = useState(fitToday?.steps ?? profile.dailyStepsTarget);
  const [livePedometerOn, setLivePedometerOn] = useState(false);
  const [inspectedBlockIdx, setInspectedBlockIdx] = useState<number | undefined>(undefined);

  // Intuitive Today Launcher State
  const [restLevel, setRestLevel] = useState<RestLevel>('normal_rest');
  const recommendation = getRecommendedPowerForRest(restLevel, profile);
  const [selectedPower, setSelectedPower] = useState<RoutinePowerLevel>(recommendation.recommendedPower);
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [selectedModality, setSelectedModality] = useState<CardioModality>(
    todayWorkout?.modality && todayWorkout.modality !== 'swimming' ? todayWorkout.modality : 'running'
  );
  const [routineModalOpen, setRoutineModalOpen] = useState(false);

  // Advanced / Custom routine panel (kept collapsed unless user asks)
  const [customOpen, setCustomOpen] = useState(false);
  const [customType, setCustomType] = useState<CustomRoutineConfig['presetType']>('caco');
  const [customRounds, setCustomRounds] = useState(4);
  const [customWorkMin, setCustomWorkMin] = useState(3);
  const [customRestMin, setCustomRestMin] = useState(3);

  // Google Fit Upload Center state
  const [fitUploadOpen, setFitUploadOpen] = useState(false);
  const [fitImportError, setFitImportError] = useState<string | null>(null);

  useEffect(() => {
    setStepsInput(fitToday?.steps ?? profile.dailyStepsTarget);
  }, [fitToday?.steps, profile.dailyStepsTarget]);

  useEffect(() => {
    const rec = getRecommendedPowerForRest(restLevel, profile);
    setSelectedPower(rec.recommendedPower);
  }, [profile.preferredStrategy, profile.level]);

  useEffect(() => {
    if (!livePedometerOn) return;
    let lastPeakAt = 0;
    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity ?? event.acceleration;
      if (!acc) return;
      const mag = Math.sqrt((acc.x ?? 0) ** 2 + (acc.y ?? 0) ** 2 + (acc.z ?? 0) ** 2);
      const now = Date.now();
      if (mag > 12.2 && now - lastPeakAt > 360) {
        lastPeakAt = now;
        onManualStepsUpdate((fitToday?.steps ?? 0) + 1);
      }
    };
    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [livePedometerOn, fitToday?.steps, onManualStepsUpdate]);

  const zones = calculateTrainingZones(profile.vdot, profile.maxHR, profile.restHR);
  const isRealOAuthConnected = hasGoogleFitOAuth && fitToday?.source === 'google_fit_api';
  const isSyncedRecently = isRealOAuthConnected || profile.unlockedBadges.includes('google_fit_sync') || fitDays.length > 0;
  const todayZoneInfo = zones.find((z) => z.id === todayWorkout?.targetZone) ?? zones[0];
  const stepsPct = Math.min(100, Math.round(((fitToday?.steps ?? 0) / Math.max(1000, profile.dailyStepsTarget)) * 100));
  const balance8020 = calculateWeekly8020Balance(workouts);
  const focusInfo = getTrainingFocusInfo(profile.preferredStrategy);

  const toggleLivePedometer = async () => {
    if (!livePedometerOn) {
      const dm = DeviceMotionEvent as unknown as { requestPermission?: () => Promise<'granted' | 'denied'> };
      if (typeof dm?.requestPermission === 'function') {
        try {
          const perm = await dm.requestPermission();
          if (perm !== 'granted') return;
        } catch {
          return;
        }
      }
    }
    setLivePedometerOn((v) => !v);
  };

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

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFitImportError(null);
    try {
      const text = await file.text();
      const parsedDays = parseGoogleFitImportFile(text);
      onUploadFitDays(parsedDays, `Archivo "${file.name}" (${parsedDays.length} días)`);
      setFitUploadOpen(false);
    } catch (err) {
      setFitImportError(err instanceof Error ? err.message : 'No se pudo leer el archivo de Google Fit.');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="stack-lg">
      <div className="grid-2">
        {/* COLUMNA PRINCIPAL: ASISTENTE "QUIERO ENTRENAR HOY" (ESTILO LOVABLE.DEV) */}
        <SpotlightCard staggerIndex={0} className="lovable-hero-card stack-md" aria-label="Configurador Entrenar Hoy">
          <div className="row-between">
            <div className="row-wrap" style={{ gap: '0.4rem' }}>
              <span className="pill lovable-badge">
                <Sparkle size={13} weight="duotone" aria-hidden="true" />
                Entrenamiento de Hoy
              </span>
              <span className="pill pill-emerald" style={{ fontSize: '0.72rem' }}>
                Enfoque: {focusInfo.shortLabel}
              </span>
            </div>

            <button type="button" className="btn btn-ghost btn-sm" onClick={onOpenGoalModal}>
              <Target size={14} weight="duotone" aria-hidden="true" />
              Cambiar meta ({getGoalLabel(profile.goal).split(' ')[0]})
            </button>
          </div>

          {todayWorkout ? (
            <>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.28rem', letterSpacing: '-0.025em', fontWeight: 800 }}>
                  {todayWorkout.completed
                    ? `¡Sesión completada! ${todayWorkout.title}`
                    : '¿Listo para entrenar hoy? Ajusta descanso y potencia'}
                </h2>
                <p className="muted" style={{ margin: '0.22rem 0 0', fontSize: '0.84rem' }}>
                  {todayWorkout.completed
                    ? 'Ya sumaste tus puntos cardio de hoy. Puedes editar el registro o revisar tu rutina.'
                    : 'Dinos cómo has dormido/descansado, elige la potencia y abre tu rutina guiada al instante.'}
                </p>
              </div>

              {!todayWorkout.completed && (
                <>
                  {/* PASO 1: ¿Cuánto has descansado? */}
                  <div className="stack-sm">
                    <div className="row-between">
                      <strong style={{ fontSize: '0.86rem' }}>1. ¿Cómo has descansado hoy?</strong>
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
                          <div className="lovable-choice-thumb" style={{ blockSize: '56px' }}>
                            <img src={assetUrl(item.imageFile)} alt="" loading="lazy" />
                          </div>
                          <strong style={{ fontSize: '0.79rem', lineHeight: 1.2 }}>{item.label}</strong>
                          <span className="muted" style={{ fontSize: '0.68rem', lineHeight: 1.2 }}>{item.sleepHint}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* RECOMENDACIÓN INTELIGENTE SEGÚN DESCANSO */}
                  <div
                    className="inset-panel row-between"
                    style={{
                      borderColor: 'var(--pine-border)',
                      background: 'var(--pine-soft)',
                      padding: '0.62rem 0.85rem',
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', flex: '1 1 240px' }}>
                      <strong style={{ color: 'var(--pine)' }}>
                        <Lightning size={14} weight="duotone" style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} aria-hidden="true" />
                        Recomendación para hoy · Potencia {recommendation.recommendedPower}/5:
                      </strong>{' '}
                      <span className="secondary">{recommendation.reason}</span>
                    </div>
                    {selectedPower !== recommendation.recommendedPower && (
                      <button
                        type="button"
                        className="btn btn-emerald btn-sm"
                        onClick={() => handlePickPower(recommendation.recommendedPower)}
                      >
                        Aplicar recomendada
                      </button>
                    )}
                  </div>

                  {/* PASO 2: POTENCIA DE LA RUTINA (1 A 5) */}
                  <div className="stack-sm">
                    <div className="row-between">
                      <strong style={{ fontSize: '0.86rem' }}>2. Selecciona la potencia de la rutina</strong>
                      <span className="muted" style={{ fontSize: '0.74rem' }}>Adaptada a tu VDOT {profile.vdot}</span>
                    </div>
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
                            <span className="muted" style={{ fontSize: '0.69rem', lineHeight: 1.25 }}>
                              {p.shortDesc}
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
                      <span className="muted" style={{ fontSize: '0.78rem', fontWeight: 600 }}>Duración objetivo</span>
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

              {/* VISTA PREVIA COMPACTA DE LA RUTINA LISTA PARA SALTAR */}
              {(() => {
                const photo = getSessionBannerPhoto(todayWorkout);
                return (
                  <div className="editorial-photo-banner" style={{ blockSize: '122px' }}>
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
                          {todayWorkout.blocks.length} bloques · {todayWorkout.targetZone} ({todayZoneInfo.speedKmhFormatted}) · ~{todayWorkout.targetDistanceKm} km
                        </span>
                      </div>
                      <span className="pill mono">{todayWorkout.cardioPoints} PC</span>
                    </div>
                  </div>
                );
              })()}

              <WorkoutVisualBar
                blocks={todayWorkout.blocks}
                activeBlockIndex={inspectedBlockIdx}
                onSelectBlock={(idx) => setInspectedBlockIdx((prev) => (prev === idx ? undefined : idx))}
              />

              {/* GRAN CTA PRINCIPAL: ¡QUIERO ENTRENAR HOY! */}
              <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
                {!todayWorkout.completed ? (
                  <button
                    type="button"
                    className="btn lovable-cta-btn"
                    style={{ flex: '1 1 230px', minBlockSize: '46px', fontSize: '0.94rem' }}
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

              {!todayWorkout.completed && (
                <div className="row-between" style={{ paddingTop: '0.15rem' }}>
                  <span className="muted" style={{ fontSize: '0.75rem' }}>
                    ¿Prefieres ajustar series y descansos manualmente?
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setCustomOpen((v) => !v)}
                  >
                    {customOpen ? 'Cerrar ajuste manual' : 'Editar intervalos manualmente'}
                  </button>
                </div>
              )}

              {customOpen && !todayWorkout.completed && (
                <div className="inset-panel stack-sm" style={{ borderColor: 'var(--cobalt-border)', background: 'var(--cobalt-soft)' }}>
                  <div className="grid-4" style={{ gap: '0.5rem' }}>
                    <div className="field">
                      <label htmlFor="dash-custom-type">Tipo</label>
                      <select
                        id="dash-custom-type"
                        className="select"
                        value={customType}
                        onChange={(e) => setCustomType(e.target.value as CustomRoutineConfig['presetType'])}
                      >
                        <option value="caco">CaCo (Correr/Andar)</option>
                        <option value="intervals_z4">Series VO2max (Z4)</option>
                        <option value="threshold_z3">Umbral (Z3)</option>
                        <option value="easy_z1">Rodaje Suave (Z1)</option>
                        <option value="long_run">Tirada Larga</option>
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="dash-custom-rounds">Series (1-4)</label>
                      <input
                        id="dash-custom-rounds"
                        type="number"
                        min={1}
                        max={4}
                        className="input mono"
                        value={customRounds}
                        onChange={(e) => setCustomRounds(Number(e.target.value))}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="dash-custom-work">Trabajo (min)</label>
                      <input
                        id="dash-custom-work"
                        type="number"
                        min={1}
                        max={20}
                        className="input mono"
                        value={customWorkMin}
                        onChange={(e) => setCustomWorkMin(Number(e.target.value))}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="dash-custom-rest">Recup. (min)</label>
                      <input
                        id="dash-custom-rest"
                        type="number"
                        min={1}
                        max={10}
                        className="input mono"
                        value={customRestMin}
                        onChange={(e) => setCustomRestMin(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="row-wrap">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        onCustomizeRoutine(todayWorkout.id, {
                          presetType: customType,
                          rounds: customRounds,
                          workMin: customWorkMin,
                          restMin: customRestMin,
                          warmupMin: 5,
                          cooldownMin: 5,
                        });
                        setCustomOpen(false);
                        setRoutineModalOpen(true);
                      }}
                    >
                      Aplicar y abrir rutina
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="muted">No hay sesión registrada para hoy.</p>
          )}
        </SpotlightCard>

        {/* COLUMNA DERECHA: MAÑANA + BALANCE + CENTRO GOOGLE FIT Y SUBIDA CLOUD */}
        <div className="stack-md">
          <SpotlightCard staggerIndex={1} className="stack-md" aria-label="Integración Google Fit">
            <div className="row-between">
              <div className="row-wrap">
                <span className="duotone-icon-box is-pine">
                  <Footprints size={18} weight="duotone" aria-hidden="true" />
                </span>
                <div>
                  <div className="row-wrap" style={{ gap: '0.45rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Google Fit · Datos subidos</h2>
                    {isRealOAuthConnected ? (
                      <span className="pill pill-emerald" style={{ fontSize: '0.7rem' }}>
                        Google Fit OAuth activo
                      </span>
                    ) : isSyncedRecently ? (
                      <span className="pill pill-cyan" style={{ fontSize: '0.7rem' }}>
                        Guardado en tu cuenta
                      </span>
                    ) : (
                      <span className="pill" style={{ fontSize: '0.7rem' }}>
                        Sin sincronizar
                      </span>
                    )}
                  </div>
                  <div className="muted" style={{ fontSize: '0.78rem' }}>
                    Meta diaria: {profile.dailyStepsTarget.toLocaleString('es-ES')} pasos ({profile.weeklyWalkGoalSessions} días/sem)
                  </div>
                </div>
              </div>

              <div className="row-wrap" style={{ gap: '0.4rem' }}>
                <button
                  type="button"
                  className="btn btn-emerald btn-sm"
                  onClick={() => {
                    onSyncGoogleFit();
                    setFitUploadOpen(true);
                  }}
                  disabled={fitSyncLoading}
                >
                  <ArrowsClockwise size={15} weight="duotone" aria-hidden="true" />
                  {fitSyncLoading
                    ? 'Sincronizando…'
                    : isRealOAuthConnected
                    ? 'Resincronizar Fit'
                    : 'Conectar Google Fit'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setFitUploadOpen((v) => !v)}
                >
                  <CloudArrowUp size={15} weight="duotone" aria-hidden="true" />
                  {fitUploadOpen ? 'Cerrar tabla' : 'Subir datos (7 días)'}
                </button>
              </div>
            </div>

            <div className="row-between">
              <div>
                <div className="kpi-value" style={{ color: 'var(--pine)' }}>
                  <AnimatedNumber value={fitToday?.steps ?? 0} locale />{' '}
                  <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>pasos hoy</span>
                </div>
                <div className="muted" style={{ fontSize: '0.8rem' }}>
                  {((fitToday?.distanceMeters ?? 0) / 1000).toFixed(2)} km caminados · {fitToday?.calories ?? 0} kcal · {fitToday?.activeMinutes ?? 0} min activos
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
                blockSize: '58px',
                paddingBlockStart: '0.3rem',
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

            {/* CENTRO DE SUBIDA Y VERIFICACIÓN DE DATOS GOOGLE FIT */}
            {fitUploadOpen && (
              <div className="inset-panel stack-sm" style={{ borderColor: 'var(--pine-border)', background: 'var(--bg-surface)' }}>
                <div className="row-between">
                  <strong style={{ fontSize: '0.84rem' }}>Importar Google Fit (JSON/CSV) o actualizar pasos</strong>
                  <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                    <UploadSimple size={14} weight="duotone" aria-hidden="true" />
                    Importar CSV / JSON
                    <input
                      type="file"
                      accept=".csv,.json,text/csv,application/json"
                      onChange={(e) => void handleFileImport(e)}
                      className="sr-only"
                    />
                  </label>
                </div>

                {fitImportError && (
                  <div className="error-banner" role="alert" style={{ fontSize: '0.78rem' }}>
                    {fitImportError}
                  </div>
                )}

                <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
                  <div className="row-wrap" style={{ gap: '0.4rem' }}>
                    <label htmlFor="manual-fit-steps" className="muted" style={{ fontSize: '0.76rem' }}>
                      Pasos de hoy:
                    </label>
                    <input
                      id="manual-fit-steps"
                      name="manualFitSteps"
                      type="number"
                      inputMode="numeric"
                      className="input mono"
                      style={{ inlineSize: '115px', padding: '0.3rem 0.55rem', minBlockSize: '32px' }}
                      min={0}
                      max={60000}
                      step={1}
                      value={stepsInput}
                      onChange={(e) => setStepsInput(Number(e.target.value))}
                    />
                    <button
                      type="button"
                      className="btn btn-emerald btn-sm"
                      onClick={() => onManualStepsUpdate(stepsInput)}
                    >
                      Subir a la app
                    </button>
                  </div>

                  <button
                    type="button"
                    className={`btn btn-sm ${livePedometerOn ? 'btn-emerald' : 'btn-ghost'}`}
                    onClick={() => void toggleLivePedometer()}
                  >
                    {livePedometerOn ? 'Sensor activo (contando)' : 'Podómetro móvil'}
                  </button>
                </div>

                <div className="scroll-table-wrap">
                  <table className="zone-table" style={{ fontSize: '0.75rem' }}>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Pasos</th>
                        <th>Km</th>
                        <th>Kcal</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fitDays.slice(-7).map((d) => (
                        <tr key={d.date}>
                          <td className="mono">{d.date}</td>
                          <td className="mono" style={{ fontWeight: 700 }}>{d.steps.toLocaleString('es-ES')}</td>
                          <td className="mono">{(d.distanceMeters / 1000).toFixed(2)}</td>
                          <td className="mono">{d.calories}</td>
                          <td>
                            <span className="pill pill-emerald" style={{ fontSize: '0.66rem', padding: '0.06rem 0.42rem' }}>
                              {d.source === 'google_fit_api'
                                ? 'Google Fit API'
                                : d.source === 'manual'
                                ? 'Manual'
                                : 'Modo Demo'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                Ver calendario completo
              </button>
            </div>

            {tomorrowWorkout ? (
              <>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.1rem', letterSpacing: '-0.015em' }}>{tomorrowWorkout.title}</h2>
                  <p className="muted" style={{ margin: '0.2rem 0 0', fontSize: '0.84rem' }}>
                    {tomorrowWorkout.subtitle}
                  </p>
                </div>

                <WorkoutVisualBar blocks={tomorrowWorkout.blocks} />

                <div className="row-wrap">
                  <span className="pill mono">{tomorrowWorkout.durationMinutes} min</span>
                  <span className="pill mono">{tomorrowWorkout.targetPace}</span>
                  <span className="pill pill-emerald mono">{tomorrowWorkout.cardioPoints} PC</span>
                </div>

                <p className="inset-panel secondary" style={{ margin: 0, fontSize: '0.82rem' }}>
                  <strong>Criterio de mañana:</strong> {tomorrowWorkout.coachTip}
                </p>
              </>
            ) : null}
          </SpotlightCard>

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
                Actividad libre
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
        </div>
      </div>

      {/* FILA INFERIOR: NUTRICIÓN CON FOTOS + PROGRESO */}
      <div className="grid-2">
        <SpotlightCard staggerIndex={4} className="stack-sm">
          <div className="row-between">
            <div className="row-wrap">
              <span className="duotone-icon-box" style={{ inlineSize: '30px', blockSize: '30px' }}>
                <CookingPot size={16} weight="duotone" aria-hidden="true" />
              </span>
              <h2 style={{ margin: 0, fontSize: '1.02rem' }}>Nutrición recomendada hoy</h2>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('nutrition')}>
              Ver reparto en 4 comidas
            </button>
          </div>
          <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>
            {todayMacros.dayTypeLabel} ·{' '}
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
              <div className="muted" style={{ fontSize: '0.72rem' }}>Grasas · Agua</div>
              <div className="mono" style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--cobalt)' }}>
                <AnimatedNumber value={todayMacros.fatsGrams} suffix=" g" />
              </div>
              <div className="muted mono" style={{ fontSize: '0.72rem' }}>{todayMacros.hydrationLiters} L/día</div>
            </div>
          </div>
        </SpotlightCard>

        <SpotlightCard staggerIndex={5} className="stack-sm">
          <div className="row-between">
            <div className="row-wrap">
              <span className="duotone-icon-box" style={{ inlineSize: '30px', blockSize: '30px' }}>
                <Trophy size={16} weight="duotone" aria-hidden="true" />
              </span>
              <h2 style={{ margin: 0, fontSize: '1.02rem' }}>Progreso del plan</h2>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('stats')}>
              Zonas y examen
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
              <div className="muted" style={{ fontSize: '0.72rem' }}>Frecuencia</div>
              <div className="mono" style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                {profile.trainingDaysPerWeek} d/sem
              </div>
            </div>
          </div>
        </SpotlightCard>
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
