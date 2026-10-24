#!/usr/bin/env node
// revisar.mjs: todo lo que hay que mirar antes de enseñar el vídeo, en un minuto y sin renderizarlo.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { argumentos, arg, ayuda, carpetaProyecto, carpetaRevisar, fallo, leerVoz, numero } from "./lib/comun.mjs";
import { avisoHiloNuevo, comprobar, enHiloNuevo } from "./lib/comprobar.mjs";
import { preparar } from "./lib/cuadro.mjs";
import { guardar, hoja, reparto } from "./lib/hojas.mjs";
import { cargarMarca, estiloPedido, nombreDe } from "./lib/marca.mjs";
import { cortes, lineaDeMovimiento, subtituloSobreClaro } from "./lib/medidas.mjs";
import { SR, cargarSonidos, hayEfectos, huecos, mezclar } from "./lib/mezcla.mjs";
import { abrir } from "./lib/proyecto.mjs";
import { juntar } from "./lib/validar.mjs";

ayuda(`
node motor/revisar.mjs <proyecto> [--hasta s] [--apertura nombre] [--look nombre] [--subtitulos estilo]

Hace dos hojas y lo dice todo en texto. Mira las dos hojas enteras, siempre:
  revisar/frases.jpg   cada frase de su primera palabra a la última: ¿se ve lo que dice, grande, y se mueve?
  revisar/cortes.jpg   cada cambio de plano, de 0,6 s antes a 0,4 s después: ¿lo de antes ha acabado? ¿se entiende lo nuevo?
Y avisa de:
  - un corte que llega con lo de antes aún en movimiento (se siente cortado a medias),
  - un corte entre dos planos que se parecen (si es el mismo sitio, que la cámara vaya; si no, que se note el cambio),
  - un plano que dura menos de 1,5 s (no da tiempo a verlo; METODO, «Los cambios de plano»),
  - los segundos casi quietos seguidos (si no son el respiro de lo que remata, ahí falta algo que pase con la voz),
  - el subtítulo sobre un fondo casi blanco (no se lee),
  - los huecos sin sonido y los sonidos que caen en un corte,
  - y todo lo de comprobar.mjs: lo que no se puede dibujar, lo que no sale igual dos veces, lo prohibido, lo que tarda,
    el primer segundo quieto, lo gris o apagado, la duración, las frases deprisa y el texto donde lo tapa Instagram.
Nada de esto es una nota: es dónde mirar. Arregla lo que veas mal, no el número.
--hasta: solo hasta ese segundo (para el hook). --apertura 01-tunel: con esa otra apertura del hook.
--look, --subtitulos: con otro look u otros subtítulos, sin tocar el guion (las hojas llevan su nombre delante).
`);

const { sueltos, op } = argumentos();
const dir = carpetaProyecto(sueltos[0]);
if (op.apertura === true) fallo("--apertura necesita el nombre de la apertura, por ejemplo --apertura 01-tunel.");
const apertura = op.apertura ? String(op.apertura) : null, sobre = estiloPedido(op);
const proy = await abrir(dir, { apertura, estilo: sobre });
const hasta = Math.min(proy.duracion, numero(op, "hasta", proy.duracion));
if (!(hasta > 0.5)) fallo("--hasta es el segundo hasta el que se revisa (por ejemplo --hasta 10, para el hook).");
const t0 = Date.now();

// --- lo que se sabe que sale mal (antes que las hojas: si algo no se puede dibujar, las hojas tampoco)
const comp = comprobar(proy, { hasta });
if (!comp.errores.length) { const a = avisoHiloNuevo(proy, await enHiloNuevo(proy, { apertura, estilo: sobre, hasta })); if (a) comp.avisos.push(a); }
if (comp.errores.length) fallo(juntar("No todo se puede dibujar (las hojas y el render fallarían ahí). Arréglalo primero:", comp.errores));

const entero = proy.duracion; // lo que dura el vídeo entero, aunque se revise solo un tramo
if (hasta < proy.duracion) { proy.duracion = hasta; proy.planos = proy.planos.filter((p) => p.desde < proy.duracion); }
const est = preparar(proy), v = proy.v;
const delante = [apertura, nombreDe(sobre)].filter(Boolean).join("-"), nombre = (n) => join(carpetaRevisar(dir), delante ? `${delante}-${n}` : n);

// --- las hojas
const fs = v.frases.filter((f) => f.inicio < proy.duracion), ts = [];
for (const f of fs) reparto(f.palabras[0].inicio, Math.min(proy.duracion - 0.01, f.palabras[f.palabras.length - 1].fin), 6).forEach((t, i) => ts.push(i ? t : { t, marca: `${f.n}: ${t.toFixed(2)}` }));
const hf = guardar(hoja(proy, est, ts, { ancho: 150, columnas: 6, titulo: "Cada frase, de su primera palabra a la última" }), nombre("frases.jpg"));
const tc = [];
for (const p of proy.planos.slice(1)) for (let k = -9; k <= 6; k++) { const t = p.desde + k / 15; tc.push(k === 0 ? { t, marca: `corte ${p.entrada}` } : t); }
const hc = tc.length ? guardar(hoja(proy, est, tc, { ancho: 120, columnas: 16, titulo: "Cada cambio de plano: de 0,6 s antes a 0,4 s después (a 15 fps)" }), nombre("cortes.jpg")) : null;

