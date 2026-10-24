// Look «papel»: una ilustración moderna impresa en papel. Colores planos y cálidos, con su trazo de tinta, sombras
// planas de un tono más oscuro y un degradado granulado; debajo de todo, el papel crema con su fibra y su grano (el
// acabado lo pone encima de cada fotograma). El fondo es un cielo verde azulado de color plano que baja hasta un
// horizonte cálido, con nubes de papel recortado que se mueven despacio.
import { Path2D } from "@napi-rs/canvas";
import { azar, lienzo } from "../base.js";
import { ruido } from "../texturas.js";
import { estilo } from "#estilo";
import { camaraLejana, mezcla, ponCapa, ponTelon, rgba, una, vineta } from "./pasos.js";

const C = {
  fondo: "243,232,210",
  tinta: "38,30,52",
  acentos: ["232,84,58", "244,178,50", "28,132,138", "52,86,178", "238,132,150"], // bermellón, mostaza, verde azulado, cobalto, rosa
  luz: "255,247,228",
  sombra: "62,44,86",
};
const YT = 1500; // el horizonte dentro del telón (en pantalla, en y 1260 con la cámara recta)

// El punteado de la tinta: puntitos oscuros sobre blanco, para que las sombras y los degradados se vean impresos.
const punteado = una(() => {
  const l = lienzo(512), cx = l.getContext("2d"), az = azar(401);
  cx.fillStyle = "#fff"; cx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 9000; i++) { const v = 150 + Math.floor(az() * 90); cx.fillStyle = `rgb(${v},${v - 6},${v + 4})`; cx.beginPath(); cx.arc(az() * 512, az() * 512, 0.5 + az() * 1.3, 0, 6.2832); cx.fill(); }
  return l;
});
// Lo mismo en gris medio, con puntos claros y oscuros, para "overlay" (se ve en lo claro y en lo oscuro).
const punteadoMedio = una(() => {
  const l = lienzo(512), cx = l.getContext("2d"), az = azar(409);
  cx.fillStyle = "rgb(128,128,128)"; cx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 7000; i++) { const v = az() < 0.5 ? 60 + az() * 40 : 180 + az() * 50; cx.fillStyle = `rgb(${v},${v},${v})`; cx.beginPath(); cx.arc(az() * 512, az() * 512, 0.6 + az() * 1.4, 0, 6.2832); cx.fill(); }
  return l;
});

// El cielo, el horizonte y el suelo, una vez.
const telon = una(() => {
  const l = lienzo(1400, 2400), cx = l.getContext("2d");
  const cg = cx.createLinearGradient(0, 0, 0, YT);
  cg.addColorStop(0, "#123f55"); cg.addColorStop(0.45, "#1d6f78"); cg.addColorStop(0.8, "#4f9e8c"); cg.addColorStop(0.95, "#d9bd78"); cg.addColorStop(1, "#f0b765");
  cx.fillStyle = cg; cx.fillRect(0, 0, 1400, YT + 20);
  // una luz suave detrás del centro
  const lz = cx.createRadialGradient(700, 980, 0, 700, 980, 760);
  lz.addColorStop(0, "rgba(140,214,196,0.35)"); lz.addColorStop(1, "rgba(140,214,196,0)");
  cx.fillStyle = lz; cx.fillRect(0, 0, 1400, YT);
  // estrellitas y puntos de tinta clara, arriba
  const az = azar(419);
  for (let i = 0; i < 140; i++) {
    const x = az() * 1400, y = az() * 900, r = az() < 0.12 ? 4 + az() * 3 : 1.5 + az() * 2;
    cx.fillStyle = `rgba(255,240,205,${0.35 + az() * 0.5})`; cx.beginPath(); cx.arc(x, y, r, 0, 6.2832); cx.fill();
  }
  // las colinas de detrás (bermellón) y el suelo de delante (arena), recortadas y con su sombra
  const capa = (y0, amp, fase, col, col2, n) => {
    cx.save();
    const borde = () => { cx.beginPath(); cx.moveTo(-10, 2400); cx.lineTo(-10, y0); for (let x = -10; x <= 1410; x += 20) cx.lineTo(x, y0 - amp * (0.6 * Math.sin(x / n + fase) + 0.4 * Math.sin(x / (n * 0.47) + fase * 2.3))); cx.lineTo(1410, 2400); cx.closePath(); };
    borde(); cx.shadowColor = rgba(C.sombra, 0.4); cx.shadowBlur = 26; cx.shadowOffsetY = -6;
    const sg = cx.createLinearGradient(0, y0 - amp, 0, 2400); sg.addColorStop(0, col); sg.addColorStop(1, col2);
    cx.fillStyle = sg; cx.fill();
    cx.shadowColor = "rgba(0,0,0,0)";
    borde(); cx.strokeStyle = "rgba(255,236,200,0.5)"; cx.lineWidth = 3; cx.stroke(); // el canto del papel, con luz
    cx.restore();
  };
  capa(YT - 30, 70, 0.7, "#d9623f", "#b9452f", 210);
  capa(YT + 40, 26, 2.1, "#f0bf72", "#dc8e4e", 330);
  // todo, con el punteado de la impresión
  cx.globalCompositeOperation = "overlay"; cx.globalAlpha = 0.35;
  for (let y = 0; y < 2400; y += 512) for (let x = 0; x < 1400; x += 512) cx.drawImage(punteadoMedio(), x, y);
  return l;
});

