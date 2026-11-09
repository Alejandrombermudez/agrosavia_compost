"use client";

import { bateria, colorTemp, fmtHora, lecturas, senal, type PilaResumen } from "@/lib/planta";

const SENSORES = [
  { k: "superficie", nombre: "S1 · Superficie", prof: "0,3 m", y: 142 },
  { k: "medio", nombre: "S2 · Medio", prof: "0,8 m", y: 194 },
  { k: "fondo", nombre: "S3 · Fondo", prof: "1,3 m", y: 246 },
] as const;

const CIAN = "#06b6d4";

/** Esquema tipo circuito del bastón: 3 sensores en la pila → módulo ESP32 → nodo maestro. */
export default function SensorCircuito({ pila, hora }: { pila: PilaResumen; hora: number }) {
  const lect = lecturas(pila, hora);
  const bat = bateria(pila, hora);
  const rssi = senal(pila);
  const colorBat = bat < 30 ? "#ef4444" : bat < 60 ? "#eab308" : "#22c55e";

  return (
    <svg viewBox="0 0 340 296" className="w-full" role="img" aria-label={`Circuito del bastón de ${pila.nombre}`}>
      <style>{`
        .flujo { stroke-dasharray: 5 9; animation: flujo 1.4s linear infinite; }
        @keyframes flujo { to { stroke-dashoffset: -28; } }
        .t { font-family: ui-sans-serif, system-ui, sans-serif; }
      `}</style>
      <defs>
        <pattern id="puntos" width="12" height="12" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.8" fill="#1e293b" />
        </pattern>
        <linearGradient id="compost" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7c5634" />
          <stop offset="1" stopColor="#3f2a1a" />
        </linearGradient>
      </defs>

      <rect width="340" height="296" rx="16" fill="#0b1220" />
      <rect width="340" height="296" rx="16" fill="url(#puntos)" />

      {/* Corte de la pila */}
      <path d="M 16 272 L 154 272 L 120 116 L 50 116 Z" fill="url(#compost)" opacity={0.92} />
      <text x="85" y="288" textAnchor="middle" className="t" fontSize="9" fill="#64748b">
        Corte de la pila
      </text>

      {/* Módulo en la cabeza del bastón → ESP32 */}
      <path d="M 110 50 H 176" stroke={CIAN} strokeOpacity={0.3} strokeWidth="2" fill="none" />
      <path d="M 110 50 H 176" stroke={CIAN} strokeWidth="2" fill="none" className="flujo" />

      {/* Varilla */}
      <line x1="85" y1="64" x2="85" y2="262" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
      <rect x="62" y="36" width="48" height="28" rx="6" fill="#e2e8f0" />
      <rect x="58" y="28" width="56" height="6" rx="2" fill="#1e3a8a" transform="rotate(-8 86 31)" />
      <circle cx="102" cy="50" r="3" fill="#22c55e" />

      {/* Sensores, trazas y tarjetas */}
      {SENSORES.map((s) => {
        const t = lect[s.k];
        const c = colorTemp(t);
        return (
          <g key={s.k}>
            <path d={`M 94 ${s.y} H 176`} stroke={c} strokeOpacity={0.25} strokeWidth="2" fill="none" />
            <path d={`M 94 ${s.y} H 176`} stroke={c} strokeWidth="2" fill="none" className="flujo" />
            <path d={`M 328 ${s.y} H 334 V 58 H 328`} stroke={CIAN} strokeOpacity={0.35} strokeWidth="1.5" fill="none" />
            <circle cx="85" cy={s.y} r="14" fill={c} opacity={0.25} />
            <circle cx="85" cy={s.y} r="7.5" fill={c} stroke="#fff" strokeWidth="2" />

            <rect x="176" y={s.y - 20} width="152" height="40" rx="8" fill="#0f172a" stroke={c} strokeOpacity={0.7} />
            <text x="186" y={s.y - 5} className="t" fontSize="10" fill="#94a3b8">
              {s.nombre}
            </text>
            <text x="186" y={s.y + 13} className="t" fontSize="17" fontWeight="700" fill={c}>
              {t.toFixed(1)} °C
            </text>
            <text x="320" y={s.y - 5} textAnchor="end" className="t" fontSize="9" fill="#64748b">
              {s.prof}
            </text>
            <text x="320" y={s.y + 12} textAnchor="end" className="t" fontSize="9" fill="#22c55e">
              ● OK
            </text>
          </g>
        );
      })}

      {/* Microcontrolador del bastón */}
      <rect x="176" y="14" width="152" height="88" rx="10" fill="#111827" stroke={CIAN} strokeWidth="1.5" />
      <text x="186" y="31" className="t" fontSize="10" fontWeight="600" fill="#67e8f9">
        ESP32 · módulo del bastón
      </text>
      <text x="186" y="48" className="t" fontSize="9" fill="#94a3b8">
        Carga de batería
      </text>
      <rect x="186" y="54" width="74" height="18" rx="3" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
      <rect x="261" y="59" width="4" height="8" rx="1" fill="#94a3b8" />
      <rect x="188.5" y="56.5" width={Math.max(0, Math.min(100, bat)) * 0.69} height="13" rx="2" fill={colorBat} />
      <text x="320" y="69" textAnchor="end" className="t" fontSize="17" fontWeight="700" fill={colorBat}>
        {bat} %
      </text>
      <text x="186" y="90" className="t" fontSize="9" fill="#94a3b8">
        Radio → nodo maestro · {rssi} dBm
      </text>

      <text x="328" y="288" textAnchor="end" className="t" fontSize="9" fill="#64748b">
        Lectura cada hora · próxima a las {fmtHora((hora + 1) % 24)}
      </text>
    </svg>
  );
}
