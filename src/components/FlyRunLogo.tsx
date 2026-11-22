interface FlyRunLogoProps {
  size?: 'sm' | 'md' | 'lg';
  badgeText?: string;
  subtitle?: string;
}

const SIZE_MAP = {
  sm: 32,
  md: 36,
  lg: 42,
};

export function FlyRunLogo({ size = 'md', badgeText, subtitle }: FlyRunLogoProps) {
  const px = SIZE_MAP[size];

  return (
    <div className="brand-mark">
      <svg
        width={px}
        height={px}
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
        style={{ flexShrink: 0, borderRadius: '10px', boxShadow: '0 2px 10px color-mix(in srgb, var(--accent) 24%, transparent)' }}
      >
        <defs>
          <linearGradient id="flyrun-mark-bg" x1="6" y1="6" x2="58" y2="58" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1A1D22" />
            <stop offset="55%" stopColor="#121417" />
            <stop offset="100%" stopColor="#3D1408" />
          </linearGradient>
          <linearGradient id="flyrun-mark-stroke" x1="16" y1="44" x2="50" y2="16" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#D94814" />
            <stop offset="100%" stopColor="#F57142" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="16" fill="url(#flyrun-mark-bg)" />
        <rect x="2" y="2" width="60" height="60" rx="14" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="1.5" />
        <rect x="11" y="18" width="42" height="28" rx="14" stroke="#ffffff" strokeOpacity="0.24" strokeWidth="2.2" />
        <rect x="15.5" y="22.5" width="33" height="19" rx="9.5" stroke="#ffffff" strokeOpacity="0.14" strokeWidth="1.6" />
        <path
          d="M18 40.5C24.5 40.5 29.5 34.5 34 27.5C37.2 22.5 41.2 19.2 48.5 18.5C44.5 23.2 42.2 26.8 39.2 31.5C35.2 37.8 29.8 42.8 18 44.5V40.5Z"
          fill="#FAF9F6"
        />
        <path
          d="M19 32.5C25.5 32.2 31.2 28.2 36.2 22.8C39.2 19.6 42.4 18.2 46.8 18C42.2 20.6 39.2 24.4 35.8 28.4C31.5 33.4 26.4 35.6 19 35.8V32.5Z"
          fill="url(#flyrun-mark-stroke)"
        />
      </svg>

      <div>
        <div className="brand-title">
          <span translate="no">FlyRun</span>
          {badgeText && <span className="brand-badge">{badgeText}</span>}
        </div>
        {subtitle && (
          <div className="muted" style={{ fontSize: '0.74rem' }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
