"use client";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavStore } from "@/store/nav-store";
import { MS } from "@/components/shared/ms";
import { Avatar } from "@/components/shared/avatar";
import { SPECIALTIES, formatPace, formatDateEs, formatTime } from "@/lib/sports-science";
import type { DashboardDTO } from "@/lib/types";
import { cn as clsx } from "@/lib/utils";

const PERIODS = [
  { value: "2025-Q1", label: "Macro 2025 · Ciclo Pre-Competitivo" },
  { value: "2025-Q2", label: "Macro 2025 · Ciclo Específico" },
  { value: "2024-Q4", label: "Histórico 2024 · Consolidado" },
];

const SPEC_META: Record<string, { color: string; text: string }> = {
  MARATON: { color: "bg-primary", text: "text-primary" },
  MEDIO_FONDO: { color: "bg-secondary", text: "text-secondary" },
  "10K_5K": { color: "bg-tertiary", text: "text-tertiary" },
  TRAIL_SALUD: { color: "bg-surface-dim dark:bg-secondary-fixed-dim", text: "text-on-surface-variant" },
};

const CHIP: Record<string, string> = {
  MARATON: "bg-tertiary-container text-on-tertiary-container",
  MEDIO_FONDO: "bg-secondary-container text-on-secondary-container",
  "10K_5K": "bg-error-container text-on-error-container",
  TRAIL_SALUD: "bg-surface-container-high text-secondary",
};

function useDashboard() {
  return useQuery<DashboardDTO>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Error al cargar el panel");
      return res.json();
    },
  });
}

