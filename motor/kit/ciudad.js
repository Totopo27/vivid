// La ciudad: edificios de verdad en 3D (cajas vistas con la cámara de camara.js, cada cara iluminada a su manera, con
// sus ventanas encendidas o apagadas, su planta baja, sus tejados con máquinas y antenas), de día o de noche; una ciudad
// entera hecha con una semilla (manzanas, calles, parques, farolas y coches que circulan) por la que la cámara puede
// volar; su cielo; y el perfil de una ciudad en 2D para los fondos lejanos.
// Las medidas, en metros: una planta mide unos 3,5 y una calle unos 20.
import { azar, lienzo } from "./base.js";
import { CX, CY, F } from "./camara.js";
import { halo } from "./luz.js";
import { ruido } from "./texturas.js";

// ---------------------------------------------------------------- la cámara, recortando lo que queda detrás
const CERCA = 0.5;
const enCam = (cam, X) => {
  const dx = X[0] - cam.p[0], dy = X[1] - cam.p[1], dz = X[2] - cam.p[2], e = cam.e;
  return [dx * e.r[0] + dy * e.r[1] + dz * e.r[2], dx * e.u[0] + dy * e.u[1] + dz * e.u[2], dx * e.f[0] + dy * e.f[1] + dz * e.f[2]];
};
const aPant = (c) => [CX + (F * c[0]) / c[2], CY - (F * c[1]) / c[2], c[2]];
function recorta(P) {
  const o = [];
  for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length], ia = a[2] >= CERCA, ib = b[2] >= CERCA;
    if (ia) o.push(a);
    if (ia !== ib) { const u = (CERCA - a[2]) / (b[2] - a[2]); o.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, CERCA]); }
  }
  return o;
}
// Un polígono del mundo (lista de [x, y, z]) visto con la cámara: sus puntos en pantalla [x, y, z], ya recortado por lo
// que queda detrás de la cámara (aunque la cámara esté dentro de él), o null si no se ve nada.
export function poligonoEn(cam, pts) {
  const c = recorta(pts.map((p) => enCam(cam, p)));
  return c.length >= 3 ? c.map(aPant) : null;
}
const traza = (g, q) => { g.beginPath(); g.moveTo(q[0][0], q[0][1]); for (let i = 1; i < q.length; i++) g.lineTo(q[i][0], q[i][1]); g.closePath(); };
const css = (c, a = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;
const mez3 = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
const fija = (l) => { l.encodeSync("jpeg", 1); return l; }; // ya en píxeles: dibujarlo es solo copiarlo

// ---------------------------------------------------------------- las fachadas
// Cada tipo de fachada es una lámina de 16 × 32 ventanas (cada una, una planta y un módulo), de día (en tres tonos) y
// de noche, con las luces encendidas o apagadas al azar (con semilla); cada cara de cada edificio coge un trozo
// distinto. También en pequeño (1/4 y 1/16), para los edificios lejanos.
export const FACHADAS = ["cristal", "oficinas", "viviendas", "ladrillo"];
const COLS = 16, FILAS = 32, CW = 32, CH = 48, laminas = new Map();
// Los tonos de día de cada fachada (lo que tiñe la lámina) y su color medio, de día y de noche (para lo muy lejano).
const TONOS = { cristal: [[214, 228, 244], [196, 220, 236], [232, 236, 240]], oficinas: [[244, 242, 236], [214, 220, 230], [238, 226, 208]], viviendas: [[255, 248, 236], [236, 228, 220], [252, 232, 208]], ladrillo: [[255, 244, 236], [232, 212, 202], [255, 226, 206]] };
const MEDIO = { cristal: [[106, 128, 150], [22, 28, 42]], oficinas: [[148, 152, 156], [28, 29, 36]], viviendas: [[186, 176, 162], [32, 28, 27]], ladrillo: [[136, 82, 64], [30, 23, 21]] };
function fachada(tipo, noche, nivel = 0, tono = 0) {
  const k = [tipo, noche, nivel, noche ? 0 : tono].join("|");
  if (laminas.has(k)) return laminas.get(k);
  let l;
  if (nivel > 0) {
    const m = fachada(tipo, noche, nivel - 1, tono);
    l = lienzo(m.width / 4, m.height / 4);
    const c = l.getContext("2d"); c.imageSmoothingQuality = "high"; c.drawImage(m, 0, 0, m.width, m.height, 0, 0, l.width, l.height);
  } else if (!noche && tono > 0) {
    const m = fachada(tipo, false, 0, 0);
    l = lienzo(m.width, m.height);
    const c = l.getContext("2d"); c.drawImage(m, 0, 0); c.globalCompositeOperation = "multiply"; c.fillStyle = css(TONOS[tipo][tono]); c.fillRect(0, 0, l.width, l.height);
  } else {
    l = pintaFachada(tipo, noche);
    if (!noche) { const c = l.getContext("2d"); c.globalCompositeOperation = "multiply"; c.fillStyle = css(TONOS[tipo][0]); c.fillRect(0, 0, l.width, l.height); }
  }
  laminas.set(k, fija(l));
  return l;
}
// Cómo es cada fachada, ventana a ventana (lo mismo sirve para pintar la lámina y para dibujar de cerca, a trazos):
// { pared, hueco: [x, y, ancho, alto] de la ventana dentro de su módulo (de 0 a 1), marco, alfeizar, lineas: las rayas
// de cada planta [y, alto, color], montante, celdas: para cada ventana [color, color de arriba, persiana (0 a 1)] }.
const disenios = new Map();
function disenio(tipo, noche) {
  const k = tipo + noche;
  if (disenios.has(k)) return disenios.get(k);
  const az = azar(7000 + FACHADAS.indexOf(tipo) * 101), celdas = [], tramo = Array.from({ length: FILAS }, () => az());
  const enc = (b, fria) => { const col = fria ? [205, 226, 255] : [[255, 212, 150], [255, 190, 112], [255, 232, 196], [255, 204, 128]][Math.floor(az() * 4)]; return [css(mez3([40, 30, 20], col, b)), css(mez3([40, 30, 20], col, b * 0.75)), az() < 0.3 ? 0.2 + az() * 0.4 : 0]; };
  const apag = (dia) => { if (dia) { const v = az() * 14; return [`rgb(${84 + v},${104 + v},${128 + v})`, `rgb(${148 + v},${170 + v},${196 + v})`, 0]; } const v = az() * 10; return [`rgb(${18 + v},${22 + v},${33 + v})`, `rgb(${30 + v},${34 + v},${50 + v})`, 0]; };
  let d;
  if (tipo === "cristal") {
    d = { pared: noche ? "#0f141e" : "#4a5a6e", hueco: [0.03, 0.02, 0.94, 0.88], lineas: [], marco: null };
    for (let j = 0; j < FILAS; j++) for (let i = 0; i < COLS; i++) {
      if (noche) celdas.push(tramo[j] < 0.32 && az() < 0.85 ? enc(0.55 + az() * 0.35, az() < 0.7) : (() => { const v = az() * 8; return [`rgb(${20 + v},${27 + v},${40 + v})`, `rgb(${26 + v},${33 + v},${48 + v})`, 0]; })());
      else { const v = az() * 8; celdas.push([`rgb(${120 + v},${146 + v},${174 + v})`, az() < 0.1 ? `rgb(${170 + v},${186 + v},${204 + v})` : `rgb(${128 + v},${154 + v},${182 + v})`, 0]); }
    }
  } else if (tipo === "oficinas") {
    d = { pared: noche ? "#1c1e26" : "#cecbc4", hueco: [0.05, 0.36, 0.95, 0.56], lineas: [[0.34, 0.04, noche ? "#2a2c34" : "#ebe9e2"], [0.92, 0.04, noche ? "#14151a" : "#a8a6a0"]], marco: null };
    for (let j = 0; j < FILAS; j++) for (let i = 0; i < COLS; i++) celdas.push(noche ? (tramo[j] < 0.45 && az() < 0.8 ? enc(0.5 + az() * 0.4, az() < 0.45) : apag(false)) : apag(true));
  } else {
    const ladr = tipo === "ladrillo";
    d = { pared: noche ? (ladr ? "#2a1d1a" : "#26231f") : ladr ? "#a2553e" : "#ddd3c2", hueco: ladr ? [0.27, 0.16, 0.46, 0.62] : [0.21, 0.2, 0.58, 0.52], marco: noche ? null : ladr ? "#e8e2d6" : "#f4f2ec", alfeizar: noche ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.6)", lineas: [], ruido: !noche, ladr };
    for (let j = 0; j < FILAS; j++) for (let i = 0; i < COLS; i++) {
      if (noche) celdas.push(az() < (tramo[j] < 0.3 ? 0.65 : 0.28) ? enc(0.55 + az() * 0.45, az() < 0.15) : apag(false));
      else { const c = apag(true); if (az() < 0.3) c[2] = 0.3 + az() * 0.5; celdas.push(c); }
    }
    if (ladr) d.cornisa = noche ? "#1a1312" : "#d6cbb8";
    d.balcon = noche ? "#14120f" : "#7c7a76"; d.balcones = tramo.map((v) => v > 0.82);
  }
  d.celdas = celdas; d.persiana = noche ? "rgba(30,20,12,0.6)" : tipo === "ladrillo" ? "rgba(236,226,204,0.9)" : "rgba(226,214,190,0.92)";
  disenios.set(k, d);
  return d;
}
function pintaFachada(tipo, noche) {
  const l = lienzo(COLS * CW, FILAS * CH), c = l.getContext("2d"), d = disenio(tipo, noche), W = COLS * CW, H = FILAS * CH;
  const rect = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  rect(0, 0, W, H, d.pared);
  if (d.ruido) { c.globalCompositeOperation = "multiply"; c.globalAlpha = 0.35; c.drawImage(ruido(256, 801, d.ladr ? 60 : 20, 3, d.ladr ? "lineas" : "manchas"), 0, 0, W, H); c.globalAlpha = 1; c.globalCompositeOperation = "source-over"; }
  const [hx, hy, hw, hh] = d.hueco;
  for (let j = 0; j < FILAS; j++) {
    for (let i = 0; i < COLS; i++) {
      const [c1, c2, pe] = d.celdas[j * COLS + i], x = i * CW + hx * CW, y = j * CH + hy * CH, w = hw * CW, h = hh * CH;
      if (d.marco) rect(x - 2, y - 2, w + 4, h + 4, d.marco);
      rect(x, y, w, h, c1); rect(x, y, w, h * 0.4, c2);
      if (pe) rect(x, y, w, h * pe, d.persiana);
      if (d.alfeizar) rect(x - 3, y + h + 1, w + 6, 3, d.alfeizar);
    }
    for (const [ly, lh, col] of d.lineas) rect(0, j * CH + ly * CH, W, lh * CH, col);
    if (d.cornisa && j % 4 === 3) rect(0, j * CH + CH - 5, W, 5, d.cornisa);
    if (d.balcones && d.balcones[j] && !d.ladr) rect(0, j * CH + CH * 0.8, W, 3, d.balcon);
  }
  return l;
}

// Qué columna (o fila) de la lámina le toca a la ventana i de n, empezando en ofs: cada tramo de N, seguido y entero.
const enLamina = (i, n, ofs, N) => { const k = Math.floor(i / N), nc = Math.min(N, n - k * N); return ((ofs + k * N) % (N - nc + 1)) + (i % N); };

// Una cara vista de cerca, a trazos (la lámina se vería borrosa): cada ventana en su sitio, con la misma luz encendida o
// apagada que en la lámina. d: el diseño de la fachada; P: la esquina de abajo; U: a lo ancho; b: el volumen.
function deCerca(g, cam, d, P, U, b, cols, filas, u0, v0) {
  const UU = [U[0] / cols, U[2] / cols], fh = (b.y1 - b.y0) / filas, [hx, hy, hw, hh] = d.hueco;
  const pt = (u, v) => { const c = enCam(cam, [P[0] + UU[0] * u, b.y1 - fh * v, P[2] + UU[1] * u]); return c[2] < CERCA ? null : aPant(c); };
  const quad = (u0q, v0q, u1q, v1q, col) => {
    const a = pt(u0q, v0q), bb = pt(u1q, v0q), c = pt(u1q, v1q), e = pt(u0q, v1q);
    if (!a || !bb || !c || !e) return;
    if (Math.max(a[0], bb[0], c[0], e[0]) < 0 || Math.min(a[0], bb[0], c[0], e[0]) > 1080 || Math.max(a[1], bb[1], c[1], e[1]) < 0 || Math.min(a[1], bb[1], c[1], e[1]) > 1920) return;
    g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(bb[0], bb[1]); g.lineTo(c[0], c[1]); g.lineTo(e[0], e[1]); g.closePath(); g.fillStyle = col; g.fill();
  };
  for (let j = 0; j < filas; j++) {
    const cv = enLamina(j, filas, v0, FILAS);
    for (const [ly, lh, col] of d.lineas) quad(0, j + ly, cols, j + ly + lh, col);
    if (d.cornisa && cv % 4 === 3) quad(0, j + 0.9, cols, j + 1, d.cornisa);
    if (d.balcones && d.balcones[cv] && !d.ladr) quad(0, j + 0.8, cols, j + 0.86, d.balcon);
    for (let i = 0; i < cols; i++) {
      const [c1, c2, pe] = d.celdas[cv * COLS + enLamina(i, cols, u0, COLS)], x0 = i + hx, y0 = j + hy, x1 = x0 + hw, y1 = y0 + hh;
      if (d.marco) quad(x0 - 0.05, y0 - 0.04, x1 + 0.05, y1 + 0.04, d.marco);
      quad(x0, y0, x1, y1, c1); quad(x0, y0, x1, y0 + hh * 0.4, c2);
      if (pe) quad(x0, y0, x1, y0 + hh * pe, d.persiana);
      if (d.alfeizar) quad(x0 - 0.08, y1 + 0.02, x1 + 0.08, y1 + 0.07, d.alfeizar);
    }
  }
}

// Pinta en g un trozo de fachada (la lámina img, de sx, sy, sw, sh) sobre el cuadrilátero del mundo que empieza en la
// esquina P (arriba a la izquierda) y sigue U (a lo ancho) y V (hacia abajo). Se parte en trozos más pequeños hasta que
// cada uno se puede pintar recto (sin que se note la perspectiva) y se salta lo que queda detrás de la cámara. Cada
// trozo se estira un poco por los lados que tocan a otro trozo (fuera: los bordes que son borde de la cara).
function tela(g, cam, T0, P, U, V, img, sx, sy, sw, sh, prof, fuera = 15) {
  const A = enCam(cam, P), B = enCam(cam, [P[0] + U[0], P[1] + U[1], P[2] + U[2]]), C = enCam(cam, [P[0] + V[0], P[1] + V[1], P[2] + V[2]]), D = enCam(cam, [P[0] + U[0] + V[0], P[1] + U[1] + V[1], P[2] + U[2] + V[2]]);
  const nd = (A[2] < CERCA) + (B[2] < CERCA) + (C[2] < CERCA) + (D[2] < CERCA);
  if (nd === 4) return 0;
  const porU = Math.abs(A[2] - B[2]) + Math.abs(C[2] - D[2]) > Math.abs(A[2] - C[2]) + Math.abs(B[2] - D[2]);
  let parte = 0;
  if (nd > 0) { if (prof >= 7) return 0; parte = porU ? 1 : 2; }
  else {
    const a = aPant(A), b = aPant(B), c = aPant(C), d = aPant(D), err = Math.hypot(d[0] - (b[0] + c[0] - a[0]), d[1] - (b[1] + c[1] - a[1]));
    if (err > (fuera ? 1 : 1.8) && prof < 8) parte = porU ? 1 : 2;
    else {
      const m11 = (b[0] - a[0]) / sw, m12 = (b[1] - a[1]) / sw, m21 = (c[0] - a[0]) / sh, m22 = (c[1] - a[1]) / sh;
      // un punto de lámina de más por los lados que tocan a otro trozo (fuera: 1 izquierda, 2 derecha, 4 arriba, 8 abajo)
      const l = fuera & 1 ? 0 : 1, r = fuera & 2 ? 0 : 1, t = fuera & 4 ? 0 : 1, bo = fuera & 8 ? 0 : 1;
      g.setTransform(T0); g.transform(m11, m12, m21, m22, a[0] - m11 * sx - m21 * sy, a[1] - m12 * sx - m22 * sy);
      g.drawImage(img, sx - l, sy - t, sw + l + r, sh + t + bo, sx - l, sy - t, sw + l + r, sh + t + bo);
      return 1;
    }
  }
  if (parte === 1) {
    const U2 = [U[0] / 2, U[1] / 2, U[2] / 2];
    return tela(g, cam, T0, P, U2, V, img, sx, sy, sw / 2, sh, prof + 1, fuera & ~2) + tela(g, cam, T0, [P[0] + U2[0], P[1] + U2[1], P[2] + U2[2]], U2, V, img, sx + sw / 2, sy, sw / 2, sh, prof + 1, fuera & ~1);
  }
  const V2 = [V[0] / 2, V[1] / 2, V[2] / 2];
  return tela(g, cam, T0, P, U, V2, img, sx, sy, sw, sh / 2, prof + 1, fuera & ~8) + tela(g, cam, T0, [P[0] + V2[0], P[1] + V2[1], P[2] + V2[2]], U, V2, img, sx, sy + sh / 2, sw, sh / 2, prof + 1, fuera & ~4);
}

// ---------------------------------------------------------------- el día y la noche
// La luz de la ciudad según noche (0 de día … 1 de noche): de dónde viene el sol, el color de la neblina de lejos (el
// del cielo en el horizonte) y el de las sombras.
const SOL = (() => { const s = [-0.55, 0.62, 0.56], l = Math.hypot(...s); return s.map((v) => v / l); })();
const HORIZONTE = [[214, 222, 232], [74, 52, 72]];
function ambiente(op) {
  if (op._am) return op._am;
  const n = Math.max(0, Math.min(1, op.noche ?? 0)), sol = op.sol ? (() => { const l = Math.hypot(...op.sol); return op.sol.map((v) => v / l); })() : SOL;
  // al anochecer (noche hacia 0,5) todo se tiñe de naranja: el horizonte, la neblina y la luz del sol
  const tarde = Math.max(0, 1 - Math.abs(n - 0.45) / 0.4);
  return {
    n, sol, fr: 1 - n, tarde,
    neblina: mez3(mez3(op.neblinaDia || HORIZONTE[0], op.neblinaNoche || HORIZONTE[1], n), [236, 150, 110], tarde * 0.55), niebla: op.niebla ?? 2600,
    sombra: mez3(mez3([22, 38, 76], [4, 6, 14], n), [40, 24, 60], tarde * 0.4), luzSol: mez3([255, 230, 196], [255, 150, 80], tarde),
  };
}
// Varias capas de color encima de algo, juntas en una: [[r, g, b], alfa], de abajo arriba → [[r, g, b], alfa].
function junta(capas) {
  let c = [0, 0, 0], a = 0;
  for (const [cc, aa] of capas) { if (aa <= 0) continue; const na = aa + a * (1 - aa); c = [(cc[0] * aa + c[0] * a * (1 - aa)) / na, (cc[1] * aa + c[1] * a * (1 - aa)) / na, (cc[2] * aa + c[2] * a * (1 - aa)) / na]; a = na; }
  return [c, a];
}
const neblinaA = (am, z) => Math.min(0.94, 1 - Math.exp(-z / am.niebla));

// ---------------------------------------------------------------- un edificio
// Un edificio: { x, z (el centro de su planta), w (ancho, en x), d (fondo, en z), h (alto), tipo (una de FACHADAS),
// tono (0 a 2: el tinte de su fachada de día), piso (alto de una planta), modulo (ancho de una ventana), cajas (sus
// volúmenes, de abajo arriba: [{ x, z, w, d, y0, y1 }]), techo (máquinas: cajas pequeñas), techado ([r, g, b] de la
// azotea), antena (su alto), semilla }. unEdificio(semilla, { x, z, w, d, h, tipo }) hace uno completo con su semilla.
export function unEdificio(semilla, m = {}) {
  const az = azar(semilla * 13 + 5), h = m.h ?? 30 + az() * 60, w = m.w ?? 18 + az() * 14, d = m.d ?? 18 + az() * 14, x = m.x ?? 0, z = m.z ?? 0;
  const tipo = m.tipo || (h > 70 ? (az() < 0.6 ? "cristal" : "oficinas") : h > 32 ? ["oficinas", "viviendas", "cristal"][Math.floor(az() * 3)] : az() < 0.45 ? "ladrillo" : "viviendas");
  const piso = tipo === "cristal" ? 3.9 : tipo === "oficinas" ? 3.7 : 3.1, modulo = tipo === "cristal" ? 1.8 : tipo === "oficinas" ? 2.4 : 3.2;
  const cajas = [];
  if (m.cajas) cajas.push(...m.cajas);
  else if (h > 60 && az() < 0.65) {
    // una torre sobre un zócalo, a veces con un remate más estrecho arriba
    const hz = 12 + Math.floor(az() * 4) * piso, tw = w * (0.6 + az() * 0.25), td = d * (0.6 + az() * 0.25);
    cajas.push({ x, z, w, d, y0: 0, y1: hz });
    if (az() < 0.5) { const hr = Math.round((h * (0.8 + az() * 0.1)) / piso) * piso; cajas.push({ x, z, w: tw, d: td, y0: hz, y1: hr }, { x, z, w: tw * 0.72, d: td * 0.72, y0: hr, y1: h }); }
    else cajas.push({ x, z, w: tw, d: td, y0: hz, y1: h });
  } else cajas.push({ x, z, w, d, y0: 0, y1: h });
  const top = cajas[cajas.length - 1], techo = [];
  // en la azotea: la caseta del ascensor y unas máquinas
  if (az() < 0.85) techo.push({ x: top.x + (az() - 0.5) * top.w * 0.4, z: top.z + (az() - 0.5) * top.d * 0.4, w: 3 + az() * 4, d: 3 + az() * 4, y0: top.y1, y1: top.y1 + 2.6 + az() * 2 });
  const nm = Math.floor(az() * 4);
  for (let i = 0; i < nm; i++) techo.push({ x: top.x + (az() - 0.5) * top.w * 0.7, z: top.z + (az() - 0.5) * top.d * 0.7, w: 1.2 + az() * 2, d: 1.2 + az() * 2, y0: top.y1, y1: top.y1 + 0.8 + az() * 1.2 });
  const techado = [[170, 168, 164], [128, 130, 134], [104, 100, 96], [158, 148, 132], [186, 182, 172], [96, 112, 92]][Math.floor(az() * (az() < 0.1 ? 6 : 5))];
  return { x, z, w, d, h, tipo, tono: m.tono ?? Math.floor(az() * 3), piso, modulo, cajas, techo, techado, antena: m.antena ?? (h > 90 && az() < 0.6 ? h * (0.08 + az() * 0.12) : 0), semilla, ofs: Array.from({ length: 16 }, () => [Math.floor(az() * COLS), Math.floor(az() * FILAS)]) };
}

// Las caras de una caja que se ven desde la cámara: [esquina de abajo a la izquierda, a lo ancho, normal, cuál].
function caras(cam, b) {
  const x0 = b.x - b.w / 2, x1 = b.x + b.w / 2, z0 = b.z - b.d / 2, z1 = b.z + b.d / 2, p = cam.p, o = [];
  if (p[2] > z1) o.push([[x0, b.y0, z1], [b.w, 0, 0], [0, 0, 1], 0]);
  if (p[2] < z0) o.push([[x1, b.y0, z0], [-b.w, 0, 0], [0, 0, -1], 1]);
  if (p[0] > x1) o.push([[x1, b.y0, z1], [0, 0, -b.d], [1, 0, 0], 2]);
  if (p[0] < x0) o.push([[x0, b.y0, z0], [0, 0, b.d], [-1, 0, 0], 3]);
  return o;
}
const tapa = (b, y = b.y1, m = 0) => [[b.x - b.w / 2 + m, y, b.z - b.d / 2 + m], [b.x + b.w / 2 - m, y, b.z - b.d / 2 + m], [b.x + b.w / 2 - m, y, b.z + b.d / 2 - m], [b.x - b.w / 2 + m, y, b.z + b.d / 2 - m]];

// Una caja lisa (una máquina de la azotea, un coche): sus caras de un color, cada una con su luz.
function cajaLisa(g, cam, b, col, am) {
  for (const [P, U, N] of caras(cam, b)) {
    const q = poligonoEn(cam, [P, [P[0] + U[0], P[1], P[2] + U[2]], [P[0] + U[0], b.y1, P[2] + U[2]], [P[0], b.y1, P[2]]]);
    if (!q) continue;
    const k = 0.5 + 0.5 * Math.max(0, N[0] * am.sol[0] + N[2] * am.sol[2]) * am.fr;
    traza(g, q); g.fillStyle = css(mez3([col[0] * k, col[1] * k, col[2] * k], am.sombra, 0.12)); g.fill();
  }
  if (cam.p[1] > b.y1) { const q = poligonoEn(cam, tapa(b)); if (q) { const k = 0.8 + 0.3 * am.sol[1] * am.fr; traza(g, q); g.fillStyle = css([col[0] * k, col[1] * k, col[2] * k]); g.fill(); } }
}

// Un edificio visto con la cámara cam (e, de unEdificio() o de ciudad()). t: el segundo (la luz de la antena parpadea).
// op: { noche (0 de día … 1 de noche), sol ([x, y, z] hacia donde está), niebla (metros: a esa distancia queda un 63 %
// de neblina; 2600), neblinaDia, neblinaNoche ([r, g, b]) }.
export function edificio(g, cam, e, t = 0, op = {}) {
  const am = ambiente(op);
  g.save();
  const T0 = g.getTransform();
  // de abajo arriba si la cámara está por encima del zócalo; si no, al revés (lo de abajo, más cerca, tapa lo de arriba)
  const cajas = cam.p[1] > e.cajas[0].y1 ? e.cajas : e.cajas.slice().reverse();
  let grande = 0;
  for (const b of cajas) grande = Math.max(grande, volumen(g, cam, e, b, e.cajas.indexOf(b), am, T0));
  g.setTransform(T0);
  if (grande > 160 && e.techo && cam.p[1] > e.cajas[e.cajas.length - 1].y1 - 1) for (const b of e.techo) cajaLisa(g, cam, b, mez3(e.techado.map((v) => v * 1.05), [40, 40, 46], am.n), am);
  if (e.antena) antena(g, cam, e, am, t);
  g.restore();
}
const proyectaUno = (cam, X) => { const c = enCam(cam, X); return c[2] > CERCA ? aPant(c) : null; };

// Un volumen del edificio: sus caras con la fachada, su luz, su planta baja y su azotea. Devuelve lo grande que sale.
function volumen(g, cam, e, b, ib, am, T0) {
  const A = g.globalAlpha;
  const tipo = e.tipo, md = MEDIO[tipo][0], tn = TONOS[tipo][e.tono], medio = mez3([(md[0] * tn[0]) / 255, (md[1] * tn[1]) / 255, (md[2] * tn[2]) / 255], MEDIO[tipo][1], am.n);
  let grande = 0;
  for (const [P, U, N, cara] of caras(cam, b)) {
    const ancho = Math.hypot(U[0], U[2]), alto = b.y1 - b.y0;
    const pts = [P, [P[0] + U[0], P[1], P[2] + U[2]], [P[0] + U[0], b.y1, P[2] + U[2]], [P[0], b.y1, P[2]]], q = poligonoEn(cam, pts);
    if (!q) continue;
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, zm = 0, cortada = q.length !== 4;
    for (const v of q) { x0 = Math.min(x0, v[0]); x1 = Math.max(x1, v[0]); y0 = Math.min(y0, v[1]); y1 = Math.max(y1, v[1]); zm += v[2]; if (v[2] <= CERCA + 1e-6) cortada = true; }
    if (x1 < -2 || x0 > 1082 || y1 < -2 || y0 > 1922) continue;
    zm /= q.length; grande = Math.max(grande, y1 - y0, x1 - x0);
    // la luz de la cara: el sol o la sombra fría, la neblina y, abajo, lo oscuro de la calle y la planta baja
    const k = N[0] * am.sol[0] + N[2] * am.sol[2], fr = am.fr, nb = neblinaA(am, zm);
    const luz = k > 0 ? [am.luzSol, 0.2 * k * fr] : [am.sombra, Math.min(0.62, 0.3 - 0.5 * k) * fr + -0.3 * k * am.n];
    const filas = Math.max(1, Math.round(alto / e.piso)), cols = Math.max(1, Math.round(ancho / e.modulo)), px = (y1 - y0) / filas;
    // lo muy pequeño: un color liso
    if (x1 - x0 < 2.5 || px < 0.9) { const [c, a] = junta([[medio, 1], luz, [am.neblina, nb]]); traza(g, q); g.fillStyle = css(c, a); g.fill(); continue; }
    if (cortada) { g.save(); traza(g, q); g.clip(); g.fillStyle = css(medio); g.fillRect(x0 - 1, y0 - 1, x1 - x0 + 2, y1 - y0 + 2); }
    // la fachada: tantas ventanas como quepan, desde arriba, con el trozo de lámina de esta cara (en trozos si no cabe)
    const nivel = px > 9 ? 0 : px > 2.4 ? 1 : 2, esc = nivel === 0 ? 1 : nivel === 1 ? 0.25 : 0.0625, [u0, v0] = e.ofs[(cara + ib * 4) % 16];
    const capas = [], cerca = px > 70 && (am.n < 0.02 || am.n > 0.98);
    if (cerca) {
      // de cerca, a trazos: la pared, cada ventana y el tinte del edificio
      const noche = am.n > 0.5, d = disenio(tipo, noche);
      traza(g, q); g.fillStyle = d.pared; g.fill();
      deCerca(g, cam, d, P, U, b, cols, filas, u0, v0);
      if (!noche) { g.globalCompositeOperation = "multiply"; traza(g, q); g.fillStyle = css(TONOS[tipo][e.tono]); g.fill(); g.globalCompositeOperation = "source-over"; }
    } else {
      // de lejos, con la lámina: en tramos de 16 × 32 ventanas, cada uno de un trozo seguido de la lámina
      const UU = [U[0] / cols, 0, U[2] / cols], VV = [0, -alto / filas, 0];
      if (am.n < 0.98) capas.push([fachada(tipo, false, nivel, e.tono), 1]);
      if (am.n > 0.02) capas.push([fachada(tipo, true, nivel), am.n < 0.98 ? am.n : 1]);
      for (const [img, al] of capas) {
        g.globalAlpha = A * al;
        for (let j = 0; j < filas; j += FILAS) for (let i = 0; i < cols; i += COLS) {
          const nc = Math.min(COLS, cols - i), nf = Math.min(FILAS, filas - j), cu = enLamina(i, cols, u0, COLS), cv = enLamina(j, filas, v0, FILAS);
          const fuera = (i === 0 ? 1 : 0) | (i + nc === cols ? 2 : 0) | (j === 0 ? 4 : 0) | (j + nf === filas ? 8 : 0);
          tela(g, cam, T0, [P[0] + UU[0] * i, b.y1 + VV[1] * j, P[2] + UU[2] * i], [UU[0] * nc, 0, UU[2] * nc], [0, VV[1] * nf, 0], img, cu * CW * esc, cv * CH * esc, nc * CW * esc, nf * CH * esc, 0, fuera);
        }
      }
    }
    g.setTransform(T0); g.globalAlpha = A;
    // encima, en una sola capa: la luz del sol o la sombra, el reflejo del cielo y la neblina; y abajo, en su franja,
    // lo oscuro de la calle y la planta baja (encendida de noche)
    const cielo = tipo === "cristal" ? 0.08 * fr : tipo === "oficinas" ? 0.03 * fr : 0;
    { const [c, a] = junta([luz, [[255, 255, 255], cielo], [am.neblina, nb]]); traza(g, q); g.fillStyle = css(c, a); g.fill(); }
    if (b.y0 < 1) {
      const hb = Math.min(alto, 14), pb = proyectaUno(cam, [P[0] + U[0] / 2, b.y0, P[2] + U[2] / 2]), pt = proyectaUno(cam, [P[0] + U[0] / 2, b.y0 + hb, P[2] + U[2] / 2]);
      const fq = poligonoEn(cam, [P, [P[0] + U[0], P[1], P[2] + U[2]], [P[0] + U[0], b.y0 + hb, P[2] + U[2]], [P[0], b.y0 + hb, P[2]]]);
      if (fq && pb && pt && pb[1] - pt[1] > 2.5) {
        const gr = g.createLinearGradient(pb[0], pb[1], pt[0], pt[1]), nc = 1 - nb;
        for (const hh of [0, 4.3, 4.6, hb]) {
          const calle = Math.max(0, 1 - hh / 14), pbaja = hh < 4.5 ? 1 - hh / 5 : 0;
          const [c, a] = junta([[[0, 0, 0], calle * (0.4 * fr + 0.15)], [am.n > 0.02 ? [255, 186, 110] : [40, 48, 60], pbaja * (am.n > 0.02 ? 0.7 * am.n : 0.85 * fr)]]);
          gr.addColorStop(hh / hb, css(c, a * nc));
        }
        traza(g, fq); g.fillStyle = gr; g.fill();
      }
    }
    if (cortada) g.restore();
    // el canto de la esquina que da al sol, una línea de luz
    if (k > 0.2 && fr > 0.3 && y1 - y0 > 60) {
      const ea = proyectaUno(cam, P), eb = proyectaUno(cam, [P[0], b.y1, P[2]]);
      if (ea && eb) { g.strokeStyle = `rgba(255,240,220,${0.3 * fr * (1 - nb)})`; g.lineWidth = 1.2; g.beginPath(); g.moveTo(ea[0], ea[1]); g.lineTo(eb[0], eb[1]); g.stroke(); }
    }
  }
  // la azotea: el pretil alrededor y el suelo de la azotea, algo más oscuro
  if (cam.p[1] > b.y1) {
    const q = poligonoEn(cam, tapa(b));
    if (q) {
      const z = q.reduce((s, v) => s + v[2], 0) / q.length, nb = neblinaA(am, z), tech = mez3(e.techado, [34, 34, 40], am.n), lu = 0.84 + 0.22 * am.sol[1] * am.fr;
      traza(g, q); g.fillStyle = css(mez3([tech[0] * lu, tech[1] * lu, tech[2] * lu], am.neblina, nb)); g.fill();
      let w = 0; for (const v of q) w = Math.max(w, Math.abs(v[0] - q[0][0]));
      const m = Math.min(0.7, b.w * 0.05), qi = w > 14 ? poligonoEn(cam, tapa(b, b.y1, m)) : null;
      if (qi) { traza(g, qi); g.fillStyle = css(mez3([tech[0] * lu * 0.8, tech[1] * lu * 0.8, tech[2] * lu * 0.82], am.neblina, nb)); g.fill(); }
    }
  }
  return grande;
}

// La antena de lo alto, con su luz roja que parpadea de noche.
function antena(g, cam, e, am, t) {
  const top = e.cajas[e.cajas.length - 1], a = proyectaUno(cam, [top.x, top.y1, top.z]), b = proyectaUno(cam, [top.x, top.y1 + e.antena, top.z]);
  if (!a || !b) return;
  g.strokeStyle = css(mez3(am.n > 0.5 ? [60, 60, 70] : [90, 92, 98], am.neblina, neblinaA(am, a[2]))); g.lineWidth = Math.max(1, (F * 0.5) / a[2]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
  if (am.n > 0.05) {
    const on = 0.5 + 0.5 * Math.cos((t + e.semilla * 0.37) * Math.PI * 2 * 0.7), tam = Math.max(10, (F * 6) / b[2]);
    g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha *= am.n * (0.25 + 0.75 * on * on); g.drawImage(brillos("255,60,50"), b[0] - tam / 2, b[1] - tam / 2, tam, tam); g.restore();
  }
}
// Los brillos de luz.js, ya en píxeles (para dibujar miles sin que cuesten).
const fijos = new Map();
function brillos(c) { if (!fijos.has(c)) { const h = halo(c), l = lienzo(h.width, h.height); l.getContext("2d").drawImage(h, 0, 0); fijos.set(c, fija(l)); } return fijos.get(c); }

// ---------------------------------------------------------------- una ciudad entera
// Una ciudad hecha con una semilla (una vez, arriba del archivo del plano). op:
//   manzanas: cuántas por lado (12) · lado: lo que mide una manzana (70 m) · calle: el ancho de las calles (20 m)
//   alto: el alto de los edificios más altos (220 m) · centro: [x, z] del centro, donde están los rascacielos
//   parques: la parte de las manzanas que son parque (0,08)
// Devuelve { edificios, manzanas, calles, farolas, arboles, coches }: lo que dibuja dibujaCiudad(). Se pueden quitar o
// añadir edificios (con unEdificio) antes de dibujarla.
export function ciudad(semilla, op = {}) {
  const az = azar(semilla * 977 + 3), N = op.manzanas || 12, B = op.lado || 70, S = op.calle || 20, H = op.alto || 220, P = B + S;
  const [cx, cz] = op.centro || [0, 0], x0 = cx - (N * P - S) / 2, z0 = cz - (N * P - S) / 2, R = (N * P) / 2;
  const edificios = [], manzanas = [], arboles = [], farolas = [], calles = [], coches = [];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const mx = x0 + i * P, mz = z0 + j * P, r = Math.hypot(mx + B / 2 - cx, mz + B / 2 - cz) / R;
    const parque = az() < (op.parques ?? 0.08) && r > 0.25;
    manzanas.push({ x0: mx, z0: mz, x1: mx + B, z1: mz + B, parque });
    if (parque) { for (let k = 0; k < 26; k++) arboles.push({ p: [mx + 4 + az() * (B - 8), 0, mz + 4 + az() * (B - 8)], r: 3 + az() * 3, h: 5 + az() * 5, s: az() }); continue; }
    // la manzana, en parcelas: de 1 a 3 a lo ancho y a lo hondo
    const ni = 1 + Math.floor(az() * 3), nj = 1 + Math.floor(az() * 3), alto = H * Math.exp(-(r * r) / 0.18);
    for (let b = 0; b < nj; b++) for (let a = 0; a < ni; a++) {
      const w = B / ni, d = B / nj, m = 1.5 + az() * 3, h = Math.max(9, alto * Math.pow(az(), 1.6) * (0.5 + az() * 0.6) + 8 + az() * 18);
      edificios.push(unEdificio(semilla * 1000 + edificios.length, { x: mx + (a + 0.5) * w, z: mz + (b + 0.5) * d, w: w - 2 * m, d: d - 2 * m, h: Math.round(h / 3.5) * 3.5 }));
    }
  }
  // las calles (sus ejes), las farolas a los dos lados y los coches, que van por sus carriles
  for (let k = 0; k <= N; k++) {
    const c = x0 + k * P - S / 2, d = z0 + k * P - S / 2;
    calles.push({ a: [c, z0 - S], b: [c, z0 + N * P], eje: "z" }, { a: [x0 - S, d], b: [x0 + N * P, d], eje: "x" });
  }
  for (const c of calles) {
    const L = Math.hypot(c.b[0] - c.a[0], c.b[1] - c.a[1]), ux = (c.b[0] - c.a[0]) / L, uz = (c.b[1] - c.a[1]) / L, nx = -uz, nz = ux;
    for (let s = 12; s < L; s += 32) for (const ld of [-1, 1]) farolas.push([c.a[0] + ux * s + nx * ld * (S / 2 - 1), 7.5, c.a[1] + uz * s + nz * ld * (S / 2 - 1)]);
    for (const ld of [-1, 1]) for (let q = 0; q < L / 45; q++) coches.push({ c, ld, s0: az() * L, v: (9 + az() * 6) * ld, L, col: [[200, 30, 30], [240, 240, 240], [30, 30, 34], [60, 90, 150], [150, 150, 155], [210, 180, 40]][Math.floor(az() * 6)] });
  }
  return { edificios, manzanas, calles, farolas, arboles, coches };
}

// El cielo detrás de una ciudad, para la cámara cam: de día, azul que se aclara hacia el horizonte (y el sol si se ve);
// de noche, casi negro arriba y con el resplandor de la ciudad abajo, y alguna estrella. op: { noche, sol }. Devuelve
// la altura del horizonte en la pantalla.
export function cieloCiudad(g, cam, op = {}) {
  const am = ambiente(op), n = am.n, f = cam.e.f, fh = Math.hypot(f[0], f[2]) || 1, c0 = { p: [0, 0, 0], e: cam.e };
  const hz = proyectaUno(c0, [(f[0] / fh) * 1e6, 0, (f[2] / fh) * 1e6]), yh = hz ? hz[1] : f[1] > 0 ? 3000 : -1000;
  g.save();
  const gr = g.createLinearGradient(0, yh - 1900, 0, yh + 60);
  const ta = am.tarde;
  gr.addColorStop(0, css(mez3(mez3([52, 104, 178], [3, 5, 14], n), [30, 34, 80], ta * 0.5))); gr.addColorStop(0.5, css(mez3(mez3([112, 158, 212], [10, 12, 30], n), [120, 80, 130], ta * 0.6)));
  gr.addColorStop(0.84, css(mez3(mez3([178, 202, 230], [36, 28, 58], n), [240, 140, 110], ta * 0.7))); gr.addColorStop(1, css(am.neblina));
  g.fillStyle = gr; g.fillRect(0, 0, 1080, 1920);
  if (n > 0.3) {
    const az = azar(55), dx = Math.atan2(f[0], -f[2]) * 900;
    for (let i = 0; i < 260; i++) {
      const x = ((((az() * 3000 - dx) % 3000) + 3000) % 3000) - 900, y = yh - 160 - az() * 1900, b = az();
      if (x < 0 || x > 1080 || y < 0 || y > 1920) continue;
      g.fillStyle = `rgba(230,235,255,${(n - 0.3) * (0.25 + 0.6 * b * b)})`; g.fillRect(x, y, b > 0.9 ? 2.2 : 1.4, b > 0.9 ? 2.2 : 1.4);
    }
  }
  // el sol, si queda delante
  if (n < 0.9) {
    const s = proyectaUno(c0, am.sol.map((v) => v * 1e5));
    if (s) { g.globalCompositeOperation = "lighter"; g.globalAlpha *= Math.min(1, 1.2 - n); g.drawImage(brillos(am.tarde > 0.3 ? "255,170,100" : "255,236,200"), s[0] - 450, s[1] - 450, 900, 900); g.drawImage(brillos("255,250,235"), s[0] - 90, s[1] - 90, 180, 180); }
  }
  g.restore();
  return yh;
}

// Una ciudad (la de ciudad(), o cualquier { edificios } con lo que quieras de lo demás) vista con la cámara cam en el
// segundo t, de lejos a cerca: el suelo hasta el horizonte, las manzanas y los parques, las rayas de las calles, las
// sombras de los edificios (de día), las farolas y los coches (de noche, sus luces), los árboles y los edificios.
// op: como en edificio() (noche, sol, niebla), y además farolas: false / coches: false para no dibujarlos.
// Devuelve cuántos edificios ha dibujado.
export function dibujaCiudad(g, cam, c, t = 0, op = {}) {
  const am = ambiente(op), n = am.n, opE = { ...op, _am: am }, cx = cam.p[0], cz = cam.p[2], A = g.globalAlpha;
  g.save();
  // el suelo: hasta el horizonte, perdiéndose en la neblina; las manzanas, más claras; los parques, verdes
  const llano = (pts, col) => {
    const q = poligonoEn(cam, pts);
    if (!q) return;
    let z0 = 1e9, z1 = 0, ya = 1e9, yb = -1e9, za = 0, zb = 0;
    for (const v of q) { z0 = Math.min(z0, v[2]); z1 = Math.max(z1, v[2]); if (v[1] < ya) { ya = v[1]; za = v[2]; } if (v[1] > yb) { yb = v[1]; zb = v[2]; } }
    traza(g, q);
    if (yb - ya > 160) {
      // la neblina sube con la distancia: más lejos (arriba) más que cerca (abajo)
      const gr = g.createLinearGradient(0, ya, 0, yb);
      for (const u of [0, 0.03, 0.12, 0.4, 1]) { const y = ya + (yb - ya) * u, z = 1 / (1 / za + (1 / zb - 1 / za) * u); gr.addColorStop(u, css(mez3(col, am.neblina, neblinaA(am, Math.min(z, z1))))); }
      g.fillStyle = gr;
      void y0;
    } else g.fillStyle = css(mez3(col, am.neblina, neblinaA(am, (z0 + z1) / 2)));
    g.fill();
  };
  const y0 = 0, L = 40000;
  llano([[cx - L, 0, cz - L], [cx + L, 0, cz - L], [cx + L, 0, cz + L], [cx - L, 0, cz + L]], mez3([84, 88, 94], [14, 15, 22], n));
  const acera = mez3([156, 154, 150], [28, 27, 32], n), verde = mez3([84, 126, 66], [12, 22, 16], n);
  for (const m of c.manzanas || []) llano([[m.x0, 0, m.z0], [m.x1, 0, m.z0], [m.x1, 0, m.z1], [m.x0, 0, m.z1]], m.parque ? verde : acera);
  // las rayas de las calles, cerca
  if (n < 0.9 && c.calles) {
    g.fillStyle = `rgba(240,236,220,${0.5 * (1 - n)})`;
    for (const s of c.calles) {
      const ux = s.eje === "x" ? 1 : 0, uz = 1 - ux, w = 0.15, Ls = Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]);
      for (let d = 0; d < Ls; d += 9) {
        const p0 = [s.a[0] + ux * d, 0.02, s.a[1] + uz * d];
        if (Math.hypot(p0[0] - cx, p0[2] - cz) > 280) continue;
        const q = poligonoEn(cam, [[p0[0] - uz * w, 0.02, p0[2] - ux * w], [p0[0] + ux * 3 - uz * w, 0.02, p0[2] + uz * 3 - ux * w], [p0[0] + ux * 3 + uz * w, 0.02, p0[2] + uz * 3 + ux * w], [p0[0] + uz * w, 0.02, p0[2] + ux * w]]);
        if (q) { traza(g, q); g.fill(); }
      }
    }
  }
  // qué edificios se ven, y sus sombras en el suelo (de día)
  const vistos = [];
  for (const e of c.edificios) { const v = seVe(cam, e); if (v) vistos.push({ e, v }); }
  if (am.fr > 0.05 && am.sol[1] > 0.05) {
    g.fillStyle = css(am.sombra, 0.32 * am.fr);
    const kx = am.sol[0] / am.sol[1], kz = am.sol[2] / am.sol[1];
    for (const { e } of vistos) {
      if (Math.hypot(e.x - cx, e.z - cz) > am.niebla * 1.5) continue;
      const b = e.cajas[e.cajas.length - 1], pie = tapa(e.cajas[0], 0), cima = tapa(b, 0).map((v) => [v[0] - kx * e.h, 0, v[2] - kz * e.h]);
      const h2 = envolvente2(pie.concat(cima)), q = poligonoEn(cam, h2.map((v) => [v[0], 0.05, v[1]]));
      if (q) { traza(g, q); g.fill(); }
    }
  }
  // de noche, las farolas: su luz en el suelo y su punto
  if (n > 0.05 && op.farolas !== false && c.farolas) {
    g.globalCompositeOperation = "lighter";
    const hs = brillos("255,176,90"), hb = brillos("255,214,160");
    for (const p of c.farolas) {
      const q = proyectaUno(cam, p);
      if (!q || q[0] < -60 || q[0] > 1140 || q[1] < -60 || q[1] > 1980) continue;
      const tam = (F * 16) / q[2], a = n * (1 - neblinaA(am, q[2]) * 0.8);
      if (tam > 5) { const s = proyectaUno(cam, [p[0], 0, p[2]]); if (s) { g.globalAlpha = A * a * 0.5; g.drawImage(hs, s[0] - tam, s[1] - tam * 0.35, tam * 2, tam * 0.7); } }
      g.globalAlpha = A * a; const pt = Math.max(2.5, (F * 1.6) / q[2]); g.drawImage(hb, q[0] - pt / 2, q[1] - pt / 2, pt, pt);
    }
    g.globalCompositeOperation = "source-over"; g.globalAlpha = A;
  }
  // los coches: de día, cajitas de colores; de noche, sus faros (blancos de frente, rojos de espaldas)
  if (op.coches !== false && c.coches) {
    const hw = brillos("255,244,220"), hr = brillos("255,60,40");
    if (n >= 0.5) g.globalCompositeOperation = "lighter";
    for (const k of c.coches) {
      const s = (((k.s0 + k.v * t) % k.L) + k.L) % k.L, s0 = k.c, ux = (s0.b[0] - s0.a[0]) / k.L, uz = (s0.b[1] - s0.a[1]) / k.L;
      const x = s0.a[0] + ux * s - uz * k.ld * 3.2, z = s0.a[1] + uz * s + ux * k.ld * 3.2, q = proyectaUno(cam, [x, 0.7, z]);
      if (!q || q[0] < -40 || q[0] > 1120 || q[1] < -40 || q[1] > 1960 || q[2] > 3000) continue;
      const tam = (F * 4.4) / q[2], nb = neblinaA(am, q[2]);
      if (n < 0.5) {
        if (tam > 14) cajaLisa(g, cam, { x, z, w: Math.abs(ux) * 4.4 + Math.abs(uz) * 1.8, d: Math.abs(uz) * 4.4 + Math.abs(ux) * 1.8, y0: 0.15, y1: 1.5 }, mez3(k.col, am.neblina, nb), am);
        else if (tam > 1) { g.fillStyle = css(mez3(k.col, am.neblina, nb)); g.fillRect(q[0] - tam / 2, q[1] - tam * 0.2, tam, tam * 0.35); }
      } else {
        const haciaCam = ux * k.ld * (cam.p[0] - x) + uz * k.ld * (cam.p[2] - z) > 0, tl = Math.max(3, (F * 3.2) / q[2]);
        g.globalAlpha = A * n * (1 - nb * 0.7); g.drawImage(haciaCam ? hw : hr, q[0] - tl / 2, q[1] - tl / 2, tl, tl);
      }
    }
    g.globalCompositeOperation = "source-over"; g.globalAlpha = A;
  }
  // los árboles de los parques y los edificios, de lejos a cerca
  const tap = tapadores(cam, vistos), cosas = [];
  for (const { e, v } of vistos) if (!tapado(v, tap)) cosas.push({ z: Math.hypot(Math.max(Math.abs(e.x - cx) - e.w / 2, 0), Math.max(Math.abs(e.z - cz) - e.d / 2, 0)) + Math.hypot(e.x - cx, e.z - cz) * 0.01, e });
  for (const a of c.arboles || []) { const q = proyectaUno(cam, [a.p[0], a.h * 0.6, a.p[2]]); if (q && q[0] > -100 && q[0] < 1180 && q[1] > -100 && q[1] < 2020) cosas.push({ z: Math.hypot(a.p[0] - cx, a.p[2] - cz), a, q }); }
  cosas.sort((a, b) => b.z - a.z);
  let nd = 0;
  for (const o of cosas) { if (o.e) { edificio(g, cam, o.e, t, opE); nd++; } else arbol(g, cam, o.a, o.q, am, neblinaA(am, o.q[2])); }
  g.restore();
  return nd;
}
// La envolvente convexa de puntos del suelo [x, y, z] → [[x, z], ...].
function envolvente2(P) {
  const p = P.map((v) => [v[0], v[2]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]), x = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], hi = [];
  for (const v of p) { while (lo.length > 1 && x(lo[lo.length - 2], lo[lo.length - 1], v) <= 0) lo.pop(); lo.push(v); }
  for (const v of p.reverse()) { while (hi.length > 1 && x(hi[hi.length - 2], hi[hi.length - 1], v) <= 0) hi.pop(); hi.push(v); }
  return lo.slice(0, -1).concat(hi.slice(0, -1));
}
// Si algo del edificio puede caer en la pantalla: { x0, x1, y0, y1 (su caja en pantalla), z (lo más cerca) } o null.
function seVe(cam, e) {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, detras = 0, z = 1e9;
  for (const X of [e.x - e.w / 2, e.x + e.w / 2]) for (const Y of [0, e.h + (e.antena || 0)]) for (const Z of [e.z - e.d / 2, e.z + e.d / 2]) {
    const c = enCam(cam, [X, Y, Z]);
    if (c[2] < CERCA) { detras++; continue; }
    const q = aPant(c); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); z = Math.min(z, c[2]);
  }
  if (detras === 8) return null;
  if (detras) return { x0: -1e9, x1: 1e9, y0: -1e9, y1: 1e9, z: 0 };
  if (x1 < 0 || x0 > 1080 || y1 < 0 || y0 > 1920 || (x1 - x0 < 0.8 && y1 - y0 < 0.8)) return null;
  return { x0, x1, y0, y1, z };
}
// Las caras grandes de los edificios de delante, que tapan del todo lo que tienen detrás: [{ q, z }].
function tapadores(cam, vistos) {
  const o = [];
  for (const { e, v } of vistos.slice().sort((a, b) => a.v.z - b.v.z).slice(0, 40)) {
    for (const b of e.cajas) {
      if (b.y0 > 0.5) continue;
      for (const [P, U] of caras(cam, b)) {
        const pts = [P, [P[0] + U[0], P[1], P[2] + U[2]], [P[0] + U[0], b.y1, P[2] + U[2]], [P[0], b.y1, P[2]]].map((X) => enCam(cam, X));
        if (pts.some((c) => c[2] < CERCA)) continue;
        const q = pts.map(aPant);
        let A = 0; for (let i = 0; i < 4; i++) { const a = q[i], c = q[(i + 1) % 4]; A += a[0] * c[1] - c[0] * a[1]; }
        if (Math.abs(A) / 2 > 25000) o.push({ q, z: Math.max(...pts.map((c) => c[2])), s: Math.sign(A) });
      }
    }
  }
  return o;
}
// Si la caja de un edificio queda entera detrás de una de esas caras.
function tapado(v, tap) {
  const X0 = Math.max(v.x0, 0), X1 = Math.min(v.x1, 1080), Y0 = Math.max(v.y0, 0), Y1 = Math.min(v.y1, 1920);
  if (X0 >= X1 || Y0 >= Y1) return true;
  for (const t of tap) {
    if (t.z >= v.z) continue;
    let dentro = true;
    for (const [x, y] of [[X0, Y0], [X1, Y0], [X1, Y1], [X0, Y1]]) {
      for (let i = 0; i < 4 && dentro; i++) { const a = t.q[i], b = t.q[(i + 1) % 4]; if (((b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0])) * t.s < 0) dentro = false; }
      if (!dentro) break;
    }
    if (dentro) return true;
  }
  return false;
}
// Un árbol del parque: una copa redonda con su luz, su tronco y su sombra en el suelo.
function arbol(g, cam, a, q, am, nb) {
  const r = (F * a.r) / q[2];
  if (r < 0.8) return;
  const base = proyectaUno(cam, a.p), col = mez3(mez3([70, 112, 52], [96, 132, 60], a.s), [10, 18, 14], am.n);
  if (base && r > 2) { g.fillStyle = `rgba(0,0,0,${0.3 * am.fr})`; g.beginPath(); g.ellipse(base[0] + r * 0.3, base[1], r * 1.1, r * 0.35, 0, 0, Math.PI * 2); g.fill(); g.strokeStyle = css(mez3([70, 50, 36], am.neblina, nb)); g.lineWidth = Math.max(1, r * 0.18); g.beginPath(); g.moveTo(base[0], base[1]); g.lineTo(q[0], q[1]); g.stroke(); }
  const gr = g.createRadialGradient(q[0] - r * 0.35, q[1] - r * 0.4, r * 0.1, q[0], q[1], r);
  gr.addColorStop(0, css(mez3(mez3(col, [210, 230, 150], 0.35 * am.fr), am.neblina, nb))); gr.addColorStop(1, css(mez3([col[0] * 0.45, col[1] * 0.5, col[2] * 0.5], am.neblina, nb)));
  g.fillStyle = gr; g.beginPath(); g.arc(q[0], q[1], r, 0, Math.PI * 2); g.fill();
}

