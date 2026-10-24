#!/usr/bin/env node
// pruebas.mjs: comprueba que el motor sigue dibujando igual que cuando se aprobó. Cada caso es un ejemplo (o una
// apertura suya): se dibujan unos cien fotogramas repartidos por todo el vídeo y alrededor de cada corte, con sus
// subtítulos, y se comparan con pruebas/referencias/. Además, cada look y cada estilo de subtítulos sobre un ejemplo,
// y cada muestra de las láminas (las piezas del kit). Si cambia algo que no debía, aquí se ve.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createCanvas } from "@napi-rs/canvas";
import { RAIZ, argumentos, ayuda, fallo } from "./lib/comun.mjs";

ayuda(`
node motor/pruebas.mjs [--guardar] [--caso nombre]

Dibuja los ejemplos (y cada look, cada estilo de subtítulos y cada lámina de motor/muestras/) y los compara con
pruebas/referencias/:
  igual       el mismo fotograma, píxel a píxel
  casi igual  cambia muy poco (otro ordenador, otra versión del sistema): está bien
  CAMBIA      se ve distinto: mira pruebas/diferencias/<caso>.jpg (arriba la referencia, abajo lo de ahora)
Además dibuja cada fotograma dos veces y en otro orden: si no sale igual, algo guarda estado entre fotogramas.
Antes pasa las pruebas rápidas de lo puro (motor/pruebas-rapidas.mjs: la voz, los subtítulos, la marca...).
--guardar: rehace las referencias con lo de ahora. Solo cuando el cambio de imagen es a propósito y ya lo has mirado.
`);

const { LOOKS } = await import("./kit/looks/index.js");
const { ESTILOS } = await import("./lib/subtitulos.mjs");
const POS = ["arriba", "centro", "abajo"];
const CASOS = [
  { nombre: "estrella-verde", dir: "ejemplo/estrella-verde" },
  { nombre: "alcohol", dir: "ejemplo/alcohol" },
  { nombre: "alcohol-apertura-bola", dir: "ejemplo/alcohol", apertura: "01-bola", hasta: 4.8 },
  // cada look sobre un ejemplo y cada estilo de subtítulos sobre el otro, con pocos fotogramas: lo que se protege es el
  // look o el estilo (uno nuevo pide sus referencias: --guardar --caso look-<nombre>)
  ...Object.keys(LOOKS).filter((l) => l !== "espacio").map((look) => ({ nombre: `look-${look}`, dir: "ejemplo/alcohol", estilo: { look }, n: 16 })),
  ...Object.keys(ESTILOS).filter((e) => e !== "caja").map((e, i) => ({ nombre: `subtitulos-${e}`, dir: "ejemplo/estrella-verde", estilo: { subtitulos: { estilo: e, posicion: POS[i % 3] } }, n: 16 })),
  // cada muestra de las láminas de motor/muestras/: las piezas del kit, los looks y los subtítulos
  { nombre: "laminas", laminas: true },
];
const REF = join(RAIZ, "pruebas", "referencias"), DIF = join(RAIZ, "pruebas", "diferencias");
const GW = 45, GH = 80; // la rejilla con que se compara cuando no es igual píxel a píxel
const { op } = argumentos();

if (op.caso && op.hijo) await unCaso(CASOS.find((c) => c.nombre === op.caso));
else {
  // las pruebas rápidas primero, y cada caso en su propio proceso: la voz de un vídeo no se mezcla con la del otro
  let mal = 0;
  if (!op.caso) {
    const r = spawnSync(process.execPath, [join(RAIZ, "motor", "pruebas-rapidas.mjs")], { stdio: "inherit", env: { ...process.env, VIDEOS_MARCA: "ninguna" } });
    if (r.status !== 0) mal++;
  }
  for (const c of CASOS.filter((c) => !op.caso || c.nombre === op.caso)) {
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), "--hijo", "--caso", c.nombre, ...(op.guardar ? ["--guardar"] : [])], { stdio: "inherit", env: { ...process.env, VIDEOS_MARCA: "ninguna" } });
    if (r.status !== 0) mal++;
  }
  if (mal) fallo(`${mal} prueba(s) fallan. Si es un ejemplo que cambia a propósito y lo has mirado: node motor/pruebas.mjs --guardar`);
  console.log(op.guardar ? "Referencias guardadas." : "Todo igual que las referencias.");
}

