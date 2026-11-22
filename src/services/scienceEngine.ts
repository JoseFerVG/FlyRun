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
    title: 'Adaptation Base',
    spanishTitle: 'Iniciación y Adaptación',
    minVdot: 20,
    minXp: 0,
    badgeColor: '#64748b',
    lynxQuote: 'Empezamos alternando tramos cortos de trote y caminata para que tendones y articulaciones se fortalezcan sin molestias.',
  },
  {
    level: 2,
    title: 'CaCo Foundation',
    spanishTitle: 'Base CaCo',
    minVdot: 26,
    minXp: 350,
    badgeColor: '#2563eb',
    lynxQuote: 'Tu corazón ya responde bien. Seguimos ampliando poco a poco el tiempo corriendo sin perder comodidad al respirar.',
  },
  {
    level: 3,
    title: 'Aerobic Continuity',
    spanishTitle: 'Continuidad Aeróbica',
    minVdot: 31,
    minXp: 800,
    badgeColor: '#186a4b',
    lynxQuote: 'Ya sostienes carrera continua. A partir de aquí estructuramos la semana con el reparto 80/20.',
  },
  {
    level: 4,
    title: 'Consistent Runner',
    spanishTitle: 'Corredor Consistente',
    minVdot: 36,
    minXp: 1400,
    badgeColor: '#15803d',
    lynxQuote: 'Tu base aeróbica es sólida. Empezamos a introducir bloques controlados en Zona 3 para mejorar tu umbral.',
  },
  {
    level: 5,
    title: 'Threshold Pace',
    spanishTitle: 'Ritmo de Umbral',
    minVdot: 41,
    minXp: 2200,
    badgeColor: '#b45309',
    lynxQuote: 'Nivel intermedio-alto. Combina tus rodajes suaves en Zona 1 con series cortas para seguir subiendo el VO2max.',
  },
  {
    level: 6,
    title: 'Advanced Mid-Distance',
    spanishTitle: 'Mediofondo Avanzado',
    minVdot: 46,
    minXp: 3200,
    badgeColor: '#d94814',
    lynxQuote: 'Tus ritmos ya son exigentes. Cuida tanto la hidratación como el descanso entre sesiones intensas.',
  },
  {
    level: 7,
    title: 'Competitive Fitness',
    spanishTitle: 'Rendimiento Competitivo',
    minVdot: 51,
    minXp: 4500,
    badgeColor: '#c2410c',
    lynxQuote: 'Buen motor aeróbico. Ajusta la ingesta de carbohidratos los días de series o partido para rendir al máximo.',
  },
  {
    level: 8,
    title: 'High Performance',
    spanishTitle: 'Alto Rendimiento',
    minVdot: 56,
    minXp: 6000,
    badgeColor: '#7c3aed',
    lynxQuote: 'Economía de carrera muy afinada. Cada sesión intensa tiene un objetivo claro y suficiente recuperación detrás.',
  },
  {
    level: 9,
    title: 'Amateur Elite',
    spanishTitle: 'Élite Amateur',
    minVdot: 62,
    minXp: 8000,
    badgeColor: '#0f766e',
    lynxQuote: 'Capacidad cardiovascular sobresaliente. Mantén la precisión en las zonas sin pasarte en los rodajes suaves.',
  },
  {
    level: 10,
    title: 'Peak Conditioning',
    spanishTitle: 'Rendimiento Máximo',
    minVdot: 68,
    minXp: 10500,
    badgeColor: '#121417',
    lynxQuote: 'Techo máximo de la escala. Mantén la constancia semanal y utiliza los test periódicos para ajustar ritmos al segundo.',
  },
];

export type SpeedUnit = 'kmh' | 'km_min' | 'min_km';