// Las nubes: papel recortado, plano, con su sombra sobre el cielo.
const nubes = una(() => [0, 1, 2].map((i) => {
  const l = lienzo(520, 240), cx = l.getContext("2d"), az = azar(431 + i), bolas = [];
  for (let k = 0; k < 6; k++) bolas.push([90 + k * 66 + (az() - 0.5) * 30, 150 - Math.sin((k / 5) * Math.PI) * (40 + az() * 30), 52 + az() * 34]);
  const forma = (dy) => { cx.beginPath(); for (const [x, y, r] of bolas) { cx.moveTo(x + r, y + dy); cx.arc(x, y + dy, r, 0, 6.2832); } cx.rect(80, 150 + dy, 360, 50); };
  forma(14); cx.fillStyle = rgba(C.sombra, 0.28); cx.fill();
  forma(0); cx.fillStyle = "#f6e9cf"; cx.fill();
  cx.save(); forma(0); cx.clip(); cx.fillStyle = rgba("214,190,160", 0.55); cx.fillRect(0, 178, 520, 60); cx.restore();
  return l;
}));
const SITIOS = [[120, 600, 0.9, 7], [700, 90, 0.75, 4], [880, 860, 0.6, 5.5]]; // nunca detrás del subtítulo

function fondo(g, t, cam) {
  const [mx, my] = camaraLejana(cam);
  ponTelon(g, telon(), mx, my);
  const ns = nubes();
  SITIOS.forEach(([x, y, e, vel], i) => {
    const px = ((((x + t * vel + mx * 0.7) % 1500) + 1500) % 1500) - 360;
    g.drawImage(ns[i], px, y + my * 0.7, 520 * e, 240 * e);
  });
}

