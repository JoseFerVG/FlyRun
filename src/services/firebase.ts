import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type Auth,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  type Firestore,
} from 'firebase/firestore';
import type { GoogleFitDay, PhysicalExamResult, UserProfile, WorkoutSession } from '../types/fitness';

export interface FirebaseConfigValues {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

const CONFIG_STORAGE_KEY = 'flyrun_firebase_config_v1';
const LOCAL_STATE_PREFIX = 'flyrun_state_v1_';
const DEMO_USER_STORAGE_KEY = 'flyrun_demo_session_v1';

export interface PersistedUserState {
  profile: UserProfile | null;
  workouts: WorkoutSession[];
  exams: PhysicalExamResult[];
  fitDays: GoogleFitDay[];
}

export function getSavedFirebaseConfig(): FirebaseConfigValues | null {
  try {
    const envKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
    const envProject = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined;
    const envAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined;
    const envAppId = import.meta.env.VITE_FIREBASE_APP_ID as string | undefined;

    if (envKey && envProject && envAuthDomain && envAppId) {
      return {
        apiKey: envKey,
        authDomain: envAuthDomain,
        projectId: envProject,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
        appId: envAppId,
      };
    }

    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FirebaseConfigValues;
    if (!parsed.apiKey || !parsed.projectId || !parsed.authDomain || !parsed.appId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveFirebaseConfig(config: FirebaseConfigValues): void {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
}

export function clearFirebaseConfig(): void {
  localStorage.removeItem(CONFIG_STORAGE_KEY);
}

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;
let cachedDb: Firestore | null = null;

export function getFirebaseClients(): { app: FirebaseApp; auth: Auth; db: Firestore } | null {
  const cfg = getSavedFirebaseConfig();
  if (!cfg) return null;

  if (!cachedApp) {
    cachedApp = getApps().length > 0 ? getApps()[0] : initializeApp(cfg);
    cachedAuth = getAuth(cachedApp);
    cachedDb = getFirestore(cachedApp);
  }

  return cachedApp && cachedAuth && cachedDb
    ? { app: cachedApp, auth: cachedAuth, db: cachedDb }
    : null;
}

export async function signInWithGoogleFirebase(): Promise<{
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  googleFitAccessToken?: string;
}> {
  const clients = getFirebaseClients();
  if (!clients) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }

  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/fitness.activity.read');
  provider.setCustomParameters({ prompt: 'select_account' });

  const result = await signInWithPopup(clients.auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);

  return {
    uid: result.user.uid,
    displayName: result.user.displayName ?? 'Atleta FlyRun',
    email: result.user.email ?? '',
    photoURL: result.user.photoURL ?? '',
    googleFitAccessToken: credential?.accessToken,
  };
}

export function subscribeFirebaseAuth(callback: (user: User | null) => void): () => void {
  const clients = getFirebaseClients();
  if (!clients) return () => {};
  return onAuthStateChanged(clients.auth, callback);
}

export async function signOutFirebase(): Promise<void> {
  localStorage.removeItem(DEMO_USER_STORAGE_KEY);
  const clients = getFirebaseClients();
  if (clients) {
    await signOut(clients.auth);
  }
}

export interface DemoGoogleSession {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
}

export function saveDemoGoogleSession(session: DemoGoogleSession): void {
  localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(session));
}

export function getDemoGoogleSession(): DemoGoogleSession | null {
  try {
    const raw = localStorage.getItem(DEMO_USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DemoGoogleSession) : null;
  } catch {
    return null;
  }
}

export function loadLocalState(uid: string): PersistedUserState {
  try {
    const raw = localStorage.getItem(`${LOCAL_STATE_PREFIX}${uid}`);
    if (!raw) {
      return { profile: null, workouts: [], exams: [], fitDays: [] };
    }
    return JSON.parse(raw) as PersistedUserState;
  } catch {
    return { profile: null, workouts: [], exams: [], fitDays: [] };
  }
}

export function saveLocalState(uid: string, state: PersistedUserState): void {
  localStorage.setItem(`${LOCAL_STATE_PREFIX}${uid}`, JSON.stringify(state));
}

export async function loadUserStateFromCloud(uid: string): Promise<PersistedUserState> {
  const local = loadLocalState(uid);
  const clients = getFirebaseClients();
  if (!clients) return local;

  try {
    const userRef = doc(clients.db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return local;
    }

    const profile = userSnap.data() as UserProfile;

    const workoutsSnap = await getDocs(collection(clients.db, 'users', uid, 'workouts'));
    const workouts: WorkoutSession[] = [];
    workoutsSnap.forEach((d) => workouts.push(d.data() as WorkoutSession));
    workouts.sort((a, b) => a.date.localeCompare(b.date));

    const examsSnap = await getDocs(collection(clients.db, 'users', uid, 'exams'));
    const exams: PhysicalExamResult[] = [];
    examsSnap.forEach((d) => exams.push(d.data() as PhysicalExamResult));
    exams.sort((a, b) => b.date.localeCompare(a.date));

    const fitSnap = await getDocs(collection(clients.db, 'users', uid, 'dailySteps'));
    const fitDays: GoogleFitDay[] = [];
    fitSnap.forEach((d) => fitDays.push(d.data() as GoogleFitDay));
    fitDays.sort((a, b) => a.date.localeCompare(b.date));

    const cloudState: PersistedUserState = {
      profile,
      workouts: workouts.length > 0 ? workouts : local.workouts,
      exams: exams.length > 0 ? exams : local.exams,
      fitDays: fitDays.length > 0 ? fitDays : local.fitDays,
    };

    saveLocalState(uid, cloudState);
    return cloudState;
  } catch {
    return local;
  }
}

export async function persistUserState(uid: string, state: PersistedUserState): Promise<void> {
  saveLocalState(uid, state);
  const clients = getFirebaseClients();
  if (!clients || !clients.auth.currentUser || clients.auth.currentUser.uid !== uid) return;

  try {
    if (state.profile) {
      await setDoc(doc(clients.db, 'users', uid), state.profile, { merge: true });
    }

    await Promise.all([
      ...state.workouts.slice(0, 28).map((w) =>
        setDoc(doc(clients.db, 'users', uid, 'workouts', w.id), w, { merge: true })
      ),
      ...state.exams.slice(0, 10).map((ex) =>
        setDoc(doc(clients.db, 'users', uid, 'exams', ex.id), ex, { merge: true })
      ),
      ...state.fitDays.slice(0, 14).map((fd) =>
        setDoc(doc(clients.db, 'users', uid, 'dailySteps', fd.date), fd, { merge: true })
      ),
    ]);
  } catch {
    // Mantiene respaldo local sin interrumpir la UX si Firestore aún no está desplegado o sin red
  }
}
