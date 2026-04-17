"use client";

import { useState, useEffect } from "react";
import type { Pila, PilaDetalle, ChartTab } from "@/types";
import PilaSelector from "./PilaSelector";
import PilaInfo from "./PilaInfo";
import StatsCards from "./StatsCards";
import ChartPanel from "./ChartPanel";
import RegistrosTable from "./RegistrosTable";

export default function Dashboard() {
  const [pilas, setPilas] = useState<Pila[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [detalle, setDetalle] = useState<PilaDetalle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [chartTab, setChartTab] = useState<ChartTab>("temp");

  useEffect(() => {
    fetch("/api/pilas")
      .then((r) => r.json())
      .then(setPilas)
      .catch(() => setError("No se pudo conectar con la base de datos."));
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetalle(null);
      return;
    }
    setLoading(true);
    setError("");
    fetch(`/api/pilas/${encodeURIComponent(selectedId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setDetalle(data);
      })
      .catch((e) => setError(e.message ?? "Error al cargar la pila."))
      .finally(() => setLoading(false));
  }, [selectedId]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-agro-blue text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-agro-green flex items-center justify-center text-white font-black text-lg shrink-0">
            C
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">
              Monitoreo de Pilas de Compost
            </h1>
            <p className="text-blue-200 text-xs">Agrosavia — Panel de estadísticas</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <PilaSelector pilas={pilas} selected={selectedId} onSelect={setSelectedId} />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <span className="text-sm">Cargando datos de la pila...</span>
          </div>
        )}

        {!loading && detalle && (
          <>
            <PilaInfo meta={detalle.meta} totalRegistros={detalle.registros.length} />
            <StatsCards registros={detalle.registros} />
            <ChartPanel
              registros={detalle.registros}
              tab={chartTab}
              onTabChange={setChartTab}
            />
            <RegistrosTable registros={detalle.registros} />
          </>
        )}

        {!loading && !detalle && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-300 gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-base font-medium text-gray-400">
              Selecciona una pila para ver sus estadísticas
            </p>
          </div>
        )}
      </main>

      <footer className="mt-10 border-t border-gray-200 py-4 text-center text-xs text-gray-400">
        Agrosavia · Monitoreo de Compost
      </footer>
    </div>
  );
}
