import { useState } from 'react';
import {
  Bike,
  CalendarClock,
  CheckCircle2,
  Footprints,
  RefreshCw,
  Trophy,
  Utensils,
} from 'lucide-react';
import type {
  CardioModality,
  GoogleFitDay,
  MacroRecommendation,
  UserProfile,
  WorkoutSession,
} from '../types/fitness';
import { getModalityLabel } from '../services/scienceEngine';
import { WorkoutVisualBar } from './WorkoutVisualBar';

interface DashboardViewProps {
  profile: UserProfile;
  todayWorkout?: WorkoutSession;
  tomorrowWorkout?: WorkoutSession;
  fitDays: GoogleFitDay[];
  todayMacros: MacroRecommendation;
  fitSyncLoading: boolean;
  fitNotice: string | null;
  onCompleteWorkout: (workout: WorkoutSession) => void;
  onSwapTodayModality: (workoutId: string, modality: CardioModality) => void;
  onSyncGoogleFit: () => void;
  onManualStepsUpdate: (steps: number) => void;
  onNavigate: (tab: 'dashboard' | 'calendar' | 'stats' | 'strategies' | 'nutrition') => void;
}

export function DashboardView({
  profile,
  todayWorkout,
  tomorrowWorkout,
  fitDays,
  todayMacros,
  fitSyncLoading,
  fitNotice,
  onCompleteWorkout,
  onSwapTodayModality,
  onSyncGoogleFit,
  onManualStepsUpdate,
  onNavigate,
}: DashboardViewProps) {
  const fitToday = fitDays[fitDays.length - 1];
  const [stepsInput, setStepsInput] = useState(fitToday?.steps ?? profile.dailyStepsTarget);
  const stepsPct = Math.min(100, Math.round(((fitToday?.steps ?? 0) / Math.max(1000, profile.dailyStepsTarget)) * 100));

  return (
    <div className="stack-lg">
      <div className="grid-2">
        <article className="card stack-md" aria-label="Rutina de Hoy">
          <div className="row-between">
            <span className="pill pill-amber">Hoy · {todayWorkout?.strategyTag ?? 'Descanso'}</span>
            {todayWorkout?.completed ? (
              <span className="pill pill-emerald">
                <CheckCircle2 size={13} aria-hidden="true" />
                Completada
              </span>
            ) : (
              <span className="pill mono">{todayWorkout?.cardioPoints ?? 0} Puntos Cardio</span>
            )}
          </div>

          {todayWorkout ? (
            <>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.22rem', letterSpacing: '-0.02em' }}>{todayWorkout.title}</h2>
                <p className="muted" style={{ margin: '0.2rem 0 0', fontSize: '0.86rem' }}>
                  {todayWorkout.subtitle}
                </p>
              </div>

              <WorkoutVisualBar blocks={todayWorkout.blocks} />

              <div className="grid-3" style={{ gap: '0.6rem' }}>
                <div className="inset-panel" style={{ padding: '0.6rem 0.75rem' }}>
                  <div className="muted" style={{ fontSize: '0.72rem' }}>Duración</div>
                  <div className="mono" style={{ fontWeight: 700, fontSize: '1.02rem' }}>
                    {todayWorkout.durationMinutes} min
                  </div>
                </div>
                <div className="inset-panel" style={{ padding: '0.6rem 0.75rem' }}>
                  <div className="muted" style={{ fontSize: '0.72rem' }}>Zona / Ritmo</div>
                  <div className="mono" style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    {todayWorkout.targetZone} · {todayWorkout.targetPace}
                  </div>
                </div>
                <div className="inset-panel" style={{ padding: '0.6rem 0.75rem' }}>
                  <div className="muted" style={{ fontSize: '0.72rem' }}>Carga metabólica</div>
                  <div className="mono" style={{ fontWeight: 700, fontSize: '1.02rem' }}>
                    {todayWorkout.metMinutes} MET-m
                  </div>
                </div>
              </div>

              <div className="stack-sm">
                {todayWorkout.blocks.map((block, idx) => (
                  <div
                    key={`${block.label}-${idx}`}
                    className="inset-panel"
                    style={{ padding: '0.65rem 0.85rem' }}
                  >
                    <div className="row-between">
                      <strong style={{ fontSize: '0.88rem' }}>{block.label}</strong>
                      <span className="pill mono" style={{ fontSize: '0.72rem' }}>
                        {block.durationMinutes} min · {block.zone}
                      </span>
                    </div>
                    <div style={{ color: 'var(--accent)', fontSize: '0.78rem', fontWeight: 600 }}>{block.intensity}</div>
                    <p className="muted" style={{ margin: '0.2rem 0 0', fontSize: '0.8rem' }}>
                      {block.description}
                    </p>
                  </div>
                ))}
              </div>

              {!todayWorkout.completed && todayWorkout.sessionType !== 'rest' && (
                <div className="stack-sm">
                  <div className="muted" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                    Cambiar modalidad hoy manteniendo equivalencia de carga:
                  </div>
                  <div className="row-wrap">
                    <button
                      type="button"
                      className={`btn btn-sm ${todayWorkout.modality === 'running' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => onSwapTodayModality(todayWorkout.id, 'running')}
                    >
                      Running
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${todayWorkout.modality === 'cycling' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => onSwapTodayModality(todayWorkout.id, 'cycling')}
                    >
                      <Bike size={14} aria-hidden="true" />
                      Bicicleta
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${todayWorkout.modality === 'soccer' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => onSwapTodayModality(todayWorkout.id, 'soccer')}
                    >
                      Partido de fútbol
                    </button>
                  </div>
                </div>
              )}

              <div className="row-between">
                <span className="muted" style={{ fontSize: '0.8rem' }}>
                  Modalidad: <strong>{getModalityLabel(todayWorkout.modality)}</strong>
                </span>
                <button
                  type="button"
                  className={`btn ${todayWorkout.completed ? 'btn-secondary' : 'btn-emerald'}`}
                  onClick={() => onCompleteWorkout(todayWorkout)}
                >
                  <CheckCircle2 size={16} aria-hidden="true" />
                  {todayWorkout.completed ? 'Editar registro' : 'Marcar como completado'}
                </button>
              </div>
            </>
          ) : (
            <p className="muted">No hay sesión registrada para hoy.</p>
          )}
        </article>

        <div className="stack-md">
          <article className="card stack-md" aria-label="Rutina de Mañana">
            <div className="row-between">
              <span className="pill pill-cyan">
                <CalendarClock size={13} aria-hidden="true" />
                Mañana
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => onNavigate('calendar')}
              >
                Ver calendario completo
              </button>
            </div>

            {tomorrowWorkout ? (
              <>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.12rem', letterSpacing: '-0.015em' }}>{tomorrowWorkout.title}</h2>
                  <p className="muted" style={{ margin: '0.2rem 0 0', fontSize: '0.85rem' }}>
                    {tomorrowWorkout.subtitle}
                  </p>
                </div>

                <WorkoutVisualBar blocks={tomorrowWorkout.blocks} />

                <div className="row-wrap">
                  <span className="pill mono">{tomorrowWorkout.durationMinutes} min</span>
                  <span className="pill mono">{tomorrowWorkout.targetPace}</span>
                  <span className="pill pill-emerald mono">{tomorrowWorkout.cardioPoints} Puntos Cardio</span>
                </div>

                <p className="inset-panel secondary" style={{ margin: 0, fontSize: '0.84rem' }}>
                  <strong>Criterio de mañana:</strong> {tomorrowWorkout.coachTip}
                </p>
              </>
            ) : null}
          </article>

          <article className="card stack-md" aria-label="Integración Google Fit">
            <div className="row-between">
              <div className="row-wrap">
                <Footprints size={18} color="#186a4b" aria-hidden="true" />
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Google Fit · Pasos diarios</h2>
                  <div className="muted" style={{ fontSize: '0.78rem' }}>
                    Meta diaria: {profile.dailyStepsTarget.toLocaleString('es-ES')} pasos ({profile.weeklyWalkGoalSessions} días/sem)
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onSyncGoogleFit}
                disabled={fitSyncLoading}
              >
                <RefreshCw size={14} aria-hidden="true" />
                {fitSyncLoading ? 'Sincronizando...' : 'Sincronizar Google Fit'}
              </button>
            </div>

            <div className="row-between">
              <div>
                <div className="kpi-value" style={{ color: 'var(--pine)' }}>
                  {(fitToday?.steps ?? 0).toLocaleString('es-ES')} <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>pasos</span>
                </div>
                <div className="muted" style={{ fontSize: '0.8rem' }}>
                  {((fitToday?.distanceMeters ?? 0) / 1000).toFixed(2)} km caminados · {fitToday?.calories ?? 0} kcal activas
                </div>
              </div>
              <span className="pill pill-emerald mono">{stepsPct}% objetivo</span>
            </div>

            <div className="progress-track">
              <div className="progress-fill progress-fill-emerald" style={{ inlineSize: `${stepsPct}%` }} />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '0.4rem',
                alignItems: 'end',
                blockSize: '64px',
                paddingBlockStart: '0.35rem',
              }}
              aria-label="Pasos de los últimos 7 días"
            >
              {fitDays.slice(-7).map((day) => {
                const hPct = Math.max(14, Math.min(100, Math.round((day.steps / Math.max(4000, profile.dailyStepsTarget)) * 100)));
                return (
                  <div
                    key={day.date}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.2rem',
                      blockSize: '100%',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <div
                      title={`${day.date}: ${day.steps.toLocaleString('es-ES')} pasos`}
                      style={{
                        inlineSize: '100%',
                        blockSize: `${hPct}%`,
                        borderRadius: '4px 4px 2px 2px',
                        background:
                          day.steps >= profile.dailyStepsTarget ? 'var(--pine)' : '#cbd5e1',
                      }}
                    />
                    <span className="muted mono" style={{ fontSize: '0.66rem' }}>{day.date.slice(8)}</span>
                  </div>
                );
              })}
            </div>

            <div className="row-wrap">
              <input
                id="manual-fit-steps"
                name="manualFitSteps"
                type="number"
                aria-label="Registrar pasos manuales o simular Google Fit"
                className="input"
                style={{ inlineSize: '140px', padding: '0.4rem 0.65rem' }}
                min={0}
                max={50000}
                step={1}
                value={stepsInput}
                onChange={(e) => setStepsInput(Number(e.target.value))}
              />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => onManualStepsUpdate(stepsInput)}
              >
                Actualizar pasos de hoy
              </button>
              {fitNotice && <span className="muted" style={{ fontSize: '0.76rem' }}>{fitNotice}</span>}
            </div>
          </article>
        </div>
      </div>

      <div className="grid-2">
        <article className="card stack-sm">
          <div className="row-between">
            <div className="row-wrap">
              <Utensils size={17} color="#d94814" aria-hidden="true" />
              <h2 style={{ margin: 0, fontSize: '1.02rem' }}>Nutrición recomendada hoy (macros)</h2>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('nutrition')}>
              Ver desglose
            </button>
          </div>
          <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>
            {todayMacros.dayTypeLabel} · Estimación diaria: <strong className="mono">{todayMacros.calories} kcal</strong>
          </p>
          <div className="grid-3" style={{ gap: '0.6rem', marginBlockStart: '0.25rem' }}>
            <div className="inset-panel" style={{ padding: '0.6rem 0.75rem' }}>
              <div className="muted" style={{ fontSize: '0.72rem' }}>Carbohidratos</div>
              <div className="mono" style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent)' }}>
                {todayMacros.carbsGrams} g
              </div>
              <div className="muted mono" style={{ fontSize: '0.72rem' }}>{todayMacros.carbsPerKg} g/kg</div>
            </div>
            <div className="inset-panel" style={{ padding: '0.6rem 0.75rem' }}>
              <div className="muted" style={{ fontSize: '0.72rem' }}>Proteínas</div>
              <div className="mono" style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--pine)' }}>
                {todayMacros.proteinGrams} g
              </div>
              <div className="muted mono" style={{ fontSize: '0.72rem' }}>{todayMacros.proteinPerKg} g/kg</div>
            </div>
            <div className="inset-panel" style={{ padding: '0.6rem 0.75rem' }}>
              <div className="muted" style={{ fontSize: '0.72rem' }}>Grasas</div>
              <div className="mono" style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--cobalt)' }}>
                {todayMacros.fatsGrams} g
              </div>
              <div className="muted mono" style={{ fontSize: '0.72rem' }}>Agua: {todayMacros.hydrationLiters} L</div>
            </div>
          </div>
        </article>

        <article className="card stack-sm">
          <div className="row-between">
            <div className="row-wrap">
              <Trophy size={17} color="#b45309" aria-hidden="true" />
              <h2 style={{ margin: 0, fontSize: '1.02rem' }}>Progreso y constancia</h2>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('stats')}>
              Datos y examen físico
            </button>
          </div>
          <div className="grid-3" style={{ gap: '0.6rem', marginBlockStart: '0.25rem' }}>
            <div className="inset-panel" style={{ padding: '0.6rem 0.75rem' }}>
              <div className="muted" style={{ fontSize: '0.72rem' }}>Puntos Cardio</div>
              <div className="mono" style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                {profile.totalCardioPoints}
              </div>
            </div>
            <div className="inset-panel" style={{ padding: '0.6rem 0.75rem' }}>
              <div className="muted" style={{ fontSize: '0.72rem' }}>Logros</div>
              <div className="mono" style={{ fontWeight: 700, fontSize: '1.1rem', color: '#b45309' }}>
                {profile.unlockedBadges.length} / 8
              </div>
            </div>
            <div className="inset-panel" style={{ padding: '0.6rem 0.75rem' }}>
              <div className="muted" style={{ fontSize: '0.72rem' }}>Plan semanal</div>
              <div className="mono" style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                {profile.trainingDaysPerWeek} días/sem
              </div>
            </div>
          </div>
          <p className="muted" style={{ margin: '0.2rem 0 0', fontSize: '0.8rem' }}>
            Cada sesión registrada ajusta progresivamente tu VDOT según la sensación de esfuerzo (RPE).
          </p>
        </article>
      </div>
    </div>
  );
}
