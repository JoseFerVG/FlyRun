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
  paceMinSecToSecPerKm,
  secPerKmToPaceMinSec,
  vdotToEstimatedKmh,
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

const INITIAL_PRESETS: Array<{
  id: string;
  title: string;
  sub: string;
  kmh: number;
  rpe: number;
  hr: number;
  examType: PhysicalExamType;
  rawDirect: number;
}> = [
  {
    id: 'cero',
    title: 'Desde cero',
    sub: '6,5 km/h · Caminata / CaCo',
    kmh: 6.5,
    rpe: 5,
    hr: 136,
    examType: 'caco_continuous_test',
    rawDirect: 5,
  },
  {
    id: 'suave',
    title: 'Trote suave',
    sub: '8,5 km/h · 7:04 /km',
    kmh: 8.5,
    rpe: 6,
    hr: 148,
    examType: 'cooper_12min',
    rawDirect: 1700,
  },
  {
    id: 'medio',
    title: 'Intermedio',
    sub: '10,5 km/h · 5:43 /km',
    kmh: 10.5,
    rpe: 6,
    hr: 156,
    examType: 'cooper_12min',
    rawDirect: 2100,
  },
  {
    id: 'habitual',
    title: 'Habitual',
    sub: '12,5 km/h · 4:48 /km',
    kmh: 12.5,
    rpe: 7,
    hr: 165,
    examType: 'cooper_12min',
    rawDirect: 2500,
  },
  {
    id: 'avanzado',
    title: 'Avanzado',
    sub: '14,5 km/h · 4:08 /km',
    kmh: 14.5,
    rpe: 8,
    hr: 174,
    examType: 'cooper_12min',
    rawDirect: 2900,
  },
];

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
  const isEditing = Boolean(existingProfile?.onboardingCompleted);
  const [step, setStep] = useState<1 | 2 | 3>(isEditing ? 2 : 1);
  const [examTouched, setExamTouched] = useState(!isEditing);

  const initialKmh = existingProfile ? vdotToEstimatedKmh(existingProfile.vdot) : 10.5;
  const initialPace = secPerKmToPaceMinSec(convertSpeedValue(initialKmh, 'kmh').secPerKm);

  const [activePreset, setActivePreset] = useState<string>(existingProfile ? '' : 'medio');
  const [examType, setExamType] = useState<PhysicalExamType>('cooper_12min');
  const [examInputMode, setExamInputMode] = useState<ExamInputMode>('kmh');
  const [speedValue, setSpeedValue] = useState<number>(initialKmh);
  const [paceMinPart, setPaceMinPart] = useState<number>(initialPace.mins);
  const [paceSecPart, setPaceSecPart] = useState<number>(initialPace.secs);
  const [speedDurationMin, setSpeedDurationMin] = useState<number>(12);
  const [rawValue, setRawValue] = useState<number>(Math.round(initialKmh * 200));
  const [timeMins, setTimeMins] = useState<number>(26);
  const [timeSecs, setTimeSecs] = useState<number>(30);
  const [perceivedEffort, setPerceivedEffort] = useState<number>(6);
  const [examHR, setExamHR] = useState<number>(154);

  const [showLiveTimer, setShowLiveTimer] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerElapsedSec, setTimerElapsedSec] = useState(0);

  const [displayName, setDisplayName] = useState(existingProfile?.displayName ?? (isDemoMode ? '' : initialName));
  const [age, setAge] = useState(existingProfile?.age ?? 29);
  const [weightKg, setWeightKg] = useState(existingProfile?.weightKg ?? 72);
  const [heightCm, setHeightCm] = useState(existingProfile?.heightCm ?? 175);
  const [sex, setSex] = useState<SexType>(existingProfile?.sex ?? 'male');
  const [goal, setGoal] = useState<FitnessGoal>(existingProfile?.goal ?? 'start_running');
  const [restHR, setRestHR] = useState(existingProfile?.restHR ?? 62);

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

  const applyPreset = (preset: (typeof INITIAL_PRESETS)[number]) => {
    setActivePreset(preset.id);
    setExamTouched(true);
    const conv = convertSpeedValue(preset.kmh, 'kmh');
    const paceParts = secPerKmToPaceMinSec(conv.secPerKm);
    setExamType(preset.examType);
    setExamInputMode('kmh');
    setSpeedValue(conv.kmh);
    setPaceMinPart(paceParts.mins);
    setPaceSecPart(paceParts.secs);
    setRawValue(preset.rawDirect);
    setPerceivedEffort(preset.rpe);
    setExamHR(preset.hr);
    setSpeedDurationMin(preset.examType === 'caco_continuous_test' ? 10 : 12);
  };

  const handleSpeedModeSwitch = (nextMode: ExamInputMode) => {
    setExamTouched(true);
    if (nextMode !== 'direct' && examInputMode !== 'direct') {
      const currentSec =
        examInputMode === 'min_km'
          ? paceMinSecToSecPerKm(paceMinPart, paceSecPart)
          : convertSpeedValue(speedValue, examInputMode).secPerKm;
      const conv = convertSpeedValue(3600 / Math.max(120, currentSec), 'kmh');
      const parts = secPerKmToPaceMinSec(conv.secPerKm);
      setPaceMinPart(parts.mins);
      setPaceSecPart(parts.secs);
      setSpeedValue(nextMode === 'kmh' ? conv.kmh : nextMode === 'km_min' ? conv.kmPerMin : conv.minPerKmDecimal);
    }
    setExamInputMode(nextMode);
  };

  const computeExamMetrics = () => {
    if (isEditing && !examTouched && existingProfile) {
      return {
        vdot: existingProfile.vdot,
        examType: 'cooper_12min' as PhysicalExamType,
        rawValue: Math.round(vdotToEstimatedKmh(existingProfile.vdot) * 200),
        summaryText: '',
      };
    }

    if (examInputMode !== 'direct') {
      const resolvedSecPerKm =
        examInputMode === 'min_km'
          ? paceMinSecToSecPerKm(paceMinPart, paceSecPart)
          : convertSpeedValue(speedValue, examInputMode).secPerKm;
      const conv = convertSpeedValue(3600 / Math.max(120, resolvedSecPerKm), 'kmh');

      if (examType === 'cooper_12min') {
        const distanceMeters = Math.max(400, Math.round(conv.kmPerMin * 12 * 1000));
        const vdot = calculateVDOTFromExam('cooper_12min', distanceMeters);
        return {
          vdot,
          examType: 'cooper_12min' as PhysicalExamType,
          rawValue: distanceMeters,
          summaryText: `Examen inicial Cooper (${conv.kmh.toFixed(1).replace('.', ',')} km/h · ${conv.kmPerMin.toFixed(3).replace('.', ',')} km/min · ${conv.paceFormatted} /km)`,
        };
      }

      if (examType === 'time_trial_5k') {
        const timeMin = Number(((5 / Math.max(3, conv.kmh)) * 60).toFixed(2));
        const vdot = calculateVDOTFromExam('time_trial_5k', timeMin);
        return {
          vdot,
          examType: 'time_trial_5k' as PhysicalExamType,
          rawValue: timeMin,
          summaryText: `Examen inicial 5K (${conv.kmh.toFixed(1).replace('.', ',')} km/h · ${conv.kmPerMin.toFixed(3).replace('.', ',')} km/min · ${conv.paceFormatted} /km)`,
        };
      }

      if (examType === 'rockport_walk_1600m') {
        const timeMin = Number(((1.6 / Math.max(2.5, conv.kmh)) * 60).toFixed(2));
        const vdot = calculateVDOTFromExam('rockport_walk_1600m', timeMin, {
          heartRateBpm: examHR,
          age,
          weightKg,
          sex,
        });
        return {
          vdot,
          examType: 'rockport_walk_1600m' as PhysicalExamType,
          rawValue: timeMin,
          summaryText: `Examen inicial Rockport (${conv.kmh.toFixed(1).replace('.', ',')} km/h · ${conv.kmPerMin.toFixed(3).replace('.', ',')} km/min · ${examHR} ppm)`,
        };
      }

      // caco_continuous_test: never conflate duration with Cooper 12 min
      const continuousDur = Math.max(3, Math.min(60, speedDurationMin));
      const baseVdot = calculateVDOTFromExam('caco_continuous_test', continuousDur, {
        secondaryValue: perceivedEffort,
      });
      const speedCalc = calculateVDOTFromSpeed('kmh', conv.kmh, 12);
      const blended = Number(((baseVdot * 0.45 + speedCalc.vdot * 0.55)).toFixed(1));
      return {
        vdot: Math.max(20, Math.min(62, blended)),
        examType: 'caco_continuous_test' as PhysicalExamType,
        rawValue: continuousDur,
        summaryText: `Examen inicial continuo (${continuousDur} min a ${conv.kmh.toFixed(1).replace('.', ',')} km/h · ${conv.kmPerMin.toFixed(3).replace('.', ',')} km/min)`,
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
    };
  };

  const examCalc = computeExamMetrics();
  const previewVdot = examCalc.vdot;
  const previewLevel = getLynxLevel(previewVdot, existingProfile?.xp ?? 150);
  const previewMaxHR = estimateMaxHR(age);
  const previewRestHR = Math.max(35, Math.min(restHR, previewMaxHR - 15));
  const previewZones = calculateTrainingZones(previewVdot, previewMaxHR, previewRestHR);

  const liveSpeedReadout =
    examInputMode === 'min_km'
      ? convertSpeedValue(3600 / Math.max(120, paceMinSecToSecPerKm(paceMinPart, paceSecPart)), 'kmh')
      : examInputMode !== 'direct'
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
    setExamTouched(true);
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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
      displayName: displayName.trim() || initialName || 'Atleta FlyRun',
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

    const initialExam: PhysicalExamResult | undefined =
      !isEditing || examTouched
        ? {
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
          }
        : undefined;

    onComplete(profile, initialExam);
  };

  return (
    <main id="main-content" className="main-container" style={{ maxInlineSize: '860px' }}>
      <form onSubmit={handleSubmit} className="card stack-lg">
        <div className="row-between">
          <div className="stack-sm">
            <FlyRunLogo
              size="sm"
              badgeText={
                isEditing
                  ? `Configuración · Paso ${step} de 3`
                  : step === 1
                  ? 'Paso 1 de 3 · Examen Inicial'
                  : `Paso ${step} de 3`
              }
            />
            <h1 style={{ margin: '0.25rem 0 0', fontSize: 'clamp(1.22rem, 3vw, 1.55rem)', letterSpacing: '-0.02em' }}>
              {step === 1 && 'Evalúa tu punto de partida antes de generar el plan'}
              {step === 2 && 'Datos biométricos y objetivo principal'}
              {step === 3 && 'Disponibilidad semanal, Google Fit y confirmación'}
            </h1>
          </div>

          <div className="row-wrap">
            {isEditing && (
              <div className="segmented-group" role="tablist" aria-label="Pasos de configuración">
                {(
                  [
                    { s: 1, label: '1. Nivel' },
                    { s: 2, label: '2. Datos' },
                    { s: 3, label: '3. Plan' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.s}
                    type="button"
                    role="tab"
                    aria-selected={step === item.s}
                    className="segmented-btn"
                    onClick={() => setStep(item.s)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
            {onCancel && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
                Cancelar
              </button>
            )}
          </div>
        </div>

        <div className="progress-track">
          <div className="progress-fill" style={{ inlineSize: `${(step / 3) * 100}%` }} />
        </div>

        {step === 1 && (
          <div className="stack-md">
            <div className="stack-sm">
              <div className="row-between">
                <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  ¿No tienes a mano una marca exacta? Elige tu referencia en 1 clic:
                </span>
                <span className="muted" style={{ fontSize: '0.75rem' }}>
                  Editable abajo en km/h, km/min o min/km
                </span>
              </div>
              <div className="preset-chips-grid" role="group" aria-label="Niveles rápidos de partida">
                {INITIAL_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={activePreset === p.id}
                    className="preset-chip"
                    onClick={() => applyPreset(p)}
                  >
                    <strong style={{ fontSize: '0.84rem' }}>{p.title}</strong>
                    <span className="muted mono" style={{ fontSize: '0.72rem' }}>{p.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid-2">
              <div className="field">
                <label htmlFor="onb-exam-type">Protocolo de evaluación</label>
                <select
                  id="onb-exam-type"
                  name="initialExamType"
                  className="select"
                  value={examType}
                  onChange={(e) => {
                    setExamTouched(true);
                    setActivePreset('');
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
                      if (examInputMode !== 'direct') {
                        setSpeedValue(6.6);
                        const parts = secPerKmToPaceMinSec(convertSpeedValue(6.6, 'kmh').secPerKm);
                        setPaceMinPart(parts.mins);
                        setPaceSecPart(parts.secs);
                      }
                    } else {
                      setRawValue(15);
                      setSpeedDurationMin(15);
                    }
                  }}
                >
                  <option value="cooper_12min">Test de Cooper (12 min)</option>
                  <option value="caco_continuous_test">Ritmo continuo sostenido</option>
                  <option value="time_trial_5k">Contrarreloj 5 km</option>
                  <option value="rockport_walk_1600m">Caminata Rockport 1,6 km</option>
                </select>
              </div>

              <div className="field">
                <label>Unidad de entrada</label>
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
                    Marca
                  </button>
                </div>
              </div>

              {examInputMode === 'min_km' ? (
                <div className="field">
                  <label htmlFor="onb-pace-mins">Ritmo por kilómetro (min : seg /km)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.45rem', alignItems: 'center' }}>
                    <input
                      id="onb-pace-mins"
                      name="initialExamPaceMins"
                      type="number"
                      min={2}
                      max={18}
                      className="input mono"
                      value={paceMinPart}
                      onChange={(e) => {
                        setExamTouched(true);
                        setActivePreset('');
                        setPaceMinPart(Number(e.target.value));
                      }}
                      aria-label="Minutos por km"
                      required
                    />
                    <span className="mono muted" style={{ fontWeight: 700 }}>:</span>
                    <input
                      id="onb-pace-secs"
                      name="initialExamPaceSecs"
                      type="number"
                      min={0}
                      max={59}
                      className="input mono"
                      value={paceSecPart}
                      onChange={(e) => {
                        setExamTouched(true);
                        setActivePreset('');
                        setPaceSecPart(Number(e.target.value));
                      }}
                      aria-label="Segundos por km"
                      required
                    />
                  </div>
                  <span className="muted mono" style={{ fontSize: '0.75rem' }}>
                    Equivale a {liveSpeedReadout.kmh.toFixed(1).replace('.', ',')} km/h ·{' '}
                    {liveSpeedReadout.kmPerMin.toFixed(3).replace('.', ',')} km/min
                  </span>
                </div>
              ) : examInputMode !== 'direct' ? (
                <div className="field">
                  <label htmlFor="onb-speed-val">
                    {examInputMode === 'kmh'
                      ? 'Velocidad sostenida (km/h)'
                      : 'Velocidad por minuto (km/min)'}
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
                    onChange={(e) => {
                      setExamTouched(true);
                      setActivePreset('');
                      setSpeedValue(Number(e.target.value));
                    }}
                    required
                  />
                  <span className="muted mono" style={{ fontSize: '0.75rem' }}>
                    Equivalencia: {liveSpeedReadout.kmh.toFixed(1).replace('.', ',')} km/h ·{' '}
                    {liveSpeedReadout.kmPerMin.toFixed(3).replace('.', ',')} km/min · {liveSpeedReadout.paceFormatted} /km
                  </span>
                </div>
              ) : examType === 'time_trial_5k' || examType === 'rockport_walk_1600m' ? (
                <div className="field">
                  <label htmlFor="onb-time-mins">Tiempo empleado (min : seg)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.45rem', alignItems: 'center' }}>
                    <input
                      id="onb-time-mins"
                      name="initialExamMins"
                      type="number"
                      min={5}
                      max={75}
                      className="input mono"
                      value={timeMins}
                      onChange={(e) => {
                        setExamTouched(true);
                        setActivePreset('');
                        setTimeMins(Number(e.target.value));
                      }}
                      aria-label="Minutos"
                      required
                    />
                    <span className="mono muted" style={{ fontWeight: 700 }}>:</span>
                    <input
                      id="onb-time-secs"
                      name="initialExamSecs"
                      type="number"
                      min={0}
                      max={59}
                      className="input mono"
                      value={timeSecs}
                      onChange={(e) => {
                        setExamTouched(true);
                        setActivePreset('');
                        setTimeSecs(Number(e.target.value));
                      }}
                      aria-label="Segundos"
                      required
                    />
                  </div>
                  <span className="muted mono" style={{ fontSize: '0.75rem' }}>
                    {liveSpeedReadout.kmh.toFixed(1).replace('.', ',')} km/h ·{' '}
                    {liveSpeedReadout.kmPerMin.toFixed(3).replace('.', ',')} km/min
                  </span>
                </div>
              ) : (
                <div className="field">
                  <label htmlFor="onb-raw-val">
                    {examType === 'cooper_12min'
                      ? 'Distancia en 12 minutos (metros)'
                      : 'Minutos seguidos trotando'}
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
                    onChange={(e) => {
                      setExamTouched(true);
                      setActivePreset('');
                      setRawValue(Number(e.target.value));
                    }}
                    required
                  />
                  {examType === 'cooper_12min' && (
                    <span className="muted mono" style={{ fontSize: '0.75rem' }}>
                      {liveSpeedReadout.kmh.toFixed(1).replace('.', ',')} km/h ·{' '}
                      {liveSpeedReadout.kmPerMin.toFixed(3).replace('.', ',')} km/min · {liveSpeedReadout.paceFormatted} /km
                    </span>
                  )}
                </div>
              )}

              {examInputMode !== 'direct' && examType === 'caco_continuous_test' ? (
                <div className="field">
                  <label htmlFor="onb-speed-dur">Duración sostenida (minutos)</label>
                  <input
                    id="onb-speed-dur"
                    name="initialExamDuration"
                    type="number"
                    min={3}
                    max={60}
                    className="input mono"
                    value={speedDurationMin}
                    onChange={(e) => {
                      setExamTouched(true);
                      setSpeedDurationMin(Number(e.target.value));
                    }}
                  />
                </div>
              ) : (
                <div className="field">
                  <label htmlFor="onb-exam-hr">Pulso final aproximado (ppm, opcional)</label>
                  <input
                    id="onb-exam-hr"
                    name="initialExamHR"
                    type="number"
                    min={75}
                    max={215}
                    className="input mono"
                    value={examHR}
                    onChange={(e) => {
                      setExamTouched(true);
                      setExamHR(Number(e.target.value));
                    }}
                  />
                </div>
              )}
            </div>

            <div className="grid-2">
              <div className="field">
                <label htmlFor="onb-rpe">Sensación de esfuerzo en esa referencia ({perceivedEffort}/10)</label>
                <input
                  id="onb-rpe"
                  name="initialPerceivedEffort"
                  type="range"
                  min={2}
                  max={10}
                  value={perceivedEffort}
                  onChange={(e) => {
                    setExamTouched(true);
                    setPerceivedEffort(Number(e.target.value));
                  }}
                />
                <span className="muted" style={{ fontSize: '0.76rem' }}>
                  2 = muy suave · 6 = controlado · 10 = esfuerzo máximo
                </span>
              </div>

              <div className="inset-panel stack-sm" style={{ padding: '0.65rem 0.85rem' }}>
                <div className="row-between">
                  <span className="muted" style={{ fontSize: '0.76rem', fontWeight: 600 }}>
                    ¿Haces la prueba ahora mismo?
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setShowLiveTimer((v) => !v)}
                  >
                    {showLiveTimer ? 'Ocultar cronómetro' : 'Usar cronómetro'}
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
                        {timerRunning ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
                        {timerRunning ? 'Pausar' : 'Iniciar'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        aria-label="Reiniciar cronómetro"
                        title="Reiniciar cronómetro"
                        onClick={() => {
                          setTimerRunning(false);
                          setTimerElapsedSec(0);
                        }}
                      >
                        <RotateCcw size={14} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-emerald btn-sm"
                        onClick={applyTimerToExam}
                        disabled={timerElapsedSec < 15}
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Resultado siempre visible en vivo */}
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
                    <span className="pill pill-emerald">
                      <ClipboardCheck size={13} aria-hidden="true" />
                      Estimación en vivo
                    </span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.2rem' }}>
                      Nivel {previewLevel.level} · {previewLevel.spanishTitle}
                    </div>
                    <div className="mono" style={{ fontSize: '0.78rem', color: 'var(--pine)' }}>
                      VDOT {previewVdot} · FCmáx {previewMaxHR} ppm · Reposo {previewRestHR} ppm
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
                      padding: '0.48rem 0.65rem',
                    }}
                  >
                    <div className="row-between">
                      <strong className="mono" style={{ fontSize: '0.78rem', color: z.color }}>{z.id}</strong>
                      <span className="muted mono" style={{ fontSize: '0.7rem' }}>{z.hrMin}–{z.hrMax} ppm</span>
                    </div>
                    <div className="mono" style={{ fontSize: '0.77rem', fontWeight: 700, marginTop: '0.15rem' }}>
                      {z.paceFormatted}
                    </div>
                    <div className="muted mono" style={{ fontSize: '0.71rem' }}>
                      {z.speedKmhFormatted} · {z.speedKmMinFormatted}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid-2">
            <div className="field">
              <label htmlFor="onb-name">Tu nombre</label>
              <input
                id="onb-name"
                name="displayName"
                className="input"
                placeholder="Ej. Laura, Javier…"
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
                className="input mono"
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
                className="input mono"
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
                className="input mono"
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
              <label htmlFor="onb-rhr">Pulso en reposo (ppm)</label>
              <input
                id="onb-rhr"
                name="restHR"
                type="number"
                min={38}
                max={110}
                className="input mono"
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
                <span className="muted" style={{ fontSize: '0.75rem' }}>Nivel certificado para tu plan</span>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                  Nivel {previewLevel.level} ({previewLevel.spanishTitle}) · VDOT {previewVdot}
                </div>
                <div className="muted mono" style={{ fontSize: '0.76rem' }}>
                  Z1 Base: {previewZones[0].paceFormatted} · {previewZones[0].speedKmhFormatted} · {previewZones[0].speedKmMinFormatted}
                </div>
              </div>
              <span className="pill pill-emerald mono">Listo</span>
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
              onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
            >
              {step === 1 ? 'Confirmar nivel y continuar' : 'Siguiente paso'}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          ) : (
            <button key="btn-submit-onboarding" type="submit" className="btn btn-emerald">
              <CheckCircle2 size={17} aria-hidden="true" />
              {isEditing ? 'Guardar cambios del perfil' : 'Entrar a FlyRun con mi plan'}
            </button>
          )}
        </div>
      </form>
    </main>
  );
}