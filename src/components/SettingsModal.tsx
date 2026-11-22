import { useEffect, useRef, useState } from 'react';
import {
  ArrowsClockwise,
  CheckCircle,
  ClipboardText,
  GearSix,
  MoonStars,
  Palette,
  PlugsConnected,
  ShieldCheck,
  SignOut,
  SunDim,
  Target,
  UserCircle,
  UsersThree,
  X,
} from '@phosphor-icons/react';
import type { UserProfile } from '../types/fitness';
import {
  formatShortUserName,
  getGoalLabel,
  getTrainingFocusInfo,
} from '../services/scienceEngine';
import type { LegalTabId } from './LegalComplianceModal';

export type SettingsTabId = 'connections' | 'profile' | 'appearance' | 'privacy';

export interface ConnectedPlatformItem {
  id: 'wahoo' | 'google_fit' | 'strava' | 'garmin' | 'apple_health';
  name: string;
  subtitle: string;
}

export const SIMPLE_PLATFORMS: ConnectedPlatformItem[] = [
  {
    id: 'wahoo',
    name: 'Wahoo Fitness',
    subtitle: 'Pasos, sesiones de running/bici y pulso en un clic',
  },
  {
    id: 'google_fit',
    name: 'Google Fit',
    subtitle: 'Pasos diarios y minutos activos de tu móvil o reloj',
  },
  {
    id: 'strava',
    name: 'Strava',
    subtitle: 'Carreras y rutas sincronizadas automáticamente',
  },
  {
    id: 'garmin',
    name: 'Garmin Connect',
    subtitle: 'Entrenamientos de reloj y recuperación nocturna',
  },
  {
    id: 'apple_health',
    name: 'Apple Salud / Watch',
    subtitle: 'Actividad diaria y ritmo medio',
  },
];

interface SettingsModalProps {
  open: boolean;
  initialTab: SettingsTabId;
  profile: UserProfile;
  theme: 'light' | 'dark';
  connectedPlatforms: string[];
  isDemoMode: boolean;
  syncLoading: boolean;
  onClose: () => void;
  onTogglePlatform: (platformId: string) => void;
  onSyncNow: () => void;
  onUpdateDisplayName: (nextName: string) => void;
  onOpenGoalModal: () => void;
  onOpenFullProfileEdit: () => void;
  onOpenExam: () => void;
  onOpenPersonas: () => void;
  onToggleTheme: (nextTheme: 'light' | 'dark') => void;
  onOpenLegal: (tab: LegalTabId) => void;
  onOpenCookieSettings: () => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
  onSignOut: () => void;
}

