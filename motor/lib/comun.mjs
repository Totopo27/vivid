// Lo que comparten las herramientas: la carpeta, los argumentos, los errores, ffmpeg, las claves y abrir lo que sale.
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { basename, delimiter, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const ANCHO = 1080, ALTO = 1920;

// Dos rutas que llevan al mismo sitio: en Mac y Windows «Ejemplo» y «ejemplo» son la misma carpeta.
const comoRuta = process.platform === "linux" ? (s) => s : (s) => s.toLowerCase();

// Dónde dejan sus hojas y borradores las herramientas: <proyecto>/revisar/, salvo en los ejemplos, que no se tocan
// (están en git tal y como se aprobaron): los suyos van a la carpeta temporal del sistema.
export function carpetaRevisar(dir) {
  const ej = join(RAIZ, "ejemplo") + sep, d = resolve(dir) + sep;
  return comoRuta(d).startsWith(comoRuta(ej)) ? join(tmpdir(), "videos-virales-3d", basename(resolve(dir)), "revisar") : join(dir, "revisar");
}

export function fallo(msg) {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

// Las opciones que nunca llevan valor: así «--borrador proyectos/x» no se come el proyecto.
const BANDERAS = new Set(["borrador", "rehacer", "guardar", "sin-subtitulos", "sin-abrir", "red", "ayuda", "help", "hijo"]);

// node motor/x.mjs <proyecto> [resto] [--clave valor] [--clave=valor] [--bandera]
export function argumentos(a = process.argv.slice(2)) {
  const sueltos = [], op = {};
  for (let i = 0; i < a.length; i++) {
    if (!a[i].startsWith("--")) { sueltos.push(a[i]); continue; }
    const igual = a[i].indexOf("=");
    if (igual > 2) { op[a[i].slice(2, igual)] = a[i].slice(igual + 1); continue; }
    const k = a[i].slice(2);
    if (!BANDERAS.has(k) && i + 1 < a.length && !a[i + 1].startsWith("--")) op[k] = a[++i];
    else op[k] = true;
  }
  return { sueltos, op };
}

// Una opción con número (acepta la coma: «--desde 12,5»).
export function numero(op, k, def) {
  if (op[k] === undefined) return def;
  const n = Number(String(op[k]).replace(",", "."));
  if (op[k] === true || String(op[k]).trim() === "" || !Number.isFinite(n)) fallo(`--${k} necesita un número (por ejemplo --${k} 10).`);
  return n;
}

export function ayuda(texto) {
  if (process.argv.includes("--ayuda") || process.argv.includes("--help")) { console.log(texto.trim()); process.exit(0); }
}

// El proyecto: una ruta, o el nombre de una carpeta de proyectos/ (o el principio de su nombre, con o sin la fecha).
export function carpetaProyecto(nombre) {
  if (!nombre) fallo("Falta el proyecto: la carpeta del vídeo, por ejemplo proyectos/2026-10-20-cielo-azul");
  if (basename(nombre) === "guion.json") nombre = dirname(nombre);
  for (const c of [resolve(nombre), join(RAIZ, "proyectos", nombre), join(RAIZ, nombre)]) if (existsSync(join(c, "guion.json"))) return c;
  const pr = join(RAIZ, "proyectos"), n = basename(nombre);
  const hay = existsSync(pr) ? readdirSync(pr).filter((d) => existsSync(join(pr, d, "guion.json"))).sort() : [];
  const pistas = hay.filter((d) => d.startsWith(n) || d.replace(/^\d{4}-\d{2}-\d{2}-/, "").startsWith(n));
  if (n && pistas.length === 1) return join(pr, pistas[0]);
  if (n && pistas.length > 1) fallo(`«${nombre}» puede ser ${pistas.join(", ")}: di cuál.`);
  fallo(`No encuentro el proyecto «${nombre}» (una carpeta con guion.json).` + (hay.length ? ` En proyectos/ hay: ${hay.slice(-8).join(", ")}.` : ""));
}

// Una ruta, como se le dice a alguien (desde la carpeta, si está dentro).
export const corta = (ruta) => { const r = relative(RAIZ, ruta); return r && !r.startsWith("..") ? r : ruta; };
// Una ruta para ponerla en una orden que se puede copiar (entre comillas si lleva espacios).
export const arg = (ruta) => { const r = corta(ruta); return /[\s"'&()]/.test(r) ? `"${r}"` : r; };

// Dónde del proyecto saltó un error: «video/planos/03-cocina.js:45» (la primera línea suya en la pila), o null.
export function lugarDelError(e, dir) {
  const base = pathToFileURL(dir).href + "/";
  for (const l of String(e?.stack || "").split("\n")) {
    const m = l.match(/(file:\/\/\S+?):(\d+):\d+\)?$/); // la ruta puede llevar paréntesis: «Videos-virales-3d (1)»
    if (m && m[1].startsWith(base)) return `${relative(dir, fileURLToPath(m[1])).replace(/\\/g, "/")}:${m[2]}`;
  }
  return null;
}

export const leerJson = (f) => JSON.parse(readFileSync(f, "utf8").replace(/^﻿/, ""));
export const escribirJson = (f, d) => { mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, JSON.stringify(d, null, 2) + "\n"); };
export const r3 = (x) => Math.round(x * 1000) / 1000;

// Un json del proyecto, con un error que dice dónde está la falta.
export function leerJsonDe(f, queEs = "") {
  if (!existsSync(f)) fallo(`Falta ${corta(f)}.`);
  try { return leerJson(f); }
  catch (e) {
    const pos = Number(String(e.message).match(/position (\d+)/)?.[1]), linea = Number.isFinite(pos) ? readFileSync(f, "utf8").slice(0, pos).split("\n").length : null;
    fallo(`${corta(f)}${queEs ? ` (${queEs})` : ""} no se puede leer${linea ? `, en la línea ${linea}` : ""}: ${e.message}. Suele ser una coma de más o de menos, o unas comillas sin cerrar.`);
  }
}

export const SIN_FFMPEG = "No encuentro ffmpeg (o ffprobe) en este ordenador. node motor/doctor.mjs dice cómo instalarlo.";

// ffmpeg y ffprobe: los del PATH o, si no están en él, donde los deja el instalador de cada sistema (lo recién
// instalado con winget o brew no está en el PATH de una terminal que ya estaba abierta). FFMPEG=<ruta> o
// FFPROBE=<ruta> mandan sobre todo. Si no está en ningún sitio, el nombre tal cual: quien lo use dirá cómo instalarlo.
const programas = {};
export function programa(nombre) {
  return (programas[nombre] ??= buscarPrograma(nombre));
}
function buscarPrograma(nombre) {
  const suyo = process.env[nombre.toUpperCase()];
  if (suyo && existsSync(suyo)) return suyo;
  const exe = process.platform === "win32" ? `${nombre}.exe` : nombre;
  if ((process.env.PATH || "").split(delimiter).some((d) => d && existsSync(join(d.replace(/^"(.*)"$/, "$1"), exe)))) return nombre;
  for (const d of sitiosDeProgramas()) if (existsSync(join(d, exe))) return join(d, exe);
  return nombre;
}
function sitiosDeProgramas() {
  if (process.platform === "darwin") return ["/opt/homebrew/bin", "/usr/local/bin", "/opt/local/bin"];
  if (process.platform !== "win32") return ["/usr/bin", "/usr/local/bin", "/snap/bin", "/home/linuxbrew/.linuxbrew/bin", join(homedir(), ".local", "bin")];
  const local = process.env.LOCALAPPDATA || join(homedir(), "AppData", "Local"), paquetes = join(local, "Microsoft", "WinGet", "Packages");
  const sitios = [join(local, "Microsoft", "WinGet", "Links")];
  // winget deja ffmpeg en Packages\Gyan.FFmpeg_...\ffmpeg-<versión>-full_build\bin
  try { for (const p of readdirSync(paquetes).filter((x) => /ffmpeg/i.test(x))) for (const v of readdirSync(join(paquetes, p))) sitios.push(join(paquetes, p, v, "bin")); } catch { /* sin winget */ }
  return [...sitios, join(process.env.ProgramData || "C:\\ProgramData", "chocolatey", "bin"), join(homedir(), "scoop", "shims"),
    join(process.env.ProgramFiles || "C:\\Program Files", "ffmpeg", "bin"), "C:\\ffmpeg\\bin"];
}

export function ffmpeg(args, opciones = {}) {
  try {
    return execFileSync(programa("ffmpeg"), ["-hide_banner", "-loglevel", "error", "-y", ...args], { maxBuffer: 1 << 30, ...opciones });
  } catch (e) {
    if (e.code === "ENOENT") fallo(SIN_FFMPEG);
    fallo(`ffmpeg falló: ${String(e.stderr || e.message).slice(-600)}`);
  }
}

export function duracion(archivo) {
  try {
    return Number(execFileSync(programa("ffprobe"), ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", archivo]).toString().trim());
  } catch (e) { fallo(e.code === "ENOENT" ? SIN_FFMPEG : `ffprobe no puede leer ${corta(archivo)}: ${String(e.stderr || e.message).slice(-300)}`); }
}

// Audio a muestras: mono, float, a la frecuencia pedida.
export function leerAudio(archivo, sr = 48000) {
  if (!existsSync(archivo)) fallo(`Falta ${corta(archivo)}.`);
  let b;
  try { b = execFileSync(programa("ffmpeg"), ["-v", "error", "-i", archivo, "-f", "f32le", "-ac", "1", "-ar", String(sr), "-"], { maxBuffer: 1 << 30 }); }
  catch (e) { fallo(e.code === "ENOENT" ? SIN_FFMPEG : `No puedo leer el audio ${corta(archivo)}: ${String(e.stderr || e.message).slice(-300)}`); }
  const ab = new ArrayBuffer(b.length);
  new Uint8Array(ab).set(b);
  return new Float32Array(ab);
}

// La voz del proyecto (voz/voz.wav), o qué hacer si no está.
export function leerVoz(dir, sr = 48000) {
  const f = join(dir, "voz", "voz.wav");
  if (!existsSync(f)) fallo(`Este proyecto aún no tiene voz/voz.wav: node motor/voz.mjs ${arg(dir)}`);
  return leerAudio(f, sr);
}

// Un wav mono de 16 bits. (Mono a propósito: al leer un estéreo con L = R como mono, ffmpeg le suma 3 dB.)
export function escribirWav(ruta, mono, sr = 48000) {
  const n = mono.length, buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write("WAVE", 8); buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(sr, 24);
  buf.writeUInt32LE(sr * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, mono[i] || 0)) * 32767), 44 + i * 2);
  mkdirSync(dirname(ruta), { recursive: true });
  writeFileSync(ruta, buf);
}

// Las claves viven en .env.local (las escribe motor/clave.mjs). Nunca se enseñan ni se copian a ningún sitio.
export function cargarClaves() {
  const f = join(RAIZ, ".env.local");
  if (!existsSync(f)) return;
  for (const l of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = l.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
}

// Un proceso de ffmpeg al que se le van pasando fotogramas (RGBA, 1080 × 1920) y que escribe un mp4. Si ffmpeg se
// para a medias (no está, se llenó el disco), escribe() y cierra() fallan con lo que dijo, en vez de quedarse esperando.
export function codificador(salida, fps, calidad = "final") {
  const crf = calidad === "final" ? "16" : "23", preset = calidad === "final" ? "medium" : "veryfast";
  const p = spawn(programa("ffmpeg"), ["-hide_banner", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${ANCHO}x${ALTO}`, "-r", String(fps), "-i", "-",
    "-c:v", "libx264", "-preset", preset, "-crf", crf, "-pix_fmt", "yuv420p", "-g", String(fps * 2), "-movflags", "+faststart", salida], { stdio: ["pipe", "ignore", "pipe"] });
  let err = "", roto = null;
  p.stderr.on("data", (d) => (err += d));
  p.stdin.on("error", () => {}); // si ffmpeg se para, lo que pasó sale por «fin»
  const fin = new Promise((ok, mal) => {
    p.on("error", (e) => mal(e.code === "ENOENT" ? new Error(SIN_FFMPEG) : e));
    p.on("close", (c, s) => (c === 0 ? ok() : mal(new Error(`ffmpeg se paró (${c ?? s}): ${err.slice(-500).trim() || "sin decir por qué"}`))));
  });
  fin.catch((e) => (roto = e));
  return {
    pid: p.pid,
    async escribe(buf) {
      if (roto) throw roto;
      if (!p.stdin.write(buf)) await Promise.race([new Promise((r) => p.stdin.once("drain", r)), fin]);
      if (roto) throw roto;
    },
    async cierra() { p.stdin.end(); await fin; },
    mata() { try { p.kill("SIGKILL"); } catch { /* ya no estaba */ } },
  };
}

// Abre un archivo o una dirección con lo que use este sistema (el navegador, el visor de imágenes, el reproductor). Da
// una promesa: false si no se pudo (un Linux sin escritorio), y entonces hay que decir dónde está para abrirlo a mano.
export function abrirEnSistema(destino) {
  const so = process.platform, wsl = so === "linux" && /microsoft/i.test(leerSiHay("/proc/version"));
  // en Windows, entre comillas siempre (como hace Node con shell: true): un «&» en la ruta no parte la orden
  const orden = so === "win32" ? ["cmd", ["/d", "/s", "/c", `"start "" "${destino}""`], { windowsVerbatimArguments: true }]
    : so === "darwin" ? ["open", [destino]]
    : wsl ? ["cmd.exe", ["/c", "start", "", /^https?:/.test(destino) ? destino : rutaDeWindows(destino)]] // el Windows de fuera de WSL
    : ["xdg-open", [destino]];
  return new Promise((ok) => {
    let p, reloj;
    const fin = (x) => { clearTimeout(reloj); ok(x); };
    try { p = spawn(orden[0], orden[1], { detached: true, stdio: "ignore", windowsHide: true, ...orden[2] }); } catch { return ok(false); }
    reloj = setTimeout(() => fin(true), 4000); // xdg-open a veces espera a que se cierre el navegador: si no falló, se abrió
    p.on("error", () => fin(false));
    p.on("exit", (c) => fin(c === 0));
    p.unref();
  });
}
const leerSiHay = (f) => { try { return readFileSync(f, "utf8"); } catch { return ""; } };
const rutaDeWindows = (r) => { try { return execFileSync("wslpath", ["-w", resolve(r)], { encoding: "utf8" }).trim(); } catch { return r; } };