/** 1. Tarjeta institucional y contexto temporal. */
function InstitutionCard() {
  return (
    <section className="relative overflow-hidden rounded-xl bg-surface-container p-4 shadow-sm">
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 blur-xl" />
      <div className="relative z-10 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 font-label text-[11px] font-semibold uppercase tracking-widest text-on-secondary">
              Periodo Activo
            </span>
            <span className="inline-flex items-center gap-1 font-label text-[11px] font-semibold text-secondary">
              <MS name="schedule" className="text-[14px]" /> San José (UTC-6)
            </span>
          </div>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-on-surface">
            Laboratorio CIEMHCAVI
          </h2>
          <p className="text-sm text-on-surface-variant">
            Gestión Fisiológica y Rendimiento de Atletas UNA
          </p>
        </div>
        <div className="flex items-center gap-2 self-stretch rounded-lg bg-surface-container-lowest px-3 py-1.5 shadow-sm sm:self-auto">
          <MS name="calendar_month" className="text-[18px] text-primary" />
          <select
            aria-label="Seleccionar Macrociclo"
            className="cursor-pointer bg-transparent pr-2 font-label text-[13px] font-semibold text-on-surface focus:outline-none"
            onChange={(e) => {
              const label = e.target.options[e.target.selectedIndex].text;
              toast(`Sincronizando: ${label}`);
            }}
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}

/** 2. Alertas fisiológicas y carga de entrenamiento. */
function VigilanceCard({ data }: { data: DashboardDTO }) {
  const { alerts } = data;
  const injury = alerts.injury[0];
  const rpeCount = alerts.rpe.length;
  const acwrNames = alerts.acwr.map((a) => a.name).join(" y ");

  return (
    <section className="flex flex-col gap-2 rounded-xl bg-surface-container-lowest p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary" />
          <h3 className="font-display text-xl font-semibold text-on-surface">
            Vigilancia Médica &amp; Sobrecarga
          </h3>
        </div>
        <span className="rounded-full bg-primary-fixed px-2 py-0.5 font-label text-[11px] font-bold text-primary">
          {alerts.totalCases} Casos Activos
        </span>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          onClick={() => toast.info("Reporte kinesiológico solicitado", { description: "El equipo de salud recibió la solicitud de evaluación." })}
          className="flex items-start gap-3 rounded-lg bg-surface-container-high p-3 text-left transition-transform active:scale-[0.99]"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-error text-on-error">
            <MS name="medical_services" className="text-[20px]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <span className="font-label text-[11px] font-bold uppercase text-error">
                Molestia / RPE Crítico
              </span>
              <span className="font-label text-[11px] text-on-surface-variant">
                {injury ? 1 + rpeCount : rpeCount} Atletas
              </span>
            </div>
            <p className="mt-0.5 truncate text-sm text-on-surface">
              {injury && `${injury.name} (${injury.detail?.split("(")[0].trim()})`}
              {injury && rpeCount > 0 ? " y " : ""}
              {rpeCount > 0 && `${rpeCount} atletas con RPE > 8`}
            </p>
            <div className="mt-1 flex cursor-pointer items-center gap-1 font-label text-[11px] text-primary hover:underline">
              <span>Ver reporte kinesiológico</span>
              <MS name="arrow_forward" className="text-[14px]" />
            </div>
          </div>
        </button>
        <button
          onClick={() => toast.info("Reajuste de microciclo sugerido", { description: "Se reduce el volumen agudo 12% en los atletas marcados." })}
          className="flex items-start gap-3 rounded-lg bg-surface-container-high p-3 text-left transition-transform active:scale-[0.99]"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary">
            <MS name="warning" className="text-[20px]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <span className="font-label text-[11px] font-bold uppercase text-on-primary-fixed-variant">
                Riesgo ACWR &gt; 1.45
              </span>
              <span className="font-label text-[11px] text-on-surface-variant">
                {alerts.acwr.length} Atletas
              </span>
            </div>
            <p className="mt-0.5 truncate text-sm text-on-surface">
              Picos agudos de kilometraje: {acwrNames}
            </p>
            <div className="mt-1 flex cursor-pointer items-center gap-1 font-label text-[11px] text-secondary hover:underline">
              <span>Reajustar microciclo</span>
              <MS name="tune" className="text-[14px]" />
            </div>
          </div>
        </button>
      </div>
    </section>
  );
}

/** 3. Métricas maestras (bento grid). */
function MasterMetrics({ data }: { data: DashboardDTO }) {
  const m = data.metrics;
  const cards = [
    {
      label: "Atletas Totales", icon: "directions_run", value: m.totalAthletes,
      sub: `${m.activeFull} Activos Plenos`, subTone: "text-tertiary",
      progress: Math.round((m.activeFull / m.totalAthletes) * 100), bar: "bg-secondary",
      foot: `${m.transitionLow} transición/baja`, tone: "text-secondary",
    },
    {
      label: "Evaluaciones", icon: "timer", value: m.evaluationsMonth,
      sub: `+${m.pendingDosage} pendientes ciclo`, subTone: "text-on-surface-variant",
      progress: Math.round(((m.evaluationsMonth) / (m.evaluationsMonth + m.pendingDosage)) * 100), bar: "bg-primary",
      foot: "Próx: Test 2000m pista", tone: "text-primary",
    },
    {
      label: "Planes Vigor", icon: "assignment_turned_in", value: m.plansVigentes,
      sub: `${m.pendingDosage} por dosificar`, subTone: "text-error",
      progress: Math.round((m.plansVigentes / m.activeFull) * 100), bar: "bg-tertiary",
      foot: `${m.adherence}% adherencia semanal`, tone: "text-tertiary",
    },
    {
      label: "Competiciones", icon: "emoji_events", value: m.competitions,
      sub: `${m.goalRunners} corredores meta`, subTone: "text-secondary",
      progress: 100, bar: "bg-secondary-fixed-dim",
      foot: "Valencia / SJ / Univ.", tone: "text-secondary",
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="flex flex-col justify-between rounded-xl bg-surface-container-lowest p-4 shadow-sm">
          <div className={`flex items-center justify-between ${c.tone}`}>
            <span className="font-label text-[11px] font-bold uppercase tracking-wider">{c.label}</span>
            <MS name={c.icon} className="text-[20px]" />
          </div>
          <div className="my-2">
            <div className="font-label text-[2rem] font-bold leading-none text-on-surface">{c.value}</div>
            <div className={clsx("mt-1 flex items-center gap-1 font-label text-[11px] font-semibold", c.subTone)}>
              {c.label === "Atletas Totales" && <span className="h-2 w-2 rounded-full bg-tertiary" />}
              {c.sub}
            </div>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
            <div className={clsx("h-1.5 rounded-full", c.bar)} style={{ width: `${c.progress}%` }} />
          </div>
          <span className="mt-1.5 font-label text-[11px] text-on-surface-variant">{c.foot}</span>
        </div>
      ))}
    </div>
  );
}

