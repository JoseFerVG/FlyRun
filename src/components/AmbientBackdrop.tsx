import type { CSSProperties } from 'react';

/**
 * Ambient shader gradient mesh + Haikei-inspired topographic wave surface.
 * Pure CSS + inline SVG so it stays GPU-composited with zero canvas overhead.
 */
export function AmbientBackdrop() {
  return (
    <div className="ambient-shader-canvas" aria-hidden="true">
      <div className="shader-orb shader-orb-ember" />
      <div className="shader-orb shader-orb-pine" />
      <div className="shader-orb shader-orb-cobalt" />
    </div>
  );
}

/**
 * Haikei layered bezier topographic contours for hero banners & coach cards.
 */
export function HaikeiTopoOverlay({ style }: { style?: CSSProperties }) {
  return (
    <svg
      className="haikei-topo-overlay"
      viewBox="0 0 900 320"
      preserveAspectRatio="none"
      aria-hidden="true"
      style={style}
    >
      <defs>
        <linearGradient id="flyrun-wave-ember" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--ember-500)" stopOpacity="0.14" />
          <stop offset="50%" stopColor="var(--pine-500)" stopOpacity="0.08" />
          <stop offset="100%" stopColor="var(--cobalt-500)" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <path
        d="M0 190 C 160 120, 310 265, 480 185 C 650 105, 760 225, 900 150 L 900 320 L 0 320 Z"
        fill="url(#flyrun-wave-ember)"
      />
      <path
        d="M0 230 C 190 165, 340 285, 520 215 C 700 145, 780 250, 900 195"
        fill="none"
        stroke="var(--ember-500)"
        strokeOpacity="0.18"
        strokeWidth="1.4"
      />
      <path
        d="M0 260 C 210 205, 370 300, 560 240 C 730 185, 810 265, 900 225"
        fill="none"
        stroke="var(--pine-500)"
        strokeOpacity="0.18"
        strokeWidth="1.2"
      />
      <path
        d="M0 285 C 240 245, 420 315, 620 265 C 770 228, 835 280, 900 255"
        fill="none"
        stroke="var(--cobalt-500)"
        strokeOpacity="0.14"
        strokeWidth="1"
      />
    </svg>
  );
}
