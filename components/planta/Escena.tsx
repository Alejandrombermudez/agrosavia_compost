"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Edges, Grid, Html, Line, OrbitControls, Sky, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { Line2, LineSegments2 } from "three-stdlib";
import {
  CENTRO,
  MAESTRO,
  PILA,
  colorTemp,
  esActiva,
  lecturas,
  posicionPila,
  type PilaResumen,
} from "@/lib/planta";
import { aplicarMaterial, getTexturas } from "./texturas";
import RecorridoGuiado from "./RecorridoGuiado";

const MODELO = "/models/bodega.glb";
useGLTF.preload(MODELO);

// Vistas de infraestructura
export type Modo = "sin" | "parcial" | "completa";
export const MODOS: { id: Modo; nombre: string }[] = [
  { id: "sin", nombre: "Sin infraestructura" },
  { id: "parcial", nombre: "Infraestructura parcial" },
  { id: "completa", nombre: "Infraestructura completa" },
];

// En la vista parcial se ocultan techo, cerchas y silos para ver las pilas desde arriba
const TECHO = new Set(["Cubierta_lamina", "Tejas_traslucidas", "Remates_canales", "Cerchas_correas", "Lamparas"]);
const SILOS = (n: string) => n.startsWith("Silos_") || n === "Grava_silos";

export const CAMARA_INICIAL: [number, number, number] = [-16, 22, 8];
// En la vista completa la cámara se aleja para que quepan los silos
const CAMARA_COMPLETA: [number, number, number] = [-38, 30, 22];

const C_CIRCUITO = "#06b6d4";

interface Props {
  pilas: PilaResumen[];
  hora: number;
  seleccion: string | null;
  onSelect: (id: string | null) => void;
  modo: Modo;
  /** Vista guiada activa: la cámara la mueve el recorrido y no el mouse. */
  guiada: boolean;
  onPasoGuiado: (i: number) => void;
  onFinGuiado: () => void;
}

export default function Escena({ pilas, hora, seleccion, onSelect, modo, guiada, onPasoGuiado, onFinGuiado }: Props) {
  const infra = modo !== "sin";
  // Con infraestructura el sol sigue la hora; sin infraestructura la luz es fija de día
  const h = infra ? hora : 11;
  const elev = Math.sin(((h - 6) / 12) * Math.PI);
  const sol = useMemo(() => {
    const az = ((h - 6) / 12) * Math.PI;
    return new THREE.Vector3(Math.cos(az) * 40, Math.max(elev, -0.2) * 40, -14);
  }, [h, elev]);
  const dia = Math.max(0, elev);
  const noche = 1 - Math.min(1, dia * 3);

  return (
    <>
      {infra ? (
        <Sky sunPosition={sol} turbidity={6} rayleigh={1.5} mieCoefficient={0.004} />
      ) : (
        <color attach="background" args={["#eef2f6"]} />
      )}
      <Ambiente intensidad={0.3 + 0.5 * dia} />
      <hemisphereLight args={["#dbeafe", "#4d3b22", 0.35 + 0.55 * dia]} />
      <directionalLight
        position={sol}
        intensity={2.4 * dia}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-camera-far={120}
      />
      {infra &&
        [-6, -14, -22].map((z) => (
          <pointLight key={z} position={[0, 3, z]} intensity={16 * noche + 2} distance={16} decay={1.6} color="#fff3d6" />
        ))}

      {infra ? <Bodega modo={modo} /> : <PisoLimpio />}

      {pilas.map((p, i) => (
        <Pila
          key={p.id}
          p={p}
          i={i}
          hora={hora}
          infra={infra}
          conTecho={modo === "completa"}
          seleccionada={seleccion === p.id}
          atenuada={seleccion !== null && seleccion !== p.id}
          sinEtiqueta={guiada && seleccion !== p.id}
          onSelect={onSelect}
        />
      ))}
      <Circuitos pilas={pilas} seleccion={seleccion} />
      <Maestro n={pilas.length} conTecho={modo === "completa"} />
      {guiada ? (
        <RecorridoGuiado
          pilas={pilas}
          fin={modo === "completa" ? CAMARA_COMPLETA : CAMARA_INICIAL}
          onPaso={onPasoGuiado}
          onSelect={onSelect}
          onFin={onFinGuiado}
        />
      ) : (
        <>
          <CamaraPorModo modo={modo} />
          {/* Velocidades bajas para que el mouse no gire la escena tan rápido */}
          <OrbitControls
            makeDefault
            target={CENTRO}
            maxPolarAngle={Math.PI / 2 - 0.05}
            minDistance={3}
            maxDistance={modo === "completa" ? 75 : 55}
            enableDamping
            dampingFactor={0.06}
            rotateSpeed={0.4}
            zoomSpeed={0.5}
            panSpeed={0.5}
          />
        </>
      )}
    </>
  );
}

