#!/usr/bin/env node
// pruebas-rapidas.mjs: lo puro del motor, en un par de segundos y sin dibujar ningún vídeo: cómo se alinean las
// palabras de la voz, la firma de la toma, los bloques de subtítulos, los números en cada idioma, la marca, cuándo
// empieza un plano, los huecos sin sonido y lo que se comprueba de los archivos. node motor/pruebas.mjs las pasa antes
// que los ejemplos.
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { RAIZ, argumentos, ayuda } from "./lib/comun.mjs";

ayuda(`
node motor/pruebas-rapidas.mjs

Prueba lo puro del motor (sin dibujar): sale con error y dice cuál falla si algo no da lo que tiene que dar.
`);

process.env.VIDEOS_MARCA = "ninguna"; // la marca de nadie
const { alinear, dichosDe, firmaDe, palabrasDe, palabrasDeLetras, tiemposDe } = await import("./lib/alinear.mjs");
const { BASE, estiloDe, estiloPedido, mezclar, normalizaSubtitulos, vozDe } = await import("./lib/marca.mjs");
const { SR, huecos } = await import("./lib/mezcla.mjs");
const { cuando, vozVieja } = await import("./lib/proyecto.mjs");
const { ESTILOS, zonaSubtitulos } = await import("./lib/subtitulos.mjs");
const { validarGuion, validarMarca, validarSonidos } = await import("./lib/validar.mjs");
const { llenar, v } = await import("./lib/voz-actual.js");
const { llenarEstilo, estilo } = await import("./lib/estilo-actual.js");
const { zonaDeInstagram } = await import("./lib/comprobar.mjs");
const { normalizaFirma, zonaFirma } = await import("./lib/firma.mjs");
const { programa } = await import("./lib/comun.mjs");
const k = await import("./kit/index.js");

const fallan = [];
let bien = 0;
const prueba = (nombre, fn) => { try { fn(); bien++; } catch (e) { fallan.push(`${nombre}: ${e.message}`); } };
const igual = (a, b, que = "") => { const x = JSON.stringify(a), y = JSON.stringify(b); if (x !== y) throw new Error(`${que} da ${x}, tenía que dar ${y}`); };
const cerca = (a, b, que = "") => { if (Math.abs(a - b) > 1e-6) throw new Error(`${que} da ${a}, tenía que dar ${b}`); };
const si = (x, que) => { if (!x) throw new Error(que); };
const lanza = (fn, que) => { try { fn(); } catch { return; } throw new Error(`${que}: tenía que fallar y no falla`); };
const w = (texto, inicio, fin) => ({ texto, inicio, fin });
const ejemplo = (n) => ({ guion: JSON.parse(readFileSync(join(RAIZ, "ejemplo", n, "guion.json"), "utf8")), toma: JSON.parse(readFileSync(join(RAIZ, "ejemplo", n, "voz", "toma.json"), "utf8")), tiempos: JSON.parse(readFileSync(join(RAIZ, "ejemplo", n, "voz", "tiempos.json"), "utf8")) });
const EJ = { estrella: ejemplo("estrella-verde"), alcohol: ejemplo("alcohol") };

