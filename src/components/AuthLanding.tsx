import { Activity, ArrowRight, Footprints } from 'lucide-react';
import { WorkoutVisualBar } from './WorkoutVisualBar';
import type { WorkoutBlock } from '../types/fitness';

interface AuthLandingProps {
  onGoogleLogin: () => Promise<void>;
  onDemoLogin: () => Promise<void> | void;
  onOpenPersonas: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  authLoading: boolean;
  authError: string | null;
}

const SAMPLE_BLOCKS: WorkoutBlock[] = [
  { label: 'Calentamiento', durationMinutes: 10, intensity: 'Z1', description: '', zone: 'Z1' },
  { label: 'Umbral 1', durationMinutes: 6, intensity: 'Z3', description: '', zone: 'Z3' },
  { label: 'Recup.', durationMinutes: 2, intensity: 'Z1', description: '', zone: 'Z1' },
  { label: 'Umbral 2', durationMinutes: 6, intensity: 'Z3', description: '', zone: 'Z3' },
  { label: 'Recup.', durationMinutes: 2, intensity: 'Z1', description: '', zone: 'Z1' },
  { label: 'Umbral 3', durationMinutes: 6, intensity: 'Z3', description: '', zone: 'Z3' },
  { label: 'Enfriamiento', durationMinutes: 8, intensity: 'Z1', description: '', zone: 'Z1' },
];

function GoogleLogoMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.21-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.29c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.09c.95-2.85 3.6-4.96 6.72-4.96z"
      />
    </svg>
  );
}

