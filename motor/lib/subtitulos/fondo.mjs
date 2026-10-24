// Subtítulos «fondo», los del texto de TikTok: letra oscura sobre una banda blanca de esquinas redondas, una por línea.
// La banda se alarga hacia la derecha a medida que se dicen las palabras, como si se escribiera; la clave, en su color.
// Es el que mejor se lee sobre una imagen muy clara o muy cargada, porque trae su propio fondo. Para vídeos de
// explicar, de noticias o de listas.
// Es un estilo de subtítulos: exporta bloques(), dibuja() y zona() (mira ../subtitulos.mjs).
import { arribaDe, bloqueEn, cabeEn, coloresDe, disponer, empieza, escrito, halo, medidas, redondo, sale, salir, tiempos, tramo, trocear, zonaDe } from "./comun.mjs";

export const ESTILO = {
  tam: 62, linea: 1.3, hueco: 0.27, ancho: 760, lineas: 2, max: 9, margen: 0.6,
  tinta: "#121317", dicha: "#121317", marca: "#e8304f", fondo: "#ffffff",
};
const E = ESTILO;

const opciones = (conf) => ({
  ...medidas(conf, E), hueco: E.hueco, linea: E.linea, lineas: E.lineas,
  letra: (x) => `800 ${x.toFixed(2)}px Figtree`, texto: (w) => escrito(w.texto, { mayusculas: !!conf.mayusculas }),
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
  const px = 0.34 * tam, alto = 1.32 * tam; // lo que sobra la banda por los lados y su alto
  // cada línea: dónde empieza y hasta dónde llega lo ya dicho (la banda se alarga con cada palabra)
  const filas = [];
  b.palabras.forEach((w, k) => {
    const s = d.sitios[k], f = (filas[s.fila] ||= { l: s.x, r: s.x, cy: y0 + s.cy, desde: sale(w) });
    const u = salir(tramo(t, sale(w), sale(w) + 0.12));
    if (u > 0) f.r = Math.max(f.r, s.x + s.w * u);
  });
  const bandas = filas.filter((f) => t >= f.desde).map((f) => {
    const l = f.l - px, w = f.r - f.l + 2 * px;
    return { x: l, y: f.cy - alto / 2, w, h: alto, al: salir(tramo(t, f.desde, f.desde + 0.08)) };
  });
  const acaba = empieza(g);
  g.globalAlpha = al;
  // su sombra, suave y corta, y la banda
  halo(g, (gr, a) => {
    g.lineWidth = gr;
    for (const q of bandas) { g.globalAlpha = a * q.al; redondo(g, q.x, q.y, q.w, q.h, 0.3 * tam); g.stroke(); }
  }, { ancho: 0.2 * tam, al: 0.35, dy: 0.06 * tam });
  for (const q of bandas) { g.globalAlpha = al * q.al; redondo(g, q.x, q.y, q.w, q.h, 0.3 * tam); g.fillStyle = c.fondo; g.fill(); }
  // las palabras, cada una al decirse
  g.font = d.letra;
  b.palabras.forEach((w, k) => {
    const u = tramo(t, sale(w), sale(w) + 0.1);
    if (u <= 0) return;
    const s = d.sitios[k], sig = b.palabras[k + 1], dicha = sig && t >= sale(sig);
    g.globalAlpha = al * salir(u);
    g.fillStyle = w.clave ? c.marca : dicha ? c.dicha : c.tinta;
    g.fillText(s.texto, s.cx, y0 + s.cy + 0.03 * tam);
  });
  acaba();
}

// Dónde caen: dos líneas, con su banda.
export function zona(conf = {}) {
  const m = medidas(conf, E), z = zonaDe(conf.posicion, m.ancho, m.alto), px = 0.34 * m.tam;
  return { x: z.x - Math.round(px), y: z.y, w: z.w + Math.round(2 * px), h: z.h };
}
