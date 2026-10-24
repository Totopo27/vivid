// Subtítulos «minimal»: limpios y más pequeños, en dos líneas como mucho y sin cajas. Cada palabra aparece al decirse
// con un fundido que sube un poco; las ya dichas se quedan en blanco. Una sombra suave y un velo oscuro que casi no se
// ve los separan de un fondo claro. La clave, en su color, con una raya fina que se dibuja debajo de izquierda a
// derecha. Para vídeos elegantes o de datos, cuando la imagen manda.
// Es un estilo de subtítulos: exporta bloques(), dibuja() y zona() (mira ../subtitulos.mjs).
import { arribaDe, bloqueEn, cabeEn, coloresDe, disponer, empieza, escrito, halo, medidas, sale, salir, suave, tiempos, tramo, trocear, zonaDe } from "./comun.mjs";

export const ESTILO = {
  tam: 54, linea: 1.32, hueco: 0.28, ancho: 760, lineas: 2, max: 10, margen: 0.4,
  tinta: "#ffffff", dicha: "#ffffff", marca: "#ffd27a",
};
const E = ESTILO;

const opciones = (conf) => ({
  ...medidas(conf, E, conf.posicion), hueco: E.hueco, linea: E.linea, lineas: E.lineas,
  letra: (x) => `700 ${x.toFixed(2)}px Figtree`, texto: (w) => escrito(w.texto, { mayusculas: !!conf.mayusculas }),
});

// Bloques de dos líneas como mucho, sin mezclar frases; cortan tras un signo si ya llevan tres palabras.
export function bloques(palabras, duracion, conf = {}) {
  const op = opciones(conf), cabe = cabeEn(op, E.lineas);
  const bs = tiempos(trocear(palabras, { cabe, max: E.max, signo: 3, pausa: 0.6 }), duracion);
  for (const b of bs) b.sitio = disponer(b.palabras, op);
  return bs;
}

export function dibuja(g, t, bs, conf = {}) {
  const ahora = bloqueEn(bs, t);
  if (!ahora) return;
  const { b, al } = ahora, d = b.sitio, c = coloresDe(conf, E), y0 = arribaDe(conf.posicion, d.alto), tam = d.tam;
  const acaba = empieza(g);
  // el velo: una sombra ancha detrás de las líneas, que solo se nota sobre un fondo claro
  const filas = [];
  for (const s of d.sitios) { const f = (filas[s.fila] ||= { l: s.x, r: s.x + s.w }); f.l = Math.min(f.l, s.x); f.r = Math.max(f.r, s.x + s.w); }
  const vela = al * salir(tramo(t, b.inicio, b.inicio + 0.25));
  filas.forEach((f, j) => {
    if (!f) return;
    const cy = y0 + (j + 0.5) * d.linea, rx = (f.r - f.l) / 2 + 0.9 * tam, ry = 0.95 * tam, cx = (f.l + f.r) / 2;
    g.save();
    g.translate(cx, cy); g.scale(rx / ry, 1);
    const v = g.createRadialGradient(0, 0, 0, 0, 0, ry);
    v.addColorStop(0, "rgba(0,0,0,0.36)"); v.addColorStop(0.55, "rgba(0,0,0,0.22)"); v.addColorStop(1, "rgba(0,0,0,0)");
    g.globalAlpha = vela; g.fillStyle = v; g.fillRect(-ry, -ry, 2 * ry, 2 * ry);
    g.restore();
  });
  // cada palabra ya dicha: dónde está y cuánto ha entrado (u); sube un poco al aparecer
  const ps = [];
  b.palabras.forEach((w, k) => {
    const s0 = sale(w), u = tramo(t, s0, s0 + 0.22);
    if (u <= 0) return;
    const s = d.sitios[k], sig = b.palabras[k + 1];
    ps.push({ w, s, s0, y: y0 + s.cy + (1 - salir(u)) * 0.22 * tam, al: al * salir(u), dicha: sig && t >= sale(sig) });
  });
  g.font = d.letra;
  // dos sombras: una ancha y suave, otra pegada al borde de la letra
  const sombra = (ancho, capas, fuerza, dy) => halo(g, (gr, a) => {
    g.lineWidth = gr;
    for (const q of ps) { g.globalAlpha = a * q.al; g.strokeText(q.s.texto, q.s.cx, q.y); }
  }, { ancho, capas, al: fuerza, dy });
  sombra(0.42 * tam, 7, 0.4, 0.05 * tam);
  sombra(0.07 * tam, 3, 0.45, 0.02 * tam);
  for (const q of ps) {
    g.globalAlpha = q.al;
    g.fillStyle = q.w.clave ? c.marca : q.dicha ? c.dicha : c.tinta;
    g.fillText(q.s.texto, q.s.cx, q.y);
    if (q.w.clave) {
      // la raya de la clave, que se dibuja de izquierda a derecha
      const r = suave(tramo(t, q.s0 + 0.1, q.s0 + 0.45)), h = Math.max(3, 0.065 * tam);
      if (r > 0) {
        g.fillStyle = "rgba(0,0,0,0.35)"; g.fillRect(q.s.x, q.y + 0.5 * tam + 2, q.s.w * r, h);
        g.fillStyle = c.marca; g.fillRect(q.s.x, q.y + 0.5 * tam, q.s.w * r, h);
      }
    }
  }
  acaba();
}

// Dónde caen: dos líneas.
export function zona(conf = {}) {
  const m = medidas(conf, E, conf.posicion);
  return zonaDe(conf.posicion, m.ancho, m.alto);
}