export function AuthLanding({
  onGoogleLogin,
  onDemoLogin,
  onOpenPersonas,
  theme,
  onToggleTheme,
  authLoading,
  authError,
}: AuthLandingProps) {
  return (
    <main id="main-content" className="main-container" style={{ paddingBlock: 'clamp(1.5rem, 4vw, 3rem)' }}>
      <div className="stack-lg">
        <header className="row-between">
          <div className="brand-mark">
            <span className="brand-monogram" aria-hidden="true">FR</span>
            <div>
              <div className="brand-title">
                <span translate="no">FlyRun</span> <span className="brand-badge">Entrenamiento</span>
              </div>
              <div className="muted" style={{ fontSize: '0.78rem' }}>
                Planificación de carrera, cardio diario y nutrición macro
              </div>
            </div>
          </div>

          <div className="row-wrap">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onOpenPersonas}>
              7 Perfiles de Prueba
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onToggleTheme}>
              {theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
            </button>
          </div>
        </header>

        <section
          className="card"
          style={{
            display: 'grid',
            gap: '2.1rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            alignItems: 'center',
          }}
        >
          <div className="stack-md">
            <div className="row-wrap">
              <span className="pill pill-amber">VDOT · Método 80/20 · CaCo</span>
              <span className="pill pill-emerald">
                <Footprints size={13} aria-hidden="true" />
                Compatible con Google Fit
              </span>
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: 'clamp(1.75rem, 3.6vw, 2.55rem)',
                lineHeight: 1.14,
                letterSpacing: '-0.03em',
                fontWeight: 800,
              }}
            >
              Entrena con la estructura de un preparador físico real, sin complicaciones.
            </h1>

            <p className="secondary" style={{ margin: 0, fontSize: '0.98rem' }}>
              Al crear tu cuenta medimos tu punto de partida con una prueba sencilla, calculamos tus ritmos y pulsaciones por zonas
              y organizamos cada semana combinando carrera, bicicleta, fútbol o caminata diaria con tus objetivos de macros.
            </p>

            {authError && (
              <div role="alert" className="error-banner">
                {authError}
              </div>
            )}

            <div className="row-wrap">
              <button
                type="button"
                className="btn btn-google"
                onClick={() => void onGoogleLogin()}
                disabled={authLoading}
              >
                <GoogleLogoMark />
                {authLoading ? 'Conectando con Google…' : 'Continuar con Google'}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => void onDemoLogin()}
                disabled={authLoading}
              >
                <ArrowRight size={17} aria-hidden="true" />
                Ver demo interactiva
              </button>
            </div>

            <p className="muted" style={{ margin: 0, fontSize: '0.8rem' }}>
              Acceso directo con tu cuenta de Google. Al entrar por primera vez completarás tu perfil y prueba inicial de nivel.
            </p>
          </div>

          <article className="inset-panel accent-rail stack-md" aria-label="Ficha técnica de sesión de ejemplo">
            <div className="row-between">
              <div>
                <div className="muted" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Ficha de sesión · Semana tipo
                </div>
                <strong style={{ fontSize: '1.04rem' }}>Bloques de Umbral · 40 min</strong>
              </div>
              <span className="pill pill-amber mono">VDOT 38.5</span>
            </div>

            <WorkoutVisualBar blocks={SAMPLE_BLOCKS} />

            <div className="grid-3" style={{ gap: '0.55rem' }}>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', borderRadius: '8px', padding: '0.58rem 0.72rem' }}>
                <div className="muted" style={{ fontSize: '0.72rem' }}>Zona 1 Suave</div>
                <div className="mono" style={{ fontWeight: 700, fontSize: '0.87rem', color: 'var(--pine)' }}>6:12 – 6:58 /km</div>
              </div>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', borderRadius: '8px', padding: '0.58rem 0.72rem' }}>
                <div className="muted" style={{ fontSize: '0.72rem' }}>Zona 3 Umbral</div>
                <div className="mono" style={{ fontWeight: 700, fontSize: '0.87rem', color: 'var(--accent)' }}>5:14 – 5:30 /km</div>
              </div>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', borderRadius: '8px', padding: '0.58rem 0.72rem' }}>
                <div className="muted" style={{ fontSize: '0.72rem' }}>Equivalencia bici</div>
                <div className="mono" style={{ fontWeight: 700, fontSize: '0.87rem', color: 'var(--cobalt)' }}>50 min Z2</div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-hairline)', paddingTop: '0.68rem', fontSize: '0.82rem' }} className="secondary stack-sm">
              <div className="row-between">
                <span>Pasos objetivo Google Fit</span>
                <strong className="mono">8.500 pasos/día</strong>
              </div>
              <div className="row-between">
                <span>Macros recomendados hoy</span>
                <strong className="mono">310g C · 132g P · 70g G</strong>
              </div>
            </div>
          </article>
        </section>

        <section className="grid-4" aria-label="Pilares del sistema de entrenamiento">
          <article className="card stack-sm">
            <span className="bento-index">01 · MÉTODO</span>
            <h2 style={{ margin: 0, fontSize: '0.96rem' }}>Progresión CaCo y 80/20</h2>
            <p className="muted" style={{ margin: 0, fontSize: '0.83rem' }}>
              Desde bloques de 2 min corriendo y 6 andando hasta sesiones polarizadas con ritmos exactos por zona.
            </p>
          </article>
          <article className="card stack-sm">
            <span className="bento-index">02 · ADAPTACIÓN</span>
            <h2 style={{ margin: 0, fontSize: '0.96rem' }}>Equivalencia multi-cardio</h2>
            <p className="muted" style={{ margin: 0, fontSize: '0.83rem' }}>
              Sustituye días de carrera por bicicleta o partido de fútbol manteniendo la carga en Puntos Cardio y TRIMP.
            </p>
          </article>
          <article className="card stack-sm">
            <span className="bento-index">03 · EVALUACIÓN</span>
            <h2 style={{ margin: 0, fontSize: '0.96rem' }}>Google Fit y exámenes físicos</h2>
            <p className="muted" style={{ margin: 0, fontSize: '0.83rem' }}>
              Registra pasos diarios y supera test de Cooper, 5K o Rockport para recalibrar tu nivel automáticamente.
            </p>
          </article>
          <article className="card stack-sm">
            <div className="row-wrap">
              <Activity size={15} color="var(--accent)" aria-hidden="true" />
              <span className="bento-index">04 · COMBUSTIBLE</span>
            </div>
            <h2 style={{ margin: 0, fontSize: '0.96rem' }}>Macros diarios prácticos</h2>
            <p className="muted" style={{ margin: 0, fontSize: '0.83rem' }}>
              Orientación diaria en gramos de carbohidratos, proteína y grasa adaptada al desgaste de cada jornada.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
