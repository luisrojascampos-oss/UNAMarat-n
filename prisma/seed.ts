/**
 * Seed CIEMHCAVI · UNAMaratón Performance Hub
 * Población: 128 atletas (86 activos plenos, 42 transición/baja)
 * Especialidades: Maratón 51 · Medio Fondo 32 · 10K/5K 26 · Trail & Salud 19
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// ── Nombres costarricenses para la generación de roster ────────────────────
const NOMBRES = [
  "Andrés", "Gabriela", "Mario", "Daniela", "Jorge", "Valeria", "Luis", "Camila",
  "Diego", "Ana", "Pablo", "Sofía", "Ricardo", "Mariana", "Alejandro", "Catalina",
  "Fernando", "Adriana", "Miguel", "Laura", "Rafael", "Isabella", "Andrea", "Bruno",
  "Felipe", "Natalia", "Rodrigo", "Paula", "Iván", "Melissa", "Sebastián", "Carolina",
  "Óscar", "Verónica", "Emilio", "Daniela", "Hugo", "Jimena", "Tomás", "Raquel",
];
const APELLIDOS = [
  "Sanchez", "Ramírez", "Vargas", "Castro", "Molina", "Herrera", "Núñez", "Salazar",
  "Cordero", "Jiménez", "Rojas", "Pérez", "Torres", "Quesada", "Aguilar", "Navarro",
  "Barrantes", "Chacón", "Delgado", "Espinoza", "Fallas", "González", "Gutiérrez",
  "Hernández", "Leitón", "Marín", "Monge", "Oviedo", "Padilla", "Zúñiga", "Soto",
  "Villegas", "Araya", "Badilla", "Blanco", "Calderón", "Durán", "Elizondo",
];
const PROVINCIAS = [
  "San José, Costa Rica", "Heredia, Costa Rica", "Alajuela, Costa Rica",
  "Cartago, Costa Rica", "Cartago, Costa Rica", "Puntarenas, Costa Rica",
  "Guanacaste, Costa Rica", "Limón, Costa Rica",
];
const EVALUADORES = [
  "M.Sc. K. Rivera (CIEMHCAVI)", "M.Sc. Entr. (CIEMHCAVI)",
  "Lab. Fisiología UNA", "Lic. A. Vega (CIEMHCAVI)",
];

type Specialty = "MARATON" | "MEDIO_FONDO" | "10K_5K" | "TRAIL_SALUD";

const VAM_RANGE: Record<Specialty, [number, number]> = {
  MARATON: [15.0, 19.4],
  MEDIO_FONDO: [17.0, 21.4],
  "10K_5K": [15.2, 19.0],
  TRAIL_SALUD: [13.5, 16.9],
};

function rnd(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
function rndInt(min: number, max: number): number {
  return Math.floor(rnd(min, max + 1));
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
function daysAgo(days: number, hour = 7): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, rndInt(0, 50), 0, 0);
  return d;
}

// ── 1. ATLETAS DESTACADOS (datos exactos del expediente) ───────────────────
const featured = [
  {
    code: "UNA-ATL-042",
    firstName: "Carlos",
    lastName: "Camacho Garita",
    alias: "Carlos Camacho hijo",
    cedula: "1-1428-0932",
    birthDate: new Date("1995-05-14"),
    province: "Heredia, Costa Rica",
    status: "ACTIVO",
    specialty: "MARATON" as Specialty,
    emergencyName: "Esposa",
    emergencyPhone: "8831-2940",
    emergencyRel: "Esposa",
    joinDate: new Date("2022-02-01"),
    vam: 19.2, mss: 28.5, hrMax: 194, hrRest: 46, vo2max: 64.8,
    weightKg: 65.4, heightCm: 175, bodyFatPct: 8.8,
    goalRace: "Maratón de Valencia", goalTime: "Sub 2h 32m 00s", goalPace: "3:36",
    sleepHours: 8.5, fatigue: 3, doms: 2, readiness: 9,
    evaluator: "M.Sc. K. Rivera (CIEMHCAVI)",
  },
  {
    code: "UNA-ATL-017",
    firstName: "Lucía",
    lastName: "Rojas Vega",
    birthDate: new Date("1998-03-22"),
    province: "San José, Costa Rica",
    status: "ACTIVO",
    specialty: "MARATON" as Specialty,
    joinDate: new Date("2023-01-15"),
    vam: 17.4, mss: 25.1, hrMax: 188, hrRest: 52, vo2max: 58.4,
    weightKg: 54.2, heightCm: 163, bodyFatPct: 14.2,
    goalRace: "Media Maratón San José", goalTime: "Sub 1h 24m", goalPace: "3:58",
    sleepHours: 7.8, fatigue: 4, doms: 3, readiness: 8,
    evaluator: "M.Sc. K. Rivera (CIEMHCAVI)",
  },
  {
    code: "UNA-ATL-009",
    firstName: "Esteban",
    lastName: "Alvarado Salas",
    birthDate: new Date("2001-09-08"),
    province: "Cartago, Costa Rica",
    status: "ACTIVO",
    specialty: "MEDIO_FONDO" as Specialty,
    joinDate: new Date("2023-08-20"),
    vam: 19.8, mss: 29.2, hrMax: 196, hrRest: 44, vo2max: 68.2,
    weightKg: 63.1, heightCm: 177, bodyFatPct: 7.4,
    goalRace: "10K UNA Universitarios", goalTime: "Sub 31m 30s", goalPace: "3:15",
    sleepHours: 8.2, fatigue: 3, doms: 2, readiness: 9,
    evaluator: "M.Sc. Entr. (CIEMHCAVI)",
  },
  {
    code: "UNA-ATL-073",
    firstName: "Mariana",
    lastName: "Mora Céspedes",
    birthDate: new Date("2000-11-30"),
    province: "Alajuela, Costa Rica",
    status: "ACTIVO",
    specialty: "10K_5K" as Specialty,
    joinDate: new Date("2024-02-10"),
    vam: null, mss: null, hrMax: 191, hrRest: 50, vo2max: null,
    weightKg: 57.8, heightCm: 168, bodyFatPct: 16.8,
    goalRace: "10K UNA Universitarios", goalTime: "Reevaluación pendiente", goalPace: null,
    sleepHours: 7.4, fatigue: 6, doms: 5, readiness: 6,
    evaluator: null,
  },
  {
    code: "UNA-ATL-088",
    firstName: "Diego",
    lastName: "Valverde Guzmán",
    birthDate: new Date("1993-07-12"),
    province: "Puntarenas, Costa Rica",
    status: "ACTIVO",
    specialty: "TRAIL_SALUD" as Specialty,
    joinDate: new Date("2022-09-05"),
    vam: 16.2, mss: 24.0, hrMax: 186, hrRest: 48, vo2max: 55.6,
    weightKg: 68.9, heightCm: 180, bodyFatPct: 10.6,
    goalRace: "Trail 30K Chirripó", goalTime: "Sub 2h 55m", goalPace: "4:42",
    sleepHours: 7.0, fatigue: 4, doms: 4, readiness: 8,
    trailElev: 1450,
    evaluator: "Lab. Fisiología UNA",
  },
  {
    code: "UNA-ATL-051",
    firstName: "Fernando",
    lastName: "Porras Mena",
    birthDate: new Date("1996-01-25"),
    province: "Heredia, Costa Rica",
    status: "ACTIVO",
    specialty: "MEDIO_FONDO" as Specialty,
    joinDate: new Date("2023-04-18"),
    vam: 18.6, mss: 27.2, hrMax: 192, hrRest: 47, vo2max: 61.5,
    weightKg: 66.0, heightCm: 176, bodyFatPct: 9.1,
    goalRace: "10K UNA Universitarios", goalTime: "Sub 34m", goalPace: "3:24",
    sleepHours: 6.9, fatigue: 7, doms: 6, readiness: 5,
    injuryNote: "Tendón de Aquiles (protocolo kinesiológico activo)",
    evaluator: "Lic. A. Vega (CIEMHCAVI)",
  },
  {
    code: "UNA-ATL-023",
    firstName: "Karla",
    lastName: "Brenes Ureña",
    birthDate: new Date("1997-06-04"),
    province: "San José, Costa Rica",
    status: "ACTIVO",
    specialty: "MARATON" as Specialty,
    joinDate: new Date("2022-11-12"),
    vam: 17.9, mss: 25.8, hrMax: 189, hrRest: 51, vo2max: 59.2,
    weightKg: 55.6, heightCm: 165, bodyFatPct: 13.5,
    goalRace: "Media Maratón San José", goalTime: "Sub 1h 22m", goalPace: "3:52",
    sleepHours: 7.2, fatigue: 6, doms: 6, readiness: 6,
    riskAcwr: 1.52,
    evaluator: "M.Sc. K. Rivera (CIEMHCAVI)",
  },
  {
    code: "UNA-ATL-064",
    firstName: "Marco",
    lastName: "Solano Retana",
    birthDate: new Date("1994-10-17"),
    province: "Cartago, Costa Rica",
    status: "ACTIVO",
    specialty: "10K_5K" as Specialty,
    joinDate: new Date("2023-06-30"),
    vam: 18.1, mss: 26.4, hrMax: 190, hrRest: 49, vo2max: 60.1,
    weightKg: 69.2, heightCm: 178, bodyFatPct: 10.2,
    goalRace: "10K UNA Universitarios", goalTime: "Sub 35m", goalPace: "3:30",
    sleepHours: 7.6, fatigue: 5, doms: 5, readiness: 7,
    riskAcwr: 1.48,
    evaluator: "M.Sc. Entr. (CIEMHCAVI)",
  },
];

// ── 2. ROSTER GENERADO ─────────────────────────────────────────────────────
function buildRoster() {
  const counts: Record<Specialty, number> = {
    MARATON: 51, MEDIO_FONDO: 32, "10K_5K": 26, TRAIL_SALUD: 19,
  };
  // Descuentos por los destacados
  counts.MARATON -= 3; // Carlos, Lucía, Karla
  counts.MEDIO_FONDO -= 2; // Esteban, Fernando
  counts["10K_5K"] -= 2; // Mariana, Marco
  counts.TRAIL_SALUD -= 1; // Diego

  const athletes: Array<{
    code: string; firstName: string; lastName: string; specialty: Specialty;
    status: string; birthDate: Date; province: string; joinDate: Date;
    vam: number | null; mss: number | null; hrMax: number; hrRest: number;
    vo2max: number | null; weightKg: number; heightCm: number; bodyFatPct: number;
    sleepHours: number; fatigue: number; doms: number; readiness: number;
    goalRace: string; goalTime: string; goalPace: string | null;
    riskAcwr?: number; trailElev?: number; evaluator?: string;
  }> = [];

  let seq = 101;

  for (const spec of Object.keys(counts) as Specialty[]) {
    for (let i = 0; i < counts[spec]; i++) {
      const [vMin, vMax] = VAM_RANGE[spec];
      const status = "PEND"; // se asigna después
      const vam = round1(rnd(vMin, vMax));
      const mss = round1(vam + rnd(6.5, 10.5));
      const heightCm = rndInt(156, 189);
      const weightKg = round1(rnd(19.5, 24.5) * Math.pow(heightCm / 100, 2));
      athletes.push({
        code: `UNA-ATL-${String(seq++).padStart(3, "0")}`,
        firstName: pick(NOMBRES),
        lastName: `${pick(APELLIDOS)} ${pick(APELLIDOS)}`,
        specialty: spec,
        status,
        birthDate: daysAgo(rndInt(18, 40) * 365),
        province: pick(PROVINCIAS),
        joinDate: daysAgo(rndInt(60, 1100)),
        vam,
        mss,
        hrMax: rndInt(184, 199),
        hrRest: rndInt(42, 57),
        vo2max: round1(vam * rnd(3.2, 3.5)),
        weightKg,
        heightCm,
        bodyFatPct: round1(rnd(6.2, 17.8)),
        sleepHours: round1(rnd(6.2, 8.9)),
        fatigue: rndInt(2, 6),
        doms: rndInt(1, 5),
        readiness: rndInt(6, 10),
        goalRace: spec === "MARATON" ? "Media Maratón San José"
          : spec === "10K_5K" ? "10K UNA Universitarios"
          : spec === "MEDIO_FONDO" ? "10K UNA Universitarios"
          : "Trail 30K Chirripó",
        goalTime: spec === "MARATON" ? "Sub 1h 30m" : "Sub 40m",
        goalPace: null,
        evaluator: pick(EVALUADORES),
      });
    }
  }

  // Asignación de estados: 86 ACTIVO en total (8 destacados ya activos)
  const activosNecesarios = 86 - 8;
  let asignados = 0;
  for (const a of athletes) {
    if (asignados < activosNecesarios) {
      a.status = "ACTIVO";
      asignados++;
    } else {
      a.status = Math.random() < 0.65 ? "TRANSICION" : "BAJA";
      // Los de transición/baja sin dosificación vigente
      if (Math.random() < 0.5) a.vam = null;
    }
  }

  // 8 activos sin VAM (por dosificar), incluyendo a Mariana
  const activos = athletes.filter((a) => a.status === "ACTIVO" && a.vam !== null);
  for (let i = 0; i < 7 && i < activos.length; i++) {
    activos[i].vam = null;
    activos[i].mss = null;
    activos[i].vo2max = null;
    activos[i].evaluator = null;
  }

  return athletes;
}

async function main() {
  console.log("Borrando datos previos…");
  await db.test2000.deleteMany();
  await db.athlete.deleteMany();
  await db.macrocycle.deleteMany();

  // Macrociclos competitivos
  await db.macrocycle.createMany({
    data: [
      { name: "Media Maratón San José", phase: "Volumen / Capacidad Aeróbica", week: 8, totalWeeks: 16, athletes: 34, colorKey: "secondary", sortOrder: 1 },
      { name: "10K UNA Universitarios", phase: "Potencia VAM e Intensidad", week: 5, totalWeeks: 10, athletes: 28, colorKey: "tertiary", sortOrder: 2 },
      { name: "Maratón de Valencia 2025", phase: "Diagnóstico Inicial y VAM Base", week: 2, totalWeeks: 24, athletes: 18, colorKey: "primary", sortOrder: 3 },
    ],
  });

  // Destacados (con updatedAt explícito para el feed de actividad reciente)
  const minsAgo = (m: number) => new Date(Date.now() - m * 60 * 1000);
  const carlos = await db.athlete.create({
    data: { ...featured[0], testDate: new Date("2025-01-18"), updatedAt: minsAgo(240) },
  });
  const lucia = await db.athlete.create({
    data: { ...featured[1], testDate: daysAgo(6), updatedAt: minsAgo(8) },
  });
  const esteban = await db.athlete.create({
    data: { ...featured[2], testDate: daysAgo(3), updatedAt: minsAgo(18) },
  });
  const mariana = await db.athlete.create({ data: { ...featured[3], testDate: null, updatedAt: minsAgo(33) } }); // Mariana
  const diego = await db.athlete.create({
    data: { ...featured[4], testDate: daysAgo(10), updatedAt: minsAgo(47) },
  });
  const fernando = await db.athlete.create({
    data: { ...featured[5], testDate: daysAgo(21), updatedAt: daysAgo(1) },
  });
  const karla = await db.athlete.create({
    data: { ...featured[6], testDate: daysAgo(14), updatedAt: daysAgo(2) },
  });
  const marco = await db.athlete.create({
    data: { ...featured[7], testDate: daysAgo(9), updatedAt: daysAgo(1) },
  });

  // Roster generado (updatedAt en el pasado para no saturar el feed reciente)
  const roster = buildRoster();
  for (const a of roster) {
    await db.athlete.create({
      data: {
        ...a,
        testDate: a.vam ? daysAgo(rndInt(5, 60)) : null,
        updatedAt: daysAgo(rndInt(1, 30)),
      },
    });
  }

  // ── Tests del expediente Carlos Camacho (4 registros) ────────────────────
  await db.test2000.create({
    data: {
      athleteId: carlos.id, date: new Date("2024-05-24T07:10:00"),
      timeSeconds: 383, lapTimes: JSON.stringify({ times: [74.6, 76.4, 77.8, 78.2, 76.0], fcs: [174, 180, 184, 188, 192] }),
      fcAvg: 181, fcMax: 192, fcRecovery: 152, borg: 8.8,
      evaluator: "Lab. Fisiología UNA", venue: "Pista Sintética CIEMHCAVI · Barreal de Heredia",
      notes: "Test de Campo 2000m Pre-Media Maratón",
    },
  });
  await db.test2000.create({
    data: {
      athleteId: carlos.id, date: new Date("2024-07-15T06:45:00"),
      timeSeconds: 384.2, lapTimes: JSON.stringify({ times: [75.2, 76.9, 78.0, 78.4, 75.7], fcs: [175, 181, 185, 189, 193] }),
      fcAvg: 182, fcMax: 193, fcRecovery: 150, borg: 9.0,
      evaluator: "M.Sc. Entr. (CIEMHCAVI)", venue: "Pista Sintética CIEMHCAVI · Barreal de Heredia",
      notes: "Control de progreso macrociclo específico",
    },
  });
  // Test estrella: análisis del diseño (28/10/2024 06:30, 06:15.0)
  await db.test2000.create({
    data: {
      athleteId: carlos.id, date: new Date("2024-10-28T06:30:00"),
      timeSeconds: 375, lapTimes: JSON.stringify({ times: [72.8, 74.4, 76.2, 77.1, 74.5], fcs: [172, 182, 188, 192, 196] }),
      fcAvg: 184, fcMax: 196, fcRecovery: 148, borg: 9.5,
      tempC: 19, humidity: 78, windMs: 0.8,
      evaluator: "M.Sc. Entr.", venue: "Pista Sintética CIEMHCAVI · Barreal de Heredia",
      notes: "Test de Campo 2000m CIEMHCAVI — protocolo válido",
    },
  });
  await db.test2000.create({
    data: {
      athleteId: carlos.id, date: new Date("2025-01-18T06:40:00"),
      timeSeconds: 375, lapTimes: JSON.stringify({ times: [73.1, 74.2, 75.9, 76.8, 75.0], fcs: [171, 181, 187, 191, 195] }),
      fcAvg: 183, fcMax: 195, fcRecovery: 147, borg: 9.3,
      evaluator: "M.Sc. K. Rivera (CIEMHCAVI)", venue: "Pista Sintética CIEMHCAVI · Barreal de Heredia",
      notes: "Test de Campo 2000m CIEMHCAVI",
    },
  });

  // Tests recientes de los atletas del feed de actividad
  await db.test2000.create({
    data: {
      athleteId: lucia.id, date: daysAgo(6, 7), timeSeconds: 414,
      lapTimes: JSON.stringify({ times: [80.4, 82.6, 83.5, 84.1, 83.4], fcs: [168, 174, 179, 183, 186] }),
      fcAvg: 178, fcMax: 186, fcRecovery: 142, borg: 7.8,
      tempC: 21, humidity: 74, windMs: 1.2,
      evaluator: "M.Sc. K. Rivera (CIEMHCAVI)", venue: "Pista Sintética CIEMHCAVI",
    },
  });
  await db.test2000.create({
    data: {
      athleteId: esteban.id, date: daysAgo(3, 7), timeSeconds: 363.6,
      lapTimes: JSON.stringify({ times: [70.9, 72.2, 73.1, 74.0, 73.4], fcs: [174, 181, 186, 191, 195] }),
      fcAvg: 186, fcMax: 195, fcRecovery: 146, borg: 7.6,
      tempC: 20, humidity: 76, windMs: 0.9,
      evaluator: "M.Sc. Entr. (CIEMHCAVI)", venue: "Pista Sintética CIEMHCAVI",
    },
  });
  await db.test2000.create({
    data: {
      athleteId: diego.id, date: daysAgo(10, 6), timeSeconds: 444.4,
      lapTimes: JSON.stringify({ times: [86.2, 88.5, 89.4, 90.3, 90.0], fcs: [160, 166, 170, 176, 181] }),
      fcAvg: 172, fcMax: 181, fcRecovery: 138, borg: 7.2,
      tempC: 23, humidity: 70, windMs: 1.8,
      evaluator: "Lab. Fisiología UNA", venue: "Ruta Trail Barva",
    },
  });

  // 3 atletas con RPE > 8 (alerta de vigilancia médica)
  const rpeAthletes = await db.athlete.findMany({
    where: { status: "ACTIVO", vam: { not: null }, id: { notIn: [carlos.id, esteban.id] } },
    take: 3,
  });
  for (const a of rpeAthletes) {
    const t = 2000 / (a.vam! / 3.6);
    await db.test2000.create({
      data: {
        athleteId: a.id, date: daysAgo(rndInt(2, 8), 7),
        timeSeconds: Math.round(t * 10) / 10,
        lapTimes: JSON.stringify({ times: Array.from({ length: 5 }, () => Math.round(t / 5 * 10) / 10) }),
        fcAvg: rndInt(180, 190), fcMax: rndInt(190, 198), fcRecovery: rndInt(140, 155),
        borg: round1(rnd(8.2, 9.4)),
        evaluator: "M.Sc. Entr. (CIEMHCAVI)", venue: "Pista Sintética CIEMHCAVI",
      },
    });
  }

  // Evaluaciones del mes en curso (34 en total, incluyendo las de arriba)
  const now0 = new Date();
  const monthStart = new Date(now0.getFullYear(), now0.getMonth(), 1);
  const monthTests = await db.test2000.count({ where: { date: { gte: monthStart } } });
  const activosPool = await db.athlete.findMany({
    where: { status: "ACTIVO", vam: { not: null }, id: { notIn: [carlos.id, lucia.id, esteban.id, diego.id, ...rpeAthletes.map((a) => a.id)] } },
  });
  let extra = 34 - monthTests;
  let idx = 0;
  // Día actual dentro del mes para no derramar evaluaciones al mes anterior
  const todayD = new Date().getDate();
  while (extra > 0 && idx < activosPool.length) {
    const a = activosPool[idx++];
    const t = 2000 / (a.vam! / 3.6) * rnd(0.985, 1.06); // pequeña variación real
    await db.test2000.create({
      data: {
        athleteId: a.id, date: daysAgo(rndInt(0, Math.max(todayD - 1, 0)), rndInt(6, 17)),
        timeSeconds: Math.round(t * 10) / 10,
        lapTimes: JSON.stringify({ times: Array.from({ length: 5 }, () => Math.round(t / 5 * 10) / 10) }),
        fcAvg: rndInt(175, 188), fcMax: rndInt(186, 197), fcRecovery: rndInt(135, 152),
        borg: round1(rnd(4.5, 7.9)),
        evaluator: pick(EVALUADORES), venue: "Pista Sintética CIEMHCAVI",
      },
    });
    extra--;
  }

  // Sanity check
  const total = await db.athlete.count();
  const activos = await db.athlete.count({ where: { status: "ACTIVO" } });
  const conVam = await db.athlete.count({ where: { status: "ACTIVO", vam: { not: null } } });
  const porEspecialidad = await db.athlete.groupBy({
    by: ["specialty"], _count: { _all: true },
  });
  const tests = await db.test2000.count();
  console.log({ total, activos, conVam, porEspecialidad, tests });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
