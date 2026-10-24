// Escala: lo que hace que un número enorme se sienta. Una cifra gigante en relieve que corre hasta su valor; una
// cuadrícula de miles (o millones) de fichas con una sola que destaca, que la cámara puede abrir desde muy cerca hasta
// verlas todas; torres de luz que crecen para comparar cantidades; una pila de monedas (o billetes, o cajas) que sube
// contándolas; y una fila de cosas de tamaños muy distintos, de la más pequeña a la enorme, que la cámara recorre.
// Lo pesado (las fichas y sus teselas, las texturas) se hace una vez y con semilla.
import { azar, fmt, lienzo, mez, pto, res, suave, tramo, uni } from "./base.js";
import { mira, proyecta } from "./camara.js";
import { estrella, planeta, roca, tierra } from "./cuerpos.js";
import { brillo } from "./luz.js";
import { globo } from "./mapa.js";
import { pastilla } from "./texto.js";
import { manchas, red2 } from "./texturas.js";

// Los colores van como "r,g,b" (como en el kit) o como [r, g, b] para hacer cuentas con ellos.
const aRgb = (c) => c.split(",").map(Number);
const rgb = (c, k = 1, mas = 0) => `rgb(${c.map((v) => Math.max(0, Math.min(255, Math.round(v * k + mas)))).join(",")})`;
const hacia = (c, b, u) => c.map((v, i) => v + (b[i] - v) * u);
const pasa = (u) => Math.max(0, Math.min(1, u));

// Deja g como estaba también en sus colores: el restore() de @napi-rs/canvas no devuelve fillStyle ni strokeStyle.
const intacto = (fn) => function (g, ...a) { const f = g.fillStyle, s = g.strokeStyle; try { return fn(g, ...a); } finally { g.fillStyle = f; g.strokeStyle = s; } };

// ---------------------------------------------------------------- la cifra gigante
// Una cifra enorme en relieve, con su brillo, centrada en (x, y), que corre de desde hasta valor mientras u va de 0
// a 1 (llega rápido y frena al final). Escrita como en el idioma del vídeo (k.fmt). Cada cifra ocupa siempre el
// mismo ancho, para que el número no baile mientras corre.
//   desde (0) · dec: decimales · unidad: lo que va debajo ("personas", "km") · prefijo ("+", "x") · color "r,g,b" ·
//   tam: el alto de las cifras (250) · ancho: lo más ancha que puede ser (se encoge si no cabe) · log: corre por
//   órdenes de magnitud (para ir de 1 a mil millones) · brilla: un destello de 0 a 1 (k.pulso al llegar) · al.
// Devuelve la caja que ocupa { x0, y0, x1, y1 }.
export const cifraGigante = intacto(function cifraGigante(g, x, y, valor, u = 1, op = {}) {
  const al = op.al ?? 1, desde = op.desde ?? 0, dec = op.dec ?? 0, col = aRgb(op.color || "255,214,110"), pre = op.prefijo || "", br = op.brilla || 0;
  const e = 1 - Math.pow(1 - pasa(u), 3), v = u >= 1 ? valor : op.log && desde > 0 ? desde * Math.pow(valor / desde, e) : desde + (valor - desde) * e;
  const texto = pre + fmt(v, dec, op.idioma), final = pre + fmt(valor, dec, op.idioma);
  const A = g.globalAlpha;
  g.save();
  g.globalAlpha = A * al;
  // cada cifra en su casilla del mismo ancho; los puntos y comas, más estrechos
  let tam = op.tam ?? 250;
  const mide = (s, t) => { g.font = `800 ${t}px Figtree`; const dw = Math.max(...[..."0123456789"].map((d) => g.measureText(d).width)); return { dw, w: [...s].reduce((a, ch) => a + (/\d/.test(ch) ? dw : g.measureText(ch).width), 0) }; };
  const mf = mide(final, tam), maxw = op.ancho ?? 980;
  if (mf.w > maxw) tam *= maxw / mf.w;
  const { dw, w } = mide(texto, tam), base = y + tam * 0.36, x0 = x - w / 2, tu = op.unidad ? tam * 0.27 : 0;
  brillo(g, x, y, Math.max(w, tam) * 1.7, op.color || "255,214,110", 0.3 + 0.45 * br);
  const casillas = []; let ac = x0;
  for (const ch of texto) { const an = /\d/.test(ch) ? dw : g.measureText(ch).width; casillas.push([ch, ac + an / 2]); ac += an; }
  g.textAlign = "center"; g.textBaseline = "alphabetic";
  // el relieve: la cifra repetida hacia atrás, cada vez más oscura
  const N = 12, sx = tam * 0.0055, sy = tam * 0.0095;
  for (let i = N; i >= 1; i--) {
    g.fillStyle = rgb(col, 0.12 + 0.3 * (1 - i / N));
    for (const [ch, cx] of casillas) g.fillText(ch, cx + i * sx, base + i * sy);
  }
  // la cara: clara arriba, de su color abajo, con su brillo alrededor
  const cara = g.createLinearGradient(0, base - tam * 0.74, 0, base);
  cara.addColorStop(0, rgb(hacia(col, [255, 255, 255], 0.7 + 0.3 * br))); cara.addColorStop(0.45, rgb(hacia(col, [255, 255, 255], 0.25 * br))); cara.addColorStop(1, rgb(col, 0.72));
  g.save(); g.globalCompositeOperation = "lighter"; g.fillStyle = `rgba(${col.join(",")},${0.05 + 0.06 * br})`;
  for (let a = 0; a < 8; a++) { const ox = Math.cos(a * 0.785) * tam * 0.035, oy = Math.sin(a * 0.785) * tam * 0.035; for (const [ch, cx] of casillas) g.fillText(ch, cx + ox, base + oy); }
  g.restore();
  g.fillStyle = cara;
  for (const [ch, cx] of casillas) g.fillText(ch, cx, base);
  g.strokeStyle = `rgba(255,255,255,${0.28 + 0.3 * br})`; g.lineWidth = Math.max(1.5, tam * 0.008);
  for (const [ch, cx] of casillas) g.strokeText(ch, cx, base);
  if (op.unidad) {
    g.font = `700 ${Math.round(tu)}px Figtree`;
    g.fillStyle = "rgba(0,0,0,0.5)"; g.fillText(op.unidad, x + 2, base + tu * 1.45 + 4);
    g.fillStyle = "rgba(255,255,255,0.94)"; g.fillText(op.unidad, x, base + tu * 1.45);
  }
  g.restore();
  return { x0, y0: base - tam * 0.75, x1: x0 + w, y1: base + tam * 0.1 + tu * 1.6 };
});

