// Comprobaciones de un vídeo sin renderizarlo, de lo que ya ha salido mal otras veces: algo que guarda estado entre
// fotogramas, un fotograma que falla o que tarda, el hook que arranca quieto, un tramo gris o apagado, una frase
// atropellada, un vídeo demasiado largo o corto, texto donde lo tapa Instagram y lo prohibido en los archivos del
// proyecto. Como las demás medidas, son dónde mirar, no una nota. Las usan revisar.mjs y comprobar.mjs.
import { createCanvas } from "@napi-rs/canvas";
import { createHash } from "node:crypto";
import { Worker } from "node:worker_threads";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { look } from "../kit/looks/index.js";
import { arg, lugarDelError } from "./comun.mjs";
import { dibujar, planoEn, preparar } from "./cuadro.mjs";
import { diferencia, gris } from "./medidas.mjs";

// Los umbrales, medidos en los dos ejemplos aprobados (entre paréntesis, lo que dan ellos).
export const UMBRALES = {
  margen: [5, 10],        // s que se aceptan por debajo y por encima de la duración de la marca (30-60: de 25 a 70; los ejemplos, 48,3 y 49,2)
  mediana: 0.1,           // s por fotograma: la mitad tarda menos (los ejemplos, de 2 a 30 ms, según lo ocupado que esté el ordenador)
  peor: 0.5,              // s, el más lento medido dos veces (el vaso que se llena del hook de alcohol: 0,15-0,4 s según lo ocupado que esté el ordenador)
  primerSegundo: 0.1,     // lo máximo que cambia de la pantalla en una décima, en el primer segundo (1,0 y 0,72)
  arranque: 0.03,         // lo que cambia en las dos primeras décimas (0,22 y 0,49)
  gris: 18,               // color del 5 % más vivo de la imagen (0-255) durante 2 s seguidos (lo peor: 32 y 23)
  apagado: 35,            // luz del 5 % más claro durante 2 s seguidos (lo peor: 66 y 55)
  tramo: 2,               // s seguidos de gris o apagado
  deprisa: 16,            // letras por segundo de una frase (de 9,3 a 14,7; la mediana, 13 y 12,5)
  deprisaRel: 1.3,        // y tantas veces más deprisa que la mediana del vídeo (como mucho 1,18)
  instagram: 0.5,         // s seguidos de un texto en lo que tapa Instagram (sale una vez: el «REC» de alcohol)
};

// Lo que tapa Instagram en un reel: el título de arriba, el texto del post abajo y la columna de botones.
export const ZONAS = { arriba: [0, 0, 1080, 270], abajo: [0, 1440, 1080, 1920], botones: [950, 1050, 1080, 1920] };

