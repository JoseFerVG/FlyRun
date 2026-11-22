import { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type { UserProfile, WorkoutBlock, WorkoutSession } from '../types/fitness';
import {
  calculateTrainingZones,
  convertSpeedValue,
  formatPace,
  type CustomRoutineConfig,
} from '../services/scienceEngine';
import { WorkoutVisualBar } from './WorkoutVisualBar';

interface LiveWorkoutTimerDialogProps {
  workout: WorkoutSession | null;
  profile: UserProfile;
  initialBlockIndex?: number;
  onClose: () => void;
  onCustomizeRoutine?: (workoutId: string, config: CustomRoutineConfig) => void;
  onFinishToLog: (workout: WorkoutSession, elapsedMinutes: number, elapsedDistanceKm?: number) => void;
}

function playTone(freq: number, durationSec: number, gainPeak = 0.08, delaySec = 0) {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t0 = ctx.currentTime + delaySec;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(gainPeak, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + durationSec);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + durationSec);
  } catch {
    // Ignore restricted audio
  }
}

function playSoftCue(soundEnabled: boolean, type: 'change' | 'countdown' | 'tick' = 'change') {
  if (type === 'change' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([160, 70, 180]);
    } catch {
      // Ignore vibration restrictions
    }
  }
  if (!soundEnabled) return;
  if (type === 'countdown') {
    playTone(520, 0.12, 0.06);
  } else if (type === 'tick') {
    playTone(960, 0.04, 0.035);
  } else {
    playTone(660, 0.16, 0.09, 0);
    playTone(880, 0.24, 0.09, 0.16);
  }
}

function speakSpanishCoach(voiceEnabled: boolean, text: string) {
  if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-ES';
    u.rate = 1.05;
    window.speechSynthesis.speak(u);
  } catch {
    // Ignore speech synthesis failures
  }
}

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function getBlockPhaseMeta(block: WorkoutBlock): {
  actionCmd: string;
  ringColor: string;
  badgeClass: string;
  isWalkOrWarmup: boolean;
} {
  const txt = `${block.label} ${block.intensity}`.toLowerCase();
  if (txt.includes('calentamiento') || txt.includes('activación')) {
    return {
      actionCmd: 'CALENTAMIENTO',
      ringColor: 'var(--pine)',
      badgeClass: 'pill-emerald',
      isWalkOrWarmup: true,
    };
  }
  if (txt.includes('caminar') || txt.includes('caminata') || txt.includes('recupera') || txt.includes('paseo') || txt.includes('enfriamiento') || txt.includes('vuelta a la calma') || txt.includes('soltura')) {
    return {
      actionCmd: 'CAMINA Y RECUPERA',
      ringColor: 'var(--pine)',
      badgeClass: 'pill-emerald',
      isWalkOrWarmup: true,
    };
  }
  if (block.zone === 'Z4' || block.zone === 'Z5') {
    return {
      actionCmd: '¡SERIE FUERTE!',
      ringColor: 'var(--accent)',
      badgeClass: 'pill-amber',
      isWalkOrWarmup: false,
    };
  }
  if (block.zone === 'Z3') {
    return {
      actionCmd: '¡RITMO UMBRAL!',
      ringColor: 'var(--amber-zone)',
      badgeClass: 'pill-amber',
      isWalkOrWarmup: false,
    };
  }
  return {
    actionCmd: '¡CORRE AHORA!',
    ringColor: 'var(--cobalt)',
    badgeClass: 'pill-cyan',
    isWalkOrWarmup: false,
  };
}

