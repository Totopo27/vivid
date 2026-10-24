// Look «dia»: un día de sol. Cielo azul intenso que se aclara hacia una bruma cálida en el horizonte, montañas lejanas
// azuladas por el aire, nubes que pasan despacio y una pradera. Colores limpios y saturados; la luz del sol es cálida y
// las sombras son azules, como fuera de casa. El acabado le da a lo claro una bruma de sol.
import { azar, lienzo } from "../base.js";
import { manchas } from "../texturas.js";
import { estilo } from "#estilo";
import { camaraLejana, mezcla, ponCapa, ponTelon, resplandor, rgba, una, vineta } from "./pasos.js";

const C = {
  fondo: "92,170,240",
  tinta: "24,44,74",
  acentos: ["255,190,40", "255,98,72", "52,178,92", "0,170,196", "36,96,220"], // sol, coral, verde hoja, turquesa, azul
  luz: "255,246,220",
  sombra: "48,72,140",
};
const YT = 1580; // el horizonte dentro del telón (en pantalla, en y 1340 con la cámara recta)
const SOL = [1120, 360];

// El cielo, el sol, las montañas lejanas y la pradera, una vez.
const telon = una(() => {
  const l = lienzo(1400, 2400), cx = l.getContext("2d");
  const cg = cx.createLinearGradient(0, 0, 0, YT);
  cg.addColorStop(0, "#0d52c0"); cg.addColorStop(0.3, "#2678dc"); cg.addColorStop(0.62, "#64acee"); cg.addColorStop(0.86, "#b8dcf6"); cg.addColorStop(0.96, "#e6f0f2"); cg.addColorStop(1, "#ffe7c2");
  cx.fillStyle = cg; cx.fillRect(0, 0, 1400, YT + 10);
  // el sol: un disco blanco con su resplandor cálido, grande y suave
  cx.globalCompositeOperation = "lighter";
  const sg = cx.createRadialGradient(SOL[0], SOL[1], 0, SOL[0], SOL[1], 1100);
  sg.addColorStop(0, "rgba(255,244,214,0.7)"); sg.addColorStop(0.1, "rgba(255,232,190,0.38)"); sg.addColorStop(0.35, "rgba(255,214,160,0.12)"); sg.addColorStop(1, "rgba(255,214,160,0)");
  cx.fillStyle = sg; cx.fillRect(0, 0, 1400, 2400);
  cx.globalCompositeOperation = "source-over";
  const dg = cx.createRadialGradient(SOL[0], SOL[1], 0, SOL[0], SOL[1], 150);
  dg.addColorStop(0, "#ffffff"); dg.addColorStop(0.38, "#ffffff"); dg.addColorStop(0.44, "rgba(255,246,220,0.75)"); dg.addColorStop(1, "rgba(255,240,200,0)");
  cx.fillStyle = dg; cx.beginPath(); cx.arc(SOL[0], SOL[1], 150, 0, 6.2832); cx.fill();
  cx.globalCompositeOperation = "source-over";
  // las montañas: más lejos, más azules y más perdidas en la bruma
  const az = azar(701);
  const sierra = (y0, alto, col, n, fase) => {
    const mg = cx.createLinearGradient(0, y0 - alto, 0, YT + 6);
    mg.addColorStop(0, col); mg.addColorStop(1, "#dbe9f2");
    cx.fillStyle = mg; cx.beginPath(); cx.moveTo(-10, YT + 6);
    for (let x = -10; x <= 1410; x += 14) cx.lineTo(x, y0 - alto * (0.55 + 0.3 * Math.sin(x / n + fase) + 0.15 * Math.sin(x / (n * 0.31) + fase * 3) + 0.06 * (az() - 0.5)));
    cx.lineTo(1410, YT + 6); cx.closePath(); cx.fill();
  };
  sierra(YT, 230, "#93b6e0", 160, 1.3);
  sierra(YT, 120, "#7ea6d4", 110, 4.1);
  // la pradera, con la bruma del horizonte encima
  const pg = cx.createLinearGradient(0, YT, 0, 2400);
  pg.addColorStop(0, "#c9de8e"); pg.addColorStop(0.08, "#9fcf62"); pg.addColorStop(0.5, "#6cb64a"); pg.addColorStop(1, "#3f9440");
  cx.fillStyle = pg; cx.fillRect(0, YT, 1400, 2400 - YT);
  cx.globalCompositeOperation = "multiply"; cx.globalAlpha = 0.25; cx.drawImage(manchas, 0, YT, 1400, 2400 - YT);
  cx.globalCompositeOperation = "source-over"; cx.globalAlpha = 1;
  const bg = cx.createLinearGradient(0, YT - 120, 0, YT + 160);
  bg.addColorStop(0, "rgba(255,240,215,0)"); bg.addColorStop(0.45, "rgba(255,240,215,0.55)"); bg.addColorStop(1, "rgba(255,240,215,0)");
  cx.fillStyle = bg; cx.fillRect(0, YT - 120, 1400, 280);
  return l;
});

