import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/athletes?search=&specialty=&status=&onlyWithVam= */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const search = sp.get("search")?.trim() ?? "";
  const specialty = sp.get("specialty") ?? "";
  const status = sp.get("status") ?? "";
  const withPlan = sp.get("withPlan");

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { code: { contains: search.toUpperCase() } },
      { alias: { contains: search } },
    ];
  }
  if (specialty) where.specialty = specialty;
  if (status) where.status = status;
  if (withPlan === "1") where.vam = { not: null };

  const athletes = await db.athlete.findMany({
    where,
    orderBy: [{ status: "asc" }, { lastName: "asc" }],
    select: {
      id: true, code: true, firstName: true, lastName: true, alias: true,
      specialty: true, status: true, vam: true, mss: true, vo2max: true,
      province: true, birthDate: true, injuryNote: true, riskAcwr: true,
      goalRace: true, testDate: true,
      tests: { orderBy: { date: "desc" }, take: 1, select: { date: true, timeSeconds: true } },
    },
  });

  return NextResponse.json({ athletes, count: athletes.length });
}
