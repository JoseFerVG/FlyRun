import { useEffect, useRef } from 'react';
import { Check, MessageSquareQuote, UserCheck, X } from 'lucide-react';
import { SIMULATED_USER_PERSONAS, type SimulatedUserPersona } from '../data/userPersonas';

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
            <span className="pill pill-cyan">Pruebas con 7 perfiles de usuarios</span>
            <h2 id="personas-modal-title" style={{ margin: '0.35rem 0 0', fontSize: '1.22rem' }}>
              Opiniones recopiladas y mejoras implementadas
            </h2>
            <p className="muted" style={{ margin: '0.2rem 0 0', fontSize: '0.84rem' }}>
              Cambia en un clic a cualquiera de los 7 usuarios simulados para probar la aplicación desde su nivel, deporte y datos reales.
            </p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleClose} aria-label="Cerrar panel de usuarios">
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
                  <div>
                    <div className="row-wrap">
                      <strong style={{ fontSize: '0.98rem' }}>{persona.name}</strong>
                      <span className="pill mono">Nivel {persona.profile.level} · VDOT {persona.profile.vdot}</span>
                      <span className="pill pill-emerald mono">{persona.rating}</span>
                    </div>
                    <div className="muted" style={{ fontSize: '0.78rem', marginTop: '0.15rem' }}>
                      {persona.roleLabel}
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
                    {isCurrent ? 'Perfil activo' : 'Entrar como este usuario'}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.84rem' }}>
                  <MessageSquareQuote size={15} color="#767c87" style={{ flexShrink: 0, marginTop: '3px' }} aria-hidden="true" />
                  <span className="secondary">{persona.quote}</span>
                </div>

                <div className="grid-2" style={{ gap: '0.6rem', fontSize: '0.8rem' }}>
                  <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', borderRadius: '8px', padding: '0.55rem 0.7rem' }}>
                    <strong style={{ color: 'var(--accent)' }}>Mejora pedida:</strong>{' '}
                    <span className="secondary">{persona.requestedImprovement}</span>
                  </div>
                  <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', borderRadius: '8px', padding: '0.55rem 0.7rem' }}>
                    <strong style={{ color: 'var(--pine)' }}>Implementado en FlyRun:</strong>{' '}
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
