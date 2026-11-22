import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import { Bicycle, Heartbeat, PersonSimpleRun } from '@phosphor-icons/react';
import type { WorkoutBlock } from '../types/fitness';
import { WorkoutVisualBar } from './WorkoutVisualBar';

interface SpotlightCardProps {
  children: ReactNode;
  id?: string;
  className?: string;
  style?: CSSProperties;
  as?: 'article' | 'section' | 'div';
  staggerIndex?: number;
  'aria-label'?: string;
}

/**
 * 21st.dev / Skipper UI spotlight card with GPU pointer-tracking radial highlight
 * and Animista-inspired staggered entrance transition.
 */
export function SpotlightCard({
  children,
  id,
  className = '',
  style,
  as = 'article',
  staggerIndex,
  'aria-label': ariaLabel,
}: SpotlightCardProps) {
  const handlePointerMove = (e: PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
  };

  const mergedClass = ['card', 'spotlight-card', staggerIndex !== undefined ? 'stagger-item' : '', className]
    .filter(Boolean)
    .join(' ');

  const mergedStyle: CSSProperties =
    staggerIndex !== undefined
      ? ({ ...style, '--stagger': staggerIndex } as CSSProperties)
      : style ?? {};

  const Tag = as;
  return (
    <Tag
      id={id}
      className={mergedClass}
      style={mergedStyle}
      aria-label={ariaLabel}
      onPointerMove={handlePointerMove}
    >
      {children}
    </Tag>
  );
}

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  locale?: boolean;
  suffix?: string;
  prefix?: string;
}

/**
 * Motion Primitives / Anime.js style exponential ease-out numeric counter.
 * Honors prefers-reduced-motion by rendering target values immediately.
 */
