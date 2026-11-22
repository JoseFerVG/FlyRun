import { useState } from 'react';
import { Activity, Flame, Footprints, Settings2, ShieldCheck, Sparkles, Trophy } from 'lucide-react';
import {
  clearFirebaseConfig,
  getSavedFirebaseConfig,
  saveFirebaseConfig,
  type FirebaseConfigValues,
} from '../services/firebase';
import { SCIENTIFIC_LOADING_TIPS } from '../data/runningKnowledge';

interface AuthLandingProps {
  onGoogleLogin: () => Promise<void>;
  onDemoLogin: () => void;
  authLoading: boolean;
  authError: string | null;
}

export function AuthLanding({ onGoogleLogin, onDemoLogin, authLoading, authError }: AuthLandingProps) {
  const existingCfg = getSavedFirebaseConfig();
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [apiKey, setApiKey] = useState(existingCfg?.apiKey ?? '');
  const [authDomain, setAuthDomain] = useState(existingCfg?.authDomain ?? '');
  const [projectId, setProjectId] = useState(existingCfg?.projectId ?? '');
  const [appId, setAppId] = useState(existingCfg?.appId ?? '');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const featuredTip = SCIENTIFIC_LOADING_TIPS[0];

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const cfg: FirebaseConfigValues = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      appId: appId.trim(),
    };
    saveFirebaseConfig(cfg);
    setSavedNotice('Configuración Firebase guardada. Ya puedes iniciar sesión con Google Firebase.');
  };

  return (
    <main className="main-container" style={{ paddingBlock: 'clamp(1.5rem, 4vw, 3rem)' }}>
      <div className="stack-lg">
        <header className="row-between">
          <div className="brand-mark">
            <img
              src="/assets/lynx/lynx-coach-hero.png"
              alt="Mascota Lince Ibérico FlyRun"
              width={44}
              height={44}
              className="brand-avatar"
              fetchPriority="high"
            />
            <div>
              <div className="brand-title">
                FlyRun <span className="brand-badge">Pro SaaS</span>
              </div>
              <div className="muted" style={{ fontSize: '0.78rem' }}>
                Entrenador Lince Ibérico · Running &amp; Cardio Científico
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setShowConfigPanel((prev) => !prev)}
          >
            <Settings2 size={15} aria-hidden="true" />
            {existingCfg ? 'Firebase Conectado' : 'Configurar Firebase'}
          </button>
        </header>

        <section
          className="card card-highlight"
          style={{
            display: 'grid',
            gap: '2rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
            alignItems: 'center',
          }}
        >
          <div className="stack-md">
            <div className="row-wrap">
              <span className="pill pill-amber">
                <Sparkles size={13} aria-hidden="true" />
                Basado en VDOT, 80/20 &amp; CaCo Progresivo
              </span>
              <span className="pill pill-emerald">
                <Footprints size={13} aria-hidden="true" />
                Google Fit + Multi-Cardio
              </span>
            </div>

            <h1 style={{ margin: 0, fontSize: 'clamp(1.85rem, 4vw, 2.85rem)', lineHeight: 1.12, fontWeight: 800 }}>
              Tu entrenador personal <span style={{ color: '#fb923c' }}>Lince Ibérico</span> para correr mejor y vivir con energía.
            </h1>

            <p className="secondary" style={{ margin: 0, fontSize: '1.02rem' }}>
              Entra con Google en 1 clic. FlyRun evalúa tu nivel real desde el minuto uno, planifica qué toca hoy y mañana,
              sincroniza tus pasos con Google Fit, convierte partidos de fútbol o bici en Puntos Cardio y ajusta tus macros diarios.
            </p>

            {authError && (
              <div
                role="alert"
                style={{
                  background: 'rgba(239, 68, 68, 0.14)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '12px',
                  padding: '0.75rem 1rem',
                  fontSize: '0.86rem',
                  color: '#fecaca',
                }}
              >
                {authError}
              </div>
            )}

            <div className="row-wrap">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void onGoogleLogin()}
                disabled={authLoading}
              >
                <ShieldCheck size={18} aria-hidden="true" />
                {authLoading ? 'Conectando con Google...' : 'Continuar con Google (Firebase + Fit)'}
              </button>

              <button type="button" className="btn btn-secondary" onClick={onDemoLogin}>
                <Activity size={18} aria-hidden="true" />
                Acceso Rápido Google Demo (Sin esperar claves)
              </button>
            </div>

            <p className="muted" style={{ margin: 0, fontSize: '0.8rem' }}>
              Al crear tu cuenta accederás al cuestionario biométrico inicial de Coach Lince para calcular tu nivel exacto y tus zonas científicas.
            </p>
          </div>

          <div className="stack-md" style={{ alignItems: 'center' }}>
            <img
              src="/assets/lynx/lynx-coach-hero.png"
              alt="Lince Ibérico entrenador con cronómetro y silbato"
              width={360}
              height={360}
              fetchPriority="high"
              style={{
                inlineSize: 'min(100%, 340px)',
                blockSize: 'auto',
                aspectRatio: '1 / 1',
                objectFit: 'cover',
                borderRadius: '26px',
                border: '2px solid rgba(249, 115, 22, 0.5)',
                boxShadow: '0 24px 55px rgba(0, 0, 0, 0.55)',
              }}
            />
            <div
              style={{
                inlineSize: 'min(100%, 340px)',
                background: 'rgba(9, 14, 26, 0.85)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '14px',
                padding: '0.8rem 1rem',
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fdba74' }}>{featuredTip.title}</div>
              <div className="muted" style={{ fontSize: '0.78rem', marginBlockStart: '0.2rem' }}>
                {featuredTip.fact}
              </div>
            </div>
          </div>
        </section>

        {showConfigPanel && (
          <section className="card stack-md" aria-label="Configuración de proyecto Firebase">
            <div className="row-between">
              <div>
                <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Conectar tu Proyecto Firebase Web</h2>
                <p className="muted" style={{ margin: '0.2rem 0 0', fontSize: '0.84rem' }}>
                  Introduce las claves de tu app web Firebase (o variables <code>VITE_FIREBASE_*</code>) para activar Google Auth y Firestore en la nube.
                </p>
              </div>
              {existingCfg && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    clearFirebaseConfig();
                    setApiKey('');
                    setAuthDomain('');
                    setProjectId('');
                    setAppId('');
                    setSavedNotice('Configuración eliminada. Modo local activo.');
                  }}
                >
                  Restablecer
                </button>
              )}
            </div>

            <form onSubmit={handleSaveConfig} className="grid-2">
              <div className="field">
                <label htmlFor="fb-api-key">API Key</label>
                <input
                  id="fb-api-key"
                  className="input"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="fb-auth-domain">Auth Domain</label>
                <input
                  id="fb-auth-domain"
                  className="input"
                  value={authDomain}
                  onChange={(e) => setAuthDomain(e.target.value)}
                  placeholder="tu-proyecto.firebaseapp.com"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="fb-project-id">Project ID</label>
                <input
                  id="fb-project-id"
                  className="input"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder="tu-proyecto"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="fb-app-id">App ID</label>
                <input
                  id="fb-app-id"
                  className="input"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  placeholder="1:12345:web:abcdef"
                  required
                />
              </div>
              <div className="row-wrap" style={{ gridColumn: '1 / -1' }}>
                <button type="submit" className="btn btn-emerald">
                  Guardar Credenciales Firebase
                </button>
                {savedNotice && (
                  <span style={{ color: '#6ee7b7', fontSize: '0.84rem', fontWeight: 600 }}>{savedNotice}</span>
                )}
              </div>
            </form>
          </section>
        )}

        <section className="grid-4" aria-label="Ventajas científicas de FlyRun">
          <article className="card stack-sm">
            <Flame size={22} color="#fb923c" aria-hidden="true" />
            <h2 style={{ margin: 0, fontSize: '1rem' }}>Planificación 80/20 &amp; CaCo</h2>
            <p className="muted" style={{ margin: 0, fontSize: '0.84rem' }}>
              Desde bloques 2 min correr / 6 min andar hasta intervalos Billat y Umbral VDOT.
            </p>
          </article>
          <article className="card stack-sm">
            <Activity size={22} color="#38bdf8" aria-hidden="true" />
            <h2 style={{ margin: 0, fontSize: '1rem' }}>Equivalencia Multi-Cardio</h2>
            <p className="muted" style={{ margin: 0, fontSize: '0.84rem' }}>
              Corre, pedalea en bici o juega un partido de fútbol sumando Puntos Cardio equivalentes.
            </p>
          </article>
          <article className="card stack-sm">
            <Footprints size={22} color="#10b981" aria-hidden="true" />
            <h2 style={{ margin: 0, fontSize: '1rem' }}>Google Fit &amp; Examen Físico</h2>
            <p className="muted" style={{ margin: 0, fontSize: '0.84rem' }}>
              Tus pasos diarios y exámenes físicos recalibran tu VDOT y nivel automáticamente.
            </p>
          </article>
          <article className="card stack-sm">
            <Trophy size={22} color="#f59e0b" aria-hidden="true" />
            <h2 style={{ margin: 0, fontSize: '1rem' }}>Niveles Gamificados + Macros</h2>
            <p className="muted" style={{ margin: 0, fontSize: '0.84rem' }}>
              Sube del Nivel 1 al 10 ganando XP, medallas y recibe recomendación macro diaria.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
