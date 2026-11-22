import { useEffect, useState } from 'react';
import {
  ArrowsLeftRight,
  Bicycle,
  CalendarBlank,
  CheckCircle,
  ClipboardText,
  Footprints,
  PersonSimpleRun,
  SoccerBall,
  Timer,
} from '@phosphor-icons/react';
import type { CardioModality, WorkoutSession } from '../types/fitness';
import { getModalityLabel } from '../services/scienceEngine';
import { WorkoutVisualBar } from './WorkoutVisualBar';
import { AnimatedNumber, SpotlightCard } from './MotionPrimitives';

interface CalendarViewProps {
  workouts: WorkoutSession[];
  onStartTimer: (workout: WorkoutSession) => void;
  onSelectComplete: (workout: WorkoutSession) => void;
  onSwapModality: (workoutId: string, modality: CardioModality) => void;
  onSwapWorkoutDays: (sourceId: string, targetId: string) => void;
  onOpenExam: () => void;
}

export function CalendarView({
  workouts,
  onStartTimer,
  onSelectComplete,
  onSwapModality,
  onSwapWorkoutDays,
  onOpenExam,
}: CalendarViewProps) {
  const [selectedId, setSelectedId] = useState<string>(workouts[0]?.id ?? '');
  const [activeWeek, setActiveWeek] = useState<number>(1);

  const weekWorkouts = workouts.slice((activeWeek - 1) * 7, activeWeek * 7);
  const selected = weekWorkouts.find((w) => w.id === selectedId) ?? weekWorkouts[0] ?? workouts[0];
  const weekTotalMinutes = weekWorkouts.reduce((acc, w) => acc + w.durationMinutes, 0);
  const weekTotalCP = weekWorkouts.reduce((acc, w) => acc + w.cardioPoints, 0);
  const weekTotalTrimp = weekWorkouts.reduce((acc, w) => acc + w.trimp, 0);
  const weekCompleted = weekWorkouts.filter((w) => w.completed).length;

  useEffect(() => {
    const inWeek = weekWorkouts.some((w) => w.id === selectedId);
    if (!inWeek && weekWorkouts[0]) {
      setSelectedId(weekWorkouts[0].id);
    }
  }, [activeWeek, workouts, selectedId, weekWorkouts]);

  const formatShortDate = (iso: string) => {
    const d = new Date(`${iso}T12:00:00`);
    return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const swapCandidates = weekWorkouts.filter((w) => w.id !== selected?.id);

  return (
    <div className="stack-lg">
      <SpotlightCard as="section" staggerIndex={0} className="stack-md">
        <div className="row-between">
          <div className="row-wrap">
            <span className="duotone-icon-box">
              <CalendarBlank size={18} weight="duotone" aria-hidden="true" />
            </span>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.3rem', letterSpacing: '-0.02em' }}>
                Calendario de 4 semanas
              </h1>
              <p className="muted" style={{ margin: 0, fontSize: '0.84rem' }}>
                Periodización semanal adaptada a tus días elegidos, flexible para mover días según tu semana real.
              </p>
            </div>
          </div>

          <div className="segmented-group" role="tablist" aria-label="Seleccionar semana del calendario">
            {[1, 2, 3, 4].map((wk) => (
              <button
                key={wk}
                type="button"
                role="tab"
                aria-selected={activeWeek === wk}
                className="segmented-btn"
                onClick={() => {
                  setActiveWeek(wk);
                  const firstOfWeek = workouts[(wk - 1) * 7];
                  if (firstOfWeek) setSelectedId(firstOfWeek.id);
                }}
              >
                Semana {wk}
              </button>
            ))}
          </div>
        </div>

        <div className="grid-4" style={{ gap: '0.65rem' }}>
          <div className="inset-panel" style={{ padding: '0.55rem 0.75rem' }}>
            <div className="muted" style={{ fontSize: '0.72rem' }}>Volumen Semana {activeWeek}</div>
            <div className="mono" style={{ fontWeight: 700, fontSize: '1.02rem' }}>
              <AnimatedNumber value={weekTotalMinutes} suffix=" min" />
            </div>
          </div>
          <div className="inset-panel" style={{ padding: '0.55rem 0.75rem' }}>
            <div className="muted" style={{ fontSize: '0.72rem' }}>Puntos Cardio</div>
            <div className="mono" style={{ fontWeight: 700, fontSize: '1.02rem', color: 'var(--accent)' }}>
              <AnimatedNumber value={weekTotalCP} suffix=" PC" />
            </div>
          </div>
          <div className="inset-panel" style={{ padding: '0.55rem 0.75rem' }}>
            <div className="muted" style={{ fontSize: '0.72rem' }}>Carga TRIMP semanal</div>
            <div className="mono" style={{ fontWeight: 700, fontSize: '1.02rem', color: 'var(--cobalt)' }}>
              <AnimatedNumber value={weekTotalTrimp} />
            </div>
          </div>
          <div className="inset-panel" style={{ padding: '0.55rem 0.75rem' }}>
            <div className="muted" style={{ fontSize: '0.72rem' }}>Sesiones completadas</div>
            <div className="mono" style={{ fontWeight: 700, fontSize: '1.02rem', color: 'var(--pine)' }}>
              {weekCompleted} / {weekWorkouts.length}
            </div>
          </div>
        </div>

        <div className="calendar-grid">
          {weekWorkouts.map((w) => {
            const isToday = w.dayIndex === 0;
            const isTomorrow = w.dayIndex === 1;
            const classes = [
              'calendar-day',
              selected?.id === w.id ? 'is-selected' : '',
              w.completed ? 'is-completed' : '',
              w.isExamDay ? 'is-exam' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <button
                key={w.id}
                type="button"
                className={classes}
                onClick={() => {
                  setSelectedId(w.id);
                }}
              >
                <div className="row-between" style={{ inlineSize: '100%' }}>
                  <span className="muted" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize' }}>
                    {formatShortDate(w.date)}
                  </span>
                  {isToday && <span className="pill pill-amber">Hoy</span>}
                  {isTomorrow && <span className="pill pill-cyan">Mañana</span>}
                  {w.completed && <CheckCircle size={16} weight="duotone" color="var(--pine)" aria-hidden="true" />}
                </div>

                <div style={{ fontWeight: 600, fontSize: '0.88rem', lineHeight: 1.35 }}>{w.title}</div>

                <div className="row-between" style={{ inlineSize: '100%', marginBlockStart: 'auto' }}>
                  <span className="muted mono" style={{ fontSize: '0.74rem' }}>
                    {w.durationMinutes} min · {w.targetZone}
                  </span>
                  <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--accent)', fontWeight: 600 }}>
                    {w.cardioPoints} PC
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </SpotlightCard>

      {selected && (
        <SpotlightCard as="section" staggerIndex={1} className="stack-md" aria-label="Detalle del día seleccionado">
          <div className="row-between">
            <div>
              <div className="row-wrap">
                <span className="pill pill-amber">{formatShortDate(selected.date)}</span>
                <span className="pill">{selected.strategyTag}</span>
                <span className="pill pill-cyan">{getModalityLabel(selected.modality)}</span>
              </div>
              <h2 style={{ margin: '0.45rem 0 0', fontSize: '1.25rem', letterSpacing: '-0.015em' }}>{selected.title}</h2>
              <p className="muted" style={{ margin: '0.18rem 0 0', fontSize: '0.86rem' }}>
                {selected.subtitle}
              </p>
            </div>

            <div className="row-wrap">
              {!selected.completed && selected.blocks.length > 0 && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onStartTimer(selected)}
                >
                  <Timer size={15} weight="duotone" aria-hidden="true" />
                  Cronómetro guiado
                </button>
              )}
              {selected.isExamDay && (
                <button type="button" className="btn btn-primary btn-sm" onClick={onOpenExam}>
                  <ClipboardText size={15} weight="duotone" aria-hidden="true" />
                  Ir a examen físico
                </button>
              )}
              <button
                type="button"
                className={`btn ${selected.completed ? 'btn-secondary' : 'btn-emerald'}`}
                onClick={() => onSelectComplete(selected)}
              >
                <CheckCircle size={17} weight="duotone" aria-hidden="true" />
                {selected.completed ? 'Editar registro' : 'Marcar como completado'}
              </button>
            </div>
          </div>

          <WorkoutVisualBar blocks={selected.blocks} />

          <div className="grid-4">
            <div className="inset-panel">
              <div className="muted" style={{ fontSize: '0.74rem' }}>Duración / Distancia</div>
              <div className="mono" style={{ fontWeight: 700 }}>
                <AnimatedNumber value={selected.durationMinutes} suffix=" min" /> · {selected.targetDistanceKm} km
              </div>
            </div>
            <div className="inset-panel">
              <div className="muted" style={{ fontSize: '0.74rem' }}>Ritmo objetivo</div>
              <div className="mono" style={{ fontWeight: 700 }}>{selected.targetPace}</div>
            </div>
            <div className="inset-panel">
              <div className="muted" style={{ fontSize: '0.74rem' }}>Puntos Cardio / MET-m</div>
              <div className="mono" style={{ fontWeight: 700 }}>
                <AnimatedNumber value={selected.cardioPoints} suffix=" PC" /> · {selected.metMinutes} MET
              </div>
            </div>
            <div className="inset-panel">
              <div className="muted" style={{ fontSize: '0.74rem' }}>TRIMP / Calorías</div>
              <div className="mono" style={{ fontWeight: 700 }}>
                {selected.trimp} TRIMP · <AnimatedNumber value={selected.estimatedCalories} suffix=" kcal" />
              </div>
            </div>
          </div>

          <div className="grid-2">
            <div className="stack-sm">
              <strong style={{ fontSize: '0.88rem' }}>Estructura de la sesión</strong>
              {selected.blocks.map((b, i) => (
                <div key={`${b.label}-${i}`} className="inset-panel" style={{ padding: '0.68rem 0.85rem' }}>
                  <div className="row-between">
                    <span style={{ fontWeight: 600, fontSize: '0.87rem' }}>{b.label}</span>
                    <span className="pill mono" style={{ fontSize: '0.72rem' }}>{b.durationMinutes} min</span>
                  </div>
                  <div style={{ color: 'var(--accent)', fontSize: '0.78rem', fontWeight: 600 }}>{b.intensity}</div>
                  <div className="muted" style={{ fontSize: '0.8rem' }}>{b.description}</div>
                </div>
              ))}
            </div>

            <div className="stack-md">
              <div className="inset-panel">
                <strong style={{ fontSize: '0.86rem' }}>Nota técnica de la sesión</strong>
                <p className="secondary" style={{ margin: '0.3rem 0 0', fontSize: '0.84rem' }}>{selected.coachTip}</p>
              </div>

              {!selected.isExamDay && selected.sessionType !== 'rest' && (
                <div className="stack-sm">
                  <strong style={{ fontSize: '0.86rem' }}>Adaptar este día a otro deporte:</strong>
                  <div className="segmented-group" role="group" aria-label="Cambiar deporte del día seleccionado">
                    <button
                      type="button"
                      aria-pressed={selected.modality === 'running'}
                      className="segmented-btn is-accent"
                      onClick={() => onSwapModality(selected.id, 'running')}
                    >
                      <PersonSimpleRun size={14} weight="duotone" aria-hidden="true" />
                      Running
                    </button>
                    <button
                      type="button"
                      aria-pressed={selected.modality === 'cycling'}
                      className="segmented-btn is-accent"
                      onClick={() => onSwapModality(selected.id, 'cycling')}
                    >
                      <Bicycle size={14} weight="duotone" aria-hidden="true" />
                      Bicicleta
                    </button>
                    <button
                      type="button"
                      aria-pressed={selected.modality === 'soccer'}
                      className="segmented-btn is-accent"
                      onClick={() => onSwapModality(selected.id, 'soccer')}
                    >
                      <SoccerBall size={14} weight="duotone" aria-hidden="true" />
                      Partido de fútbol
                    </button>
                    <button
                      type="button"
                      aria-pressed={selected.modality === 'walking'}
                      className="segmented-btn is-accent"
                      onClick={() => onSwapModality(selected.id, 'walking')}
                    >
                      <Footprints size={14} weight="duotone" aria-hidden="true" />
                      Caminata rápida
                    </button>
                  </div>
                </div>
              )}

              {/* Intercambiar entrenamiento entre días con 1 clic */}
              {swapCandidates.length > 0 && (
                <div className="inset-panel stack-sm">
                  <div className="row-between">
                    <strong style={{ fontSize: '0.84rem' }}>Mover sesión a otro día (Semana {activeWeek}):</strong>
                    <span className="muted" style={{ fontSize: '0.74rem' }}>Un clic intercambia ambos días</span>
                  </div>
                  <div className="grid-3" style={{ gap: '0.45rem' }}>
                    {swapCandidates.map((cand) => (
                      <button
                        key={cand.id}
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ justifyContent: 'space-between', textAlign: 'left' }}
                        onClick={() => onSwapWorkoutDays(selected.id, cand.id)}
                      >
                        <span style={{ textTransform: 'capitalize' }}>{formatShortDate(cand.date)}</span>
                        <ArrowsLeftRight size={13} weight="duotone" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </SpotlightCard>
      )}
    </div>
  );
}
