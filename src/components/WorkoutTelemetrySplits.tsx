import { useState } from 'react';
import { DownloadSimple, Heartbeat, Watch } from '@phosphor-icons/react';
import type { WorkoutSession } from '../types/fitness';
import { formatPace, type SpeedUnit } from '../services/scienceEngine';
import { buildWorkoutTCX, downloadTextFile, formatSplitSpeed } from '../services/deviceHub';

interface WorkoutTelemetrySplitsProps {
  workout: Pick<
    WorkoutSession,
    | 'id'
    | 'date'
    | 'title'
    | 'modality'
    | 'durationMinutes'
    | 'targetDistanceKm'
    | 'targetZone'
    | 'targetPace'
    | 'estimatedCalories'
    | 'blocks'
    | 'subtitle'
    | 'externalSource'
    | 'avgHeartRateBpm'
    | 'maxHeartRateBpm'
    | 'cadenceSpm'
    | 'kmSplits'
  >;
  compact?: boolean;
  onExportSuccess?: (filename: string) => void;
}

const SOURCE_LABELS: Record<string, string> = {
  google_fit: 'Google Fit API',
  strava: 'Strava',
  garmin: 'Garmin / Reloj',
  gpx_tcx: 'Archivo GPX / TCX',
  live_gps: 'GPS en Vivo',
  manual: 'Manual',
};

export function WorkoutTelemetrySplits({
  workout,
  compact = false,
  onExportSuccess,
}: WorkoutTelemetrySplitsProps) {
  const [unit, setUnit] = useState<SpeedUnit>('kmh');
  const splits = workout.kmSplits ?? [];

  if (splits.length === 0 && !workout.avgHeartRateBpm) {
    return null;
  }

  const fastestPace =
    splits.length > 0 ? Math.min(...splits.map((s) => s.paceSecPerKm)) : 300;
  const slowestPace =
    splits.length > 0 ? Math.max(...splits.map((s) => s.paceSecPerKm)) : 420;

  const formatMmSs = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.round(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleExportTCX = () => {
    const safeName = workout.date ? `flyrun-${workout.date}.tcx` : `flyrun-rutina.tcx`;
    const xml = buildWorkoutTCX(workout as WorkoutSession);
    downloadTextFile(safeName, xml, 'application/vnd.garmin.tcx+xml;charset=utf-8');
    onExportSuccess?.(safeName);
  };

  return (
    <div
      className="inset-panel stack-sm"
      style={{
        borderColor: 'var(--cobalt-border)',
        background: 'var(--bg-surface)',
        padding: compact ? '0.68rem 0.85rem' : '0.85rem 1rem',
      }}
      aria-label="Telemetría de parciales por kilómetro y pulsaciones"
    >
      <div className="row-between">
        <div className="row-wrap" style={{ gap: '0.4rem' }}>
          <span className="pill pill-cyan" style={{ fontSize: '0.72rem' }}>
            <Watch size={13} weight="duotone" aria-hidden="true" />
            {SOURCE_LABELS[workout.externalSource ?? 'manual'] ?? 'Telemetría'}
          </span>
          {workout.avgHeartRateBpm && (
            <span className="pill pill-amber mono" style={{ fontSize: '0.72rem' }}>
              <Heartbeat size={13} weight="duotone" aria-hidden="true" />
              FC Media {workout.avgHeartRateBpm} ppm
              {workout.maxHeartRateBpm ? ` · Máx ${workout.maxHeartRateBpm}` : ''}
            </span>
          )}
          {workout.cadenceSpm && (
            <span className="pill mono" style={{ fontSize: '0.72rem' }}>
              {workout.cadenceSpm} ppm cadencia
            </span>
          )}
        </div>

        <div className="row-wrap" style={{ gap: '0.35rem' }}>
          <div className="segmented-group" role="group" aria-label="Unidad de parciales">
            {(
              [
                { id: 'kmh', label: 'km/h' },
                { id: 'km_min', label: 'km/min' },
                { id: 'min_km', label: 'min/km' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                aria-pressed={unit === opt.id}
                className="segmented-btn is-accent mono"
                onClick={() => setUnit(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={handleExportTCX}
            title="Exportar esta sesión/rutina para Garmin, Polar, Coros o Strava (.TCX)"
          >
            <DownloadSimple size={14} weight="duotone" aria-hidden="true" />
            .TCX
          </button>
        </div>
      </div>

      {splits.length > 0 && (
        <div className="scroll-table-wrap">
          <table className="zone-table" style={{ fontSize: '0.77rem' }}>
            <thead>
              <tr>
                <th>Km</th>
                <th>Tiempo</th>
                <th>Ritmo ({unit === 'kmh' ? 'km/h' : unit === 'km_min' ? 'km/min' : 'min/km'})</th>
                <th>Barra relativa</th>
                <th>FC</th>
              </tr>
            </thead>
            <tbody>
              {splits.map((sp) => {
                const span = Math.max(10, slowestPace - fastestPace);
                const relPct = Math.round(52 + ((slowestPace - sp.paceSecPerKm) / span) * 48);
                return (
                  <tr key={sp.km}>
                    <td className="mono" style={{ fontWeight: 700 }}>Km {sp.km}</td>
                    <td className="mono">{formatMmSs(sp.durationSec)}</td>
                    <td className="mono" style={{ fontWeight: 700, color: 'var(--cobalt)' }}>
                      {formatSplitSpeed(sp, unit)}
                    </td>
                    <td style={{ minInlineSize: '90px' }}>
                      <div className="progress-track" style={{ blockSize: '7px' }}>
                        <div
                          className="progress-fill"
                          style={{
                            inlineSize: `${relPct}%`,
                            background: sp.paceSecPerKm <= fastestPace + 6 ? 'var(--accent)' : 'var(--cobalt)',
                          }}
                        />
                      </div>
                    </td>
                    <td className="mono muted">
                      {sp.avgHrBpm ? `${sp.avgHrBpm} ppm` : `${formatPace(sp.paceSecPerKm)}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