export function formatPace(secPerKm: number): string {
  const clamped = Math.max(120, Math.min(900, Math.round(secPerKm)));
  const min = Math.floor(clamped / 60);
  const sec = clamped % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export function secPerKmToKmh(secPerKm: number): number {
  return Number((3600 / Math.max(120, secPerKm)).toFixed(1));
}

export function secPerKmToKmPerMin(secPerKm: number): number {
  return Number((60 / Math.max(120, secPerKm)).toFixed(3));
}

export function kmhToSecPerKm(kmh: number): number {
  return Math.round(3600 / Math.max(2.5, Math.min(30, kmh)));
}

export function kmPerMinToSecPerKm(kmPerMin: number): number {
  return Math.round(60 / Math.max(0.04, Math.min(0.5, kmPerMin)));
}

export function minPerKmToSecPerKm(minPerKm: number): number {
  return Math.round(Math.max(2, Math.min(25, minPerKm)) * 60);
}

export function formatSpeedKmh(secPerKm: number): string {
  return `${secPerKmToKmh(secPerKm).toFixed(1).replace('.', ',')} km/h`;
}

export function formatSpeedKmMin(secPerKm: number): string {
  return `${secPerKmToKmPerMin(secPerKm).toFixed(3).replace('.', ',')} km/min`;
}

export function secPerKmToPaceMinSec(secPerKm: number): { mins: number; secs: number } {
  const clamped = Math.max(120, Math.min(900, Math.round(secPerKm)));
  return {
    mins: Math.floor(clamped / 60),
    secs: clamped % 60,
  };
}

export function paceMinSecToSecPerKm(mins: number, secs: number): number {
  const m = Math.max(2, Math.min(20, Math.floor(Number.isFinite(mins) ? mins : 6)));
  const s = Math.max(0, Math.min(59, Math.round(Number.isFinite(secs) ? secs : 0)));
  return m * 60 + s;
}

export function vdotToEstimatedKmh(vdot: number): number {
  const cooperMeters = 504.9 + 44.73 * Math.max(20, Math.min(72, vdot));
  return Number(((cooperMeters / 1000) * 5).toFixed(1));
}

export function convertSpeedValue(
  value: number,
  fromUnit: SpeedUnit
): {
  secPerKm: number;
  kmh: number;
  kmPerMin: number;
  minPerKmDecimal: number;
  paceFormatted: string;
} {
  const safeVal = Number.isFinite(value) && value > 0 ? value : fromUnit === 'kmh' ? 10 : fromUnit === 'km_min' ? 0.167 : 6;
  const secPerKm =
    fromUnit === 'kmh'
      ? kmhToSecPerKm(safeVal)
      : fromUnit === 'km_min'
      ? kmPerMinToSecPerKm(safeVal)
      : minPerKmToSecPerKm(safeVal);
  return {
    secPerKm,
    kmh: secPerKmToKmh(secPerKm),
    kmPerMin: secPerKmToKmPerMin(secPerKm),
    minPerKmDecimal: Number((secPerKm / 60).toFixed(2)),
    paceFormatted: formatPace(secPerKm),
  };
}

export function calculateVDOTFromSpeed(
  speedUnit: SpeedUnit,
  speedValue: number,
  durationMinutes: number
): {
  vdot: number;
  distanceMeters: number;
  speedKmh: number;
  speedKmMin: number;
  paceFormatted: string;
  secPerKm: number;
} {
  const conv = convertSpeedValue(speedValue, speedUnit);
  const safeDur = Math.max(3, Math.min(90, Number.isFinite(durationMinutes) ? durationMinutes : 12));
  const metersPerMin = 1000 / Math.max(2, conv.secPerKm / 60);
  const distanceMeters = Math.round(metersPerMin * safeDur);
  const vdot = calculateDanielsVDOT(distanceMeters, safeDur);
  return {
    vdot,
    distanceMeters,
    speedKmh: conv.kmh,
    speedKmMin: conv.kmPerMin,
    paceFormatted: conv.paceFormatted,
    secPerKm: conv.secPerKm,
  };
}

export function estimateMaxHR(age: number): number {
  return Math.round(208 - 0.7 * Math.max(14, Math.min(90, age)));
}

export function calculateDanielsVDOT(distanceMeters: number, timeMinutes: number): number {
  const safeDist = Math.max(400, distanceMeters);
  const safeTime = Math.max(2, timeMinutes);
  const velocity = safeDist / safeTime;
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
    const cooperVo2 = (rawValue - 504.9) / 44.73;
    const daniels = calculateDanielsVDOT(rawValue, 12);
    const blended = cooperVo2 * 0.45 + daniels * 0.55;
    return Number(Math.max(20, Math.min(76, blended)).toFixed(1));
  }

  if (examType === 'time_trial_5k') {
    return calculateDanielsVDOT(5000, Math.max(13, Math.min(60, rawValue)));
  }

  if (examType === 'rockport_walk_1600m') {
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

function paceAtVO2Fraction(vdot: number, fraction: number): number {
  const targetVo2 = vdot * fraction;
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
      name: 'Aeróbico Suave',
      danielsCode: 'E-Pace (Easy)',
      vo2PctRange: '60–74% VO2max',
      paceMinSecPerKm: z1Fast,
      paceMaxSecPerKm: z1Slow,
      paceFormatted: `${formatPace(z1Fast)}–${formatPace(z1Slow)} /km`,
      speedKmhFormatted: `${secPerKmToKmh(z1Slow).toFixed(1).replace('.', ',')}–${secPerKmToKmh(z1Fast).toFixed(1).replace('.', ',')} km/h`,
      speedKmMinFormatted: `${secPerKmToKmPerMin(z1Slow).toFixed(3).replace('.', ',')}–${secPerKmToKmPerMin(z1Fast).toFixed(3).replace('.', ',')} km/min`,
      hrMin: hrAt(0.58),
      hrMax: hrAt(0.72),
      purpose: 'Base aeróbica, capilarización y recuperación sin fatiga (80% del volumen semanal).',
      color: '#186a4b',
    },
    {
      id: 'Z2',
      name: 'Aeróbico Estable',
      danielsCode: 'M-Pace',
      vo2PctRange: '75–82% VO2max',
      paceMinSecPerKm: z2Fast,
      paceMaxSecPerKm: z2Slow,
      paceFormatted: `${formatPace(z2Fast)}–${formatPace(z2Slow)} /km`,
      speedKmhFormatted: `${secPerKmToKmh(z2Slow).toFixed(1).replace('.', ',')}–${secPerKmToKmh(z2Fast).toFixed(1).replace('.', ',')} km/h`,
      speedKmMinFormatted: `${secPerKmToKmPerMin(z2Slow).toFixed(3).replace('.', ',')}–${secPerKmToKmPerMin(z2Fast).toFixed(3).replace('.', ',')} km/min`,
      hrMin: hrAt(0.73),
      hrMax: hrAt(0.81),
      purpose: 'Ritmo sostenido cómodo y economía de glucógeno.',
      color: '#2563eb',
    },
    {
      id: 'Z3',
      name: 'Umbral de Lactato',
      danielsCode: 'T-Pace (Threshold)',
      vo2PctRange: '83–89% VO2max',
      paceMinSecPerKm: z3Fast,
      paceMaxSecPerKm: z3Slow,
      paceFormatted: `${formatPace(z3Fast)}–${formatPace(z3Slow)} /km`,
      speedKmhFormatted: `${secPerKmToKmh(z3Slow).toFixed(1).replace('.', ',')}–${secPerKmToKmh(z3Fast).toFixed(1).replace('.', ',')} km/h`,
      speedKmMinFormatted: `${secPerKmToKmPerMin(z3Slow).toFixed(3).replace('.', ',')}–${secPerKmToKmPerMin(z3Fast).toFixed(3).replace('.', ',')} km/min`,
      hrMin: hrAt(0.82),
      hrMax: hrAt(0.88),
      purpose: 'Eleva tu segundo umbral (VT2) para sostener ritmos vivos sin saturar las piernas.',
      color: '#b45309',
    },
    {
      id: 'Z4',
      name: 'Intervalos VO2max',
      danielsCode: 'I-Pace (Interval)',
      vo2PctRange: '94–100% VO2max',
      paceMinSecPerKm: z4Fast,
      paceMaxSecPerKm: z4Slow,
      paceFormatted: `${formatPace(z4Fast)}–${formatPace(z4Slow)} /km`,
      speedKmhFormatted: `${secPerKmToKmh(z4Slow).toFixed(1).replace('.', ',')}–${secPerKmToKmh(z4Fast).toFixed(1).replace('.', ',')} km/h`,
      speedKmMinFormatted: `${secPerKmToKmPerMin(z4Slow).toFixed(3).replace('.', ',')}–${secPerKmToKmPerMin(z4Fast).toFixed(3).replace('.', ',')} km/min`,
      hrMin: hrAt(0.89),
      hrMax: hrAt(0.96),
      purpose: 'Mejora el volumen sistólico cardíaco y tu consumo máximo de oxígeno.',
      color: '#d94814',
    },
    {
      id: 'Z5',
      name: 'Velocidad Neuromuscular',
      danielsCode: 'R-Pace (Repetition)',
      vo2PctRange: '>104% VO2max',
      paceMinSecPerKm: z5Fast,
      paceMaxSecPerKm: z5Slow,
      paceFormatted: `${formatPace(z5Fast)}–${formatPace(z5Slow)} /km`,
      speedKmhFormatted: `${secPerKmToKmh(z5Slow).toFixed(1).replace('.', ',')}–${secPerKmToKmh(z5Fast).toFixed(1).replace('.', ',')} km/h`,
      speedKmMinFormatted: `${secPerKmToKmPerMin(z5Slow).toFixed(3).replace('.', ',')}–${secPerKmToKmPerMin(z5Fast).toFixed(3).replace('.', ',')} km/min`,
      hrMin: hrAt(0.95),
      hrMax: maxHR,
      purpose: 'Eficiencia mecánica de zancada y velocidad punta.',
      color: '#b91c1c',
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
    impact: '1.0x (Referencia estándar)',
    effect: 'Máxima especificidad de carrera, economía neuromuscular y densidad mitocondrial.',
  },
  cycling: {
    label: 'Ciclismo (Ruta o Estática)',
    baseMet: 5.5,
    rpeSlope: 0.55,
    impact: '0.15x (Bajo impacto articular)',
    effect: 'Estímulo aeróbico central y fuerza de cuádriceps protegiendo rodillas y tobillos.',
  },
  soccer: {
    label: 'Partido de Fútbol',
    baseMet: 7.0,
    rpeSlope: 0.52,
    impact: '1.25x (Cambios de dirección y sprints)',
    effect: 'Carga intermitente tipo Fartlek: picos de VO2max, aceleraciones y gasto anaeróbico.',
  },
  walking: {
    label: 'Caminata Activa',
    baseMet: 3.3,
    rpeSlope: 0.35,
    impact: '0.3x (Recuperación suave)',
    effect: 'Capilarización ligera y movimiento diario sin fatiga del sistema nervioso.',
  },
  swimming: {
    label: 'Natación / Elíptica',
    baseMet: 6.0,
    rpeSlope: 0.52,
    impact: '0.1x (Descarga total)',
    effect: 'Trabajo respiratorio y descarga completa del tren inferior.',
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

  const deltaHR = Math.max(0.28, Math.min(0.95, 0.25 + safeRPE * 0.068));
  const b = sex === 'female' ? 1.67 : 1.92;
  const trimp = Math.round(safeDuration * deltaHR * 0.64 * Math.exp(b * deltaHR));
  const cardioPoints = Math.round(metMinutes * 0.16 + trimp * 0.55);
  const calories = Math.round(((effectiveMets * 3.5 * weightKg) / 200) * safeDuration);

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

export interface CustomRoutineConfig {
  presetType: 'caco' | 'intervals_z4' | 'threshold_z3' | 'easy_z1' | 'long_run';
  rounds: number;
  workMin: number;
  restMin: number;
  warmupMin: number;
  cooldownMin: number;
}

function buildCaCoBlocks(
  runMin: number,
  walkMin: number,
  rounds: number,
  warmupMin: number,
  cooldownMin: number,
  z1: TrainingZone
): WorkoutBlock[] {
  const safeRounds = Math.max(1, Math.min(4, rounds));
  const blocks: WorkoutBlock[] = [
    {
      label: 'Calentamiento activo',
      durationMinutes: Math.max(3, warmupMin),
      intensity: 'Caminata ligera · 5,5–6,0 km/h (0,095 km/min)',
      description: 'Movilidad articular de tobillos y caminata progresiva.',
      zone: 'Z1',
    },
  ];

  for (let i = 1; i <= safeRounds; i++) {
    blocks.push({
      label: `Serie ${i}/${safeRounds} · Correr`,
      durationMinutes: Math.max(1, runMin),
      intensity: `${z1.paceFormatted} · ${z1.speedKmhFormatted} (${z1.speedKmMinFormatted})`,
      description: `Trote suave conversacional (${z1.hrMin}–${z1.hrMax} ppm).`,
      zone: 'Z2',
    });
    blocks.push({
      label: `Serie ${i}/${safeRounds} · Caminar`,
      durationMinutes: Math.max(1, walkMin),
      intensity: 'Paso ligero · 5,5–6,2 km/h (0,095 km/min)',
      description: 'Camina con soltura para estabilizar la respiración antes del siguiente trote.',
      zone: 'Z1',
    });
  }

  blocks.push({
    label: 'Enfriamiento',
    durationMinutes: Math.max(3, cooldownMin),
    intensity: 'Paseo tranquilo · < 5,5 km/h',
    description: 'Camina suave los últimos minutos para bajar pulsaciones.',
    zone: 'Z1',
  });

  return blocks.slice(0, 10);
}

function buildIntervalBlocks(
  kind: 'intervals_z4' | 'threshold_z3',
  workMin: number,
  restMin: number,
  rounds: number,
  warmupMin: number,
  cooldownMin: number,
  z1: TrainingZone,
  workZone: TrainingZone
): WorkoutBlock[] {
  const safeRounds = Math.max(1, Math.min(4, rounds));
  const blocks: WorkoutBlock[] = [
    {
      label: 'Calentamiento progresivo Z1',
      durationMinutes: Math.max(5, warmupMin),
      intensity: `${z1.paceFormatted} · ${z1.speedKmhFormatted}`,
      description: 'Rodaje suave + 2 progresivos cortos para preparar piernas y pulso.',
      zone: 'Z1',
    },
  ];

  for (let i = 1; i <= safeRounds; i++) {
    blocks.push({
      label: kind === 'intervals_z4' ? `Serie ${i}/${safeRounds} · VO2max Z4` : `Umbral ${i}/${safeRounds} · Z3`,
      durationMinutes: Math.max(1, workMin),
      intensity: `${workZone.paceFormatted} · ${workZone.speedKmhFormatted} (${workZone.speedKmMinFormatted})`,
      description:
        kind === 'intervals_z4'
          ? `Esfuerzo fuerte controlado (${workZone.hrMin}–${workZone.hrMax} ppm).`
          : `Ritmo vivo sostenido sin llegar al sprint (${workZone.hrMin}–${workZone.hrMax} ppm).`,
      zone: workZone.id,
    });
    if (i < safeRounds && blocks.length < 9) {
      blocks.push({
        label: `Recuperación ${i}/${safeRounds - 1} · Z1`,
        durationMinutes: Math.max(1, restMin),
        intensity: `${z1.paceFormatted} · Trote suave / caminata`,
        description: 'Recupera respiración y suelta piernas sin pararte en seco.',
        zone: 'Z1',
      });
    }
  }

  blocks.push({
    label: 'Vuelta a la calma',
    durationMinutes: Math.max(5, cooldownMin),
    intensity: `${z1.paceFormatted} · Trote muy suave`,
    description: 'Enfriamiento progresivo hasta estabilizar pulsaciones.',
    zone: 'Z1',
  });

  return blocks.slice(0, 10);
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
      title: 'Descanso Activo y Caminata',
      subtitle: 'Asimilación de carga y movilidad suave',
      modality: 'walking',
      sessionType: 'rest',
      strategyTag: 'Recuperación',
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
          label: 'Caminata ligera + movilidad',
          durationMinutes: 25,
          intensity: '40–55% FCmax',
          description: `Completa tus ${profile.dailyStepsTarget.toLocaleString('es-ES')} pasos diarios sin impacto de carrera.`,
          zone: 'Z1',
        },
      ],
      coachTip: 'Hoy no toca sumar fatiga: caminar suave favorece el retorno venoso y consolida el trabajo de ayer.',
      completed: false,
    };
  }

  if (templateType === 'physical_exam') {
    const eq = calculateCardioEquivalence('running', 28, 8, profile.weightKg, profile.sex, profile.vdot);
    const examDesc =
      profile.level <= 2
        ? 'Caminata rápida de 1,6 km (Test Rockport) o prueba continua para medir tu estado actual.'
        : 'Test de Cooper (12 minutos al mayor ritmo constante que puedas sostener) o contrarreloj de 5 km.';
    return {
      id: `wk_${dateStr}`,
      date: dateStr,
      dayIndex,
      title: 'Día de Examen Físico',
      subtitle: 'Evaluación periódica para recalibrar VDOT y ritmos',
      modality: 'running',
      sessionType: 'physical_exam',
      strategyTag: 'Evaluación',
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
          label: 'Calentamiento progresivo',
          durationMinutes: 10,
          intensity: 'Z1 suave + 3 progresivos de 15 s',
          description: 'Prepara temperatura muscular sin llegar cansado al bloque principal.',
          zone: 'Z1',
        },
        {
          label: 'Bloque de Test Oficial',
          durationMinutes: 12,
          intensity: 'Esfuerzo constante (RPE 8-9/10)',
          description: examDesc,
          zone: 'Z4',
        },
        {
          label: 'Vuelta a la calma',
          durationMinutes: 6,
          intensity: 'Caminata suave',
          description: 'Registra tu marca en la pestaña "Datos y Examen" para actualizar tu nivel.',
          zone: 'Z1',
        },
      ],
      coachTip: 'Sal con control los primeros 3 minutos para no pinchar al final; queremos una medida real de tu nivel.',
      completed: false,
      isExamDay: true,
    };
  }

  if (templateType === 'caco' || (isLowLevel && templateType === 'easy_z1')) {
    const runMin = Math.min(5, 1 + weekNumber + (profile.level - 1));
    const walkMin = Math.max(2, 7 - weekNumber - (profile.level - 1));
    const rounds = 4;
    const blocks = buildCaCoBlocks(runMin, walkMin, rounds, 5, 5, z1);
    const totalMinutes = blocks.reduce((acc, b) => acc + b.durationMinutes, 0);
    const eq = calculateCardioEquivalence('running', totalMinutes, 5, profile.weightKg, profile.sex, profile.vdot);
    return {
      id: `wk_${dateStr}`,
      date: dateStr,
      dayIndex,
      title: `Sesión CaCo: ${runMin}' Correr / ${walkMin}' Andar`,
      subtitle: `${rounds} series alternas guiadas por tramos con calentamiento y enfriamiento`,
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
      coachTip: 'Si acabas con la sensación de poder hacer un bloque más, el ritmo ha sido el correcto.',
      completed: false,
    };
  }

  if (templateType === 'threshold_z3') {
    const rounds = 3;
    const workMin = 6;
    const restMin = 2;
    const cooldownMin = Math.max(6, Math.min(12, 6 + profile.level));
    const blocks = buildIntervalBlocks('threshold_z3', workMin, restMin, rounds, 10, cooldownMin, z1, z3);
    const duration = blocks.reduce((acc, b) => acc + b.durationMinutes, 0);
    const eq = calculateCardioEquivalence('running', duration, 7, profile.weightKg, profile.sex, profile.vdot);
    return {
      id: `wk_${dateStr}`,
      date: dateStr,
      dayIndex,
      title: 'Bloques de Umbral (3 x 6 min en Z3)',
      subtitle: 'Alternancia cronometrada Z3/Z1 para elevar tu ritmo sostenible',
      modality: 'running',
      sessionType: 'threshold_z3',
      strategyTag: '80/20 · Umbral Z3',
      durationMinutes: duration,
      targetDistanceKm: Number(((duration * 60) / z3.paceMinSecPerKm * 0.88).toFixed(1)),
      targetZone: 'Z3',
      targetPace: z3.paceFormatted,
      cardioPoints: eq.cardioPoints,
      metMinutes: eq.metMinutes,
      trimp: eq.trimp,
      estimatedCalories: eq.calories,
      blocks,
      coachTip: 'Controla los primeros 2 minutos de cada serie para no salir por encima del ritmo objetivo.',
      completed: false,
    };
  }

  if (templateType === 'intervals_z4') {
    const rounds = 4;
    const workMin = 3;
    const restMin = 2;
    const blocks = buildIntervalBlocks('intervals_z4', workMin, restMin, rounds, 10, 8, z1, z4);
    const duration = blocks.reduce((acc, b) => acc + b.durationMinutes, 0);
    const eq = calculateCardioEquivalence('running', duration, 8, profile.weightKg, profile.sex, profile.vdot);
    return {
      id: `wk_${dateStr}`,
      date: dateStr,
      dayIndex,
      title: 'Series VO2max en Zona 4 (4 x 3 min)',
      subtitle: '4 bloques intensos en Z4 alternados con recuperación activa en Z1',
      modality: 'running',
      sessionType: 'intervals_z4',
      strategyTag: 'VO2max · Series Z4',
      durationMinutes: duration,
      targetDistanceKm: Number(((duration * 60) / z2.paceMinSecPerKm * 0.92).toFixed(1)),
      targetZone: 'Z4',
      targetPace: z4.paceFormatted,
      cardioPoints: eq.cardioPoints,
      metMinutes: eq.metMinutes,
      trimp: eq.trimp,
      estimatedCalories: eq.calories,
      blocks,
      coachTip: 'Busca regularidad entre la primera y la última repetición en lugar de quemarte en las dos primeras.',
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
      title: 'Ciclismo Aeróbico Equivalente',
      subtitle: `Equivale a ${eq.equivalentRunningKm} km de carrera sin impacto articular`,
      modality: 'cycling',
      sessionType: 'cycling',
      strategyTag: 'Cardio Cruzado Bici',
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
          label: 'Calentamiento en cadencia ágil',
          durationMinutes: 10,
          intensity: 'Z1 ligero · 90 rpm',
          description: 'Pedaleo suave con desarrollo cómodo para activar piernas.',
          zone: 'Z1',
        },
        {
          label: 'Bloque aeróbico continuo',
          durationMinutes: duration - 15,
          intensity: `Z1–Z2 · ${z1.hrMin}–${z2.hrMax} ppm`,
          description: 'Ritmo constante en bici sin atrancarse con desarrollos duros.',
          zone: 'Z2',
        },
        {
          label: 'Soltura final',
          durationMinutes: 5,
          intensity: 'Muy suave',
          description: 'Últimos 5 minutos con resistencia baja.',
          zone: 'Z1',
        },
      ],
      coachTip: 'Buena sesión para acumular trabajo cardiovascular descargando tendones y rodillas.',
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
      title: 'Partido de Fútbol (Equivalencia Cardio)',
      subtitle: `Equivale a ~${eq.equivalentRunningKm} km con cambios de ritmo`,
      modality: 'soccer',
      sessionType: 'soccer',
      strategyTag: 'Cardio Cruzado Fútbol',
      durationMinutes: duration,
      targetDistanceKm: 5.5,
      targetZone: 'Z4',
      targetPace: 'Esfuerzo intermitente',
      cardioPoints: eq.cardioPoints,
      metMinutes: eq.metMinutes,
      trimp: eq.trimp,
      estimatedCalories: eq.calories,
      blocks: [
        {
          label: 'Movilidad pre-partido',
          durationMinutes: 8,
          intensity: 'Activación progresiva',
          description: 'Calienta aductores, isquios y desplazamientos laterales antes de empezar.',
          zone: 'Z1',
        },
        {
          label: 'Partido de fútbol',
          durationMinutes: 52,
          intensity: 'Sprints Z4/Z5 + pausas caminando',
          description: 'Se contabiliza dentro del 20% intenso semanal para evitar sobrecarga.',
          zone: 'Z4',
        },
      ],
      coachTip: 'Al tener esfuerzos repetidos de sprint, mañana te conviene descanso activo o caminata suave.',
      completed: false,
    };
  }

  if (templateType === 'long_run') {
    const duration = Math.min(75, 38 + profile.level * 4);
    const eq = calculateCardioEquivalence('running', duration, 5, profile.weightKg, profile.sex, profile.vdot);
    const paceStr = profile.level <= 3 ? z1.paceFormatted : `${formatPace(z2.paceMinSecPerKm)}–${formatPace(z1.paceMaxSecPerKm)} /km`;
    const mainMinutes = Math.max(18, duration - 13);
    const basePart = Math.round(mainMinutes * 0.65);
    const progPart = mainMinutes - basePart;
    return {
      id: `wk_${dateStr}`,
      date: dateStr,
      dayIndex,
      title: 'Tirada Larga Progresiva',
      subtitle: 'Construcción de resistencia de fondo con cierre en Z2',
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
          label: 'Calentamiento suave Z1',
          durationMinutes: 8,
          intensity: `${z1.paceFormatted} · ${z1.speedKmhFormatted}`,
          description: 'Empieza tranquilo para lubricar articulaciones y estabilizar el pulso.',
          zone: 'Z1',
        },
        {
          label: 'Fondo aeróbico Z1',
          durationMinutes: basePart,
          intensity: `${z1.paceFormatted} · ${z1.speedKmhFormatted} (${z1.speedKmMinFormatted})`,
          description: 'Mantén ritmo cómodo y respiratorio durante el tramo principal.',
          zone: 'Z1',
        },
        {
          label: 'Cierre progresivo Z2',
          durationMinutes: progPart,
          intensity: `${z2.paceFormatted} · ${z2.speedKmhFormatted} (${z2.speedKmMinFormatted})`,
          description: 'Acelera progresivamente a ritmo estable maratón si te notas entero.',
          zone: 'Z2',
        },
        {
          label: 'Vuelta a la calma',
          durationMinutes: 5,
          intensity: 'Caminata suave · < 5,5 km/h',
          description: 'Camina 5 minutos al terminar e hidrátate bien.',
          zone: 'Z1',
        },
      ],
      coachTip: 'Esta sesión es la que más hace crecer tu resistencia de base si respetas el ritmo tranquilo.',
      completed: false,
    };
  }

  const duration = Math.min(48, 28 + profile.level * 2);
  const eq = calculateCardioEquivalence('running', duration, 4, profile.weightKg, profile.sex, profile.vdot);
  const steadyDur = Math.max(14, duration - 11);
  return {
    id: `wk_${dateStr}`,
    date: dateStr,
    dayIndex,
    title: 'Rodaje Suave en Zona 1 (80/20)',
    subtitle: 'Volumen aeróbico estructurado sin fatiga acumulada',
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
        label: 'Activación suave Z1',
        durationMinutes: 6,
        intensity: `${z1.paceFormatted} · Toma de ritmo`,
        description: 'Primeros minutos suaves dejando subir las pulsaciones poco a poco.',
        zone: 'Z1',
      },
      {
        label: 'Rodaje estable Zona 1',
        durationMinutes: steadyDur,
        intensity: `${z1.paceFormatted} · ${z1.speedKmhFormatted} (${z1.speedKmMinFormatted})`,
        description: 'Ritmo conversacional real. Si notas que respiras forzado, baja el ritmo.',
        zone: 'Z1',
      },
      {
        label: 'Soltura final',
        durationMinutes: 5,
        intensity: 'Caminata o trote muy suave',
        description: 'Baja pulso los últimos 5 minutos.',
        zone: 'Z1',
      },
    ],
    coachTip: 'Mantener los días suaves realmente suaves es lo que permite asimilar bien las sesiones exigentes.',
    completed: false,
  };
}

