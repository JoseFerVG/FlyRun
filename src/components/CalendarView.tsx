import { useState } from 'react';
import { Bike, Calendar, CheckCircle2, ClipboardCheck, Flame } from 'lucide-react';
import type { CardioModality, WorkoutSession } from '../types/fitness';
import { getModalityLabel } from '../services/scienceEngine';

interface CalendarViewProps {
  workouts: WorkoutSession[];
  onSelectComplete: (workout: WorkoutSession) => void;
  onSwapModality: (workoutId: string, modality: CardioModality) => void;
  onOpenExam: () => void;
}

export function CalendarView({
  workouts,
  onSelectComplete,
  onSwapModality,
  onOpenExam,
}: CalendarViewProps) {
  const [selectedId, setSelectedId] = useState<string>(workouts[0]?.id ?? '');
  const [activeWeek, setActiveWeek] = useState<number>(1);

  const selected = workouts.find((w) => w.id === selectedId) ?? workouts[0];
  const weekWorkouts = workouts.slice((activeWeek - 1) * 7, activeWeek * 7);

  const formatShortDate = (iso: string) => {
    const d = new Date(`${iso}T12:00:00`);
    return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <div className="stack-lg">
      <section className="card stack-md">
        <div className="row-between">
          <div className="row-wrap">
            <Calendar size={20} color="#fb923c" aria-hidden="true" />
            <div>
              <h1 style={{ margin: 0, fontSize: '1.35rem' }}>Calendario Científico de 4 Semanas</h1>
              <p className="muted" style={{ margin: 0, fontSize: '0.84rem' }}>
                Distribución periodizada según tus días elegidos, método 80/20 o CaCo, y Días de Examen Físico programados.
              </p>
            </div>
          </div>

          <div className="row-wrap" role="tablist" aria-label="Seleccionar semana del calendario">
            {[1, 2, 3, 4].map((wk) => (
              <button
                key={wk}
                type="button"
                role="tab"
                aria-selected={activeWeek === wk}
                className={`btn btn-sm ${activeWeek === wk ? 'btn-primary' : 'btn-secondary'}`}
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
                onClick={() => setSelectedId(w.id)}
              >
                <div className="row-between" style={{ inlineSize: '100%' }}>
                  <span className="muted" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize' }}>
                    {formatShortDate(w.date)}
                  </span>
                  {isToday && <span className="pill pill-amber">Hoy</span>}
                  {isTomorrow && <span className="pill pill-cyan">Mañana</span>}
                  {w.completed && <CheckCircle2 size={15} color="#34d399" aria-hidden="true" />}
                </div>

                <div style={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.3 }}>{w.title}</div>

                <div className="row-between" style={{ inlineSize: '100%', marginBlockStart: 'auto' }}>
                  <span className="muted mono" style={{ fontSize: '0.74rem' }}>
                    {w.durationMinutes} min · {w.targetZone}
                  </span>
                  <span className="mono" style={{ fontSize: '0.74rem', color: '#fdba74', fontWeight: 700 }}>
                    {w.cardioPoints} CP
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {selected && (
        <section className="card card-highlight stack-md" aria-label="Detalle del día seleccionado">
          <div className="row-between">
            <div>
              <div className="row-wrap">
                <span className="pill pill-amber">{formatShortDate(selected.date)}</span>
                <span className="pill">{selected.strategyTag}</span>
                <span className="pill pill-cyan">{getModalityLabel(selected.modality)}</span>
              </div>
              <h2 style={{ margin: '0.45rem 0 0', fontSize: '1.3rem' }}>{selected.title}</h2>
              <p className="muted" style={{ margin: '0.2rem 0 0', fontSize: '0.88rem' }}>
                {selected.subtitle}
              </p>
            </div>

            <div className="row-wrap">
              {selected.isExamDay && (
                <button type="button" className="btn btn-primary" onClick={onOpenExam}>
                  <ClipboardCheck size={17} aria-hidden="true" />
                  Ir al Examen Físico
                </button>
              )}
              <button
                type="button"
                className={`btn ${selected.completed ? 'btn-secondary' : 'btn-emerald'}`}
                onClick={() => onSelectComplete(selected)}
              >
                <CheckCircle2 size={17} aria-hidden="true" />
                {selected.completed ? 'Editar Registro' : 'Marcar como Completado'}
              </button>
            </div>
          </div>

          <div className="grid-4">
            <div style={{ background: 'rgba(9,14,26,0.72)', padding: '0.75rem', borderRadius: '12px' }}>
              <div className="muted" style={{ fontSize: '0.74rem' }}>Duración / Distancia</div>
              <div className="mono" style={{ fontWeight: 700 }}>
                {selected.durationMinutes} min · {selected.targetDistanceKm} km
              </div>
            </div>
            <div style={{ background: 'rgba(9,14,26,0.72)', padding: '0.75rem', borderRadius: '12px' }}>
              <div className="muted" style={{ fontSize: '0.74rem' }}>Ritmo Objetivo</div>
              <div className="mono" style={{ fontWeight: 700 }}>{selected.targetPace}</div>
            </div>
            <div style={{ background: 'rgba(9,14,26,0.72)', padding: '0.75rem', borderRadius: '12px' }}>
              <div className="muted" style={{ fontSize: '0.74rem' }}>Puntos Cardio / MET-m</div>
              <div className="mono" style={{ fontWeight: 700 }}>
                {selected.cardioPoints} CP · {selected.metMinutes} MET
              </div>
            </div>
            <div style={{ background: 'rgba(9,14,26,0.72)', padding: '0.75rem', borderRadius: '12px' }}>
              <div className="muted" style={{ fontSize: '0.74rem' }}>TRIMP / Calorías</div>
              <div className="mono" style={{ fontWeight: 700 }}>
                {selected.trimp} TRIMP · {selected.estimatedCalories} kcal
              </div>
            </div>
          </div>

          <div className="grid-2">
            <div className="stack-sm">
              <strong style={{ fontSize: '0.9rem' }}>Estructura paso a paso:</strong>
              {selected.blocks.map((b, i) => (
                <div
                  key={`${b.label}-${i}`}
                  style={{
                    background: 'rgba(9,14,26,0.68)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '0.7rem 0.85rem',
                  }}
                >
                  <div className="row-between">
                    <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{b.label}</span>
                    <span className="pill mono" style={{ fontSize: '0.72rem' }}>{b.durationMinutes} min</span>
                  </div>
                  <div style={{ color: '#fdba74', fontSize: '0.78rem' }}>{b.intensity}</div>
                  <div className="muted" style={{ fontSize: '0.8rem' }}>{b.description}</div>
                </div>
              ))}
            </div>

            <div className="stack-md">
              <div
                style={{
                  background: 'rgba(249, 115, 22, 0.08)',
                  border: '1px solid rgba(249, 115, 22, 0.28)',
                  borderRadius: '14px',
                  padding: '0.85rem',
                }}
              >
                <div className="row-wrap" style={{ marginBlockEnd: '0.3rem' }}>
                  <Flame size={15} color="#fb923c" aria-hidden="true" />
                  <strong style={{ fontSize: '0.88rem' }}>Nota de Coach Lince</strong>
                </div>
                <p className="secondary" style={{ margin: 0, fontSize: '0.84rem' }}>{selected.coachTip}</p>
              </div>

              {!selected.isExamDay && selected.sessionType !== 'rest' && (
                <div className="stack-sm">
                  <strong style={{ fontSize: '0.86rem' }}>Adaptar este día a otro modo cardio:</strong>
                  <div className="row-wrap">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => onSwapModality(selected.id, 'running')}
                    >
                      Running
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => onSwapModality(selected.id, 'cycling')}
                    >
                      <Bike size={14} aria-hidden="true" />
                      Cambiar a Bici
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => onSwapModality(selected.id, 'soccer')}
                    >
                      ⚽ Cambiar a Fútbol
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => onSwapModality(selected.id, 'walking')}
                    >
                      Caminata Activa
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