// Las nubes: una sola forma de algodón (muchas bolas juntas), blanca arriba y gris azulada abajo, con el borde suave.
const nubes = una(() => [0, 1, 2, 3].map((i) => {
  const l = lienzo(640, 320), cx = l.getContext("2d"), az = azar(709 + i * 13), bolas = [];
  for (let k = 0; k < 12; k++) {
    const x = 140 + az() * 360, alto = Math.sin(((x - 120) / 400) * Math.PI);
    bolas.push([x, 230 - alto * (40 + az() * 60) - az() * 20, 30 + alto * (26 + az() * 40)]);
  }
  for (let x = 130; x <= 510; x += 38) bolas.push([x, 232 + az() * 6, 24 + az() * 10]); // la base, casi plana
  const forma = () => { cx.beginPath(); for (const [x, y, r] of bolas) { cx.moveTo(x + r, y); cx.arc(x, y, r, 0, 6.2832); } };
  cx.filter = "blur(2px)";
  forma();
  const ng = cx.createLinearGradient(0, 90, 0, 262);
  ng.addColorStop(0, "#ffffff"); ng.addColorStop(0.55, "#f4f7fb"); ng.addColorStop(1, "#b9cbe4");
  cx.fillStyle = ng; cx.fill();
  cx.filter = "none";
  // el volumen: cada bola, más blanca por arriba (dentro de la nube, sin bordes)
  cx.save(); forma(); cx.clip();
  cx.globalCompositeOperation = "screen";
  for (const [x, y, r] of bolas) { const bg = cx.createRadialGradient(x - r * 0.2, y - r * 0.5, 0, x, y - r * 0.3, r * 0.9); bg.addColorStop(0, "rgba(255,255,255,0.5)"); bg.addColorStop(1, "rgba(255,255,255,0)"); cx.fillStyle = bg; cx.fillRect(x - r, y - r * 1.3, r * 2, r * 2); }
  cx.restore();
  return l;
}));
const SITIOS = [[60, 600, 0.95, 9], [620, 40, 0.7, 6], [820, 860, 0.6, 7.5], [-200, 1060, 0.45, 5]]; // nunca detrás del subtítulo

function fondo(g, t, cam) {
  const [mx, my] = camaraLejana(cam);
  ponTelon(g, telon(), mx, my);
  const ns = nubes();
  SITIOS.forEach(([x, y, e, vel], i) => {
    const px = ((((x + t * vel + mx * 0.8) % 1700) + 1700) % 1700) - 420;
    g.drawImage(ns[i], px, y + my * 0.8, 640 * e, 320 * e);
  });
}

// Un material de día sobre el camino actual (de x0, y0 a x1, y1): el color tono con la luz cálida del sol desde
// (lx, ly), la sombra azul del cielo al otro lado, el rebote del suelo por abajo y un brillo suave.
function material(g, x0, y0, x1, y1, tono = C.acentos[0], lx = -0.6, ly = -0.8) {
  const w = x1 - x0, h = y1 - y0, s = Math.max(w, h), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, l = Math.hypot(lx, ly) || 1, A = g.globalAlpha;
  lx /= l; ly /= l;
  g.save();
  g.clip();
  const cg = g.createLinearGradient(cx + lx * s * 0.5, cy + ly * s * 0.5, cx - lx * s * 0.5, cy - ly * s * 0.5);
  cg.addColorStop(0, rgba(mezcla(tono, C.luz, 0.45))); cg.addColorStop(0.4, rgba(tono)); cg.addColorStop(0.75, rgba(mezcla(tono, C.sombra, 0.35)));
  cg.addColorStop(1, rgba(mezcla(tono, C.sombra, 0.55)));
  g.fillStyle = cg; g.fillRect(x0 - 2, y0 - 2, w + 4, h + 4);
  // el rebote cálido del suelo, por abajo
  const rb = g.createLinearGradient(0, y1, 0, y1 - h * 0.3);
  rb.addColorStop(0, rgba("255,226,170", 0.3)); rb.addColorStop(1, rgba("255,226,170", 0));
  g.fillStyle = rb; g.fillRect(x0, y0, w, h);
  g.globalCompositeOperation = "multiply";
  g.globalAlpha = A * 0.07; g.drawImage(manchas, x0, y0, s, s);
  g.globalCompositeOperation = "screen"; g.globalAlpha = A;
  const bx = cx + lx * s * 0.28, by = cy + ly * s * 0.28, br = g.createRadialGradient(bx, by, 0, bx, by, s * 0.22);
  br.addColorStop(0, "rgba(255,255,245,0.55)"); br.addColorStop(1, "rgba(255,255,245,0)");
  g.fillStyle = br; g.fillRect(x0, y0, w, h);
  g.restore();
}