// ---------------------------------------------------------------- las fichas
// Una ficha de lado S: una persona (cabeza y hombros, con su volumen) o una bola, de color c ([r, g, b]), con su
// sombra en el suelo. Se pinta una vez en un lienzo y luego se reparte.
function ficha(tipo, S, c, destaca) {
  const l = lienzo(S), g = l.getContext("2d"), L = hacia(c, [255, 255, 255], 0.55), O = c.map((v) => v * 0.32);
  g.fillStyle = "rgba(0,0,0,0.35)"; g.beginPath(); g.ellipse(S * 0.52, S * 0.9, S * 0.3, S * 0.055, 0, 0, Math.PI * 2); g.fill();
  const bola = (x, y, r) => {
    const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.05, x, y, r * 1.05);
    gr.addColorStop(0, rgb(L)); gr.addColorStop(0.5, rgb(c)); gr.addColorStop(1, rgb(O));
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    g.fillStyle = "rgba(255,255,255,0.5)"; g.beginPath(); g.ellipse(x - r * 0.38, y - r * 0.45, r * 0.24, r * 0.14, -0.6, 0, Math.PI * 2); g.fill();
  };
  if (tipo === "bola") bola(S / 2, S * 0.5, S * 0.36);
  else {
    g.beginPath(); g.moveTo(S * 0.2, S * 0.9); g.bezierCurveTo(S * 0.2, S * 0.62, S * 0.3, S * 0.56, S * 0.5, S * 0.56); g.bezierCurveTo(S * 0.7, S * 0.56, S * 0.8, S * 0.62, S * 0.8, S * 0.9); g.closePath();
    const cu = g.createRadialGradient(S * 0.38, S * 0.6, S * 0.02, S * 0.5, S * 0.75, S * 0.42);
    cu.addColorStop(0, rgb(L)); cu.addColorStop(0.45, rgb(c)); cu.addColorStop(1, rgb(O));
    g.fillStyle = cu; g.fill();
    bola(S * 0.5, S * 0.36, S * 0.15);
  }
  if (destaca) { g.globalCompositeOperation = "lighter"; g.strokeStyle = "rgba(255,255,255,0.35)"; g.lineWidth = S * 0.02; g.stroke(); }
  return l;
}
// La tesela del nivel siguiente: la misma cuadrícula con el doble de fichas por lado, haciendo de verdad la media de
// cada 2 × 2 puntos (con su transparencia). Así, de lejos, las fichas se funden en su color y no hay muaré.
function mitad(src) {
  const N = src.width, d = src.getContext("2d").getImageData(0, 0, N, N).data, l = lienzo(N), c = l.getContext("2d"), img = c.createImageData(N, N), o = img.data;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const sx = (2 * x) % N, sy = (2 * y) % N, k = (y * N + x) * 4;
    let r = 0, gg = 0, b = 0, a = 0;
    for (let q = 0; q < 4; q++) { const p = ((sy + (q >> 1)) * N + sx + (q & 1)) * 4, al = d[p + 3]; r += d[p] * al; gg += d[p + 1] * al; b += d[p + 2] * al; a += al; }
    o[k + 3] = Math.round(a / 4);
    if (a > 0) { o[k] = Math.round(r / a); o[k + 1] = Math.round(gg / a); o[k + 2] = Math.round(b / a); }
  }
  c.putImageData(img, 0, 0);
  return l;
}
// La ficha que va en la casilla (i, j): el mismo dibujo se repite cada 16 casillas, de cerca y de lejos.
const variante = (i, j) => { const a = i % 16, b = j % 16; return (a * 7 + b * 13 + ((a * b) % 5)) % 6; };
// Las fichas y sus teselas, una vez por estilo: seis fichas normales (cada una con un tono algo distinto), la que
// destaca, y nueve teselas: la primera con 16 × 16 fichas de 32 px, y cada una con el doble de fichas por lado que la
// anterior (hasta 4.096 × 4.096). Cada tesela se guarda repetida (dos veces por lado; la primera, tres), para ponerla
// de un solo trazo.
const juegos = new Map(), deFuncion = new WeakMap();
let nFunciones = 0;
function juegoDeFichas(tipo, color, destaca, semilla) {
  if (typeof tipo === "function" && !deFuncion.has(tipo)) deFuncion.set(tipo, "f" + nFunciones++);
  const clave = [typeof tipo === "function" ? deFuncion.get(tipo) : tipo, color, destaca, semilla].join("|");
  if (juegos.has(clave)) return juegos.get(clave);
  const S = 128, c = aRgb(color), az = azar(semilla), hazla = typeof tipo === "function" ? (cc, d) => { const l = lienzo(S), gg = l.getContext("2d"); gg.translate(S / 2, S / 2); tipo(gg, S, d, rgb(cc)); return l; } : (cc, d) => ficha(tipo, S, cc, d);
  const normales = [0, 1, 2, 3, 4, 5].map(() => hazla(c.map((v) => v * (0.82 + 0.3 * az())), false)), especial = hazla(aRgb(destaca), true);
  const t0 = lienzo(512), g0 = t0.getContext("2d"); g0.imageSmoothingQuality = "high";
  for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) g0.drawImage(normales[variante(i, j)], i * 32, j * 32, 32, 32);
  const sueltas = [t0];
  for (let L = 1; L <= 8; L++) sueltas.push(mitad(sueltas[L - 1]));
  const teselas = sueltas.map((t, L) => { const v = L === 0 ? 3 : 2, l = lienzo(512 * v), gl = l.getContext("2d"); for (let q = 0; q < v * v; q++) gl.drawImage(t, (q % v) * 512, Math.floor(q / v) * 512); l.vueltas = v; return l; });
  const j = { normales, especial, teselas };
  juegos.set(clave, j);
  return j;
}

// Las seis fichas normales a S px, en lienzos de paso (se rehacen solo si cambia el tamaño).
let pasoFichas = null;
function fichasA(J, S) {
  if (pasoFichas && pasoFichas.S === S && pasoFichas.J === J) return pasoFichas.l;
  const l = J.normales.map((f) => { const c = lienzo(S), g = c.getContext("2d"); g.imageSmoothingQuality = "high"; g.drawImage(f, 0, 0, S, S); return c; });
  pasoFichas = { S, J, l };
  return l;
}

