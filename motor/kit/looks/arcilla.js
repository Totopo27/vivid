// Look «arcilla»: todo hecho de plastilina, en un estudio pequeño. Colores pastel vivos, luz grande y difusa, bordes
// redondos, sombras de contacto suaves y la textura de los dedos en el material. El fondo es un ciclorama (la pared
// que se curva hasta el suelo), con la luz del foco y unas bolas de arcilla desenfocadas lejos; el acabado suaviza la
// luz como un filtro de difusión de cámara.
import { azar, lienzo } from "../base.js";
import { manchas, ruido, tenir } from "../texturas.js";
import { estilo } from "#estilo";
import { camaraLejana, mezcla, ponCapa, ponTelon, resplandor, rgba, una, vineta } from "./pasos.js";

const C = {
  fondo: "152,162,234",
  tinta: "64,44,58",
  acentos: ["255,118,100", "86,198,158", "104,158,250", "255,204,84", "176,130,240"], // coral, menta, azul cielo, mantequilla, lila
  luz: "255,248,238",
  sombra: "116,62,82",
};
const YT = 1560; // dónde la pared se vuelve suelo, dentro del telón (en pantalla, en y 1320 con la cámara recta)

// Las huellas de los dedos: arcos finos concéntricos, apenas marcados (para "multiply").
const huellas = una(() => {
  const l = lienzo(512), cx = l.getContext("2d"), az = azar(503);
  cx.fillStyle = "#fff"; cx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 26; i++) {
    const x = az() * 512, y = az() * 512, a = az() * 6.2832, n = 4 + Math.floor(az() * 5);
    for (let k = 0; k < n; k++) { cx.strokeStyle = `rgba(120,90,90,${0.1 + az() * 0.12})`; cx.lineWidth = 1.2; cx.beginPath(); cx.arc(x, y, 8 + k * 6, a, a + 1.2 + az() * 1.4); cx.stroke(); }
  }
  return l;
});

// La pared, el suelo, la luz del foco y lo desenfocado del fondo, una vez.
const telon = una(() => {
  const l = lienzo(1400, 2400), cx = l.getContext("2d"), yb = YT / 2400;
  const cg = cx.createLinearGradient(0, 0, 0, 2400);
  cg.addColorStop(0, "#434cb4"); cg.addColorStop(0.25, "#606bd4"); cg.addColorStop(yb - 0.12, "#8590ea"); cg.addColorStop(yb - 0.025, "#a4abf0");
  cg.addColorStop(yb + 0.015, "#f2c0a0"); cg.addColorStop(yb + 0.2, "#eaa985"); cg.addColorStop(1, "#d48866");
  cx.fillStyle = cg; cx.fillRect(0, 0, 1400, 2400);
  // la luz del foco, grande y difusa, sobre la pared y el suelo
  const lz = cx.createRadialGradient(600, YT - 200, 0, 600, YT - 200, 1000);
  lz.addColorStop(0, "rgba(255,236,220,0.42)"); lz.addColorStop(0.5, "rgba(255,226,210,0.14)"); lz.addColorStop(1, "rgba(255,226,210,0)");
  cx.fillStyle = lz; cx.fillRect(0, 0, 1400, 2400);
  // bolas de arcilla lejos, desenfocadas, apoyadas cerca de donde la pared se hace suelo
  const az = azar(509);
  cx.filter = "blur(14px)";
  for (let i = 0; i < 7; i++) {
    const x = (i % 2 ? 1400 - 160 * az() : 220 * az()) + (i > 4 ? 500 : 0), y = YT - 40 - az() * 520 * (i % 3 === 0 ? 1 : 0.3), r = 46 + az() * 70, c = C.acentos[(i + 1) % 5];
    const bg = cx.createRadialGradient(x - r * 0.3, y - r * 0.35, 0, x, y, r);
    bg.addColorStop(0, rgba(mezcla(c, C.luz, 0.35), 0.9)); bg.addColorStop(0.7, rgba(c, 0.85)); bg.addColorStop(1, rgba(mezcla(c, C.sombra, 0.3), 0.8));
    cx.fillStyle = bg; cx.beginPath(); cx.arc(x, y, r, 0, 6.2832); cx.fill();
  }
  cx.filter = "none";
  // la textura de la pared: arcilla alisada con la mano
  cx.globalCompositeOperation = "multiply"; cx.globalAlpha = 0.14;
  cx.drawImage(tenir(ruido(256, 521, 4, 4, "manchas"), "#d8c8d8"), -50, -50, 1500, 2500);
  cx.globalAlpha = 0.18;
  for (let y = 0; y < 2400; y += 512) for (let x = 0; x < 1400; x += 512) cx.drawImage(huellas(), x, y);
  return l;
});

function fondo(g, t, cam) {
  const [mx, my] = camaraLejana(cam, 0.6);
  ponTelon(g, telon(), mx, my);
  // la luz respira muy despacio, como un foco de verdad
  const al = 0.08 + 0.04 * Math.sin(t * 0.8);
  g.save();
  g.globalCompositeOperation = "screen";
  const lz = g.createRadialGradient(480 + mx, 1000 + my, 0, 480 + mx, 1000 + my, 700);
  lz.addColorStop(0, `rgba(255,240,226,${al})`); lz.addColorStop(1, "rgba(255,240,226,0)");
  g.fillStyle = lz; g.fillRect(0, 0, 1080, 1920);
  g.restore();
}

