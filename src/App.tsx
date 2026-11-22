import { useEffect, useState } from 'react';
import {
  Activity,
  BookOpen,
  Calendar,
  Compass,
  LogOut,
  Moon,
  ShieldCheck,
  Sun,
  UserCheck,
  Users,
  Utensils,
} from 'lucide-react';
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
  loadUserStateFromCloud,
  persistUserState,
  requestGoogleFitOAuthToken,
  saveDemoGoogleSession,
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
import type { SimulatedUserPersona } from './data/userPersonas';
import { ScientificLoader } from './components/ScientificLoader';
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

export function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return localStorage.getItem('flyrun_theme') === 'dark' ? 'dark' : 'light';
  });
  const [booting, setBooting] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
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
    localStorage.setItem('flyrun_theme', theme);
  }, [theme]);

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
    const cloudUid = await ensureCloudAuthSession();
    const targetUid = cloudUid ?? persona.profile.uid;
    const demoSession = {
      uid: targetUid,
      displayName: persona.profile.displayName,
      email: persona.profile.email,
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
    saveAll(personaProfile, generatedWorkouts, persona.exams, persona.fitDays);
    setIsEditingProfile(false);
    setActiveTab('dashboard');
    showToast(
      `Perfil de ${persona.name} cargado (Nivel ${personaProfile.level}, VDOT ${personaProfile.vdot}).`
    );
  };

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      const res = await signInWithGoogleFirebase();
      const s: AuthSessionInfo = { ...res, isDemoMode: false };
      setSession(s);
      await hydrateUserData(s);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error de autenticación';
      setAuthError(
        `No se pudo completar el inicio con Google (${msg}). Inténtalo de nuevo o explora la demo interactiva.`
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      const cloudUid = await ensureCloudAuthSession();
      const demoSession = {
        uid: cloudUid ?? 'demo_google_flyrun_user',
        displayName: 'Carlos Martín',
        email: '',
        photoURL: '',
      };
      saveDemoGoogleSession(demoSession);
      const s: AuthSessionInfo = { ...demoSession, isDemoMode: true };
      setSession(s);
      await hydrateUserData(s);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleOnboardingComplete = (newProfile: UserProfile) => {
    const generated = mergePreservingCompleted(workouts, generateWeeklyPlan(newProfile));
    const initialSteps =
      fitDays.length > 0 ? fitDays : buildInitialWeekSteps(newProfile.dailyStepsTarget);
    setTodayBaselineWorkout(null);
    setReadiness('normal');
    saveAll(newProfile, generated, exams, initialSteps);
    setIsEditingProfile(false);
    setActiveTab('dashboard');
    showToast(`Perfil guardado (Nivel ${newProfile.level}). Calendario de 4 semanas generado.`);
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
    heartRateBpm?: number
  ) => {
    if (!profile) return;
    const result = applyPhysicalExamResult(profile, examType, rawValue, secondaryValue, heartRateBpm);
    const mergedWorkouts = mergePreservingCompleted(workouts, generateWeeklyPlan(result.updatedProfile));
    const nextExams = [result.examResult, ...exams];
    setTodayBaselineWorkout(null);
    setReadiness('normal');
    saveAll(result.updatedProfile, mergedWorkouts, nextExams, fitDays);
    showToast(
      result.leveledUp
        ? `Examen registrado: nuevo VDOT ${result.updatedProfile.vdot} y Nivel ${result.updatedProfile.level}.`
        : `VDOT actualizado a ${result.updatedProfile.vdot} y zonas recalculadas.`
    );
  };

  const handleSyncGoogleFit = async () => {
    if (!profile) return;
    setFitSyncLoading(true);
    setFitNotice(null);
    try {
      let syncedDays: GoogleFitDay[];
      let fitToken = session?.googleFitAccessToken ?? null;
      if (!fitToken && session && !session.isDemoMode) {
        fitToken = await requestGoogleFitOAuthToken();
        if (fitToken) {
          setSession((prev) => (prev ? { ...prev, googleFitAccessToken: fitToken ?? undefined } : prev));
        }
      }
      if (fitToken) {
        syncedDays = await fetchGoogleFitLast7Days(fitToken);
        setFitNotice('Datos reales obtenidos de Google Fit API.');
      } else {
        const boost = Math.round(profile.dailyStepsTarget * 1.04);
        syncedDays = buildInitialWeekSteps(boost);
        setFitNotice('Sincronizado con estimación de pasos diarios (también puedes editar tus pasos reales abajo).');
      }
      const nextBadges = profile.unlockedBadges.includes('google_fit_sync')
        ? profile.unlockedBadges
        : [...profile.unlockedBadges, 'google_fit_sync'];
      const nextProfile: UserProfile = {
        ...profile,
        unlockedBadges: nextBadges,
        xp: profile.unlockedBadges.includes('google_fit_sync') ? profile.xp : profile.xp + 120,
      };
      saveAll(nextProfile, workouts, exams, syncedDays);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error de red';
      setFitNotice(`No se pudo consultar Google Fit (${msg}).`);
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
        <AuthLanding
          onGoogleLogin={handleGoogleLogin}
          onDemoLogin={() => void handleDemoLogin()}
          onOpenPersonas={() => setPersonasOpen(true)}
          theme={theme}
          onToggleTheme={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
          authLoading={authLoading}
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
    { id: 'calendar', label: 'Calendario', shortLabel: 'Calendario', icon: Calendar },
    { id: 'stats', label: 'Datos y Examen', shortLabel: 'Examen', icon: UserCheck },
    { id: 'strategies', label: 'Estrategias y Cardio', shortLabel: 'Cardio', icon: BookOpen },
    { id: 'nutrition', label: 'Macros', shortLabel: 'Macros', icon: Utensils },
  ];

  return (
    <div className="app-shell">
      <header className="top-header">
        <div className="header-inner">
          <div className="brand-mark">
            <span className="brand-monogram" aria-hidden="true">FR</span>
            <div>
              <div className="brand-title">
                FlyRun <span className="brand-badge">Nivel {levelInfo.level}</span>
              </div>
              <div className="muted" style={{ fontSize: '0.72rem' }}>
                {profile.displayName}
              </div>
            </div>
          </div>

          <nav className="desktop-nav" aria-label="Navegación principal">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  className="nav-pill"
                  aria-current={activeTab === item.id ? 'page' : undefined}
                  onClick={() => setActiveTab(item.id)}
                >
                  <Icon size={15} aria-hidden="true" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="header-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setPersonasOpen(true)}
              title="Ver opiniones de los 7 usuarios simulados y cambiar de perfil"
            >
              <Users size={14} aria-hidden="true" />
              7 Usuarios
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
              aria-label={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
              title={theme === 'light' ? 'Modo oscuro mate' : 'Modo claro'}
            >
              {theme === 'light' ? <Moon size={15} aria-hidden="true" /> : <Sun size={15} aria-hidden="true" />}
            </button>
            <span className="xp-chip mono">
              <Activity size={13} color="var(--pine)" aria-hidden="true" />
              {profile.xp} XP
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
              <LogOut size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main className="main-container">
        <div className="stack-lg">
          {toastMessage && (
            <div role="status" className="notice-banner">
              <ShieldCheck size={17} aria-hidden="true" />
              {toastMessage}
            </div>
          )}

          {activeTab === 'dashboard' && (
            <>
              <CoachLynxBanner
                profile={profile}
                levelInfo={levelInfo}
                todayWorkout={todayWorkout}
                tomorrowWorkout={tomorrowWorkout}
                onOpenExam={() => setActiveTab('stats')}
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
                readiness={readiness}
                onReadinessChange={handleReadinessChange}
                onStartTimer={(w) => setTimerWorkout(w)}
                onCompleteWorkout={(w) => setLoggingWorkout(w)}
                onLogExtraActivity={handleLogExtraActivity}
                onSwapTodayModality={handleSwapModality}
                onChangeCaCoRatio={handleChangeCaCoRatio}
                onSyncGoogleFit={() => void handleSyncGoogleFit()}
                onManualStepsUpdate={handleManualStepsUpdate}
                onNavigate={setActiveTab}
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
              onOpenExam={() => setActiveTab('stats')}
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
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>

      <WorkoutLogDialog
        workout={loggingWorkout}
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
