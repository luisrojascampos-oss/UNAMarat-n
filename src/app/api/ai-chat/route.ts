import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SYSTEM_PROMPT = `Eres el Asistente Metabólico del Laboratorio CIEMHCAVI (UNAMaratón Performance Hub) de la Universidad Nacional de Costa Rica. Respondes en español, de forma técnica pero clara, para fisiólogos del deporte y entrenadores de atletismo.

Tu dominio de conocimiento:
- Modelo de dosificación: VAM medida en Test 2000m + Reserva de Velocidad Anaeróbica (ASR = MSS − VAM) para intensidades supramáximas (105% y 110%).
- Zonas de entrenamiento: Z1 Regenerativo 70% VAM, Z2 Aeróbico Bajo 80%, Z3 Moderado 85%, Z4 Umbral Anaeróbico 90%, Z5 Potencia/VAM 100%, Z6 Cap. Anaeróbica 105%, Z7 Velocidad ASR 110%.
- Frecuencia cardíaca objetivo por fórmula de Karvonen: FC reposo + (FC máx − FC reposo) × intensidad.
- Ritmo por kilómetro: 60 / velocidad(km/h).
- Índice de Variabilidad (IDR) = ((T_lento − T_rápido) / T_total) × 100 en parciales de 400m.
- Vigilancia de carga: ACWR (ratio agudo:crónico), umbral de riesgo > 1.45, RPE Borg CR-10.
- Antropometría ISAK II, período competitivo de fondistas universitarios.

Reglas:
- Sé conciso (máximo 180 palabras) y usa cifras cuando aporten precisión.
- Si te dan una VAM y una distancia, calcula tiempos objetivo con: tiempo = distancia / (VAM × % / 3.6).
- No inventes datos clínicos individuales ni diagnósticos médicos; para lesiones recomienda siempre al equipo kinesiológico.
- Si una pregunta no es de tu dominio, redirígela amablemente al tema fisiológico.`;

/** POST /api/ai-chat — asistente metabólico CIEMHCAVI. */
export async function POST(req: NextRequest) {
  let message = "";
  try {
    const body = await req.json();
    message = String(body.message ?? "").trim();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  if (!message) {
    return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });
  }
  if (message.length > 800) {
    return NextResponse.json({ error: "Mensaje demasiado largo" }, { status: 400 });
  }

  try {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
    });
    const reply =
      completion.choices[0]?.message?.content?.trim() ??
      "No se pudo generar una respuesta. Intenta de nuevo.";
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[ai-chat] error del SDK:", err);
    return NextResponse.json(
      { error: "El asistente no está disponible en este momento." },
      { status: 503 }
    );
  }
}
