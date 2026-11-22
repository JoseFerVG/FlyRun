import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Pause, Play, Plus, SkipForward, Volume2, VolumeX, X } from 'lucide-react';
import type { WorkoutSession } from '../types/fitness';

interface LiveWorkoutTimerDialogProps {
  workout: WorkoutSession | null;
  onClose: () => void;
  onFinishToLog: (workout: WorkoutSession, elapsedMinutes: number) => void;
}

function playSoftCue(soundEnabled: boolean) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([160, 70, 160]);
    } catch {
      // Ignorar si el navegador restringe vibración
    }
  }
  if (!soundEnabled) return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Ignorar si el navegador restringe Web Audio
  }
}

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function LiveWorkoutTimerDialog({
  workout,
  onClose,
  onFinishToLog,
}: LiveWorkoutTimerDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);
  const [blockIndex, setBlockIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(300);
  const [totalElapsedSec, setTotalElapsedSec] = useState(0);
  const [running, setRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [wakeLockActive, setWakeLockActive] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (workout) {
      setBlockIndex(0);
      setSecondsLeft((workout.blocks[0]?.durationMinutes ?? workout.durationMinutes) * 60);
      setTotalElapsedSec(0);
      setRunning(false);
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [workout]);

  // Screen Wake Lock while running so phone screen stays awake during street workout
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
          // Ignore release errors
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

  useEffect(() => {
    if (!running || !workout) return;
    const timer = window.setInterval(() => {
      setTotalElapsedSec((e) => e + 1);
      setSecondsLeft((prev) => {
        if (prev > 1) return prev - 1;
        const nextIdx = blockIndex + 1;
        if (nextIdx < workout.blocks.length) {
          playSoftCue(soundEnabled);
          setBlockIndex(nextIdx);
          return workout.blocks[nextIdx].durationMinutes * 60;
        }
        playSoftCue(soundEnabled);
        setRunning(false);
        return 0;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [running, workout, blockIndex, soundEnabled]);

  const handleClose = () => {
    setRunning(false);
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

  const currentBlock = workout.blocks[blockIndex] ?? workout.blocks[0];
  const blockTotalSec = Math.max(60, (currentBlock?.durationMinutes ?? 5) * 60);
  const blockProgressPct = Math.min(100, Math.round(((blockTotalSec - secondsLeft) / blockTotalSec) * 100));

  const ringSize = 184;
  const ringStroke = 9;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCirc = 2 * Math.PI * ringRadius;
  const ringOffset = ringCirc - (blockProgressPct / 100) * ringCirc;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="live-timer-title"
      onCancel={(e) => {
        e.preventDefault();
        handleClose();
      }}
    >
      <div className="stack-md" style={{ padding: '1.4rem' }}>
        <div className="row-between">
          <div>
            <div className="row-wrap">
              <span className="pill pill-amber">
                Bloque {blockIndex + 1} de {workout.blocks.length}
              </span>
              {wakeLockActive && (
                <span className="pill pill-emerald mono">Pantalla activa · Wake Lock</span>
              )}
            </div>
            <h2 id="live-timer-title" style={{ margin: '0.35rem 0 0', fontSize: '1.15rem' }}>
              {workout.title}
            </h2>
          </div>

          <div className="row-wrap">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setSoundEnabled((s) => !s)}
              aria-label={soundEnabled ? 'Silenciar aviso acústico' : 'Activar aviso acústico'}
            >
              {soundEnabled ? <Volume2 size={16} aria-hidden="true" /> : <VolumeX size={16} aria-hidden="true" />}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleClose} aria-label="Cerrar cronómetro">
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="inset-panel stack-md" style={{ alignItems: 'center', textAlign: 'center', padding: '1.35rem 1rem' }}>
          <div className="row-between" style={{ justifyContent: 'center', gap: '0.5rem' }}>
            <span className="pill pill-cyan">{currentBlock.zone}</span>
            <strong style={{ fontSize: '1rem' }}>{currentBlock.label}</strong>
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
                stroke="var(--accent)"
                strokeWidth={ringStroke}
                strokeLinecap="round"
                strokeDasharray={ringCirc}
                strokeDashoffset={ringOffset}
                transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
                style={{ transition: 'stroke-dashoffset 0.35s linear' }}
              />
            </svg>
            <div className="biometric-ring-center">
              <div className="timer-clock" style={{ fontSize: '2.35rem' }}>
                {formatClock(secondsLeft)}
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.86rem', color: 'var(--accent)', fontWeight: 600 }}>
            {currentBlock.intensity}
          </div>
          <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>
            {currentBlock.description}
          </p>
        </div>

        <div className="row-between">
          <div className="row-wrap">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setRunning((r) => !r)}
              autoFocus
            >
              {running ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
              {running ? 'Pausar' : 'Iniciar'}
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setSecondsLeft((s) => s + 30)}
            >
              <Plus size={14} aria-hidden="true" />
              30 s
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={blockIndex >= workout.blocks.length - 1}
              onClick={() => {
                const next = blockIndex + 1;
                if (next < workout.blocks.length) {
                  playSoftCue(soundEnabled);
                  setBlockIndex(next);
                  setSecondsLeft(workout.blocks[next].durationMinutes * 60);
                }
              }}
            >
              <SkipForward size={14} aria-hidden="true" />
              Siguiente bloque
            </button>
          </div>

          <button
            type="button"
            className="btn btn-emerald"
            onClick={() => {
              const mins = Math.max(5, Math.round(totalElapsedSec / 60) || workout.durationMinutes);
              handleClose();
              onFinishToLog(workout, mins);
            }}
          >
            <CheckCircle2 size={16} aria-hidden="true" />
            Finalizar y guardar
          </button>
        </div>

        <div className="muted mono" style={{ fontSize: '0.76rem', textAlign: 'right' }}>
          Tiempo acumulado: {formatClock(totalElapsedSec)}
        </div>
      </div>
    </dialog>
  );
}
