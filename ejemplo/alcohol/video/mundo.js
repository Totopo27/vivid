// Lo que comparten los planos: tu cerebro, de lado, con tus recuerdos dentro como fotos instantáneas; las escenas de
// esas fotos (las copas, la bola de discoteca, la puerta de casa, la tarta...); la grabadora (el piloto rojo).
// Todo en 2D, en coordenadas del mundo (px con zoom 1); vista() pone la cámara.
import * as k from "#kit";

const { azar, lienzo, redondo } = k;

// ---------------------------------------------------------------- la cámara 2D
// Mira al punto (cx, cy) del mundo con zoom Z: lo que está en (cx, cy) sale en el centro de la pantalla.
export function vista(g, Z, cx, cy) { g.setTransform(Z, 0, 0, Z, 540 - cx * Z, 960 - cy * Z); }
export const sinVista = (g) => g.setTransform(1, 0, 0, 1, 0, 0);
// Una cámara que pasa por claves [t, [Z, cx, cy]] sin tirones (el zoom, en log, para que se aleje con ritmo parejo).
export function camino2D(claves) {
  const Zs = k.claves(claves.map(([t, c]) => [t, Math.log(c[0])])), X = k.claves(claves.map(([t, c]) => [t, c[1]])), Y = k.claves(claves.map(([t, c]) => [t, c[2]]));
  return (t) => [Math.exp(Zs(t)), X(t), Y(t)];
}

// ---------------------------------------------------------------- el fondo
// Oscuro, con la luz rosada del cerebro y un poco de textura: lo que hay alrededor de la cabeza.
export function fondo(g, t, tinte = "120,60,110") {
  g.save(); sinVista(g);
  g.fillStyle = "#07050c"; g.fillRect(0, 0, 1080, 1920);
  const bg = g.createRadialGradient(540, 980, 100, 540, 980, 1200);
  bg.addColorStop(0, `rgba(${tinte},0.35)`); bg.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = bg; g.fillRect(0, 0, 1080, 1920);
  g.globalCompositeOperation = "screen"; g.globalAlpha = 0.08; g.drawImage(k.manchas, -200, -200, 1500, 2400);
  g.restore();
}
export function vineta(g, al = 0.6) {
  g.save(); sinVista(g);
  const vg = g.createRadialGradient(540, 960, 520, 540, 960, 1250);
  vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, `rgba(0,0,0,${al})`);
  g.fillStyle = vg; g.fillRect(0, 0, 1080, 1920); g.restore();
}
// Un velo oscuro arriba, detrás del subtítulo.
export function velo(g, al) {
  if (al <= 0.01) return;
  g.save(); sinVista(g);
  const vg = g.createLinearGradient(0, 160, 0, 700);
  vg.addColorStop(0, `rgba(6,4,10,${al})`); vg.addColorStop(0.6, `rgba(6,4,10,${al * 0.7})`); vg.addColorStop(1, "rgba(6,4,10,0)");
  g.fillStyle = vg; g.fillRect(0, 0, 1080, 700); g.restore();
}

// ---------------------------------------------------------------- las escenas de las fotos
// Cada una dibuja en un cuadrado de lado S (0,0)-(S,S), con su luz y su textura. t: el segundo del vídeo.
const S = 600;
const bokeh = (g, sem, t, colores, n = 14, al = 0.5) => {
  const az = azar(sem);
  g.save(); g.globalCompositeOperation = "lighter";
  for (let i = 0; i < n; i++) {
    const x = az() * S, y = az() * S * 0.75, r = 25 + az() * 55, c = colores[i % colores.length], f = az() * 6;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    const a = al * (0.6 + 0.4 * Math.sin(t * 2.5 + f));
    gr.addColorStop(0, `rgba(${c},${a})`); gr.addColorStop(0.7, `rgba(${c},${a * 0.6})`); gr.addColorStop(1, `rgba(${c},0)`);
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill();
  }
  g.restore();
};
const fondoEscena = (g, arriba, abajo) => { const bg = g.createLinearGradient(0, 0, 0, S); bg.addColorStop(0, arriba); bg.addColorStop(1, abajo); g.fillStyle = bg; g.fillRect(0, 0, S, S); };

