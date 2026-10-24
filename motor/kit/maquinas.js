// Máquinas: engranajes de metal que giran (y una pareja que encaja), una pantalla (un móvil o un monitor) con lo que
// quieras dentro, un botón que se aprieta, un interruptor de palanca, un piloto que se enciende y un cuentakilómetros
// de rodillos. Todo con su metal, su luz y su sombra; en coordenadas de pantalla.
import { Path2D } from "@napi-rs/canvas";
import { azar, lienzo, mez, mezRgb, redondo } from "./base.js";
import { brillo } from "./luz.js";

// Los metales: [luz, medio, sombra, hondo] en "#rrggbb".
export const METALES = {
  acero: ["#f4f6f8", "#a9b0b8", "#5d646c", "#23272c"],
  laton: ["#fff1b8", "#d6aa52", "#8a6224", "#3a2508"],
  cobre: ["#ffd6b8", "#d0835a", "#83432a", "#371409"],
  oscuro: ["#a7adb5", "#4d535b", "#25292e", "#0c0e10"],
};
const metalDe = (t) => (typeof t === "string" ? METALES[t] : t) || METALES.acero;
const hx = (h) => `${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)}`;

// Dónde empieza un degradado cónico (unas versiones del lienzo empiezan arriba y otras a la derecha): se gira el
// lienzo para ponerlo donde se quiere.
const CONO = (() => {
  const l = lienzo(16), c = l.getContext("2d"), cg = c.createConicGradient(0, 8, 8);
  cg.addColorStop(0, "#ff0000"); cg.addColorStop(0.25, "#00ff00"); cg.addColorStop(0.5, "#0000ff"); cg.addColorStop(0.75, "#00ff00"); cg.addColorStop(1, "#ff0000");
  c.fillStyle = cg; c.fillRect(0, 0, 16, 16);
  const d = c.getImageData(8, 1, 1, 1).data;
  return d[0] > 128 && d[1] < 128 ? -Math.PI / 2 : 0;
})();

// Las marcas del torno: anillos finos alrededor del centro (512 × 512, gris sobre transparente), para el metal girado.
let elTorno = null;
function torno() {
  if (elTorno) return elTorno;
  const l = lienzo(512), c = l.getContext("2d"), az = azar(71);
  for (let r = 4; r < 256; r += 1.5) { c.strokeStyle = `rgba(0,0,0,${0.05 + az() * 0.16})`; c.lineWidth = 0.6 + az() * 0.8; c.beginPath(); c.arc(256, 256, r, 0, Math.PI * 2); c.stroke(); }
  return (elTorno = l);
}

// ---------------------------------------------------------------- engranajes
const perfiles = new Map();
// La silueta de un engranaje de radio 1 (el radio primitivo): n dientes con los flancos curvos, el agujero del eje y
// los agujeros de aligerar (para rellenar con "evenodd"). Una vez por forma.
function perfil(n, agujeros) {
  const k = n + "-" + agujeros;
  if (perfiles.has(k)) return perfiles.get(k);
  const p = new Path2D(), m = 2 / n, ra = 1 + m, rf = 1 - 1.25 * m, paso = (Math.PI * 2) / n, w = Math.PI / (2 * n);
  const pol = (r, a) => [r * Math.cos(a), r * Math.sin(a)];
  // el flanco, del pie a la punta: [radio, media anchura del diente]
  const flanco = [[rf, w * 1.42], [1 - 0.7 * m, w * 1.2], [1 - 0.25 * m, w * 1.06], [1, w], [1 + 0.4 * m, w * 0.88], [1 + 0.75 * m, w * 0.74], [ra, w * 0.6]];
  for (let i = 0; i < n; i++) {
    const c = i * paso;
    for (const [r, a] of flanco) { const [x, y] = pol(r, c - a); i === 0 && r === rf ? p.moveTo(x, y) : p.lineTo(x, y); }
    p.arc(0, 0, ra, c - w * 0.6, c + w * 0.6);
    for (let j = flanco.length - 1; j >= 0; j--) { const [x, y] = pol(flanco[j][0], c + flanco[j][1]); p.lineTo(x, y); }
    p.arc(0, 0, rf, c + w * 1.42, c + paso - w * 1.42);
  }
  p.closePath();
  // el eje y su chavetero
  p.moveTo(0.13, 0); p.arc(0, 0, 0.13, 0, Math.PI * 2); p.closePath();
  if (agujeros > 0) {
    const ri = rf - 0.16, rc = 0.42, ancho = (Math.PI * 2) / agujeros, hueco = 0.13 + 0.1 / Math.max(1, agujeros - 3);
    for (let i = 0; i < agujeros; i++) {
      const a0 = i * ancho + hueco, a1 = (i + 1) * ancho - hueco, [x, y] = pol(rc, a0);
      p.moveTo(x, y); p.arc(0, 0, ri, a0 + 0.04, a1 - 0.04); p.arc(0, 0, rc, a1, a0, true); p.closePath();
    }
  }
  const r = { p, ra, rf };
  perfiles.set(k, r);
  return r;
}

