import { useState } from 'react';
import { Apple, Droplets, Flame, Sparkles } from 'lucide-react';
import type { GoogleFitDay, UserProfile, WorkoutSession } from '../types/fitness';
import { calculateDailyMacros } from '../services/nutritionEngine';

interface NutritionViewProps {
  profile: UserProfile;
  todayWorkout?: WorkoutSession;
  fitToday?: GoogleFitDay;
  onViewedMacros: () => void;
}

type SimulationDayMode = 'today' | 'rest' | 'easy' | 'long' | 'intense';

export function NutritionView({ profile, todayWorkout, fitToday, onViewedMacros }: NutritionViewProps) {
  const [mode, setMode] = useState<SimulationDayMode>('today');

  const simulatedWorkout: WorkoutSession | undefined =
    mode === 'today'
      ? todayWorkout
      : mode === 'rest'
      ? { ...(todayWorkout ?? ({} as WorkoutSession)), sessionType: 'rest', durationMinutes: 20, estimatedCalories: 90 }
      : mode === 'easy'
      ? { ...(todayWorkout ?? ({} as WorkoutSession)), sessionType: 'easy_z1', durationMinutes: 35, estimatedCalories: 330 }
      : mode === 'long'
      ? { ...(todayWorkout ?? ({} as WorkoutSession)), sessionType: 'long_run', durationMinutes: 65, estimatedCalories: 640 }
      : { ...(todayWorkout ?? ({} as WorkoutSession)), sessionType: 'intervals_z4', durationMinutes: 45, estimatedCalories: 520 };

  const macros = calculateDailyMacros(profile, simulatedWorkout, fitToday);

  return (
    <div className="stack-lg">
      <section className="card card-highlight stack-md" aria-label="Recomendador de Nutrición Macro">
        <div className="lynx-hero-grid">
          <img
            src="/assets/lynx/lynx-nutrition-macro.png"
            alt="Coach Lince recomendando nutrición macro equilibrada"
            width={190}
            height={190}
            className="lynx-portrait"
            loading="lazy"
          />

          <div className="stack-md">
            <div>
              <span className="pill pill-emerald">
                <Apple size={13} aria-hidden="true" />
                Guía Macro Adaptativa (No dieta rígida)
              </span>
              <h1 style={{ margin: '0.35rem 0 0', fontSize: '1.35rem' }}>
                Tus Macronutrientes Recomendados
              </h1>
              <p className="secondary" style={{ margin: '0.25rem 0 0', fontSize: '0.88rem' }}>
                Calculados con tu tasa metabólica Mifflin-St Jeor ({macros.bmr} kcal basales), tus pasos diarios y la carga de tu rutina.
              </p>
            </div>

            <div className="row-wrap" role="group" aria-label="Simular macros según tipo de día">
              {[
                { id: 'today', label: 'Plan de Hoy' },
                { id: 'rest', label: 'Día Descanso' },
                { id: 'easy', label: 'Rodaje Suave / CaCo' },
                { id: 'long', label: 'Tirada Larga' },
                { id: 'intense', label: 'Series / Fútbol' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`btn btn-sm ${mode === item.id ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => {
                    setMode(item.id as SimulationDayMode);
                    onViewedMacros();
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="pill pill-amber" style={{ alignSelf: 'flex-start' }}>
              <Flame size={13} aria-hidden="true" />
              {macros.dayTypeLabel} · Total estimado: {macros.calories} kcal
            </div>
          </div>
        </div>
      </section>

      <section className="grid-4" aria-label="Desglose diario de macronutrientes">
        <article className="card stack-sm" style={{ borderColor: 'rgba(249,115,22,0.4)' }}>
          <span className="muted" style={{ fontSize: '0.8rem' }}>Carbohidratos (Energía)</span>
          <div className="kpi-value" style={{ color: '#fdba74' }}>{macros.carbsGrams} g</div>
          <div className="mono" style={{ fontSize: '0.82rem' }}>
            {macros.carbsPerKg} g/kg · {macros.carbsPct}% del día
          </div>
          <p className="muted" style={{ margin: 0, fontSize: '0.78rem' }}>
            Avena, arroz, patata, pasta, fruta madura o pan integral.
          </p>
        </article>

        <article className="card stack-sm" style={{ borderColor: 'rgba(16,185,129,0.4)' }}>
          <span className="muted" style={{ fontSize: '0.8rem' }}>Proteínas (Reparación)</span>
          <div className="kpi-value" style={{ color: '#6ee7b7' }}>{macros.proteinGrams} g</div>
          <div className="mono" style={{ fontSize: '0.82rem' }}>
            {macros.proteinPerKg} g/kg · {macros.proteinPct}% del día
          </div>
          <p className="muted" style={{ margin: 0, fontSize: '0.78rem' }}>
            Pescado, huevo, pollo, yogur griego, legumbres o tofu.
          </p>
        </article>

        <article className="card stack-sm" style={{ borderColor: 'rgba(56,189,248,0.4)' }}>
          <span className="muted" style={{ fontSize: '0.8rem' }}>Grasas Saludables (Hormonas)</span>
          <div className="kpi-value" style={{ color: '#7dd3fc' }}>{macros.fatsGrams} g</div>
          <div className="mono" style={{ fontSize: '0.82rem' }}>
            {macros.fatsPerKg} g/kg · {macros.fatsPct}% del día
          </div>
          <p className="muted" style={{ margin: 0, fontSize: '0.78rem' }}>
            Aceite de oliva virgen extra, aguacate, nueces y pescado azul.
          </p>
        </article>

        <article className="card stack-sm">
          <div className="row-wrap">
            <Droplets size={16} color="#38bdf8" aria-hidden="true" />
            <span className="muted" style={{ fontSize: '0.8rem' }}>Hidratación Diaria</span>
          </div>
          <div className="kpi-value">{macros.hydrationLiters} L</div>
          <div className="mono" style={{ fontSize: '0.82rem' }}>Agua + electrolitos si sudas</div>
          <p className="muted" style={{ margin: 0, fontSize: '0.78rem' }}>
            Deshidratarse apenas un 2% empeora tu rendimiento aeróbico.
          </p>
        </article>
      </section>

      <section className="grid-2">
        <article className="card stack-sm">
          <strong style={{ color: '#fdba74' }}>Timing Pre-Entreno</strong>
          <p className="secondary" style={{ margin: 0, fontSize: '0.88rem' }}>{macros.preWorkoutTip}</p>
        </article>
        <article className="card stack-sm">
          <strong style={{ color: '#6ee7b7' }}>Recuperación Post-Entreno</strong>
          <p className="secondary" style={{ margin: 0, fontSize: '0.88rem' }}>{macros.postWorkoutTip}</p>
        </article>
      </section>

      <div className="card row-wrap" style={{ background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.3)' }}>
        <Sparkles size={17} color="#34d399" aria-hidden="true" />
        <span className="secondary" style={{ fontSize: '0.86rem' }}>
          <strong>Resumen de Coach Lince:</strong> {macros.dailyNote}
        </span>
      </div>
    </div>
  );
}
