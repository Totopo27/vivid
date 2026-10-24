#!/usr/bin/env node
// muestras.mjs: dibuja las láminas de lo que hay a mano (guia/muestras/<lámina>.jpg), cada pieza con su nombre: el kit,
// los looks, los subtítulos y las piezas nuevas. Cada lámina sale de un archivo de motor/muestras/.
import { createCanvas } from "@napi-rs/canvas";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { RAIZ, argumentos, ayuda } from "./lib/comun.mjs";
import { guardar } from "./lib/hojas.mjs";
import "./lib/subtitulos.mjs"; // registra la letra

ayuda(`
node motor/muestras.mjs [lámina]

Rehace guia/muestras/<lámina>.jpg con cada archivo de motor/muestras/ (sin nada, todas). Míralas antes de dibujar:
son lo que ya está hecho.
`);

const { sueltos } = argumentos();
const L = 1080, T = 360, C = 3;
const archivos = readdirSync(join(RAIZ, "motor", "muestras")).filter((f) => /\.m?js$/.test(f) && (!sueltos[0] || f.replace(/\.m?js$/, "") === sueltos[0])).sort();
for (const f of archivos) {
  const muestras = (await import(pathToFileURL(join(RAIZ, "motor", "muestras", f)).href)).default;
  const filas = Math.ceil(muestras.length / C), hoja = createCanvas(C * T + (C + 1) * 6, filas * (T + 34) + 6), gh = hoja.getContext("2d");
  gh.fillStyle = "#ffffff"; gh.fillRect(0, 0, hoja.width, hoja.height);
  const tile = createCanvas(L, 1920), gt = tile.getContext("2d");
  muestras.forEach(([nombre, dibuja], i) => {
    gt.setTransform(1, 0, 0, 1, 0, 0); gt.globalAlpha = 1; gt.globalCompositeOperation = "source-over"; gt.filter = "none"; gt.clearRect(0, 0, L, 1920);
    gt.save(); dibuja(gt); gt.restore();
    const x = 6 + (i % C) * (T + 6), y = 6 + Math.floor(i / C) * (T + 34);
    gh.drawImage(tile, 0, 0, L, L, x, y, T, T);
    gh.fillStyle = "#111"; gh.font = "700 15px Figtree"; gh.textBaseline = "top"; gh.fillText(nombre, x + 2, y + T + 6);
  });
  console.log(guardar(hoja, join(RAIZ, "guia", "muestras", f.replace(/\.m?js$/, ".jpg"))));
}