export function AnimatedNumber({
  value,
  decimals = 0,
  locale = false,
  suffix = '',
  prefix = '',
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState<number>(value);
  const prevRef = useRef<number>(value);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    if (from === to) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      prevRef.current = to;
      setDisplay(to);
      return;
    }

    const duration = 480;
    const start = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      const next = from + (to - from) * eased;
      setDisplay(next);
      if (t < 1) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        prevRef.current = to;
        setDisplay(to);
      }
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [value]);

  const rounded = Number(display.toFixed(decimals));
  const formatted = locale
    ? rounded.toLocaleString('es-ES', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : rounded.toFixed(decimals);

  return (
    <span className="mono">
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

interface BiometricRingProps {
  percent: number;
  label: string;
  valueText: string;
  subText?: string;
  color?: string;
  size?: number;
}

/**
 * Whoop / Oura inspired SVG radial gauge for physiological telemetry.
 */
export function BiometricRing({
  percent,
  label,
  valueText,
  subText,
  color = 'var(--accent)',
  size = 92,
}: BiometricRingProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="biometric-ring-item">
      <div className="biometric-ring-wrap" style={{ inlineSize: size, blockSize: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--border-hairline)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dashoffset 0.55s cubic-bezier(0.22, 1, 0.36, 1)' }}
          />
        </svg>
        <div className="biometric-ring-center">
          <strong className="mono" style={{ fontSize: size >= 100 ? '1.1rem' : '0.94rem', lineHeight: 1.05 }}>
            {valueText}
          </strong>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>{label}</div>
        {subText && (
          <div className="muted mono" style={{ fontSize: '0.7rem' }}>
            {subText}
          </div>
        )}
      </div>
    </div>
  );
}

const PREVIEW_MODES: Array<{
  id: 'umbral' | 'caco' | 'bici';
  label: string;
  sessionTitle: string;
  vdot: number;
  duration: number;
  cardioPoints: number;
  primaryZoneLabel: string;
  primaryPace: string;
  secondaryLabel: string;
  secondaryValue: string;
  hrRange: string;
  stepsTarget: number;
  carbsG: number;
  proteinG: number;
  fatsG: number;
  blocks: WorkoutBlock[];
}> = [
  {
    id: 'umbral',
    label: 'Umbral 80/20',
    sessionTitle: 'Bloques de Umbral · 40 min',
    vdot: 38.5,
    duration: 40,
    cardioPoints: 96,
    primaryZoneLabel: 'Zona 3 Umbral',
    primaryPace: '5:14–5:30 /km · 11,2 km/h · 0,187 km/min',
    secondaryLabel: 'Zona 1 Suave',
    secondaryValue: '6:12–6:58 /km · 9,1 km/h · 0,152 km/min',
    hrRange: '158–170 ppm',
    stepsTarget: 8500,
    carbsG: 310,
    proteinG: 132,
    fatsG: 70,
    blocks: [
      { label: 'Calentamiento', durationMinutes: 10, intensity: 'Z1', description: '', zone: 'Z1' },
      { label: 'Umbral 1', durationMinutes: 6, intensity: 'Z3', description: '', zone: 'Z3' },
      { label: 'Recup.', durationMinutes: 2, intensity: 'Z1', description: '', zone: 'Z1' },
      { label: 'Umbral 2', durationMinutes: 6, intensity: 'Z3', description: '', zone: 'Z3' },
      { label: 'Recup.', durationMinutes: 2, intensity: 'Z1', description: '', zone: 'Z1' },
      { label: 'Umbral 3', durationMinutes: 6, intensity: 'Z3', description: '', zone: 'Z3' },
      { label: 'Enfriamiento', durationMinutes: 8, intensity: 'Z1', description: '', zone: 'Z1' },
    ],
  },
  {
    id: 'caco',
    label: "CaCo 3'/5'",
    sessionTitle: "Progresión CaCo 3'/5' · 42 min",
    vdot: 29.8,
    duration: 42,
    cardioPoints: 78,
    primaryZoneLabel: 'Trote Suave Z1',
    primaryPace: '7:20 – 8:14 /km',
    secondaryLabel: 'Caminata activa',
    secondaryValue: '4 bloques x 5 min',
    hrRange: '132–148 ppm',
    stepsTarget: 7500,
    carbsG: 255,
    proteinG: 126,
    fatsG: 65,
    blocks: [
      { label: 'Movilidad', durationMinutes: 5, intensity: 'Z1', description: '', zone: 'Z1' },
      { label: "Bloques CaCo 3'/5'", durationMinutes: 32, intensity: 'Z1', description: '', zone: 'Z1' },
      { label: 'Enfriamiento', durationMinutes: 5, intensity: 'Z1', description: '', zone: 'Z1' },
    ],
  },
  {
    id: 'bici',
    label: 'Bici Equivalente',
    sessionTitle: 'Ciclismo Aeróbico · 55 min',
    vdot: 41.2,
    duration: 55,
    cardioPoints: 84,
    primaryZoneLabel: 'Zona 2 Estable',
    primaryPace: '88–95 rpm',
    secondaryLabel: 'Equivalencia carrera',
    secondaryValue: '7,4 km sin impacto',
    hrRange: '138–152 ppm',
    stepsTarget: 9000,
    carbsG: 290,
    proteinG: 130,
    fatsG: 68,
    blocks: [
      { label: 'Cadencia ágil', durationMinutes: 10, intensity: 'Z1', description: '', zone: 'Z1' },
      { label: 'Fondo aeróbico', durationMinutes: 40, intensity: 'Z2', description: '', zone: 'Z2' },
      { label: 'Soltura', durationMinutes: 5, intensity: 'Z1', description: '', zone: 'Z1' },
    ],
  },
];

/**
 * FreeMockup + 21st.dev interactive physiological telemetry showcase card.
 */
export function TelemetryMockupCard() {
  const [selectedId, setSelectedId] = useState<'umbral' | 'caco' | 'bici'>('umbral');
  const active = PREVIEW_MODES.find((m) => m.id === selectedId) ?? PREVIEW_MODES[0];

  return (
    <div className="mockup-frame stagger-item" style={{ '--stagger': 1 } as CSSProperties}>
      <div className="mockup-bezel stack-md">
        <div className="row-between">
          <div className="row-wrap" style={{ gap: '0.5rem' }}>
            <div className="mockup-chrome-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <span className="pulse-dot" aria-hidden="true" />
            <span className="muted mono" style={{ fontSize: '0.72rem', fontWeight: 600 }}>
              TELEMETRÍA DE SESIÓN
            </span>
          </div>
          <span className="pill pill-amber mono">
            VDOT <AnimatedNumber value={active.vdot} decimals={1} />
          </span>
        </div>

        <div className="segmented-group" role="tablist" aria-label="Vista previa de modalidades de sesión">
          {PREVIEW_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={selectedId === m.id}
              className="segmented-btn"
              onClick={() => setSelectedId(m.id)}
            >
              {m.id === 'bici' ? (
                <Bicycle size={14} weight="duotone" aria-hidden="true" />
              ) : (
                <PersonSimpleRun size={14} weight="duotone" aria-hidden="true" />
              )}
              {m.label}
            </button>
          ))}
        </div>

        <div className="row-between">
          <div>
            <strong style={{ fontSize: '1.04rem' }}>{active.sessionTitle}</strong>
            <div className="row-wrap muted mono" style={{ fontSize: '0.76rem', marginTop: '0.15rem' }}>
              <Heartbeat size={14} weight="duotone" color="var(--accent)" aria-hidden="true" />
              <span>{active.hrRange}</span>
              <span>·</span>
              <span>
                <AnimatedNumber value={active.cardioPoints} suffix=" Puntos Cardio" />
              </span>
            </div>
          </div>
        </div>

        <WorkoutVisualBar blocks={active.blocks} />

        <div className="grid-3" style={{ gap: '0.55rem' }}>
          <div className="inset-panel" style={{ padding: '0.58rem 0.72rem' }}>
            <div className="muted" style={{ fontSize: '0.72rem' }}>{active.primaryZoneLabel}</div>
            <div className="mono" style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--accent)' }}>
              {active.primaryPace}
            </div>
          </div>
          <div className="inset-panel" style={{ padding: '0.58rem 0.72rem' }}>
            <div className="muted" style={{ fontSize: '0.72rem' }}>{active.secondaryLabel}</div>
            <div className="mono" style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--pine)' }}>
              {active.secondaryValue}
            </div>
          </div>
          <div className="inset-panel" style={{ padding: '0.58rem 0.72rem' }}>
            <div className="muted" style={{ fontSize: '0.72rem' }}>Duración total</div>
            <div className="mono" style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--cobalt)' }}>
              <AnimatedNumber value={active.duration} suffix=" min" />
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-hairline)', paddingTop: '0.68rem', fontSize: '0.82rem' }} className="secondary stack-sm">
          <div className="row-between">
            <span>Pasos objetivo Google Fit</span>
            <strong className="mono">
              <AnimatedNumber value={active.stepsTarget} locale suffix=" pasos/día" />
            </strong>
          </div>
          <div className="row-between">
            <span>Macros recomendados hoy</span>
            <strong className="mono">
              <AnimatedNumber value={active.carbsG} suffix="g C · " />
              <AnimatedNumber value={active.proteinG} suffix="g P · " />
              <AnimatedNumber value={active.fatsG} suffix="g G" />
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
