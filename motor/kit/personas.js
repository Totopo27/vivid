// Personas: figuras de cuerpo entero con volumen, como un maniquí limpio o una figura 3D (proporciones de verdad,
// cabeza sin cara con su pelo, y orejas y nariz apenas marcadas). Cada parte del cuerpo es un cilindro o una esfera
// iluminada por el lado de la luz, con su sombra al otro lado, un brillo suave y el borde de luz; la ropa y la piel,
// del color que digas. Posan (de pie, andando, corriendo, señalando, celebrando, aplaudiendo, saludando, sentadas),
// giran hacia donde quieras y pueden ir a contraluz: una silueta oscura con el borde encendido.
// Y la multitud: miles de personas distintas (por semilla) en una plaza, en filas o en las gradas de un estadio, vistas
// con la cámara de camara.js y dibujadas de lejos a cerca; aplauden, botan, celebran o hacen la ola. Para «1 de cada N
// personas», un estadio, gente que mira algo o una persona sola frente a algo enorme.
import { azar, lienzo } from "./base.js";
import { F, proyecta } from "./camara.js";
import { brillo } from "./luz.js";
import { poligonoEn } from "./ciudad.js";
import { ruido } from "./texturas.js";

// ---------------------------------------------------------------- colores
const rgb = (c) => (Array.isArray(c) ? c : c[0] === "#" ? [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)] : c.split(",").map(Number));
const cl = (v) => (v < 0 ? 0 : v > 255 ? 255 : Math.round(v));
const css = (c, a = 1) => `rgba(${cl(c[0])},${cl(c[1])},${cl(c[2])},${a})`;
const mezRgb3 = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];

// Los tonos de piel, de ropa, de pantalón, de pelo y de zapatos que salen en la gente (también para elegir a mano).
export const PIELES = ["#f3cfb3", "#eabb98", "#dca47c", "#c68b62", "#a86d47", "#8a5434", "#6a3e26", "#4f2d1c"];
export const ROPAS = ["#e8e4dc", "#2f3a4f", "#b8352c", "#3f6e9c", "#d9a441", "#4c7a4a", "#7c4d8c", "#20242b", "#c96b3c", "#8fb3c9", "#ded0b0", "#a33a5c", "#5d6b78", "#f0f0f2"];
const PANTALONES = ["#2d3d5c", "#1d2430", "#4a4f57", "#7d6a50", "#273a52", "#1a1a1c", "#5b4636", "#3a4a3a", "#d8d2c4"];
const PELOS = ["#1a120d", "#2b1b12", "#3d2716", "#5e3b1f", "#8a5a2b", "#b98a4e", "#d9c08a", "#9a9590", "#6b2f16"];
// gris: todas iguales, como maniquíes (para que destaque la que va de color)
const GRIS = { piel: [214, 214, 218], ropa: [168, 172, 182], pantalon: [128, 132, 142], pelo: [96, 98, 106], zapatos: [80, 82, 90] };
const ZAPATOS = ["#f2f2f0", "#18181a", "#3b2a1e", "#6d6f73", "#2a2f3a"];

// ---------------------------------------------------------------- la luz
// luz: [lx, ly, lz], hacia dónde está la luz vista desde la figura (x a la derecha, y hacia abajo, z hacia la cámara).
// La de siempre llega de arriba a la izquierda y un poco de delante. El borde de luz sale por el lado contrario.
const LUZ = [-0.55, -0.62, 0.56];
const uni3 = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
function prepLuz(op) {
  const L = uni3(op.luz || LUZ), H = uni3([L[0], L[1], L[2] + 1]), rl = Math.hypot(L[0], L[1]) || 1;
  return { L, H, R: [-L[0] / rl, -L[1] / rl], borde: op.borde === null ? null : rgb(op.borde || "170,200,255"), fuerza: op.fuerzaBorde ?? 1 };
}
// El color de un punto de la superficie con normal N (en pantalla): la luz cálida que le llega, la sombra fría del otro
// lado, el brillo (si conBrillo) y el borde de luz. m: { c: [r,g,b], br: brillo (0 mate, 1 satinado) }.
function tono(m, N, lz, conBrillo = true) {
  const d = N[0] * lz.L[0] + N[1] * lz.L[1] + N[2] * lz.L[2], dif = Math.max(0, (d + 0.18) / 1.18);
  const e = conBrillo ? Math.max(0, N[0] * lz.H[0] + N[1] * lz.H[1] + N[2] * lz.H[2]) : 0, es = m.br * 90 * Math.pow(e, 14);
  const c = m.c, r = [c[0] * (0.16 + 1.02 * dif) + es, c[1] * (0.19 + 0.97 * dif) + es, c[2] * (0.27 + 0.88 * dif) + es];
  if (lz.borde) {
    const f = Math.pow(1 - Math.max(0, N[2]), 5) * Math.max(0, N[0] * lz.R[0] + N[1] * lz.R[1]) * 0.55 * lz.fuerza * (m.bo ?? 1);
    r[0] += lz.borde[0] * f; r[1] += lz.borde[1] * f; r[2] += lz.borde[2] * f;
  }
  return r;
}

// ---------------------------------------------------------------- las formas, ya sombreadas
const S_CIL = [1, 0.96, 0.85, 0.65, 0.35, 0, -0.35, -0.65, -0.85, -0.96, -1];
// El camino de un cilindro de punta redonda de A a B, con radios ra y rb (píxeles).
function caminoCil(g, A, B, ra, rb) {
  const dx = B[0] - A[0], dy = B[1] - A[1], d = Math.hypot(dx, dy);
  g.beginPath();
  if (d < Math.abs(ra - rb) + 0.5) { g.arc((A[0] + B[0]) / 2, (A[1] + B[1]) / 2, Math.max(ra, rb), 0, Math.PI * 2); return; }
  const th = Math.atan2(dy, dx), al = Math.acos(Math.max(-1, Math.min(1, (ra - rb) / d)));
  g.arc(B[0], B[1], rb, th - al, th + al); g.arc(A[0], A[1], ra, th + al, th - al + Math.PI * 2); g.closePath();
}
// El degradado de lado a lado de un cilindro de radio r centrado en (mx, my), con su eje a lo largo de (ux, uy).
function deLado(g, mx, my, ux, uy, r, m, lz) {
  const nx = -uy, ny = ux, gr = g.createLinearGradient(mx + nx * r, my + ny * r, mx - nx * r, my - ny * r);
  for (const s of S_CIL) gr.addColorStop((1 - s) / 2, css(tono(m, [s * nx, s * ny, Math.sqrt(Math.max(0, 1 - s * s))], lz)));
  return gr;
}
// Un huso de A a B: grosor ra al principio, rm en la parte tm del camino (el músculo) y rb al final, de puntas redondas.
function caminoHuso(g, A, B, ra, rm, rb, tm) {
  const dx = B[0] - A[0], dy = B[1] - A[1], d = Math.hypot(dx, dy), ux = dx / d, uy = dy / d, nx = -uy, ny = ux, th = Math.atan2(uy, ux);
  const r = (t) => (t < tm ? ra + (rm - ra) * (0.5 - 0.5 * Math.cos((Math.PI * t) / tm)) : rm + (rb - rm) * (0.5 - 0.5 * Math.cos((Math.PI * (t - tm)) / (1 - tm))));
  const T = [0, tm * 0.5, tm, (tm + 1) / 2, 1], P = (t, sg) => [A[0] + ux * d * t + sg * nx * r(t), A[1] + uy * d * t + sg * ny * r(t)];
  g.beginPath();
  g.arc(A[0], A[1], ra, th + Math.PI / 2, th + (Math.PI * 3) / 2);
  for (let i = 1; i < T.length; i++) { const p = P(T[i], -1), m = P((T[i - 1] + T[i]) / 2, -1); g.quadraticCurveTo(m[0], m[1], p[0], p[1]); }
  g.arc(B[0], B[1], rb, th - Math.PI / 2, th + Math.PI / 2);
  for (let i = T.length - 2; i >= 0; i--) { const p = P(T[i], 1), m = P((T[i + 1] + T[i]) / 2, 1); g.quadraticCurveTo(m[0], m[1], p[0], p[1]); }
  g.closePath();
}
// Un cilindro de punta redonda (o un huso, si trae rm), sombreado de lado a lado (si se ve de punta, una esfera).
function cilindro(g, A, B, ra, rb, m, lz, rm, tm = 0.3) {
  const dx = B[0] - A[0], dy = B[1] - A[1], d = Math.hypot(dx, dy), R = Math.max(ra, rb, rm || 0);
  if (d < 0.3 * R) { g.beginPath(); g.arc((A[0] + B[0]) / 2, (A[1] + B[1]) / 2, R, 0, Math.PI * 2); return esfera(g, (A[0] + B[0]) / 2, (A[1] + B[1]) / 2, R, R, m, lz); }
  if (rm && d > Math.max(ra, rb) * 1.5) caminoHuso(g, A, B, ra, rm, rb, tm); else caminoCil(g, A, B, ra, rb);
  g.fillStyle = deLado(g, (A[0] + B[0]) / 2, (A[1] + B[1]) / 2, dx / d, dy / d, rm || (ra + rb) / 2, m, lz); g.fill();
}
// Una esfera (o un huevo de radios rx, ry) en (x, y), sobre el camino que ya esté trazado: degradado alrededor del punto
// que mira a la luz, el brillo y el borde de luz por el lado contrario.
function esfera(g, x, y, rx, ry, m, lz) {
  const R = Math.max(rx, ry, 0.5), L = lz.L, kl = Math.hypot(L[0], L[1]), lx = kl > 1e-4 ? L[0] / kl : 0, ly = kl > 1e-4 ? L[1] / kl : -1;
  const off = 0.82 * kl * R, Rg = R + off, gr = g.createRadialGradient(lx * off, ly * off, 0, lx * off, ly * off, Rg);
  for (let i = 0; i <= 8; i++) {
    const s = Math.max(-1, Math.min(1, (off - (i / 8) * Rg) / R));
    gr.addColorStop(i / 8, css(tono(m, [s * lx, s * ly, Math.sqrt(Math.max(0, 1 - s * s))], lz, false)));
  }
  g.save(); g.translate(x, y); g.scale(rx / R, ry / R); g.fillStyle = gr; g.fill(); g.restore();
  g.save(); g.clip(); g.translate(x, y); g.scale(rx / R, ry / R); g.globalCompositeOperation = "lighter";
  // el brillo, donde la superficie refleja la luz hacia la cámara
  if (m.br > 0.05) {
    const hx = lz.H[0] * R * 0.85, hy = lz.H[1] * R * 0.85, bg = g.createRadialGradient(hx, hy, 0, hx, hy, R * 0.45);
    bg.addColorStop(0, `rgba(255,250,240,${0.16 * m.br})`); bg.addColorStop(1, "rgba(255,250,240,0)");
    g.fillStyle = bg; g.fillRect(-R, -R, 2 * R, 2 * R);
  }
  if (lz.borde && lz.fuerza > 0) {
    const cx = -lz.R[0] * R * 0.16, cy = -lz.R[1] * R * 0.16, bg = g.createRadialGradient(cx, cy, R * 1.0, cx, cy, R * 1.17), b = lz.borde;
    bg.addColorStop(0, `rgba(${b[0]},${b[1]},${b[2]},0)`); bg.addColorStop(1, `rgba(${b[0]},${b[1]},${b[2]},${0.13 * lz.fuerza})`);
    g.fillStyle = bg; g.fillRect(-R * 1.3, -R * 1.3, R * 2.6, R * 2.6);
  }
  g.restore();
}