/** 4. Distribución por especialidad + 5. Macrociclos. */
function DistributionCard({ data }: { data: DashboardDTO }) {
  const total = Object.values(data.specialties).reduce((a, b) => a + b, 0);
  const order: (keyof typeof SPEC_META)[] = ["MARATON", "MEDIO_FONDO", "10K_5K", "TRAIL_SALUD"];
  return (
    <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h4 className="font-display text-xl font-semibold text-on-surface">Especialidades Fisiológicas</h4>
          <p className="text-sm text-on-surface-variant">Población total evaluada</p>
        </div>
        <span className="rounded bg-surface-container px-2 py-1 font-label text-[11px] font-bold text-secondary">
          {total} Total
        </span>
      </div>
      <div className="mb-4 flex h-3 w-full overflow-hidden rounded-full bg-surface-container">
        {order.map((spec) => {
          const count = data.specialties[spec] ?? 0;
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div
              key={spec}
              className={SPEC_META[spec].color}
              style={{ width: `${pct}%` }}
              title={`${SPECIALTIES[spec].label} ${Math.round(pct)}%`}
            />
          );
        })}
      </div>
      <div className="flex flex-col gap-2">
        {order.map((spec) => {
          const count = data.specialties[spec] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={spec} className="flex items-center justify-between rounded bg-surface-container-low p-2 transition-colors hover:bg-surface-container">
              <div className="flex items-center gap-2">
                <span className={clsx("h-3 w-3 shrink-0 rounded-full", SPEC_META[spec].color)} />
                <span className="text-sm font-semibold text-on-surface">{SPECIALTIES[spec].label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-label text-[11px] text-on-surface-variant">{count} atletas</span>
                <span className={clsx("font-label text-[11px] font-bold", SPEC_META[spec].text)}>{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MacrocycleCard({ data }: { data: DashboardDTO }) {
  const toneMap: Record<string, { chip: string; bar: string }> = {
    secondary: { chip: "bg-secondary-fixed text-on-secondary-fixed", bar: "bg-secondary" },
    tertiary: { chip: "bg-tertiary-container text-on-tertiary-container", bar: "bg-tertiary" },
    primary: { chip: "bg-primary-fixed text-on-primary-fixed", bar: "bg-primary" },
  };
  return (
    <div className="flex flex-col justify-between rounded-xl bg-surface-container-lowest p-4 shadow-sm">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h4 className="font-display text-xl font-semibold text-on-surface">Macrociclos en Disputa</h4>
            <p className="text-sm text-on-surface-variant">Enfoque competitivo 2025</p>
          </div>
          <MS name="flag" className="text-[22px] text-secondary" />
        </div>
        <div className="flex flex-col gap-2.5">
          {data.macrocycles.map((mc) => {
            const tone = toneMap[mc.colorKey] ?? toneMap.secondary;
            const pct = Math.round((mc.week / mc.totalWeeks) * 100);
            return (
              <div key={mc.id} className="flex flex-col gap-1.5 rounded-lg bg-surface-container-low p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-sans text-[17px] font-bold text-on-surface">{mc.name}</span>
                  <span className={clsx("rounded px-2 py-0.5 font-label text-[11px] font-bold whitespace-nowrap", tone.chip)}>
                    {mc.athletes} Atletas
                  </span>
                </div>
                <div className="flex items-center justify-between font-label text-[11px] text-on-surface-variant">
                  <span className="truncate">Fase: {mc.phase}</span>
                  <span className="whitespace-nowrap">Semana {mc.week} de {mc.totalWeeks}</span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-surface-container">
                  <div className={clsx("h-1 rounded-full", tone.bar)} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** 6. Accesos rápidos de operación táctica. */
function QuickActions() {
  const setTab = useNavStore((s) => s.setTab);
  const setMoreDialog = useNavStore((s) => s.setMoreDialog);
  const actions = [
    {
      label: "Nuevo Test 2000m", sub: "Calculador VAM", icon: "timer",
      cls: "bg-primary text-on-primary hover:bg-primary/95", onClick: () => setTab("test-2000m"),
    },
    {
      label: "Dosificar Atleta", sub: "Zonas fisiológicas", icon: "vital_signs",
      cls: "bg-secondary text-on-secondary hover:bg-secondary/95", onClick: () => setTab("dosificacion"),
    },
    {
      label: "Importar Excel", sub: "Histórico CIEMHCAVI", icon: "upload_file",
      cls: "bg-surface-container text-on-surface hover:bg-surface-container-high", onClick: () => { setMoreDialog("import"); setTab("menu-mas"); },
    },
    {
      label: "Consultar IA", sub: "Asistente metabólico", icon: "psychology",
      cls: "bg-tertiary text-on-tertiary hover:bg-tertiary/95", onClick: () => { setMoreDialog("ai"); setTab("menu-mas"); },
    },
  ];
  return (
    <section className="rounded-xl bg-surface-container-lowest p-4 shadow-sm">
      <h4 className="mb-3 font-display text-xl font-semibold text-on-surface">Acciones Inmediatas</h4>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={a.onClick}
            className={clsx(
              "group flex flex-col items-center justify-center rounded-xl p-3 text-center shadow-sm transition-all active:scale-95",
              a.cls
            )}
          >
            <div className="mb-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
              <MS name={a.icon} className="text-[24px]" />
            </div>
            <span className="font-display text-[13px] font-bold">{a.label}</span>
            <span className={clsx("mt-0.5 font-label text-[10px]", a.icon === "upload_file" ? "text-on-surface-variant" : "opacity-80")}>
              {a.sub}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

/** 7. Monitoreo reciente de atletas. */
function RecentActivity({ data }: { data: DashboardDTO }) {
  const setTab = useNavStore((s) => s.setTab);
  const openAthlete = useNavStore((s) => s.openAthlete);
  return (
    <section className="mb-4 rounded-xl bg-surface-container-lowest p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h4 className="font-display text-xl font-semibold text-on-surface">Actividad y Telemetría Reciente</h4>
          <p className="text-sm text-on-surface-variant">Últimos registros de carga y evaluaciones</p>
        </div>
        <button
          onClick={() => setTab("atletas")}
          className="flex items-center gap-0.5 font-label text-[11px] font-bold text-primary hover:underline"
        >
          Ver {data.metrics.totalAthletes} <MS name="chevron_right" className="text-[16px]" />
        </button>
      </div>
      <div className="flex flex-col gap-2.5">
        {data.recentActivity.map((a, idx) => {
          const tone = ["secondary", "primary", "dim", "tertiary"][idx % 4];
          const lastTest = a.tests[0];
          const hasPlan = a.vam !== null;
          // Ritmo del plan vigente: objetivo competitivo; si no, ritmo VAM
          const pace = !hasPlan
            ? "--'--\u201d"
            : a.goalPace ?? formatPace(a.vam).replace("/km", "");
          return (
            <button
              key={a.id}
              onClick={() => openAthlete(a.id)}
              className="flex items-center justify-between gap-3 rounded-lg bg-surface-container-low p-3 text-left transition-colors hover:bg-surface-container"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar firstName={a.firstName} lastName={a.lastName} tone={tone} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-sans text-[17px] font-bold text-on-surface">
                      {a.firstName} {a.lastName}
                    </span>
                    <span className={clsx("rounded px-1.5 py-0.5 font-label text-[10px] font-semibold", CHIP[a.specialty])}>
                      {SPECIALTIES[a.specialty]?.chip}
                    </span>
                  </div>
                  <p className="truncate text-sm text-on-surface-variant">
                    {!hasPlan
                      ? "Reevaluación requerida tras descarga"
                      : a.trailElev
                        ? `VAM: ${a.vam} km/h · Desnivel acum: +${a.trailElev}m`
                        : a.vo2max
                          ? `VAM: ${a.vam} km/h · VO2max: ${a.vo2max} ml/kg`
                          : `VAM: ${a.vam} km/h · Test 2000m: ${formatTime(lastTest?.timeSeconds ?? 0)}`}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className={clsx("font-label text-xl font-semibold", hasPlan ? "text-on-surface" : "text-on-surface-variant")}>
                  {pace} /km
                </div>
                <span className={clsx("font-label text-[10px] font-bold uppercase tracking-wider", hasPlan ? "text-tertiary" : "text-error")}>
                  {hasPlan ? "Plan Vigente" : "Por Confeccionar"}
                </span>
                {a.testDate ? (
                  <p className="font-label text-[9px] text-on-surface-variant">{formatDateEs(a.testDate)}</p>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function DashboardView() {
  const { data, isLoading, isError } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-surface-container" />
        ))}
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="rounded-xl bg-error-container p-4 text-on-error-container">
        No se pudo cargar el panel. Verifica la conexión e inténtalo de nuevo.
      </div>
    );
  }

  return (
    <>
      <InstitutionCard />
      <VigilanceCard data={data} />
      <MasterMetrics data={data} />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <DistributionCard data={data} />
        <MacrocycleCard data={data} />
      </div>
      <QuickActions />
      <RecentActivity data={data} />
    </>
  );
}
