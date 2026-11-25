"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useNavStore } from "@/store/nav-store";
import { MS } from "@/components/shared/ms";
import { cn as clsx } from "@/lib/utils";
import type { DashboardDTO } from "@/lib/types";

/* ── Diálogo: Importar Excel / CSV ────────────────────────────────────────── */
interface CsvRow {
  firstName?: string;
  lastName?: string;
  specialty?: string;
  status?: string;
  vam?: string;
  time2000?: string;
  hrMax?: string;
  hrRest?: string;
  weightKg?: string;
  heightCm?: string;
  province?: string;
  goalRace?: string;
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const delimiter = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(delimiter).map((h) => h.trim().toLowerCase().replace(/["']/g, ""));
  const aliases: Record<string, string> = {
    nombre: "firstName", firstname: "firstName", "primer apellido": "lastName",
    apellido: "lastName", lastname: "lastName", "apellidos": "lastName",
    especialidad: "specialty", specialty: "specialty",
    estado: "status", status: "status",
    vam: "vam", "vam km/h": "vam",
    tiempo2000: "time2000", "test2000": "time2000", "tiempo 2000m": "time2000",
    fcmáx: "hrMax", fcmax: "hrMax", "fc max": "hrMax", "hr max": "hrMax",
    fcrep: "hrRest", "fc rep": "hrRest", "hr rep": "hrRest",
    peso: "weightKg", weight: "weightKg", "peso kg": "weightKg",
    estatura: "heightCm", height: "heightCm", "estatura cm": "heightCm",
    provincia: "province", province: "province", residencia: "province",
    objetivo: "goalRace", "carrera": "goalRace", goal: "goalRace",
  };
  return lines.slice(1).map((line) => {
    const cells = line.split(delimiter).map((c) => c.trim().replace(/["']/g, ""));
    const row: CsvRow = {};
    headers.forEach((h, i) => {
      const key = aliases[h] ?? h;
      if (cells[i]) (row as Record<string, string>)[key] = cells[i];
    });
    return row;
  });
}

function ImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setFileName(file.name);
    setResult(null);
    const text = await file.text();
    const parsed = parseCsv(text);
    setRows(parsed);
    if (parsed.length === 0) {
      toast.error("No se detectaron filas válidas. Usa encabezados: nombre, apellido, especialidad, vam…");
    }
  }

  async function doImport() {
    setImporting(true);
    try {
      const res = await fetch("/api/athletes/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al importar");
      setResult({ created: json.created, errors: json.errors ?? [] });
      toast.success(`${json.created} atletas importados al roster CIEMHCAVI`);
      await queryClient.invalidateQueries({ queryKey: ["athletes"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al importar");
    } finally {
      setImporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setRows([]); setFileName(null); setResult(null); } }}>
      <DialogContent className="max-w-md border-surface-container-highest bg-surface-container-lowest p-0">
        <DialogHeader className="space-y-1 p-4 pb-2">
          <DialogTitle className="flex items-center gap-2 font-display text-lg text-on-surface">
            <MS name="upload_file" className="text-[22px] text-secondary" />
            Importar Histórico Excel/CSV
          </DialogTitle>
          <DialogDescription className="text-left text-xs text-on-surface-variant">
            Formato: columnas <code className="rounded bg-surface-container px-1 font-label">nombre, apellido, especialidad (MARATON/MEDIO_FONDO/10K_5K/TRAIL_SALUD), estado, vam, tiempo2000, fcmax, fcrep, peso, estatura, provincia, objetivo</code>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 px-4 pb-4">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-low px-4 py-8 text-center transition-colors hover:bg-surface-container"
          >
            <MS name="cloud_upload" className="text-[36px] text-secondary" />
            <span className="text-sm font-semibold text-on-surface">
              {fileName ?? "Selecciona el archivo .csv exportado del histórico"}
            </span>
            <span className="font-label text-[10px] text-on-surface-variant">
              {rows.length > 0 ? `${rows.length} filas detectadas` : "Excel Sync v4.2 · codificación UTF-8"}
            </span>
          </button>

          {result ? (
            <div className="rounded-lg bg-tertiary-fixed/20 p-3 text-xs text-on-surface">
              <p className="font-bold text-tertiary">{result.created} atletas creados correctamente.</p>
              {result.errors.length > 0 ? (
                <ul className="mt-1 list-inside list-disc text-error">
                  {result.errors.slice(0, 4).map((e) => <li key={e}>{e}</li>)}
                </ul>
              ) : null}
            </div>
          ) : null}

          <button
            onClick={doImport}
            disabled={rows.length === 0 || importing}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-display text-sm text-on-primary shadow-sm transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            <MS name="sync" className="text-[18px]" />
            {importing ? "Importando…" : `Importar ${rows.length || ""} registros`}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Diálogo: Asistente IA metabólico ─────────────────────────────────────── */
interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "¿Qué ritmo corresponde al 85% de VAM con 17.5 km/h?",
  "¿Cómo interpreto un ACWR de 1.52?",
  "Explícame la reserva anaeróbica de velocidad (ASR)",
  "¿Qué zona debo usar para series de 1000m?",
];

function AiChatDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content:
        "Hola, soy el Asistente Metabólico CIEMHCAVI. Puedo ayudarte con zonas VAM, cálculo de tiempos objetivo, Karvonen, ASR, IDR y vigilancia de carga (ACWR/RPE). ¿Qué necesitas dosificar hoy?",
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  async function send(text?: string) {
    const question = (text ?? input).trim();
    if (!question || thinking) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: question }]);
    setThinking(true);
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Sin respuesta");
      setMessages((m) => [...m, { role: "assistant", content: json.reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "No pude procesar la consulta en este momento. Intenta reformular la pregunta." },
      ]);
    } finally {
      setThinking(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-surface-container-highest bg-surface-container-lowest p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2 font-display text-lg text-on-surface">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-tertiary text-on-tertiary">
              <MS name="psychology" className="text-[18px]" />
            </span>
            Asistente Metabólico IA
            <span className="ml-auto rounded-full bg-tertiary/10 px-2 py-0.5 font-label text-[9px] font-bold uppercase text-tertiary">
              CIEMHCAVI
            </span>
          </DialogTitle>
          <DialogDescription className="text-left text-xs text-on-surface-variant">
            Consultas sobre dosificación VAM/ASR, Karvonen, IDR y vigilancia de carga.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <div ref={scrollRef} className="flex max-h-[46vh] min-h-[220px] flex-col gap-2 overflow-y-auto px-4 no-scrollbar">
            {messages.map((m, i) => (
              <div
                key={i}
                className={clsx(
                  "max-w-[88%] rounded-xl px-3 py-2 text-[13px] leading-snug whitespace-pre-wrap",
                  m.role === "user"
                    ? "self-end bg-primary text-on-primary"
                    : "self-start bg-surface-container-high text-on-surface"
                )}
              >
                {m.role === "user"
                  ? m.content
                  : m.content.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
                      part.startsWith("**") && part.endsWith("**")
                        ? <strong key={j}>{part.slice(2, -2)}</strong>
                        : part
                    )}
              </div>
            ))}
            {thinking ? (
              <div className="flex items-center gap-2 self-start rounded-xl bg-surface-container-high px-3 py-2 text-[13px] text-on-surface-variant">
                <span className="h-2 w-2 animate-pulse rounded-full bg-tertiary" />
                Procesando modelo metabólico…
              </div>
            ) : null}
          </div>

          {messages.length <= 1 ? (
            <div className="flex flex-wrap gap-1.5 px-4">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full bg-surface-container px-2.5 py-1 text-left font-label text-[10px] text-secondary transition-colors hover:bg-surface-container-high"
                >
                  {s}
                </button>
              ))}
            </div>
          ) : null}

