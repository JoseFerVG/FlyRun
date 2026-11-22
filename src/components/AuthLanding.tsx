import { Activity, ArrowRight, Footprints, ShieldCheck } from 'lucide-react';
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
  { label: 'Recuperación', durationMinutes: 2, intensity: 'Z1', description: '', zone: 'Z1' },
  { label: 'Umbral 2', durationMinutes: 6, intensity: 'Z3', description: '', zone: 'Z3' },
  { label: 'Recuperación', durationMinutes: 2, intensity: 'Z1', description: '', zone: 'Z1' },
  { label: 'Umbral 3', durationMinutes: 6, intensity: 'Z3', description: '', zone: 'Z3' },
  { label: 'Enfriamiento', durationMinutes: 8, intensity: 'Z1', description: '', zone: 'Z1' },
];

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
    <main className="main-container" style={{ paddingBlock: 'clamp(1.5rem, 4vw, 3rem)' }}>
      <div className="stack-lg">
        <header className="row-between">
          <div className="brand-mark">
            <span className="brand-monogram" aria-hidden="true">FR</span>
            <div>
              <div className="brand-title">
                FlyRun <span className="brand-badge">Entrenamiento</span>
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
            gap: '2rem',
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
                lineHeight: 1.15,
                letterSpacing: '-0.03em',
                fontWeight: 700,
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
                className="btn btn-primary"
                onClick={() => void onGoogleLogin()}
                disabled={authLoading}
              >
                <ShieldCheck size={17} aria-hidden="true" />
                {authLoading ? 'Conectando con Google...' : 'Continuar con Google'}
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

          <div className="inset-panel stack-md">
            <div className="row-between">
              <div>
                <div className="muted" style={{ fontSize: '0.73rem', fontWeight: 600, textTransform: 'uppercase' }}>
                  Vista previa de sesión tipo
                </div>
                <strong style={{ fontSize: '1.02rem' }}>Bloques de Umbral · 40 min</strong>
              </div>
              <span className="pill pill-amber mono">VDOT 38.5</span>
            </div>

            <WorkoutVisualBar blocks={SAMPLE_BLOCKS} />

            <div className="grid-3" style={{ gap: '0.55rem' }}>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', borderRadius: '8px', padding: '0.55rem 0.7rem' }}>
                <div className="muted" style={{ fontSize: '0.72rem' }}>Zona 1 Suave</div>
                <div className="mono" style={{ fontWeight: 600, fontSize: '0.88rem' }}>6:12 – 6:58 /km</div>
              </div>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', borderRadius: '8px', padding: '0.55rem 0.7rem' }}>
                <div className="muted" style={{ fontSize: '0.72rem' }}>Zona 3 Umbral</div>
                <div className="mono" style={{ fontWeight: 600, fontSize: '0.88rem' }}>5:14 – 5:30 /km</div>
              </div>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', borderRadius: '8px', padding: '0.55rem 0.7rem' }}>
                <div className="muted" style={{ fontSize: '0.72rem' }}>Equivalencia bici</div>
                <div className="mono" style={{ fontWeight: 600, fontSize: '0.88rem' }}>50 min Z2</div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-hairline)', paddingTop: '0.65rem', fontSize: '0.82rem' }} className="secondary">
              <div className="row-between">
                <span>Pasos objetivo Google Fit</span>
                <strong className="mono">8.500 pasos/día</strong>
              </div>
              <div className="row-between" style={{ marginTop: '0.25rem' }}>
                <span>Macros recomendados hoy</span>
                <strong className="mono">310g C · 132g P · 70g G</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="grid-4" aria-label="Pilares del sistema de entrenamiento">
          <article className="card stack-sm">
            <h2 style={{ margin: 0, fontSize: '0.96rem' }}>Progresión CaCo y 80/20</h2>
            <p className="muted" style={{ margin: 0, fontSize: '0.83rem' }}>
              Desde bloques de 2 min corriendo y 6 andando hasta sesiones polarizadas con ritmos exactos por zona.
            </p>
          </article>
          <article className="card stack-sm">
            <h2 style={{ margin: 0, fontSize: '0.96rem' }}>Equivalencia multi-cardio</h2>
            <p className="muted" style={{ margin: 0, fontSize: '0.83rem' }}>
              Sustituye días de carrera por bicicleta o partido de fútbol manteniendo la carga en Puntos Cardio y TRIMP.
            </p>
          </article>
          <article className="card stack-sm">
            <h2 style={{ margin: 0, fontSize: '0.96rem' }}>Google Fit y exámenes físicos</h2>
            <p className="muted" style={{ margin: 0, fontSize: '0.83rem' }}>
              Registra pasos diarios y supera test de Cooper, 5K o Rockport para recalibrar tu nivel automáticamente.
            </p>
          </article>
          <article className="card stack-sm">
            <div className="row-wrap">
              <Activity size={16} color="#d94814" aria-hidden="true" />
              <h2 style={{ margin: 0, fontSize: '0.96rem' }}>Macros diarios prácticos</h2>
            </div>
            <p className="muted" style={{ margin: 0, fontSize: '0.83rem' }}>
              Orientación diaria en gramos de carbohidratos, proteína y grasa adaptada al desgaste de cada jornada.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