// Lo que no puede haber en lo que dibuja: el render dibuja trozos del vídeo a la vez, en hilos distintos, y cada
// fotograma tiene que salir siempre igual.
const PROHIBIDO = [
  [/\bMath\.random\b/, "Math.random: el azar va con semilla, k.azar(semilla); si no, cada fotograma (y cada hilo del render) sale distinto"],
  [/\bnew\s+Date\b|\bDate\.now\b/, "Date: la hora cambia de un fotograma a otro; todo sale de t"],
  [/\bperformance\.\w+|\bprocess\.hrtime\b/, "performance: lo que mide el tiempo del ordenador cambia cada vez; todo sale de t"],
  [/\bset(Timeout|Interval|Immediate)\s*\(/, "setTimeout: nada espera ni se repite solo; todo sale de t"],
  [/\bfetch\s*\(/, "fetch: el vídeo no puede depender de internet; lo que haga falta, una vez y guardado en el proyecto"],
  [/\b(writeFileSync|writeFile|appendFileSync|appendFile|createWriteStream|mkdirSync|rmSync|unlinkSync|renameSync|copyFileSync)\b/, "escribe archivos: dibujar o sonar no cambia nada del disco"],
];

// Los comentarios fuera (sin mover las líneas): así «nunca Math.random» en un comentario no cuenta.
const sinComentarios = (s) => s.replace(/("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`)|\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, (m, cadena) => (cadena ? m : m.replace(/[^\n]/g, " ")));

function archivosDe(dir) {
  const out = [], mira = (d) => { if (!existsSync(d)) return; for (const f of readdirSync(d, { withFileTypes: true })) { const r = join(d, f.name); if (f.isDirectory()) mira(r); else if (/\.m?js$/.test(f.name)) out.push(r); } };
  mira(join(dir, "video"));
  if (existsSync(join(dir, "sonidos.js"))) out.push(join(dir, "sonidos.js"));
  return out.sort();
}

// Lo prohibido en video/**/*.js y sonidos.js: «archivo:línea: qué y por qué».
export function prohibido(dir) {
  const avisos = [];
  for (const f of archivosDe(dir)) {
    const lineas = sinComentarios(readFileSync(f, "utf8")).split("\n"), dicho = new Set();
    lineas.forEach((l, i) => { for (const [re, por] of PROHIBIDO) if (re.test(l) && !dicho.has(por)) { dicho.add(por); avisos.push(`${relative(dir, f).replace(/\\/g, "/")}:${i + 1}: ${por}.`); } });
  }
  return avisos;
}

// El color y la luz de un fotograma pequeño: el 5 % más vivo y el 5 % más claro (con histogramas, sin ordenar).
const W = 90, H = 160, peq = createCanvas(W, H), gp = peq.getContext("2d");
function colorYLuz(lienzo) {
  gp.drawImage(lienzo, 0, 0, W, H);
  const d = gp.getImageData(0, 0, W, H).data, hc = new Uint32Array(256), hl = new Uint32Array(256);
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    hc[Math.max(r, g, b) - Math.min(r, g, b)]++; hl[Math.min(255, Math.round(0.299 * r + 0.587 * g + 0.114 * b))]++;
  }
  const p95 = (h) => { let n = 0; const lim = 0.95 * W * H; for (let i = 0; i < 256; i++) if ((n += h[i]) >= lim) return i; return 255; };
  return { color: p95(hc), luz: p95(hl) };
}

// Apunta los textos que dibujan los planos (fillText y strokeText en el lienzo del motor) con su caja en pantalla.
function apuntarTextos(gs, lista, ahora) {
  const quitar = [];
  for (const g of gs) for (const fn of ["fillText", "strokeText"]) {
    const orig = g[fn];
    g[fn] = function (txt, x, y, ...r) {
      try {
        if (g.globalAlpha > 0.3) {
          const m = g.measureText(txt), T = g.getTransform();
          const x0 = x - m.actualBoundingBoxLeft, x1 = x + m.actualBoundingBoxRight, y0 = y - m.actualBoundingBoxAscent, y1 = y + m.actualBoundingBoxDescent;
          const ps = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([a, b]) => [T.a * a + T.c * b + T.e, T.b * a + T.d * b + T.f]);
          const xs = ps.map((p) => p[0]), ys = ps.map((p) => p[1]);
          lista.push({ t: ahora.t, texto: String(txt), caja: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] });
        }
      } catch { /* medir no puede romper el dibujo */ }
      return orig.call(g, txt, x, y, ...r);
    };
    const propia = Object.prototype.hasOwnProperty.call(g, fn);
    quitar.push(() => { if (propia) g[fn] = orig; else delete g[fn]; });
  }
  return () => quitar.forEach((q) => q());
}

// En qué zona de Instagram cae una caja (la que más tapa, si tapa al menos un cuarto de ella), o null.
export function zonaDeInstagram([x0, y0, x1, y1]) {
  const area = Math.max(1, (x1 - x0) * (y1 - y0));
  if (x1 < 0 || y1 < 0 || x0 > 1080 || y0 > 1920) return null;
  let mejor = null, max = 0.25;
  for (const [nombre, [a, b, c, d]] of Object.entries(ZONAS)) {
    const s = (Math.max(0, Math.min(x1, c) - Math.max(x0, a)) * Math.max(0, Math.min(y1, d) - Math.max(y0, b))) / area;
    if (s >= max) { max = s; mejor = nombre; }
  }
  return mejor;
}

// Tramos seguidos (de fotogramas cada `paso`) en que se cumple algo, de más de `largo` s: [[desde, hasta]].
function tramos(fs, si, paso, largo) {
  const out = [];
  let a = null;
  fs.forEach((f, i) => {
    if (si(f) && a === null) a = f.t;
    const acaba = a !== null && (!si(f) || i === fs.length - 1);
    if (acaba) { const b = si(f) ? f.t + paso : f.t; if (b - a > largo) out.push([a, b]); a = null; }
  });
  return out;
}

const seg = (t) => t.toFixed(1).replace(/\.0$/, "");
const tr = (ts) => ts.map(([a, b]) => `${seg(a)}–${seg(b)} s`).join(", ");

// Todo: { errores, avisos, datos }. errores: los fotogramas que no se pueden dibujar (el render fallaría ahí).
// opciones: { fps: 4 (el vídeo entero, para ver que se dibuja), hasta }.
export function comprobar(proy, { fps = 4, hasta = proy.duracion } = {}) {
  const U = UMBRALES, errores = [], avisos = [], datos = {}, est = preparar(proy), dur = Math.min(hasta, proy.duracion);

  // --- lo prohibido en los archivos
  avisos.push(...prohibido(proy.dir).map((a) => `Prohibido en ${a}`));

  // --- el vídeo entero, a fps: que se dibuja, lo que tarda, su color y su luz, y sus textos
  const fs = [], textos = [], ahora = { t: 0 }, fallos = new Map();
  const suelta = apuntarTextos([est.g, est.aparte.getContext("2d")], textos, ahora);
  try {
    for (let k = 0; k * (1 / fps) < dur; k++) {
      const t = k / fps;
      ahora.t = t;
      const a = performance.now();
      try { dibujar(proy, est, t, { subtitulos: false }); }
      catch (e) {
        const parte = e.parte || `plano ${proy.planos[planoEn(proy, t)].id}`, f = fallos.get(parte);
        if (f) f.n++; else fallos.set(parte, { t, n: 1, msg: String(e.message).replace(/^.*?, segundo [\d.]+: /, ""), donde: lugarDelError(e, proy.dir) });
        continue;
      }
      fs.push({ t, ms: performance.now() - a, ...colorYLuz(est.lienzo) });
    }
  } finally { suelta(); }
  for (const [parte, f] of fallos) errores.push(`${parte} falla en el segundo ${f.t.toFixed(2)}${f.n > 1 ? ` (y en otros ${f.n - 1} de los que se miraron)` : ""}: ${f.msg}${f.donde ? ` (${f.donde})` : ""}. Míralo: node motor/ver.mjs ${arg(proy.dir)} ${f.t.toFixed(2)}`);

  // --- lo que tarda cada fotograma (los más lentos, otra vez: el primero de cada cosa tarda más)
  if (fs.length) {
    const orden = [...fs].sort((a, b) => a.ms - b.ms), lentos = orden.slice(-5);
    for (const f of lentos) { const a = performance.now(); try { dibujar(proy, est, f.t, { subtitulos: false }); f.ms = Math.min(f.ms, performance.now() - a); } catch { /* ya contado */ } }
    const peor = lentos.reduce((x, y) => (y.ms > x.ms ? y : x));
    datos.mediana = orden[orden.length >> 1].ms / 1000; datos.peor = peor.ms / 1000; datos.peorEn = peor.t;
    if (datos.mediana > U.mediana) avisos.push(`Cada fotograma tarda ${(1000 * datos.mediana).toFixed(0)} ms de mediana (tiene que ser menos de ${1000 * U.mediana}): el render irá lento. Lo pesado (texturas, listas de cosas), una vez arriba del archivo.`);
    if (datos.peor > U.peor) avisos.push(`El fotograma del segundo ${peor.t.toFixed(2)} (plano ${proy.planos[planoEn(proy, peor.t)].id}) tarda ${(1000 * datos.peor).toFixed(0)} ms en este ordenador: mira qué se rehace en cada fotograma ahí.`);
  }

  // --- que salga igual dibujado dos veces, en otro orden (si no, algo guarda estado de un fotograma al siguiente)
  if (!errores.length) {
    const ts = Array.from({ length: 14 }, (_, i) => Math.round(((dur - 0.05) * i * 1000) / 13) / 1000);
    for (const p of proy.planos.slice(1)) if (p.desde < dur && ts.length < 24) ts.push(Math.round((p.desde + 0.02) * 1000) / 1000);
    ts.sort((a, b) => a - b);
    const huella = (t) => createHash("sha1").update(dibujar(proy, est, t).data()).digest("hex");
    const ida = ts.map(huella), vuelta = [...ts].reverse().map(huella).reverse();
    const distintos = ts.filter((t, i) => ida[i] !== vuelta[i]);
    if (distintos.length) avisos.push(`No sale igual dos veces: ${distintos.map((t) => `${t.toFixed(2)} s (${proy.planos[planoEn(proy, t)].id})`).slice(0, 5).join(", ")}. Algo guarda estado de un fotograma al siguiente (una variable de fuera de dibuja que cambia, un lienzo de paso sin limpiar, un azar sin semilla): en el render cada hilo lo dibujará distinto.`);
  }

  // --- el primer segundo: el hook se mueve desde el fotograma 0
  if (!fallos.size && dur > 1) {
    const ds = [];
    let antes = gris(proy, est, 0);
    for (let k = 1; k <= 10; k++) { const a = gris(proy, est, k / 10); ds.push(diferencia(antes, a).parte); antes = a; }
    datos.primerSegundo = Math.max(...ds);
    if (datos.primerSegundo < U.primerSegundo) avisos.push(`El primer segundo está casi quieto (cambia como mucho el ${(100 * datos.primerSegundo).toFixed(0)} % de la pantalla de una décima a otra): el hook tiene que moverse grande desde el fotograma 0.`);
    else if (Math.max(ds[0], ds[1]) < U.arranque) avisos.push(`El hook arranca quieto: en las dos primeras décimas casi no cambia nada. Que se mueva ya en el fotograma 0.`);
  }

  // --- gris o apagado más de 2 s (lo oscuro no cuenta como gris: ya se avisa como oscuro)
  const grises = tramos(fs, (f) => f.color < U.gris && f.luz >= U.apagado, 1 / fps, U.tramo), oscuros = tramos(fs, (f) => f.luz < U.apagado, 1 / fps, U.tramo);
  if (grises.length) avisos.push(`Casi sin color ${tr(grises)}: nada gris ni apagado; si la cosa es gris, que lo de alrededor lleve el color.`);
  if (oscuros.length) avisos.push(`Casi todo oscuro ${tr(oscuros)}: que haya luz (un brillo, la cosa iluminada).`);

  // --- un look claro con subtítulos que dejan palabras en gris: las ya dichas casi no se leen sobre su cielo o su papel
  const sub = proy.estilo.subtitulos;
  if (look(proy.estilo.look).claro && sub.posicion !== "no" && ["caja", "minimal"].includes(sub.estilo))
    avisos.push(`El look «${proy.estilo.look}» es claro y los subtítulos «${sub.estilo}» dejan las palabras ya dichas en gris: sobre sus fondos casi no se leen. Mejor «karaoke», «contorno» o «fondo» ("subtitulos": { "estilo": "contorno" } en guion.json).`);

  // --- la duración y las frases atropelladas
  datos.duracion = proy.duracion;
  const [dmin, dmax] = proy.marca?.duracion || [30, 60], lim = [Math.max(1, dmin - U.margen[0]), dmax + U.margen[1]];
  if (proy.duracion < lim[0] || proy.duracion > lim[1]) avisos.push(`El vídeo dura ${proy.duracion.toFixed(1)} s y los de la marca duran de ${dmin} a ${dmax} (fuera de ${lim[0]}–${lim[1]} s se pierde gente o no da tiempo a contarlo; si ahora los quiere de otra duración: node motor/marca.mjs poner duracion 20-40).`);
  const vel = proy.v.frases.map((f) => {
    const letras = f.palabras.map((w) => w.texto.replace(/[^\p{L}\p{N}]/gu, "")).join("").length;
    return { n: f.n, palabras: f.palabras.length, lps: letras / Math.max(0.2, f.fin - f.inicio) };
  });
  const med = [...vel].sort((a, b) => a.lps - b.lps)[vel.length >> 1]?.lps || 0;
  for (const f of vel) if (f.palabras >= 4 && f.lps > U.deprisa && f.lps > U.deprisaRel * med)
    avisos.push(`La frase ${f.n} se dice deprisa (${f.lps.toFixed(1)} letras por segundo; el resto, ${med.toFixed(1)}): suena atropellada y no da tiempo a enseñarla. Cámbiala (más corta, otra puntuación) y rehaz la voz.`);

  // --- texto en lo que tapa Instagram (solo el que dibujan los planos con fillText: el de los subtítulos va en su sitio)
  const porTexto = new Map(), DONDE = { arriba: "arriba, en su título", abajo: "abajo, en el texto del post", botones: "a la derecha, bajo los botones" };
  for (const x of textos) {
    const z = zonaDeInstagram(x.caja);
    if (!z) continue;
    if (!porTexto.has(x.texto)) porTexto.set(x.texto, { ts: new Set(), zonas: new Set(), x: x.caja[0], y: x.caja[1] });
    porTexto.get(x.texto).ts.add(x.t); porTexto.get(x.texto).zonas.add(z);
  }
  // los tramos de cada texto; los que van juntos (a la vez y en la misma zona: las cifras de un número, su unidad) se
  // dicen en un solo aviso, en el orden en que se leen
  const enZona = [];
  for (const [texto, { ts: vistos, zonas, x, y }] of porTexto) {
    const ts = [...vistos].sort((a, b) => a - b), largos = [];
    let a = ts[0];
    ts.forEach((t, i) => {
      if (i < ts.length - 1 && ts[i + 1] - t < 1.5 / fps) return; // sigue ahí en el siguiente que se mira
      if (t + 1 / fps - a >= U.instagram) largos.push([a, t + 1 / fps]);
      a = ts[i + 1];
    });
    if (largos.length) enZona.push({ texto, largos, zonas: [...zonas].sort().join(","), x, y });
  }
  const juntos = [];
  for (const q of enZona) {
    const j = juntos.find((o) => o.zonas === q.zonas && o.largos.some(([a, b]) => q.largos.some(([c, d]) => c < b && a < d)));
    if (j) { j.textos.push(q); j.largos = [...j.largos, ...q.largos].sort((m, n) => m[0] - n[0]).reduce((r, w) => { const u = r[r.length - 1]; if (u && w[0] <= u[1]) u[1] = Math.max(u[1], w[1]); else r.push([...w]); return r; }, []); }
    else juntos.push({ zonas: q.zonas, largos: q.largos.map((w) => [...w]), textos: [q] });
  }
  for (const j of juntos) {
    const leido = j.textos.sort((m, n) => (Math.abs(m.y - n.y) > 40 ? m.y - n.y : m.x - n.x)).map((q) => q.texto).join(j.textos.every((q) => q.texto.length === 1) ? "" : " ");
    avisos.push(`El texto «${leido.slice(0, 40)}» cae donde lo tapa Instagram (${j.zonas.split(",").map((z) => DONDE[z]).join("; ")}) en ${tr(j.largos)}: lo importante, entre y 270 y 1440, y a la izquierda de x 950 desde y 1050.`);
  }
  return { errores, avisos, datos };
}

// Unos fotogramas de en medio del vídeo, dibujados aquí (donde ya se ha dibujado todo) y en un hilo nuevo (como empieza
// cada trozo del render). Devuelve los segundos que no salen igual: algo se guarda la primera vez que se dibuja, con
// el t de ese momento, y en el render cada hilo lo guardaría distinto (un salto en cada cambio de trozo).
// opciones: lo mismo con que se abrió el vídeo ({ apertura, estilo }) y hasta dónde se mira.
export async function enHiloNuevo(proy, { apertura = null, estilo = null, hasta = proy.duracion } = {}) {
  const dur = Math.min(hasta, proy.duracion), est = preparar(proy);
  const ts = [0.37, 0.61, 0.83].map((u) => Math.round(dur * u * 1000) / 1000);
  const aqui = ts.map((t) => createHash("sha1").update(dibujar(proy, est, t).data()).digest("hex"));
  const w = new Worker(new URL("./huellas.mjs", import.meta.url), { workerData: { dir: proy.dir, ts, apertura, estilo } });
  const alli = await new Promise((ok, mal) => { w.once("message", ok); w.once("error", mal); w.once("exit", (c) => c && mal(new Error(`el hilo de prueba acabó con ${c}`))); });
  await w.terminate();
  return ts.filter((t, i) => aqui[i] !== alli[i]);
}

// El aviso, si hace falta.
export function avisoHiloNuevo(proy, ts) {
  if (!ts.length) return null;
  return `No sale igual en un hilo nuevo del render: ${ts.map((t) => `${t.toFixed(2)} s (${proy.planos[planoEn(proy, t)].id})`).join(", ")}. Algo se guarda la primera vez que se dibuja, con el t de ese momento (una caché que se llena dentro de dibuja): cada trozo del render la llenaría distinto y se vería un salto. Lo que se prepara una vez va arriba del archivo y no depende de t.`;
}