// Un trozo de cuadrícula de Tb × Tb fichas de c px (con decimales), con la primera ficha en (M, M) y un margen de
// dibujo de verdad alrededor (para que los bloques, puestos donde caen exactos, casen sin raya): la tesela del nivel L
// y la del siguiente mezcladas (1 - w, w), sumando su luz, para que el paso de un nivel a otro sea un fundido. Cada
// tesela va de un solo trazo (dos trazos que se tocan en medio píxel dejan una raya).
const M = 2;
let pasoMezcla = null;
function teselaMezcla(J, L, w, c, Tb) {
  const lado = Math.ceil(Tb * c) + 2 * M;
  if (!pasoMezcla || pasoMezcla.width < lado) pasoMezcla = lienzo(Math.max(lado, 520));
  const P = pasoMezcla, g = P.getContext("2d");
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = "source-over"; g.clearRect(0, 0, lado + 1, lado + 1);
  g.globalCompositeOperation = "lighter"; g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "low";
  // el dibujo se repite cada 16 fichas: la tesela se pone unas cuantas vueltas de 16 antes del margen
  const antes = M - 16 * c * Math.ceil((M + 1) / (16 * c));
  for (const [nivel, peso] of [[L, 1 - w], [L + 1, w]]) {
    if (peso < 0.002 || nivel > 8) continue;
    const t = J.teselas[nivel], lt = t.vueltas * 16 * Math.pow(2, nivel) * c;
    g.globalAlpha = peso;
    for (let yy = antes; yy < lado; yy += lt) for (let xx = antes; xx < lado; xx += lt) g.drawImage(t, xx, yy, lt, lt);
  }
  g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
  return P;
}
// De lejos, las fichas pequeñas se funden antes en su color (por debajo de 8 px se toma un nivel con menos detalle):
// una cuadrícula de 2 o 3 px por ficha haría muaré.
const sesgo = (s) => (s >= 8 ? 0 : s <= 3 ? 1.5 : 1.5 * (1 - suave((s - 3) / 5)));
let pasoFundido = null;

// ---------------------------------------------------------------- uno de cada N
// Una cuadrícula de n fichas (personas, bolas o la que dibujes) con una sola que destaca: «1 de cada 10.000».
// cerca de 0 a 1: con 1 la cámara está pegada a la que destaca (cada ficha mide tam px); con 0 se ven todas, dentro de
// la caja ancho × alto centrada en (x, y). Entre medias se aleja sin tirones. Da igual que sean diez mil o cien
// millones: de lejos se dibujan por teselas, que se funden de un nivel de detalle al siguiente sin saltos ni muaré
// (en menos de 30 ms), y la que destaca siempre se ve (con su brillo, y un aro cuando ya es diminuta).
//   x, y, ancho, alto (540, 900, 1000, 1000) · tam: la ficha de cerca (150 px) · ficha: "persona", "bola" o
//   (g, S, destaca, color) => ... (dibuja una ficha de lado S centrada en 0,0) · color, destaca: "r,g,b" · cual: el
//   número de la que destaca (si no, una al azar con la semilla) · semilla · foco: oscurece las lejanas (true) · al.
// Devuelve dónde está la que destaca { x, y, tam }.
export const unoDeCada = intacto(function unoDeCada(g, n, cerca = 0, op = {}) {
  const al = op.al ?? 1, x = op.x ?? 540, y = op.y ?? 900, AN = op.ancho ?? 1000, AL = op.alto ?? 1000;
  const C = Math.max(1, Math.ceil(Math.sqrt((n * AN) / AL))), R = Math.ceil(n / C), ult = n - (R - 1) * C, llenas = ult === C ? R : R - 1;
  const az = azar(op.semilla ?? 7), q = op.cual ?? Math.floor((0.2 + 0.6 * az()) * R) * C + Math.floor((0.2 + 0.6 * az()) * C);
  const qi = Math.min(q, n - 1) % C, qj = Math.floor(Math.min(q, n - 1) / C);
  const J = juegoDeFichas(op.ficha || "persona", op.color || "150,182,230", op.destaca || "255,204,92", op.semilla ?? 7);
  const s0 = Math.min(AN / C, AL / R), s1 = op.tam ?? 150, c = pasa(cerca), s = Math.exp(mez(Math.log(s0), Math.log(s1), c));
  // la que destaca va del centro (de cerca) a su sitio en la cuadrícula entera (de lejos), sin salirse de la pantalla
  const m = Math.pow(1 - c, 1.6), dx = (qi + 0.5 - C / 2) * s0 * m, dy = (qj + 0.5 - R / 2) * s0 * m;
  const cx = qi + 0.5 - dx / s, cy = qj + 0.5 - dy / s;
  const X = (i) => x + (i - cx) * s, Y = (j) => y + (j - cy) * s;
  const A = g.globalAlpha;
  g.save(); g.globalAlpha = A * al;
  // las celdas que se ven
  const i0 = Math.max(0, Math.floor(cx - x / s) - 1), i1 = Math.min(C - 1, Math.ceil(cx + (1080 - x) / s) + 1), j0 = Math.max(0, Math.floor(cy - y / s) - 1), j1 = Math.min(R - 1, Math.ceil(cy + (1920 - y) / s) + 1);
  // de cerca, ficha a ficha (hechas a su tamaño y puestas en píxeles enteros); de lejos, por teselas; entre 32 y 44 px
  // por ficha, las dos fundidas (sumadas en un lienzo aparte), para que no se note el cambio
  const pesoT = s >= 44 ? 0 : s <= 32 ? 1 : 1 - suave((s - 32) / 12), funde = pesoT > 0 && pesoT < 1;
  const bx0 = Math.max(0, Math.floor(X(0))), by0 = Math.max(0, Math.floor(Y(0))), bx1 = Math.min(1080, Math.ceil(X(C))), by1 = Math.min(1920, Math.ceil(Y(R)));
  let d = g;
  if (funde) {
    if (!pasoFundido) pasoFundido = lienzo(1080, 1920);
    d = pasoFundido.getContext("2d");
    d.setTransform(1, 0, 0, 1, 0, 0); d.globalAlpha = 1; d.globalCompositeOperation = "source-over"; d.clearRect(0, 0, 1080, 1920);
    d.globalCompositeOperation = "lighter";
  }
  if (pesoT < 1) {
    const S = Math.round(s), fs = fichasA(J, S);
    if (funde) d.globalAlpha = 1 - pesoT;
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      if (j * C + i >= n || (i === qi && j === qj)) continue;
      d.drawImage(fs[variante(i, j)], Math.round(X(i)), Math.round(Y(j)));
    }
  }
  if (pesoT > 0) {
    // el nivel (con decimales: entre dos, se funden) que deja las fichas de la tesela del tamaño de las de pantalla
    const lv = Math.min(8, Math.max(0, Math.log2(32 / s) + sesgo(s))), L = Math.min(7, Math.floor(lv)), w = lv - L;
    // bloques de Tb fichas (de 256 a 512 px), cada uno donde cae exacto (con decimales): casan sin raya porque la
    // mezcla tiene margen
    let Tb = 16; while (Tb * s < 256) Tb *= 2;
    const P = teselaMezcla(J, L, w, s, Tb);
    if (funde) d.globalAlpha = pesoT;
    d.imageSmoothingEnabled = true; d.imageSmoothingQuality = "low";
    // un bloque: las columnas c0..c1 y las filas f0..f1 (sin las de fuera de la cuadrícula)
    const bloque = (c0, c1, f0, f1) => {
      const xa = X(c0), ya = Y(f0), an = (c1 - c0) * s, al = (f1 - f0) * s, sy = M + (f0 % Tb) * s;
      if (an <= 0 || al <= 0 || xa + an < 0 || xa > 1080 || ya + al < 0 || ya > 1920) return;
      d.drawImage(P, M, sy, an, al, xa, ya, an, al);
    };
    for (let bj = Math.floor(j0 / Tb); bj * Tb <= Math.min(j1, llenas - 1); bj++) for (let bi = Math.floor(i0 / Tb); bi * Tb <= i1; bi++) bloque(bi * Tb, Math.min(C, (bi + 1) * Tb), bj * Tb, Math.min(llenas, (bj + 1) * Tb));
    if (llenas < R && R - 1 >= j0 && R - 1 <= j1) for (let bi = 0; bi * Tb < ult; bi++) bloque(bi * Tb, Math.min(ult, (bi + 1) * Tb), R - 1, R);
  }
  if (funde) { g.drawImage(pasoFundido, bx0, by0, bx1 - bx0, by1 - by0, bx0, by0, bx1 - bx0, by1 - by0); }
  // la que destaca: su luz cae sobre las de al lado; las lejanas, más oscuras
  const ex = X(qi + 0.5), ey = Y(qj + 0.5);
  brillo(g, ex, ey, Math.max(s * 7, 420), op.destaca || "255,204,92", 0.5);
  if (op.foco ?? true) {
    const gx0 = Math.max(0, X(0)), gy0 = Math.max(0, Y(0)), gx1 = Math.min(1080, X(C)), gy1 = Math.min(1920, Y(R));
    if (gx1 > gx0 && gy1 > gy0) {
      const r0 = Math.max(s * 2.5, 260), vg = g.createRadialGradient(ex, ey, r0, ex, ey, r0 + 1100);
      vg.addColorStop(0, "rgba(2,4,10,0)"); vg.addColorStop(1, "rgba(2,4,10,0.55)");
      g.fillStyle = vg; g.fillRect(gx0, gy0, gx1 - gx0, gy1 - gy0);
    }
  }
  const se = Math.max(s * 1.08, 3);
  g.imageSmoothingQuality = "high";
  g.drawImage(J.especial, ex - se / 2, ey - se / 2 - s * 0.03, se, se);
  brillo(g, ex, ey, Math.max(se * 2.2, 60), "blanca", 0.35);
  const aro = 1 - pasa((s - 12) / 28);
  if (aro > 0.01) {
    const r = Math.max(64, s * 1.6);
    g.globalAlpha = A * al * aro;
    g.beginPath(); g.arc(ex, ey, r, 0, Math.PI * 2);
    g.globalCompositeOperation = "lighter"; g.strokeStyle = `rgba(${op.destaca || "255,204,92"},0.18)`; g.lineWidth = 26; g.stroke(); g.lineWidth = 14; g.stroke();
    g.globalCompositeOperation = "source-over"; g.strokeStyle = `rgba(${op.destaca || "255,204,92"},0.95)`; g.lineWidth = 7; g.stroke();
  }
  g.restore();
  return { x: ex, y: ey, tam: s };
});