// --- la voz: palabras, alineación y firma
prueba("palabrasDe", () => igual(palabrasDe("Hola — mundo ... ¿qué? 4.000"), ["Hola", "mundo", "¿qué?", "4.000"]));
prueba("alinear, lo mismo", () => igual(alinear(["Hola,", "mundo."], [w("Hola,", 0, 0.3), w("mundo.", 0.4, 0.8)]), [[0, 0.3], [0.4, 0.8]]));
prueba("alinear, «IA» dicho «i a»", () => {
  const r = alinear(["La", "IA", "piensa"], [w("La", 0, 0.1), w("i", 0.2, 0.3), w("a", 0.35, 0.45), w("piensa", 0.5, 0.9)]);
  igual(r[0], [0, 0.1]); cerca(r[1][0], 0.2, "IA empieza"); cerca(r[1][1], 0.45, "IA acaba"); igual(r[2], [0.5, 0.9]);
});
prueba("alinear, «4.000» dicho «cuatro mil»", () => {
  const r = alinear(["Hay", "4.000", "grados"], [w("Hay", 0, 0.2), w("cuatro", 0.3, 0.6), w("mil", 0.65, 0.9), w("grados", 1, 1.4)]);
  cerca(r[1][0], 0.3); cerca(r[1][1], 0.9); igual(r[2], [1, 1.4]);
});
prueba("alinear, varias escritas por una dicha (por letras)", () => {
  const r = alinear(["a", "bb", "cccc", "d"], [w("a", 0, 0.1), w("x", 0.2, 0.8), w("d", 0.9, 1)]);
  cerca(r[1][0], 0.2); cerca(r[2][1], 0.8); si(r[2][1] - r[2][0] > r[1][1] - r[1][0], "la palabra más larga se lleva más tiempo");
});
prueba("alinear, una escrita que no se dice", () => { const r = alinear(["a", "b", "c"], [w("a", 0, 0.1), w("c", 0.5, 0.6)]); cerca(r[1][0], 0.1); cerca(r[1][1], 0.1); igual(r[2], [0.5, 0.6]); });
prueba("alinear, sin nada", () => igual(alinear([], [w("a", 0, 1)]), []));
prueba("palabrasDeLetras", () => igual(palabrasDeLetras({ characters: [..."Sí, ya."], character_start_times_seconds: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6], character_end_times_seconds: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7] }), [w("Sí,", 0, 0.3), w("ya.", 0.4, 0.7)]));
prueba("tiemposDe, con «dicho» y el silencio de delante", () => {
  const frases = [{ texto: "La IA piensa.", clave: "piensa" }, { texto: "Y ya.", clave: "ya" }], dichos = dichosDe({ frases: [{ ...frases[0], dicho: "La i a piensa." }, frases[1]] });
  const ws = [w("La", 0.5, 0.6), w("i", 0.7, 0.8), w("a", 0.85, 0.95), w("piensa.", 1, 1.4), w("Y", 1.6, 1.7), w("ya.", 1.75, 2)];
  const t = tiemposDe(frases, dichos, ws, 0.44);
  igual(t.palabras.map((p) => p.texto), ["La", "IA", "piensa.", "Y", "ya."]); igual(t.palabras.map((p) => p.frase), [1, 1, 1, 2, 2]);
  igual(t.palabras.map((p) => p.clave), [false, false, true, false, true]); cerca(t.palabras[0].inicio, 0.06); cerca(t.frases[1].inicio, 1.16); igual(t.avisos, []);
});
prueba("tiemposDe, una frase que no está en la voz", () => lanza(() => tiemposDe([{ texto: "a" }, { texto: "b" }], ["a", "b"], [w("a", 0, 1)]), "frase de más"));
for (const [n, e] of Object.entries(EJ)) prueba(`firma de la toma de ${n}`, () => {
  igual(firmaDe(vozDe(e.guion, structuredClone(BASE)), dichosDe(e.guion)), e.toma.firma, "con la marca de siempre");
  igual(firmaDe(vozDe(e.guion, mezclar(BASE, { voz: { id: "otra", velocidad: 1.1 } })), dichosDe(e.guion)), e.toma.firma, "con otra marca (el guion manda)");
});
prueba("la firma cambia con lo que suena", () => {
  const voz = BASE.voz, d = ["Hola."];
  si(firmaDe(voz, d) !== firmaDe({ ...voz, velocidad: 1.1 }, d), "velocidad"); si(firmaDe(voz, d) !== firmaDe({ ...voz, codigoIdioma: "es" }, d), "codigoIdioma");
  igual(firmaDe({ ...voz, nota: "x" }, d), firmaDe(voz, d), "algo que no suena");
});

// --- los subtítulos: cada estilo parte las palabras sin perder ninguna ni mezclar frases
const pal = EJ.estrella.tiempos.palabras, dur = EJ.estrella.tiempos.duracion;
for (const nombre of Object.keys(ESTILOS)) for (const posicion of ["arriba", "abajo"]) prueba(`bloques de «${nombre}» (${posicion})`, () => {
  const conf = { estilo: nombre, posicion }, bs = ESTILOS[nombre].bloques(pal, dur, conf);
  igual(bs.flatMap((b) => b.palabras.map((x) => x.texto)), pal.map((x) => x.texto), "las palabras, en orden");
  bs.forEach((b, i) => {
    si(b.palabras.every((x) => x.frase === b.frase), `el bloque ${i + 1} mezcla frases`);
    si(b.inicio <= b.palabras[0].inicio + 1e-6, `el bloque ${i + 1} empieza después de su primera palabra`);
    si(b.fin > b.inicio, `el bloque ${i + 1} no dura nada`);
    if (bs[i + 1]) si(b.fin <= bs[i + 1].inicio + 1e-6, `el bloque ${i + 1} sigue cuando empieza el siguiente`);
  });
  const z = zonaSubtitulos(conf);
  si(z && z.x >= 0 && z.y >= 0 && z.x + z.w <= 1080 && z.y + z.h <= 1920 && z.w > 0 && z.h > 0, `su zona se sale de la pantalla: ${JSON.stringify(z)}`);
});
prueba("sin subtítulos no hay zona", () => igual(zonaSubtitulos({ estilo: "caja", posicion: "no" }), null));

