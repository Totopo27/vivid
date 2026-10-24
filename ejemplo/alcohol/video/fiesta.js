// La discoteca del hook: el humo y los focos, la bola de espejos, la gente bailando, la barra y el vaso de whisky que
// se llena y rebosa en «mucho». La cámara baja de la bola a la barra en «bebes». La usan las dos aperturas del hook
// (planos/01-fiesta.js y aperturas/01-bola.js) y los planos que vuelven a la fiesta (02-manana.js, 07-movil.js).
import * as k from "#kit";
import { v } from "#voz";

const { suave: su, tramo: tr, mez, azar, F } = k;
export const f1 = v.frase(1);
export const Tbeb = f1.t("bebes"), Tmuc = f1.t("mucho"), Tal = f1.t("al");

// ---------------------------------------------------------------- la cámara (en vertical): de la bola a la barra
const BOLA_Y = -1750;
export const T0 = Tbeb - 0.12, T1 = Tbeb + 0.28;                      // la bajada
const camY = (t) => mez(BOLA_Y, 0, su(tr(t, T0, T1)));
const zoom = (t) => (t < T0 ? 1 + 0.08 * su(tr(t, 0, T0)) : t < T1 ? mez(1.08, 1.0, su(tr(t, T0, T1))) : 1 + 0.07 * su(tr(t, T1, Tal)));
const W2S = (y, cy, Z) => (y - cy) * Z + 960;

// ---------------------------------------------------------------- el humo y las luces
const humo = (() => { const l = k.lienzo(1080, 1600), c = l.getContext("2d"); c.drawImage(k.tenir(k.ruido(256, 211, 3, 4, "manchas"), "#5a3a8a"), 0, 0, 1080, 1600); return l; })();
const vetas = k.ruido(256, 91, 2, 4, "lineas");
export const COLS = ["255,60,200", "60,210,255", "170,90,255", "255,190,70", "255,60,200", "60,210,255"];
const FOCOS = COLS.map((c, i) => ({ x: 90 + i * 180, c, f: i * 1.3 }));
const az0 = azar(17);
const MOTAS = Array.from({ length: 260 }, () => ({ x: az0() * 1080, y: az0() * 3200 - 2400, s: 1 + az0() * 2.5, f: az0() * 6 }));
const MANCHAS = Array.from({ length: 70 }, () => ({ x: az0() * 1400, y: az0() * 2600 - 2300, c: COLS[Math.floor(az0() * 6)], r: 8 + az0() * 14 }));

// la bola de espejos, de radio R en (cx, cy), girando
function bola(g, cx, cy, R, t) {
  g.save(); g.strokeStyle = "rgba(190,190,210,0.7)"; g.lineWidth = 6; g.beginPath(); g.moveTo(cx, cy - R - 900); g.lineTo(cx, cy - R); g.stroke(); g.restore();
  g.save(); g.beginPath(); g.arc(cx, cy, R, 0, 6.2832); g.clip();
  g.fillStyle = "#1e1e28"; g.fillRect(cx - R, cy - R, R * 2, R * 2);
  const filas = 22, giro = t * 0.7;
  for (let f = 0; f < filas; f++) {
    const la0 = -Math.PI / 2 + (f / filas) * Math.PI, la1 = la0 + Math.PI / filas, nCol = Math.max(6, Math.round(44 * Math.cos((la0 + la1) / 2)));
    for (let c = 0; c < nCol; c++) {
      const lo0 = (c / nCol) * 6.2832 + giro, lo1 = lo0 + 6.2832 / nCol, loM = (lo0 + lo1) / 2;
      if (Math.cos(loM) < 0.02) continue;
      const p = (la, lo) => [cx + R * Math.cos(la) * Math.sin(lo), cy + R * Math.sin(la)];
      const a = p(la0, lo0), b = p(la0, lo1), d = p(la1, lo1), e = p(la1, lo0);
      const laM = (la0 + la1) / 2, nz = Math.cos(loM) * Math.cos(laM), sem = Math.abs((Math.sin(f * 12.9898 + c * 78.233) * 43758.5453) % 1);
      const luz = Math.pow(Math.max(0, Math.sin(loM * 4 + laM * 3 + t * 3 + sem * 9)), 10);
      const base = Math.round(70 + 150 * nz * (0.85 + 0.15 * sem));
      g.fillStyle = `rgb(${k.mezRgb(`${base},${base},${base + 10}`, "255,255,255", Math.min(1, luz * 1.1))})`;
      g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(d[0], d[1]); g.lineTo(e[0], e[1]); g.closePath(); g.fill();
      g.strokeStyle = g.fillStyle; g.lineWidth = 1.2; g.stroke();
    }
  }
  const sh = g.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.05, cx, cy, R);
  sh.addColorStop(0, "rgba(255,255,255,0.3)"); sh.addColorStop(0.55, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(0,0,0,0.65)");
  g.fillStyle = sh; g.fillRect(cx - R, cy - R, R * 2, R * 2);
  g.restore();
  // destellos de estrella en las teselas que dan a la luz
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4 + t * 0.7, r = R * (0.25 + 0.6 * ((i * 0.37) % 1)), x = cx + Math.cos(a) * r * 0.8, y = cy + Math.sin(i * 1.7) * r * 0.7;
    const al = Math.pow(Math.max(0, Math.sin(t * 5 + i * 1.9)), 6);
    if (al < 0.05) continue;
    k.brillo(g, x, y, 160, "255,255,255", al);
    g.save(); g.globalCompositeOperation = "lighter"; g.strokeStyle = `rgba(255,255,255,${0.8 * al})`; g.lineWidth = 3;
    g.beginPath(); g.moveTo(x - 70, y); g.lineTo(x + 70, y); g.moveTo(x, y - 70); g.lineTo(x, y + 70); g.stroke(); g.restore();
  }
}

