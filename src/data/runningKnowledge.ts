import type { BadgeDefinition, RunningStrategy } from '../types/fitness';

export interface ScientificTip {
  id: string;
  category: 'Fisiología' | '80/20' | 'Biodinámica' | 'Cardio Equivalente' | 'Nutrición' | 'Recuperación';
  title: string;
  fact: string;
  source: string;
}

export const SCIENTIFIC_LOADING_TIPS: ScientificTip[] = [
  {
    id: 'tip-80-20',
    category: '80/20',
    title: 'La regla de oro 80/20 de Stephen Seiler',
    fact: 'Los corredores que realizan ~80% de su volumen semanal a ritmo conversacional (Zona 1) y 20% a alta intensidad mejoran su VO2max y marca más que quienes corren siempre a ritmo medio-fuerte.',
    source: 'Seiler, Int J Sports Physiol Perform (2010)',
  },
  {
    id: 'tip-caco',
    category: 'Biodinámica',
    title: 'Por qué empezar con bloques CaCo (2 min correr / 6 min andar)',
    fact: 'Tu corazón se adapta en semanas, pero los tendones de Aquiles y cartílagos necesitan 8–12 semanas para remodelar su colágeno. Alternar trote suave y caminata previene lesiones sin perder estímulo aeróbico.',
    source: 'Galloway Run-Walk-Run & Tendon Adaptation Physiology',
  },
  {
    id: 'tip-vdot',
    category: 'Fisiología',
    title: 'VDOT une tu VO2max con tu economía de carrera',
    fact: 'Dos corredores con idéntico VO2max pueden tener marcas muy distintas en 5K. El índice VDOT de Jack Daniels combina oxígeno máximo y eficiencia mecánica para clavar tus ritmos exactos.',
    source: 'Daniels & Gilbert — Daniels’ Running Formula',
  },
  {
    id: 'tip-mitochondria',
    category: 'Fisiología',
    title: 'Correr suave construye mitocondrias',
    fact: 'El entrenamiento aeróbico en Zona 1 multiplica la densidad mitocondrial y la red capilar muscular, permitiendo oxidar más grasa y ahorrar glucógeno en esfuerzos largos.',
    source: 'Holloszy & Coyle — Exercise Biochemistry',
  },
  {
    id: 'tip-cadence',
    category: 'Biodinámica',
    title: 'Cadencia y menor impacto articular',
    fact: 'Aumentar tu cadencia apenas un 5% (pasos cortos y ligeros bajo tu centro de gravedad) reduce drásticamente la fuerza de frenado y la carga en rodillas y caderas.',
    source: 'Heiderscheit et al., Med Sci Sports Exerc',
  },
  {
    id: 'tip-cycling-equiv',
    category: 'Cardio Equivalente',
    title: 'Ciclismo como escudo articular',
    fact: '45 minutos de bici en Zona 2–3 generan ~380–450 MET-minutos y un fuerte estímulo cardiovascular central con solo ~15% del impacto mecánico de correr en asfalto.',
    source: 'Compendium of Physical Activities (Ainsworth)',
  },
  {
    id: 'tip-soccer-equiv',
    category: 'Cardio Equivalente',
    title: 'Un partido de fútbol equivale a series HIIT',
    fact: 'Durante un partido amateur se recorren 4–7 km con decenas de sprints repetidos y desaceleraciones. En FlyRun equivale a una sesión de Fartlek/Intervalos en carga TRIMP.',
    source: 'Bangsbo — Physiology of Intermittent Sports',
  },
  {
    id: 'tip-steps-neat',
    category: 'Recuperación',
    title: 'Tus pasos diarios en Google Fit importan tanto como entrenar',
    fact: 'Mantener entre 7.500 y 10.000 pasos diarios mejora la sensibilidad a la insulina, acelera el retorno venoso tras días de series y eleva tu gasto calórico sin generar fatiga central.',
    source: 'Tudor-Locke & Bassett — Step-Based Physical Activity',
  },
  {
    id: 'tip-lactate',
    category: 'Fisiología',
    title: 'El lactato no es un desecho: es combustible',
    fact: 'El entrenamiento de Umbral (Tempo / Z3) entrena los transportadores MCT1/MCT4 para reciclar lactato como energía en corazón y fibras oxidativas lentas.',
    source: 'George Brooks — Lactate Shuttle Theory',
  },
  {
    id: 'tip-sleep',
    category: 'Recuperación',
    title: 'La adaptación ocurre mientras duermes, no mientras corres',
    fact: 'Dormir menos de 7 horas reduce la síntesis proteica miofibrilar, aumenta el cortisol y eleva 1.7x la probabilidad de lesión muscular en corredores.',
    source: 'Milewski et al., J Pediatr Orthop / Sports Recovery',
  },
  {
    id: 'tip-protein',
    category: 'Nutrición',
    title: 'Proteína para corredores: no es solo para el gimnasio',
    fact: 'Los deportistas de resistencia necesitan 1.6 a 1.8 g/kg de proteína diaria para reparar microdaño muscular excéntrico y sintetizar enzimas mitocondriales.',
    source: 'ISSN Position Stand: Protein & Exercise',
  },
  {
    id: 'tip-billat',
    category: 'Fisiología',
    title: 'El secreto de las series 30-30 de Véronique Billat',
    fact: 'Alternar 30s rápidos a ritmo vVO2max con 30s de trote muy suave mantiene el consumo de oxígeno cerca del máximo durante más minutos con mucha menos fatiga ácida.',
    source: 'Billat et al., Sports Medicine',
  },
];

