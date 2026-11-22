import { useEffect, useRef, useState } from 'react';
import {
  ArrowsClockwise,
  CheckCircle,
  CloudArrowUp,
  DownloadSimple,
  FileCode,
  Heartbeat,
  Lightning,
  Sparkle,
  UploadSimple,
  Watch,
  X,
} from '@phosphor-icons/react';
import type { GoogleFitDay, UserProfile, WorkoutSession } from '../types/fitness';
import {
  buildConnectorPresetActivity,
  buildWorkoutTCX,
  downloadTextFile,
  evaluateSyncedActivityImpact,
  fetchGoogleFitRecentSessions,
  fetchStravaActivitiesWithToken,
  parseActivityFileToSyncedSession,
  type SyncedExternalActivity,
} from '../services/deviceHub';
import { parseGoogleFitImportFile } from '../services/googleFit';
import { convertSpeedValue, formatPace } from '../services/scienceEngine';
import { WorkoutTelemetrySplits } from './WorkoutTelemetrySplits';

interface DeviceConnectionsModalProps {
  open: boolean;
  profile: UserProfile;
  workouts: WorkoutSession[];
  fitDays: GoogleFitDay[];
  hasGoogleFitOAuth: boolean;
  googleFitToken?: string | null;
  fitSyncLoading: boolean;
  onClose: () => void;
  onSyncGoogleFitSteps: () => void;
  onUploadFitDays: (days: GoogleFitDay[], sourceLabel?: string) => void;
  onApplySyncedActivity: (activity: SyncedExternalActivity, applyVdotUpgrade: boolean) => void;
  onNotify: (msg: string) => void;
}

type HubTab = 'connectors' | 'import_export' | 'watch_export';

