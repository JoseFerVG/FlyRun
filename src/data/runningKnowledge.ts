import type { BadgeDefinition, RunningStrategy } from '../types/fitness';

export interface ScientificTip {
  id: string;
  category: 'Fisiología' | '80/20' | 'Biomecánica' | 'Cardio Cruzado' | 'Nutrición' | 'Recuperación';
  title: string;
  fact: string;
  source: string;
}

export const SCIENTIFIC_LOADING_TIPS: ScientificTip[] = [
  {
    id: 'tip-80-20',
    category: '80/20',
    title: 'Por qué el 80 % de tus rodajes deben ser suaves',
    fact: 'Los corredores que acumulan en torno al 80 % del volumen semanal a ritmo conversacional (Zona 1) y reservan solo el 20 % para series o umbral mejoran más su marca que quienes entrenan siempre a ritmo medio.',
    source: 'Stephen Seiler, Int J Sports Physiol Perform (2010)',
  },
  {
    id: 'tip-caco',
    category: 'Biomecánica',
    title: 'Caminar entre tramos de trote protege los tendones',
    fact: 'El corazón gana capacidad en pocas semanas, pero el colágeno del tendón de Aquiles y la fascia plantar tarda de 8 a 12 semanas en adaptarse. Alternar 2 min corriendo y 6 min caminando evita sobrecargas sin perder estímulo aeróbico.',
    source: 'Galloway Run-Walk-Run & Remodelación Tendinosa',
  },
  {
    id: 'tip-vdot',
    category: 'Fisiología',
    title: 'Qué mide exactamente el índice VDOT',
    fact: 'Dos personas con el mismo VO2max en laboratorio pueden hacer marcas distintas en 5 km. El VDOT combina tu consumo máximo de oxígeno con tu economía de zancada para fijar ritmos realistas.',
    source: 'Jack Daniels & Jimmy Gilbert — Daniels’ Running Formula',
  },
  {
    id: 'tip-mitochondria',
    category: 'Fisiología',
    title: 'La base aeróbica multiplica las mitocondrias',
    fact: 'Correr en Zona 1 aumenta la red capilar del músculo y la densidad mitocondrial. Eso permite utilizar más grasa como energía y retrasar el agotamiento de glucógeno.',
    source: 'Holloszy & Coyle — Bioquímica del Ejercicio',
  },
  {
    id: 'tip-cadence',
    category: 'Biomecánica',
    title: 'Acortar ligeramente la zancada reduce el impacto en rodillas',
    fact: 'Aumentar la cadencia alrededor de un 5 % y evitar apoyar el pie muy adelantado respecto a la cadera disminuye de forma notable las fuerzas de frenado articular.',
    source: 'Heiderscheit et al., Med Sci Sports Exerc',
  },
  {
    id: 'tip-cycling-equiv',
    category: 'Cardio Cruzado',
    title: 'La bicicleta mantiene el motor aeróbico sin castigar articulaciones',
    fact: '45 minutos de ciclismo continuo en Zona 2 generan unos 380–450 MET-minutos y un buen estímulo cardíaco central con apenas un 15 % del impacto mecánico del asfalto.',
    source: 'Compendium of Physical Activities (Ainsworth)',
  },
  {
    id: 'tip-soccer-equiv',
    category: 'Cardio Cruzado',
    title: 'Un partido de fútbol cuenta como trabajo interválico',
    fact: 'En un partido amateur se recorren entre 4 y 7 km con docenas de cambios de ritmo y sprints cortos. En carga fisiológica equivale a una sesión exigente de Fartlek o intervalos.',
    source: 'Jens Bangsbo — Fisiología de Deportes Intermitentes',
  },
  {
    id: 'tip-steps-neat',
    category: 'Recuperación',
    title: 'Caminar todos los días acelera la recuperación entre sesiones',
    fact: 'Mantener una media de 7.500 a 10.000 pasos diarios mejora la sensibilidad a la insulina, favorece el retorno venoso tras días de series y suma gasto calórico sin fatiga nerviosa.',
    source: 'Tudor-Locke & Bassett — Actividad Basada en Pasos',
  },
  {
    id: 'tip-lactate',
    category: 'Fisiología',
    title: 'El lactato se recicla como combustible',
    fact: 'Trabajar en Zona 3 (ritmo de umbral) mejora la capacidad de tus fibras oxidativas y del corazón para captar y reutilizar el lactato antes de que se acumule.',
    source: 'George Brooks — Lactate Shuttle Theory',
  },
  {
    id: 'tip-sleep',
    category: 'Recuperación',
    title: 'Dormir menos de 7 horas dispara el riesgo de lesión',
    fact: 'La síntesis proteica y la reparación tisular ocurren durante el sueño profundo. Descansar poco de forma habitual multiplica la fatiga residual y los dolores musculares.',
    source: 'Milewski et al., J Pediatr Orthop',
  },
  {
    id: 'tip-protein',
    category: 'Nutrición',
    title: 'Cuánta proteína necesita quien corre con regularidad',
    fact: 'El impacto repetido de la carrera exige reparar tejido muscular y enzimas aeróbicas: la evidencia sitúa el rango óptimo entre 1,6 y 1,9 g de proteína por kilo de peso al día.',
    source: 'ISSN Position Stand: Protein & Exercise',
  },
  {
    id: 'tip-billat',
    category: 'Fisiología',
    title: 'Por qué funcionan las series cortas 30-30',
    fact: 'Alternar 30 segundos rápidos con 30 segundos de trote suave mantiene el consumo de oxígeno alto durante varios minutos seguidos con mucha menos sensación de ahogo.',
    source: 'Véronique Billat et al., Sports Medicine',
  },
];