// --- los números en el idioma del vídeo
prueba("k.fmt en español", () => { igual(k.fmt(30000, 0, "es"), "30.000"); igual(k.fmt(1.9, 1, "es"), "1,9"); igual(k.fmt(-1234.5, 1, "es"), "-1.234,5"); igual(k.fmt(280, 0, "es"), "280"); });
prueba("k.fmt en inglés", () => { igual(k.fmt(30000, 0, "en"), "30,000"); igual(k.fmt(1.9, 1, "en"), "1.9"); igual(k.fmt(-1234.5, 1, "en"), "-1,234.5"); });
prueba("k.fmt con el idioma del vídeo", () => {
  const antes = estilo.idioma;
  try { llenarEstilo({ idioma: "en" }); igual(k.fmt(4000), "4,000"); llenarEstilo({ idioma: "es" }); igual(k.fmt(4000), "4.000"); } finally { llenarEstilo({ idioma: antes }); }
});

// --- la marca y el estilo de cada vídeo
prueba("mezclar la marca con lo de siempre", () => {
  const m = mezclar(BASE, { idioma: "en", subtitulos: { estilo: "x" }, voz: { velocidad: 1.1 } });
  igual(m.subtitulos, { estilo: "x", posicion: "arriba" }); igual(m.voz.id, BASE.voz.id); igual(m.voz.velocidad, 1.1); igual(BASE.voz.velocidad, 1, "lo de siempre no cambia");
});
prueba("normalizaSubtitulos", () => {
  igual(normalizaSubtitulos(undefined), BASE.subtitulos); si(normalizaSubtitulos(undefined) !== BASE.subtitulos, "da una copia");
  igual(normalizaSubtitulos("abajo"), { estilo: "caja", posicion: "abajo" }); igual(normalizaSubtitulos({ estilo: "karaoke" }), { estilo: "karaoke", posicion: "arriba" });
  igual(normalizaSubtitulos("no", { estilo: "minimal", posicion: "abajo" }), { estilo: "minimal", posicion: "no" });
});
prueba("estiloDe: el guion manda sobre la marca, y lo pedido sobre todo", () => {
  const m = mezclar(BASE, { idioma: "en", look: "neon", subtitulos: { estilo: "karaoke" } });
  igual(estiloDe({}, m), { idioma: "en", look: "neon", subtitulos: { estilo: "karaoke", posicion: "arriba" } });
  igual(estiloDe({ idioma: "es", look: "espacio", subtitulos: "abajo" }, m), { idioma: "es", look: "espacio", subtitulos: { estilo: "karaoke", posicion: "abajo" } });
  igual(estiloDe({ look: "espacio" }, m, { look: "cine", subtitulos: { estilo: "caja" } }), { idioma: "en", look: "cine", subtitulos: { estilo: "caja", posicion: "arriba" } });
});
prueba("vozDe: la de la marca, la de su idioma y la del guion", () => {
  const m = mezclar(BASE, { voces: { en: { id: "ingles", codigoIdioma: "en" } } });
  igual(vozDe({}, m).id, BASE.voz.id); igual(vozDe({ idioma: "en" }, m).id, "ingles"); igual(vozDe({ idioma: "en" }, m).codigoIdioma, "en");
  igual(vozDe({ idioma: "en", voz: { id: "suya" } }, m).id, "suya"); igual(vozDe({ idioma: "en" }, m).modelo, BASE.voz.modelo);
});
prueba("estiloPedido (--look, --subtitulos)", () => {
  igual(estiloPedido({}), null); igual(estiloPedido({ look: "neon" }), { look: "neon" });
  igual(estiloPedido({ subtitulos: "abajo" }), { subtitulos: { posicion: "abajo" } }); igual(estiloPedido({ subtitulos: "karaoke" }), { subtitulos: { estilo: "karaoke" } });
});

