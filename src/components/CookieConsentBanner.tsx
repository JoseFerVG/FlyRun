import { useEffect, useState } from 'react';
import { Cookie, SlidersHorizontal } from '@phosphor-icons/react';
import type { LegalTabId } from './LegalComplianceModal';

const CONSENT_STORAGE_KEY = 'flyrun_cookie_consent_v1';

export interface CookieConsentState {
  essential: true;
  preferences: boolean;
  analytics: boolean;
  updatedAt: string;
}

interface CookieConsentBannerProps {
  forceOpenConfigure?: boolean;
  onConfigureClosed?: () => void;
  onOpenLegal: (tab: LegalTabId) => void;
}

export function getSavedCookieConsent(): CookieConsentState | null {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CookieConsentState;
  } catch {
    return null;
  }
}

export function CookieConsentBanner({
  forceOpenConfigure = false,
  onConfigureClosed,
  onOpenLegal,
}: CookieConsentBannerProps) {
  const [saved, setSaved] = useState<CookieConsentState | null>(() => getSavedCookieConsent());
  const [configuring, setConfiguring] = useState(false);
  const [allowPreferences, setAllowPreferences] = useState(true);
  const [allowAnalytics, setAllowAnalytics] = useState(false);

  useEffect(() => {
    if (forceOpenConfigure) {
      setConfiguring(true);
    }
  }, [forceOpenConfigure]);

  if (saved && !forceOpenConfigure) {
    return null;
  }

  const persistChoice = (preferences: boolean, analytics: boolean) => {
    const next: CookieConsentState = {
      essential: true,
      preferences,
      analytics,
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage error
    }
    setSaved(next);
    setConfiguring(false);
    onConfigureClosed?.();
  };

  return (
    <aside
      role="region"
      aria-label="Aviso de cookies y almacenamiento privado"
      style={{
        position: 'fixed',
        insetBlockEnd: 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
        insetInlineStart: '50%',
        transform: 'translateX(-50%)',
        inlineSize: 'min(95vw, 960px)',
        zIndex: 120,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-strong)',
        borderRadius: '16px',
        padding: '0.95rem 1.15rem',
        boxShadow: 'var(--shadow-modal)',
      }}
    >
      <div className="stack-sm">
        <div className="row-between" style={{ alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 380px' }}>
            <div className="row-wrap" style={{ gap: '0.4rem', marginBottom: '0.25rem' }}>
              <Cookie size={16} weight="duotone" color="var(--accent)" aria-hidden="true" />
              <strong style={{ fontSize: '0.88rem' }}>Privacidad, Cookies y Almacenamiento Local (RGPD / AEPD)</strong>
            </div>
            <p className="muted" style={{ margin: 0, fontSize: '0.78rem', lineHeight: 1.45 }}>
              Usamos almacenamiento técnico esencial para tu sesión de Google, seguridad Firestore y guardado offline de
              entrenamientos. No usamos cookies publicitarias ni vendemos tus datos. Puedes aceptar, rechazar las opcionales o
              consultar nuestra{' '}
              <button
                type="button"
                onClick={() => onOpenLegal('cookies')}
                style={{
                  background: 'none',
                  border: 0,
                  padding: 0,
                  color: 'var(--accent)',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: 'inherit',
                  fontWeight: 600,
                }}
              >
                Política de Cookies
              </button>{' '}
              y{' '}
              <button
                type="button"
                onClick={() => onOpenLegal('privacy')}
                style={{
                  background: 'none',
                  border: 0,
                  padding: 0,
                  color: 'var(--accent)',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: 'inherit',
                  fontWeight: 600,
                }}
              >
                Privacidad
              </button>.
            </p>
          </div>

          <div className="row-wrap" style={{ gap: '0.45rem', flexShrink: 0 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => persistChoice(false, false)}
            >
              Solo esenciales (Rechazar)
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setConfiguring((v) => !v)}
            >
              <SlidersHorizontal size={14} weight="duotone" aria-hidden="true" />
              Configurar
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => persistChoice(true, false)}
            >
              Aceptar todas
            </button>
          </div>
        </div>

        {configuring && (
          <div className="inset-panel stack-sm" style={{ padding: '0.7rem 0.85rem', fontSize: '0.79rem' }}>
            <label className="row-between" style={{ cursor: 'not-allowed' }}>
              <span>
                <strong>Estrictamente necesarias (Autenticación, Firestore, Consentimiento)</strong> — Siempre activas
              </span>
              <input type="checkbox" checked disabled />
            </label>
            <label className="row-between" style={{ cursor: 'pointer' }}>
              <span>
                <strong>Preferencias de interfaz</strong> — Tema claro/oscuro, hidratación diaria y unidad km/h o km/min
              </span>
              <input
                type="checkbox"
                checked={allowPreferences}
                onChange={(e) => setAllowPreferences(e.target.checked)}
              />
            </label>
            <label className="row-between" style={{ cursor: 'pointer' }}>
              <span>
                <strong>Métricas de diagnóstico técnico anonimizadas</strong> — Desactivadas por defecto (AEPD)
              </span>
              <input
                type="checkbox"
                checked={allowAnalytics}
                onChange={(e) => setAllowAnalytics(e.target.checked)}
              />
            </label>
            <div className="row-wrap" style={{ justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-emerald btn-sm"
                onClick={() => persistChoice(allowPreferences, allowAnalytics)}
              >
                Guardar preferencias seleccionadas
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
