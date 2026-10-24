// Unos fotogramas dibujados en un hilo nuevo, como los dibuja el render (cada hilo empieza de cero, a mitad del
// vídeo): sus huellas, para ver que salen igual que en un hilo que ya ha dibujado otros. Si no, algo se guarda la
// primera vez que se dibuja, con el t de ese momento (lib/comprobar.mjs, enHiloNuevo).
import { createHash } from "node:crypto";
import { parentPort, workerData } from "node:worker_threads";
import { dibujar, preparar } from "./cuadro.mjs";
import { abrir } from "./proyecto.mjs";

const { dir, ts, apertura, estilo } = workerData;
const proy = await abrir(dir, { apertura, estilo }), est = preparar(proy);
parentPort.postMessage(ts.map((t) => createHash("sha1").update(dibujar(proy, est, t).data()).digest("hex")));