// Un engranaje (una parte: "lado", lo de detrás con su sombra; "cara", lo de delante; o las dos).
function unEngranaje(g, x, y, r, giro, op, parte) {
  const n = op.dientes ?? Math.max(8, Math.min(64, Math.round(r / 13))), M = metalDe(op.tono || "acero");
  const ag = op.agujeros ?? (r > 90 && n >= 14 ? (n >= 30 ? 6 : 5) : 0), P = perfil(n, ag), gros = (op.grosor ?? r * 0.14) / r;
  const luz = op.luz || [-0.6, -0.8], ll = Math.hypot(luz[0], luz[1]) || 1, lx = luz[0] / ll, ly = luz[1] / ll;
  const dx = -lx * 0.45 + 0.2, dy = -ly * 0.9; // hacia dónde se ve el grosor (lo contrario de la luz, y hacia abajo)
  const rot = (px, py) => [px * Math.cos(-giro) - py * Math.sin(-giro), px * Math.sin(-giro) + py * Math.cos(-giro)];
  g.save(); g.translate(x, y); g.scale(r, r);
  if (parte !== "cara") {
    // la sombra en lo de detrás y el canto (el mismo dibujo, corrido, cada vez más oscuro hacia delante)
    const sx = dx * gros * 2.2, sy = dy * gros * 2.2 + 0.06, sg = g.createRadialGradient(sx, sy, P.rf * 0.6, sx, sy, P.ra * 1.25);
    sg.addColorStop(0, "rgba(0,0,0,0.6)"); sg.addColorStop(0.55, "rgba(0,0,0,0.35)"); sg.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = sg; g.beginPath(); g.arc(sx, sy, P.ra * 1.25, 0, Math.PI * 2); g.fill();
    // (cada capa es solo el borde, con trazo: lo de dentro lo tapa la cara)
    const pasos = Math.max(2, Math.min(5, Math.round((gros * r) / 7))), paso = (gros * Math.hypot(dx, dy)) / pasos;
    g.save(); g.translate(dx * gros, dy * gros); g.rotate(giro); g.fillStyle = mezColorRgb(M[3], "#000000", 0.3); g.fill(P.p, "evenodd"); g.restore();
    g.lineJoin = "round"; g.lineWidth = paso * 2.7;
    for (let i = pasos; i >= 1; i--) {
      const f = i / pasos, [ax, ay] = rot(lx, ly), lg = g.createLinearGradient(ax * 1.2, ay * 1.2, -ax * 1.2, -ay * 1.2);
      lg.addColorStop(0, mezColorRgb(M[1], M[3], 0.35 + 0.4 * f)); lg.addColorStop(0.5, mezColorRgb(M[2], M[3], 0.3 + 0.5 * f)); lg.addColorStop(1, mezColorRgb(M[3], "#000000", 0.4 * f));
      g.save(); g.translate(dx * gros * f, dy * gros * f); g.rotate(giro); g.strokeStyle = lg; g.stroke(P.p); g.restore();
    }
  }
  if (parte !== "lado") {
    g.save(); g.rotate(giro);
    g.save(); g.clip(P.p, "evenodd");
    // la cara: el metal con la luz de un lado, y los brillos del torneado (fijos aunque gire: son de la luz)
    const [ax, ay] = rot(lx, ly), bg = g.createLinearGradient(ax * P.ra, ay * P.ra, -ax * P.ra, -ay * P.ra);
    bg.addColorStop(0, mezColorRgb(M[0], M[1], 0.3)); bg.addColorStop(0.5, mezColorRgb(M[1], M[2], 0.45)); bg.addColorStop(1, mezColorRgb(M[2], M[3], 0.5));
    g.fillStyle = bg; g.fillRect(-P.ra, -P.ra, P.ra * 2, P.ra * 2);
    const la = Math.atan2(ly, lx) - giro, cg = g.createConicGradient(0, 0, 0), cl = `rgba(${hx(M[0])},`;
    cg.addColorStop(0, "rgba(0,0,0,0.3)"); cg.addColorStop(0.13, "rgba(0,0,0,0)"); cg.addColorStop(0.2, cl + "0.55)"); cg.addColorStop(0.25, cl + "0.9)"); cg.addColorStop(0.3, cl + "0.55)"); cg.addColorStop(0.37, "rgba(0,0,0,0)");
    cg.addColorStop(0.5, "rgba(0,0,0,0.35)"); cg.addColorStop(0.63, "rgba(0,0,0,0)"); cg.addColorStop(0.7, cl + "0.35)"); cg.addColorStop(0.75, cl + "0.6)"); cg.addColorStop(0.8, cl + "0.35)"); cg.addColorStop(0.87, "rgba(0,0,0,0)"); cg.addColorStop(1, "rgba(0,0,0,0.3)");
    g.save(); g.rotate(la - Math.PI / 2 - CONO); g.fillStyle = cg; g.fillRect(-P.ra, -P.ra, P.ra * 2, P.ra * 2); g.restore();
    g.drawImage(torno(), -P.ra, -P.ra, P.ra * 2, P.ra * 2);
    // el chaflán: el filo que mira a la luz brilla, el otro se oscurece
    const fg = g.createLinearGradient(ax, ay, -ax, -ay);
    fg.addColorStop(0, "rgba(255,255,255,0.95)"); fg.addColorStop(0.45, "rgba(255,255,255,0.25)"); fg.addColorStop(0.6, "rgba(0,0,0,0.25)"); fg.addColorStop(1, "rgba(0,0,0,0.6)");
    g.strokeStyle = fg; g.lineWidth = Math.max(2.5 / r, 0.05); g.lineJoin = "round"; g.stroke(P.p);
    // el cubo: un anillo que sobresale alrededor del eje
    const cubo = 0.3, hg = g.createLinearGradient(ax * cubo, ay * cubo, -ax * cubo, -ay * cubo);
    hg.addColorStop(0, M[2]); hg.addColorStop(0.5, M[1]); hg.addColorStop(1, M[0]);
    g.strokeStyle = hg; g.lineWidth = 0.05; g.beginPath(); g.arc(0, 0, cubo, 0, Math.PI * 2); g.stroke();
    const hg2 = g.createLinearGradient(ax * cubo, ay * cubo, -ax * cubo, -ay * cubo);
    hg2.addColorStop(0, "rgba(255,255,255,0.8)"); hg2.addColorStop(1, "rgba(0,0,0,0.5)");
    g.strokeStyle = hg2; g.lineWidth = 0.018; g.beginPath(); g.arc(0, 0, cubo + 0.03, 0, Math.PI * 2); g.stroke();
    // el agujero del eje, con su borde de sombra
    const eg = g.createLinearGradient(ax * 0.16, ay * 0.16, -ax * 0.16, -ay * 0.16);
    eg.addColorStop(0, "rgba(0,0,0,0.7)"); eg.addColorStop(1, "rgba(255,255,255,0.6)");
    g.strokeStyle = eg; g.lineWidth = 0.035; g.beginPath(); g.arc(0, 0, 0.145, 0, Math.PI * 2); g.stroke();
    g.restore();
    // el chavetero (la muesca del eje)
    g.fillStyle = M[3]; g.fillRect(-0.035, -0.17, 0.07, 0.06);
    g.restore();
  }
  g.restore();
  return n;
}
const mezColorRgb = (a, b, u) => `rgb(${mezRgb(hx(a), hx(b), u)})`;

