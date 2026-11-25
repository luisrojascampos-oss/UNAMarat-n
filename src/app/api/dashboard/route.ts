import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/dashboard — agregados del Panel de Control General. */
export async function GET() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const recentWindow = new Date(now.getTime() - 14 * 24 * 3600 * 1000);

  const [
    totalAthletes,
    activeFull,
    transitionLow,
    plansVigentes,
    pendingDosage,
    evaluationsMonth,
    bySpecialty,
    macrocycles,
    injuryAthletes,
    rpeTests,
    acwrAthletes,
    recentActivity,
  ] = await Promise.all([
    db.athlete.count(),
    db.athlete.count({ where: { status: "ACTIVO" } }),
    db.athlete.count({ where: { status: { not: "ACTIVO" } } }),
    db.athlete.count({ where: { status: "ACTIVO", vam: { not: null } } }),
    db.athlete.count({ where: { status: "ACTIVO", vam: null } }),
    db.test2000.count({ where: { date: { gte: monthStart } } }),
    db.athlete.groupBy({ by: ["specialty"], _count: { _all: true } }),
    db.macrocycle.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    db.athlete.findMany({
      where: { injuryNote: { not: null } },
      select: { id: true, firstName: true, lastName: true, injuryNote: true, alias: true },
    }),
    db.test2000.findMany({
      where: { borg: { gt: 8 }, date: { gte: recentWindow } },
      select: { borg: true, athlete: { select: { id: true, firstName: true, lastName: true, alias: true } } },
      orderBy: { borg: "desc" },
    }),
    db.athlete.findMany({
      where: { riskAcwr: { gt: 1.45 } },
      select: { id: true, firstName: true, lastName: true, alias: true, riskAcwr: true },
    }),
    db.athlete.findMany({
      orderBy: { updatedAt: "desc" },
      take: 4,
      select: {
        id: true, code: true, firstName: true, lastName: true, specialty: true,
        vam: true, vo2max: true, trailElev: true, status: true, testDate: true,
        goalPace: true,
        tests: { orderBy: { date: "desc" }, take: 1, select: { timeSeconds: true, date: true } },
      },
    }),
  ]);

  const specialtyMap: Record<string, number> = {
    MARATON: 0, MEDIO_FONDO: 0, "10K_5K": 0, TRAIL_SALUD: 0,
  };
  for (const s of bySpecialty) specialtyMap[s.specialty] = s._count._all;

  // Alerta 1: molestias físicas + RPE crítico (atletas únicos)
  const rpeByAthlete = new Map<string, { name: string; borg: number }>();
  for (const t of rpeTests) {
    const id = t.athlete.id;
    if (!rpeByAthlete.has(id)) {
      rpeByAthlete.set(id, {
        name: `${t.athlete.firstName} ${t.athlete.lastName.charAt(0)}.`,
        borg: t.borg,
      });
    }
  }
  const injuryNames = injuryAthletes.map((a) => ({
    id: a.id,
    name: `${a.firstName} ${a.lastName.charAt(0)}.`,
    detail: a.injuryNote,
  }));
  const rpeList = [...rpeByAthlete.entries()].map(([id, v]) => ({ id, name: v.name, borg: v.borg }));

  const adherence = activeFull > 0 ? Math.round((plansVigentes / activeFull) * 1000) / 10 : 0;

  return NextResponse.json({
    metrics: {
      totalAthletes,
      activeFull,
      transitionLow,
      evaluationsMonth,
      pendingDosage,
      plansVigentes,
      adherence,
      competitions: macrocycles.length,
      goalRunners: macrocycles.reduce((a, m) => a + m.athletes, 0),
    },
    specialties: specialtyMap,
    macrocycles,
    alerts: {
      injury: injuryNames,
      rpe: rpeList,
      acwr: acwrAthletes.map((a) => ({
        id: a.id,
        name: `${a.firstName} ${a.lastName.charAt(0)}.`,
        value: a.riskAcwr,
      })),
      totalCases: injuryNames.length + rpeList.length + acwrAthletes.length,
    },
    recentActivity,
  });
}
