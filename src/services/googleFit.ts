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
 * utilizando el token OAuth obtenido en el login con Google.
 */
export async function fetchGoogleFitLast7Days(accessToken: string): Promise<GoogleFitDay[]> {
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
      aggregateBy: [
        { dataTypeName: 'com.google.step_count.delta' },
        { dataTypeName: 'com.google.distance.delta' },
        { dataTypeName: 'com.google.calories.expended' },
      ],
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
    return buildInitialWeekSteps(8000);
  }

  return data.bucket.map((bucket) => {
    const bucketDate = new Date(Number(bucket.startTimeMillis));
    const dateISO = bucketDate.toISOString().slice(0, 10);

    const stepsPoints = bucket.dataset?.[0]?.point ?? [];
    const distPoints = bucket.dataset?.[1]?.point ?? [];
    const calPoints = bucket.dataset?.[2]?.point ?? [];

    const steps = stepsPoints.reduce((acc, p) => acc + (p.value?.[0]?.intVal ?? 0), 0);
    const distanceMeters = Math.round(distPoints.reduce((acc, p) => acc + (p.value?.[0]?.fpVal ?? 0), 0));
    const calories = Math.round(calPoints.reduce((acc, p) => acc + (p.value?.[0]?.fpVal ?? 0), 0));

    return {
      date: dateISO,
      steps,
      distanceMeters: distanceMeters || Math.round(steps * 0.76),
      calories: calories || Math.round(steps * 0.042),
      activeMinutes: Math.round(steps / 98),
      source: 'google_fit_api',
    };
  });
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
