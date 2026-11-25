"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import { useNavStore } from "@/store/nav-store";
import { MS } from "@/components/shared/ms";
import { Avatar } from "@/components/shared/avatar";
import { AthleteCombobox } from "@/components/shared/athlete-combobox";
import {
  analyzeLaps, computeVam, formatDateEs, formatPace, formatPacePrecise,
  formatTime, pacingStrategy, parseLapData, parseTimeInput,
} from "@/lib/sports-science";
import type { AthleteDetailDTO, AthleteListItem, Test2000DTO } from "@/lib/types";
import { cn as clsx } from "@/lib/utils";

/* ── Formulario de nuevo test ─────────────────────────────────────────────── */
function NewTestForm({
  athletes, onCreated, onAthleteChange,
}: {
  athletes: AthleteListItem[];
  onCreated: (athleteId: string) => void;
  onAthleteChange?: (athleteId: string | null) => void;
}) {
  const queryClient = useQueryClient();
  const testAthleteId = useNavStore((s) => s.testAthleteId);
  const [localAthleteId, setLocalAthleteId] = useState<string | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [timeStr, setTimeStr] = useState("");
  const [laps, setLaps] = useState(["", "", "", "", ""]);
  const [fcAvg, setFcAvg] = useState("");
  const [fcMax, setFcMax] = useState("");
  const [fcRec, setFcRec] = useState("");
  const [borg, setBorg] = useState(7);
  const [temp, setTemp] = useState("19");
  const [hum, setHum] = useState("78");
  const [wind, setWind] = useState("0.8");
  const [evaluator, setEvaluator] = useState("M.Sc. K. Rivera (CIEMHCAVI)");
  const [submitting, setSubmitting] = useState(false);

  // Derivación: selección local → selección global (store) → null
  const athleteId = localAthleteId ?? testAthleteId;

  const timeSeconds = useMemo(() => parseTimeInput(timeStr), [timeStr]);
  const vamPreview = timeSeconds && timeSeconds > 0 ? computeVam(timeSeconds) : null;

  const inputCls =
    "h-9 w-full rounded-lg bg-surface-container px-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-1 focus:ring-primary";
  const labelCls = "font-label text-[10px] font-semibold uppercase tracking-wider text-secondary";

  async function submit() {
    if (!athleteId) {
      toast.error("Selecciona el atleta evaluado.");
      return;
    }
    if (!timeSeconds || timeSeconds <= 0) {
      toast.error("Ingresa un tiempo válido para los 2000m (ej. 6:15).");
      return;
    }
    const lapTimes = laps.map((l) => parseTimeInput(l)).filter((v): v is number => v !== null && v > 0);
    if (lapTimes.length > 0 && lapTimes.length < 5) {
      toast.error("Completa los 5 parciales o deja todos vacíos.");
      return;
    }
    const lapSum = lapTimes.reduce((a, b) => a + b, 0);
    if (lapTimes.length === 5 && Math.abs(lapSum - timeSeconds) > 1.5) {
      toast.error(`La suma de parciales (${formatTime(lapSum)}) no coincide con el tiempo total.`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          athleteId,
          date: new Date(`${date}T07:00:00`).toISOString(),
          timeSeconds,
          lapTimes: lapTimes.length === 5 ? lapTimes : [],
          fcAvg: fcAvg ? parseInt(fcAvg) : undefined,
          fcMax: fcMax ? parseInt(fcMax) : undefined,
          fcRecovery: fcRec ? parseInt(fcRec) : undefined,
          borg,
          tempC: temp ? parseFloat(temp) : undefined,
          humidity: hum ? parseInt(hum) : undefined,
          windMs: wind ? parseFloat(wind) : undefined,
          evaluator,
          notes: "Test de Campo 2000m CIEMHCAVI",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al registrar");
      toast.success("Test registrado y certificado", {
        description: `VAM actualizada: ${json.vam} km/h · ${formatPace(json.vam)}`,
      });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["athlete"] });
      await queryClient.invalidateQueries({ queryKey: ["athletes"] });
      onCreated(athleteId);
      setTimeStr(""); setLaps(["", "", "", "", ""]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al registrar el test");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl bg-surface-container-lowest p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <MS name="add_task" className="text-[20px] text-primary" />
          <h3 className="font-display text-xl font-semibold text-on-surface">Registrar Test 2000m</h3>
        </div>
        <span className="rounded-full bg-tertiary-container px-2 py-0.5 font-label text-[10px] font-bold uppercase tracking-wider text-on-tertiary-container">
          Protocolo de campo
        </span>
      </div>

      <AthleteCombobox
        value={athleteId}
        onChange={(id) => {
          setLocalAthleteId(id);
          onAthleteChange?.(id);
        }}
        athletes={athletes}
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="col-span-2 flex flex-col gap-1">
          <label className={labelCls} htmlFor="test-time">Tiempo total 2000m (mm:ss.d)</label>
          <input
            id="test-time"
            value={timeStr}
            onChange={(e) => setTimeStr(e.target.value)}
            placeholder="6:15.0"
            inputMode="decimal"
            className={clsx(inputCls, "font-label text-base font-bold")}
          />
          {vamPreview ? (
            <span className="font-label text-[11px] font-bold text-tertiary">
              VAM: {vamPreview} km/h · {formatPace(vamPreview)} · {formatPacePrecise(vamPreview)}/km
            </span>
          ) : null}
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelCls} htmlFor="test-date">Fecha</label>
          <input id="test-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelCls} htmlFor="test-evaluator">Evaluador</label>
          <input id="test-evaluator" value={evaluator} onChange={(e) => setEvaluator(e.target.value)} className={inputCls} />
        </div>
      </div>

      <div>
        <span className={labelCls}>Parciales 400m (opcional)</span>
        <div className="mt-1 grid grid-cols-5 gap-1.5">
          {laps.map((l, i) => (
            <input
              key={i}
              value={l}
              onChange={(e) => setLaps((prev) => prev.map((p, j) => (j === i ? e.target.value : p)))}
              placeholder={`V${i + 1}`}
              aria-label={`Parcial vuelta ${i + 1}`}
              inputMode="decimal"
              className={clsx(inputCls, "px-1.5 text-center font-label text-[13px]")}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-1">
          <label className={labelCls} htmlFor="fc-avg">FC media (lpm)</label>
          <input id="fc-avg" value={fcAvg} onChange={(e) => setFcAvg(e.target.value)} placeholder="184" inputMode="numeric" className={inputCls} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelCls} htmlFor="fc-max">FC máxima (lpm)</label>
          <input id="fc-max" value={fcMax} onChange={(e) => setFcMax(e.target.value)} placeholder="196" inputMode="numeric" className={inputCls} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelCls} htmlFor="fc-rec">Recup. 1 min</label>
          <input id="fc-rec" value={fcRec} onChange={(e) => setFcRec(e.target.value)} placeholder="148" inputMode="numeric" className={inputCls} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className={labelCls}>Percepción de esfuerzo (Borg CR-10)</span>
          <span className="rounded bg-surface-container-lowest px-2 py-0.5 font-label text-lg font-bold text-primary shadow-sm">
            {borg.toFixed(1)} <span className="text-[11px] text-secondary">/10</span>
          </span>
        </div>
        <Slider
          value={[borg]}
          min={0}
          max={10}
          step={0.5}
          onValueChange={(v) => setBorg(v[0])}
          aria-label="Borg CR-10"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-1">
          <label className={labelCls} htmlFor="temp">Ambiente °C</label>
          <input id="temp" value={temp} onChange={(e) => setTemp(e.target.value)} inputMode="decimal" className={inputCls} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelCls} htmlFor="hum">Humedad %</label>
          <input id="hum" value={hum} onChange={(e) => setHum(e.target.value)} inputMode="numeric" className={inputCls} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelCls} htmlFor="wind">Viento m/s</label>
          <input id="wind" value={wind} onChange={(e) => setWind(e.target.value)} inputMode="decimal" className={inputCls} />
        </div>
      </div>

      <button
        onClick={submit}
        disabled={submitting}
        className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-display text-sm text-on-primary shadow-md transition-transform active:scale-[0.98] disabled:opacity-60"
      >
        <MS name="verified" className="text-[20px]" />
        {submitting ? "Certificando…" : "Certificar Test y Calcular VAM"}
      </button>
    </section>
  );
}

