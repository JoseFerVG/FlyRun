import { useState } from 'react';
import { Droplets, Utensils } from 'lucide-react';
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
      <section className="card stack-md" aria-label="Recomendador de Nutrición Macro">
        <div className="row-between">
          <div>
            <span className="pill pill-emerald">
              <Utensils size={13} aria-hidden="true" />
              Orientación en macronutrientes (sin dieta cerrada)
            </span>
            <h1 style={{ margin: '0.38rem 0 0', fontSize: '1.3rem', letterSpacing: '-0.02em' }}>
              Recomendación diaria de macros
            </h1>
            <p className="secondary" style={{ margin: '0.22rem 0 0', fontSize: '0.87rem' }}>
              Estimada a partir de tu gasto basal Mifflin-St Jeor ({macros.bmr} kcal), tus pasos diarios y la exigencia de la sesión.
            </p>
          </div>
          <span className="pill pill-amber mono">{macros.calories} kcal/día</span>
        </div>

        <div className="row-wrap" role="group" aria-label="Simular macros según tipo de día">
          {[
            { id: 'today', label: 'Sesión de hoy' },
            { id: 'rest', label: 'Día de descanso' },
            { id: 'easy', label: 'Rodaje suave / CaCo' },
            { id: 'long', label: 'Tirada larga' },
            { id: 'intense', label: 'Series o fútbol' },
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

        <div className="muted" style={{ fontSize: '0.82rem' }}>
          Escenario seleccionado: <strong>{macros.dayTypeLabel}</strong>
        </div>
      </section>

      <section className="grid-4" aria-label="Desglose diario de macronutrientes">
        <article className="card stack-sm">
          <span className="muted" style={{ fontSize: '0.8rem' }}>Carbohidratos (combustible)</span>
          <div className="kpi-value" style={{ color: 'var(--accent)' }}>{macros.carbsGrams} g</div>
          <div className="mono" style={{ fontSize: '0.82rem' }}>
            {macros.carbsPerKg} g/kg · {macros.carbsPct}%
          </div>
          <p className="muted" style={{ margin: 0, fontSize: '0.78rem' }}>
            Avena, arroz, patata, pasta, pan integral o fruta.
          </p>
        </article>

        <article className="card stack-sm">
          <span className="muted" style={{ fontSize: '0.8rem' }}>Proteínas (reparación muscular)</span>
          <div className="kpi-value" style={{ color: 'var(--pine)' }}>{macros.proteinGrams} g</div>
          <div className="mono" style={{ fontSize: '0.82rem' }}>
            {macros.proteinPerKg} g/kg · {macros.proteinPct}%
          </div>
          <p className="muted" style={{ margin: 0, fontSize: '0.78rem' }}>
            Pescado, huevo, carne magra, lácteos proteicos, legumbres o tofu.
          </p>
        </article>

        <article className="card stack-sm">
          <span className="muted" style={{ fontSize: '0.8rem' }}>Grasas saludables (recuperación)</span>
          <div className="kpi-value" style={{ color: 'var(--cobalt)' }}>{macros.fatsGrams} g</div>
          <div className="mono" style={{ fontSize: '0.82rem' }}>
            {macros.fatsPerKg} g/kg · {macros.fatsPct}%
          </div>
          <p className="muted" style={{ margin: 0, fontSize: '0.78rem' }}>
            Aceite de oliva virgen extra, aguacate, frutos secos y pescado azul.
          </p>
        </article>

        <article className="card stack-sm">
          <div className="row-wrap">
            <Droplets size={15} color="#2563eb" aria-hidden="true" />
            <span className="muted" style={{ fontSize: '0.8rem' }}>Hidratación</span>
          </div>
          <div className="kpi-value">{macros.hydrationLiters} L</div>
          <div className="mono" style={{ fontSize: '0.82rem' }}>Agua + sales si sudas mucho</div>
          <p className="muted" style={{ margin: 0, fontSize: '0.78rem' }}>
            Mantener hidratación estable evita subidas prematuras de pulso.
          </p>
        </article>
      </section>

      <section className="grid-2">
        <article className="card stack-sm">
          <strong style={{ color: 'var(--accent)' }}>Antes de entrenar</strong>
          <p className="secondary" style={{ margin: 0, fontSize: '0.87rem' }}>{macros.preWorkoutTip}</p>
        </article>
        <article className="card stack-sm">
          <strong style={{ color: 'var(--pine)' }}>Después de entrenar</strong>
          <p className="secondary" style={{ margin: 0, fontSize: '0.87rem' }}>{macros.postWorkoutTip}</p>
        </article>
      </section>

      <div className="inset-panel" style={{ fontSize: '0.86rem' }}>
        <strong>Criterio del día:</strong> <span className="secondary">{macros.dailyNote}</span>
      </div>
    </div>
  );
}