// Un engranaje de metal de radio r (el de donde engrana; los dientes salen un poco más) en (x, y), girado giro
// radianes (súmale el tiempo para que gire). Visto de frente, con su grosor, su cara torneada, su chaflán y su cubo.
//   op.dientes: cuántos (si no, según el tamaño); op.tono: "acero", "laton", "cobre", "oscuro" (METALES) o una
//   lista; op.agujeros: los huecos de aligerar (0, ninguno); op.grosor: el canto, en px; op.luz: [lx, ly] de dónde
//   viene la luz en la pantalla.
export function engranaje(g, x, y, r, giro, op = {}) {
  if (r < 3) return;
  unEngranaje(g, x, y, r, giro, op, "todo");
}

// Dos engranajes que encajan: el primero en (x, y) con radio r1 y girado giro; el segundo, de radio r2 (se ajusta
// para que los dientes sean iguales), al lado en la dirección dir (radianes; 0 a la derecha), girando al revés y
// más despacio o más deprisa según sus dientes. op: como engranaje (op.tono2: el metal del segundo).
// Devuelve dónde ha quedado el segundo: { x, y, r, giro, dientes }. Para encadenar un tercero:
//   const o = k.engranajes(g, x, y, 280, 160, t); k.engranajes(g, o.x, o.y, o.r, 90, o.giro, { dientes: o.dientes, dir: 1 });
export function engranajes(g, x, y, r1, r2, giro, op = {}) {
  const dir = op.dir ?? 0, n1 = op.dientes ?? Math.max(8, Math.min(64, Math.round(r1 / 13))), mod = (2 * r1) / n1;
  const n2 = Math.max(6, Math.round((2 * r2) / mod)), R2 = (n2 * mod) / 2, d = r1 + R2;
  const x2 = x + Math.cos(dir) * d, y2 = y + Math.sin(dir) * d, giro2 = (-(n1 / n2)) * (giro - dir) + dir + Math.PI + Math.PI / n2;
  const op1 = { ...op, dientes: n1 }, op2 = { ...op, dientes: n2, tono: op.tono2 || op.tono, agujeros: op.agujeros2 ?? op.agujeros, grosor: op.grosor };
  unEngranaje(g, x, y, r1, giro, op1, "lado"); unEngranaje(g, x2, y2, R2, giro2, op2, "lado");
  unEngranaje(g, x, y, r1, giro, op1, "cara"); unEngranaje(g, x2, y2, R2, giro2, op2, "cara");
  return { x: x2, y: y2, r: R2, giro: giro2, dientes: n2 };
}

// Una sombra blanda bajo un rectángulo redondeado de w × h con esquina r: desenfocada d px y corrida dy hacia abajo.
// Se desenfoca una vez por tamaño, a un cuarto de resolución, y se pone ampliada (rápida).
const sombras = new Map();
function sombraBlanda(g, x, y, w, h, r, d, al = 0.5, dy = 0) {
  const q = 4, k = [w, h, r, d].map((v) => Math.round(v / q)).join("x");
  if (!sombras.has(k)) {
    if (sombras.size > 80) sombras.clear();
    const W = Math.round(w / q), H = Math.round(h / q), D = Math.max(1, Math.round(d / q)), l = lienzo(W + 4 * D, H + 4 * D), c = l.getContext("2d");
    c.shadowColor = "rgba(0,0,0,1)"; c.shadowBlur = D; c.shadowOffsetX = l.width; c.fillStyle = "#000";
    redondo(c, 2 * D - l.width, 2 * D, W, H, r / q); c.fill();
    sombras.set(k, { l, D });
  }
  const S = sombras.get(k);
  g.save(); g.globalAlpha *= al; g.imageSmoothingEnabled = true;
  g.drawImage(S.l, x - 2 * S.D * q, y - 2 * S.D * q + dy, S.l.width * q, S.l.height * q);
  g.restore();
}

// ---------------------------------------------------------------- pantallas
const pantallas = new Map();
// Un lienzo de paso para lo que va dentro de una pantalla (uno por tamaño), limpio.
function lienzoDePantalla(w, h) {
  const k = w + "x" + h;
  if (!pantallas.has(k)) pantallas.set(k, lienzo(w, h));
  const l = pantallas.get(k), c = l.getContext("2d");
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = "source-over"; c.clearRect(0, 0, w, h);
  return l;
}

