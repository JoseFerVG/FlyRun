import { useEffect, useRef } from 'react';
import { CheckCircle, Fire, Gauge, Play, Sparkle, Timer, X } from '@phosphor-icons/react';
import type { UserProfile, WorkoutSession } from '../types/fitness';
import {
  calculateTrainingZones,
  getModalityLabel,
  getRoutineBlockPhoto,
  type RestLevel,
  type RoutinePowerLevel,
} from '../services/scienceEngine';
import { assetUrl } from '../services/assets';

interface TodayRoutineModalProps {
  open: boolean;
  workout: WorkoutSession | undefined;
  profile: UserProfile;
  powerLevel: RoutinePowerLevel;
  recommendedPower: RoutinePowerLevel;
  restLevel: RestLevel;
  recommendationReason: string;
  onClose: () => void;
  onStartTimer: (workout: WorkoutSession, startBlockIndex?: number) => void;
  onCompleteWorkout: (workout: WorkoutSession) => void;
}

function getHeroPhoto(workout?: WorkoutSession): string {
  if (!workout) return 'images/modality-active-walk.jpg';
  if (workout.modality === 'cycling') return 'images/cardio-road-cycling.jpg';
  if (workout.modality === 'soccer') return 'images/cardio-soccer-pitch.jpg';
  if (workout.modality === 'walking') return 'images/modality-active-walk.jpg';
  if (workout.targetZone === 'Z4' || workout.targetZone === 'Z5') return 'images/routine-intervals-vo2.jpg';
  if (workout.targetZone === 'Z3') return 'images/routine-tempo-threshold.jpg';
  if (workout.sessionType === 'caco') return 'images/goal-start-caco.jpg';
  return 'images/routine-easy-aerobic.jpg';
}