export const RUNNING_STRATEGIES: RunningStrategy[] = [
  {
    id: 'caco_progressive',
    name: 'Método CaCo Progresivo (Caminar-Correr)',
    shortTag: 'Niveles 1–3 · Cero Lesiones',
    recommendedLevelMin: 1,
    recommendedLevelMax: 3,
    intensitySplit: '90% Aeróbico Seguro / 10% Adaptación',
    structureExample: 'Semana 1: 4 bloques de [2 min trote suave + 6 min caminata rápida] · Semana 3: [4 min trote + 2 min caminata]',
    scientificBasis:
      'Basado en la remodelación gradual del colágeno tendinoso y el método Galloway: el corazón mejora en 14 días, pero tendones y fascia plantar tardan 8–10 semanas. Los descansos caminando cortan la fatiga excéntrica antes de que aparezca mala técnica.',
    bestFor: 'Personas que empiezan desde cero, regresan tras lesión, tienen sobrepeso o quieren construir base sin ahogarse.',
    protocolSteps: [
      'Calienta siempre 5 min caminando a paso alegre (100–115 ppm).',
      'Ejecuta tu bloque CaCo actual (ej. 2 min trotando en Z1 donde puedas hablar frases cortas + 6 min andando ligero).',
      'Repite 3 a 5 rondas según tu nivel. No hagas sprint en el bloque de trote.',
      'Cuando completes las rondas con esfuerzo percibido (RPE) ≤ 5/10, Coach Lince sube la proporción a 3\'/4\' o 5\'/2\'.',
    ],
  },
  {
    id: 'polarized_80_20',
    name: 'Entrenamiento Polarizado 80/20 (Stephen Seiler)',
    shortTag: 'Niveles 3–10 · Evidencia Gold Standard',
    recommendedLevelMin: 3,
    recommendedLevelMax: 10,
    intensitySplit: '80% Zona 1–2 Suave / 20% Zona 3–4 Intenso',
    structureExample: 'En 4 días/semana: 3 días de rodaje fácil conversacional + 1 día de calidad (Intervalos o Umbral).',
    scientificBasis:
      'Estudios controlados demuestran que evitar la "zona gris" (correr medio-duro todos los días) previene la fatiga adrenal y produce mayores ganancias en VO2max, velocidad umbral y economía que los planes de intensidad moderada constante.',
    bestFor: 'Quienes entrenan 3 a 6 días/semana y buscan el máximo rendimiento cardiovascular sin quemarse.',
    protocolSteps: [
      'Mantén tus rodajes suaves estrictamente en Zona 1 (65–75% FCmax o ritmo conversacional).',
      'Reserva tu energía fresca para 1 o 2 sesiones clave de alta calidad semanal.',
      'Si un día estás fatigado o jugaste un partido de fútbol, convierte el siguiente rodaje en Zona 1 regenerativa.',
    ],
  },
  {
    id: 'daniels_threshold',
    name: 'Umbral de Lactato & VDOT (Jack Daniels)',
    shortTag: 'Niveles 4–10 · Resistencia Sostenida',
    recommendedLevelMin: 4,
    recommendedLevelMax: 10,
    intensitySplit: 'Ritmo T (83–88% VO2max) · "Cómodamente duro"',
    structureExample: '10 min Z1 + 3 x 6 min a Ritmo Umbral (Z3) con 1 min de trote suave entre bloques + 10 min enfriamiento.',
    scientificBasis:
      'Entrenar justo en el segundo umbral ventilatorio (VT2) optimiza la velocidad a la que tu cuerpo aclara y reutiliza el lactato sanguíneo, permitiéndote sostener ritmos mucho más rápidos durante 20–60 minutos.',
    bestFor: 'Mejorar marcas en 5K, 10K y media maratón elevando tu techo sostenible.',
    protocolSteps: [
      'Realiza un Examen Físico (Cooper o 5K) para que FlyRun calcule tu VDOT exacto.',
      'Ejecuta los bloques a ritmo T sin pasarte al sprint: debes poder pronunciar 3–4 palabras seguidas.',
      'Respeta las pausas breves (1 min por cada 5–6 min de umbral) para mantener estable la curva de lactato.',
    ],
  },
  {
    id: 'billat_30_30',
    name: 'Intervalos Billat 30-30 & VO2max',
    shortTag: 'Niveles 5–10 · Potencia Aeróbica',
    recommendedLevelMin: 5,
    recommendedLevelMax: 10,
    intensitySplit: 'Z4 Intervalos (95–100% VO2max) + Z1 Activo',
    structureExample: '12 min calentamiento + 2 bloques de 8 x (30s a ritmo I-Z4 / 30s trote muy suave) + 8 min vuelta a la calma.',
    scientificBasis:
      'Protocolo de la fisióloga Véronique Billat: gracias a la inercia del consumo de oxígeno, el cuerpo permanece en >90% VO2max durante las recuperaciones cortas activas, disparando el volumen sistólico cardíaco.',
    bestFor: 'Romper mesetas de rendimiento y disparar tu VO2max y marca en el Test de Cooper.',
    protocolSteps: [
      'Calienta mínimo 10–12 minutos con movilidad dinámica de tobillo y cadera.',
      'Corre 30 segundos fuerte (controlado, no sprint máximo de 100m) y 30 segundos trotando muy suave sin pararte en seco.',
      'Deja al menos 48 horas antes de la siguiente sesión exigente.',
    ],
  },
  {
    id: 'fartlek_hybrid',
    name: 'Fartlek & Cardio Híbrido (Bici / Fútbol / Running)',
    shortTag: 'Todos los Niveles · Multideporte',
    recommendedLevelMin: 1,
    recommendedLevelMax: 10,
    intensitySplit: 'Conversión por Puntos Cardio (MET-min + TRIMP)',
    structureExample: 'Sustituye un rodaje por 50 min de Ciclismo Z2 o un partido de Fútbol 7, manteniendo el balance 80/20 semanal.',
    scientificBasis:
      'Las adaptaciones cardiovasculares centrales (gasto cardíaco, volumen plasmático) se transfieren entre deportes cíclicos y mixtos. Controlar el equivalente en MET-minutos y TRIMP evita sobreentrenamiento cuando juegas fútbol entre semana.',
    bestFor: 'Usuarios que compaginan running con bicicleta, partidos con amigos o buscan salud integral sin aburrirse.',
    protocolSteps: [
      'Usa el conversor de Cardio Equivalente para igualar los Puntos Cardio de tu rutina.',
      'Si juegas partido de fútbol, FlyRun lo contabiliza como sesión de alta carga intermitente (parte del 20% intenso).',
      'Compensa al día siguiente con pasos tranquilos (Google Fit) o bici suave regenerativa.',
    ],
  },
];

