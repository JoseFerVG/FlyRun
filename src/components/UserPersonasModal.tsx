import { useEffect, useRef } from 'react';
import { Check, UserCheck, X } from 'lucide-react';
import { ChatText } from '@phosphor-icons/react';
import { SIMULATED_USER_PERSONAS, type SimulatedUserPersona } from '../data/userPersonas';
import { assetUrl } from '../services/assets';

interface UserPersonasModalProps {
  open: boolean;
  activeUid?: string;
  activeEmail?: string;
  onClose: () => void;
  onSelectPersona: (persona: SimulatedUserPersona) => void;
}

export function UserPersonasModal({
  open,
  activeUid,
  activeEmail,
  onClose,
  onSelectPersona,
}: UserPersonasModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const handleClose = () => {
    if (dialogRef.current?.open) dialogRef.current.close();
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      style={{ inlineSize: 'min(95dvw, 840px)' }}
      aria-labelledby="personas-modal-title"
      onCancel={(e) => {
        e.preventDefault();
        handleClose();
      }}
    >
      <div className="stack-md" style={{ padding: '1.4rem' }}>
        <div className="row-between">
          <div>
            <span className="pill pill-cyan">Casos de uso por perfil y nivel</span>
            <h2 id="personas-modal-title" style={{ margin: '0.35rem 0 0', fontSize: '1.22rem' }}>
              Explora FlyRun con configuraciones reales de corredor
            </h2>
            <p className="muted" style={{ margin: '0.2rem 0 0', fontSize: '0.84rem' }}>
              Carga cualquiera de estas configuraciones precalibradas en modo demo (iniciación CaCo, híbrido fútbol/bici, 10K polarizado o pruebas físicas) para ver cómo adapta el plan, las zonas y la nutrición.
            </p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleClose} aria-label="Cerrar panel de perfiles">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="stack-md">
          {SIMULATED_USER_PERSONAS.map((persona) => {
            const isCurrent =
              activeUid === persona.profile.uid ||
              (Boolean(activeEmail) && activeEmail === persona.profile.email);
            return (
              <article
                key={persona.id}
                className="inset-panel stack-sm"
                style={{
                  borderColor: isCurrent ? 'var(--accent)' : 'var(--border-hairline)',
                  background: isCurrent ? 'var(--accent-soft)' : 'var(--bg-inset)',
                }}
              >
                <div className="row-between">
                  <div className="row-wrap" style={{ gap: '0.75rem', flexWrap: 'nowrap' }}>
                    <img
                      src={assetUrl(persona.avatarFile)}
                      alt={persona.name}
                      width={38}
                      height={38}
                      loading="lazy"
                      className="athlete-avatar"
                    />
                    <div>
                      <div className="row-wrap">
                        <strong style={{ fontSize: '0.98rem' }}>{persona.name}</strong>
                        <span className="pill mono">Nivel {persona.profile.level} · VDOT {persona.profile.vdot}</span>
                      </div>
                      <div className="muted" style={{ fontSize: '0.78rem', marginTop: '0.15rem' }}>
                        {persona.roleLabel}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`btn btn-sm ${isCurrent ? 'btn-emerald' : 'btn-primary'}`}
                    onClick={() => {
                      onSelectPersona(persona);
                      handleClose();
                    }}
                  >
                    {isCurrent ? <Check size={14} aria-hidden="true" /> : <UserCheck size={14} aria-hidden="true" />}
                    {isCurrent ? 'Perfil activo' : 'Cargar caso en demo'}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.84rem' }}>
                  <ChatText size={16} weight="duotone" color="var(--text-muted)" style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
                  <span className="secondary">{persona.quote}</span>
                </div>

                <div className="grid-2" style={{ gap: '0.6rem', fontSize: '0.8rem' }}>
                  <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', borderRadius: '8px', padding: '0.55rem 0.7rem' }}>
                    <strong style={{ color: 'var(--accent)' }}>Necesidad del atleta:</strong>{' '}
                    <span className="secondary">{persona.requestedImprovement}</span>
                  </div>
                  <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', borderRadius: '8px', padding: '0.55rem 0.7rem' }}>
                    <strong style={{ color: 'var(--pine)' }}>Configuración aplicada:</strong>{' '}
                    <span className="secondary">{persona.implementedSolution}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </dialog>
  );
}