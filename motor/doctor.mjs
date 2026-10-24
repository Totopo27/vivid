#!/usr/bin/env node
// doctor.mjs: mira la máquina y dice una línea por cosa: ok, o qué falta y cómo se arregla en este sistema (Mac,
// Windows o Linux). Lo que falta lo instala la IA; lo único del creador es pegar su clave en la página de la clave.
import { spawnSync } from "node:child_process";
import * as fs from "node:fs"; // entero: en un Node viejo falta statfsSync, y doctor tiene que poder decirlo
const { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } = fs;
import { join } from "node:path";
import { RAIZ, argumentos, ayuda, cargarClaves, corta, programa } from "./lib/comun.mjs";

ayuda(`
node motor/doctor.mjs [--red]

Una línea por cosa: «ok», «aviso» o «falta» (con lo que hay que hacer en este sistema). Si falta algo, sale con error.
Mira Node, ffmpeg (con lo que usa el render), lo de dibujar, las letras, la clave de la voz, el disco, que la carpeta
se puede escribir, marca.json (que se lee y que lo que dice existe) y las preferencias.
--red: además pregunta a ElevenLabs si la clave vale, cuántos caracteres quedan y si la voz existe (no gasta nada).

Cómo se instala lo que falte:
  Mac       brew install node ffmpeg              (sin brew: https://brew.sh)
  Windows   winget install OpenJS.NodeJS.LTS  y  winget install Gyan.FFmpeg   (luego, una terminal nueva)
  Linux     sudo apt-get install -y ffmpeg  (o dnf / pacman); Node 20 o más, de https://nodejs.org o con nvm
  Y en esta carpeta: npm install
`);

const { op } = argumentos();
const lineas = [];
const ok = (q, t) => lineas.push(`ok    ${q.padEnd(13)} ${t}`);
const mal = (q, t) => lineas.push(`falta ${q.padEnd(13)} ${t}`);
const aviso = (q, t) => lineas.push(`aviso ${q.padEnd(13)} ${t}`);
const so = process.platform, win = so === "win32", mac = so === "darwin";
const hay = (cmd, args = ["--version"]) => { try { return spawnSync(cmd, args, { stdio: "ignore" }).status === 0; } catch { return false; } };

// Cómo se instala algo en este sistema.
function instala({ brew, winget, apt, dnf = apt, pacman = apt, nombre }) {
  if (mac) return hay("brew") || existsSync("/opt/homebrew/bin/brew") || existsSync("/usr/local/bin/brew") ? `brew install ${brew}` : `instala Homebrew (https://brew.sh) y luego brew install ${brew}`;
  if (win) return `winget install ${winget} (y abre una terminal nueva)`;
  const g = [["apt-get", `sudo apt-get install -y ${apt}`], ["dnf", `sudo dnf install -y ${dnf}`], ["pacman", `sudo pacman -S --noconfirm ${pacman}`], ["zypper", `sudo zypper install -y ${apt}`]].find(([c]) => hay(c));
  return g ? g[1] : `instala ${nombre} con el gestor de paquetes de tu sistema`;
}

// --- Node
const node = Number(process.versions.node.split(".")[0]);
const nodeLinux = "Node 20 o más de https://nodejs.org (o con nvm: nvm install 20); el de apt suele ser más viejo";
node >= 20 ? ok("node", process.versions.node) : mal("node", `hace falta Node 20 o más (hay ${process.versions.node}): ${mac || win ? instala({ brew: "node", winget: "OpenJS.NodeJS.LTS" }) : nodeLinux}`);

// --- ffmpeg y ffprobe, con lo que usa el render (h264, aac, la medida del volumen y el limitador). Los mismos que usará
// el motor: los del PATH o, recién instalados, donde los deja el instalador (motor/lib/comun.mjs, programa)
const FF = programa("ffmpeg"), FP = programa("ffprobe");
const ff = spawnSync(FF, ["-hide_banner", "-version"], { encoding: "utf8" }), fp = spawnSync(FP, ["-version"], { encoding: "utf8" });
const instalaFfmpeg = instala({ brew: "ffmpeg", winget: "Gyan.FFmpeg", apt: "ffmpeg", nombre: "ffmpeg" });
if (ff.status !== 0 || fp.status !== 0) mal("ffmpeg", `${ff.status === 0 ? "falta ffprobe (va con ffmpeg)" : "no está"}: ${instalaFfmpeg}`);
else {
  const enc = spawnSync(FF, ["-hide_banner", "-encoders"], { encoding: "utf8" }).stdout || "", fil = spawnSync(FF, ["-hide_banner", "-filters"], { encoding: "utf8" }).stdout || "";
  const faltan = [["libx264", enc], ["aac", enc], ["ebur128", fil], ["alimiter", fil]].filter(([n, s]) => !new RegExp(`\\s${n}\\s`).test(s)).map(([n]) => n);
  const version = (ff.stdout.split("\n")[0] || "").replace(/^ffmpeg version /, "").split(" ")[0];
  if (faltan.length) mal("ffmpeg", `está (${version}) pero sin ${faltan.join(", ")}: hace falta el ffmpeg completo${so === "linux" && hay("dnf") ? " (en Fedora, el de RPM Fusion: sudo dnf install ffmpeg --allowerasing)" : `: ${instalaFfmpeg}`}`);
  else ok("ffmpeg", version + (FF !== "ffmpeg" ? ` (en ${FF}: no está en el PATH de esta terminal, pero el motor lo usa igual)` : ""));
}

