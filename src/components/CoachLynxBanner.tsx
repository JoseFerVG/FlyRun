import { Compass, GearSix, Target } from '@phosphor-icons/react';
import type { LynxLevelInfo, UserProfile } from '../types/fitness';
import {
  formatShortUserName,
  getGoalLabel,
  getTrainingFocusInfo,
} from '../services/scienceEngine';
import { HaikeiTopoOverlay } from './AmbientBackdrop';

interface CoachLynxBannerProps {
  profile: UserProfile;
  levelInfo: LynxLevelInfo;
  onOpenGoalModal?: () => void;
  onOpenSettings?: () => void;
}

export function CoachLynxBanner({
  profile,
  levelInfo,
  onOpenGoalModal,
  onOpenSettings,
}: CoachLynxBannerProps) {
  const shortName = formatShortUserName(profile.displayName, profile.email);
  const focusInfo = getTrainingFocusInfo(profile.preferredStrategy);
  const goalTitle = getGoalLabel(profile.goal);

  return (
    <section
      className="card haikei-card-surface spotlight-card stack-sm stagger-item"
      style={{ paddingBlock: '1rem' }}
      aria-label="Saludo y meta del atleta"
    >
      <HaikeiTopoOverlay />

      <div className="row-between">
        <div className="stack-sm" style={{ gap: '0.35rem' }}>
          <div className="row-wrap" style={{ gap: '0.4rem' }}>
            <span className="pill lovable-badge">
              Nivel {levelInfo.level}
            </span>
            <span className="pill pill-emerald">
              <Compass size={13} weight="duotone" aria-hidden="true" />
              {focusInfo.shortLabel}
            </span>
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(1.25rem, 2.3vw, 1.55rem)',
              fontWeight: 800,
              letterSpacing: '-0.025em',
            }}
          >
            Hola, {shortName}
          </h1>
          <p className="muted" style={{ margin: 0, fontSize: '0.86rem' }}>
            Meta activa: <strong style={{ color: 'var(--text-primary)' }}>{goalTitle}</strong>
          </p>
        </div>

        <div className="row-wrap" style={{ gap: '0.45rem' }}>
          {onOpenGoalModal && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={onOpenGoalModal}>
              <Target size={15} weight="duotone" aria-hidden="true" />
              Cambiar meta
            </button>
          )}
          {onOpenSettings && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={onOpenSettings}>
              <GearSix size={15} weight="duotone" aria-hidden="true" />
              Ajustes
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
