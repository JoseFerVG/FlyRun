import { useState } from 'react';
import {
  CheckCircle,
  ClipboardText,
  Medal,
  SlidersHorizontal,
  Timer,
  Trophy,
} from '@phosphor-icons/react';
import type { PhysicalExamResult, PhysicalExamType, UserProfile, WorkoutSession } from '../types/fitness';
import {
  calculateRacePredictions,
  calculateTrainingZones,
  calculateVDOTFromExam,
  calculateVDOTFromSpeed,
  convertSpeedValue,
  formatShortUserName,
  getLynxLevel,
  getModalityLabel,
  paceMinSecToSecPerKm,
  secPerKmToPaceMinSec,
  type SpeedUnit,
} from '../services/scienceEngine';
import { BADGES_CATALOG } from '../data/runningKnowledge';
import { BiometricRing, SpotlightCard } from './MotionPrimitives';
import { assetUrl } from '../services/assets';
import { SIMULATED_USER_PERSONAS } from '../data/userPersonas';

type ExamUnitMode = 'standard' | SpeedUnit;

interface StatsAndExamViewProps {
  profile: UserProfile;
  workouts: WorkoutSession[];
  exams: PhysicalExamResult[];
  onSubmitExam: (
    examType: PhysicalExamType,
    rawValue: number,
    secondaryValue?: number,
    heartRateBpm?: number,
    customSummaryLabel?: string
  ) => void;
  onEditProfile: () => void;
}

const FRIENDLY_ZONE_META: Record<string, { title: string; feel: string }> = {
  Z1: {
    title: 'Ritmo Suave / Calentamiento',
    feel: 'Puedes hablar frases largas sin que te falte el aire.',
  },
  Z2: {
    title: 'Ritmo Cómodo de Rodaje',
    feel: 'Paso estable y agradable para acumular minutos.',
  },
  Z3: {
    title: 'Ritmo Alegre Controlado',
    feel: 'Exigente pero sostenible; solo frases cortas al hablar.',
  },
  Z4: {
    title: 'Ritmo Rápido / Series',
    feel: 'Esfuerzo alto ideal para bloques cortos y rápidos.',
  },
};

