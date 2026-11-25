/**
 * Motor de cálculo fisiológico CIEMHCAVI · Fórmula v2.1
 * Modelo: VAM 2000m + ASR Supramáximo (Karvonen FC)
 * Compartido entre cliente y servidor.
 */

export const TEST_DISTANCE_M = 2000;

/** Zonas de la Matriz de Intensidades (porcentaje de VAM). */
export const ZONES = [
  { pct: 70, name: "Z1 Regenerativo", short: "Z1", tone: "tertiary" },
  { pct: 80, name: "Z2 Aeróbico Bajo", short: "Z2", tone: "secondary" },
  { pct: 85, name: "Z3 Moderado", short: "Z3", tone: "secondary-container" },
  { pct: 90, name: "Z4 Umbral Anaer.", short: "Z4", tone: "primary-fixed" },
  { pct: 100, name: "Z5 Potencia / VAM", short: "Z5", tone: "primary" },
  { pct: 105, name: "Z6 Cap. Anaeróbica", short: "Z6", tone: "inverse-surface" },
  { pct: 110, name: "Z7 Velocidad ASR", short: "Z7", tone: "primary-container" },
] as const;

export type Zone = (typeof ZONES)[number];

/** Distancias de control disponibles en la matriz (metros). */
export const CONTROL_DISTANCES = [100, 200, 400, 800, 1000, 1200, 1500, 2000, 3000, 5000];

/** Calculadoras de series: distancias y porcentajes del prescriptor. */
export const CALC_DISTANCES = [400, 800, 1000, 1200, 2000];
export const CALC_PERCENTS = [85, 90, 95, 100, 105, 110];

// ── Formato ─────────────────────────────────────────────────────────────────

/** 375.0 → "6:15.0" | 83.46 → "1:23.5" (redondeado a décimas). */
export function formatTime(totalSeconds: number): string {
  const rounded = Math.round(totalSeconds * 10) / 10;
  const minutes = Math.floor(rounded / 60);
  const seconds = Math.round((rounded - minutes * 60) * 10) / 10;
  let wholeSecs = Math.floor(seconds);
  let tenths = Math.round((seconds - wholeSecs) * 10);
  if (tenths === 10) {
    tenths = 0;
    wholeSecs += 1;
  }
  let finalMinutes = minutes;
  let dispSecs = wholeSecs;
  if (dispSecs === 60) {
    dispSecs = 0;
    finalMinutes += 1;
  }
  const padSec = dispSecs < 10 ? `0${dispSecs}` : `${dispSecs}`;
  return `${finalMinutes}:${padSec}.${tenths}`;
}