export function SettingsModal({
  open,
  initialTab,
  profile,
  theme,
  connectedPlatforms,
  isDemoMode,
  syncLoading,
  onClose,
  onTogglePlatform,
  onSyncNow,
  onUpdateDisplayName,
  onOpenGoalModal,
  onOpenFullProfileEdit,
  onOpenExam,
  onOpenPersonas,
  onToggleTheme,
  onOpenLegal,
  onOpenCookieSettings,
  onExportJSON,
  onExportCSV,
  onSignOut,
}: SettingsModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState<SettingsTabId>(initialTab);
  const [nameInput, setNameInput] = useState(formatShortUserName(profile.displayName, profile.email));

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab, open]);

  useEffect(() => {
    setNameInput(formatShortUserName(profile.displayName, profile.email));
  }, [profile.displayName, profile.email]);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);

  if (!open) return null;

  const focusInfo = getTrainingFocusInfo(profile.preferredStrategy);

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      style={{ inlineSize: 'min(95dvw, 760px)' }}
      aria-labelledby="settings-modal-title"
    >
      <div className="stack-md" style={{ padding: 'clamp(1rem, 2.5vw, 1.45rem)' }}>
        <div className="row-between">
          <div>
            <span className="pill lovable-badge">
              <GearSix size={14} weight="duotone" aria-hidden="true" />
              Ajustes
            </span>
            <h2 id="settings-modal-title" style={{ margin: '0.35rem 0 0', fontSize: '1.2rem' }}>
              Configuración, Conexiones y Privacidad
            </h2>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Cerrar ajustes">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="segmented-group" role="tablist" aria-label="Secciones de ajustes">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'connections'}
            aria-pressed={tab === 'connections'}
            className="segmented-btn is-accent"
            onClick={() => setTab('connections')}
          >
            <PlugsConnected size={14} weight="duotone" aria-hidden="true" />
            Conexiones
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'profile'}
            aria-pressed={tab === 'profile'}
            className="segmented-btn is-accent"
            onClick={() => setTab('profile')}
          >
            <UserCircle size={14} weight="duotone" aria-hidden="true" />
            Perfil y Meta
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'appearance'}
            aria-pressed={tab === 'appearance'}
            className="segmented-btn is-accent"
            onClick={() => setTab('appearance')}
          >
            <Palette size={14} weight="duotone" aria-hidden="true" />
            Apariencia
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'privacy'}
            aria-pressed={tab === 'privacy'}
            className="segmented-btn is-accent"
            onClick={() => setTab('privacy')}
          >
            <ShieldCheck size={14} weight="duotone" aria-hidden="true" />
            Privacidad
          </button>
        </div>

        {tab === 'connections' && (
          <div className="stack-sm">
            <div className="row-between">
              <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>
                Conecta tu reloj o app de salud con <strong>1 solo clic</strong>. Sin claves técnicas, sin tokens ni archivos.
              </p>
              <button
                type="button"
                className="btn btn-emerald btn-sm"
                disabled={syncLoading}
                onClick={onSyncNow}
              >
                <ArrowsClockwise size={14} weight="duotone" aria-hidden="true" />
                {syncLoading ? 'Sincronizando…' : 'Sincronizar ahora'}
              </button>
            </div>

            <div className="stack-sm">
              {SIMPLE_PLATFORMS.map((p) => {
                const isConnected = connectedPlatforms.includes(p.id);
                return (
                  <div
                    key={p.id}
                    className="inset-panel row-between"
                    style={{
                      background: isConnected ? 'var(--pine-soft)' : 'var(--bg-surface)',
                      borderColor: isConnected ? 'var(--pine-border)' : 'var(--border-hairline)',
                      padding: '0.68rem 0.9rem',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.92rem' }}>{p.name}</strong>
                      <div className="muted" style={{ fontSize: '0.78rem' }}>{p.subtitle}</div>
                    </div>
                    <button
                      type="button"
                      className={`btn btn-sm ${isConnected ? 'btn-emerald' : 'btn-primary'}`}
                      onClick={() => onTogglePlatform(p.id)}
                    >
                      {isConnected ? (
                        <>
                          <CheckCircle size={15} weight="duotone" aria-hidden="true" />
                          Conectado
                        </>
                      ) : (
                        'Conectar en 1 clic'
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'profile' && (
          <div className="stack-md">
            <div className="inset-panel stack-sm" style={{ background: 'var(--bg-surface)' }}>
              <label htmlFor="settings-short-name" style={{ fontWeight: 700, fontSize: '0.86rem' }}>
                ¿Cómo quieres que te llamemos?
              </label>
              <div className="row-wrap" style={{ gap: '0.5rem' }}>
                <input
                  id="settings-short-name"
                  type="text"
                  className="input"
                  style={{ flex: '1 1 200px' }}
                  maxLength={32}
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Tu nombre"
                />
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    const clean = nameInput.trim();
                    if (clean) onUpdateDisplayName(clean);
                  }}
                >
                  Guardar nombre
                </button>
              </div>
              {profile.email && (
                <span className="muted" style={{ fontSize: '0.76rem' }}>
                  Cuenta vinculada: {profile.email}
                </span>
              )}
            </div>

            <div className="grid-2" style={{ gap: '0.65rem' }}>
              <div className="inset-panel stack-sm" style={{ background: 'var(--bg-surface)' }}>
                <span className="muted" style={{ fontSize: '0.75rem' }}>Meta y enfoque actual</span>
                <strong style={{ fontSize: '0.94rem' }}>{getGoalLabel(profile.goal)}</strong>
                <span className="muted" style={{ fontSize: '0.8rem' }}>Entrenas: {focusInfo.shortLabel}</span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    onClose();
                    onOpenGoalModal();
                  }}
                >
                  <Target size={14} weight="duotone" aria-hidden="true" />
                  Cambiar meta o enfoque
                </button>
              </div>

              <div className="inset-panel stack-sm" style={{ background: 'var(--bg-surface)' }}>
                <span className="muted" style={{ fontSize: '0.75rem' }}>Nivel fisiológico y biometría</span>
                <strong style={{ fontSize: '0.94rem' }}>
                  Nivel {profile.level} · VDOT {profile.vdot}
                </strong>
                <span className="muted" style={{ fontSize: '0.8rem' }}>
                  {profile.age} años · {profile.weightKg} kg · {profile.trainingDaysPerWeek} d/sem
                </span>
                <div className="row-wrap" style={{ gap: '0.4rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      onClose();
                      onOpenExam();
                    }}
                  >
                    <ClipboardText size={14} weight="duotone" aria-hidden="true" />
                    Test de nivel
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      onClose();
                      onOpenFullProfileEdit();
                    }}
                  >
                    Editar datos
                  </button>
                </div>
              </div>
            </div>

            {isDemoMode && (
              <div className="inset-panel row-between" style={{ background: 'var(--bg-surface)' }}>
                <span className="muted" style={{ fontSize: '0.82rem' }}>Explorar otros perfiles de ejemplo</span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    onClose();
                    onOpenPersonas();
                  }}
                >
                  <UsersThree size={15} weight="duotone" aria-hidden="true" />
                  Cambiar caso demo
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'appearance' && (
          <div className="grid-2" style={{ gap: '0.75rem' }}>
            <button
              type="button"
              aria-pressed={theme === 'light'}
              className="lovable-choice-card"
              style={{ padding: '1rem', textAlign: 'left' }}
              onClick={() => onToggleTheme('light')}
            >
              <div className="row-between">
                <SunDim size={22} weight="duotone" color="var(--accent)" aria-hidden="true" />
                {theme === 'light' && <span className="pill pill-emerald">Activo</span>}
              </div>
              <strong>Modo Claro</strong>
              <span className="muted" style={{ fontSize: '0.78rem' }}>
                Fondo cálido limpio ideal para leer entrenamientos a plena luz del día.
              </span>
            </button>

            <button
              type="button"
              aria-pressed={theme === 'dark'}
              className="lovable-choice-card"
              style={{ padding: '1rem', textAlign: 'left' }}
              onClick={() => onToggleTheme('dark')}
            >
              <div className="row-between">
                <MoonStars size={22} weight="duotone" color="var(--cobalt)" aria-hidden="true" />
                {theme === 'dark' && <span className="pill pill-emerald">Activo</span>}
              </div>
              <strong>Modo Oscuro Mate</strong>
              <span className="muted" style={{ fontSize: '0.78rem' }}>
                Contrastes suaves sin brillos molestos para entrenar al amanecer o de noche.
              </span>
            </button>
          </div>
        )}

        {tab === 'privacy' && (
          <div className="stack-sm">
            <div className="inset-panel stack-sm" style={{ background: 'var(--bg-surface)' }}>
              <strong style={{ fontSize: '0.92rem' }}>Tus derechos, privacidad y documentos legales</strong>
              <p className="muted" style={{ margin: 0, fontSize: '0.8rem' }}>
                Cumplimiento RGPD UE, LOPDGDD, LSSI-CE y Política de Privacidad. Consulta tus textos legales, gestiona cookies o descarga una copia completa de tus entrenamientos.
              </p>
              <div className="row-wrap" style={{ gap: '0.45rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    onClose();
                    onOpenLegal('privacy');
                  }}
                >
                  Privacidad y RGPD
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    onClose();
                    onOpenLegal('medical');
                  }}
                >
                  Aviso Médico
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    onClose();
                    onOpenCookieSettings();
                  }}
                >
                  Preferencias de Cookies
                </button>
              </div>
            </div>

            <div className="inset-panel row-between" style={{ background: 'var(--bg-surface)' }}>
              <div>
                <strong style={{ fontSize: '0.88rem' }}>Portabilidad de datos (Art. 20 RGPD)</strong>
                <div className="muted" style={{ fontSize: '0.76rem' }}>Descarga todo tu historial cuando quieras</div>
              </div>
              <div className="row-wrap" style={{ gap: '0.4rem' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={onExportJSON}>
                  Exportar JSON
                </button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={onExportCSV}>
                  Exportar CSV
                </button>
              </div>
            </div>

            <div className="row-between" style={{ paddingTop: '0.35rem' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--accent)' }}
                onClick={() => {
                  onClose();
                  onOpenLegal('gdpr_rights');
                }}
              >
                Eliminar cuenta permanentemente
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  onClose();
                  onSignOut();
                }}
              >
                <SignOut size={15} weight="duotone" aria-hidden="true" />
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}