// ---------------------------------------------------------------- el cuerpo
// Medidas en altos (1 = la altura de la persona de pie). El tronco, de abajo arriba sobre la cadera (y = 0,51):
// [altura sobre la cadera, medio ancho, medio fondo, cuánto sale hacia delante]. TRONCO0: estrecho y de cadera ancha;
// TRONCO1: de hombros anchos. Cada persona está entre los dos (su «cuerpo», de 0 a 1).
const TRONCO0 = [[0.055, 0.105, 0.068, -0.012], [0.115, 0.074, 0.054, 0.004], [0.2, 0.092, 0.067, 0.021], [0.255, 0.097, 0.062, 0.013], [0.292, 0.094, 0.05, 0]];
const TRONCO1 = [[0.055, 0.1, 0.066, -0.01], [0.115, 0.088, 0.058, 0.006], [0.2, 0.106, 0.071, 0.017], [0.255, 0.114, 0.067, 0.01], [0.292, 0.108, 0.052, 0]];
const CADERA = 0.51, CUELLO = 0.338, MUSLO = 0.238, PIERNA = 0.236, BRAZO = 0.18, ANTEBRAZO = 0.148;

// Una dirección de brazo o pierna: adelante (radianes hacia delante desde abajo) y abre (hacia fuera desde abajo).
const dir = (adelante, abre, lado) => [lado * Math.sin(abre), -Math.cos(abre) * Math.cos(adelante), Math.cos(abre) * Math.sin(adelante)];
const hacia = (a, b) => uni3([b[0] - a[0], b[1] - a[1], b[2] - a[2]]);
const LADOS = [-1, 1];
const pos = (u) => Math.max(0, u);

// Los brazos: para cada lado, [dirección del brazo, del antebrazo, mano] (mano: "abierta", "puño" o "señala").
// hombro(lado): dónde está el hombro, para llevar las manos a un sitio.
const sueltos = (t, f) => LADOS.map((s) => { const r = 0.02 * Math.sin(t * 1.7 + f + s); return [dir(0.02 + r, 0.1, s), dir(0.16 + r, 0.06, s), "abierta"]; });
const arriba = (t, f, op) => LADOS.map((s) => { const b = Math.sin(Math.PI * 2 * (t * (op.ritmo || 1.6) + f) + s * 0.4) * 0.12 * (op.quieto ? 0 : 1); return [dir(0.12, 2.62 + b, s), dir(0.2, 2.95 + b * 0.6, s), "puño"]; });
const rodillas = () => LADOS.map((s) => [dir(0.45, 0.12, s), dir(1.2, 0.06, s), "abierta"]);
const BRAZOS = {
  sueltos, arriba, rodillas,
  aplaude: (t, f, op, hombro) => {
    const cerca = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * (t * (op.ritmo || 2.4) + f)), 0.6);
    return LADOS.map((s) => { const h = hombro(s), codo = [h[0] + s * 0.06, h[1] - 0.16, h[2] + 0.08], mano = [s * (0.016 + 0.07 * cerca), h[1] - 0.1, 0.22]; return [hacia(h, codo), hacia(codo, mano), "abierta"]; });
  },
  señala: (t, f, op) => {
    const ld = op.lado || 1, h = op.hacia ?? 1.2, el = op.alza ?? 0.35, v = uni3([ld * Math.sin(h) * Math.cos(el), Math.sin(el), Math.cos(h) * Math.cos(el)]);
    return LADOS.map((s) => (s === ld ? [uni3([v[0], v[1] - 0.1, v[2]]), v, "señala"] : [dir(0.04, 0.08, s), dir(0.2, 0.045, s), "abierta"]));
  },
  saluda: (t, f, op) => {
    const ld = op.lado || 1, w = Math.sin(Math.PI * 2 * (t * (op.ritmo || 1.8) + f)) * 0.42;
    return LADOS.map((s) => (s === ld ? [dir(0.25, 1.35, s), uni3([s * Math.sin(0.25 + w), Math.cos(0.25 + w), 0.12]), "abierta"] : [dir(0.04, 0.08, s), dir(0.2, 0.045, s), "abierta"]));
  },
  jarra: () => LADOS.map((s) => [dir(-0.1, 0.62, s), uni3([-s * 0.75, -0.35, 0.25]), "puño"]),
};