// Una pantalla de verdad centrada en (x, y), de w × h (todo el aparato): un móvil (marco de metal, cristal negro,
// la isla de la cámara y los botones del lado) o un monitor (marco fino, barbilla y su pie). Lo de dentro lo dibuja
// contenido(gc, ancho, alto), en un lienzo aparte del tamaño de la pantalla (empieza vacío: pinta el fondo).
//   op.tipo: "movil" o "monitor"; op.ang: inclinación (radianes); op.brillo: de 0 (apagada: cristal negro con su
//   reflejo) a 1; op.metal: el marco ("acero", "oscuro", "laton"... o una lista); op.luz: cuánto alumbra alrededor.
export function pantalla(g, x, y, w, h, contenido, op = {}) {
  const tipo = op.tipo || "movil", movil = tipo === "movil", M = metalDe(op.metal || (movil ? "acero" : "oscuro")), br = op.brillo ?? 1;
  const ra = movil ? w * 0.15 : w * 0.018, marco = movil ? w * 0.022 : w * 0.012, bisel = movil ? w * 0.028 : w * 0.018;
  const pie = movil ? 0 : h * 0.06, sw = Math.round(w - 2 * (marco + bisel)), sh = Math.round(h - 2 * (marco + bisel) - pie), rs = movil ? ra - marco - bisel * 0.6 : w * 0.006;
  g.save(); g.translate(x, y); g.rotate(op.ang || 0);
  // la luz de la pantalla alrededor (y su sombra)
  if (br > 0.01 && (op.luz ?? 1) > 0) brillo(g, 0, 0, Math.max(w, h) * 2.2, op.colorLuz || "150,190,255", 0.35 * br * (op.luz ?? 1));
  sombraBlanda(g, -w / 2, -h / 2, w, h, ra, Math.max(14, w * 0.09), 0.75, w * 0.05);
  if (!movil) {
    // el pie del monitor: el cuello y la base
    const cw = w * 0.16, ch = h * 0.42, by = h / 2 + ch * 0.55;
    g.save(); g.beginPath(); g.moveTo(-cw / 2, h / 2 - 4); g.lineTo(cw / 2, h / 2 - 4); g.lineTo(cw * 0.42, by); g.lineTo(-cw * 0.42, by); g.closePath();
    const cg = g.createLinearGradient(-cw / 2, 0, cw / 2, 0); cg.addColorStop(0, M[2]); cg.addColorStop(0.35, M[0]); cg.addColorStop(0.6, M[1]); cg.addColorStop(1, M[3]);
    g.fillStyle = cg; g.fill();
    g.beginPath(); g.ellipse(0, by + h * 0.015, w * 0.3, h * 0.045, 0, 0, Math.PI * 2);
    const bg = g.createLinearGradient(0, by - h * 0.03, 0, by + h * 0.06); bg.addColorStop(0, M[0]); bg.addColorStop(0.4, M[1]); bg.addColorStop(1, M[3]);
    g.fillStyle = bg; g.fill(); g.restore();
  }
  // el marco de metal, con bandas de luz, y el borde que brilla
  redondo(g, -w / 2, -h / 2, w, h, ra);
  const mg = g.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  mg.addColorStop(0, M[1]); mg.addColorStop(0.18, M[0]); mg.addColorStop(0.32, M[2]); mg.addColorStop(0.6, M[1]); mg.addColorStop(0.82, M[0]); mg.addColorStop(1, M[3]);
  g.fillStyle = mg; g.fill();
  g.strokeStyle = "rgba(255,255,255,0.35)"; g.lineWidth = Math.max(1, w * 0.004); redondo(g, -w / 2 + marco * 0.25, -h / 2 + marco * 0.25, w - marco * 0.5, h - marco * 0.5, ra - marco * 0.25); g.stroke();
  // los botones del lado (el móvil)
  if (movil) {
    const bw = w * 0.018;
    for (const [lado, y0, l] of [[-1, -0.24, 0.09], [-1, -0.12, 0.09], [1, -0.17, 0.14]]) {
      const bx = lado < 0 ? -w / 2 - bw * 0.8 : w / 2 - bw * 0.2;
      redondo(g, bx, h * y0, bw, h * l, bw / 2); const bgr = g.createLinearGradient(bx, 0, bx + bw, 0); bgr.addColorStop(0, M[lado < 0 ? 2 : 0]); bgr.addColorStop(1, M[lado < 0 ? 0 : 2]); g.fillStyle = bgr; g.fill();
    }
  }
  // el cristal negro (el bisel) y la pantalla
  const cx0 = -w / 2 + marco, cy0 = -h / 2 + marco;
  redondo(g, cx0, cy0, w - 2 * marco, h - 2 * marco - pie, ra - marco); g.fillStyle = "#050607"; g.fill();
  const px = -sw / 2, py = cy0 + bisel;
  g.save(); redondo(g, px, py, sw, sh, rs); g.clip();
  if (br > 0.003 && contenido) {
    const l = lienzoDePantalla(sw, sh);
    contenido(l.getContext("2d"), sw, sh);
    g.save(); g.globalAlpha *= Math.min(1, br * 1.2); g.drawImage(l, px, py); g.restore();
    if (br < 1) { g.fillStyle = `rgba(0,0,0,${(1 - br) * 0.6})`; g.fillRect(px, py, sw, sh); }
  }
  // el cristal: un reflejo en diagonal y un poco de luz en un borde
  g.globalCompositeOperation = "screen";
  const rg = g.createLinearGradient(px, py, px + sw, py + sh * 0.7);
  rg.addColorStop(0, "rgba(255,255,255,0.1)"); rg.addColorStop(0.3, "rgba(255,255,255,0.02)"); rg.addColorStop(0.42, "rgba(255,255,255,0)"); rg.addColorStop(0.47, "rgba(255,255,255,0.13)"); rg.addColorStop(0.58, "rgba(255,255,255,0.03)"); rg.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = rg; g.fillRect(px, py, sw, sh);
  g.restore();
  // la isla de la cámara (el móvil) o la barbilla con su piloto (el monitor)
  if (movil) {
    const iw = w * 0.3, ih = w * 0.085, iy = py + w * 0.035;
    redondo(g, -iw / 2, iy, iw, ih, ih / 2); g.fillStyle = "#020203"; g.fill();
    const lg = g.createRadialGradient(iw * 0.3, iy + ih / 2, 0, iw * 0.3, iy + ih / 2, ih * 0.32); lg.addColorStop(0, "rgba(70,90,140,0.9)"); lg.addColorStop(0.5, "rgba(20,25,45,1)"); lg.addColorStop(1, "rgba(5,5,8,1)");
    g.fillStyle = lg; g.beginPath(); g.arc(iw * 0.3, iy + ih / 2, ih * 0.32, 0, Math.PI * 2); g.fill();
  } else {
    const yb = h / 2 - marco - pie / 2;
    g.fillStyle = "rgba(255,255,255,0.05)"; g.fillRect(-w / 2 + marco, yb - pie / 2, w - 2 * marco, 1.5);
    piloto(g, w * 0.4, yb, Math.max(3, pie * 0.08), br > 0.01 ? 1 : 0.15, "120,255,140", { bisel: false });
  }
  g.restore();
}