/** Mapa de entorno generado en el navegador para que los metales reflejen algo. */
function Ambiente({ intensidad }: { intensidad: number }) {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
      pm.dispose();
    };
  }, [gl, scene]);
  useEffect(() => {
    scene.environmentIntensity = intensidad;
  }, [scene, intensidad]);
  return null;
}

function Bodega({ modo }: { modo: Modo }) {
  const { scene } = useGLTF(MODELO);
  useEffect(() => {
    const tex = getTexturas();
    const hechos = new Set<string>();
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.receiveShadow = true;
      m.castShadow = m.name !== "Terreno_pasto" && m.name !== "Plataforma_concreto";
      const mat = m.material as THREE.MeshStandardMaterial;
      if (hechos.has(mat.uuid)) return;
      hechos.add(mat.uuid);
      aplicarMaterial(mat, tex);
    });
  }, [scene]);
  useEffect(() => {
    scene.traverse((o) => {
      if (TECHO.has(o.name) || SILOS(o.name)) o.visible = modo === "completa";
    });
  }, [scene, modo]);
  return <primitive object={scene} />;
}

/** Vista sin infraestructura: piso claro con cuadrícula y el contorno de la bodega. */
function PisoLimpio() {
  const contorno = useMemo<[number, number, number][]>(
    () => [
      [-7.6, 0.02, 0],
      [7.6, 0.02, 0],
      [7.6, 0.02, -30],
      [-7.6, 0.02, -30],
      [-7.6, 0.02, 0],
    ],
    []
  );
  return (
    <>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, -14]} receiveShadow>
        <planeGeometry args={[60, 70]} />
        <meshStandardMaterial color="#f8fafc" roughness={1} />
      </mesh>
      <Grid
        position={[0, 0.005, -14]}
        args={[60, 70]}
        cellSize={1}
        cellThickness={0.6}
        cellColor="#d6dde6"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#b4c0cf"
        fadeDistance={60}
        fadeStrength={1.5}
      />
      <Line points={contorno} color="#94a3b8" lineWidth={1.5} dashed dashSize={0.6} gapSize={0.4} />
    </>
  );
}

/** Hilera de compost: sección trapezoidal con bordes redondeados (compartida por todas las pilas). */
let geoPila: THREE.ExtrudeGeometry | null = null;
function geometriaPila() {
  if (geoPila) return geoPila;
  const { ancho, alto, largo } = PILA;
  const b = 0.2;
  const s = new THREE.Shape();
  const w = ancho / 2 - b, t = 0.8 - b, hh = alto - 2 * b;
  s.moveTo(-w, 0);
  s.lineTo(w, 0);
  s.lineTo(t, hh);
  s.lineTo(-t, hh);
  s.closePath();
  geoPila = new THREE.ExtrudeGeometry(s, {
    depth: largo - 2 * b,
    bevelEnabled: true,
    bevelThickness: b,
    bevelSize: b,
    bevelSegments: 4,
    curveSegments: 4,
  });
  geoPila.translate(0, b, -(largo - 2 * b) / 2);
  geoPila.computeVertexNormals();
  return geoPila;
}

const desfase = (i: number) => i * 0.45;
const SENSORES = [
  ["fondo", 0.35],
  ["medio", 0.8],
  ["superficie", 1.25],
] as const;