export function generateWeeklyPlan(profile: UserProfile, startDate = new Date()): WorkoutSession[] {
  const zones = calculateTrainingZones(profile.vdot, profile.maxHR, profile.restHR);
  const daysPerWeek = Math.max(2, Math.min(6, profile.trainingDaysPerWeek));
  const prefersBike = profile.preferredModalities.includes('cycling');
  const prefersSoccer = profile.preferredModalities.includes('soccer');

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
    return [baseEasy, qualityA, baseEasy, altCardio, 'threshold_z3', 'long_run', 'rest'];
  };

  const plan: WorkoutSession[] = [];
  for (let dayOffset = 0; dayOffset < 28; dayOffset++) {
    const weekNumber = Math.floor(dayOffset / 7) + 1;
    const dayInWeek = dayOffset % 7;
    const pattern = buildWeekPattern(weekNumber);
    let sessionType = pattern[dayInWeek];

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
      title: `Ciclismo equivalente: ${workout.title.split(':')[0]}`,
      subtitle: `Mantiene ${eq.cardioPoints} Puntos Cardio protegiendo articulaciones`,
      modality: 'cycling',
      sessionType: 'cycling',
      strategyTag: 'Equivalencia Bici',
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
      coachTip: 'Buena opción si notas piernas cargadas o prefieres variar de disciplina sin perder trabajo aeróbico.',
    };
  }

  if (newModality === 'soccer') {
    const eq = calculateCardioEquivalence('soccer', 60, 7, profile.weightKg, profile.sex, profile.vdot);
    return {
      ...workout,
      title: 'Partido de Fútbol (Equivalencia)',
      subtitle: `Equivale a ${eq.equivalentRunningKm} km de carrera con sprints intermitentes`,
      modality: 'soccer',
      sessionType: 'soccer',
      strategyTag: 'Equivalencia Fútbol',
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
          label: 'Calentamiento + Partido 60 min',
          durationMinutes: 60,
          intensity: 'Intermitente Z3–Z5',
          description: `Cuenta como sesión intensa semanal (${eq.cardioPoints} Puntos Cardio).`,
          zone: 'Z4',
        },
      ],
      coachTip: 'Partido contabilizado en tu carga semanal. Hidrátate bien al terminar.',
    };
  }

  if (newModality === 'walking') {
    const targetDuration = Math.max(40, Math.round(workout.durationMinutes * 1.4));
    const eq = calculateCardioEquivalence('walking', targetDuration, 4, profile.weightKg, profile.sex, profile.vdot);
    return {
      ...workout,
      title: 'Caminata Rápida Equivalente',
      subtitle: `${eq.cardioPoints} Puntos Cardio sin impacto`,
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
          label: 'Caminata a ritmo constante',
          durationMinutes: targetDuration,
          intensity: 'Z1 · Paso alegre',
          description: 'Opción recomendada si necesitas descargar fatiga sin quedarte quieto.',
          zone: 'Z1',
        },
      ],
      coachTip: 'Caminar a buen ritmo mantiene la constancia y favorece la recuperación.',
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
  heartRateBpm?: number,
  customSummaryLabel?: string
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
    rockport_walk_1600m: `Test Rockport 1,6 km (${rawValue} min, ${heartRateBpm ?? 135} ppm)`,
    caco_continuous_test: `Test Continuo (${rawValue} min sin parar)`,
  };

  const baseLabel = customSummaryLabel?.trim() || labels[examType];

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
    summary: `${baseLabel} — VDOT ${blendedVdot} · Nivel ${newLevelInfo.level} (${newLevelInfo.spanishTitle})`.slice(0, 480),
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