export function TodayRoutineModal({
  open,
  workout,
  profile,
  powerLevel,
  recommendedPower,
  restLevel,
  recommendationReason,
  onClose,
  onStartTimer,
  onCompleteWorkout,
}: TodayRoutineModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && workout && !d.open) {
      d.showModal();
    } else if ((!open || !workout) && d.open) {
      d.close();
    }
  }, [open, workout]);

  if (!open || !workout) return null;

  const zones = calculateTrainingZones(profile.vdot, profile.maxHR, profile.restHR);
  const targetZoneInfo = zones.find((z) => z.id === workout.targetZone) ?? zones[0];
  const restLabels: Record<RestLevel, string> = {
    low_rest: 'Poco descanso (<6h)',
    normal_rest: 'Descanso normal (6-7,5h)',
    good_rest: 'Bien descansado (7,5-8h)',
    peak_rest: 'Descanso al 100% (+8h)',
  };

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      style={{ inlineSize: 'min(95dvw, 760px)' }}
      aria-labelledby="today-routine-modal-title"
    >
      <div className="stack-md" style={{ padding: 'clamp(1.05rem, 2.5vw, 1.5rem)' }}>
        <div className="row-between">
          <div className="row-wrap">
            <span className="pill lovable-badge">
              <Gauge size={14} weight="duotone" aria-hidden="true" />
              Potencia {powerLevel}/5
            </span>
            {powerLevel === recommendedPower && (
              <span className="pill pill-emerald">
                <Sparkle size={13} weight="duotone" aria-hidden="true" />
                Recomendada para hoy
              </span>
            )}
            <span className="pill mono">{restLabels[restLevel]}</span>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Cerrar rutina">
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="editorial-photo-banner" style={{ blockSize: '154px' }}>
          <img
            src={assetUrl(getHeroPhoto(workout))}
            alt={workout.title}
            className="editorial-photo-img"
          />
          <div className="editorial-photo-scrim">
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.15rem', lineHeight: 1.2 }}>
                {workout.title}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.88)', fontSize: '0.8rem', marginTop: '0.15rem' }}>
                {workout.subtitle}
              </div>
            </div>
            <span className="pill pill-amber mono">{workout.durationMinutes} min</span>
          </div>
        </div>

        <h2 id="today-routine-modal-title" className="sr-only">
          {workout.title}
        </h2>

        <div className="grid-4" style={{ gap: '0.55rem', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
          <div className="inset-panel" style={{ padding: '0.55rem 0.72rem' }}>
            <div className="muted" style={{ fontSize: '0.7rem' }}>Deporte y Zona</div>
            <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>
              {getModalityLabel(workout.modality).split(' ')[0]} · {workout.targetZone}
            </div>
          </div>
          <div className="inset-panel" style={{ padding: '0.55rem 0.72rem' }}>
            <div className="muted" style={{ fontSize: '0.7rem' }}>Velocidad objetivo</div>
            <div className="mono" style={{ fontWeight: 700, fontSize: '0.82rem' }}>
              {workout.modality === 'running' ? targetZoneInfo.speedKmhFormatted : workout.targetPace}
            </div>
            {workout.modality === 'running' && (
              <div className="muted mono" style={{ fontSize: '0.69rem' }}>
                {targetZoneInfo.speedKmMinFormatted} · {targetZoneInfo.paceFormatted}
              </div>
            )}
          </div>
          <div className="inset-panel" style={{ padding: '0.55rem 0.72rem' }}>
            <div className="muted" style={{ fontSize: '0.7rem' }}>Distancia estimada</div>
            <div className="mono" style={{ fontWeight: 700, fontSize: '0.9rem' }}>
              ~{workout.targetDistanceKm} km
            </div>
          </div>
          <div className="inset-panel" style={{ padding: '0.55rem 0.72rem' }}>
            <div className="muted" style={{ fontSize: '0.7rem' }}>Gasto y Carga</div>
            <div className="mono" style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--accent)' }}>
              {workout.estimatedCalories} kcal · {workout.cardioPoints} PC
            </div>
          </div>
        </div>

        <div className="inset-panel" style={{ borderColor: 'var(--pine-border)', background: 'var(--pine-soft)', padding: '0.62rem 0.85rem', fontSize: '0.82rem' }}>
          <strong style={{ color: 'var(--pine)' }}>¿Por qué esta rutina hoy?</strong>{' '}
          <span className="secondary">{recommendationReason}</span>
        </div>

        <div className="stack-sm">
          <div className="row-between">
            <strong style={{ fontSize: '0.94rem' }}>Tu rutina paso a paso ({workout.blocks.length} fases)</strong>
            <span className="muted" style={{ fontSize: '0.76rem' }}>Pulsa el cronómetro para que te guíe por voz</span>
          </div>

          <div className="stack-sm">
            {workout.blocks.map((block, idx) => (
              <div key={`${block.label}-${idx}`} className="lovable-step-row">
                <img
                  src={assetUrl(getRoutineBlockPhoto(block, workout.modality))}
                  alt=""
                  width={76}
                  height={76}
                  loading="lazy"
                  className="lovable-step-thumb"
                />
                <div className="stack-sm" style={{ gap: '0.2rem' }}>
                  <div className="row-between">
                    <strong style={{ fontSize: '0.9rem' }}>{block.label}</strong>
                    <div className="row-wrap" style={{ gap: '0.35rem' }}>
                      <span className="pill mono" style={{ fontSize: '0.72rem' }}>
                        {block.durationMinutes} min · {block.zone}
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ minBlockSize: '28px', padding: '0.18rem 0.55rem', fontSize: '0.74rem' }}
                        onClick={() => {
                          onClose();
                          onStartTimer(workout, idx);
                        }}
                      >
                        <Play size={12} weight="fill" aria-hidden="true" />
                        Desde aquí
                      </button>
                    </div>
                  </div>
                  <div className="mono" style={{ color: 'var(--accent)', fontSize: '0.76rem', fontWeight: 600 }}>
                    {block.intensity}
                  </div>
                  <p className="muted" style={{ margin: 0, fontSize: '0.79rem' }}>
                    {block.description}
                  </p>
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
            Ya la hice · Registrar
          </button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            <Fire size={15} weight="duotone" aria-hidden="true" />
            Seguir configurando
          </button>
        </div>
      </div>
    </dialog>
  );
}
