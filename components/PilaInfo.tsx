"use client";

import type { Pila } from "@/types";

interface Props {
  meta: Pila;
  totalRegistros: number;
}

const estadoBadge: Record<string, string> = {
  Activo: "bg-green-100 text-green-700 ring-1 ring-green-300",
  Finalizado: "bg-gray-100 text-gray-600 ring-1 ring-gray-300",
};

export default function PilaInfo({ meta, totalRegistros }: Props) {
  const badge = estadoBadge[meta.estado ?? ""] ?? "bg-blue-100 text-blue-700 ring-1 ring-blue-300";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-agro-blue">{meta.id}</h2>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge}`}>
              {meta.estado ?? "—"}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            <span className="font-medium text-gray-700">Composición: </span>
            {meta.composicion ?? "No especificada"}
          </p>
        </div>
        <div className="flex gap-6 text-sm">
          <div className="text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Inicio</p>
            <p className="font-semibold text-gray-700">{meta.fecha_inicio ?? "—"}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Registros</p>
            <p className="font-semibold text-agro-green text-lg leading-tight">{totalRegistros}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
