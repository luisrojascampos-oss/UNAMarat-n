import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeVam } from "@/lib/sports-science";

export const dynamic = "force-dynamic";

interface ImportRow {
  firstName?: string;
  lastName?: string;
  specialty?: string;
  status?: string;
  vam?: number | string | null;
  mss?: number | string | null;
  hrMax?: number | string | null;
  hrRest?: number | string | null;
  weightKg?: number | string | null;
  heightCm?: number | string | null;
  province?: string | null;
  goalRace?: string | null;
  time2000?: string | null; // mm:ss.d — alternativa a vam
}

const VALID_SPECIALTIES = new Set(["MARATON", "MEDIO_FONDO", "10K_5K", "TRAIL_SALUD"]);
const VALID_STATUSES = new Set(["ACTIVO", "TRANSICION", "BAJA"]);

function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? null : n;
}

/** POST /api/athletes/import — importación masiva desde CSV/Excel (histórico CIEMHCAVI). */
export async function POST(req: NextRequest) {
  let rows: ImportRow[];
  try {
    const json = await req.json();
    rows = json.rows ?? [];
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No se recibieron filas para importar" }, { status: 400 });
  }
  if (rows.length > 500) {
    return NextResponse.json({ error: "Máximo 500 filas por lote" }, { status: 400 });
  }

  // Código correlativo basado en el máximo existente
  const lastAthlete = await db.athlete.findFirst({
    orderBy: { code: "desc" },
    select: { code: true },
  });
  let seq = lastAthlete ? parseInt(lastAthlete.code.split("-")[2] ?? "128", 10) + 1 : 129;

  let created = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const firstName = r.firstName?.trim();
    const lastName = r.lastName?.trim();
    if (!firstName || !lastName) {
      errors.push(`Fila ${i + 1}: falta nombre o apellido`);
      continue;
    }
    const specialty = VALID_SPECIALTIES.has(String(r.specialty)) ? String(r.specialty) : "10K_5K";
    const status = VALID_STATUSES.has(String(r.status)) ? String(r.status) : "ACTIVO";

    let vam = toNum(r.vam);
    if (vam === null && r.time2000) {
      const raw = String(r.time2000).trim().replace(",", ".");
      if (raw.includes(":")) {
        const [m, s] = raw.split(":");
        const secs = parseFloat(m) * 60 + parseFloat(s);
        if (!isNaN(secs) && secs > 0) vam = computeVam(secs);
      }
    }

    await db.athlete.create({
      data: {
        code: `UNA-ATL-${String(seq++).padStart(3, "0")}`,
        firstName,
        lastName,
        specialty,
        status,
        vam: vam && vam >= 8 && vam <= 26 ? vam : null,
        mss: toNum(r.mss),
        hrMax: toNum(r.hrMax) as number | null,
        hrRest: toNum(r.hrRest) as number | null,
        weightKg: toNum(r.weightKg),
        heightCm: toNum(r.heightCm),
        province: r.province?.trim() || null,
        goalRace: r.goalRace?.trim() || null,
        joinDate: new Date(),
        testDate: vam ? new Date() : null,
      },
    });
    created++;
  }

  return NextResponse.json({ created, errors, nextCode: seq }, { status: 201 });
}