// Las poses: cómo van las piernas y el tronco, y los brazos que llevan si no dices otros.
//   piernas: para cada lado [dirección del muslo, de la pierna, cuánto sube la punta del pie (radianes)]
//   incl: cuánto se inclina el tronco hacia delante · cab: [giro, alza] de la cabeza · salto: cuánto sube del suelo
const quieto = () => LADOS.map((s) => [dir(0, 0.042, s), dir(-0.01, 0.022, s), 0]);
const sentada = () => ({ piernas: LADOS.map((s) => [dir(1.47, 0.1, s), dir(0.1, 0.07, s), 0]), incl: -0.03, cab: [0, 0.03], sentada: true });
const POSES = {
  "de pie": { brazos: sueltos, cuerpo: () => ({ piernas: quieto(), incl: 0.012, cab: [0, 0.02] }) },
  andando: { cuerpo: (t, f, op) => andar(t, f, op, false) },
  corre: { cuerpo: (t, f, op) => andar(t, f, op, true) },
  señala: { brazos: BRAZOS.señala, cuerpo: (t, f, op) => ({ piernas: quieto(), incl: 0.01, cab: [(op.lado || 1) * Math.min(1.1, op.hacia ?? 1.2) * 0.7, 0.1] }) },
  celebra: { brazos: arriba, cuerpo: (t, f, op) => {
    const u = Math.PI * 2 * (t * (op.ritmo || 1.6) + f), salto = 0.045 * Math.pow(pos(Math.sin(u)), 1.2), flex = 0.32 * Math.pow(pos(-Math.sin(u)), 1.5);
    return { piernas: LADOS.map((s) => [dir(flex, 0.06, s), dir(-flex * 1.1, 0.03, s), salto > 0.01 ? -0.4 : 0]), incl: -0.04 + flex * 0.3, cab: [0, 0.32], salto };
  } },
  aplaude: { brazos: BRAZOS.aplaude, cuerpo: () => ({ piernas: quieto(), incl: 0.01, cab: [0, 0.06] }) },
  saluda: { brazos: BRAZOS.saluda, cuerpo: () => ({ piernas: quieto(), incl: 0, cab: [0, 0.04] }) },
  mira: { brazos: sueltos, cuerpo: () => ({ piernas: quieto(), incl: -0.02, cab: [0, 0.5] }) },
  sentada: { brazos: rodillas, cuerpo: sentada },
  // de sentada (o de pie) a de pie con los brazos arriba, según op.u (de 0 a 1): la ola de un estadio
  levanta: { cuerpo: (t, f, op, hombro) => {
    const A = op.sentada ? sentada() : { piernas: quieto(), incl: 0.01, cab: [0, 0.05] }, B = { piernas: quieto(), incl: -0.03, cab: [0, 0.3] }, u = op.u || 0;
    const bA = (op.sentada ? rodillas : sueltos)(t, f, op, hombro), bB = arriba(t, f, { quieto: true }, hombro);
    return { piernas: A.piernas.map((p, i) => [mezD(p[0], B.piernas[i][0], u), mezD(p[1], B.piernas[i][1], u), 0]), brazos: bA.map((b, i) => [mezD(b[0], bB[i][0], u), mezD(b[1], bB[i][1], u), u > 0.5 ? "puño" : "abierta"]), incl: A.incl + (B.incl - A.incl) * u, cab: [0, A.cab[1] + (B.cab[1] - A.cab[1]) * u], salto: 0.02 * Math.sin(Math.PI * u), sentada: op.sentada && u < 0.5 };
  } },
};
const mezD = (a, b, u) => uni3([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]);
// El ciclo de andar (o de correr): da una vuelta en cada zancada doble; las piernas se cruzan y los brazos van al revés.
function andar(t, f, op, corre) {
  const q = Math.PI * 2 * (t * (op.ritmo || (corre ? 1.4 : 0.9)) + f), amp = corre ? 0.5 : 0.4;
  const piernas = LADOS.map((s) => {
    const p = q + (s > 0 ? Math.PI : 0), muslo = amp * Math.sin(p) + (corre ? 0.12 : 0.06);
    const rod = corre ? 0.3 + 1.55 * Math.pow(pos(Math.cos(p - 5.8)), 1.6) : 0.07 + 1.05 * Math.pow(pos(Math.cos(p - 6.05)), 2.2) + 0.2 * Math.pow(pos(Math.cos(p - 2.4)), 4);
    const punta = 0.28 * Math.pow(pos(Math.cos(p - 1.45)), 3) - 0.7 * Math.pow(pos(Math.cos(p - 5.0)), 5);
    return [dir(muslo, 0.035, s), dir(muslo - rod, 0.02, s), punta];
  });
  const brazos = LADOS.map((s) => {
    const p = q + (s > 0 ? 0 : Math.PI), a = (corre ? 0.6 : 0.3) * Math.sin(p);
    return [dir(a, 0.08, s), dir(a + (corre ? 1.5 : 0.18 + 0.22 * pos(Math.sin(p))), 0.04, s), corre ? "puño" : "abierta"];
  });
  return { piernas, brazos, incl: corre ? 0.16 : 0.04, cab: [0, corre ? -0.1 : 0], salto: corre ? 0.025 * Math.pow(pos(Math.sin(q * 2 + 1.2)), 2) : 0 };
}

// Cómo es una persona, sacado de su semilla: { piel, ropa, pantalon, pelo, zapatos ("#rrggbb"), cuerpo (0 estrecho y
// de cadera ancha … 1 de hombros anchos), largo (pelo largo), manga ("larga" | "corta"), ancho (1 normal) }.
export function aspecto(semilla) {
  const a = azar(9000 + semilla * 7), cual = (l) => l[Math.floor(a() * l.length)];
  const cuerpo = a() < 0.5 ? 0.15 * a() : 0.8 + 0.2 * a();
  return { piel: cual(PIELES), ropa: cual(ROPAS), pantalon: cual(PANTALONES), pelo: cual(PELOS), zapatos: cual(ZAPATOS), cuerpo, largo: cuerpo < 0.5 ? a() < 0.7 : a() < 0.08, manga: a() < 0.55 ? "corta" : "larga", ancho: 0.94 + a() * 0.14 };
}

// Las piezas del cuerpo en 3D para una pose en el segundo t (en altos, el suelo en y = 0, mirando hacia +z).
function esqueleto(op, t) {
  const P0 = POSES[op.pose || "de pie"] || POSES["de pie"], f = op.fase || 0, cu = op.cuerpo ?? 0.9, an = op.ancho ?? 1;
  const niv = TRONCO0.map((a, i) => { const b = TRONCO1[i]; return [a[0], (a[1] + (b[1] - a[1]) * cu) * an, (a[2] + (b[2] - a[2]) * cu) * an, a[3] + (b[3] - a[3]) * cu]; });
  let up = [0, 1, 0], fw = [0, 0, 1];
  const at = (h, z = 0, x = 0) => [x + up[0] * h + fw[0] * z, CADERA + up[1] * h + fw[1] * z, up[2] * h + fw[2] * z];
  const hombro = (s) => at(0.266, -0.004, s * (niv[3][1] - 0.024));
  const c = P0.cuerpo(t, f, op, hombro), incl = c.incl || 0;
  up = [0, Math.cos(incl), Math.sin(incl)]; fw = [0, -Math.sin(incl), Math.cos(incl)];
  const brazos = op.brazos && BRAZOS[op.brazos] ? BRAZOS[op.brazos](t, f, op, hombro) : c.brazos || (P0.brazos || sueltos)(t, f, op, hombro);
  const piezas = [], mas = (p, d, l) => [p[0] + d[0] * l, p[1] + d[1] * l, p[2] + d[2] * l];
  const ra = (0.031 - 0.004 * (1 - cu)) * an, mu = (0.058 + 0.006 * (1 - cu)) * an;
  piezas.push({ tipo: "tronco", niv, up, fw, z: 0 });
  // las piernas (el muslo empieza en la cintura: así el pantalón es de una pieza) y los pies
  LADOS.forEach((s, i) => {
    const [dm, dp, p] = c.piernas[i], cd = [s * (0.046 + 0.006 * (1 - cu)) * an, CADERA, 0], rod = mas(cd, dm, MUSLO), tob = mas(rod, dp, PIERNA);
    piezas.push({ tipo: "cil", a: at(0.04, -0.004, cd[0]), b: rod, ra: mu, rb: 0.045 * an, m: "pantalon", z: -0.09 });
    piezas.push({ tipo: "cil", a: rod, b: mas(tob, dp, -0.012), ra: 0.045 * an, rm: 0.046 * an, tm: 0.3, rb: 0.041 * an, m: "pantalon", z: -0.02 });
    const fp = [0, Math.sin(p), Math.cos(p)], dn = [0, -Math.cos(p), Math.sin(p)];
    // el zapato: una caja de esquinas redondas (talón alto, puntera más baja), [adelante, abajo, de lado]
    const q = ([a, b, x]) => [tob[0] + s * 0.004 + x + fp[0] * a + dn[0] * b, tob[1] + fp[1] * a + dn[1] * b, tob[2] + fp[2] * a + dn[2] * b];
    const caja = [[-0.03, 0.005, -0.016], [-0.03, 0.005, 0.016], [-0.03, 0.036, -0.016], [-0.03, 0.036, 0.016], [0.1, 0.022, -0.017], [0.1, 0.022, 0.017], [0.1, 0.036, -0.017], [0.1, 0.036, 0.017]].map(q);
    piezas.push({ tipo: "pie", pts: caja, suela: [[-0.03, 0.03, -0.016], [-0.03, 0.03, 0.016], [0.1, 0.03, -0.017], [0.1, 0.03, 0.017]].map(q), r: 0.012, z: 0.006 });
  });
  // los brazos y las manos
  LADOS.forEach((s, i) => {
    const [db, da, mano] = brazos[i], h = hombro(s), codo = mas(h, db, BRAZO), mun = mas(codo, da, ANTEBRAZO), corta = (op.manga || "larga") === "corta";
    piezas.push({ tipo: "cil", a: h, b: codo, ra: ra * 1.22, rm: ra * (corta ? 1.02 : 1.1), tm: 0.35, rb: ra * (corta ? 0.78 : 0.92), m: "ropa", z: 0.035 });
    piezas.push({ tipo: "cil", a: codo, b: mun, ra: ra * (corta ? 0.76 : 0.9), rm: ra * (corta ? 0.86 : 0.95), tm: 0.25, rb: ra * (corta ? 0.54 : 0.8), m: corta ? "piel" : "ropa", z: 0.035 });
    if (corta) piezas.push({ tipo: "cil", a: h, b: mas(h, db, BRAZO * 0.62), ra: ra * 1.24, rb: ra * 1.06, m: "ropa", z: 0.036 });
    if (mano === "abierta") piezas.push({ tipo: "cil", a: mas(mun, da, 0.016), b: mas(mun, da, 0.078), ra: 0.017, rm: 0.019, tm: 0.45, rb: 0.013, m: "piel", z: 0.036 });
    else {
      const pu = mas(mun, da, 0.026);
      piezas.push({ tipo: "cil", a: pu, b: mas(pu, da, 0.022), ra: 0.026, rb: 0.024, m: "piel", z: 0.037 });
      if (mano === "señala") piezas.push({ tipo: "cil", a: mas(pu, da, 0.014), b: mas(pu, da, 0.075), ra: 0.0095, rb: 0.008, m: "piel", z: 0.038 });
    }
  });
  // el cuello, el pelo largo y la cabeza
  piezas.push({ tipo: "cil", a: at(CUELLO - 0.04), b: at(CUELLO + 0.03, 0.008), ra: 0.033, rb: 0.03, m: "piel", z: -0.03 });
  const cab = at(CUELLO + 0.086, 0.014), cc = c.cab || [0, 0], oc = op.cabeza || [0, 0];
  if (op.largo) piezas.push({ tipo: "melena", a: [cab[0], cab[1] + 0.006, cab[2] - 0.026], b: at(CUELLO - 0.07, -0.05), z: 0 });
  piezas.push({ tipo: "cabeza", c: cab, giro: cc[0] + oc[0], alza: cc[1] + oc[1], z: 0.05 });
  return { piezas, salto: c.salto || 0, sentada: !!c.sentada };
}

