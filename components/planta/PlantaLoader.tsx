"use client";

import dynamic from "next/dynamic";

// El 3D solo funciona en el navegador, así que no se renderiza en el servidor.
const Planta3D = dynamic(() => import("./Planta3D"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-sky-100 text-sm font-semibold text-agro-blue">
      Cargando planta 3D…
    </div>
  ),
});

export default function PlantaLoader() {
  return <Planta3D />;
}
