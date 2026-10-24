// «Es como grabar con el móvil lleno: la pantalla lo enseña todo, pero no guarda nada.»
// Otro sitio: un móvil grabando la fiesta. Se entra con un corte en «Es».
// - «Es como grabar»: el móvil, grande, en la discoteca; en su pantalla la fiesta en directo, el botón rojo grabando y
//   el contador que corre.
// - «con el móvil lleno»: salta el aviso «Almacenamiento lleno» y el contador se queda parado.
// - «la pantalla lo enseña todo»: la fiesta sigue moviéndose en la pantalla.
// - «pero no guarda nada»: la galería, abajo, se abre: vacía, «0 vídeos».
import * as k from "#kit";
import { v } from "#voz";
import { fiesta } from "../fiesta.js";

export const desde = (vz) => vz.frase(7).inicio;

const { suave: su, tramo: tr, mez, azar } = k;
const f7 = v.frase(7);
const T0 = f7.inicio, Tlle = f7.t("lleno"), Tpan = f7.t("pantalla"), Ttodo = f7.t("todo"), Tgua = f7.t("guarda"), Tnada = f7.t("nada"), Fin = f7.fin;
export const aviso = Tlle - 0.05;

const pantalla = k.lienzo(1080, 1920);
const azB = azar(313);
const BOKEH = Array.from({ length: 26 }, () => ({ x: azB() * 1080, y: azB() * 1920, r: 40 + azB() * 110, c: ["255,60,200", "60,210,255", "170,90,255", "255,190,70"][Math.floor(azB() * 4)], f: azB() * 6 }));