// ---------------------------------------------------------------- dibujar una persona
let capa = null, capa2 = null, capa3 = null;
// el grano de la tela y de la piel: negro con transparencia, para oscurecer a manchas lo que ya está pintado
const grano = (() => {
  const n = 256, r = ruido(n, 431, 26, 3, "crudo").crudo, l = lienzo(n), cx = l.getContext("2d"), img = cx.createImageData(n, n);
  for (let i = 0; i < n * n; i++) img.data[i * 4 + 3] = Math.round(255 * Math.min(1, Math.max(0, (r[i] - 0.4) * 1.5)));
  cx.putImageData(img, 0, 0); fija(l);
  return l;
})();
// Un lienzo ya hecho, pasado a píxeles: dibujarlo luego es solo copiarlo (si no, se repiten todos sus trazos cada vez).
function fija(l) { l.encodeSync("jpeg", 1); return l; }

// Una persona en (x, y) (el suelo, entre los pies) que mide alto píxeles de pie. op:
//   pose: "de pie" | "andando" | "corre" | "señala" | "celebra" | "aplaude" | "saluda" | "mira" (arriba) | "sentada"
//         | "levanta" (de sentada, con op.sentada, o de pie, a de pie con los brazos arriba según op.u de 0 a 1)
//   brazos: otros brazos para esa pose: "sueltos" | "aplaude" | "arriba" | "señala" | "saluda" | "jarra" | "rodillas"
//   t: el segundo (con él anda, aplaude, bota) · ritmo: vueltas por segundo · fase: para que no vayan todas a la vez
//   gira: hacia dónde mira (0 de frente, π/2 a la derecha, -π/2 a la izquierda, π de espaldas)
//   cabeza: [giro, alza] de más (radianes) · lado: el brazo que señala o saluda (1 el de la derecha de la imagen
//   mirando de frente, -1 el otro) · hacia, alza: hacia dónde señala (0 delante, π/2 a su lado) y cuánto sube
//   piel, ropa, pantalon, pelo, zapatos: colores "#rrggbb" (sin ellos, los de aspecto(semilla))
//   semilla: su aspecto · cuerpo, largo, manga, ancho: como en aspecto()
//   luz: [lx, ly, lz] hacia dónde está la luz · borde: "r,g,b" del borde de luz (null, sin borde)
//   silueta: "r,g,b" de un contraluz: la figura oscura con el borde de ese color (luz dice de qué lado viene)
//   color: "r,g,b" para pintarla entera de un color que brilla (la que se señala entre muchas; halo: false, sin brillo)
//   gris: true para pintarla gris, como un maniquí (las demás, cuando una va de color)
//   sombra: false para no dibujar su sombra en el suelo
// Andando avanza 0,66 · alto píxeles por vuelta del ciclo (corriendo, 1,2): muévela eso para que no patine.
// Sentada, el asiento queda a 0,25 · alto del suelo. Devuelve lo que ocupa en la pantalla: { x, y, w, h }.
export function persona(g, x, y, alto, op = {}) {
  if (!(alto >= 2)) return null;
  const as = { ...aspecto(op.semilla || 0), ...op }, sk = esqueleto(as, op.t || 0), gira = op.gira || 0, ca = Math.cos(gira), sa = Math.sin(gira), S = alto;
  // al suelo: el pie más bajo en y = 0 (y el salto, encima)
  let bajo = 9;
  for (const p of sk.piezas) if (p.tipo === "pie") for (const q of p.pts) bajo = Math.min(bajo, q[1] - p.r);
  const sube = sk.salto - bajo, pr = (p) => [x + (p[0] * ca + p[2] * sa) * S, y - (p[1] + sube) * S, -p[0] * sa + p[2] * ca];
  const x0 = Math.floor(x - S * 0.62), y0 = Math.floor(y - S * (1.24 + sube)), w = Math.ceil(S * 1.24), h = Math.ceil(S * (1.3 + sube));
  if (x0 > 1300 || x0 + w < -200 || y0 > 2200 || y0 + h < -300) return null;
  const lz = prepLuz(op), sil = op.silueta ? rgb(op.silueta) : null, col = op.color ? rgb(op.color) : null, mats = {};
  for (const k of ["piel", "ropa", "pantalon", "pelo", "zapatos"]) {
    const c = col ? (k === "piel" ? mezRgb3(rgb(as.piel), col, 0.6) : mezRgb3(col, [255, 255, 255], k === "ropa" ? 0.12 : 0)) : op.gris ? GRIS[k] : rgb(as[k]);
    mats[k] = { c, br: k === "piel" ? 0.6 : k === "pelo" ? 0.7 : k === "zapatos" ? 0.6 : 0.2, bo: k === "piel" ? 0.8 : k === "pelo" ? 0.9 : 0.6 };
  }
  g.save();
  if (op.sombra !== false && !sil) sombraSuelo(g, x - lz.L[0] * S * 0.05, y, S, sk.sentada);
  if (col && op.halo !== false) brillo(g, x, y - S * 0.5, S * 2.2, op.color, 0.55);
  // se dibuja aparte (así la transparencia es de la figura entera) y se le pone el grano
  capa = crece(capa, w, h);
  const c = capa.getContext("2d");
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = "source-over"; c.clearRect(0, 0, capa.width, capa.height); // entero: los restos de otra más grande se cuelan por el borde
  c.translate(-x0, -y0);
  dibujaPiezas(c, sk.piezas, pr, S, mats, lz, gira, !!sil);
  c.setTransform(1, 0, 0, 1, 0, 0);
  let halo = null, fig = capa;
  if (sil) { capa2 = crece(capa2, w, h); capa3 = crece(capa3, w, h); ({ fig, halo } = contraluz(w, h, S, sil, lz)); }
  else {
    c.globalCompositeOperation = "source-atop"; c.globalAlpha = 0.12;
    const tg = Math.max(48, S * 0.4);
    for (let yy = 0; yy < h; yy += tg) for (let xx = 0; xx < w; xx += tg) c.drawImage(grano, xx, yy, tg, tg);
    c.globalAlpha = 1; c.globalCompositeOperation = "source-over";
  }
  g.drawImage(fig, 0, 0, w, h, x0, y0, w, h);
  // a contraluz, la luz que se derrama un poco por fuera del borde
  if (halo) { g.globalCompositeOperation = "lighter"; g.globalAlpha *= 0.7; g.drawImage(halo.l, 0, 0, halo.w, halo.h, x0, y0, w, h); }
  g.restore();
  return { x: x0, y: y0, w, h };
}
function crece(l, w, h) {
  if (l && l.width >= w + 2 && l.height >= h + 2) return l;
  return lienzo(Math.max(w + 2, l ? l.width : 0, 64), Math.max(h + 2, l ? l.height : 0, 64));
}

// La sombra blanda en el suelo, bajo los pies.
function sombraSuelo(g, x, y, S, sentada) {
  g.save(); g.translate(x, y); g.scale(1, 0.16);
  const r = S * (sentada ? 0.34 : 0.26), sg = g.createRadialGradient(0, 0, 0, 0, 0, r);
  sg.addColorStop(0, "rgba(0,0,0,0.5)"); sg.addColorStop(0.45, "rgba(0,0,0,0.26)"); sg.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = sg; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill();
  g.restore();
}

