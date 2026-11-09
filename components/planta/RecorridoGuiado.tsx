"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CENTRO, MAESTRO, PILA, type PilaResumen } from "@/lib/planta";

type V3 = [number, number, number];

interface Paso {
  pos: V3;
  target: V3;
  /** Segundos de viaje desde el paso anterior y de pausa al llegar. */
  viaje: number;
  pausa: number;
  texto: string;
  /** Índice de la pila que se selecciona al llegar (opcional). */
  pila?: number;
}

const OJO = 3.0; // altura de la cámara dentro de la bodega (justo debajo de las cerchas, a 3,25 m)
const ALTO_PILA = PILA.piso + 2.0; // se apunta a la cabeza del bastón
export const INICIO_RECORRIDO: V3 = [-16, 22, 8];

// Camino: llegada aérea → portón → nodo maestro → pasillo con 3 pilas → fondo → salida → vista aérea.
// Los puntos evitan muros, pilas y el nodo para que la cámara no atraviese nada.
export const PASOS: Paso[] = [
  { pos: INICIO_RECORRIDO, target: CENTRO, viaje: 0, pausa: 2.5, texto: "Planta de compostaje · 8 pilas con monitoreo automático" },
  { pos: [10, 7, 17], target: [2.9, 1.5, 0], viaje: 5, pausa: 1.5, texto: "Llegada a la bodega de compostaje" },
  { pos: [2.9, 2.1, 4.5], target: [1.5, 1.4, -4], viaje: 4, pausa: 0.5, texto: "Ingreso por el portón principal" },
  {
    pos: [3.6, 2.6, -0.4],
    target: [MAESTRO.x, MAESTRO.alto + PILA.piso, MAESTRO.z],
    viaje: 3.5,
    pausa: 3.5,
    texto: "Nodo maestro: recibe las lecturas de todos los bastones, las guarda y crea su propia red Wi-Fi",
  },
  {
    pos: [1.4, OJO, -1.0],
    target: [-3.6, ALTO_PILA, -6.5],
    viaje: 3.5,
    pausa: 4,
    pila: 0,
    texto: "Cada pila tiene un bastón con 3 sensores: superficie, medio y fondo",
  },
  {
    pos: [-1.4, OJO, -7.4],
    target: [3.6, ALTO_PILA, -12.5],
    viaje: 4,
    pausa: 4,
    pila: 5,
    texto: "Cada hora el bastón envía sus lecturas por radio al nodo maestro",
  },
  {
    pos: [1.4, OJO, -13.6],
    target: [-3.6, ALTO_PILA, -18.8],
    viaje: 4,
    pausa: 4,
    pila: 2,
    texto: "El color de cada pila indica la fase de temperatura de su núcleo",
  },
  { pos: [0, 2.8, -27.8], target: [0, 1, -6], viaje: 5, pausa: 3.5, texto: "Pasillo central: todas las pilas conectadas al nodo maestro" },
  { pos: [0.3, 2.6, -4.5], target: [2.9, 1.8, 2], viaje: 6, pausa: 0, texto: "Salida de la bodega" },
  { pos: [2.9, 2.1, 1.5], target: [4, 2.5, 10], viaje: 3, pausa: 0, texto: "Salida de la bodega" },
  {
    pos: INICIO_RECORRIDO,
    target: CENTRO,
    viaje: 6,
    pausa: 1.5,
    texto: "El operario descarga los datos al llegar y los sube a la nube cuando hay señal",
  },
];

/** Línea de tiempo: cada paso tiene un instante de llegada y uno de salida (llegada + pausa). */
function lineaDeTiempo() {
  let t = 0;
  return PASOS.map((p) => {
    const llega = t + p.viaje;
    const sale = llega + p.pausa;
    t = sale;
    return { llega, sale };
  });
}
export const DURACION = lineaDeTiempo().at(-1)!.sale;

const suave = (u: number) => u * u * (3 - 2 * u);

interface Props {
  pilas: PilaResumen[];
  /** Posición final de la cámara (más lejos en la vista completa para que quepan los silos). */
  fin: V3;
  onPaso: (i: number) => void;
  onSelect: (id: string | null) => void;
  onFin: () => void;
}

/** Mueve la cámara por los pasos del recorrido. Debe usarse sin OrbitControls activos. */
export default function RecorridoGuiado({ pilas, fin, onPaso, onSelect, onFin }: Props) {
  const { camera } = useThree();
  const tiempos = useMemo(lineaDeTiempo, []);
  const puntos = useMemo(
    () =>
      PASOS.map((p, k) => ({
        pos: new THREE.Vector3(...(k === PASOS.length - 1 ? fin : p.pos)),
        target: new THREE.Vector3(...p.target),
      })),
    [fin]
  );
  const inicio = useRef<number | null>(null);
  const actual = useRef(-1);
  const salida = useRef<THREE.Vector3 | null>(null);
  const target = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }) => {
    if (inicio.current === null) {
      inicio.current = clock.elapsedTime;
      salida.current = camera.position.clone(); // arranca desde donde esté la cámara
    }
    const t = clock.elapsedTime - inicio.current;
    if (t >= DURACION) {
      onFin();
      return;
    }

    // Paso hacia el que se viaja (o en el que se está en pausa)
    let i = tiempos.findIndex((x) => t < x.sale);
    if (i < 0) i = PASOS.length - 1;
    const desde = i === 0 ? { pos: salida.current!, target: puntos[0].target } : puntos[i - 1];
    const comienzo = i === 0 ? 0 : tiempos[i - 1].sale;
    const viaje = Math.max(tiempos[i].llega - comienzo, 1e-3);
    const u = suave(Math.min(1, (t - comienzo) / viaje));

    camera.position.lerpVectors(desde.pos, puntos[i].pos, u);
    target.lerpVectors(desde.target, puntos[i].target, u);
    camera.lookAt(target);

    // El texto y la pila cambian cuando la cámara va a mitad de camino
    const mostrado = u > 0.5 ? i : Math.max(0, i - 1);
    if (mostrado !== actual.current) {
      actual.current = mostrado;
      onPaso(mostrado);
      const k = PASOS[mostrado].pila;
      onSelect(k !== undefined && pilas[k] ? pilas[k].id : null);
    }
  });
  return null;
}
