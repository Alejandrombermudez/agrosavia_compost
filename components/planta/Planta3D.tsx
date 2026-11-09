"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useProgress } from "@react-three/drei";
import Escena, { CAMARA_INICIAL, MODOS, type Modo } from "./Escena";
import PanelPila from "./PanelPila";
import PanelSistema from "./PanelSistema";
import { PASOS } from "./RecorridoGuiado";
import { esActiva, fmtHora, ordenarPilas, type PilaResumen } from "@/lib/planta";

export default function Planta3D() {
  const [todas, setTodas] = useState<PilaResumen[]>([]);
  const [error, setError] = useState("");
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [hora, setHora] = useState(() => new Date().getHours());
  const [reproducir, setReproducir] = useState(false);
  const [modo, setModo] = useState<Modo>("parcial");
  const [guiada, setGuiada] = useState(false);
  const [paso, setPaso] = useState(0);

  const iniciarGuiada = () => {
    setPaso(0);
    setSeleccion(null);
    setGuiada(true);
  };
  const terminarGuiada = useCallback(() => {
    setGuiada(false);
    setSeleccion(null);
  }, []);

  useEffect(() => {
    fetch("/api/planta")
      .then((r) => r.json())
      .then((d) => (Array.isArray(d) ? setTodas(d) : setError("No se pudieron cargar las pilas.")))
      .catch(() => setError("No se pudo conectar con la base de datos."));
  }, []);

  useEffect(() => {
    if (!reproducir) return;
    const id = setInterval(() => setHora((h) => (h + 1) % 24), 1200);
    return () => clearInterval(id);
  }, [reproducir]);

  const pilas = useMemo(() => ordenarPilas(todas), [todas]);
  const activas = todas.filter((p) => esActiva(p.estado)).length;
  const pila = pilas.find((p) => p.id === seleccion) ?? null;

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50 text-gray-800">
      <header className="z-20 shrink-0 bg-agro-blue text-white shadow-lg">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="shrink-0 rounded-lg bg-white px-3 py-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-agrosavia.png" alt="Agrosavia" className="h-5 w-auto sm:h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold leading-tight">Planta 3D · Monitoreo automático</h1>
            <p className="truncate text-xs text-blue-200">Agrosavia — pilas de compostaje</p>
          </div>
          <Link
            href="/"
            className="ml-auto whitespace-nowrap rounded-full bg-agro-green px-3 py-1.5 text-xs font-semibold hover:bg-agro-green-dark"
          >
            Panel de datos
          </Link>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* Escena 3D */}
        <div className="relative min-h-0 min-w-0 flex-1">
          <Canvas
            shadows
            dpr={[1, 1.75]}
            camera={{ position: CAMARA_INICIAL, fov: 45, near: 0.1, far: 600 }}
            onPointerMissed={(e) => e.type === "click" && setSeleccion(null)}
          >
            <Suspense fallback={null}>
              <Escena
                pilas={pilas}
                hora={hora}
                seleccion={seleccion}
                onSelect={setSeleccion}
                modo={modo}
                guiada={guiada}
                onPasoGuiado={setPaso}
                onFinGuiado={terminarGuiada}
              />
            </Suspense>
          </Canvas>
          <Cargando />

          {/* Vistas de infraestructura y vista guiada */}
          <div className="absolute left-3 right-3 top-3 z-10 flex flex-wrap gap-2">
            <Segmentos
              opciones={MODOS.map((m) => m.nombre)}
              valor={MODOS.find((m) => m.id === modo)!.nombre}
              onChange={(o) => setModo(MODOS.find((m) => m.nombre === o)!.id)}
            />
            <button
              onClick={guiada ? terminarGuiada : iniciarGuiada}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold shadow-lg transition ${
                guiada ? "bg-white text-red-600 hover:bg-red-50" : "bg-agro-green text-white hover:bg-agro-green-dark"
              }`}
            >
              {guiada ? "■ Detener vista guiada" : "▶ Vista guiada"}
            </button>
          </div>

          {/* Texto del paso actual */}
          {guiada && (
            <div className="pointer-events-none absolute inset-x-3 bottom-16 z-10 flex justify-center">
              <div className="max-w-lg rounded-2xl bg-gray-900/85 px-5 py-3 text-center text-white shadow-xl backdrop-blur">
                <p className="text-sm font-medium leading-snug">{PASOS[paso]?.texto}</p>
                <div className="mt-2 flex justify-center gap-1">
                  {PASOS.map((_, k) => (
                    <span key={k} className={`h-1.5 rounded-full transition-all ${k === paso ? "w-5 bg-agro-green" : "w-1.5 bg-white/40"}`} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Hora simulada */}
          <div className="absolute bottom-3 left-3 z-10 flex w-[260px] max-w-[calc(100%-1.5rem)] items-center gap-3 rounded-full bg-white/95 py-1.5 pl-1.5 pr-4 shadow-lg">
            <button
              onClick={() => setReproducir(!reproducir)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-agro-blue text-xs text-white"
              aria-label={reproducir ? "Pausar" : "Reproducir día"}
            >
              {reproducir ? "❚❚" : "▶"}
            </button>
            <input
              type="range"
              min={0}
              max={23}
              value={hora}
              onChange={(e) => setHora(Number(e.target.value))}
              className="min-w-0 flex-1 accent-agro-blue"
              aria-label="Hora simulada"
            />
            <span className="text-xs font-bold text-agro-blue">{fmtHora(hora)}</span>
          </div>

          {error && (
            <p className="absolute bottom-16 left-3 z-10 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 shadow">{error}</p>
          )}
        </div>

        {/* Panel lateral */}
        <aside className="h-[44vh] shrink-0 overflow-y-auto scrollbar-thin border-t border-gray-200 bg-white md:h-auto md:w-[380px] md:border-l md:border-t-0">
          {pila ? (
            <PanelPila pila={pila} hora={hora} onClose={() => setSeleccion(null)} />
          ) : (
            <PanelSistema pilas={pilas} activasTotal={activas} hora={hora} onSelect={setSeleccion} />
          )}
        </aside>
      </div>
    </div>
  );
}

function Segmentos({ opciones, valor, onChange }: { opciones: string[]; valor: string; onChange: (o: string) => void }) {
  return (
    <div className="flex max-w-full overflow-x-auto rounded-full bg-white/95 p-1 shadow-lg">
      {opciones.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold transition ${
            valor === o ? "bg-agro-blue text-white" : "text-gray-600 hover:text-agro-blue"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function Cargando() {
  const { active, progress } = useProgress();
  if (!active) return null;
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-gray-50">
      <p className="text-sm font-semibold text-agro-blue">Cargando planta 3D… {progress.toFixed(0)} %</p>
      <div className="h-1.5 w-56 overflow-hidden rounded-full bg-white">
        <div className="h-full bg-agro-green transition-all" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