prueba("la firma: de la marca, cambiada o quitada en el guion", () => {
  const m = mezclar(BASE, { firma: "@yo" });
  igual(estiloDe({}, m).firma, { posicion: "abajo", opacidad: 0.8, escala: 1, color: "#ffffff", texto: "@yo" });
  igual(estiloDe({ firma: { posicion: "arriba" } }, m).firma.posicion, "arriba"); igual(estiloDe({ firma: { posicion: "arriba" } }, m).firma.texto, "@yo");
  igual(estiloDe({ firma: false }, m).firma, undefined, "false la quita"); igual(estiloDe({ firma: "otra.com" }, m).firma.texto, "otra.com");
  igual(estiloDe({}, BASE).firma, undefined, "sin firma en la marca"); igual(normalizaFirma(""), null);
});
prueba("la firma cae donde no tapa Instagram ni pisa los subtítulos", () => {
  for (const posicion of ["abajo", "arriba"]) for (const escala of [0.6, 1, 1.2]) {
    const z = zonaFirma(normalizaFirma({ texto: "@x", posicion, escala }));
    igual(zonaDeInstagram([z.x, z.y, z.x + z.w, z.y + z.h]), null, `firma ${posicion} ${escala}`);
    for (const estilo of Object.keys(ESTILOS)) for (const sp of ["arriba", "centro", "abajo"]) {
      if (estilo === "caja" && sp === "centro") continue;
      const s = zonaSubtitulos({ estilo, posicion: sp });
      si(z.y + z.h <= s.y || z.y >= s.y + s.h, `la firma ${posicion} (escala ${escala}) pisa los subtítulos ${estilo} ${sp}`);
    }
  }
});
prueba("validarMarca: firma y duración", () => {
  igual(validarMarca({ firma: "@yo", duracion: [20, 40] }).errores, []); igual(validarMarca({ firma: { texto: "@yo", posicion: "arriba", opacidad: 0.5, escala: 1.2, color: "#ff0" } }).errores, []);
  si(validarMarca({ firma: { posicion: "arriba" } }).errores.length === 1, "una firma sin texto"); si(validarMarca({ firma: { texto: "@yo", posicion: "centro" } }).errores.length === 1, "una posición que no hay");
  si(validarMarca({ duracion: [40, 20] }).errores.length === 1, "al revés"); si(validarMarca({ duracion: 30 }).errores.length === 1, "un número suelto");
  si(validarGuion({ frases: [{ texto: "a" }], firma: false }).errores.length === 0, "firma: false en el guion");
});
{
  // la voz elegida (voces.mjs) va a la marca: la de su idioma, sin tocar lo demás; fuera del español, lee en ese idioma
  const { ponerVozEnLaMarca } = await import("./lib/elevenlabs.mjs"), d = mkdtempSync(join(tmpdir(), "marca-")), f = join(d, "marca.json");
  try {
    writeFileSync(f, JSON.stringify({ idioma: "en", look: "neon", voces: { en: { velocidad: 1.1 } } }));
    process.env.VIDEOS_MARCA = f;
    await ponerVozEnLaMarca("VozInglesa1");
    await ponerVozEnLaMarca("VozEspanola", "es");
    const m = JSON.parse(readFileSync(f, "utf8"));
    prueba("la voz elegida, en la marca", () => {
      igual(m.voces.en, { velocidad: 1.1, id: "VozInglesa1", codigoIdioma: "en" }); igual(m.voces.es, { id: "VozEspanola" }); igual(m.look, "neon");
      igual(vozDe({}, mezclar(BASE, m)).id, "VozInglesa1"); igual(vozDe({ idioma: "es" }, mezclar(BASE, m)).id, "VozEspanola");
    });
  } catch (e) { fallan.push(`la voz elegida, en la marca: ${e.message}`); }
  finally { process.env.VIDEOS_MARCA = "ninguna"; rmSync(d, { recursive: true, force: true }); }
}
prueba("ffmpeg: el del PATH o una ruta que existe", () => { const f = programa("ffmpeg"); si(f === "ffmpeg" || f.endsWith("ffmpeg") || f.endsWith("ffmpeg.exe"), `da ${f}`); });

// --- cuándo empieza un plano, y si la voz es de otro guion
llenar(EJ.estrella.tiempos);
prueba("cuando(): número, palabra, palabra#n y función", () => {
  cerca(cuando(1.5), 1.5); cerca(cuando("sodio"), v.t("sodio") - 0.04); cerca(cuando("que#2"), v.t("que", 2) - 0.04); cerca(cuando((vz) => vz.frase(4).inicio), v.frase(4).inicio);
});
prueba("cuando(): lo que no vale", () => {
  lanza(() => cuando("palabraquenoesta"), "una palabra que no está"); lanza(() => cuando(() => NaN), "una función que da NaN");
  lanza(() => cuando(-1), "un segundo negativo"); lanza(() => cuando({}), "un objeto");
});
prueba("vozVieja", () => {
  const { guion, tiempos } = EJ.estrella;
  igual(vozVieja(guion, tiempos, structuredClone(BASE)), null, "el ejemplo");
  const otro = structuredClone(guion); otro.frases[2].texto = "¿Qué le pasó?";
  si(vozVieja(otro, tiempos, BASE)?.texto === true, "con otro texto");
  const clave = structuredClone(guion); clave.frases[0].clave = "estrella";
  si(vozVieja(clave, tiempos, BASE)?.texto === false, "con otra clave");
});

