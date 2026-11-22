import { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Flame, Footprints, Ruler } from 'lucide-react';
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

  // Paso 1: Biometría
  const [displayName, setDisplayName] = useState(existingProfile?.displayName ?? initialName);
  const [age, setAge] = useState(existingProfile?.age ?? 29);
  const [weightKg, setWeightKg] = useState(existingProfile?.weightKg ?? 72);
  const [heightCm, setHeightCm] = useState(existingProfile?.heightCm ?? 175);
  const [sex, setSex] = useState<SexType>(existingProfile?.sex ?? 'male');
  const [goal, setGoal] = useState<FitnessGoal>(existingProfile?.goal ?? 'start_running');

  // Paso 2: Días, Caminata y Modalidades
  const [trainingDaysPerWeek, setTrainingDaysPerWeek] = useState(existingProfile?.trainingDaysPerWeek ?? 4);
  const [weeklyWalkGoalSessions, setWeeklyWalkGoalSessions] = useState(existingProfile?.weeklyWalkGoalSessions ?? 5);
  const [dailyStepsTarget, setDailyStepsTarget] = useState(existingProfile?.dailyStepsTarget ?? 8500);
  const [preferredModalities, setPreferredModalities] = useState<CardioModality[]>(
    existingProfile?.preferredModalities ?? ['running', 'cycling', 'soccer']
  );

  // Paso 3: Medición objetiva inicial de nivel
  const [examType, setExamType] = useState<PhysicalExamType>('caco_continuous_test');
  const [rawValue, setRawValue] = useState(12); // minutos trotando seguidos por defecto
  const [perceivedEffort, setPerceivedEffort] = useState(5);
  const [restHR, setRestHR] = useState(existingProfile?.restHR ?? 62);

  const toggleModality = (mod: CardioModality) => {
    if (mod === 'running') return; // Running es la modalidad principal
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
    const vdot = previewVdot;
    const baseXp = existingProfile?.xp ?? 100;
    const lvl = getLynxLevel(vdot, baseXp);
    const strategyId =
      lvl.level <= 2
        ? 'caco_progressive'
        : goal === 'improve_5k' || goal === 'improve_10k'
        ? 'polarized_80_20'
        : 'polarized_80_20';

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
      restHR,
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
    <main className="main-container" style={{ maxInlineSize: '840px' }}>
      <form onSubmit={handleSubmit} className="card card-highlight stack-lg">
        <div className="row-between">
          <div className="row-wrap">
            <img
              src="/assets/lynx/lynx-exam-clipboard.png"
              alt="Coach Lince evaluador"
              width={64}
              height={64}
              style={{ borderRadius: '16px', objectFit: 'cover', border: '2px solid var(--lynx-amber)' }}
            />
            <div>
              <span className="pill pill-amber">Paso {step} de 3 · Creación de Perfil FlyRun</span>
              <h1 style={{ margin: '0.35rem 0 0', fontSize: 'clamp(1.25rem, 3vw, 1.65rem)' }}>
                {step === 1 && 'Tus Datos Biométricos'}
                {step === 2 && 'Días de Entreno, Caminata y Deportes'}
                {step === 3 && 'Medición Objetiva de tu Nivel Inicial'}
              </h1>
            </div>
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
              <label htmlFor="onb-name">Nombre de Atleta</label>
              <input
                id="onb-name"
                className="input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="onb-goal">Objetivo Principal</label>
              <select
                id="onb-goal"
                className="select"
                value={goal}
                onChange={(e) => setGoal(e.target.value as FitnessGoal)}
              >
                <option value="start_running">Empezar a correr sin lesiones (CaCo → 5K)</option>
                <option value="health_maintenance">Mantenimiento físico y cardio diario</option>
                <option value="improve_5k">Mejorar marca y resistencia en 5K</option>
                <option value="improve_10k">Preparar 10K con método 80/20</option>
                <option value="fat_loss_cardio">Recomposición corporal y gasto cardio</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="onb-age">Edad (años)</label>
              <input
                id="onb-age"
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
              <label htmlFor="onb-sex">Sexo fisiológico (para fórmulas VO2 y TMB)</label>
              <select
                id="onb-sex"
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
                  className="select"
                  value={trainingDaysPerWeek}
                  onChange={(e) => setTrainingDaysPerWeek(Number(e.target.value))}
                >
                  <option value={2}>2 días / semana (Mantenimiento mínimo efectivo)</option>
                  <option value={3}>3 días / semana (Equilibrio perfecto)</option>
                  <option value={4}>4 días / semana (Óptimo 80/20 recomendado)</option>
                  <option value={5}>5 días / semana (Progresión avanzada)</option>
                  <option value={6}>6 días / semana (Alto volumen)</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="onb-walks">¿Cuántas veces/días a la semana quieres salir a andar?</label>
                <select
                  id="onb-walks"
                  className="select"
                  value={weeklyWalkGoalSessions}
                  onChange={(e) => setWeeklyWalkGoalSessions(Number(e.target.value))}
                >
                  <option value={3}>3 días de caminata consciente</option>
                  <option value={5}>5 días de caminata diaria</option>
                  <option value={7}>Todos los días (7/7 hábito activo)</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="onb-steps">Objetivo diario de pasos (Google Fit)</label>
                <input
                  id="onb-steps"
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
                <label htmlFor="onb-rhr">Pulso en reposo estimado (ppm)</label>
                <input
                  id="onb-rhr"
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
              <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>
                Modos de Cardio en tu rutina (Running es el eje principal; añade alternativos):
              </span>
              <div className="row-wrap">
                <button type="button" className="btn btn-primary btn-sm" disabled>
                  <Flame size={15} aria-hidden="true" />
                  Running (Principal)
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${preferredModalities.includes('cycling') ? 'btn-emerald' : 'btn-secondary'}`}
                  onClick={() => toggleModality('cycling')}
                >
                  Ciclismo / Bici {preferredModalities.includes('cycling') ? '✓' : ''}
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${preferredModalities.includes('soccer') ? 'btn-emerald' : 'btn-secondary'}`}
                  onClick={() => toggleModality('soccer')}
                >
                  Partido de Fútbol {preferredModalities.includes('soccer') ? '✓' : ''}
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${preferredModalities.includes('walking') ? 'btn-emerald' : 'btn-secondary'}`}
                  onClick={() => toggleModality('walking')}
                >
                  <Footprints size={14} aria-hidden="true" />
                  Caminata Activa {preferredModalities.includes('walking') ? '✓' : ''}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="stack-md">
            <p className="secondary" style={{ margin: 0, fontSize: '0.92rem' }}>
              Coach Lince necesita una <strong>medición clara y objetiva</strong> para no ponerte ritmos demasiado suaves ni lesionarte.
              Elige la prueba o referencia que mejor conoces ahora mismo:
            </p>

            <div className="grid-2">
              <div className="field">
                <label htmlFor="onb-exam-type">Tipo de medición inicial</label>
                <select
                  id="onb-exam-type"
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
                  <option value="caco_continuous_test">¿Cuántos minutos aguantas trotando seguido sin parar?</option>
                  <option value="cooper_12min">Test de Cooper (metros recorridos en 12 min)</option>
                  <option value="time_trial_5k">Tu mejor marca actual/reciente en 5 km (minutos)</option>
                  <option value="rockport_walk_1600m">Test Rockport: tiempo caminando 1.6 km rápido (min)</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="onb-raw-val">
                  {examType === 'cooper_12min' && 'Metros recorridos en 12 minutos'}
                  {examType === 'time_trial_5k' && 'Minutos empleados en 5 km'}
                  {examType === 'rockport_walk_1600m' && 'Minutos empleados en 1.6 km caminando'}
                  {examType === 'caco_continuous_test' && 'Minutos seguidos trotando cómodo'}
                </label>
                <input
                  id="onb-raw-val"
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
                <label htmlFor="onb-rpe">Sensación de esfuerzo en esa referencia (1 muy fácil – 10 máximo)</label>
                <input
                  id="onb-rpe"
                  type="range"
                  min={2}
                  max={10}
                  value={perceivedEffort}
                  onChange={(e) => setPerceivedEffort(Number(e.target.value))}
                />
                <span className="muted" style={{ fontSize: '0.8rem' }}>
                  Esfuerzo percibido (RPE): <strong>{perceivedEffort}/10</strong>
                </span>
              </div>

              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  borderRadius: '14px',
                  padding: '0.9rem 1rem',
                }}
              >
                <div className="row-between">
                  <span className="muted" style={{ fontSize: '0.8rem' }}>Diagnóstico instantáneo del Lince</span>
                  <Ruler size={16} color="#34d399" aria-hidden="true" />
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, marginBlockStart: '0.25rem' }}>
                  Nivel {previewLevel.level}: {previewLevel.spanishTitle}
                </div>
                <div className="mono" style={{ fontSize: '0.86rem', color: '#6ee7b7' }}>
                  VDOT estimado: {previewVdot} · FCmax: {estimateMaxHR(age)} ppm
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
              Crear Plan Científico con Coach Lince
            </button>
          )}
        </div>
      </form>
    </main>
  );
}
