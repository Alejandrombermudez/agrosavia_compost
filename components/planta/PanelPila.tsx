"use client";

import Link from "next/link";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { bateria, esActiva, fmtHora, senal, serie24h, type PilaResumen } from "@/lib/planta";
import { fmt, fmtDateLabel } from "@/lib/utils";
import { Bateria } from "./PanelSistema";
import SensorCircuito from "./SensorCircuito";

interface Props {
  pila: PilaResumen;
  hora: number;
  onClose: () => void;
}

export default function PanelPila({ pila, hora, onClose }: Props) {
  const serie = serie24h(pila);
  const u = pila.ultimo;

  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-5 py-3">
        <button onClick={onClose} className="mb-2 text-xs font-semibold text-agro-blue hover:underline">
          ← Vista general del sistema
        </button>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Pila de compost</p>
            <h2 className="text-xl font-bold text-gray-800">{pila.nombre}</h2>
          </div>
          <span
            className={`mt-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
              esActiva(pila.estado) ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
            }`}
          >
            {pila.estado ?? "Sin estado"}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            Batería <Bateria valor={bateria(pila, hora)} />
          </span>
          <span>Señal {senal(pila)} dBm</span>
          <span className="ml-auto flex items-center gap-1 text-green-700">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> 3/3 sensores
          </span>
        </div>
      </div>

      <div className="space-y-5 px-5 py-4 text-sm">
        <section>
          <h3 className="mb-2 flex items-center gap-2 font-semibold text-gray-700">
            Bastón de sensores
            <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-sky-700">simulado</span>
            <span className="ml-auto text-xs font-normal text-gray-400">{fmtHora(hora)}</span>
          </h3>
          <SensorCircuito pila={pila} hora={hora} />
        </section>

        <section>
          <h3 className="mb-2 font-semibold text-gray-700">Lecturas del día</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={serie} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hora" tick={{ fontSize: 9 }} interval={5} />
                <YAxis tick={{ fontSize: 10 }} unit="°" domain={["dataMin - 2", "dataMax + 2"]} />
                <Tooltip formatter={(v: number) => [`${v.toFixed(1)} °C`]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line dataKey="superficie" name="Superficie" stroke="#0ea5e9" dot={false} strokeWidth={2} />
                <Line dataKey="medio" name="Medio" stroke="#ef4444" dot={false} strokeWidth={2.5} />
                <Line dataKey="fondo" name="Fondo" stroke="#8b5cf6" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Las 24 lecturas que tomaría el bastón, calculadas a partir del último registro real.
          </p>
        </section>

        <section>
          <h3 className="mb-2 font-semibold text-gray-700">
            Último registro manual
            {u && <span className="ml-2 text-xs font-normal text-gray-400">{fmtDateLabel(u.Fecha)}</span>}
          </h3>
          {u ? (
            <>
              <div className="grid grid-cols-5 gap-1 text-center">
                {(["A", "B", "C", "D", "E"] as const).map((l) => (
                  <div key={l} className="rounded bg-gray-50 p-1">
                    <p className="text-xs font-bold text-agro-green">{l}</p>
                    <p className="text-xs text-gray-600">{fmt(u[`Temperatura${l}`], 0)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                <Dato titulo="Promedio" valor={`${fmt(u.PromedioTemperatura, 1)} °C`} />
                <Dato titulo="pH" valor={u.pH && u.pH > 0.01 ? fmt(u.pH, 2) : "N/A"} />
                <Dato titulo="Humedad" valor={u.Humedad && u.Humedad > 0.01 ? `${fmt(u.Humedad, 1)} %` : "N/A"} />
              </div>
              {u.Comentario && <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">{u.Comentario}</p>}
            </>
          ) : (
            <p className="text-gray-400">Sin registros.</p>
          )}
        </section>

        <section className="space-y-1 text-xs text-gray-500">
          {pila.composicion && (
            <p>
              <span className="font-semibold text-gray-700">Composición:</span> {pila.composicion}
            </p>
          )}
          {pila.fecha_inicio && (
            <p>
              <span className="font-semibold text-gray-700">Inicio:</span> {fmtDateLabel(pila.fecha_inicio)}
            </p>
          )}
          <p>
            <span className="font-semibold text-gray-700">Registros manuales:</span> {pila.nRegistros}
          </p>
        </section>

        <Link
          href="/"
          className="block w-full rounded-xl border border-agro-blue/30 py-2.5 text-center font-semibold text-agro-blue transition hover:bg-agro-blue hover:text-white"
        >
          Ver historial en el panel de datos
        </Link>
      </div>
    </div>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-xl border border-gray-100 p-2">
      <p className="text-[11px] text-gray-400">{titulo}</p>
      <p className="font-semibold text-gray-800">{valor}</p>
    </div>
  );
}