// ---------------------------------------------------------------- pilotos, botones, interruptores
// Un piloto (un led con su cristal en un aro de metal) de radio r en (x, y). enc de 0 (apagado: cristal oscuro de su
// color) a 1 (encendido: blanco en el centro, su color alrededor y su halo). color: "r,g,b".
//   op.bisel: false para el led solo, sin aro; op.halo: lo grande del brillo (en radios).
export function piloto(g, x, y, r, enc = 1, color = "255,60,50", op = {}) {
  if (r < 1) return;
  const e = Math.max(0, Math.min(1, enc));
  g.save();
  if (op.bisel !== false) {
    // el aro de metal, con su luz arriba
    const ag = g.createLinearGradient(x, y - r * 1.5, x, y + r * 1.5);
    ag.addColorStop(0, "#f2f4f7"); ag.addColorStop(0.45, "#8b929b"); ag.addColorStop(0.55, "#4a5058"); ag.addColorStop(1, "#d0d5db");
    g.fillStyle = ag; g.beginPath(); g.arc(x, y, r * 1.45, 0, Math.PI * 2); g.fill();
    const ig = g.createLinearGradient(x, y - r * 1.2, x, y + r * 1.2); ig.addColorStop(0, "#1c1f23"); ig.addColorStop(1, "#9aa1a9");
    g.fillStyle = ig; g.beginPath(); g.arc(x, y, r * 1.18, 0, Math.PI * 2); g.fill();
  }
  // el cristal: oscuro de su color, o encendido
  const lg = g.createRadialGradient(x - r * 0.15, y - r * 0.2, 0, x, y, r);
  lg.addColorStop(0, `rgb(${mezRgb(mezRgb(color, "0,0,0", 0.55), "255,255,255", e)})`);
  lg.addColorStop(0.35, `rgb(${mezRgb(mezRgb(color, "0,0,0", 0.62), mezRgb(color, "255,255,255", 0.35), e)})`);
  lg.addColorStop(0.8, `rgb(${mezRgb(mezRgb(color, "0,0,0", 0.75), color, e)})`);
  lg.addColorStop(1, `rgb(${mezRgb(mezRgb(color, "0,0,0", 0.88), mezRgb(color, "0,0,0", 0.35), e)})`);
  g.fillStyle = lg; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  // el chip de dentro (se ve si está apagado) y el brillo del cristal
  if (e < 0.6) { g.fillStyle = `rgba(0,0,0,${0.25 * (1 - e / 0.6)})`; g.fillRect(x - r * 0.18, y - r * 0.18, r * 0.36, r * 0.36); }
  const bg = g.createRadialGradient(x - r * 0.35, y - r * 0.45, 0, x - r * 0.35, y - r * 0.45, r * 0.45);
  bg.addColorStop(0, "rgba(255,255,255,0.85)"); bg.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = bg; g.beginPath(); g.arc(x - r * 0.35, y - r * 0.45, r * 0.45, 0, Math.PI * 2); g.fill();
  g.restore();
  if (e > 0.01) { brillo(g, x, y, r * (op.halo ?? 7) * (0.6 + 0.4 * e), color, 0.9 * e); brillo(g, x, y, r * 2.2, "255,255,255", 0.5 * e); }
}

