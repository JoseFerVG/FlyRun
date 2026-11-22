import { useEffect, useState } from 'react';
import {
  CalendarBlank,
  ChartLineUp,
  Compass,
  CookingPot,
  GearSix,
  PersonSimpleRun,
  ShieldCheck,
} from '@phosphor-icons/react';
import { AmbientBackdrop } from './components/AmbientBackdrop';
import type {
  CardioModality,
  FitnessGoal,
  GoogleFitDay,
  PhysicalExamResult,
  PhysicalExamType,
  TrainingFocus,
  UserProfile,
  WorkoutSession,
} from './types/fitness';
import {
  deleteUserAccountCascade,
  ensureCloudAuthSession,
  exportUserGDPRBundleJSON,
  exportUserWorkoutsCSV,
  getDemoGoogleSession,
  getFirebaseClients,
  getSavedGoogleFitToken,
  loadUserStateFromCloud,
  persistUserState,
  revokeGoogleFitAccess,
  saveDemoGoogleSession,
  saveLocalState,
  signInWithGoogleFirebase,
  signOutFirebase,
  subscribeFirebaseAuth,
} from './services/firebase';
import {
  applyPhysicalExamResult,
  buildWorkoutForPowerAndRest,
  calculateCardioEquivalence,
  customizeWorkoutRoutine,
  evaluateProgressiveLevelUpdate,
  formatShortUserName,
  generateWeeklyPlan,
  getLynxLevel,
  swapWorkoutModality,
  type CustomRoutineConfig,
  type RestLevel,
  type RoutinePowerLevel,
} from './services/scienceEngine';
import { calculateDailyMacros } from './services/nutritionEngine';
import { buildInitialWeekSteps } from './services/googleFit';
import { ScientificLoader } from './components/ScientificLoader';
import { FlyRunLogo } from './components/FlyRunLogo';
import { assetUrl } from './services/assets';
import { SIMULATED_USER_PERSONAS, type SimulatedUserPersona } from './data/userPersonas';
import { AuthLanding } from './components/AuthLanding';
import { OnboardingModal } from './components/OnboardingModal';
import { CoachLynxBanner } from './components/CoachLynxBanner';
import { DashboardView } from './components/DashboardView';
import { CalendarView } from './components/CalendarView';
import { StatsAndExamView } from './components/StatsAndExamView';
import { StrategiesAndCardioView } from './components/StrategiesAndCardioView';
import { NutritionView } from './components/NutritionView';
import { WorkoutLogDialog } from './components/WorkoutLogDialog';
import { LiveWorkoutTimerDialog } from './components/LiveWorkoutTimerDialog';
import { UserPersonasModal } from './components/UserPersonasModal';
import { GoalFocusModal } from './components/GoalFocusModal';
import { LegalComplianceModal, type LegalTabId } from './components/LegalComplianceModal';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { SettingsModal, SIMPLE_PLATFORMS, type SettingsTabId } from './components/SettingsModal';

type NavTab = 'dashboard' | 'calendar' | 'stats' | 'strategies' | 'nutrition';

interface AuthSessionInfo {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  isDemoMode: boolean;
  googleFitAccessToken?: string;
}

const PLATFORMS_STORAGE_KEY = 'flyrun_connected_platforms_v1';

