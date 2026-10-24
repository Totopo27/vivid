// Hojas de fotogramas: varios momentos del vídeo, en pequeño y en orden, con su segundo y la palabra que suena. Es
// la manera de ver el movimiento sin esperar a un render: cada hoja tarda segundos.
import { createCanvas } from "@napi-rs/canvas";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { ALTO, ANCHO } from "./comun.mjs";
import { dibujar } from "./cuadro.mjs";

// La palabra que suena en t (o la última dicha).
export function palabraEn(v, t) {
  let w = null;
  for (const p of v.palabras) { if (p.inicio <= t + 0.001) w = p; else break; }
  return w;
}

// tiempos: lista de segundos (o de { t, marca }); ancho de cada fotograma; columnas.
export function hoja(proy, est, tiempos, { ancho = 180, columnas = 8, subtitulos = true, titulo = "" } = {}) {
  const alto = Math.round((ancho * ALTO) / ANCHO), cab = titulo ? 34 : 0, pie = 22;
  const filas = Math.ceil(tiempos.length / columnas), sep = 4;
  const W = columnas * ancho + (columnas + 1) * sep, H = cab + filas * (alto + pie + sep) + sep;
  const c = createCanvas(W, H), g = c.getContext("2d");
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, W, H);
  if (titulo) { g.fillStyle = "#111"; g.font = "700 20px Figtree"; g.textBaseline = "middle"; g.fillText(titulo, sep + 4, cab / 2); }
  tiempos.forEach((x, i) => {
    const t = typeof x === "number" ? x : x.t, marca = typeof x === "number" ? "" : x.marca || "";
    const col = i % columnas, fila = Math.floor(i / columnas), px = sep + col * (ancho + sep), py = cab + sep + fila * (alto + pie + sep);
    dibujar(proy, est, Math.max(0, Math.min(proy.duracion - 1 / 120, t)), { subtitulos });
    g.drawImage(est.lienzo, px, py, ancho, alto);
    const w = palabraEn(proy.v, t);
    g.fillStyle = marca ? "#c0262d" : "#111"; g.font = "700 14px Figtree"; g.textBaseline = "top";
    g.fillText(`${t.toFixed(2)} ${marca || (w ? "«" + w.texto.replace(/[.,:;!?¿¡]/g, "") + "»" : "")}`.slice(0, 26), px + 2, py + alto + 4);
  });
  return c;
}

export function guardar(c, ruta) {
  mkdirSync(dirname(ruta), { recursive: true });
  writeFileSync(ruta, c.toBuffer("image/jpeg", 88));
  return ruta;
}

// De a a b, n fotogramas repartidos (incluidos los extremos).
export const reparto = (a, b, n) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / Math.max(1, n - 1));