// Un botón redondo de verdad (de los de una máquina) en (x, y), de radio r, visto un poco desde arriba: el aro, el
// capuchón de plástico con su lado y su brillo, que baja al apretarlo (aprieta de 0 a 1) y puede iluminarse.
//   op.color: "r,g,b" del capuchón; op.luz: de 0 a 1, cuánto se ilumina por dentro; op.texto: lo que lleva escrito;
//   op.inclina: lo aplastado que se ve (1 desde arriba, 0,5 de lado); op.alto: lo que sobresale (en radios).
export function boton(g, x, y, r, aprieta = 0, op = {}) {
  const { color = "215,38,38", inclina = 0.55, texto = "" } = op, luz = Math.max(0, Math.min(1, op.luz ?? 0));
  const ry = r * inclina, alto = r * (op.alto ?? 0.42) * (1 - 0.8 * Math.max(0, Math.min(1, aprieta))), rc = r * 0.8;
  g.save();
  // la sombra y el aro de metal (con su agujero)
  const sg = g.createRadialGradient(x + r * 0.08, y + ry * 0.35, r * 0.6, x + r * 0.08, y + ry * 0.35, r * 1.5);
  sg.addColorStop(0, "rgba(0,0,0,0.6)"); sg.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = sg; g.beginPath(); g.ellipse(x + r * 0.08, y + ry * 0.35, r * 1.5, ry * 1.6, 0, 0, Math.PI * 2); g.fill();
  const hr = r * 0.12;
  g.beginPath(); g.ellipse(x, y + hr, r * 1.12, ry * 1.12, 0, 0, Math.PI * 2); g.fillStyle = "#15171a"; g.fill();
  g.beginPath(); g.ellipse(x, y, r * 1.12, ry * 1.12, 0, 0, Math.PI * 2);
  const ag = g.createLinearGradient(x - r, y - ry, x + r, y + ry); ag.addColorStop(0, "#f4f6f8"); ag.addColorStop(0.4, "#9aa1aa"); ag.addColorStop(0.7, "#5f666f"); ag.addColorStop(1, "#c8cdd3");
  g.fillStyle = ag; g.fill();
  g.beginPath(); g.ellipse(x, y, r * 0.92, ry * 0.92, 0, 0, Math.PI * 2); g.fillStyle = "#08090a"; g.fill();
  // el capuchón: su lado (un cilindro) y su cara de arriba
  const top = y - alto, cl = mezRgb(color, "255,255,255", 0.22 * luz);
  g.beginPath(); g.ellipse(x, y + ry * 0.05, rc, rc * inclina, 0, 0, Math.PI); g.lineTo(x - rc, top); g.ellipse(x, top, rc, rc * inclina, 0, Math.PI, 0, true); g.closePath();
  const lgr = g.createLinearGradient(x - rc, 0, x + rc, 0);
  lgr.addColorStop(0, `rgb(${mezRgb(cl, "0,0,0", 0.55)})`); lgr.addColorStop(0.3, `rgb(${mezRgb(cl, "255,255,255", 0.15)})`); lgr.addColorStop(0.55, `rgb(${mezRgb(cl, "0,0,0", 0.25)})`); lgr.addColorStop(1, `rgb(${mezRgb(cl, "0,0,0", 0.7)})`);
  g.fillStyle = lgr; g.fill();
  g.beginPath(); g.ellipse(x, top, rc, rc * inclina, 0, 0, Math.PI * 2);
  const tg = g.createRadialGradient(x - rc * 0.3, top - rc * inclina * 0.4, rc * 0.05, x, top, rc * 1.05);
  tg.addColorStop(0, `rgb(${mezRgb(cl, "255,255,255", 0.35)})`); tg.addColorStop(0.55, `rgb(${cl})`); tg.addColorStop(1, `rgb(${mezRgb(cl, "0,0,0", 0.4)})`);
  g.fillStyle = tg; g.fill();
  // el filo de la cara, la textura de plástico y el brillo
  g.strokeStyle = `rgba(255,255,255,${0.35 + 0.2 * luz})`; g.lineWidth = Math.max(1, r * 0.03); g.beginPath(); g.ellipse(x, top, rc * 0.97, rc * inclina * 0.97, 0, Math.PI * 1.05, Math.PI * 1.75); g.stroke();
  if (texto) {
    g.save(); g.translate(x, top); g.scale(1, inclina);
    g.font = `800 ${Math.round(rc * 0.48)}px Figtree`; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillStyle = `rgba(${mezRgb(color, "0,0,0", 0.6)},0.55)`; g.fillText(texto, 0, rc * 0.04);
    g.fillStyle = `rgba(255,255,255,${0.75 + 0.25 * luz})`; g.fillText(texto, 0, 0);
    g.restore();
  }
  g.save(); g.translate(x - rc * 0.38, top - rc * inclina * 0.42); g.rotate(-0.35); g.scale(1, inclina * 0.7);
  const bgr = g.createRadialGradient(0, 0, 0, 0, 0, rc * 0.34); bgr.addColorStop(0, "rgba(255,255,255,0.8)"); bgr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = bgr; g.beginPath(); g.arc(0, 0, rc * 0.34, 0, Math.PI * 2); g.fill(); g.restore();
  g.restore();
  if (luz > 0.01) { brillo(g, x, top, r * 4.5, color, 0.5 * luz); brillo(g, x, top, r * 1.6, mezRgb(color, "255,255,255", 0.5), 0.35 * luz); }
}

