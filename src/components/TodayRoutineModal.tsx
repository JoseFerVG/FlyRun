import { useEffect, useRef, useState } from 'react';
import {
  Bicycle,
  CheckCircle,
  Footprints,
  Gauge,
  Lightning,
  Minus,
  PersonSimpleRun,
  Play,
  Plus,
  SoccerBall,
  Sparkle,
  Timer,
  Trash,
  X,
} from '@phosphor-icons/react';
import type { CardioModality, UserProfile, WorkoutBlock, WorkoutSession } from '../types/fitness';
import {
  POWER_LEVEL_CATALOG,
  REST_LEVEL_CATALOG,
  ROUTINE_STYLE_PRESETS,
  buildRoutineFromStylePreset,
  calculateTrainingZones,
  getModalityLabel,
  getRecommendedPowerForRest,
  getRoutineBlockPhoto,
  recalculateWorkoutFromBlocks,
  type RestLevel,
  type RoutinePowerLevel,
  type RoutineStylePreset,
} from '../services/scienceEngine';
import { WorkoutVisualBar } from './WorkoutVisualBar';
import { assetUrl } from '../services/assets';

interface TodayRoutineModalProps {
  open: boolean;
  workout: WorkoutSession | undefined;
  profile: UserProfile;
  onConfigureRoutine: (
    power: RoutinePowerLevel,
    durationMinutes: number,
    modality: CardioModality,
    restLevel: RestLevel
  ) => void;
  onSaveUpdatedWorkout: (updatedWorkout: WorkoutSession) => void;
  onClose: () => void;
  onStartTimer: (workout: WorkoutSession, startBlockIndex?: number) => void;
  onCompleteWorkout: (workout: WorkoutSession) => void;
}

const SPORT_CARDS: Array<{
  id: CardioModality;
  label: string;
  hint: string;
  image: string;
  icon: typeof PersonSimpleRun;
}> = [
  { id: 'running', label: 'Correr / Trote', hint: 'Asfalto, parque o cinta', image: 'images/routine-easy-aerobic.jpg', icon: PersonSimpleRun },
  { id: 'cycling', label: 'Bicicleta', hint: 'Carretera, bici estática o rodillo', image: 'images/cardio-road-cycling.jpg', icon: Bicycle },
  { id: 'soccer', label: 'Fútbol', hint: 'Partido o cambios de ritmo', image: 'images/cardio-soccer-pitch.jpg', icon: SoccerBall },
  { id: 'walking', label: 'Caminar activo', hint: 'Cero impacto articular', image: 'images/modality-active-walk.jpg', icon: Footprints },
];

const ZONE_BUTTONS: Array<{ zone: WorkoutBlock['zone']; label: string }> = [
  { zone: 'Z1', label: 'Suave' },
  { zone: 'Z2', label: 'Cómodo' },
  { zone: 'Z3', label: 'Alegre' },
  { zone: 'Z4', label: 'Fuerte' },
];

