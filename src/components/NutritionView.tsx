import { useState } from 'react';
import { CookingPot, Drop, Flame } from '@phosphor-icons/react';
import { Minus, Plus } from 'lucide-react';
import type { GoogleFitDay, UserProfile, WorkoutSession } from '../types/fitness';
import { calculateDailyMacros } from '../services/nutritionEngine';
import { AnimatedNumber, SpotlightCard } from './MotionPrimitives';
import { assetUrl } from '../services/assets';

interface NutritionViewProps {
  profile: UserProfile;
  todayWorkout?: WorkoutSession;
  fitToday?: GoogleFitDay;
  onViewedMacros: () => void;
}

type SimulationDayMode = 'today' | 'rest' | 'easy' | 'long' | 'intense';
type CalorieAdjustment = 'deficit' | 'maintenance' | 'performance';

export function NutritionView({ profile, todayWorkout, fitToday, onViewedMacros }: NutritionViewProps) {
  const [mode, setMode] = useState<SimulationDayMode>('today');
  const [calorieMode, setCalorieMode] = useState<CalorieAdjustment>('maintenance');
  const todayKey = `flyrun_water_${new Date().toISOString().slice(0, 10)}`;
  const [waterMl, setWaterMl] = useState<number>(() => {
    const saved = Number(localStorage.getItem(todayKey));
    return Number.isFinite(saved) && saved >= 0 ? saved : 750;
  });

  const updateWater = (nextMl: number) => {
    const clamped = Math.max(0, Math.min(6000, nextMl));
    setWaterMl(clamped);
    localStorage.setItem(todayKey, String(clamped));
  };

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

  const baseMacros = calculateDailyMacros(profile, simulatedWorkout, fitToday);
  const multiplier = calorieMode === 'deficit' ? 0.9 : calorieMode === 'performance' ? 1.08 : 1;

  const carbsGrams = Math.round(baseMacros.carbsGrams * multiplier);
  const proteinGrams = baseMacros.proteinGrams; // Proteína se mantiene estable para proteger músculo
  const fatsGrams = Math.round(baseMacros.fatsGrams * (calorieMode === 'deficit' ? 0.92 : multiplier));
  const totalKcal = carbsGrams * 4 + proteinGrams * 4 + fatsGrams * 9;
  const carbsPct = Math.round(((carbsGrams * 4) / Math.max(1, totalKcal)) * 100);
  const proteinPct = Math.round(((proteinGrams * 4) / Math.max(1, totalKcal)) * 100);
  const fatsPct = Math.max(0, 100 - carbsPct - proteinPct);

  const meals = [
    {
      name: 'Desayuno',
      carbsPct: 0.25,
      protPct: 0.22,
      fatPct: 0.25,
      example: 'Avena o pan integral con huevo/yogur griego, fruta y café o té.',
    },
    {
      name: 'Comida principal',
      carbsPct: 0.35,
      protPct: 0.34,
      fatPct: 0.35,
      example: 'Arroz, pasta o patata + pollo, salmón o legumbres + verduras con AOVE.',
    },
    {
      name: 'Merienda / Pre-Post entreno',
      carbsPct: 0.22,
      protPct: 0.16,
      fatPct: 0.12,
      example: 'Plátano o tostada antes de salir + yogur proteico o queso fresco al volver.',
    },
    {
      name: 'Cena',
      carbsPct: 0.18,
      protPct: 0.28,
      fatPct: 0.28,
      example: 'Pescado blanco o tortilla + guarnición ligera y aguacate o frutos secos.',
    },
  ];

  return (
    <div className="stack-lg">
      <SpotlightCard as="section" staggerIndex={0} className="stack-md" aria-label="Recomendador de Nutrición Macro">
        <div className="editorial-photo-banner" style={{ blockSize: '142px' }}>
          <img
            src={assetUrl('images/nutrition-athlete-meal.jpg')}
            alt="Plato saludable equilibrado con proteína, cereales y verduras frescas"
            width={1200}
            height={420}
            loading="lazy"
            className="editorial-photo-img"
          />
          <div className="editorial-photo-scrim">
            <span className="editorial-photo-caption">Nutrición real adaptada al gasto diario</span>
            <span className="pill pill-emerald mono">Mifflin-St Jeor</span>
          </div>
        </div>

        <div className="row-between">
          <div>
            <span className="pill pill-emerald">
              <CookingPot size={14} weight="duotone" aria-hidden="true" />
              Orientación en macronutrientes (sin dieta cerrada)
            </span>
            <h1 style={{ margin: '0.38rem 0 0', fontSize: '1.3rem', letterSpacing: '-0.02em' }}>
              Recomendación diaria de macros
            </h1>
            <p className="secondary" style={{ margin: '0.22rem 0 0', fontSize: '0.87rem' }}>
              Estimada con Mifflin-St Jeor ({baseMacros.bmr} kcal basales), tus pasos diarios y la exigencia de la sesión.
            </p>
          </div>
          <span className="pill pill-amber mono">
            <Flame size={14} weight="duotone" aria-hidden="true" />
            <AnimatedNumber value={totalKcal} locale suffix=" kcal/día" />
          </span>
        </div>

        <div className="row-between">
          <div className="segmented-group" role="group" aria-label="Simular macros según tipo de día">
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
                aria-pressed={mode === item.id}
                className="segmented-btn is-accent"
                onClick={() => {
                  setMode(item.id as SimulationDayMode);
                  onViewedMacros();
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="segmented-group" role="group" aria-label="Ajuste de objetivo energético">
            {[
              { id: 'deficit', label: 'Déficit ligero (-10%)' },
              { id: 'maintenance', label: 'Mantenimiento' },
              { id: 'performance', label: 'Rendimiento (+8%)' },
            ].map((adj) => (
              <button
                key={adj.id}
                type="button"
                aria-pressed={calorieMode === adj.id}
                className="segmented-btn is-pine"
                onClick={() => setCalorieMode(adj.id as CalorieAdjustment)}
              >
                {adj.label}
              </button>
            ))}
          </div>
        </div>

        <div className="stack-sm">
          <div className="row-between" style={{ fontSize: '0.8rem' }}>
            <span className="muted">
              Escenario: <strong style={{ color: 'var(--text-primary)' }}>{baseMacros.dayTypeLabel}</strong>
            </span>
            <span className="mono muted">
              {carbsPct}% C · {proteinPct}% P · {fatsPct}% G
            </span>
          </div>
          <div className="stacked-macro-track" aria-label={`Reparto energético ${carbsPct}% carbohidratos, ${proteinPct}% proteína, ${fatsPct}% grasas`}>
            <div style={{ inlineSize: `${carbsPct}%`, backgroundColor: 'var(--accent)' }} />
            <div style={{ inlineSize: `${proteinPct}%`, backgroundColor: 'var(--pine)' }} />
            <div style={{ inlineSize: `${fatsPct}%`, backgroundColor: 'var(--cobalt)' }} />
          </div>
        </div>
      </SpotlightCard>

      <section className="grid-4" aria-label="Desglose diario de macronutrientes">
        <SpotlightCard staggerIndex={1} className="stack-sm">
          <span className="muted" style={{ fontSize: '0.8rem' }}>Carbohidratos (combustible)</span>
          <div className="kpi-value" style={{ color: 'var(--accent)' }}>
            <AnimatedNumber value={carbsGrams} suffix=" g" />
          </div>
          <div className="mono" style={{ fontSize: '0.82rem' }}>
            {(carbsGrams / profile.weightKg).toFixed(1)} g/kg
          </div>
          <p className="muted" style={{ margin: 0, fontSize: '0.78rem' }}>
            Avena, arroz, patata, pasta, pan integral o fruta.
          </p>
        </SpotlightCard>

        <SpotlightCard staggerIndex={2} className="stack-sm">
          <span className="muted" style={{ fontSize: '0.8rem' }}>Proteínas (reparación muscular)</span>
          <div className="kpi-value" style={{ color: 'var(--pine)' }}>
            <AnimatedNumber value={proteinGrams} suffix=" g" />
          </div>
          <div className="mono" style={{ fontSize: '0.82rem' }}>
            {(proteinGrams / profile.weightKg).toFixed(1)} g/kg
          </div>
          <p className="muted" style={{ margin: 0, fontSize: '0.78rem' }}>
            Pescado, huevo, carne magra, lácteos proteicos, legumbres o tofu.
          </p>
        </SpotlightCard>

        <SpotlightCard staggerIndex={3} className="stack-sm">
          <span className="muted" style={{ fontSize: '0.8rem' }}>Grasas saludables (recuperación)</span>
          <div className="kpi-value" style={{ color: 'var(--cobalt)' }}>
            <AnimatedNumber value={fatsGrams} suffix=" g" />
          </div>
          <div className="mono" style={{ fontSize: '0.82rem' }}>
            {(fatsGrams / profile.weightKg).toFixed(1)} g/kg
          </div>
          <p className="muted" style={{ margin: 0, fontSize: '0.78rem' }}>
            Aceite de oliva virgen extra, aguacate, frutos secos y pescado azul.
          </p>
        </SpotlightCard>

        <SpotlightCard staggerIndex={4} className="stack-sm">
          <div className="row-between">
            <div className="row-wrap">
              <Drop size={16} weight="duotone" color="var(--cobalt)" aria-hidden="true" />
              <span className="muted" style={{ fontSize: '0.8rem' }}>Hidratación</span>
            </div>
            <span className="mono muted" style={{ fontSize: '0.75rem' }}>
              {(waterMl / 1000).toFixed(2)} / {baseMacros.hydrationLiters} L
            </span>
          </div>
          <div className="kpi-value">
            <AnimatedNumber value={baseMacros.hydrationLiters} decimals={1} suffix=" L" />
          </div>
          <div className="row-wrap" style={{ gap: '0.3rem' }} role="group" aria-label="Registro de vasos de 250 ml">
            {Array.from({ length: Math.max(6, Math.round((baseMacros.hydrationLiters * 1000) / 250)) }).map((_, i) => {
              const targetGlassMl = (i + 1) * 250;
              const filled = waterMl >= targetGlassMl;
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={`Marcar hasta ${targetGlassMl} ml de agua`}
                  aria-pressed={filled}
                  className={`hydration-pill-btn ${filled ? 'is-filled' : ''}`}
                  onClick={() => updateWater(waterMl === targetGlassMl ? targetGlassMl - 250 : targetGlassMl)}
                />
              );
            })}
          </div>
          <div className="row-wrap" style={{ gap: '0.35rem' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              aria-label="Restar 250 mililitros de agua"
              onClick={() => updateWater(waterMl - 250)}
            >
              <Minus size={13} aria-hidden="true" />
              250 ml
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              aria-label="Sumar 250 mililitros de agua"
              onClick={() => updateWater(waterMl + 250)}
            >
              <Plus size={13} aria-hidden="true" />
              250 ml
            </button>
          </div>
        </SpotlightCard>
      </section>

      {/* Reparto práctico en 4 comidas */}
      <SpotlightCard as="section" staggerIndex={5} className="stack-md" aria-label="Reparto orientativo en 4 comidas">
        <div>
          <h2 style={{ margin: 0, fontSize: '1.12rem' }}>Cómo repartir estos macros en 4 tomas prácticas</h2>
          <p className="muted" style={{ margin: '0.2rem 0 0', fontSize: '0.82rem' }}>
            No es un menú obligatorio, sino una referencia orientativa para alcanzar tus gramos diarios con comodidad.
          </p>
        </div>

        <div className="grid-2">
          {meals.map((meal) => (
            <article key={meal.name} className="inset-panel stack-sm">
              <div className="row-between">
                <strong style={{ fontSize: '0.94rem' }}>{meal.name}</strong>
                <span className="mono" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                  {Math.round(carbsGrams * meal.carbsPct)}g C · {Math.round(proteinGrams * meal.protPct)}g P · {Math.round(fatsGrams * meal.fatPct)}g G
                </span>
              </div>
              <p className="muted" style={{ margin: 0, fontSize: '0.81rem' }}>{meal.example}</p>
            </article>
          ))}
        </div>
      </SpotlightCard>

      <section className="grid-2">
        <article className="card stack-sm">
          <strong style={{ color: 'var(--accent)' }}>Antes de entrenar</strong>
          <p className="secondary" style={{ margin: 0, fontSize: '0.87rem' }}>{baseMacros.preWorkoutTip}</p>
        </article>
        <article className="card stack-sm">
          <strong style={{ color: 'var(--pine)' }}>Después de entrenar</strong>
          <p className="secondary" style={{ margin: 0, fontSize: '0.87rem' }}>{baseMacros.postWorkoutTip}</p>
        </article>
      </section>

      <div className="inset-panel" style={{ fontSize: '0.86rem' }}>
        <strong>Criterio del día:</strong> <span className="secondary">{baseMacros.dailyNote}</span>
      </div>
    </div>
  );
}
