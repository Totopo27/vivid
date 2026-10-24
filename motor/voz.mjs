#!/usr/bin/env node
// voz.mjs: la voz del vídeo, de una sola toma, como habla una persona, y el segundo exacto de cada palabra.
import { existsSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { argumentos, ayuda, cargarClaves, carpetaProyecto, corta, escribirJson, fallo, ffmpeg, leerAudio, leerJson, leerJsonDe, r3 } from "./lib/comun.mjs";
import { dichosDe, firmaDe, palabrasDeLetras, tiemposDe } from "./lib/alinear.mjs";
import { api } from "./lib/elevenlabs.mjs";
import { cargarMarca, leerMarca, vozDe } from "./lib/marca.mjs";
import { juntar, validarGuion, validarMarca } from "./lib/validar.mjs";

ayuda(`
node motor/voz.mjs <proyecto> [--rehacer]

Lee las frases de guion.json y hace, con ElevenLabs:
  voz/voz.wav        la voz entera, tal cual sale: nunca se corta ni se acortan sus pausas
  voz/tiempos.json   cuándo empieza y acaba cada frase y cada palabra
e imprime cada frase con el segundo de sus palabras, para planear el vídeo con ellas.
Antes de pedirla, comprueba el guion: si algo está mal, lo dice y no gasta nada.
Si las frases y los ajustes no han cambiado, no vuelve a pedir la voz (cuesta dinero). --rehacer la pide otra vez.
La voz sale de la marca (se elige escuchándolas con node motor/voces.mjs; una por idioma en "voces") y guion.json
"voz" manda sobre ella:
{ "id", "modelo", "estabilidad", "similitud", "estilo", "velocidad", "codigoIdioma" } (codigoIdioma, "es" o "en"...,
obliga a ElevenLabs a leer en ese idioma).
`);

const COLA = 0.8; // silencio al final, para que la última imagen respire
const { sueltos, op } = argumentos();
const dir = carpetaProyecto(sueltos[0]);
const guion = leerJsonDe(join(dir, "guion.json"), "el guion");

// --- antes de gastar: el guion y la voz, bien
const vg = validarGuion(guion, { paraVoz: true });
const lm = leerMarca(), em = lm.existe ? validarMarca(lm.datos, corta(lm.ruta)).errores : [];
if (vg.errores.length || em.length) fallo(juntar("Antes de pedir la voz, arregla esto (no se ha gastado nada):", [...vg.errores, ...em]));
const V = vozDe(guion, cargarMarca());
for (const a of vg.avisos) console.log(`  aviso: ${a}`);
const frases = guion.frases, dichos = dichosDe(guion);
const firma = firmaDe(V, dichos);
const ftoma = join(dir, "voz", "toma.json"), wtoma = join(dir, "voz", "toma.wav"), mtoma = join(dir, "voz", "toma.mp3");

let toma = null, pedida = false;
try { toma = existsSync(ftoma) ? leerJson(ftoma) : null; } catch { /* rota: se pide otra */ }
const vale = toma && toma.firma === firma && Array.isArray(toma.palabras) && (existsSync(wtoma) || existsSync(mtoma));
if (!vale || op.rehacer) {
  cargarClaves();
  const KEY = process.env.ELEVENLABS_API_KEY;
  if (!KEY) fallo("No hay clave de ElevenLabs. Ábrele la página para pegarla: node motor/clave.mjs (nunca se la pidas en el chat).");
  const texto = dichos.join(" ");
  const cuerpo = {
    text: texto, model_id: V.modelo,
    voice_settings: { stability: V.estabilidad, similarity_boost: V.similitud, style: V.estilo, speed: V.velocidad, use_speaker_boost: true },
    ...(V.codigoIdioma ? { language_code: V.codigoIdioma } : {}),
  };
  console.log(`pidiendo la voz a ElevenLabs (${texto.length} letras)...`);
  let r;
  try {
    r = await fetch(`${api()}/v1/text-to-speech/${encodeURIComponent(V.id)}/with-timestamps?output_format=mp3_44100_128`, {
      method: "POST", headers: { "xi-api-key": KEY, "content-type": "application/json" }, body: JSON.stringify(cuerpo), signal: AbortSignal.timeout(180000),
    });
  } catch (e) { fallo(`No llego a ElevenLabs (${e.cause?.code || e.name || e.message}): mira que haya internet y vuelve a probar. No se ha gastado nada.`); }
  if (!r.ok) fallo(errorDeElevenLabs(r.status, await r.text().catch(() => "")));
  let j;
  try { j = await r.json(); } catch (e) { fallo(`ElevenLabs devolvió algo que no se entiende (${e.message}). Vuelve a probar en un momento.`); }
  const a = j.alignment || j.normalized_alignment;
  if (!j.audio_base64 || !a?.characters) fallo("ElevenLabs no devolvió el audio con sus tiempos. Vuelve a probar en un momento.");
  // primero se marca la toma vieja como no válida; luego el audio; luego sus tiempos (si algo se para a medias, la
  // próxima vez no se mezcla una toma con los tiempos de otra)
  escribirJson(ftoma, { pendiente: true });
  writeFileSync(mtoma, Buffer.from(j.audio_base64, "base64"));
  toma = { firma, proveedor: "elevenlabs", ajustes: V, palabras: palabrasDeLetras(a) };
  escribirJson(ftoma, toma);
  pedida = true;
}
// el mp3 que llega se pasa a wav (si se paró a medias, se vuelve a pasar: la toma ya está pagada)
const nueva = existsSync(mtoma);
if (nueva) { ffmpeg(["-i", mtoma, "-ar", "48000", "-ac", "1", wtoma]); rmSync(mtoma); }

// La toma, tal cual. Solo se quita el silencio del principio (si de verdad es silencio) y se deja una cola al final.
const audio = leerAudio(wtoma, 48000), SR = 48000;
const ws = toma.palabras;
if (!ws.length) fallo("La toma no tiene ninguna palabra: rehazla con --rehacer.");
let quitar = Math.max(0, ws[0].inicio - 0.06);
if (quitar > 0) {
  let pico = 0;
  for (let i = 0; i < Math.floor(quitar * SR); i++) pico = Math.max(pico, Math.abs(audio[i]));
  if (20 * Math.log10(pico + 1e-9) > -45) quitar = 0; // ahí ya suena algo: no se toca
}
const fin = ws[ws.length - 1].fin - quitar, total = r3(Math.max(fin + COLA, audio.length / SR - quitar));
// voz.wav solo se rehace si la toma es otra (si no, saldría lo mismo)
const fvoz = join(dir, "voz", "voz.wav"), ftiempos = join(dir, "voz", "tiempos.json");
let antes = null;
try { antes = existsSync(ftiempos) ? leerJson(ftiempos) : null; } catch { /* se rehace */ }
if (pedida || nueva || !existsSync(fvoz) || antes?.firma !== firma || antes?.duracion !== total)
  ffmpeg(["-i", wtoma, "-af", `atrim=start=${quitar.toFixed(3)},asetpts=N/SR/TB,apad,atrim=0:${total}`, "-ar", "48000", "-ac", "1", fvoz]);

// Las palabras de cada frase, por cuántas palabras tiene lo que se dice (motor/lib/alinear.mjs).
let t;
try { t = tiemposDe(frases, dichos, ws, quitar); } catch (e) { fallo(e.message); }
const { frases: fs, palabras: pal } = t;
for (const a of t.avisos) console.log(`  aviso: ${a}`);
escribirJson(ftiempos, { firma, duracion: total, frases: fs, palabras: pal });

console.log(`voz: ${corta(fvoz)} (${total.toFixed(2)} s, ${fs.length} frases, ${pal.length} palabras)`);
for (const f of fs) {
  const ps = pal.filter((w) => w.frase === f.n);
  console.log(`${String(f.n).padStart(2)} ${f.inicio.toFixed(2).padStart(6)}–${f.fin.toFixed(2).padEnd(6)} ${ps.map((w) => `${w.texto}@${w.inicio.toFixed(2)}`).join(" ")}`);
}
// Lo raro, para que lo mires (no se arregla cortando la voz: se cambia la frase y se rehace).
for (let i = 1; i < pal.length; i++) {
  const hueco = pal[i].inicio - pal[i - 1].fin;
  if (hueco > 1.1) console.log(`  aviso: ${hueco.toFixed(1)} s de silencio entre «${pal[i - 1].texto}» y «${pal[i].texto}».`);
}
const [dmin, dmax] = cargarMarca().duracion; // de la marca: 30 a 60 si no dice otra cosa
if (total > dmax + 10) console.log(`  aviso: la voz dura ${total.toFixed(0)} s; los vídeos de la marca duran de ${dmin} a ${dmax}. ¿Sobra alguna frase?`);
else if (total < dmin - 5) console.log(`  aviso: la voz dura ${total.toFixed(0)} s; los vídeos de la marca duran de ${dmin} a ${dmax}. ¿Falta contar algo?`);

// Lo que dijo ElevenLabs, en una frase que dice qué hacer.
function errorDeElevenLabs(status, cuerpo) {
  let d = "";
  try { const x = JSON.parse(cuerpo).detail; d = typeof x === "string" ? x : `${x?.status || ""} ${x?.message || ""}`.trim(); } catch { d = cuerpo.slice(0, 300); }
  const que = /quota|credit|character/i.test(d) ? "no te quedan caracteres en ElevenLabs este mes: amplía el plan o espera a que se renueve"
    : status === 401 ? "la clave no vale o no tiene permiso para hacer voces: pon otra con node motor/clave.mjs"
    : status === 404 || /voice.*not.*found|voice_not_found/i.test(d) ? `la voz «${V.id}» no existe o no está en tu cuenta de ElevenLabs: elige una con node motor/voces.mjs (o cambia "voz" de guion.json)`
    : status === 402 ? "tu plan de ElevenLabs no deja usar esa voz (con el plan gratuito, las de la biblioteca no se pueden usar fuera de su web): elige una de tus voces con node motor/voces.mjs o amplía el plan"
    : status === 422 || status === 400 ? "ElevenLabs no acepta algún ajuste de la voz (el modelo, el idioma o un número): míralos en la marca y en guion.json"
    : status === 429 ? "ahora mismo hay demasiadas peticiones: espera un minuto y vuelve a probar"
    : status >= 500 ? "ElevenLabs tiene un problema ahora mismo: vuelve a probar en unos minutos" : "";
  return `ElevenLabs dijo ${status}${que ? `: ${que}` : ""}. ${d ? `(${d})` : ""}\nNo se ha guardado nada nuevo.`;
}
