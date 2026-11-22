import { useEffect, useRef, useState } from 'react';
import {
  ArrowsLeftRight,
  Bicycle,
  CalendarBlank,
  CheckCircle,
  ClipboardText,
  ClockClockwise,
  Footprints,
  PersonSimpleRun,
  SoccerBall,
  Timer,
  X,
} from '@phosphor-icons/react';
import type { CardioModality, WorkoutSession } from '../types/fitness';
import { getModalityLabel } from '../services/scienceEngine';
import { WorkoutVisualBar } from './WorkoutVisualBar';
import { AnimatedNumber, SpotlightCard } from './MotionPrimitives';

interface CalendarViewProps {
  workouts: WorkoutSession[];
  onStartTimer: (workout: WorkoutSession, startBlockIndex?: number) => void;
  onSelectComplete: (workout: WorkoutSession) => void;
  onSwapModality: (workoutId: string, modality: CardioModality) => void;
  onSwapWorkoutDays: (sourceId: string, targetId: string) => void;
  onOpenExam: () => void;
}

type CalendarMode = 'planned' | 'completed';

export function CalendarView({
  workouts,
  onStartTimer,
  onSelectComplete,
  onSwapModality,
  onSwapWorkoutDays,
  onOpenExam,
}: CalendarViewProps) {
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('planned');
  const [activeWeek, setActiveWeek] = useState<number>(1);
  const [modalWorkoutId, setModalWorkoutId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const weekWorkouts = workouts.slice((activeWeek - 1) * 7, activeWeek * 7);
  const completedWorkouts = workouts.filter((w) => w.completed);
  const modalWorkout = workouts.find((w) => w.id === modalWorkoutId) ?? null;

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (modalWorkout && !d.open) {
      d.showModal();
    } else if (!modalWorkout && d.open) {
      d.close();
    }
  }, [modalWorkout]);

  const weekTotalMinutes = weekWorkouts.reduce((acc, w) => acc + w.durationMinutes, 0);
  const weekCompleted = weekWorkouts.filter((w) => w.completed).length;

  const formatShortDate = (iso: string) => {
    const d = new Date(`${iso}T12:00:00`);
    return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const swapCandidates = modalWorkout
    ? weekWorkouts.filter((w) => w.id !== modalWorkout.id)
    : [];

  return (
    <div className="stack-lg">
      <SpotlightCard as="section" staggerIndex={0} className="stack-md">
        <div className="row-between">
          <div className="row-wrap">
            <span className="duotone-icon-box is-cobalt">
              <CalendarBlank size={18} weight="duotone" aria-hidden="true" />
            </span>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.3rem', letterSpacing: '-0.02em' }}>
                {calendarMode === 'planned' ? 'Tu Plan Ideal (Lo que vas a hacer)' : 'Tu Historial (Lo que ya has hecho)'}
              </h1>
              <p className="muted" style={{ margin: 0, fontSize: '0.84rem' }}>
                {calendarMode === 'planned'
                  ? 'Organiza tu semana ideal o pulsa cualquier día para adaptarlo a tu ritmo.'
                  : 'Aquí queda guardado todo lo que ya has entrenado y completado.'}
              </p>
            </div>
          </div>

          <div className="segmented-group" role="tablist" aria-label="Modo de calendario">
            <button
              type="button"
              role="tab"
              aria-selected={calendarMode === 'planned'}
              aria-pressed={calendarMode === 'planned'}
              className="segmented-btn is-accent"
              onClick={() => setCalendarMode('planned')}
            >
              <CalendarBlank size={14} weight="duotone" aria-hidden="true" />
              Plan ideal
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={calendarMode === 'completed'}
              aria-pressed={calendarMode === 'completed'}
              className="segmented-btn is-pine"
              onClick={() => setCalendarMode('completed')}
            >
              <ClockClockwise size={14} weight="duotone" aria-hidden="true" />
              Lo hecho ({completedWorkouts.length})
            </button>
          </div>
        </div>

        {calendarMode === 'planned' ? (
          <>
            <div className="row-between">
              <div className="row-wrap" style={{ gap: '0.5rem' }}>
                <span className="pill pill-cyan mono">
                  Semana {activeWeek}: <AnimatedNumber value={weekTotalMinutes} suffix=" min" />
                </span>
                <span className="pill pill-emerald mono">
                  {weekCompleted} / {weekWorkouts.length} completadas
                </span>
              </div>

              <div className="segmented-group" role="tablist" aria-label="Elegir semana">
                {[1, 2, 3, 4].map((wk) => (
                  <button
                    key={wk}
                    type="button"
                    role="tab"
                    aria-selected={activeWeek === wk}
                    className="segmented-btn"
                    onClick={() => setActiveWeek(wk)}
                  >
                    Semana {wk}
                  </button>
                ))}
              </div>
            </div>

            <div className="calendar-grid">
              {weekWorkouts.map((w) => {
                const isToday = w.dayIndex === 0;
                const isTomorrow = w.dayIndex === 1;
                const classes = [
                  'calendar-day',
                  w.completed ? 'is-completed' : '',
                  w.isExamDay ? 'is-exam' : '',
                  isToday && !w.completed ? 'is-selected' : '',
                ]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <button
                    key={w.id}
                    type="button"
                    className={classes}
                    onClick={() => setModalWorkoutId(w.id)}
                  >
                    <div className="row-between" style={{ inlineSize: '100%' }}>
                      <span className="muted" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize' }}>
                        {formatShortDate(w.date)}
                      </span>
                      {isToday && <span className="pill pill-amber">Hoy</span>}
                      {isTomorrow && <span className="pill pill-cyan">Mañana</span>}
                      {w.completed && <CheckCircle size={16} weight="duotone" color="var(--pine)" aria-hidden="true" />}
                    </div>

                    <div style={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.35 }}>{w.title}</div>

                    <div className="row-between" style={{ inlineSize: '100%', marginBlockStart: 'auto' }}>
                      <span className="muted mono" style={{ fontSize: '0.74rem' }}>
                        {w.durationMinutes} min · {getModalityLabel(w.modality).split(' ')[0]}
                      </span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--cobalt)', fontWeight: 600 }}>
                        Ver día →
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        ) : completedWorkouts.length === 0 ? (
          <div className="inset-panel stack-sm" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <strong>Aún no has completado ninguna sesión</strong>
            <span className="muted" style={{ fontSize: '0.84rem' }}>
              En cuanto completes tu entrenamiento de hoy o anotes una actividad, aparecerá guardada aquí en tu calendario de logros.
            </span>
          </div>
        ) : (
          <div className="calendar-grid">
            {completedWorkouts.map((w) => (
              <button
                key={w.id}
                type="button"
                className="calendar-day is-completed"
                onClick={() => setModalWorkoutId(w.id)}
              >
                <div className="row-between" style={{ inlineSize: '100%' }}>
                  <span className="muted" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize' }}>
                    {formatShortDate(w.date)}
                  </span>
                  <span className="pill pill-emerald" style={{ fontSize: '0.68rem' }}>
                    Hecho ✓
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.35 }}>{w.title}</div>
                <div className="row-between" style={{ inlineSize: '100%', marginBlockStart: 'auto' }}>
                  <span className="muted mono" style={{ fontSize: '0.74rem' }}>
                    {w.actualDurationMinutes ?? w.durationMinutes} min · {w.actualDistanceKm ?? w.targetDistanceKm} km
                  </span>
                  <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--pine)', fontWeight: 700 }}>
                    {getModalityLabel(w.completedModality ?? w.modality).split(' ')[0]}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </SpotlightCard>

      {/* POPUP LIGERO PARA GESTIONAR EL DÍA PULSADO (SIN PÁGINA GIGANTE DEBAJO) */}
      <dialog
        ref={dialogRef}
        onCancel={() => setModalWorkoutId(null)}
        onClick={(e) => {
          if (e.target === dialogRef.current) setModalWorkoutId(null);
        }}
        style={{ inlineSize: 'min(95dvw, 680px)' }}
        aria-labelledby="cal-day-modal-title"
      >
        {modalWorkout && (
          <div className="stack-md" style={{ padding: 'clamp(1.05rem, 2.5vw, 1.45rem)' }}>
            <div className="row-between">
              <div className="row-wrap" style={{ gap: '0.4rem' }}>
                <span className="pill pill-amber">{formatShortDate(modalWorkout.date)}</span>
                <span className="pill pill-cyan">{getModalityLabel(modalWorkout.modality).split(' ')[0]}</span>
                {modalWorkout.completed && <span className="pill pill-emerald">Completado ✓</span>}
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setModalWorkoutId(null)}
                aria-label="Cerrar detalle del día"
              >
                <X size={17} aria-hidden="true" />
              </button>
            </div>

            <div>
              <h2 id="cal-day-modal-title" style={{ margin: 0, fontSize: '1.2rem' }}>
                {modalWorkout.title}
              </h2>
              <p className="muted" style={{ margin: '0.2rem 0 0', fontSize: '0.84rem' }}>
                {modalWorkout.subtitle} · {modalWorkout.durationMinutes} min · ~{modalWorkout.targetDistanceKm} km
              </p>
            </div>

            <WorkoutVisualBar blocks={modalWorkout.blocks} />

            <div className="stack-sm">
              {modalWorkout.blocks.map((b, idx) => (
                <div key={`${b.label}-${idx}`} className="inset-panel row-between" style={{ padding: '0.55rem 0.8rem' }}>
                  <div>
                    <strong style={{ fontSize: '0.85rem' }}>{idx + 1}. {b.label}</strong>
                    <div className="muted" style={{ fontSize: '0.76rem' }}>{b.description}</div>
                  </div>
                  <span className="pill mono" style={{ fontSize: '0.72rem' }}>{b.durationMinutes} min</span>
                </div>
              ))}
            </div>

            {!modalWorkout.isExamDay && modalWorkout.sessionType !== 'rest' && !modalWorkout.completed && (
              <div className="row-between">
                <span className="muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Cambiar deporte este día:</span>
                <div className="segmented-group">
                  <button
                    type="button"
                    aria-pressed={modalWorkout.modality === 'running'}
                    className="segmented-btn is-accent"
                    onClick={() => onSwapModality(modalWorkout.id, 'running')}
                  >
                    <PersonSimpleRun size={14} weight="duotone" aria-hidden="true" />
                    Running
                  </button>
                  <button
                    type="button"
                    aria-pressed={modalWorkout.modality === 'cycling'}
                    className="segmented-btn is-accent"
                    onClick={() => onSwapModality(modalWorkout.id, 'cycling')}
                  >
                    <Bicycle size={14} weight="duotone" aria-hidden="true" />
                    Bici
                  </button>
                  <button
                    type="button"
                    aria-pressed={modalWorkout.modality === 'soccer'}
                    className="segmented-btn is-accent"
                    onClick={() => onSwapModality(modalWorkout.id, 'soccer')}
                  >
                    <SoccerBall size={14} weight="duotone" aria-hidden="true" />
                    Fútbol
                  </button>
                  <button
                    type="button"
                    aria-pressed={modalWorkout.modality === 'walking'}
                    className="segmented-btn is-accent"
                    onClick={() => onSwapModality(modalWorkout.id, 'walking')}
                  >
                    <Footprints size={14} weight="duotone" aria-hidden="true" />
                    Caminar
                  </button>
                </div>
              </div>
            )}

            {swapCandidates.length > 0 && !modalWorkout.completed && (
              <details className="faq-details" style={{ padding: '0.55rem 0.85rem' }}>
                <summary style={{ fontSize: '0.82rem' }}>
                  <span className="row-wrap" style={{ gap: '0.4rem' }}>
                    <ArrowsLeftRight size={14} weight="duotone" aria-hidden="true" />
                    Mover este entreno a otro día de la Semana {activeWeek}
                  </span>
                </summary>
                <div className="grid-3" style={{ gap: '0.4rem', marginTop: '0.55rem' }}>
                  {swapCandidates.map((cand) => (
                    <button
                      key={cand.id}
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        onSwapWorkoutDays(modalWorkout.id, cand.id);
                        setModalWorkoutId(null);
                      }}
                    >
                      {formatShortDate(cand.date)}
                    </button>
                  ))}
                </div>
              </details>
            )}

            <div className="row-between">
              <div className="row-wrap" style={{ gap: '0.4rem' }}>
                {!modalWorkout.completed && modalWorkout.blocks.length > 0 && (
                  <button
                    type="button"
                    className="btn lovable-cta-btn"
                    onClick={() => {
                      const target = modalWorkout;
                      setModalWorkoutId(null);
                      onStartTimer(target, 0);
                    }}
                  >
                    <Timer size={16} weight="duotone" aria-hidden="true" />
                    Iniciar Cronómetro
                  </button>
                )}
                {modalWorkout.isExamDay && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setModalWorkoutId(null);
                      onOpenExam();
                    }}
                  >
                    <ClipboardText size={15} weight="duotone" aria-hidden="true" />
                    Ir a examen de nivel
                  </button>
                )}
              </div>

              <button
                type="button"
                className={`btn ${modalWorkout.completed ? 'btn-secondary' : 'btn-emerald'}`}
                onClick={() => {
                  const target = modalWorkout;
                  setModalWorkoutId(null);
                  onSelectComplete(target);
                }}
              >
                <CheckCircle size={16} weight="duotone" aria-hidden="true" />
                {modalWorkout.completed ? 'Editar registro' : 'Marcar completado'}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
