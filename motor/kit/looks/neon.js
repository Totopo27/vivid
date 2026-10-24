// Look «neon»: de noche, con tubos de luz magenta y cian. El fondo es violeta casi negro, con su horizonte encendido,
// un suelo de rejilla que se pierde en la niebla y polvo en el aire; lo que brilla se desborda (el resplandor del
// acabado) y una niebla violeta llena lo oscuro. Los objetos son oscuros y brillantes, y su luz es la de los bordes.
import { azar, lienzo } from "../base.js";
import { manchas } from "../texturas.js";
import { aclara, camaraLejana, lineaDeLuz, mezcla, neblina, ponCapa, ponTelon, resplandor, rgb, rgba, una, vineta } from "./pasos.js";

const C = {
  fondo: "9,3,26",
  tinta: "255,236,255",
  acentos: ["255,46,170", "40,226,255", "160,92,255", "255,224,72", "110,255,160"], // magenta, cian, violeta, amarillo, verde ácido
  luz: "255,150,235",
  sombra: "8,0,22",
};
const YT = 1480; // el horizonte dentro del telón (en pantalla, en y 1240 con la cámara recta)

// El cielo de noche con su horizonte encendido, una vez.
const telon = una(() => {
  const l = lienzo(1400, 2400), cx = l.getContext("2d");
  const cg = cx.createLinearGradient(0, 0, 0, 2400);
  cg.addColorStop(0, "#06011a"); cg.addColorStop(0.3, "#10042e"); cg.addColorStop(YT / 2400 - 0.07, "#2a0a55");
  cg.addColorStop(YT / 2400 - 0.004, "#5a137e"); cg.addColorStop(YT / 2400 + 0.004, "#1c0640"); cg.addColorStop(0.8, "#0b0326"); cg.addColorStop(1, "#040112");
  cx.fillStyle = cg; cx.fillRect(0, 0, 1400, 2400);
  cx.globalCompositeOperation = "lighter";
  const luz = (x, y, rx, ry, c, al) => {
    cx.save(); cx.translate(x, y); cx.scale(1, ry / rx);
    const r = cx.createRadialGradient(0, 0, 0, 0, 0, rx);
    r.addColorStop(0, rgba(c, al)); r.addColorStop(0.4, rgba(c, al * 0.35)); r.addColorStop(1, rgba(c, 0));
    cx.fillStyle = r; cx.fillRect(-rx, -rx, rx * 2, rx * 2); cx.restore();
  };
  luz(700, YT, 1000, 230, C.acentos[0], 0.55);           // el horizonte encendido
  luz(700, YT, 420, 70, "255,170,230", 0.5);
  luz(150, 700, 820, 820, C.acentos[1], 0.16);           // dos luces grandes, fuera de cuadro
  luz(1300, 1050, 760, 760, C.acentos[2], 0.2);
  luz(700, YT + 260, 900, 260, C.acentos[0], 0.12);      // su reflejo en el suelo
  // la niebla: manchas violetas, más espesas cerca del horizonte
  cx.drawImage(neblina(1400, 2400, 67, "#4a1484", 3, (m) => {
    const mg = m.createLinearGradient(0, 0, 0, 2400);
    mg.addColorStop(0, "rgba(255,255,255,0.25)"); mg.addColorStop(YT / 2400 - 0.06, "rgba(255,255,255,0.7)"); mg.addColorStop(YT / 2400, "rgba(255,255,255,0.9)");
    mg.addColorStop(YT / 2400 + 0.1, "rgba(255,255,255,0.3)"); mg.addColorStop(1, "rgba(255,255,255,0)");
    m.fillStyle = mg; m.fillRect(0, 0, 1400, 2400);
  }), 0, 0);
  cx.globalAlpha = 0.6; cx.drawImage(neblina(1400, 2400, 71, "#0c3a66", 2, (m) => { m.fillStyle = "rgba(255,255,255,0.6)"; m.fillRect(0, 0, 1400, 2400); }), 0, 0);
  // estrellas pocas y lejanas
  const az = azar(311);
  cx.globalAlpha = 1;
  for (let i = 0; i < 260; i++) { const y = az() * (YT - 300), s = az() < 0.1 ? 2.6 : 1.5; cx.fillStyle = `rgba(${az() < 0.5 ? "255,200,255" : "190,240,255"},${0.2 + az() * 0.5 * (1 - y / YT)})`; cx.fillRect(az() * 1400, y, s, s); }
  return l;
});
// el polvo que flota en el aire, iluminado
const polvo = (() => { const az = azar(317); return Array.from({ length: 90 }, () => [az() * 1240 - 80, az() * 2100 - 90, 0.15 + az() * 0.5, az() < 0.5 ? 0 : 1, 2 + az() * 3, az() * 6.28]); })();

