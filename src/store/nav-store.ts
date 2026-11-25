"use client";

import { create } from "zustand";

export type Tab = "dashboard" | "atletas" | "test-2000m" | "dosificacion" | "menu-mas";

interface NavState {
  tab: Tab;
  previousTab: Tab;
  /** Expediente abierto (vista apilada con botón volver). */
  athleteDetailId: string | null;
  /** Atleta seleccionado en la vista Test 2000m. */
  testAthleteId: string | null;
  /** Atleta seleccionado en la vista Dosificación. */
  dosageAthleteId: string | null;
  /** Test cuyo análisis se muestra en la vista Test 2000m. */
  focusTestId: string | null;
  /** Diálogo a abrir automáticamente en la vista Más. */
  moreDialog: "import" | "ai" | null;
  dark: boolean;

  setTab: (tab: Tab) => void;
  openAthlete: (id: string) => void;
  closeAthlete: () => void;
  setTestAthlete: (id: string | null) => void;
  setDosageAthlete: (id: string | null) => void;
  setFocusTest: (id: string | null) => void;
  setMoreDialog: (dialog: "import" | "ai" | null) => void;
  toggleDark: () => void;
}

const STORAGE_KEY = "ciemhcavi-theme";

function initialDark(): boolean {
  if (typeof window === "undefined") return false;
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved !== null) return saved === "dark";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

function applyDark(dark: boolean) {
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", dark);
  }
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
  }
}

export const useNavStore = create<NavState>((set, get) => ({
  tab: "dashboard",
  previousTab: "dashboard",
  athleteDetailId: null,
  testAthleteId: null,
  dosageAthleteId: null,
  focusTestId: null,
  moreDialog: null,
  dark: initialDark(),

  setTab: (tab) => set({ tab, athleteDetailId: null }),
  openAthlete: (id) => set({ previousTab: get().tab, athleteDetailId: id }),
  closeAthlete: () => set({ athleteDetailId: null }),
  setTestAthlete: (id) => set({ testAthleteId: id }),
  setDosageAthlete: (id) => set({ dosageAthleteId: id }),
  setFocusTest: (id) => set({ focusTestId: id }),
  setMoreDialog: (dialog) => set({ moreDialog: dialog }),
  toggleDark: () => {
    const dark = !get().dark;
    applyDark(dark);
    set({ dark });
  },
}));

/** Aplica el tema persistido al montar la app en el cliente. */
export function hydrateTheme() {
  const dark = initialDark();
  applyDark(dark);
  useNavStore.setState({ dark });
}