// Una copa de balón con su bebida, de pie en (x, y) (la base), inclinada ang, de alto h. bebida: "r,g,b".
export function copa(g, x, y, h, ang, bebida, t, ola = 0, lleno = 1) {
  g.save(); g.translate(x, y); g.rotate(ang);
  const w = h * 0.36, bowlY = -h * 0.62, bowlR = w;
  // la bebida (dentro del balón, con su superficie inclinada que se mueve)
  g.save(); g.globalAlpha *= lleno;
  g.beginPath(); g.ellipse(0, bowlY, bowlR, bowlR * 0.95, 0, 0, Math.PI); g.lineTo(-bowlR, bowlY); g.closePath(); g.clip();
  const nivel = bowlY + bowlR * 0.1 + Math.sin(t * 6) * 3 * (1 + ola * 4);
  g.save(); g.translate(0, nivel); g.rotate(-ang * 0.9 + Math.sin(t * 5) * 0.03 * (1 + ola * 3));
  const bg = g.createLinearGradient(-bowlR, 0, bowlR, 0);
  bg.addColorStop(0, `rgba(${bebida},0.95)`); bg.addColorStop(0.5, `rgba(${k.mezRgb(bebida, "255,255,255", 0.25)},0.9)`); bg.addColorStop(1, `rgba(${k.mezRgb(bebida, "0,0,0", 0.4)},0.95)`);
  g.fillStyle = bg; g.fillRect(-bowlR * 2, 0, bowlR * 4, bowlR * 2);
  g.fillStyle = "rgba(255,255,255,0.45)"; g.fillRect(-bowlR * 2, -2, bowlR * 4, 5);
  g.restore(); g.restore();
  // el cristal: el balón, el tallo y el pie
  g.beginPath();
  g.moveTo(-bowlR * 0.82, bowlY - bowlR * 0.75);
  g.bezierCurveTo(-bowlR * 1.15, bowlY - bowlR * 0.1, -bowlR * 1.05, bowlY + bowlR * 0.75, -w * 0.08, bowlY + bowlR * 0.98);
  g.lineTo(-w * 0.06, -h * 0.04); g.quadraticCurveTo(-w * 0.75, -h * 0.02, -w * 0.75, 0); g.lineTo(w * 0.75, 0); g.quadraticCurveTo(w * 0.75, -h * 0.02, w * 0.06, -h * 0.04);
  g.lineTo(w * 0.08, bowlY + bowlR * 0.98);
  g.bezierCurveTo(bowlR * 1.05, bowlY + bowlR * 0.75, bowlR * 1.15, bowlY - bowlR * 0.1, bowlR * 0.82, bowlY - bowlR * 0.75);
  g.lineWidth = 3; k.vidrio(g, -bowlR, bowlR, 0.55);
  k.reflejo(g, -bowlR * 0.72, bowlY - bowlR * 0.35, w * 0.12, bowlR * 0.9, 0.45);
  k.reflejo(g, bowlR * 0.55, bowlY - bowlR * 0.2, w * 0.05, bowlR * 0.5, 0.25);
  g.restore();
}
// «bebiste»: dos copas que brindan, con luces de fiesta detrás; en tChoque chocan y salpican.
export function escenaCopas(g, t, tChoque = 0.5) {
  fondoEscena(g, "#1a0c22", "#2a1208");
  bokeh(g, 3, t, ["255,80,180", "80,200,255", "255,190,80"], 16, 0.45);
  // la barra
  const bar = g.createLinearGradient(0, S * 0.8, 0, S);
  bar.addColorStop(0, "#3a2214"); bar.addColorStop(1, "#140904");
  g.fillStyle = bar; g.fillRect(0, S * 0.8, S, S * 0.2);
  g.fillStyle = "rgba(255,200,140,0.25)"; g.fillRect(0, S * 0.8, S, 3);
  const acerca = k.entra(k.tramo(t, tChoque - 0.55, tChoque)), rebota = Math.exp(-Math.max(0, t - tChoque) * 6) * (t > tChoque ? 1 : 0);
  const sep = k.mez(225, 165, acerca) + 10 * rebota;
  const ang = k.mez(0.04, 0.28, acerca);
  copa(g, S / 2 - sep, S * 0.95, 310, ang, "200,20,60", t, rebota);
  copa(g, S / 2 + sep, S * 0.95, 310, -ang, "255,170,40", t, rebota);
  // el choque: un destello y gotas que salpican
  const w = t - tChoque;
  if (w > 0 && w < 1.2) {
    const cx = S / 2, cy = S * 0.95 - 310 * 0.62 - 95;
    k.brillo(g, cx, cy, 380 * (0.6 + w), "255,240,210", Math.exp(-w * 4));
    const az = azar(9);
    for (let i = 0; i < 26; i++) {
      const a = -Math.PI / 2 + (az() - 0.5) * 2.4, v = 220 + az() * 360, r = 3 + az() * 6, c = az() < 0.5 ? "230,40,80" : "255,190,70";
      const x = cx + Math.cos(a) * v * w, y = cy + Math.sin(a) * v * w + 700 * w * w;
      if (y > S) continue;
      g.fillStyle = `rgba(${c},${Math.max(0, 1 - w * 0.9)})`; g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill();
      g.fillStyle = `rgba(255,255,255,${0.7 * Math.max(0, 1 - w)})`; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.3, r * 0.35, 0, 6.2832); g.fill();
    }
  }
}

