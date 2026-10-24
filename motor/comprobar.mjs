#!/usr/bin/env node
// comprobar.mjs: lo que se sabe que sale mal, medido sin renderizar (revisar.mjs lo hace también, con sus hojas).
import { argumentos, ayuda, carpetaProyecto, fallo, numero } from "./lib/comun.mjs";
import { avisoHiloNuevo, comprobar, enHiloNuevo } from "./lib/comprobar.mjs";
import { estiloPedido } from "./lib/marca.mjs";
import { abrir } from "./lib/proyecto.mjs";
import { juntar } from "./lib/validar.mjs";

ayuda(`
node motor/comprobar.mjs <proyecto> [--fps N] [--hasta s] [--apertura nombre] [--look nombre] [--subtitulos estilo]

Dibuja el vídeo entero a 4 fps (--fps) sin renderizarlo y avisa de:
  - un fotograma que no se puede dibujar (el render fallaría ahí): qué plano y en qué segundo,
  - algo que no sale igual dibujado dos veces en otro orden (guarda estado entre fotogramas),
  - Math.random, Date, performance, setTimeout, fetch o escribir archivos en video/ o sonidos.js,
  - lo que tarda cada fotograma (la mediana, menos de 0,1 s),
  - el primer segundo casi quieto (el hook se mueve desde el fotograma 0),
  - más de 2 s casi sin color o casi a oscuras,
  - un vídeo que se sale de la duración de la marca (30-60 s si no dice otra), una frase que se dice deprisa,
  - texto de los planos donde lo tapa Instagram (arriba, abajo o bajo los botones).
Son dónde mirar, no una nota. Si algo no se puede dibujar, sale con error.
`);

const { sueltos, op } = argumentos();
const dir = carpetaProyecto(sueltos[0]);
if (op.apertura === true) fallo("--apertura necesita el nombre de la apertura, por ejemplo --apertura 01-tunel.");
const proy = await abrir(dir, { apertura: op.apertura ? String(op.apertura) : null, estilo: estiloPedido(op) });
const fps = numero(op, "fps", 4), hasta = numero(op, "hasta", proy.duracion);
if (!(fps > 0 && fps <= 30)) fallo("--fps va de 1 a 30 (4 basta para ver que todo se dibuja).");
const t0 = Date.now(), r = comprobar(proy, { fps, hasta });
const avisos = [...proy.avisos, ...r.avisos];
if (!r.errores.length) { const a = avisoHiloNuevo(proy, await enHiloNuevo(proy, { apertura: op.apertura ? String(op.apertura) : null, estilo: estiloPedido(op), hasta })); if (a) avisos.push(a); }
if (r.datos.mediana !== undefined) console.log(`Cada fotograma: ${(1000 * r.datos.mediana).toFixed(0)} ms de mediana, ${(1000 * r.datos.peor).toFixed(0)} ms el más lento (en ${r.datos.peorEn.toFixed(2)} s).`);
console.log(avisos.length ? "Para mirar:\n" + avisos.map((a) => "  - " + a).join("\n") : "Nada que avisar.");
console.log(`(${((Date.now() - t0) / 1000).toFixed(0)} s)`);
if (r.errores.length) fallo(juntar("No todo se puede dibujar (el render fallaría):", r.errores));
