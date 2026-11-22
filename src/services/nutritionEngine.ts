import type { GoogleFitDay, MacroRecommendation, UserProfile, WorkoutSession } from '../types/fitness';

/**
 * Calcula los macronutrientes diarios recomendados en base a:
 * - Ecuación Mifflin-St Jeor (TMB)
 * - NEAT diario procedente de los pasos de Google Fit
 * - Demanda energética y glucogénica de la sesión del día (descanso vs suave vs intervalos/fútbol)
 */
export function calculateDailyMacros(
  profile: UserProfile,
  workout?: WorkoutSession | null,
  fitToday?: GoogleFitDay | null
): MacroRecommendation {
  const sexOffset = profile.sex === 'female' ? -161 : 5;
  const bmr = Math.round(10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + sexOffset);

  const steps = fitToday?.steps ?? profile.dailyStepsTarget;
  let neatFactor = 1.28;
  if (steps >= 11000) neatFactor = 1.48;
  else if (steps >= 8000) neatFactor = 1.38;
  else if (steps >= 5500) neatFactor = 1.32;

  const workoutCalories = workout && workout.sessionType !== 'rest' ? workout.estimatedCalories : 0;
  let tdee = Math.round(bmr * neatFactor + workoutCalories);

  // Ajuste sutil si busca pérdida de grasa cardio
  if (profile.goal === 'fat_loss_cardio') {
    tdee = Math.round(tdee * 0.88);
  }

  let dayType: MacroRecommendation['dayType'] = 'easy';
  let dayTypeLabel = 'Día de Rodaje Aeróbico / CaCo';
  let carbMultiplier = 4.2;
  let proteinMultiplier = 1.75;
  let fatMultiplier = 0.85;
  let preWorkoutTip = '30–60 min antes: 1 plátano maduro o 1 tostada con miel/mermelada + vaso de agua.';
  let postWorkoutTip = 'En los 45 min posteriores: yogur griego o pechuga/tofu + arroz/patata y fruta fresca.';
  let dailyNote = 'Prioriza carbohidratos complejos limpios para sostener el ritmo aeróbico sin pesadez.';

  if (!workout || workout.sessionType === 'rest') {
    dayType = 'rest';
    dayTypeLabel = 'Día de Descanso Activo y Recuperación';
    carbMultiplier = 3.0;
    proteinMultiplier = 1.85;
    fatMultiplier = 0.95;
    preWorkoutTip = 'Sin demanda glucogénica alta: mantén energía estable con avena o pan integral en el desayuno.';
    postWorkoutTip = 'Asegura proteína repartida en 3–4 tomas y grasas saludables (AOVE, nueces, aguacate) para bajar inflamación.';
    dailyNote = 'En días de descanso reducimos ligeramente carbohidratos y mantenemos proteína alta para reparar tendones.';
  } else if (
    workout.sessionType === 'intervals_z4' ||
    workout.sessionType === 'threshold_z3' ||
    workout.sessionType === 'soccer' ||
    workout.sessionType === 'physical_exam'
  ) {
    dayType = 'high_intensity';
    dayTypeLabel = 'Día Intenso (Series / Partido / Examen)';
    carbMultiplier = 5.4;
    proteinMultiplier = 1.9;
    fatMultiplier = 0.75;
    preWorkoutTip = '60–90 min antes: carga ligera de rápida digestión (arroz blanco/avena cocida, plátano o pan con mermelada; poca grasa y fibra).';
    postWorkoutTip = 'Recuperación dorada (ratio 3:1 carbos:proteína): batido o comida completa con arroz/pasta + proteína magra + electrolitos.';
    dailyNote = 'Los intervalos Z4 y el fútbol consumen glucógeno muscular rápido: hoy los carbohidratos son tu gasolina principal.';
  } else if (workout.sessionType === 'long_run' || workout.durationMinutes >= 55) {
    dayType = 'moderate';
    dayTypeLabel = 'Día de Tirada Larga / Volumen';
    carbMultiplier = 5.0;
    proteinMultiplier = 1.8;
    fatMultiplier = 0.8;
    preWorkoutTip = 'Desayuno o comida previa 90 min antes rica en carbohidratos complejos + 400 ml de agua.';
    postWorkoutTip = 'Repón sales minerales y glucógeno con fruta, carbohidrato de calidad y 25–35 g de proteína completa.';
    dailyNote = 'Acompaña el volumen largo con suficiente hidratación para mantener estable tu frecuencia cardíaca.';
  }

  if (profile.goal === 'fat_loss_cardio') {
    carbMultiplier = Math.max(2.4, carbMultiplier - 0.9);
    proteinMultiplier = Math.min(2.1, proteinMultiplier + 0.15);
  }

  let carbsGrams = Math.round(profile.weightKg * carbMultiplier);
  let proteinGrams = Math.round(profile.weightKg * proteinMultiplier);
  let fatsGrams = Math.round(profile.weightKg * fatMultiplier);

  // Normalizamos proporcionalmente para que la suma calórica sea coherente con el objetivo diario
  const rawMacroKcal = carbsGrams * 4 + proteinGrams * 4 + fatsGrams * 9;
  const scale = tdee / Math.max(1200, rawMacroKcal);
  carbsGrams = Math.round(carbsGrams * scale);
  proteinGrams = Math.round(proteinGrams * (0.5 + 0.5 * scale));
  fatsGrams = Math.max(40, Math.round((tdee - carbsGrams * 4 - proteinGrams * 4) / 9));

  const totalKcal = carbsGrams * 4 + proteinGrams * 4 + fatsGrams * 9;
  const carbsPct = Math.round(((carbsGrams * 4) / totalKcal) * 100);
  const proteinPct = Math.round(((proteinGrams * 4) / totalKcal) * 100);
  const fatsPct = Math.max(10, 100 - carbsPct - proteinPct);

  const hydrationLiters = Number(
    (profile.weightKg * 0.035 + (workout && workout.sessionType !== 'rest' ? workout.durationMinutes / 90 : 0.2)).toFixed(1)
  );

  return {
    dayType,
    dayTypeLabel,
    calories: totalKcal,
    bmr,
    tdee,
    carbsGrams,
    carbsPerKg: Number((carbsGrams / profile.weightKg).toFixed(1)),
    proteinGrams,
    proteinPerKg: Number((proteinGrams / profile.weightKg).toFixed(1)),
    fatsGrams,
    fatsPerKg: Number((fatsGrams / profile.weightKg).toFixed(1)),
    hydrationLiters,
    carbsPct,
    proteinPct,
    fatsPct,
    preWorkoutTip,
    postWorkoutTip,
    dailyNote,
  };
}
