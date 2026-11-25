"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavStore } from "@/store/nav-store";
import { MS } from "@/components/shared/ms";
import { Avatar } from "@/components/shared/avatar";
import {
  SPECIALTIES, STATUSES, ZONES, computeAge, computeBmi, computeAsr,
  formatDateEs, formatPace, formatTime, karvonen,
} from "@/lib/sports-science";
import type { AthleteDetailDTO } from "@/lib/types";
import { cn as clsx } from "@/lib/utils";

const TABS = [
  { id: "resumen", label: "Resumen", icon: "dashboard" },
  { id: "datos", label: "Datos Personales" },
  { id: "salud", label: "Salud & Lesiones" },
  { id: "antropometria", label: "Antropometría" },
  { id: "evaluaciones", label: "Evaluaciones" },
  { id: "fisiologia", label: "Fisiología & VAM" },
  { id: "dosificacion", label: "Dosificación" },
  { id: "plan", label: "Plan Semanal" },
  { id: "cargas", label: "Cargas & Bienestar" },
  { id: "admin", label: "Administración" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function useAthlete(athleteId: string) {
  return useQuery<{ athlete: AthleteDetailDTO }>({
    queryKey: ["athlete", athleteId],
    queryFn: async () => {
      const res = await fetch(`/api/athletes/${athleteId}`);
      if (!res.ok) throw new Error("Error al cargar el expediente");
      return res.json();
    },
  });
}

function Field({ icon, label, value }: { icon?: string; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center gap-1">
      {icon ? <MS name={icon} className="text-[14px] text-secondary" /> : null}
      <span className="truncate text-sm text-on-surface">
        {value ?? "—"}
        {label ? <span className="ml-1 font-label text-[11px] text-secondary">({label})</span> : null}
      </span>
    </div>
  );
}

function Section({ title, icon, tone = "text-secondary", children }: { title: string; icon: string; tone?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2 rounded-xl bg-surface-container-lowest p-4 shadow-sm">
      <div className="flex items-center gap-1.5">
        <MS name={icon} className={clsx("text-[18px]", tone)} />
        <h4 className="font-display text-xl font-semibold text-on-surface">{title}</h4>
      </div>
      {children}
    </section>
  );
}

/** Barra de progreso con etiqueta. */
function Bar({ value, max = 10, tone }: { value: number; max?: number; tone: string }) {
  return (
    <div className="w-full overflow-hidden rounded-full bg-surface-container">
      <div className={clsx("h-1.5 rounded-full", tone)} style={{ width: `${(value / max) * 100}%` }} />
    </div>
  );
}

export function AthleteDetailView({ athleteId }: { athleteId: string }) {
  const [tab, setTab] = useState<TabId>("resumen");
  const setTabRoute = useNavStore((s) => s.setTab);
  const setDosageAthlete = useNavStore((s) => s.setDosageAthlete);
  const setTestAthlete = useNavStore((s) => s.setTestAthlete);
  const setFocusTest = useNavStore((s) => s.setFocusTest);
  const { data, isLoading } = useAthlete(athleteId);

  const athlete = data?.athlete;
  const asr = athlete?.vam && athlete?.mss ? computeAsr(athlete.vam, athlete.mss) : null;
  const bmi = athlete?.weightKg && athlete?.heightCm ? computeBmi(athlete.weightKg, athlete.heightCm) : null;
  const age = useMemo(() => computeAge(athlete?.birthDate ?? null), [athlete?.birthDate]);

  if (isLoading || !athlete) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <div className="h-40 animate-pulse rounded-xl bg-surface-container" />
        <div className="h-64 animate-pulse rounded-xl bg-surface-container" />
      </div>
    );
  }

  const openDosage = () => {
    setDosageAthlete(athlete.id);
    setTabRoute("dosificacion");
  };
  const openNewTest = () => {
    setTestAthlete(athlete.id);
    setFocusTest(null);
    setTabRoute("test-2000m");
  };

  return (
    <div className="flex flex-col gap-4">
      {/* CARD PRINCIPAL: PERFIL EXPEDIENTE ÚNICO */}
      <section className="relative flex flex-col gap-4 overflow-hidden rounded-xl bg-surface-container-lowest p-4 shadow-sm">
        <div className="flex items-center justify-between gap-1 rounded bg-surface-container-low px-2 py-1">
          <div className="flex items-center gap-1 text-secondary">
            <MS name="verified_user" className="text-[16px]" filled />
            <span className="font-label text-[11px] uppercase tracking-wider">
              Principio UNAMaratón: 1 Atleta = 1 Expediente Permanente
            </span>
          </div>
          <span className="font-label text-[11px] font-bold text-primary">{athlete.code}</span>
        </div>

        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <Avatar
              firstName={athlete.firstName}
              lastName={athlete.lastName}
              tone={athlete.specialty === "MARATON" ? "primary" : "tertiary"}
              className="h-24 w-20 rounded-lg text-3xl"
            />
            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-tertiary shadow">
              <MS name="check" className="text-[13px] text-on-tertiary" filled />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h2 className="truncate font-display text-xl font-semibold text-on-surface">
                {athlete.firstName} {athlete.lastName}
              </h2>
              <span className="rounded bg-tertiary-fixed/30 px-1.5 py-0.5 font-label text-[11px] font-semibold text-tertiary">
                {STATUSES[athlete.status]?.label.toUpperCase()}
              </span>
            </div>
            <p className="truncate font-label text-[11px] text-secondary">
              {athlete.cedula ? `Cédula: ${athlete.cedula}` : "Sin cédula registrada"}
              {athlete.alias ? ` • Alias histórico: ${athlete.alias}` : ""}
            </p>
            <div className="mt-1 grid grid-cols-2 gap-x-2 gap-y-1 text-on-surface">
              <Field icon="cake" label={athlete.birthDate ? formatDateEs(athlete.birthDate) : ""} value={age !== null ? `${age} años` : null} />
              <Field icon="location_on" value={athlete.province} />
              <Field icon="emergency" label={athlete.emergencyRel ?? ""} value={athlete.emergencyPhone} />
              <Field icon="badge" value={`Ingreso: ${formatDateEs(athlete.joinDate).slice(3)}`} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-primary-fixed/40 px-2 py-1.5">
          <div className="flex items-center gap-1.5">
            <MS name="timer" className="text-[18px] text-primary" />
            <span className="font-display text-sm font-semibold text-primary">
              {SPECIALTIES[athlete.specialty]?.label}
            </span>
          </div>
          <span className="rounded bg-surface-container-lowest px-2 py-0.5 font-label text-[11px] font-semibold text-primary shadow-xs">
            Muestreo ISAK II
          </span>
        </div>
      </section>

      {/* PESTAÑAS */}
      <nav aria-label="Categorías del Expediente" className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 no-scrollbar scroll-smooth">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              "flex items-center gap-1 rounded-lg whitespace-nowrap px-3.5 py-1.5 font-display text-[13px] transition-colors",
              tab === t.id
                ? "bg-primary text-on-primary shadow-sm"
                : "bg-surface-container text-secondary hover:bg-surface-container-high"
            )}
          >
            {t.icon ? <MS name={t.icon} className="text-[15px]" filled={tab === t.id} /> : null}
            {t.label}
          </button>
        ))}
      </nav>

      {/* CONTENIDO POR PESTAÑA */}
      {tab === "resumen" ? (
        <>
          {/* Macroobjetivo */}
          <section className="relative rounded-xl bg-gradient-to-r from-secondary to-secondary-fixed-variant p-4 text-on-secondary shadow-sm">
            <div className="mb-2 flex items-start justify-between">
              <div className="flex items-center gap-1.5">
                <MS name="flag_circle" className="text-[20px] text-secondary-fixed" />
                <span className="font-label text-[11px] uppercase tracking-wider text-secondary-fixed">
                  Macroobjetivo Primario A-1
                </span>
              </div>
              <span className="rounded bg-white/20 px-2 py-0.5 font-label text-[11px] text-white backdrop-blur-md">
                {athlete.goalRace?.includes("Valencia") ? "Valencia 2025" : athlete.goalRace}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div>
                <p className="font-display text-2xl font-bold leading-tight">{athlete.goalRace}</p>
                <p className="text-sm text-secondary-fixed opacity-90">
                  Meta Oficial: {athlete.goalTime ?? "Por definir"}
                </p>
              </div>
              <div className="text-right">
                <p className="font-label text-xl font-semibold text-secondary-fixed">
                  {athlete.goalPace ?? (athlete.vam ? formatPace(athlete.vam).replace("/km", "") : "—")}
                </p>
                <p className="font-label text-[11px] uppercase tracking-wide opacity-80">min/km medio</p>
              </div>
            </div>
          </section>

          {/* Telemetría fisiológica */}
          <Section title="Telemetría Fisiológica Activa" icon="cardiology" tone="text-primary">
            <div className="flex items-center justify-between">
              <span className="rounded bg-surface-container px-2 py-0.5 font-label text-[11px] text-secondary">
                Test 2000m CIEMHCAVI
              </span>
              {athlete.testDate ? (
                <span className="flex items-center gap-1 text-sm text-on-surface-variant">
                  <MS name="check_circle" className="text-[14px] text-tertiary" />
                  Certificado ({formatDateEs(athlete.testDate)})
                </span>
              ) : null}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col justify-between rounded-lg bg-surface-container-low p-2.5">
                <span className="font-label text-[11px] uppercase text-secondary">VAM Medida</span>
                <div className="my-1">
                  <span className="font-label text-[2rem] font-bold leading-none text-primary">{athlete.vam ?? "—"}</span>
                  <span className="ml-1 font-label text-[11px] text-on-surface-variant">km/h</span>
                </div>
                <span className="font-label text-[10px] font-medium text-tertiary">
                  Ritmo: {athlete.vam ? formatPace(athlete.vam) : "—"}
                </span>
              </div>
              <div className="flex flex-col justify-between rounded-lg bg-surface-container-low p-2.5">
                <span className="font-label text-[11px] uppercase text-secondary">MSS (Sprint)</span>
                <div className="my-1">
                  <span className="font-label text-[2rem] font-bold leading-none text-on-surface">{athlete.mss ?? "—"}</span>
                  <span className="ml-1 font-label text-[11px] text-on-surface-variant">km/h</span>
                </div>
                <span className="font-label text-[10px] text-secondary">Velocidad Pico</span>
              </div>
              <div className="flex flex-col justify-between rounded-lg bg-surface-container-low p-2.5">
                <span className="font-label text-[11px] uppercase text-secondary">ASR (Reserva)</span>
                <div className="my-1">
                  <span className={clsx("font-label text-[2rem] font-bold leading-none", asr ? "text-tertiary-container dark:text-tertiary" : "text-on-surface")}>
                    {asr ?? "—"}
                  </span>
                  <span className="ml-1 font-label text-[11px] text-on-surface-variant">km/h</span>
                </div>
                <span className="font-label text-[10px] text-tertiary">Capacidad Anaer.</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="flex flex-col rounded bg-surface-container-high/40 p-2">
                <span className="font-label text-[10px] uppercase text-secondary">VO₂máx Estim.</span>
                <span className="mt-0.5 font-label text-xl font-semibold text-on-surface">{athlete.vo2max ?? "—"}</span>
                <span className="font-label text-[10px] text-secondary">ml/kg/min</span>
              </div>
              <div className="flex flex-col rounded bg-surface-container-high/40 p-2">
                <span className="font-label text-[10px] uppercase text-secondary">FC Máxima</span>
                <span className="mt-0.5 font-label text-xl font-semibold text-primary">{athlete.hrMax ?? "—"}</span>
                <span className="font-label text-[10px] text-secondary">lpm (esfuerzo)</span>
              </div>
              <div className="flex flex-col rounded bg-surface-container-high/40 p-2">
                <span className="font-label text-[10px] uppercase text-secondary">FC Reposo</span>
                <span className="mt-0.5 font-label text-xl font-semibold text-tertiary">{athlete.hrRest ?? "—"}</span>
                <span className="font-label text-[10px] text-secondary">lpm (basal)</span>
              </div>
            </div>
          </Section>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Antropometría */}
            <Section title="Antropometría ISAK II" icon="straighten">
              <div className="flex items-center justify-between">
                <span className="font-label text-[11px] font-semibold text-tertiary">
                  {athlete.bodyFatPct ? `${athlete.bodyFatPct}% Grasa` : "Sin muestreo"}
                </span>
              </div>
              <div className="mt-1 grid grid-cols-3 gap-2">
                {[
                  { label: "PESO", value: athlete.weightKg, unit: "kg" },
                  { label: "ESTATURA", value: athlete.heightCm, unit: "cm" },
                  { label: "IMC", value: bmi, unit: "kg/m²" },
                ].map((m) => (
                  <div key={m.label} className="rounded bg-surface-container-low p-2 text-center">
                    <span className="block font-label text-[10px] text-secondary">{m.label}</span>
                    <span className="font-label text-xl font-semibold text-on-surface">{m.value ?? "—"}</span>
                    <span className="block font-label text-[10px] text-secondary">{m.unit}</span>
                  </div>
                ))}
              </div>
            </Section>

            {/* Bienestar */}
            <Section title="Bienestar y Carga" icon="health_and_safety" tone="text-tertiary">
              <div className="flex items-center justify-between">
                <span />
                <span className="rounded bg-tertiary-fixed/30 px-2 py-0.5 font-label text-[11px] font-bold text-tertiary">
                  READY {athlete.readiness ?? "—"}/10
                </span>
              </div>
              <div className="mt-1 flex flex-col gap-2">
                <div>
                  <div className="mb-0.5 flex justify-between text-sm">
                    <span className="text-secondary">Sueño Nocturno</span>
                    <span className="font-label text-[11px] font-semibold text-on-surface">{athlete.sleepHours ?? "—"} hrs</span>
                  </div>
                  <Bar value={athlete.sleepHours ?? 0} max={10} tone="bg-tertiary" />
                </div>
                <div>
                  <div className="mb-0.5 flex justify-between text-sm">
                    <span className="text-secondary">Fatiga Percibida</span>
                    <span className="font-label text-[11px] font-semibold text-on-surface">{athlete.fatigue ?? "—"} / 10</span>
                  </div>
                  <Bar value={athlete.fatigue ?? 0} tone="bg-secondary-fixed-variant" />
                </div>
                <div>
                  <div className="mb-0.5 flex justify-between text-sm">
                    <span className="text-secondary">Dolor Muscular DOMS</span>
                    <span className="font-label text-[11px] font-semibold text-on-surface">{athlete.doms ?? "—"} / 10</span>
                  </div>
                  <Bar value={athlete.doms ?? 0} tone="bg-tertiary-container" />
                </div>
              </div>
            </Section>
          </div>

          {/* Historial longitudinal */}
          <Section title="Trazabilidad Fisiológica Longitudinal" icon="history_edu">
            <span className="self-end font-label text-[11px] font-semibold text-primary">
              {athlete.tests.length} Registros
            </span>
            <div className="flex flex-col gap-2">
              {athlete.tests.map((t, i) => {
                const vam = 2000 / t.timeSeconds * 3.6;
                return (
                  <div key={t.id} className="flex flex-col gap-1 rounded-lg bg-surface-container-low p-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={clsx("h-2 w-2 shrink-0 rounded-full", i === 0 ? "bg-primary" : "bg-secondary")} />
                        <span className="font-display text-sm text-on-surface">{t.notes ?? "Test de Campo 2000m"}</span>
                      </div>
                      <span className="rounded bg-surface-container px-1.5 py-0.5 font-label text-[11px] text-on-surface">
                        {formatDateEs(t.date)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-1 pl-3.5 text-sm">
                      <span className="text-secondary">
                        VAM: <strong className="font-label text-[13px] text-primary">{vam.toFixed(1)} km/h</strong>
                        {" "}({formatTime(t.timeSeconds)} total)
                      </span>
                      <span className="font-label text-[10px] text-secondary">
                        {t.evaluator ? `Evaluador: ${t.evaluator}` : "Evaluador: CIEMHCAVI"}
                      </span>
                    </div>
                  </div>
                );
              })}
              {athlete.tests.length === 0 ? (
                <p className="text-sm text-on-surface-variant">Sin evaluaciones registradas todavía.</p>
              ) : null}
            </div>
          </Section>

          {/* Acciones rápidas */}
          <section className="flex flex-col gap-2 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={openDosage}
                className="flex items-center justify-center gap-1.5 rounded bg-secondary px-3 py-2.5 font-display text-sm text-on-secondary shadow-sm transition-transform active:scale-[0.98]"
              >
                <MS name="calculate" className="text-[18px]" />
                <span>Matriz Dosificación</span>
              </button>
              <button
                onClick={openNewTest}
                className="flex items-center justify-center gap-1.5 rounded bg-primary px-3 py-2.5 font-display text-sm text-on-primary shadow-sm transition-transform active:scale-[0.98]"
              >
                <MS name="speed" className="text-[18px]" />
                <span>Registrar Nuevo Test</span>
              </button>
            </div>
            <button
              onClick={() => toast.info("Generando Ficha CIEMHCAVI (PDF A4)…", { description: "Expediente con firma digital, sellos UNA-CIEMHCAVI y hash de auditoría." })}
              className="flex items-center justify-between rounded-lg bg-surface-container-high px-4 py-3 text-on-surface shadow-xs transition-colors hover:bg-surface-container-highest"
            >
              <div className="flex items-center gap-2 text-left">
                <MS name="picture_as_pdf" className="text-[22px] text-primary" />
                <div>
                  <p className="font-display text-sm leading-tight text-on-surface">Descargar Expediente PDF Oficial</p>
                  <p className="font-label text-[10px] text-secondary">
                    Con firma digital, sellos institucionales UNA-CIEMHCAVI y hash de auditoría
                  </p>
                </div>
              </div>
              <MS name="download" className="text-[20px] text-secondary" />
            </button>
          </section>
        </>
      ) : null}

      {tab === "datos" ? (
        <Section title="Datos Personales" icon="badge">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[
              { icon: "person", label: "Nombre completo", value: `${athlete.firstName} ${athlete.lastName}` },
              { icon: "badge", label: "Código expediente", value: athlete.code },
              { icon: "fingerprint", label: "Cédula", value: athlete.cedula ?? "—" },
              { icon: "alternate_email", label: "Alias histórico", value: athlete.alias ?? "—" },
              { icon: "cake", label: "Nacimiento", value: athlete.birthDate ? `${formatDateEs(athlete.birthDate)} (${age ?? "—"} años)` : "—" },
              { icon: "location_on", label: "Residencia", value: athlete.province ?? "—" },
              { icon: "emergency", label: "Contacto emergencia", value: athlete.emergencyPhone ? `${athlete.emergencyPhone} (${athlete.emergencyRel ?? "contacto"})` : "—" },
              { icon: "event", label: "Ingreso al programa", value: formatDateEs(athlete.joinDate) },
              { icon: "category", label: "Especialidad", value: SPECIALTIES[athlete.specialty]?.label ?? "—" },
              { icon: "verified", label: "Estado roster", value: STATUSES[athlete.status]?.label ?? "—" },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-2 rounded-lg bg-surface-container-low p-2.5">
                <MS name={f.icon} className="text-[18px] text-secondary" />
                <div className="min-w-0">
                  <p className="font-label text-[10px] uppercase tracking-wider text-secondary">{f.label}</p>
                  <p className="truncate text-sm font-semibold text-on-surface">{f.value}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {tab === "salud" ? (
        <>
          <Section title="Estado Musculoesquelético" icon="medical_services" tone="text-error">
            {athlete.injuryNote ? (
              <div className="flex items-start gap-3 rounded-lg bg-error-container/50 p-3">
                <MS name="healing" className="text-[22px] text-error" />
                <div>
                  <p className="font-display text-sm font-bold text-on-surface">Molestia activa registrada</p>
                  <p className="text-sm text-on-surface-variant">{athlete.injuryNote}</p>
                  <button
                    onClick={() => toast.info("Reporte kinesiológico solicitado")}
                    className="mt-1 flex items-center gap-1 font-label text-[11px] font-bold text-primary hover:underline"
                  >
                    Ver reporte kinesiológico <MS name="arrow_forward" className="text-[14px]" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-lg bg-tertiary-fixed/20 p-3">
                <MS name="check_circle" className="text-[22px] text-tertiary" filled />
                <p className="text-sm text-on-surface">Sin molestias físicas reportadas en el último ciclo.</p>
              </div>
            )}
          </Section>
          <Section title="Vigilancia de Carga (ACWR)" icon="monitor_heart" tone="text-primary">
            {athlete.riskAcwr ? (
              <div className="flex flex-col gap-2 rounded-lg bg-primary-fixed/40 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-display text-sm font-bold text-on-primary-fixed-variant">Ratio Agudo:Crónico</span>
                  <span className="font-label text-xl font-bold text-primary">{athlete.riskAcwr}</span>
                </div>
                <Bar value={Math.min(athlete.riskAcwr, 2.2)} max={2.2} tone="bg-primary" />
                <p className="text-xs text-on-surface-variant">
                  Superó el umbral de seguridad (1.45). Se recomienda reducir el volumen agudo del microciclo y
                  reevaluar en 7 días.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-lg bg-tertiary-fixed/20 p-3">
                <MS name="safety_check" className="text-[22px] text-tertiary" />
                <p className="text-sm text-on-surface">Carga equilibrada: ratio agudo:crónico dentro del rango seguro.</p>
              </div>
            )}
          </Section>
        </>
      ) : null}

      {tab === "antropometria" ? (
        <Section title="Antropometría ISAK II" icon="straighten">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "Peso", value: athlete.weightKg, unit: "kg" },
              { label: "Estatura", value: athlete.heightCm, unit: "cm" },
              { label: "IMC", value: bmi, unit: "kg/m²" },
              { label: "% Grasa", value: athlete.bodyFatPct, unit: "%" },
            ].map((m) => (
              <div key={m.label} className="flex flex-col rounded-lg bg-surface-container-low p-3 text-center">
                <span className="font-label text-[10px] uppercase tracking-wider text-secondary">{m.label}</span>
                <span className="font-label text-2xl font-bold text-on-surface">{m.value ?? "—"}</span>
                <span className="font-label text-[10px] text-secondary">{m.unit}</span>
              </div>
            ))}
          </div>
          {bmi ? (
            <p className="text-xs text-on-surface-variant">
              Clasificación OMS: {bmi < 18.5 ? "bajo peso" : bmi < 25 ? "peso saludable" : bmi < 30 ? "sobrepeso" : "obesidad"}.
              Protocolo de medición ISAK II con pliegues cutáneos y perímetros certificadores.
            </p>
          ) : null}
        </Section>
      ) : null}

      {tab === "evaluaciones" ? (
        <Section title="Historial de Evaluaciones" icon="history_edu">
          <div className="flex flex-col gap-2">
            {athlete.tests.map((t, i) => {
              const vam = (2000 / t.timeSeconds) * 3.6;
              const prev = athlete.tests[i + 1];
              const delta = prev ? Math.round((prev.timeSeconds - t.timeSeconds) * 10) / 10 : null;
              return (
                <button
                  key={t.id}
                  onClick={() => { setTestAthlete(athlete.id); setFocusTest(t.id); setTabRoute("test-2000m"); }}
                  className="flex flex-col gap-1 rounded-lg bg-surface-container-low p-3 text-left transition-colors hover:bg-surface-container"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <MS name="timer" className="text-[16px] text-primary" />
                      <span className="font-display text-sm text-on-surface">{t.notes ?? "Test 2000m"}</span>
                    </div>
                    <span className="rounded bg-surface-container px-1.5 py-0.5 font-label text-[11px] text-on-surface">
                      {formatDateEs(t.date)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pl-6 text-sm">
                    <span className="text-secondary">
                      Tiempo: <strong className="font-label text-[13px] text-on-surface">{formatTime(t.timeSeconds)}</strong>
                      {" · "}VAM: <strong className="font-label text-[13px] text-primary">{vam.toFixed(1)} km/h</strong>
                    </span>
                    {delta !== null ? (
                      <span className={clsx("font-label text-[11px] font-bold", delta >= 0 ? "text-tertiary" : "text-error")}>
                        {delta >= 0 ? `▲ ${delta.toFixed(1)}s` : `▼ ${Math.abs(delta).toFixed(1)}s`}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
            {athlete.tests.length === 0 ? (
              <p className="text-sm text-on-surface-variant">Sin evaluaciones registradas todavía.</p>
            ) : null}
          </div>
        </Section>
      ) : null}

      {tab === "fisiologia" ? (
        <>
          <Section title="Referencias Fisiológicas" icon="cardiology" tone="text-primary">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[
                { label: "VAM (Test 2000m)", value: athlete.vam, unit: "km/h" },
                { label: "MSS (Sprint)", value: athlete.mss, unit: "km/h" },
                { label: "ASR (Reserva)", value: asr, unit: "km/h" },
                { label: "VO₂máx Estim.", value: athlete.vo2max, unit: "ml/kg/min" },
                { label: "FC Máxima", value: athlete.hrMax, unit: "lpm" },
                { label: "FC Reposo", value: athlete.hrRest, unit: "lpm" },
              ].map((m) => (
                <div key={m.label} className="flex flex-col rounded-lg bg-surface-container-low p-2.5">
                  <span className="font-label text-[10px] uppercase tracking-wider text-secondary">{m.label}</span>
                  <span className="font-label text-xl font-bold text-on-surface">{m.value ?? "—"}</span>
                  <span className="font-label text-[10px] text-secondary">{m.unit}</span>
                </div>
              ))}
            </div>
          </Section>
          <Section title="Zonas FC — Fórmula Karvonen" icon="favorite">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-surface-container-high font-label text-[10px] uppercase tracking-wider text-on-surface">
                    <th className="px-3 py-2">Zona</th>
                    <th className="px-2 py-2 text-right">% VAM</th>
                    <th className="px-2 py-2 text-right">Velocidad</th>
                    <th className="px-3 py-2 text-right">FC (lpm)</th>
                  </tr>
                </thead>
                <tbody className="font-label text-[13px]">
                  {ZONES.map((z) => (
                    <tr key={z.pct} className="bg-surface-container-lowest transition-colors hover:bg-surface-container-low">
                      <td className="px-3 py-2 font-semibold text-on-surface">{z.name}</td>
                      <td className="px-2 py-2 text-right text-secondary">{z.pct}%</td>
                      <td className="px-2 py-2 text-right text-on-surface">
                        {athlete.vam ? (athlete.vam * z.pct / 100).toFixed(1) : "—"} km/h
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-primary">
                        {athlete.hrMax && athlete.hrRest
                          ? (z.pct >= 100 ? "MÁX" : karvonen(z.pct, athlete.hrMax, athlete.hrRest))
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </>
      ) : null}

      {tab === "dosificacion" ? (
        <Section title="Matriz de Dosificación" icon="calculate" tone="text-primary">
          <p className="text-sm text-on-surface-variant">
            Modelo Activo: <strong className="text-on-surface">VAM 2000m + ASR Supramáximo</strong> (Karvonen FC).
            Abre la matriz interactiva con las {ZONES.length} zonas y la calculadora de series.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-surface-container-high font-label text-[10px] uppercase tracking-wider text-on-surface">
                  <th className="px-3 py-2">Zona</th>
                  <th className="px-2 py-2 text-right">Velocidad</th>
                  <th className="px-3 py-2 text-right">Ritmo</th>
                </tr>
              </thead>
              <tbody className="font-label text-[13px]">
                {ZONES.map((z) => (
                  <tr key={z.pct} className="bg-surface-container-lowest hover:bg-surface-container-low">
                    <td className="px-3 py-2 font-semibold text-on-surface">{z.name} <span className="text-secondary">({z.pct}%)</span></td>
                    <td className="px-2 py-2 text-right text-on-surface">
                      {athlete.vam ? (athlete.vam * z.pct / 100).toFixed(1) : "—"} km/h
                    </td>
                    <td className="px-3 py-2 text-right text-secondary">
                      {athlete.vam ? formatPace(athlete.vam * z.pct / 100) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={openDosage}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-display text-sm text-on-primary shadow-sm transition-transform active:scale-[0.98]"
          >
            <MS name="table_chart" className="text-[18px]" />
            Abrir Matriz Interactiva
          </button>
        </Section>
      ) : null}

      {tab === "plan" ? (
        <Section title="Microciclo Modelo Semanal" icon="assignment_turned_in" tone="text-tertiary">
          <p className="text-xs text-on-surface-variant">
            Estructura de referencia generada desde la VAM vigente ({athlete.vam ?? "—"} km/h). La prescripción fina
            se ajusta en la Calculadora de Series de la matriz de dosificación.
          </p>
          <div className="flex flex-col gap-1.5">
            {[
              { day: "Lunes", session: "Rodaje regenerativo Z1", pct: 70, icon: "self_improvement" },
              { day: "Martes", session: "Series largas Z4 (umbral)", pct: 90, icon: "speed" },
              { day: "Miércoles", session: "Trote suave Z2 + técnica", pct: 80, icon: "directions_walk" },
              { day: "Jueves", session: "Series cortas Z6/Z7 ASR", pct: 105, icon: "bolt" },
              { day: "Viernes", session: "Rodaje aeróbico Z3", pct: 85, icon: "trail" },
              { day: "Sábado", session: "Tirada larga Z2", pct: 75, icon: "landscape" },
              { day: "Domingo", session: "Descanso activo", pct: null, icon: "bedtime" },
            ].map((d) => (
              <div key={d.day} className="flex items-center justify-between gap-2 rounded-lg bg-surface-container-low p-2.5">
                <div className="flex items-center gap-2">
                  <MS name={d.icon} className="text-[18px] text-secondary" />
                  <div>
                    <p className="font-display text-sm font-semibold text-on-surface">{d.day}</p>
                    <p className="text-xs text-on-surface-variant">{d.session}</p>
                  </div>
                </div>
                {d.pct && athlete.vam ? (
                  <div className="text-right">
                    <p className="font-label text-[13px] font-semibold text-on-surface">
                      {formatPace(athlete.vam * d.pct / 100)}
                    </p>
                    <p className="font-label text-[10px] text-secondary">{d.pct}% VAM</p>
                  </div>
                ) : (
                  <span className="font-label text-[10px] uppercase text-secondary">libre</span>
                )}
              </div>
            ))}
          </div>
          {!athlete.vam ? (
            <p className="rounded-lg bg-error-container/40 p-2 text-xs text-on-error-container">
              Plan por confeccionar: registre un Test 2000m para habilitar la dosificación.
            </p>
          ) : null}
        </Section>
      ) : null}

      {tab === "cargas" ? (
        <Section title="Cargas y Bienestar" icon="health_and_safety" tone="text-tertiary">
          <div className="flex items-center justify-between rounded-lg bg-tertiary-fixed/20 p-3">
            <div className="flex items-center gap-2">
              <MS name="bolt" className="text-[22px] text-tertiary" />
              <span className="font-display text-sm font-semibold text-on-surface">Readiness global</span>
            </div>
            <span className="font-label text-2xl font-bold text-tertiary">{athlete.readiness ?? "—"}/10</span>
          </div>
          <div className="flex flex-col gap-2">
            <div>
              <div className="mb-0.5 flex justify-between text-sm">
                <span className="text-secondary">Sueño Nocturno</span>
                <span className="font-label text-[11px] font-semibold text-on-surface">{athlete.sleepHours ?? "—"} hrs</span>
              </div>
              <Bar value={athlete.sleepHours ?? 0} max={10} tone="bg-tertiary" />
            </div>
            <div>
              <div className="mb-0.5 flex justify-between text-sm">
                <span className="text-secondary">Fatiga Percibida</span>
                <span className="font-label text-[11px] font-semibold text-on-surface">{athlete.fatigue ?? "—"} / 10</span>
              </div>
              <Bar value={athlete.fatigue ?? 0} tone="bg-secondary-fixed-variant" />
            </div>
            <div>
              <div className="mb-0.5 flex justify-between text-sm">
                <span className="text-secondary">Dolor Muscular (DOMS)</span>
                <span className="font-label text-[11px] font-semibold text-on-surface">{athlete.doms ?? "—"} / 10</span>
              </div>
              <Bar value={athlete.doms ?? 0} tone="bg-tertiary-container" />
            </div>
            {athlete.riskAcwr ? (
              <div>
                <div className="mb-0.5 flex justify-between text-sm">
                  <span className="text-secondary">ACWR (agudo:crónico)</span>
                  <span className="font-label text-[11px] font-bold text-error">{athlete.riskAcwr} ⚠</span>
                </div>
                <Bar value={Math.min(athlete.riskAcwr, 2.2)} max={2.2} tone="bg-error" />
              </div>
            ) : null}
          </div>
        </Section>
      ) : null}

      {tab === "admin" ? (
        <Section title="Administración del Expediente" icon="admin_panel_settings">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[
              { icon: "fingerprint", label: "Código expediente", value: athlete.code },
              { icon: "verified_user", label: "Principio", value: "1 Atleta = 1 Expediente Permanente" },
              { icon: "event", label: "Apertura", value: formatDateEs(athlete.joinDate) },
              { icon: "school", label: "Evaluador responsable", value: athlete.evaluator ?? "Sin asignar" },
              { icon: "science", label: "Última certificación", value: athlete.testDate ? formatDateEs(athlete.testDate) : "—" },
              { icon: "sync", label: "Sincronización", value: "Excel Sync v4.2 · activa" },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-2 rounded-lg bg-surface-container-low p-2.5">
                <MS name={f.icon} className="text-[18px] text-secondary" />
                <div className="min-w-0">
                  <p className="font-label text-[10px] uppercase tracking-wider text-secondary">{f.label}</p>
                  <p className="truncate text-sm font-semibold text-on-surface">{f.value}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-lg bg-surface-container-low p-2.5">
            <span className="font-label text-[10px] uppercase tracking-wider text-secondary">Trazabilidad institucional</span>
            <code className="mt-1 block rounded bg-surface-container-highest px-1.5 py-1 font-label text-[10px] text-on-surface">
              Fórmula CIEMHCAVI v2.1: Vel = Dist / Tiempo; IDR = [(T_lento − T_rápido) / T_rápido] × 100
            </code>
          </div>
        </Section>
      ) : null}
    </div>
  );
}
