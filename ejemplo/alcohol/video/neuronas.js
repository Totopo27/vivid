// Las neuronas (y el tejido oscuro de dentro), para cuando se entra en el hipocampo. 
import * as k from "#kit";

const { azar, lienzo, proyecta, F } = k;

// ---------------------------------------------------------------- los colores
export const TONOS = {
  oro: "255,204,110", rosa: "255,118,178", cian: "96,214,255", violeta: "176,138,255", verde: "120,236,170",
  magenta: "255,70,200", ambar: "255,160,50", manana: "255,214,130", gris: "120,135,190",
};

// ---------------------------------------------------------------- el tejido del fondo
// Un fondo oscuro con nubes violetas y azules y polvo de neuronas lejanas, desenfocadas. Se mueve un poco con hacia
// dónde mira la cámara, como lo que está muy lejos.
const nubes = (() => {
  const n1 = k.ruido(256, 61, 3, 4, "manchas"), n2 = k.ruido(256, 67, 2.4, 4, "manchas"), n3 = k.ruido(512, 71, 9, 3, "luz");
  const l = lienzo(1500, 2600), cx = l.getContext("2d");
  const bg = cx.createLinearGradient(0, 0, 0, 2600);
  bg.addColorStop(0, "#07051a"); bg.addColorStop(0.5, "#0a0820"); bg.addColorStop(1, "#050a1c");
  cx.fillStyle = bg; cx.fillRect(0, 0, 1500, 2600);
  cx.globalAlpha = 0.55; cx.drawImage(k.tenir(n1, "#34175a"), 0, 0, 1500, 2600);
  cx.globalAlpha = 0.5; cx.drawImage(k.tenir(n2, "#0f2a55"), -300, 200, 2000, 2600);
  cx.globalAlpha = 0.16; cx.drawImage(k.tenir(n3, "#7f6cff"), 0, 0, 1500, 2600);
  // neuronas muy lejanas: puntos blandos
  const az = azar(81);
  for (let i = 0; i < 900; i++) {
    const x = az() * 1500, y = az() * 2600, r = 2 + az() * 7, c = az() < 0.5 ? "150,140,255" : "120,180,255";
    const gr = cx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(${c},${0.15 + az() * 0.3})`); gr.addColorStop(1, `rgba(${c},0)`);
    cx.globalAlpha = 1; cx.fillStyle = gr; cx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  return l;
})();
export function tejido(g, cam, brillo = 1) {
  const mx = Math.max(-200, Math.min(200, cam.e.f[0] * -500)), my = Math.max(-300, Math.min(300, cam.e.f[1] * 700));
  g.save();
  g.fillStyle = "#06051a"; g.fillRect(0, 0, 1080, 1920);
  g.globalAlpha = brillo;
  g.drawImage(nubes, -210 + mx, -340 + my);
  g.restore();
}

// ---------------------------------------------------------------- la neurona
// Dibujada una vez en un lienzo: el cuerpo (con volumen, iluminado desde arriba a la izquierda) y sus ramas, que se
// afinan y se parten. En blanco y grises: se tiñe de cada color. El cuerpo mide 26 px de radio en un lienzo de 400.
const NL = 400, SOMA = 26;
function dibujaNeurona(sem) {
  const l = lienzo(NL), g = l.getContext("2d"), az = azar(sem), c = NL / 2;
  g.lineCap = "round"; g.lineJoin = "round";
  const rama = (x, y, ang, largo, w, prof) => {
    let px = x, py = y, a = ang;
    const pasos = 7;
    for (let i = 0; i < pasos; i++) {
      a += (az() - 0.5) * 0.55;
      const nx = px + (Math.cos(a) * largo) / pasos, ny = py + (Math.sin(a) * largo) / pasos;
      const ww = w * (1 - (i / pasos) * 0.55);
      g.strokeStyle = `rgba(235,240,255,${0.55 + 0.4 * (ww / 9)})`; g.lineWidth = ww;
      g.beginPath(); g.moveTo(px, py); g.lineTo(nx, ny); g.stroke();
      // espinas
      if (prof < 2 && az() < 0.5) {
        const sa = a + (az() < 0.5 ? 1 : -1) * (0.9 + az() * 0.6);
        g.lineWidth = 1.2; g.strokeStyle = "rgba(235,240,255,0.5)";
        g.beginPath(); g.moveTo(nx, ny); g.lineTo(nx + Math.cos(sa) * 6, ny + Math.sin(sa) * 6); g.stroke();
      }
      px = nx; py = ny;
    }
    if (prof > 0 && w > 1.6) {
      const n = az() < 0.35 ? 3 : 2;
      for (let j = 0; j < n; j++) rama(px, py, a + (j - (n - 1) / 2) * (0.55 + az() * 0.35), largo * (0.55 + az() * 0.2), w * 0.6, prof - 1);
    }
  };
  const n = 5 + Math.floor(az() * 3), a0 = az() * 6.28;
  for (let i = 0; i < n; i++) rama(c, c, a0 + (i / n) * 6.28 + (az() - 0.5) * 0.6, 50 + az() * 45, 8 + az() * 4, 2);
  rama(c, c, a0 + 3.14 / n, 120, 6, 1); // el axón, más largo
  // el cuerpo: un poco irregular, con su luz y su sombra
  g.save();
  g.beginPath();
  for (let i = 0; i <= 24; i++) { const a = (i / 24) * 6.2832, r = SOMA * (1 + 0.12 * Math.sin(a * 3 + sem) + 0.06 * Math.sin(a * 5 + sem * 2)); g[i ? "lineTo" : "moveTo"](c + Math.cos(a) * r, c + Math.sin(a) * r * 0.92); }
  g.closePath();
  const sg = g.createRadialGradient(c - 9, c - 10, 2, c, c, SOMA * 1.15);
  sg.addColorStop(0, "#ffffff"); sg.addColorStop(0.45, "#dfe6f7"); sg.addColorStop(0.85, "#8e9bc0"); sg.addColorStop(1, "#5d688a");
  g.fillStyle = sg; g.fill();
  g.clip(); g.globalCompositeOperation = "multiply"; g.globalAlpha = 0.35; g.drawImage(k.manchas, c - 40, c - 40, 80, 80);
  g.restore();
  // el núcleo
  const ng = g.createRadialGradient(c + 2, c + 1, 0, c + 2, c + 1, 9);
  ng.addColorStop(0, "rgba(120,130,170,0.65)"); ng.addColorStop(1, "rgba(120,130,170,0)");
  g.fillStyle = ng; g.beginPath(); g.arc(c + 2, c + 1, 9, 0, 6.2832); g.fill();
  return l;
}
const FORMAS = Array.from({ length: 7 }, (_, i) => dibujaNeurona(300 + i * 17));
const tenidas = new Map();
const tenida = (f, color) => {
  const key = f + "|" + color;
  if (!tenidas.has(key)) {
    // teñida sin perder la transparencia: se multiplica por el color y se recorta con la forma
    const src = FORMAS[f], l = lienzo(NL), c = l.getContext("2d");
    c.drawImage(src, 0, 0); c.globalCompositeOperation = "multiply"; c.fillStyle = `rgb(${color})`; c.fillRect(0, 0, NL, NL);
    c.globalCompositeOperation = "destination-in"; c.drawImage(src, 0, 0);
    tenidas.set(key, l);
  }
  return tenidas.get(key);
};
// El lado del lienzo de la neurona, en unidades del mundo, para un cuerpo de radio RN.
export const RN = 0.085, LADO = (RN * NL) / SOMA;

// Una neurona en el mundo, ya proyectada (P = proyecta(cam, X)). luz: de 0 (gris, apagada) a 1 (encendida, de su color).
// Se gira según su forma (ang) y se apaga con la distancia (como en una niebla).
export function neurona(g, P, forma, ang, color, luz = 0, al = 1, esc = 1) {
  const tam = (F * LADO * esc) / P.z;
  if (tam < 3) return;
  const niebla = al * Math.min(1, Math.exp(-(P.z - 6) / 14));
  if (niebla < 0.01) return;
  const x = P.x, y = P.y;
  if (x < -tam / 2 || x > 1080 + tam / 2 || y < -tam / 2 || y > 1920 + tam / 2) return;
  g.save();
  g.translate(x, y); g.rotate(ang);
  g.globalAlpha = niebla * (0.5 - 0.25 * Math.min(1, luz));
  g.drawImage(tenida(forma, TONOS.gris), -tam / 2, -tam / 2, tam, tam);
  if (luz > 0.01) {
    g.globalCompositeOperation = "lighter";
    g.globalAlpha = niebla * Math.min(1, luz);
    g.drawImage(tenida(forma, color), -tam / 2, -tam / 2, tam, tam);
  }
  g.restore();
  if (luz > 0.01) k.brillo(g, x, y, tam * 0.55, color, niebla * Math.min(1, luz) * 0.9);
}