export function StatsAndExamView({
  profile,
  workouts,
  exams,
  onSubmitExam,
  onEditProfile,
}: StatsAndExamViewProps) {
  const [examType, setExamType] = useState<PhysicalExamType>('cooper_12min');
  const [examUnitMode, setExamUnitMode] = useState<ExamUnitMode>('standard');
  const [speedValue, setSpeedValue] = useState<number>(11.2);
  const [paceMinPart, setPaceMinPart] = useState<number>(5);
  const [paceSecPart, setPaceSecPart] = useState<number>(21);
  const [speedDuration, setSpeedDuration] = useState<number>(12);
  const [rawValue, setRawValue] = useState<number>(2250);
  const [timeMins, setTimeMins] = useState<number>(25);
  const [timeSecs, setTimeSecs] = useState<number>(30);
  const [heartRate, setHeartRate] = useState<number>(152);
  const [examRpe, setExamRpe] = useState<number>(7);
  const [examSubmittedMsg, setExamSubmittedMsg] = useState<string | null>(null);

  const zones = calculateTrainingZones(profile.vdot, profile.maxHR, profile.restHR).slice(0, 4);
  const predictions = calculateRacePredictions(profile.vdot);
  const levelInfo = getLynxLevel(profile.vdot, profile.xp);
  const bmi = (profile.weightKg / Math.pow(profile.heightCm / 100, 2)).toFixed(1);
  const completedSessions = workouts.filter((w) => w.completed);
  const shortName = formatShortUserName(profile.displayName, profile.email);

  const isSplitTimeExam = examType === 'time_trial_5k' || examType === 'rockport_walk_1600m';

  const handleExamUnitChange = (nextMode: ExamUnitMode) => {
    if (nextMode !== 'standard' && examUnitMode !== 'standard') {
      const currentSec =
        examUnitMode === 'min_km'
          ? paceMinSecToSecPerKm(paceMinPart, paceSecPart)
          : convertSpeedValue(speedValue, examUnitMode).secPerKm;
      const conv = convertSpeedValue(3600 / Math.max(120, currentSec), 'kmh');
      const parts = secPerKmToPaceMinSec(conv.secPerKm);
      setPaceMinPart(parts.mins);
      setPaceSecPart(parts.secs);
      setSpeedValue(nextMode === 'kmh' ? conv.kmh : nextMode === 'km_min' ? conv.kmPerMin : conv.minPerKmDecimal);
    }
    setExamUnitMode(nextMode);
  };

  const liveSpeedConv =
    examUnitMode === 'min_km'
      ? convertSpeedValue(3600 / Math.max(120, paceMinSecToSecPerKm(paceMinPart, paceSecPart)), 'kmh')
      : examUnitMode !== 'standard'
      ? convertSpeedValue(speedValue, examUnitMode)
      : examType === 'cooper_12min'
      ? convertSpeedValue((Math.max(400, rawValue) / 1000) * 5, 'kmh')
      : examType === 'time_trial_5k'
      ? convertSpeedValue(5 / (Math.max(8, timeMins + timeSecs / 60) / 60), 'kmh')
      : examType === 'rockport_walk_1600m'
      ? convertSpeedValue(1.6 / (Math.max(6, timeMins + timeSecs / 60) / 60), 'kmh')
      : null;

  const handleExamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (examUnitMode !== 'standard') {
      const resolvedSec =
        examUnitMode === 'min_km'
          ? paceMinSecToSecPerKm(paceMinPart, paceSecPart)
          : convertSpeedValue(speedValue, examUnitMode).secPerKm;
      const conv = convertSpeedValue(3600 / Math.max(120, resolvedSec), 'kmh');

      if (examType === 'cooper_12min') {
        const distMeters = Math.max(400, Math.round(conv.kmPerMin * 12 * 1000));
        const customLabel = `Test 12 min (${conv.kmh.toFixed(1).replace('.', ',')} km/h · ${conv.paceFormatted} /km)`;
        onSubmitExam('cooper_12min', distMeters, examRpe, heartRate, customLabel);
      } else if (examType === 'time_trial_5k') {
        const timeMin = Number(((5 / Math.max(3, conv.kmh)) * 60).toFixed(2));
        const customLabel = `Carrera 5 km (${conv.kmh.toFixed(1).replace('.', ',')} km/h · ${conv.paceFormatted} /km)`;
        onSubmitExam('time_trial_5k', timeMin, examRpe, heartRate, customLabel);
      } else if (examType === 'rockport_walk_1600m') {
        const timeMin = Number(((1.6 / Math.max(2.5, conv.kmh)) * 60).toFixed(2));
        const customLabel = `Caminata rápida (${conv.kmh.toFixed(1).replace('.', ',')} km/h)`;
        onSubmitExam('rockport_walk_1600m', timeMin, examRpe, heartRate, customLabel);
      } else {
        const dur = Math.max(3, Math.min(60, speedDuration));
        const calc = calculateVDOTFromSpeed('kmh', conv.kmh, 12);
        const continuousEquivalentMeters = Math.max(
          800,
          Math.round(504.9 + 44.73 * Math.min(58, (calc.vdot * 0.55 + calculateVDOTFromExam('caco_continuous_test', dur, { secondaryValue: examRpe }) * 0.45)))
        );
        const customLabel = `Prueba continua (${dur} min a ${conv.kmh.toFixed(1).replace('.', ',')} km/h)`;
        onSubmitExam('cooper_12min', continuousEquivalentMeters, examRpe, heartRate, customLabel);
      }
    } else {
      const numericVal = isSplitTimeExam
        ? Number((Math.max(1, timeMins) + Math.max(0, Math.min(59, timeSecs)) / 60).toFixed(2))
        : rawValue;
      onSubmitExam(examType, numericVal, examRpe, heartRate);
    }
    setExamSubmittedMsg('¡Nivel actualizado! Tus ritmos diarios se han ajustado a tu estado de forma.');
  };

  const matchedPersona = SIMULATED_USER_PERSONAS.find(
    (p) => p.profile.uid === profile.uid || (Boolean(profile.email) && p.profile.email === profile.email)
  );
  const avatarSrc = profile.photoURL || (matchedPersona ? assetUrl(matchedPersona.avatarFile) : assetUrl('images/avatar-javier.jpg'));

  return (
    <div className="stack-lg">
      {/* 1. TU ESTADO DE FORMA ACTUAL (CLARO Y VISUAL) */}
      <SpotlightCard as="section" staggerIndex={0} className="stack-md" aria-label="Estado de forma actual">
        <div className="row-between">
          <div className="row-wrap" style={{ gap: '0.85rem' }}>
            <img
              src={avatarSrc}
              alt={shortName}
              width={54}
              height={54}
              className="athlete-avatar"
              style={{ inlineSize: '54px', blockSize: '54px' }}
            />
            <div>
              <span className="pill lovable-badge">Estado de forma de {shortName}</span>
              <h1 style={{ margin: '0.3rem 0 0', fontSize: '1.3rem', letterSpacing: '-0.02em' }}>
                Nivel {levelInfo.level} · {levelInfo.spanishTitle}
              </h1>
            </div>
          </div>

          <button type="button" className="btn btn-secondary btn-sm" onClick={onEditProfile}>
            <SlidersHorizontal size={15} weight="duotone" aria-hidden="true" />
            Cambiar datos y objetivo
          </button>
        </div>

        <div className="inset-panel row-between" style={{ padding: '0.9rem 1rem' }}>
          <div className="row-wrap" style={{ gap: '1rem' }}>
            <BiometricRing
              percent={Math.min(100, Math.round((profile.level / 10) * 100))}
              label="Tu Nivel"
              valueText={`${levelInfo.level}/10`}
              subText={`Índice ${profile.vdot}`}
              color="var(--cobalt)"
              size={80}
            />
            <div className="stack-sm" style={{ gap: '0.25rem' }}>
              <strong style={{ fontSize: '0.96rem' }}>Progreso hacia Nivel {Math.min(10, levelInfo.level + 1)}</strong>
              <span className="muted" style={{ fontSize: '0.82rem' }}>
                {profile.age} años · {profile.weightKg} kg · {profile.heightCm} cm (IMC {bmi}) · {profile.trainingDaysPerWeek} días/semana
              </span>
              <div className="progress-track" style={{ inlineSize: 'min(260px, 60vw)', marginTop: '0.2rem' }}>
                <div className="progress-fill" style={{ inlineSize: `${levelInfo.progressPct}%` }} />
              </div>
            </div>
          </div>
          <span className="pill pill-emerald mono">{profile.streakDays} días seguidos</span>
        </div>

        {/* 2. TUS RITMOS RECOMENDADOS (SIN JERGA TÉCNICA) */}
        <div className="stack-sm">
          <strong style={{ fontSize: '0.96rem' }}>Tus ritmos diarios para entrenar</strong>
          <div className="grid-2" style={{ gap: '0.75rem' }}>
            {zones.map((z) => {
              const info = FRIENDLY_ZONE_META[z.id] ?? { title: z.name, feel: z.purpose };
              return (
                <div key={z.id} className="inset-panel stack-sm" style={{ background: 'var(--bg-surface)', padding: '0.78rem 0.95rem' }}>
                  <div className="row-between">
                    <strong style={{ fontSize: '0.92rem' }}>{info.title}</strong>
                    <span className="pill mono" style={{ fontSize: '0.72rem', color: 'var(--cobalt)' }}>
                      {z.hrMin}–{z.hrMax} ppm
                    </span>
                  </div>
                  <div className="mono" style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--accent)' }}>
                    {z.speedKmhFormatted} · {z.paceFormatted}
                  </div>
                  <div className="muted mono" style={{ fontSize: '0.74rem' }}>
                    Equivalente: {z.speedKmMinFormatted}
                  </div>
                  <p className="muted" style={{ margin: 0, fontSize: '0.79rem' }}>{info.feel}</p>
                </div>
              );
            })}
          </div>
        </div>
      </SpotlightCard>

      {/* 3. MARCAS ESTIMADAS EN CARRERA */}
      <SpotlightCard as="section" staggerIndex={1} className="stack-md" aria-label="Tiempos estimados en carrera">
        <div className="row-wrap">
          <span className="duotone-icon-box is-cobalt">
            <Timer size={18} weight="duotone" aria-hidden="true" />
          </span>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.14rem' }}>¿En cuánto tiempo podrías correr estas distancias hoy?</h2>
            <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>
              Estimación orientativa a tu ritmo máximo actual en km/h, km/min y tiempo por km.
            </p>
          </div>
        </div>

        <div className="grid-4" style={{ gap: '0.75rem' }}>
          {predictions.slice(0, 4).map((p) => (
            <div key={p.distanceLabel} className="inset-panel stack-sm" style={{ background: 'var(--bg-surface)' }}>
              <span className="muted" style={{ fontSize: '0.76rem', fontWeight: 600 }}>{p.distanceLabel}</span>
              <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent)' }}>
                {p.timeFormatted}
              </div>
              <div className="muted mono" style={{ fontSize: '0.75rem' }}>
                {p.speedKmh} · {p.pacePerKm}
              </div>
              <div className="muted mono" style={{ fontSize: '0.72rem' }}>
                {p.speedKmMin}
              </div>
            </div>
          ))}
        </div>
      </SpotlightCard>

      {/* 4. TEST RÁPIDO DE NIVEL */}
      <SpotlightCard id="physical-exam-section" as="section" staggerIndex={2} className="stack-md" aria-label="Test rápido de nivel">
        <div className="row-between">
          <div>
            <span className="pill pill-cyan">
              <ClipboardText size={14} weight="duotone" aria-hidden="true" />
              Test rápido de nivel
            </span>
            <h2 style={{ margin: '0.35rem 0 0', fontSize: '1.2rem' }}>
              Actualiza tus ritmos cuando mejores tu marca
            </h2>
            <p className="secondary" style={{ margin: '0.2rem 0 0', fontSize: '0.85rem' }}>
              Elige una prueba sencilla o escribe la velocidad media a la que corriste hoy.
            </p>
          </div>

          <div className="segmented-group" role="group" aria-label="Unidad del test">
            <button
              type="button"
              aria-pressed={examUnitMode === 'standard'}
              className="segmented-btn is-accent"
              onClick={() => handleExamUnitChange('standard')}
            >
              Marca
            </button>
            <button
              type="button"
              aria-pressed={examUnitMode === 'kmh'}
              className="segmented-btn is-accent mono"
              onClick={() => handleExamUnitChange('kmh')}
            >
              km/h
            </button>
            <button
              type="button"
              aria-pressed={examUnitMode === 'km_min'}
              className="segmented-btn is-accent mono"
              onClick={() => handleExamUnitChange('km_min')}
            >
              km/min
            </button>
            <button
              type="button"
              aria-pressed={examUnitMode === 'min_km'}
              className="segmented-btn is-accent mono"
              onClick={() => handleExamUnitChange('min_km')}
            >
              min/km
            </button>
          </div>
        </div>

        <form onSubmit={handleExamSubmit} className="grid-3">
          <div className="field">
            <label htmlFor="exam-selector">¿Qué prueba quieres registrar?</label>
            <select
              id="exam-selector"
              name="examType"
              className="select"
              value={examType}
              onChange={(e) => {
                const next = e.target.value as PhysicalExamType;
                setExamType(next);
                if (next === 'cooper_12min') {
                  setRawValue(2250);
                  setSpeedDuration(12);
                } else if (next === 'time_trial_5k') {
                  setTimeMins(25);
                  setTimeSecs(30);
                } else if (next === 'rockport_walk_1600m') {
                  setTimeMins(14);
                  setTimeSecs(20);
                } else {
                  setRawValue(20);
                  setSpeedDuration(20);
                }
              }}
            >
              <option value="cooper_12min">Distancia en 12 minutos</option>
              <option value="time_trial_5k">Tu tiempo en 5 kilómetros</option>
              <option value="rockport_walk_1600m">Caminata rápida de 1,6 km</option>
              <option value="caco_continuous_test">Minutos trotando sin parar</option>
            </select>
          </div>

          {examUnitMode === 'min_km' ? (
            <div className="field">
              <label htmlFor="exam-pace-mins">Ritmo medio (min : seg /km)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.4rem', alignItems: 'center' }}>
                <input
                  id="exam-pace-mins"
                  type="number"
                  min={2}
                  max={18}
                  className="input mono"
                  value={paceMinPart}
                  onChange={(e) => setPaceMinPart(Number(e.target.value))}
                  required
                />
                <span className="mono muted" style={{ fontWeight: 700 }}>:</span>
                <input
                  id="exam-pace-secs"
                  type="number"
                  min={0}
                  max={59}
                  className="input mono"
                  value={paceSecPart}
                  onChange={(e) => setPaceSecPart(Number(e.target.value))}
                  required
                />
              </div>
              {liveSpeedConv && (
                <span className="muted mono" style={{ fontSize: '0.73rem' }}>
                  {liveSpeedConv.kmh.toFixed(1).replace('.', ',')} km/h · {liveSpeedConv.kmPerMin.toFixed(3).replace('.', ',')} km/min
                </span>
              )}
            </div>
          ) : examUnitMode !== 'standard' ? (
            <div className="field">
              <label htmlFor="exam-speed-val">
                {examUnitMode === 'kmh' ? 'Velocidad media (km/h)' : 'Velocidad (km/min)'}
              </label>
              <input
                id="exam-speed-val"
                type="number"
                min={examUnitMode === 'km_min' ? 0.04 : 2}
                max={examUnitMode === 'km_min' ? 0.5 : 32}
                step={examUnitMode === 'km_min' ? '0.005' : '0.1'}
                className="input mono"
                value={speedValue}
                onChange={(e) => setSpeedValue(Number(e.target.value))}
                required
              />
              {liveSpeedConv && (
                <span className="muted mono" style={{ fontSize: '0.73rem' }}>
                  {liveSpeedConv.kmh.toFixed(1).replace('.', ',')} km/h · {liveSpeedConv.paceFormatted} /km
                </span>
              )}
            </div>
          ) : isSplitTimeExam ? (
            <div className="field">
              <label htmlFor="exam-mins">Tiempo tardado (min : seg)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.4rem', alignItems: 'center' }}>
                <input
                  id="exam-mins"
                  type="number"
                  min={8}
                  max={70}
                  className="input mono"
                  value={timeMins}
                  onChange={(e) => setTimeMins(Number(e.target.value))}
                  required
                />
                <span className="mono muted" style={{ fontWeight: 700 }}>:</span>
                <input
                  id="exam-secs"
                  type="number"
                  min={0}
                  max={59}
                  className="input mono"
                  value={timeSecs}
                  onChange={(e) => setTimeSecs(Number(e.target.value))}
                  required
                />
              </div>
              {liveSpeedConv && (
                <span className="muted mono" style={{ fontSize: '0.73rem' }}>
                  {liveSpeedConv.kmh.toFixed(1).replace('.', ',')} km/h · {liveSpeedConv.paceFormatted} /km
                </span>
              )}
            </div>
          ) : (
            <div className="field">
              <label htmlFor="exam-value">
                {examType === 'cooper_12min' ? 'Metros recorridos en 12 min' : 'Minutos seguidos trotando'}
              </label>
              <input
                id="exam-value"
                type="number"
                min={1}
                max={6000}
                step="1"
                className="input mono"
                value={rawValue}
                onChange={(e) => setRawValue(Number(e.target.value))}
                required
              />
              {liveSpeedConv && (
                <span className="muted mono" style={{ fontSize: '0.73rem' }}>
                  {liveSpeedConv.kmh.toFixed(1).replace('.', ',')} km/h · {liveSpeedConv.paceFormatted} /km
                </span>
              )}
            </div>
          )}

          {examUnitMode !== 'standard' && examType === 'caco_continuous_test' ? (
            <div className="field">
              <label htmlFor="exam-speed-dur">Duración (minutos)</label>
              <input
                id="exam-speed-dur"
                type="number"
                min={3}
                max={60}
                className="input mono"
                value={speedDuration}
                onChange={(e) => setSpeedDuration(Number(e.target.value))}
              />
            </div>
          ) : (
            <div className="field">
              <label htmlFor="exam-hr">Pulsaciones finales (opcional)</label>
              <input
                id="exam-hr"
                type="number"
                min={80}
                max={215}
                className="input mono"
                value={heartRate}
                onChange={(e) => setHeartRate(Number(e.target.value))}
              />
            </div>
          )}

          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="exam-rpe">¿Cómo de duro te resultó? ({examRpe}/10)</label>
            <input
              id="exam-rpe"
              type="range"
              min={2}
              max={10}
              value={examRpe}
              onChange={(e) => setExamRpe(Number(e.target.value))}
            />
          </div>

          <div className="row-wrap" style={{ gridColumn: '1 / -1' }}>
            <button type="submit" className="btn lovable-cta-btn">
              <Trophy size={16} weight="duotone" aria-hidden="true" />
              Actualizar mi nivel y ritmos
            </button>
            {examSubmittedMsg && (
              <span style={{ color: 'var(--pine)', fontSize: '0.84rem', fontWeight: 600 }}>
                {examSubmittedMsg}
              </span>
            )}
          </div>
        </form>

        {exams.length > 0 && (
          <div className="stack-sm">
            <strong style={{ fontSize: '0.86rem' }}>Tus evaluaciones recientes</strong>
            {exams.slice(0, 4).map((ex) => (
              <div key={ex.id} className="inset-panel row-between" style={{ padding: '0.55rem 0.85rem', fontSize: '0.82rem' }}>
                <span>{ex.summary}</span>
                <span className="muted mono">{ex.date}</span>
              </div>
            ))}
          </div>
        )}
      </SpotlightCard>

      {/* 5. LOGROS E HISTORIAL RECIENTE */}
      <SpotlightCard as="section" staggerIndex={3} className="stack-md">
        <div className="row-between">
          <div className="row-wrap">
            <Medal size={19} weight="duotone" color="var(--accent)" aria-hidden="true" />
            <h2 style={{ margin: 0, fontSize: '1.08rem' }}>Tus logros y sesiones completadas</h2>
          </div>
          <span className="pill pill-emerald mono">
            {profile.unlockedBadges.length}/{BADGES_CATALOG.length} logros · {completedSessions.length} sesiones
          </span>
        </div>

        <div className="grid-4" style={{ gap: '0.6rem' }}>
          {BADGES_CATALOG.map((b) => {
            const unlocked = profile.unlockedBadges.includes(b.id);
            return (
              <div
                key={b.id}
                className="inset-panel stack-sm"
                style={{
                  borderColor: unlocked ? 'var(--pine-border)' : 'var(--border-hairline)',
                  background: unlocked ? 'var(--pine-soft)' : 'var(--bg-inset)',
                  padding: '0.68rem 0.82rem',
                }}
              >
                <div className="row-between">
                  <strong style={{ fontSize: '0.84rem' }}>{b.title}</strong>
                  {unlocked && <CheckCircle size={15} weight="duotone" color="var(--pine)" aria-hidden="true" />}
                </div>
                <span className="muted" style={{ fontSize: '0.75rem' }}>{b.description}</span>
              </div>
            );
          })}
        </div>

        {completedSessions.length > 0 && (
          <div className="scroll-table-wrap">
            <table className="zone-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Sesión</th>
                  <th>Deporte</th>
                  <th>Duración</th>
                </tr>
              </thead>
              <tbody>
                {completedSessions.slice(0, 8).map((s) => (
                  <tr key={s.id}>
                    <td className="mono">{s.date}</td>
                    <td style={{ fontWeight: 600 }}>{s.title}</td>
                    <td>{getModalityLabel(s.completedModality ?? s.modality).split(' ')[0]}</td>
                    <td className="mono">{s.actualDurationMinutes ?? s.durationMinutes} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SpotlightCard>
    </div>
  );
}