          <div className="flex items-end gap-2 p-4 pt-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Escribe tu consulta fisiológica…"
              rows={1}
              className="max-h-24 min-h-[40px] resize-none border-none bg-surface-container text-sm text-on-surface focus-visible:ring-1 focus-visible:ring-primary"
            />
            <button
              onClick={() => send()}
              disabled={thinking || !input.trim()}
              aria-label="Enviar consulta"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-tertiary text-on-tertiary transition-transform active:scale-95 disabled:opacity-50"
            >
              <MS name="send" className="text-[20px]" />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Vista Más ────────────────────────────────────────────────────────────── */
export function MoreView() {
  const moreDialog = useNavStore((s) => s.moreDialog);
  const setMoreDialog = useNavStore((s) => s.setMoreDialog);
  const dark = useNavStore((s) => s.dark);
  const toggleDark = useNavStore((s) => s.toggleDark);
  const [localDialog, setLocalDialog] = useState<"import" | "ai" | null>(null);

  // Derivación: el diálogo automático del store prevalece sobre la apertura manual
  const importOpen = moreDialog === "import" || localDialog === "import";
  const aiOpen = moreDialog === "ai" || localDialog === "ai";
  const closeDialog = (which: "import" | "ai") => {
    setLocalDialog(null);
    if (moreDialog === which) setMoreDialog(null);
  };

  const { data } = useQuery<DashboardDTO>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
  });

  const menu = [
    {
      icon: "upload_file", title: "Importar Excel", sub: "Histórico CIEMHCAVI · CSV",
      tone: "bg-surface-container text-on-surface hover:bg-surface-container-high", iconTone: "text-secondary",
      onClick: () => setLocalDialog("import"),
    },
    {
      icon: "psychology", title: "Consultar IA", sub: "Asistente metabólico",
      tone: "bg-tertiary text-on-tertiary hover:bg-tertiary/90", iconTone: "text-on-tertiary",
      onClick: () => setLocalDialog("ai"),
    },
    {
      icon: "groups", title: "Roster completo", sub: `${data?.metrics.totalAthletes ?? 128} expedientes`,
      tone: "bg-primary text-on-primary hover:bg-primary/90", iconTone: "text-on-primary",
      onClick: () => useNavStore.getState().setTab("atletas"),
    },
    {
      icon: "emoji_events", title: "Competiciones", sub: `${data?.metrics.competitions ?? 3} macrociclos activos`,
      tone: "bg-secondary text-on-secondary hover:bg-secondary/90", iconTone: "text-on-secondary",
      onClick: () => useNavStore.getState().setTab("dashboard"),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl bg-surface-container-lowest p-4 shadow-sm">
        <h4 className="mb-3 font-display text-xl font-semibold text-on-surface">Operación del Laboratorio</h4>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {menu.map((m) => (
            <button
              key={m.title}
              onClick={m.onClick}
              className={clsx(
                "group flex flex-col items-center justify-center rounded-xl p-3 text-center shadow-sm transition-all active:scale-95",
                m.tone
              )}
            >
              <div className="mb-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                <MS name={m.icon} className="text-[24px]" />
              </div>
              <span className="font-display text-[13px] font-bold">{m.title}</span>
              <span className={clsx("mt-0.5 font-label text-[10px]", m.icon === "upload_file" ? "opacity-80" : "opacity-80")}>
                {m.sub}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Ajustes */}
      <section className="flex flex-col gap-2 rounded-xl bg-surface-container-lowest p-4 shadow-sm">
        <h4 className="font-display text-xl font-semibold text-on-surface">Ajustes</h4>
        <div className="flex items-center justify-between rounded-lg bg-surface-container-low p-3">
          <div className="flex items-center gap-2">
            <MS name={dark ? "light_mode" : "dark_mode"} className="text-[20px] text-secondary" />
            <div>
              <p className="text-sm font-semibold text-on-surface">Tema {dark ? "oscuro" : "claro"}</p>
              <p className="text-xs text-on-surface-variant">Esquema Material 3 CIEMHCAVI</p>
            </div>
          </div>
          <Switch checked={dark} onCheckedChange={toggleDark} aria-label="Cambiar tema" />
        </div>
        <div className="flex items-center justify-between rounded-lg bg-surface-container-low p-3">
          <div className="flex items-center gap-2">
            <MS name="notifications_active" className="text-[20px] text-primary" />
            <div>
              <p className="text-sm font-semibold text-on-surface">Alertas de vigilancia</p>
              <p className="text-xs text-on-surface-variant">RPE &gt; 8 y ACWR &gt; 1.45 en tiempo real</p>
            </div>
          </div>
          <span className="rounded-full bg-primary-fixed px-2 py-0.5 font-label text-[10px] font-bold text-primary">
            {data?.alerts.totalCases ?? 0} activas
          </span>
        </div>
      </section>

      {/* Acerca de */}
      <section className="flex flex-col gap-2 rounded-xl bg-surface-container-lowest p-4 shadow-sm">
        <h4 className="font-display text-xl font-semibold text-on-surface">Acerca de la Plataforma</h4>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[
            { icon: "science", label: "Motor fisiológico", value: "Fórmula CIEMHCAVI v2.1" },
            { icon: "sync", label: "Sincronización", value: "Excel Sync v4.2" },
            { icon: "school", label: "Institución", value: "Lab. CIEMHCAVI · UNA Costa Rica" },
            { icon: "verified_user", label: "Principio rector", value: "1 Atleta = 1 Expediente Permanente" },
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
          <span className="font-label text-[10px] uppercase tracking-wider text-secondary">Trazabilidad</span>
          <code className="mt-1 block rounded bg-surface-container-highest px-1.5 py-1 font-label text-[10px] text-on-surface">
            Vel = Dist / Tiempo · IDR = [(T_lento − T_rápido) / T_rápido] × 100 · FC = Reposo + (Máx − Reposo) × %Int
          </code>
        </div>
      </section>

      <ImportDialog open={importOpen} onOpenChange={(v) => { if (!v) closeDialog("import"); }} />
      <AiChatDialog open={aiOpen} onOpenChange={(v) => { if (!v) closeDialog("ai"); }} />
    </div>
  );
}
