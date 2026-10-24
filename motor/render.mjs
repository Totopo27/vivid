#!/usr/bin/env node
// render.mjs: el vídeo de verdad, con su voz y sus efectos.
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, rmSync, rmdirSync, writeFileSync } from "node:fs";
import { availableParallelism } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { Worker } from "node:worker_threads";
import { RAIZ, arg, argumentos, ayuda, carpetaProyecto, carpetaRevisar, corta, escribirWav, fallo, ffmpeg, leerVoz, numero, programa } from "./lib/comun.mjs";
import { estiloPedido, nombreDe } from "./lib/marca.mjs";
import { SR, efectosAlDia } from "./lib/mezcla.mjs";
import { abrir } from "./lib/proyecto.mjs";
import { saltos } from "./lib/saltos.mjs";
import { zonaSubtitulos } from "./lib/subtitulos.mjs";

ayuda(`
node motor/render.mjs <proyecto> [--borrador] [--desde s] [--hasta s] [--fps N] [--apertura nombre]
                                 [--look nombre] [--subtitulos estilo] [--salida archivo.mp4] [--hilos N]

Sin nada: el vídeo final, a 60 fps, en salida/<proyecto>/, con su portada (portada.jpg) y el texto del post
(caption.txt, de pie.txt). Al acabar dice los saltos sueltos que encuentre: míralos con ver.mjs.
--borrador: a 30 fps y más rápido, en <proyecto>/revisar/borrador.mp4, para verlo en movimiento.
--desde y --hasta: solo ese tramo (con --borrador, para enseñar el hook: --hasta 10). Sin --borrador va a
  <proyecto>/revisar/tramo-<desde>-<hasta>.mp4: el vídeo final no se toca.
--fps: otros fotogramas por segundo (el final va a 60 y el borrador a 30).
--apertura 01-tunel: con --borrador, el hook con la otra apertura (video/aperturas/01-tunel.js en lugar del plano 01),
  en <proyecto>/revisar/borrador-01-tunel.mp4. Solo con la voz: los efectos que haya son los de la otra apertura.
--look neon, --subtitulos karaoke: otro look u otros subtítulos, para probarlos sin tocar el guion; el archivo lleva
  su nombre (borrador-neon.mp4). Los que hay: node motor/marca.mjs.
--hilos N: cuántos trozos se dibujan a la vez (por defecto, los núcleos del ordenador menos uno, hasta 8).
Si sonidos.js, los planos o la voz cambiaron desde la última pista de efectos, la rehace antes de mezclar.
Si se para (un error o Ctrl+C), no deja nada a medias y dice en qué plano y en qué segundo falló.
La voz y los efectos se mezclan como en los vídeos que funcionaron (los efectos, por debajo de la voz) y a su volumen.
`);

const VOLUMEN = -21;      // LUFS del vídeo (en estéreo), el de los vídeos aprobados; la voz y los efectos, 1 a 1
const { sueltos, op } = argumentos();
const dir = carpetaProyecto(sueltos[0]);
if (op.apertura === true) fallo("--apertura necesita el nombre de la apertura, por ejemplo --apertura 01-tunel.");
const apertura = op.apertura ? String(op.apertura) : null;
if (apertura && !op.borrador) fallo("--apertura es para enseñar el hook: úsalo con --borrador.");
const sobre = estiloPedido(op);
const proy = await abrir(dir, { apertura, estilo: sobre });
const borrador = !!op.borrador, fps = numero(op, "fps", borrador ? 30 : 60);
if (!Number.isInteger(fps) || fps < 1 || fps > 120) fallo("--fps es un número entero de 1 a 120 (el final va a 60; el borrador, a 30).");
const parcial = op.desde !== undefined || op.hasta !== undefined;
const desde = Math.max(0, numero(op, "desde", 0)), hasta = Math.min(proy.duracion, numero(op, "hasta", proy.duracion));
if (hasta - desde < 1 / fps) fallo(`No hay nada que renderizar de ${desde} a ${hasta} s: --hasta tiene que ser mayor que --desde (el vídeo dura ${proy.duracion.toFixed(2)} s).`);
for (const a of proy.avisos) console.log(`  aviso: ${a}`);
if (proy.vozVieja && !borrador && !parcial) fallo("La voz es de un guion de antes (mira el aviso de arriba): rehaz la voz antes del vídeo final.");
const primero = Math.round(desde * fps), ultimo = Math.round(hasta * fps);
const nombre = basename(dir), extra = [apertura, nombreDe(sobre)].filter(Boolean).join("-"), con = (s) => (extra ? `${s}-${extra}` : s);
const salida = op.salida && op.salida !== true ? resolve(String(op.salida))
  : borrador ? join(carpetaRevisar(dir), `${con("borrador")}.mp4`)
  : parcial ? join(carpetaRevisar(dir), `${con(`tramo-${+desde.toFixed(2)}-${+hasta.toFixed(2)}`)}.mp4`)
  : join(RAIZ, "salida", nombre, `${con(nombre)}.mp4`);