export interface RacePrediction {
  distanceLabel: string;
  distanceMeters: number;
  timeFormatted: string;
  pacePerKm: string;
  speedKmh: string;
  speedKmMin: string;
  split400m: string;
}

function formatDurationHMS(totalSeconds: number): string {
  const sec = Math.max(1, Math.round(totalSeconds));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function calculateRacePredictions(vdot: number): RacePrediction[] {
  const distances: Array<{ label: string; meters: number; vo2Fraction: number }> = [
    { label: '1.500 m', meters: 1500, vo2Fraction: 1.04 },
    { label: '3.000 m', meters: 3000, vo2Fraction: 0.99 },
    { label: '5 km', meters: 5000, vo2Fraction: 0.945 },
    { label: '10 km', meters: 10000, vo2Fraction: 0.895 },
    { label: 'Media Maratón (21,1 km)', meters: 21097, vo2Fraction: 0.835 },
  ];

  return distances.map((d) => {
    const secPerKm = paceAtVO2Fraction(vdot, d.vo2Fraction);
    const totalSec = (d.meters / 1000) * secPerKm;
    const split400Sec = Math.round(secPerKm * 0.4);
    return {
      distanceLabel: d.label,
      distanceMeters: d.meters,
      timeFormatted: formatDurationHMS(totalSec),
      pacePerKm: `${formatPace(secPerKm)} /km`,
      speedKmh: formatSpeedKmh(secPerKm),
      speedKmMin: formatSpeedKmMin(secPerKm),
      split400m: `${formatDurationHMS(split400Sec)} /400m`,
    };
  });
}

export type DailyReadiness = 'fresh' | 'normal' | 'tired';

export function applyDailyReadinessAdjustment(
  workout: WorkoutSession,
  readiness: DailyReadiness,
  profile: UserProfile
): WorkoutSession {
  if (readiness === 'normal' || workout.completed || workout.sessionType === 'rest') {
    return workout;
  }

  const zones = calculateTrainingZones(profile.vdot, profile.maxHR, profile.restHR);
  const z1 = zones[0];

  if (readiness === 'tired') {
    const mod = workout.modality === 'soccer' ? 'walking' : workout.modality;
    const reducedDuration = Math.max(20, Math.round(workout.durationMinutes * 0.75));
    const eq = calculateCardioEquivalence(mod, reducedDuration, 3, profile.weightKg, profile.sex, profile.vdot);
    return {
      ...workout,
      modality: mod,
      title: `Sesión adaptada por fatiga (${mod === 'cycling' ? 'Bici suave' : mod === 'walking' ? 'Caminata' : 'Rodaje Z1'})`,
      subtitle: 'Intensidad reducida para favorecer recuperación muscular y evitar sobrecarga',
      sessionType: mod === 'walking' ? 'active_walk' : mod === 'cycling' ? 'cycling' : 'easy_z1',
      strategyTag: 'Ajuste fatiga · Z1',
      durationMinutes: reducedDuration,
      targetZone: 'Z1',
      targetPace: mod === 'cycling' ? '80–90 rpm · Z1 suave' : z1.paceFormatted,
      cardioPoints: eq.cardioPoints,
      metMinutes: eq.metMinutes,
      trimp: eq.trimp,
      estimatedCalories: eq.calories,
      blocks: [
        {
          label: mod === 'cycling' ? 'Pedaleo suave regenerativo' : 'Trote muy suave o caminata rápida',
          durationMinutes: reducedDuration,
          intensity: `${mod === 'cycling' ? 'Z1 suave' : z1.paceFormatted} · ${z1.hrMin}–${z1.hrMax} ppm`,
          description: 'Hoy priorizamos descargar piernas (RPE 3-4/10). Si notas pesadez, camina tramos de 2 min.',
          zone: 'Z1',
        },
      ],
      coachTip: 'Escuchar las sensaciones de fatiga hoy evita perder semanas enteras por lesión.',
    };
  }

  // readiness === 'fresh'
  const boostedDuration = Math.min(80, workout.durationMinutes + 6);
  const eq = calculateCardioEquivalence(workout.modality, boostedDuration, 6, profile.weightKg, profile.sex, profile.vdot);
  const updatedBlocks = workout.blocks.map((b, idx) =>
    idx === workout.blocks.length - 1 ? { ...b, durationMinutes: b.durationMinutes + 6 } : b
  );
  return {
    ...workout,
    subtitle: `${workout.subtitle} · Ampliada +6 min por buenas sensaciones`,
    durationMinutes: boostedDuration,
    cardioPoints: eq.cardioPoints,
    metMinutes: eq.metMinutes,
    trimp: eq.trimp,
    estimatedCalories: eq.calories,
    blocks: updatedBlocks,
    coachTip: 'Te notas fresco hoy: añadimos 6 minutos aeróbicos suaves manteniendo el control del pulso.',
  };
}

export function changeCaCoRatio(
  workout: WorkoutSession,
  runMin: number,
  walkMin: number,
  profile: UserProfile
): WorkoutSession {
  const zones = calculateTrainingZones(profile.vdot, profile.maxHR, profile.restHR);
  const z1 = zones[0];
  const rounds = 4;
  const blocks = buildCaCoBlocks(runMin, walkMin, rounds, 5, 5, z1);
  const totalMinutes = blocks.reduce((acc, b) => acc + b.durationMinutes, 0);
  const eq = calculateCardioEquivalence('running', totalMinutes, 5, profile.weightKg, profile.sex, profile.vdot);

  return {
    ...workout,
    title: `Sesión CaCo: ${runMin}' Correr / ${walkMin}' Andar`,
    subtitle: `${rounds} series alternas guiadas para tu comodidad articular`,
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
  };
}

export function customizeWorkoutRoutine(
  workout: WorkoutSession,
  profile: UserProfile,
  config: CustomRoutineConfig
): WorkoutSession {
  const zones = calculateTrainingZones(profile.vdot, profile.maxHR, profile.restHR);
  const z1 = zones[0];
  const z2 = zones[1];
  const z3 = zones[2];
  const z4 = zones[3];

  const rounds = Math.max(1, Math.min(4, Math.round(config.rounds)));
  const workMin = Math.max(1, Math.min(25, Math.round(config.workMin)));
  const restMin = Math.max(1, Math.min(10, Math.round(config.restMin)));
  const warmupMin = Math.max(3, Math.min(15, Math.round(config.warmupMin)));
  const cooldownMin = Math.max(3, Math.min(15, Math.round(config.cooldownMin)));

  if (config.presetType === 'caco') {
    const blocks = buildCaCoBlocks(workMin, restMin, rounds, warmupMin, cooldownMin, z1);
    const totalMin = blocks.reduce((acc, b) => acc + b.durationMinutes, 0);
    const eq = calculateCardioEquivalence('running', totalMin, 5, profile.weightKg, profile.sex, profile.vdot);
    return {
      ...workout,
      modality: 'running',
      sessionType: 'caco',
      strategyTag: `CaCo ${rounds}x(${workMin}'/${restMin}')`,
      title: `CaCo a medida: ${rounds} x (${workMin}' correr / ${restMin}' andar)`,
      subtitle: 'Rutina alterna personalizada lista para el cronómetro guiado',
      durationMinutes: totalMin,
      targetDistanceKm: Number((totalMin * 0.118).toFixed(1)),
      targetZone: 'Z1',
      targetPace: z1.paceFormatted,
      cardioPoints: eq.cardioPoints,
      metMinutes: eq.metMinutes,
      trimp: eq.trimp,
      estimatedCalories: eq.calories,
      blocks,
    };
  }

  if (config.presetType === 'intervals_z4' || config.presetType === 'threshold_z3') {
    const isZ4 = config.presetType === 'intervals_z4';
    const workZone = isZ4 ? z4 : z3;
    const blocks = buildIntervalBlocks(config.presetType, workMin, restMin, rounds, warmupMin, cooldownMin, z1, workZone);
    const totalMin = blocks.reduce((acc, b) => acc + b.durationMinutes, 0);
    const eq = calculateCardioEquivalence('running', totalMin, isZ4 ? 8 : 7, profile.weightKg, profile.sex, profile.vdot);
    return {
      ...workout,
      modality: 'running',
      sessionType: config.presetType,
      strategyTag: isZ4 ? `Series Z4 ${rounds}x${workMin}'` : `Umbral Z3 ${rounds}x${workMin}'`,
      title: isZ4
        ? `Series VO2max: ${rounds} x ${workMin} min Z4`
        : `Bloques de Umbral: ${rounds} x ${workMin} min Z3`,
      subtitle: `Alterna ${workMin} min en ${workZone.id} con ${restMin} min recuperación en Z1`,
      durationMinutes: totalMin,
      targetDistanceKm: Number(((totalMin * 60) / workZone.paceMinSecPerKm * 0.85).toFixed(1)),
      targetZone: workZone.id,
      targetPace: workZone.paceFormatted,
      cardioPoints: eq.cardioPoints,
      metMinutes: eq.metMinutes,
      trimp: eq.trimp,
      estimatedCalories: eq.calories,
      blocks,
    };
  }

  const isLong = config.presetType === 'long_run';
  const mainMinutes = Math.max(12, workMin * rounds);
  const blocks: WorkoutBlock[] = isLong
    ? [
        {
          label: 'Calentamiento suave Z1',
          durationMinutes: warmupMin,
          intensity: `${z1.paceFormatted} · ${z1.speedKmhFormatted}`,
          description: 'Inicio tranquilo para estabilizar pulsaciones.',
          zone: 'Z1',
        },
        {
          label: 'Fondo aeróbico Z1',
          durationMinutes: Math.max(8, Math.round(mainMinutes * 0.65)),
          intensity: `${z1.paceFormatted} · ${z1.speedKmhFormatted} (${z1.speedKmMinFormatted})`,
          description: 'Tramo principal aeróbico cómodo.',
          zone: 'Z1',
        },
        {
          label: 'Cierre progresivo Z2',
          durationMinutes: Math.max(5, mainMinutes - Math.round(mainMinutes * 0.65)),
          intensity: `${z2.paceFormatted} · ${z2.speedKmhFormatted} (${z2.speedKmMinFormatted})`,
          description: 'Final sostenido en Zona 2.',
          zone: 'Z2',
        },
        {
          label: 'Enfriamiento',
          durationMinutes: cooldownMin,
          intensity: 'Caminata suave · < 5,5 km/h',
          description: 'Camina al finalizar.',
          zone: 'Z1',
        },
      ]
    : [
        {
          label: 'Activación suave Z1',
          durationMinutes: warmupMin,
          intensity: `${z1.paceFormatted} · Toma de ritmo`,
          description: 'Trote muy suave para arrancar.',
          zone: 'Z1',
        },
        {
          label: 'Rodaje continuo Z1',
          durationMinutes: mainMinutes,
          intensity: `${z1.paceFormatted} · ${z1.speedKmhFormatted} (${z1.speedKmMinFormatted})`,
          description: 'Ritmo aeróbico conversacional constante.',
          zone: 'Z1',
        },
        {
          label: 'Vuelta a la calma',
          durationMinutes: cooldownMin,
          intensity: 'Paseo tranquilo',
          description: 'Baja pulsaciones antes de terminar.',
          zone: 'Z1',
        },
      ];

  const totalMin = blocks.reduce((acc, b) => acc + b.durationMinutes, 0);
  const eq = calculateCardioEquivalence('running', totalMin, isLong ? 5 : 4, profile.weightKg, profile.sex, profile.vdot);
  return {
    ...workout,
    modality: 'running',
    sessionType: config.presetType,
    strategyTag: isLong ? '80/20 · Tirada Z1-Z2' : '80/20 · Rodaje Z1',
    title: isLong ? `Tirada Larga (${totalMin} min)` : `Rodaje Suave Z1 (${totalMin} min)`,
    subtitle: 'Sesión continua personalizada por bloques',
    durationMinutes: totalMin,
    targetDistanceKm: Number(((totalMin * 60) / z1.paceMinSecPerKm).toFixed(1)),
    targetZone: 'Z1',
    targetPace: z1.paceFormatted,
    cardioPoints: eq.cardioPoints,
    metMinutes: eq.metMinutes,
    trimp: eq.trimp,
    estimatedCalories: eq.calories,
    blocks,
  };
}

export function calculateWeekly8020Balance(workouts: WorkoutSession[]) {
  const week = workouts.slice(0, 7);
  let lowMinutes = 0;
  let highMinutes = 0;

  for (const w of week) {
    if (w.sessionType === 'rest') continue;
    for (const block of w.blocks) {
      if (block.zone === 'Z1' || block.zone === 'Z2') {
        lowMinutes += block.durationMinutes;
      } else {
        highMinutes += block.durationMinutes;
      }
    }
  }

  const total = Math.max(1, lowMinutes + highMinutes);
  const lowPct = Math.round((lowMinutes / total) * 100);
  const highPct = 100 - lowPct;
  return { lowMinutes, highMinutes, lowPct, highPct };
}
