import type {
  CardioModality,
  LynxLevelInfo,
  PhysicalExamResult,
  PhysicalExamType,
  SessionType,
  TrainingZone,
  UserProfile,
  WorkoutBlock,
  WorkoutSession,
} from '../types/fitness';

const LEVEL_DEFINITIONS: Array<{
  level: number;
  title: string;
  spanishTitle: string;
  minVdot: number;
  minXp: number;
  badgeColor: string;
  lynxQuote: string;
}> = [
  {
    level: 1,
    title: 'Doñana Cub',
    spanishTitle: 'Cachorro de Doñana',
    minVdot: 20,
    minXp: 0,
    badgeColor: '#94a3b8',
    lynxQuote: 'Todo depredador empieza caminando con cabeza. Construyamos tus tendones con CaCo sin prisa.',
  },
  {
    level: 2,
    title: 'Trail Scout',
    spanishTitle: 'Rastreador del Monte',
    minVdot: 26,
    minXp: 350,
    badgeColor: '#38bdf8',
    lynxQuote: 'Tu corazón ya nota el ritmo. Seguimos protegiendo rodillas mientras subimos minutos de trote.',
  },
  {
    level: 3,
    title: 'Active Runner',
    spanishTitle: 'Lince Ágil',
    minVdot: 31,
    minXp: 800,
    badgeColor: '#22c55e',
    lynxQuote: 'Ya puedes sostener carrera continua. Activamos el modelo científico 80/20 esta semana.',
  },
  {
    level: 4,
    title: 'Aerobic Hunter',
    spanishTitle: 'Cazador Aeróbico',
    minVdot: 36,
    minXp: 1400,
    badgeColor: '#10b981',
    lynxQuote: 'Tu base aeróbica es sólida. Introducimos bloques controlados en Zona 3 Umbral.',
  },
  {
    level: 5,
    title: 'Sierra Predator',
    spanishTitle: 'Lince de Sierra Morena',
    minVdot: 41,
    minXp: 2200,
    badgeColor: '#f59e0b',
    lynxQuote: 'Nivel intermedio-alto desbloqueado. Tu VO2max responde de maravilla a intervalos Billat.',
  },
  {
    level: 6,
    title: 'Velocity Lynx',
    spanishTitle: 'Velocista Ibérico',
    minVdot: 46,
    minXp: 3200,
    badgeColor: '#f97316',
    lynxQuote: 'Tus ritmos en umbral y series ya imponen respeto. Vigila el descanso y los pasos de recuperación.',
  },
  {
    level: 7,
    title: 'Endurance Alpha',
    spanishTitle: 'Alfa de Resistencia',
    minVdot: 51,
    minXp: 4500,
    badgeColor: '#fb7185',
    lynxQuote: 'Motor aeróbico de élite amateur. Cuidemos carbohidratos pre-entreno en tus días de carga.',
  },
  {
    level: 8,
    title: 'Apex Strider',
    spanishTitle: 'Zancada Suprema',
    minVdot: 56,
    minXp: 6000,
    badgeColor: '#a855f7',
    lynxQuote: 'Eficiencia biomecánica brutal. Cada sesión de calidad tiene un propósito quirúrgico.',
  },
  {
    level: 9,
    title: 'Iberian Legend',
    spanishTitle: 'Leyenda Ibérica',
    minVdot: 62,
    minXp: 8000,
    badgeColor: '#eab308',
    lynxQuote: 'Pocos humanos alcanzan este equilibrio entre potencia VO2max y economía de carrera.',
  },
  {
    level: 10,
    title: 'Indomitable Spirit',
    spanishTitle: 'Espíritu Indomable',
    minVdot: 68,
    minXp: 10500,
    badgeColor: '#2dd4bf',
    lynxQuote: 'Nivel máximo de FlyRun. Eres la referencia absoluta del territorio lince.',
  },
];

