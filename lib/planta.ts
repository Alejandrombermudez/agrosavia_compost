import type { Pila, Registro } from "@/types";

/** Pila con su último registro manual, tal como la entrega /api/planta. */
export interface PilaResumen extends Pila {
  nombre: string;
  ultimo: Registro | null;
  nRegistros: number;
}

export interface Lecturas {
  superficie: number;
  medio: number;
  fondo: number;
}

// ---------- Distribución de la planta (metros, coordenadas de la escena 3D) ----------
// La bodega va de x = -7.6 a 7.6 y de z = 0 (fachada con portones) a z = -30 (fondo).
// 8 pilas en dos hileras, con pasillo central de 4 m donde está el nodo maestro.
export const PILA = { ancho: 3.2, largo: 5.0, alto: 1.6, piso: 0.06 };
export const MAESTRO = { x: 0, z: -1.6, alto: 1.35 };
export const CENTRO: [number, number, number] = [0, 0.8, -14];
const FILAS_X = [-3.6, 3.6];
const Z0 = -6.0;
const DZ = 6.2;
const POR_FILA = 4;
export const CAPACIDAD = FILAS_X.length * POR_FILA;

export function posicionPila(i: number) {
  return { x: FILAS_X[Math.floor(i / POR_FILA)], z: Z0 - (i % POR_FILA) * DZ, k: i % POR_FILA };
}

// ---------- Estado simulado del bastón (prototipo) ----------
/** Batería del bastón en %: baja lentamente durante el día. */
export function bateria(p: PilaResumen, hora: number) {
  return Math.round(62 + (hash(p.id) % 36) - hora * 0.15);
}

/** Intensidad de señal de radio hacia el nodo maestro (dBm). */
export function senal(p: PilaResumen) {
  return -48 - (hash(p.id + "rssi") % 30);
}

/** Hora de la última descarga del operario (visita diaria a las 7:00). */
export function ultimaSync(hora: number) {
  return hora >= 7 ? "Hoy 07:00" : "Ayer 07:00";
}

export function esActiva(estado: string | null | undefined) {
  return /^activ/i.test(estado ?? "");
}

/** Pilas que caben en la planta: activas primero, las de registro más reciente, y en orden de nombre. */
export function ordenarPilas(pilas: PilaResumen[]) {
  return [...pilas]
    .sort(
      (a, b) =>
        Number(esActiva(b.estado)) - Number(esActiva(a.estado)) ||
        (b.ultimo?.Fecha ?? "").localeCompare(a.ultimo?.Fecha ?? "")
    )
    .slice(0, CAPACIDAD)
    .sort((a, b) => a.id.localeCompare(b.id, "es", { numeric: true }));
}

export function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function rng(seed: number) {
  let a = seed || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- Simulación del bastón de 3 sensores ----------
/** Temperatura de referencia de la pila: el promedio del último registro manual. */
export function temperaturaBase(p: PilaResumen) {
  const prom = p.ultimo?.PromedioTemperatura;
  const valida = prom !== null && prom !== undefined && prom > 5 ? prom : null;
  if (!esActiva(p.estado)) return Math.min(valida ?? 24, 27);
  return valida ?? 32;
}

/**
 * Lecturas simuladas a una hora del día. El núcleo (medio) es el más caliente,
 * la superficie sigue el ciclo de temperatura ambiente y el fondo varía poco.
 */
export function lecturas(p: PilaResumen, hora: number): Lecturas {
  const base = temperaturaBase(p);
  const r = rng(hash(p.id) + Math.floor(hora * 10));
  const dia = Math.sin(((hora - 9) / 24) * Math.PI * 2); // máximo hacia las 15 h
  const ruido = () => (r() - 0.5) * 0.8;
  const ambiente = 24 + 4 * dia;
  const activa = esActiva(p.estado);
  const medio = activa ? base + 3 + 0.6 * dia + ruido() : base + 0.4 * dia + ruido();
  const superficie = activa ? Math.max(ambiente, base - 7 + 2.5 * dia + ruido()) : ambiente + ruido();
  const fondo = activa ? base - 2 + 0.3 * dia + ruido() : base - 1 + ruido();
  const f = (v: number) => Math.round(v * 10) / 10;
  return { superficie: f(superficie), medio: f(medio), fondo: f(fondo) };
}

export function serie24h(p: PilaResumen) {
  return Array.from({ length: 24 }, (_, h) => ({ hora: `${String(h).padStart(2, "0")}:00`, ...lecturas(p, h) }));
}

// ---------- Colores por fase de temperatura ----------
export const RANGOS = [
  { hasta: 35, color: "#3b82f6", nombre: "Mesófila (< 35 °C)" },
  { hasta: 45, color: "#22c55e", nombre: "Activación (35–45 °C)" },
  { hasta: 55, color: "#eab308", nombre: "Termófila (45–55 °C)" },
  { hasta: 65, color: "#f97316", nombre: "Termófila alta (55–65 °C)" },
  { hasta: Infinity, color: "#ef4444", nombre: "Exceso (> 65 °C)" },
];

export function colorTemp(t: number) {
  return (RANGOS.find((r) => t < r.hasta) ?? RANGOS[RANGOS.length - 1]).color;
}

export function fmtHora(h: number) {
  return `${String(Math.floor(h)).padStart(2, "0")}:00`;
}