// --- los planos y sus cortes
console.log(`${proy.planos.length} planos, ${proy.duracion.toFixed(2)} s:`);
for (const p of proy.planos) console.log(`  ${p.id.padEnd(22)} ${p.desde.toFixed(2).padStart(6)}–${p.hasta.toFixed(2).padEnd(6)} ${(p.hasta - p.desde).toFixed(1).padStart(4)} s  ${p.entrada}${typeof p.desdeDicho === "string" ? `  (en «${p.desdeDicho}»)` : ""}`);
if (comp.datos.mediana !== undefined) console.log(`Cada fotograma: ${(1000 * comp.datos.mediana).toFixed(0)} ms de mediana, ${(1000 * comp.datos.peor).toFixed(0)} ms el más lento (en ${comp.datos.peorEn.toFixed(2)} s).`);
const avisos = [...proy.avisos];
for (const c of cortes(proy, est)) {
  const lugar = `corte ${c.n} (${c.de} → ${c.a}, ${c.t.toFixed(2)} s)`;
  if (c.entrada === "sigue") { if (c.salto.media > 2.5) avisos.push(`${lugar}: es «sigue» pero la imagen salta (${c.salto.media.toFixed(1)}): de un plano al otro no debería notarse nada. Mira ver.mjs corte ${c.n}.`); continue; }
  if (c.alFinal.parte > 0.05 && c.alFinal.media > 3) avisos.push(`${lugar}: lo de antes aún se mueve al cortar (en la última décima cambia el ${(100 * c.alFinal.parte).toFixed(0)} % de la pantalla): se verá cortado a medias. Que su acción acabe y la imagen repose un momento antes del corte, o corta más tarde, en otra palabra.`);
  if (c.salto.media < 20 && c.entrada !== "fundido") avisos.push(`${lugar}: el último fotograma de antes y el primero de después se parecen (${c.salto.media.toFixed(1)}): parece un salto dentro del mismo sitio. Si es el mismo sitio, no cortes: que la cámara vaya de un encuadre al otro dentro de un solo plano. Si es otro sitio, que se vea distinto desde su primer fotograma.`);
  if (c.dura < 1.5) avisos.push(`${lugar}: el plano nuevo dura ${c.dura.toFixed(2)} s; no da tiempo a verlo. Dale una frase entera o déjalo dentro del plano de antes.`);
  if (c.durabaAntes < 1.5) avisos.push(`${lugar}: el plano de antes solo duraba ${c.durabaAntes.toFixed(2)} s.`);
}
avisos.push(...comp.avisos);

// --- lo que se mueve, segundo a segundo
const { linea } = lineaDeMovimiento(proy, est);
console.log(`Segundo a segundo, lo que se mueve (. casi nada, - poco, = algo, # grande, | corte):\n  ${linea}`);
const quietos = [...linea.matchAll(/\.{3,}/g)].map((m) => `${m.index}–${m.index + m[0].length} s`);
if (quietos.length) avisos.push(`Casi quieto ${quietos.join(", ")}. Si no es el respiro de lo que remata, ahí falta algo grande que pase con la voz.`);

// --- el subtítulo
const claros = subtituloSobreClaro(proy, est);
if (claros.length) avisos.push(`El subtítulo va sobre un fondo casi blanco en ${claros.map(([a, b]) => `${a.toFixed(1)}–${b.toFixed(1)} s`).join(", ")}: no se leerá. Oscurece esa franja (un velo suave detrás del subtítulo) o mueve lo claro.`);

// --- el sonido (con otra apertura, los efectos son los del plano de siempre: no se miran)
if (hayEfectos(dir) && !apertura) {
  // los efectos se miran contra el vídeo entero: con --hasta, los de después del tramo no «caen fuera del vídeo»
  const { eventos, avisos: as } = await cargarSonidos(dir, v, entero);
  avisos.push(...as);
  if (!eventos.length) { if (cargarMarca().efectos !== false) avisos.push(`sonidos.js aún no tiene ningún efecto. Si el vídeo los lleva, ponlos (guia/sonido.md); si no, borra sonidos.js.`); }
  else {
    const { pista, usados } = mezclar(eventos, leerVoz(dir, SR));
    const hs = huecos(pista, 2).filter(([a]) => a < proy.duracion).map(([a, b]) => [a, Math.min(b, proy.duracion)]).filter(([a, b]) => b - a > 2);
    if (hs.length) avisos.push(`Sin ningún efecto más de 2 s: ${hs.map(([a, b]) => `${a.toFixed(1)}–${b.toFixed(1)} s`).join(", ")}. Si ahí se mueve algo, le falta su sonido.`);
    const cs = proy.planos.slice(1).filter((p) => p.entrada !== "sigue").map((p) => p.desde);
    for (const e of usados) for (const c of cs) if (Math.abs(e.t - c) < 0.08) avisos.push(`El sonido «${e.sonido}» de ${e.t.toFixed(2)} s cae en el corte de ${c.toFixed(2)} s: el corte no suena; ponlo en lo que se mueve.`);
    if (!existsSync(join(dir, "sonidos", "efectos.wav"))) avisos.push(`Aún no hay pista de efectos: node motor/sonido.mjs ${arg(dir)} (dice qué suena en cada momento; render.mjs también la hace).`);
  }
}

console.log(avisos.length ? "\nPara mirar:\n" + avisos.map((a) => "  - " + a).join("\n") : "\nNada que avisar. Aun así, mira las dos hojas enteras.");
console.log(`\nMira las hojas, a tamaño completo:\n  ${hf}${hc ? "\n  " + hc : ""}\n(${((Date.now() - t0) / 1000).toFixed(0)} s)`);
