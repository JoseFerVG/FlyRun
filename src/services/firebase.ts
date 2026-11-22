import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type Auth,
  type User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  initializeFirestore,
  setDoc,
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

export const DEFAULT_FIREBASE_CONFIG: FirebaseConfigValues = {
  apiKey: 'AIzaSyAWgSPjtpqmYpReRmE1Zld0OPZFbMU7SjA',
  authDomain: 'flyrun-cardio-jf26.firebaseapp.com',
  projectId: 'flyrun-cardio-jf26',
  storageBucket: 'flyrun-cardio-jf26.firebasestorage.app',
  messagingSenderId: '168644448542',
  appId: '1:168644448542:web:0d65da4cb414ef29e1b90f',
};

const CONFIG_STORAGE_KEY = 'flyrun_firebase_config_v1';
const LOCAL_STATE_PREFIX = 'flyrun_state_v1_';
const DEMO_USER_STORAGE_KEY = 'flyrun_demo_session_v1';
const GFIT_TOKEN_STORAGE_KEY = 'flyrun_gfit_token_v1';

export function getSavedGoogleFitToken(): string | null {
  try {
    return localStorage.getItem(GFIT_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveGoogleFitToken(token: string): void {
  try {
    localStorage.setItem(GFIT_TOKEN_STORAGE_KEY, token);
  } catch {
    // Ignore storage errors
  }
}

export interface PersistedUserState {
  profile: UserProfile | null;
  workouts: WorkoutSession[];
  exams: PhysicalExamResult[];
  fitDays: GoogleFitDay[];
}

export function getSavedFirebaseConfig(): FirebaseConfigValues {
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
    if (raw) {
      const parsed = JSON.parse(raw) as FirebaseConfigValues;
      if (parsed.apiKey && parsed.projectId && parsed.authDomain && parsed.appId) {
        return parsed;
      }
    }
  } catch {
    // Fallback to built-in Firebase project
  }

  return DEFAULT_FIREBASE_CONFIG;
}

export function isUsingCustomFirebaseConfig(): boolean {
  try {
    return Boolean(localStorage.getItem(CONFIG_STORAGE_KEY));
  } catch {
    return false;
  }
}

export function saveFirebaseConfig(config: FirebaseConfigValues): void {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  cachedApp = null;
  cachedAuth = null;
  cachedDb = null;
}

export function clearFirebaseConfig(): void {
  localStorage.removeItem(CONFIG_STORAGE_KEY);
  cachedApp = null;
  cachedAuth = null;
  cachedDb = null;
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
    try {
      cachedDb = initializeFirestore(cachedApp, { ignoreUndefinedProperties: true });
    } catch {
      cachedDb = getFirestore(cachedApp);
    }
  }

  return cachedApp && cachedAuth && cachedDb
    ? { app: cachedApp, auth: cachedAuth, db: cachedDb }
    : null;
}

/**
 * Recursively strips undefined keys from plain objects and arrays before writing to Firestore.
 */
function cleanFirestoreData<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => cleanFirestoreData(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (v !== undefined) {
        out[k] = cleanFirestoreData(v);
      }
    }
    return out as T;
  }
  return value;
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
  provider.setCustomParameters({ prompt: 'select_account' });

  const result = await signInWithPopup(clients.auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (credential?.accessToken) {
    saveGoogleFitToken(credential.accessToken);
  }

  return {
    uid: result.user.uid,
    displayName: result.user.displayName ?? 'Atleta FlyRun',
    email: result.user.email ?? '',
    photoURL: result.user.photoURL ?? '',
    googleFitAccessToken: credential?.accessToken,
  };
}

export async function requestGoogleFitOAuthToken(): Promise<string | null> {
  const clients = getFirebaseClients();
  if (!clients) return null;

  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/fitness.activity.read');
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(clients.auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      saveGoogleFitToken(credential.accessToken);
    }
    return credential?.accessToken ?? null;
  } catch {
    return null;
  }
}

