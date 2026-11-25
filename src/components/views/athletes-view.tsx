"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavStore } from "@/store/nav-store";
import { MS } from "@/components/shared/ms";
import { Avatar } from "@/components/shared/avatar";
import { SPECIALTIES, STATUSES, formatPace, formatDateEs } from "@/lib/sports-science";
import type { AthleteListItem } from "@/lib/types";
import { cn as clsx } from "@/lib/utils";

const SPEC_FILTERS = [
  { value: "", label: "Todas" },
  { value: "MARATON", label: "Maratón" },
  { value: "MEDIO_FONDO", label: "Medio Fondo" },
  { value: "10K_5K", label: "10K / 5K" },
  { value: "TRAIL_SALUD", label: "Trail & Salud" },
];

const STATUS_FILTERS = [
  { value: "", label: "Todos" },
  { value: "ACTIVO", label: "Activos" },
  { value: "TRANSICION", label: "Transición" },
  { value: "BAJA", label: "Baja" },
];

const STATUS_DOT: Record<string, string> = {
  ACTIVO: "bg-tertiary",
  TRANSICION: "bg-secondary-fixed-dim",
  BAJA: "bg-error",
};

export function AthletesView() {
  const openAthlete = useNavStore((s) => s.openAthlete);
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [status, setStatus] = useState("");
  const [limit, setLimit] = useState(30);

  const { data, isLoading } = useQuery<{ athletes: AthleteListItem[]; count: number }>({
    queryKey: ["athletes", search, specialty, status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (specialty) params.set("specialty", specialty);
      if (status) params.set("status", status);
      const res = await fetch(`/api/athletes?${params.toString()}`);
      if (!res.ok) throw new Error("Error al cargar atletas");
      return res.json();
    },
  });

  const athletes = data?.athletes ?? [];
  const visible = useMemo(() => athletes.slice(0, limit), [athletes, limit]);

  return (
    <div className="flex flex-col gap-3">
      {/* Barra de búsqueda */}
      <div className="flex items-center gap-2 rounded-xl bg-surface-container-lowest px-3 py-2 shadow-sm">
        <MS name="search" className="text-[20px] text-secondary" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setLimit(30); }}
          placeholder="Buscar por nombre, código o alias…"
          aria-label="Buscar atleta"
          className="w-full bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none"
        />
        {search ? (
          <button aria-label="Limpiar búsqueda" onClick={() => setSearch("")} className="text-on-surface-variant">
            <MS name="close" className="text-[18px]" />
          </button>
        ) : null}
      </div>

      {/* Filtros por especialidad */}
      <div className="-mx-4 flex items-center gap-1.5 overflow-x-auto px-4 pb-1 no-scrollbar">
        {SPEC_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setSpecialty(f.value); setLimit(30); }}
            className={clsx(
              "rounded-lg px-3 py-1.5 font-label text-[13px] whitespace-nowrap transition-colors",
              specialty === f.value
                ? "bg-primary text-on-primary font-bold shadow-sm"
                : "bg-surface-container-low text-on-surface hover:bg-surface-container"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      {/* Filtros por estado */}
      <div className="-mx-4 flex items-center gap-1.5 overflow-x-auto px-4 pb-1 no-scrollbar">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setStatus(f.value); setLimit(30); }}
            className={clsx(
              "rounded-lg px-3 py-1.5 font-label text-[12px] whitespace-nowrap transition-colors",
              status === f.value
                ? "bg-secondary text-on-secondary font-bold shadow-sm"
                : "bg-surface-container-low text-on-surface hover:bg-surface-container"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Resultados */}
      <div className="flex items-center justify-between px-1">
        <span className="font-label text-[11px] font-semibold uppercase tracking-wider text-secondary">
          {isLoading ? "Cargando…" : `${athletes.length} atletas`}
        </span>
        <span className="font-label text-[11px] text-on-surface-variant">
          Población CIEMHCAVI · UNA
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {visible.map((a) => (
          <button
            key={a.id}
            onClick={() => openAthlete(a.id)}
            className="flex items-center justify-between gap-3 rounded-xl bg-surface-container-lowest p-3 text-left shadow-sm transition-colors hover:bg-surface-container-low active:scale-[0.99]"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative">
                <Avatar
                  firstName={a.firstName}
                  lastName={a.lastName}
                  tone={a.specialty === "MARATON" ? "primary" : a.specialty === "MEDIO_FONDO" ? "secondary" : a.specialty === "10K_5K" ? "error" : "tertiary"}
                />
                <span className={clsx("absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface-container-lowest", STATUS_DOT[a.status])} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-sans text-[16px] font-bold text-on-surface">
                    {a.firstName} {a.lastName}
                  </span>
                  {a.injuryNote ? <MS name="healing" className="text-[16px] text-error" /> : null}
                  {a.riskAcwr ? <MS name="warning" className="text-[16px] text-primary" /> : null}
                </div>
                <p className="truncate font-label text-[11px] text-on-surface-variant">
                  {a.code} · {SPECIALTIES[a.specialty]?.chip} · {STATUSES[a.status]?.label}
                </p>
              </div>
            </div>
            <div className="shrink-0 text-right">
              {a.vam ? (
                <>
                  <div className="font-label text-lg font-semibold text-on-surface">{a.vam}</div>
                  <span className="font-label text-[10px] text-secondary">km/h VAM</span>
                  <p className="font-label text-[9px] text-on-surface-variant">{formatPace(a.vam)}</p>
                </>
              ) : (
                <>
                  <div className="font-label text-lg font-semibold text-on-surface-variant">—</div>
                  <span className="font-label text-[10px] text-error">Por dosificar</span>
                  {a.testDate ? null : <p className="font-label text-[9px] text-on-surface-variant">sin test</p>}
                </>
              )}
            </div>
          </button>
        ))}
        {athletes.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center gap-2 rounded-xl bg-surface-container-lowest p-8 text-center shadow-sm">
            <MS name="person_off" className="text-[32px] text-on-surface-variant" />
            <p className="text-sm text-on-surface-variant">Sin resultados para esta búsqueda.</p>
          </div>
        ) : null}
        {limit < athletes.length ? (
          <button
            onClick={() => setLimit((l) => l + 30)}
            className="flex items-center justify-center gap-2 rounded-xl bg-surface-container px-4 py-3 font-label text-[12px] font-bold uppercase tracking-wider text-secondary transition-colors hover:bg-surface-container-high"
          >
            <MS name="expand_more" className="text-[18px]" />
            Cargar más ({athletes.length - limit} restantes)
          </button>
        ) : null}
      </div>
    </div>
  );
}
