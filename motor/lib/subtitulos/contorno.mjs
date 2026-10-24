// Subtítulos «contorno», los de TikTok y CapCut: letra muy gruesa en mayúsculas con un borde negro grueso y una sombra
// dura debajo; dos o tres palabras cada vez, en una o dos líneas, que saltan al decirse. La clave, en amarillo, un poco
// más grande e inclinada. Se lee sobre cualquier fondo. Para vídeos de ritmo, listas y vídeos de gente.
// Es un estilo de subtítulos: exporta bloques(), dibuja() y zona() (mira ../subtitulos.mjs).
import { arribaDe, bloqueEn, cabeEn, coloresDe, disponer, empieza, escrito, medidas, rebote, sale, tiempos, tramo, trocear, zonaDe } from "./comun.mjs";

export const ESTILO = {
  tam: 96, linea: 1.12, hueco: 0.36, ancho: 800, lineas: 2, max: 4, margen: 0.28, letras: 24,
  tinta: "#ffffff", marca: "#ffe234", borde: "#000000",
};
const E = ESTILO;

const opciones = (conf) => ({
  ...medidas(conf, E, conf.posicion), hueco: E.hueco, linea: E.linea, lineas: E.lineas,
  letra: (x) => `800 ${x.toFixed(2)}px Figtree`, crece: (w) => (w.clave ? 1.14 : 1), // la clave, más grande
  texto: (w) => escrito(w.texto, { mayusculas: conf.mayusculas !== false, limpio: true }),
});

// Bloques de cuatro palabras (o 24 letras) como mucho, en dos líneas, sin mezclar frases; cortan tras cada signo.
export function bloques(palabras, duracion, conf = {}) {
  const op = opciones(conf), letras = (ws) => ws.reduce((s, w) => s + w.texto.length + 1, -1);
  const caben = cabeEn(op, E.lineas), cabe = (ws) => letras(ws) <= E.letras && caben(ws);
  const bs = tiempos(trocear(palabras, { cabe, max: E.max, signo: 1, pausa: 0.45 }), duracion, 0.5);
  for (const b of bs) b.sitio = disponer(b.palabras, op);
  return bs;
}

export function dibuja(g, t, bs, conf = {}) {
  const ahora = bloqueEn(bs, t);
  if (!ahora) return;
  const { b, al } = ahora, d = b.sitio, c = coloresDe(conf, E), y0 = arribaDe(conf.posicion, d.alto), tam = d.tam;
  const acaba = empieza(g);
  g.font = d.letra;
  // cada palabra salta al decirse (de pequeña, pasándose un poco); la clave, más grande e inclinada
  b.palabras.forEach((w, k) => {
    const s0 = sale(w), u = tramo(t, s0, s0 + 0.16);
    if (t < s0) return;
    const s = d.sitios[k], clave = w.clave, e = (0.7 + 0.3 * rebote(u, 3)) * (clave ? 1.1 : 1);
    g.save();
    g.translate(s.cx, y0 + s.cy); g.scale(e, e);
    if (clave) g.rotate(-0.045);
    g.globalAlpha = al * Math.min(1, 0.3 + u * 4);
    // la sombra dura de debajo y el borde grueso
    g.shadowColor = "rgba(0,0,0,0.6)"; g.shadowBlur = 0; g.shadowOffsetY = 0.08 * tam;
    g.strokeStyle = c.borde; g.lineWidth = 0.2 * tam;
    g.strokeText(s.texto, 0, 0);
    g.shadowColor = "rgba(0,0,0,0)"; g.shadowBlur = 0; g.shadowOffsetY = 0;
    g.fillStyle = clave ? c.marca : c.tinta; g.fillText(s.texto, 0, 0);
    g.restore();
  });
  acaba();
}

// Dónde caen: dos líneas.
export function zona(conf = {}) {
  const m = medidas(conf, E, conf.posicion);
  return zonaDe(conf.posicion, m.ancho, m.alto);
}