// Un interruptor de palanca en su placa, centrado en (x, y), de alto tam: la placa con sus tornillos, la tuerca y la
// palanca de metal con su bola, que va de abajo (enc 0, apagado) a arriba (enc 1, encendido) pasando por en medio.
//   op.textos: [arriba, abajo] (["ON", "OFF"] por defecto; null, sin textos); op.led: false para no llevar piloto;
//   op.color: "r,g,b" del piloto; op.placa: "oscuro", "acero"... (METALES).
export function interruptor(g, x, y, tam, enc = 0, op = {}) {
  const e = Math.max(0, Math.min(1, enc)), M = metalDe(op.placa || "oscuro"), w = tam * 0.6, h = tam, s = tam / 100;
  const textos = op.textos === undefined ? ["ON", "OFF"] : op.textos;
  g.save(); g.translate(x, y);
  // la placa: metal cepillado con sombra y bisel
  sombraBlanda(g, -w / 2, -h / 2, w, h, 7 * s, 9 * s, 0.6, 5 * s);
  redondo(g, -w / 2, -h / 2, w, h, 7 * s);
  const pg = g.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); pg.addColorStop(0, M[1]); pg.addColorStop(0.5, M[2]); pg.addColorStop(1, M[3]);
  g.fillStyle = pg; g.fill();
  g.strokeStyle = "rgba(255,255,255,0.22)"; g.lineWidth = 1.5 * s; redondo(g, -w / 2 + s, -h / 2 + s, w - 2 * s, h - 2 * s, 6 * s); g.stroke();
  // los tornillos
  for (const ty of [-h / 2 + 8 * s, h / 2 - 8 * s]) {
    const tg = g.createRadialGradient(-1.5 * s, ty - 1.5 * s, 0, 0, ty, 4.5 * s); tg.addColorStop(0, "#e6e9ed"); tg.addColorStop(1, "#4a4f56");
    g.fillStyle = tg; g.beginPath(); g.arc(0, ty, 4.5 * s, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "rgba(0,0,0,0.6)"; g.lineWidth = 1.3 * s; g.beginPath(); g.moveTo(-3.2 * s, ty + 1.2 * s); g.lineTo(3.2 * s, ty - 1.2 * s); g.stroke();
  }
  // los textos y el piloto
  if (textos) {
    g.font = `800 ${Math.round(8.5 * s)}px Figtree`; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillStyle = `rgba(235,238,242,${0.35 + 0.55 * e})`; g.fillText(textos[0], 0, -h / 2 + 19 * s);
    g.fillStyle = `rgba(235,238,242,${0.9 - 0.55 * e})`; g.fillText(textos[1], 0, h / 2 - 19 * s);
  }
  // la tuerca: un anillo hexagonal de metal y el casquillo
  const hx6 = (rr) => { g.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + Math.PI / 6; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); };
  hx6(15 * s); const ng = g.createLinearGradient(-12 * s, -12 * s, 12 * s, 12 * s); ng.addColorStop(0, "#f5f7f9"); ng.addColorStop(0.5, "#8d949d"); ng.addColorStop(1, "#3a3f45");
  g.fillStyle = ng; g.fill(); g.strokeStyle = "rgba(0,0,0,0.35)"; g.lineWidth = s; g.stroke();
  const cg = g.createLinearGradient(0, -10 * s, 0, 10 * s); cg.addColorStop(0, "#c9ced4"); cg.addColorStop(1, "#5c626a");
  g.fillStyle = cg; g.beginPath(); g.arc(0, 0, 10 * s, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#0b0c0e"; g.beginPath(); g.arc(0, 0, 6.5 * s, 0, Math.PI * 2); g.fill();
  // la palanca: un cilindro que se estrecha, inclinado hacia arriba o hacia abajo, y su bola en la punta
  const ang = mez(0.62, -0.62, e), L = 30 * s, tipY = Math.sin(ang) * L, rb = 4.2 * s, rt = 3 * s * (1 + 0.12 * Math.cos(ang));
  const sombra = () => { g.strokeStyle = "rgba(0,0,0,0.35)"; g.lineWidth = rt * 2.2; g.lineCap = "round"; g.beginPath(); g.moveTo(3 * s, 4 * s); g.lineTo(3 * s + 8 * s, tipY * 1.05 + 9 * s); g.stroke(); };
  sombra();
  g.beginPath(); g.moveTo(-rb, 0); g.lineTo(-rt, tipY); g.lineTo(rt, tipY); g.lineTo(rb, 0); g.closePath();
  const lgr = g.createLinearGradient(-rb, 0, rb, 0); lgr.addColorStop(0, "#565c64"); lgr.addColorStop(0.3, "#ffffff"); lgr.addColorStop(0.55, "#a6adb6"); lgr.addColorStop(1, "#30343a");
  g.fillStyle = lgr; g.fill();
  const rbola = 6.2 * s * (1 + 0.1 * Math.cos(ang)), bgr = g.createRadialGradient(-rbola * 0.35, tipY - rbola * 0.4, rbola * 0.1, 0, tipY, rbola);
  bgr.addColorStop(0, "#ffffff"); bgr.addColorStop(0.35, "#c3c9d0"); bgr.addColorStop(0.8, "#5a6068"); bgr.addColorStop(1, "#2b2f34");
  g.fillStyle = bgr; g.beginPath(); g.arc(0, tipY, rbola, 0, Math.PI * 2); g.fill();
  g.restore();
  if (op.led !== false) piloto(g, x + w * 0.3, y - h / 2 + 19 * s, 3 * s, e, op.color || "90,255,120", { halo: 6 });
}

// ---------------------------------------------------------------- el cuentakilómetros
const cifrasHechas = new Map();
// Las diez cifras de un rodillo (una vez por tamaño y color): blancas sobre transparente, de alto px.
function cifras(alto, color) {
  const k = alto + color;
  if (cifrasHechas.has(k)) return cifrasHechas.get(k);
  const w = Math.ceil(alto * 0.7), l = lienzo(w * 10, alto), c = l.getContext("2d");
  c.font = `800 ${Math.round(alto * 0.92)}px Figtree`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = `rgb(${color})`;
  for (let d = 0; d < 10; d++) c.fillText(String(d), w * d + w / 2, alto * 0.53);
  const r = { l, w, h: alto };
  cifrasHechas.set(k, r);
  return r;
}

