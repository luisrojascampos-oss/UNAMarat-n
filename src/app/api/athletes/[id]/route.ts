import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/athletes/[id] — expediente completo con historial de tests. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const athlete = await db.athlete.findUnique({
    where: { id },
    include: {
      tests: { orderBy: { date: "desc" } },
    },
  });
  if (!athlete) {
    return NextResponse.json({ error: "Atleta no encontrado" }, { status: 404 });
  }
  return NextResponse.json({ athlete });
}
