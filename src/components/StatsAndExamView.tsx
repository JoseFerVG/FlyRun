import { useState } from 'react';
import { Award, CheckCircle2, ClipboardCheck, Edit3, Lock, Medal, Timer, TrendingUp } from 'lucide-react';
import type { PhysicalExamResult, PhysicalExamType, UserProfile } from '../types/fitness';
import {
  calculateRacePredictions,
  calculateTrainingZones,
  getAllLevelDefinitions,
  getLynxLevel,
} from '../services/scienceEngine';
import { BADGES_CATALOG } from '../data/runningKnowledge';

interface StatsAndExamViewProps {
  profile: UserProfile;
  exams: PhysicalExamResult[];
  onSubmitExam: (
    examType: PhysicalExamType,
    rawValue: number,
    secondaryValue?: number,
    heartRateBpm?: number
  ) => void;
  onEditProfile: () => void;
}

export function StatsAndExamView({
  profile,
  exams,
  onSubmitExam,
  onEditProfile,
}: StatsAndExamViewProps) {
  const [examType, setExamType] = useState<PhysicalExamType>('cooper_12min');
  const [rawValue, setRawValue] = useState<number>(2250);
  const [timeMins, setTimeMins] = useState<number>(25);
  const [timeSecs, setTimeSecs] = useState<number>(30);
  const [heartRate, setHeartRate] = useState<number>(152);
  const [examSubmittedMsg, setExamSubmittedMsg] = useState<string | null>(null);

  const zones = calculateTrainingZones(profile.vdot, profile.maxHR, profile.restHR);
  const predictions = calculateRacePredictions(profile.vdot);
  const levelInfo = getLynxLevel(profile.vdot, profile.xp);
  const allLevels = getAllLevelDefinitions();
  const bmi = (profile.weightKg / Math.pow(profile.heightCm / 100, 2)).toFixed(1);

  const isSplitTimeExam = examType === 'time_trial_5k' || examType === 'rockport_walk_1600m';

  const handleExamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericVal = isSplitTimeExam
      ? Number((Math.max(1, timeMins) + Math.max(0, Math.min(59, timeSecs)) / 60).toFixed(2))
      : rawValue;
    onSubmitExam(examType, numericVal, undefined, heartRate);
    setExamSubmittedMsg(
      'Examen físico registrado. Tu VDOT, nivel, predicciones y zonas de ritmo se han actualizado.'
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
    if (unlocked) return { current: 1, target: 1, label: 'Completado' };
    if (id === 'streak_3') return { current: Math.min(3, profile.streakDays), target: 3, label: `${profile.streakDays}/3 días` };
    if (id === 'level_5') return { current: Math.min(5, profile.level), target: 5, label: `Nivel ${profile.level}/5` };
    if (id === 'exam_completed') return { current: Math.min(1, exams.length), target: 1, label: `${exams.length}/1 test` };
    return { current: 0, target: 1, label: 'Pendiente' };
  };

  return (
    <div className="stack-lg">
      <section className="card stack-md" aria-label="Mis Datos Biométricos">
        <div className="row-between">
          <div>
            <span className="pill pill-amber">Perfil fisiológico</span>
            <h1 style={{ margin: '0.35rem 0 0', fontSize: '1.3rem', letterSpacing: '-0.02em' }}>
              Tus datos, zonas de ritmo y predicciones
            </h1>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onEditProfile}>
            <Edit3 size={15} aria-hidden="true" />
            Editar datos / días / objetivo
          </button>
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
              {profile.vdot}
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
              {profile.xp} XP · {profile.totalCardioPoints} PC
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

        <div className="scroll-table-wrap">
          <table className="zone-table">
            <thead>
              <tr>
                <th>Zona</th>
                <th>Referencia Daniels</th>
                <th>Ritmo objetivo</th>
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
                  <td className="mono" style={{ fontWeight: 600 }}>{z.paceFormatted}</td>
                  <td className="mono">{z.hrMin}–{z.hrMax} ppm</td>
                  <td className="muted">{z.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tabla de predicción de marcas y ritmos por vuelta de 400m */}
      <section className="card stack-md" aria-label="Predicción de marcas y paso por 400 m">
        <div className="row-wrap">
          <Timer size={18} color="#2563eb" aria-hidden="true" />
          <div>
            <h2 style={{ margin: 0, fontSize: '1.14rem' }}>Marcas equivalentes estimadas (VDOT {profile.vdot})</h2>
            <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>
              Incluye el tiempo objetivo por cada vuelta de 400 m en pista de atletismo para preparar pruebas como el Test de Cooper o 5K.
            </p>
          </div>
        </div>

        <div className="scroll-table-wrap">
          <table className="zone-table">
            <thead>
              <tr>
                <th>Distancia</th>
                <th>Tiempo estimado</th>
                <th>Ritmo medio</th>
                <th>Paso por vuelta (400 m)</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map((p) => (
                <tr key={p.distanceLabel}>
                  <td style={{ fontWeight: 600 }}>{p.distanceLabel}</td>
                  <td className="mono" style={{ fontWeight: 700, color: 'var(--accent)' }}>{p.timeFormatted}</td>
                  <td className="mono">{p.pacePerKm}</td>
                  <td className="mono" style={{ color: 'var(--pine)', fontWeight: 600 }}>{p.split400m}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* DÍA DE EXAMEN FÍSICO */}
      <section className="card stack-md" aria-label="Día de Examen Físico">
        <div className="row-between">
          <div>
            <span className="pill pill-cyan">
              <ClipboardCheck size={13} aria-hidden="true" />
              Día de examen físico
            </span>
            <h2 style={{ margin: '0.35rem 0 0', fontSize: '1.22rem', letterSpacing: '-0.015em' }}>
              Registra tus marcas reales y actualiza tu nivel
            </h2>
            <p className="secondary" style={{ margin: '0.22rem 0 0', fontSize: '0.87rem' }}>
              Calienta 10 minutos suaves, realiza una de las pruebas estandarizadas e introduce tu resultado exacto (minutos y segundos reales).
            </p>
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
                if (next === 'cooper_12min') setRawValue(2250);
                else if (next === 'time_trial_5k') {
                  setTimeMins(25);
                  setTimeSecs(30);
                } else if (next === 'rockport_walk_1600m') {
                  setTimeMins(14);
                  setTimeSecs(20);
                } else setRawValue(20);
              }}
            >
              <option value="cooper_12min">Test de Cooper (12 min máx distancia)</option>
              <option value="time_trial_5k">Contrarreloj 5K (min y seg)</option>
              <option value="rockport_walk_1600m">Test Rockport caminata 1,6 km (min y seg)</option>
              <option value="caco_continuous_test">Test continuo base (min sin parar)</option>
            </select>
          </div>

          {isSplitTimeExam ? (
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

          <div className="row-wrap" style={{ gridColumn: '1 / -1' }}>
            <button type="submit" className="btn btn-primary">
              <TrendingUp size={16} aria-hidden="true" />
              Evaluar examen y recalcular plan (+220 XP)
            </button>
            {examSubmittedMsg && (
              <span style={{ color: 'var(--pine)', fontSize: '0.84rem', fontWeight: 600 }}>
                {examSubmittedMsg}
              </span>
            )}
          </div>
        </form>

        {/* Evolución visual de VDOT */}
        <div className="grid-2">
          <div className="inset-panel stack-sm">
            <strong style={{ fontSize: '0.86rem' }}>Evolución de VDOT</strong>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', blockSize: '110px', paddingTop: '0.75rem' }}>
              {chartPoints.map((pt, i) => {
                const heightPct = Math.max(20, Math.min(100, Math.round(((pt.vdot - 15) / 55) * 100)));
                return (
                  <div
                    key={`${pt.label}-${i}`}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      blockSize: '100%',
                      gap: '0.25rem',
                    }}
                  >
                    <span className="mono" style={{ fontSize: '0.72rem', fontWeight: 700 }}>{pt.vdot}</span>
                    <div
                      style={{
                        inlineSize: '100%',
                        maxInlineSize: '42px',
                        blockSize: `${heightPct}%`,
                        borderRadius: '6px 6px 2px 2px',
                        background: 'var(--cobalt)',
                      }}
                    />
                    <span className="muted mono" style={{ fontSize: '0.68rem' }}>{pt.label}</span>
                  </div>
                );
              })}
            </div>
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
      </section>

      <div className="grid-2">
        <section className="card stack-md">
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
                      <CheckCircle2 size={15} color="#186a4b" aria-hidden="true" />
                    ) : (
                      <Lock size={14} color="#767c87" aria-hidden="true" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="card stack-md">
          <div className="row-wrap">
            <Medal size={18} color="#b45309" aria-hidden="true" />
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
        </section>
      </div>
    </div>
  );
}
