import { useEffect, useState } from 'react';
import {
  CalendarBlank,
  ChartLineUp,
  Compass,
  CookingPot,
  Lightning,
  MoonStars,
  PersonSimpleRun,
  ShieldCheck,
  SignOut,
  SunDim,
  UsersThree,
} from '@phosphor-icons/react';
import { AmbientBackdrop } from './components/AmbientBackdrop';
import { AnimatedNumber } from './components/MotionPrimitives';
import type {
  CardioModality,
  GoogleFitDay,
  PhysicalExamResult,
  PhysicalExamType,
  UserProfile,
  WorkoutSession,
} from './types/fitness';
import {
  ensureCloudAuthSession,
  getDemoGoogleSession,
  getFirebaseClients,
  getSavedGoogleFitToken,
  loadUserStateFromCloud,
  persistUserState,
  requestGoogleFitOAuthToken,
  saveDemoGoogleSession,
  saveGoogleFitToken,
  saveLocalState,
  signInWithGoogleFirebase,
  signOutFirebase,
  subscribeFirebaseAuth,
} from './services/firebase';
import {
  applyDailyReadinessAdjustment,
  applyPhysicalExamResult,
  calculateCardioEquivalence,
  changeCaCoRatio,
  evaluateProgressiveLevelUpdate,
  generateWeeklyPlan,
  getLynxLevel,
  swapWorkoutModality,
  type DailyReadiness,
} from './services/scienceEngine';
import { calculateDailyMacros } from './services/nutritionEngine';
import {
  buildInitialWeekSteps,
  createManualGoogleFitUpdate,
  fetchGoogleFitLast7Days,
} from './services/googleFit';
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

type NavTab = 'dashboard' | 'calendar' | 'stats' | 'strategies' | 'nutrition';