export function dibuja(g, t) {
  // la discoteca detrás, desenfocada
  g.fillStyle = "#08040f"; g.fillRect(0, 0, 1080, 1920);
  g.save(); g.globalCompositeOperation = "lighter";
  for (const b of BOKEH) { const a = 0.18 + 0.12 * Math.sin(t * 3 + b.f), gr = g.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r); gr.addColorStop(0, `rgba(${b.c},${a})`); gr.addColorStop(0.8, `rgba(${b.c},${a * 0.7})`); gr.addColorStop(1, `rgba(${b.c},0)`); g.fillStyle = gr; g.beginPath(); g.arc(b.x, b.y, b.r, 0, 6.2832); g.fill(); }
  g.restore();
  // el móvil: se acerca un poco y se inclina
  const esc = 1 + 0.06 * su(tr(t, T0, Fin)), ang = -0.05 + 0.03 * Math.sin(t * 0.8);
  const W = 640, H = 1300, X = 540, Y = 1030, ESC = 0.84;
  g.save(); g.translate(X, Y); g.rotate(ang); g.scale(esc * ESC, esc * ESC);
  // el cuerpo de metal
  g.save(); g.shadowColor = "rgba(0,0,0,0.8)"; g.shadowBlur = 80; g.shadowOffsetY = 40;
  k.redondo(g, -W / 2, -H / 2, W, H, 90); g.fillStyle = "#222"; g.fill(); g.restore();
  k.redondo(g, -W / 2, -H / 2, W, H, 90); k.metal(g, -W / 2, W / 2, ["#3a3d44", "#c9ced6", "#6b707a", "#e6e9ee", "#33363c"]);
  // la pantalla: la fiesta en directo
  const sw = W - 40, sh = H - 40;
  const c = pantalla.getContext("2d"); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = "source-over";
  fiesta(c, t);
  g.save(); k.redondo(g, -sw / 2, -sh / 2, sw, sh, 72); g.clip();
  g.drawImage(pantalla, 0, 150, 1080, 1700, -sw / 2, -sh / 2, sw, sh);
  // la interfaz de la cámara
  g.fillStyle = "rgba(0,0,0,0.35)"; g.fillRect(-sw / 2, -sh / 2, sw, 150); g.fillRect(-sw / 2, sh / 2 - 230, sw, 230);
  // el contador: corre hasta «lleno» y ahí se para
  const corre = Math.min(t, aviso) - T0, seg = Math.floor(corre);
  const parado = t > aviso;
  g.font = "700 46px Figtree"; g.textAlign = "center"; g.textBaseline = "middle";
  k.redondo(g, -110, -sh / 2 + 52, 220, 64, 16); g.fillStyle = parado ? "rgba(90,90,95,0.9)" : "rgba(230,40,50,0.95)"; g.fill();
  g.fillStyle = "#fff"; g.fillText(`00:0${Math.min(9, seg)}`, 0, -sh / 2 + 86);
  // el botón de grabar
  const by = sh / 2 - 115, bl = parado ? 0 : 1;
  g.strokeStyle = "rgba(255,255,255,0.95)"; g.lineWidth = 8; g.beginPath(); g.arc(0, by, 68, 0, 6.2832); g.stroke();
  g.fillStyle = `rgb(${k.mezRgb("110,110,115", "235,40,50", bl)})`; if (bl > 0.5) { k.redondo(g, -30, by - 30, 60, 60, 12); } else { g.beginPath(); g.arc(0, by, 54, 0, 6.2832); } g.fill();
  // la galería, abajo a la izquierda: un cuadradito vacío
  const gal = su(tr(t, Tgua - 0.15, Tgua + 0.3));
  const gx = mez(-sw / 2 + 120, 0, gal), gy = mez(by, 40, gal), gw = mez(90, 470, gal), gh = mez(90, 520, gal);
  k.redondo(g, gx - gw / 2, gy - gh / 2, gw, gh, mez(16, 36, gal)); g.fillStyle = `rgba(28,28,32,${0.85 + 0.15 * gal})`; g.fill();
  g.strokeStyle = "rgba(255,255,255,0.8)"; g.lineWidth = 4; g.stroke();
  if (gal > 0.6) {
    g.globalAlpha = tr(gal, 0.6, 1);
    g.fillStyle = "rgba(255,255,255,0.9)"; g.font = "800 150px Figtree"; g.fillText("0", gx, gy - 40);
    g.font = "700 50px Figtree"; g.fillStyle = "rgba(255,255,255,0.8)"; g.fillText("vídeos", gx, gy + 90);
    g.globalAlpha = 1;
  }
  // el aviso: salta en «lleno»
  const av = k.entra(tr(t, aviso, aviso + 0.25)), avAl = Math.min(1, av * 1.5) * (1 - 0.5 * gal);
  if (avAl > 0.01) {
    const ay = mez(-sh / 2 - 100, -sh / 2 + 290, av);
    g.save(); g.globalAlpha = avAl;
    g.shadowColor = "rgba(0,0,0,0.6)"; g.shadowBlur = 40;
    k.redondo(g, -sw / 2 + 30, ay - 85, sw - 60, 170, 40); g.fillStyle = "rgba(245,245,248,0.97)"; g.fill();
    g.shadowColor = "rgba(0,0,0,0)";
    g.fillStyle = "#e5303c"; g.beginPath(); g.arc(-sw / 2 + 120, ay, 42, 0, 6.2832); g.fill();
    g.fillStyle = "#fff"; g.font = "900 60px Figtree"; g.fillText("!", -sw / 2 + 120, ay + 3);
    g.textAlign = "left"; g.fillStyle = "#111"; g.font = "800 46px Figtree"; g.fillText("Almacenamiento", -sw / 2 + 185, ay - 22);
    g.fillText("lleno", -sw / 2 + 185, ay + 30);
    g.restore();
  }
  // el cristal de la pantalla: un reflejo
  g.globalCompositeOperation = "screen";
  const rg = g.createLinearGradient(-sw / 2, -sh / 2, sw / 2, sh / 2); rg.addColorStop(0.25, "rgba(255,255,255,0)"); rg.addColorStop(0.32, "rgba(255,255,255,0.12)"); rg.addColorStop(0.4, "rgba(255,255,255,0)");
  g.fillStyle = rg; g.fillRect(-sw / 2, -sh / 2, sw, sh);
  g.restore();
  // la isla de la cámara
  k.redondo(g, -90, -sh / 2 + 18, 180, 46, 23); g.fillStyle = "#050505"; g.fill();
  g.restore();
  // un fogonazo rojo suave al saltar el aviso
  k.brillo(g, 540, 700, 1400, "255,60,60", 0.45 * k.pulso(t, aviso + 0.05, 0.12));
  const vg = g.createLinearGradient(0, 180, 0, 600); vg.addColorStop(0, "rgba(8,4,15,0.55)"); vg.addColorStop(1, "rgba(8,4,15,0)");
  g.fillStyle = vg; g.fillRect(0, 0, 1080, 600);
}

export const momentos = { aviso, galeria: Tgua - 0.15 };
