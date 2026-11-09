import * as THREE from "three";
import { rng } from "@/lib/planta";

// Texturas dibujadas en el navegador (no se descarga ninguna imagen).
// Las coordenadas UV del modelo están en metros: 1 repetición = 1 m.

export interface Texturas {
  ladrillo: THREE.Texture;
  techo: THREE.Texture;
  silo: THREE.Texture;
  porton: THREE.Texture;
  pasto: THREE.Texture;
  concreto: THREE.Texture;
  compost: THREE.Texture;
}

let cache: Texturas | null = null;

function lienzo(n: number) {
  const c = document.createElement("canvas");
  c.width = c.height = n;
  return [c, c.getContext("2d")!] as const;
}

function textura(c: HTMLCanvasElement, repetir = 1) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.repeat.set(repetir, repetir);
  return t;
}

function ladrillo() {
  const n = 512, filas = 12, bw = n / 4, bh = n / filas;
  const [c, x] = lienzo(n);
  const r = rng(11);
  x.fillStyle = "#a59c90";
  x.fillRect(0, 0, n, n);
  for (let f = 0; f < filas; f++) {
    const off = f % 2 ? bw / 2 : 0;
    for (let i = -1; i <= 4; i++) {
      const l = 30 + r() * 10, s = 48 + r() * 14, h = 12 + r() * 9;
      x.fillStyle = `hsl(${h}, ${s}%, ${l}%)`;
      x.fillRect(i * bw + off + 3, f * bh + 3, bw - 6, bh - 6);
    }
  }
  return textura(c);
}

/** Franjas tipo lámina ondulada: `periodos` ondas por metro. */
function franjas(periodos: number, vertical: boolean) {
  const n = 256;
  const [c, x] = lienzo(n);
  for (let k = 0; k < n; k++) {
    const v = Math.round(255 * (0.8 + 0.2 * Math.cos((2 * Math.PI * periodos * k) / n)));
    x.fillStyle = `rgb(${v},${v},${v})`;
    if (vertical) x.fillRect(k, 0, 1, n);
    else x.fillRect(0, k, n, 1);
  }
  return textura(c);
}

function ruido(semilla: number, min: number, bloque: number, repetir: number, tono?: [number, number, number]) {
  const n = 256;
  const [c, x] = lienzo(n);
  const r = rng(semilla);
  for (let i = 0; i < n; i += bloque) {
    for (let j = 0; j < n; j += bloque) {
      const v = min + (1 - min) * r();
      const [tr, tg, tb] = tono ?? [1, 1, 1];
      x.fillStyle = `rgb(${Math.round(255 * v * tr)},${Math.round(255 * v * tg)},${Math.round(255 * v * tb)})`;
      x.fillRect(i, j, bloque, bloque);
    }
  }
  return textura(c, repetir);
}

export function getTexturas(): Texturas {
  if (cache) return cache;
  cache = {
    ladrillo: ladrillo(),
    techo: franjas(7, false),
    silo: franjas(13, false),
    porton: franjas(7, true),
    pasto: ruido(3, 0.7, 4, 1 / 6),
    concreto: ruido(5, 0.85, 8, 1 / 3),
    compost: ruido(9, 0.55, 4, 2, [1, 0.92, 0.85]),
  };
  return cache;
}

/** Ajusta los materiales que vienen de Blender según su nombre. */
export function aplicarMaterial(mat: THREE.MeshStandardMaterial, t: Texturas) {
  switch (mat.name) {
    case "Ladrillo":
      mat.map = t.ladrillo;
      mat.color.set("#ffffff");
      break;
    case "Lamina_techo":
      mat.map = t.techo;
      break;
    case "Lamina_silo":
      mat.map = t.silo;
      break;
    case "Porton_rojo":
      mat.map = t.porton;
      break;
    case "Pasto":
      mat.map = t.pasto;
      break;
    case "Concreto":
    case "Piso_concreto":
    case "Grava":
    case "Tierra":
      mat.map = t.concreto;
      break;
    case "Teja_traslucida":
      mat.transparent = true;
      mat.opacity = 0.55;
      mat.depthWrite = false;
      break;
  }
  mat.needsUpdate = true;
}