// Un material de ilustración sobre el camino actual (de x0, y0 a x1, y1): color plano, su sombra plana de un tono más
// oscuro en el lado contrario a la luz (lx, ly), granulada en el borde, un brillo plano y el contorno de tinta.
function material(g, x0, y0, x1, y1, tono = C.acentos[0], lx = -0.6, ly = -0.8) {
  const w = x1 - x0, h = y1 - y0, s = Math.max(w, h), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, l = Math.hypot(lx, ly) || 1, A = g.globalAlpha;
  lx /= l; ly /= l;
  g.save();
  g.clip();
  g.fillStyle = rgba(mezcla(tono, C.luz, 0.06)); g.fillRect(x0 - 2, y0 - 2, w + 4, h + 4);
  // la sombra plana: una franja de un tono más oscuro por dentro del contorno, en el lado contrario a la luz, que se
  // estrecha hacia la luz (sigue la forma: en una bola es una media luna; en una caja, sus lados de sombra)
  const os = mezcla(tono, C.sombra, 0.42);
  g.lineJoin = "round"; g.strokeStyle = rgba(os);
  for (let i = 0; i <= 16; i++) {
    const u = i / 16, sg = g.createLinearGradient(cx + lx * s * 0.5, cy + ly * s * 0.5, cx - lx * s * 0.5, cy - ly * s * 0.5), p = 0.36 + 0.4 * u;
    sg.addColorStop(0, rgba(os, 0)); sg.addColorStop(p, rgba(os, 0)); sg.addColorStop(Math.min(1, p + 0.035), rgba(os, 1)); sg.addColorStop(1, rgba(os, 1));
    g.strokeStyle = sg; g.lineWidth = s * (0.06 + 0.34 * u); g.stroke();
  }
  // el punteado de la impresión
  g.globalCompositeOperation = "multiply"; g.globalAlpha = A * 0.4;
  g.drawImage(punteado(), x0, y0, Math.max(w, 256), Math.max(h, 256));
  // un brillo plano: un óvalo y un punto, en el lado de la luz
  g.globalCompositeOperation = "source-over"; g.globalAlpha = A * 0.85;
  g.fillStyle = rgba(mezcla(tono, C.luz, 0.62));
  const bx = cx + lx * s * 0.3, by = cy + ly * s * 0.3, ang = Math.atan2(ly, lx) + Math.PI / 2;
  const bri = new Path2D(); // (aparte: el camino de quien llama sigue ahí para el contorno)
  bri.ellipse(bx, by, s * 0.075, s * 0.03, ang, 0, 6.2832);
  bri.moveTo(bx - Math.cos(ang) * s * 0.12 + s * 0.018, by - Math.sin(ang) * s * 0.12); bri.arc(bx - Math.cos(ang) * s * 0.12, by - Math.sin(ang) * s * 0.12, s * 0.018, 0, 6.2832);
  g.fill(bri);
  g.restore();
  trazo(g, Math.max(3, s * 0.011), C.tinta, 1);
}

// Una línea de tinta sobre el camino actual, de puntas redondas. ancho: su grosor; tono: por defecto, la tinta.
function trazo(g, ancho = 6, tono = C.tinta, al = 1) {
  g.save();
  g.globalAlpha *= al; g.lineCap = "round"; g.lineJoin = "round";
  g.strokeStyle = rgba(tono); g.lineWidth = ancho; g.stroke();
  g.restore();
}

// La sombra de algo apoyado en el suelo: una mancha plana de tinta, sin desenfoque, corrida hacia la derecha.
function sombra(g, x, y, ancho, al = 1) {
  g.save();
  g.globalAlpha *= 0.3 * al; g.fillStyle = rgba(C.sombra);
  g.beginPath(); g.ellipse(x + ancho * 0.06, y, ancho * 0.52, ancho * 0.09, 0, 0, 6.2832); g.fill();
  g.restore();
}

