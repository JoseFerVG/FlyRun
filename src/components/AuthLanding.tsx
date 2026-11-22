import type { CSSProperties } from 'react';
import {
  ArrowRight,
  Bicycle,
  ClipboardText,
  CookingPot,
  Footprints,
  MoonStars,
  PersonSimpleRun,
  SunDim,
} from '@phosphor-icons/react';
import { AmbientBackdrop } from './AmbientBackdrop';
import { FlyRunLogo } from './FlyRunLogo';
import { SpotlightCard, TelemetryMockupCard } from './MotionPrimitives';
import { assetUrl } from '../services/assets';

interface AuthLandingProps {
  onGoogleLogin: () => Promise<void>;
  onDemoLogin: () => Promise<void> | void;
  onOpenPersonas: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  authLoading: boolean;
  authError: string | null;
}

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
    <>
      <AmbientBackdrop />
      <main id="main-content" className="main-container" style={{ paddingBlock: 'clamp(1.5rem, 4vw, 3rem)' }}>
        <div className="stack-lg">
          <header className="row-between">
            <FlyRunLogo
              size="md"
              badgeText="Entrenamiento"
              subtitle="Planificación de carrera, cardio diario y nutrición macro"
            />

            <div className="row-wrap">
              <button type="button" className="btn btn-secondary btn-sm" onClick={onOpenPersonas}>
                <span className="avatar-stack" aria-hidden="true">
                  <img src={assetUrl('images/avatar-laura.jpg')} alt="" width={20} height={20} />
                  <img src={assetUrl('images/avatar-javier.jpg')} alt="" width={20} height={20} />
                  <img src={assetUrl('images/avatar-elena.jpg')} alt="" width={20} height={20} />
                </span>
                7 Perfiles de Prueba
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={onToggleTheme}
                aria-label={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
              >
                {theme === 'light' ? (
                  <MoonStars size={15} weight="duotone" aria-hidden="true" />
                ) : (
                  <SunDim size={15} weight="duotone" aria-hidden="true" />
                )}
                {theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
              </button>
            </div>
          </header>

          <SpotlightCard
            as="section"
            staggerIndex={0}
            className="haikei-card-surface"
            style={{
              display: 'grid',
              gap: '2.2rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              alignItems: 'center',
            }}
          >
            <div className="stack-md">
              <div className="row-wrap">
                <span className="pill pill-amber">VDOT · Método 80/20 · CaCo</span>
                <span className="pill pill-emerald">
                  <Footprints size={14} weight="duotone" aria-hidden="true" />
                  Compatible con Google Fit
                </span>
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: 'clamp(1.78rem, 3.6vw, 2.6rem)',
                  lineHeight: 1.13,
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
                  <ArrowRight size={17} weight="bold" aria-hidden="true" />
                  Ver demo interactiva
                </button>
              </div>

              <p className="muted" style={{ margin: 0, fontSize: '0.8rem' }}>
                Acceso directo con tu cuenta de Google. Al entrar por primera vez completarás tu perfil y prueba inicial de nivel.
              </p>
            </div>

            <TelemetryMockupCard />
          </SpotlightCard>

          <section className="hero-photo-grid stagger-item" style={{ '--stagger': 1 } as CSSProperties} aria-label="Disciplinas reales de entrenamiento">
            <figure className="editorial-photo-banner" style={{ margin: 0, blockSize: '188px' }}>
              <img
                src={assetUrl('images/hero-track-runner.jpg')}
                alt="Atletas corriendo en pista sintética de 400 metros"
                width={1200}
                height={520}
                fetchPriority="high"
                className="editorial-photo-img"
              />
              <figcaption className="editorial-photo-scrim">
                <span className="editorial-photo-caption">Pista 400 m y series por VDOT</span>
                <span className="pill pill-amber mono">Z3 – Z4</span>
              </figcaption>
            </figure>

            <figure className="editorial-photo-banner" style={{ margin: 0, blockSize: '188px' }}>
              <img
                src={assetUrl('images/cardio-road-cycling.jpg')}
                alt="Ciclista en carretera realizando trabajo aeróbico equivalente"
                width={1200}
                height={520}
                loading="lazy"
                className="editorial-photo-img"
              />
              <figcaption className="editorial-photo-scrim">
                <span className="editorial-photo-caption">Cardio cruzado en bicicleta y fútbol</span>
                <span className="pill pill-cyan mono">TRIMP</span>
              </figcaption>
            </figure>

            <figure className="editorial-photo-banner" style={{ margin: 0, blockSize: '188px' }}>
              <img
                src={assetUrl('images/nutrition-athlete-meal.jpg')}
                alt="Plato equilibrado con proteína magra, cereales y verduras frescas"
                width={1200}
                height={520}
                loading="lazy"
                className="editorial-photo-img"
              />
              <figcaption className="editorial-photo-scrim">
                <span className="editorial-photo-caption">Combustible real por gramos de macro</span>
                <span className="pill pill-emerald mono">C · P · G</span>
              </figcaption>
            </figure>
          </section>

          <section className="grid-4" aria-label="Pilares del sistema de entrenamiento">
            <SpotlightCard staggerIndex={1} className="stack-sm">
              <div className="row-between">
                <span className="duotone-icon-box">
                  <PersonSimpleRun size={18} weight="duotone" aria-hidden="true" />
                </span>
                <span className="bento-index">01 · MÉTODO</span>
              </div>
              <h2 style={{ margin: 0, fontSize: '0.96rem' }}>Progresión CaCo y 80/20</h2>
              <p className="muted" style={{ margin: 0, fontSize: '0.83rem' }}>
                Desde bloques de 2 min corriendo y 6 andando hasta sesiones polarizadas con ritmos exactos por zona.
              </p>
            </SpotlightCard>

            <SpotlightCard staggerIndex={2} className="stack-sm">
              <div className="row-between">
                <span className="duotone-icon-box is-pine">
                  <Bicycle size={18} weight="duotone" aria-hidden="true" />
                </span>
                <span className="bento-index">02 · ADAPTACIÓN</span>
              </div>
              <h2 style={{ margin: 0, fontSize: '0.96rem' }}>Equivalencia multi-cardio</h2>
              <p className="muted" style={{ margin: 0, fontSize: '0.83rem' }}>
                Sustituye días de carrera por bicicleta o partido de fútbol manteniendo la carga en Puntos Cardio y TRIMP.
              </p>
            </SpotlightCard>

            <SpotlightCard staggerIndex={3} className="stack-sm">
              <div className="row-between">
                <span className="duotone-icon-box is-cobalt">
                  <ClipboardText size={18} weight="duotone" aria-hidden="true" />
                </span>
                <span className="bento-index">03 · EVALUACIÓN</span>
              </div>
              <h2 style={{ margin: 0, fontSize: '0.96rem' }}>Google Fit y exámenes físicos</h2>
              <p className="muted" style={{ margin: 0, fontSize: '0.83rem' }}>
                Registra pasos diarios y supera test de Cooper, 5K o Rockport para recalibrar tu nivel automáticamente.
              </p>
            </SpotlightCard>

            <SpotlightCard staggerIndex={4} className="stack-sm">
              <div className="row-between">
                <span className="duotone-icon-box">
                  <CookingPot size={18} weight="duotone" aria-hidden="true" />
                </span>
                <span className="bento-index">04 · COMBUSTIBLE</span>
              </div>
              <h2 style={{ margin: 0, fontSize: '0.96rem' }}>Macros diarios prácticos</h2>
              <p className="muted" style={{ margin: 0, fontSize: '0.83rem' }}>
                Orientación diaria en gramos de carbohidratos, proteína y grasa adaptada al desgaste de cada jornada.
              </p>
            </SpotlightCard>
          </section>
        </div>
      </main>
    </>
  );
}