export const BADGES_CATALOG: BadgeDefinition[] = [
  {
    id: 'first_calibration',
    title: 'Huella del Lince',
    description: 'Completaste tu perfil biométrico y primera medición objetiva de nivel.',
    iconName: 'PawPrint',
    xpReward: 100,
  },
  {
    id: 'first_workout',
    title: 'Primer Zarpazo',
    description: 'Completaste tu primera sesión guiada por Coach Lince.',
    iconName: 'Flame',
    xpReward: 150,
  },
  {
    id: 'google_fit_sync',
    title: 'Radar Activo',
    description: 'Sincronizaste tu actividad diaria de pasos con Google Fit.',
    iconName: 'Footprints',
    xpReward: 120,
  },
  {
    id: 'multi_cardio',
    title: 'Atleta Híbrido',
    description: 'Registraste una equivalencia de cardio alternativo (Bici o Fútbol).',
    iconName: 'Bike',
    xpReward: 160,
  },
  {
    id: 'exam_completed',
    title: 'Examen Superado',
    description: 'Registraste un Día de Examen Físico oficial y actualizaste tu VDOT.',
    iconName: 'Award',
    xpReward: 250,
  },
  {
    id: 'streak_3',
    title: 'Instinto Constante',
    description: 'Alcanzaste una racha de 3 días o sesiones consecutivas.',
    iconName: 'Zap',
    xpReward: 200,
  },
  {
    id: 'level_5',
    title: 'Lince de Sierra Morena',
    description: 'Alcanzaste el Nivel 5 de condición cardiovascular.',
    iconName: 'Trophy',
    xpReward: 350,
  },
  {
    id: 'macro_smart',
    title: 'Combustible Preciso',
    description: 'Consultaste y aplicaste tu plan de macros adaptado al entrenamiento.',
    iconName: 'Apple',
    xpReward: 80,
  },
];