const final = !borrador && !parcial;

// Lo de paso, en su carpeta (una por cada vídeo que sale, por si se hacen dos a la vez). Pase lo que pase (acaba, falla,
// Ctrl+C), al salir no queda nada: ni la carpeta, ni hilos, ni ningún ffmpeg dibujando.
const tmp = join(carpetaRevisar(dir), ".render", basename(salida).replace(/\.\w+$/, ""));
const hilos = [], pids = new Set();
function recoger() {
  for (const w of hilos) w.terminate();
  for (const pid of pids) { try { process.kill(pid, "SIGKILL"); } catch { /* ya no estaba */ } }
  pids.clear();
  try { rmSync(tmp, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }); } catch { /* lo intenta la próxima vez */ }
  try { rmdirSync(dirname(tmp)); } catch { /* hay otro render, o no estaba */ }
}
process.on("exit", recoger);
for (const s of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(s, () => {
  console.error(`\n✗ Render parado${s === "SIGINT" ? " (Ctrl+C)" : ""}: no queda nada a medias. Vuelve a lanzarlo cuando quieras.\n`);
  process.exit(130);
});
rmSync(tmp, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
mkdirSync(tmp, { recursive: true });
mkdirSync(dirname(salida), { recursive: true });

// --- el sonido primero (si sonidos.js tiene algo mal, se sabe antes de dibujar): la voz y los efectos
const voz = leerVoz(dir, SR), fx = apertura ? { pista: null } : await efectosAlDia(dir, proy.v, proy.duracion, voz);
if (fx.rehecha) console.log("  pista de efectos rehecha: sonidos.js, los planos o la voz habían cambiado");
const efectos = fx.pista;

// --- la imagen, en trozos, cada uno en un hilo
const nh = Math.max(1, Math.min(Math.floor(numero(op, "hilos", Math.min(8, availableParallelism() - 1))) || 1, Math.ceil((ultimo - primero) / 60)));
const t0 = Date.now(), total = ultimo - primero, hechos = new Array(nh).fill(0);
let avisado = 0;
const trozos = [];
for (let i = 0; i < nh; i++) {
  const a = primero + Math.floor((total * i) / nh), b = primero + Math.floor((total * (i + 1)) / nh), seg = join(tmp, `trozo-${String(i).padStart(2, "0")}.mp4`);
  const w = new Worker(new URL("./lib/hilo.mjs", import.meta.url), { workerData: { dir, primero: a, ultimo: b, fps, salida: seg, calidad: borrador ? "borrador" : "final", apertura, estilo: sobre } });
  hilos.push(w);
  let acabado = false;
  trozos.push({ seg, fin: new Promise((ok, mal) => {
    w.on("message", (m) => {
      if (m.error) return mal(new Error(explicar(m.error)));
      if (m.pid && !m.fin) return pids.add(m.pid);
      hechos[i] = m.hechos;
      const pct = Math.floor((100 * hechos.reduce((x, y) => x + y, 0)) / total);
      if (pct >= avisado + 20) { avisado = pct - (pct % 20); console.log(`  ${avisado} %`); }
      if (m.fin) { acabado = true; pids.delete(m.pid); ok(); }
    });
    w.on("error", (e) => mal(new Error(`El render se paró: ${e.message}`)));
    w.on("exit", (c) => setTimeout(() => (acabado ? ok() : mal(new Error(`El render se paró: un hilo acabó sin terminar su trozo (${c}). Lo que dijo está encima.`))), 50));
  }) });
}
try { await Promise.all(trozos.map((x) => x.fin)); } catch (e) { fallo(e.message); }
const lista = join(tmp, "lista.txt");
writeFileSync(lista, trozos.map((x) => `file '${basename(x.seg)}'`).join("\n") + "\n"); // al lado de la lista: sin rutas raras
const imagen = join(tmp, "imagen.mp4");
ffmpeg(["-f", "concat", "-safe", "0", "-i", lista, "-c", "copy", imagen]);

// --- el sonido: la voz y los efectos, a su volumen
const a0 = Math.round(desde * SR), a1 = Math.min(voz.length, Math.round(hasta * SR)), mezcla = new Float32Array(Math.max(0, a1 - a0));
for (let i = 0; i < mezcla.length; i++) mezcla[i] = voz[a0 + i] + (efectos ? efectos[a0 + i] || 0 : 0);
const crudo = join(tmp, "sonido.wav");
escribirWav(crudo, mezcla, SR);
// lo fuerte que suena en estéreo (el mismo sonido a los dos lados, sin bajarlo), en LUFS integrados; ffmpeg lo escribe
// al final de su salida de errores
const ESTEREO = "pan=stereo|c0=c0|c1=c0";
let lufs = VOLUMEN;
const medida = spawnSync(programa("ffmpeg"), ["-hide_banner", "-nostats", "-i", crudo, "-af", `${ESTEREO},ebur128`, "-f", "null", "-"], { encoding: "utf8" });
const I = [...String(medida.stderr).matchAll(/I:\s+(-?\d+(\.\d+)?) LUFS/g)].pop();
if (I) lufs = Number(I[1]);
const ganancia = Math.max(-12, Math.min(18, VOLUMEN - lufs));
ffmpeg(["-i", imagen, "-i", crudo, "-filter_complex", `[1:a]${ESTEREO},volume=${ganancia.toFixed(2)}dB,alimiter=limit=0.89:level=false[a]`, "-map", "0:v", "-map", "[a]",
  "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", salida]);
recoger();
const seg = ((Date.now() - t0) / 1000).toFixed(0);
console.log(`${salida} (${(hasta - desde).toFixed(2)} s, ${fps} fps, ${total} fotogramas, ${nh} hilos, ${seg} s)`);

if (final) {
  const portada = join(dirname(salida), `${con("portada")}.jpg`);
  ffmpeg(["-ss", String(Math.min(1, proy.duracion / 2)), "-i", salida, "-frames:v", "1", "-q:v", "2", portada]);
  console.log(portada);
  const pie = join(dir, "pie.txt"), caption = join(dirname(salida), "caption.txt");
  try { copyFileSync(pie, caption); console.log(caption); } catch { console.log(`  aviso: no hay pie.txt (el texto del post, dos líneas): escríbelo en ${corta(pie)} y vuelve a renderizar, o cópialo tú a ${corta(caption)}.`); }
}
// --- los saltos: dónde mirar (los segundos del tramo, que empieza en «desde», se pasan a los del vídeo)
if (!borrador) {
  const cortes = proy.planos.slice(1).map((p) => p.desde - desde);
  // sin la franja de los subtítulos (con un margen para sus sombras y rebotes): un bloque nuevo no es un salto
  const z = zonaSubtitulos(proy.estilo.subtitulos), tapa = z && { x: z.x - 60, y: z.y - 60, w: z.w + 120, h: z.h + 120 };
  const s = saltos(salida, fps, cortes, tapa);
  const raros = s.sueltos.filter((x) => !x.enCorte);
  if (raros.length) console.log(`Saltos sueltos fuera de los cortes (míralos con ver.mjs; si no son un fogonazo o un choque buscado, arréglalos): ${raros.map((x) => (desde + x.t).toFixed(2)).join(", ")} s`);
  if (s.repetidos.length) console.log(`Fotogramas repetidos en pleno movimiento (un tirón): ${s.repetidos.map((t) => (desde + t).toFixed(2)).join(", ")} s`);
}

// Lo que dice un hilo que falló, para quien lo tiene que arreglar.
function explicar({ mensaje, parte, segundo, donde }) {
  const s = segundo.toFixed(2);
  if (!parte) return `El render se paró en el segundo ${s}: ${mensaje}`;
  return `El render se paró en el segundo ${s}, en ${parte}: ${mensaje.replace(/^.*?, segundo [\d.]+: /, "")}` + (donde ? `\n  (${donde})` : "") +
    `\nMíralo sin renderizar: node motor/ver.mjs ${arg(dir)} ${s}`;
}
