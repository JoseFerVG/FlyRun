import { useState } from 'react';
import { ArrowRightLeft, BookOpen, Check, Flame, ShieldAlert } from 'lucide-react';
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

  // Calculamos cuánto tiempo de cada deporte equivale a esos mismos Puntos Cardio
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
      {/* CALCULADORA DE EQUIVALENCIA MULTI-CARDIO */}
      <section className="card card-highlight stack-md" aria-label="Calculadora de Equivalencia Cardio">
        <div className="row-wrap">
          <ArrowRightLeft size={21} color="#fb923c" aria-hidden="true" />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.35rem' }}>
              Equivalencia Multi-Cardio (Running · Bici · Fútbol)
            </h1>
            <p className="muted" style={{ margin: 0, fontSize: '0.86rem' }}>
              Convierte cualquier entrenamiento en <strong>Puntos Cardio Lince (MET-min + carga TRIMP)</strong> para no perder ritmo si cambias correr por bicicleta o partido de fútbol.
            </p>
          </div>
        </div>

        <div className="grid-3">
          <div className="field">
            <label htmlFor="eq-mod">Actividad de referencia</label>
            <select
              id="eq-mod"
              className="select"
              value={modality}
              onChange={(e) => setModality(e.target.value as CardioModality)}
            >
              <option value="running">Running (Principal)</option>
              <option value="cycling">Ciclismo / Bici</option>
              <option value="soccer">Partido de Fútbol</option>
              <option value="walking">Caminata Rápida</option>
              <option value="swimming">Natación / Elíptica</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="eq-dur">Duración ({duration} min)</label>
            <input
              id="eq-dur"
              type="range"
              min={15}
              max={120}
              step={5}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </div>

          <div className="field">
            <label htmlFor="eq-rpe">Esfuerzo RPE ({rpe}/10)</label>
            <input
              id="eq-rpe"
              type="range"
              min={2}
              max={10}
              value={rpe}
              onChange={(e) => setRpe(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="grid-4">
          <div style={{ background: 'rgba(249,115,22,0.12)', borderRadius: '14px', padding: '0.85rem' }}>
            <div className="muted" style={{ fontSize: '0.75rem' }}>Puntos Cardio Lince</div>
            <div className="kpi-value" style={{ color: '#fdba74' }}>{selectedMetrics.cardioPoints} CP</div>
          </div>
          <div style={{ background: 'rgba(15,23,42,0.75)', borderRadius: '14px', padding: '0.85rem' }}>
            <div className="muted" style={{ fontSize: '0.75rem' }}>Volumen Metabólico</div>
            <div className="kpi-value">{selectedMetrics.metMinutes} <span style={{ fontSize: '0.85rem' }}>MET-m</span></div>
          </div>
          <div style={{ background: 'rgba(15,23,42,0.75)', borderRadius: '14px', padding: '0.85rem' }}>
            <div className="muted" style={{ fontSize: '0.75rem' }}>Carga Fisiológica TRIMP</div>
            <div className="kpi-value" style={{ color: '#38bdf8' }}>{selectedMetrics.trimp}</div>
          </div>
          <div style={{ background: 'rgba(15,23,42,0.75)', borderRadius: '14px', padding: '0.85rem' }}>
            <div className="muted" style={{ fontSize: '0.75rem' }}>Equivalente Running</div>
            <div className="kpi-value" style={{ color: '#6ee7b7' }}>{selectedMetrics.equivalentRunningKm} km</div>
          </div>
        </div>

        <div className="scroll-table-wrap">
          <table className="zone-table">
            <thead>
              <tr>
                <th>Modalidad Alternativa</th>
                <th>Tiempo Equivalente</th>
                <th>Impacto Articular</th>
                <th>Efecto Fisiológico Principal</th>
              </tr>
            </thead>
            <tbody>
              {modalitiesToCompare.map((m) => {
                const eq = findEquivalentMinutes(m);
                return (
                  <tr key={m}>
                    <td style={{ fontWeight: 700 }}>{eq.res.label}</td>
                    <td className="mono" style={{ fontWeight: 700, color: '#fdba74' }}>
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

      {/* GUÍA CIENTÍFICA DE ESTRATEGIAS DE RUNNING */}
      <section className="stack-md" aria-label="Estrategias Científicas de Running">
        <div className="row-between">
          <div className="row-wrap">
            <BookOpen size={20} color="#38bdf8" aria-hidden="true" />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
                Guía de Estrategias Científicas de Running
              </h2>
              <p className="muted" style={{ margin: 0, fontSize: '0.84rem' }}>
                Aprende por qué y cuándo usar CaCo (correr 2' / descansar 6'), Polarizado 80/20, Umbral VDOT o Intervalos Billat 30-30.
              </p>
            </div>
          </div>
          {appliedNotice && <span className="pill pill-emerald">{appliedNotice}</span>}
        </div>

        <div className="grid-2">
          {RUNNING_STRATEGIES.map((strategy) => {
            const isActive = profile.preferredStrategyId === strategy.id;
            return (
              <article
                key={strategy.id}
                className={`card stack-md ${isActive ? 'card-highlight' : ''}`}
              >
                <div className="row-between">
                  <span className="pill pill-cyan">{strategy.shortTag}</span>
                  <span className="pill">{strategy.intensitySplit}</span>
                </div>

                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{strategy.name}</h3>
                  <p className="muted" style={{ margin: '0.25rem 0 0', fontSize: '0.83rem' }}>
                    <strong>Ideal para:</strong> {strategy.bestFor}
                  </p>
                </div>

                <div
                  style={{
                    background: 'rgba(9,14,26,0.72)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '0.7rem 0.85rem',
                    fontSize: '0.82rem',
                  }}
                >
                  <div style={{ color: '#fdba74', fontWeight: 700, marginBlockEnd: '0.2rem' }}>
                    Ejemplo de sesión:
                  </div>
                  <div className="secondary">{strategy.structureExample}</div>
                </div>

                <p className="secondary" style={{ margin: 0, fontSize: '0.84rem' }}>
                  <strong>Evidencia:</strong> {strategy.scientificBasis}
                </p>

                <ul style={{ margin: 0, paddingInlineStart: '1.2rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {strategy.protocolSteps.map((st, idx) => (
                    <li key={idx} style={{ marginBlockEnd: '0.25rem' }}>{st}</li>
                  ))}
                </ul>

                <div className="row-between" style={{ marginBlockStart: 'auto' }}>
                  <span className="muted" style={{ fontSize: '0.76rem' }}>
                    Niveles recomendados: {strategy.recommendedLevelMin}–{strategy.recommendedLevelMax}
                  </span>
                  <button
                    type="button"
                    className={`btn btn-sm ${isActive ? 'btn-emerald' : 'btn-primary'}`}
                    onClick={() => {
                      onSelectStrategy(strategy.id);
                      setAppliedNotice(`Estrategia "${strategy.name}" aplicada a tu calendario.`);
                    }}
                  >
                    {isActive ? <Check size={14} aria-hidden="true" /> : <Flame size={14} aria-hidden="true" />}
                    {isActive ? 'Estrategia Activa' : 'Aplicar a mi Plan'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <div
          className="card row-wrap"
          style={{ background: 'rgba(56, 189, 248, 0.06)', borderColor: 'rgba(56, 189, 248, 0.25)' }}
        >
          <ShieldAlert size={18} color="#38bdf8" aria-hidden="true" />
          <span className="secondary" style={{ fontSize: '0.84rem' }}>
            Nota científica: Los principiantes que empiezan con <strong>CaCo (ej. 2 min correr / 6 min caminar)</strong> reducen drásticamente las periostitis y fascitis mientras alcanzan el mismo beneficio cardiovascular inicial.
          </span>
        </div>
      </section>
    </div>
  );
}