// Un material de arcilla sobre el camino actual (de x0, y0 a x1, y1): el color tono con luz grande y difusa desde
// (lx, ly), el borde que se redondea hacia la sombra, un brillo ancho y suave, y las huellas de los dedos.
function material(g, x0, y0, x1, y1, tono = C.acentos[0], lx = -0.6, ly = -0.8) {
  const w = x1 - x0, h = y1 - y0, s = Math.max(w, h), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, l = Math.hypot(lx, ly) || 1, A = g.globalAlpha;
  lx /= l; ly /= l;
  g.save();
  g.clip();
  const ox = cx + lx * s * 0.3, oy = cy + ly * s * 0.3, cg = g.createRadialGradient(ox, oy, s * 0.02, cx, cy, s * 0.75);
  cg.addColorStop(0, rgba(mezcla(tono, C.luz, 0.42))); cg.addColorStop(0.42, rgba(tono)); cg.addColorStop(0.8, rgba(mezcla(tono, C.sombra, 0.3)));
  cg.addColorStop(1, rgba(mezcla(tono, C.sombra, 0.5)));
  g.fillStyle = cg; g.fillRect(x0 - 2, y0 - 2, w + 4, h + 4);
  // el borde redondo: se oscurece suave hacia el contorno
  g.lineJoin = "round";
  for (const [k, a] of [[0.2, 0.1], [0.11, 0.12], [0.05, 0.16]]) { g.globalAlpha = A * a; g.strokeStyle = rgba(mezcla(tono, C.sombra, 0.6)); g.lineWidth = s * k; g.stroke(); }
  // las huellas y el moteado de la arcilla
  g.globalCompositeOperation = "multiply";
  g.globalAlpha = A * 0.5; g.drawImage(huellas(), x0, y0, Math.max(s, 300), Math.max(s, 300));
  g.globalAlpha = A * 0.07; g.drawImage(manchas, x0, y0, s, s);
  // el brillo ancho y suave
  g.globalCompositeOperation = "screen"; g.globalAlpha = A;
  const bx = cx + lx * s * 0.27, by = cy + ly * s * 0.27, br = g.createRadialGradient(bx, by, 0, bx, by, s * 0.24);
  br.addColorStop(0, "rgba(255,252,246,0.5)"); br.addColorStop(0.5, "rgba(255,252,246,0.14)"); br.addColorStop(1, "rgba(255,252,246,0)");
  g.fillStyle = br; g.fillRect(x0, y0, w, h);
  g.restore();
}

// Un churro de arcilla sobre el camino actual: un cilindro redondo de color tono, con su sombra y su brillo.
function trazo(g, ancho = 14, tono = C.acentos[0], al = 1) {
  g.save();
  g.globalAlpha *= al; g.lineCap = "round"; g.lineJoin = "round";
  for (const [k, c, a] of [[1, mezcla(tono, C.sombra, 0.45), 1], [0.8, tono, 1], [0.42, mezcla(tono, C.luz, 0.4), 0.8], [0.14, C.luz, 0.45]]) {
    g.strokeStyle = rgba(c, a); g.lineWidth = ancho * k; g.stroke();
  }
  g.restore();
}

// La sombra de contacto de algo apoyado en el suelo: suave y ancha, más oscura justo debajo.
function sombra(g, x, y, ancho, al = 1) {
  g.save();
  g.translate(x, y); g.scale(1, 0.2);
  for (const [r, a] of [[ancho * 0.75, 0.32], [ancho * 0.42, 0.5]]) {
    const sg = g.createRadialGradient(0, 0, 0, 0, 0, r);
    sg.addColorStop(0, rgba(C.sombra, a * al)); sg.addColorStop(1, rgba(C.sombra, 0));
    g.fillStyle = sg; g.fillRect(-r, -r, 2 * r, 2 * r);
  }
  g.restore();
}

export default {
  nombre: "arcilla",
  claro: true, // fondos claros: los subtítulos con palabras en gris (caja, minimal) se leen mal; mejor karaoke, contorno o fondo
  descripcion: "Todo de plastilina en un estudio pequeño: pastel vivo, luz grande y difusa, bordes redondos y sombras de contacto suaves. Para la comida, el cuerpo por dentro, los animales, la vida diaria, lo que se explica con cariño.",
  colores: C,
  fondo,
  // El acabado: la luz se abre como con un filtro de difusión (lo claro suelta una bruma suave y cálida), y los bordes
  // se oscurecen un poco hacia la pared, más por donde va el subtítulo. Unos 6 ms.
  acabado(g, t, aux) {
    resplandor(g, { umbral: 2, al: 0.3, modo: "screen", pesos: [0, 0.35, 1], tinte: "255,236,226" });
    ponCapa(g, vineta("arcilla", { centro: "255,252,248", borde: "90,70,140", fuerza: 0.45, subs: estilo.subtitulos?.posicion || "arriba", fuerzaSubs: 0.2 }), "multiply");
  },
  material,
  trazo,
  sombra,
  consejos: [
    "Cada cosa es un objeto de plastilina: formas redondas y gordas, sin aristas ni líneas finas (k.redondo, arcos, curvas); rellénalas con k.materialDelLook.",
    "Las líneas, los cables y las flechas son churros de arcilla (k.trazoDelLook), gruesos: 14 px o más.",
    "Todo lo que toca el suelo lleva su sombra de contacto (k.sombraDelLook); lo que flota, una sombra más ancha y clara debajo.",
    "Colores pastel pero vivos (colores.acentos), cada cosa de uno. La pared es azul lavanda y el suelo, cálido: lo que importa, en coral, mantequilla o menta para que salte (el azul y el lila se pierden en la pared).",
    "La luz es grande y blanda: nada de brillos duros, rayos ni destellos (k.brillo, k.haz, k.fogonazo, solo muy suaves y pequeños).",
    "El movimiento puede ir a saltitos, como la animación fotograma a fotograma: la posición redondeada a 12 por segundo (Math.floor(t * 12) / 12) en lo que se mueve a mano.",
  ],
};