// ---------------------------------------------------------------- el vaso, el whisky y el hielo
const VX = 540, VB = 360, VH = 600, VWt = 300, VWb = 265;      // centro, base (y del mundo), alto, medio ancho arriba y abajo
const nivel = (t) => mez(0.3, 0.86, su(tr(t, Tbeb + 0.15, Tmuc + 0.45)));
const chorro = (t) => tr(t, Tbeb - 0.2, Tbeb - 0.05) * (1 - tr(t, Tmuc + 0.3, Tmuc + 0.45));
export const salpica = Tmuc - 0.02;                               // la corona de gotas
const azG = azar(23);
const GOTAS = Array.from({ length: 70 }, () => ({ a: -Math.PI / 2 + (azG() - 0.5) * 2.2, v: 500 + azG() * 1100, r: 6 + azG() * 16, d: azG() * 0.08, z: azG() }));
const HIELOS = [{ x: -120, s: 150, a: 0.3, f: 0 }, { x: 70, s: 170, a: -0.25, f: 2 }, { x: 170, s: 120, a: 0.6, f: 4 }];
const BURBUJAS = Array.from({ length: 40 }, () => ({ x: (azG() - 0.5) * 460, v: 80 + azG() * 140, f: azG(), r: 3 + azG() * 6 }));
function hielo(g, x, y, s, a) {
  g.save(); g.translate(x, y); g.rotate(a);
  k.redondo(g, -s / 2, -s / 2, s, s, s * 0.18);
  const hg = g.createLinearGradient(-s / 2, -s / 2, s / 2, s / 2);
  hg.addColorStop(0, "rgba(255,255,255,0.75)"); hg.addColorStop(0.4, "rgba(255,240,215,0.28)"); hg.addColorStop(1, "rgba(255,220,170,0.5)");
  g.fillStyle = hg; g.fill();
  g.strokeStyle = "rgba(255,255,255,0.8)"; g.lineWidth = 4; g.stroke();
  g.save(); g.clip(); g.globalCompositeOperation = "screen"; g.globalAlpha = 0.35; g.drawImage(k.causticas, -s, -s, s * 2, s * 2); g.restore();
  k.reflejo(g, -s * 0.35, -s * 0.38, s * 0.12, s * 0.5, 0.7);
  g.restore();
}
function vaso(g, t, cy, Z, op = {}) {
  const y = (wy) => W2S(wy, cy, Z), top = y(VB - VH), bot = y(VB), wt = VWt * Z, wb = VWb * Z, cx = VX;
  const lv = nivel(t), ly = mez(bot - 40 * Z, top, lv), wl = mez(wb, wt, lv);
  const ola = Math.sin(t * 9) * 6 * Z * chorro(t);
  g.save(); g.globalCompositeOperation = "lighter";
  const rg = g.createRadialGradient(cx, bot + 10, 10, cx, bot + 10, wt * 1.5); rg.addColorStop(0, "rgba(255,160,60,0.35)"); rg.addColorStop(1, "rgba(255,160,60,0)");
  g.fillStyle = rg; g.fillRect(cx - wt * 1.6, bot - 80, wt * 3.2, 300); g.restore();
  // el whisky
  g.save();
  g.beginPath(); g.moveTo(cx - wl, ly + ola); g.quadraticCurveTo(cx, ly - ola * 1.5, cx + wl, ly - ola); g.lineTo(cx + wb - 12 * Z, bot - 40 * Z); g.lineTo(cx - wb + 12 * Z, bot - 40 * Z); g.closePath();
  const wg = g.createLinearGradient(cx - wt, 0, cx + wt, 0);
  wg.addColorStop(0, "rgba(150,60,10,0.95)"); wg.addColorStop(0.35, "rgba(240,140,40,0.92)"); wg.addColorStop(0.6, "rgba(255,190,90,0.9)"); wg.addColorStop(1, "rgba(120,45,8,0.95)");
  g.fillStyle = wg; g.fill();
  g.clip();
  g.globalCompositeOperation = "lighter"; g.globalAlpha = 0.25; g.drawImage(k.causticas, cx - wt * 1.2, ly - 50, wt * 2.4, bot - ly + 100);
  g.globalAlpha = 1;
  for (const b of BURBUJAS) { const u = ((t * b.v) / 400 + b.f) % 1, by = mez(bot - 50, ly + 10, u); g.fillStyle = "rgba(255,235,200,0.55)"; g.beginPath(); g.arc(cx + b.x * Z * (wl / wt), by, b.r * Z, 0, 6.2832); g.fill(); }
  g.restore();
  g.save(); g.globalCompositeOperation = "lighter"; g.strokeStyle = "rgba(255,225,170,0.8)"; g.lineWidth = 4 * Z;
  g.beginPath(); g.moveTo(cx - wl, ly + ola); g.quadraticCurveTo(cx, ly - ola * 1.5, cx + wl, ly - ola); g.stroke(); g.restore();
  // el hielo, flotando en la superficie
  for (const h of HIELOS) hielo(g, cx + h.x * Z * (wl / wt), ly - h.s * Z * 0.15 + Math.sin(t * 3 + h.f) * 8 * Z, h.s * Z, h.a + Math.sin(t * 2 + h.f) * 0.08);
  // el cristal: paredes gruesas y un fondo macizo
  g.beginPath(); g.moveTo(cx - wt, top); g.lineTo(cx - wb, bot); g.lineTo(cx + wb, bot); g.lineTo(cx + wt, top);
  g.lineWidth = 6 * Z; k.vidrio(g, cx - wt, cx + wt, 0.7);
  g.beginPath(); g.moveTo(cx - wb, bot - 40 * Z); g.lineTo(cx + wb, bot - 40 * Z); g.lineTo(cx + wb, bot); g.lineTo(cx - wb, bot); g.closePath();
  g.fillStyle = "rgba(255,255,255,0.18)"; g.fill();
  k.reflejo(g, cx - wt * 0.82, top + 40 * Z, 26 * Z, VH * Z * 0.75, 0.4);
  k.reflejo(g, cx + wt * 0.7, top + 80 * Z, 10 * Z, VH * Z * 0.5, 0.25);
  g.save(); g.strokeStyle = "rgba(255,255,255,0.85)"; g.lineWidth = 5 * Z; g.beginPath(); g.ellipse(cx, top, wt, 26 * Z, 0, 0, 6.2832); g.stroke(); g.restore();
  // el chorro, desde arriba
  const ch = chorro(t);
  if (ch > 0.01) {
    g.save(); g.globalCompositeOperation = "lighter"; g.lineCap = "round";
    const sx = cx + 60 * Z, gr = g.createLinearGradient(0, -200, 0, ly);
    gr.addColorStop(0, `rgba(255,170,60,${0.95 * ch})`); gr.addColorStop(1, `rgba(255,190,90,${0.9 * ch})`);
    g.strokeStyle = gr; g.lineWidth = 42 * Z * ch;
    g.beginPath(); g.moveTo(sx + 30, -200); g.bezierCurveTo(sx + 10, ly * 0.4, sx + Math.sin(t * 23) * 5, ly * 0.8, sx, ly); g.stroke();
    g.strokeStyle = `rgba(255,245,220,${0.8 * ch})`; g.lineWidth = 10 * Z * ch;
    g.beginPath(); g.moveTo(sx + 22, -200); g.bezierCurveTo(sx + 2, ly * 0.4, sx - 8, ly * 0.8, sx - 8, ly); g.stroke();
    g.restore();
    k.brillo(g, sx, ly, 340 * Z, "255,180,80", 0.7 * ch);
    const az = azar(Math.floor(t * 30));
    for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + (az() - 0.5) * 2.6, d = az() * 120 * Z; g.fillStyle = `rgba(255,190,90,${0.8 * ch})`; g.beginPath(); g.arc(sx + Math.cos(a) * d, ly + Math.sin(a) * d * 0.8, (3 + az() * 6) * Z, 0, 6.2832); g.fill(); }
  }
  // la corona de gotas, en «mucho» (y en las variantes, cuando cae el hielo): saltan, alguna hacia la cámara, y caen
  for (const ts of op.salpicas ?? [salpica]) {
    const w = t - ts;
    if (!(w > 0 && w < 0.62)) continue;
    for (const d of GOTAS) {
      const u = w - d.d; if (u <= 0) continue;
      const crece = 1 + d.z * 2.5 * u, x = cx + Math.cos(d.a) * d.v * u * Z * 0.8, yy = ly + (Math.sin(d.a) * d.v * u + 2600 * u * u) * Z;
      if (yy > 2000) continue;
      const r = d.r * Z * crece, al = Math.max(0, 1 - u * 1.75);
      const dg = g.createRadialGradient(x - r * 0.3, yy - r * 0.3, r * 0.1, x, yy, r);
      dg.addColorStop(0, `rgba(255,240,200,${al})`); dg.addColorStop(0.5, `rgba(255,160,50,${al})`); dg.addColorStop(1, `rgba(140,60,10,${al})`);
      g.fillStyle = dg; g.beginPath(); g.ellipse(x, yy, r, r * (1 + u), 0, 0, 6.2832); g.fill();
    }
    k.brillo(g, cx, ly, 900 * Z, "255,190,90", 0.8 * Math.exp(-w * 5));
  }
}