// --- lo de dibujar: que esté la versión de package.json y que de verdad cargue en este sistema
const lienzo = join(RAIZ, "node_modules", "@napi-rs", "canvas");
let canvas = null;
if (!existsSync(lienzo)) mal("dibujo", "falta lo de dibujar: npm install (en esta carpeta)");
else {
  // la versión que pide package.json (las antiguas no saben sumar luz: "lighter" no hace nada)
  const quiere = JSON.parse(readFileSync(join(RAIZ, "package.json"), "utf8")).dependencies["@napi-rs/canvas"];
  const tiene = JSON.parse(readFileSync(join(lienzo, "package.json"), "utf8")).version;
  if (tiene !== quiere) mal("dibujo", `está la versión ${tiene} y hace falta la ${quiere}: npm install (en esta carpeta)`);
  else {
    try {
      canvas = await import("@napi-rs/canvas");
      const g = canvas.createCanvas(8, 8).getContext("2d");
      g.fillStyle = "#400"; g.fillRect(0, 0, 8, 8); g.globalCompositeOperation = "lighter"; g.fillRect(0, 0, 8, 8);
      g.getImageData(0, 0, 1, 1).data[0] > 100 ? ok("dibujo", `@napi-rs/canvas ${tiene}`) : mal("dibujo", "no suma la luz (\"lighter\"): borra node_modules y npm install");
    } catch (e) {
      canvas = null;
      mal("dibujo", `no carga en este ordenador (${String(e.message).split("\n")[0].slice(0, 90)}): borra la carpeta node_modules y npm install (si se copió de otro ordenador, trae lo de aquel sistema)`);
    }
  }
}

// --- las letras (y que se cargan como las carga el motor, desde sus bytes: lib/subtitulos.mjs)
const letras = ["Medium", "Bold", "ExtraBold"].every((p) => existsSync(join(RAIZ, "letra", `Figtree-${p}.ttf`)));
if (!letras) mal("letra", "faltan las letras de letra/: vuelve a copiar la carpeta entera");
else if (canvas) canvas.GlobalFonts.register(readFileSync(join(RAIZ, "letra", "Figtree-Bold.ttf")), "Figtree") ? ok("letra", "Figtree")
  : mal("letra", `${corta(join(RAIZ, "letra", "Figtree-Bold.ttf"))} está dañada: vuelve a copiar la carpeta letra/ entera`);

// --- abrir páginas e imágenes (la de la clave, las láminas, el vídeo): en Linux hace falta xdg-open, salvo en WSL
if (so === "linux" && !/microsoft/i.test(fs.existsSync("/proc/version") ? readFileSync("/proc/version", "utf8") : "") && !hay("xdg-open", ["--version"]))
  aviso("abrir", `sin xdg-open, las páginas y los vídeos no se abren solos (se dice su ruta para abrirlos a mano): ${instala({ apt: "xdg-utils", nombre: "xdg-utils" })}`);

// --- la clave de la voz
cargarClaves();
const clave = process.env.ELEVENLABS_API_KEY;
clave ? ok("voz", "clave de ElevenLabs puesta") : mal("voz", "sin clave de ElevenLabs: node motor/clave.mjs abre la página para pegarla (nunca en el chat)");

// --- el disco y que se puede escribir donde hace falta
try { const s = fs.statfsSync(RAIZ), gb = (s.bavail * s.bsize) / 1e9; gb > 2 ? ok("disco", `${gb.toFixed(0)} GB libres`) : mal("disco", `quedan ${gb.toFixed(1)} GB; hacen falta unos 2`); } catch { /* sin dato de disco */ }
const noSe = [];
for (const d of [RAIZ, join(RAIZ, "proyectos"), join(RAIZ, "salida")]) {
  const f = join(d, `.doctor-${process.pid}`);
  try { mkdirSync(d, { recursive: true }); writeFileSync(f, "x"); rmSync(f); } catch (e) { noSe.push(`${corta(d) || "la carpeta"} (${e.code || e.message})`); }
}
noSe.length ? mal("carpeta", `no se puede escribir en ${noSe.join(", ")}: mueve la carpeta a un sitio tuyo (Documentos) o dale permiso de escritura`) : ok("carpeta", "se puede escribir");

