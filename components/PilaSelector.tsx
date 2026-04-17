"use client";

import type { Pila } from "@/types";

interface Props {
  pilas: Pila[];
  selected: string;
  onSelect: (id: string) => void;
}

export default function PilaSelector({ pilas, selected, onSelect }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        Seleccionar Pila
      </label>
      <select
        value={selected}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full md:w-80 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm focus:border-agro-green focus:outline-none focus:ring-2 focus:ring-agro-green/20 transition"
      >
        <option value="">— Elige una pila —</option>
        {pilas.map((p) => (
          <option key={p.id} value={p.id}>
            {p.id}
          </option>
        ))}
      </select>
      {pilas.length === 0 && (
        <p className="mt-2 text-xs text-gray-400">Cargando pilas...</p>
      )}
    </div>
  );
}