// El relieve del papel (ruido fino, apenas desenfocado) y su moteado grande y suave, una vez.
const crudo = una(() => {
  const w = 1080, h = 1920, az = azar(443), n = new Float32Array(w * h), r = new Float32Array(w * h);
  for (let i = 0; i < n.length; i++) n[i] = az();
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x; r[i] = (n[i] * 4 + n[i - 1] + n[i + 1] + n[i - w] + n[i + w]) / 8; }
  const mo = lienzo(w, h), mc = mo.getContext("2d");
  mc.drawImage(ruido(256, 449, 4, 4, "crudo"), 0, 0, w, h);
  return { r, m: mc.getImageData(0, 0, w, h).data };
});
// El papel, para "multiply": crema, con su moteado, su fibra y los bordes un poco tostados (y más donde va el
// subtítulo, para que se lea). Uno por sitio del subtítulo.
const capasPapel = new Map();
function capaPapel(subs) {
  if (capasPapel.has(subs)) return capasPapel.get(subs);
  const { r, m } = crudo(), l = lienzo(1080, 1920), cx = l.getContext("2d"), img = cx.createImageData(1080, 1920), d = img.data, az = azar(457);
  for (let i = 0; i < r.length; i++) {
    const k = 1 - 0.05 * (m[i * 4] / 255) - 0.05 * Math.abs(r[i] - 0.5), q = i * 4;
    d[q] = 251 * k; d[q + 1] = 245 * k; d[q + 2] = 233 * k; d[q + 3] = 255;
  }
  cx.putImageData(img, 0, 0);
  // la fibra: hilos cortos y curvos, en todas direcciones
  cx.lineCap = "round";
  for (let i = 0; i < 2200; i++) {
    const x = az() * 1080, y = az() * 1920, a = az() * 6.2832, L = 8 + az() * 30, c = Math.cos(a), s = Math.sin(a), b = (az() - 0.5) * 10;
    cx.strokeStyle = `rgba(160,128,98,${0.04 + az() * 0.07})`; cx.lineWidth = 0.5 + az() * 0.8;
    cx.beginPath(); cx.moveTo(x, y); cx.quadraticCurveTo(x + c * L / 2 - s * b, y + s * L / 2 + c * b, x + c * L, y + s * L); cx.stroke();
  }
  cx.globalCompositeOperation = "multiply";
  cx.drawImage(vineta(`papel-${subs}`, { centro: "255,255,255", borde: "190,150,118", fuerza: 0.3, subs, fuerzaSubs: 0.12 }), 0, 0);
  capasPapel.set(subs, l);
  return l;
}
// El diente del papel, para "overlay": su relieve, como si le diera una luz rasante.
const diente = una(() => {
  const { r } = crudo(), w = 1080, l = lienzo(w, 1920), cx = l.getContext("2d"), img = cx.createImageData(w, 1920), d = img.data;
  for (let i = 0; i < r.length; i++) { const v = 128 + (r[i] - (r[i - w - 1] || 0.5)) * 200, q = i * 4; d[q] = d[q + 1] = d[q + 2] = v; d[q + 3] = 255; }
  cx.putImageData(img, 0, 0);
  return l;
});

export default {
  nombre: "papel",
  claro: true, // fondos claros: los subtítulos con palabras en gris (caja, minimal) se leen mal; mejor karaoke, contorno o fondo
  descripcion: "Una ilustración moderna impresa en papel: colores planos y cálidos con trazo de tinta, sombras planas y grano de impresión. Para la historia, la cultura, la salud, el dinero, las explicaciones de cómo funciona algo.",
  colores: C,
  fondo,
  // El acabado: todo queda impreso en el papel: su color crema, su moteado, su fibra, sus bordes tostados y el
  // relieve de su superficie, que se ve también en la tinta oscura. El papel no se mueve: es la hoja. Unos 4 ms.
  acabado(g, t, aux) {
    ponCapa(g, capaPapel(estilo.subtitulos?.posicion || "arriba"), "multiply");
    ponCapa(g, diente(), "overlay", 0.28);
  },
  material,
  trazo,
  sombra,
  consejos: [
    "Colores planos y cálidos de colores.acentos; cada cosa, de un solo color con su sombra plana (k.materialDelLook), nunca un degradado fotográfico.",
    "Todo lleva contorno de tinta (k.trazoDelLook): el mismo grosor para lo del mismo tamaño; las líneas sueltas, de tinta también.",
    "Las sombras en el suelo son manchas planas de tinta (k.sombraDelLook), sin desenfoque.",
    "La luz se dibuja como forma, no como brillo: un círculo claro, unos rayos de papel. Nada de k.brillo ni de \"lighter\" grandes: sobre lo claro dejan un agujero blanco.",
    "Las piezas fotográficas del kit (k.roca, k.estrella, k.planeta, k.superficie) no pegan aquí: dibuja la forma con un camino y rellénala con k.materialDelLook.",
    "Detrás del subtítulo (y 318-482), un color medio u oscuro (el cielo del fondo ya lo es): sobre el papel crema no se lee.",
  ],
};