/* ── Gráfico dual SVG: ritmo + FC ─────────────────────────────────────────── */
function PacingChart({ times, fcs, fcEstimated }: { times: number[]; fcs: number[]; fcEstimated: boolean }) {
  if (times.length === 0) return null;
  const W = 340, H = 120, PAD_L = 20, PAD_R = 20, TOP = 18, BOTTOM = 104;
  const xs = times.map((_, i) => PAD_L + (i * (W - PAD_L - PAD_R)) / (times.length - 1));

  const paces = times.map((t) => (400 / t) * 60); // min/km
  const paceMin = Math.min(...paces), paceMax = Math.max(...paces);
  const paceY = paces.map((p) => {
    const norm = paceMax === paceMin ? 0.5 : (paceMax - p) / (paceMax - paceMin); // más rápido = más alto
    return BOTTOM - norm * (BOTTOM - TOP);
  });

  const fcValues = fcs.length === times.length && !fcEstimated
    ? fcs
    : times.map((_, i) => {
        const start = fcs[0] ?? 165, end = fcs[fcs.length - 1] ?? 190;
        return start + ((end - start) * i) / Math.max(times.length - 1, 1);
      });
  const fcMin = Math.min(...fcValues) - 6, fcMax = Math.max(...fcValues) + 4;
  const fcY = fcValues.map((f) => BOTTOM - ((f - fcMin) / (fcMax - fcMin)) * (BOTTOM - TOP));

  const fcPath = fcY.map((y, i) => `${xs[i]},${y.toFixed(1)}`).join(" ");
  const pacePath = paceY.map((y, i) => `${xs[i]},${y.toFixed(1)}`).join(" ");
  const areaPath = `${xs[0]},${BOTTOM} ${fcPath} ${xs[xs.length - 1]},${BOTTOM}`;

  return (
    <div className="relative overflow-hidden rounded-lg bg-surface-container-low p-2">
      <svg viewBox={`0 0 ${W} ${H + 8}`} className="h-32 w-full overflow-visible" role="img" aria-label="Curvas de ritmo y frecuencia cardíaca por vuelta">
        <defs>
          <linearGradient id="hrGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#970012" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#970012" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[TOP, (TOP + BOTTOM) / 2, BOTTOM].map((y) => (
          <line key={y} x1={PAD_L} x2={W - PAD_R} y1={y} y2={y} stroke="#dae2fd" strokeDasharray="3 3" strokeWidth="1" />
        ))}
        <polygon fill="url(#hrGrad)" points={areaPath} />
        <polyline fill="none" points={fcPath} stroke="#970012" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <polyline fill="none" points={pacePath} stroke="#3d627d" strokeWidth="2.5" strokeDasharray="4 2" strokeLinecap="round" strokeLinejoin="round" />
        {fcY.map((y, i) => (
          <circle key={`fc-${i}`} cx={xs[i]} cy={y} r={i === fcY.length - 1 ? 4.5 : 3.5} fill="#970012" stroke="#ffffff" strokeWidth="1.5" />
        ))}
        {paceY.map((y, i) => (
          <circle key={`p-${i}`} cx={xs[i]} cy={y} r={3} fill="#3d627d" stroke="#ffffff" strokeWidth="1.5" />
        ))}
        {xs.map((x, i) => (
          <text
            key={`x-${i}`}
            x={x}
            y={H + 4}
            textAnchor="middle"
            fontSize="9"
            fontFamily="JetBrains Mono, monospace"
            fill={i === xs.length - 1 ? "#970012" : "#5c403d"}
            fontWeight={i === xs.length - 1 ? "bold" : "normal"}
          >
            V{i + 1}
          </text>
        ))}
      </svg>
      {fcEstimated ? (
        <span className="absolute right-2 top-2 rounded bg-surface-container-lowest px-1.5 py-0.5 font-label text-[9px] font-bold text-secondary shadow-sm">
          FC interpolada
        </span>
      ) : null}
    </div>
  );
}

