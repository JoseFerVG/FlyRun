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
      'Examen Físico registrado. Tu VDOT, nivel del Lince y zonas de entrenamiento se han actualizado.'
    );
  };

  return (
    <div className="stack-lg">
      {/* MIS DATOS PERSONALES Y BIOMÉTRICOS */}
      <section className="card stack-md" aria-label="Mis Datos Biométricos">
        <div className="row-between">
          <div>
            <span className="pill pill-amber">Expediente Fisiológico FlyRun</span>
            <h1 style={{ margin: '0.35rem 0 0', fontSize: '1.35rem' }}>
              Mis Datos, Zonas VDOT y Nivel Gamificado
            </h1>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onEditProfile}>
            <Edit3 size={15} aria-hidden="true" />
            Editar Datos / Días / Objetivo
          </button>
        </div>

        <div className="grid-4">
          <div style={{ background: 'rgba(15,23,42,0.75)', borderRadius: '14px', padding: '0.9rem' }}>
            <div className="muted" style={{ fontSize: '0.76rem' }}>Biometría</div>
            <div className="mono" style={{ fontWeight: 700, fontSize: '1.1rem' }}>
              {profile.weightKg} kg · {profile.heightCm} cm
            </div>
            <div className="muted" style={{ fontSize: '0.76rem' }}>
              {profile.age} años · IMC {bmi}
            </div>
          </div>

          <div style={{ background: 'rgba(15,23,42,0.75)', borderRadius: '14px', padding: '0.9rem' }}>
            <div className="muted" style={{ fontSize: '0.76rem' }}>VDOT / VO2max Efectivo</div>
            <div className="mono" style={{ fontWeight: 800, fontSize: '1.3rem', color: '#38bdf8' }}>
              {profile.vdot}
            </div>
            <div className="muted" style={{ fontSize: '0.76rem' }}>
              FC Reposo {profile.restHR} / Máx {profile.maxHR} ppm
            </div>
          </div>

          <div style={{ background: 'rgba(15,23,42,0.75)', borderRadius: '14px', padding: '0.9rem' }}>
            <div className="muted" style={{ fontSize: '0.76rem' }}>Nivel Coach Lince</div>
            <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#fb923c' }}>
              Nv.{levelInfo.level} · {levelInfo.spanishTitle}
            </div>
            <div className="muted mono" style={{ fontSize: '0.76rem' }}>
              {profile.xp} XP · {profile.totalCardioPoints} CP
            </div>
          </div>

          <div style={{ background: 'rgba(15,23,42,0.75)', borderRadius: '14px', padding: '0.9rem' }}>
            <div className="muted" style={{ fontSize: '0.76rem' }}>Compromiso Semanal</div>
            <div className="mono" style={{ fontWeight: 700, fontSize: '1.1rem' }}>
              {profile.trainingDaysPerWeek} días entreno
            </div>
            <div className="muted" style={{ fontSize: '0.76rem' }}>
              Andar {profile.weeklyWalkGoalSessions} veces/sem · {profile.dailyStepsTarget.toLocaleString('es-ES')} pasos
            </div>
          </div>
        </div>

        {/* Tabla de Zonas Jack Daniels */}
        <div className="scroll-table-wrap">
          <table className="zone-table">
            <thead>
              <tr>
                <th>Zona</th>
                <th>Modelo Daniels</th>
                <th>Ritmo Objetivo</th>
                <th>Pulso (Karvonen)</th>
                <th>Adaptación Fisiológica</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((z) => (
                <tr key={z.id}>
                  <td>
                    <span
                      className="pill mono"
                      style={{ borderColor: z.color, color: z.color }}
                    >
                      {z.id}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700 }}>{z.danielsCode}</td>
                  <td className="mono" style={{ fontWeight: 700 }}>{z.paceFormatted}</td>
                  <td className="mono">{z.hrMin}–{z.hrMax} ppm</td>
                  <td className="muted">{z.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* DÍA DE EXAMEN FÍSICO */}
      <section className="card card-highlight stack-md" aria-label="Día de Examen Físico del Lince">
        <div className="lynx-hero-grid">
          <img
            src="/assets/lynx/lynx-exam-clipboard.png"
            alt="Coach Lince evaluando examen físico"
            width={190}
            height={190}
            className="lynx-portrait"
            loading="lazy"
          />

          <div className="stack-md">
            <div>
              <span className="pill pill-cyan">
                <ClipboardCheck size={13} aria-hidden="true" />
                Día de Examen Físico · Recalibración Objetiva
              </span>
              <h2 style={{ margin: '0.35rem 0 0', fontSize: '1.3rem' }}>
                Registra tu Prueba Física y Actualiza tu Nivel
              </h2>
              <p className="secondary" style={{ margin: '0.25rem 0 0', fontSize: '0.88rem' }}>
                Protocolo oficial: calienta 10 min en Zona 1, realiza una de las 3 pruebas estandarizadas al esfuerzo indicado y registra tus datos reales aquí.
              </p>
            </div>

            <form onSubmit={handleExamSubmit} className="grid-3">
              <div className="field">
                <label htmlFor="exam-selector">Prueba Física Oficial</label>
                <select
                  id="exam-selector"
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
                  <option value="rockport_walk_1600m">Test Rockport Caminata 1.6 km (min)</option>
                  <option value="caco_continuous_test">Test Continuo Base (min sin parar)</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="exam-value">
                  {examType === 'cooper_12min' && 'Distancia recorrida (metros)'}
                  {examType === 'time_trial_5k' && 'Tiempo total en 5 km (minutos)'}
                  {examType === 'rockport_walk_1600m' && 'Tiempo en 1.6 km (minutos)'}
                  {examType === 'caco_continuous_test' && 'Minutos trotando continuo'}
                </label>
                <input
                  id="exam-value"
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
                  <TrendingUp size={17} aria-hidden="true" />
                  Evaluar Examen y Recalcular Plan (+220 XP)
                </button>
                {examSubmittedMsg && (
                  <span style={{ color: '#6ee7b7', fontSize: '0.84rem', fontWeight: 600 }}>
                    {examSubmittedMsg}
                  </span>
                )}
              </div>
            </form>

            {exams.length > 0 && (
              <div className="stack-sm">
                <strong style={{ fontSize: '0.86rem' }}>Historial de Exámenes Físicos</strong>
                {exams.slice(0, 4).map((ex) => (
                  <div
                    key={ex.id}
                    className="row-between"
                    style={{
                      background: 'rgba(9,14,26,0.7)',
                      borderRadius: '10px',
                      padding: '0.55rem 0.8rem',
                      fontSize: '0.82rem',
                    }}
                  >
                    <span>{ex.summary}</span>
                    <span className="muted mono">{ex.date}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* GAMIFICACIÓN: ESCALA DE NIVELES + MEDALLAS */}
      <div className="grid-2">
        <section className="card stack-md">
          <div className="row-wrap">
            <Award size={19} color="#fb923c" aria-hidden="true" />
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Escalera de 10 Niveles del Lince Ibérico</h2>
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
                    padding: '0.55rem 0.8rem',
                    borderRadius: '12px',
                    border: current
                      ? '1px solid rgba(249,115,22,0.7)'
                      : '1px solid var(--border-subtle)',
                    background: current
                      ? 'rgba(249,115,22,0.12)'
                      : reached
                      ? 'rgba(16,185,129,0.06)'
                      : 'rgba(9,14,26,0.5)',
                  }}
                >
                  <div className="row-wrap">
                    <span className="mono" style={{ fontWeight: 800, color: lvl.badgeColor }}>
                      Nv.{lvl.level}
                    </span>
                    <strong style={{ fontSize: '0.88rem' }}>{lvl.spanishTitle}</strong>
                  </div>
                  <div className="row-wrap">
                    <span className="muted mono" style={{ fontSize: '0.76rem' }}>
                      VDOT {lvl.minVdot}+ · {lvl.minXp} XP
                    </span>
                    {reached ? (
                      <CheckCircle2 size={15} color="#34d399" aria-hidden="true" />
                    ) : (
                      <Lock size={14} color="#64748b" aria-hidden="true" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="card stack-md">
          <div className="row-wrap">
            <Medal size={19} color="#fbbf24" aria-hidden="true" />
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Trofeos e Insignias de Constancia</h2>
          </div>

          <div className="grid-2" style={{ gap: '0.7rem' }}>
            {BADGES_CATALOG.map((badge) => {
              const unlocked = profile.unlockedBadges.includes(badge.id);
              return (
                <article
                  key={badge.id}
                  style={{
                    padding: '0.8rem',
                    borderRadius: '14px',
                    border: unlocked
                      ? '1px solid rgba(251, 191, 36, 0.45)'
                      : '1px solid var(--border-subtle)',
                    background: unlocked ? 'rgba(251, 191, 36, 0.08)' : 'rgba(9,14,26,0.5)',
                    opacity: unlocked ? 1 : 0.65,
                  }}
                >
                  <div className="row-between">
                    <strong style={{ fontSize: '0.88rem', color: unlocked ? '#fde68a' : 'var(--text-secondary)' }}>
                      {badge.title}
                    </strong>
                    <span className="mono" style={{ fontSize: '0.72rem', color: '#6ee7b7' }}>
                      +{badge.xpReward} XP
                    </span>
                  </div>
                  <p className="muted" style={{ margin: '0.25rem 0 0', fontSize: '0.78rem' }}>
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
