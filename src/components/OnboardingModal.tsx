import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardCheck, Pause, Play, RotateCcw } from 'lucide-react';
import type {
  CardioModality,
  FitnessGoal,
  PhysicalExamResult,
  PhysicalExamType,
  SexType,
  UserProfile,
} from '../types/fitness';
import {
  calculateTrainingZones,
  calculateVDOTFromExam,
  calculateVDOTFromSpeed,
  convertSpeedValue,
  estimateMaxHR,
  getLynxLevel,
  type SpeedUnit,
} from '../services/scienceEngine';
import { BiometricRing } from './MotionPrimitives';
import { FlyRunLogo } from './FlyRunLogo';

interface OnboardingModalProps {
  uid: string;
  initialName: string;
  email: string;
  photoURL: string;
  isDemoMode: boolean;
  existingProfile?: UserProfile | null;
  onComplete: (profile: UserProfile, initialExam?: PhysicalExamResult) => void;
  onCancel?: () => void;
}

type ExamInputMode = SpeedUnit | 'direct';

export function OnboardingModal({
  uid,
  initialName,
  email,
  photoURL,
  isDemoMode,
  existingProfile,
  onComplete,
  onCancel,
}: OnboardingModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Paso 1: Examen Inicial Obligatorio de Nivel antes de entrar
  const [examType, setExamType] = useState<PhysicalExamType>('cooper_12min');
  const [examInputMode, setExamInputMode] = useState<ExamInputMode>('kmh');
  const [speedValue, setSpeedValue] = useState<number>(10.5);
  const [speedDurationMin, setSpeedDurationMin] = useState<number>(12);
  const [rawValue, setRawValue] = useState<number>(2100);
  const [timeMins, setTimeMins] = useState<number>(26);
  const [timeSecs, setTimeSecs] = useState<number>(30);
  const [perceivedEffort, setPerceivedEffort] = useState<number>(6);
  const [examHR, setExamHR] = useState<number>(154);
  const [examEvaluated, setExamEvaluated] = useState<boolean>(Boolean(existingProfile?.onboardingCompleted));

  // Cronómetro en vivo opcional dentro del examen inicial
  const [showLiveTimer, setShowLiveTimer] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerElapsedSec, setTimerElapsedSec] = useState(0);

  // Paso 2: Datos biométricos y objetivo
  const [displayName, setDisplayName] = useState(existingProfile?.displayName ?? initialName);
  const [age, setAge] = useState(existingProfile?.age ?? 29);
  const [weightKg, setWeightKg] = useState(existingProfile?.weightKg ?? 72);
  const [heightCm, setHeightCm] = useState(existingProfile?.heightCm ?? 175);
  const [sex, setSex] = useState<SexType>(existingProfile?.sex ?? 'male');
  const [goal, setGoal] = useState<FitnessGoal>(existingProfile?.goal ?? 'start_running');
  const [restHR, setRestHR] = useState(existingProfile?.restHR ?? 62);

  // Paso 3: Disponibilidad semanal y modalidades
  const [trainingDaysPerWeek, setTrainingDaysPerWeek] = useState(existingProfile?.trainingDaysPerWeek ?? 4);
  const [weeklyWalkGoalSessions, setWeeklyWalkGoalSessions] = useState(existingProfile?.weeklyWalkGoalSessions ?? 5);
  const [dailyStepsTarget, setDailyStepsTarget] = useState(existingProfile?.dailyStepsTarget ?? 8500);
  const [preferredModalities, setPreferredModalities] = useState<CardioModality[]>(
    existingProfile?.preferredModalities ?? ['running', 'cycling', 'soccer']
  );

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => {
      setTimerElapsedSec((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  const toggleModality = (mod: CardioModality) => {
    if (mod === 'running') return;
    setPreferredModalities((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
    );
  };

  const handleSpeedModeSwitch = (nextMode: ExamInputMode) => {
    if (nextMode !== 'direct' && examInputMode !== 'direct') {
      const conv = convertSpeedValue(speedValue, examInputMode);
      setSpeedValue(nextMode === 'kmh' ? conv.kmh : nextMode === 'km_min' ? conv.kmPerMin : conv.minPerKmDecimal);
    }
    setExamInputMode(nextMode);
  };

  const computeExamMetrics = () => {
    if (examInputMode !== 'direct') {
      const effectiveDuration =
        examType === 'cooper_12min'
          ? 12
          : examType === 'time_trial_5k'
          ? Number(((5 / Math.max(3, convertSpeedValue(speedValue, examInputMode).kmh)) * 60).toFixed(2))
          : examType === 'rockport_walk_1600m'
          ? Number(((1.6 / Math.max(2.5, convertSpeedValue(speedValue, examInputMode).kmh)) * 60).toFixed(2))
          : Math.max(3, speedDurationMin);

      const speedCalc = calculateVDOTFromSpeed(examInputMode, speedValue, effectiveDuration);
      const effectiveExamType: PhysicalExamType = examType === 'rockport_walk_1600m' ? 'rockport_walk_1600m' : examType === 'time_trial_5k' ? 'time_trial_5k' : 'cooper_12min';
      const normalizedRawValue =
        effectiveExamType === 'cooper_12min'
          ? Math.max(400, speedCalc.distanceMeters)
          : Math.max(1, effectiveDuration);

      const vdot =
        effectiveExamType === 'rockport_walk_1600m'
          ? calculateVDOTFromExam('rockport_walk_1600m', normalizedRawValue, {
              heartRateBpm: examHR,
              age,
              weightKg,
              sex,
            })
          : speedCalc.vdot;

      return {
        vdot,
        examType: effectiveExamType,
        rawValue: normalizedRawValue,
        summaryText: `Examen inicial (${speedCalc.speedKmh.toFixed(1).replace('.', ',')} km/h · ${speedCalc.speedKmMin.toFixed(3).replace('.', ',')} km/min · ${speedCalc.paceFormatted} /km en ${Math.round(effectiveDuration)} min)`,
        speedCalc,
      };
    }

    const isSplitTime = examType === 'time_trial_5k' || examType === 'rockport_walk_1600m';
    const numericRaw = isSplitTime
      ? Number((Math.max(5, timeMins) + Math.max(0, Math.min(59, timeSecs)) / 60).toFixed(2))
      : Math.max(1, rawValue);

    const vdot = calculateVDOTFromExam(examType, numericRaw, {
      secondaryValue: perceivedEffort,
      heartRateBpm: examHR,
      age,
      weightKg,
      sex,
    });

    const summaryLabels: Record<PhysicalExamType, string> = {
      cooper_12min: `Examen inicial Cooper 12 min (${numericRaw} m)`,
      time_trial_5k: `Examen inicial 5K (${timeMins}:${timeSecs.toString().padStart(2, '0')})`,
      rockport_walk_1600m: `Examen inicial Rockport 1,6 km (${timeMins}:${timeSecs.toString().padStart(2, '0')}, ${examHR} ppm)`,
      caco_continuous_test: `Examen inicial trote continuo (${numericRaw} min)`,
    };

    return {
      vdot,
      examType,
      rawValue: numericRaw,
      summaryText: summaryLabels[examType],
      speedCalc: null,
    };
  };

  const examCalc = computeExamMetrics();
  const previewVdot = examCalc.vdot;
  const previewLevel = getLynxLevel(previewVdot, existingProfile?.xp ?? 150);
  const previewMaxHR = estimateMaxHR(age);
  const previewRestHR = Math.max(35, Math.min(restHR, previewMaxHR - 15));
  const previewZones = calculateTrainingZones(previewVdot, previewMaxHR, previewRestHR);

  const liveSpeedReadout =
    examInputMode !== 'direct'
      ? convertSpeedValue(speedValue, examInputMode)
      : examType === 'cooper_12min'
      ? convertSpeedValue((Math.max(400, rawValue) / 1000) * 5, 'kmh')
      : examType === 'time_trial_5k'
      ? convertSpeedValue(5 / (Math.max(8, timeMins + timeSecs / 60) / 60), 'kmh')
      : examType === 'rockport_walk_1600m'
      ? convertSpeedValue(1.6 / (Math.max(6, timeMins + timeSecs / 60) / 60), 'kmh')
      : convertSpeedValue(8.5, 'kmh');

  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const applyTimerToExam = () => {
    const mins = Math.max(1, Math.floor(timerElapsedSec / 60));
    const secs = timerElapsedSec % 60;
    if (examInputMode !== 'direct') {
      setSpeedDurationMin(Math.max(3, mins));
    } else if (examType === 'time_trial_5k' || examType === 'rockport_walk_1600m') {
      setTimeMins(Math.max(5, mins));
      setTimeSecs(secs);
    } else if (examType === 'caco_continuous_test') {
      setRawValue(Math.max(1, mins));
    }
    setTimerRunning(false);
    setExamEvaluated(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1 && !examEvaluated) {
      setExamEvaluated(true);
      return;
    }
    if (step < 3) {
      setStep((s) => Math.min(3, s + 1) as 1 | 2 | 3);
      return;
    }

    const maxHR = estimateMaxHR(age);
    const safeRestHR = Math.max(35, Math.min(restHR, maxHR - 15));
    const vdot = previewVdot;
    const baseXp = existingProfile?.xp ?? 150;
    const lvl = getLynxLevel(vdot, baseXp);
    const strategyId =
      existingProfile?.preferredStrategyId ?? (lvl.level <= 2 ? 'caco_progressive' : 'polarized_80_20');

    const baseBadges = existingProfile?.unlockedBadges?.length
      ? [...existingProfile.unlockedBadges]
      : ['first_calibration', 'exam_completed'];
    if (!baseBadges.includes('exam_completed')) {
      baseBadges.push('exam_completed');
    }

    const profile: UserProfile = {
      uid,
      displayName: displayName.trim() || 'Atleta FlyRun',
      email,
      photoURL,
      age: Math.max(14, Math.min(90, Number(age))),
      weightKg: Math.max(35, Math.min(220, Number(weightKg))),
      heightCm: Math.max(120, Math.min(230, Number(heightCm))),
      sex,
      goal,
      trainingDaysPerWeek,
      weeklyWalkGoalSessions,
      dailyStepsTarget,
      restHR: safeRestHR,
      maxHR,
      vdot,
      level: lvl.level,
      xp: baseXp,
      streakDays: existingProfile?.streakDays ?? 1,
      totalCardioPoints: existingProfile?.totalCardioPoints ?? 0,
      preferredStrategyId: strategyId,
      preferredModalities,
      unlockedBadges: baseBadges,
      onboardingCompleted: true,
      isDemoMode,
      updatedAt: new Date().toISOString(),
    };

    const initialExam: PhysicalExamResult = {
      id: `exam_init_${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      examType: examCalc.examType,
      rawValue: Number(examCalc.rawValue),
      secondaryValue: perceivedEffort,
      heartRateBpm: examHR,
      calculatedVdot: vdot,
      previousVdot: existingProfile?.vdot ?? vdot,
      newLevel: lvl.level,
      previousLevel: existingProfile?.level ?? lvl.level,
      summary: `${examCalc.summaryText} — VDOT ${vdot} · Nivel ${lvl.level} (${lvl.spanishTitle})`.slice(0, 480),
    };

    onComplete(profile, initialExam);
  };

  return (
    <main id="main-content" className="main-container" style={{ maxInlineSize: '840px' }}>
      <form onSubmit={handleSubmit} className="card stack-lg">
        <div className="row-between">
          <div className="stack-sm">
            <FlyRunLogo
              size="sm"
              badgeText={step === 1 ? 'Paso 1 de 3 · Examen Inicial Obligatorio' : `Paso ${step} de 3`}
            />
            <h1 style={{ margin: '0.25rem 0 0', fontSize: 'clamp(1.25rem, 3vw, 1.58rem)', letterSpacing: '-0.02em' }}>
              {step === 1 && 'Examen físico inicial para estimar tu nivel antes de entrar'}
              {step === 2 && 'Datos biométricos y objetivo principal'}
              {step === 3 && 'Disponibilidad semanal, Google Fit y confirmación'}
            </h1>
          </div>

          {onCancel && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
              Cancelar
            </button>
          )}
        </div>

        <div className="progress-track">
          <div className="progress-fill" style={{ inlineSize: `${(step / 3) * 100}%` }} />
        </div>

        {step === 1 && (
          <div className="stack-md">
            <div className="notice-banner" style={{ background: 'var(--cobalt-soft)', borderColor: 'var(--cobalt)' }}>
              <ClipboardCheck size={18} aria-hidden="true" />
              <span>
                Antes de entrar en la aplicación realizamos este <strong>examen inicial de nivel</strong>. Puedes introducir tu marca en <strong>km/h</strong>, <strong>km por minuto (km/min)</strong>, <strong>min/km</strong> o por distancia/tiempo.
              </span>
            </div>

            <div className="grid-2">
              <div className="field">
                <label htmlFor="onb-exam-type">Protocolo de examen inicial</label>
                <select
                  id="onb-exam-type"
                  name="initialExamType"
                  className="select"
                  value={examType}
                  onChange={(e) => {
                    const next = e.target.value as PhysicalExamType;
                    setExamType(next);
                    if (next === 'cooper_12min') {
                      setRawValue(2100);
                      setSpeedDurationMin(12);
                    } else if (next === 'time_trial_5k') {
                      setTimeMins(26);
                      setTimeSecs(30);
                    } else if (next === 'rockport_walk_1600m') {
                      setTimeMins(14);
                      setTimeSecs(30);
                      if (examInputMode !== 'direct') handleSpeedModeSwitch('kmh');
                      setSpeedValue(6.6);
                    } else {
                      setRawValue(15);
                      setSpeedDurationMin(15);
                    }
                  }}
                >
                  <option value="cooper_12min">Test de Cooper / Prueba de 12 min (velocidad o metros)</option>
                  <option value="caco_continuous_test">Prueba continua de ritmo sostenido (velocidad o minutos)</option>
                  <option value="time_trial_5k">Contrarreloj 5 km (velocidad o tiempo)</option>
                  <option value="rockport_walk_1600m">Test Rockport caminata 1,6 km (velocidad o tiempo)</option>
                </select>
              </div>

              <div className="field">
                <label>¿En qué unidad quieres introducir tu marca?</label>
                <div className="segmented-group" role="group" aria-label="Unidad del examen inicial">
                  <button
                    type="button"
                    aria-pressed={examInputMode === 'kmh'}
                    className="segmented-btn is-accent mono"
                    onClick={() => handleSpeedModeSwitch('kmh')}
                  >
                    km/h
                  </button>
                  <button
                    type="button"
                    aria-pressed={examInputMode === 'km_min'}
                    className="segmented-btn is-accent mono"
                    onClick={() => handleSpeedModeSwitch('km_min')}
                  >
                    km/min
                  </button>
                  <button
                    type="button"
                    aria-pressed={examInputMode === 'min_km'}
                    className="segmented-btn is-accent mono"
                    onClick={() => handleSpeedModeSwitch('min_km')}
                  >
                    min/km
                  </button>
                  <button
                    type="button"
                    aria-pressed={examInputMode === 'direct'}
                    className="segmented-btn is-accent"
                    onClick={() => handleSpeedModeSwitch('direct')}
                  >
                    Distancia / Tiempo
                  </button>
                </div>
              </div>

              {examInputMode !== 'direct' ? (
                <>
                  <div className="field">
                    <label htmlFor="onb-speed-val">
                      {examInputMode === 'kmh' && 'Velocidad sostenida (km/h)'}
                      {examInputMode === 'km_min' && 'Velocidad en kilómetros por minuto (km/min)'}
                      {examInputMode === 'min_km' && 'Ritmo medio (minutos decimales por km)'}
                    </label>
                    <input
                      id="onb-speed-val"
                      name="initialExamSpeedValue"
                      type="number"
                      min={examInputMode === 'km_min' ? 0.04 : 2}
                      max={examInputMode === 'km_min' ? 0.5 : 30}
                      step={examInputMode === 'km_min' ? '0.005' : '0.1'}
                      className="input mono"
                      value={speedValue}
                      onChange={(e) => setSpeedValue(Number(e.target.value))}
                      required
                    />
                    <span className="muted mono" style={{ fontSize: '0.76rem' }}>
                      Equivalencia: {liveSpeedReadout.kmh.toFixed(1).replace('.', ',')} km/h ·{' '}
                      {liveSpeedReadout.kmPerMin.toFixed(3).replace('.', ',')} km/min · {liveSpeedReadout.paceFormatted} /km
                    </span>
                  </div>

                  {examType === 'caco_continuous_test' ? (
                    <div className="field">
                      <label htmlFor="onb-speed-dur">Duración sostenida en la prueba (minutos)</label>
                      <input
                        id="onb-speed-dur"
                        name="initialExamDuration"
                        type="number"
                        min={3}
                        max={90}
                        className="input mono"
                        value={speedDurationMin}
                        onChange={(e) => setSpeedDurationMin(Number(e.target.value))}
                      />
                    </div>
                  ) : (
                    <div className="field">
                      <label htmlFor="onb-exam-hr">Frecuencia cardíaca media / final (ppm)</label>
                      <input
                        id="onb-exam-hr"
                        name="initialExamHR"
                        type="number"
                        min={75}
                        max={215}
                        className="input mono"
                        value={examHR}
                        onChange={(e) => setExamHR(Number(e.target.value))}
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  {examType === 'time_trial_5k' || examType === 'rockport_walk_1600m' ? (
                    <div className="field">
                      <label htmlFor="onb-time-mins">Tiempo empleado (min : seg)</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <input
                          id="onb-time-mins"
                          name="initialExamMins"
                          type="number"
                          min={5}
                          max={75}
                          className="input mono"
                          value={timeMins}
                          onChange={(e) => setTimeMins(Number(e.target.value))}
                          aria-label="Minutos"
                          required
                        />
                        <input
                          id="onb-time-secs"
                          name="initialExamSecs"
                          type="number"
                          min={0}
                          max={59}
                          className="input mono"
                          value={timeSecs}
                          onChange={(e) => setTimeSecs(Number(e.target.value))}
                          aria-label="Segundos"
                          required
                        />
                      </div>
                      <span className="muted mono" style={{ fontSize: '0.75rem' }}>
                        Equivale a {liveSpeedReadout.kmh.toFixed(1).replace('.', ',')} km/h ·{' '}
                        {liveSpeedReadout.kmPerMin.toFixed(3).replace('.', ',')} km/min
                      </span>
                    </div>
                  ) : (
                    <div className="field">
                      <label htmlFor="onb-raw-val">
                        {examType === 'cooper_12min'
                          ? 'Distancia en 12 minutos (metros)'
                          : 'Minutos seguidos trotando cómodo'}
                      </label>
                      <input
                        id="onb-raw-val"
                        name="initialExamValue"
                        type="number"
                        min={1}
                        max={5000}
                        step="1"
                        className="input mono"
                        value={rawValue}
                        onChange={(e) => setRawValue(Number(e.target.value))}
                        required
                      />
                      {examType === 'cooper_12min' && (
                        <span className="muted mono" style={{ fontSize: '0.75rem' }}>
                          Equivale a {liveSpeedReadout.kmh.toFixed(1).replace('.', ',')} km/h ·{' '}
                          {liveSpeedReadout.kmPerMin.toFixed(3).replace('.', ',')} km/min · {liveSpeedReadout.paceFormatted} /km
                        </span>
                      )}
                    </div>
                  )}

                  <div className="field">
                    <label htmlFor="onb-exam-hr-direct">Pulso final (ppm) y esfuerzo ({perceivedEffort}/10)</label>
                    <input
                      id="onb-exam-hr-direct"
                      name="initialExamHR"
                      type="number"
                      min={75}
                      max={215}
                      className="input mono"
                      value={examHR}
                      onChange={(e) => setExamHR(Number(e.target.value))}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Esfuerzo percibido y cronómetro de examen integrado */}
            <div className="grid-2">
              <div className="field">
                <label htmlFor="onb-rpe">Esfuerzo percibido durante la prueba ({perceivedEffort}/10)</label>
                <input
                  id="onb-rpe"
                  name="initialPerceivedEffort"
                  type="range"
                  min={2}
                  max={10}
                  value={perceivedEffort}
                  onChange={(e) => setPerceivedEffort(Number(e.target.value))}
                />
                <span className="muted" style={{ fontSize: '0.76rem' }}>
                  2 = muy suave · 6 = controlado · 10 = esfuerzo máximo
                </span>
              </div>

              <div className="inset-panel stack-sm" style={{ padding: '0.65rem 0.85rem' }}>
                <div className="row-between">
                  <span className="muted" style={{ fontSize: '0.76rem', fontWeight: 600 }}>
                    ¿Haces la prueba ahora en tiempo real?
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setShowLiveTimer((v) => !v)}
                  >
                    {showLiveTimer ? 'Ocultar cronómetro' : 'Abrir cronómetro de examen'}
                  </button>
                </div>
                {showLiveTimer && (
                  <div className="row-between" style={{ marginTop: '0.25rem' }}>
                    <span className="mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--cobalt)' }}>
                      {formatTimer(timerElapsedSec)}
                    </span>
                    <div className="row-wrap" style={{ gap: '0.35rem' }}>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => setTimerRunning((r) => !r)}
                      >
                        {timerRunning ? <Pause size={14} /> : <Play size={14} />}
                        {timerRunning ? 'Pausar' : 'Iniciar'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setTimerRunning(false);
                          setTimerElapsedSec(0);
                        }}
                      >
                        <RotateCcw size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-emerald btn-sm"
                        onClick={applyTimerToExam}
                        disabled={timerElapsedSec < 30}
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="row-wrap">
              <button
                type="button"
                className={`btn ${examEvaluated ? 'btn-emerald' : 'btn-primary'}`}
                onClick={() => setExamEvaluated(true)}
              >
                <ClipboardCheck size={17} aria-hidden="true" />
                {examEvaluated ? 'Examen inicial evaluado (recalcular)' : 'Evaluar mi Examen Inicial ahora'}
              </button>
              {!examEvaluated && (
                <span className="muted" style={{ fontSize: '0.8rem' }}>
                  Pulsa para obtener tu VDOT, Nivel oficial y zonas antes de entrar.
                </span>
              )}
            </div>

            {examEvaluated && (
              <div className="inset-panel stack-md" style={{ border: '1px solid var(--pine-border)', background: 'var(--pine-soft)' }}>
                <div className="row-between">
                  <div className="row-wrap" style={{ gap: '0.9rem' }}>
                    <BiometricRing
                      percent={Math.min(100, Math.round((previewVdot / 72) * 100))}
                      label={`Nivel ${previewLevel.level}`}
                      valueText={`${previewVdot}`}
                      color="var(--pine)"
                      size={76}
                    />
                    <div>
                      <span className="pill pill-emerald">Resultado del Examen Inicial</span>
                      <div style={{ fontSize: '1.12rem', fontWeight: 700, marginTop: '0.2rem' }}>
                        Nivel {previewLevel.level} · {previewLevel.spanishTitle}
                      </div>
                      <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--pine)' }}>
                        VDOT {previewVdot} · FCmáx estimada {previewMaxHR} ppm · Reposo {previewRestHR} ppm
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid-3" style={{ gap: '0.5rem' }}>
                  {previewZones.map((z) => (
                    <div
                      key={z.id}
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-hairline)',
                        borderRadius: '8px',
                        padding: '0.5rem 0.65rem',
                      }}
                    >
                      <div className="row-between">
                        <strong className="mono" style={{ fontSize: '0.78rem', color: z.color }}>{z.id}</strong>
                        <span className="muted mono" style={{ fontSize: '0.7rem' }}>{z.hrMin}–{z.hrMax} ppm</span>
                      </div>
                      <div className="mono" style={{ fontSize: '0.76rem', fontWeight: 600, marginTop: '0.15rem' }}>
                        {z.speedKmhFormatted}
                      </div>
                      <div className="muted mono" style={{ fontSize: '0.71rem' }}>
                        {z.speedKmMinFormatted}
                      </div>
                      <div className="muted mono" style={{ fontSize: '0.7rem' }}>
                        {z.paceFormatted.split(' (')[0]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="grid-2">
            <div className="field">
              <label htmlFor="onb-name">Nombre</label>
              <input
                id="onb-name"
                name="displayName"
                className="input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="onb-goal">Objetivo principal</label>
              <select
                id="onb-goal"
                name="goal"
                className="select"
                value={goal}
                onChange={(e) => setGoal(e.target.value as FitnessGoal)}
              >
                <option value="start_running">Empezar a correr sin lesiones (CaCo)</option>
                <option value="health_maintenance">Salud diaria y condición cardiovascular</option>
                <option value="improve_5k">Mejorar marca en 5 km</option>
                <option value="improve_10k">Preparar 10 km con método 80/20</option>
                <option value="fat_loss_cardio">Mejorar composición corporal</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="onb-age">Edad (años)</label>
              <input
                id="onb-age"
                name="age"
                type="number"
                min={14}
                max={90}
                className="input"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="onb-weight">Peso corporal (kg)</label>
              <input
                id="onb-weight"
                name="weightKg"
                type="number"
                min={35}
                max={220}
                step="0.5"
                className="input"
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="onb-height">Altura (cm)</label>
              <input
                id="onb-height"
                name="heightCm"
                type="number"
                min={120}
                max={230}
                className="input"
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="onb-sex">Sexo fisiológico</label>
              <select
                id="onb-sex"
                name="sex"
                className="select"
                value={sex}
                onChange={(e) => setSex(e.target.value as SexType)}
              >
                <option value="male">Hombre</option>
                <option value="female">Mujer</option>
                <option value="other">Otro / Promedio</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="onb-rhr">Frecuencia cardíaca en reposo (ppm)</label>
              <input
                id="onb-rhr"
                name="restHR"
                type="number"
                min={38}
                max={110}
                className="input"
                value={restHR}
                onChange={(e) => setRestHR(Number(e.target.value))}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="stack-md">
            <div className="grid-3">
              <div className="field">
                <label htmlFor="onb-days">Días de entreno / semana</label>
                <select
                  id="onb-days"
                  name="trainingDaysPerWeek"
                  className="select"
                  value={trainingDaysPerWeek}
                  onChange={(e) => setTrainingDaysPerWeek(Number(e.target.value))}
                >
                  <option value={2}>2 días / semana</option>
                  <option value={3}>3 días / semana</option>
                  <option value={4}>4 días / semana (80/20)</option>
                  <option value={5}>5 días / semana</option>
                  <option value={6}>6 días / semana</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="onb-walks">Días de caminata activa / sem</label>
                <select
                  id="onb-walks"
                  name="weeklyWalkGoalSessions"
                  className="select"
                  value={weeklyWalkGoalSessions}
                  onChange={(e) => setWeeklyWalkGoalSessions(Number(e.target.value))}
                >
                  <option value={3}>3 días / semana</option>
                  <option value={5}>5 días / semana</option>
                  <option value={7}>Todos los días (7 días)</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="onb-steps">Objetivo diario (Google Fit)</label>
                <input
                  id="onb-steps"
                  name="dailyStepsTarget"
                  type="number"
                  min={3000}
                  max={25000}
                  step={500}
                  className="input mono"
                  value={dailyStepsTarget}
                  onChange={(e) => setDailyStepsTarget(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="stack-sm">
              <span style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Modalidades de cardio que practicas (Running es la base; activa otras disciplinas equivalentes):
              </span>
              <div className="row-wrap">
                <button type="button" className="btn btn-primary btn-sm" disabled>
                  Running (Principal)
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${preferredModalities.includes('cycling') ? 'btn-emerald' : 'btn-secondary'}`}
                  onClick={() => toggleModality('cycling')}
                >
                  Ciclismo / Bici {preferredModalities.includes('cycling') ? '· Activo' : ''}
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${preferredModalities.includes('soccer') ? 'btn-emerald' : 'btn-secondary'}`}
                  onClick={() => toggleModality('soccer')}
                >
                  Partido de Fútbol {preferredModalities.includes('soccer') ? '· Activo' : ''}
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${preferredModalities.includes('walking') ? 'btn-emerald' : 'btn-secondary'}`}
                  onClick={() => toggleModality('walking')}
                >
                  Caminata Activa {preferredModalities.includes('walking') ? '· Activo' : ''}
                </button>
              </div>
            </div>

            <div className="inset-panel row-between">
              <div>
                <span className="muted" style={{ fontSize: '0.75rem' }}>Examen Inicial Certificado</span>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                  Nivel {previewLevel.level} ({previewLevel.spanishTitle}) · VDOT {previewVdot}
                </div>
                <div className="muted mono" style={{ fontSize: '0.76rem' }}>
                  Z1 Base: {previewZones[0].speedKmhFormatted} · {previewZones[0].speedKmMinFormatted}
                </div>
              </div>
              <span className="pill pill-emerald mono">Listo para empezar</span>
            </div>
          </div>
        )}

        <div className="row-between">
          {step > 1 ? (
            <button type="button" className="btn btn-secondary" onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}>
              <ArrowLeft size={16} aria-hidden="true" />
              Anterior
            </button>
          ) : (
            <span />
          )}

          {step < 3 ? (
            <button
              key="btn-next-step"
              type="button"
              className="btn btn-primary"
              onClick={() => {
                if (step === 1 && !examEvaluated) {
                  setExamEvaluated(true);
                  return;
                }
                setStep((s) => (s + 1) as 1 | 2 | 3);
              }}
            >
              {step === 1 && !examEvaluated ? 'Evaluar examen inicial' : 'Siguiente paso'}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          ) : (
            <button key="btn-submit-onboarding" type="submit" className="btn btn-emerald">
              <CheckCircle2 size={17} aria-hidden="true" />
              Terminar examen y entrar a FlyRun
            </button>
          )}
        </div>
      </form>
    </main>
  );
}