export async function signInWithEmailFirebase(
  email: string,
  password: string,
  displayName?: string,
  isRegister = false
): Promise<{
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
}> {
  const clients = getFirebaseClients();
  if (!clients) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }

  const cleanEmail = email.trim();
  const result = isRegister
    ? await createUserWithEmailAndPassword(clients.auth, cleanEmail, password)
    : await signInWithEmailAndPassword(clients.auth, cleanEmail, password);

  if (isRegister && displayName?.trim()) {
    await updateProfile(result.user, { displayName: displayName.trim() });
  }

  return {
    uid: result.user.uid,
    displayName: result.user.displayName ?? displayName?.trim() ?? cleanEmail.split('@')[0] ?? 'Atleta FlyRun',
    email: result.user.email ?? cleanEmail,
    photoURL: result.user.photoURL ?? '',
  };
}

export async function ensureCloudAuthSession(): Promise<string | null> {
  const clients = getFirebaseClients();
  if (!clients) return null;
  if (clients.auth.currentUser) {
    return clients.auth.currentUser.uid;
  }
  try {
    const cred = await signInAnonymously(clients.auth);
    return cred.user.uid;
  } catch (err) {
    console.warn('No se pudo iniciar sesión anónima en Firebase:', err);
    return null;
  }
}

export function subscribeFirebaseAuth(callback: (user: User | null) => void): () => void {
  const clients = getFirebaseClients();
  if (!clients) return () => {};
  return onAuthStateChanged(clients.auth, callback);
}

export async function signOutFirebase(): Promise<void> {
  localStorage.removeItem(DEMO_USER_STORAGE_KEY);
  localStorage.removeItem(GFIT_TOKEN_STORAGE_KEY);
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
  const activeUid = clients?.auth.currentUser?.uid;
  const targetUid = activeUid ?? uid;
  if (!clients || !activeUid) return local;

  try {
    const userRef = doc(clients.db, 'users', targetUid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return local;
    }

    const profile = userSnap.data() as UserProfile;

    const workoutsSnap = await getDocs(collection(clients.db, 'users', targetUid, 'workouts'));
    const workouts: WorkoutSession[] = [];
    workoutsSnap.forEach((d) => workouts.push(d.data() as WorkoutSession));
    workouts.sort((a, b) => a.date.localeCompare(b.date));

    const examsSnap = await getDocs(collection(clients.db, 'users', targetUid, 'exams'));
    const exams: PhysicalExamResult[] = [];
    examsSnap.forEach((d) => exams.push(d.data() as PhysicalExamResult));
    exams.sort((a, b) => b.date.localeCompare(a.date));

    const fitSnap = await getDocs(collection(clients.db, 'users', targetUid, 'dailySteps'));
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
  } catch (err) {
    console.warn('Error cargando estado desde Cloud Firestore:', err);
    return local;
  }
}

export async function persistUserState(uid: string, state: PersistedUserState): Promise<boolean> {
  saveLocalState(uid, state);
  const clients = getFirebaseClients();
  const activeAuthUid = clients?.auth.currentUser?.uid;
  if (!clients || !activeAuthUid) return false;

  try {
    if (state.profile) {
      const profilePayload = cleanFirestoreData({
        ...state.profile,
        uid: activeAuthUid,
      });
      await setDoc(doc(clients.db, 'users', activeAuthUid), profilePayload, { merge: true });
    }

    await Promise.all([
      ...state.workouts.slice(0, 40).map((w) => {
        const cleanWorkout = cleanFirestoreData({
          ...w,
          dayIndex: Math.max(0, w.dayIndex),
        });
        return setDoc(doc(clients.db, 'users', activeAuthUid, 'workouts', w.id), cleanWorkout, { merge: true });
      }),
      ...state.exams.slice(0, 10).map((ex) => {
        const cleanExam = cleanFirestoreData(ex);
        return setDoc(doc(clients.db, 'users', activeAuthUid, 'exams', ex.id), cleanExam, { merge: true });
      }),
      ...state.fitDays.slice(0, 14).map((fd) => {
        const cleanFit = cleanFirestoreData(fd);
        return setDoc(doc(clients.db, 'users', activeAuthUid, 'dailySteps', fd.date), cleanFit, { merge: true });
      }),
    ]);
    return true;
  } catch (err) {
    console.warn('No se pudo sincronizar con Cloud Firestore (respaldo local activo):', err);
    return false;
  }
}