// ---------------------------------------------------------------- el perfil de una ciudad, para lo lejano
const perfiles = new Map();
// El perfil de una ciudad en 2D, para un fondo lejano: torres de alturas distintas con sus remates y antenas, en capas
// (las de detrás, más perdidas en la neblina), con sus ventanas encendidas de noche. Se apoya en la línea y de la
// pantalla. op: { alto (píxeles de la torre más alta, 700), noche (0 o 1), desplaza (píxeles hacia la izquierda, para
// moverlo despacio), capas (1 a 3), neblina ([r, g, b], el color de lo más lejano), color ([r, g, b] de la capa de
// delante; sin él, el de la luz del día o de la noche) }. Da la vuelta sin costura: se puede desplazar sin fin.
export function perfilCiudad(g, semilla, y, op = {}) {
  const noche = (op.noche ?? 0) > 0.5, capas = op.capas || 3, alto = op.alto || 700;
  const k = [semilla, noche, capas, op.neblina, op.color].join("|");
  let l = perfiles.get(k);
  if (!l) { l = fija(pintaPerfil(semilla, noche, capas, op)); perfiles.set(k, l); }
  const esc = alto / 900, w = l.width * esc, h = l.height * esc, d = (((op.desplaza || 0) % w) + w) % w;
  g.save();
  for (let x = -d; x < 1080; x += w) g.drawImage(l, x, y - h, w, h);
  g.restore();
}
function pintaPerfil(semilla, noche, capas, op) {
  const W = 2400, H = 1000, l = lienzo(W, H), c = l.getContext("2d"), az = azar(semilla * 59 + 11);
  const neb = op.neblina || (noche ? [52, 40, 70] : [196, 210, 228]), del = op.color || (noche ? [14, 15, 24] : [104, 116, 134]);
  for (let ca = capas - 1; ca >= 0; ca--) {
    const u = capas > 1 ? ca / (capas - 1) : 0, col = mez3(del, neb, 0.15 + 0.6 * u), escala = 1 - 0.28 * u, base = H;
    let x = az() * 40;
    while (x < W) {
      const w = (40 + az() * 110) * escala, cen = 0.75 + 0.25 * Math.sin((x / W) * Math.PI * 2 * 2 + semilla), h = (120 + Math.pow(az(), 2.2) * 760 * cen) * escala, top = base - h, r = az();
      const vent = [];
      const fw = 9 * escala, fh = 13 * escala;
      for (let yy = top + 10; yy < base - 8; yy += fh) for (let xx = 5; xx < w - 6; xx += fw) {
        if (noche) { if (az() < 0.2 * (1 - u * 0.5)) vent.push([xx, yy, `rgba(255,${190 + Math.floor(az() * 50)},${110 + Math.floor(az() * 80)},${(0.45 + az() * 0.5) * (1 - u * 0.6)})`]); }
        else if (u < 0.6 && az() < 0.7) vent.push([xx, yy, css(mez3(col, [30, 40, 60], 0.22 * (1 - u)))]);
      }
      // la torre (y su copia al otro lado, para que el perfil dé la vuelta sin costura)
      for (const x0 of x + w > W ? [x, x - W] : [x]) {
        c.fillStyle = css(col); c.fillRect(x0, top, w, h);
        if (!noche) { c.fillStyle = css(mez3(col, [255, 248, 236], 0.12 * (1 - u))); c.fillRect(x0, top, w * 0.35, h); c.fillStyle = css(mez3(col, [20, 30, 50], 0.12)); c.fillRect(x0 + w * 0.8, top, w * 0.2, h); }
        c.fillStyle = css(col);
        // un remate: escalones, una aguja o una antena con su luz roja
        if (r < 0.25 && h > 300 * escala) { c.fillRect(x0 + w * 0.18, top - h * 0.06, w * 0.64, h * 0.06 + 1); c.fillRect(x0 + w * 0.34, top - h * 0.11, w * 0.32, h * 0.05 + 1); }
        else if (r < 0.4 && h > 400 * escala) { c.beginPath(); c.moveTo(x0 + w * 0.3, top); c.lineTo(x0 + w * 0.5, top - h * 0.22); c.lineTo(x0 + w * 0.7, top); c.closePath(); c.fill(); }
        else if (r < 0.6) { c.fillRect(x0 + w * 0.5 - 1.5, top - 50 * escala, 3, 50 * escala); if (noche) { c.save(); c.globalCompositeOperation = "lighter"; c.drawImage(brillos("255,70,60"), x0 + w * 0.5 - 14, top - 50 * escala - 14, 28, 28); c.restore(); } }
        // las ventanas: de noche, puntos de luz; de día, una rejilla apenas marcada
        for (const [xx, yy, cc] of vent) { c.fillStyle = cc; c.fillRect(x0 + xx, yy, fw * (noche ? 0.5 : 0.55), fh * (noche ? 0.45 : 0.5)); }
      }
      x += w + (az() < 0.3 ? az() * 30 * escala : 0);
    }
  }
  // abajo, el resplandor de la ciudad (de noche) o la neblina (de día)
  const gr = c.createLinearGradient(0, H * 0.55, 0, H);
  gr.addColorStop(0, css(neb, 0)); gr.addColorStop(1, noche ? "rgba(255,150,80,0.32)" : css(neb, 0.55));
  c.globalCompositeOperation = noche ? "lighter" : "source-atop"; c.fillStyle = gr; c.fillRect(0, H * 0.55, W, H * 0.45);
  return l;
}
