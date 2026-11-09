"use client";

import { RANGOS, bateria, colorTemp, fmtHora, lecturas, ultimaSync, type PilaResumen } from "@/lib/planta";

interface Props {
  pilas: PilaResumen[];
  activasTotal: number;
  hora: number;
  onSelect: (id: string) => void;
}

export default function PanelSistema({ pilas, activasTotal, hora, onSelect }: Props) {
  const n = pilas.length;
  const sensores = n * 3;
  const nucleos = pilas.map((p) => lecturas(p, hora).medio);
  const promedio = n ? nucleos.reduce((a, b) => a + b, 0) / n : 0;
  const baterias = pilas.map((p) => bateria(p, hora));
  const batProm = n ? Math.round(baterias.reduce((a, b) => a + b, 0) / n) : 0;
  const registrosManuales = pilas.reduce((a, p) => a + p.nRegistros, 0);
  const lecturasHoy = sensores * (hora + 1);
  const horasSinSync = hora >= 7 ? hora - 7 : hora + 17;
  const pendientes = sensores * horasSinSync;
  const alertas = pilas.filter((p, i) => nucleos[i] >= 65 || baterias[i] < 30).length;

  return (
    <div className="space-y-5 p-5 text-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Vista general</p>
        <h2 className="text-lg font-bold text-gray-800">Sistema de monitoreo</h2>
        <p className="mt-0.5 text-xs text-gray-500">
          Prototipo con datos reales de las pilas y lecturas de sensores simuladas · {fmtHora(hora)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Kpi titulo="Pilas monitoreadas" valor={`${n}`} nota={`de ${activasTotal} activas`} />
        <Kpi titulo="Sensores en línea" valor={`${sensores}/${sensores}`} nota="3 por bastón" color="text-agro-green" />
        <Kpi titulo="Batería promedio" valor={`${batProm} %`} nota="panel solar + litio" />
        <Kpi titulo="Núcleo promedio" valor={`${promedio.toFixed(1)} °C`} nota="sensor medio" color="" style={{ color: colorTemp(promedio) }} />
        <Kpi titulo="Lecturas hoy" valor={lecturasHoy.toLocaleString("es-CO")} nota="automáticas, cada hora" />
        <Kpi titulo="Registros manuales" valor={registrosManuales.toLocaleString("es-CO")} nota="en Firestore" />
      </div>

      <div className="rounded-xl border border-cyan-100 bg-cyan-50/60 p-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-500" />
          <p className="font-semibold text-gray-800">Nodo maestro</p>
          <span className="ml-auto rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700">En línea</span>
        </div>
        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <dt className="text-gray-500">Red Wi-Fi</dt>
          <dd className="text-right font-medium text-gray-700">COMPOST-AGRO</dd>
          <dt className="text-gray-500">Última descarga al celular</dt>
          <dd className="text-right font-medium text-gray-700">{ultimaSync(hora)}</dd>
          <dt className="text-gray-500">Lecturas por descargar</dt>
          <dd className="text-right font-medium text-gray-700">{pendientes.toLocaleString("es-CO")}</dd>
          <dt className="text-gray-500">Alertas</dt>
          <dd className={`text-right font-medium ${alertas ? "text-red-600" : "text-gray-700"}`}>{alertas || "Ninguna"}</dd>
        </dl>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Pilas</p>
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-100">
          {pilas.map((p, i) => (
            <li key={p.id}>
              <button onClick={() => onSelect(p.id)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: colorTemp(nucleos[i]) }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-gray-800">{p.nombre}</span>
                  <span className="block text-[11px] text-gray-400">{p.nRegistros} registros</span>
                </span>
                <span className="text-right">
                  <span className="block font-bold" style={{ color: colorTemp(nucleos[i]) }}>
                    {nucleos[i].toFixed(1)}°
                  </span>
                  <Bateria valor={baterias[i]} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <details className="rounded-xl border border-gray-100 p-3">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-gray-500">
          Colores por temperatura
        </summary>
        <div className="mt-2 space-y-1">
          {RANGOS.map((r) => (
            <div key={r.nombre} className="flex items-center gap-2 text-xs text-gray-600">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.color }} />
              {r.nombre}
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

function Kpi({
  titulo,
  valor,
  nota,
  color = "text-gray-800",
  style,
}: {
  titulo: string;
  valor: string;
  nota: string;
  color?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className="rounded-xl border border-gray-100 p-3">
      <p className="text-[11px] text-gray-400">{titulo}</p>
      <p className={`text-xl font-bold ${color}`} style={style}>
        {valor}
      </p>
      <p className="text-[10px] text-gray-400">{nota}</p>
    </div>
  );
}

export function Bateria({ valor }: { valor: number }) {
  const color = valor < 30 ? "bg-red-500" : valor < 60 ? "bg-yellow-400" : "bg-agro-green";
  return (
    <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-gray-500">
      <span className="relative inline-block h-2.5 w-5 rounded-sm border border-gray-400">
        <span className={`absolute inset-y-0 left-0 ${color}`} style={{ width: `${Math.max(0, Math.min(100, valor))}%` }} />
      </span>
      {valor}%
    </span>
  );
}
