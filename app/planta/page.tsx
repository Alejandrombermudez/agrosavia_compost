import type { Metadata } from "next";
import PlantaLoader from "@/components/planta/PlantaLoader";

export const metadata: Metadata = {
  title: "Planta 3D — Monitoreo de Compost Agrosavia",
  description: "Recorrido 3D de la planta de compostaje con el sistema de sensores propuesto",
};

export default function PlantaPage() {
  return <PlantaLoader />;
}