export function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('flyrun_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });
  const [booting, setBooting] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [session, setSession] = useState<AuthSessionInfo | null>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [exams, setExams] = useState<PhysicalExamResult[]>([]);
  const [fitDays, setFitDays] = useState<GoogleFitDay[]>([]);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [loggingWorkout, setLoggingWorkout] = useState<WorkoutSession | null>(null);
  const [timerWorkout, setTimerWorkout] = useState<WorkoutSession | null>(null);
  const [timerStartBlock, setTimerStartBlock] = useState<number>(0);
  const [personasOpen, setPersonasOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTabId>('profile');
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(PLATFORMS_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as string[]) : ['wahoo', 'google_fit'];
    } catch {
      return ['wahoo', 'google_fit'];
    }
  });
  const [legalOpen, setLegalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<LegalTabId>('privacy');
  const [forceCookieConfig, setForceCookieConfig] = useState(false);
  const [fitSyncLoading, setFitSyncLoading] = useState(false);
  const [fitNotice, setFitNotice] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const mergePreservingCompleted = (existingWorkouts: WorkoutSession[], newPlan: WorkoutSession[]) => {
    const extraCompleted = existingWorkouts.filter((w) => w.completed && w.id.startsWith('extra_'));
    const merged = newPlan.map((nw) => {
      const done = existingWorkouts.find((ew) => ew.date === nw.date && ew.completed && !ew.id.startsWith('extra_'));
      return done ?? nw;
    });
    return [...merged, ...extraCompleted];
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const meta = document.getElementById('theme-color-meta');
    if (meta) {
      meta.setAttribute('content', theme === 'dark' ? '#0a0d14' : '#f3f5fa');
    }
  }, [theme]);

  const setThemeExplicit = (next: 'light' | 'dark') => {
    localStorage.setItem('flyrun_theme', next);
    runViewTransition(() => setTheme(next));
  };

  const runViewTransition = (updateFn: () => void) => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { finished: Promise<void> };
    };
    if (!prefersReduced && typeof doc.startViewTransition === 'function') {
      doc.startViewTransition(() => updateFn());
    } else {
      updateFn();
    }
  };

  const handleSelectTab = (tab: NavTab) => {
    if (tab === activeTab) return;
    runViewTransition(() => setActiveTab(tab));
  };

  const handleOpenPhysicalExam = () => {
    runViewTransition(() => setActiveTab('stats'));
    window.setTimeout(() => {
      document.getElementById('physical-exam-section')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100);
  };

  const handleToggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('flyrun_theme', next);
    runViewTransition(() => setTheme(next));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => setToastMessage(null), 4200);
  };

  const hydrateUserData = async (authInfo: AuthSessionInfo) => {
    const cloud = await loadUserStateFromCloud(authInfo.uid);
    if (cloud.profile) {
      setProfile(cloud.profile);
      setWorkouts(
        cloud.workouts.length > 0 ? cloud.workouts : generateWeeklyPlan(cloud.profile)
      );
      setExams(cloud.exams);
      setFitDays(
        cloud.fitDays.length > 0
          ? cloud.fitDays
          : buildInitialWeekSteps(cloud.profile.dailyStepsTarget)
      );
    } else {
      setProfile(null);
      setWorkouts([]);
      setExams([]);
      setFitDays([]);
    }
  };

  useEffect(() => {
    const demo = getDemoGoogleSession();
    const clients = getFirebaseClients();

    let timerDone = false;
    const minTimer = window.setTimeout(() => {
      timerDone = true;
      setBooting(false);
    }, 1150);

    if (demo) {
      const s: AuthSessionInfo = { ...demo, isDemoMode: true };
      setSession(s);
      void hydrateUserData(s);
    }

    const unsub = clients
      ? subscribeFirebaseAuth((fbUser) => {
          if (fbUser) {
            const s: AuthSessionInfo = {
              uid: fbUser.uid,
              displayName: fbUser.displayName ?? demo?.displayName ?? 'Usuario FlyRun',
              email: fbUser.email ?? demo?.email ?? '',
              photoURL: fbUser.photoURL ?? '',
              isDemoMode: fbUser.isAnonymous,
              googleFitAccessToken: getSavedGoogleFitToken() ?? undefined,
            };
            setSession(s);
            void hydrateUserData(s).finally(() => {
              if (timerDone) setBooting(false);
            });
          } else if (!demo) {
            setSession(null);
          }
        })
      : () => {};

    return () => {
      window.clearTimeout(minTimer);
      unsub();
    };
  }, []);

  const saveAll = (
    nextProfile: UserProfile,
    nextWorkouts: WorkoutSession[],
    nextExams: PhysicalExamResult[],
    nextFitDays: GoogleFitDay[]
  ) => {
    setProfile(nextProfile);
    setWorkouts(nextWorkouts);
    setExams(nextExams);
    setFitDays(nextFitDays);
    void persistUserState(nextProfile.uid, {
      profile: nextProfile,
      workouts: nextWorkouts,
      exams: nextExams,
      fitDays: nextFitDays,
    });
  };

  const handleSelectPersona = async (persona: SimulatedUserPersona) => {
    const clients = getFirebaseClients();
    if (clients?.auth.currentUser && !clients.auth.currentUser.isAnonymous) {
      await signOutFirebase();
    }
    const targetUid = persona.profile.uid;
    const demoSession = {
      uid: targetUid,
      displayName: persona.profile.displayName,
      email: '',
      photoURL: '',
    };
    const personaProfile: UserProfile = {
      ...persona.profile,
      uid: targetUid,
      updatedAt: new Date().toISOString(),
    };
    saveDemoGoogleSession(demoSession);
    setSession({ ...demoSession, isDemoMode: true });
    const generatedWorkouts = persona.buildWorkouts();
    saveLocalState(personaProfile.uid, {
      profile: personaProfile,
      workouts: generatedWorkouts,
      exams: persona.exams,
      fitDays: persona.fitDays,
    });
    setProfile(personaProfile);
    setWorkouts(generatedWorkouts);
    setExams(persona.exams);
    setFitDays(persona.fitDays);
    setIsEditingProfile(false);
    setActiveTab('dashboard');
    showToast(
      `Caso demo de ${persona.name} cargado (Nivel ${personaProfile.level}, VDOT ${personaProfile.vdot}).`
    );
  };

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setGoogleLoading(true);
    try {
      const res = await signInWithGoogleFirebase();
      const s: AuthSessionInfo = { ...res, isDemoMode: false };
      setSession(s);
      await hydrateUserData(s);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error de autenticación';
      setAuthError(
        `No se pudo completar el inicio con Google (${msg}). Inténtalo de nuevo o prueba el examen inicial.`
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setAuthError(null);
    setDemoLoading(true);
    try {
      const cloudUid = await ensureCloudAuthSession();
      const freshDemoUid = cloudUid ?? `demo_exam_${Date.now()}`;
      const demoSession = {
        uid: freshDemoUid,
        displayName: 'Atleta Demo',
        email: '',
        photoURL: '',
      };
      saveDemoGoogleSession(demoSession);
      const s: AuthSessionInfo = { ...demoSession, isDemoMode: true };
      setSession(s);
      setProfile(null);
      setWorkouts([]);
      setExams([]);
      setFitDays([]);
      setIsEditingProfile(false);
    } finally {
      setDemoLoading(false);
    }
  };

  const handleOnboardingComplete = (newProfile: UserProfile, initialExam?: PhysicalExamResult) => {
    const generated = mergePreservingCompleted(workouts, generateWeeklyPlan(newProfile));
    const initialSteps =
      fitDays.length > 0 ? fitDays : buildInitialWeekSteps(newProfile.dailyStepsTarget);
    const nextExams = initialExam ? [initialExam, ...exams] : exams;
    saveAll(newProfile, generated, nextExams, initialSteps);
    setIsEditingProfile(false);
    setActiveTab('dashboard');
    showToast(
      `Examen inicial completado: Nivel ${newProfile.level} (VDOT ${newProfile.vdot}). Plan de 4 semanas generado.`
    );
  };

  const handleCompleteWorkout = (
    workoutId: string,
    rpe: number,
    actualDurationMinutes: number,
    actualDistanceKm: number,
    modality: CardioModality,
    notes: string
  ) => {
    if (!profile) return;
    const target = workouts.find((w) => w.id === workoutId);
    const liveTelemetry =
      loggingWorkout?.id === workoutId
        ? {
            externalSource: loggingWorkout.externalSource,
            externalActivityId: loggingWorkout.externalActivityId,
            avgHeartRateBpm: loggingWorkout.avgHeartRateBpm,
            maxHeartRateBpm: loggingWorkout.maxHeartRateBpm,
            cadenceSpm: loggingWorkout.cadenceSpm,
            kmSplits: loggingWorkout.kmSplits,
          }
        : {};

    if (!target) {
      const eq = calculateCardioEquivalence(modality, actualDurationMinutes, rpe, profile.weightKg, profile.sex, profile.vdot);
      const extraSession: WorkoutSession = {
        id: workoutId,
        date: new Date().toISOString().slice(0, 10),
        dayIndex: 0,
        title: `Actividad libre: ${modality === 'cycling' ? 'Bicicleta' : modality === 'soccer' ? 'Partido de fútbol' : modality === 'walking' ? 'Caminata' : modality === 'swimming' ? 'Natación' : 'Running'}`,
        subtitle: 'Sesión registrada fuera del calendario base',
        modality,
        sessionType: modality === 'cycling' ? 'cycling' : modality === 'soccer' ? 'soccer' : modality === 'walking' ? 'active_walk' : 'easy_z1',
        strategyTag: 'Actividad libre',
        durationMinutes: actualDurationMinutes,
        targetDistanceKm: actualDistanceKm,
        targetZone: rpe >= 7 ? 'Z4' : 'Z2',
        targetPace: 'Libre',
        cardioPoints: eq.cardioPoints,
        metMinutes: eq.metMinutes,
        trimp: eq.trimp,
        estimatedCalories: eq.calories,
        blocks: [{ label: 'Actividad libre', durationMinutes: actualDurationMinutes, intensity: `RPE ${rpe}/10`, description: notes || 'Sesión adicional registrada', zone: rpe >= 7 ? 'Z4' : 'Z2' }],
        coachTip: '',
        completed: true,
        rpe,
        actualDurationMinutes,
        actualDistanceKm,
        completedModality: modality,
        notes,
        ...liveTelemetry,
      };
      const evalResult = evaluateProgressiveLevelUpdate(profile, extraSession, rpe, actualDurationMinutes);
      saveAll(evalResult.updatedProfile, [...workouts, extraSession], exams, fitDays);
      showToast(`Actividad libre guardada (+${eq.cardioPoints} Puntos Cardio, +${evalResult.xpEarned} XP).`);
      return;
    }

    const updatedWorkout: WorkoutSession = {
      ...target,
      ...liveTelemetry,
      completed: true,
      rpe,
      actualDurationMinutes,
      actualDistanceKm,
      completedModality: modality,
      notes,
    };

    const nextWorkouts = workouts.map((w) => (w.id === workoutId ? updatedWorkout : w));
    const evalResult = evaluateProgressiveLevelUpdate(
      profile,
      updatedWorkout,
      rpe,
      actualDurationMinutes
    );

    saveAll(evalResult.updatedProfile, nextWorkouts, exams, fitDays);
    showToast(
      `Sesión registrada: +${evalResult.xpEarned} XP, VDOT +${evalResult.vdotDelta}${
        evalResult.leveledUp ? `. Has subido al Nivel ${evalResult.updatedProfile.level}.` : '.'
      }`
    );
  };

  const handleSwapModality = (workoutId: string, modality: CardioModality) => {
    if (!profile) return;
    const nextWorkouts = workouts.map((w) =>
      w.id === workoutId ? swapWorkoutModality(w, modality, profile) : w
    );
    saveAll(profile, nextWorkouts, exams, fitDays);
    showToast('Sesión adaptada manteniendo la equivalencia de Puntos Cardio.');
  };

  const handleCustomizeRoutine = (workoutId: string, config: CustomRoutineConfig) => {
    if (!profile) return;
    const nextWorkouts = workouts.map((w) =>
      w.id === workoutId ? customizeWorkoutRoutine(w, profile, config) : w
    );
    const updatedTarget = nextWorkouts.find((w) => w.id === workoutId) ?? null;
    if (timerWorkout?.id === workoutId && updatedTarget) {
      setTimerWorkout(updatedTarget);
    }
    saveAll(profile, nextWorkouts, exams, fitDays);
    showToast('Estructura de la rutina y bloques del cronómetro actualizados.');
  };

  const handleSwapWorkoutDays = (sourceId: string, targetId: string) => {
    if (!profile) return;
    const srcIdx = workouts.findIndex((w) => w.id === sourceId);
    const tgtIdx = workouts.findIndex((w) => w.id === targetId);
    if (srcIdx === -1 || tgtIdx === -1) return;

    const src = workouts[srcIdx];
    const tgt = workouts[tgtIdx];
    const nextWorkouts = [...workouts];
    nextWorkouts[srcIdx] = { ...tgt, id: src.id, date: src.date, dayIndex: src.dayIndex };
    nextWorkouts[tgtIdx] = { ...src, id: tgt.id, date: tgt.date, dayIndex: tgt.dayIndex };

    saveAll(profile, nextWorkouts, exams, fitDays);
    showToast('Días intercambiados en tu calendario.');
  };

  const handleSelectStrategy = (strategyId: string) => {
    if (!profile) return;
    const updatedProfile: UserProfile = {
      ...profile,
      preferredStrategyId: strategyId,
      updatedAt: new Date().toISOString(),
    };
    const nextWorkouts = mergePreservingCompleted(workouts, generateWeeklyPlan(updatedProfile));
    saveAll(updatedProfile, nextWorkouts, exams, fitDays);
    showToast('Estrategia aplicada conservando tus entrenamientos ya completados.');
  };

  const handleSubmitExam = (
    examType: PhysicalExamType,
    rawValue: number,
    secondaryValue?: number,
    heartRateBpm?: number,
    customSummaryLabel?: string
  ) => {
    if (!profile) return;
    const result = applyPhysicalExamResult(
      profile,
      examType,
      rawValue,
      secondaryValue,
      heartRateBpm,
      customSummaryLabel
    );
    const mergedWorkouts = mergePreservingCompleted(workouts, generateWeeklyPlan(result.updatedProfile));
    const nextExams = [result.examResult, ...exams];
    saveAll(result.updatedProfile, mergedWorkouts, nextExams, fitDays);
    showToast(
      result.leveledUp
        ? `Examen registrado: nuevo VDOT ${result.updatedProfile.vdot} y Nivel ${result.updatedProfile.level}.`
        : `VDOT actualizado a ${result.updatedProfile.vdot} y zonas en km/h y km/min recalculadas.`
    );
  };

  const handleTogglePlatform = (platformId: string) => {
    const exists = connectedPlatforms.includes(platformId);
    const next = exists
      ? connectedPlatforms.filter((id) => id !== platformId)
      : [...connectedPlatforms, platformId];
    setConnectedPlatforms(next);
    try {
      localStorage.setItem(PLATFORMS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage error
    }
    const label = SIMPLE_PLATFORMS.find((p) => p.id === platformId)?.name ?? platformId;
    showToast(exists ? `${label} desconectado.` : `${label} conectado al instante en 1 clic.`);
  };

  const handleSyncPlatforms = () => {
    if (!profile) return;
    setFitSyncLoading(true);
    setFitNotice(null);

    const activeNames = SIMPLE_PLATFORMS.filter((p) => connectedPlatforms.includes(p.id)).map((p) => p.name);
    const boost = Math.round(profile.dailyStepsTarget * 1.05);
    const base = buildInitialWeekSteps(boost).map((d) => ({
      ...d,
      source: 'simulated_sync' as const,
    }));

    const alreadySynced = profile.unlockedBadges.includes('google_fit_sync');
    const nextBadges = alreadySynced
      ? profile.unlockedBadges
      : [...profile.unlockedBadges, 'google_fit_sync'];
    const nextProfile: UserProfile = {
      ...profile,
      unlockedBadges: nextBadges,
      xp: alreadySynced ? profile.xp : profile.xp + 120,
      updatedAt: new Date().toISOString(),
    };
    saveAll(nextProfile, workouts, exams, base);
    setFitNotice(
      activeNames.length > 0
        ? `Sincronizado con ${activeNames.join(', ')} · Pasos actualizados.`
        : 'Actividad sincronizada al instante.'
    );
    showToast('Actividad y plataformas sincronizadas correctamente.');
    setFitSyncLoading(false);
  };

  const handleUpdateQuickProfile = (updates: {
    displayName?: string;
    photoURL?: string;
    weightKg?: number;
    trainingDaysPerWeek?: number;
    dailyStepsTarget?: number;
  }) => {
    if (!profile) return;
    const nextDays =
      typeof updates.trainingDaysPerWeek === 'number'
        ? Math.max(1, Math.min(7, Math.round(updates.trainingDaysPerWeek)))
        : profile.trainingDaysPerWeek;
    const nextWeight =
      typeof updates.weightKg === 'number'
        ? Math.max(35, Math.min(200, updates.weightKg))
        : profile.weightKg;
    const nextSteps =
      typeof updates.dailyStepsTarget === 'number'
        ? Math.max(2000, Math.min(40000, Math.round(updates.dailyStepsTarget)))
        : profile.dailyStepsTarget;

    const nextProfile: UserProfile = {
      ...profile,
      displayName: updates.displayName ? updates.displayName.trim() : profile.displayName,
      photoURL: updates.photoURL !== undefined ? updates.photoURL : profile.photoURL,
      weightKg: nextWeight,
      trainingDaysPerWeek: nextDays,
      dailyStepsTarget: nextSteps,
      updatedAt: new Date().toISOString(),
    };
    const nextWorkouts =
      nextDays !== profile.trainingDaysPerWeek
        ? mergePreservingCompleted(workouts, generateWeeklyPlan(nextProfile))
        : workouts;
    saveAll(nextProfile, nextWorkouts, exams, fitDays);
    showToast('Perfil y preferencias actualizadas.');
  };

  const handleConfigureTodayRoutine = (
    power: RoutinePowerLevel,
    durationMinutes: number,
    modality: CardioModality,
    restLevel: RestLevel
  ) => {
    if (!profile || !workouts[0] || workouts[0].completed) return;
    const built = buildWorkoutForPowerAndRest(
      workouts[0],
      profile,
      power,
      durationMinutes,
      modality,
      restLevel
    );
    const nextWorkouts = workouts.map((w, idx) => (idx === 0 ? built : w));
    saveAll(profile, nextWorkouts, exams, fitDays);
  };

  const handleSaveUpdatedTodayWorkout = (updatedWorkout: WorkoutSession) => {
    if (!profile) return;
    const nextWorkouts = workouts.map((w) => (w.id === updatedWorkout.id ? updatedWorkout : w));
    saveAll(profile, nextWorkouts, exams, fitDays);
  };

  const handleSaveGoalAndFocus = (updates: {
    goal: FitnessGoal;
    preferredStrategy: TrainingFocus;
    preferredStrategyId: string;
    preferredModalities: CardioModality[];
  }) => {
    if (!profile) return;
    const nextProfile: UserProfile = {
      ...profile,
      goal: updates.goal,
      preferredStrategy: updates.preferredStrategy,
      preferredStrategyId: updates.preferredStrategyId,
      preferredModalities: updates.preferredModalities,
      updatedAt: new Date().toISOString(),
    };
    const nextWorkouts = mergePreservingCompleted(workouts, generateWeeklyPlan(nextProfile));
    saveAll(nextProfile, nextWorkouts, exams, fitDays);
    showToast('Meta y enfoque de entrenamiento actualizados al instante.');
  };

  const handleViewedMacros = () => {
    if (!profile || profile.unlockedBadges.includes('macro_smart')) return;
    const nextProfile: UserProfile = {
      ...profile,
      unlockedBadges: [...profile.unlockedBadges, 'macro_smart'],
      xp: profile.xp + 80,
    };
    saveAll(nextProfile, workouts, exams, fitDays);
  };

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('legal') as LegalTabId | null;
    if (
      param &&
      ['privacy', 'google_api', 'terms', 'medical', 'cookies', 'gdpr_rights'].includes(param)
    ) {
      setLegalTab(param);
      setLegalOpen(true);
    }
  }, []);

  const openLegal = (tab: LegalTabId = 'privacy') => {
    setLegalTab(tab);
    setLegalOpen(true);
  };

  const handleExportGDPR = () => {
    if (!session) return;
    exportUserGDPRBundleJSON(session.uid, { profile, workouts, exams, fitDays });
    showToast('Archivo JSON RGPD (Art. 20) descargado correctamente.');
  };

  const handleExportCSV = () => {
    exportUserWorkoutsCSV({ profile, workouts, exams, fitDays });
    showToast('Historial CSV descargado correctamente.');
  };

  const handleRevokeFitOAuth = async () => {
    await revokeGoogleFitAccess();
    setSession((prev) => (prev ? { ...prev, googleFitAccessToken: undefined } : prev));
    setFitNotice('Token OAuth de Google Fit revocado en este navegador.');
    showToast('Permiso OAuth de Google Fit revocado.');
  };

  const handleDeleteAccount = async () => {
    const uidToPurge = profile?.uid ?? session?.uid;
    if (!uidToPurge) return;
    await deleteUserAccountCascade(uidToPurge);
    setSession(null);
    setProfile(null);
    setWorkouts([]);
    setExams([]);
    setFitDays([]);
    setIsEditingProfile(false);
    showToast('Cuenta y datos biométricos eliminados completamente (RGPD Art. 17).');
  };

  const sharedLegalModalAndBanner = (
    <>
      <LegalComplianceModal
        open={legalOpen}
        initialTab={legalTab}
        isLoggedIn={Boolean(session)}
        userEmail={profile?.email ?? session?.email ?? ''}
        hasGoogleFitToken={Boolean(session?.googleFitAccessToken || getSavedGoogleFitToken())}
        onClose={() => setLegalOpen(false)}
        onExportJSON={handleExportGDPR}
        onExportCSV={handleExportCSV}
        onRevokeGoogleFit={handleRevokeFitOAuth}
        onDeleteAccount={handleDeleteAccount}
        onOpenCookieSettings={() => {
          setLegalOpen(false);
          setForceCookieConfig(true);
        }}
      />
      <CookieConsentBanner
        forceOpenConfigure={forceCookieConfig}
        onConfigureClosed={() => setForceCookieConfig(false)}
        onOpenLegal={(tab) => openLegal(tab)}
      />
    </>
  );

  if (booting) {
    return <ScientificLoader />;
  }

  if (!session) {
    return (
      <>
        <a href="#main-content" className="skip-link">
          Saltar al contenido principal
        </a>
        <AuthLanding
          onGoogleLogin={handleGoogleLogin}
          onDemoLogin={() => void handleDemoLogin()}
          onOpenPersonas={() => setPersonasOpen(true)}
          onSelectPersona={(p) => void handleSelectPersona(p)}
          onOpenLegal={(tab) => openLegal(tab)}
          onOpenCookieSettings={() => setForceCookieConfig(true)}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          googleLoading={googleLoading}
          demoLoading={demoLoading}
          authError={authError}
        />
        <UserPersonasModal
          open={personasOpen}
          onClose={() => setPersonasOpen(false)}
          onSelectPersona={(p) => void handleSelectPersona(p)}
        />
        {sharedLegalModalAndBanner}
      </>
    );
  }

  if (!profile || !profile.onboardingCompleted || isEditingProfile) {
    return (
      <>
        <OnboardingModal
          uid={session.uid}
          initialName={formatShortUserName(session.displayName, session.email)}
          email={session.email}
          photoURL={session.photoURL}
          isDemoMode={session.isDemoMode}
          existingProfile={profile}
          onComplete={handleOnboardingComplete}
          onCancel={isEditingProfile ? () => setIsEditingProfile(false) : undefined}
          onOpenLegal={(tab) => openLegal(tab)}
        />
        {sharedLegalModalAndBanner}
      </>
    );
  }

  const levelInfo = getLynxLevel(profile.vdot, profile.xp);
  const todayWorkout = workouts[0];
  const tomorrowWorkout = workouts[1];
  const fitToday = fitDays[fitDays.length - 1];
  const todayMacros = calculateDailyMacros(profile, todayWorkout, fitToday);

  const navItems: Array<{ id: NavTab; label: string; shortLabel: string; icon: typeof Compass }> = [
    { id: 'dashboard', label: 'Hoy', shortLabel: 'Hoy', icon: Compass },
    { id: 'calendar', label: 'Calendario', shortLabel: 'Calendario', icon: CalendarBlank },
    { id: 'stats', label: 'Datos y Examen', shortLabel: 'Examen', icon: ChartLineUp },
    { id: 'strategies', label: 'Estrategias y Cardio', shortLabel: 'Cardio', icon: PersonSimpleRun },
    { id: 'nutrition', label: 'Macros', shortLabel: 'Macros', icon: CookingPot },
  ];

  return (
    <div className="app-shell">
      <AmbientBackdrop />
      <a href="#main-content" className="skip-link">
        Saltar al contenido principal
      </a>
      <header className="top-header" style={{ viewTransitionName: 'persistent-nav' }}>
        <div className="header-inner">
          <FlyRunLogo size="md" badgeText={`Nivel ${levelInfo.level}`} />

          <nav className="desktop-nav" aria-label="Navegación principal">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className="nav-pill"
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => handleSelectTab(item.id)}
                >
                  <Icon size={16} weight="duotone" aria-hidden="true" />
                  {item.label}
                  {isActive && (
                    <span
                      className="nav-indicator"
                      style={{ viewTransitionName: 'nav-indicator' }}
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="header-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSettingsTab('profile');
                setSettingsOpen(true);
              }}
              aria-label="Abrir Ajustes, Perfil, Conexiones y Privacidad"
              title="Ajustes, Perfil, Conexiones y Privacidad"
              style={{ gap: '0.45rem' }}
            >
              {(() => {
                const matchedPersona = SIMULATED_USER_PERSONAS.find(
                  (p) => p.profile.uid === profile.uid || (Boolean(profile.email) && p.profile.email === profile.email)
                );
                const avatarSrc = profile.photoURL || (matchedPersona ? assetUrl(matchedPersona.avatarFile) : assetUrl('images/avatar-javier.jpg'));
                return (
                  <img
                    src={avatarSrc}
                    alt=""
                    width={22}
                    height={22}
                    className="athlete-avatar"
                    style={{ inlineSize: '22px', blockSize: '22px' }}
                  />
                );
              })()}
              <GearSix size={15} weight="duotone" aria-hidden="true" />
              <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                {formatShortUserName(profile.displayName, profile.email)} · Ajustes
              </span>
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" className="main-container" style={{ viewTransitionName: 'main-view' }}>
        <div className="stack-lg">
          {toastMessage && (
            <div role="status" aria-live="polite" className="notice-banner">
              <ShieldCheck size={18} weight="duotone" aria-hidden="true" />
              {toastMessage}
            </div>
          )}

          {activeTab === 'dashboard' && (
            <>
              <CoachLynxBanner
                profile={profile}
                levelInfo={levelInfo}
                workouts={workouts}
                todayWorkout={todayWorkout}
                fitToday={fitToday}
                onOpenExam={handleOpenPhysicalExam}
                onOpenGoalModal={() => setGoalModalOpen(true)}
              />
              <DashboardView
                profile={profile}
                todayWorkout={todayWorkout}
                tomorrowWorkout={tomorrowWorkout}
                fitDays={fitDays}
                todayMacros={todayMacros}
                fitSyncLoading={fitSyncLoading}
                fitNotice={fitNotice}
                connectedPlatforms={connectedPlatforms}
                onConfigureTodayRoutine={handleConfigureTodayRoutine}
                onSaveUpdatedWorkout={handleSaveUpdatedTodayWorkout}
                onStartTimer={(w, blockIdx = 0) => {
                  setTimerStartBlock(blockIdx);
                  setTimerWorkout(w);
                }}
                onCompleteWorkout={(w) => setLoggingWorkout(w)}
                onSyncPlatforms={handleSyncPlatforms}
                onOpenConnections={() => {
                  setSettingsTab('connections');
                  setSettingsOpen(true);
                }}
                onNavigate={handleSelectTab}
              />
            </>
          )}

          {activeTab === 'calendar' && (
            <CalendarView
              workouts={workouts}
              onStartTimer={(w, blockIdx = 0) => {
                setTimerStartBlock(blockIdx);
                setTimerWorkout(w);
              }}
              onSelectComplete={(w) => setLoggingWorkout(w)}
              onSwapModality={handleSwapModality}
              onSwapWorkoutDays={handleSwapWorkoutDays}
              onOpenExam={handleOpenPhysicalExam}
            />
          )}

          {activeTab === 'stats' && (
            <StatsAndExamView
              profile={profile}
              workouts={workouts}
              exams={exams}
              onSubmitExam={handleSubmitExam}
              onEditProfile={() => setIsEditingProfile(true)}
            />
          )}

          {activeTab === 'strategies' && (
            <StrategiesAndCardioView
              profile={profile}
              onSelectStrategy={handleSelectStrategy}
            />
          )}

          {activeTab === 'nutrition' && (
            <NutritionView
              profile={profile}
              todayWorkout={todayWorkout}
              fitToday={fitToday}
              onViewedMacros={handleViewedMacros}
            />
          )}

          <footer className="landing-footer" style={{ paddingTop: '1rem', fontSize: '0.76rem' }}>
            <div className="row-wrap muted">
              <span>FlyRun · Uso informativo deportivo (no sustituye criterio médico)</span>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setSettingsTab('privacy');
                setSettingsOpen(true);
              }}
            >
              Privacidad y Ajustes
            </button>
          </footer>
        </div>
      </main>

      <nav className="mobile-nav" aria-label="Navegación móvil">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className="mobile-nav-btn"
              aria-current={activeTab === item.id ? 'page' : undefined}
              onClick={() => handleSelectTab(item.id)}
            >
              <Icon size={19} weight="duotone" aria-hidden="true" />
              <span>{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>

      <WorkoutLogDialog
        workout={loggingWorkout}
        weightKg={profile.weightKg}
        sex={profile.sex}
        vdot={profile.vdot}
        onClose={() => setLoggingWorkout(null)}
        onConfirmComplete={handleCompleteWorkout}
      />

      <LiveWorkoutTimerDialog
        workout={timerWorkout}
        profile={profile}
        initialBlockIndex={timerStartBlock}
        onClose={() => setTimerWorkout(null)}
        onCustomizeRoutine={handleCustomizeRoutine}
        onFinishToLog={(w, elapsedMin, elapsedDistKm) => {
          setLoggingWorkout({
            ...w,
            durationMinutes: elapsedMin,
            targetDistanceKm: elapsedDistKm ?? w.targetDistanceKm,
          });
        }}
      />

      <SettingsModal
        open={settingsOpen}
        initialTab={settingsTab}
        profile={profile}
        theme={theme}
        connectedPlatforms={connectedPlatforms}
        isDemoMode={session.isDemoMode}
        syncLoading={fitSyncLoading}
        onClose={() => setSettingsOpen(false)}
        onTogglePlatform={handleTogglePlatform}
        onSyncNow={handleSyncPlatforms}
        onUpdateQuickProfile={handleUpdateQuickProfile}
        onOpenGoalModal={() => setGoalModalOpen(true)}
        onOpenFullProfileEdit={() => setIsEditingProfile(true)}
        onOpenExam={handleOpenPhysicalExam}
        onOpenPersonas={() => setPersonasOpen(true)}
        onToggleTheme={setThemeExplicit}
        onOpenLegal={(tab) => openLegal(tab)}
        onOpenCookieSettings={() => setForceCookieConfig(true)}
        onExportJSON={handleExportGDPR}
        onExportCSV={handleExportCSV}
        onSignOut={() => {
          void signOutFirebase().then(() => {
            setSession(null);
            setProfile(null);
          });
        }}
      />

      <UserPersonasModal
        open={personasOpen}
        activeUid={profile.uid}
        activeEmail={profile.email}
        onClose={() => setPersonasOpen(false)}
        onSelectPersona={(p) => void handleSelectPersona(p)}
      />

      <GoalFocusModal
        open={goalModalOpen}
        profile={profile}
        onClose={() => setGoalModalOpen(false)}
        onSaveGoalAndFocus={handleSaveGoalAndFocus}
      />

      {sharedLegalModalAndBanner}
    </div>
  );
}

export default App;