// ---------------------------------------------------------------- las torres
const TONOS = ["255,196,92", "110,200,255", "255,110,120", "140,240,150", "200,150,255", "255,160,90"];
// Torres 3D que crecen, en fila sobre un suelo, vistas con la cámara cam (k.mira; null: una de frente y un poco
// desde arriba). lista: [{ valor, nombre, color "r,g,b" }]. u de 0 a 1: crecen una detrás de otra, cada una hasta su
// valor, con su cifra corriendo encima y su nombre al pie. La luz llega de arriba a la izquierda: cara de arriba
// clara, un lado en sombra, su sombra en el suelo y el borde de arriba que brilla.
//   centro: [x, y, z] del pie de la fila · ancho, fondo: de cada torre (2,2) · hueco: entre torres (1,1) · alto: el de
//   la más alta (8) · max: el valor que llega a alto (por defecto, el mayor) · escalonado: cuánto tarda cada una en
//   salir después de la anterior (0,12 de u) · cifras: con su número encima (true) · dec · unidad · letra: el alto de
//   las cifras (68) · suelo: con suelo (true) · al.
// Todas las medidas, en unidades del mundo de la cámara. Devuelve, para cada torre, { cima: {x, y}, pie: {x, y} }.
export const torres = intacto(function torres(g, cam, lista, u = 1, op = {}) {
  cam = cam || mira([0, 10, 24], [0, 3.4, 0]);
  const n = lista.length, an = op.ancho ?? 2.2, fo = op.fondo ?? an, hu = op.hueco ?? 1.1, H = op.alto ?? 8, c0 = op.centro || [0, 0, 0];
  const max = op.max ?? Math.max(...lista.map((t) => t.valor)), esc = op.escalonado ?? 0.12, dur = Math.max(0.2, 1 - esc * (n - 1));
  const L = uni(op.luz || [-0.55, 0.8, 0.5]), al = op.al ?? 1, A = g.globalAlpha;
  const total = n * an + (n - 1) * hu;
  const T = lista.map((t, i) => {
    const cr = suave(tramo(u, i * esc, i * esc + dur));
    return { x: c0[0] - total / 2 + an / 2 + i * (an + hu), z: c0[2], h: Math.max(0.001, (H * t.valor) / max) * cr, cr, t, col: aRgb(t.color || TONOS[i % TONOS.length]) };
  });
  const P = (p) => proyecta(cam, p);
  const poli = (pts) => { if (pts.some((p) => !p)) return false; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); g.closePath(); return true; };
  g.save(); g.globalAlpha = A * al;
  // el suelo: un charco de luz que se apaga hacia los bordes (sin bordes duros), con la luz de cada torre reflejada
  if (op.suelo ?? true) {
    const y0 = c0[1], m = P([c0[0], y0, c0[2]]), d = P([c0[0] + total / 2 + 3, y0, c0[2]]), f2 = P([c0[0], y0, c0[2] - 6]), n2 = P([c0[0], y0, c0[2] + 6]);
    if (m && d && f2 && n2) {
      const rx = Math.abs(d.x - m.x), ry = Math.max(20, Math.abs(n2.y - f2.y) / 2);
      g.save(); g.translate(m.x, m.y); g.scale(1, ry / rx);
      const sg = g.createRadialGradient(0, 0, 0, 0, 0, rx);
      sg.addColorStop(0, "rgba(44,54,80,0.85)"); sg.addColorStop(0.6, "rgba(26,32,50,0.6)"); sg.addColorStop(1, "rgba(14,18,30,0)");
      g.fillStyle = sg; g.beginPath(); g.arc(0, 0, rx, 0, Math.PI * 2); g.fill();
      g.restore();
    }
    for (const t of T) {
      const p = P([t.x, c0[1], t.z]), q = P([t.x + an / 2, c0[1], t.z]);
      if (p && q) brillo(g, p.x, p.y, Math.abs(q.x - p.x) * 6, t.col.join(","), 0.35 * t.cr);
    }
  }
  // las sombras en el suelo: la base y la cima de cada torre llevadas al suelo en contra de la luz
  for (const t of T) {
    if (t.h < 0.01) continue;
    const pts = [];
    for (const dx of [-an / 2, an / 2]) for (const dz of [-fo / 2, fo / 2]) { pts.push([t.x + dx, t.z + dz]); pts.push([t.x + dx - (L[0] * t.h) / L[1], t.z + dz - (L[2] * t.h) / L[1]]); }
    const ca = envolvente(pts).map(([px, pz]) => P([px, c0[1], pz]));
    g.fillStyle = "rgba(0,0,0,0.4)"; if (poli(ca)) g.fill();
  }
  // las torres, de lejos a cerca
  const orden = T.map((t) => ({ t, d: Math.hypot(cam.p[0] - t.x, cam.p[2] - t.z) })).sort((a, b) => b.d - a.d);
  for (const { t } of orden) if (t.h > 0.005) caja3d(g, cam, t, an, fo, c0[1], L);
  // las cifras encima y los nombres al pie
  const out = T.map((t) => {
    const cima = P([t.x, c0[1] + t.h, t.z]), pie = P([t.x, c0[1], t.z + fo / 2]);
    return { cima: cima && { x: cima.x, y: cima.y }, pie: pie && { x: pie.x, y: pie.y }, t };
  });
  // los nombres, del tamaño que quepa entre una torre y la siguiente
  const sitio = out.map((o, i) => { const vec = [out[i - 1], out[i + 1]].filter((p) => p && p.pie && o.pie).map((p) => Math.abs(p.pie.x - o.pie.x)); return vec.length ? Math.min(...vec) * 0.94 : 600; });
  out.forEach((o, i) => {
    if ((op.cifras ?? true) && o.cima && o.t.cr > 0.02) pastilla(g, o.cima.x, o.cima.y - (op.letra ?? 68) * 0.95, fmt(o.t.t.valor * o.t.cr, op.dec ?? 0, op.idioma), op.unidad || "", o.t.col.join(","), Math.min(1, o.t.cr * 4), op.letra ?? 68);
    if (o.t.t.nombre && o.pie) {
      g.save(); g.font = "800 46px Figtree"; g.textAlign = "center"; g.textBaseline = "top";
      const tm = Math.round(46 * Math.min(1, sitio[i] / g.measureText(o.t.t.nombre).width));
      g.font = `800 ${tm}px Figtree`;
      g.fillStyle = "rgba(0,0,0,0.55)"; g.fillText(o.t.t.nombre, o.pie.x + 2, o.pie.y + 26);
      g.fillStyle = "rgba(255,255,255,0.95)"; g.fillText(o.t.t.nombre, o.pie.x, o.pie.y + 22); g.restore();
    }
  });
  g.restore();
  return out.map(({ cima, pie }) => ({ cima, pie }));
});
// La envolvente convexa de unos puntos [x, z].
function envolvente(pts) {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), x = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], hi = [];
  for (const q of p) { while (lo.length >= 2 && x(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.reverse()) { while (hi.length >= 2 && x(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop(); hi.push(q); }
  return lo.slice(0, -1).concat(hi.slice(0, -1));
}
// Una torre: sus caras que miran a la cámara, cada una con su luz, su degradado de arriba abajo, su textura y su borde.
function caja3d(g, cam, t, an, fo, y0, L) {
  const x0 = t.x - an / 2, x1 = t.x + an / 2, z0 = t.z - fo / 2, z1 = t.z + fo / 2, y1 = y0 + t.h;
  const caras = [
    { n: [0, 0, 1], p: [[x0, y1, z1], [x1, y1, z1], [x1, y0, z1], [x0, y0, z1]] },
    { n: [1, 0, 0], p: [[x1, y1, z1], [x1, y1, z0], [x1, y0, z0], [x1, y0, z1]] },
    { n: [-1, 0, 0], p: [[x0, y1, z0], [x0, y1, z1], [x0, y0, z1], [x0, y0, z0]] },
    { n: [0, 0, -1], p: [[x1, y1, z0], [x0, y1, z0], [x0, y0, z0], [x1, y0, z0]] },
    { n: [0, 1, 0], p: [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]] },
  ];
  for (const c of caras) {
    const m = c.p.reduce((a, q) => [a[0] + q[0] / 4, a[1] + q[1] / 4, a[2] + q[2] / 4], [0, 0, 0]);
    if (pto(res(cam.p, m), c.n) <= 0) continue;
    const pp = c.p.map((q) => proyecta(cam, q));
    if (pp.some((q) => !q)) continue;
    const luz = 0.3 + 0.75 * Math.max(0, pto(c.n, L)), arriba = c.n[1] > 0;
    g.save();
    g.beginPath(); pp.forEach((q, i) => (i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y))); g.closePath();
    if (arriba) { g.fillStyle = rgb(hacia(t.col, [255, 255, 255], 0.35), luz); }
    else {
      const a = { x: (pp[0].x + pp[1].x) / 2, y: (pp[0].y + pp[1].y) / 2 }, b = { x: (pp[2].x + pp[3].x) / 2, y: (pp[2].y + pp[3].y) / 2 }, gr = g.createLinearGradient(a.x, a.y, b.x, b.y);
      gr.addColorStop(0, rgb(t.col, luz * 1.12)); gr.addColorStop(0.7, rgb(t.col, luz * 0.8)); gr.addColorStop(1, rgb(t.col, luz * 0.55));
      g.fillStyle = gr;
    }
    g.fill();
    g.clip();
    const bx = Math.min(...pp.map((q) => q.x)), by = Math.min(...pp.map((q) => q.y)), bw = Math.max(...pp.map((q) => q.x)) - bx, bh = Math.max(...pp.map((q) => q.y)) - by;
    const lado = Math.max(bw, bh) + 40, a0 = g.globalAlpha;
    g.globalCompositeOperation = "multiply"; g.globalAlpha = a0 * 0.16; g.drawImage(red2, bx - 20, by - 20, lado, lado);
    g.globalCompositeOperation = "screen"; g.globalAlpha = a0 * 0.14; g.drawImage(manchas, bx - 20, by - 20, lado, lado);
    g.globalCompositeOperation = "source-over"; g.globalAlpha = a0;
    if (!arriba && c.n[2] > 0) {
      // un reflejo en diagonal en la cara de delante
      const gl = g.createLinearGradient(bx, by, bx + bw, by + bw * 0.6);
      gl.addColorStop(0.2, "rgba(255,255,255,0)"); gl.addColorStop(0.32, "rgba(255,255,255,0.13)"); gl.addColorStop(0.42, "rgba(255,255,255,0)");
      g.fillStyle = gl; g.fillRect(bx, by, bw, bh);
    }
    g.restore();
    if (arriba) {
      g.save(); g.lineJoin = "round";
      g.beginPath(); pp.forEach((q, i) => (i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y))); g.closePath();
      g.globalCompositeOperation = "lighter"; g.strokeStyle = `rgba(${t.col.join(",")},0.6)`; g.lineWidth = 6; g.stroke();
      g.strokeStyle = "rgba(255,255,255,0.7)"; g.lineWidth = 2; g.stroke();
      g.restore();
    }
  }
}

