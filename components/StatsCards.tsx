"use client";

import type { Registro } from "@/types";
import { calcStats, fmt } from "@/lib/utils";

interface Props {
  registros: Registro[];
}

interface CardProps {
  title: string;
  unit: string;
  color: string;
  avg: string;
  min: string;
  max: string;
  std: string;
  count: number;
  extra?: React.ReactNode;
}

function StatCard({ title, unit, color, avg, min, max, std, count, extra }: CardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border-t-4 ${color} p-5 flex flex-col gap-3`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
        <span className="text-xs text-gray-400">{count} lecturas</span>
      </div>
      <div className="text-center py-2">
        <p className="text-4xl font-bold text-gray-800">
          {avg}
          <span className="text-lg font-normal text-gray-400 ml-1">{unit}</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">Promedio global</p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center border-t border-gray-100 pt-3">
        <div>
          <p className="text-xs text-gray-400">Mínimo</p>
          <p className="text-sm font-semibold text-gray-700">{min}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Máximo</p>
          <p className="text-sm font-semibold text-gray-700">{max}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Desv. Std</p>
          <p className="text-sm font-semibold text-gray-700">{std}</p>
        </div>
      </div>
      {extra && <div className="border-t border-gray-100 pt-3">{extra}</div>}
    </div>
  );
}

export default function StatsCards({ registros }: Props) {
  const tempStats = calcStats(registros.map((r) => r.PromedioTemperatura));
  const phStats = calcStats(registros.map((r) => r.pH), true);
  const humStats = calcStats(registros.map((r) => r.Humedad), true);

  const puntosExtra = (
    <div className="grid grid-cols-5 gap-1 text-center">
      {(["A", "B", "C", "D", "E"] as const).map((letra) => {
        const key = `Temperatura${letra}` as keyof Registro;
        const s = calcStats(registros.map((r) => r[key] as number | null));
        return (
          <div key={letra} className="bg-gray-50 rounded p-1">
            <p className="text-xs font-bold text-agro-green">{letra}</p>
            <p className="text-xs text-gray-600">{s ? fmt(s.avg, 1) : "—"}</p>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard
        title="Temperatura"
        unit="°C"
        color="border-agro-green"
        avg={tempStats ? fmt(tempStats.avg) : "N/A"}
        min={tempStats ? fmt(tempStats.min) : "N/A"}
        max={tempStats ? fmt(tempStats.max) : "N/A"}
        std={tempStats ? fmt(tempStats.std) : "N/A"}
        count={tempStats?.count ?? 0}
        extra={puntosExtra}
      />
      <StatCard
        title="pH"
        unit=""
        color="border-purple-400"
        avg={phStats ? fmt(phStats.avg) : "N/A"}
        min={phStats ? fmt(phStats.min) : "N/A"}
        max={phStats ? fmt(phStats.max) : "N/A"}
        std={phStats ? fmt(phStats.std) : "N/A"}
        count={phStats?.count ?? 0}
      />
      <StatCard
        title="Humedad"
        unit="%"
        color="border-agro-blue"
        avg={humStats ? fmt(humStats.avg) : "N/A"}
        min={humStats ? fmt(humStats.min) : "N/A"}
        max={humStats ? fmt(humStats.max) : "N/A"}
        std={humStats ? fmt(humStats.std) : "N/A"}
        count={humStats?.count ?? 0}
      />
    </div>
  );
}
