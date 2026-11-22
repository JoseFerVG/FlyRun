import { useState } from 'react';
import {
  Activity,
  Bike,
  CalendarClock,
  CheckCircle2,
  Flame,
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
      {/* HOY Y MAÑANA */}
      <div className="grid-2">
        <article className="card stack-md" aria-label="Rutina de Hoy">
          <div className="row-between">
            <span className="pill pill-amber">
              <Flame size={13} aria-hidden="true" />
              HOY · {todayWorkout?.strategyTag ?? 'Descanso'}
            </span>
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
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{todayWorkout.title}</h2>
                <p className="muted" style={{ margin: '0.2rem 0 0', fontSize: '0.88rem' }}>
                  {todayWorkout.subtitle}
                </p>
              </div>

              <div className="grid-3" style={{ gap: '0.6rem' }}>
                <div style={{ background: 'rgba(15,23,42,0.7)', padding: '0.65rem', borderRadius: '12px' }}>
                  <div className="muted" style={{ fontSize: '0.72rem' }}>Duración</div>
                  <div className="mono" style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                    {todayWorkout.durationMinutes} min
                  </div>
                </div>
                <div style={{ background: 'rgba(15,23,42,0.7)', padding: '0.65rem', borderRadius: '12px' }}>
                  <div className="muted" style={{ fontSize: '0.72rem' }}>Ritmo / Zona</div>
                  <div className="mono" style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                    {todayWorkout.targetZone} · {todayWorkout.targetPace}
                  </div>
                </div>
                <div style={{ background: 'rgba(15,23,42,0.7)', padding: '0.65rem', borderRadius: '12px' }}>
                  <div className="muted" style={{ fontSize: '0.72rem' }}>Carga Estimada</div>
                  <div className="mono" style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                    {todayWorkout.metMinutes} MET-m
                  </div>
                </div>
              </div>

              <div className="stack-sm">
                {todayWorkout.blocks.map((block, idx) => (
                  <div
                    key={`${block.label}-${idx}`}
                    style={{
                      background: 'rgba(9, 14, 26, 0.72)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      padding: '0.65rem 0.85rem',
                    }}
                  >
                    <div className="row-between">
                      <strong style={{ fontSize: '0.88rem' }}>{block.label}</strong>
                      <span className="pill mono" style={{ fontSize: '0.72rem' }}>
                        {block.durationMinutes} min · {block.zone}
                      </span>
                    </div>
                    <div style={{ color: '#fdba74', fontSize: '0.78rem', fontWeight: 600 }}>{block.intensity}</div>
                    <p className="muted" style={{ margin: '0.2rem 0 0', fontSize: '0.8rem' }}>
                      {block.description}
                    </p>
                  </div>
                ))}
              </div>

              {!todayWorkout.completed && todayWorkout.sessionType !== 'rest' && (
                <div className="stack-sm">
                  <div className="muted" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                    ¿Prefieres cambiar hoy manteniendo equivalencia en Puntos Cardio?
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
                      Bici
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${todayWorkout.modality === 'soccer' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => onSwapTodayModality(todayWorkout.id, 'soccer')}
                    >
                      ⚽ Partido de Fútbol
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
                  <CheckCircle2 size={17} aria-hidden="true" />
                  {todayWorkout.completed ? 'Actualizar Registro' : 'Completar y Sumar Nivel'}
                </button>
              </div>
            </>
          ) : (
            <p className="muted">No hay sesión registrada para hoy.</p>
          )}
        </article>

        {/* MAÑANA + GOOGLE FIT */}
        <div className="stack-md">
          <article className="card stack-md" aria-label="Rutina de Mañana">
            <div className="row-between">
              <span className="pill pill-cyan">
                <CalendarClock size={13} aria-hidden="true" />
                MAÑANA · Adelanto de Coach Lince
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => onNavigate('calendar')}
              >
                Ver 4 semanas
              </button>
            </div>

            {tomorrowWorkout ? (
              <>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.15rem' }}>{tomorrowWorkout.title}</h2>
                  <p className="muted" style={{ margin: '0.25rem 0 0', fontSize: '0.86rem' }}>
                    {tomorrowWorkout.subtitle}
                  </p>
                </div>

                <div className="row-wrap">
                  <span className="pill mono">{tomorrowWorkout.durationMinutes} min</span>
                  <span className="pill mono">{tomorrowWorkout.targetPace}</span>
                  <span className="pill pill-emerald mono">{tomorrowWorkout.cardioPoints} Puntos Cardio</span>
                </div>

                <p
                  className="secondary"
                  style={{
                    margin: 0,
                    fontSize: '0.84rem',
                    background: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.22)',
                    borderRadius: '12px',
                    padding: '0.65rem 0.85rem',
                  }}
                >
                  <strong>Por qué toca esto mañana:</strong> {tomorrowWorkout.coachTip}
                </p>
              </>
            ) : null}
          </article>

          {/* GOOGLE FIT */}
          <article className="card stack-md" aria-label="Integración Google Fit">
            <div className="row-between">
              <div className="row-wrap">
                <Footprints size={20} color="#34d399" aria-hidden="true" />
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.08rem' }}>Google Fit · Pasos Diarios</h2>
                  <div className="muted" style={{ fontSize: '0.78rem' }}>
                    Meta configurada: {profile.dailyStepsTarget.toLocaleString('es-ES')} pasos/día ({profile.weeklyWalkGoalSessions} veces/sem)
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
                <div className="kpi-value" style={{ color: '#6ee7b7' }}>
                  {(fitToday?.steps ?? 0).toLocaleString('es-ES')} <span style={{ fontSize: '0.9rem' }}>pasos</span>
                </div>
                <div className="muted" style={{ fontSize: '0.8rem' }}>
                  {((fitToday?.distanceMeters ?? 0) / 1000).toFixed(2)} km andados · {fitToday?.calories ?? 0} kcal activas
                </div>
              </div>
              <span className="pill pill-emerald mono">{stepsPct}% meta</span>
            </div>

            <div className="progress-track">
              <div className="progress-fill progress-fill-emerald" style={{ inlineSize: `${stepsPct}%` }} />
            </div>

            {/* Mini histórico 7 días */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '0.4rem',
                alignItems: 'end',
                blockSize: '66px',
                paddingBlockStart: '0.4rem',
              }}
              aria-label="Pasos de los últimos 7 días"
            >
              {fitDays.slice(-7).map((day) => {
                const hPct = Math.max(14, Math.min(100, Math.round((day.steps / Math.max(4000, profile.dailyStepsTarget)) * 100)));
                return (
                  <div key={day.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', blockSize: '100%', justifyContent: 'flex-end' }}>
                    <div
                      title={`${day.date}: ${day.steps.toLocaleString('es-ES')} pasos`}
                      style={{
                        inlineSize: '100%',
                        blockSize: `${hPct}%`,
                        borderRadius: '6px 6px 2px 2px',
                        background:
                          day.steps >= profile.dailyStepsTarget
                            ? 'linear-gradient(180deg, #34d399, #059669)'
                            : 'rgba(148, 163, 184, 0.35)',
                      }}
                    />
                    <span className="muted" style={{ fontSize: '0.66rem' }}>{day.date.slice(8)}</span>
                  </div>
                );
              })}
            </div>

            <div className="row-wrap">
              <input
                type="number"
                aria-label="Registrar pasos manuales o simular Google Fit"
                className="input"
                style={{ inlineSize: '150px', padding: '0.42rem 0.65rem' }}
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
                Actualizar Pasos de Hoy
              </button>
              {fitNotice && <span className="muted" style={{ fontSize: '0.76rem' }}>{fitNotice}</span>}
            </div>
          </article>
        </div>
      </div>

      {/* RESUMEN RÁPIDO MACROS + ESTADO GAMIFICADO */}
      <div className="grid-2">
        <article className="card stack-sm">
          <div className="row-between">
            <div className="row-wrap">
              <Utensils size={18} color="#fb923c" aria-hidden="true" />
              <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Recomendación Macro para Hoy</h2>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('nutrition')}>
              Ver detalle macro
            </button>
          </div>
          <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>
            {todayMacros.dayTypeLabel} · Objetivo energético estimado: <strong className="mono">{todayMacros.calories} kcal</strong>
          </p>
          <div className="grid-3" style={{ gap: '0.6rem', marginBlockStart: '0.3rem' }}>
            <div style={{ background: 'rgba(249,115,22,0.12)', borderRadius: '12px', padding: '0.65rem' }}>
              <div className="muted" style={{ fontSize: '0.72rem' }}>Carbohidratos</div>
              <div className="mono" style={{ fontWeight: 800, fontSize: '1.15rem', color: '#fdba74' }}>
                {todayMacros.carbsGrams} g
              </div>
              <div className="muted" style={{ fontSize: '0.72rem' }}>{todayMacros.carbsPerKg} g/kg</div>
            </div>
            <div style={{ background: 'rgba(16,185,129,0.12)', borderRadius: '12px', padding: '0.65rem' }}>
              <div className="muted" style={{ fontSize: '0.72rem' }}>Proteínas</div>
              <div className="mono" style={{ fontWeight: 800, fontSize: '1.15rem', color: '#6ee7b7' }}>
                {todayMacros.proteinGrams} g
              </div>
              <div className="muted" style={{ fontSize: '0.72rem' }}>{todayMacros.proteinPerKg} g/kg</div>
            </div>
            <div style={{ background: 'rgba(56,189,248,0.12)', borderRadius: '12px', padding: '0.65rem' }}>
              <div className="muted" style={{ fontSize: '0.72rem' }}>Grasas</div>
              <div className="mono" style={{ fontWeight: 800, fontSize: '1.15rem', color: '#7dd3fc' }}>
                {todayMacros.fatsGrams} g
              </div>
              <div className="muted" style={{ fontSize: '0.72rem' }}>Agua: {todayMacros.hydrationLiters} L</div>
            </div>
          </div>
        </article>

        <article className="card stack-sm">
          <div className="row-between">
            <div className="row-wrap">
              <Trophy size={18} color="#fbbf24" aria-hidden="true" />
              <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Gamificación &amp; Puntos Cardio</h2>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('stats')}>
              Mis datos y examen
            </button>
          </div>
          <div className="grid-3" style={{ gap: '0.6rem', marginBlockStart: '0.3rem' }}>
            <div style={{ background: 'rgba(15,23,42,0.75)', borderRadius: '12px', padding: '0.65rem' }}>
              <div className="muted" style={{ fontSize: '0.72rem' }}>Puntos Cardio</div>
              <div className="mono" style={{ fontWeight: 800, fontSize: '1.15rem' }}>
                {profile.totalCardioPoints}
              </div>
            </div>
            <div style={{ background: 'rgba(15,23,42,0.75)', borderRadius: '12px', padding: '0.65rem' }}>
              <div className="muted" style={{ fontSize: '0.72rem' }}>Medallas</div>
              <div className="mono" style={{ fontWeight: 800, fontSize: '1.15rem', color: '#fbbf24' }}>
                {profile.unlockedBadges.length} / 8
              </div>
            </div>
            <div style={{ background: 'rgba(15,23,42,0.75)', borderRadius: '12px', padding: '0.65rem' }}>
              <div className="muted" style={{ fontSize: '0.72rem' }}>Frecuencia</div>
              <div className="mono" style={{ fontWeight: 800, fontSize: '1.15rem' }}>
                {profile.trainingDaysPerWeek} días/sem
              </div>
            </div>
          </div>
          <div className="row-wrap" style={{ marginBlockStart: '0.2rem' }}>
            <Activity size={15} color="#fb923c" aria-hidden="true" />
            <span className="muted" style={{ fontSize: '0.8rem' }}>
              Cada entrenamiento completado ajusta progresivamente tu VDOT y desbloquea insignias.
            </span>
          </div>
        </article>
      </div>
    </div>
  );
}