// --- la marca: que se lee y que lo que dice existe (los looks y los estilos necesitan lo de dibujar)
let marca = null;
if (canvas) {
  const { cargarMarca, leerMarca } = await import("./lib/marca.mjs");
  const lm = leerMarca();
  if (!lm.ruta) ok("marca", "VIDEOS_MARCA=ninguna: la de siempre");
  else if (!lm.existe) ok("marca", "sin marca.json: todo es lo de siempre (node motor/marca.mjs la enseña y la cambia)");
  else if (lm.error) mal("marca", `${corta(lm.ruta)} ${lm.error}`);
  else {
    try {
      const { validarMarca } = await import("./lib/validar.mjs");
      const { errores } = validarMarca(lm.datos, corta(lm.ruta));
      marca = cargarMarca();
      errores.length ? mal("marca", errores.join(" · ")) : ok("marca", `${marca.idioma} · look ${marca.look} · subtítulos ${marca.subtitulos.estilo}, ${marca.subtitulos.posicion}`);
    } catch (e) { mal("marca", `no se puede comprobar (${String(e.message).split("\n")[0].slice(0, 120)})`); }
  }
}

// --- las preferencias
const pref = join(RAIZ, "preferencias.md");
existsSync(pref) && readFileSync(pref, "utf8").replace(/^#.*$/gm, "").trim() ? ok("preferencias", "guardadas") : aviso("preferencias", "aún no hay: se preguntan una vez, antes del primer vídeo");

// --- en la red (gratis): la clave, lo que queda y que la voz de cada idioma está en la cuenta (si no, no se puede usar)
if (op.red) {
  if (!clave) aviso("elevenlabs", "sin clave, no se puede mirar");
  else {
    const { detalle, pedir, sinPermiso } = await import("./lib/elevenlabs.mjs");
    const s = await pedir("/v1/user/subscription");
    if (s.status === 0) aviso("elevenlabs", `no llego a ElevenLabs (${s.error}): ¿hay internet?`);
    else if (s.status === 200) {
      const quedan = (s.j.character_limit ?? 0) - (s.j.character_count ?? 0);
      quedan > 1500 ? ok("elevenlabs", `la clave vale; quedan ${quedan.toLocaleString("es")} caracteres este mes (un vídeo gasta unos 700)`)
        : mal("elevenlabs", `la clave vale, pero solo quedan ${quedan} caracteres este mes (un vídeo gasta unos 700): amplía el plan o espera a que se renueve`);
    } else if (sinPermiso(s)) ok("elevenlabs", "la clave vale (no deja ver cuántos caracteres quedan)");
    else if (s.status === 401) mal("elevenlabs", "la clave no vale: pon otra con node motor/clave.mjs");
    else aviso("elevenlabs", `ElevenLabs dijo ${s.status}: ${detalle(s.j).slice(0, 80)}`);
    if (s.status === 200 || sinPermiso(s)) {
      const { cargarMarca, vozDe } = await import("./lib/marca.mjs");
      const m = marca || cargarMarca(), voces = new Map();
      voces.set(vozDe({}, m).id, `la voz de los vídeos en ${m.idioma}`);
      for (const [i, x] of Object.entries(m.voces || {})) if (x?.id && !voces.has(x.id)) voces.set(x.id, `la voz de los vídeos en ${i}`);
      for (const [id, cual] of voces) {
        const r = await pedir(`/v2/voices?${new URLSearchParams({ voice_ids: id, page_size: "5" })}`);
        if (r.status === 200 && r.j.voices?.length) { ok("voz en línea", `${cual}: ${String(r.j.voices[0].name || id).slice(0, 40)}`); continue; }
        if (r.status !== 200) { aviso("voz en línea", sinPermiso(r) ? `la clave no deja ver tus voces (Voices en «Read»): no sé si ${cual} se puede usar` : `no he podido comprobar ${cual} (${r.status || r.error})`); continue; }
        // no está en la cuenta: o es de la biblioteca de ElevenLabs (hay que añadirla) o no existe
        const e = await pedir(`/v1/voices/${encodeURIComponent(id)}`);
        mal("voz en línea", e.status === 200
          ? `${cual} (${String(e.j.name || id).slice(0, 40)}) es de la biblioteca de ElevenLabs y no está en tu cuenta: elige una con node motor/voces.mjs`
          : `${cual} (${id}) no existe en ElevenLabs: elige una con node motor/voces.mjs`);
      }
    }
  }
}

console.log(lineas.join("\n"));
process.exit(lineas.some((l) => l.startsWith("falta")) ? 1 : 0);