async function unCaso(caso) {
  const { pinta, ts } = caso.laminas ? await laminas() : await unVideo(caso);
  const W = 1080, H = 1920, peq = createCanvas(GW, GH), gp = peq.getContext("2d");
  const mira = (t) => {
    const l = pinta(t), hash = createHash("sha1").update(l.data()).digest("hex").slice(0, 16);
    gp.clearRect(0, 0, GW, GH); gp.drawImage(l, 0, 0, W, H, 0, 0, GW, GH);
    const d = gp.getImageData(0, 0, GW, GH).data, rej = Buffer.alloc(GW * GH * 3);
    for (let i = 0; i < GW * GH; i++) { rej[i * 3] = d[i * 4]; rej[i * 3 + 1] = d[i * 4 + 1]; rej[i * 3 + 2] = d[i * 4 + 2]; }
    return { t, hash, rejilla: rej.toString("base64") };
  };
  const ahora = ts.map(mira);
  // otra vez, de atrás adelante: lo mismo si nada se guarda de un fotograma al siguiente
  const otraVez = [...ts].reverse().map(mira).reverse();
  const inestables = ahora.filter((f, i) => f.hash !== otraVez[i].hash).map((f) => f.t);
  const archivo = join(REF, `${caso.nombre}.json`);
  if (op.guardar) {
    mkdirSync(REF, { recursive: true });
    writeFileSync(archivo, JSON.stringify({ caso, fotogramas: ahora }) + "\n");
    hojaDe(ahora.map((f) => f.t), pinta, join(REF, `${caso.nombre}.jpg`));
    console.log(`${caso.nombre}: ${ahora.length} fotogramas guardados${inestables.length ? ` (aviso: ${inestables.length} no salen igual dos veces)` : ""}`);
    return;
  }
  if (!existsSync(archivo)) fallo(`${caso.nombre}: no hay referencias. Guárdalas con node motor/pruebas.mjs --guardar`);
  const ref = JSON.parse(readFileSync(archivo, "utf8")).fotogramas;
  let iguales = 0, casi = 0;
  const cambian = [];
  for (const r of ref) {
    const f = ahora.find((x) => mismo(x.t, r.t));
    if (!f) { cambian.push({ t: r.t, media: 255, max: 255, ref: Buffer.from(r.rejilla, "base64"), ahora: Buffer.alloc(GW * GH * 3) }); continue; }
    if (f.hash === r.hash) { iguales++; continue; }
    const a = Buffer.from(r.rejilla, "base64"), b = Buffer.from(f.rejilla, "base64");
    let max = 0, suma = 0;
    for (let i = 0; i < a.length; i++) { const x = Math.abs(a[i] - b[i]); suma += x; if (x > max) max = x; }
    const media = suma / a.length;
    if (media < 0.6 && max < 24) casi++; else cambian.push({ t: r.t, media, max, ref: a, ahora: b });
  }
  const linea = `${caso.nombre}: ${iguales} igual, ${casi} casi igual, ${cambian.length} cambian${inestables.length ? `; ${inestables.length} no salen igual dos veces (${inestables.slice(0, 6).join(", ")} s)` : ""}`;
  console.log(linea);
  if (cambian.length) {
    console.log("  cambian en: " + cambian.slice(0, 12).map((c) => `${typeof c.t === "number" ? c.t.toFixed(2) + " s" : c.t} (media ${c.media.toFixed(1)})`).join(", "));
    mkdirSync(DIF, { recursive: true });
    const n = Math.min(cambian.length, 20), E = 4, c = createCanvas(n * (GW * E + 4) + 4, 2 * (GH * E + 4) + 4), g = c.getContext("2d");
    g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
    cambian.slice(0, n).forEach((x, i) => [x.ref, x.ahora].forEach((rej, fila) => {
      const tile = createCanvas(GW, GH), gt = tile.getContext("2d"), img = gt.createImageData(GW, GH);
      for (let k = 0; k < GW * GH; k++) { img.data[k * 4] = rej[k * 3]; img.data[k * 4 + 1] = rej[k * 3 + 1]; img.data[k * 4 + 2] = rej[k * 3 + 2]; img.data[k * 4 + 3] = 255; }
      gt.putImageData(img, 0, 0);
      g.imageSmoothingEnabled = false; g.drawImage(tile, 4 + i * (GW * E + 4), 4 + fila * (GH * E + 4), GW * E, GH * E);
    }));
    writeFileSync(join(DIF, `${caso.nombre}.jpg`), c.toBuffer("image/jpeg", 88));
    console.log(`  míralo: ${join(DIF, `${caso.nombre}.jpg`)}`);
  }
  if (cambian.length || inestables.length) process.exit(1);
}