// ---------------------------------------------------------------- la escena entera, para una posición de cámara
export function escena(g, t, cy, Z, op = {}) {
  g.fillStyle = "#07040f"; g.fillRect(0, 0, 1080, 1920);
  // el humo, que se mueve
  g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha = 0.5;
  g.drawImage(humo, -80 + Math.sin(t * 0.4) * 60, W2S(-2400, cy, Z * 0.6), 1240, 3600); g.restore();
  // los haces de colores desde los focos de arriba
  g.save(); g.globalCompositeOperation = "lighter";
  for (const f of FOCOS) {
    const fy = W2S(-2300, cy, Z), a = Math.PI / 2 + 0.75 * Math.sin(t * 1.3 + f.f), L = 2600;
    const x2 = f.x + Math.cos(a) * L, y2 = fy + Math.sin(a) * L, px = -Math.sin(a) * 120, py = Math.cos(a) * 120;
    const gr = g.createLinearGradient(f.x, fy, x2, y2);
    gr.addColorStop(0, `rgba(${f.c},0.55)`); gr.addColorStop(0.5, `rgba(${f.c},0.18)`); gr.addColorStop(1, `rgba(${f.c},0)`);
    g.fillStyle = gr; g.beginPath(); g.moveTo(f.x - 8, fy); g.lineTo(x2 - px, y2 - py); g.lineTo(x2 + px, y2 + py); g.lineTo(f.x + 8, fy); g.closePath(); g.fill();
    k.brillo(g, f.x, fy, 180, f.c, 1);
  }
  g.restore();
  for (const m of MOTAS) { const y = W2S(m.y, cy, Z); if (y < -10 || y > 1930) continue; g.fillStyle = `rgba(255,240,255,${0.25 + 0.3 * Math.sin(t * 3 + m.f)})`; g.fillRect(m.x, y, m.s, m.s); }
  for (const m of MANCHAS) { const x = (((m.x - t * 160) % 1400) + 1400) % 1400 - 160, y = W2S(m.y, cy, Z); if (y < -40 || y > 1960) continue; k.brillo(g, x, y, m.r * 6, m.c, 0.8); }
  const by = W2S(BOLA_Y, cy, Z);
  if (by > -500 && by < 2400) bola(g, 540, by, 400 * Z * (op.bolaEsc ?? 1), t);
  // la gente bailando, a contraluz (entre la bola y la barra)
  g.save(); g.fillStyle = "#050208";
  const az = azar(55);
  for (let i = 0; i < 9; i++) {
    const x = 20 + i * 130 + az() * 40, h = 520 + az() * 140, b = Math.sin(t * 7 + i * 1.3) * 18, base = W2S(-260, cy, Z);
    const top = base - h * Z + b;
    g.beginPath(); g.arc(x, top - 50 * Z, 46 * Z, 0, 6.2832); g.fill();
    k.redondo(g, x - 62 * Z, top, 124 * Z, h * Z, 50 * Z); g.fill();
    const br = Math.sin(t * 7 + i);
    g.lineCap = "round"; g.lineWidth = 34 * Z; g.strokeStyle = "#050208";
    g.beginPath(); g.moveTo(x - 46 * Z, top + 40 * Z); g.lineTo(x - 110 * Z, top - 130 * Z + br * 40); g.stroke();
    g.beginPath(); g.moveTo(x + 46 * Z, top + 40 * Z); g.lineTo(x + 110 * Z, top - 120 * Z - br * 40); g.stroke();
  }
  g.restore();
  // la barra, de madera, con los reflejos de las luces
  const bt = W2S(VB, cy, Z);
  const bg = g.createLinearGradient(0, bt, 0, bt + 700);
  bg.addColorStop(0, "#4a2a16"); bg.addColorStop(0.15, "#2a160a"); bg.addColorStop(1, "#0a0503");
  g.fillStyle = bg; g.fillRect(0, bt - 10, 1080, 1000);
  g.save(); g.globalCompositeOperation = "multiply"; g.globalAlpha = 0.6; g.drawImage(vetas, 0, bt, 1080, 900); g.restore();
  g.fillStyle = "rgba(255,200,150,0.35)"; g.fillRect(0, bt - 10, 1080, 4);
  const bz = azar(77);
  g.save(); g.globalCompositeOperation = "lighter";
  for (let i = 0; i < 16; i++) { const x = bz() * 1080, y = W2S(-200 + bz() * 500, cy, Z), r = (40 + bz() * 70) * Z, c = COLS[i % 6]; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${c},0.35)`); gr.addColorStop(0.75, `rgba(${c},0.25)`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill(); }
  g.restore();
  if (W2S(VB - VH, cy, Z) < 2100) vaso(g, t, cy, Z, op);
}

// la imagen de la fiesta, para recordarla luego (el plano de la mañana la rompe)
export function fiesta(g, t) { escena(g, t, BOLA_Y + 450, 0.9); }

// el velo de arriba, para que se lea el subtítulo, y un destello de toda la pantalla
export const velo = (g) => { const vg = g.createLinearGradient(0, 180, 0, 640); vg.addColorStop(0, "rgba(5,3,10,0.55)"); vg.addColorStop(1, "rgba(5,3,10,0)"); g.fillStyle = vg; g.fillRect(0, 0, 1080, 640); };
export const destello = (g, al, c = "255,255,255") => { if (al > 0.003) { g.fillStyle = `rgba(${c},${Math.min(1, al)})`; g.fillRect(0, 0, 1080, 1920); } };

// la bajada de la bola a la barra, con estela de movimiento (varias posiciones de cámara mezcladas)
let estela = null;
export function conBajada(g, t, op = {}) {
  if (t > T0 && t < T1) {
    estela = estela || k.lienzo(1080, 1920);
    const n = 6, c = estela.getContext("2d");
    for (let i = 0; i < n; i++) {
      const tt = t - (i / n) * 0.05;
      c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = "source-over";
      escena(c, t, camY(tt), zoom(tt), op);
      g.globalAlpha = 1 / (i + 1); g.drawImage(estela, 0, 0);
    }
    g.globalAlpha = 1;
  } else escena(g, t, camY(t), zoom(t), op);
}

// Para el sonido
export const momentosFiesta = { baja: T0, chorro: Tbeb - 0.2, salpica };
