import { useState } from 'react';
import { Award, CheckCircle2, ClipboardCheck, Edit3, Lock, Medal, TrendingUp } from 'lucide-react';
import type { PhysicalExamResult, PhysicalExamType, UserProfile } from '../types/fitness';
import {
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
  const [heartRate, setHeartRate] = useState<number>(152);
  const [examSubmittedMsg, setExamSubmittedMsg] = useState<string | null>(null);

  const zones = calculateTrainingZones(profile.vdot, profile.maxHR, profile.restHR);
  const levelInfo = getLynxLevel(profile.vdot, profile.xp);
  const allLevels = getAllLevelDefinitions();
  const bmi = (profile.weightKg / Math.pow(profile.heightCm / 100, 2)).toFixed(1);

  const handleExamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitExam(examType, rawValue, undefined, heartRate);
    setExamSubmittedMsg(
      'Examen físico registrado. Tu VDOT, nivel y zonas de entrenamiento se han recalculado.'
    );
  };

  return (
    <div className="stack-lg">
      <section className="card stack-md" aria-label="Mis Datos Biométricos">
        <div className="row-between">
          <div>
            <span className="pill pill-amber">Perfil fisiológico</span>
            <h1 style={{ margin: '0.35rem 0 0', fontSize: '1.3rem', letterSpacing: '-0.02em' }}>
              Tus datos, zonas de ritmo y nivel
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
              Protocolo: calienta 10 minutos suaves, realiza una de las pruebas de evaluación y guarda los resultados para recalcular tus ritmos.
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
                else if (next === 'time_trial_5k') setRawValue(25.5);
                else if (next === 'rockport_walk_1600m') setRawValue(14.5);
                else setRawValue(20);
              }}
            >
              <option value="cooper_12min">Test de Cooper (12 min máx distancia)</option>
              <option value="time_trial_5k">Contrarreloj 5K (minutos totales)</option>
              <option value="rockport_walk_1600m">Test Rockport caminata 1,6 km (min)</option>
              <option value="caco_continuous_test">Test continuo base (min sin parar)</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="exam-value">
              {examType === 'cooper_12min' && 'Distancia recorrida (metros)'}
              {examType === 'time_trial_5k' && 'Tiempo total en 5 km (minutos)'}
              {examType === 'rockport_walk_1600m' && 'Tiempo en 1,6 km (minutos)'}
              {examType === 'caco_continuous_test' && 'Minutos trotando continuo'}
            </label>
            <input
              id="exam-value"
              name="examRawValue"
              type="number"
              min={1}
              max={6000}
              step="0.1"
              className="input"
              value={rawValue}
              onChange={(e) => setRawValue(Number(e.target.value))}
              required
            />
          </div>

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

        {exams.length > 0 && (
          <div className="stack-sm">
            <strong style={{ fontSize: '0.86rem' }}>Historial de evaluaciones</strong>
            {exams.slice(0, 4).map((ex) => (
              <div
                key={ex.id}
                className="inset-panel row-between"
                style={{ padding: '0.55rem 0.8rem', fontSize: '0.82rem' }}
              >
                <span>{ex.summary}</span>
                <span className="muted mono">{ex.date}</span>
              </div>
            ))}
          </div>
        )}
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
              return (
                <article
                  key={badge.id}
                  style={{
                    padding: '0.78rem',
                    borderRadius: '10px',
                    border: unlocked
                      ? '1px solid var(--pine-border)'
                      : '1px solid var(--border-hairline)',
                    background: unlocked ? 'var(--pine-soft)' : 'var(--bg-inset)',
                    opacity: unlocked ? 1 : 0.65,
                  }}
                >
                  <div className="row-between">
                    <strong style={{ fontSize: '0.86rem' }}>{badge.title}</strong>
                    <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--pine)', fontWeight: 600 }}>
                      +{badge.xpReward} XP
                    </span>
                  </div>
                  <p className="muted" style={{ margin: '0.25rem 0 0', fontSize: '0.77rem' }}>
                    {badge.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