// --- los huecos sin efectos (también el que llega al final)
prueba("huecos", () => {
  const p = new Float32Array(SR * 8);
  for (let i = 0; i < SR * 0.5; i++) p[i] = 0.1 * Math.sin(i / 10);
  for (let i = SR * 3; i < SR * 3.5; i++) p[i] = 0.1 * Math.sin(i / 10);
  const h = huecos(p, 2);
  igual(h.length, 2, "cuántos"); cerca(h[0][0], 0.5); cerca(h[0][1], 3); cerca(h[1][0], 3.5); cerca(h[1][1], 8);
  igual(huecos(p, 5), [], "más cortos que lo pedido");
});

// --- lo que se comprueba de los archivos
prueba("validarGuion: los ejemplos están bien", () => { for (const e of Object.values(EJ)) igual(validarGuion(e.guion, { paraVoz: true }), { errores: [], avisos: [] }); });
prueba("validarGuion: lo que está mal", () => {
  const g = { frases: [{ texto: "Primera frase.", clave: "primera" }, { texto: "Segunda frase.", clave: "otra", hook: true }, { texto: "" }, { texto: "La IA.", clave: "IA", dicho: "Algo que no tiene nada que ver aquí." }] };
  const { errores } = validarGuion(g, { paraVoz: true }), todo = errores.join("\n");
  si(/«otra» no está/.test(todo), "la clave que no está"); si(/hook/.test(todo), "el hook que no va al principio"); si(/no tiene texto/.test(todo), "la frase sin texto");
  si(/no parece la misma frase/.test(todo) === false, "un dicho de una frase corta no se juzga por palabras en común");
  igual(validarGuion(g).errores, [], "sin paraVoz, todo eso son avisos");
  si(validarGuion({ frases: [{ texto: "a" }], look: "nada" }).errores.length === 1, "un look que no existe");
  si(validarGuion({ frases: [{ texto: "a" }], voz: { velocidad: 3 } }).errores.length === 1, "una velocidad fuera de lo que acepta la voz");
});
prueba("validarMarca", () => {
  igual(validarMarca({ idioma: "en", look: "espacio", subtitulos: { estilo: "caja" }, voces: { en: { id: "x", codigoIdioma: "en" } }, efectos: false }).errores, []);
  si(validarMarca({ colores: 1 }).errores.length === 1, "un campo que no existe"); si(validarMarca({ voces: { en: { id: 3 } } }).errores.length === 1, "un id que no es texto");
});
prueba("validarSonidos", () => {
  const catalogo = { aire: "x", clic: "y" };
  igual(validarSonidos([{ sonido: "aire", t: 1, db: -10 }], { catalogo, duracion: 10 }), { errores: [], avisos: [] });
  si(validarSonidos([{ sonido: "airee", t: 1 }], { catalogo }).errores.length === 1, "un sonido que no existe");
  si(validarSonidos([{ sonido: "aire", t: NaN }], { catalogo }).errores.length === 1, "un t que no es un número");
  si(validarSonidos([{ sonido: "aire", t: 12 }], { catalogo, duracion: 10 }).avisos.length === 1, "fuera del vídeo");
  si(validarSonidos({}, { catalogo }).errores.length === 1, "algo que no es una lista");
});
prueba("zonaDeInstagram", () => {
  igual(zonaDeInstagram([300, 100, 700, 200]), "arriba"); igual(zonaDeInstagram([300, 800, 700, 900]), null);
  igual(zonaDeInstagram([980, 1200, 1060, 1260]), "botones"); igual(zonaDeInstagram([100, 1500, 600, 1600]), "abajo"); igual(zonaDeInstagram([300, 1400, 700, 1445]), null, "si solo roza la zona");
});
prueba("argumentos", () => {
  igual(argumentos(["p", "--borrador", "x", "--desde=3", "--fps", "10"]), { sueltos: ["p", "x"], op: { borrador: true, desde: "3", fps: "10" } });
});

console.log(`pruebas rápidas: ${bien} bien${fallan.length ? `, ${fallan.length} mal` : ""}`);
if (fallan.length) { console.error(fallan.map((f) => `  ✗ ${f}`).join("\n")); process.exit(1); }
