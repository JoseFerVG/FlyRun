import { useEffect, useState } from 'react';
import {
  Activity,
  BookOpen,
  Calendar,
  Compass,
  LogOut,
  ShieldCheck,
  UserCheck,
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
  getDemoGoogleSession,
  getFirebaseClients,
  loadUserStateFromCloud,
  persistUserState,
  saveDemoGoogleSession,
  signInWithGoogleFirebase,
  signOutFirebase,
  subscribeFirebaseAuth,
} from './services/firebase';
import {
  applyPhysicalExamResult,
  evaluateProgressiveLevelUpdate,
  generateWeeklyPlan,
  getLynxLevel,
  swapWorkoutModality,
} from './services/scienceEngine';
import { calculateDailyMacros } from './services/nutritionEngine';
import {
  buildInitialWeekSteps,
  createManualGoogleFitUpdate,
  fetchGoogleFitLast7Days,
} from './services/googleFit';
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
  const [fitSyncLoading, setFitSyncLoading] = useState(false);
  const [fitNotice, setFitNotice] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
    }, 1250);

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
              displayName: fbUser.displayName ?? 'Usuario FlyRun',
              email: fbUser.email ?? '',
              photoURL: fbUser.photoURL ?? '',
              isDemoMode: false,
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
      if (msg === 'FIREBASE_NOT_CONFIGURED') {
        setAuthError(
          'Configura primero tus claves en "Conectar Firebase" arriba a la derecha, o usa el perfil de ejemplo.'
        );
      } else {
        setAuthError(
          `No se pudo completar el inicio con Google (${msg}). Comprueba los dominios autorizados en Firebase o prueba con el perfil de ejemplo.`
        );
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    const demoSession = {
      uid: 'demo_google_flyrun_user',
      displayName: 'Carlos Martín',
      email: 'carlos.martin@gmail.com',
      photoURL: '',
    };
    saveDemoGoogleSession(demoSession);
    const s: AuthSessionInfo = { ...demoSession, isDemoMode: true };
    setSession(s);
    await hydrateUserData(s);
  };

  const handleOnboardingComplete = (newProfile: UserProfile) => {
    const generated = generateWeeklyPlan(newProfile);
    const initialSteps =
      fitDays.length > 0 ? fitDays : buildInitialWeekSteps(newProfile.dailyStepsTarget);
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
    if (!target) return;

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

  const handleSwapModality = (workoutId: string, modality: CardioModality) => {
    if (!profile) return;
    const nextWorkouts = workouts.map((w) =>
      w.id === workoutId ? swapWorkoutModality(w, modality, profile) : w
    );
    saveAll(profile, nextWorkouts, exams, fitDays);
    showToast('Sesión adaptada manteniendo la equivalencia de Puntos Cardio.');
  };

  const handleSelectStrategy = (strategyId: string) => {
    if (!profile) return;
    const updatedProfile: UserProfile = {
      ...profile,
      preferredStrategyId: strategyId,
      updatedAt: new Date().toISOString(),
    };
    const nextWorkouts = generateWeeklyPlan(updatedProfile);
    saveAll(updatedProfile, nextWorkouts, exams, fitDays);
    showToast('Estrategia aplicada y calendario actualizado.');
  };

  const handleSubmitExam = (
    examType: PhysicalExamType,
    rawValue: number,
    secondaryValue?: number,
    heartRateBpm?: number
  ) => {
    if (!profile) return;
    const result = applyPhysicalExamResult(profile, examType, rawValue, secondaryValue, heartRateBpm);
    const regenerated = generateWeeklyPlan(result.updatedProfile);
    const mergedWorkouts = regenerated.map((rw) => {
      const existing = workouts.find((w) => w.date === rw.date && w.completed);
      return existing ?? rw;
    });
    const nextExams = [result.examResult, ...exams];
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
      if (session?.googleFitAccessToken) {
        syncedDays = await fetchGoogleFitLast7Days(session.googleFitAccessToken);
        setFitNotice('Datos obtenidos de Google Fit.');
      } else {
        const boost = Math.round(profile.dailyStepsTarget * 1.04);
        syncedDays = buildInitialWeekSteps(boost);
        setFitNotice('Sincronizado con datos de ejemplo (conecta Google OAuth para lectura real).');
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
      <AuthLanding
        onGoogleLogin={handleGoogleLogin}
        onDemoLogin={() => void handleDemoLogin()}
        authLoading={authLoading}
        authError={authError}
      />
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
                {session.isDemoMode ? 'Perfil de ejemplo' : 'Google + Firebase'}
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
            <span className="xp-chip mono">
              <Activity size={13} color="#186a4b" aria-hidden="true" />
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
                todayWorkout={todayWorkout}
                tomorrowWorkout={tomorrowWorkout}
                fitDays={fitDays}
                todayMacros={todayMacros}
                fitSyncLoading={fitSyncLoading}
                fitNotice={fitNotice}
                onCompleteWorkout={(w) => setLoggingWorkout(w)}
                onSwapTodayModality={handleSwapModality}
                onSyncGoogleFit={() => void handleSyncGoogleFit()}
                onManualStepsUpdate={handleManualStepsUpdate}
                onNavigate={setActiveTab}
              />
            </>
          )}

          {activeTab === 'calendar' && (
            <CalendarView
              workouts={workouts}
              onSelectComplete={(w) => setLoggingWorkout(w)}
              onSwapModality={handleSwapModality}
              onOpenExam={() => setActiveTab('stats')}
            />
          )}

          {activeTab === 'stats' && (
            <StatsAndExamView
              profile={profile}
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
    </div>
  );
}

export default App;
