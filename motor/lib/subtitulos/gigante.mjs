// Subtítulos «gigante»: una o dos palabras cada vez, enormes, en mayúsculas y una encima de otra. Cada una entra de golpe
// al decirse (crece pasándose un poco y vuelve) con un relieve oscuro debajo y una sombra ancha que la despegan de
// cualquier fondo. La clave, en su color, algo más grande y con un destello al entrar. Para hooks y vídeos con ritmo;
// mejor en el centro o arriba.
// Es un estilo de subtítulos: exporta bloques(), dibuja() y zona() (mira ../subtitulos.mjs).
import { arribaDe, atada, bloqueEn, cabeEn, coloresDe, corrido, disponer, empieza, escrito, halo, medidas, rebote, sale, salir, tiempos, tramo, trocear, zonaDe } from "./comun.mjs";

export const ESTILO = {
  tam: 185, linea: 0.98, hueco: 0.22, ancho: 820, lineas: 2, max: 2, margen: 0.25,
  // arriba, algo más abajo (las tildes de las mayúsculas, QUÉ o MURIÓ, suben mucho a este tamaño); en el centro, algo
  // más arriba, para que lo de debajo no llegue a los botones de Instagram
  corre: { arriba: 0.16, centro: -0.22 },
  tinta: "#ffffff", marca: "#ffd21f", relieve: "#0b0d12",
};
const E = ESTILO;

const sitio = (conf) => conf.posicion || "centro";
const opciones = (conf) => ({
  ...medidas(conf, E, sitio(conf)), hueco: E.hueco, linea: E.linea, lineas: E.lineas, apiladas: true,
  letra: (x) => `800 ${x.toFixed(2)}px Figtree`, crece: (w) => (w.clave ? 1.15 : 1.06), // lo que crece al entrar
  texto: (w) => escrito(w.texto, { mayusculas: conf.mayusculas !== false, limpio: true }),
});

// De una en una o de dos en dos (una encima de otra, cada una centrada); la clave va sola (o con el artículo de delante:
// «EL SALERO»), y se corta tras cualquier signo o una pausa corta.
export function bloques(palabras, duracion, conf = {}) {
  const op = opciones(conf), cabe = cabeEn(op, E.lineas);
  const corta = (ps, w) => ps[ps.length - 1].clave || (w.clave && !atada(ps[ps.length - 1]));
  const bs = tiempos(trocear(palabras, { cabe, max: E.max, signo: 1, pausa: 0.25, corta, parejos: false }), duracion, 0.4);
  for (const b of bs) b.sitio = disponer(b.palabras, op);
  return bs;
}

export function dibuja(g, t, bs, conf = {}) {
  const ahora = bloqueEn(bs, t);
  if (!ahora) return;
  const { b, al } = ahora, d = b.sitio, c = coloresDe(conf, E), tam = d.tam;
  const y0 = arribaDe(sitio(conf), d.alto) + corrido(E, sitio(conf), tam);
  // cada palabra ya dicha: dónde está, cuánto ha entrado (u) y su tamaño (e); baja un poco al llegar
  const ps = [];
  b.palabras.forEach((w, k) => {
    const s0 = sale(w), u = tramo(t, s0, s0 + 0.2);
    if (t < s0) return;
    const s = d.sitios[k], e = (0.5 + 0.5 * rebote(u, 2.6)) * (w.clave ? 1.08 : 1);
    ps.push({ s, u, e, clave: w.clave, y: y0 + s.cy - (1 - salir(u)) * 0.07 * tam, al: al * Math.min(1, 0.3 + u * 3) });
  });
  if (!ps.length) return;
  const letra = (gp, q, pinta) => { gp.save(); gp.translate(q.s.cx, q.y); gp.scale(q.e, q.e); pinta(q.s.texto); gp.restore(); };
  const acaba = empieza(g);
  g.font = d.letra;
  // la sombra ancha, de todas a la vez
  halo(g, (gr, a) => {
    for (const q of ps) { g.globalAlpha = a * q.al; letra(g, q, (s) => { g.lineWidth = gr; g.strokeText(s, 0, 0.05 * tam); }); }
  }, { ancho: 0.22 * tam, al: 0.5, dy: 0.04 * tam });
  g.strokeStyle = c.relieve; g.lineWidth = 0.075 * tam;
  for (const q of ps) {
    g.globalAlpha = q.al;
    // el relieve: la letra repetida hacia abajo, con un borde oscuro
    letra(g, q, (s) => { for (let p = 0.07; p > 0; p -= 0.0175) g.strokeText(s, 0, p * tam); g.strokeText(s, 0, 0); });
    // el destello de la clave al entrar
    if (q.clave && q.u < 1) {
      halo(g, (gr) => letra(g, q, (s) => { g.lineWidth = gr; g.strokeText(s, 0, 0); }), { ancho: 0.2 * tam, capas: 6, color: c.marca, al: 0.6 * q.al * (1 - q.u) });
    }
    g.globalAlpha = q.al;
    g.fillStyle = q.clave ? c.marca : c.tinta;
    letra(g, q, (s) => g.fillText(s, 0, 0));
  }
  acaba();
}

// Dónde caen: dos líneas enormes (donde diga su posición; si no dice ninguna, en el centro, aunque la marca de
// siempre las pone arriba: para el centro, "posicion": "centro").
export function zona(conf = {}) {
  const m = medidas(conf, E, sitio(conf)), z = zonaDe(sitio(conf), m.ancho, m.alto);
  return { ...z, y: Math.round(z.y + corrido(E, sitio(conf), m.tam)) };
}
