// Dibuja el fotograma del segundo t: el plano que toca, el acabado de su look y, encima, los subtítulos y la firma.
import { createCanvas } from "@napi-rs/canvas";
import { ALTO, ANCHO } from "./comun.mjs";
import { aplicarLook, look } from "../kit/looks/index.js";
import { dibujarFirma } from "./firma.mjs";
import { bloques, dibujarSubtitulos } from "./subtitulos.mjs";

export const FUNDIDO = 0.3;

export function preparar(proy) {
  const lienzo = createCanvas(ANCHO, ALTO), g = lienzo.getContext("2d");
  const aparte = createCanvas(ANCHO, ALTO);
  const conf = proy.estilo.subtitulos, subs = bloques(proy.v.palabras, proy.duracion, conf);
  const elLook = look(proy.estilo.look), aux = elLook.acabado ? createCanvas(ANCHO, ALTO) : null;
  return { lienzo, g, aparte, aux, subs, conf, look: elLook.nombre, firma: proy.estilo.firma || null };
}

export function planoEn(proy, t) {
  const ps = proy.planos;
  let i = 0;
  while (i + 1 < ps.length && t >= ps[i + 1].desde) i++;
  return i;
}

function limpiar(g) {
  limpiarEstado(g);
  g.fillStyle = "#000000"; g.fillRect(0, 0, ANCHO, ALTO);
}

function limpiarEstado(g) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1; g.globalCompositeOperation = "source-over"; g.filter = "none";
  g.shadowBlur = 0; g.shadowColor = "rgba(0,0,0,0)"; g.shadowOffsetX = 0; g.shadowOffsetY = 0;
  g.setLineDash([]); g.lineCap = "butt"; g.lineJoin = "miter";
}

// Un error al dibujar dice qué parte falló y en qué segundo (e.parte, e.segundo; y delante, en el mensaje).
function marcar(e, parte, t) {
  if (!(e instanceof Error)) e = new Error(String(e));
  if (!e.parte) { e.parte = parte; e.segundo = t; e.message = `${parte}, segundo ${t.toFixed(3)}: ${e.message}`; }
  return e;
}

function plano(p, g, t) {
  limpiar(g);
  g.save();
  try { p.dibuja(g, t); }
  catch (e) { throw marcar(e, `plano ${p.id}`, t); }
  finally { g.restore(); }
}

// opciones: { subtitulos: false } para verlo sin ellos (ni la firma: lo que se mide es la imagen).
export function dibujar(proy, est, t, opciones = {}) {
  const i = planoEn(proy, t), p = proy.planos[i];
  plano(p, est.g, t);
  if (p.entrada === "fundido" && i > 0 && t < p.desde + FUNDIDO) {
    const ga = est.aparte.getContext("2d");
    plano(proy.planos[i - 1], ga, t);
    const u = (t - p.desde) / FUNDIDO, k = u * u * (3 - 2 * u);
    // lo de antes encima, apagándose
    est.g.globalAlpha = 1 - k; est.g.drawImage(est.aparte, 0, 0); est.g.globalAlpha = 1;
  }
  if (est.aux) {
    limpiarEstado(est.g);
    try { aplicarLook(est.g, t, est.aux, est.look); } catch (e) { throw marcar(e, `el acabado del look «${est.look}»`, t); }
  }
  if (opciones.subtitulos !== false) {
    try { dibujarSubtitulos(est.g, t, est.subs, est.conf); } catch (e) { throw marcar(e, `los subtítulos «${est.conf.estilo}»`, t); }
    if (est.firma) { try { dibujarFirma(est.g, est.firma); } catch (e) { throw marcar(e, "la firma", t); } }
  }
  return est.lienzo;
}
