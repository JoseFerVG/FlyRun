import type { CSSProperties } from 'react';
import {
  ArrowRight,
  Bicycle,
  CalendarBlank,
  CheckCircle,
  ClipboardText,
  CookingPot,
  Footprints,
  Heartbeat,
  Lightning,
  MoonStars,
  PersonSimpleRun,
  SunDim,
} from '@phosphor-icons/react';
import { Download } from 'lucide-react';
import { AmbientBackdrop } from './AmbientBackdrop';
import { FlyRunLogo } from './FlyRunLogo';
import { SpotlightCard, TelemetryMockupCard } from './MotionPrimitives';
import { assetUrl } from '../services/assets';
import { SIMULATED_USER_PERSONAS, type SimulatedUserPersona } from '../data/userPersonas';

interface AuthLandingProps {
  onGoogleLogin: () => Promise<void>;
  onDemoLogin: () => Promise<void> | void;
  onOpenPersonas: () => void;
  onSelectPersona: (persona: SimulatedUserPersona) => void;
  onInstallApp?: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  googleLoading: boolean;
  demoLoading: boolean;
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

const FEATURED_STORIES = SIMULATED_USER_PERSONAS.slice(0, 3);

export function AuthLanding({
  onGoogleLogin,
  onDemoLogin,
  onOpenPersonas,
  onSelectPersona,
  onInstallApp,
  theme,
  onToggleTheme,
  googleLoading,
  demoLoading,
  authError,
}: AuthLandingProps) {
  return (
    <>
      <AmbientBackdrop />
      <main id="main-content" className="main-container" style={{ paddingBlock: 'clamp(1.25rem, 3.6vw, 2.75rem)' }}>
        <div className="stack-lg">
          <header className="row-between">
            <FlyRunLogo
              size="md"
              badgeText="Acceso Anticipado"
              subtitle="Entrenamiento de running, cardio y macros"
            />

            <nav className="landing-nav-links" aria-label="Secciones de la página">
              <a href="#como-funciona" className="landing-nav-link">Cómo funciona</a>
              <a href="#comparativa" className="landing-nav-link">Comparativa</a>
              <a href="#planes" className="landing-nav-link">Planes</a>
              <a href="#opiniones" className="landing-nav-link">Corredores</a>
              <a href="#faq" className="landing-nav-link">FAQ</a>
            </nav>

            <div className="row-wrap">
              {onInstallApp && (
                <button type="button" className="btn btn-primary btn-sm" onClick={onInstallApp}>
                  <Download size={14} aria-hidden="true" />
                  Instalar App
                </button>
              )}
              <button type="button" className="btn btn-secondary btn-sm" onClick={onOpenPersonas}>
                <span className="avatar-stack" aria-hidden="true">
                  <img src={assetUrl('images/avatar-laura.jpg')} alt="" width={20} height={20} />
                  <img src={assetUrl('images/avatar-javier.jpg')} alt="" width={20} height={20} />
                  <img src={assetUrl('images/avatar-elena.jpg')} alt="" width={20} height={20} />
                </span>
                Casos por nivel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => void onGoogleLogin()}
                disabled={googleLoading || demoLoading}
              >
                Entrar gratis
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
                {theme === 'light' ? 'Oscuro' : 'Claro'}
              </button>
            </div>
          </header>

          {/* Hero */}
          <SpotlightCard
            as="section"
            staggerIndex={0}
            className="haikei-card-surface"
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
                  <Footprints size={14} weight="duotone" aria-hidden="true" />
                  Compatible con Google Fit
                </span>
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: 'clamp(1.85rem, 3.8vw, 2.75rem)',
                  lineHeight: 1.12,
                  letterSpacing: '-0.032em',
                  fontWeight: 800,
                }}
              >
                Tu preparador físico de running y cardio diario, basado en fisiología real.
              </h1>

              <p className="secondary" style={{ margin: 0, fontSize: '0.99rem' }}>
                Medimos tu punto de partida con una prueba sencilla, calculamos tus 5 zonas exactas por VDOT y pulso Karvonen,
                adaptamos cada semana con carrera, bicicleta, fútbol o caminata diaria y ajustamos tus macros por jornada.
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
                  disabled={googleLoading || demoLoading}
                >
                  <GoogleLogoMark />
                  {googleLoading ? 'Conectando con Google…' : 'Continuar con Google'}
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => void onDemoLogin()}
                  disabled={googleLoading || demoLoading}
                >
                  <ArrowRight size={17} weight="bold" aria-hidden="true" />
                  {demoLoading ? 'Cargando examen…' : 'Probar examen inicial'}
                </button>
              </div>

              <p className="muted" style={{ margin: 0, fontSize: '0.8rem' }}>
                100 % gratuito durante el acceso anticipado · Acceso directo con tu cuenta de Google · Funciona como app instalable (PWA).
              </p>
            </div>

            <TelemetryMockupCard />
          </SpotlightCard>

          {/* Tira fotográfica documental */}
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

          {/* 4 Pilares técnicos */}
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

          {/* Cómo funciona en 3 pasos */}
          <section id="como-funciona" className="stack-md" aria-label="Cómo funciona en 3 pasos">
            <div>
              <span className="pill pill-cyan">Flujo completo de entrenamiento</span>
              <h2 style={{ margin: '0.4rem 0 0', fontSize: 'clamp(1.3rem, 2.5vw, 1.7rem)', letterSpacing: '-0.025em' }}>
                Cómo funciona FlyRun en 3 pasos
              </h2>
            </div>

            <div className="grid-3">
              <SpotlightCard staggerIndex={1} className="accent-rail stack-sm">
                <div className="row-between">
                  <span className="bento-index">PASO 01</span>
                  <Heartbeat size={18} weight="duotone" color="var(--accent)" aria-hidden="true" />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.02rem' }}>Supera el examen inicial de nivel</h3>
                <p className="muted" style={{ margin: 0, fontSize: '0.84rem' }}>
                  Antes de entrar, realiza tu prueba inicial en <strong>km/h</strong>, <strong>km/min</strong>, ritmo por km o Test de Cooper/5K/Rockport para calibrar tu VDOT.
                </p>
              </SpotlightCard>

              <SpotlightCard staggerIndex={2} className="accent-rail-pine stack-sm">
                <div className="row-between">
                  <span className="bento-index" style={{ color: 'var(--pine)' }}>PASO 02</span>
                  <CalendarBlank size={18} weight="duotone" color="var(--pine)" aria-hidden="true" />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.02rem' }}>Entrena con cronómetro de calle</h3>
                <p className="muted" style={{ margin: 0, fontSize: '0.84rem' }}>
                  Recibe un mesociclo de 4 semanas flexible. Si te sientes cansado o juegas un partido de fútbol, adapta la jornada sin perder tu equilibrio 80/20.
                </p>
              </SpotlightCard>

              <SpotlightCard staggerIndex={3} className="accent-rail-cobalt stack-sm">
                <div className="row-between">
                  <span className="bento-index" style={{ color: 'var(--cobalt)' }}>PASO 03</span>
                  <Lightning size={18} weight="duotone" color="var(--cobalt)" aria-hidden="true" />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.02rem' }}>Sube de nivel con exámenes y macros</h3>
                <p className="muted" style={{ margin: 0, fontSize: '0.84rem' }}>
                  Supera el Día de Examen Físico en pista cada 2 semanas, desbloquea insignias hasta el Nivel 10 y ajusta tus carbohidratos, proteína e hidratación diarios.
                </p>
              </SpotlightCard>
            </div>
          </section>

          {/* Comparativa */}
          <SpotlightCard as="section" id="comparativa" staggerIndex={2} className="stack-md" aria-label="Comparativa frente a otras opciones">
            <div>
              <span className="pill">Comparativa objetiva</span>
              <h2 style={{ margin: '0.35rem 0 0', fontSize: '1.35rem', letterSpacing: '-0.02em' }}>
                Por qué es superior a correr por sensaciones o usar planes genéricos
              </h2>
            </div>

            <div className="scroll-table-wrap" tabIndex={0} role="region" aria-label="Tabla comparativa entre métodos de entrenamiento">
              <table className="zone-table">
                <thead>
                  <tr>
                    <th>Criterio de preparación</th>
                    <th>Entrenar por libre</th>
                    <th>Apps genéricas de tracker</th>
                    <th style={{ color: 'var(--accent)' }}>FlyRun</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Cálculo científico de zonas (VDOT + Karvonen)</td>
                    <td className="muted">No (a ojo)</td>
                    <td className="muted">Fórmula genérica 220-edad</td>
                    <td style={{ fontWeight: 700, color: 'var(--pine)' }}>Dinámico por test real y Tanaka</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Equivalencia Running ↔ Bici / Fútbol</td>
                    <td className="muted">Descuadra la semana</td>
                    <td className="muted">Solo suma calorías sueltas</td>
                    <td style={{ fontWeight: 700, color: 'var(--pine)' }}>Puntos Cardio, MET-m y TRIMP</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Progresión segura para principiantes (CaCo)</td>
                    <td className="muted">Alto riesgo de sobrecarga</td>
                    <td className="muted">Planes rígidos estándar</td>
                    <td style={{ fontWeight: 700, color: 'var(--pine)' }}>Bloques 2'/6' a 5'/2' con cronómetro</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Ajuste de fatiga diaria + Exámenes periódicos</td>
                    <td className="muted">Manual</td>
                    <td className="muted">Solo en planes caros</td>
                    <td style={{ fontWeight: 700, color: 'var(--pine)' }}>Incluido de serie cada 14 días</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Macros diarios orientados al entrenamiento</td>
                    <td className="muted">No incluido</td>
                    <td className="muted">Dietas genéricas</td>
                    <td style={{ fontWeight: 700, color: 'var(--pine)' }}>4 tomas ajustadas al desgaste</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </SpotlightCard>

          {/* Planes y Precios (Plan gratuito hoy + Próximo Pro Global) */}
          <section id="planes" className="stack-md" aria-label="Planes y Acceso Anticipado">
            <div>
              <span className="pill pill-emerald">Sin tarjeta · Lanzamiento por fases</span>
              <h2 style={{ margin: '0.38rem 0 0', fontSize: 'clamp(1.3rem, 2.5vw, 1.7rem)', letterSpacing: '-0.025em' }}>
                Planes de acceso a FlyRun
              </h2>
              <p className="secondary" style={{ margin: '0.2rem 0 0', fontSize: '0.9rem' }}>
                Todavía estamos en fase previa al lanzamiento global, así que tienes acceso completo y gratuito desde hoy.
              </p>
            </div>

            <div className="grid-2">
              <SpotlightCard staggerIndex={1} className="pricing-card-featured stack-md">
                <div className="row-between">
                  <span className="pill pill-amber">Disponible hoy · 100 % Gratis</span>
                  <span className="mono muted" style={{ fontSize: '0.78rem' }}>Acceso anticipado</span>
                </div>

                <div>
                  <h3 style={{ margin: 0, fontSize: '1.22rem' }}>Plan Acceso Anticipado</h3>
                  <div className="row-wrap" style={{ alignItems: 'baseline', marginTop: '0.35rem' }}>
                    <span className="kpi-value" style={{ fontSize: '2.2rem', color: 'var(--text-primary)' }}>0 €</span>
                    <span className="muted" style={{ fontSize: '0.85rem' }}>/ mes ahora mismo</span>
                  </div>
                </div>

                <ul className="stack-sm" style={{ margin: 0, paddingInlineStart: 0, listStyle: 'none', fontSize: '0.86rem' }}>
                  {[
                    'Planificador semanal 80/20 y bloques CaCo con calendario flexible',
                    'Cálculo completo de VDOT, 5 zonas de ritmo y pulso Karvonen',
                    'Equivalencia multi-cardio (Running, Ciclismo, Fútbol y Caminata)',
                    'Cronómetro de calle PWA con pantalla activa (Wake Lock) y vibración',
                    'Exámenes físicos (Cooper, 5K, Rockport), metas de pasos y guía macro',
                  ].map((feat) => (
                    <li key={feat} className="row-wrap" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
                      <CheckCircle size={17} weight="duotone" color="var(--pine)" style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
                      <span className="secondary">{feat}</span>
                    </li>
                  ))}
                </ul>

                <div style={{ marginTop: 'auto', paddingTop: '0.4rem' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ inlineSize: '100%' }}
                    onClick={() => void onGoogleLogin()}
                    disabled={googleLoading || demoLoading}
                  >
                    <GoogleLogoMark />
                    Empezar gratis con Google
                  </button>
                </div>
              </SpotlightCard>

              <SpotlightCard staggerIndex={2} className="pricing-card-upcoming stack-md">
                <div className="row-between">
                  <span className="pill">Próximamente · Lanzamiento Global</span>
                  <span className="mono muted" style={{ fontSize: '0.78rem' }}>En hoja de ruta</span>
                </div>

                <div>
                  <h3 style={{ margin: 0, fontSize: '1.22rem' }}>FlyRun Pro Global</h3>
                  <div className="row-wrap" style={{ alignItems: 'baseline', marginTop: '0.35rem' }}>
                    <span className="kpi-value" style={{ fontSize: '1.55rem', color: 'var(--text-muted)' }}>
                      Se activará tras el lanzamiento
                    </span>
                  </div>
                </div>

                <p className="secondary" style={{ margin: 0, fontSize: '0.86rem' }}>
                  Mientras completamos la apertura global, todas las herramientas fisiológicas actuales están liberadas sin coste en el plan gratuito. En futuras versiones llegarán:
                </p>

                <ul className="stack-sm" style={{ margin: 0, paddingInlineStart: 0, listStyle: 'none', fontSize: '0.84rem' }}>
                  {[
                    'Exportación directa de entrenamientos estructurados a relojes GPS externos',
                    'Periodización automática por fecha exacta de carrera (5K, 10K, Media Maratón)',
                    'Panel avanzado de tendencia crónica vs aguda de carga (CTL / ATL)',
                  ].map((feat) => (
                    <li key={feat} className="row-wrap" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
                      <Lightning size={16} weight="duotone" color="var(--cobalt)" style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
                      <span className="muted">{feat}</span>
                    </li>
                  ))}
                </ul>

                <div style={{ marginTop: 'auto', paddingTop: '0.4rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ inlineSize: '100%' }}
                    onClick={() => void onDemoLogin()}
                    disabled={googleLoading || demoLoading}
                  >
                    Probar examen de nivel ahora
                  </button>
                </div>
              </SpotlightCard>
            </div>
          </section>

          {/* Experiencias reales / Casos de prueba */}
          <section id="opiniones" className="stack-md" aria-label="Experiencias reales de usuarios">
            <div className="row-between">
              <div>
                <span className="pill pill-amber">Atletas por nivel</span>
                <h2 style={{ margin: '0.35rem 0 0', fontSize: '1.35rem', letterSpacing: '-0.02em' }}>
                  Cómo adapta FlyRun el plan según tu nivel y deporte
                </h2>
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={onOpenPersonas}>
                Ver todos los perfiles
              </button>
            </div>

            <div className="grid-3">
              {FEATURED_STORIES.map((persona, idx) => (
                <SpotlightCard key={persona.id} staggerIndex={idx + 1} className="stack-md">
                  <div className="row-between">
                    <div className="row-wrap" style={{ gap: '0.65rem', flexWrap: 'nowrap' }}>
                      <img
                        src={assetUrl(persona.avatarFile)}
                        alt={persona.name}
                        width={40}
                        height={40}
                        loading="lazy"
                        className="athlete-avatar"
                      />
                      <div>
                        <strong style={{ fontSize: '0.94rem' }}>{persona.name}</strong>
                        <div className="muted mono" style={{ fontSize: '0.73rem' }}>
                          Nivel {persona.profile.level} · VDOT {persona.profile.vdot}
                        </div>
                      </div>
                    </div>
                    <span className="pill pill-emerald mono">{persona.rating}</span>
                  </div>

                  <p className="secondary" style={{ margin: 0, fontSize: '0.84rem' }}>
                    {persona.quote}
                  </p>

                  <div style={{ marginTop: 'auto' }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => onSelectPersona(persona)}
                    >
                      Explorar demo con este nivel
                      <ArrowRight size={14} weight="bold" aria-hidden="true" />
                    </button>
                  </div>
                </SpotlightCard>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="stack-md" aria-label="Preguntas frecuentes">
            <div>
              <span className="pill">Dudas habituales</span>
              <h2 style={{ margin: '0.35rem 0 0', fontSize: '1.35rem', letterSpacing: '-0.02em' }}>
                Preguntas frecuentes
              </h2>
            </div>

            <div className="stack-sm">
              <details className="faq-details" open>
                <summary>¿Qué es el método CaCo y por qué se recomienda al empezar?</summary>
                <p>
                  CaCo alterna tramos breves corriendo y caminando (por ejemplo, 2 minutos trotando y 6 caminando). Permite que tendones, cartílagos y corazón se adapten progresivamente evitando las lesiones típicas de empezar corriendo 30 minutos seguidos.
                </p>
              </details>
              <details className="faq-details">
                <summary>¿Cómo funciona el reparto polarizado 80/20?</summary>
                <p>
                  Alrededor del 80 % de tu tiempo semanal va a intensidad suave conversacional (Zonas 1–2) y solo un 20 % a trabajo exigente (umbral Z3, intervalos Z4 o partido de fútbol). Es la distribución más eficiente para progresar sin sobreentrenamiento.
                </p>
              </details>
              <details className="faq-details">
                <summary>Si un día juego un partido de fútbol o salgo en bici, ¿pierdo el entrenamiento?</summary>
                <p>
                  No. FlyRun convierte cada disciplina mediante equivalencia de MET-minutos y carga cardíaca TRIMP en Puntos Cardio, ajustando el resto de tu semana para que el fútbol cuente como tu estímulo intenso o la bicicleta como descarga articular.
                </p>
              </details>
              <details className="faq-details">
                <summary>¿Cómo funciona el Día de Examen Físico?</summary>
                <p>
                  Cada dos semanas tienes marcada una jornada de evaluación opcional en pista o recorrido medido (Test de Cooper de 12 min, 5 km o caminata Rockport de 1,6 km). Al introducir tu marca real, recalculamos tu VDOT, tus 5 zonas y tu nivel automáticamente.
                </p>
              </details>
              <details className="faq-details">
                <summary>¿Tengo que seguir una dieta cerrada?</summary>
                <p>
                  No. FlyRun calcula tus necesidades diarias orientativas en gramos de carbohidratos, proteínas y grasas según tu biometría (Mifflin-St Jeor), tus pasos diarios y la carga de la sesión de hoy, repartidas de forma orientativa en 4 comidas.
                </p>
              </details>
            </div>
          </section>

          <footer className="landing-footer">
            <FlyRunLogo size="sm" subtitle="Ciencia fisiológica aplicada al running y cardio diario" />
            <div className="row-wrap muted" style={{ fontSize: '0.78rem' }}>
              <span>VDOT (Jack Daniels)</span>
              <span>·</span>
              <span>80/20 Polarizado (Stephen Seiler)</span>
              <span>·</span>
              <span>TRIMP (Banister)</span>
              <span>·</span>
              <span>Acceso Anticipado 0 €</span>
            </div>
          </footer>
        </div>
      </main>
    </>
  );
}