export function LiveWorkoutTimerDialog({
  workout,
  profile,
  initialBlockIndex = 0,
  onClose,
  onCustomizeRoutine,
  onFinishToLog,
}: LiveWorkoutTimerDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);

  const [blockIndex, setBlockIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(300);
  const [totalElapsedSec, setTotalElapsedSec] = useState(0);
  const [accumulatedKm, setAccumulatedKm] = useState(0);
  const [running, setRunning] = useState(false);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [cadenceOn, setCadenceOn] = useState(false);
  const [microSeries30s, setMicroSeries30s] = useState(false);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [speedOffsetKmh, setSpeedOffsetKmh] = useState(0);

  // Builder state
  const [customType, setCustomType] = useState<CustomRoutineConfig['presetType']>('caco');
  const [customRounds, setCustomRounds] = useState(4);
  const [customWorkMin, setCustomWorkMin] = useState(3);
  const [customRestMin, setCustomRestMin] = useState(3);

  const zones = calculateTrainingZones(profile.vdot, profile.maxHR, profile.restHR);

  const defaultSpeedForBlock = (block?: WorkoutBlock): number => {
    if (!block) return 8.0;
    const phase = getBlockPhaseMeta(block);
    if (workout?.modality === 'cycling') return phase.isWalkOrWarmup ? 17.5 : 24.5;
    if (workout?.modality === 'walking' || phase.isWalkOrWarmup) {
      return block.label.toLowerCase().includes('recupera') ? 6.5 : 5.8;
    }
    const z = zones.find((item) => item.id === block.zone) ?? zones[0];
    const midSec = (z.paceMinSecPerKm + z.paceMaxSecPerKm) / 2;
    return Number((3600 / Math.max(150, midSec)).toFixed(1));
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (workout) {
      const safeStart = Math.max(0, Math.min(workout.blocks.length - 1, initialBlockIndex));
      setBlockIndex(safeStart);
      setSecondsLeft((workout.blocks[safeStart]?.durationMinutes ?? workout.durationMinutes) * 60);
      setTotalElapsedSec(0);
      setAccumulatedKm(0);
      setRunning(false);
      setSpeedOffsetKmh(0);
      setMicroSeries30s(workout.strategyTag.includes('30-30'));
      setCustomType(
        workout.sessionType === 'intervals_z4' ||
          workout.sessionType === 'threshold_z3' ||
          workout.sessionType === 'long_run' ||
          workout.sessionType === 'easy_z1'
          ? workout.sessionType
          : 'caco'
      );
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [workout?.id, initialBlockIndex]);

  // If blocks change due to customization while dialog is open, sync valid bounds cleanly
  useEffect(() => {
    if (!workout || workout.blocks.length === 0) return;
    if (blockIndex >= workout.blocks.length) {
      setBlockIndex(0);
      setSecondsLeft(workout.blocks[0].durationMinutes * 60);
    }
  }, [workout?.blocks.length]);

  useEffect(() => {
    let cancelled = false;
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> };
    };

    const manageWakeLock = async () => {
      if (running && nav.wakeLock) {
        try {
          const sentinel = await nav.wakeLock.request('screen');
          if (cancelled) {
            await sentinel.release();
          } else {
            wakeLockRef.current = sentinel;
            setWakeLockActive(true);
          }
        } catch {
          setWakeLockActive(false);
        }
      } else if (wakeLockRef.current) {
        try {
          await wakeLockRef.current.release();
        } catch {
          // Ignore
        }
        wakeLockRef.current = null;
        setWakeLockActive(false);
      }
    };

    void manageWakeLock();

    return () => {
      cancelled = true;
      if (wakeLockRef.current) {
        void wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [running]);

  // Optional 175 spm running cadence metronome while active
  useEffect(() => {
    if (!running || !cadenceOn) return;
    const intervalMs = Math.round(60000 / 175);
    const id = window.setInterval(() => {
      playSoftCue(soundEnabled, 'tick');
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [running, cadenceOn, soundEnabled]);

  useEffect(() => {
    if (!running || !workout) return;
    const activeBlock = workout.blocks[blockIndex] ?? workout.blocks[0];
    const activeKmh = Math.max(3, defaultSpeedForBlock(activeBlock) + speedOffsetKmh);

    const timer = window.setInterval(() => {
      setTotalElapsedSec((e) => e + 1);
      setAccumulatedKm((km) => km + activeKmh / 3600);

      setSecondsLeft((prev) => {
        const nextVal = prev - 1;
        if (nextVal === 15) {
          speakSpanishCoach(voiceEnabled, 'Quedan quince segundos');
        } else if (nextVal === 3 || nextVal === 2 || nextVal === 1) {
          playSoftCue(soundEnabled, 'countdown');
        }

        if (microSeries30s && nextVal > 1 && nextVal % 30 === 0) {
          const isFastHalf = Math.floor(nextVal / 30) % 2 === 1;
          playSoftCue(soundEnabled, 'change');
          speakSpanishCoach(voiceEnabled, isFastHalf ? 'Treinta segundos fuertes' : 'Treinta segundos suaves');
        }

        if (prev > 1) return nextVal;

        const nextIdx = blockIndex + 1;
        if (nextIdx < workout.blocks.length) {
          const nextBlk = workout.blocks[nextIdx];
          const phase = getBlockPhaseMeta(nextBlk);
          playSoftCue(soundEnabled, 'change');
          speakSpanishCoach(
            voiceEnabled,
            `${phase.actionCmd}. ${nextBlk.label}, ${nextBlk.durationMinutes} minutos.`
          );
          setBlockIndex(nextIdx);
          setSpeedOffsetKmh(0);
          return nextBlk.durationMinutes * 60;
        }

        playSoftCue(soundEnabled, 'change');
        speakSpanishCoach(voiceEnabled, 'Sesión completada. Buen trabajo.');
        setRunning(false);
        return 0;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [running, workout, blockIndex, soundEnabled, voiceEnabled, speedOffsetKmh, microSeries30s]);

  const handleClose = () => {
    setRunning(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (wakeLockRef.current) {
      void wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
      setWakeLockActive(false);
    }
    if (dialogRef.current?.open) dialogRef.current.close();
    onClose();
  };

  if (!workout) {
    return <dialog ref={dialogRef} />;
  }

  const blocks = workout.blocks.length > 0 ? workout.blocks : [
    {
      label: workout.title,
      durationMinutes: workout.durationMinutes,
      intensity: workout.targetPace,
      description: workout.subtitle,
      zone: workout.targetZone,
    },
  ];
  const currentBlock = blocks[blockIndex] ?? blocks[0];
  const nextBlock = blockIndex + 1 < blocks.length ? blocks[blockIndex + 1] : null;
  const phase = getBlockPhaseMeta(currentBlock);
  const blockTotalSec = Math.max(60, currentBlock.durationMinutes * 60);
  const blockProgressPct = Math.min(100, Math.round(((blockTotalSec - secondsLeft) / blockTotalSec) * 100));

  const currentKmh = Math.max(3, Number((defaultSpeedForBlock(currentBlock) + speedOffsetKmh).toFixed(1)));
  const speedConv = convertSpeedValue(currentKmh, 'kmh');
  const liveKcal = Math.round((totalElapsedSec / Math.max(60, workout.durationMinutes * 60)) * workout.estimatedCalories);

  const jumpToBlock = (idx: number) => {
    if (idx < 0 || idx >= blocks.length) return;
    const targetBlk = blocks[idx];
    setBlockIndex(idx);
    setSecondsLeft(targetBlk.durationMinutes * 60);
    setSpeedOffsetKmh(0);
    if (running) {
      const targetPhase = getBlockPhaseMeta(targetBlk);
      playSoftCue(soundEnabled, 'change');
      speakSpanishCoach(
        voiceEnabled,
        `${targetPhase.actionCmd}. ${targetBlk.label}, ${targetBlk.durationMinutes} minutos.`
      );
    }
  };

  const handleToggleStart = () => {
    const nextRun = !running;
    setRunning(nextRun);
    if (nextRun && totalElapsedSec === 0) {
      speakSpanishCoach(
        voiceEnabled,
        `Empezamos. ${phase.actionCmd}. ${currentBlock.label}, ${currentBlock.durationMinutes} minutos.`
      );
    }
  };

  const handleApplyInlineCustom = () => {
    if (!onCustomizeRoutine) return;
    onCustomizeRoutine(workout.id, {
      presetType: customType,
      rounds: customRounds,
      workMin: customWorkMin,
      restMin: customRestMin,
      warmupMin: 5,
      cooldownMin: 5,
    });
    setBlockIndex(0);
    setSecondsLeft(5 * 60);
    setShowBuilder(false);
  };

  const ringSize = 176;
  const ringStroke = 9;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCirc = 2 * Math.PI * ringRadius;
  const ringOffset = ringCirc - (blockProgressPct / 100) * ringCirc;

  const microIsFast = microSeries30s && Math.floor(secondsLeft / 30) % 2 === 1;

  return (
    <dialog
      ref={dialogRef}
      style={{ inlineSize: 'min(95dvw, 720px)' }}
      aria-labelledby="live-timer-title"
      onCancel={(e) => {
        e.preventDefault();
        handleClose();
      }}
    >
      <div className="stack-md" style={{ padding: '1.35rem' }}>
        <div className="row-between">
          <div>
            <div className="row-wrap">
              <span className={`pill ${phase.badgeClass}`}>
                {phase.actionCmd} · Bloque {blockIndex + 1}/{blocks.length}
              </span>
              {wakeLockActive && (
                <span className="pill pill-emerald mono">Pantalla activa</span>
              )}
              {microSeries30s && (
                <span className={`pill mono ${microIsFast ? 'pill-amber' : 'pill-cyan'}`}>
                  Micro 30s: {microIsFast ? 'FUERTE' : 'SUAVE'} ({secondsLeft % 30 || 30}s)
                </span>
              )}
            </div>
            <h2 id="live-timer-title" style={{ margin: '0.35rem 0 0', fontSize: '1.15rem' }}>
              {workout.title}
            </h2>
          </div>

          <div className="row-wrap" style={{ gap: '0.35rem' }}>
            <button
              type="button"
              className={`btn btn-sm ${voiceEnabled ? 'btn-secondary' : 'btn-ghost'}`}
              onClick={() => setVoiceEnabled((v) => !v)}
              title="Coach por voz en español"
            >
              {voiceEnabled ? 'Voz ON' : 'Voz OFF'}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setSoundEnabled((s) => !s)}
              aria-label={soundEnabled ? 'Silenciar pitidos' : 'Activar pitidos'}
              title={soundEnabled ? 'Pitidos activados' : 'Pitidos silenciados'}
            >
              {soundEnabled ? <Volume2 size={16} aria-hidden="true" /> : <VolumeX size={16} aria-hidden="true" />}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleClose} aria-label="Cerrar cronómetro">
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Barra visual interactiva de bloques */}
        <WorkoutVisualBar
          blocks={blocks}
          activeBlockIndex={blockIndex}
          onSelectBlock={jumpToBlock}
        />

        {/* Reloj central + telemetría */}
        <div
          className="inset-panel"
          style={{
            display: 'grid',
            gap: '1.1rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            alignItems: 'center',
            padding: '1.1rem',
          }}
        >
          <div className="stack-sm" style={{ alignItems: 'center', textAlign: 'center' }}>
            <div className="row-wrap" style={{ justifyContent: 'center', gap: '0.45rem' }}>
              <span className="pill pill-cyan">{currentBlock.zone}</span>
              <strong style={{ fontSize: '0.96rem' }}>{currentBlock.label}</strong>
            </div>

            <div className="biometric-ring-wrap" style={{ inlineSize: ringSize, blockSize: ringSize }}>
              <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`} aria-hidden="true">
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={ringRadius}
                  fill="none"
                  stroke="var(--border-hairline)"
                  strokeWidth={ringStroke}
                />
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={ringRadius}
                  fill="none"
                  stroke={phase.ringColor}
                  strokeWidth={ringStroke}
                  strokeLinecap="round"
                  strokeDasharray={ringCirc}
                  strokeDashoffset={ringOffset}
                  transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
                  style={{ transition: 'stroke-dashoffset 0.35s linear' }}
                />
              </svg>
              <div className="biometric-ring-center">
                <div className="timer-clock" style={{ fontSize: '2.25rem' }}>
                  {formatClock(secondsLeft)}
                </div>
              </div>
            </div>

            <div className="muted" style={{ fontSize: '0.78rem' }}>
              {currentBlock.description}
            </div>
            {nextBlock ? (
              <div className="pill pill-cyan" style={{ fontSize: '0.72rem' }}>
                Siguiente: {nextBlock.label} ({nextBlock.durationMinutes} min)
              </div>
            ) : (
              <div className="pill pill-emerald" style={{ fontSize: '0.72rem' }}>
                Último bloque de la sesión
              </div>
            )}
          </div>

          <div className="stack-sm">
            <div className="inset-panel" style={{ background: 'var(--bg-surface)', padding: '0.65rem 0.85rem' }}>
              <div className="row-between">
                <span className="muted" style={{ fontSize: '0.72rem', fontWeight: 600 }}>VELOCIDAD ACTIVA</span>
                <div className="row-wrap" style={{ gap: '0.28rem' }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ minBlockSize: '26px', padding: '0.15rem 0.45rem' }}
                    aria-label="Bajar velocidad 0,5 km/h"
                    onClick={() => setSpeedOffsetKmh((o) => Number((o - 0.5).toFixed(1)))}
                  >
                    <Minus size={12} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ minBlockSize: '26px', padding: '0.15rem 0.45rem' }}
                    aria-label="Subir velocidad 0,5 km/h"
                    onClick={() => setSpeedOffsetKmh((o) => Number((o + 0.5).toFixed(1)))}
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
              <div className="mono" style={{ fontSize: '1.12rem', fontWeight: 700, color: 'var(--cobalt)' }}>
                {speedConv.kmh.toFixed(1).replace('.', ',')} km/h · {speedConv.kmPerMin.toFixed(3).replace('.', ',')} km/min
              </div>
              <div className="muted mono" style={{ fontSize: '0.75rem' }}>
                Ritmo: {formatPace(speedConv.secPerKm)} /km
              </div>
            </div>

            <div className="grid-2" style={{ gap: '0.55rem' }}>
              <div className="inset-panel" style={{ background: 'var(--bg-surface)', padding: '0.55rem 0.75rem' }}>
                <div className="muted" style={{ fontSize: '0.7rem' }}>Distancia</div>
                <div className="mono" style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--pine)' }}>
                  {accumulatedKm.toFixed(2).replace('.', ',')} km
                </div>
              </div>
              <div className="inset-panel" style={{ background: 'var(--bg-surface)', padding: '0.55rem 0.75rem' }}>
                <div className="muted" style={{ fontSize: '0.7rem' }}>Tiempo · kcal</div>
                <div className="mono" style={{ fontWeight: 700, fontSize: '1.02rem' }}>
                  {formatClock(totalElapsedSec)} · {liveKcal}
                </div>
              </div>
            </div>

            <div className="row-wrap" style={{ gap: '0.4rem' }}>
              <button
                type="button"
                className={`btn btn-sm ${microSeries30s ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setMicroSeries30s((v) => !v)}
              >
                Micro-series 30s/30s
              </button>
              <button
                type="button"
                className={`btn btn-sm ${cadenceOn ? 'btn-emerald' : 'btn-secondary'}`}
                onClick={() => setCadenceOn((v) => !v)}
              >
                Cadencia 175 ppm
              </button>
              {onCustomizeRoutine && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowBuilder((v) => !v)}
                >
                  <SlidersHorizontal size={14} aria-hidden="true" />
                  Editar rutina
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Editor rápido de intervalos dentro del crono */}
        {showBuilder && onCustomizeRoutine && (
          <div className="inset-panel stack-sm" style={{ border: '1px solid var(--cobalt-border)', background: 'var(--cobalt-soft)' }}>
            <strong style={{ fontSize: '0.84rem' }}>Personalizar bloques de esta rutina en directo</strong>
            <div className="grid-4" style={{ gap: '0.5rem' }}>
              <div className="field">
                <label htmlFor="timer-custom-type">Estructura</label>
                <select
                  id="timer-custom-type"
                  className="select"
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value as CustomRoutineConfig['presetType'])}
                >
                  <option value="caco">CaCo (Correr / Andar)</option>
                  <option value="intervals_z4">Series VO2max (Z4)</option>
                  <option value="threshold_z3">Bloques Umbral (Z3)</option>
                  <option value="easy_z1">Rodaje Suave Z1</option>
                  <option value="long_run">Tirada Larga Z1-Z2</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="timer-custom-rounds">Series (1-4)</label>
                <input
                  id="timer-custom-rounds"
                  type="number"
                  min={1}
                  max={4}
                  className="input mono"
                  value={customRounds}
                  onChange={(e) => setCustomRounds(Number(e.target.value))}
                />
              </div>
              <div className="field">
                <label htmlFor="timer-custom-work">Trabajo (min)</label>
                <input
                  id="timer-custom-work"
                  type="number"
                  min={1}
                  max={20}
                  className="input mono"
                  value={customWorkMin}
                  onChange={(e) => setCustomWorkMin(Number(e.target.value))}
                />
              </div>
              <div className="field">
                <label htmlFor="timer-custom-rest">Recup. (min)</label>
                <input
                  id="timer-custom-rest"
                  type="number"
                  min={1}
                  max={10}
                  className="input mono"
                  value={customRestMin}
                  onChange={(e) => setCustomRestMin(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="row-wrap">
              <button type="button" className="btn btn-primary btn-sm" onClick={handleApplyInlineCustom}>
                Aplicar bloques al cronómetro
              </button>
            </div>
          </div>
        )}

        {/* Botonera principal de transporte */}
        <div className="row-between">
          <div className="row-wrap" style={{ gap: '0.4rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={blockIndex === 0}
              aria-label="Bloque anterior"
              onClick={() => jumpToBlock(blockIndex - 1)}
            >
              <SkipBack size={14} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleToggleStart}
              autoFocus
            >
              {running ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
              {running ? 'Pausar' : 'Iniciar'}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setSecondsLeft((s) => Math.max(5, s - 15))}
            >
              -15 s
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setSecondsLeft((s) => s + 30)}
            >
              +30 s
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              aria-label="Reiniciar bloque actual"
              title="Reiniciar bloque actual"
              onClick={() => setSecondsLeft(currentBlock.durationMinutes * 60)}
            >
              <RotateCcw size={14} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={blockIndex >= blocks.length - 1}
              aria-label="Siguiente bloque"
              onClick={() => jumpToBlock(blockIndex + 1)}
            >
              <SkipForward size={14} aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            className="btn btn-emerald"
            onClick={() => {
              const mins = totalElapsedSec >= 60 ? Math.round(totalElapsedSec / 60) : workout.durationMinutes;
              const dist = accumulatedKm > 0.05 ? Number(accumulatedKm.toFixed(2)) : undefined;
              handleClose();
              onFinishToLog(workout, Math.max(1, mins), dist);
            }}
          >
            <CheckCircle2 size={16} aria-hidden="true" />
            Finalizar y guardar
          </button>
        </div>

        {/* Playlist interactiva de todos los bloques */}
        <details className="faq-details" style={{ padding: '0.55rem 0.8rem' }}>
          <summary style={{ fontSize: '0.82rem' }}>
            Guion completo de la rutina ({blocks.length} bloques · pulsa cualquiera para saltar)
          </summary>
          <div className="stack-sm" style={{ marginTop: '0.55rem', maxBlockSize: '200px', overflowY: 'auto' }}>
            {blocks.map((blk, idx) => {
              const isCurr = idx === blockIndex;
              const isPast = idx < blockIndex;
              return (
                <button
                  key={`${blk.label}-${idx}`}
                  type="button"
                  onClick={() => jumpToBlock(idx)}
                  className="inset-panel row-between"
                  style={{
                    textAlign: 'left',
                    cursor: 'pointer',
                    padding: '0.45rem 0.68rem',
                    borderColor: isCurr ? 'var(--accent)' : 'var(--border-hairline)',
                    background: isCurr ? 'var(--accent-soft)' : 'var(--bg-surface)',
                    opacity: isPast ? 0.55 : 1,
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.82rem' }}>
                      {idx + 1}. {blk.label}
                    </strong>
                    <div className="muted mono" style={{ fontSize: '0.71rem' }}>
                      {blk.intensity}
                    </div>
                  </div>
                  <span className={`pill mono ${isCurr ? 'pill-amber' : ''}`}>
                    {blk.durationMinutes} min
                  </span>
                </button>
              );
            })}
          </div>
        </details>
      </div>
    </dialog>
  );
}