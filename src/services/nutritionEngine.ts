import type { GoogleFitDay, MacroRecommendation, UserProfile, WorkoutSession } from '../types/fitness';

/**
 * Calcula las necesidades diarias en términos macro:
 * - Tasa Metabólica Basal (Mifflin-St Jeor)
 * - Gasto por actividad cotidiana (pasos de Google Fit)
 * - Carga energética y glucogénica de la sesión del día
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

  if (profile.goal === 'fat_loss_cardio') {
    tdee = Math.round(tdee * 0.88);
  }

  let dayType: MacroRecommendation['dayType'] = 'easy';
  let dayTypeLabel = 'Día de rodaje aeróbico / CaCo';
  let carbMultiplier = 4.2;
  let proteinMultiplier = 1.75;
  let fatMultiplier = 0.85;
  let preWorkoutTip = '30–60 min antes: un plátano o una tostada con miel/mermelada y un vaso de agua.';
  let postWorkoutTip = 'En los 45 min posteriores: una ración de proteína (yogur griego, huevo o pechuga) acompañada de arroz, patata o fruta.';
  let dailyNote = 'Prioriza carbohidratos limpios alrededor del entrenamiento para sostener el ritmo sin pesadez digestiva.';

  if (!workout || workout.sessionType === 'rest') {
    dayType = 'rest';
    dayTypeLabel = 'Día de descanso activo';
    carbMultiplier = 3.0;
    proteinMultiplier = 1.85;
    fatMultiplier = 0.95;
    preWorkoutTip = 'Al no haber sesión intensa, reparte carbohidratos integrales de absorción lenta en desayuno y comida.';
    postWorkoutTip = 'Mantén la proteína repartida en 3–4 comidas y prioriza grasas de calidad (aceite de oliva, frutos secos o aguacate).';
    dailyNote = 'Los días sin carrera bajamos ligeramente los carbohidratos y mantenemos la proteína alta para consolidar la recuperación.';
  } else if (
    workout.sessionType === 'intervals_z4' ||
    workout.sessionType === 'threshold_z3' ||
    workout.sessionType === 'soccer' ||
    workout.sessionType === 'physical_exam'
  ) {
    dayType = 'high_intensity';
    dayTypeLabel = 'Día intenso (series, partido o examen)';
    carbMultiplier = 5.4;
    proteinMultiplier = 1.9;
    fatMultiplier = 0.75;
    preWorkoutTip = '60–90 min antes: toma fácil de digerir (arroz blanco, avena cocida o pan blanco con fruta, baja en grasa y fibra).';
    postWorkoutTip = 'Después de entrenar: combina carbohidratos rápidos con proteína magra y algo de sal para reponer glucógeno.';
    dailyNote = 'Las series en Zona 4 y los partidos de fútbol consumen mucho glucógeno muscular: hoy conviene priorizar hidratos.';
  } else if (workout.sessionType === 'long_run' || workout.durationMinutes >= 55) {
    dayType = 'moderate';
    dayTypeLabel = 'Día de tirada larga';
    carbMultiplier = 5.0;
    proteinMultiplier = 1.8;
    fatMultiplier = 0.8;
    preWorkoutTip = 'Comida previa 90 min antes rica en carbohidratos complejos y unos 400 ml de agua.';
    postWorkoutTip = 'Al volver, prioriza hidratación con algo de fruta y una comida completa con proteína suficiente.';
    dailyNote = 'Acompaña el aumento de volumen con buena hidratación para evitar que suban las pulsaciones por deshidratación.';
  }

  if (profile.goal === 'fat_loss_cardio') {
    carbMultiplier = Math.max(2.4, carbMultiplier - 0.9);
    proteinMultiplier = Math.min(2.1, proteinMultiplier + 0.15);
  }

  let carbsGrams = Math.round(profile.weightKg * carbMultiplier);
  let proteinGrams = Math.round(profile.weightKg * proteinMultiplier);
  let fatsGrams = Math.round(profile.weightKg * fatMultiplier);

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