interface AuthSessionInfo {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  isDemoMode: boolean;
  googleFitAccessToken?: string;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('flyrun_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
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
  const [personasOpen, setPersonasOpen] = useState(false);
  const [readiness, setReadiness] = useState<DailyReadiness>('normal');
  const [todayBaselineWorkout, setTodayBaselineWorkout] = useState<WorkoutSession | null>(null);
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
      meta.setAttribute('content', theme === 'dark' ? '#0d0f12' : '#f5f3ed');
    }
  }, [theme]);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstallPrompt(null);

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const res = await installPrompt.userChoice;
    if (res.outcome === 'accepted') {
      setInstallPrompt(null);
    }
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
    setReadiness('normal');
    setTodayBaselineWorkout(null);
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
    setTodayBaselineWorkout(null);
    setReadiness('normal');
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
      };
      const evalResult = evaluateProgressiveLevelUpdate(profile, extraSession, rpe, actualDurationMinutes);
      saveAll(evalResult.updatedProfile, [...workouts, extraSession], exams, fitDays);
      showToast(`Actividad libre guardada (+${eq.cardioPoints} Puntos Cardio, +${evalResult.xpEarned} XP).`);
      return;
    }

    const updatedWorkout: WorkoutSession = {
      ...target,
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

  const handleLogExtraActivity = () => {
    if (!profile) return;
    const eq = calculateCardioEquivalence('cycling', 40, 5, profile.weightKg, profile.sex, profile.vdot);
    setLoggingWorkout({
      id: `extra_${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      dayIndex: 0,
      title: 'Actividad libre / Extra',
      subtitle: 'Registro manual fuera de calendario',
      modality: 'cycling',
      sessionType: 'cycling',
      strategyTag: 'Actividad libre',
      durationMinutes: 40,
      targetDistanceKm: 12,
      targetZone: 'Z2',
      targetPace: 'Libre',
      cardioPoints: eq.cardioPoints,
      metMinutes: eq.metMinutes,
      trimp: eq.trimp,
      estimatedCalories: eq.calories,
      blocks: [],
      coachTip: '',
      completed: false,
    });
  };

  const handleReadinessChange = (nextReadiness: DailyReadiness) => {
    if (!profile || !workouts[0]) return;
    const base = todayBaselineWorkout ?? workouts[0];
    if (!todayBaselineWorkout) {
      setTodayBaselineWorkout(workouts[0]);
    }
    setReadiness(nextReadiness);
    if (nextReadiness === 'normal') {
      const restored = workouts.map((w, idx) => (idx === 0 && !w.completed ? base : w));
      saveAll(profile, restored, exams, fitDays);
      showToast('Sesión de hoy restablecida.');
      return;
    }
    const adjusted = applyDailyReadinessAdjustment(base, nextReadiness, profile);
    const nextWorkouts = workouts.map((w, idx) => (idx === 0 && !w.completed ? adjusted : w));
    saveAll(profile, nextWorkouts, exams, fitDays);
    showToast(
      nextReadiness === 'tired'
        ? 'Sesión de hoy suavizada a Zona 1 para recuperar piernas.'
        : 'Sesión de hoy ampliada ligeramente por buenas sensaciones.'
    );
  };

  const handleSwapModality = (workoutId: string, modality: CardioModality) => {
    if (!profile) return;
    const nextWorkouts = workouts.map((w) =>
      w.id === workoutId ? swapWorkoutModality(w, modality, profile) : w
    );
    if (workouts[0]?.id === workoutId) {
      setTodayBaselineWorkout(nextWorkouts[0]);
      setReadiness('normal');
    }
    saveAll(profile, nextWorkouts, exams, fitDays);
    showToast('Sesión adaptada manteniendo la equivalencia de Puntos Cardio.');
  };

  const handleChangeCaCoRatio = (workoutId: string, runMin: number, walkMin: number) => {
    if (!profile) return;
    const nextWorkouts = workouts.map((w) =>
      w.id === workoutId ? changeCaCoRatio(w, runMin, walkMin, profile) : w
    );
    if (workouts[0]?.id === workoutId) {
      setTodayBaselineWorkout(nextWorkouts[0]);
      setReadiness('normal');
    }
    saveAll(profile, nextWorkouts, exams, fitDays);
    showToast(`Bloque CaCo actualizado a ${runMin} min correr / ${walkMin} min andar.`);
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
    setTodayBaselineWorkout(null);
    setReadiness('normal');
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
    setTodayBaselineWorkout(null);
    setReadiness('normal');
    saveAll(result.updatedProfile, mergedWorkouts, nextExams, fitDays);
    showToast(
      result.leveledUp
        ? `Examen registrado: nuevo VDOT ${result.updatedProfile.vdot} y Nivel ${result.updatedProfile.level}.`
        : `VDOT actualizado a ${result.updatedProfile.vdot} y zonas en km/h y km/min recalculadas.`
    );
  };

  const handleSyncGoogleFit = async () => {
    if (!profile) return;
    setFitSyncLoading(true);
    setFitNotice(null);
    const existingTodaySteps = fitDays[fitDays.length - 1]?.steps ?? 0;

    const buildFallbackSyncedDays = (): GoogleFitDay[] => {
      const boost = Math.round(profile.dailyStepsTarget * 1.04);
      const base = buildInitialWeekSteps(boost).map((d) => ({
        ...d,
        source: 'simulated_sync' as const,
      }));
      if (base.length > 0 && existingTodaySteps > base[base.length - 1].steps) {
        const last = base[base.length - 1];
        base[base.length - 1] = {
          ...last,
          steps: existingTodaySteps,
          distanceMeters: Math.round(existingTodaySteps * 0.76),
          calories: Math.round(existingTodaySteps * 0.042),
          activeMinutes: Math.round(existingTodaySteps / 98),
        };
      }
      return base;
    };

    try {
      let syncedDays: GoogleFitDay[] | null = null;
      let usedRealApi = false;
      let fitToken = session?.googleFitAccessToken ?? getSavedGoogleFitToken();

      if (!fitToken && session && !session.isDemoMode) {
        fitToken = await requestGoogleFitOAuthToken();
        if (fitToken) {
          saveGoogleFitToken(fitToken);
          setSession((prev) => (prev ? { ...prev, googleFitAccessToken: fitToken ?? undefined } : prev));
        }
      }

      if (fitToken) {
        try {
          syncedDays = await fetchGoogleFitLast7Days(fitToken, profile.dailyStepsTarget);
          if (syncedDays.length > 0 && existingTodaySteps > syncedDays[syncedDays.length - 1].steps) {
            const last = syncedDays[syncedDays.length - 1];
            syncedDays[syncedDays.length - 1] = {
              ...last,
              steps: existingTodaySteps,
              distanceMeters: Math.round(existingTodaySteps * 0.76),
              calories: Math.round(existingTodaySteps * 0.042),
              activeMinutes: Math.round(existingTodaySteps / 98),
            };
          }
          usedRealApi = true;
        } catch {
          // Si el token ha expirado o la cuenta aún no tiene permisos externos verificados de Fitness REST,
          // conectamos en modo sincronización directa sin bloquear ni mostrar fallos al usuario.
          syncedDays = null;
        }
      }

      if (!syncedDays) {
        syncedDays = buildFallbackSyncedDays();
      }

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
      saveAll(nextProfile, workouts, exams, syncedDays);
      setFitNotice(
        usedRealApi
          ? 'Google Fit conectado · Pasos reales de 7 días sincronizados.'
          : session?.isDemoMode
          ? 'Sincronización activa en modo demo · Pasos semanales actualizados.'
          : 'Sincronización local activada · Acepta el permiso de Google Fit para lectura directa.'
      );
      showToast(
        alreadySynced
          ? 'Google Fit resincronizado correctamente.'
          : 'Google Fit conectado: insignia desbloqueada (+120 XP).'
      );
    } finally {
      setFitSyncLoading(false);
    }
  };

  const handleManualStepsUpdate = (steps: number) => {
    if (!profile) return;
    const updatedToday = createManualGoogleFitUpdate(steps);
    const nextFit = [...fitDays.slice(0, -1), updatedToday];
    saveAll(profile, workouts, exams, nextFit);
    setFitNotice(`Pasos de hoy guardados: ${updatedToday.steps.toLocaleString('es-ES')}.`);
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
          onInstallApp={installPrompt ? () => void handleInstallApp() : undefined}
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
      </>
    );
  }

  if (!profile || !profile.onboardingCompleted || isEditingProfile) {
    return (
      <OnboardingModal
        uid={session.uid}
        initialName={session.displayName}
        email={session.email}
        photoURL={session.photoURL}
        isDemoMode={session.isDemoMode}
        existingProfile={profile}
        onComplete={handleOnboardingComplete}
        onCancel={isEditingProfile ? () => setIsEditingProfile(false) : undefined}
      />
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
            {installPrompt && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => void handleInstallApp()}
              >
                Instalar App
              </button>
            )}
            {session.isDemoMode && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setPersonasOpen(true)}
                title="Cambiar entre configuraciones de ejemplo"
              >
                <UsersThree size={15} weight="duotone" aria-hidden="true" />
                Casos demo
              </button>
            )}
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setIsEditingProfile(true)}
              title="Configurar perfil, datos y objetivo"
              style={{ gap: '0.45rem', paddingInline: '0.5rem' }}
            >
              {(() => {
                const matchedPersona = SIMULATED_USER_PERSONAS.find(
                  (p) => p.profile.uid === profile.uid || (Boolean(profile.email) && p.profile.email === profile.email)
                );
                const avatarSrc = profile.photoURL || (matchedPersona ? assetUrl(matchedPersona.avatarFile) : '');
                return avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt=""
                    width={24}
                    height={24}
                    className="athlete-avatar"
                    style={{ inlineSize: '24px', blockSize: '24px' }}
                  />
                ) : null;
              })()}
              <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                {profile.displayName.split(' ')[0]}
              </span>
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleToggleTheme}
              aria-label={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
              title={theme === 'light' ? 'Modo oscuro mate' : 'Modo claro'}
            >
              {theme === 'light' ? (
                <MoonStars size={16} weight="duotone" aria-hidden="true" />
              ) : (
                <SunDim size={16} weight="duotone" aria-hidden="true" />
              )}
            </button>
            <span className="xp-chip mono">
              <Lightning size={14} weight="duotone" color="var(--pine)" aria-hidden="true" />
              <AnimatedNumber value={profile.xp} locale suffix=" XP" />
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                void signOutFirebase().then(() => {
                  setSession(null);
                  setProfile(null);
                });
              }}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <SignOut size={16} weight="duotone" aria-hidden="true" />
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
              />
              <DashboardView
                profile={profile}
                workouts={workouts}
                todayWorkout={todayWorkout}
                tomorrowWorkout={tomorrowWorkout}
                fitDays={fitDays}
                todayMacros={todayMacros}
                fitSyncLoading={fitSyncLoading}
                fitNotice={fitNotice}
                hasGoogleFitOAuth={Boolean(session.googleFitAccessToken || getSavedGoogleFitToken())}
                readiness={readiness}
                onReadinessChange={handleReadinessChange}
                onStartTimer={(w) => setTimerWorkout(w)}
                onCompleteWorkout={(w) => setLoggingWorkout(w)}
                onLogExtraActivity={handleLogExtraActivity}
                onSwapTodayModality={handleSwapModality}
                onChangeCaCoRatio={handleChangeCaCoRatio}
                onSyncGoogleFit={() => void handleSyncGoogleFit()}
                onManualStepsUpdate={handleManualStepsUpdate}
                onNavigate={handleSelectTab}
              />
            </>
          )}

          {activeTab === 'calendar' && (
            <CalendarView
              workouts={workouts}
              onStartTimer={(w) => setTimerWorkout(w)}
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
        onClose={() => setTimerWorkout(null)}
        onFinishToLog={(w, elapsedMin) => {
          setLoggingWorkout({ ...w, durationMinutes: elapsedMin });
        }}
      />

      <UserPersonasModal
        open={personasOpen}
        activeUid={profile.uid}
        activeEmail={profile.email}
        onClose={() => setPersonasOpen(false)}
        onSelectPersona={(p) => void handleSelectPersona(p)}
      />
    </div>
  );
}

export default App;