export function formatPace(secPerKm: number): string {
  const clamped = Math.max(175, Math.min(720, Math.round(secPerKm)));
  const min = Math.floor(clamped / 60);
  const sec = clamped % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export function estimateMaxHR(age: number): number {
  // Tanaka et al. (2001): 208 - 0.7 * age (más precisa que 220 - age)
  return Math.round(208 - 0.7 * Math.max(14, Math.min(90, age)));
}

/**
 * Fórmula científica de Jack Daniels & Jimmy Gilbert:
 * Estima el VDOT a partir de una distancia (metros) y tiempo (minutos).
 */
export function calculateDanielsVDOT(distanceMeters: number, timeMinutes: number): number {
  const safeDist = Math.max(400, distanceMeters);
  const safeTime = Math.max(2, timeMinutes);
  const velocity = safeDist / safeTime; // m/min
  const vo2 = -4.6 + 0.182258 * velocity + 0.000104 * velocity * velocity;
  const pctMax =
    0.8 +
    0.1894393 * Math.exp(-0.012778 * safeTime) +
    0.2989558 * Math.exp(-0.1932605 * safeTime);
  const vdot = vo2 / pctMax;
  return Number(Math.max(20, Math.min(78, vdot)).toFixed(1));
}

export function calculateVDOTFromExam(
  examType: PhysicalExamType,
  rawValue: number,
  options?: {
    secondaryValue?: number;
    heartRateBpm?: number;
    age?: number;
    weightKg?: number;
    sex?: 'male' | 'female' | 'other';
  }
): number {
  if (examType === 'cooper_12min') {
    // Cooper original: (d - 504.9) / 44.73, y cruzado con Daniels para coherencia
    const cooperVo2 = (rawValue - 504.9) / 44.73;
    const daniels = calculateDanielsVDOT(rawValue, 12);
    const blended = cooperVo2 * 0.45 + daniels * 0.55;
    return Number(Math.max(20, Math.min(76, blended)).toFixed(1));
  }

  if (examType === 'time_trial_5k') {
    // rawValue en minutos (ej. 25.5 min)
    return calculateDanielsVDOT(5000, Math.max(13, Math.min(60, rawValue)));
  }

  if (examType === 'rockport_walk_1600m') {
    // Ecuación oficial Rockport Fitness Walking Test (Kline et al., 1987)
    const weightLbs = (options?.weightKg ?? 72) * 2.20462;
    const age = options?.age ?? 30;
    const genderFactor = options?.sex === 'female' ? 0 : 1;
    const walkMinutes = Math.max(8, Math.min(35, rawValue));
    const hr = Math.max(85, Math.min(200, options?.heartRateBpm ?? 135));
    const vo2 =
      132.853 -
      0.0769 * weightLbs -
      0.3877 * age +
      6.315 * genderFactor -
      3.2649 * walkMinutes -
      0.1565 * hr;
    return Number(Math.max(20, Math.min(58, vo2)).toFixed(1));
  }

  // caco_continuous_test: minutos trotando sin parar (rawValue) + ritmo percibido o esfuerzo
  const minutes = Math.max(1, Math.min(90, rawValue));
  const perceivedEasyBonus = options?.secondaryValue ? Math.max(-2, Math.min(4, (6 - options.secondaryValue) * 0.6)) : 0;
  let estimated = 22;
  if (minutes < 5) estimated = 22 + minutes * 0.8;
  else if (minutes < 15) estimated = 26 + (minutes - 5) * 0.6;
  else if (minutes < 35) estimated = 32 + (minutes - 15) * 0.35;
  else estimated = 39 + (minutes - 35) * 0.16;

  return Number(Math.max(20, Math.min(55, estimated + perceivedEasyBonus)).toFixed(1));
}

export function getLynxLevel(vdot: number, xp: number): LynxLevelInfo {
  let active = LEVEL_DEFINITIONS[0];

  for (const def of LEVEL_DEFINITIONS) {
    // Sube de nivel cuando cumple el VDOT o la XP acumulada (progresivo por constancia + rendimiento)
    if (vdot >= def.minVdot || xp >= def.minXp * 1.15) {
      active = def;
    }
  }

  const nextDef = LEVEL_DEFINITIONS.find((d) => d.level === active.level + 1);
  const currentFloor = active.minXp;
  const nextTarget = nextDef ? nextDef.minXp : active.minXp + 2500;
  const xpProgress = Math.min(
    100,
    Math.max(6, Math.round(((xp - currentFloor) / Math.max(1, nextTarget - currentFloor)) * 100))
  );

  return {
    level: active.level,
    title: active.title,
    spanishTitle: active.spanishTitle,
    minVdot: active.minVdot,
    minXp: active.minXp,
    nextLevelXp: nextTarget,
    progressPct: xpProgress,
    badgeColor: active.badgeColor,
    lynxQuote: active.lynxQuote,
  };
}

export function getAllLevelDefinitions() {
  return LEVEL_DEFINITIONS;
}

/**
 * Invierte el modelo VDOT para obtener velocidad (m/min) a un porcentaje de VO2max.
 */
function paceAtVO2Fraction(vdot: number, fraction: number): number {
  const targetVo2 = vdot * fraction;
  // 0.000104 v^2 + 0.182258 v - (4.6 + targetVo2) = 0
  const a = 0.000104;
  const b = 0.182258;
  const c = -(4.6 + targetVo2);
  const discriminant = Math.max(0, b * b - 4 * a * c);
  const velocityMPerMin = (-b + Math.sqrt(discriminant)) / (2 * a);
  const secPerKm = (1000 / Math.max(70, velocityMPerMin)) * 60;
  return Math.round(secPerKm);
}

export function calculateTrainingZones(vdot: number, maxHR: number, restHR: number): TrainingZone[] {
  const hrr = Math.max(60, maxHR - restHR);
  const hrAt = (pct: number) => Math.round(restHR + hrr * pct);

  const z1Slow = paceAtVO2Fraction(vdot, 0.62);
  const z1Fast = paceAtVO2Fraction(vdot, 0.72);

  const z2Slow = paceAtVO2Fraction(vdot, 0.75);
  const z2Fast = paceAtVO2Fraction(vdot, 0.82);

  const z3Slow = paceAtVO2Fraction(vdot, 0.84);
  const z3Fast = paceAtVO2Fraction(vdot, 0.89);

  const z4Slow = paceAtVO2Fraction(vdot, 0.94);
  const z4Fast = paceAtVO2Fraction(vdot, 1.0);

  const z5Slow = paceAtVO2Fraction(vdot, 1.04);
  const z5Fast = paceAtVO2Fraction(vdot, 1.12);

  return [
    {
      id: 'Z1',
      name: 'Aeróbico Suave / Base',
      danielsCode: 'E-Pace (Easy)',
      vo2PctRange: '60–74% VO2max',
      paceMinSecPerKm: z1Fast,
      paceMaxSecPerKm: z1Slow,
      paceFormatted: `${formatPace(z1Fast)} – ${formatPace(z1Slow)} /km`,
      hrMin: hrAt(0.58),
      hrMax: hrAt(0.72),
      purpose: 'Capilarización, mitocondrias y recuperación sin fatiga (el 80% de tu plan).',
      color: '#22c55e',
    },
    {
      id: 'Z2',
      name: 'Resistencia Maratón / Estable',
      danielsCode: 'M-Pace',
      vo2PctRange: '75–82% VO2max',
      paceMinSecPerKm: z2Fast,
      paceMaxSecPerKm: z2Slow,
      paceFormatted: `${formatPace(z2Fast)} – ${formatPace(z2Slow)} /km`,
      hrMin: hrAt(0.73),
      hrMax: hrAt(0.81),
      purpose: 'Economía de glucógeno y ritmo sostenido controlado.',
      color: '#38bdf8',
    },
    {
      id: 'Z3',
      name: 'Umbral de Lactato (Tempo)',
      danielsCode: 'T-Pace (Threshold)',
      vo2PctRange: '83–89% VO2max',
      paceMinSecPerKm: z3Fast,
      paceMaxSecPerKm: z3Slow,
      paceFormatted: `${formatPace(z3Fast)} – ${formatPace(z3Slow)} /km`,
      hrMin: hrAt(0.82),
      hrMax: hrAt(0.88),
      purpose: 'Eleva tu segundo umbral (VT2) para sostener ritmos altos sin saturarte.',
      color: '#f59e0b',
    },
    {
      id: 'Z4',
      name: 'Intervalos VO2max',
      danielsCode: 'I-Pace (Interval)',
      vo2PctRange: '94–100% VO2max',
      paceMinSecPerKm: z4Fast,
      paceMaxSecPerKm: z4Slow,
      paceFormatted: `${formatPace(z4Fast)} – ${formatPace(z4Slow)} /km`,
      hrMin: hrAt(0.89),
      hrMax: hrAt(0.96),
      purpose: 'Maximiza el volumen sistólico cardíaco y tu techo de oxígeno.',
      color: '#f97316',
    },
    {
      id: 'Z5',
      name: 'Repeticiones Neuromusculares',
      danielsCode: 'R-Pace (Repetition)',
      vo2PctRange: '>104% VO2max',
      paceMinSecPerKm: z5Fast,
      paceMaxSecPerKm: z5Slow,
      paceFormatted: `${formatPace(z5Fast)} – ${formatPace(z5Slow)} /km`,
      hrMin: hrAt(0.95),
      hrMax: maxHR,
      purpose: 'Velocidad pura, técnica de zancada y eficiencia elástica.',
      color: '#ef4444',
    },
  ];
}

export interface CardioEquivalenceMetrics {
  modality: CardioModality;
  label: string;
  durationMinutes: number;
  mets: number;
  metMinutes: number;
  cardioPoints: number;
  trimp: number;
  calories: number;
  equivalentRunningMinutes: number;
  equivalentRunningKm: number;
  jointImpactScore: string;
  physiologicalEffect: string;
}

const MODALITY_CONFIG: Record<
  CardioModality,
  { label: string; baseMet: number; rpeSlope: number; impact: string; effect: string }
> = {
  running: {
    label: 'Running (Principal)',
    baseMet: 7.2,
    rpeSlope: 0.65,
    impact: '1.0x (Estándar óseo-tendinoso)',
    effect: 'Máxima especificidad de carrera, economía neuromuscular y densidad mitocondrial.',
  },
  cycling: {
    label: 'Ciclismo (Bici Ruta / Estática)',
    baseMet: 5.5,
    rpeSlope: 0.55,
    impact: '0.15x (Ultra bajo impacto articular)',
    effect: 'Fuerte estímulo aeróbico central y fuerza de cuádriceps protegiendo rodillas y tobillos.',
  },
  soccer: {
    label: 'Partido de Fútbol',
    baseMet: 7.0,
    rpeSlope: 0.52,
    impact: '1.25x (Cambios de dirección y sprints)',
    effect: 'Carga intermitente tipo Fartlek/HIIT: picos de VO2max, agilidad y desgaste anaeróbico.',
  },
  walking: {
    label: 'Caminata Activa / Pasos',
    baseMet: 3.3,
    rpeSlope: 0.35,
    impact: '0.3x (Regenerativo)',
    effect: 'Capilarización suave, limpieza metabólica y quema lipídica sin estrés del SNC.',
  },
  swimming: {
    label: 'Natación / Elíptica',
    baseMet: 6.0,
    rpeSlope: 0.52,
    impact: '0.1x (Descarga completa)',
    effect: 'Capacidad pulmonar y descarga total del aparato locomotor.',
  },
};

export function calculateCardioEquivalence(
  modality: CardioModality,
  durationMinutes: number,
  intensityRPE: number,
  weightKg: number,
  sex: 'male' | 'female' | 'other' = 'male',
  vdot = 35
): CardioEquivalenceMetrics {
  const cfg = MODALITY_CONFIG[modality];
  const safeDuration = Math.max(5, durationMinutes);
  const safeRPE = Math.max(1, Math.min(10, intensityRPE));
  const mets = Number((cfg.baseMet + (safeRPE - 4) * cfg.rpeSlope).toFixed(1));
  const effectiveMets = Math.max(3.0, mets);
  const metMinutes = Math.round(effectiveMets * safeDuration);

  // Banister TRIMP aproximado usando reserva de frecuencia cardíaca equivalente al RPE
  const deltaHR = Math.max(0.28, Math.min(0.95, 0.25 + safeRPE * 0.068));
  const b = sex === 'female' ? 1.67 : 1.92;
  const trimp = Math.round(safeDuration * deltaHR * 0.64 * Math.exp(b * deltaHR));

  // Puntos Cardio Lince: combina volumen metabólico (MET-min) + carga fisiológica (TRIMP)
  const cardioPoints = Math.round(metMinutes * 0.16 + trimp * 0.55);

  // Calorías: MET * 3.5 * weightKg / 200 * minutes
  const calories = Math.round(((effectiveMets * 3.5 * weightKg) / 200) * safeDuration);

  // Equivalencia en minutos y km de running suave-moderado (Z1-Z2 ~9.8 METs)
  const equivalentRunningMinutes = Math.round(metMinutes / 9.8);
  const easyPaceSec = paceAtVO2Fraction(vdot, 0.68);
  const equivalentRunningKm = Number(((equivalentRunningMinutes * 60) / easyPaceSec).toFixed(1));

  return {
    modality,
    label: cfg.label,
    durationMinutes: safeDuration,
    mets: effectiveMets,
    metMinutes,
    cardioPoints,
    trimp,
    calories,
    equivalentRunningMinutes,
    equivalentRunningKm,
    jointImpactScore: cfg.impact,
    physiologicalEffect: cfg.effect,
  };
}

export function getModalityLabel(modality: CardioModality): string {
  return MODALITY_CONFIG[modality].label;
}

function addDaysISO(baseDate: Date, offsetDays: number): string {
  const d = new Date(baseDate);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function createSessionFromTemplate(
  profile: UserProfile,
  zones: TrainingZone[],
  dateStr: string,
  dayIndex: number,
  templateType: SessionType,
  weekNumber: number
): WorkoutSession {
  const z1 = zones[0];
  const z2 = zones[1];
  const z3 = zones[2];
  const z4 = zones[3];

  const isLowLevel = profile.level <= 2;

  if (templateType === 'rest') {
    const eq = calculateCardioEquivalence('walking', 25, 3, profile.weightKg, profile.sex, profile.vdot);
    return {
      id: `wk_${dateStr}`,
      date: dateStr,
      dayIndex,
      title: 'Descanso Activo & Pasos Google Fit',
      subtitle: 'Recuperación parasimpática y remodelación de tejido',
      modality: 'walking',
      sessionType: 'rest',
      strategyTag: 'Recuperación Biológica',
      durationMinutes: 25,
      targetDistanceKm: 2.0,
      targetZone: 'Z1',
      targetPace: 'Paseo cómodo',
      cardioPoints: Math.round(eq.cardioPoints * 0.6),
      metMinutes: eq.metMinutes,
      trimp: eq.trimp,
      estimatedCalories: eq.calories,
      blocks: [
        {
          label: 'Movilidad + Caminata ligera',
          durationMinutes: 25,
          intensity: 'Muy suave · 40–55% FCmax',
          description: `Completa tus ${profile.dailyStepsTarget.toLocaleString('es-ES')} pasos diarios sin correr. El músculo crece y el tendón se fortalece hoy.`,
          zone: 'Z1',
        },
      ],
      coachTip: 'El descanso no es perder el tiempo: es consolidar las adaptaciones de ayer.',
      completed: false,
    };
  }

  if (templateType === 'physical_exam') {
    const eq = calculateCardioEquivalence('running', 28, 8, profile.weightKg, profile.sex, profile.vdot);
    const examDesc =
      profile.level <= 2
        ? 'Test CaCo / Caminata Rockport 1.6 km para medir tu evolución aeróbica sin forzar impacto.'
        : 'Test de Cooper (12 minutos al máximo ritmo sostenible) o Contrarreloj 5K para recalibrar tu VDOT.';
    return {
      id: `wk_${dateStr}`,
      date: dateStr,
      dayIndex,
      title: 'Día de Examen Físico del Lince',
      subtitle: 'Evaluación objetiva de VDOT, Nivel y Zonas',
      modality: 'running',
      sessionType: 'physical_exam',
      strategyTag: 'Examen Oficial FlyRun',
      durationMinutes: 28,
      targetDistanceKm: profile.level <= 2 ? 2.2 : 3.2,
      targetZone: 'Z4',
      targetPace: profile.level <= 2 ? 'Ritmo vivo sostenible' : z4.paceFormatted,
      cardioPoints: eq.cardioPoints + 40,
      metMinutes: eq.metMinutes,
      trimp: eq.trimp,
      estimatedCalories: eq.calories,
      blocks: [
        {
          label: 'Calentamiento Progresivo',
          durationMinutes: 10,
          intensity: 'Z1 suave + 3 aceleraciones de 15s',
          description: 'Prepara temperatura muscular y sistema cardiovascular sin fatigarte.',
          zone: 'Z1',
        },
        {
          label: 'Bloque Examen Oficial',
          durationMinutes: 12,
          intensity: 'Esfuerzo máximo sostenible (RPE 8-9/10)',
          description: examDesc,
          zone: 'Z4',
        },
        {
          label: 'Vuelta a la calma',
          durationMinutes: 6,
          intensity: 'Caminata suave',
          description: 'Registra tu resultado en la pestaña "Examen Físico" para actualizar nivel.',
          zone: 'Z1',
        },
      ],
      coachTip: 'Hoy no entrenamos por ego, hoy medimos tu fisiología real para optimizar las próximas semanas.',
      completed: false,
      isExamDay: true,
    };
  }

  if (templateType === 'caco' || (isLowLevel && templateType === 'easy_z1')) {
    const runMin = Math.min(5, 1 + weekNumber + (profile.level - 1));
    const walkMin = Math.max(2, 7 - weekNumber - (profile.level - 1));
    const rounds = 4;
    const mainMinutes = rounds * (runMin + walkMin);
    const totalMinutes = 10 + mainMinutes;
    const eq = calculateCardioEquivalence('running', totalMinutes, 5, profile.weightKg, profile.sex, profile.vdot);
    const blocks: WorkoutBlock[] = [
      {
        label: 'Activación articular + caminata rápida',
        durationMinutes: 5,
        intensity: 'Muy suave',
        description: 'Rotaciones de tobillo, rodilla, cadera y 5 min caminando alegre.',
        zone: 'Z1',
      },
      {
        label: `Bloque CaCo ${rounds}x (${runMin}' correr / ${walkMin}' andar)`,
        durationMinutes: mainMinutes,
        intensity: `Trote Z1 (${z1.paceFormatted}) + Caminata activa`,
        description: `Estrategia CaCo: corre ${runMin} min suave pudiendo hablar, camina ${walkMin} min para descargar tendones.`,
        zone: 'Z1',
      },
      {
        label: 'Enfriamiento',
        durationMinutes: 5,
        intensity: 'Paseo tranquilo',
        description: 'Baja pulsaciones y estira suavemente gemelos y sóleo.',
        zone: 'Z1',
      },
    ];
    return {
      id: `wk_${dateStr}`,
      date: dateStr,
      dayIndex,
      title: `CaCo Científico: ${runMin}' Correr / ${walkMin}' Andar`,
      subtitle: 'Construcción segura de tendones y capacidad aeróbica',
      modality: 'running',
      sessionType: 'caco',
      strategyTag: `CaCo ${runMin}'/${walkMin}'`,
      durationMinutes: totalMinutes,
      targetDistanceKm: Number((totalMinutes * 0.115).toFixed(1)),
      targetZone: 'Z1',
      targetPace: z1.paceFormatted,
      cardioPoints: eq.cardioPoints,
      metMinutes: eq.metMinutes,
      trimp: eq.trimp,
      estimatedCalories: eq.calories,
      blocks,
      coachTip: `Si terminas los bloques sintiendo que podrías hacer uno más, lo has clavado. Así se evita el 90% de lesiones.`,
      completed: false,
    };
  }

  if (templateType === 'threshold_z3') {
    const duration = Math.min(52, 34 + profile.level * 2);
    const eq = calculateCardioEquivalence('running', duration, 7, profile.weightKg, profile.sex, profile.vdot);
    return {
      id: `wk_${dateStr}`,
      date: dateStr,
      dayIndex,
      title: 'Umbral de Lactato (Cruise Intervals Z3)',
      subtitle: 'El 20% de calidad · Protocolo Jack Daniels T-Pace',
      modality: 'running',
      sessionType: 'threshold_z3',
      strategyTag: '80/20 · Calidad Z3',
      durationMinutes: duration,
      targetDistanceKm: Number(((duration * 60) / z3.paceMinSecPerKm * 0.88).toFixed(1)),
      targetZone: 'Z3',
      targetPace: z3.paceFormatted,
      cardioPoints: eq.cardioPoints,
      metMinutes: eq.metMinutes,
      trimp: eq.trimp,
      estimatedCalories: eq.calories,
      blocks: [
        {
          label: 'Calentamiento progresivo',
          durationMinutes: 10,
          intensity: z1.paceFormatted,
          description: 'Rodaje cómodo Z1 + 2 rectas progresivas de 15 segundos.',
          zone: 'Z1',
        },
        {
          label: '3 x 6 min a Ritmo Umbral (1 min trote suave)',
          durationMinutes: 20,
          intensity: `${z3.paceFormatted} · ${z3.hrMin}-${z3.hrMax} ppm`,
          description: 'Ritmo "cómodamente duro": controlado, respiración rítmica 2-2 sin sprintar.',
          zone: 'Z3',
        },
        {
          label: 'Vuelta a la calma',
          durationMinutes: duration - 30,
          intensity: z1.paceFormatted,
          description: 'Trote muy suave para acelerar la reutilización de lactato.',
          zone: 'Z1',
        },
      ],
      coachTip: 'Esta sesión eleva la velocidad a la que puedes correr sin que tus piernas se llenen de acidez.',
      completed: false,
    };
  }

  if (templateType === 'intervals_z4') {
    const duration = 38;
    const eq = calculateCardioEquivalence('running', duration, 8, profile.weightKg, profile.sex, profile.vdot);
    return {
      id: `wk_${dateStr}`,
      date: dateStr,
      dayIndex,
      title: 'Intervalos Billat 30-30 VO2max',
      subtitle: 'El 20% de calidad · Potencia cardíaca máxima',
      modality: 'running',
      sessionType: 'intervals_z4',
      strategyTag: 'Billat 30-30 · Z4',
      durationMinutes: duration,
      targetDistanceKm: Number(((duration * 60) / z2.paceMinSecPerKm * 0.92).toFixed(1)),
      targetZone: 'Z4',
      targetPace: z4.paceFormatted,
      cardioPoints: eq.cardioPoints,
      metMinutes: eq.metMinutes,
      trimp: eq.trimp,
      estimatedCalories: eq.calories,
      blocks: [
        {
          label: 'Calentamiento completo',
          durationMinutes: 12,
          intensity: z1.paceFormatted,
          description: 'Trote suave + técnica de carrera (skipping bajo y talones al glúteo).',
          zone: 'Z1',
        },
        {
          label: '2 bloques x 8 repeticiones (30s Z4 / 30s Z1 suave)',
          durationMinutes: 18,
          intensity: `${z4.paceFormatted} en rápidos · Trote suave 30s`,
          description: '2 min andando entre los dos bloques. No te pares en seco entre 30s.',
          zone: 'Z4',
        },
        {
          label: 'Enfriamiento',
          durationMinutes: 8,
          intensity: 'Z1 regenerativo',
          description: 'Trote suave o caminata hasta bajar de 125 ppm.',
          zone: 'Z1',
        },
      ],
      coachTip: 'Con el método Billat pasas más minutos cerca del 100% VO2max con la mitad de fatiga muscular.',
      completed: false,
    };
  }

  if (templateType === 'cycling') {
    const duration = 45 + Math.min(20, profile.level * 2);
    const eq = calculateCardioEquivalence('cycling', duration, 5, profile.weightKg, profile.sex, profile.vdot);
    return {
      id: `wk_${dateStr}`,
      date: dateStr,
      dayIndex,
      title: 'Ciclismo Aeróbico Equivalente (Descarga Articular)',
      subtitle: `Equivale a ${eq.equivalentRunningKm} km de running sin impacto`,
      modality: 'cycling',
      sessionType: 'cycling',
      strategyTag: 'Cardio Alternativo Bici',
      durationMinutes: duration,
      targetDistanceKm: Number((duration * 0.36).toFixed(1)),
      targetZone: 'Z2',
      targetPace: '85–95 rpm cadencia',
      cardioPoints: eq.cardioPoints,
      metMinutes: eq.metMinutes,
      trimp: eq.trimp,
      estimatedCalories: eq.calories,
      blocks: [
        {
          label: 'Calentamiento cadencia ágil',
          durationMinutes: 10,
          intensity: 'Z1 ligero · 90 rpm',
          description: 'Desarrollo suave para lubricar rodillas sin tensión.',
          zone: 'Z1',
        },
        {
          label: 'Bloque aeróbico continuo en bici',
          durationMinutes: duration - 15,
          intensity: `Z1–Z2 · ${z1.hrMin}–${z2.hrMax} ppm`,
          description: 'Pedaleo redondo constante. Si puedes cantar o hablar frases fluidas, estás en la zona óptima.',
          zone: 'Z2',
        },
        {
          label: 'Soltura final',
          durationMinutes: 5,
          intensity: 'Muy suave',
          description: 'Baja resistencia al mínimo los últimos 5 min.',
          zone: 'Z1',
        },
      ],
      coachTip: 'Hoy sumas Puntos Cardio de primer nivel protegiendo tus articulaciones al 85%.',
      completed: false,
    };
  }

  if (templateType === 'soccer') {
    const duration = 60;
    const eq = calculateCardioEquivalence('soccer', duration, 7, profile.weightKg, profile.sex, profile.vdot);
    return {
      id: `wk_${dateStr}`,
      date: dateStr,
      dayIndex,
      title: 'Cardio Alternativo: Partido de Fútbol / HIIT Juego',
      subtitle: `Equivalente a ~${eq.equivalentRunningKm} km con sprints intermitentes`,
      modality: 'soccer',
      sessionType: 'soccer',
      strategyTag: 'Cardio Alternativo Fútbol',
      durationMinutes: duration,
      targetDistanceKm: 5.5,
      targetZone: 'Z4',
      targetPace: 'Intermitente juego real',
      cardioPoints: eq.cardioPoints,
      metMinutes: eq.metMinutes,
      trimp: eq.trimp,
      estimatedCalories: eq.calories,
      blocks: [
        {
          label: 'Movilidad pre-partido (obligatoria)',
          durationMinutes: 8,
          intensity: 'Activación neuromuscular',
          description: 'Aductores, isquios y desplazamientos laterales antes de golpear balón.',
          zone: 'Z1',
        },
        {
          label: 'Partido de Fútbol (Carga Intermitente)',
          durationMinutes: 52,
          intensity: 'Ráfagas Z4/Z5 + recuperación caminando',
          description: 'FlyRun contabiliza automáticamente este partido como tu sesión intensa del 20% semanal.',
          zone: 'Z4',
        },
      ],
      coachTip: '¡Disfruta el partido! Mañana tocará regeneración suave para equilibrar tus cargas.',
      completed: false,
    };
  }

  if (templateType === 'long_run') {
    const duration = Math.min(75, 38 + profile.level * 4);
    const eq = calculateCardioEquivalence('running', duration, 5, profile.weightKg, profile.sex, profile.vdot);
    const paceStr = profile.level <= 3 ? z1.paceFormatted : `${formatPace(z2.paceMinSecPerKm)} – ${formatPace(z1.paceMaxSecPerKm)} /km`;
    return {
      id: `wk_${dateStr}`,
      date: dateStr,
      dayIndex,
      title: 'Tirada Larga Aeróbica del Lince',
      subtitle: 'Base mitocondrial y resistencia cardiovascular profunda',
      modality: 'running',
      sessionType: 'long_run',
      strategyTag: '80/20 · Base Z1-Z2',
      durationMinutes: duration,
      targetDistanceKm: Number(((duration * 60) / ((z1.paceMinSecPerKm + z1.paceMaxSecPerKm) / 2)).toFixed(1)),
      targetZone: 'Z1',
      targetPace: paceStr,
      cardioPoints: eq.cardioPoints,
      metMinutes: eq.metMinutes,
      trimp: eq.trimp,
      estimatedCalories: eq.calories,
      blocks: [
        {
          label: 'Arranque conservador',
          durationMinutes: 10,
          intensity: 'Z1 muy cómodo',
          description: 'Empieza 15 seg/km más lento de tu objetivo para estabilizar pulsaciones.',
          zone: 'Z1',
        },
        {
          label: 'Cuerpo de tirada aeróbica',
          durationMinutes: duration - 15,
          intensity: `${paceStr} · ${z1.hrMin}–${z2.hrMax} ppm`,
          description: 'Mantén cadencia fluida (170+ ppm si es posible) e hidrátate cada 25 min.',
          zone: 'Z1',
        },
        {
          label: 'Vuelta a la calma',
          durationMinutes: 5,
          intensity: 'Caminata suave',
          description: 'Respira profundo y prioriza carbohidratos + proteína en los siguientes 45 min.',
          zone: 'Z1',
        },
      ],
      coachTip: 'La tirada larga es el pilar que hace crecer tu red capilar. Sin prisa, pero sin pausa.',
      completed: false,
    };
  }

  // Default: easy_z1 rodaje polarizado 80%
  const duration = Math.min(48, 28 + profile.level * 2);
  const eq = calculateCardioEquivalence('running', duration, 4, profile.weightKg, profile.sex, profile.vdot);
  return {
    id: `wk_${dateStr}`,
    date: dateStr,
    dayIndex,
    title: 'Rodaje Aeróbico 80/20 (Zona 1)',
    subtitle: 'Volumen inteligente sin desgaste del sistema nervioso',
    modality: 'running',
    sessionType: 'easy_z1',
    strategyTag: '80/20 · Zona 1',
    durationMinutes: duration,
    targetDistanceKm: Number(((duration * 60) / ((z1.paceMinSecPerKm + z1.paceMaxSecPerKm) / 2)).toFixed(1)),
    targetZone: 'Z1',
    targetPace: z1.paceFormatted,
    cardioPoints: eq.cardioPoints,
    metMinutes: eq.metMinutes,
    trimp: eq.trimp,
    estimatedCalories: eq.calories,
    blocks: [
      {
        label: 'Rodaje continuo en Zona 1',
        durationMinutes: duration,
        intensity: `${z1.paceFormatted} · ${z1.hrMin}–${z1.hrMax} ppm`,
        description: 'Prueba del habla: debes poder mantener una conversación sin jadear. Si subes de pulso, baja el ritmo.',
        zone: 'Z1',
      },
    ],
    coachTip: 'El 80% de tus días deben sentirse así de controlados. Eso te dará alas el día de calidad.',
    completed: false,
  };
}

/**
 * Genera 28 días (4 semanas) desde hoy aplicando:
 * - Días de entrenamiento configurados (2..6)
 * - Estrategia elegida o adecuada al nivel (CaCo vs 80/20)
 * - Alternativa de bici o fútbol si está en preferencias del usuario
 * - Día de Examen Físico programado en el día 14 y día 28
 */
export function generateWeeklyPlan(profile: UserProfile, startDate = new Date()): WorkoutSession[] {
  const zones = calculateTrainingZones(profile.vdot, profile.maxHR, profile.restHR);
  const daysPerWeek = Math.max(2, Math.min(6, profile.trainingDaysPerWeek));
  const prefersBike = profile.preferredModalities.includes('cycling');
  const prefersSoccer = profile.preferredModalities.includes('soccer');

  // Patrones semanales científicos según frecuencia (índice 0 = hoy)
  const buildWeekPattern = (weekNum: number): SessionType[] => {
    const isBeginner = profile.level <= 2 || profile.preferredStrategyId === 'caco_progressive';
    const baseEasy: SessionType = isBeginner ? 'caco' : 'easy_z1';
    const qualityA: SessionType = isBeginner
      ? 'caco'
      : profile.preferredStrategyId === 'billat_30_30' || weekNum % 2 === 0
      ? 'intervals_z4'
      : 'threshold_z3';
    const altCardio: SessionType = prefersSoccer && weekNum % 2 === 1 ? 'soccer' : prefersBike ? 'cycling' : baseEasy;

    if (daysPerWeek === 2) {
      return [baseEasy, 'rest', 'rest', qualityA, 'rest', 'rest', 'rest'];
    }
    if (daysPerWeek === 3) {
      return [baseEasy, 'rest', qualityA, 'rest', altCardio === baseEasy ? 'long_run' : altCardio, 'rest', 'rest'];
    }
    if (daysPerWeek === 4) {
      return [baseEasy, 'rest', qualityA, 'rest', altCardio, 'long_run', 'rest'];
    }
    if (daysPerWeek === 5) {
      return [baseEasy, qualityA, 'rest', baseEasy, altCardio, 'long_run', 'rest'];
    }
    // 6 días
    return [baseEasy, qualityA, baseEasy, altCardio, 'threshold_z3', 'long_run', 'rest'];
  };

  const plan: WorkoutSession[] = [];
  for (let dayOffset = 0; dayOffset < 28; dayOffset++) {
    const weekNumber = Math.floor(dayOffset / 7) + 1;
    const dayInWeek = dayOffset % 7;
    const pattern = buildWeekPattern(weekNumber);
    let sessionType = pattern[dayInWeek];

    // Programar Exámenes Físicos oficiales el día 13 (fin semana 2) y día 27 (fin semana 4)
    if (dayOffset === 13 || dayOffset === 27) {
      sessionType = 'physical_exam';
    }

    const dateStr = addDaysISO(startDate, dayOffset);
    plan.push(createSessionFromTemplate(profile, zones, dateStr, dayOffset, sessionType, weekNumber));
  }

  return plan;
}

export function swapWorkoutModality(
  workout: WorkoutSession,
  newModality: CardioModality,
  profile: UserProfile
): WorkoutSession {
  const zones = calculateTrainingZones(profile.vdot, profile.maxHR, profile.restHR);
  if (newModality === 'cycling') {
    const targetDuration = Math.round(workout.durationMinutes * 1.25);
    const eq = calculateCardioEquivalence('cycling', targetDuration, 5, profile.weightKg, profile.sex, profile.vdot);
    return {
      ...workout,
      title: `Equivalencia Bici: ${workout.title.split(':')[0]}`,
      subtitle: `Mantiene ${eq.cardioPoints} Puntos Cardio protegiendo articulaciones`,
      modality: 'cycling',
      sessionType: 'cycling',
      strategyTag: 'Equivalencia Ciclismo',
      durationMinutes: targetDuration,
      targetDistanceKm: Number((targetDuration * 0.37).toFixed(1)),
      targetPace: '85–95 rpm · Zona 1-2',
      cardioPoints: eq.cardioPoints,
      metMinutes: eq.metMinutes,
      trimp: eq.trimp,
      estimatedCalories: eq.calories,
      blocks: [
        {
          label: 'Sesión adaptada en bicicleta',
          durationMinutes: targetDuration,
          intensity: `Z1–Z2 · ${zones[0].hrMin}–${zones[1].hrMax} ppm`,
          description: `Sustituye el impacto de carrera igualando el gasto aeróbico (${eq.metMinutes} MET-min).`,
          zone: 'Z2',
        },
      ],
      coachTip: 'Excelente decisión si notas las piernas cargadas o quieres variedad sin perder carga aeróbica.',
    };
  }

  if (newModality === 'soccer') {
    const eq = calculateCardioEquivalence('soccer', 60, 7, profile.weightKg, profile.sex, profile.vdot);
    return {
      ...workout,
      title: 'Equivalencia Partido de Fútbol',
      subtitle: `Equivale a ${eq.equivalentRunningKm} km de running con carga intermitente`,
      modality: 'soccer',
      sessionType: 'soccer',
      strategyTag: 'Equivalencia Fútbol HIIT',
      durationMinutes: 60,
      targetDistanceKm: 5.5,
      targetZone: 'Z4',
      targetPace: 'Sprints y recuperación',
      cardioPoints: eq.cardioPoints,
      metMinutes: eq.metMinutes,
      trimp: eq.trimp,
      estimatedCalories: eq.calories,
      blocks: [
        {
          label: 'Calentamiento articular + Partido 60 min',
          durationMinutes: 60,
          intensity: 'Intermitente Z3–Z5',
          description: `Cuenta como sesión intensa del 20% semanal (${eq.cardioPoints} Puntos Cardio).`,
          zone: 'Z4',
        },
      ],
      coachTip: 'Partido contabilizado en tu microciclo. Hidrátate bien y repón carbohidratos al terminar.',
    };
  }

  if (newModality === 'walking') {
    const targetDuration = Math.max(40, Math.round(workout.durationMinutes * 1.4));
    const eq = calculateCardioEquivalence('walking', targetDuration, 4, profile.weightKg, profile.sex, profile.vdot);
    return {
      ...workout,
      title: 'Caminata Enérgica Equivalente',
      subtitle: `${eq.cardioPoints} Puntos Cardio · 0% riesgo de impacto`,
      modality: 'walking',
      sessionType: 'active_walk',
      strategyTag: 'Equivalencia Caminata',
      durationMinutes: targetDuration,
      targetDistanceKm: Number((targetDuration * 0.095).toFixed(1)),
      targetZone: 'Z1',
      targetPace: '9:30 – 10:30 /km',
      cardioPoints: eq.cardioPoints,
      metMinutes: eq.metMinutes,
      trimp: eq.trimp,
      estimatedCalories: eq.calories,
      blocks: [
        {
          label: 'Caminata a paso firme',
          durationMinutes: targetDuration,
          intensity: 'Z1 · Paso rápido con braceo',
          description: 'Ideal para días de cansancio elevado o para sumar pasos hacia tu meta de Google Fit.',
          zone: 'Z1',
        },
      ],
      coachTip: 'Caminar rápido suma salud mitocondrial y mantiene viva tu racha diaria.',
    };
  }

  return createSessionFromTemplate(
    profile,
    zones,
    workout.date,
    workout.dayIndex,
    profile.level <= 2 ? 'caco' : 'easy_z1',
    Math.floor(workout.dayIndex / 7) + 1
  );
}

/**
 * Actualización progresiva automática tras completar un entrenamiento:
 * - Suma XP y Puntos Cardio
 * - Ajusta sutilmente el VDOT (+0.1 a +0.6) si el usuario rinde bien con RPE moderado
 */
export function evaluateProgressiveLevelUpdate(
  profile: UserProfile,
  workout: WorkoutSession,
  rpe: number,
  actualDurationMinutes: number
): {
  updatedProfile: UserProfile;
  vdotDelta: number;
  xpEarned: number;
  leveledUp: boolean;
  newBadges: string[];
} {
  const eq = calculateCardioEquivalence(
    workout.completedModality ?? workout.modality,
    actualDurationMinutes,
    rpe,
    profile.weightKg,
    profile.sex,
    profile.vdot
  );

  // Si completó con buena sensación (RPE <= 6) o aguantó todo el bloque, progresa el VDOT gradualmente
  let vdotDelta = 0.1;
  if (rpe <= 5 && actualDurationMinutes >= workout.durationMinutes) {
    vdotDelta = 0.4;
  } else if (rpe <= 7 && actualDurationMinutes >= workout.durationMinutes * 0.9) {
    vdotDelta = 0.25;
  }

  const nextVdot = Number(Math.min(76, profile.vdot + vdotDelta).toFixed(1));
  const xpEarned = Math.round(eq.cardioPoints * 1.4 + (actualDurationMinutes >= workout.durationMinutes ? 40 : 15));
  const nextXp = profile.xp + xpEarned;
  const nextStreak = profile.streakDays + 1;

  const prevLevel = profile.level;
  const levelInfo = getLynxLevel(nextVdot, nextXp);

  const newBadges = [...profile.unlockedBadges];
  const unlock = (id: string) => {
    if (!newBadges.includes(id)) newBadges.push(id);
  };

  unlock('first_workout');
  if ((workout.completedModality ?? workout.modality) !== 'running' && (workout.completedModality ?? workout.modality) !== 'walking') {
    unlock('multi_cardio');
  }
  if (nextStreak >= 3) {
    unlock('streak_3');
  }
  if (levelInfo.level >= 5) {
    unlock('level_5');
  }

  const updatedProfile: UserProfile = {
    ...profile,
    vdot: nextVdot,
    xp: nextXp,
    level: levelInfo.level,
    streakDays: nextStreak,
    totalCardioPoints: profile.totalCardioPoints + eq.cardioPoints,
    unlockedBadges: newBadges,
    updatedAt: new Date().toISOString(),
  };

  return {
    updatedProfile,
    vdotDelta,
    xpEarned,
    leveledUp: levelInfo.level > prevLevel,
    newBadges: newBadges.filter((b) => !profile.unlockedBadges.includes(b)),
  };
}

export function applyPhysicalExamResult(
  profile: UserProfile,
  examType: PhysicalExamType,
  rawValue: number,
  secondaryValue?: number,
  heartRateBpm?: number
): {
  updatedProfile: UserProfile;
  examResult: PhysicalExamResult;
  leveledUp: boolean;
} {
  const newVdot = calculateVDOTFromExam(examType, rawValue, {
    secondaryValue,
    heartRateBpm,
    age: profile.age,
    weightKg: profile.weightKg,
    sex: profile.sex,
  });

  // Promediamos con suavidad si el examen anterior era cercano, o adoptamos la marca objetiva
  const blendedVdot = Number(Math.max(20, newVdot).toFixed(1));
  const xpBonus = 220;
  const nextXp = profile.xp + xpBonus;
  const newLevelInfo = getLynxLevel(blendedVdot, nextXp);

  const unlockedBadges = profile.unlockedBadges.includes('exam_completed')
    ? profile.unlockedBadges
    : [...profile.unlockedBadges, 'exam_completed'];

  if (newLevelInfo.level >= 5 && !unlockedBadges.includes('level_5')) {
    unlockedBadges.push('level_5');
  }

  const labels: Record<PhysicalExamType, string> = {
    cooper_12min: `Test de Cooper 12 min (${rawValue} m)`,
    time_trial_5k: `Contrarreloj 5K (${rawValue} min)`,
    rockport_walk_1600m: `Test Rockport 1.6 km (${rawValue} min, ${heartRateBpm ?? 135} ppm)`,
    caco_continuous_test: `Test Continuo Base (${rawValue} min sin parar)`,
  };

  const examResult: PhysicalExamResult = {
    id: `exam_${Date.now()}`,
    date: new Date().toISOString().slice(0, 10),
    examType,
    rawValue,
    secondaryValue,
    heartRateBpm,
    calculatedVdot: blendedVdot,
    previousVdot: profile.vdot,
    newLevel: newLevelInfo.level,
    previousLevel: profile.level,
    summary: `${labels[examType]} → VDOT ${blendedVdot} · Nivel ${newLevelInfo.level} (${newLevelInfo.spanishTitle})`,
  };

  const updatedProfile: UserProfile = {
    ...profile,
    vdot: blendedVdot,
    level: newLevelInfo.level,
    xp: nextXp,
    unlockedBadges,
    updatedAt: new Date().toISOString(),
  };

  return {
    updatedProfile,
    examResult,
    leveledUp: newLevelInfo.level > profile.level,
  };
}
