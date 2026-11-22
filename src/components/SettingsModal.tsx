import { useEffect, useRef, useState } from 'react';
import {
  ArrowsClockwise,
  Camera,
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
import { assetUrl } from '../services/assets';
import { SIMULATED_USER_PERSONAS } from '../data/userPersonas';
import type { LegalTabId } from './LegalComplianceModal';

export type SettingsTabId = 'profile' | 'connections' | 'appearance' | 'privacy';

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

const AVATAR_PRESET_FILES = [
  'images/avatar-javier.jpg',
  'images/avatar-laura.jpg',
  'images/avatar-elena.jpg',
  'images/goal-speed-5k.jpg',
  'images/goal-endurance-10k.jpg',
  'images/goal-start-caco.jpg',
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
  onUpdateQuickProfile: (updates: {
    displayName?: string;
    photoURL?: string;
    weightKg?: number;
    trainingDaysPerWeek?: number;
    dailyStepsTarget?: number;
  }) => void;
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

function resizeImageFileToAvatarDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagen no válido.'));
      img.onload = () => {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo procesar el lienzo.'));
          return;
        }
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.86));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
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
  onUpdateQuickProfile,
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
  const [weightInput, setWeightInput] = useState(profile.weightKg);
  const [daysInput, setDaysInput] = useState(profile.trainingDaysPerWeek);
  const [stepsTargetInput, setStepsTargetInput] = useState(profile.dailyStepsTarget);
  const [photoInput, setPhotoInput] = useState(profile.photoURL);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab, open]);

  useEffect(() => {
    setNameInput(formatShortUserName(profile.displayName, profile.email));
    setWeightInput(profile.weightKg);
    setDaysInput(profile.trainingDaysPerWeek);
    setStepsTargetInput(profile.dailyStepsTarget);
    setPhotoInput(profile.photoURL);
  }, [profile]);

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
  const matchedPersona = SIMULATED_USER_PERSONAS.find(
    (p) => p.profile.uid === profile.uid || (Boolean(profile.email) && p.profile.email === profile.email)
  );
  const resolvedAvatar =
    photoInput ||
    (matchedPersona ? assetUrl(matchedPersona.avatarFile) : assetUrl('images/avatar-javier.jpg'));

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImageFileToAvatarDataUrl(file);
      setPhotoInput(dataUrl);
      onUpdateQuickProfile({ photoURL: dataUrl });
    } catch {
      // Ignore invalid image files
    } finally {
      e.target.value = '';
    }
  };

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
              Tu Perfil, Conexiones y Apariencia
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
            aria-selected={tab === 'profile'}
            aria-pressed={tab === 'profile'}
            className="segmented-btn is-accent"
            onClick={() => setTab('profile')}
          >
            <UserCircle size={14} weight="duotone" aria-hidden="true" />
            Mi Perfil
          </button>
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

        {tab === 'profile' && (
          <div className="stack-md">
            {/* Cabecera visual con foto de perfil personalizable */}
            <div
              className="inset-panel row-between"
              style={{
                background: 'linear-gradient(135deg, var(--accent-soft), var(--cobalt-soft))',
                borderColor: 'var(--cobalt-border)',
                padding: '0.95rem 1.05rem',
              }}
            >
              <div className="row-wrap" style={{ gap: '0.9rem' }}>
                <img
                  src={resolvedAvatar}
                  alt={nameInput}
                  width={64}
                  height={64}
                  className="athlete-avatar"
                  style={{
                    inlineSize: '64px',
                    blockSize: '64px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid var(--bg-surface)',
                    boxShadow: 'var(--shadow-card)',
                  }}
                />
                <div className="stack-sm" style={{ gap: '0.18rem' }}>
                  <strong style={{ fontSize: '1.08rem' }}>{nameInput}</strong>
                  <span className="muted" style={{ fontSize: '0.78rem' }}>
                    {profile.email || 'Cuenta local / Demo'} · Nivel {profile.level}
                  </span>
                  <span className="pill lovable-badge" style={{ alignSelf: 'flex-start', fontSize: '0.7rem' }}>
                    {getGoalLabel(profile.goal)}
                  </span>
                </div>
              </div>

              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                <Camera size={15} weight="duotone" aria-hidden="true" />
                Subir foto
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => void handlePhotoUpload(e)}
                  className="sr-only"
                />
              </label>
            </div>

            {/* Avatares rápidos deportivos */}
            <div className="stack-sm">
              <span className="muted" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                O elige un avatar rápido:
              </span>
              <div className="row-wrap" style={{ gap: '0.5rem' }}>
                {AVATAR_PRESET_FILES.map((file) => {
                  const fullUrl = `${window.location.origin}/${file}`;
                  const active = resolvedAvatar.endsWith(file) || photoInput === fullUrl;
                  return (
                    <button
                      key={file}
                      type="button"
                      onClick={() => {
                        setPhotoInput(fullUrl);
                        onUpdateQuickProfile({ photoURL: fullUrl });
                      }}
                      style={{
                        padding: '2px',
                        borderRadius: '50%',
                        border: active ? '2px solid var(--accent)' : '2px solid transparent',
                        background: 'transparent',
                        cursor: 'pointer',
                      }}
                      title="Elegir este avatar"
                    >
                      <img
                        src={assetUrl(file)}
                        alt=""
                        width={40}
                        height={40}
                        style={{ inlineSize: '40px', blockSize: '40px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Personalización rápida */}
            <div className="inset-panel stack-sm" style={{ background: 'var(--bg-surface)' }}>
              <div className="grid-2" style={{ gap: '0.75rem' }}>
                <div className="field">
                  <label htmlFor="settings-short-name">Nombre visible</label>
                  <input
                    id="settings-short-name"
                    type="text"
                    className="input"
                    maxLength={32}
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="settings-weight">Peso corporal (kg)</label>
                  <input
                    id="settings-weight"
                    type="number"
                    min={35}
                    max={200}
                    className="input mono"
                    value={weightInput}
                    onChange={(e) => setWeightInput(Number(e.target.value))}
                  />
                </div>
                <div className="field">
                  <label htmlFor="settings-days">Días de entreno / semana</label>
                  <input
                    id="settings-days"
                    type="number"
                    min={1}
                    max={7}
                    className="input mono"
                    value={daysInput}
                    onChange={(e) => setDaysInput(Number(e.target.value))}
                  />
                </div>
                <div className="field">
                  <label htmlFor="settings-steps">Meta diaria de pasos</label>
                  <input
                    id="settings-steps"
                    type="number"
                    min={2000}
                    max={30000}
                    step={500}
                    className="input mono"
                    value={stepsTargetInput}
                    onChange={(e) => setStepsTargetInput(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="row-between" style={{ paddingTop: '0.25rem' }}>
                <span className="muted" style={{ fontSize: '0.78rem' }}>
                  Enfoque actual: <strong>{focusInfo.shortLabel}</strong>
                </span>
                <button
                  type="button"
                  className="btn lovable-cta-btn btn-sm"
                  onClick={() =>
                    onUpdateQuickProfile({
                      displayName: nameInput.trim() || formatShortUserName(profile.displayName, profile.email),
                      photoURL: photoInput,
                      weightKg: weightInput,
                      trainingDaysPerWeek: daysInput,
                      dailyStepsTarget: stepsTargetInput,
                    })
                  }
                >
                  <CheckCircle size={15} weight="duotone" aria-hidden="true" />
                  Guardar cambios del perfil
                </button>
              </div>
            </div>

            <div className="row-wrap" style={{ gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  onClose();
                  onOpenGoalModal();
                }}
              >
                <Target size={14} weight="duotone" aria-hidden="true" />
                Cambiar meta y enfoque
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  onClose();
                  onOpenExam();
                }}
              >
                <ClipboardText size={14} weight="duotone" aria-hidden="true" />
                Evaluar nivel
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  onClose();
                  onOpenFullProfileEdit();
                }}
              >
                Configuración avanzada
              </button>
              {isDemoMode && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    onClose();
                    onOpenPersonas();
                  }}
                >
                  <UsersThree size={14} weight="duotone" aria-hidden="true" />
                  Cambiar caso demo
                </button>
              )}
            </div>
          </div>
        )}

        {tab === 'connections' && (
          <div className="stack-sm">
            <div className="row-between">
              <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>
                Conecta tu reloj o app de salud con <strong>1 solo clic</strong>. Sin claves técnicas ni pasos raros.
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
                Fondo alabastro limpio con tarjetas nítidas y contraste suave para el día.
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
              <strong>Modo Oscuro</strong>
              <span className="muted" style={{ fontSize: '0.78rem' }}>
                Obsidiana profunda con acentos Coral e Índigo para descansar la vista de noche.
              </span>
            </button>
          </div>
        )}

        {tab === 'privacy' && (
          <div className="stack-sm">
            <div className="inset-panel stack-sm" style={{ background: 'var(--bg-surface)' }}>
              <strong style={{ fontSize: '0.92rem' }}>Tus derechos, privacidad y documentos legales</strong>
              <p className="muted" style={{ margin: 0, fontSize: '0.8rem' }}>
                Cumplimiento RGPD UE, LOPDGDD, LSSI-CE y Política de Privacidad. Consulta tus textos legales, gestiona cookies o descarga tus datos.
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