// ---------------------------------------------------------------- la pila
// Un objeto de la pila, con su pie en (x, y), de ancho a y grueso h (px), visto un poco desde arriba.
function moneda(g, x, y, a, h, c) {
  const rx = a / 2, ry = a * 0.15, oro = c ? aRgb(c) : [232, 182, 72];
  // el canto, con sus estrías
  const cg = g.createLinearGradient(x - rx, 0, x + rx, 0);
  cg.addColorStop(0, rgb(oro, 0.42)); cg.addColorStop(0.3, rgb(oro, 1.05)); cg.addColorStop(0.45, rgb(hacia(oro, [255, 255, 255], 0.5))); cg.addColorStop(0.7, rgb(oro, 0.8)); cg.addColorStop(1, rgb(oro, 0.32));
  g.fillStyle = cg; g.beginPath(); g.ellipse(x, y - ry, rx, ry, 0, 0, Math.PI); g.lineTo(x - rx, y - h - ry); g.ellipse(x, y - h - ry, rx, ry, 0, Math.PI, 0, true); g.closePath(); g.fill();
  g.strokeStyle = "rgba(60,36,6,0.35)"; g.lineWidth = 1.2;
  for (let i = 1; i < 28; i++) { const xx = x - Math.cos((i / 28) * Math.PI) * rx; g.beginPath(); g.moveTo(xx, y - ry + Math.sin((i / 28) * Math.PI) * ry); g.lineTo(xx, y - h - ry + Math.sin((i / 28) * Math.PI) * ry); g.stroke(); }
  // la cara de arriba: su borde levantado y su relieve
  const ty = y - h - ry, tg = g.createLinearGradient(x - rx, ty - ry, x + rx, ty + ry);
  tg.addColorStop(0, rgb(hacia(oro, [255, 255, 255], 0.55))); tg.addColorStop(0.5, rgb(oro)); tg.addColorStop(1, rgb(oro, 0.6));
  g.fillStyle = tg; g.beginPath(); g.ellipse(x, ty, rx, ry, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "rgba(255,240,200,0.55)"; g.lineWidth = Math.max(1, a * 0.012); g.beginPath(); g.ellipse(x, ty, rx * 0.84, ry * 0.84, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
  g.strokeStyle = "rgba(90,56,8,0.45)"; g.beginPath(); g.ellipse(x, ty, rx * 0.84, ry * 0.84, 0, Math.PI * 0.05, Math.PI * 0.95); g.stroke();
  g.fillStyle = "rgba(120,78,14,0.35)"; g.beginPath(); g.ellipse(x + rx * 0.04, ty + ry * 0.05, rx * 0.36, ry * 0.36, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = "rgba(255,248,220,0.5)"; g.beginPath(); g.ellipse(x - rx * 0.35, ty - ry * 0.3, rx * 0.25, ry * 0.2, 0, 0, Math.PI * 2); g.fill();
}
function bloque(g, x, y, a, h, cara, canto, raya, lado = canto) {
  // una caja vista un poco desde arriba y desde la derecha: el canto de delante, el lado y la cara de arriba
  const d = a * 0.28, sk = a * 0.12;
  g.fillStyle = lado; g.beginPath(); g.moveTo(x + a / 2, y - h); g.lineTo(x + a / 2 + sk, y - h - d); g.lineTo(x + a / 2 + sk, y - d); g.lineTo(x + a / 2, y); g.closePath(); g.fill();
  g.fillStyle = lado === canto ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0.16)"; g.fill();
  g.fillStyle = canto; g.beginPath(); g.moveTo(x - a / 2, y - h); g.lineTo(x + a / 2, y - h); g.lineTo(x + a / 2, y); g.lineTo(x - a / 2, y); g.closePath(); g.fill();
  const sg = g.createLinearGradient(x - a / 2, 0, x + a / 2, 0); sg.addColorStop(0, "rgba(0,0,0,0.35)"); sg.addColorStop(0.4, "rgba(255,255,255,0.08)"); sg.addColorStop(1, "rgba(0,0,0,0.45)");
  g.fillStyle = sg; g.fill();
  if (raya) { g.fillStyle = raya; g.fillRect(x - a / 2, y - h * 0.62, a, h * 0.24); }
  g.fillStyle = cara; g.beginPath(); g.moveTo(x - a / 2, y - h); g.lineTo(x - a / 2 + sk, y - h - d); g.lineTo(x + a / 2 + sk, y - h - d); g.lineTo(x + a / 2, y - h); g.closePath(); g.fill();
  const tg = g.createLinearGradient(x - a / 2, y - h - d, x + a / 2, y - h); tg.addColorStop(0, "rgba(255,255,255,0.28)"); tg.addColorStop(1, "rgba(0,0,0,0.2)");
  g.fillStyle = tg; g.fill();
  g.strokeStyle = "rgba(255,255,255,0.35)"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x - a / 2, y - h); g.lineTo(x + a / 2, y - h); g.stroke();
}
const OBJETOS = {
  moneda: (g, x, y, a, h, i, c) => moneda(g, x, y, a, h, c),
  billete: (g, x, y, a, h, i, c) => { bloque(g, x, y, a, h, c ? `rgb(${c})` : "#86b88b", "#6f9f74", "rgba(238,232,208,0.85)"); g.strokeStyle = "rgba(220,240,215,0.45)"; g.lineWidth = 1; for (let k = 1; k < 5; k++) { g.beginPath(); g.moveTo(x - a / 2, y - (h * k) / 5); g.lineTo(x + a / 2, y - (h * k) / 5); g.stroke(); } },
  caja: (g, x, y, a, h, i, c) => bloque(g, x, y, a, h, c ? `rgb(${c})` : "#c79a63", "#a87a45", "rgba(225,205,160,0.7)"),
  libro: (g, x, y, a, h, i, c) => {
    // el lomo delante (de su color, con el título dorado), las hojas al lado
    const t = c ? `rgb(${c})` : ["#b8473f", "#3f6fb8", "#3f9b6a", "#c9a23f", "#7a4fb0"][i % 5];
    bloque(g, x, y, a, h, t, t, "rgba(240,200,110,0.55)", "#f3ead4");
    g.fillStyle = "rgba(255,255,255,0.18)"; g.fillRect(x - a / 2, y - h, a, h * 0.18);
    g.strokeStyle = "rgba(150,130,100,0.5)"; g.lineWidth = 1; const sk = a * 0.12, d = a * 0.28;
    for (let k = 1; k < 4; k++) { const yy = y - (h * k) / 4; g.beginPath(); g.moveTo(x + a / 2, yy); g.lineTo(x + a / 2 + sk, yy - d); g.stroke(); }
  },
};
// Un objeto del kit pintado una vez en su lienzo (los libros, en sus cinco colores). im.pie: lo que sobra por debajo.
const imagenes = new Map();
function imagenDe(nombre, a, h, i, color) {
  const v = nombre === "libro" ? i % 5 : 0, clave = [nombre, a, h, v, color].join("|");
  if (imagenes.has(clave)) return imagenes.get(clave);
  const m = Math.ceil(a * 0.2), l = lienzo(Math.ceil(a * 1.15) + 2 * m, Math.ceil(h + a * 0.35) + 2 * m), g = l.getContext("2d");
  OBJETOS[nombre](g, l.width / 2, l.height - m, a, h, v, color);
  l.pie = m;
  imagenes.set(clave, l);
  return l;
}
// Una pila de objetos que sube contándolos: n objetos con el pie de la pila en (x, y) de la pantalla. u de 0 a 1:
// van cayendo uno a uno (si son pocos) o la pila crece (si son muchos), con el contador al lado. Si la pila no cabe,
// la cámara sube con ella (la cima se queda en tope y el pie se va por abajo).
//   objeto: "moneda", "billete", "caja", "libro" o (g, x, y, ancho, grueso, i) => ... (uno, con su pie en x, y) ·
//   ancho (260 px) · grueso: lo que sube cada uno (30 px) · color "r,g,b" · cuenta: con contador (true) · unidad ·
//   dec · sigue: la cámara sube con la cima (true) · tope: hasta dónde sube la cima en pantalla (560) · cae: que
//   caigan uno a uno (si son 60 o menos) · semilla · al.
// Devuelve { x, y } de la cima y cuántos hay ya.
export const pila = intacto(function pila(g, x, y, n, u = 1, op = {}) {
  const a = op.ancho ?? 260, h = op.grueso ?? 30, dibuja = typeof op.objeto === "function" ? op.objeto : OBJETOS[op.objeto || "moneda"], cae = op.cae ?? n <= 60;
  const c = n * pasa(u), k = cae ? Math.floor(c) : Math.round(c), f = cae ? c - k : 0, tope = op.tope ?? 560;
  const az = azar(op.semilla ?? 5), dx = [], N = Math.min(n, 4000);
  for (let i = 0; i < N; i++) dx.push((az() - 0.5) * a * 0.07);
  const cimaY = y - k * h, baja = (op.sigue ?? true) && cimaY < tope ? tope - cimaY : 0, A = g.globalAlpha;
  g.save(); g.globalAlpha = A * (op.al ?? 1);
  // la sombra en el suelo
  if (y + baja < 2000) { const sg = g.createRadialGradient(x, y + baja, 0, x, y + baja, a * 0.75); sg.addColorStop(0, "rgba(0,0,0,0.55)"); sg.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = sg; g.save(); g.translate(x, y + baja); g.scale(1, 0.25); g.translate(-x, -y - baja); g.beginPath(); g.arc(x, y + baja, a * 0.75, 0, Math.PI * 2); g.fill(); g.restore(); }
  // de abajo arriba, solo los que se ven
  const desde = Math.max(0, Math.floor((y + baja - 1960) / h)), hasta = Math.min(k, Math.ceil((y + baja + h * 2) / h) + 1);
  const pon = (i, yy) => { if (typeof op.objeto === "function") return dibuja(g, x + dx[i % N], yy, a, h, i, op.color); const im = imagenDe(op.objeto || "moneda", a, h, i, op.color); g.drawImage(im, Math.round(x + dx[i % N] - im.width / 2), Math.round(yy - im.height + im.pie)); };
  for (let i = desde; i < hasta; i++) pon(i, y + baja - i * h);
  // el que cae
  if (cae && k < n && f > 0) { const yd = y + baja - k * h - 620 * (1 - f * f); g.globalAlpha = A * (op.al ?? 1) * pasa(f * 4); pon(k, yd); g.globalAlpha = A * (op.al ?? 1); }
  // el contador, al lado de la cima (o encima, si al lado no cabe)
  const cy = y + baja - k * h - a * 0.3;
  if (op.cuenta ?? true) {
    const txt = fmt(k, op.dec ?? 0, op.idioma); g.font = "800 96px Figtree"; let w = g.measureText(txt).width + 88; g.font = "700 48px Figtree"; if (op.unidad) w += g.measureText(op.unidad).width + 12;
    const lado = x + a * 0.65 + 30 + w / 2;
    if (lado + w / 2 < 1060) pastilla(g, lado, cy, txt, op.unidad || "", "255,226,150", 1, 96);
    else pastilla(g, x, cy - 130, txt, op.unidad || "", "255,226,150", 1, 96);
  }
  g.restore();
  return { x, y: cy, cuantos: k };
});

// ---------------------------------------------------------------- de lo más pequeño a lo enorme
// Una bola con luz y volumen de color c ("r,g,b"), para lo que no tiene dibujo propio.
function bolaDeColor(g, x, y, r, c) {
  const C = aRgb(c), A = g.globalAlpha;
  g.save();
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.clip();
  const gr = g.createRadialGradient(x - r * 0.4, y - r * 0.45, r * 0.05, x, y, r * 1.05);
  gr.addColorStop(0, rgb(hacia(C, [255, 255, 255], 0.5))); gr.addColorStop(0.5, rgb(C)); gr.addColorStop(1, rgb(C, 0.25));
  g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
  g.globalCompositeOperation = "multiply"; g.globalAlpha = A * 0.5; g.drawImage(manchas, x - r * 1.2, y - r * 1.2, r * 2.4, r * 2.4);
  g.globalCompositeOperation = "source-over"; g.globalAlpha = A;
  const bo = g.createRadialGradient(x, y, r * 0.8, x, y, r);
  bo.addColorStop(0, "rgba(255,255,255,0)"); bo.addColorStop(1, "rgba(255,255,255,0.18)");
  g.fillStyle = bo; g.fillRect(x - r, y - r, 2 * r, 2 * r);
  g.restore();
}
// Un gigante de gas (Júpiter, Saturno sin anillos...): bandas de colores tono ["#claro", "#oscuro", ...], con su
// volumen y su lado de sombra.
function gaseoso(g, x, y, r, tono = ["#efdcc0", "#b98a5e", "#e3c7a0", "#9c6e48", "#f1e4cc"]) {
  const A = g.globalAlpha;
  g.save(); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.clip();
  const b = g.createLinearGradient(0, y - r, 0, y + r), n = 11;
  for (let k = 0; k <= n; k++) b.addColorStop(k / n, tono[(k * 3 + (k >> 1)) % tono.length]);
  g.fillStyle = b; g.fillRect(x - r, y - r, 2 * r, 2 * r);
  g.globalCompositeOperation = "multiply"; g.globalAlpha = A * 0.35; g.drawImage(manchas, x - r * 1.6, y - r * 0.55, r * 3.2, r * 1.1);
  g.globalCompositeOperation = "source-over"; g.globalAlpha = A;
  const sh = g.createRadialGradient(x - r * 0.35, y - r * 0.3, r * 0.1, x, y, r * 1.02);
  sh.addColorStop(0, "rgba(255,255,255,0.14)"); sh.addColorStop(0.65, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(0,0,0,0.75)");
  g.fillStyle = sh; g.fillRect(x - r, y - r, 2 * r, 2 * r);
  g.restore();
}
function dibujaCosa(g, c, x, y, r, i) {
  if (c.dibuja) return c.dibuja(g, x, y, r);
  const tipo = c.tipo || "bola";
  if (tipo === "tierra") return r < 6 ? tierra(g, x, y, r, 0.15, -1, -0.3) : globo(g, x, y, r, c.lon ?? -20, c.lat ?? 18, { luz: [-0.8, -0.35, 0.5] });
  if (tipo === "gaseoso") return gaseoso(g, x, y, r, c.tono);
  if (tipo === "luna") return planeta(g, x, y, r, i, -1, -0.3, ["#d8d6d0", "#8f8c86", "#2c2b29"]);
  if (tipo === "planeta") return planeta(g, x, y, r, i, -1, -0.3, c.tono);
  if (tipo === "roca") return roca(g, x, y, r, i * 0.7, 30 + i, -1, -1);
  if (tipo.startsWith("estrella")) return estrella(g, tipo.split(":")[1] || "amarilla", x, y, r, i);
  return bolaDeColor(g, x, y, r, c.color || "190,200,220");
}
// Una fila de cosas de tamaños muy distintos, de izquierda a derecha, que la cámara recorre: con foco = i la cosa i
// llena encuadre de la pantalla; con foco entre dos, la cámara se aleja (o se acerca) y se mueve a la vez, sin
// tirones, aunque una sea un millón de veces más grande que la otra. Cada una lleva su nombre y su cifra debajo.
//   lista: [{ tam (su tamaño de verdad, en las unidades que quieras), nombre, cifra ("12.742 km"), tipo: "bola",
//   "tierra" (con sus continentes de verdad; lon, lat: lo que mira), "luna", "planeta", "gaseoso" (con bandas, como
//   Júpiter), "roca" o "estrella:amarilla" (o cualquier paleta), color "r,g,b", tono (de planeta o gaseoso),
//   dibuja(g, x, y, r) para dibujarla tú (centrada en x, y, de radio r) }]
//   x, y: dónde queda el centro de la que está en foco (540, 900) · encuadre: lo que ocupa su ancho (0,5 de la
//   pantalla) · hueco: entre una y la siguiente (0,35 de la mayor) · suelo: apoyadas en la línea y (en vez de
//   centradas) · etiquetas (true) · al.
// Devuelve dónde ha quedado cada una [{ x, y, r }].
export const filaDeTamanos = intacto(function filaDeTamanos(g, lista, foco = 0, op = {}) {
  const n = lista.length, x = op.x ?? 540, y = op.y ?? 900, enc = (op.encuadre ?? 0.5) * 1080, hu = op.hueco ?? 0.35, suelo = !!op.suelo, A = g.globalAlpha;
  const r = lista.map((c) => c.tam / 2), cx = [0];
  for (let i = 1; i < n; i++) cx.push(cx[i - 1] + r[i - 1] + r[i] + hu * Math.max(r[i - 1], r[i]));
  const f = Math.max(0, Math.min(n - 1, foco)), a = Math.min(n - 2, Math.floor(f)), t = n > 1 ? suave(f - Math.max(0, a)) : 0, b = Math.min(n - 1, a + 1);
  const sa = enc / (2 * r[Math.max(0, a)]), sb = enc / (2 * r[b]), s = Math.exp(mez(Math.log(sa), Math.log(sb), t));
  const w = Math.abs(sa - sb) / sa < 1e-6 ? t : (sa / s - 1) / (sa / sb - 1), c = cx[Math.max(0, a)] + (cx[b] - cx[Math.max(0, a)]) * w;
  const pos = lista.map((_, i) => { const R = r[i] * s; return { x: x + (cx[i] - c) * s, y: suelo ? y - R : y, r: R }; });
  g.save(); g.globalAlpha = A * (op.al ?? 1);
  // de la más grande a la más pequeña, para que la pequeña no quede debajo del brillo de la grande
  const orden = pos.map((p, i) => i).sort((i, j) => pos[j].r - pos[i].r);
  for (const i of orden) {
    const p = pos[i];
    if (p.r < 0.4 || p.x + p.r * 2.4 < 0 || p.x - p.r * 2.4 > 1080 || p.y + p.r * 2.4 < 0 || p.y - p.r * 2.4 > 1920) continue;
    if (suelo) { const sg = g.createRadialGradient(p.x, y, 0, p.x, y, p.r * 1.1); sg.addColorStop(0, "rgba(0,0,0,0.5)"); sg.addColorStop(1, "rgba(0,0,0,0)"); g.save(); g.translate(p.x, y); g.scale(1, 0.18); g.translate(-p.x, -y); g.fillStyle = sg; g.beginPath(); g.arc(p.x, y, p.r * 1.1, 0, Math.PI * 2); g.fill(); g.restore(); }
    dibujaCosa(g, lista[i], p.x, p.y, p.r, i);
  }
  // los nombres: debajo de cada una (o abajo del todo, si la cosa no cabe en la pantalla)
  // (las que son muy pequeñas al lado de la que está en foco no llevan nombre; cada nombre, del tamaño que quepa)
  if (op.etiquetas ?? true) {
    const rf = pos[Math.round(f)].r, lx = pos.map((p) => Math.max(130, Math.min(950, p.x)));
    for (let i = 0; i < n; i++) {
      const p = pos[i], c = lista[i], ae = pasa((p.r - 10) / 30) * pasa((p.r / rf - 0.06) / 0.08);
      if (ae <= 0.01 || p.x < -200 || p.x > 1280 || !c.nombre) continue;
      const ly = Math.min(p.y + p.r + 40, 1330), hueco = Math.min(...[i - 1, i + 1].filter((j) => j >= 0 && j < n && pos[j].r / rf > 0.06).map((j) => Math.abs(lx[j] - lx[i])), 900) * 0.92;
      g.save(); g.globalAlpha = A * (op.al ?? 1) * ae; g.textAlign = "center"; g.textBaseline = "top";
      g.font = "800 50px Figtree"; const k1 = Math.min(1, hueco / g.measureText(c.nombre).width);
      g.font = `800 ${Math.round(50 * k1)}px Figtree`;
      g.fillStyle = "rgba(0,0,0,0.6)"; g.fillText(c.nombre, lx[i] + 2, ly + 4); g.fillStyle = "#ffffff"; g.fillText(c.nombre, lx[i], ly);
      if (c.cifra) { g.font = `700 ${Math.round(40 * k1)}px Figtree`; g.fillStyle = "rgba(0,0,0,0.6)"; g.fillText(c.cifra, lx[i] + 2, ly + 64 * k1 + 4); g.fillStyle = "rgb(255,214,120)"; g.fillText(c.cifra, lx[i], ly + 64 * k1); }
      g.restore();
    }
  }
  g.restore();
  return pos;
});