// Un cuentakilómetros de rodillos (como el de un coche viejo) centrado en (x, y): enseña valor con sus rodillos de
// verdad: el último gira sin parar y cada uno pasa al siguiente número cuando el de su derecha va del 9 al 0 (así,
// de 999999 a 000000 dan la vuelta todos a la vez).
//   op.cifras: cuántos rodillos (6); op.decimales: cuántos de ellos son decimales (1; van en otro color);
//   op.alto: el alto de la ventana (px); op.unidad: lo que pone al lado ("km"); op.colores: { fondo, cifra,
//   fondoDec, cifraDec } ("r,g,b").
export function cuentakilometros(g, x, y, valor, op = {}) {
  const n = op.cifras ?? 6, dec = op.decimales ?? 1, alto = op.alto ?? 150, C = { fondo: "22,22,24", cifra: "238,236,228", fondoDec: "236,232,222", cifraDec: "160,24,20", ...(op.colores || {}) };
  const dw = alto * 0.6, sep = alto * 0.05, W = n * dw + (n - 1) * sep, R = alto * 1.12, marco = alto * 0.16;
  const total = W + 2 * marco + (op.unidad ? alto * 0.9 : 0), H = alto + 2 * marco, x0 = x - total / 2 + marco, y0 = y - alto / 2;
  g.save();
  // la caja: negra, con un aro de metal alrededor de la ventana
  sombraBlanda(g, x - total / 2, y - H / 2, total, H, alto * 0.14, alto * 0.18, 0.7, alto * 0.08);
  redondo(g, x - total / 2, y - H / 2, total, H, alto * 0.14);
  const cg = g.createLinearGradient(0, y - H / 2, 0, y + H / 2); cg.addColorStop(0, "#2a2c30"); cg.addColorStop(1, "#0b0c0d");
  g.fillStyle = cg; g.fill();
  redondo(g, x0 - marco * 0.55, y0 - marco * 0.55, W + marco * 1.1, alto + marco * 1.1, alto * 0.1);
  const ag = g.createLinearGradient(0, y0 - marco, 0, y0 + alto + marco); ag.addColorStop(0, "#f1f3f6"); ag.addColorStop(0.45, "#8a919a"); ag.addColorStop(0.55, "#4b5159"); ag.addColorStop(1, "#c6ccd3");
  g.fillStyle = ag; g.fill();
  redondo(g, x0 - marco * 0.2, y0 - marco * 0.2, W + marco * 0.4, alto + marco * 0.4, alto * 0.06); g.fillStyle = "#050506"; g.fill();
  // los rodillos: dónde va cada uno (el de la derecha, continuo; los demás, con su arrastre)
  const v = Math.max(0, valor) * Math.pow(10, dec);
  g.save(); g.beginPath(); g.rect(x0, y0, W, alto); g.clip();
  for (let i = 0; i < n; i++) {
    const p10 = Math.pow(10, i), base = Math.floor(v / p10), resto = v - base * p10, pos = i === 0 ? v % 10 : (base % 10) + Math.max(0, resto - (p10 - 1));
    const esDec = i < dec, dx = x0 + (n - 1 - i) * (dw + sep), fondo = esDec ? C.fondoDec : C.fondo, D = cifras(Math.round(alto * 0.6), esDec ? C.cifraDec : C.cifra);
    g.fillStyle = `rgb(${fondo})`; g.fillRect(dx, y0, dw, alto);
    // cada cifra en el cilindro: más baja y más chata cuanto más se aleja del centro
    const d0 = Math.floor(pos);
    for (let d = d0 - 1; d <= d0 + 2; d++) {
      const fi = ((d - pos) * Math.PI * 2) / 10;
      if (Math.abs(R * Math.sin(fi)) > alto * 0.95 || Math.abs(fi) > 1.4) continue;
      const cy = y + R * Math.sin(fi), hh = D.h * Math.cos(fi), dd = ((d % 10) + 10) % 10;
      g.drawImage(D.l, D.w * dd, 0, D.w, D.h, dx + (dw - D.w) / 2, cy - hh / 2, D.w, hh);
    }
    // la curva del rodillo: oscuro arriba y abajo, y un brillo encima del centro
    const sg = g.createLinearGradient(0, y0, 0, y0 + alto);
    sg.addColorStop(0, "rgba(0,0,0,0.92)"); sg.addColorStop(0.2, "rgba(0,0,0,0.45)"); sg.addColorStop(0.38, "rgba(255,255,255,0.08)"); sg.addColorStop(0.5, "rgba(0,0,0,0)");
    sg.addColorStop(0.75, "rgba(0,0,0,0.35)"); sg.addColorStop(1, "rgba(0,0,0,0.95)");
    g.fillStyle = sg; g.fillRect(dx, y0, dw, alto);
    // los cantos del rodillo
    const eg = g.createLinearGradient(dx, 0, dx + dw, 0);
    eg.addColorStop(0, "rgba(0,0,0,0.5)"); eg.addColorStop(0.12, "rgba(0,0,0,0)"); eg.addColorStop(0.88, "rgba(0,0,0,0)"); eg.addColorStop(1, "rgba(0,0,0,0.5)");
    g.fillStyle = eg; g.fillRect(dx, y0, dw, alto);
  }
  // el cristal de la ventana: un reflejo
  const rg = g.createLinearGradient(0, y0, 0, y0 + alto);
  rg.addColorStop(0, "rgba(255,255,255,0.16)"); rg.addColorStop(0.3, "rgba(255,255,255,0.05)"); rg.addColorStop(0.31, "rgba(255,255,255,0)"); rg.addColorStop(1, "rgba(255,255,255,0.03)");
  g.fillStyle = rg; g.fillRect(x0, y0, W, alto);
  g.restore();
  // la sombra que hace el aro sobre los rodillos
  g.strokeStyle = "rgba(0,0,0,0.6)"; g.lineWidth = alto * 0.05; g.strokeRect(x0 + alto * 0.02, y0 + alto * 0.02, W - alto * 0.04, alto - alto * 0.04);
  if (op.unidad) {
    g.font = `700 ${Math.round(alto * 0.3)}px Figtree`; g.textAlign = "left"; g.textBaseline = "middle"; g.fillStyle = "rgba(230,232,236,0.8)";
    g.fillText(op.unidad, x0 + W + marco * 1.3, y + alto * 0.04);
  }
  g.restore();
}
