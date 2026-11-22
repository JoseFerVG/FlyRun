import { useEffect, useRef, useState } from 'react';
import { CheckCircle, Compass, Target, X } from '@phosphor-icons/react';
import type { CardioModality, FitnessGoal, TrainingFocus, UserProfile } from '../types/fitness';
import { GOAL_CATALOG, TRAINING_FOCUS_CATALOG } from '../services/scienceEngine';
import { assetUrl } from '../services/assets';

interface GoalFocusModalProps {
  open: boolean;
  profile: UserProfile;
  onClose: () => void;
  onSaveGoalAndFocus: (updates: {
    goal: FitnessGoal;
    preferredStrategy: TrainingFocus;
    preferredStrategyId: string;
    preferredModalities: CardioModality[];
  }) => void;
}

export function GoalFocusModal({
  open,
  profile,
  onClose,
  onSaveGoalAndFocus,
}: GoalFocusModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedGoal, setSelectedGoal] = useState<FitnessGoal>(profile.goal);
  const [selectedFocus, setSelectedFocus] = useState<TrainingFocus>(
    (profile.preferredStrategy as TrainingFocus | undefined) ??
      (profile.level <= 2 ? 'caco_safe' : 'endurance_base')
  );

  useEffect(() => {
    setSelectedGoal(profile.goal);
    setSelectedFocus(
      (profile.preferredStrategy as TrainingFocus | undefined) ??
        (profile.level <= 2 ? 'caco_safe' : 'endurance_base')
    );
  }, [profile, open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  if (!open) return null;

  const activeFocusItem =
    TRAINING_FOCUS_CATALOG.find((f) => f.id === selectedFocus) ?? TRAINING_FOCUS_CATALOG[1];

  const handleSave = () => {
    const mergedModalities = Array.from(
      new Set<CardioModality>([...activeFocusItem.recommendedModalities])
    );
    onSaveGoalAndFocus({
      goal: selectedGoal,
      preferredStrategy: selectedFocus,
      preferredStrategyId: activeFocusItem.strategyId,
      preferredModalities: mergedModalities,
    });
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      style={{ inlineSize: 'min(95dvw, 820px)' }}
      aria-labelledby="goal-focus-modal-title"
    >
      <div style={{ padding: 'clamp(1.1rem, 2.5vw, 1.5rem)' }} className="stack-md">
        <div className="row-between">
          <div>
            <span className="pill lovable-badge">
              <Target size={14} weight="duotone" aria-hidden="true" />
              Personalización rápida
            </span>
            <h2 id="goal-focus-modal-title" style={{ margin: '0.35rem 0 0', fontSize: '1.25rem' }}>
              Cambia tu meta y lo que quieres entrenar mejor
            </h2>
            <p className="muted" style={{ margin: '0.2rem 0 0', fontSize: '0.84rem' }}>
              Actualizaremos tu plan y las rutinas recomendadas de hoy conservando todos tus entrenos completados.
            </p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Cerrar">
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="stack-sm">
          <div style={{ fontSize: '0.86rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Target size={16} weight="duotone" color="var(--accent)" aria-hidden="true" />
            1. Tu Meta Principal
          </div>
          <div className="lovable-choice-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(125px, 1fr))' }}>
            {GOAL_CATALOG.map((g) => (
              <button
                key={g.id}
                type="button"
                aria-pressed={selectedGoal === g.id}
                className="lovable-choice-card"
                onClick={() => setSelectedGoal(g.id)}
              >
                <div className="lovable-choice-thumb" style={{ blockSize: '68px' }}>
                  <img src={assetUrl(g.imageFile)} alt="" loading="lazy" />
                </div>
                <strong style={{ fontSize: '0.82rem', lineHeight: 1.25 }}>{g.title}</strong>
                <span className="muted" style={{ fontSize: '0.73rem', lineHeight: 1.3 }}>{g.subtitle}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="stack-sm">
          <div style={{ fontSize: '0.86rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Compass size={16} weight="duotone" color="var(--pine)" aria-hidden="true" />
            2. ¿Qué quieres entrenar o mejorar más ahora?
          </div>
          <div className="lovable-choice-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(125px, 1fr))' }}>
            {TRAINING_FOCUS_CATALOG.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={selectedFocus === f.id}
                className="lovable-choice-card"
                onClick={() => setSelectedFocus(f.id)}
              >
                <div className="lovable-choice-thumb" style={{ blockSize: '68px' }}>
                  <img src={assetUrl(f.imageFile)} alt="" loading="lazy" />
                </div>
                <div className="row-between" style={{ gap: '0.25rem' }}>
                  <strong style={{ fontSize: '0.82rem', lineHeight: 1.2 }}>{f.shortLabel}</strong>
                  <span className="pill pill-emerald" style={{ fontSize: '0.66rem', padding: '0.08rem 0.42rem' }}>
                    {f.benefit}
                  </span>
                </div>
                <span className="muted" style={{ fontSize: '0.73rem', lineHeight: 1.3 }}>{f.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="row-between" style={{ paddingTop: '0.35rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="btn lovable-cta-btn" onClick={handleSave}>
            <CheckCircle size={17} weight="duotone" aria-hidden="true" />
            Guardar y adaptar mis rutinas
          </button>
        </div>
      </div>
    </dialog>
  );
}
