import { NextResponse } from "next/server";
import { db, admin } from "@/lib/firebase-admin";
import { toFloat } from "@/lib/utils";

function serializeValue(v: unknown): unknown {
  if (v instanceof admin.firestore.Timestamp) return v.toDate().toISOString();
  return v;
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const pilaId = decodeURIComponent(params.id);

  try {
    const pilaDoc = await db.collection("pilas_compost").doc(pilaId).get();
    if (!pilaDoc.exists) {
      return NextResponse.json({ error: "Pila no encontrada" }, { status: 404 });
    }

    const rawMeta = pilaDoc.data()!;
    const meta = {
      id: pilaDoc.id,
      nombre: rawMeta.nombre ?? pilaDoc.id,
      composicion: rawMeta.composicion ?? null,
      estado: rawMeta.estado ?? null,
      fecha_inicio: rawMeta.fecha_inicio ?? null,
      creado_el: serializeValue(rawMeta.creado_el) ?? null,
    };

    const registrosSnap = await db
      .collection("pilas_compost")
      .doc(pilaId)
      .collection("registros")
      .orderBy("Fecha")
      .get();

    const registros = registrosSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        Fecha: d.Fecha ?? "",
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
    });

    return NextResponse.json({ meta, registros });
  } catch (err) {
    console.error(`GET /api/pilas/${pilaId} error:`, err);
    return NextResponse.json(
      { error: "Error al obtener la pila" },
      { status: 500 }
    );
  }
}