export function TodayRoutineModal({
  open,
  workout,
  profile,
  onConfigureRoutine,
  onSaveUpdatedWorkout,
  onClose,
  onStartTimer,
  onCompleteWorkout,
}: TodayRoutineModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [restLevel, setRestLevel] = useState<RestLevel>('normal_rest');
  const rec = getRecommendedPowerForRest(restLevel, profile);
  const [powerLevel, setPowerLevel] = useState<RoutinePowerLevel>(rec.recommendedPower);
  const [durationMinutes, setDurationMinutes] = useState<number>(workout?.durationMinutes ?? 30);
  const [modality, setModality] = useState<CardioModality>(
    workout?.modality && workout.modality !== 'swimming' ? workout.modality : 'running'
  );
  const [activeStyle, setActiveStyle] = useState<RoutineStylePreset | null>(null);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && workout && !d.open) {
      d.showModal();
    } else if ((!open || !workout) && d.open) {
      d.close();
    }
  }, [open, workout]);

  useEffect(() => {
    if (workout) {
      setModality(workout.modality && workout.modality !== 'swimming' ? workout.modality : 'running');
      setDurationMinutes(workout.durationMinutes);
    }
  }, [workout?.id, workout?.durationMinutes]);

  if (!open || !workout) return null;

  const zones = calculateTrainingZones(profile.vdot, profile.maxHR, profile.restHR);
  const targetZoneInfo = zones.find((z) => z.id === workout.targetZone) ?? zones[0];

  const handlePickRest = (nextRest: RestLevel) => {
    setRestLevel(nextRest);
    setActiveStyle(null);
    const nextRec = getRecommendedPowerForRest(nextRest, profile);
    setPowerLevel(nextRec.recommendedPower);
    if (!workout.completed) {
      onConfigureRoutine(nextRec.recommendedPower, durationMinutes, modality, nextRest);
    }
  };

  const handlePickPower = (nextPower: RoutinePowerLevel) => {
    setPowerLevel(nextPower);
    setActiveStyle(null);
    if (!workout.completed) {
      onConfigureRoutine(nextPower, durationMinutes, modality, restLevel);
    }
  };

  const handlePickDuration = (nextDur: number) => {
    const clamped = Math.max(15, Math.min(90, nextDur));
    setDurationMinutes(clamped);
    if (!workout.completed) {
      if (activeStyle) {
        onSaveUpdatedWorkout(
          buildRoutineFromStylePreset(workout, profile, activeStyle, clamped, modality, powerLevel)
        );
      } else {
        onConfigureRoutine(powerLevel, clamped, modality, restLevel);
      }
    }
  };

  const handlePickModality = (mod: CardioModality) => {
    setModality(mod);
    if (!workout.completed) {
      if (activeStyle) {
        onSaveUpdatedWorkout(
          buildRoutineFromStylePreset(workout, profile, activeStyle, durationMinutes, mod, powerLevel)
        );
      } else {
        onConfigureRoutine(powerLevel, durationMinutes, mod, restLevel);
      }
    }
  };

  const handlePickStyle = (preset: RoutineStylePreset) => {
    setActiveStyle(preset);
    if (!workout.completed) {
      onSaveUpdatedWorkout(
        buildRoutineFromStylePreset(workout, profile, preset, durationMinutes, modality, powerLevel)
      );
    }
  };

  const handleAdjustBlockMinutes = (idx: number, delta: number) => {
    const nextBlocks = workout.blocks.map((b, i) =>
      i === idx
        ? { ...b, durationMinutes: Math.max(1, Math.min(60, b.durationMinutes + delta)) }
        : b
    );
    onSaveUpdatedWorkout(recalculateWorkoutFromBlocks(workout, profile, nextBlocks, modality));
  };

  const handleChangeBlockZone = (idx: number, nextZone: WorkoutBlock['zone']) => {
    const zInfo = zones.find((z) => z.id === nextZone) ?? zones[0];
    const labelMap: Record<string, string> = {
      Z1: `Suave · ${zInfo.speedKmhFormatted}`,
      Z2: `Cómodo · ${zInfo.speedKmhFormatted}`,
      Z3: `Alegre · ${zInfo.speedKmhFormatted}`,
      Z4: `Fuerte · ${zInfo.speedKmhFormatted}`,
      Z5: `Máximo · ${zInfo.speedKmhFormatted}`,
    };
    const nextBlocks = workout.blocks.map((b, i) =>
      i === idx ? { ...b, zone: nextZone, intensity: labelMap[nextZone] ?? b.intensity } : b
    );
    onSaveUpdatedWorkout(recalculateWorkoutFromBlocks(workout, profile, nextBlocks, modality));
  };

  const handleRemoveBlock = (idx: number) => {
    if (workout.blocks.length <= 1) return;
    const nextBlocks = workout.blocks.filter((_, i) => i !== idx);
    onSaveUpdatedWorkout(recalculateWorkoutFromBlocks(workout, profile, nextBlocks, modality));
  };

  const handleAddBlock = () => {
    if (workout.blocks.length >= 10) return;
    const z2 = zones[1] ?? zones[0];
    const newBlock: WorkoutBlock = {
      label: `Fase extra ${workout.blocks.length + 1}`,
      durationMinutes: 5,
      intensity: `Cómodo · ${z2.speedKmhFormatted}`,
      description: 'Bloque añadido manualmente a tu rutina de hoy.',
      zone: 'Z2',
    };
    onSaveUpdatedWorkout(
      recalculateWorkoutFromBlocks(workout, profile, [...workout.blocks, newBlock], modality)
    );
  };

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      style={{ inlineSize: 'min(96dvw, 860px)' }}
      aria-labelledby="today-routine-modal-title"
    >
      <div className="stack-md" style={{ padding: 'clamp(1rem, 2.5vw, 1.5rem)' }}>
        <div className="row-between">
          <div className="row-wrap">
            <span className="pill lovable-badge">
              <Gauge size={14} weight="duotone" aria-hidden="true" />
              Creador de Rutina · {workout.durationMinutes} min
            </span>
            {powerLevel === rec.recommendedPower && (
              <span className="pill pill-emerald">
                <Sparkle size={13} weight="duotone" aria-hidden="true" />
                Potencia recomendada ({powerLevel}/5)
              </span>
            )}
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Cerrar creador de rutina">
            <X size={17} aria-hidden="true" />
          </button>
        </div>

        <div>
          <h2 id="today-routine-modal-title" style={{ margin: 0, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
            {workout.title}
          </h2>
          <p className="muted" style={{ margin: '0.18rem 0 0', fontSize: '0.84rem' }}>
            {getModalityLabel(workout.modality).split(' ')[0]} · ~{workout.targetDistanceKm} km · {workout.estimatedCalories} kcal · {targetZoneInfo.speedKmhFormatted} ({targetZoneInfo.speedKmMinFormatted})
          </p>
        </div>

        {!workout.completed && (
          <div className="inset-panel stack-md" style={{ background: 'var(--bg-inset)' }}>
            {/* PASO 1: DEPORTE VISUAL */}
            <div className="stack-sm">
              <strong style={{ fontSize: '0.88rem' }}>1. ¿Qué quieres entrenar hoy?</strong>
              <div className="lovable-choice-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                {SPORT_CARDS.map((sp) => {
                  const Icon = sp.icon;
                  return (
                    <button
                      key={sp.id}
                      type="button"
                      aria-pressed={modality === sp.id}
                      className="lovable-choice-card"
                      style={{ padding: '0.45rem' }}
                      onClick={() => handlePickModality(sp.id)}
                    >
                      <div className="lovable-choice-thumb" style={{ blockSize: '64px' }}>
                        <img src={assetUrl(sp.image)} alt="" loading="lazy" />
                      </div>
                      <div className="row-wrap" style={{ gap: '0.35rem' }}>
                        <Icon size={15} weight="duotone" color="var(--accent)" aria-hidden="true" />
                        <strong style={{ fontSize: '0.82rem' }}>{sp.label}</strong>
                      </div>
                      <span className="muted" style={{ fontSize: '0.7rem' }}>{sp.hint}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PASO 2: DESCANSO + POTENCIA RECOMENDADA */}
            <div className="stack-sm">
              <div className="row-between">
                <strong style={{ fontSize: '0.88rem' }}>2. ¿Cómo has descansado y qué potencia buscas?</strong>
                <span className="pill pill-emerald mono" style={{ fontSize: '0.72rem' }}>
                  Energía hoy: {rec.recoveryScore}%
                </span>
              </div>

              <div className="segmented-group" role="group" aria-label="Nivel de descanso hoy">
                {REST_LEVEL_CATALOG.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    aria-pressed={restLevel === r.id}
                    className="segmented-btn is-pine"
                    onClick={() => handlePickRest(r.id)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <div
                className="inset-panel row-between"
                style={{ borderColor: 'var(--pine-border)', background: 'var(--pine-soft)', padding: '0.56rem 0.85rem' }}
              >
                <div style={{ fontSize: '0.8rem' }}>
                  <strong style={{ color: 'var(--pine)' }}>
                    <Lightning size={14} weight="duotone" style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} aria-hidden="true" />
                    Recomendación · Potencia {rec.recommendedPower}/5:
                  </strong>{' '}
                  <span className="secondary">{rec.reason}</span>
                </div>
                {powerLevel !== rec.recommendedPower && (
                  <button
                    type="button"
                    className="btn btn-emerald btn-sm"
                    onClick={() => handlePickPower(rec.recommendedPower)}
                  >
                    Aplicar
                  </button>
                )}
              </div>

              <div className="lovable-power-grid">
                {POWER_LEVEL_CATALOG.map((p) => {
                  const isRec = p.power === rec.recommendedPower;
                  const zInfo = zones.find((z) => z.id === p.zone) ?? zones[0];
                  return (
                    <button
                      key={p.power}
                      type="button"
                      aria-pressed={powerLevel === p.power}
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

            {/* PASO 3: DURACIÓN + PLANTILLA / ESTILO EN 1 CLIC */}
            <div className="stack-sm">
              <div className="row-between">
                <strong style={{ fontSize: '0.88rem' }}>3. Duración y estilo de sesión</strong>
                <div className="row-wrap" style={{ gap: '0.3rem' }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => handlePickDuration(durationMinutes - 5)}
                    aria-label="Restar 5 minutos"
                  >
                    -5m
                  </button>
                  <div className="segmented-group" role="group" aria-label="Duración en minutos">
                    {[15, 20, 30, 45, 60].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        aria-pressed={durationMinutes === mins}
                        className="segmented-btn is-accent mono"
                        onClick={() => handlePickDuration(mins)}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => handlePickDuration(durationMinutes + 5)}
                    aria-label="Sumar 5 minutos"
                  >
                    +5m
                  </button>
                </div>
              </div>

              <div className="preset-chips-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                {ROUTINE_STYLE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    aria-pressed={activeStyle === preset.id}
                    className="preset-chip"
                    onClick={() => handlePickStyle(preset.id)}
                  >
                    <strong style={{ fontSize: '0.81rem' }}>{preset.label}</strong>
                    <span className="muted" style={{ fontSize: '0.7rem' }}>{preset.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PASO 4: FASES EDITABLES A TU MEDIDA */}
        <div className="stack-sm">
          <div className="row-between">
            <strong style={{ fontSize: '0.94rem' }}>Fases de tu rutina ({workout.blocks.length}/10)</strong>
            {!workout.completed && workout.blocks.length < 10 && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddBlock}>
                <Plus size={14} aria-hidden="true" />
                Añadir fase
              </button>
            )}
          </div>

          <WorkoutVisualBar blocks={workout.blocks} />

          <div className="stack-sm">
            {workout.blocks.map((block, idx) => (
              <div key={`${block.label}-${idx}`} className="lovable-step-row">
                <img
                  src={assetUrl(getRoutineBlockPhoto(block, workout.modality))}
                  alt=""
                  width={62}
                  height={62}
                  loading="lazy"
                  className="lovable-step-thumb"
                  style={{ inlineSize: '62px', blockSize: '62px' }}
                />
                <div className="stack-sm" style={{ gap: '0.28rem' }}>
                  <div className="row-between">
                    <strong style={{ fontSize: '0.88rem' }}>{block.label}</strong>

                    <div className="row-wrap" style={{ gap: '0.3rem' }}>
                      {!workout.completed && (
                        <>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ minBlockSize: '26px', padding: '0.12rem 0.42rem' }}
                            aria-label={`Quitar 1 minuto a ${block.label}`}
                            onClick={() => handleAdjustBlockMinutes(idx, -1)}
                          >
                            <Minus size={12} />
                          </button>
                          <span className="pill mono" style={{ fontSize: '0.73rem' }}>
                            {block.durationMinutes} min
                          </span>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ minBlockSize: '26px', padding: '0.12rem 0.42rem' }}
                            aria-label={`Sumar 1 minuto a ${block.label}`}
                            onClick={() => handleAdjustBlockMinutes(idx, 1)}
                          >
                            <Plus size={12} />
                          </button>
                          {workout.blocks.length > 1 && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ minBlockSize: '26px', padding: '0.12rem 0.42rem', color: 'var(--accent)' }}
                              aria-label={`Eliminar fase ${block.label}`}
                              onClick={() => handleRemoveBlock(idx)}
                            >
                              <Trash size={13} />
                            </button>
                          )}
                        </>
                      )}

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ minBlockSize: '26px', padding: '0.14rem 0.5rem', fontSize: '0.73rem' }}
                        onClick={() => {
                          onClose();
                          onStartTimer(workout, idx);
                        }}
                      >
                        <Play size={11} weight="fill" aria-hidden="true" />
                        Desde aquí
                      </button>
                    </div>
                  </div>

                  <div className="row-between" style={{ gap: '0.4rem' }}>
                    <span className="mono" style={{ color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 600 }}>
                      {block.intensity}
                    </span>

                    {!workout.completed && (
                      <div className="segmented-group" style={{ padding: '0.14rem', gap: '0.14rem' }}>
                        {ZONE_BUTTONS.map((zb) => (
                          <button
                            key={zb.zone}
                            type="button"
                            aria-pressed={block.zone === zb.zone}
                            className="segmented-btn is-accent"
                            style={{ minBlockSize: '22px', padding: '0.1rem 0.42rem', fontSize: '0.68rem' }}
                            onClick={() => handleChangeBlockZone(idx, zb.zone)}
                          >
                            {zb.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="row-wrap" style={{ paddingTop: '0.25rem' }}>
          <button
            type="button"
            className="btn lovable-cta-btn"
            style={{ flex: '1 1 240px', minBlockSize: '46px', fontSize: '0.95rem' }}
            onClick={() => {
              onClose();
              onStartTimer(workout, 0);
            }}
          >
            <Timer size={19} weight="duotone" aria-hidden="true" />
            Iniciar Cronómetro Guiado por Voz
          </button>
          <button
            type="button"
            className="btn btn-emerald"
            style={{ flex: '1 1 180px', minBlockSize: '46px' }}
            onClick={() => {
              onClose();
              onCompleteWorkout(workout);
            }}
          >
            <CheckCircle size={18} weight="duotone" aria-hidden="true" />
            Marcar como completada
          </button>
        </div>
      </div>
    </dialog>
  );
}