const OSCURO = "rgb(10,12,18)";
// Las piezas, de detrás a delante.
function dibujaPiezas(c, piezas, pr, S, mats, lz, gira, sil) {
  const lista = piezas.map((p) => { const f = p.tipo === "tronco" ? 0 : p.tipo === "cabeza" ? pr(p.c)[2] : p.tipo === "pie" ? p.pts.reduce((s, q) => s + pr(q)[2], 0) / 8 : (pr(p.a)[2] + pr(p.b)[2]) / 2; return { p, f, z: f + p.z }; });
  // la melena, siempre justo detrás de la cabeza (la cabeza tapa su arranque)
  const cab = lista.find((o) => o.p.tipo === "cabeza"), mel = lista.find((o) => o.p.tipo === "melena");
  if (cab && mel) mel.z = Math.min(mel.f, cab.z - 0.001);
  lista.sort((a, b) => a.z - b.z);
  for (const { p, f: z } of lista) {
    if (p.tipo === "cil" || p.tipo === "melena") {
      const mel = p.tipo === "melena", a = pr(p.a), b = pr(p.b), ra = (mel ? 0.047 : p.ra) * S, rb = (mel ? 0.06 : p.rb) * S;
      let m = p.tipo === "melena" ? mats.pelo : mats[p.m];
      // lo que queda detrás del cuerpo, más en sombra
      if (z < -0.04) { const k = Math.max(0.6, 1 - (-0.04 - z) * 4); m = { ...m, c: [m.c[0] * k, m.c[1] * k, m.c[2] * k] }; }
      const rm = mel ? 0.066 * S : p.rm && p.rm * S, tm = mel ? 0.62 : p.tm;
      if (sil) { if (rm && Math.hypot(b[0] - a[0], b[1] - a[1]) > Math.max(ra, rb) * 1.5) caminoHuso(c, a, b, ra, rm, rb, tm); else caminoCil(c, a, b, ra, rb); c.fillStyle = OSCURO; c.fill(); }
      else cilindro(c, a, b, ra, rb, m, lz, rm, tm);
    } else if (p.tipo === "pie") zapato(c, p, pr, S, mats.zapatos, lz, sil); else if (p.tipo === "tronco") tronco(c, p, pr, S, mats, lz, gira, sil);
    else cabeza(c, p, pr, S, mats, lz, gira, sil);
  }
}

// Un zapato: la caja redonda que envuelve sus esquinas vistas en pantalla, con su suela abajo (clara si el zapato es
// oscuro, oscura si es claro).
function zapato(c, p, pr, S, m, lz, sil) {
  const q = p.pts.map(pr), r = p.r * S, arriba = envolvente(q.slice(0, 2).concat(q.slice(4, 6)).concat(p.suela.map(pr))), abajo = envolvente(q.slice(2, 4).concat(q.slice(6, 8)).concat(p.suela.map(pr)));
  const pinta = (h, f) => { c.beginPath(); h.forEach((v, i) => (i ? c.lineTo(v[0], v[1]) : c.moveTo(v[0], v[1]))); c.closePath(); c.fillStyle = c.strokeStyle = f; c.fill(); c.stroke(); };
  c.save(); c.lineJoin = "round"; c.lineWidth = 2 * r;
  if (sil) { pinta(abajo, OSCURO); pinta(arriba, OSCURO); c.restore(); return; }
  let y0 = 1e9, y1 = -1e9; for (const v of q) { y0 = Math.min(y0, v[1]); y1 = Math.max(y1, v[1]); }
  const oscuro = (m.c[0] + m.c[1] + m.c[2]) / 3 < 120, sm = { c: oscuro ? [222, 218, 210] : [52, 48, 44], br: 0.2, bo: 0.5 };
  const sg = c.createLinearGradient(0, y0, 0, y1 + r); sg.addColorStop(0, css(tono(sm, [lz.L[0] * 0.4, -0.3, 0.86], lz))); sg.addColorStop(1, css(tono(sm, [0, 0.8, 0.6], lz)));
  pinta(abajo, sg);
  const gr = c.createLinearGradient(0, y0 - r, 0, y1);
  gr.addColorStop(0, css(tono(m, [0, -0.9, 0.44], lz))); gr.addColorStop(0.5, css(tono(m, [lz.L[0] * 0.5, -0.2, 0.84], lz))); gr.addColorStop(1, css(tono(m, [0, 0.6, 0.8], lz)));
  pinta(arriba, gr);
  c.restore();
}
// La envolvente convexa de unos puntos [x, y] (en orden).
function envolvente(P) {
  const p = P.map((v) => [v[0], v[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]), x = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], hi = [];
  for (const v of p) { while (lo.length > 1 && x(lo[lo.length - 2], lo[lo.length - 1], v) <= 0) lo.pop(); lo.push(v); }
  for (const v of p.reverse()) { while (hi.length > 1 && x(hi[hi.length - 2], hi[hi.length - 1], v) <= 0) hi.pop(); hi.push(v); }
  return lo.slice(0, -1).concat(hi.slice(0, -1));
}

// El tronco (la camiseta): del borde de abajo, sobre el pantalón, a los hombros y el cuello.
function tronco(c, p, pr, S, mats, lz, gira, sil) {
  const ca = Math.cos(gira), sa = Math.sin(gira), { niv, up, fw } = p;
  const at = (h, z) => [up[0] * h + fw[0] * z, CADERA + up[1] * h + fw[1] * z, up[2] * h + fw[2] * z];
  const cen = niv.map((n) => pr(at(n[0], n[3]))), anc = niv.map((n) => Math.sqrt((n[1] * ca) ** 2 + (n[2] * sa) ** 2) * S);
  // el eje del tronco en pantalla y su perpendicular
  const top = pr(at(CUELLO, 0)), bot = pr(at(0.05, 0)), ax = top[0] - bot[0], ay = top[1] - bot[1], al = Math.hypot(ax, ay) || 1;
  const ux = ax / al, uy = ay / al, nx = -uy, ny = ux, n4 = niv.length - 1;
  const L = cen.map((q, i) => [q[0] + nx * anc[i], q[1] + ny * anc[i]]), R = cen.map((q, i) => [q[0] - nx * anc[i], q[1] - ny * anc[i]]);
  // del hombro (lo más ancho) sube redondo hasta el trapecio y el cuello
  const wc = 0.037 * S * (0.8 + 0.2 * Math.abs(ca)), ht = pr(at(CUELLO - 0.016, 0)), wt = anc[n4] * 0.6;
  const hL = [ht[0] + nx * wt, ht[1] + ny * wt], hR = [ht[0] - nx * wt, ht[1] - ny * wt], cq = pr(at(CUELLO, 0.004));
  const cL = [cq[0] + nx * wc, cq[1] + ny * wc], cR = [cq[0] - nx * wc, cq[1] - ny * wc], b0 = cen[0], k = 0.02 * S;
  const forma = () => {
    c.beginPath();
    c.moveTo(R[0][0], R[0][1]);
    c.quadraticCurveTo(b0[0] - ux * 0.014 * S, b0[1] - uy * 0.014 * S, L[0][0], L[0][1]); // el borde de abajo, un poco curvo
    for (let i = 0; i < n4; i++) c.quadraticCurveTo(L[i][0], L[i][1], (L[i][0] + L[i + 1][0]) / 2, (L[i][1] + L[i + 1][1]) / 2);
    c.quadraticCurveTo(L[n4][0] + ux * 0.026 * S, L[n4][1] + uy * 0.026 * S, hL[0], hL[1]);
    c.bezierCurveTo(hL[0] - nx * k, hL[1] - ny * k, cL[0] + nx * 0.004 * S - ux * 0.01 * S, cL[1] + ny * 0.004 * S - uy * 0.01 * S, cL[0], cL[1]);
    const dip = 0.016 * S * Math.max(0, ca); c.quadraticCurveTo(cq[0] - ux * dip * 2, cq[1] - uy * dip * 2, cR[0], cR[1]); // el cuello: baja por delante
    c.bezierCurveTo(cR[0] - nx * 0.004 * S - ux * 0.01 * S, cR[1] - ny * 0.004 * S - uy * 0.01 * S, hR[0] + nx * k, hR[1] + ny * k, hR[0], hR[1]);
    c.quadraticCurveTo(R[n4][0] + ux * 0.026 * S, R[n4][1] + uy * 0.026 * S, (R[n4][0] + R[n4 - 1][0]) / 2, (R[n4][1] + R[n4 - 1][1]) / 2);
    for (let i = n4 - 1; i > 0; i--) c.quadraticCurveTo(R[i][0], R[i][1], (R[i][0] + R[i - 1][0]) / 2, (R[i][1] + R[i - 1][1]) / 2);
    c.quadraticCurveTo(R[0][0], R[0][1], R[0][0], R[0][1]);
    c.closePath();
  };
  if (sil) { forma(); c.fillStyle = OSCURO; c.fill(); return; }
  // la sombra que deja la camiseta sobre el pantalón, justo debajo de su borde
  c.save(); c.globalCompositeOperation = "source-atop";
  const sb = c.createLinearGradient(b0[0], b0[1], b0[0] - ux * 0.035 * S, b0[1] - uy * 0.035 * S), W = 0.3 * S, D = 0.05 * S;
  sb.addColorStop(0, "rgba(0,0,0,0.42)"); sb.addColorStop(1, "rgba(0,0,0,0)");
  c.beginPath(); c.moveTo(b0[0] + nx * W, b0[1] + ny * W); c.lineTo(b0[0] - nx * W, b0[1] - ny * W); c.lineTo(b0[0] - nx * W - ux * D, b0[1] - ny * W - uy * D); c.lineTo(b0[0] + nx * W - ux * D, b0[1] + ny * W - uy * D); c.closePath();
  c.fillStyle = sb; c.fill();
  c.restore();
  // de lado a lado como un cilindro del ancho del pecho; arriba, los hombros reciben la luz; abajo, más oscuro
  forma();
  c.fillStyle = deLado(c, cen[2][0], cen[2][1], ux, uy, anc[2], mats.ropa, lz); c.fill();
  c.save(); c.clip();
  const lu = Math.max(0, -lz.L[1]), vg = c.createLinearGradient(top[0], top[1], bot[0], bot[1]);
  vg.addColorStop(0, `rgba(255,248,236,${0.2 * lu})`); vg.addColorStop(0.2, "rgba(255,255,255,0)"); vg.addColorStop(0.55, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,0.25)");
  c.fillStyle = vg; c.fillRect(top[0] - S, top[1] - S * 0.2, 2 * S, S);
  c.restore();
}