export const RUNNING_STRATEGIES: RunningStrategy[] = [
  {
    id: 'caco_progressive',
    name: 'Método CaCo Progresivo (Caminar y Correr)',
    shortTag: 'Niveles 1–3 · Adaptación segura',
    recommendedLevelMin: 1,
    recommendedLevelMax: 3,
    intensitySplit: '90 % Suave / 10 % Progresión',
    structureExample: 'Semana 1: 4 bloques de (2 min trote + 6 min caminata) · Semana 3: (4 min trote + 2 min caminata)',
    scientificBasis:
      'Cuando empiezas a correr, tu capacidad cardiorrespiratoria mejora antes que tus tendones y articulaciones. Intercalar minutos andando corta el estrés mecánico antes de que la técnica se deteriore.',
    bestFor: 'Personas que empiezan desde cero, vuelven tras un parón prolongado o quieren ganar fondo sin sobrecargas.',
    protocolSteps: [
      'Camina 5 minutos a buen paso para calentar tobillos y rodillas.',
      'Corre 2 minutos a un ritmo en el que puedas hablar sin ahogarte y camina 6 minutos a ritmo vivo.',
      'Repite 4 rondas. No busques ir rápido en los tramos de trote.',
      'Cuando completes la sesión con esfuerzo moderado (RPE 5 o menos), pasa a 3 min trote / 5 min caminata.',
    ],
  },
  {
    id: 'polarized_80_20',
    name: 'Distribución Polarizada 80/20',
    shortTag: 'Niveles 3–10 · Base científica',
    recommendedLevelMin: 3,
    recommendedLevelMax: 10,
    intensitySplit: '80 % Zona 1–2 / 20 % Zona 3–4',
    structureExample: 'En 4 días/semana: 3 rodajes suaves en Zona 1 y 1 sesión de calidad (Umbral o Series).',
    scientificBasis:
      'Evita el error clásico de correr siempre a un ritmo intermedio fatigante. Al separar claramente los días suaves de los días intensos se logra mayor mejora en VO2max y menor riesgo de estancamiento.',
    bestFor: 'Corredores que entrenan de 3 a 6 días por semana y buscan progresar de forma constante.',
    protocolSteps: [
      'Respeta el ritmo lento en los rodajes suaves: debes poder mantener una conversación normal.',
      'Llega descansado a tu día semanal de calidad para poder sostener los ritmos objetivo.',
      'Si juegas un partido de fútbol entre semana, sustituye la sesión intensa para mantener el reparto 80/20.',
    ],
  },
  {
    id: 'daniels_threshold',
    name: 'Ritmo de Umbral y VDOT (Jack Daniels)',
    shortTag: 'Niveles 4–10 · Resistencia sostenida',
    recommendedLevelMin: 4,
    recommendedLevelMax: 10,
    intensitySplit: 'Ritmo T (83–89 % VO2max)',
    structureExample: '10 min suaves + 3 bloques de 6 min a ritmo de umbral (1 min de trote entre bloques) + 10 min vuelta a la calma.',
    scientificBasis:
      'Entrenar alrededor del segundo umbral ventilatorio enseña al organismo a reciclar lactato más deprisa, permitiéndote mantener ritmos altos durante 20 a 60 minutos sin hundirte.',
    bestFor: 'Mejorar marcas personales en 5 km, 10 km y pruebas de resistencia continua.',
    protocolSteps: [
      'Realiza un test de Cooper o 5 km para fijar tu VDOT real.',
      'Mantén un ritmo firme pero controlado: sensación de esfuerzo 7/10, nunca un sprint agónico.',
      'Haz pausas cortas de 1 minuto entre bloques para mantener el estímulo metabólico estable.',
    ],
  },
  {
    id: 'billat_30_30',
    name: 'Intervalos 30-30 para VO2max (Billat)',
    shortTag: 'Niveles 5–10 · Potencia aeróbica',
    recommendedLevelMin: 5,
    recommendedLevelMax: 10,
    intensitySplit: 'Z4 Intervalos + Z1 Activo',
    structureExample: '12 min calentamiento + 2 series de 8 x (30 s rápidos / 30 s trote suave) + 8 min enfriamiento.',
    scientificBasis:
      'Al no detenerte por completo en los 30 segundos de recuperación, el corazón sigue bombeando cerca de su volumen sistólico máximo sin acumular tanta fatiga muscular.',
    bestFor: 'Desbloquear el techo aeróbico y mejorar tiempos en test cortos.',
    protocolSteps: [
      'Calienta al menos 10–12 minutos con trote suave y movilidad.',
      'Corre 30 segundos a ritmo de Zona 4 y baja a trote muy suave otros 30 segundos.',
      'Deja al menos 48 horas suaves antes de la siguiente sesión exigente.',
    ],
  },
  {
    id: 'fartlek_hybrid',
    name: 'Fartlek y Entrenamiento Cruzado (Bici / Fútbol)',
    shortTag: 'Todos los niveles · Multideporte',
    recommendedLevelMin: 1,
    recommendedLevelMax: 10,
    intensitySplit: 'Equivalencia por MET-min y TRIMP',
    structureExample: 'Sustituye un rodaje de carrera por 50 min de bicicleta en Zona 2 o un partido de fútbol semanal.',
    scientificBasis:
      'Las adaptaciones centrales del corazón y la sangre se transfieren entre disciplinas. Contabilizar la carga equivalente evita doblar fatiga cuando practicas otros deportes.',
    bestFor: 'Personas que combinan correr con bicicleta, partidos con amigos o buscan cuidar las rodillas.',
    protocolSteps: [
      'Usa el conversor de cardio para igualar los Puntos de Carga del día.',
      'Si juegas fútbol, tómalo como el día intenso de tu semana y programa descanso o paseo el día siguiente.',
      'Aprovecha la bicicleta los días que notes las piernas cargadas tras correr.',
    ],
  },
];