/** Segundos → "06:15.0" con horas si aplica (para totales). */
export function formatTimeLong(totalSeconds: number): string {
  if (totalSeconds < 3600) return formatTime(totalSeconds);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(Math.floor(s)).padStart(2, "0")}`;
}

/** 19.2 km/h → "3:07/km" (ritmo por kilómetro). */
export function formatPace(speedKmh: number): string {
  if (speedKmh <= 0) return "0:00/km";
  const paceDec = 60 / speedKmh; // minutos por km
  let mins = Math.floor(paceDec);
  let secs = Math.round((paceDec - mins) * 60);
  if (secs === 60) {
    mins += 1;
    secs = 0;
  }
  const padSec = secs < 10 ? `0${secs}` : `${secs}`;
  return `${mins}:${padSec}/km`;
}

/** Ritmo con décimas: 19.2 → "3:07.5" (para tarjetas de métrica). */
export function formatPacePrecise(speedKmh: number): string {
  const paceDec = 60 / speedKmh;
  const mins = Math.floor(paceDec);
  const secs = (paceDec - mins) * 60;
  return `${mins}:${String(Math.floor(secs)).padStart(2, "0")}.${Math.floor((secs % 1) * 10)}`;
}

/** "3:07.5" | "6:15" | "375" → segundos. Acepta mm:ss.d, mm:ss, sss. */
export function parseTimeInput(raw: string): number | null {
  const v = raw.trim().replace(",", ".");
  if (!v) return null;
  if (v.includes(":")) {
    const parts = v.split(":");
    if (parts.length < 2) return null;
    const m = parseFloat(parts[0]);
    const s = parseFloat(parts[1]);
    if (isNaN(m) || isNaN(s)) return null;
    return m * 60 + s;
  }
  const s = parseFloat(v);
  return isNaN(s) ? null : s;
}

// ── Fisiología ──────────────────────────────────────────────────────────────

/** VAM (km/h) a partir del tiempo oficial del test 2000m. */
export function computeVam(timeSeconds: number, distance = TEST_DISTANCE_M): number {
  const speedMs = distance / timeSeconds;
  return Math.round(speedMs * 3.6 * 100) / 100;
}

/** Velocidad (m/s) desde km/h. */
export const kmhToMs = (kmh: number): number => kmh / 3.6;

/** FC objetivo por Karvonen: reposo + (máx − reposo) × pct/100. */
export function karvonen(pct: number, hrMax: number, hrRest: number): number {
  return Math.round(hrRest + (hrMax - hrRest) * (Math.min(pct, 100) / 100));
}

/** Reserva de velocidad anaeróbica (ASR) = MSS − VAM. */
export const computeAsr = (vam: number, mss: number): number =>
  Math.round((mss - vam) * 10) / 10;

/** Tiempo objetivo (s) para una distancia a un porcentaje de la VAM. */
export function targetTime(distanceM: number, vamKmh: number, pct: number): number {
  return distanceM / kmhToMs(vamKmh * (pct / 100));
}

/** VO₂máx estimado (ml/kg/min) desde VAM — ecuación lineal de laboratorio. */
export function estimateVo2Max(vamKmh: number): number {
  return Math.round(vamKmh * 3.42 * 10) / 10;
}

/** IMC. */
export function computeBmi(weightKg: number, heightCm: number): number {
  return Math.round((weightKg / Math.pow(heightCm / 100, 2)) * 100) / 100;
}

// ── Análisis del Test 2000m ─────────────────────────────────────────────────

export interface LapData {
  times: number[];
  fcs: number[];
  fcEstimated: boolean;
}

/** Parsea el JSON de parciales: [t1..t5] o { times: [...], fcs: [...] }. */
export function parseLapData(lapTimesJson: string, fcAvg?: number | null, fcMax?: number | null): LapData {
  try {
    const raw = JSON.parse(lapTimesJson);
    let times: number[] = [];
    let fcs: number[] = [];
    if (Array.isArray(raw)) {
      times = raw.filter((t: unknown) => typeof t === "number" && t > 0);
    } else if (raw && Array.isArray(raw.times)) {
      times = raw.times.filter((t: unknown) => typeof t === "number" && t > 0);
      fcs = (raw.fcs ?? []).filter((f: unknown) => typeof f === "number" && f > 0);
    }
    // Si no hay parciales reales, se estiman 5 tramos uniformes
    return { times, fcs, fcEstimated: fcs.length === 0 };
  } catch {
    return { times: [], fcs: [], fcEstimated: true };
  }
}

export interface LapAnalysis {
  laps: { index: number; from: number; to: number; time: number; cum: number; pace: string; fc: number | null }[];
  fastest: { index: number; time: number; speedMs: number; speedKmh: number };
  slowest: { index: number; time: number; speedMs: number; speedKmh: number };
  speedRangeMs: string;
  finalSprintDelta: number | null; // m/s de la última vs penúltima vuelta
  idr: number | null; // Índice de Variabilidad (%)
  netDiff: number | null; // diferencia neta rápido-lento (s)
}

/** Analiza los parciales de 400m de un test de 2000m (5 vueltas). */
export function analyzeLaps(lapTimes: number[], fcs: (number | null)[]): LapAnalysis {
  if (lapTimes.length === 0) {
    return {
      laps: [],
      fastest: { index: 0, time: 0, speedMs: 0, speedKmh: 0 },
      slowest: { index: 0, time: 0, speedMs: 0, speedKmh: 0 },
      speedRangeMs: "—",
      finalSprintDelta: null,
      idr: null,
      netDiff: null,
    };
  }
  let cum = 0;
  const laps = lapTimes.map((t, i) => {
    cum += t;
    return {
      index: i + 1,
      from: i * 400,
      to: (i + 1) * 400,
      time: t,
      cum,
      pace: formatPace((400 / t) * 3.6),
      fc: fcs[i] ?? null,
    };
  });
  let fastest = { index: 1, time: lapTimes[0] };
  let slowest = { index: 1, time: lapTimes[0] };
  lapTimes.forEach((t, i) => {
    if (t < fastest.time) fastest = { index: i + 1, time: t };
    if (t > slowest.time) slowest = { index: i + 1, time: t };
  });
  const total = cum;
  // IDR (Índice de Variabilidad) relativo a la vuelta más rápida — reproduce el 5.9% del protocolo CIEMHCAVI
  const idr = fastest.time > 0 ? ((slowest.time - fastest.time) / fastest.time) * 100 : null;
  const finalSprintDelta =
    lapTimes.length >= 2
      ? Math.round((400 / lapTimes[lapTimes.length - 1] - 400 / lapTimes[lapTimes.length - 2]) * 100) / 100
      : null;
  return {
    laps,
    fastest: {
      index: fastest.index,
      time: fastest.time,
      speedMs: Math.round((400 / fastest.time) * 100) / 100,
      speedKmh: Math.round((400 / fastest.time) * 3.6 * 100) / 100,
    },
    slowest: {
      index: slowest.index,
      time: slowest.time,
      speedMs: Math.round((400 / slowest.time) * 100) / 100,
      speedKmh: Math.round((400 / slowest.time) * 3.6 * 100) / 100,
    },
    speedRangeMs: `${(400 / slowest.time).toFixed(2)} m/s - ${(400 / fastest.time).toFixed(2)} m/s`,
    finalSprintDelta,
    idr: idr !== null ? Math.round(idr * 10) / 10 : null,
    netDiff: Math.round((slowest.time - fastest.time) * 10) / 10,
  };
}

/** Clasificación de la estrategia de pacing según el IDR. */
export function pacingStrategy(idr: number | null): { label: string; tone: "tertiary" | "secondary" | "error" } {
  if (idr === null) return { label: "Sin datos", tone: "secondary" };
  if (idr < 6) return { label: "Estrategia Positiva Controlada", tone: "tertiary" };
  if (idr < 9) return { label: "Estrategia Variable Moderada", tone: "secondary" };
  return { label: "Estrategia Irregular", tone: "error" };
}

// ── Etiquetas de dominio ────────────────────────────────────────────────────

export const SPECIALTIES: Record<string, { label: string; chip: string }> = {
  MARATON: { label: "Fondo & Maratón", chip: "Maratón" },
  MEDIO_FONDO: { label: "Medio Fondo (800m - 3000m)", chip: "Medio Fondo" },
  "10K_5K": { label: "10K & 5K Universitario", chip: "10K UNA" },
  TRAIL_SALUD: { label: "Trail Running & Acond. Salud", chip: "Trail 30K" },
};

export const STATUSES: Record<string, { label: string; tone: string }> = {
  ACTIVO: { label: "Activo Pleno", tone: "tertiary" },
  TRANSICION: { label: "Transición", tone: "secondary" },
  BAJA: { label: "Baja Temporal", tone: "error" },
};

/** Iniciales para avatares: "Carlos Camacho Garita" → "CC". */
export function initials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

/** Fecha corta es-CR: "18/01/2025". */
export function formatDateEs(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("es-CR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

/** Edad en años desde la fecha de nacimiento. */
export function computeAge(birthDate: Date | string | null): number | null {
  if (!birthDate) return null;
  const d = typeof birthDate === "string" ? new Date(birthDate) : birthDate;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}