// La cabeza: un huevo con su pelo (la raya del pelo es una curva sobre la esfera, así sale bien desde cualquier lado),
// las orejas y, de perfil, la nariz.
function cabeza(c, p, pr, S, mats, lz, gira, sil) {
  const b = gira + p.giro, cb = Math.cos(b), sb = Math.sin(b), ce = pr(p.c);
  const rx = Math.sqrt((0.049 * cb) ** 2 + (0.058 * sb) ** 2) * S, ry = 0.067 * S, x = ce[0], y = ce[1];
  // de la esfera de la cabeza (x a la derecha de la imagen mirando de frente, y arriba, z hacia la cara) a la pantalla
  const cp = Math.cos(p.alza), sp = Math.sin(p.alza);
  const rot = (v) => { const y1 = v[1] * cp + v[2] * sp, z1 = -v[1] * sp + v[2] * cp; return [v[0] * cb + z1 * sb, y1, -v[0] * sb + z1 * cb]; };
  const vuelve = (v) => { const x1 = v[0] * cb - v[2] * sb, z1 = v[0] * sb + v[2] * cb; return [x1, v[1] * cp - z1 * sp, v[1] * sp + z1 * cp]; };
  const enP = (v) => [x + v[0] * rx, y - v[1] * ry];
  const pinta = (m, ex, ey, erx, ery) => { if (sil) { c.fillStyle = OSCURO; c.fill(); } else esfera(c, ex, ey, erx, ery, m, lz); };
  // las orejas: detrás de la cabeza si quedan hacia atrás
  const orejas = [-1, 1].map((s) => { const v = rot([s * 0.95, -0.16, -0.1]); return { v, q: enP(v) }; });
  const oreja = (o) => {
    const ex = S * (0.0035 + 0.006 * Math.abs(sb)), ey = 0.015 * S, n = uni3([o.v[0] * 1.3, -o.v[1], Math.max(0.1, o.v[2])]);
    c.beginPath(); c.ellipse(o.q[0], o.q[1], ex, ey, 0, 0, Math.PI * 2);
    if (sil) { c.fillStyle = OSCURO; c.fill(); return; }
    const pm = { ...mats.piel, br: 0, bo: 0.4 }, gr = c.createLinearGradient(o.q[0] - ex, o.q[1] - ey, o.q[0] + ex, o.q[1] + ey);
    gr.addColorStop(0, css(mezRgb3(tono(pm, n, lz), [255, 235, 215], 0.08))); gr.addColorStop(1, css(mezRgb3(tono(pm, n, lz), [0, 0, 0], 0.25)));
    c.fillStyle = gr; c.fill();
    // el hueco de la oreja, apenas más oscuro, hacia la cara
    const k = Math.abs(sb); if (k < 0.4) return;
    c.beginPath(); c.ellipse(o.q[0] + Math.sign(sb) * ex * 0.25, o.q[1] + ey * 0.12, ex * 0.45, ey * 0.5, 0, 0, Math.PI * 2);
    c.fillStyle = `rgba(40,20,10,${0.28 * Math.min(1, (k - 0.4) * 2.5)})`; c.fill();
  };
  for (const o of orejas) if (o.v[2] < 0.05) oreja(o);
  // el huevo, algo más estrecho abajo
  const huevo = () => { c.beginPath(); c.ellipse(x, y, rx, ry, 0, Math.PI, Math.PI * 2); c.bezierCurveTo(x + rx, y + ry * 0.62, x + rx * 0.56, y + ry, x, y + ry); c.bezierCurveTo(x - rx * 0.56, y + ry, x - rx, y + ry * 0.62, x - rx, y); c.closePath(); };
  huevo(); pinta(mats.piel, x, y, rx, ry);
  // la nariz, de perfil o de tres cuartos
  const nz = rot([0, -0.14, 1.0]), vis = Math.min(1, Math.max(0, (Math.abs(sb) - 0.3) * 2.5));
  if (vis > 0.02 && nz[2] > -0.2) {
    const q = enP(nz), nr = 0.01 * S;
    c.save(); c.globalAlpha *= vis; c.beginPath(); c.ellipse(q[0], q[1], nr, nr * 1.3, 0, 0, Math.PI * 2); pinta(mats.piel, q[0], q[1], nr, nr * 1.3); c.restore();
  }
  // el pelo
  // el pelo, con su volumen: abulta un poco por fuera del cráneo
  const contorno = pelo(rot, vuelve);
  if (contorno) {
    const vx = x - sb * rx * 0.03, vy = y - ry * 0.035, vr = 1.05;
    c.save(); c.beginPath(); c.ellipse(vx, vy, rx * vr, ry * vr, 0, 0, Math.PI * 2); c.clip();
    c.beginPath(); contorno.forEach((v, i) => { const q = v[2] === 0 ? [vx + v[0] * rx * vr, vy - v[1] * ry * vr] : enP(v); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); }); c.closePath();
    pinta(mats.pelo, vx, vy, rx * vr, ry * vr);
    c.restore();
  }
  for (const o of orejas) if (o.v[2] >= 0.05) oreja(o);
}
// La raya del pelo sobre la esfera de la cabeza: hay pelo donde y ≥ raya(z) (alta en la frente, a la altura de las
// orejas por los lados y baja en la nuca).
const raya = (z) => -0.02 + 0.45 * z + 0.2 * z * z * z - 0.2 * Math.exp(-(((z - 0.22) / 0.13) ** 2)) + 0.12 * Math.exp(-(((z + 0.15) / 0.15) ** 2));
const enPelo = (v) => v[1] >= raya(v[2]);
const LAZO = (() => {
  // la raya entera, dando la vuelta a la cabeza: por un lado de la nuca a la frente y por el otro de vuelta
  const z0 = biseca(-1, 0), z1 = biseca(1, 0), n = 28, lado = [];
  for (let i = 0; i <= n; i++) { const z = z0 + (z1 - z0) * (0.5 - 0.5 * Math.cos((i / n) * Math.PI)), y = raya(z); lado.push([Math.sqrt(Math.max(0, 1 - y * y - z * z)), y, z]); }
  return [...lado, ...lado.slice(1, -1).reverse().map((v) => [-v[0], v[1], v[2]])];
})();
function biseca(a, b) { for (let k = 0; k < 40; k++) { const m = (a + b) / 2, f = (z) => raya(z) ** 2 + z * z - 1; if (f(a) * f(m) <= 0) b = m; else a = m; } return (a + b) / 2; }
// El contorno del pelo que se ve, en la esfera unidad ya girada: la parte visible de la raya, cerrada por el borde de
// la esfera por el lado del pelo. null si no se ve pelo.
function pelo(rot, vuelve) {
  const arco = LAZO.map(rot), n = arco.length, vis = arco.map((v) => v[2] > 0), nv = vis.filter(Boolean).length;
  const borde = (a) => [Math.cos(a), Math.sin(a), 0];
  if (nv === 0) {
    if (!enPelo(vuelve([0, 0, 1]))) return null; // se ve solo la cara
    const o = []; for (let i = 0; i < 48; i++) o.push(borde((i / 48) * Math.PI * 2)); return o; // solo pelo
  }
  if (nv === n) return arco;
  let i0 = 0; while (!(vis[i0] && !vis[(i0 - 1 + n) % n])) i0++;
  const o = [];
  for (let i = i0; vis[i % n]; i++) o.push(arco[i % n]);
  // del final de la raya visible a su principio, por el borde de la esfera, por el lado del pelo
  const af = Math.atan2(o[o.length - 1][1], o[o.length - 1][0]), ai = Math.atan2(o[0][1], o[0][0]);
  let d = ai - af; while (d < 0) d += Math.PI * 2;
  const m = af + d / 2, va = enPelo(vuelve(borde(m))) ? 1 : -1, tot = va > 0 ? d : Math.PI * 2 - d;
  for (let j = 0; j <= 24; j++) o.push(borde(af + (va * tot * j) / 24));
  return o;
}