/* ── Análisis de un test ──────────────────────────────────────────────────── */
function TestAnalysis({ test, athlete }: { test: Test2000DTO; athlete: AthleteDetailDTO }) {
  const setTabRoute = useNavStore((s) => s.setTab);
  const setDosageAthlete = useNavStore((s) => s.setDosageAthlete);
  const openAthlete = useNavStore((s) => s.openAthlete);

  const lapData = parseLapData(test.lapTimes);
  const times = lapData.times.length === 5 ? lapData.times : [];
  const fcs = lapData.fcs;
  const analysis = useMemo(
    () => analyzeLaps(times, fcs.length === times.length ? fcs : times.map(() => null)),
    [times, fcs]
  );
  const strategy = pacingStrategy(analysis.idr);

  const vam = computeVam(test.timeSeconds);
  const prevTest = athlete.tests.find((t) => new Date(t.date) < new Date(test.date));
  const prevVam = prevTest ? computeVam(prevTest.timeSeconds) : null;
  const deltaSec = prevTest ? Math.round((prevTest.timeSeconds - test.timeSeconds) * 10) / 10 : null;
  const deltaVamPct = prevVam ? Math.round(((vam - prevVam) / prevVam) * 1000) / 10 : null;

  const fcAvg = test.fcAvg ?? null;
  const fcMax = test.fcMax ?? null;
  const fcRec = test.fcRecovery ?? null;
  const recDrop = fcMax !== null && fcRec !== null ? fcMax - fcRec : null;

  const date = new Date(test.date);

  return (
    <>
      {/* Cabecera de contexto */}
      <div className="flex flex-col gap-2 rounded-xl bg-surface-container-lowest p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar firstName={athlete.firstName} lastName={athlete.lastName} tone="primary" square />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1">
                <span className="truncate font-display text-xl text-on-surface">
                  {athlete.firstName} {athlete.lastName}
                </span>
                <span className="rounded bg-secondary-fixed px-1.5 py-0.5 font-label text-[11px] font-semibold uppercase tracking-wider text-on-secondary-fixed">
                  {athlete.code}
                </span>
              </div>
              <p className="truncate text-sm text-secondary">{test.venue ?? "Pista Sintética CIEMHCAVI"}</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end">
            <span className="font-label text-[11px] text-on-surface-variant">{formatDateEs(date)}</span>
            <span className="font-label text-[11px] font-bold text-primary">
              {date.toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>
        {test.tempC !== null || test.windMs !== null ? (
          <div className="grid grid-cols-3 gap-1.5">
            <div className="flex items-center gap-1.5 rounded-lg bg-surface-container-low px-2 py-1.5">
              <MS name="thermostat" className="text-[16px] text-secondary" />
              <div className="flex flex-col">
                <span className="font-label text-[10px] uppercase leading-none text-secondary">Ambiente</span>
                <span className="font-label text-[13px] font-semibold leading-tight text-on-surface">
                  {test.tempC ?? "—"}°C · {test.humidity ?? "—"}% HR
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-surface-container-low px-2 py-1.5">
              <MS name="air" className="text-[16px] text-secondary" />
              <div className="flex flex-col">
                <span className="font-label text-[10px] uppercase leading-none text-secondary">Viento</span>
                <span className="font-label text-[13px] font-semibold leading-tight text-on-surface">
                  {test.windMs ?? "—"} m/s {test.windMs !== null && test.windMs < 2 ? "Calmo" : ""}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-surface-container-low px-2 py-1.5">
              <MS name="verified_user" className="text-[16px] text-secondary" />
              <div className="flex flex-col">
                <span className="font-label text-[10px] uppercase leading-none text-secondary">Resp.</span>
                <span className="truncate font-label text-[13px] font-semibold leading-tight text-on-surface">
                  {test.evaluator ?? "CIEMHCAVI"}
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Resultado global */}
      <div className="flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <MS name="timer" className="text-[20px] text-primary" />
            <span className="font-display text-xl font-semibold text-on-surface">Resultado Global 2000m</span>
          </div>
          <span className="rounded-full bg-tertiary-container px-2 py-0.5 font-label text-[11px] font-bold uppercase tracking-wider text-on-tertiary-container">
            Protocolo Válido
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col justify-between rounded-xl bg-primary/5 p-4">
            <div className="mb-1 flex items-center justify-between text-primary">
              <span className="font-label text-[11px] font-bold uppercase tracking-wider">Tiempo Final</span>
              <MS name="pace" className="text-[18px]" />
            </div>
            <div className="font-label text-[2rem] font-bold leading-none tracking-tight text-primary">
              {formatTime(test.timeSeconds)}
            </div>
            <div className="mt-1 font-label text-[11px] font-semibold text-primary/80">
              {Math.floor(test.timeSeconds / 60)} min {(test.timeSeconds % 60).toFixed(1)} s oficial
            </div>
          </div>
          <div className="flex flex-col justify-between rounded-xl bg-surface-container-low p-4">
            <div className="mb-1 flex items-center justify-between text-secondary">
              <span className="font-label text-[11px] font-bold uppercase tracking-wider">Ritmo Prom.</span>
              <MS name="speed" className="text-[18px]" />
            </div>
            <div className="font-label text-[2rem] font-bold leading-none tracking-tight text-on-surface">
              {formatPacePrecise(vam)}
            </div>
            <div className="mt-1 font-label text-[11px] font-semibold text-secondary">
              min/km · {vam.toFixed(2)} km/h
            </div>
          </div>
        </div>

        {/* Gauges cardiovasculares */}
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { label: "FC Media", value: fcAvg, pct: fcAvg && athlete.hrMax ? Math.round((fcAvg / athlete.hrMax) * 100) : null, tone: "bg-secondary", text: "text-on-surface" },
            { label: "FC Máxima", value: fcMax, pct: fcMax && athlete.hrMax ? Math.round((fcMax / athlete.hrMax) * 100) : null, tone: "bg-primary", text: "text-primary" },
            { label: "Recup. 1 min", value: fcRec, pct: recDrop !== null ? Math.min(Math.round((recDrop / 60) * 100) + 20, 100) : null, tone: "bg-tertiary", text: "text-tertiary" },
          ].map((g) => (
            <div key={g.label} className="flex flex-col rounded-lg bg-surface-container-low p-2">
              <span className="font-label text-[10px] font-bold uppercase tracking-wider text-secondary">{g.label}</span>
              <div className="mt-0.5 flex items-baseline gap-1">
                <span className={clsx("font-label text-xl font-semibold", g.text)}>{g.value ?? "—"}</span>
                <span className="font-label text-[10px] text-secondary">
                  {g.label === "Recup. 1 min" && recDrop !== null ? `-${recDrop} lpm` : "lpm"}
                </span>
              </div>
              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-surface-container-high">
                <div className={clsx("h-1 rounded-full", g.tone)} style={{ width: `${g.pct ?? 0}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Borg */}
        {test.borg !== null ? (
          <div className="flex items-center justify-between gap-2 rounded-lg bg-surface-container-low px-4 py-2">
            <div className="flex items-center gap-2">
              <MS name="replace_video" className="text-[20px] text-primary" />
              <div className="flex flex-col">
                <span className="font-label text-[11px] font-bold uppercase text-on-surface">
                  Percepción Esfuerzo (Borg CR-10)
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  {test.borg >= 9 ? "Fatiga neuromuscular y ventilatoria casi máxima" : test.borg >= 7 ? "Esfuerzo alto sostenido" : "Esfuerzo moderado-alto"}
                </span>
              </div>
            </div>
            <div className="flex items-baseline gap-1 rounded-sm bg-surface-container-lowest px-2 py-1 shadow-sm">
              <span className="font-label text-xl font-semibold text-primary">{test.borg.toFixed(1)}</span>
              <span className="font-label text-[11px] font-bold text-secondary">/10</span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Curvas */}
      {times.length === 5 ? (
        <div className="flex flex-col gap-2 rounded-xl bg-surface-container-lowest p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-display text-xl font-semibold text-on-surface">Curvas de Pacing y Carga</span>
              <span className="text-[11px] text-secondary">
                Evolución de Ritmo (min/km) vs Frecuencia Cardíaca (lpm)
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="flex items-center gap-1 font-label text-[10px] text-secondary">
                <span className="h-2.5 w-2.5 rounded-full bg-secondary" /> Ritmo
              </span>
              <span className="flex items-center gap-1 font-label text-[10px] text-primary">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" /> FC
              </span>
            </div>
          </div>
          <PacingChart times={times} fcs={fcs} fcEstimated={lapData.fcEstimated} />
          <div className="flex items-center justify-between px-1 font-label text-[11px] text-on-surface-variant">
            <span>Sprint inicial reactivo ({analysis.laps[0]?.pace.replace("/km", "")})</span>
            {fcMax ? (
              <span className="font-bold text-primary">Kick final a {fcMax} lpm</span>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Matriz de parciales */}
      {times.length === 5 ? (
        <div className="flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
          <div className="flex items-center justify-between p-4 pb-1">
            <div className="flex items-center gap-1.5">
              <MS name="splitscreen" className="text-[20px] text-secondary" />
              <span className="font-display text-xl font-semibold text-on-surface">Matriz de Parciales 400m</span>
            </div>
            <span className="font-label text-[11px] text-secondary">5x400m · 2000m</span>
          </div>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-surface-container-high font-label text-[11px] uppercase tracking-wider text-on-surface">
                  <th className="px-3 py-2.5">Parcial</th>
                  <th className="px-2 py-2.5 text-right">Tiempo</th>
                  <th className="px-2 py-2.5 text-right">Acum.</th>
                  <th className="px-2 py-2.5 text-right">Ritmo</th>
                  <th className="px-3 py-2.5 text-right">FC</th>
                </tr>
              </thead>
              <tbody className="font-label text-[13px]">
                {analysis.laps.map((lap) => {
                  const isFastest = lap.index === analysis.fastest.index;
                  const isSlowest = lap.index === analysis.slowest.index;
                  const isLast = lap.index === analysis.laps.length;
                  return (
                    <tr key={lap.index} className="bg-surface-container-lowest transition-colors hover:bg-surface-container-low">
                      <td className="flex items-center gap-1.5 px-3 py-2 font-semibold text-on-surface">
                        <span
                          className={clsx(
                            "flex h-5 w-5 items-center justify-center rounded-full font-label text-[10px] font-bold",
                            isLast ? "bg-primary text-on-primary"
                              : isSlowest ? "bg-error-container text-on-error-container"
                              : isFastest ? "bg-secondary-fixed text-on-secondary-fixed"
                              : "bg-surface-container-high text-on-surface"
                          )}
                        >
                          {lap.index}
                        </span>
                        <span>{lap.from}-{lap.to}m</span>
                      </td>
                      <td className={clsx("px-2 py-2 text-right font-semibold", isFastest ? "text-tertiary" : isSlowest ? "text-error" : "text-on-surface")}>
                        {formatTime(lap.time)}
                      </td>
                      <td className="px-2 py-2 text-right text-secondary">{formatTime(lap.cum)}</td>
                      <td className={clsx("px-2 py-2 text-right font-semibold", isLast ? "text-primary" : "text-on-surface")}>
                        {lap.pace.replace("/km", "")}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {lap.fc ? (
                          <span className={clsx(
                            "rounded px-1.5 py-0.5 font-label text-[11px]",
                            isLast ? "bg-primary text-on-primary" : "bg-secondary-container text-on-secondary-container"
                          )}>
                            {lap.fc}
                          </span>
                        ) : (
                          <span className="font-label text-[11px] text-on-surface-variant">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between bg-surface-container-low px-4 py-2 text-secondary">
            <span className="font-label text-[11px]">Vel. Rango: {analysis.speedRangeMs}</span>
            {analysis.finalSprintDelta !== null && analysis.finalSprintDelta > 0 ? (
              <span className="font-label text-[11px] font-bold text-tertiary">
                Sprint Final: +{analysis.finalSprintDelta.toFixed(2)} m/s delta
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Diagnóstico fisiológico */}
      <div className="flex flex-col gap-2 rounded-xl bg-surface-container-lowest p-4 shadow-sm">
        <div className="flex items-center gap-1.5">
          <MS name="science" className="text-[20px] text-primary" />
          <span className="font-display text-xl font-semibold text-on-surface">Cálculo Fisiológico CIEMHCAVI</span>
        </div>
        {times.length === 5 ? (
          <>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="flex flex-col justify-between rounded-lg bg-surface-container-low p-2">
                <span className="font-label text-[10px] font-bold uppercase text-secondary">Parcial Más Rápido</span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="font-display text-xl text-tertiary">Vuelta {analysis.fastest.index}</span>
                  <span className="font-label text-[13px] font-bold text-tertiary">{formatTime(analysis.fastest.time)}</span>
                </div>
                <span className="mt-0.5 text-[11px] text-secondary">
                  {analysis.fastest.speedMs.toFixed(2)} m/s · {analysis.fastest.speedKmh.toFixed(2)} km/h
                </span>
              </div>
              <div className="flex flex-col justify-between rounded-lg bg-surface-container-low p-2">
                <span className="font-label text-[10px] font-bold uppercase text-secondary">Parcial Más Lento</span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="font-display text-xl text-error">Vuelta {analysis.slowest.index}</span>
                  <span className="font-label text-[13px] font-bold text-error">{formatTime(analysis.slowest.time)}</span>
                </div>
                <span className="mt-0.5 text-[11px] text-secondary">
                  {analysis.slowest.speedMs.toFixed(2)} m/s · {analysis.slowest.speedKmh.toFixed(2)} km/h
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 rounded-xl bg-surface-container-high p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <MS name="difference" className="text-[18px] text-primary" />
                  <span className="font-sans text-[17px] font-bold text-on-surface">Índice de Variabilidad (IDR)</span>
                </div>
                <span className="font-label text-xl font-bold text-primary">{analysis.idr?.toFixed(1)}%</span>
              </div>
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface-container-lowest">
                <div className="h-full bg-tertiary" style={{ width: "50%" }} title="Excelente (<6%)" />
                <div className="h-full bg-secondary" style={{ width: "30%" }} title="Aceptable (6-9%)" />
                <div className="h-full bg-error" style={{ width: "20%" }} title="Irregular (>9%)" />
              </div>
              <div className="flex items-center justify-between px-0.5 font-label text-[10px] text-secondary">
                <span className={clsx("font-bold", strategy.tone === "tertiary" ? "text-tertiary" : strategy.tone === "error" ? "text-error" : "text-secondary")}>
                  ● {strategy.label}
                </span>
                {analysis.netDiff !== null ? <span>Diferencia Neta: {analysis.netDiff.toFixed(1)} seg</span> : null}
              </div>
              <p className="mt-1 text-sm leading-snug text-on-surface-variant">
                El atleta sostuvo el ritmo aeróbico máximo con una caída contenida en los{" "}
                1200-1600m y posterior reactivación anaeróbica en Vuelta 5. Perfil de resistencia
                específico óptimo para 5K / 10K.
              </p>
            </div>
          </>
        ) : (
          <p className="text-sm text-on-surface-variant">
            Sin parciales registrados: el diagnóstico de variabilidad requiere las 5 vueltas de 400m.
          </p>
        )}
        <div className="flex items-start gap-2 rounded-lg bg-surface-container-low p-2">
          <MS name="menu_book" className="mt-0.5 shrink-0 text-[18px] text-secondary" />
          <div className="flex flex-col">
            <span className="font-label text-[10px] font-bold uppercase tracking-wider text-secondary">
              Trazabilidad Metodológica Institucional
            </span>
            <code className="mt-0.5 rounded bg-surface-container-highest px-1 py-0.5 font-label text-[10px] text-on-surface">
              Fórmula CIEMHCAVI v2.1: Vel = Dist / Tiempo; IDR = [(T_lento − T_rápido) / T_rápido] × 100
            </code>
          </div>
        </div>
      </div>

      {/* Comparación anterior */}
      {prevTest ? (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-secondary-container/40 p-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-on-secondary">
              <MS name="trending_up" className="text-[22px]" />
            </div>
            <div className="min-w-0">
              <span className="truncate font-sans text-[17px] font-semibold text-on-surface">Comparación Test Anterior</span>
              <span className="block truncate text-sm text-secondary">
                Test {formatDateEs(prevTest.date)}: {formatTime(prevTest.timeSeconds)} (Mejora: {deltaSec !== null && deltaSec >= 0 ? "-" : "+"}{Math.abs(deltaSec ?? 0).toFixed(1)} seg)
              </span>
            </div>
          </div>
          {deltaVamPct !== null ? (
            <div className="flex shrink-0 items-center justify-center rounded-sm bg-tertiary-fixed px-2.5 py-1 font-label text-[13px] font-bold text-on-tertiary-fixed">
              {deltaVamPct >= 0 ? "+" : ""}{deltaVamPct}% VAM
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Acciones */}
      <div className="flex flex-col gap-1.5">
        <button
          onClick={() => {
            setDosageAthlete(athlete.id);
            setTabRoute("dosificacion");
            toast.success(`VAM actualizada: ${vam.toFixed(2)} km/h en Matriz de Entrenamiento.`);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-display text-sm text-on-primary shadow-md transition-transform active:scale-[0.98]"
        >
          <MS name="tune" className="text-[20px]" />
          Aplicar a Matriz de Dosificación
        </button>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => openAthlete(athlete.id)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-surface-container-lowest px-2 py-2.5 font-sans text-[17px] text-on-surface shadow-sm transition-colors hover:bg-surface-container"
          >
            <MS name="compare_arrows" className="text-[18px] text-secondary" />
            <span className="truncate">Ver Histórico</span>
          </button>
          <button
            onClick={() => toast.info("Generando expediente oficial CIEMHCAVI UNA…")}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-surface-container-lowest px-2 py-2.5 font-sans text-[17px] text-on-surface shadow-sm transition-colors hover:bg-surface-container"
          >
            <MS name="picture_as_pdf" className="text-[18px] text-primary" />
            <span className="truncate">Reporte PDF UNA</span>
          </button>
        </div>
      </div>
    </>
  );
}

/* ── Vista principal ──────────────────────────────────────────────────────── */
export function TestView() {
  const testAthleteId = useNavStore((s) => s.testAthleteId);
  const setTestAthleteId = useNavStore((s) => s.setTestAthlete);
  const focusTestId = useNavStore((s) => s.focusTestId);
  const setFocusTest = useNavStore((s) => s.setFocusTest);
  const [localAthleteId, setLocalAthleteId] = useState<string | null>(null);

  const { data: athletesData } = useQuery<{ athletes: AthleteListItem[] }>({
    queryKey: ["athletes", "all"],
    queryFn: async () => {
      const res = await fetch("/api/athletes");
      if (!res.ok) throw new Error("Error al cargar atletas");
      return res.json();
    },
  });
  const athletes = useMemo(
    () => (athletesData?.athletes ?? []).sort((a, b) => (b.tests[0]?.date ?? "").localeCompare(a.tests[0]?.date ?? "")),
    [athletesData]
  );

  const effectiveId = localAthleteId ?? testAthleteId ?? athletes[0]?.id ?? null;

  const { data: detail, isLoading } = useQuery<{ athlete: AthleteDetailDTO }>({
    queryKey: ["athlete", effectiveId],
    queryFn: async () => {
      const res = await fetch(`/api/athletes/${effectiveId}`);
      if (!res.ok) throw new Error("Error al cargar el expediente");
      return res.json();
    },
    enabled: !!effectiveId,
  });

  const tests = detail?.athlete.tests ?? [];
  const focusTest = (focusTestId ? tests.find((t) => t.id === focusTestId) : undefined) ?? tests[0];

  return (
    <div className="flex flex-col gap-4">
      <NewTestForm
        athletes={athletes}
        onAthleteChange={(id) => {
          setLocalAthleteId(id);
          setTestAthleteId(id);
          setFocusTest(null);
        }}
        onCreated={(athleteId) => {
          setLocalAthleteId(athleteId);
          setTestAthleteId(athleteId);
          setFocusTest(null);
        }}
      />

      {/* Selector de test histórico */}
      {tests.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <span className="font-label text-[11px] font-bold uppercase tracking-wider text-secondary">
            Análisis de tests registrados
          </span>
          <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 no-scrollbar">
            {tests.map((t, i) => {
              const active = focusTest?.id === t.id;
              const vam = computeVam(t.timeSeconds);
              return (
                <button
                  key={t.id}
                  onClick={() => setFocusTest(t.id)}
                  className={clsx(
                    "flex flex-col items-start rounded-lg px-3 py-1.5 whitespace-nowrap transition-colors",
                    active
                      ? "bg-primary text-on-primary shadow-sm"
                      : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                  )}
                >
                  <span className="font-label text-[12px] font-bold">{formatTime(t.timeSeconds)}</span>
                  <span className={clsx("font-label text-[10px]", active ? "text-on-primary/80" : "text-secondary")}>
                    {formatDateEs(t.date)} · {vam.toFixed(1)} km/h
                  </span>
                  {i === 0 ? (
                    <span className={clsx("font-label text-[9px] font-bold uppercase", active ? "text-on-primary" : "text-tertiary")}>
                      ● Más reciente
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div className="h-64 animate-pulse rounded-xl bg-surface-container" aria-busy="true" />
      ) : focusTest && detail?.athlete ? (
        <TestAnalysis test={focusTest} athlete={detail.athlete} />
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-xl bg-surface-container-lowest p-8 text-center shadow-sm">
          <MS name="timer_off" className="text-[32px] text-on-surface-variant" />
          <p className="text-sm text-on-surface-variant">
            Este atleta aún no tiene tests registrados. Registra el primer Test 2000m para habilitar el análisis.
          </p>
        </div>
      )}
    </div>
  );
}