function fondo(g, t, cam) {
  const [mx, my] = camaraLejana(cam), yh = YT - 240 + my, fx = 540 + mx * 0.6;
  ponTelon(g, telon(), mx, my);
  g.save();
  g.globalCompositeOperation = "lighter"; g.lineCap = "round";
  // el suelo: una rejilla que viene despacio hacia la cámara y se pierde en la niebla del horizonte
  if (yh < 1960) {
    const avance = (t * 0.35) % 1;
    for (let i = 0; i < 16; i++) {
      const z = 16 - i - avance, y = yh + 900 / z;
      if (y > 1940 || y < yh + 2) continue;
      const cerca = Math.min(1, 900 / z / 700);
      g.strokeStyle = rgba(C.acentos[0], 0.1 + 0.55 * cerca); g.lineWidth = 1 + 3 * cerca;
      g.beginPath(); g.moveTo(-20, y); g.lineTo(1100, y); g.stroke();
    }
    for (let i = -14; i <= 14; i++) {
      const xb = fx + i * 170, gr = g.createLinearGradient(0, yh, 0, 1920);
      gr.addColorStop(0, rgba(C.acentos[2], 0)); gr.addColorStop(0.35, rgba(C.acentos[2], 0.3)); gr.addColorStop(1, rgba(C.acentos[2], 0.7));
      g.strokeStyle = gr; g.lineWidth = 2;
      g.beginPath(); g.moveTo(fx + i * 8, yh); g.lineTo(fx + (xb - fx) * 4, yh + (1920 - yh) * 4); g.stroke();
    }
    g.fillStyle = rgba("255,190,240", 0.55); g.fillRect(-20, yh - 1.5, 1120, 3);   // la raya del horizonte
  }
  // el polvo en el aire, que sube despacio
  for (const p of polvo) {
    const y = ((((p[1] - t * 22 * p[2] + my * 0.5) % 2100) + 2100) % 2100) - 90, x = p[0] + mx * 0.5 + 14 * Math.sin(t * 0.7 + p[5]);
    g.fillStyle = rgba(C.acentos[p[3]], p[2] * 0.7); g.fillRect(x, y, p[4], p[4]);
  }
  g.restore();
}

// Un material de noche sobre el camino actual (de x0, y0 a x1, y1): cuerpo oscuro y brillante del color tono, con la
// luz del lado (lx, ly) y el reflejo cian del otro, y su borde encendido como un tubo de neón.
function material(g, x0, y0, x1, y1, tono = C.acentos[0], lx = -0.6, ly = -0.8) {
  const w = x1 - x0, h = y1 - y0, s = Math.max(w, h), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, l = Math.hypot(lx, ly) || 1;
  lx /= l; ly /= l;
  const otro = rgb(tono)[2] > 180 && rgb(tono)[0] < 120 ? C.acentos[0] : C.acentos[1], A = g.globalAlpha;
  g.save();
  g.clip();
  const cuerpo = g.createLinearGradient(cx + lx * s * 0.55, cy + ly * s * 0.55, cx - lx * s * 0.55, cy - ly * s * 0.55);
  cuerpo.addColorStop(0, rgba(mezcla(tono, C.sombra, 0.25))); cuerpo.addColorStop(0.35, rgba(mezcla(tono, C.sombra, 0.72)));
  cuerpo.addColorStop(1, rgba(mezcla(tono, C.sombra, 0.9)));
  g.fillStyle = cuerpo; g.fillRect(x0 - 2, y0 - 2, w + 4, h + 4);
  g.globalCompositeOperation = "multiply"; g.globalAlpha = A * 0.2; g.drawImage(manchas, x0, y0, s, s);
  g.globalCompositeOperation = "lighter"; g.globalAlpha = A;
  // el reflejo del otro color, por el lado de la sombra
  const re = g.createLinearGradient(cx - lx * s * 0.5, cy - ly * s * 0.5, cx, cy);
  re.addColorStop(0, rgba(otro, 0.55)); re.addColorStop(0.45, rgba(otro, 0)); g.fillStyle = re; g.fillRect(x0, y0, w, h);
  // el brillo duro, cerca del borde de la luz
  const bx = cx + lx * s * 0.3, by = cy + ly * s * 0.3, br = g.createRadialGradient(bx, by, 0, bx, by, s * 0.28);
  br.addColorStop(0, "rgba(255,255,255,0.55)"); br.addColorStop(0.3, rgba(aclara(tono, 0.5), 0.25)); br.addColorStop(1, rgba(tono, 0));
  g.fillStyle = br; g.fillRect(x0, y0, w, h);
  // el borde de dentro, encendido
  g.strokeStyle = rgba(tono, 0.5); g.lineWidth = Math.max(4, s * 0.07); g.stroke();
  g.restore();
  trazo(g, Math.max(3, s * 0.012), tono, 0.9);
}

