import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import type { CardioModality, WorkoutSession } from '../types/fitness';

interface WorkoutLogDialogProps {
  workout: WorkoutSession | null;
  onClose: () => void;
  onConfirmComplete: (
    workoutId: string,
    rpe: number,
    actualDurationMinutes: number,
    actualDistanceKm: number,
    modality: CardioModality,
    notes: string
  ) => void;
}

export function WorkoutLogDialog({ workout, onClose, onConfirmComplete }: WorkoutLogDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [rpe, setRpe] = useState(5);
  const [duration, setDuration] = useState(35);
  const [distance, setDistance] = useState(4.5);
  const [modality, setModality] = useState<CardioModality>('running');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (workout) {
      setDuration(workout.durationMinutes);
      setDistance(workout.targetDistanceKm);
      setModality(workout.modality);
      setRpe(workout.sessionType === 'intervals_z4' || workout.sessionType === 'soccer' ? 7 : 5);
      setNotes('');
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [workout]);

  const handleClose = () => {
    if (dialogRef.current?.open) {
      dialogRef.current.close();
    }
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workout) return;
    onConfirmComplete(workout.id, rpe, duration, distance, modality, notes.trim());
    handleClose();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="workout-log-title"
      onCancel={(e) => {
        e.preventDefault();
        handleClose();
      }}
    >
      {workout && (
        <div className="stack-md" style={{ padding: '1.4rem' }}>
          <div className="row-between">
            <div>
              <span className="pill pill-emerald">Registro de Entrenamiento</span>
              <h2 id="workout-log-title" style={{ margin: '0.35rem 0 0', fontSize: '1.2rem' }}>
                {workout.title}
              </h2>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleClose}
              aria-label="Cerrar ventana"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="stack-md">
            <div className="grid-2">
              <div className="field">
                <label htmlFor="log-modality">Modalidad realizada</label>
                <select
                  id="log-modality"
                  className="select"
                  value={modality}
                  onChange={(e) => setModality(e.target.value as CardioModality)}
                >
                  <option value="running">Running (Carrera)</option>
                  <option value="cycling">Ciclismo / Bici</option>
                  <option value="soccer">Partido de Fútbol</option>
                  <option value="walking">Caminata Activa</option>
                  <option value="swimming">Natación / Elíptica</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="log-duration">Duración real (minutos)</label>
                <input
                  id="log-duration"
                  type="number"
                  min={5}
                  max={300}
                  className="input"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="log-distance">Distancia aproximada (km)</label>
                <input
                  id="log-distance"
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  className="input"
                  value={distance}
                  onChange={(e) => setDistance(Number(e.target.value))}
                />
              </div>

              <div className="field">
                <label htmlFor="log-rpe">Esfuerzo Percibido RPE ({rpe}/10)</label>
                <input
                  id="log-rpe"
                  type="range"
                  min={1}
                  max={10}
                  value={rpe}
                  onChange={(e) => setRpe(Number(e.target.value))}
                />
                <span className="muted" style={{ fontSize: '0.76rem' }}>
                  {rpe <= 4
                    ? 'Muy cómodo / Conversacional'
                    : rpe <= 6
                    ? 'Moderado / Controlado'
                    : rpe <= 8
                    ? 'Exigente / Umbral'
                    : 'Máximo / Casi al límite'}
                </span>
              </div>
            </div>

            <div className="field">
              <label htmlFor="log-notes">Sensaciones (opcional)</label>
              <textarea
                id="log-notes"
                rows={2}
                className="textarea"
                placeholder="Ej: Piernas ligeras en el bloque CaCo, buenas pulsaciones..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="row-between">
              <button type="button" className="btn btn-secondary" onClick={handleClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-emerald" autoFocus>
                <CheckCircle2 size={17} aria-hidden="true" />
                Guardar Sesión y Actualizar Nivel
              </button>
            </div>
          </form>
        </div>
      )}
    </dialog>
  );
}
