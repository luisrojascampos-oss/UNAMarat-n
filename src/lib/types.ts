/** Tipos de transferencia (DTO) compartidos entre API y vistas. */

export interface AthleteListItem {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  alias: string | null;
  specialty: string;
  status: string;
  vam: number | null;
  mss: number | null;
  vo2max: number | null;
  province: string | null;
  birthDate: string | null;
  injuryNote: string | null;
  riskAcwr: number | null;
  goalRace: string | null;
  testDate: string | null;
  tests: { date: string; timeSeconds: number }[];
}

export interface Test2000DTO {
  id: string;
  athleteId: string;
  date: string;
  timeSeconds: number;
  lapTimes: string;
  fcAvg: number | null;
  fcMax: number | null;
  fcRecovery: number | null;
  borg: number | null;
  tempC: number | null;
  humidity: number | null;
  windMs: number | null;
  evaluator: string | null;
  venue: string | null;
  notes: string | null;
}

export interface AthleteDetailDTO {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  alias: string | null;
  cedula: string | null;
  birthDate: string | null;
  province: string | null;
  status: string;
  specialty: string;
  emergencyName: string | null;
  emergencyPhone: string | null;
  emergencyRel: string | null;
  joinDate: string;
  vam: number | null;
  mss: number | null;
  hrMax: number | null;
  hrRest: number | null;
  vo2max: number | null;
  testDate: string | null;
  evaluator: string | null;
  weightKg: number | null;
  heightCm: number | null;
  bodyFatPct: number | null;
  goalRace: string | null;
  goalTime: string | null;
  goalPace: string | null;
  sleepHours: number | null;
  fatigue: number | null;
  doms: number | null;
  readiness: number | null;
  injuryNote: string | null;
  riskAcwr: number | null;
  trailElev: number | null;
  tests: Test2000DTO[];
}

export interface MacrocycleDTO {
  id: string;
  name: string;
  phase: string;
  week: number;
  totalWeeks: number;
  athletes: number;
  colorKey: string;
}

export interface DashboardDTO {
  metrics: {
    totalAthletes: number;
    activeFull: number;
    transitionLow: number;
    evaluationsMonth: number;
    pendingDosage: number;
    plansVigentes: number;
    adherence: number;
    competitions: number;
    goalRunners: number;
  };
  specialties: Record<string, number>;
  macrocycles: MacrocycleDTO[];
  alerts: {
    injury: { id: string; name: string; detail: string | null }[];
    rpe: { id: string; name: string; borg: number }[];
    acwr: { id: string; name: string; value: number | null }[];
    totalCases: number;
  };
  recentActivity: {
    id: string;
    code: string;
    firstName: string;
    lastName: string;
    specialty: string;
    vam: number | null;
    vo2max: number | null;
    trailElev: number | null;
    status: string;
    testDate: string | null;
    goalPace: string | null;
    tests: { timeSeconds: number; date: string }[];
  }[];
}
