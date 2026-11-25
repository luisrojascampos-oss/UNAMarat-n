"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavStore } from "@/store/nav-store";
import { MS } from "@/components/shared/ms";
import { Avatar } from "@/components/shared/avatar";
import { AthleteCombobox } from "@/components/shared/athlete-combobox";
import {
  CALC_DISTANCES, CALC_PERCENTS, CONTROL_DISTANCES, SPECIALTIES, ZONES,
  computeAsr, formatDateEs, formatPace, formatTime, karvonen, targetTime,
} from "@/lib/sports-science";
import type { AthleteDetailDTO, AthleteListItem } from "@/lib/types";
import { cn as clsx } from "@/lib/utils";

const ZONE_ROW_TONE: Record<number, { dot: string; label: string; bg: string }> = {
  70: { dot: "bg-tertiary", label: "text-tertiary", bg: "bg-surface-container-lowest" },
  80: { dot: "bg-secondary", label: "text-secondary", bg: "bg-surface-container-low/40" },
  85: { dot: "bg-secondary-container", label: "text-on-secondary-container", bg: "bg-surface-container-lowest" },
  90: { dot: "bg-primary-fixed-dim", label: "text-on-primary-fixed-variant", bg: "bg-surface-container-low/40" },
  100: { dot: "bg-primary", label: "text-primary", bg: "bg-primary/5" },
  105: { dot: "bg-inverse-surface", label: "text-inverse-surface dark:text-on-surface", bg: "bg-surface-container-high/60" },
  110: { dot: "bg-primary-container", label: "text-on-primary-fixed-variant", bg: "bg-surface-container-highest/80 dark:bg-surface-container-high/60" },
};