// A contraluz: la figura ya pintada de oscuro; se le enciende el borde del lado de la luz: una línea fina y fuerte y,
// hacia dentro, una luz suave que se apaga. Devuelve ese brillo suave en pequeño, para el halo de fuera.
let chica = null;
// Se monta en capa3 y no en la propia capa: pintar en un lienzo algo sacado de él mismo (capa → capa2 → capa) deja en
// @napi-rs/canvas la copia ya pegada a medias, y con dos siluetas en el mismo fotograma la primera sale con la segunda.
function contraluz(w, h, S, col, lz) {
  const m = capa2.getContext("2d"), ll = Math.hypot(lz.L[0], lz.L[1]) || 1, ux = lz.L[0] / ll, uy = lz.L[1] / ll;
  const media = () => { m.setTransform(1, 0, 0, 1, 0, 0); m.globalAlpha = 1; m.filter = "none"; m.globalCompositeOperation = "source-over"; m.clearRect(0, 0, capa2.width, capa2.height); m.drawImage(capa, 0, 0, w, h, 0, 0, w, h); m.globalCompositeOperation = "source-in"; m.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`; m.fillRect(0, 0, w, h); };
  const luna = (ancho) => { media(); m.globalCompositeOperation = "destination-out"; m.drawImage(capa, 0, 0, w, h, -ux * ancho, -uy * ancho, w, h); };
  luna(Math.max(1.3, S * 0.006));
  const c = capa3.getContext("2d");
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = "source-over"; c.filter = "none"; c.clearRect(0, 0, capa3.width, capa3.height);
  c.drawImage(capa, 0, 0, w, h, 0, 0, w, h);
  c.globalCompositeOperation = "lighter"; c.drawImage(capa2, 0, 0, w, h, 0, 0, w, h);
  // la misma línea, desenfocada en pequeño: entra un poco en la figura y se derrama por fuera
  const k = 3, cw = Math.ceil(w / k) + 2, ch = Math.ceil(h / k) + 2;
  chica = crece(chica, cw, ch);
  const q = chica.getContext("2d");
  q.setTransform(1, 0, 0, 1, 0, 0); q.globalAlpha = 1; q.globalCompositeOperation = "source-over"; q.filter = "none"; q.clearRect(0, 0, chica.width, chica.height);
  q.filter = `blur(${Math.max(0.7, (S * 0.008) / k).toFixed(2)}px)`; q.drawImage(capa2, 0, 0, w, h, 0, 0, w / k, h / k); q.filter = "none";
  c.globalCompositeOperation = "source-atop"; c.globalAlpha = 0.8; c.drawImage(chica, 0, 0, w / k, h / k, 0, 0, w, h);
  c.globalAlpha = 1; c.globalCompositeOperation = "source-over";
  return { fig: capa3, halo: { l: chica, w: w / k, h: h / k } };
}

// Una persona puesta en el mundo: P = [x, y, z], el punto del suelo donde está, vista con la cámara cam. op como en
// persona(), y además alto (lo que mide en unidades del mundo; 1,75 si no) y gira (hacia dónde mira en el mundo: 0
// hacia +z, π/2 hacia +x). Devuelve lo que ocupa en pantalla, o null si queda detrás de la cámara.
export function personaEn(g, cam, P, op = {}) {
  const q = proyecta(cam, P);
  if (!q) return null;
  return persona(g, q.x, q.y, (F * (op.alto || 1.75)) / q.z, { ...op, gira: (op.gira || 0) - Math.atan2(-cam.e.f[0], -cam.e.f[2]) });
}

// ---------------------------------------------------------------- la multitud
// Las caras que salen en una multitud: cada persona es una de estas (su semilla), dibujada ya en pequeño.
export const VARIANTES = 32;

// La lista de personas de una multitud, hecha una vez (arriba del archivo del plano). op:
//   forma: "plaza"  repartidas por un rectángulo de ancho × fondo, con algo de desorden (la de siempre)
//          "filas"  en filas y columnas bien puestas: una foto de grupo, una rejilla para «1 de cada N»
//          "gradas" las gradas de un estadio: filas que suben como escalones, rectas o en arco
//   n: cuántas (en "plaza") · filas, columnas (en "filas" y "gradas") · ancho, fondo: el sitio que ocupan (metros)
//   centro: [x, y, z], el centro de la fila de delante; las demás van hacia -z (y hacia arriba en las gradas)
//   mira: hacia dónde miran (radianes, como gira: 0 hacia +z) o un punto [x, y, z] al que miran todas
//   sentadas: de 0 a 1, cuántas están sentadas (en las gradas, 1 si no) · escalon: [alto, paso] de las gradas
//   radio: si las gradas hacen arco, la distancia del centro del campo a la primera fila (el campo, en centro + radio
//   hacia +z) · desorden: de 0 a 1, cuánto se salen de su sitio
// Cada persona: { p: [x, y, z] (sus pies), alto, semilla (de 0 a VARIANTES - 1), fase, gira, sentada, ola, i }.
export function gente(semilla, op = {}) {
  const az = azar(semilla * 31 + 7), forma = op.forma || "plaza", C = op.centro || [0, 0, 0], lista = [];
  const filas = op.filas || 10, cols = op.columnas || 20, ancho = op.ancho || cols * 0.75, fondo = op.fondo || filas * 0.9;
  const sent = op.sentadas ?? (forma === "gradas" ? 1 : 0), des = op.desorden ?? (forma === "plaza" ? 1 : 0.15);
  const [ea, ep] = op.escalon || [0.45, 0.85];
  const pon = (x, y, z, ola, giraBase) => {
    let gira = giraBase;
    if (Array.isArray(op.mira)) gira = Math.atan2(op.mira[0] - x, op.mira[2] - z);
    else if (op.mira !== undefined) gira = op.mira;
    lista.push({ p: [x, y, z], alto: 1.75 * (0.9 + 0.17 * az()), semilla: Math.floor(az() * VARIANTES), fase: az(), gira: (gira ?? 0) + (az() - 0.5) * 0.35 * des, sentada: az() < sent, ola, i: lista.length });
  };
  if (forma === "plaza") {
    const n = op.n || 300, lado = Math.sqrt((ancho * fondo) / n), nx = Math.max(1, Math.round(ancho / lado)), nz = Math.ceil(n / nx);
    for (let k = 0; k < n; k++) {
      const i = k % nx, j = Math.floor(k / nx), x = C[0] - ancho / 2 + (i + 0.5 + (az() - 0.5) * 0.9 * des) * (ancho / nx), z = C[2] - (j + 0.5 + (az() - 0.5) * 0.9 * des) * (fondo / nz);
      pon(x, C[1], z, x);
    }
  } else if (forma === "filas") {
    const sx = op.sep || ancho / cols, sz = fondo / filas;
    for (let j = 0; j < filas; j++) for (let i = 0; i < cols; i++) {
      const x = C[0] + (i - (cols - 1) / 2) * sx + (j % 2 ? sx * 0.5 * (op.tresbolillo ? 1 : 0) : 0) + (az() - 0.5) * 0.2 * des * sx, z = C[2] - j * sz + (az() - 0.5) * 0.2 * des * sz;
      pon(x, C[1], z, x);
    }
  } else {
    const R = op.radio || 0, sx = op.sep || 0.62;
    for (let j = 0; j < filas; j++) {
      const y = C[1] + j * ea, d = j * ep;
      if (R > 0) {
        const r = R + d, arco = ancho / R, n = Math.round((arco * r) / sx), cz = C[2] + R;
        for (let i = 0; i < n; i++) { const a = -arco / 2 + (i + 0.5 + (az() - 0.5) * 0.25 * des) * (arco / n), x = C[0] + Math.sin(a) * r, z = cz - Math.cos(a) * r; pon(x, y, z, a * R, a); }
      } else {
        const n = Math.round(ancho / sx);
        for (let i = 0; i < n; i++) { const x = C[0] - ancho / 2 + (i + 0.5 + (az() - 0.5) * 0.25 * des) * sx; pon(x, y, C[2] - d, x, 0); }
      }
    }
  }
  return lista;
}

// Las gradas de un estadio, para poner encima la gente de gente(semilla, op) con forma "gradas" (el mismo op): cada
// fila, su escalón de hormigón y el borde de sus asientos de color. Se dibujan antes que la multitud. Además de lo de
// gente(): asientos ("r,g,b", o una lista que se reparte por filas), hormigon ("r,g,b"), luz ([lx, ly, lz] como en
// persona(), para el lado que da a la luz).
export function graderio(g, cam, op = {}) {
  const C = op.centro || [0, 0, 0], filas = op.filas || 10, ancho = op.ancho || 30, [ea, ep] = op.escalon || [0.45, 0.85], R = op.radio || 0;
  const asi = [].concat(op.asientos || ["38,80,160"]), hor = (op.hormigon || "150,150,154").split(",").map(Number);
  const tono = (c, k) => `rgb(${Math.round(c[0] * k)},${Math.round(c[1] * k)},${Math.round(c[2] * k)})`;
  const cara = (pts, col) => { const q = poligonoEn(cam, pts); if (!q) return; g.beginPath(); q.forEach((v, i) => (i ? g.lineTo(v[0], v[1]) : g.moveTo(v[0], v[1]))); g.closePath(); g.fillStyle = col; g.fill(); };
  // un trozo de grada de la fila j entre los puntos a y b del suelo (el frente de la fila) y su fondo hacia atrás
  const trozo = (j, a0, a1, b0, b1) => {
    const y = C[1] + j * ea, sc = asi[j % asi.length].split(",").map(Number);
    cara([[a0[0], y, a0[1]], [b0[0], y, b0[1]], [b1[0], y, b1[1]], [a1[0], y, a1[1]]], tono(hor, 0.92)); // la huella
    cara([[a0[0], y - ea, a0[1]], [b0[0], y - ea, b0[1]], [b0[0], y, b0[1]], [a0[0], y, a0[1]]], tono(hor, 0.62)); // la tabica
    cara([[a1[0], y, a1[1]], [b1[0], y, b1[1]], [b1[0], y + 0.42, b1[1]], [a1[0], y + 0.42, a1[1]]], tono(sc, 0.85)); // los respaldos
  };
  g.save();
  for (let j = filas; j >= 0; j--) {
    const d = j * ep;
    if (R > 0) {
      const r0 = R + d - ep * 0.5, r1 = r0 + ep, arco = ancho / R, n = 28, cz = C[2] + R;
      for (let i = 0; i < n; i++) {
        const u0 = -arco / 2 + (arco * i) / n, u1 = u0 + arco / n, P = (a, r) => [C[0] + Math.sin(a) * r, cz - Math.cos(a) * r];
        trozo(j, P(u0, r0), P(u0, r1), P(u1, r0), P(u1, r1));
      }
    } else {
      const z0 = C[2] - d + ep * 0.5, z1 = z0 - ep, x0 = C[0] - ancho / 2 - 0.5, x1 = C[0] + ancho / 2 + 0.5;
      trozo(j, [x0, z0], [x0, z1], [x1, z0], [x1, z1]);
    }
  }
  g.restore();
}

// Los dibujos ya hechos de cada persona de la multitud: uno por cara, por vista (cada 30°), por momento de su gesto y
// por tamaño (48, 96, 192 y 384 píxeles de alto). Cada uno sale de dibujar la persona al doble y reducirla (así no
// tiembla), y siempre igual, se pida en el orden que se pida.
const NIVELES = [48, 96, 192, 384], dibujos = new Map();
let enMemoria = 0;
function dibujo(clave, nivel, hazlo) {
  const k = clave + "|" + nivel;
  let l = dibujos.get(k);
  if (l) return l;
  if (enMemoria > 6e7) { dibujos.clear(); enMemoria = 0; } // unos 240 MB de dibujos como mucho
  const H = NIVELES[nivel], W = Math.ceil(H * 1.3), Hh = Math.ceil(H * 1.42), H2 = nivel === NIVELES.length - 1 ? H : H * 2;
  const m = lienzo(Math.ceil(H2 * 1.3), Math.ceil(H2 * 1.42));
  hazlo(m.getContext("2d"), m.width / 2, H2 * 1.32, H2);
  if (H2 === H) l = m;
  else { l = lienzo(W, Hh); const c = l.getContext("2d"); c.imageSmoothingQuality = "high"; c.drawImage(m, 0, 0, m.width, m.height, 0, 0, W, Hh); }
  fija(l); dibujos.set(k, l); enMemoria += l.width * l.height;
  return l;
}

// Los gestos de la multitud: con qué pose se dibuja cada persona en el segundo t y en cuántos momentos se parte su
// ciclo. p: la persona de gente().
const GESTOS = {
  quieta: (p) => ({ pose: p.sentada ? "sentada" : "de pie", n: 1 }),
  mira: (p) => ({ pose: p.sentada ? "sentada" : "mira", cabeza: [0, p.sentada ? 0.45 : 0], n: 1 }),
  aplaude: (p) => ({ pose: p.sentada ? "sentada" : "aplaude", brazos: "aplaude", n: 5 }),
  celebra: (p) => (p.semilla % 4 === 3 ? { pose: "aplaude", brazos: "aplaude", n: 6 } : { pose: p.sentada ? "levanta" : "celebra", u: 1, sentada: p.sentada, n: p.sentada ? 1 : 6, bota: p.sentada ? 0.03 : 0 }),
  bota: (p) => ({ pose: p.sentada ? "sentada" : "de pie", brazos: ["arriba", "arriba", "saluda", "sueltos"][p.semilla % 4], quieto: true, n: 1, bota: 0.045 }),
};

// Una multitud vista con la cámara cam, de lejos a cerca: lista, la de gente(). op:
//   anima: "quieta" | "mira" (arriba) | "aplaude" | "celebra" | "bota" | "ola" (se levantan al pasar la ola)
//   ritmo: vueltas por segundo del gesto · ola: { vel (metros por segundo; en las gradas en arco, metros del arco),
//   ancho (metros), desde (dónde empieza) }
//   luz, borde, silueta: como en persona() (la misma para todas) · gris: todas grises como maniquíes
//   color: (persona, i) => "r,g,b" o null, para pintar de un color que brilla a las que digas («1 de cada N»)
//   lejos: a partir de qué distancia se apagan hasta desaparecer (sin él, no se apagan)
// Las que salen enormes (más de 400 píxeles) se dibujan enteras con persona(); las demás, con sus dibujos ya hechos.
// Devuelve cuántas ha dibujado.
export function multitud(g, cam, lista, t, op = {}) {
  const anima = op.anima || "quieta", ritmo = op.ritmo || (anima === "aplaude" ? 2.4 : 1.6), yaw = Math.atan2(-cam.e.f[0], -cam.e.f[2]);
  const luz = op.luz || LUZ, kl = luz.map((v) => v.toFixed(2)).join(","), modo = op.silueta ? "s" + op.silueta : op.gris ? "g" : "";
  const vis = [];
  for (const p of lista) {
    const q = proyecta(cam, p.p);
    if (!q || q.z < 0.3) continue;
    const h = (F * p.alto) / q.z;
    if (h < 1.5 || q.x < -h || q.x > 1080 + h || q.y < -0.2 * h || q.y > 1920 + 1.4 * h) continue;
    vis.push({ p, q, h });
  }
  vis.sort((a, b) => b.q.z - a.q.z);
  const A = g.globalAlpha, ol = op.ola || {};
  g.save();
  for (const { p, q, h } of vis) {
    let ges;
    if (anima === "ola") {
      const u = Math.exp(-(((p.ola - (ol.desde ?? -30) - (ol.vel ?? 12) * t) / (ol.ancho ?? 4)) ** 2)), k = Math.round(u * 5) / 5;
      ges = { pose: "levanta", u: k, sentada: p.sentada, n: 1, clave: "o" + k };
    } else ges = (GESTOS[anima] || GESTOS.quieta)(p);
    const fase = (((t * ritmo + p.fase) % 1) + 1) % 1, fr = Math.floor(fase * ges.n), tf = ges.n > 1 ? fr / ges.n / ritmo : 0;
    const rel = p.gira - yaw, vista = ((Math.round(rel / (Math.PI / 6)) % 12) + 12) % 12;
    const col = op.color ? op.color(p, p.i) : null;
    const al = op.lejos ? Math.max(0, Math.min(1, (op.lejos * 1.3 - q.z) / (op.lejos * 0.3))) : 1;
    if (al <= 0.01) continue;
    g.globalAlpha = A * al;
    const bota = ges.bota ? h * ges.bota * Math.pow(Math.max(0, Math.sin(Math.PI * 2 * fase)), 1.5) : 0;
    if (col) brillo(g, q.x, q.y - h * 0.55, h * 1.5, col, 0.4);
    const opp = { semilla: p.semilla, pose: ges.pose, brazos: ges.brazos, cabeza: ges.cabeza, u: ges.u, sentada: ges.sentada, quieto: ges.quieto, t: tf, ritmo, luz, borde: op.borde, silueta: op.silueta, gris: op.gris && !col, color: col, halo: false };
    if (h > 400) { persona(g, q.x, q.y - bota, h, { ...opp, gira: vista * (Math.PI / 6) }); continue; }
    let nv = 0; while (NIVELES[nv] < h * 0.95 && nv < NIVELES.length - 1) nv++;
    const clave = [p.semilla, vista, ges.clave || ges.pose, ges.brazos || "", fr, kl, col || modo, op.borde || ""].join("|");
    const l = dibujo(clave, nv, (c, x, y, H) => persona(c, x, y, H, { ...opp, gira: vista * (Math.PI / 6) })), s = h / NIVELES[nv];
    g.drawImage(l, q.x - (l.width * s) / 2, q.y - bota - 1.32 * h, l.width * s, l.height * s);
  }
  g.restore();
  return vis.length;
}