export const BADGES_CATALOG: BadgeDefinition[] = [
  {
    id: 'first_calibration',
    title: 'Evaluación Inicial',
    description: 'Completaste tus datos biométricos y la medición objetiva de partida.',
    iconName: 'Ruler',
    xpReward: 100,
  },
  {
    id: 'first_workout',
    title: 'Primera Sesión',
    description: 'Registraste tu primer entrenamiento completo en el plan.',
    iconName: 'Check',
    xpReward: 150,
  },
  {
    id: 'google_fit_sync',
    title: 'Actividad Diaria Conectada',
    description: 'Sincronizaste el seguimiento de pasos diarios con Google Fit.',
    iconName: 'Footprints',
    xpReward: 120,
  },
  {
    id: 'multi_cardio',
    title: 'Entrenamiento Cruzado',
    description: 'Completaste una sesión equivalente en bicicleta, fútbol o natación.',
    iconName: 'Bike',
    xpReward: 160,
  },
  {
    id: 'exam_completed',
    title: 'Test Físico Registrado',
    description: 'Realizaste un examen físico oficial y actualizaste tus zonas.',
    iconName: 'Award',
    xpReward: 250,
  },
  {
    id: 'streak_3',
    title: 'Tres Sesiones Seguidas',
    description: 'Mantuviste una racha de 3 entrenamientos registrados.',
    iconName: 'Activity',
    xpReward: 200,
  },
  {
    id: 'level_5',
    title: 'Nivel 5 Alcanzado',
    description: 'Alcanzaste el nivel de ritmo de umbral en tu progresión.',
    iconName: 'TrendingUp',
    xpReward: 350,
  },
  {
    id: 'macro_smart',
    title: 'Nutrición Planificada',
    description: 'Revisaste tus objetivos de macronutrientes según la carga del día.',
    iconName: 'Utensils',
    xpReward: 80,
  },
];