// Una línea de luz sobre el camino actual: un tubo de neón, con su núcleo casi blanco y su halo. ancho: el del tubo.
function trazo(g, ancho = 8, tono = C.acentos[0], al = 1) {
  lineaDeLuz(g, ancho, tono, al, 7, 0.5, 0.75);
}

// La sombra de algo apoyado en el suelo, centrada en (x, y), de ancho px: oscura, con el brillo del suelo alrededor.
function sombra(g, x, y, ancho, al = 1) {
  g.save();
  g.translate(x, y); g.scale(1, 0.22);
  const r = ancho * 0.6, sg = g.createRadialGradient(0, 0, 0, 0, 0, r);
  sg.addColorStop(0, rgba(C.sombra, 0.85 * al)); sg.addColorStop(0.6, rgba(C.sombra, 0.45 * al)); sg.addColorStop(1, rgba(C.sombra, 0));
  g.fillStyle = sg; g.fillRect(-r, -r, 2 * r, 2 * r);
  g.globalCompositeOperation = "lighter";
  const rg = g.createRadialGradient(0, 0, r * 0.7, 0, 0, r * 1.4);
  rg.addColorStop(0, rgba(C.acentos[0], 0)); rg.addColorStop(0.5, rgba(C.acentos[0], 0.12 * al)); rg.addColorStop(1, rgba(C.acentos[0], 0));
  g.fillStyle = rg; g.fillRect(-r * 1.4, -r * 1.4, 2.8 * r, 2.8 * r);
  g.restore();
}

export default {
  nombre: "neon",
  descripcion: "De noche, con tubos de neón magenta y cian: lo que brilla se desborda y una niebla violeta llena lo oscuro. Para la fiesta, la ciudad de noche, la tecnología, los juegos, el futuro.",
  colores: C,
  fondo,
  // El acabado: lo que brilla se desborda (fino y ancho), lo negro se llena de una niebla violeta y los bordes se
  // apagan hacia el violeta. Unos 6 ms.
  acabado(g, t, aux) {
    resplandor(g, { umbral: 3, al: 0.5, modo: "lighter", pesos: [0.25, 0.5, 0.9], bruma: "32,8,68" }); // la bruma: lo negro, a violeta
    ponCapa(g, vineta("neon", { centro: "255,250,255", borde: "26,0,50", fuerza: 0.8 }), "multiply");
  },
  material,
  trazo,
  sombra,
  consejos: [
    "Todo pasa de noche: lo que no es luz es casi negro (violeta o azul muy oscuro), y la luz viene de los tubos, las pantallas y los bordes.",
    "Los objetos, oscuros y brillantes: k.materialDelLook rellena su cuerpo oscuro y le enciende el borde; nunca un relleno claro y plano.",
    "Las líneas, los contornos y las flechas son tubos de neón: k.trazoDelLook(g, ancho, color).",
    "Dos colores mandan, magenta y cian; el amarillo o el verde ácido, para una sola cosa que importa.",
    "Los brillos y destellos del kit (k.brillo, k.haz, k.fogonazo) van muy bien: el acabado los hace desbordarse. No los pongas todos al máximo o la pantalla se quema a blanco.",
    "Evita lo grande y blanco (una superficie, un papel): el resplandor lo convierte en una mancha que deslumbra.",
  ],
};
