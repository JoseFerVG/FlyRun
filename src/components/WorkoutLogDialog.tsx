import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import type { CardioModality, WorkoutSession } from '../types/fitness';
import { convertSpeedValue, formatPace, type SpeedUnit } from '../services/scienceEngine';

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
  const [speedUnit, setSpeedUnit] = useState<SpeedUnit>('kmh');
  const [speedInput, setSpeedInput] = useState(10.0);
  const [modality, setModality] = useState<CardioModality>('running');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (workout) {
      const dur = Math.max(5, workout.durationMinutes);
      const dist = Math.max(0.5, workout.targetDistanceKm);
      setDuration(dur);
      setDistance(dist);
      const initialKmh = Number(((dist / dur) * 60).toFixed(1));
      setSpeedUnit('kmh');
      setSpeedInput(initialKmh);
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

  const syncSpeedFromDistanceDuration = (nextDist: number, nextDur: number, unit: SpeedUnit) => {
    if (nextDist <= 0 || nextDur <= 0) return;
    const secPerKm = (nextDur * 60) / nextDist;
    const conv = convertSpeedValue(3600 / Math.max(120, secPerKm), 'kmh');
    setSpeedInput(unit === 'kmh' ? conv.kmh : unit === 'km_min' ? conv.kmPerMin : conv.minPerKmDecimal);
  };

  const handleDurationChange = (nextDur: number) => {
    setDuration(nextDur);
    syncSpeedFromDistanceDuration(distance, nextDur, speedUnit);
  };

  const handleDistanceChange = (nextDist: number) => {
    setDistance(nextDist);
    syncSpeedFromDistanceDuration(nextDist, duration, speedUnit);
  };

  const handleUnitChange = (nextUnit: SpeedUnit) => {
    const conv = convertSpeedValue(speedInput, speedUnit);
    setSpeedUnit(nextUnit);
    setSpeedInput(nextUnit === 'kmh' ? conv.kmh : nextUnit === 'km_min' ? conv.kmPerMin : conv.minPerKmDecimal);
  };

  const handleSpeedInputChange = (nextVal: number) => {
    setSpeedInput(nextVal);
    if (!Number.isFinite(nextVal) || nextVal <= 0) return;
    const conv = convertSpeedValue(nextVal, speedUnit);
    const derivedDist = Number(((conv.kmh * Math.max(5, duration)) / 60).toFixed(2));
    setDistance(derivedDist);
  };

  const safeSecPerKm =
    distance > 0 && duration > 0
      ? (duration * 60) / distance
      : convertSpeedValue(speedInput, speedUnit).secPerKm;
  const liveConv = convertSpeedValue(3600 / Math.max(120, safeSecPerKm), 'kmh');

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
              <span className="pill pill-emerald">Registro de sesión</span>
              <h2 id="workout-log-title" style={{ margin: '0.35rem 0 0', fontSize: '1.15rem' }}>
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
                  name="logModality"
                  className="select"
                  value={modality}
                  onChange={(e) => setModality(e.target.value as CardioModality)}
                >
                  <option value="running">Running</option>
                  <option value="cycling">Ciclismo / Bicicleta</option>
                  <option value="soccer">Partido de fútbol</option>
                  <option value="walking">Caminata activa</option>
                  <option value="swimming">Natación / Elíptica</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="log-duration">Duración real (minutos)</label>
                <input
                  id="log-duration"
                  name="logDuration"
                  type="number"
                  min={5}
                  max={300}
                  className="input"
                  value={duration}
                  onChange={(e) => handleDurationChange(Number(e.target.value))}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="log-distance">Distancia aproximada (km)</label>
                <input
                  id="log-distance"
                  name="logDistance"
                  type="number"
                  min={0}
                  max={150}
                  step="0.05"
                  className="input"
                  value={distance}
                  onChange={(e) => handleDistanceChange(Number(e.target.value))}
                />
              </div>

              <div className="field">
                <div className="row-between">
                  <label htmlFor="log-speed">Velocidad o ritmo</label>
                  <div className="segmented-group" role="group" aria-label="Unidad de velocidad">
                    {(
                      [
                        { id: 'kmh', label: 'km/h' },
                        { id: 'km_min', label: 'km/min' },
                        { id: 'min_km', label: 'min/km' },
                      ] as const
                    ).map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        aria-pressed={speedUnit === u.id}
                        className="segmented-btn is-accent mono"
                        onClick={() => handleUnitChange(u.id)}
                      >
                        {u.label}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  id="log-speed"
                  name="logSpeed"
                  type="number"
                  min={speedUnit === 'km_min' ? 0.04 : 2}
                  max={speedUnit === 'km_min' ? 0.5 : 35}
                  step={speedUnit === 'km_min' ? '0.005' : '0.1'}
                  className="input mono"
                  value={speedInput}
                  onChange={(e) => handleSpeedInputChange(Number(e.target.value))}
                />
                <span className="muted mono" style={{ fontSize: '0.73rem' }}>
                  {liveConv.kmh.toFixed(1).replace('.', ',')} km/h · {liveConv.kmPerMin.toFixed(3).replace('.', ',')} km/min · {formatPace(safeSecPerKm)} /km
                </span>
              </div>
            </div>

            <div className="field">
              <label htmlFor="log-rpe">Esfuerzo percibido RPE ({rpe}/10)</label>
              <input
                id="log-rpe"
                name="logRpe"
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
                  : 'Máximo'}
              </span>
            </div>

            <div className="field">
              <label htmlFor="log-notes">Sensaciones (opcional)</label>
              <textarea
                id="log-notes"
                name="logNotes"
                rows={2}
                className="textarea"
                placeholder="Ej. Buenas sensaciones en los tramos de trote, pulso estable…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="row-between">
              <button type="button" className="btn btn-secondary" onClick={handleClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-emerald">
                <CheckCircle2 size={16} aria-hidden="true" />
                Guardar entrenamiento
              </button>
            </div>
          </form>
        </div>
      )}
    </dialog>
  );
}