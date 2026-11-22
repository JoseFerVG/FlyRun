import { useState } from 'react';
import { Award, Check, Copy, Edit3, Lock } from 'lucide-react';
import { CheckCircle, ClipboardText, Medal, Timer, Trophy } from '@phosphor-icons/react';
import type { PhysicalExamResult, PhysicalExamType, UserProfile, WorkoutSession } from '../types/fitness';
import {
  calculateRacePredictions,
  calculateTrainingZones,
  calculateVDOTFromSpeed,
  convertSpeedValue,
  getAllLevelDefinitions,
  getLynxLevel,
  getModalityLabel,
  type SpeedUnit,
} from '../services/scienceEngine';
import { BADGES_CATALOG } from '../data/runningKnowledge';
import { AnimatedNumber, BiometricRing, SpotlightCard } from './MotionPrimitives';
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
  const [speedDuration, setSpeedDuration] = useState<number>(12);
  const [rawValue, setRawValue] = useState<number>(2250);
  const [timeMins, setTimeMins] = useState<number>(25);
  const [timeSecs, setTimeSecs] = useState<number>(30);
  const [heartRate, setHeartRate] = useState<number>(152);
  const [examSubmittedMsg, setExamSubmittedMsg] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const zones = calculateTrainingZones(profile.vdot, profile.maxHR, profile.restHR);
  const predictions = calculateRacePredictions(profile.vdot);
  const levelInfo = getLynxLevel(profile.vdot, profile.xp);
  const allLevels = getAllLevelDefinitions();
  const bmi = (profile.weightKg / Math.pow(profile.heightCm / 100, 2)).toFixed(1);
  const completedSessions = workouts.filter((w) => w.completed);

  const isSplitTimeExam = examType === 'time_trial_5k' || examType === 'rockport_walk_1600m';

  const handleExamUnitChange = (nextMode: ExamUnitMode) => {
    if (nextMode !== 'standard' && examUnitMode !== 'standard') {
      const conv = convertSpeedValue(speedValue, examUnitMode);
      setSpeedValue(nextMode === 'kmh' ? conv.kmh : nextMode === 'km_min' ? conv.kmPerMin : conv.minPerKmDecimal);
    }
    setExamUnitMode(nextMode);
  };

  const liveSpeedConv =
    examUnitMode !== 'standard' ? convertSpeedValue(speedValue, examUnitMode) : null;

  const handleCopySummary = async () => {
    const lines = [
      `FlyRun — Resumen fisiológico de ${profile.displayName}`,
      `Nivel ${levelInfo.level} (${levelInfo.spanishTitle}) | VDOT ${profile.vdot} | ${profile.xp} XP`,
      `Frecuencia: ${profile.trainingDaysPerWeek} días/sem | Meta pasos: ${profile.dailyStepsTarget}/día`,
      '',
      'Zonas de entrenamiento:',
      ...zones.map(
        (z) =>
          `- ${z.id} (${z.danielsCode}): ${z.speedKmhFormatted} | ${z.speedKmMinFormatted} | ${z.hrMin}-${z.hrMax} ppm`
      ),
      '',
      'Marcas equivalentes estimadas:',
      ...predictions.map((p) => `- ${p.distanceLabel}: ${p.timeFormatted} (${p.pacePerKm} · ${p.speedKmh} · ${p.speedKmMin})`),
    ].join('\n');

    try {
      await navigator.clipboard.writeText(lines);
      setCopiedSummary(true);
      window.setTimeout(() => setCopiedSummary(false), 2500);
    } catch {
      setCopiedSummary(false);
    }
  };

  const handleExamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (examUnitMode !== 'standard') {
      const effectiveDur =
        examType === 'cooper_12min'
          ? 12
          : examType === 'time_trial_5k'
          ? Number(((5 / Math.max(3, convertSpeedValue(speedValue, examUnitMode).kmh)) * 60).toFixed(2))
          : examType === 'rockport_walk_1600m'
          ? Number(((1.6 / Math.max(2.5, convertSpeedValue(speedValue, examUnitMode).kmh)) * 60).toFixed(2))
          : Math.max(3, speedDuration);

      const calc = calculateVDOTFromSpeed(examUnitMode, speedValue, effectiveDur);
      const targetExamType: PhysicalExamType =
        examType === 'rockport_walk_1600m'
          ? 'rockport_walk_1600m'
          : examType === 'time_trial_5k'
          ? 'time_trial_5k'
          : 'cooper_12min';
      const numericVal = targetExamType === 'cooper_12min' ? calc.distanceMeters : effectiveDur;
      const customLabel = `Prueba por velocidad (${calc.speedKmh.toFixed(1).replace('.', ',')} km/h · ${calc.speedKmMin.toFixed(3).replace('.', ',')} km/min · ${calc.paceFormatted} /km)`;
      onSubmitExam(targetExamType, numericVal, undefined, heartRate, customLabel);
    } else {
      const numericVal = isSplitTimeExam
        ? Number((Math.max(1, timeMins) + Math.max(0, Math.min(59, timeSecs)) / 60).toFixed(2))
        : rawValue;
      onSubmitExam(examType, numericVal, undefined, heartRate);
    }
    setExamSubmittedMsg(
      'Examen físico registrado. Tu VDOT, nivel, predicciones y zonas en km/h y km/min se han actualizado.'
    );
  };

  // Gráfica SVG simple y limpia de evolución de VDOT
  const chartPoints = [...exams].reverse().map((ex, i) => ({
    label: ex.date.slice(5),
    vdot: ex.calculatedVdot,
    idx: i,
  }));
  if (chartPoints.length === 0) {
    chartPoints.push({ label: 'Inicio', vdot: profile.vdot, idx: 0 });
  }

  const getBadgeProgress = (id: string): { current: number; target: number; label: string } => {
    const unlocked = profile.unlockedBadges.includes(id);
    if (unlocked) return { current: 1, target: 1, label: 'Completado (100%)' };
    if (id === 'first_workout') return { current: Math.min(1, completedSessions.length), target: 1, label: `${completedSessions.length}/1 sesión` };
    if (id === 'streak_3') return { current: Math.min(3, profile.streakDays), target: 3, label: `${profile.streakDays}/3 días` };
    if (id === 'level_5') return { current: Math.min(5, profile.level), target: 5, label: `Nivel ${profile.level}/5` };
    if (id === 'exam_completed') return { current: Math.min(1, exams.length), target: 1, label: `${exams.length}/1 test` };
    if (id === 'multi_cardio') return { current: 0, target: 1, label: '0/1 bici o fútbol' };
    if (id === 'google_fit_sync') return { current: 0, target: 1, label: 'Pendiente de sincronizar' };
    if (id === 'macro_smart') return { current: 0, target: 1, label: 'Abre la pestaña Macros' };
    return { current: 0, target: 1, label: 'Pendiente' };
  };

  return (
    <div className="stack-lg">
      <SpotlightCard as="section" staggerIndex={0} className="stack-md" aria-label="Mis Datos Biométricos">
        <div className="row-between">
          <div className="row-wrap" style={{ gap: '0.8rem' }}>
            {(() => {
              const matched = SIMULATED_USER_PERSONAS.find(
                (p) => p.profile.uid === profile.uid || (Boolean(profile.email) && p.profile.email === profile.email)
              );
              const avatarSrc = profile.photoURL || (matched ? assetUrl(matched.avatarFile) : '');
              return avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={profile.displayName}
                  width={46}
                  height={46}
                  className="athlete-avatar"
                  style={{ inlineSize: '46px', blockSize: '46px' }}
                />
              ) : null;
            })()}
            <div>
              <span className="pill pill-amber">Perfil fisiológico</span>
              <h1 style={{ margin: '0.35rem 0 0', fontSize: '1.3rem', letterSpacing: '-0.02em' }}>
                Tus datos, zonas de ritmo y predicciones
              </h1>
            </div>
          </div>
          <div className="row-wrap">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => void handleCopySummary()}>
              {copiedSummary ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
              {copiedSummary ? 'Resumen copiado' : 'Copiar resumen'}
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onEditProfile}>
              <Edit3 size={15} aria-hidden="true" />
              Editar datos / días / objetivo
            </button>
          </div>
        </div>

        <div className="inset-panel row-between" style={{ padding: '0.85rem 1rem' }}>
          <div className="row-wrap" style={{ gap: '0.95rem' }}>
            <BiometricRing
              percent={Math.min(100, Math.round((profile.vdot / 72) * 100))}
              label={`Nivel ${levelInfo.level}`}
              valueText={`${profile.vdot}`}
              subText="VDOT actual"
              color="var(--cobalt)"
              size={84}
            />
            <div className="stack-sm" style={{ gap: '0.2rem' }}>
              <strong style={{ fontSize: '0.96rem' }}>{levelInfo.spanishTitle}</strong>
              <span className="secondary" style={{ fontSize: '0.83rem' }}>
                Siguiente hito: {levelInfo.nextLevelXp.toLocaleString('es-ES')} XP ({levelInfo.progressPct}% completado)
              </span>
              <div className="progress-track" style={{ inlineSize: 'min(260px, 60vw)', marginTop: '0.25rem' }}>
                <div className="progress-fill" style={{ inlineSize: `${levelInfo.progressPct}%` }} />
              </div>
            </div>
          </div>
          <span className="pill pill-emerald mono">{profile.streakDays} días de racha</span>
        </div>

        <div className="grid-4">
          <div className="inset-panel">
            <div className="muted" style={{ fontSize: '0.75rem' }}>Biometría</div>
            <div className="mono" style={{ fontWeight: 700, fontSize: '1.08rem' }}>
              {profile.weightKg} kg · {profile.heightCm} cm
            </div>
            <div className="muted" style={{ fontSize: '0.75rem' }}>
              {profile.age} años · IMC {bmi}
            </div>
          </div>

          <div className="inset-panel">
            <div className="muted" style={{ fontSize: '0.75rem' }}>VDOT / VO2max efectivo</div>
            <div className="mono" style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--cobalt)' }}>
              <AnimatedNumber value={profile.vdot} decimals={1} />
            </div>
            <div className="muted mono" style={{ fontSize: '0.75rem' }}>
              FC reposo {profile.restHR} / máx {profile.maxHR} ppm
            </div>
          </div>

          <div className="inset-panel">
            <div className="muted" style={{ fontSize: '0.75rem' }}>Nivel actual</div>
            <div style={{ fontWeight: 700, fontSize: '1.06rem', color: 'var(--accent)' }}>
              Nivel {levelInfo.level} · {levelInfo.spanishTitle}
            </div>
            <div className="muted mono" style={{ fontSize: '0.75rem' }}>
              <AnimatedNumber value={profile.xp} locale suffix=" XP" /> · <AnimatedNumber value={profile.totalCardioPoints} suffix=" PC" />
            </div>
          </div>

          <div className="inset-panel">
            <div className="muted" style={{ fontSize: '0.75rem' }}>Compromiso semanal</div>
            <div className="mono" style={{ fontWeight: 700, fontSize: '1.08rem' }}>
              {profile.trainingDaysPerWeek} días entreno
            </div>
            <div className="muted" style={{ fontSize: '0.75rem' }}>
              Andar {profile.weeklyWalkGoalSessions} días/sem · {profile.dailyStepsTarget.toLocaleString('es-ES')} pasos
            </div>
          </div>
        </div>

        <div className="scroll-table-wrap" tabIndex={0} role="region" aria-label="Tabla de zonas de ritmo y frecuencia cardíaca">
          <table className="zone-table">
            <thead>
              <tr>
                <th>Zona</th>
                <th>Referencia Daniels</th>
                <th>Velocidad (km/h)</th>
                <th>Velocidad (km/min)</th>
                <th>Ritmo (min/km)</th>
                <th>Pulso (Karvonen)</th>
                <th>Objetivo fisiológico</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((z) => (
                <tr key={z.id}>
                  <td>
                    <span className="pill mono" style={{ borderColor: z.color, color: z.color }}>
                      {z.id}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{z.danielsCode}</td>
                  <td className="mono" style={{ fontWeight: 600, color: 'var(--cobalt)' }}>{z.speedKmhFormatted}</td>
                  <td className="mono" style={{ fontWeight: 600 }}>{z.speedKmMinFormatted}</td>
                  <td className="mono">{z.paceFormatted.split(' (')[0]}</td>
                  <td className="mono">{z.hrMin}–{z.hrMax} ppm</td>
                  <td className="muted">{z.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SpotlightCard>

      {/* Tabla de predicción de marcas y ritmos por vuelta de 400m */}
      <SpotlightCard as="section" staggerIndex={1} className="stack-md" aria-label="Predicción de marcas y paso por 400 m">
        <div className="row-wrap">
          <span className="duotone-icon-box is-cobalt">
            <Timer size={18} weight="duotone" aria-hidden="true" />
          </span>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.14rem' }}>Marcas equivalentes estimadas (VDOT {profile.vdot})</h2>
            <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>
              Incluye velocidad en km/h y km/min, ritmo por km y paso objetivo por cada vuelta de 400 m en pista.
            </p>
          </div>
        </div>

        <div className="scroll-table-wrap" tabIndex={0} role="region" aria-label="Tabla de marcas equivalentes y paso por 400 metros">
          <table className="zone-table">
            <thead>
              <tr>
                <th>Distancia</th>
                <th>Tiempo estimado</th>
                <th>Ritmo (min/km)</th>
                <th>Velocidad (km/h · km/min)</th>
                <th>Paso por vuelta (400 m)</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map((p) => (
                <tr key={p.distanceLabel}>
                  <td style={{ fontWeight: 600 }}>{p.distanceLabel}</td>
                  <td className="mono" style={{ fontWeight: 700, color: 'var(--accent)' }}>{p.timeFormatted}</td>
                  <td className="mono">{p.pacePerKm}</td>
                  <td className="mono" style={{ fontSize: '0.8rem' }}>{p.speedKmh} · {p.speedKmMin}</td>
                  <td className="mono" style={{ color: 'var(--pine)', fontWeight: 600 }}>{p.split400m}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SpotlightCard>

      {/* DÍA DE EXAMEN FÍSICO */}
      <SpotlightCard as="section" staggerIndex={2} className="stack-md" aria-label="Día de Examen Físico">
        <div className="editorial-photo-banner" style={{ blockSize: '146px' }}>
          <img
            src={assetUrl('images/exam-track-400m.jpg')}
            alt="Pista de atletismo de 400 metros lista para test de Cooper o 5K"
            width={1200}
            height={420}
            loading="lazy"
            className="editorial-photo-img"
          />
          <div className="editorial-photo-scrim">
            <span className="editorial-photo-caption">Día de examen físico · Recalibración objetiva de VDOT</span>
            <span className="pill pill-cyan mono">Test estandarizado</span>
          </div>
        </div>

        <div className="row-between">
          <div>
            <span className="pill pill-cyan">
              <ClipboardText size={14} weight="duotone" aria-hidden="true" />
              Día de examen físico
            </span>
            <h2 style={{ margin: '0.35rem 0 0', fontSize: '1.22rem', letterSpacing: '-0.015em' }}>
              Registra tus marcas reales y actualiza tu nivel
            </h2>
            <p className="secondary" style={{ margin: '0.22rem 0 0', fontSize: '0.87rem' }}>
              Introduce tu marca estándar (metros / tiempo) o directamente la velocidad media sostenida en <strong>km/h</strong>, <strong>km/min</strong> o <strong>min/km</strong>.
            </p>
          </div>

          <div className="segmented-group" role="group" aria-label="Unidad de entrada del examen">
            <button
              type="button"
              aria-pressed={examUnitMode === 'standard'}
              className="segmented-btn is-accent"
              onClick={() => handleExamUnitChange('standard')}
            >
              Distancia / Tiempo
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
            <label htmlFor="exam-selector">Prueba física</label>
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
              <option value="cooper_12min">Test de Cooper (12 min máx distancia)</option>
              <option value="time_trial_5k">Contrarreloj 5K (min y seg)</option>
              <option value="rockport_walk_1600m">Test Rockport caminata 1,6 km (min y seg)</option>
              <option value="caco_continuous_test">Test continuo base (ritmo sostenido)</option>
            </select>
          </div>

          {examUnitMode !== 'standard' ? (
            <div className="field">
              <label htmlFor="exam-speed-val">
                {examUnitMode === 'kmh' && 'Velocidad sostenida (km/h)'}
                {examUnitMode === 'km_min' && 'Velocidad en km por minuto (km/min)'}
                {examUnitMode === 'min_km' && 'Ritmo medio (minutos decimales / km)'}
              </label>
              <input
                id="exam-speed-val"
                name="examSpeedValue"
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
                  {liveSpeedConv.kmh.toFixed(1).replace('.', ',')} km/h ·{' '}
                  {liveSpeedConv.kmPerMin.toFixed(3).replace('.', ',')} km/min · {liveSpeedConv.paceFormatted} /km
                </span>
              )}
            </div>
          ) : isSplitTimeExam ? (
            <div className="field">
              <label htmlFor="exam-mins">Tiempo empleado (min : seg)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <input
                  id="exam-mins"
                  name="examTimeMinutes"
                  type="number"
                  min={8}
                  max={70}
                  className="input"
                  value={timeMins}
                  onChange={(e) => setTimeMins(Number(e.target.value))}
                  aria-label="Minutos"
                  required
                />
                <input
                  id="exam-secs"
                  name="examTimeSeconds"
                  type="number"
                  min={0}
                  max={59}
                  className="input"
                  value={timeSecs}
                  onChange={(e) => setTimeSecs(Number(e.target.value))}
                  aria-label="Segundos"
                  required
                />
              </div>
            </div>
          ) : (
            <div className="field">
              <label htmlFor="exam-value">
                {examType === 'cooper_12min'
                  ? 'Distancia recorrida (metros)'
                  : 'Minutos trotando continuo'}
              </label>
              <input
                id="exam-value"
                name="examRawValue"
                type="number"
                min={1}
                max={6000}
                step="1"
                className="input"
                value={rawValue}
                onChange={(e) => setRawValue(Number(e.target.value))}
                required
              />
            </div>
          )}

          {examUnitMode !== 'standard' && examType === 'caco_continuous_test' ? (
            <div className="field">
              <label htmlFor="exam-speed-dur">Duración del test (minutos)</label>
              <input
                id="exam-speed-dur"
                name="examSpeedDuration"
                type="number"
                min={3}
                max={90}
                className="input mono"
                value={speedDuration}
                onChange={(e) => setSpeedDuration(Number(e.target.value))}
              />
            </div>
          ) : (
            <div className="field">
              <label htmlFor="exam-hr">Pulso final medio/pico (ppm)</label>
              <input
                id="exam-hr"
                name="examHeartRate"
                type="number"
                min={80}
                max={215}
                className="input"
                value={heartRate}
                onChange={(e) => setHeartRate(Number(e.target.value))}
              />
            </div>
          )}

          <div className="row-wrap" style={{ gridColumn: '1 / -1' }}>
            <button type="submit" className="btn btn-primary">
              <Trophy size={16} weight="duotone" aria-hidden="true" />
              Evaluar examen y recalcular plan (+220 XP)
            </button>
            {examSubmittedMsg && (
              <span style={{ color: 'var(--pine)', fontSize: '0.84rem', fontWeight: 600 }}>
                {examSubmittedMsg}
              </span>
            )}
          </div>
        </form>

        {/* Evolución visual SVG Área + Línea de VDOT */}
        <div className="grid-2">
          <div className="inset-panel stack-sm">
            <div className="row-between">
              <strong style={{ fontSize: '0.86rem' }}>Evolución de VDOT</strong>
              <span className="mono muted" style={{ fontSize: '0.73rem' }}>
                Último: {chartPoints[chartPoints.length - 1]?.vdot}
              </span>
            </div>
            {(() => {
              const pts =
                chartPoints.length === 1
                  ? [
                      { ...chartPoints[0], label: 'Inicio' },
                      { ...chartPoints[0], label: 'Hoy' },
                    ]
                  : chartPoints;
              const minV = Math.max(15, Math.min(...pts.map((p) => p.vdot)) - 4);
              const maxV = Math.min(80, Math.max(...pts.map((p) => p.vdot)) + 4);
              const w = 380;
              const h = 112;
              const padX = 24;
              const padY = 18;
              const coords = pts.map((pt, idx) => {
                const x = padX + (idx / Math.max(1, pts.length - 1)) * (w - padX * 2);
                const norm = (pt.vdot - minV) / Math.max(1, maxV - minV);
                const y = h - padY - norm * (h - padY * 2);
                return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)), ...pt };
              });
              const lineStr = coords.map((c) => `${c.x},${c.y}`).join(' ');
              const areaStr = `${coords[0].x},${h - padY} ${lineStr} ${coords[coords.length - 1].x},${h - padY}`;
              return (
                <svg
                  viewBox={`0 0 ${w} ${h + 18}`}
                  style={{ inlineSize: '100%', blockSize: 'auto' }}
                  role="img"
                  aria-label="Gráfica lineal de evolución de VDOT"
                >
                  <defs>
                    <linearGradient id="vdot-area-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--cobalt)" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="var(--cobalt)" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  <line x1={padX} y1={padY} x2={w - padX} y2={padY} stroke="var(--border-hairline)" strokeDasharray="3 3" />
                  <line x1={padX} y1={h / 2} x2={w - padX} y2={h / 2} stroke="var(--border-hairline)" strokeDasharray="3 3" />
                  <line x1={padX} y1={h - padY} x2={w - padX} y2={h - padY} stroke="var(--border-strong)" />
                  <polygon points={areaStr} fill="url(#vdot-area-fill)" />
                  <polyline fill="none" stroke="var(--cobalt)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={lineStr} />
                  {coords.map((c, idx) => (
                    <g key={`${c.label}-${idx}`}>
                      <circle cx={c.x} cy={c.y} r="4.5" fill="var(--bg-surface)" stroke="var(--cobalt)" strokeWidth="2.5" />
                      <text x={c.x} y={c.y - 9} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--text-primary)" fontFamily="var(--font-mono)">
                        {c.vdot}
                      </text>
                      <text x={c.x} y={h + 10} textAnchor="middle" fontSize="9.5" fill="var(--text-muted)" fontFamily="var(--font-mono)">
                        {c.label}
                      </text>
                    </g>
                  ))}
                </svg>
              );
            })()}
          </div>

          <div className="stack-sm">
            <strong style={{ fontSize: '0.86rem' }}>Historial de evaluaciones</strong>
            {exams.length === 0 ? (
              <div className="inset-panel muted" style={{ fontSize: '0.82rem' }}>
                Aún no has registrado exámenes adicionales tras la evaluación inicial.
              </div>
            ) : (
              exams.slice(0, 4).map((ex) => (
                <div
                  key={ex.id}
                  className="inset-panel row-between"
                  style={{ padding: '0.55rem 0.8rem', fontSize: '0.82rem' }}
                >
                  <span>{ex.summary}</span>
                  <span className="muted mono">{ex.date}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </SpotlightCard>

      <div className="grid-2">
        <SpotlightCard as="section" staggerIndex={3} className="stack-md">
          <div className="row-wrap">
            <Award size={18} color="#d94814" aria-hidden="true" />
            <h2 style={{ margin: 0, fontSize: '1.08rem' }}>Progresión de niveles (1 a 10)</h2>
          </div>

          <div className="stack-sm">
            {allLevels.map((lvl) => {
              const reached = profile.level >= lvl.level;
              const current = profile.level === lvl.level;
              return (
                <div
                  key={lvl.level}
                  className="row-between"
                  style={{
                    padding: '0.52rem 0.8rem',
                    borderRadius: '10px',
                    border: current
                      ? '1px solid var(--accent)'
                      : '1px solid var(--border-hairline)',
                    background: current
                      ? 'var(--accent-soft)'
                      : reached
                      ? 'var(--pine-soft)'
                      : 'var(--bg-inset)',
                  }}
                >
                  <div className="row-wrap">
                    <span className="mono" style={{ fontWeight: 700, color: lvl.badgeColor }}>
                      Nv.{lvl.level}
                    </span>
                    <strong style={{ fontSize: '0.86rem' }}>{lvl.spanishTitle}</strong>
                  </div>
                  <div className="row-wrap">
                    <span className="muted mono" style={{ fontSize: '0.75rem' }}>
                      VDOT {lvl.minVdot}+ · {lvl.minXp} XP
                    </span>
                    {reached ? (
                      <CheckCircle size={16} weight="duotone" color="var(--pine)" aria-hidden="true" />
                    ) : (
                      <Lock size={14} color="#767c87" aria-hidden="true" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </SpotlightCard>

        <SpotlightCard as="section" staggerIndex={4} className="stack-md">
          <div className="row-wrap">
            <Medal size={19} weight="duotone" color="#b45309" aria-hidden="true" />
            <h2 style={{ margin: 0, fontSize: '1.08rem' }}>Insignias de entrenamiento</h2>
          </div>

          <div className="grid-2" style={{ gap: '0.68rem' }}>
            {BADGES_CATALOG.map((badge) => {
              const unlocked = profile.unlockedBadges.includes(badge.id);
              const prog = getBadgeProgress(badge.id);
              const pct = Math.round((prog.current / prog.target) * 100);
              return (
                <article
                  key={badge.id}
                  className="stack-sm"
                  style={{
                    padding: '0.78rem',
                    borderRadius: '10px',
                    border: unlocked
                      ? '1px solid var(--pine-border)'
                      : '1px solid var(--border-hairline)',
                    background: unlocked ? 'var(--pine-soft)' : 'var(--bg-inset)',
                  }}
                >
                  <div className="row-between">
                    <strong style={{ fontSize: '0.86rem' }}>{badge.title}</strong>
                    <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--pine)', fontWeight: 600 }}>
                      +{badge.xpReward} XP
                    </span>
                  </div>
                  <p className="muted" style={{ margin: 0, fontSize: '0.77rem' }}>
                    {badge.description}
                  </p>
                  <div className="progress-track" style={{ blockSize: '6px' }}>
                    <div
                      className={`progress-fill ${unlocked ? 'progress-fill-emerald' : ''}`}
                      style={{ inlineSize: `${pct}%` }}
                    />
                  </div>
                  <span className="muted mono" style={{ fontSize: '0.7rem' }}>{prog.label}</span>
                </article>
              );
            })}
          </div>
        </SpotlightCard>
      </div>

      {/* Historial de entrenamientos y actividades libres completadas */}
      <SpotlightCard as="section" staggerIndex={5} className="stack-md" aria-label="Historial de entrenamientos completados">
        <div className="row-between">
          <h2 style={{ margin: 0, fontSize: '1.08rem' }}>Historial de entrenamientos completados</h2>
          <span className="pill mono">{completedSessions.length} sesiones</span>
        </div>
        {completedSessions.length === 0 ? (
          <div className="inset-panel muted" style={{ fontSize: '0.84rem' }}>
            Todavía no has marcado entrenamientos completados. Registra tu sesión de hoy o una actividad libre para verla aquí.
          </div>
        ) : (
          <div className="scroll-table-wrap" tabIndex={0} role="region" aria-label="Historial de entrenamientos completados">
            <table className="zone-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Sesión</th>
                  <th>Modalidad</th>
                  <th>Duración real</th>
                  <th>RPE</th>
                  <th>Puntos Cardio</th>
                </tr>
              </thead>
              <tbody>
                {completedSessions.slice(0, 12).map((s) => (
                  <tr key={s.id}>
                    <td className="mono">{s.date}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.title}</div>
                      {s.notes && <div className="muted" style={{ fontSize: '0.76rem' }}>{s.notes}</div>}
                    </td>
                    <td>{getModalityLabel(s.completedModality ?? s.modality)}</td>
                    <td className="mono">{s.actualDurationMinutes ?? s.durationMinutes} min</td>
                    <td className="mono">{s.rpe ?? '-'}/10</td>
                    <td className="mono" style={{ color: 'var(--pine)', fontWeight: 600 }}>+{s.cardioPoints} PC</td>
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
