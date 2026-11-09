import { NextResponse } from "next/server";
import { db, admin } from "@/lib/firebase-admin";
import { toFloat, normalizeDate } from "@/lib/utils";

// Resumen de todas las pilas con su último registro, para la planta 3D.
// Vercel la guarda 5 minutos en caché (encabezado Cache-Control) para no gastar lecturas de Firestore.
export const dynamic = "force-dynamic";
const CACHE = { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" };

function serializeValue(v: unknown): unknown {
  if (v instanceof admin.firestore.Timestamp) return v.toDate().toISOString();
  return v;
}

export async function GET() {
  try {
    const snapshot = await db.collection("pilas_compost").get();
    const pilas = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const regsRef = doc.ref.collection("registros");
        const [ultimosSnap, countSnap] = await Promise.all([
          regsRef.orderBy("Fecha", "desc").limit(3).get(),
          regsRef.count().get(),
        ]);
        // Las fechas pueden venir como AAAA-MM-DD o DD/MM/AAAA: se toma la más reciente normalizada
        const ultimo = ultimosSnap.docs
          .map((r) => {
            const d = r.data();
            return {
              id: r.id,
              Fecha: normalizeDate(d.Fecha ?? ""),
              TemperaturaA: toFloat(d.TemperaturaA),
              TemperaturaB: toFloat(d.TemperaturaB),
              TemperaturaC: toFloat(d.TemperaturaC),
              TemperaturaD: toFloat(d.TemperaturaD),
              TemperaturaE: toFloat(d.TemperaturaE),
              PromedioTemperatura: toFloat(d.PromedioTemperatura),
              pH: toFloat(d.pH),
              Humedad: toFloat(d.Humedad),
              Comentario: d.Comentario ?? "",
            };
          })
          .sort((a, b) => b.Fecha.localeCompare(a.Fecha))[0] ?? null;

        return {
          id: doc.id,
          nombre: data.nombre ?? doc.id,
          composicion: data.composicion ?? null,
          estado: data.estado ?? null,
          fecha_inicio: data.fecha_inicio ?? null,
          creado_el: serializeValue(data.creado_el) ?? null,
          ultimo,
          nRegistros: countSnap.data().count,
        };
      })
    );
    return NextResponse.json(pilas, { headers: CACHE });
  } catch (err) {
    console.error("GET /api/planta error:", err);
    return NextResponse.json({ error: "Error al obtener la planta" }, { status: 500 });
  }
}