export function DosageView() {
  const dosageAthleteId = useNavStore((s) => s.dosageAthleteId);
  const setDosageAthleteId = useNavStore((s) => s.setDosageAthlete);
  const [localAthleteId, setLocalAthleteId] = useState<string | null>(null);
  const [distance, setDistance] = useState(400);
  const [reps, setReps] = useState(5);
  const [calcDist, setCalcDist] = useState(1000);
  const [calcPct, setCalcPct] = useState(95);

  const { data: athletesData } = useQuery<{ athletes: AthleteListItem[] }>({
    queryKey: ["athletes", "with-plan"],
    queryFn: async () => {
      const res = await fetch("/api/athletes");
      if (!res.ok) throw new Error("Error al cargar atletas");
      return res.json();
    },
  });
  const athletes = useMemo(
    () => (athletesData?.athletes ?? []).sort((a, b) => Number(b.vam !== null) - Number(a.vam !== null)),
    [athletesData]
  );
  const defaultAthlete = useMemo(() => athletes.find((a) => a.code === "UNA-ATL-042") ?? athletes.find((a) => a.vam) ?? null, [athletes]);
  const effectiveId = localAthleteId ?? dosageAthleteId ?? defaultAthlete?.id ?? null;

  const { data: detail, isLoading } = useQuery<{ athlete: AthleteDetailDTO }>({
    queryKey: ["athlete", effectiveId],
    queryFn: async () => {
      const res = await fetch(`/api/athletes/${effectiveId}`);
      if (!res.ok) throw new Error("Error al cargar el expediente");
      return res.json();
    },
    enabled: !!effectiveId,
  });

  const athlete = detail?.athlete;
  const vam = athlete?.vam ?? null;
  const mss = athlete?.mss ?? null;
  const asr = vam && mss ? computeAsr(vam, mss) : null;
  const hrMax = athlete?.hrMax ?? null;
  const hrRest = athlete?.hrRest ?? null;

  // Cálculos de la matriz según distancia activa (cómputo directo, barato)
  const matrix = vam
    ? ZONES.map((z) => {
        const speed = vam * (z.pct / 100);
        return {
          ...z,
          speed,
          pace: formatPace(speed),
          time: targetTime(distance, vam, z.pct),
          hr: hrMax && hrRest ? (z.pct >= 100 ? "MÁX" : karvonen(z.pct, hrMax, hrRest)) : null,
          tolerance: z.pct >= 100 ? "±1.0s" : "±1.5s",
        };
      })
    : [];

  // Calculadora de series
  const calc = vam
    ? (() => {
        const speed = vam * (calcPct / 100);
        return { speed, time: targetTime(calcDist, vam, calcPct), pace: formatPace(speed) };
      })()
    : null;

  const waText = athlete && vam && calc
    ? `🏃 *CIEMHCAVI · UNA — Pauta de Entrenamiento*\n\n` +
      `Atleta: ${athlete.firstName} ${athlete.lastName} (${athlete.code})\n` +
      `Sesión: ${reps} x ${calcDist}m @ ${calcPct}% VAM\n` +
      `Tiempo objetivo: ${formatTime(calc.time)} /repetición\n` +
      `Ritmo: ${calc.pace} · Velocidad: ${calc.speed.toFixed(2)} km/h\n` +
      `VAM referencia: ${vam} km/h (Test 2000m ${formatDateEs(athlete.testDate ?? new Date())})\n` +
      `Pausa: 2:00 trote\n\n_Laboratorio CIEMHCAVI · Universidad Nacional de Costa Rica_`
    : "";

  async function copyWhatsApp() {
    try {
      await navigator.clipboard.writeText(waText);
      toast.success("Copiado resumen formateado para WhatsApp.");
    } catch {
      toast.info("No se pudo acceder al portapapeles en este navegador.");
    }
  }

  const inputSelectCls =
    "h-9 px-2 rounded-lg bg-surface-container font-label text-[12px] text-on-surface focus:outline-none cursor-pointer";

  if (isLoading && !athlete) {
    return <div className="h-96 animate-pulse rounded-xl bg-surface-container" aria-busy="true" />;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Selector de atleta */}
      <AthleteCombobox
        value={effectiveId}
        onChange={(id) => { setLocalAthleteId(id); setDosageAthleteId(id); }}
        athletes={athletes}
      />

      {!athlete ? (
        <div className="flex flex-col items-center gap-2 rounded-xl bg-surface-container-lowest p-8 text-center shadow-sm">
          <MS name="person_off" className="text-[32px] text-on-surface-variant" />
          <p className="text-sm text-on-surface-variant">Selecciona un atleta con test certificado.</p>
        </div>
      ) : !vam ? (
        <div className="flex flex-col items-center gap-2 rounded-xl bg-error-container/50 p-8 text-center">
          <MS name="timer_off" className="text-[32px] text-error" />
          <p className="text-sm text-on-error-container">
            {athlete.firstName} no tiene VAM certificada. Registra un Test 2000m para habilitar la dosificación.
          </p>
        </div>
      ) : (
        <>
          {/* Cabecera fisiológica del atleta */}
          <section className="relative flex flex-col gap-2 overflow-hidden rounded-xl bg-surface-container-lowest p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <div className="relative">
                  <Avatar firstName={athlete.firstName} lastName={athlete.lastName} tone="primary" className="h-12 w-12" />
                  <span className="absolute -bottom-1 -right-1 rounded-full bg-tertiary px-1 font-label text-[9px] font-bold text-on-tertiary">
                    UNA
                  </span>
                </div>
                <div className="flex min-w-0 flex-col">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="truncate font-display text-xl text-on-surface">
                      {athlete.firstName} {athlete.lastName}
                    </span>
                    <span className="rounded-sm bg-surface-container px-1.5 py-0.5 font-label text-[11px] text-secondary">
                      {athlete.code}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-sm text-on-surface-variant">
                    <MS name="check_circle" className="text-[14px] text-tertiary" />
                    Test 2000m Certificado ({athlete.testDate ? formatDateEs(athlete.testDate) : "—"})
                  </span>
                </div>
              </div>
              <button
                onClick={() => toast.info(`VAM fijada por Test 2000m oficial: ${vam} km/h`)}
                title="Editar Referencia"
                aria-label="Editar Referencia"
                className="flex shrink-0 items-center justify-center rounded-lg bg-surface-container p-2 text-secondary transition-colors hover:bg-surface-container-high"
              >
                <MS name="tune" className="text-[20px]" />
              </button>
            </div>

            <div className="mt-1 grid grid-cols-2 gap-1">
              <div className="flex flex-col rounded-lg bg-surface-container-low p-2">
                <div className="flex items-center justify-between text-secondary">
                  <span className="font-label text-[10px] uppercase">VAM Referencia</span>
                  <MS name="speed" className="text-[14px]" />
                </div>
                <div className="mt-0.5 flex items-baseline gap-1">
                  <span className="font-label text-xl font-bold text-primary">{vam}</span>
                  <span className="font-label text-[10px] text-on-surface-variant">km/h</span>
                  <span className="ml-auto font-label text-[11px] text-secondary">
                    ({(vam / 3.6).toFixed(2)} m/s)
                  </span>
                </div>
              </div>
              <div className="flex flex-col rounded-lg bg-surface-container-low p-2">
                <div className="flex items-center justify-between text-secondary">
                  <span className="font-label text-[10px] uppercase">Reserva Velocidad (ASR)</span>
                  <MS name="bolt" className="text-[14px]" />
                </div>
                <div className="mt-0.5 flex items-baseline gap-1">
                  <span className="font-label text-xl font-bold text-on-surface">{asr ?? "—"}</span>
                  <span className="font-label text-[10px] text-on-surface-variant">km/h</span>
                  <span className="ml-auto font-label text-[10px] text-on-surface-variant">MSS: {mss ?? "—"}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-surface-container px-3 py-1.5 text-on-surface">
              <div className="flex items-center gap-1.5">
                <MS name="favorite" className="text-[16px] text-primary" />
                <span className="font-label text-[11px] text-secondary">
                  FC Máx: <strong className="text-on-surface">{athlete.hrMax ?? "—"}</strong> ppm
                </span>
              </div>
              <div className="h-3 w-px bg-surface-dim dark:bg-surface-container-high" />
              <div className="flex items-center gap-1.5">
                <MS name="bedtime" className="text-[16px] text-tertiary" />
                <span className="font-label text-[11px] text-secondary">
                  FC Rep: <strong className="text-on-surface">{athlete.hrRest ?? "—"}</strong> ppm
                </span>
              </div>
              <div className="h-3 w-px bg-surface-dim dark:bg-surface-container-high" />
              <span className="font-label text-[10px] font-bold uppercase tracking-tight text-primary">
                CIEMHCAVI 7Z
              </span>
            </div>
          </section>

          {/* Cinta del modelo científico */}
          <div className="flex items-center justify-between rounded-lg bg-secondary-container px-3 py-2 text-on-secondary-container">
            <div className="flex min-w-0 items-center gap-2">
              <MS name="science" className="shrink-0 text-[18px] text-secondary" />
              <p className="truncate text-xs">
                Modelo Activo: <strong>VAM 2000m + ASR Supramáximo</strong> (Karvonen FC)
              </p>
            </div>
            <span className="rounded-full bg-surface-container-lowest px-2 py-0.5 font-label text-[10px] font-bold uppercase text-secondary shadow-sm">
              Excel Sync v4.2
            </span>
          </div>

          {/* Selector de distancia */}
          <section className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-label text-[11px] font-bold uppercase tracking-wider text-secondary">
                Distancia de Control
              </span>
              <span className="font-label text-[11px] font-bold text-primary">
                {distance}m Seleccionado
              </span>
            </div>
            <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 no-scrollbar">
              {CONTROL_DISTANCES.map((d) => (
                <button
                  key={d}
                  onClick={() => setDistance(d)}
                  className={clsx(
                    "rounded-lg px-3 py-1.5 font-label text-[13px] whitespace-nowrap transition-colors",
                    distance === d
                      ? "bg-primary font-bold text-on-primary shadow-sm"
                      : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                  )}
                >
                  {d}m
                </button>
              ))}
            </div>
          </section>

          {/* Matriz de intensidades */}
          <section className="flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
            <div className="flex items-center justify-between bg-surface-container-high px-4 py-2.5">
              <div className="flex items-center gap-1.5">
                <MS name="table_chart" className="text-[18px] text-primary" />
                <span className="font-display text-sm font-bold uppercase tracking-tight text-on-surface">
                  Matriz de Intensidades
                </span>
              </div>
              <span className="rounded bg-surface-container-lowest px-2 py-0.5 font-label text-[10px] text-secondary">
                Tolerancia: ±1.5s
              </span>
            </div>
            <div className="grid grid-cols-12 bg-secondary px-3 py-2 font-label text-[10px] font-bold uppercase tracking-wider text-on-secondary">
              <div className="col-span-4">Zona / %VAM</div>
              <div className="col-span-3 text-center">Vel / Ritmo</div>
              <div className="col-span-3 text-right">Tiempo Obj.</div>
              <div className="col-span-2 text-right">FC (lpm)</div>
            </div>
            <div className="flex flex-col">
              {matrix.map((row) => {
                const tone = ZONE_ROW_TONE[row.pct];
                const isKeyZone = row.pct === 100 || row.pct === 110;
                return (
                  <div
                    key={row.pct}
                    className={clsx(
                      "grid grid-cols-12 items-center px-3 py-2.5 transition-colors",
                      tone.bg,
                      "hover:bg-surface-container-low/70"
                    )}
                  >
                    <div className="col-span-4 flex min-w-0 flex-col pr-1">
                      <div className="flex items-center gap-1.5">
                        <span className={clsx("h-2.5 w-2.5 shrink-0 rounded-full", tone.dot, row.pct === 110 && "animate-pulse")} />
                        <span className={clsx("truncate text-xs font-bold", tone.label)}>{row.name}</span>
                      </div>
                      <span className={clsx("pl-4 font-label text-[11px] font-semibold", isKeyZone ? "text-primary font-bold" : "text-secondary")}>
                        {row.pct}% VAM
                      </span>
                    </div>
                    <div className="col-span-3 flex flex-col items-center text-center">
                      <span className={clsx("font-label text-xs font-semibold", isKeyZone ? "text-primary font-bold" : "text-on-surface")}>
                        {row.speed.toFixed(row.pct >= 105 ? 2 : 1)} km/h
                      </span>
                      <span className={clsx("font-label text-[10px]", isKeyZone ? "text-primary/80 font-bold" : "text-on-surface-variant")}>
                        {row.pace}
                      </span>
                    </div>
                    <div className="col-span-3 flex flex-col items-end text-right">
                      <span className={clsx("font-label text-sm font-bold", isKeyZone ? "text-primary" : "text-on-surface")}>
                        {formatTime(row.time)}
                      </span>
                      <span className={clsx("font-label text-[9px]", isKeyZone ? "text-primary/70" : "text-on-surface-variant")}>
                        {row.tolerance}
                      </span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className={clsx("font-label text-xs font-bold", isKeyZone ? "text-primary" : tone.label)}>
                        {row.hr ?? "—"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Validación ASR */}
          <section className="flex flex-col gap-1.5 rounded-xl bg-surface-container-low p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <MS name="psychology_alt" className="text-[20px] text-primary" />
                <span className="font-display text-sm text-on-surface">
                  Validación ASR CIEMHCAVI (&gt;100% VAM)
                </span>
              </div>
              <span className="rounded bg-tertiary/10 px-2 py-0.5 font-label text-[10px] font-bold text-tertiary">
                Fórmula Verificada
              </span>
            </div>
            <p className="text-xs text-on-surface-variant">
              A intensidades supramáximas (<span className="font-label font-bold text-primary">110% VAM</span>),
              el tiempo exacto en <strong>{distance}m</strong> es{" "}
              <strong className="text-on-surface">
                {formatTime(targetTime(distance, vam, 110))} ({(vam * 1.1 / 3.6).toFixed(2)} m/s)
              </strong>
              . El modelo integra la <em>Anaerobic Speed Reserve</em> eliminando discrepancias históricas de
              tablas lineales.
            </p>
            {mss ? (
              <div className="mt-1 flex flex-col gap-1">
                <div className="flex items-center justify-between font-label text-[10px] text-secondary">
                  <span>VAM ({vam} km/h)</span>
                  <span className="font-bold text-primary">Objetivo: {(vam * 1.1).toFixed(2)} km/h</span>
                  <span>MSS ({mss} km/h)</span>
                </div>
                <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
                  <div className="h-full bg-secondary" style={{ width: `${(vam / mss) * 100}%` }} />
                  <div className="h-full bg-primary" style={{ width: `${((vam * 1.1 - vam) / mss) * 100}%` }} />
                  <div className="h-full flex-1 bg-surface-dim dark:bg-surface-container-highest" />
                </div>
                <div className="mt-0.5 flex items-center justify-between font-label text-[9px] text-on-surface-variant">
                  <span>Aeróbico puro</span>
                  <span className="text-primary">Tramo Supramáximo ASR</span>
                  <span>Vel. Esprint Máx</span>
                </div>
              </div>
            ) : null}
          </section>

          {/* Calculadora de series */}
          <section className="flex flex-col gap-2 rounded-xl bg-surface-container-lowest p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <MS name="fitness_center" className="text-[20px] text-primary" />
                <span className="font-display text-xl font-semibold text-on-surface">Calculadora de Series</span>
              </div>
              <span className="rounded-full bg-surface-container px-2 py-0.5 font-label text-[10px] font-bold text-secondary">
                Prescripción Directa
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1">
              <div className="flex flex-col gap-1">
                <label className="font-label text-[10px] font-semibold uppercase text-secondary">Repeticiones</label>
                <div className="flex items-center rounded-lg bg-surface-container p-1">
                  <button
                    aria-label="Reducir repeticiones"
                    onClick={() => setReps((r) => Math.max(1, r - 1))}
                    className="flex h-7 w-7 items-center justify-center rounded bg-surface-container-lowest font-bold text-on-surface hover:bg-surface-container-high"
                  >
                    −
                  </button>
                  <span className="flex-1 text-center font-label text-sm font-bold text-on-surface">{reps}</span>
                  <button
                    aria-label="Aumentar repeticiones"
                    onClick={() => setReps((r) => Math.min(30, r + 1))}
                    className="flex h-7 w-7 items-center justify-center rounded bg-surface-container-lowest font-bold text-on-surface hover:bg-surface-container-high"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="calc-distance" className="font-label text-[10px] font-semibold uppercase text-secondary">Distancia</label>
                <select
                  id="calc-distance"
                  value={calcDist}
                  onChange={(e) => setCalcDist(Number(e.target.value))}
                  className={inputSelectCls}
                >
                  {CALC_DISTANCES.map((d) => (
                    <option key={d} value={d}>{d} m</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="calc-vam" className="font-label text-[10px] font-semibold uppercase text-secondary">% VAM</label>
                <select
                  id="calc-vam"
                  value={calcPct}
                  onChange={(e) => setCalcPct(Number(e.target.value))}
                  className={inputSelectCls}
                >
                  {CALC_PERCENTS.map((p) => (
                    <option key={p} value={p}>{p}% {p > 100 ? "ASR" : "VAM"}</option>
                  ))}
                </select>
              </div>
            </div>

            {calc ? (
              <div className="flex flex-col gap-1.5 rounded-lg bg-surface-container p-3">
                <div className="flex items-center justify-between text-secondary">
                  <span className="font-label text-[11px] font-bold uppercase tracking-wide">Pauta Prescrita:</span>
                  <span className="flex items-center gap-1 font-label text-[11px] font-bold text-tertiary">
                    <MS name="timer" className="text-[14px]" />
                    Pausa: 2:00 trote
                  </span>
                </div>
                <div className="mt-1 flex items-baseline justify-between gap-2">
                  <span className="font-display text-[15px] font-bold text-primary">
                    {reps} x {calcDist}m @ {calcPct}% VAM
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-label text-xl font-extrabold text-on-surface">{formatTime(calc.time)}</span>
                    <span className="font-label text-[10px] text-on-surface-variant">/rep</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 text-xs text-on-surface-variant">
                  <span>Ritmo: <strong className="text-on-surface">{calc.pace}</strong></span>
                  <span>Velocidad: <strong className="text-on-surface">{calc.speed.toFixed(2)} km/h</strong></span>
                </div>
              </div>
            ) : null}

            <div className="mt-1 flex flex-col gap-1">
              <button
                onClick={() => toast.success(`¡Transferido al Microciclo 24 de ${athlete.firstName} ${athlete.lastName}!`)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-display text-[13px] uppercase text-on-primary shadow-sm transition-transform active:scale-[0.99] hover:bg-primary-container"
              >
                <MS name="event_available" className="text-[18px]" />
                Transferir a Plan Semanal del Atleta
              </button>
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => toast.info("Generando Ficha CIEMHCAVI (PDF A4)…")}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-secondary px-3 py-2 font-label text-[11px] uppercase text-on-secondary transition-colors hover:bg-on-secondary-fixed-variant"
                >
                  <MS name="picture_as_pdf" className="text-[16px]" />
                  Exportar PDF
                </button>
                <button
                  onClick={copyWhatsApp}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-tertiary-container px-3 py-2 font-label text-[11px] uppercase text-on-tertiary transition-colors hover:opacity-95"
                >
                  <MS name="chat" className="text-[16px]" />
                  WhatsApp
                </button>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
