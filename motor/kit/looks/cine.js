// Look «cine»: como un fotograma de película. Contraste alto, sombras verde azuladas y luces cálidas de ámbar, rayos
// de luz que entran en un aire con polvo, grano fino y viñeta. El fondo es una oscuridad verde azulada con una luz
// cálida grande fuera de cuadro; los objetos tienen una luz principal cálida, el lado de sombra azulado y un borde de
// luz fría detrás.
import { azar, lienzo } from "../base.js";
import { manchas, red } from "../texturas.js";
import { camaraLejana, grano, lineaDeLuz, listo, mezcla, neblina, ponCapa, ponTelon, rgba, una, vineta } from "./pasos.js";

const C = {
  fondo: "4,16,22",
  tinta: "255,242,226",
  acentos: ["255,166,70", "36,182,196", "232,66,50", "255,212,124", "90,140,255"], // ámbar, verde azulado, rojo, oro, azul
  luz: "255,212,160",
  sombra: "0,14,22",
};
const FOCO = [1180, 470]; // la luz cálida, fuera de cuadro, dentro del telón

// La oscuridad, la luz cálida y la neblina, una vez.
const telon = una(() => {
  const l = lienzo(1400, 2400), cx = l.getContext("2d");
  const cg = cx.createLinearGradient(0, 0, 0, 2400);
  cg.addColorStop(0, "#020b10"); cg.addColorStop(0.45, "#061b22"); cg.addColorStop(0.75, "#030f14"); cg.addColorStop(1, "#010406");
  cx.fillStyle = cg; cx.fillRect(0, 0, 1400, 2400);
  cx.globalCompositeOperation = "lighter";
  const luz = (x, y, r, c, al) => { const lg = cx.createRadialGradient(x, y, 0, x, y, r); lg.addColorStop(0, rgba(c, al)); lg.addColorStop(0.35, rgba(c, al * 0.4)); lg.addColorStop(1, rgba(c, 0)); cx.fillStyle = lg; cx.fillRect(x - r, y - r, 2 * r, 2 * r); };
  luz(FOCO[0], FOCO[1], 1100, "255,150,70", 0.42);
  luz(FOCO[0], FOCO[1], 300, "255,214,160", 0.5);
  luz(180, 1900, 900, "30,130,140", 0.2);
  // la neblina: cálida cerca de la luz, fría en el resto
  cx.globalAlpha = 0.3; cx.drawImage(neblina(1400, 2400, 607, "#1b4a52", 3, (m) => { m.fillStyle = "#fff"; m.fillRect(0, 0, 1400, 2400); }), 0, 0);
  cx.globalAlpha = 0.6; cx.drawImage(neblina(1400, 2400, 613, "#7a4420", 2.5, (m) => {
    const mg = m.createRadialGradient(FOCO[0], FOCO[1], 0, FOCO[0], FOCO[1], 1000);
    mg.addColorStop(0, "rgba(255,255,255,1)"); mg.addColorStop(1, "rgba(255,255,255,0)"); m.fillStyle = mg; m.fillRect(0, 0, 1400, 2400);
  }), 0, 0);
  return l;
});
// el polvo que flota en la luz
const polvo = (() => { const az = azar(619); return Array.from({ length: 140 }, () => [az() * 1240 - 80, az() * 2000 - 40, 0.2 + az() * 0.8, 1.2 + az() * 2.6, az() * 6.28]); })();

function fondo(g, t, cam) {
  const [mx, my] = camaraLejana(cam), fx = FOCO[0] - 160 + mx, fy = FOCO[1] - 240 + my;
  ponTelon(g, telon(), mx, my);
  g.save();
  g.globalCompositeOperation = "lighter";
  // los rayos de la luz cálida, que bajan en diagonal y respiran despacio
  for (let i = 0; i < 6; i++) {
    const a = 2.05 + i * 0.13 + 0.025 * Math.sin(t * 0.35 + i * 1.9), an = 0.035 + 0.02 * ((i * 7) % 3), al = 0.07 + 0.04 * Math.sin(t * 0.5 + i * 2.3);
    const L = 2600, rg = g.createLinearGradient(fx, fy, fx + Math.cos(a) * L, fy + Math.sin(a) * L);
    rg.addColorStop(0, rgba("255,196,130", al)); rg.addColorStop(0.6, rgba("255,180,110", al * 0.4)); rg.addColorStop(1, rgba("255,180,110", 0));
    g.fillStyle = rg;
    g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx + Math.cos(a - an) * L, fy + Math.sin(a - an) * L); g.lineTo(fx + Math.cos(a + an) * L, fy + Math.sin(a + an) * L); g.closePath(); g.fill();
  }
  // el polvo, que flota y brilla más cerca de la luz
  for (const p of polvo) {
    const x = p[0] + mx * 0.8 + 18 * Math.sin(t * 0.3 * p[2] + p[4]), y = (((p[1] + t * 9 * p[2] + my * 0.8) % 2000) + 2000) % 2000 - 40;
    const cerca = Math.max(0, 1 - Math.hypot(x - fx, y - fy) / 1500), al = (0.1 + 0.6 * cerca) * p[2];
    g.fillStyle = rgba("255,222,180", al); g.fillRect(x, y, p[3], p[3]);
  }
  g.restore();
}

