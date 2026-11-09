import { NextResponse } from "next/server";
import { db, admin } from "@/lib/firebase-admin";

// Sin esto Next.js guarda la lista al publicar y no muestra pilas nuevas.
// Vercel la guarda 5 minutos en caché (encabezado Cache-Control) para no gastar lecturas.
export const dynamic = "force-dynamic";
const CACHE = { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" };

function serializeValue(v: unknown): unknown {
  if (v instanceof admin.firestore.Timestamp) return v.toDate().toISOString();
  return v;
}

export async function GET() {
  try {
    const snapshot = await db.collection("pilas_compost").get();
    const pilas = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        nombre: data.nombre ?? doc.id,
        composicion: data.composicion ?? null,
        estado: data.estado ?? null,
        fecha_inicio: data.fecha_inicio ?? null,
        creado_el: serializeValue(data.creado_el) ?? null,
      };
    });
    return NextResponse.json(pilas, { headers: CACHE });
  } catch (err) {
    console.error("GET /api/pilas error:", err);
    return NextResponse.json(
      { error: "Error al obtener las pilas" },
      { status: 500 }
    );
  }
}
