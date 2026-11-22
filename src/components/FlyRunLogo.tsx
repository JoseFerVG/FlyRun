import { assetUrl } from '../services/assets';

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

export function FlyRunLogo({ size = 'md', badgeText, subtitle, variant = 'obsidian' }: FlyRunLogoProps) {
  const px = SIZE_MAP[size];

  return (
    <div className="brand-mark">
      {variant === 'vector' ? (
        <svg
          width={px}
          height={px}
          viewBox="0 0 64 64"
          fill="none"
          aria-hidden="true"
          style={{
            flexShrink: 0,
            borderRadius: '11px',
            boxShadow: '0 4px 14px color-mix(in srgb, var(--accent) 26%, transparent)',
          }}
        >
          <defs>
            <linearGradient id="fr-comp-bg" x1="6" y1="6" x2="58" y2="58" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#181A22" />
              <stop offset="60%" stopColor="#11131A" />
              <stop offset="100%" stopColor="#22142E" />
            </linearGradient>
            <linearGradient id="fr-comp-wing" x1="12" y1="18" x2="50" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FF5E2B" />
              <stop offset="48%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" rx="16" fill="url(#fr-comp-bg)" />
          <rect x="1.5" y="1.5" width="61" height="61" rx="14.5" stroke="#ffffff" strokeOpacity="0.14" strokeWidth="1.5" />
          <path
            d="M12 18.5H39.5C43.5 18.5 46 21 44.5 24.5C43.5 26.8 41.2 29.5 38.8 32L24.5 46.5C22.2 48.8 18 47.6 19.2 44.6L28.5 31.8H18.5C14.8 31.8 12.6 29.2 12 26.2H31.5C32.4 26.2 32.8 25 32 24.4H14.5C12.7 24.4 11.4 22.4 12 18.5Z"
            fill="url(#fr-comp-wing)"
          />
          <path
            d="M15.5 25.5H30.5C31.5 27.6 29.8 29.8 27.2 29.8H17.5C15.8 29.8 14.9 27.7 15.5 25.5Z"
            fill="url(#fr-comp-wing)"
            opacity="0.92"
          />
          <path
            d="M41.5 33.2C44.8 33.2 47.5 35.4 47.5 38.4C47.5 40.6 46.1 42.4 43.2 45.2L39.6 48.5C38 49.9 35.6 48.8 36.4 46.6L39.5 40.4C40.1 39.2 39.2 38 37.8 38H36.8L41.5 33.2Z"
            fill="url(#fr-comp-wing)"
          />
        </svg>
      ) : (
        <span
          aria-hidden="true"
          style={{
            inlineSize: `${px}px`,
            blockSize: `${px}px`,
            borderRadius: '11px',
            overflow: 'hidden',
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            boxShadow:
              '0 4px 14px color-mix(in srgb, var(--accent) 20%, transparent), 0 1px 3px rgba(15, 17, 23, 0.16)',
            background: variant === 'light' ? '#faf9f6' : '#16181f',
          }}
        >
          <img
            src={assetUrl(
              variant === 'light' ? 'images/logos/flyrun-icon-light.png' : 'images/logos/flyrun-icon-dark.png'
            )}
            alt=""
            width={px}
            height={px}
            style={{
              inlineSize: '100%',
              blockSize: '100%',
              objectFit: 'cover',
              transform: 'scale(1.12)',
            }}
          />
        </span>
      )}

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
