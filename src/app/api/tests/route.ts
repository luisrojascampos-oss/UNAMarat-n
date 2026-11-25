import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeVam, computeAsr, estimateVo2Max } from "@/lib/sports-science";

export const dynamic = "force-dynamic";

/** GET /api/tests?limit= — tests recientes con atleta. */
export async function GET(req: NextRequest) {
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 20);
  const tests = await db.test2000.findMany({
    orderBy: { date: "desc" },
    take: Math.min(limit, 100),
    include: {
      athlete: {
        select: { id: true, code: true, firstName: true, lastName: true, specialty: true },
      },
    },
  });
  return NextResponse.json({ tests });
}

interface CreateTestBody {
  athleteId: string;
  date?: string;
  timeSeconds: number;
  lapTimes?: number[] | { times: number[]; fcs?: number[] };
  fcAvg?: number;
  fcMax?: number;
  fcRecovery?: number;
  borg?: number;
  tempC?: number;
  humidity?: number;
  windMs?: number;
  evaluator?: string;
  venue?: string;
  notes?: string;
}

/** POST /api/tests — registra un test 2000m y actualiza la referencia fisiológica. */
export async function POST(req: NextRequest) {
  let body: CreateTestBody;
  try {
    body = (await req.json()) as CreateTestBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { athleteId, timeSeconds } = body;
  if (!athleteId || !timeSeconds || timeSeconds <= 0) {
    return NextResponse.json(
      { error: "athleteId y timeSeconds son obligatorios (tiempo > 0)" },
      { status: 400 }
    );
  }
  if (timeSeconds < 240 || timeSeconds > 1800) {
    return NextResponse.json(
      { error: "Tiempo fuera de rango fisiológico (4:00 – 30:00)" },
      { status: 400 }
    );
  }

  const athlete = await db.athlete.findUnique({ where: { id: athleteId } });
  if (!athlete) {
    return NextResponse.json({ error: "Atleta no encontrado" }, { status: 404 });
  }

  const testDate = body.date ? new Date(body.date) : new Date();
  const vam = computeVam(timeSeconds);

  const test = await db.test2000.create({
    data: {
      athleteId,
      date: testDate,
      timeSeconds,
      lapTimes: JSON.stringify(body.lapTimes ?? []),
      fcAvg: body.fcAvg ?? null,
      fcMax: body.fcMax ?? null,
      fcRecovery: body.fcRecovery ?? null,
      borg: body.borg ?? null,
      tempC: body.tempC ?? null,
      humidity: body.humidity ?? null,
      windMs: body.windMs ?? null,
      evaluator: body.evaluator ?? null,
      venue: body.venue ?? "Pista Sintética CIEMHCAVI · Barreal de Heredia",
      notes: body.notes ?? "Test de Campo 2000m CIEMHCAVI",
    },
  });

  // Test anterior inmediato para comparativa
  const previous = await db.test2000.findFirst({
    where: { athleteId, id: { not: test.id }, date: { lt: testDate } },
    orderBy: { date: "desc" },
  });

  // Actualización de la referencia fisiológica del expediente
  // (Principio: la VAM vigente proviene del último test certificado)
  const asr = athlete.mss ? computeAsr(vam, athlete.mss) : null;
  await db.athlete.update({
    where: { id: athleteId },
    data: {
      vam,
      vo2max: athlete.vo2max ?? estimateVo2Max(vam),
      mss: athlete.mss ?? Math.round((vam + 9.2) * 10) / 10, // MSS estimado si no hay registro
      hrMax: body.fcMax ?? athlete.hrMax,
      testDate,
      evaluator: body.evaluator ?? athlete.evaluator,
      updatedAt: new Date(),
    },
  });
  void asr;

  const previousVam = previous ? computeVam(previous.timeSeconds) : null;
  const deltaSeconds = previous ? Math.round((previous.timeSeconds - timeSeconds) * 10) / 10 : null;
  const deltaVamPct = previousVam
    ? Math.round((vam - previousVam) / previousVam * 1000) / 10
    : null;

  return NextResponse.json({
    test,
    vam,
    pacePerKm: 60 / vam,
    previous,
    previousVam,
    deltaSeconds,
    deltaVamPct,
  }, { status: 201 });
}
