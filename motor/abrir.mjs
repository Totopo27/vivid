#!/usr/bin/env node
// abrir.mjs: abre para el creador lo que hay que enseñarle (una lámina, una hoja, el vídeo) con el programa de su
// sistema, en Mac, Windows, Linux o WSL. Si no se puede (un Linux sin escritorio), dice la ruta para abrirlo a mano.
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { abrirEnSistema, argumentos, ayuda, corta, fallo } from "./lib/comun.mjs";

ayuda(`
node motor/abrir.mjs <archivo o dirección> [más...]

Abre cada uno con lo que use este ordenador: las imágenes con su visor, los vídeos con su reproductor y las direcciones
(https://...) con el navegador. Por ejemplo: node motor/abrir.mjs guia/muestras/looks.jpg guia/muestras/subtitulos.jpg
`);

const { sueltos } = argumentos();
if (!sueltos.length) fallo("Falta qué abrir: node motor/abrir.mjs guia/muestras/looks.jpg");
let mal = 0;
for (const x of sueltos) {
  const web = /^https?:\/\//i.test(x), ruta = web ? x : resolve(x);
  if (!web && !existsSync(ruta)) { console.log(`✗ no existe ${x}`); mal++; continue; }
  if (await abrirEnSistema(ruta)) console.log(`abierto: ${web ? ruta : corta(ruta)}`);
  else { console.log(`✗ no he podido abrirlo aquí: ábrelo a mano en ${ruta}`); mal++; }
}
process.exit(mal ? 1 : 0);