// «bailaste»: una bola de discoteca girando, colgada, con sus rayos y las manchas de luz que barren la pista.
const teselas = (() => { const az = azar(41), l = []; for (let i = 0; i < 400; i++) l.push(az()); return l; })();
export function escenaBola(g, t) {
  fondoEscena(g, "#0b0718", "#1a0a26");
  // rayos de colores que salen de la bola
  const cx = S / 2, cy = S * 0.36, R = 150;
  g.save(); g.globalCompositeOperation = "lighter";
  const cols = ["255,70,190", "70,200,255", "255,210,90", "160,110,255"];
  for (let i = 0; i < 10; i++) {
    const a = t * 0.9 + i * 0.63, c = cols[i % 4], L = 520;
    const x2 = cx + Math.cos(a) * L, y2 = cy + Math.abs(Math.sin(a)) * L * 0.9 + 60;
    const gr = g.createLinearGradient(cx, cy, x2, y2);
    gr.addColorStop(0, `rgba(${c},0.35)`); gr.addColorStop(1, `rgba(${c},0)`);
    g.fillStyle = gr; g.beginPath(); g.moveTo(cx, cy); g.lineTo(x2 - 26, y2); g.lineTo(x2 + 26, y2); g.closePath(); g.fill();
    k.brillo(g, x2, Math.min(S - 20, y2), 90, c, 0.7);
  }
  g.restore();
  // la cadena
  g.strokeStyle = "rgba(200,200,215,0.8)"; g.lineWidth = 4; g.beginPath(); g.moveTo(cx, 0); g.lineTo(cx, cy - R); g.stroke();
  // la bola: teselas de espejo que giran (cada una con su brillo según hacia dónde mira)
  g.save(); g.beginPath(); g.arc(cx, cy, R, 0, 6.2832); g.clip();
  g.fillStyle = "#2a2a36"; g.fillRect(cx - R, cy - R, R * 2, R * 2);
  const filas = 14, giro = t * 0.8;
  for (let f = 0; f < filas; f++) {
    const la0 = -Math.PI / 2 + (f / filas) * Math.PI, la1 = la0 + Math.PI / filas, nCol = Math.max(4, Math.round(28 * Math.cos((la0 + la1) / 2)));
    for (let c = 0; c < nCol; c++) {
      const lo0 = (c / nCol) * 6.2832 + giro, lo1 = lo0 + 6.2832 / nCol, loM = (lo0 + lo1) / 2;
      if (Math.cos(loM) < 0) continue;
      const p = (la, lo) => [cx + R * Math.cos(la) * Math.sin(lo), cy + R * Math.sin(la)];
      const a = p(la0, lo0), b = p(la0, lo1), d = p(la1, lo1), e = p(la1, lo0);
      const nz = Math.cos(loM) * Math.cos((la0 + la1) / 2), sem = teselas[(f * 31 + c) % 400];
      const luz = Math.pow(Math.max(0, Math.sin(loM * 3 + t * 2 + sem * 6)), 8);
      const base = Math.round(60 + 120 * nz + 70 * sem), col = luz > 0.3 ? cols[(f + c) % 4] : null;
      g.fillStyle = col ? `rgb(${k.mezRgb(`${base},${base},${base + 15}`, col, luz)})` : `rgb(${base},${base},${base + 15})`;
      g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(d[0], d[1]); g.lineTo(e[0], e[1]); g.closePath(); g.fill();
      g.strokeStyle = "rgba(10,10,16,0.7)"; g.lineWidth = 1.5; g.stroke();
      if (luz > 0.6) k.brillo(g, (a[0] + d[0]) / 2, (a[1] + d[1]) / 2, 40, "255,255,255", luz * 0.8);
    }
  }
  const sh = g.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
  sh.addColorStop(0, "rgba(255,255,255,0.25)"); sh.addColorStop(0.6, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(0,0,0,0.55)");
  g.fillStyle = sh; g.fillRect(cx - R, cy - R, R * 2, R * 2);
  g.restore();
  k.brillo(g, cx - R * 0.4, cy - R * 0.45, 120, "255,255,255", 0.6 + 0.3 * Math.sin(t * 4));
  // la pista: siluetas que bailan, a contraluz
  g.save();
  const az = azar(55);
  for (let i = 0; i < 6; i++) {
    const x = 40 + i * 104 + az() * 30, h = 170 + az() * 50, bot = Math.sin(t * 6 + i * 1.3) * 10, y = S + 20;
    g.fillStyle = "#07040c";
    g.beginPath(); g.arc(x, y - h - 30 + bot, 24, 0, 6.2832); g.fill();
    redondo(g, x - 34, y - h + bot, 68, h, 30); g.fill();
    const br = Math.sin(t * 6 + i) * 0.9;
    g.lineWidth = 16; g.lineCap = "round"; g.strokeStyle = "#07040c";
    g.beginPath(); g.moveTo(x - 26, y - h + 20 + bot); g.lineTo(x - 60, y - h - 50 + bot + br * 30); g.stroke();
    g.beginPath(); g.moveTo(x + 26, y - h + 20 + bot); g.lineTo(x + 62, y - h - 40 + bot - br * 30); g.stroke();
  }
  g.restore();
}

// «volviste a casa»: la puerta de casa de noche, con la luz del portal; unas llaves entran en la cerradura y giran.
const vetas = k.ruido(256, 91, 2, 4, "lineas"), arrugas = k.ruido(256, 93, 3, 3, "lineas");
export function escenaPuerta(g, t, tLlave = 0) {
  // la pared, de ladrillo, iluminada por la lámpara
  g.fillStyle = "#3b2a26"; g.fillRect(0, 0, S, S);
  g.save(); g.globalCompositeOperation = "multiply"; g.globalAlpha = 0.6;
  for (let y = 0; y < S; y += 36) for (let x = (y / 36) % 2 ? -40 : 0; x < S; x += 80) { g.fillStyle = "#1a100d"; g.fillRect(x, y, 80, 3); g.fillRect(x, y, 3, 36); }
  g.drawImage(k.red, 0, 0, S, S);
  g.restore();
  const lamp = g.createRadialGradient(S * 0.8, S * 0.12, 10, S * 0.8, S * 0.2, S * 0.9);
  lamp.addColorStop(0, "rgba(255,200,120,0.6)"); lamp.addColorStop(0.5, "rgba(255,160,80,0.18)"); lamp.addColorStop(1, "rgba(0,0,0,0.6)");
  g.fillStyle = lamp; g.fillRect(0, 0, S, S);
  // la puerta, de madera, con su marco
  const px = 120, py = 70, pw = 300, ph = 560;
  g.fillStyle = "#1c120c"; g.fillRect(px - 18, py - 18, pw + 36, ph + 40);
  const pg = g.createLinearGradient(px, 0, px + pw, 0);
  pg.addColorStop(0, "#5a3520"); pg.addColorStop(0.6, "#7a4a2a"); pg.addColorStop(1, "#4a2a18");
  g.fillStyle = pg; g.fillRect(px, py, pw, ph);
  g.save(); g.globalCompositeOperation = "multiply"; g.globalAlpha = 0.5; g.drawImage(vetas, px, py, pw, ph * 3); g.restore();
  // los cuarterones
  for (const [qx, qy, qw, qh] of [[px + 30, py + 30, pw - 60, 200], [px + 30, py + 270, pw - 60, 250]]) {
    g.strokeStyle = "rgba(20,10,5,0.7)"; g.lineWidth = 8; g.strokeRect(qx, qy, qw, qh);
    g.strokeStyle = "rgba(255,200,140,0.25)"; g.lineWidth = 3; g.strokeRect(qx + 5, qy + 5, qw - 10, qh - 10);
  }
  // la luz de la lámpara sobre la puerta
  const lp = g.createLinearGradient(px + pw, 0, px, 0);
  lp.addColorStop(0, "rgba(255,190,110,0.28)"); lp.addColorStop(1, "rgba(255,190,110,0)");
  g.fillStyle = lp; g.fillRect(px, py, pw, ph);
  // la lámpara
  k.brillo(g, S * 0.86, S * 0.13, 260, "255,200,120", 0.95);
  // la cerradura (metal) y la llave que entra y gira
  const cx = px + pw - 52, cy = py + 300;
  g.beginPath(); g.ellipse(cx, cy, 20, 34, 0, 0, 6.2832); k.metal(g, cx - 20, cx + 20, ["#5e5240", "#e9d9a8", "#a8915e", "#f6ebc4", "#5a4a30"]);
  g.fillStyle = "#120c06"; g.fillRect(cx - 3, cy - 14, 6, 26);
  const entra = k.entra(k.tramo(t, tLlave - 0.5, tLlave)), gira = k.suave(k.tramo(t, tLlave + 0.1, tLlave + 0.45));
  const kx = cx + 10 + (1 - entra) * 160, ky = cy + (1 - entra) * 40, ancho = Math.cos(gira * 1.4) * 0.85 + 0.15;
  const laton = ["#6a5328", "#f4dc8e", "#b8913c", "#fff0b8", "#6a5020"];
  g.save(); g.translate(kx, ky); g.scale(ancho, 1);
  // la llave: cabeza redonda y paleta, de latón
  g.beginPath(); g.arc(70, 0, 34, 0, 6.2832); g.moveTo(82, 0); g.arc(70, 0, 12, 0, 6.2832, true);
  k.metal(g, 36, 104, laton);
  g.beginPath(); g.rect(0, -7, 40, 14); k.metal(g, 0, 40, laton);
  g.restore();
  // el llavero colgando, que se balancea
  const bal = Math.sin(t * 5) * 0.25 * (1 - gira * 0.5);
  g.save(); g.translate(kx + 70 * ancho, ky + 30); g.rotate(bal);
  g.strokeStyle = "#c9b27a"; g.lineWidth = 4; g.beginPath(); g.arc(0, 18, 18, 0, 6.2832); g.stroke();
  g.beginPath(); g.rect(-8, 34, 50, 22); k.metal(g, -8, 42, ["#4a5560", "#dfe6ee", "#8995a2", "#f3f6f9", "#48525c"]);
  g.restore();
  // el suelo del portal
  const su = g.createLinearGradient(0, S * 0.94, 0, S); su.addColorStop(0, "#2a2420"); su.addColorStop(1, "#100c0a");
  g.fillStyle = su; g.fillRect(0, S * 0.94, S, S * 0.06);
}

// Un recuerdo viejo: una tarta de cumpleaños con sus velas encendidas.
export function escenaTarta(g, t) {
  fondoEscena(g, "#2a1a14", "#120a08");
  bokeh(g, 21, t, ["255,200,120", "255,160,90"], 10, 0.3);
  const cx = S / 2, top = S * 0.52;
  g.fillStyle = "#3a2618"; g.fillRect(0, S * 0.82, S, S * 0.18);
  const piso = (y, w, h) => {
    g.beginPath(); g.ellipse(cx, y + h, w, w * 0.22, 0, 0, Math.PI); g.lineTo(cx - w, y); g.ellipse(cx, y, w, w * 0.22, 0, Math.PI, 0, true); g.closePath();
    const pg = g.createLinearGradient(cx - w, 0, cx + w, 0); pg.addColorStop(0, "#f3d9c0"); pg.addColorStop(0.4, "#fff3e6"); pg.addColorStop(1, "#c9a68a");
    g.fillStyle = pg; g.fill();
    g.beginPath(); g.ellipse(cx, y, w, w * 0.22, 0, 0, 6.2832); g.fillStyle = "#fff8ef"; g.fill();
    for (let i = 0; i < 9; i++) { const a = Math.PI * (0.1 + (i / 8) * 0.8), x = cx + Math.cos(a) * w * 0.98, yy = y + h * 0.15 + Math.sin(a) * w * 0.2; g.fillStyle = "#d8344a"; g.beginPath(); g.arc(x, yy + 8, 9, 0, 6.2832); g.fill(); }
  };
  piso(top + 40, 220, 120); piso(top - 70, 150, 100);
  for (let i = 0; i < 5; i++) {
    const x = cx - 80 + i * 40, y = top - 70 - 10;
    g.fillStyle = i % 2 ? "#6ec6ff" : "#ff7ab8"; g.fillRect(x - 6, y - 70, 12, 70);
    k.lengua(g, x, y - 70, 46, 18, t, i * 1.7, "255,150,40", "255,220,120");
    k.brillo(g, x, y - 92, 120, "255,190,90", 0.7);
  }
}
// Un recuerdo viejo: la playa con el sol.
export function escenaPlaya(g, t) {
  const bg = g.createLinearGradient(0, 0, 0, S); bg.addColorStop(0, "#5fb6ff"); bg.addColorStop(0.55, "#bfe6ff"); bg.addColorStop(0.56, "#1f7fbf"); bg.addColorStop(0.75, "#3aa0d0"); bg.addColorStop(0.76, "#f1d7a0"); bg.addColorStop(1, "#d8b67a");
  g.fillStyle = bg; g.fillRect(0, 0, S, S);
  k.brillo(g, S * 0.72, S * 0.2, 300, "255,240,200", 1);
  g.save(); g.globalAlpha = 0.5; for (let i = 0; i < 6; i++) { g.fillStyle = "rgba(255,255,255,0.6)"; g.fillRect(0, S * 0.58 + i * 18 + Math.sin(t * 2 + i) * 4, S, 3); } g.restore();
  g.save(); g.globalCompositeOperation = "multiply"; g.globalAlpha = 0.25; g.drawImage(k.manchas, 0, S * 0.76, S, S * 0.3); g.restore();
  g.fillStyle = "#e0453a"; g.beginPath(); g.moveTo(S * 0.18, S * 0.66); g.quadraticCurveTo(S * 0.34, S * 0.5, S * 0.5, S * 0.66); g.closePath(); g.fill();
  g.strokeStyle = "#f4f0e6"; g.lineWidth = 6; g.beginPath(); g.moveTo(S * 0.34, S * 0.6); g.lineTo(S * 0.36, S * 0.92); g.stroke();
}
// Un recuerdo viejo: montañas al atardecer.
export function escenaMonte(g, t) {
  const bg = g.createLinearGradient(0, 0, 0, S); bg.addColorStop(0, "#2b2a6a"); bg.addColorStop(0.5, "#f08a5a"); bg.addColorStop(1, "#ffd28a");
  g.fillStyle = bg; g.fillRect(0, 0, S, S);
  k.brillo(g, S * 0.5, S * 0.55, 360, "255,220,150", 0.9);
  const monte = (pts, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(0, S); pts.forEach(([x, y]) => g.lineTo(x * S, y * S)); g.lineTo(S, S); g.closePath(); g.fill(); };
  monte([[0, 0.62], [0.2, 0.42], [0.35, 0.55], [0.55, 0.36], [0.75, 0.58], [1, 0.48]], "#4a2c4e");
  monte([[0, 0.78], [0.25, 0.62], [0.5, 0.75], [0.8, 0.6], [1, 0.72]], "#26162c");
}
// «despertarse por la mañana»: la ventana con el sol entrando y la cama deshecha.
export function escenaManana(g, t) {
  fondoEscena(g, "#e9dcc8", "#b9a588");
  const wx = 170, wy = 60, ww = 260, wh = 230;
  const cielo = g.createLinearGradient(0, wy, 0, wy + wh); cielo.addColorStop(0, "#9fd6ff"); cielo.addColorStop(1, "#fff1c8");
  g.fillStyle = cielo; g.fillRect(wx, wy, ww, wh);
  k.brillo(g, wx + ww * 0.7, wy + wh * 0.3, 420, "255,240,190", 0.6);
  g.strokeStyle = "#f8f4ec"; g.lineWidth = 14; g.strokeRect(wx, wy, ww, wh); g.beginPath(); g.moveTo(wx + ww / 2, wy); g.lineTo(wx + ww / 2, wy + wh); g.stroke();
  g.save(); g.globalCompositeOperation = "lighter";
  const r = g.createLinearGradient(wx, wy, wx + 200, S); r.addColorStop(0, "rgba(255,230,160,0.3)"); r.addColorStop(1, "rgba(255,230,160,0)");
  g.fillStyle = r; g.beginPath(); g.moveTo(wx, wy); g.lineTo(wx + ww, wy); g.lineTo(wx + ww + 160, S); g.lineTo(wx + 80, S); g.closePath(); g.fill(); g.restore();
  g.fillStyle = "#7a5a40"; g.fillRect(40, S * 0.62, S - 80, 40);
  g.beginPath(); g.moveTo(30, S * 0.66); g.bezierCurveTo(150, S * 0.56, 260, S * 0.72, 380, S * 0.6); g.bezierCurveTo(470, S * 0.55, 540, S * 0.64, S - 20, S * 0.62); g.lineTo(S - 10, S); g.lineTo(20, S); g.closePath();
  const sab = g.createLinearGradient(0, S * 0.55, 0, S); sab.addColorStop(0, "#fafcff"); sab.addColorStop(1, "#b9c6dc");
  g.fillStyle = sab; g.fill();
  g.save(); g.clip(); g.globalCompositeOperation = "multiply"; g.globalAlpha = 0.3; g.drawImage(arrugas, 0, S * 0.5, S, S * 0.6); g.restore();
  g.fillStyle = "#ffffff"; redondo(g, 60, S * 0.55, 150, 70, 30); g.fill();
}

// ---------------------------------------------------------------- la foto
// Una foto instantánea centrada en (x, y), de ancho w, girada ang, con su escena (una función (g, t) que dibuja en
// S × S). blanco: de 0 a 1, la foto se queda vacía. viejo: de 0 a 1, descolorida (olvidada). al: transparencia.
// brillo: lo que brilla alrededor (los recuerdos guardados brillan un poco).
const lienzos = new Map();
export function foto(g, id, x, y, w, ang, escena, t, { blanco = 0, viejo = 0, al = 1, brillo = 0, colorBrillo = "255,226,180" } = {}) {
  if (al <= 0.003) return;
  const h = w * 1.2, m = w * 0.06, ima = w - 2 * m;
  g.save();
  g.translate(x, y); g.rotate(ang); g.globalAlpha *= al;
  if (brillo > 0.01) { g.save(); g.globalCompositeOperation = "lighter"; const bg = g.createRadialGradient(0, 0, w * 0.3, 0, 0, w * 1.1); bg.addColorStop(0, `rgba(${colorBrillo},${0.35 * brillo})`); bg.addColorStop(1, `rgba(${colorBrillo},0)`); g.fillStyle = bg; g.fillRect(-w * 1.2, -h, w * 2.4, h * 2); g.restore(); }
  g.save(); g.shadowColor = "rgba(0,0,0,0.6)"; g.shadowBlur = w * 0.12; g.shadowOffsetY = w * 0.05;
  g.fillStyle = "#f4f1ea"; g.fillRect(-w / 2, -h / 2, w, h); g.restore();
  const pg = g.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); pg.addColorStop(0, "#fffdf8"); pg.addColorStop(1, "#ddd7cb");
  g.fillStyle = pg; g.fillRect(-w / 2, -h / 2, w, h);
  g.save(); g.globalCompositeOperation = "multiply"; g.globalAlpha *= 0.07; g.drawImage(k.manchas, -w / 2, -h / 2, w, h); g.restore();
  const ix = -w / 2 + m, iy = -h / 2 + m;
  if (blanco < 0.999) {
    let L = lienzos.get(id);
    if (!L) { L = lienzo(S); lienzos.set(id, L); }
    const c = L.getContext("2d"); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = "source-over"; c.clearRect(0, 0, S, S);
    escena(c, t);
    if (viejo > 0) { c.globalCompositeOperation = "color"; c.globalAlpha = 0.8 * viejo; c.fillStyle = "#b08a5a"; c.fillRect(0, 0, S, S); c.globalCompositeOperation = "source-over"; c.globalAlpha = 0.62 * viejo; c.fillStyle = "#e6dccb"; c.fillRect(0, 0, S, S); }
    g.drawImage(L, ix, iy, ima, ima);
  }
  if (blanco > 0.001) {
    g.save(); g.globalAlpha *= Math.min(1, blanco);
    const vg = g.createLinearGradient(ix, iy, ix + ima, iy + ima); vg.addColorStop(0, "#d4d7dd"); vg.addColorStop(0.55, "#eceef1"); vg.addColorStop(1, "#c3c7ce");
    g.fillStyle = vg; g.fillRect(ix, iy, ima, ima);
    g.globalCompositeOperation = "multiply"; g.globalAlpha *= 0.04; g.drawImage(k.manchas, ix, iy, ima, ima);
    g.restore();
  }
  g.save(); g.globalCompositeOperation = "screen";
  const sh = g.createLinearGradient(ix, iy, ix + ima, iy + ima * 0.6); sh.addColorStop(0, "rgba(255,255,255,0)"); sh.addColorStop(0.45, "rgba(255,255,255,0.10)"); sh.addColorStop(0.5, "rgba(255,255,255,0.0)");
  g.fillStyle = sh; g.fillRect(ix, iy, ima, ima); g.restore();
  g.strokeStyle = "rgba(0,0,0,0.25)"; g.lineWidth = Math.max(1, w * 0.004); g.strokeRect(ix, iy, ima, ima);
  g.restore();
}

