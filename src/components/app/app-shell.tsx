"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useNavStore, type Tab } from "@/store/nav-store";
import { Logo } from "@/components/app/logo";
import { MS } from "@/components/shared/ms";
import { DashboardView } from "@/components/views/dashboard-view";
import { AthletesView } from "@/components/views/athletes-view";
import { AthleteDetailView } from "@/components/views/athlete-detail-view";
import { TestView } from "@/components/views/test-view";
import { DosageView } from "@/components/views/dosage-view";
import { MoreView } from "@/components/views/more-view";
import { cn as clsx } from "@/lib/utils";
import { toast } from "sonner";

const TITLES: Record<Tab, string> = {
  dashboard: "Dashboard",
  atletas: "Atletas",
  "test-2000m": "Test 2000M",
  dosificacion: "Dosificación",
  "menu-mas": "Panel General",
};

const NAV: { tab: Tab; icon: string; label: string }[] = [
  { tab: "dashboard", icon: "insights", label: "Inicio" },
  { tab: "atletas", icon: "groups", label: "Atletas" },
  { tab: "test-2000m", icon: "timer", label: "Test 2000m" },
  { tab: "dosificacion", icon: "vital_signs", label: "Dosifica" },
  { tab: "menu-mas", icon: "grid_view", label: "Más" },
];

function Header() {
  const tab = useNavStore((s) => s.tab);
  const dark = useNavStore((s) => s.dark);
  const toggleDark = useNavStore((s) => s.toggleDark);
  const athleteDetailId = useNavStore((s) => s.athleteDetailId);
  const closeAthlete = useNavStore((s) => s.closeAthlete);

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-surface/90 pt-safe backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="flex h-16 items-center justify-between gap-2 px-4">
        <div className="flex min-w-0 items-center gap-2">
          {athleteDetailId ? (
            <button
              aria-label="Volver"
              onClick={closeAthlete}
              className="-ml-2 flex h-11 w-11 items-center justify-center rounded-sm text-on-surface transition-colors hover:text-primary"
            >
              <MS name="arrow_back" className="text-[24px]" />
            </button>
          ) : null}
          <Logo className="h-8 w-8 shrink-0" />
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-label text-[11px] font-bold uppercase tracking-widest text-primary">
              CIEMHCAVI · UNA
            </span>
            <span className="truncate font-sans text-[17px] font-semibold text-on-surface">
              {athleteDetailId ? "Detalle Atleta" : TITLES[tab]}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            aria-label="Estado de Sincronización"
            onClick={() => toast.success("Sincronización completa · Excel Sync v4.2", { description: "Última copia: hace 3 minutos" })}
            className="flex h-11 w-11 items-center justify-center rounded-sm text-tertiary transition-colors hover:text-on-surface"
          >
            <MS name="cloud_done" className="text-[20px]" />
          </button>
          <button
            aria-label="Cambiar Tema Claro u Oscuro"
            onClick={toggleDark}
            className="flex h-11 w-11 items-center justify-center rounded-sm text-on-surface-variant transition-colors hover:text-on-surface"
          >
            <MS name={dark ? "light_mode" : "dark_mode"} className="text-[20px]" />
          </button>
          <div className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <MS name="person" className="text-[18px] text-on-primary" />
          </div>
        </div>
      </div>
    </header>
  );
}

function BottomNav() {
  const tab = useNavStore((s) => s.tab);
  const setTab = useNavStore((s) => s.setTab);

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-50 bg-surface/90 pb-safe backdrop-blur-xl shadow-[0_-2px_12px_rgba(0,0,0,0.04)]"
    >
      <div className="flex h-16 items-center justify-around px-1">
        {NAV.map((item) => {
          const active = tab === item.tab;
          return (
            <button
              key={item.tab}
              onClick={() => setTab(item.tab)}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "flex min-h-[44px] min-w-[56px] flex-col items-center justify-center rounded-sm transition-colors",
                active ? "text-primary" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              <MS name={item.icon} className="text-[22px]" filled={active} />
              <span className="mt-0.5 font-label text-[10px] uppercase tracking-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function CurrentView() {
  const tab = useNavStore((s) => s.tab);
  const athleteDetailId = useNavStore((s) => s.athleteDetailId);

  if (athleteDetailId) {
    return <AthleteDetailView key={athleteDetailId} athleteId={athleteDetailId} />;
  }
  switch (tab) {
    case "dashboard":
      return <DashboardView />;
    case "atletas":
      return <AthletesView />;
    case "test-2000m":
      return <TestView />;
    case "dosificacion":
      return <DosageView />;
    case "menu-mas":
      return <MoreView />;
  }
}

export function AppShell() {
  const [mounted, setMounted] = useState(false);
  const tab = useNavStore((s) => s.tab);
  const athleteDetailId = useNavStore((s) => s.athleteDetailId);
  const viewKey = athleteDetailId ?? tab;
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
        },
      })
  );

  useEffect(() => {
    import("@/store/nav-store").then(({ hydrateTheme }) => hydrateTheme());
    setMounted(true);
  }, []);

  if (!mounted) {
    // Evita parpadeo de tema antes de hidratar
    return <div className="min-h-screen bg-surface" />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col bg-surface text-on-surface">
        <Header />
        <main className="relative min-h-screen w-full bg-surface px-4 pb-28 pt-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={viewKey}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="mx-auto flex w-full max-w-3xl flex-col gap-4"
            >
              <CurrentView />
            </motion.div>
          </AnimatePresence>
        </main>
        <BottomNav />
      </div>
    </QueryClientProvider>
  );
}
