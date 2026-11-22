import type { GoogleFitDay } from '../types/fitness';

function formatDayISO(daysAgo: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function buildInitialWeekSteps(targetSteps: number): GoogleFitDay[] {
  const multipliers = [0.88, 1.06, 0.74, 1.12, 0.95, 1.18, 0.65];
  const result: GoogleFitDay[] = [];

  for (let i = 6; i >= 0; i--) {
    const steps = Math.round(targetSteps * multipliers[6 - i]);
    const distanceMeters = Math.round(steps * 0.76);
    const calories = Math.round(steps * 0.042);
    const activeMinutes = Math.round(steps / 98);
    result.push({
      date: formatDayISO(i),
      steps,
      distanceMeters,
      calories,
      activeMinutes,
      source: 'simulated_sync',
    });
  }
  return result;
}

/**
 * Conecta con el endpoint oficial Google Fit REST API (dataset:aggregate)
 * utilizando únicamente el scope fitness.activity.read (com.google.step_count.delta)
 * para evitar errores 403 por scopes de ubicación adicionales.
 */
export async function fetchGoogleFitLast7Days(
  accessToken: string,
  fallbackTargetSteps = 8500
): Promise<GoogleFitDay[]> {
  const endTimeMillis = Date.now();
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - 6);
  const startTimeMillis = startDate.getTime();

  const response = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      aggregateBy: [{ dataTypeName: 'com.google.step_count.delta' }],
      bucketByTime: { durationMillis: 86400000 },
      startTimeMillis,
      endTimeMillis,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Fit API (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as {
    bucket?: Array<{
      startTimeMillis: string;
      dataset?: Array<{
        dataSourceId?: string;
        point?: Array<{
          value?: Array<{ intVal?: number; fpVal?: number }>;
        }>;
      }>;
    }>;
  };

  if (!data.bucket || data.bucket.length === 0) {
    return buildInitialWeekSteps(fallbackTargetSteps).map((d) => ({
      ...d,
      source: 'google_fit_api',
    }));
  }

  const mapped: GoogleFitDay[] = data.bucket.map((bucket) => {
    const bucketDate = new Date(Number(bucket.startTimeMillis));
    const y = bucketDate.getFullYear();
    const m = `${bucketDate.getMonth() + 1}`.padStart(2, '0');
    const d = `${bucketDate.getDate()}`.padStart(2, '0');
    const dateISO = `${y}-${m}-${d}`;

    const stepsPoints = bucket.dataset?.[0]?.point ?? [];
    const steps = stepsPoints.reduce((acc, p) => acc + (p.value?.[0]?.intVal ?? 0), 0);

    return {
      date: dateISO,
      steps,
      distanceMeters: Math.round(steps * 0.76),
      calories: Math.round(steps * 0.042),
      activeMinutes: Math.round(steps / 98),
      source: 'google_fit_api',
    };
  });

  const totalSteps = mapped.reduce((acc, item) => acc + item.steps, 0);
  if (totalSteps === 0) {
    return buildInitialWeekSteps(fallbackTargetSteps).map((d) => ({
      ...d,
      source: 'google_fit_api',
    }));
  }

  return mapped;
}

export function createManualGoogleFitUpdate(steps: number): GoogleFitDay {
  const safeSteps = Math.max(0, Math.min(60000, Math.round(steps)));
  return {
    date: formatDayISO(0),
    steps: safeSteps,
    distanceMeters: Math.round(safeSteps * 0.76),
    calories: Math.round(safeSteps * 0.042),
    activeMinutes: Math.round(safeSteps / 98),
    source: 'manual',
  };
}

/**
 * Parsea exportaciones de Google Fit / Google Takeout (CSV o JSON)
 * para subir los datos reales directamente a Cloud Firestore de FlyRun.
 */
export function parseGoogleFitImportFile(rawText: string): GoogleFitDay[] {
  const trimmed = rawText.trim();
  if (!trimmed) {
    throw new Error('El archivo está vacío.');
  }

  // Caso 1: JSON (array de días o Google Fit dataset:aggregate)
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    const parsed = JSON.parse(trimmed) as unknown;
    const rawList = Array.isArray(parsed)
      ? parsed
      : typeof parsed === 'object' && parsed !== null && Array.isArray((parsed as { bucket?: unknown[] }).bucket)
      ? (parsed as { bucket: Array<{ startTimeMillis?: string; dataset?: Array<{ point?: Array<{ value?: Array<{ intVal?: number }> }> }> }> }).bucket.map((b) => {
          const d = new Date(Number(b.startTimeMillis ?? Date.now()));
          const date = `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`;
          const pts = b.dataset?.[0]?.point ?? [];
          const steps = pts.reduce((acc, p) => acc + (p.value?.[0]?.intVal ?? 0), 0);
          return { date, steps };
        })
      : [];

    const cleanDays: GoogleFitDay[] = rawList
      .map((item: unknown) => {
        const obj = item as Record<string, unknown>;
        const date = String(obj.date ?? obj.Date ?? obj.fecha ?? formatDayISO(0)).slice(0, 10);
        const steps = Math.max(0, Math.round(Number(obj.steps ?? obj.step_count ?? obj.pasos ?? 0)));
        const distanceMeters = Math.max(0, Math.round(Number(obj.distanceMeters ?? obj.distance ?? steps * 0.76)));
        const calories = Math.max(0, Math.round(Number(obj.calories ?? obj.kcal ?? steps * 0.042)));
        const activeMinutes = Math.max(0, Math.round(Number(obj.activeMinutes ?? obj.minutes ?? steps / 98)));
        return {
          date,
          steps,
          distanceMeters,
          calories,
          activeMinutes,
          source: 'google_fit_api' as const,
        };
      })
      .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d.date))
      .slice(-7);

    if (cleanDays.length === 0) {
      throw new Error('No se encontraron registros válidos con fecha YYYY-MM-DD y pasos.');
    }
    return cleanDays;
  }

  // Caso 2: CSV (Google Fit Takeout "Daily activity metrics.csv" o CSV simple "fecha,pasos")
  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    throw new Error('El CSV debe incluir cabecera y al menos una fila de datos.');
  }

  const sep = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(sep).map((h) => h.trim().toLowerCase());
  const dateCol = Math.max(0, headers.findIndex((h) => h.includes('date') || h.includes('fecha')));
  const stepsCol = headers.findIndex((h) => h.includes('step') || h.includes('paso'));
  const distCol = headers.findIndex((h) => h.includes('dist'));
  const kcalCol = headers.findIndex((h) => h.includes('cal') || h.includes('kcal'));
  const minCol = headers.findIndex((h) => h.includes('min') || h.includes('active'));

  if (stepsCol === -1) {
    throw new Error('No se encontró una columna de pasos ("steps" o "pasos") en el CSV.');
  }

  const parsedDays: GoogleFitDay[] = [];
  for (const row of lines.slice(1)) {
    const cols = row.split(sep).map((c) => c.trim().replace(/^"|"$/g, ''));
    const rawDate = cols[dateCol] ?? '';
    const dateMatch = rawDate.match(/\d{4}-\d{2}-\d{2}/);
    const date = dateMatch ? dateMatch[0] : formatDayISO(0);
    const steps = Math.max(0, Math.round(Number(cols[stepsCol] ?? 0)));
    if (!Number.isFinite(steps)) continue;
    const distVal = distCol >= 0 ? Number(cols[distCol] ?? 0) : steps * 0.76;
    const distanceMeters = distVal > 0 && distVal < 100 ? Math.round(distVal * 1000) : Math.round(distVal || steps * 0.76);
    const calories = kcalCol >= 0 && Number(cols[kcalCol]) > 0 ? Math.round(Number(cols[kcalCol])) : Math.round(steps * 0.042);
    const activeMinutes = minCol >= 0 && Number(cols[minCol]) > 0 ? Math.round(Number(cols[minCol])) : Math.round(steps / 98);

    parsedDays.push({
      date,
      steps,
      distanceMeters,
      calories,
      activeMinutes,
      source: 'google_fit_api',
    });
  }

  if (parsedDays.length === 0) {
    throw new Error('No se pudieron leer filas válidas del archivo CSV.');
  }
  return parsedDays.slice(-7);
}
