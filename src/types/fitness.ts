export type SexType = 'male' | 'female' | 'other';

export type FitnessGoal =
  | 'health_maintenance'
  | 'start_running'
  | 'improve_5k'
  | 'improve_10k'
  | 'fat_loss_cardio';

export type TrainingFocus =
  | 'caco_safe'
  | 'endurance_base'
  | 'speed_series'
  | 'tempo_threshold'
  | 'hybrid_sport';

export type CardioModality =
  | 'running'
  | 'cycling'
  | 'soccer'
  | 'walking'
  | 'swimming';

export type SessionType =
  | 'caco'
  | 'easy_z1'
  | 'marathon_z2'
  | 'threshold_z3'
  | 'intervals_z4'
  | 'fartlek'
  | 'long_run'
  | 'cycling'
  | 'soccer'
  | 'active_walk'
  | 'physical_exam'
  | 'rest';

export type PhysicalExamType =
  | 'cooper_12min'
  | 'time_trial_5k'
  | 'rockport_walk_1600m'
  | 'caco_continuous_test';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  age: number;
  weightKg: number;
  heightCm: number;
  sex: SexType;
  goal: FitnessGoal;
  trainingDaysPerWeek: number;
  weeklyWalkGoalSessions: number;
  dailyStepsTarget: number;
  restHR: number;
  maxHR: number;
  vdot: number;
  level: number;
  xp: number;
  streakDays: number;
  totalCardioPoints: number;
  preferredStrategyId: string;
  preferredStrategy?: TrainingFocus | string;
  preferredModalities: CardioModality[];
  unlockedBadges: string[];
  onboardingCompleted: boolean;
  isDemoMode?: boolean;
  updatedAt: string;
}

export interface TrainingZone {
  id: 'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5';
  name: string;
  danielsCode: string;
  vo2PctRange: string;
  paceMinSecPerKm: number;
  paceMaxSecPerKm: number;
  paceFormatted: string;
  speedKmhFormatted: string;
  speedKmMinFormatted: string;
  hrMin: number;
  hrMax: number;
  purpose: string;
  color: string;
}

export interface WorkoutBlock {
  label: string;
  durationMinutes: number;
  intensity: string;
  description: string;
  zone: 'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5';
}

export interface WorkoutSession {
  id: string;
  date: string; // YYYY-MM-DD
  dayIndex: number;
  title: string;
  subtitle: string;
  modality: CardioModality;
  sessionType: SessionType;
  strategyTag: string;
  durationMinutes: number;
  targetDistanceKm: number;
  targetZone: 'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5';
  targetPace: string;
  cardioPoints: number;
  metMinutes: number;
  trimp: number;
  estimatedCalories: number;
  blocks: WorkoutBlock[];
  coachTip: string;
  completed: boolean;
  rpe?: number;
  actualDurationMinutes?: number;
  actualDistanceKm?: number;
  completedModality?: CardioModality;
  notes?: string;
  isExamDay?: boolean;
}

export interface PhysicalExamResult {
  id: string;
  date: string;
  examType: PhysicalExamType;
  rawValue: number;
  secondaryValue?: number;
  heartRateBpm?: number;
  calculatedVdot: number;
  previousVdot: number;
  newLevel: number;
  previousLevel: number;
  summary: string;
}

export interface GoogleFitDay {
  date: string;
  steps: number;
  distanceMeters: number;
  calories: number;
  activeMinutes: number;
  source: 'google_fit_api' | 'simulated_sync' | 'manual';
}

export interface MacroRecommendation {
  dayType: 'rest' | 'easy' | 'moderate' | 'high_intensity';
  dayTypeLabel: string;
  calories: number;
  bmr: number;
  tdee: number;
  carbsGrams: number;
  carbsPerKg: number;
  proteinGrams: number;
  proteinPerKg: number;
  fatsGrams: number;
  fatsPerKg: number;
  hydrationLiters: number;
  carbsPct: number;
  proteinPct: number;
  fatsPct: number;
  preWorkoutTip: string;
  postWorkoutTip: string;
  dailyNote: string;
}

export interface RunningStrategy {
  id: string;
  name: string;
  shortTag: string;
  recommendedLevelMin: number;
  recommendedLevelMax: number;
  intensitySplit: string;
  structureExample: string;
  scientificBasis: string;
  bestFor: string;
  protocolSteps: string[];
}

export interface LynxLevelInfo {
  level: number;
  title: string;
  spanishTitle: string;
  minVdot: number;
  minXp: number;
  nextLevelXp: number;
  progressPct: number;
  badgeColor: string;
  lynxQuote: string;
}

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  iconName: string;
  xpReward: number;
}