// Un material de película sobre el camino actual (de x0, y0 a x1, y1): luz principal cálida desde (lx, ly), el lado
// de sombra azulado, la textura de lo de verdad, un brillo duro y un borde de luz fría por detrás.
function material(g, x0, y0, x1, y1, tono = C.acentos[0], lx = -0.6, ly = -0.8) {
  const w = x1 - x0, h = y1 - y0, s = Math.max(w, h), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, l = Math.hypot(lx, ly) || 1, A = g.globalAlpha;
  lx /= l; ly /= l;
  g.save();
  g.clip();
  const cg = g.createLinearGradient(cx + lx * s * 0.5, cy + ly * s * 0.5, cx - lx * s * 0.5, cy - ly * s * 0.5);
  cg.addColorStop(0, rgba(mezcla(tono, C.luz, 0.5))); cg.addColorStop(0.32, rgba(tono)); cg.addColorStop(0.62, rgba(mezcla(tono, "18,58,66", 0.62)));
  cg.addColorStop(1, rgba(mezcla(tono, C.sombra, 0.9)));
  g.fillStyle = cg; g.fillRect(x0 - 2, y0 - 2, w + 4, h + 4);
  // la textura de lo de verdad
  g.globalCompositeOperation = "multiply";
  g.globalAlpha = A * 0.22; g.drawImage(manchas, x0, y0, s, s);
  g.globalAlpha = A * 0.14; g.drawImage(red, x0, y0, s * 1.3, s * 1.3);
  // el brillo duro de la luz cálida y el borde frío del otro lado
  g.globalCompositeOperation = "lighter"; g.globalAlpha = A;
  const bx = cx + lx * s * 0.28, by = cy + ly * s * 0.28, br = g.createRadialGradient(bx, by, 0, bx, by, s * 0.16);
  br.addColorStop(0, "rgba(255,236,206,0.6)"); br.addColorStop(1, "rgba(255,236,206,0)");
  g.fillStyle = br; g.fillRect(x0, y0, w, h);
  const rg = g.createLinearGradient(cx - lx * s * 0.5, cy - ly * s * 0.5, cx - lx * s * 0.3, cy - ly * s * 0.3);
  rg.addColorStop(0, rgba(C.acentos[1], 0.75)); rg.addColorStop(1, rgba(C.acentos[1], 0));
  g.fillStyle = rg; g.fillRect(x0, y0, w, h);
  g.restore();
}

// Una línea de luz cálida sobre el camino actual, con su halo: un filamento, un rastro, una trayectoria.
function trazo(g, ancho = 5, tono = C.acentos[0], al = 1) {
  lineaDeLuz(g, ancho, mezcla(tono, C.luz, 0.25), al, 5, 0.4, 0.5);
}

// La sombra de algo apoyado en el suelo: honda y suave, casi negra en el centro.
function sombra(g, x, y, ancho, al = 1) {
  g.save();
  g.translate(x, y); g.scale(1, 0.18);
  const r = ancho * 0.65, sg = g.createRadialGradient(0, 0, 0, 0, 0, r);
  sg.addColorStop(0, rgba(C.sombra, 0.9 * al)); sg.addColorStop(0.5, rgba(C.sombra, 0.5 * al)); sg.addColorStop(1, rgba(C.sombra, 0));
  g.fillStyle = sg; g.fillRect(-r, -r, 2 * r, 2 * r);
  g.restore();
}

export default {
  nombre: "cine",
  descripcion: "Como un fotograma de película: contraste alto, sombras verde azuladas y luces de ámbar, rayos de luz con polvo, grano fino y viñeta. Para el misterio, la historia de verdad, el crimen, la tensión, lo épico.",
  colores: C,
  fondo,
  // El acabado: las sombras se van al verde azulado y las luces al ámbar, sube el contraste, los bordes se apagan
  // (la viñeta) y encima va el grano fino, otro en cada fotograma. Unos 7 ms.
  acabado(g, t, aux) {
    const ga = listo(aux.getContext("2d"), "copy");
    ga.drawImage(g.canvas, 0, 0);
    g.save();
    listo(g, "overlay", 0.28); g.drawImage(aux, 0, 0);       // más contraste y más color
    listo(g, "screen", 1); g.fillStyle = "rgb(0,15,21)"; g.fillRect(0, 0, 1080, 1920); // lo negro, a verde azulado
    g.restore();
    ponCapa(g, vineta("cine", { centro: "255,238,214", borde: "18,40,48", fuerza: 0.7, ancho: 0.95 }), "multiply");
    grano(g, t, 0.13);
  },
  material,
  trazo,
  sombra,
  consejos: [
    "Una luz principal cálida, de un lado, y el lado contrario en sombra verde azulada: nunca todo iluminado por igual. Con el fondo del look, la luz entra por arriba a la derecha: k.materialDelLook(..., 0.6, -0.8).",
    "Mucho negro: el fondo oscuro manda y lo importante sale de la sombra con su luz. Un objeto a contraluz, con su borde de luz, se ve de película.",
    "Los rayos que entran en un aire con polvo (k.rayos, o el fondo del look) y los brillos cálidos (k.brillo con \"255,190,120\") van muy bien.",
    "Los materiales de verdad del kit (k.roca, k.metal, k.vidrio, k.planeta) encajan: el acabado ya los pasa al color de la película.",
    "Colores de ámbar y verde azulado; un rojo solo para lo que importa (sangre, peligro, la cifra).",
    "Nada de colores pastel ni planos, ni de fondos claros: la viñeta y el contraste los ensucian.",
  ],
};
