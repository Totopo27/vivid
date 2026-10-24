// Un trozo del render, en su propio hilo: dibuja los fotogramas de `primero` a `ultimo` y los guarda en un mp4. Si algo
// falla, para su ffmpeg y le dice al render en qué segundo y en qué parte (el plano, el look, los subtítulos).
import { parentPort, workerData } from "node:worker_threads";
import { codificador, lugarDelError } from "./comun.mjs";
import { dibujar, preparar } from "./cuadro.mjs";
import { abrir } from "./proyecto.mjs";

const { dir, primero, ultimo, fps, salida, calidad, apertura, estilo } = workerData;
const proy = await abrir(dir, { apertura, estilo }), est = preparar(proy), cod = codificador(salida, fps, calidad);
parentPort.postMessage({ pid: cod.pid });
let f = primero;
try {
  for (; f < ultimo; f++) {
    const lienzo = dibujar(proy, est, f / fps);
    await cod.escribe(Buffer.from(lienzo.data())); // una copia: el lienzo se vuelve a usar en el fotograma siguiente
    if ((f - primero) % 30 === 0) parentPort.postMessage({ hechos: f - primero });
  }
  await cod.cierra();
  parentPort.postMessage({ fin: true, hechos: ultimo - primero, pid: cod.pid });
} catch (e) {
  cod.mata();
  parentPort.postMessage({ error: { mensaje: e?.message || String(e), parte: e?.parte || null, segundo: f / fps, donde: lugarDelError(e, dir) } });
}
