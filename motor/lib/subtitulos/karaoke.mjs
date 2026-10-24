// Subtítulos «karaoke»: el bloque entero (hasta tres líneas) a la vista desde que empieza su primera palabra; lo que
// falta por decir, en gris; la palabra que suena se enciende de color y crece un poco; la clave, al sonar, entra en su
// pastilla de color con un rebote y se queda en ella. Borde oscuro fino y sombra suave: se lee sobre cualquier fondo.
// Es un estilo de subtítulos: exporta bloques(), dibuja() y zona() (mira ../subtitulos.mjs).
import { arribaDe, bloqueEn, cabeEn, coloresDe, disponer, empieza, escrito, halo, medidas, rebote, redondo, sale, salir, tiempos, tramo, trocear, zonaDe } from "./comun.mjs";

export const ESTILO = {
  tam: 70, linea: 1.22, hueco: 0.31, ancho: 800, lineas: 3, max: 14, margen: 0.32,
  tinta: "#ffffff", dicha: "#ffd23f", marca: "#2f7cf6",
  apagada: 0.52, // lo que falta por decir: blanco a medias sobre oscuro, un gris que es igual en cualquier fondo
};
const E = ESTILO;

const opciones = (conf) => ({
  ...medidas(conf, E, conf.posicion), hueco: E.hueco, linea: E.linea, lineas: E.lineas,
  letra: (x) => `800 ${x.toFixed(2)}px Figtree`, crece: (w) => (w.clave ? 1.06 : 1), holgura: (w) => (w.clave ? 0.2 : 0),
  texto: (w) => escrito(w.texto, { mayusculas: !!conf.mayusculas }),
});

// Bloques de hasta tres líneas, sin mezclar frases; cortan antes tras un signo si ya llevan cuatro palabras.
export function bloques(palabras, duracion, conf = {}) {
  const op = opciones(conf), cabe = cabeEn(op, E.lineas);
  const bs = tiempos(trocear(palabras, { cabe, max: E.max, signo: 4, pausa: 0.7 }), duracion);
  for (const b of bs) b.sitio = disponer(b.palabras, op);
  return bs;
}

export function dibuja(g, t, bs, conf = {}) {
  const ahora = bloqueEn(bs, t);
  if (!ahora) return;
  const { b, al } = ahora, d = b.sitio, c = coloresDe(conf, E), y0 = arribaDe(conf.posicion, d.alto), tam = d.tam;
  const entra = 0.4 + 0.6 * salir(tramo(t, b.inicio, b.inicio + 0.1)); // el bloque entra con un fundido corto
  let i = -1; // la que suena (o la última dicha)
  b.palabras.forEach((w, k) => { if (t >= sale(w)) i = k; });
  // cómo está cada palabra: dicha, encendida (luz), su tamaño (e) y, la clave, su pastilla (p)
  const ps = b.palabras.map((w, k) => {
    const s = d.sitios[k], dicha = k <= i, luz = k === i ? salir(tramo(t, sale(w), sale(w) + 0.08)) : 0;
    const p = w.clave && dicha ? tramo(t, sale(w), sale(w) + 0.22) : -1;
    const crece = Math.min(0.06, (0.12 * tam) / s.w); // una palabra larga crece menos: no pisa a las de al lado
    return { s, y: y0 + s.cy, dicha, luz, p, e: 1 + crece * (p >= 0 ? rebote(p, 2.2) : luz) };
  });
  const pastilla = (gp, q) => {
    const e = 0.55 + 0.45 * rebote(q.p, 2.2), pw = q.s.w + 0.3 * tam * e, ph = 1.1 * tam * (0.8 + 0.2 * e);
    redondo(gp, q.s.cx - pw / 2, q.y - ph / 2, pw, ph, 0.24 * tam);
  };
  const letra = (gp, q, pinta) => { gp.save(); gp.translate(q.s.cx, q.y); gp.scale(q.e, q.e); pinta(q.s.texto); gp.restore(); };
  const acaba = empieza(g);
  g.globalAlpha = al * entra;
  // la sombra suave de todo el bloque
  g.font = d.letra;
  halo(g, (gr) => {
    for (const q of ps) {
      if (q.p >= 0) { pastilla(g, q); g.lineWidth = gr; g.stroke(); }
      else letra(g, q, (s) => { g.lineWidth = 0.13 * tam + gr; g.strokeText(s, 0, 0); });
    }
  }, { ancho: 0.24 * tam, al: 0.42, dy: 0.04 * tam });
  // la pastilla de la clave
  for (const q of ps) if (q.p >= 0) { g.globalAlpha = al * Math.min(1, q.p * 2.2); pastilla(g, q); g.fillStyle = c.marca; g.fill(); }
  // el borde oscuro y la letra; lo que falta por decir, sobre oscuro
  g.font = d.letra; g.lineWidth = 0.13 * tam; g.strokeStyle = "rgba(0,0,0,0.75)";
  for (const q of ps) letra(g, q, (s) => {
    g.globalAlpha = al * entra;
    if (q.p < 0) g.strokeText(s, 0, 0);
    if (!q.dicha) { g.fillStyle = "rgba(0,0,0,0.85)"; g.fillText(s, 0, 0); g.globalAlpha = al * entra * E.apagada; }
    g.fillStyle = c.tinta; g.fillText(s, 0, 0);
    if (q.luz > 0 && q.p < 0) { g.globalAlpha = al * q.luz; g.fillStyle = c.dicha; g.fillText(s, 0, 0); }
  });
  acaba();
}

// Dónde caen: las tres líneas.
export function zona(conf = {}) {
  const m = medidas(conf, E, conf.posicion);
  return zonaDe(conf.posicion, m.ancho, m.alto);
}