function Pila({
  p,
  i,
  hora,
  infra,
  conTecho,
  seleccionada,
  atenuada,
  sinEtiqueta,
  onSelect,
}: {
  p: PilaResumen;
  i: number;
  hora: number;
  infra: boolean;
  conTecho: boolean;
  seleccionada: boolean;
  /** Hay otra pila seleccionada: esta pasa a gris y sin información. */
  atenuada: boolean;
  /** Durante la vista guiada solo se muestra la etiqueta de la pila que se está presentando. */
  sinEtiqueta: boolean;
  onSelect: (id: string | null) => void;
}) {
  const { x, z } = posicionPila(i);
  const lect = lecturas(p, hora);
  const color = atenuada ? "#94a3b8" : colorTemp(lect.medio);
  const [hover, setHover] = useState(false);
  const led = useRef<THREE.MeshStandardMaterial>(null);
  const transparente = seleccionada || !infra;

  useFrame(({ clock }) => {
    if (!led.current) return;
    const t = (clock.elapsedTime - desfase(i) + 4) % 4;
    led.current.emissiveIntensity = atenuada ? 0 : t < 0.3 ? 6 : 0.5;
  });

  const click = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6) return; // fue un arrastre de cámara
    e.stopPropagation();
    onSelect(seleccionada ? null : p.id);
  };

  return (
    <group position={[x, PILA.piso, z]}>
      <mesh
        geometry={geometriaPila()}
        castShadow={!transparente}
        receiveShadow
        onClick={click}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHover(false);
          document.body.style.cursor = "auto";
        }}
      >
        {infra ? (
          <meshStandardMaterial
            map={getTexturas().compost}
            color={atenuada ? "#a8a29e" : esActiva(p.estado) ? "#6b4a2f" : "#5d544c"}
            roughness={1}
            emissive={color}
            emissiveIntensity={!atenuada && (hover || seleccionada) ? 0.25 : 0}
            transparent={seleccionada}
            opacity={seleccionada ? 0.3 : 1}
            depthWrite={!seleccionada}
          />
        ) : (
          <meshStandardMaterial
            color={color}
            roughness={0.35}
            transparent
            opacity={seleccionada ? 0.3 : atenuada ? 0.22 : hover ? 0.6 : 0.45}
            depthWrite={false}
          />
        )}
        {!infra && <Edges color={color} threshold={25} />}
      </mesh>

      {/* Base de color según la temperatura del núcleo */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.012}>
        <planeGeometry args={[PILA.ancho + 0.5, PILA.largo + 0.5]} />
        <meshBasicMaterial
          color={color}
          toneMapped={false}
          transparent
          opacity={seleccionada ? 0.6 : atenuada ? 0.12 : 0.3}
        />
      </mesh>

      {/* Bastón: varilla con 3 sensores y cabeza con radio y panel solar */}
      <mesh position-y={1.2} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 2.4, 10]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position-y={2.55} castShadow>
        <boxGeometry args={[0.36, 0.44, 0.22]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.45} />
      </mesh>
      <mesh position={[0, 2.82, 0]} rotation-x={-0.5}>
        <boxGeometry args={[0.46, 0.02, 0.32]} />
        <meshStandardMaterial color="#1e3a8a" metalness={0.4} roughness={0.25} />
      </mesh>
      <mesh position={[0.13, 3.0, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.45, 6]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      <mesh position={[0, 2.6, 0.115]}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshStandardMaterial ref={led} color="#22c55e" emissive="#22c55e" toneMapped={false} />
      </mesh>
      {transparente &&
        !atenuada &&
        SENSORES.map(([k, y]) => (
          <group key={k} position-y={y}>
            <mesh>
              <sphereGeometry args={[0.11, 16, 16]} />
              <meshBasicMaterial color={colorTemp(lect[k])} toneMapped={false} />
            </mesh>
          </group>
        ))}

      {/* Con techo la etiqueta se vería a través de la cubierta: solo al pasar el mouse o seleccionar */}
      <Html position={[0, 3.45, 0]} center style={{ pointerEvents: "none" }} zIndexRange={[9, 0]}>
        <div
          hidden={atenuada || sinEtiqueta || (conTecho && !seleccionada && !hover)}
          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold shadow-md ${
            seleccionada ? "bg-agro-blue text-white" : "bg-white/95 text-gray-800"
          }`}
        >
          {p.nombre} · <span style={{ color: seleccionada ? "#fff" : color }}>{lect.medio.toFixed(0)} °C</span>
        </div>
      </Html>
    </group>
  );
}

/** Trazas tipo circuito impreso desde cada pila hasta el nodo maestro. */
function rutaCircuito(i: number): [number, number, number][] {
  const { x, z, k } = posicionPila(i);
  const sx = Math.sign(x);
  const y = 0.03;
  const borde = x - sx * (PILA.ancho / 2 + 0.25);
  const carril = sx * (0.35 + k * 0.22); // cada pila tiene su carril en el pasillo
  const llegada = sx * (0.08 + k * 0.07);
  const zFin = MAESTRO.z - 0.25;
  return [
    [borde, y, z],
    [carril + sx * 0.3, y, z],
    [carril, y, z + 0.3],
    [carril, y, zFin - 0.6 - k * 0.12],
    [llegada, y, zFin - 0.2],
    [llegada, y, zFin],
    [llegada, MAESTRO.alto - 0.45, zFin], // sube al gabinete
  ];
}

function Circuitos({ pilas, seleccion }: { pilas: PilaResumen[]; seleccion: string | null }) {
  const rutas = useMemo(() => pilas.map((_, i) => rutaCircuito(i)), [pilas]);
  return (
    <>
      {rutas.map((pts, i) => (
        <Traza
          key={pilas[i].id}
          puntos={pts}
          color={C_CIRCUITO}
          activa={seleccion === pilas[i].id}
          atenuada={seleccion !== null && seleccion !== pilas[i].id}
        />
      ))}
    </>
  );
}

function Traza({
  puntos,
  color,
  activa,
  atenuada,
}: {
  puntos: [number, number, number][];
  color: string;
  activa: boolean;
  atenuada: boolean;
}) {
  const pulso = useRef<Line2 | LineSegments2>(null);
  useFrame((_, dt) => {
    if (pulso.current) pulso.current.material.dashOffset -= dt * 2.2;
  });
  if (atenuada) return <Line points={puntos} color="#94a3b8" lineWidth={1.5} transparent opacity={0.15} />;
  return (
    <>
      <Line points={puntos} color={color} lineWidth={activa ? 4 : 2} transparent opacity={activa ? 0.7 : 0.35} />
      <Line
        ref={pulso}
        points={puntos}
        color={activa ? "#ffffff" : color}
        lineWidth={activa ? 4.5 : 2.5}
        dashed
        dashSize={0.4}
        gapSize={1.4}
        toneMapped={false}
      />
      {[0, 1, 2, 3].map((j) => (
          <mesh key={j} position={[puntos[j][0], 0.035, puntos[j][2]]} rotation-x={-Math.PI / 2}>
            <circleGeometry args={[j === 0 ? 0.13 : 0.07, 16]} />
            <meshBasicMaterial color={color} toneMapped={false} />
          </mesh>
        ))}
    </>
  );
}

/** Al cambiar a la vista completa aleja la cámara (y la acerca al volver), con transición suave. */
function CamaraPorModo({ modo }: { modo: Modo }) {
  const { camera } = useThree();
  const controls = useThree((s) => s.controls) as unknown as { target: THREE.Vector3; update: () => void; addEventListener: (e: string, f: () => void) => void; removeEventListener: (e: string, f: () => void) => void } | null;
  const destino = useRef<THREE.Vector3 | null>(null);
  const primera = useRef(true);
  const centro = useMemo(() => new THREE.Vector3(...CENTRO), []);

  useEffect(() => {
    if (primera.current) {
      primera.current = false;
      return;
    }
    destino.current = new THREE.Vector3(...(modo === "completa" ? CAMARA_COMPLETA : CAMARA_INICIAL));
  }, [modo]);

  useEffect(() => {
    if (!controls) return;
    const parar = () => (destino.current = null);
    controls.addEventListener("start", parar);
    return () => controls.removeEventListener("start", parar);
  }, [controls]);

  useFrame((_, dt) => {
    if (!destino.current || !controls) return;
    const k = 1 - Math.exp(-dt * 2.5);
    camera.position.lerp(destino.current, k);
    controls.target.lerp(centro, k);
    controls.update();
    if (camera.position.distanceTo(destino.current) < 0.05) destino.current = null;
  });
  return null;
}

function Maestro({ n, conTecho }: { n: number; conTecho: boolean }) {
  const leds = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  useFrame(({ clock }) => {
    leds.current.forEach((m, i) => {
      if (!m) return;
      const t = (clock.elapsedTime - desfase(i) + 4) % 4;
      m.emissiveIntensity = t < 0.3 ? 6 : 1;
    });
  });
  const H = MAESTRO.alto;
  return (
    <group position={[MAESTRO.x, PILA.piso, MAESTRO.z]}>
      {/* base y patas */}
      <mesh position-y={0.02} receiveShadow>
        <boxGeometry args={[1.3, 0.04, 0.8]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      {[-0.4, 0.4].map((dx) => (
        <mesh key={dx} position={[dx, (H - 0.45) / 2, 0]} castShadow>
          <boxGeometry args={[0.07, H - 0.45, 0.07]} />
          <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.4} />
        </mesh>
      ))}
      {/* gabinete */}
      <mesh position-y={H} castShadow>
        <boxGeometry args={[1.0, 0.9, 0.4]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.4} />
      </mesh>
      <mesh position={[0, H + 0.15, 0.205]}>
        <planeGeometry args={[0.7, 0.32]} />
        <meshBasicMaterial color="#0e7490" toneMapped={false} />
      </mesh>
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i} position={[-0.3 + (i % 8) * (0.6 / 7), H - 0.2, 0.21]}>
          <sphereGeometry args={[0.025, 10, 10]} />
          <meshStandardMaterial
            ref={(m) => {
              leds.current[i] = m;
            }}
            color={C_CIRCUITO}
            emissive={C_CIRCUITO}
            toneMapped={false}
          />
        </mesh>
      ))}
      {[-0.35, 0.35].map((dx) => (
        <mesh key={dx} position={[dx, H + 0.75, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.6, 8]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
      ))}
      <Html position={[0, H + 1.25, 0]} center style={{ pointerEvents: "none" }} zIndexRange={[9, 0]}>
        <div
          hidden={conTecho}
          className="whitespace-nowrap rounded-lg bg-cyan-600 px-2.5 py-1 text-xs font-semibold text-white shadow-md"
        >
          Nodo maestro · Wi-Fi
        </div>
      </Html>
    </group>
  );
}
