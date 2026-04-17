"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import type { Registro, ChartTab } from "@/types";
import { toFloat, fmtDateLabel } from "@/lib/utils";

interface Props {
  registros: Registro[];
  tab: ChartTab;
  onTabChange: (t: ChartTab) => void;
}

const TABS: { key: ChartTab; label: string; color: string; active: string }[] = [
  { key: "temp", label: "Temperatura", color: "border-agro-green text-agro-green", active: "bg-agro-green text-white border-agro-green" },
  { key: "ph", label: "pH", color: "border-purple-400 text-purple-600", active: "bg-purple-500 text-white border-purple-500" },
  { key: "hum", label: "Humedad", color: "border-agro-blue text-agro-blue", active: "bg-agro-blue text-white border-agro-blue" },
];

const TEMP_COLORS = {
  A: "#1f77b4",
  B: "#ff7f0e",
  C: "#2ca02c",
  D: "#d62728",
  E: "#9467bd",
};

function TempChart({ registros }: { registros: Registro[] }) {
  const data = registros.map((r) => ({
    fecha: fmtDateLabel(r.Fecha),
    A: r.TemperaturaA,
    B: r.TemperaturaB,
    C: r.TemperaturaC,
    D: r.TemperaturaD,
    E: r.TemperaturaE,
    Promedio: r.PromedioTemperatura,
  }));

  return (
    <ResponsiveContainer width="100%" height={340}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="fecha"
          tick={{ fontSize: 10 }}
          angle={-45}
          textAnchor="end"
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fontSize: 11 }} unit="°C" width={52} />
        <Tooltip
          formatter={(v: number) => [`${v?.toFixed(2)} °C`]}
          labelStyle={{ fontWeight: 600 }}
        />
        <Legend wrapperStyle={{ paddingTop: 16, fontSize: 12 }} />
        {(["A", "B", "C", "D", "E"] as const).map((l) => (
          <Line
            key={l}
            type="monotone"
            dataKey={l}
            name={`Temp ${l}`}
            stroke={TEMP_COLORS[l]}
            strokeWidth={1.5}
            strokeDasharray="4 2"
            dot={false}
            connectNulls={false}
          />
        ))}
        <Line
          type="monotone"
          dataKey="Promedio"
          name="Promedio"
          stroke="#111111"
          strokeWidth={3}
          dot={false}
          connectNulls={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function PhChart({ registros }: { registros: Registro[] }) {
  const data = registros
    .map((r) => ({
      fecha: fmtDateLabel(r.Fecha),
      pH: r.pH && r.pH > 0.01 ? r.pH : null,
    }))
    .filter((d) => d.pH !== null);

  return (
    <ResponsiveContainer width="100%" height={340}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
        <defs>
          <linearGradient id="phGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="fecha"
          tick={{ fontSize: 10 }}
          angle={-45}
          textAnchor="end"
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fontSize: 11 }} width={40} />
        <Tooltip formatter={(v: number) => [`${v?.toFixed(2)}`]} labelStyle={{ fontWeight: 600 }} />
        <Legend wrapperStyle={{ paddingTop: 16, fontSize: 12 }} />
        <Area
          type="monotone"
          dataKey="pH"
          stroke="#a855f7"
          strokeWidth={2.5}
          fill="url(#phGrad)"
          dot={false}
          connectNulls={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function HumChart({ registros }: { registros: Registro[] }) {
  const data = registros
    .map((r) => ({
      fecha: fmtDateLabel(r.Fecha),
      Humedad: r.Humedad && r.Humedad > 0.01 ? r.Humedad : null,
    }))
    .filter((d) => d.Humedad !== null);

  return (
    <ResponsiveContainer width="100%" height={340}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
        <defs>
          <linearGradient id="humGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#003893" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#003893" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="fecha"
          tick={{ fontSize: 10 }}
          angle={-45}
          textAnchor="end"
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fontSize: 11 }} unit="%" width={48} />
        <Tooltip
          formatter={(v: number) => [`${v?.toFixed(2)}%`]}
          labelStyle={{ fontWeight: 600 }}
        />
        <Legend wrapperStyle={{ paddingTop: 16, fontSize: 12 }} />
        <Area
          type="monotone"
          dataKey="Humedad"
          stroke="#003893"
          strokeWidth={2.5}
          fill="url(#humGrad)"
          dot={false}
          connectNulls={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default function ChartPanel({ registros, tab, onTabChange }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex flex-wrap gap-2 mb-5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => onTabChange(t.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${
              tab === t.key ? t.active : `bg-white ${t.color}`
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "temp" && <TempChart registros={registros} />}
      {tab === "ph" && <PhChart registros={registros} />}
      {tab === "hum" && <HumChart registros={registros} />}
    </div>
  );
}
