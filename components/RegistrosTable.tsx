"use client";

import type { Registro } from "@/types";
import { fmt } from "@/lib/utils";

interface Props {
  registros: Registro[];
}

export default function RegistrosTable({ registros }: Props) {
  if (!registros.length) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400 text-sm">
        No hay registros para esta pila.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
          Tabla de registros diarios
        </h3>
      </div>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-agro-green text-white text-xs uppercase tracking-wider">
              <th className="px-3 py-3 text-center font-semibold">Día</th>
              <th className="px-3 py-3 text-center font-semibold">Fecha</th>
              <th className="px-3 py-3 text-center font-semibold">Temp A</th>
              <th className="px-3 py-3 text-center font-semibold">Temp B</th>
              <th className="px-3 py-3 text-center font-semibold">Temp C</th>
              <th className="px-3 py-3 text-center font-semibold">Temp D</th>
              <th className="px-3 py-3 text-center font-semibold">Temp E</th>
              <th className="px-3 py-3 text-center font-semibold bg-green-800">Promedio</th>
              <th className="px-3 py-3 text-center font-semibold">pH</th>
              <th className="px-3 py-3 text-center font-semibold">Humedad</th>
              <th className="px-3 py-3 text-left font-semibold">Comentario</th>
            </tr>
          </thead>
          <tbody>
            {registros.map((r, i) => (
              <tr
                key={r.id}
                className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                  i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                }`}
              >
                <td className="px-3 py-2.5 text-center text-gray-500 font-medium">{i + 1}</td>
                <td className="px-3 py-2.5 text-center font-medium text-gray-700 whitespace-nowrap">{r.Fecha}</td>
                <td className="px-3 py-2.5 text-center text-gray-600">{fmt(r.TemperaturaA)}</td>
                <td className="px-3 py-2.5 text-center text-gray-600">{fmt(r.TemperaturaB)}</td>
                <td className="px-3 py-2.5 text-center text-gray-600">{fmt(r.TemperaturaC)}</td>
                <td className="px-3 py-2.5 text-center text-gray-600">{fmt(r.TemperaturaD)}</td>
                <td className="px-3 py-2.5 text-center text-gray-600">{fmt(r.TemperaturaE)}</td>
                <td className="px-3 py-2.5 text-center font-bold text-agro-green">{fmt(r.PromedioTemperatura)}</td>
                <td className="px-3 py-2.5 text-center text-purple-600 font-medium">{fmt(r.pH)}</td>
                <td className="px-3 py-2.5 text-center text-agro-blue font-medium">
                  {r.Humedad !== null ? `${fmt(r.Humedad)}%` : "N/A"}
                </td>
                <td className="px-3 py-2.5 text-left text-gray-500 max-w-[200px] truncate">
                  {r.Comentario || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