export function DeviceConnectionsModal({
  open,
  profile,
  workouts,
  hasGoogleFitOAuth,
  googleFitToken,
  fitSyncLoading,
  onClose,
  onSyncGoogleFitSteps,
  onUploadFitDays,
  onApplySyncedActivity,
  onNotify,
}: DeviceConnectionsModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [activeTab, setActiveTab] = useState<HubTab>('connectors');
  const [stravaToken, setStravaToken] = useState<string>(() => localStorage.getItem('flyrun_strava_token_v1') ?? '');
  const [stravaBusy, setStravaBusy] = useState(false);
  const [gfitSessionsBusy, setGfitSessionsBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [loadedActivities, setLoadedActivities] = useState<SyncedExternalActivity[]>([]);
  const [selectedActivityIdx, setSelectedActivityIdx] = useState(0);
  const [applyAdaptiveVdot, setApplyAdaptiveVdot] = useState(true);

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

  const currentActivity = loadedActivities[selectedActivityIdx] ?? null;
  const evaluation = currentActivity
    ? evaluateSyncedActivityImpact(currentActivity, profile, workouts)
    : null;

  const handleLoadGoogleFitSessions = async () => {
    setErrorMsg(null);
    setGfitSessionsBusy(true);
    try {
      const res = await fetchGoogleFitRecentSessions(googleFitToken, profile);
      setLoadedActivities(res.activities);
      setSelectedActivityIdx(0);
      setActiveTab('import_export');
      onNotify(
        res.usedRealApi
          ? `Google Fit Sesiones API: ${res.activities.length} sesiones cargadas.`
          : 'Google Fit Sesiones listo: previsualización cargada para emparejar con tu plan.'
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error consultando sesiones de Google Fit.');
    } finally {
      setGfitSessionsBusy(false);
    }
  };

  const handleConnectStravaToken = async () => {
    setErrorMsg(null);
    setStravaBusy(true);
    try {
      localStorage.setItem('flyrun_strava_token_v1', stravaToken.trim());
      const acts = await fetchStravaActivitiesWithToken(stravaToken);
      setLoadedActivities(acts);
      setSelectedActivityIdx(0);
      setActiveTab('import_export');
      onNotify(`Strava conectado: ${acts.length} actividades reales importadas.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo conectar con Strava API.');
    } finally {
      setStravaBusy(false);
    }
  };

  const handleLoadConnectorSample = (source: 'google_fit' | 'strava' | 'garmin') => {
    setErrorMsg(null);
    const sample = buildConnectorPresetActivity(source, profile);
    setLoadedActivities([sample]);
    setSelectedActivityIdx(0);
    setActiveTab('import_export');
  };

  const handleUniversalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    try {
      const text = await file.text();
      // Detectar primero si es CSV/JSON de pasos diarios de Google Takeout
      const lower = file.name.toLowerCase();
      if ((lower.endsWith('.csv') || lower.endsWith('.json')) && (text.includes('step') || text.includes('pasos'))) {
        try {
          const days = parseGoogleFitImportFile(text);
          onUploadFitDays(days, `Pasos Google Fit ("${file.name}")`);
          return;
        } catch {
          // Intentar como sesión de entrenamiento abajo
        }
      }
      const parsed = parseActivityFileToSyncedSession(file.name, text);
      setLoadedActivities([parsed]);
      setSelectedActivityIdx(0);
      setActiveTab('import_export');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo procesar el archivo subido.');
    } finally {
      e.target.value = '';
    }
  };

  const handleConfirmApply = () => {
    if (!currentActivity || !evaluation) return;
    const shouldUpgrade = Boolean(applyAdaptiveVdot && evaluation.suggestedVdot && evaluation.vdotDelta > 0);
    onApplySyncedActivity(currentActivity, shouldUpgrade);
    setLoadedActivities([]);
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      style={{ inlineSize: 'min(96dvw, 840px)' }}
      aria-labelledby="device-hub-title"
    >
      <div className="stack-md" style={{ padding: 'clamp(1rem, 2.5vw, 1.5rem)' }}>
        <div className="row-between">
          <div>
            <span className="pill lovable-badge">
              <Watch size={14} weight="duotone" aria-hidden="true" />
              Ecosistema de Conexiones y Dispositivos
            </span>
            <h2 id="device-hub-title" style={{ margin: '0.35rem 0 0', fontSize: '1.2rem' }}>
              Google Fit Avanzado · Strava · Garmin · GPX/TCX
            </h2>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Cerrar hub de dispositivos">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="segmented-group" role="tablist" aria-label="Secciones del Hub de Dispositivos">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'connectors'}
            aria-pressed={activeTab === 'connectors'}
            className="segmented-btn is-accent"
            onClick={() => setActiveTab('connectors')}
          >
            Plataformas conectadas
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'import_export'}
            aria-pressed={activeTab === 'import_export'}
            className="segmented-btn is-accent"
            onClick={() => setActiveTab('import_export')}
          >
            Importar GPX / TCX y Emparejar
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'watch_export'}
            aria-pressed={activeTab === 'watch_export'}
            className="segmented-btn is-accent"
            onClick={() => setActiveTab('watch_export')}
          >
            Exportar rutinas a tu reloj (.TCX)
          </button>
        </div>

        {errorMsg && (
          <div className="error-banner" role="alert" style={{ fontSize: '0.82rem' }}>
            {errorMsg}
          </div>
        )}

        {/* TAB 1: CONECTORES MULTI-PLATAFORMA */}
        {activeTab === 'connectors' && (
          <div className="grid-2">
            {/* Google Fit Avanzado */}
            <div className="inset-panel stack-sm" style={{ borderColor: 'var(--pine-border)', background: 'var(--bg-surface)' }}>
              <div className="row-between">
                <strong style={{ fontSize: '0.96rem' }}>Google Fit Avanzado</strong>
                <span className={`pill ${hasGoogleFitOAuth ? 'pill-emerald' : 'pill-cyan'}`} style={{ fontSize: '0.7rem' }}>
                  {hasGoogleFitOAuth ? 'OAuth activo' : 'Listo para conectar'}
                </span>
              </div>
              <p className="muted" style={{ margin: 0, fontSize: '0.8rem' }}>
                Sincroniza pasos de 7 días (<code>step_count.delta</code>) y recupera sesiones deportivas reales (<code>users/me/sessions</code>) con ritmo y pulso estimado.
              </p>
              <div className="row-wrap" style={{ gap: '0.45rem' }}>
                <button
                  type="button"
                  className="btn btn-emerald btn-sm"
                  disabled={fitSyncLoading}
                  onClick={onSyncGoogleFitSteps}
                >
                  <ArrowsClockwise size={14} weight="duotone" aria-hidden="true" />
                  {fitSyncLoading ? 'Sincronizando…' : 'Sincronizar pasos (7 días)'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={gfitSessionsBusy}
                  onClick={() => void handleLoadGoogleFitSessions()}
                >
                  <Heartbeat size={14} weight="duotone" aria-hidden="true" />
                  {gfitSessionsBusy ? 'Leyendo…' : 'Leer sesiones Fit'}
                </button>
              </div>
            </div>

            {/* Strava OAuth / Token Directo */}
            <div className="inset-panel stack-sm" style={{ borderColor: 'var(--accent-border)', background: 'var(--bg-surface)' }}>
              <div className="row-between">
                <strong style={{ fontSize: '0.96rem' }}>Strava API v3</strong>
                <span className="pill pill-amber" style={{ fontSize: '0.7rem' }}>
                  Bearer Token / Import
                </span>
              </div>
              <p className="muted" style={{ margin: 0, fontSize: '0.8rem' }}>
                Pega tu Access Token OAuth de Strava (<code>activity:read_all</code>) o prueba el emparejamiento con una actividad real de Strava.
              </p>
              <div className="row-wrap" style={{ gap: '0.4rem' }}>
                <input
                  id="strava-token-input"
                  type="password"
                  className="input mono"
                  style={{ flex: '1 1 160px', padding: '0.35rem 0.6rem', fontSize: '0.78rem' }}
                  placeholder="Access Token Strava (opcional)"
                  value={stravaToken}
                  onChange={(e) => setStravaToken(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={stravaBusy}
                  onClick={() => void handleConnectStravaToken()}
                >
                  {stravaBusy ? 'Cargando…' : 'Conectar Strava'}
                </button>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ alignSelf: 'flex-start' }}
                onClick={() => handleLoadConnectorSample('strava')}
              >
                <Sparkle size={14} weight="duotone" aria-hidden="true" />
                Probar con carrera Strava 6K (parciales + VDOT)
              </button>
            </div>

            {/* Garmin / Polar / Coros / Apple Watch */}
            <div className="inset-panel stack-sm" style={{ background: 'var(--bg-surface)' }}>
              <div className="row-between">
                <strong style={{ fontSize: '0.96rem' }}>Garmin · Polar · Coros · Apple Watch</strong>
                <span className="pill pill-cyan" style={{ fontSize: '0.7rem' }}>.TCX / .GPX</span>
              </div>
              <p className="muted" style={{ margin: 0, fontSize: '0.8rem' }}>
                Importa tus archivos de reloj GPS con parciales exactos y FC por kilómetro, o descarga cualquier rutina de FlyRun en <code>.TCX</code> para tu reloj.
              </p>
              <div className="row-wrap" style={{ gap: '0.45rem' }}>
                <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                  <UploadSimple size={14} weight="duotone" aria-hidden="true" />
                  Subir .GPX / .TCX / .JSON / .CSV
                  <input
                    type="file"
                    accept=".gpx,.tcx,.json,.csv,application/xml,text/csv,application/json"
                    onChange={(e) => void handleUniversalFileUpload(e)}
                    className="sr-only"
                  />
                </label>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleLoadConnectorSample('garmin')}
                >
                  Simular lectura Garmin 5K
                </button>
              </div>
            </div>

            {/* GPS en vivo integrado en Cronómetro */}
            <div className="inset-panel stack-sm" style={{ background: 'var(--bg-surface)' }}>
              <div className="row-between">
                <strong style={{ fontSize: '0.96rem' }}>GPS en Vivo desde el Navegador</strong>
                <span className="pill pill-emerald" style={{ fontSize: '0.7rem' }}>Sin reloj externo</span>
              </div>
              <p className="muted" style={{ margin: 0, fontSize: '0.8rem' }}>
                Activa el botón <strong>GPS en vivo</strong> dentro del Cronómetro Guiado de cualquier rutina para medir distancia exterior real con Haversine y guardar tus parciales km a km.
              </p>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ alignSelf: 'flex-start' }}
                onClick={() => setActiveTab('watch_export')}
              >
                <DownloadSimple size={14} weight="duotone" aria-hidden="true" />
                Ver rutinas listas para exportar (.TCX)
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: IMPORTADOR + EMPAREJAMIENTO INTELIGENTE + VDOT ADAPTATIVO */}
        {activeTab === 'import_export' && (
          <div className="stack-md">
            <div className="inset-panel row-between" style={{ background: 'var(--bg-surface)' }}>
              <div>
                <strong style={{ fontSize: '0.9rem' }}>Subir archivo de entreno o pasos</strong>
                <div className="muted" style={{ fontSize: '0.78rem' }}>
                  Admite rutas <code>.GPX</code>, archivos Garmin/Polar <code>.TCX</code>, JSON Strava o CSV de Google Fit.
                </div>
              </div>
              <div className="row-wrap" style={{ gap: '0.45rem' }}>
                <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                  <CloudArrowUp size={15} weight="duotone" aria-hidden="true" />
                  Seleccionar archivo
                  <input
                    type="file"
                    accept=".gpx,.tcx,.json,.csv"
                    onChange={(e) => void handleUniversalFileUpload(e)}
                    className="sr-only"
                  />
                </label>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleLoadConnectorSample('garmin')}
                >
                  Ejemplo Garmin .TCX
                </button>
              </div>
            </div>

            {loadedActivities.length > 1 && (
              <div className="row-wrap" style={{ gap: '0.35rem' }}>
                {loadedActivities.map((act, idx) => (
                  <button
                    key={act.externalId}
                    type="button"
                    className={`btn btn-sm ${idx === selectedActivityIdx ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSelectedActivityIdx(idx)}
                  >
                    {act.date} · {act.title.slice(0, 26)}
                  </button>
                ))}
              </div>
            )}

            {currentActivity && evaluation ? (
              <div className="stack-md">
                {/* Resumen + Emparejamiento Inteligente */}
                <div
                  className="inset-panel stack-sm"
                  style={{ borderColor: 'var(--pine-border)', background: 'var(--pine-soft)' }}
                >
                  <div className="row-between">
                    <div>
                      <span className="pill pill-emerald" style={{ fontSize: '0.7rem' }}>
                        Emparejamiento Inteligente
                      </span>
                      <h3 style={{ margin: '0.28rem 0 0', fontSize: '1.04rem' }}>
                        {currentActivity.title} ({currentActivity.date})
                      </h3>
                    </div>
                    <div className="mono" style={{ textAlign: 'right', fontSize: '0.84rem', fontWeight: 700 }}>
                      {currentActivity.distanceKm} km · {currentActivity.durationMinutes} min
                      <div className="muted" style={{ fontSize: '0.73rem', fontWeight: 500 }}>
                        {evaluation.avgSpeedKmh.toFixed(1).replace('.', ',')} km/h ·{' '}
                        {evaluation.avgSpeedKmMin.toFixed(3).replace('.', ',')} km/min ·{' '}
                        {formatPace(evaluation.avgPaceSecPerKm)} /km
                      </div>
                    </div>
                  </div>

                  <div className="row-wrap" style={{ gap: '0.45rem', fontSize: '0.82rem' }}>
                    <strong>Acción en tu calendario:</strong>
                    {evaluation.pairedWorkout ? (
                      <span>
                        Se completará automáticamente tu rutina{' '}
                        <strong>&ldquo;{evaluation.pairedWorkout.title}&rdquo;</strong> ({evaluation.pairedWorkout.date}).
                      </span>
                    ) : (
                      <span>Se añadirá como sesión completada adicional del día {currentActivity.date}.</span>
                    )}
                  </div>

                  <div className="row-wrap" style={{ gap: '0.45rem' }}>
                    <span className="pill mono">+{evaluation.cardioPoints} Puntos Cardio</span>
                    <span className="pill mono">{evaluation.trimp} TRIMP</span>
                    <span className="pill mono">{evaluation.calories} kcal</span>
                    <span className="pill mono">RPE est. {evaluation.rpeEstimated}/10</span>
                  </div>

                  {/* Propuesta de VDOT Adaptativo */}
                  <div
                    className="inset-panel row-between"
                    style={{ background: 'var(--bg-surface)', padding: '0.6rem 0.85rem' }}
                  >
                    <div style={{ flex: '1 1 280px', fontSize: '0.8rem' }}>
                      <strong style={{ color: evaluation.vdotDelta > 0 ? 'var(--accent)' : 'var(--pine)' }}>
                        <Lightning size={14} weight="duotone" style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
                        VDOT Adaptativo:
                      </strong>{' '}
                      <span>{evaluation.vdotReason}</span>
                    </div>
                    {evaluation.suggestedVdot && evaluation.vdotDelta > 0 && (
                      <label className="row-wrap" style={{ gap: '0.4rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>
                        <input
                          type="checkbox"
                          checked={applyAdaptiveVdot}
                          onChange={(e) => setApplyAdaptiveVdot(e.target.checked)}
                        />
                        Subir a VDOT {evaluation.suggestedVdot} (+{evaluation.vdotDelta})
                      </label>
                    )}
                  </div>
                </div>

                {/* Vista Compacta de Parciales y Ritmo + Pulsaciones */}
                <WorkoutTelemetrySplits
                  workout={{
                    id: currentActivity.externalId,
                    date: currentActivity.date,
                    title: currentActivity.title,
                    subtitle: currentActivity.notes ?? '',
                    modality: currentActivity.modality,
                    durationMinutes: currentActivity.durationMinutes,
                    targetDistanceKm: currentActivity.distanceKm,
                    targetZone: evaluation.rpeEstimated >= 7 ? 'Z4' : 'Z2',
                    targetPace: `${formatPace(evaluation.avgPaceSecPerKm)} /km`,
                    estimatedCalories: evaluation.calories,
                    blocks: [],
                    externalSource: currentActivity.source,
                    avgHeartRateBpm: currentActivity.avgHeartRateBpm,
                    maxHeartRateBpm: currentActivity.maxHeartRateBpm,
                    cadenceSpm: currentActivity.cadenceSpm,
                    kmSplits: currentActivity.kmSplits,
                  }}
                  onExportSuccess={(name) => onNotify(`Archivo ${name} descargado para tu reloj GPS.`)}
                />

                <div className="row-between">
                  <button type="button" className="btn btn-secondary" onClick={() => setLoadedActivities([])}>
                    Descartar vista previa
                  </button>
                  <button type="button" className="btn lovable-cta-btn" onClick={handleConfirmApply}>
                    <CheckCircle size={17} weight="duotone" aria-hidden="true" />
                    Aplicar al plan, sumar puntos y guardar
                  </button>
                </div>
              </div>
            ) : (
              <div className="inset-panel muted" style={{ fontSize: '0.84rem', textAlign: 'center', padding: '1.5rem' }}>
                Sube un archivo <code>.GPX</code>, <code>.TCX</code>, <code>.JSON</code> o <code>.CSV</code>, o pulsa un conector desde la primera pestaña para inspeccionar sus parciales en <strong>km/h · km/min · min/km</strong> y aplicarlo al plan.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: EXPORTAR RUTINAS DE FLYRUN A RELOJ GPS (.TCX) */}
        {activeTab === 'watch_export' && (
          <div className="stack-sm">
            <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>
              Descarga cualquiera de tus rutinas estructuradas en formato <strong>Garmin / Polar / Coros (.TCX)</strong> para importarlas en tu reloj deportivo con todas sus fases y ritmos.
            </p>
            <div className="stack-sm" style={{ maxBlockSize: '340px', overflowY: 'auto' }}>
              {workouts.slice(0, 7).map((w) => {
                const avgConv = convertSpeedValue(profile.vdot * 0.25, 'kmh');
                return (
                  <div key={w.id} className="inset-panel row-between" style={{ background: 'var(--bg-surface)', padding: '0.62rem 0.85rem' }}>
                    <div>
                      <strong style={{ fontSize: '0.88rem' }}>{w.title}</strong>
                      <div className="muted mono" style={{ fontSize: '0.73rem' }}>
                        {w.date} · {w.durationMinutes} min · {w.targetZone} ({w.targetPace || `${avgConv.kmh} km/h`})
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        const fname = `flyrun-${w.date}-${w.modality}.tcx`;
                        downloadTextFile(fname, buildWorkoutTCX(w), 'application/vnd.garmin.tcx+xml;charset=utf-8');
                        onNotify(`Rutina exportada a ${fname} para tu reloj GPS.`);
                      }}
                    >
                      <FileCode size={15} weight="duotone" aria-hidden="true" />
                      Descargar .TCX
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}
