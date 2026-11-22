import { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { CardioModality, FitnessGoal, PhysicalExamType, SexType, UserProfile } from '../types/fitness';
import { calculateVDOTFromExam, estimateMaxHR, getLynxLevel } from '../services/scienceEngine';

interface OnboardingModalProps {
  uid: string;
  initialName: string;
  email: string;
  photoURL: string;
  isDemoMode: boolean;
  existingProfile?: UserProfile | null;
  onComplete: (profile: UserProfile) => void;
  onCancel?: () => void;
}

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

  const [displayName, setDisplayName] = useState(existingProfile?.displayName ?? initialName);
  const [age, setAge] = useState(existingProfile?.age ?? 29);
  const [weightKg, setWeightKg] = useState(existingProfile?.weightKg ?? 72);
  const [heightCm, setHeightCm] = useState(existingProfile?.heightCm ?? 175);
  const [sex, setSex] = useState<SexType>(existingProfile?.sex ?? 'male');
  const [goal, setGoal] = useState<FitnessGoal>(existingProfile?.goal ?? 'start_running');

  const [trainingDaysPerWeek, setTrainingDaysPerWeek] = useState(existingProfile?.trainingDaysPerWeek ?? 4);
  const [weeklyWalkGoalSessions, setWeeklyWalkGoalSessions] = useState(existingProfile?.weeklyWalkGoalSessions ?? 5);
  const [dailyStepsTarget, setDailyStepsTarget] = useState(existingProfile?.dailyStepsTarget ?? 8500);
  const [preferredModalities, setPreferredModalities] = useState<CardioModality[]>(
    existingProfile?.preferredModalities ?? ['running', 'cycling', 'soccer']
  );

  const [examType, setExamType] = useState<PhysicalExamType>('caco_continuous_test');
  const [rawValue, setRawValue] = useState(12);
  const [perceivedEffort, setPerceivedEffort] = useState(5);
  const [restHR, setRestHR] = useState(existingProfile?.restHR ?? 62);

  const toggleModality = (mod: CardioModality) => {
    if (mod === 'running') return;
    setPreferredModalities((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
    );
  };

  const previewVdot = calculateVDOTFromExam(examType, rawValue, {
    secondaryValue: perceivedEffort,
    heartRateBpm: 140,
    age,
    weightKg,
    sex,
  });
  const previewLevel = getLynxLevel(previewVdot, existingProfile?.xp ?? 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep((s) => Math.min(3, s + 1) as 1 | 2 | 3);
      return;
    }

    const maxHR = estimateMaxHR(age);
    const safeRestHR = Math.max(35, Math.min(restHR, maxHR - 15));
    const vdot = previewVdot;
    const baseXp = existingProfile?.xp ?? 100;
    const lvl = getLynxLevel(vdot, baseXp);
    const strategyId = existingProfile?.preferredStrategyId ?? (lvl.level <= 2 ? 'caco_progressive' : 'polarized_80_20');

    const profile: UserProfile = {
      uid,
      displayName: displayName.trim() || 'Usuario FlyRun',
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
      unlockedBadges: existingProfile?.unlockedBadges?.length
        ? existingProfile.unlockedBadges
        : ['first_calibration'],
      onboardingCompleted: true,
      isDemoMode,
      updatedAt: new Date().toISOString(),
    };

    onComplete(profile);
  };

  return (
    <main className="main-container" style={{ maxInlineSize: '780px' }}>
      <form onSubmit={handleSubmit} className="card stack-lg">
        <div className="row-between">
          <div>
            <span className="pill pill-amber">Paso {step} de 3 · Configuración inicial</span>
            <h1 style={{ margin: '0.4rem 0 0', fontSize: 'clamp(1.25rem, 3vw, 1.55rem)', letterSpacing: '-0.02em' }}>
              {step === 1 && 'Datos personales y objetivo'}
              {step === 2 && 'Días de entreno, caminata y deportes'}
              {step === 3 && 'Medición inicial de tu nivel'}
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
              <label htmlFor="onb-sex">Sexo fisiológico (cálculo de VO2 y metabolismo)</label>
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
          </div>
        )}

        {step === 2 && (
          <div className="stack-md">
            <div className="grid-2">
              <div className="field">
                <label htmlFor="onb-days">¿Cuántos días a la semana quieres entrenar?</label>
                <select
                  id="onb-days"
                  name="trainingDaysPerWeek"
                  className="select"
                  value={trainingDaysPerWeek}
                  onChange={(e) => setTrainingDaysPerWeek(Number(e.target.value))}
                >
                  <option value={2}>2 días / semana (Mantenimiento)</option>
                  <option value={3}>3 días / semana (Equilibrado)</option>
                  <option value={4}>4 días / semana (Recomendado 80/20)</option>
                  <option value={5}>5 días / semana (Volumen medio-alto)</option>
                  <option value={6}>6 días / semana (Alto volumen)</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="onb-walks">¿Cuántos días a la semana quieres salir a andar?</label>
                <select
                  id="onb-walks"
                  name="weeklyWalkGoalSessions"
                  className="select"
                  value={weeklyWalkGoalSessions}
                  onChange={(e) => setWeeklyWalkGoalSessions(Number(e.target.value))}
                >
                  <option value={3}>3 días por semana</option>
                  <option value={5}>5 días por semana</option>
                  <option value={7}>Todos los días (7 días)</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="onb-steps">Objetivo diario de pasos (Google Fit)</label>
                <input
                  id="onb-steps"
                  name="dailyStepsTarget"
                  type="number"
                  min={3000}
                  max={25000}
                  step={500}
                  className="input"
                  value={dailyStepsTarget}
                  onChange={(e) => setDailyStepsTarget(Number(e.target.value))}
                />
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

            <div className="stack-sm">
              <span style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Modalidades de cardio que practicas (Running es la base del plan; marca las alternativas que te gusten):
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
          </div>
        )}

        {step === 3 && (
          <div className="stack-md">
            <p className="secondary" style={{ margin: 0, fontSize: '0.92rem' }}>
              Para fijar tus zonas de entrenamiento con rigor necesitamos una referencia objetiva real. Selecciona la que mejor refleje tu estado hoy:
            </p>

            <div className="grid-2">
              <div className="field">
                <label htmlFor="onb-exam-type">Referencia de partida</label>
                <select
                  id="onb-exam-type"
                  name="initialExamType"
                  className="select"
                  value={examType}
                  onChange={(e) => {
                    const next = e.target.value as PhysicalExamType;
                    setExamType(next);
                    if (next === 'cooper_12min') setRawValue(2100);
                    else if (next === 'time_trial_5k') setRawValue(28);
                    else if (next === 'rockport_walk_1600m') setRawValue(15);
                    else setRawValue(12);
                  }}
                >
                  <option value="caco_continuous_test">Minutos que aguantas trotando seguido sin parar</option>
                  <option value="cooper_12min">Test de Cooper (metros recorridos en 12 min)</option>
                  <option value="time_trial_5k">Marca reciente en 5 km (minutos totales)</option>
                  <option value="rockport_walk_1600m">Test de caminata 1,6 km (minutos)</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="onb-raw-val">
                  {examType === 'cooper_12min' && 'Distancia en 12 minutos (metros)'}
                  {examType === 'time_trial_5k' && 'Tiempo total en 5 km (minutos)'}
                  {examType === 'rockport_walk_1600m' && 'Tiempo en 1,6 km caminando (minutos)'}
                  {examType === 'caco_continuous_test' && 'Minutos seguidos trotando cómodo'}
                </label>
                <input
                  id="onb-raw-val"
                  name="initialExamValue"
                  type="number"
                  min={1}
                  max={5000}
                  step="0.5"
                  className="input"
                  value={rawValue}
                  onChange={(e) => setRawValue(Number(e.target.value))}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="onb-rpe">Esfuerzo percibido en esa referencia ({perceivedEffort}/10)</label>
                <input
                  id="onb-rpe"
                  name="initialPerceivedEffort"
                  type="range"
                  min={2}
                  max={10}
                  value={perceivedEffort}
                  onChange={(e) => setPerceivedEffort(Number(e.target.value))}
                />
                <span className="muted" style={{ fontSize: '0.78rem' }}>
                  1 = muy suave · 10 = esfuerzo máximo
                </span>
              </div>

              <div className="inset-panel stack-sm">
                <span className="muted" style={{ fontSize: '0.76rem', fontWeight: 600, textTransform: 'uppercase' }}>
                  Evaluación resultante
                </span>
                <div style={{ fontSize: '1.08rem', fontWeight: 700 }}>
                  Nivel {previewLevel.level}: {previewLevel.spanishTitle}
                </div>
                <div className="mono" style={{ fontSize: '0.84rem', color: 'var(--pine)' }}>
                  VDOT {previewVdot} · FCmáx estimada {estimateMaxHR(age)} ppm
                </div>
              </div>
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
              Siguiente paso
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          ) : (
            <button key="btn-submit-onboarding" type="submit" className="btn btn-emerald">
              <CheckCircle2 size={17} aria-hidden="true" />
              Guardar perfil y generar plan
            </button>
          )}
        </div>
      </form>
    </main>
  );
}