// El mismo momento: un segundo (de un vídeo) o el nombre de una muestra ("agua#3").
function mismo(a, b) { return typeof a === "number" && typeof b === "number" ? Math.abs(a - b) < 1e-6 : a === b; }

// Un vídeo (con otro look u otros subtítulos si el caso lo pide): unos fotogramas repartidos y los de cada corte.
async function unVideo(caso) {
  const { abrir } = await import("./lib/proyecto.mjs");
  const { dibujar, preparar } = await import("./lib/cuadro.mjs");
  const proy = await abrir(join(RAIZ, caso.dir), { apertura: caso.apertura || null, estilo: caso.estilo || null });
  const dur = Math.min(proy.duracion, caso.hasta || proy.duracion), est = preparar(proy), n = caso.n || 60;
  const ts = [];
  for (let i = 0; i < n; i++) ts.push(Math.round(((dur - 0.05) * i * 1000) / (n - 1)) / 1000);
  if (!caso.n) for (const p of proy.planos.slice(1)) if (p.desde < dur) ts.push(Math.round((p.desde - 0.02) * 1000) / 1000, Math.round((p.desde + 0.02) * 1000) / 1000);
  ts.sort((a, b) => a - b);
  return { ts, pinta: (t) => dibujar(proy, est, t) };
}

// Las láminas: cada muestra de motor/muestras/, como la dibuja muestras.mjs (un cuadrado de 1080 arriba del lienzo).
async function laminas() {
  await import("./lib/subtitulos.mjs"); // la letra
  const lista = [];
  for (const f of readdirSync(join(RAIZ, "motor", "muestras")).filter((f) => /\.m?js$/.test(f)).sort()) {
    const m = (await import(pathToFileURL(join(RAIZ, "motor", "muestras", f)).href)).default;
    m.forEach(([, dibuja], i) => lista.push({ id: `${f.replace(/\.m?js$/, "")}#${i + 1}`, dibuja }));
  }
  const l = createCanvas(1080, 1920), g = l.getContext("2d");
  const pinta = (id) => {
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = "source-over"; g.filter = "none"; g.clearRect(0, 0, 1080, 1920);
    g.save(); lista.find((x) => x.id === id).dibuja(g); g.restore();
    return l;
  };
  return { ts: lista.map((x) => x.id), pinta };
}

// Una hoja con los fotogramas de la referencia, para verlos.
function hojaDe(ts, pinta, ruta) {
  const an = 108, al = 192, col = 12, filas = Math.ceil(ts.length / col), c = createCanvas(col * (an + 2) + 2, filas * (al + 2) + 2), g = c.getContext("2d");
  g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
  ts.forEach((t, i) => g.drawImage(pinta(t), 2 + (i % col) * (an + 2), 2 + Math.floor(i / col) * (al + 2), an, al));
  writeFileSync(ruta, c.toBuffer("image/jpeg", 80));
}
