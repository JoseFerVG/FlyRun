export type FlyRunLogoVariant = 'obsidian' | 'light' | 'vector';

interface FlyRunLogoProps {
  size?: 'sm' | 'md' | 'lg';
  badgeText?: string;
  subtitle?: string;
  variant?: FlyRunLogoVariant;
}

const SIZE_MAP = {
  sm: 34,
  md: 40,
  lg: 46,
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
        style={{
          flexShrink: 0,
          filter: 'drop-shadow(0 4px 10px color-mix(in srgb, var(--accent) 24%, transparent))',
        }}
      >
        <defs>
          <linearGradient id="fr-wing-grad" x1="10" y1="14" x2="54" y2="52" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF5E2B" />
            <stop offset="50%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>
        </defs>
        <path
          d="M8 16H43C48 16 51.2 19.2 49.4 23.4C48.1 26.3 45.2 29.7 42.1 32.8L23.8 51.4C20.9 54.3 15.6 52.8 17.1 49L29 32.6H16.2C11.5 32.6 8.8 29.3 8 25.5H32.8C34 25.5 34.5 24 33.5 23.2H11.2C8.9 23.2 7.2 20.8 8 16Z"
          fill="url(#fr-wing-grad)"
        />
        <path
          d="M12.5 24.8H31.5C32.8 27.5 30.6 30.2 27.3 30.2H15C12.8 30.2 11.7 27.6 12.5 24.8Z"
          fill="url(#fr-wing-grad)"
          opacity="0.9"
        />
        <path
          d="M45.5 34.2C49.7 34.2 53.2 37 53.2 40.8C53.2 43.6 51.4 45.9 47.7 49.4L43.1 53.6C41.1 55.4 38 54 39 51.2L43 43.4C43.7 41.9 42.6 40.3 40.8 40.3H39.5L45.5 34.2Z"
          fill="url(#fr-wing-grad)"
        />
      </svg>

      <div>
        <div className="brand-title">
          <span translate="no">FlyRun</span>
          {badgeText && <span className="brand-badge lovable-badge">{badgeText}</span>}
        </div>
        {subtitle && (
          <div className="muted" style={{ fontSize: '0.73rem', letterSpacing: '-0.005em' }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
