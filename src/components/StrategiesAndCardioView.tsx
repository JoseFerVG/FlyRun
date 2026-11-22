import { useState } from 'react';
import { ArrowRightLeft, BookOpen, Check, Info } from 'lucide-react';
import type { CardioModality, UserProfile } from '../types/fitness';
import { RUNNING_STRATEGIES } from '../data/runningKnowledge';
import { calculateCardioEquivalence } from '../services/scienceEngine';

interface StrategiesAndCardioViewProps {
  profile: UserProfile;
  onSelectStrategy: (strategyId: string) => void;
}

export function StrategiesAndCardioView({ profile, onSelectStrategy }: StrategiesAndCardioViewProps) {
  const [modality, setModality] = useState<CardioModality>('running');
  const [duration, setDuration] = useState<number>(40);
  const [rpe, setRpe] = useState<number>(6);
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);

  const selectedMetrics = calculateCardioEquivalence(
    modality,
    duration,
    rpe,
    profile.weightKg,
    profile.sex,
    profile.vdot
  );

  const targetCP = selectedMetrics.cardioPoints;
  const modalitiesToCompare: CardioModality[] = ['running', 'cycling', 'soccer', 'walking', 'swimming'];

  const findEquivalentMinutes = (mod: CardioModality) => {
    for (let m = 10; m <= 180; m += 5) {
      const res = calculateCardioEquivalence(mod, m, mod === 'soccer' ? 7 : rpe, profile.weightKg, profile.sex, profile.vdot);
      if (res.cardioPoints >= targetCP) return { minutes: m, res };
    }
    const maxRes = calculateCardioEquivalence(mod, 120, rpe, profile.weightKg, profile.sex, profile.vdot);
    return { minutes: 120, res: maxRes };
  };

  return (
    <div className="stack-lg">
      <section className="card stack-md" aria-label="Calculadora de Equivalencia Cardio">
        <div className="row-wrap">
          <ArrowRightLeft size={19} color="#d94814" aria-hidden="true" />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.3rem', letterSpacing: '-0.02em' }}>
              Equivalencia multi-cardio (Running · Bici · Fútbol)
            </h1>
            <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
              Convierte cualquier sesión a Puntos Cardio combinando gasto metabólico (MET-minutos) y carga cardíaca (TRIMP).
            </p>
          </div>
        </div>

        <div className="grid-3">
          <div className="field">
            <label htmlFor="eq-mod">Actividad de referencia</label>
            <select
              id="eq-mod"
              name="eqModality"
              className="select"
              value={modality}
              onChange={(e) => setModality(e.target.value as CardioModality)}
            >
              <option value="running">Running (Principal)</option>
              <option value="cycling">Ciclismo / Bicicleta</option>
              <option value="soccer">Partido de fútbol</option>
              <option value="walking">Caminata rápida</option>
              <option value="swimming">Natación / Elíptica</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="eq-dur">Duración ({duration} min)</label>
            <input
              id="eq-dur"
              name="eqDuration"
              type="range"
              min={15}
              max={120}
              step={5}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </div>

          <div className="field">
            <label htmlFor="eq-rpe">Esfuerzo percibido RPE ({rpe}/10)</label>
            <input
              id="eq-rpe"
              name="eqRpe"
              type="range"
              min={2}
              max={10}
              value={rpe}
              onChange={(e) => setRpe(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="grid-4">
          <div className="inset-panel">
            <div className="muted" style={{ fontSize: '0.75rem' }}>Puntos Cardio</div>
            <div className="kpi-value" style={{ color: 'var(--accent)' }}>{selectedMetrics.cardioPoints} PC</div>
          </div>
          <div className="inset-panel">
            <div className="muted" style={{ fontSize: '0.75rem' }}>Volumen metabólico</div>
            <div className="kpi-value">{selectedMetrics.metMinutes} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>MET-m</span></div>
          </div>
          <div className="inset-panel">
            <div className="muted" style={{ fontSize: '0.75rem' }}>Carga TRIMP</div>
            <div className="kpi-value" style={{ color: 'var(--cobalt)' }}>{selectedMetrics.trimp}</div>
          </div>
          <div className="inset-panel">
            <div className="muted" style={{ fontSize: '0.75rem' }}>Equivalente en carrera</div>
            <div className="kpi-value" style={{ color: 'var(--pine)' }}>{selectedMetrics.equivalentRunningKm} km</div>
          </div>
        </div>

        <div className="scroll-table-wrap" tabIndex={0} role="region" aria-label="Tabla comparativa de equivalencias cardiovasculares">
          <table className="zone-table">
            <thead>
              <tr>
                <th>Disciplina equivalente</th>
                <th>Tiempo necesario</th>
                <th>Impacto articular</th>
                <th>Efecto fisiológico principal</th>
              </tr>
            </thead>
            <tbody>
              {modalitiesToCompare.map((m) => {
                const eq = findEquivalentMinutes(m);
                return (
                  <tr key={m}>
                    <td style={{ fontWeight: 600 }}>{eq.res.label}</td>
                    <td className="mono" style={{ fontWeight: 600, color: 'var(--accent)' }}>
                      {eq.minutes} min ({eq.res.calories} kcal)
                    </td>
                    <td>{eq.res.jointImpactScore}</td>
                    <td className="muted">{eq.res.physiologicalEffect}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="stack-md" aria-label="Guía de estrategias de running">
        <div className="row-between">
          <div className="row-wrap">
            <BookOpen size={19} color="#2563eb" aria-hidden="true" />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', letterSpacing: '-0.015em' }}>
                Estrategias principales de entrenamiento en carrera
              </h2>
              <p className="muted" style={{ margin: 0, fontSize: '0.84rem' }}>
                Cómo funciona cada método (desde CaCo 2' trote / 6' caminata hasta el reparto 80/20 y las series 30-30).
              </p>
            </div>
          </div>
          {appliedNotice && <span className="pill pill-emerald">{appliedNotice}</span>}
        </div>

        <div className="grid-2">
          {RUNNING_STRATEGIES.map((strategy) => {
            const isActive = profile.preferredStrategyId === strategy.id;
            return (
              <article key={strategy.id} className="card stack-md">
                <div className="row-between">
                  <span className="pill pill-cyan">{strategy.shortTag}</span>
                  <span className="pill">{strategy.intensitySplit}</span>
                </div>

                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{strategy.name}</h3>
                  <p className="muted" style={{ margin: '0.22rem 0 0', fontSize: '0.83rem' }}>
                    <strong>Recomendado para:</strong> {strategy.bestFor}
                  </p>
                </div>

                <div className="inset-panel" style={{ fontSize: '0.82rem' }}>
                  <div style={{ color: 'var(--accent)', fontWeight: 600, marginBlockEnd: '0.2rem' }}>
                    Ejemplo práctico:
                  </div>
                  <div className="secondary">{strategy.structureExample}</div>
                </div>

                <p className="secondary" style={{ margin: 0, fontSize: '0.84rem' }}>
                  <strong>Base fisiológica:</strong> {strategy.scientificBasis}
                </p>

                <ul style={{ margin: 0, paddingInlineStart: '1.15rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {strategy.protocolSteps.map((st, idx) => (
                    <li key={idx} style={{ marginBlockEnd: '0.24rem' }}>{st}</li>
                  ))}
                </ul>

                <div className="row-between" style={{ marginBlockStart: 'auto' }}>
                  <span className="muted mono" style={{ fontSize: '0.75rem' }}>
                    Niveles {strategy.recommendedLevelMin}–{strategy.recommendedLevelMax}
                  </span>
                  <button
                    type="button"
                    className={`btn btn-sm ${isActive ? 'btn-emerald' : 'btn-primary'}`}
                    onClick={() => {
                      onSelectStrategy(strategy.id);
                      setAppliedNotice(`Estrategia "${strategy.name}" aplicada al calendario.`);
                    }}
                  >
                    {isActive && <Check size={14} aria-hidden="true" />}
                    {isActive ? 'Estrategia activa' : 'Aplicar al plan'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <div className="inset-panel row-wrap" style={{ fontSize: '0.84rem' }}>
          <Info size={16} color="#2563eb" aria-hidden="true" />
          <span className="secondary">
            Para principiantes, empezar con bloques <strong>CaCo (2 min corriendo / 6 min caminando)</strong> reduce drásticamente la sobrecarga en periostio y tendones mientras construyes base aeróbica.
          </span>
        </div>
      </section>
    </div>
  );
}