// Una línea limpia sobre el camino actual, con su borde un poco más oscuro: una ruta, una flecha, un contorno.
function trazo(g, ancho = 8, tono = C.acentos[4], al = 1) {
  g.save();
  g.globalAlpha *= al; g.lineCap = "round"; g.lineJoin = "round";
  g.strokeStyle = rgba(mezcla(tono, C.sombra, 0.45)); g.lineWidth = ancho * 1.4; g.stroke();
  g.strokeStyle = rgba(tono); g.lineWidth = ancho; g.stroke();
  g.strokeStyle = rgba(mezcla(tono, C.luz, 0.45), 0.6); g.lineWidth = ancho * 0.3; g.stroke();
  g.restore();
}

// La sombra de algo apoyado en el suelo, con el sol alto: azul, bastante nítida, corrida un poco hacia la derecha.
function sombra(g, x, y, ancho, al = 1) {
  g.save();
  g.translate(x + ancho * 0.08, y); g.scale(1, 0.16);
  const r = ancho * 0.58, sg = g.createRadialGradient(0, 0, 0, 0, 0, r);
  sg.addColorStop(0, rgba(C.sombra, 0.55 * al)); sg.addColorStop(0.7, rgba(C.sombra, 0.4 * al)); sg.addColorStop(1, rgba(C.sombra, 0));
  g.fillStyle = sg; g.fillRect(-r, -r, 2 * r, 2 * r);
  g.restore();
}

export default {
  nombre: "dia",
  claro: true, // fondos claros: los subtítulos con palabras en gris (caja, minimal) se leen mal; mejor karaoke, contorno o fondo
  descripcion: "Un día de sol: cielo azul intenso con bruma cálida en el horizonte, nubes que pasan, colores limpios y saturados, luz cálida y sombras azules. Para la naturaleza, los viajes, el deporte, la comida al aire libre, lo que pasa fuera de casa.",
  colores: C,
  fondo,
  // El acabado: lo claro suelta una bruma de sol, cálida y ancha, y los bordes se tiñen apenas del azul del cielo
  // (un poco más donde va el subtítulo, para que se lea). Unos 6 ms.
  acabado(g, t, aux) {
    resplandor(g, { umbral: 1, al: 0.42, modo: "screen", pesos: [0, 0.4, 1], tinte: "255,226,180" });
    ponCapa(g, vineta("dia", { centro: "255,253,248", borde: "70,110,190", fuerza: 0.3, subs: estilo.subtitulos?.posicion || "arriba", fuerzaSubs: 0.14 }), "multiply");
  },
  material,
  trazo,
  sombra,
  consejos: [
    "La luz es la del sol: cálida por un lado y la sombra azul del cielo al otro. Con el fondo del look, el sol está arriba a la derecha: k.materialDelLook(..., 0.6, -0.8).",
    "Colores limpios y muy saturados (colores.acentos): un objeto rojo, una toalla turquesa, una fruta amarilla. Nada de grises: si algo es gris, lo de alrededor lleva el color.",
    "Las sombras en el suelo son azules y bastante nítidas (k.sombraDelLook).",
    "Lo que está lejos se pierde en la bruma: más claro y más azul cuanto más lejos (mezcla su color con colores.fondo).",
    "Detrás del subtítulo (y 318-482), el cielo azul intenso: no pongas ahí nubes blancas ni algo claro.",
    "Los brillos del kit, suaves: con tanto claro, \"lighter\" lo quema a blanco; mejor \"screen\" y poca transparencia.",
  ],
};