// ---------------------------------------------------------------- el cerebro
// De lado, mirando a la izquierda, centrado en CEREBRO, de unos 900 px de ancho. Se dibuja en coordenadas del mundo.
export const CEREBRO = { x: 540, y: 1000 };
export function caminoCerebro(g) {
  g.beginPath();
  g.moveTo(-420, 60);
  g.bezierCurveTo(-475, -90, -400, -265, -250, -335);
  g.bezierCurveTo(-110, -395, 130, -400, 270, -330);
  g.bezierCurveTo(395, -265, 455, -150, 442, -20);
  g.bezierCurveTo(436, 60, 400, 112, 330, 132);
  g.bezierCurveTo(255, 150, 185, 125, 125, 112);
  g.bezierCurveTo(60, 180, -40, 205, -140, 172);
  g.bezierCurveTo(-230, 150, -262, 112, -300, 122);
  g.bezierCurveTo(-362, 136, -402, 110, -420, 60);
  g.closePath();
}
const surcos = k.ruido(512, 131, 6, 3, "lineas"), surcos2 = k.ruido(512, 137, 11, 2, "lineas");
const corteza = (() => {
  const l = lienzo(1000, 900), c = l.getContext("2d");
  c.translate(500, 450);
  caminoCerebro(c); c.save(); c.clip();
  const bg = c.createRadialGradient(-120, -200, 40, 0, 0, 560);
  bg.addColorStop(0, "#f6c6c4"); bg.addColorStop(0.5, "#e2989c"); bg.addColorStop(1, "#a65866");
  c.fillStyle = bg; c.fillRect(-500, -450, 1000, 900);
  c.globalCompositeOperation = "multiply";
  c.drawImage(surcos, -520, -470, 1040, 940); c.globalAlpha = 0.7; c.drawImage(surcos2, -520, -470, 1040, 940); c.globalAlpha = 1;
  c.globalCompositeOperation = "screen"; c.globalAlpha = 0.35;
  c.drawImage(surcos, -516, -474, 1040, 940);
  c.globalAlpha = 1; c.globalCompositeOperation = "multiply";
  c.globalAlpha = 0.35; c.drawImage(k.tenir(k.manchas, "#c07a80"), -500, -450, 1000, 900); c.globalAlpha = 1;
  c.globalCompositeOperation = "source-over";
  c.lineCap = "round"; c.strokeStyle = "rgba(90,30,40,0.75)"; c.lineWidth = 10;
  c.beginPath(); c.moveTo(-250, 70); c.bezierCurveTo(-120, 10, 40, -20, 180, -70); c.stroke();
  c.beginPath(); c.moveTo(-10, -385); c.bezierCurveTo(-40, -260, 20, -150, -20, -10); c.stroke();
  const sh = c.createRadialGradient(-180, -220, 100, 0, 0, 560);
  sh.addColorStop(0, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(40,0,15,0.55)");
  c.fillStyle = sh; c.fillRect(-500, -450, 1000, 900);
  c.restore();
  c.lineWidth = 6; c.strokeStyle = "rgba(255,210,210,0.5)"; caminoCerebro(c); c.stroke();
  return l;
})();
const cerebelo = (() => {
  const l = lienzo(360, 240), c = l.getContext("2d");
  c.translate(180, 120);
  c.beginPath(); c.ellipse(0, 0, 160, 90, 0.12, 0, 6.2832); c.save(); c.clip();
  const bg = c.createRadialGradient(-40, -40, 10, 0, 0, 180); bg.addColorStop(0, "#efb0b0"); bg.addColorStop(1, "#9a4e5a");
  c.fillStyle = bg; c.fillRect(-180, -120, 360, 240);
  c.strokeStyle = "rgba(90,30,40,0.55)"; c.lineWidth = 3;
  for (let i = -10; i <= 10; i++) { c.beginPath(); c.moveTo(-170, i * 9 - 10); c.bezierCurveTo(-60, i * 9 + 14, 60, i * 9 - 18, 170, i * 9 + 8); c.stroke(); }
  c.restore(); return l;
})();
// al: transparencia; dentro: de 0 a 1, cuánto se oscurece por dentro (para que se vea lo de dentro); ambar: el alcohol.
export function cerebro(g, t, { al = 1, dentro = 0, ambar = 0 } = {}) {
  if (al <= 0.003) return;
  g.save();
  g.translate(CEREBRO.x, CEREBRO.y);
  g.globalAlpha *= al;
  g.save();
  g.beginPath(); g.moveTo(90, 100); g.bezierCurveTo(110, 220, 95, 330, 70, 420); g.lineTo(140, 420); g.bezierCurveTo(165, 320, 175, 220, 185, 120); g.closePath();
  const tg = g.createLinearGradient(80, 0, 185, 0); tg.addColorStop(0, "#c98088"); tg.addColorStop(0.5, "#e8a9ad"); tg.addColorStop(1, "#9a5260");
  g.fillStyle = tg; g.fill(); g.restore();
  g.drawImage(cerebelo, 280 - 180, 205 - 120);
  g.save(); g.globalCompositeOperation = "lighter";
  const hg = g.createRadialGradient(0, -80, 200, 0, -80, 700); hg.addColorStop(0, "rgba(255,120,150,0.12)"); hg.addColorStop(1, "rgba(255,120,150,0)");
  g.fillStyle = hg; g.fillRect(-700, -800, 1400, 1400); g.restore();
  g.drawImage(corteza, -500, -450);
  if (dentro > 0.01) {
    g.save(); caminoCerebro(g); g.clip();
    const dg = g.createRadialGradient(0, -60, 50, 0, -60, 520);
    dg.addColorStop(0, `rgba(30,8,24,${0.85 * dentro})`); dg.addColorStop(0.75, `rgba(40,10,30,${0.75 * dentro})`); dg.addColorStop(1, `rgba(60,16,40,${0.35 * dentro})`);
    g.fillStyle = dg; g.fillRect(-500, -450, 1000, 900);
    g.restore();
  }
  if (ambar > 0.01) {
    g.save(); caminoCerebro(g); g.clip();
    g.globalCompositeOperation = "lighter";
    const ag = g.createRadialGradient(80, -340, 30, 80, -200, 650);
    ag.addColorStop(0, `rgba(255,150,40,${0.55 * ambar})`); ag.addColorStop(1, `rgba(255,120,30,${0.15 * ambar})`);
    g.fillStyle = ag; g.fillRect(-500, -450, 1000, 900);
    g.restore();
  }
  g.restore();
}

// ---------------------------------------------------------------- el piloto de grabación
// Un punto rojo con su brillo y «REC» al lado, en (x, y), de radio r. luz: 0 apagado (gris oscuro) a 1 encendido.
export function piloto(g, x, y, r, luz, { texto = true, al = 1 } = {}) {
  if (al <= 0.003) return;
  g.save(); g.globalAlpha *= al;
  const on = `rgb(${k.mezRgb("70,52,58", "255,40,50", luz)})`;
  g.beginPath(); g.arc(x, y, r, 0, 6.2832);
  const pg = g.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
  pg.addColorStop(0, `rgb(${k.mezRgb("120,105,110", "255,170,170", luz)})`); pg.addColorStop(0.5, on); pg.addColorStop(1, `rgb(${k.mezRgb("30,22,26", "140,0,10", luz)})`);
  g.fillStyle = pg; g.fill();
  g.strokeStyle = "rgba(255,255,255,0.25)"; g.lineWidth = r * 0.08; g.stroke();
  if (luz > 0.01) k.brillo(g, x, y, r * 7, "255,40,50", 0.8 * luz);
  if (texto) {
    g.font = `800 ${r * 1.5}px Figtree`; g.textBaseline = "middle";
    g.fillStyle = `rgb(${k.mezRgb("150,140,145", "255,235,235", luz)})`;
    g.fillText("REC", x + r * 1.7, y + r * 0.08);
  }
  g.restore();
}
