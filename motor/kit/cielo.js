// El espacio: un fondo con nebulosa y polvo de estrellas, miles de estrellas en 3D (que pasan y dejan estela cuando
// la cámara corre) y una galaxia entera.
import { azar, lienzo, pto, res, sum } from "./base.js";
import { F, proyecta } from "./camara.js";
import { COLORES, halo } from "./luz.js";
import { ruido, tenir } from "./texturas.js";

const nebulosa = (() => {
  const n1 = ruido(256, 31, 3, 4, "manchas"), n2 = ruido(256, 37, 2.2, 4, "manchas");
  const l = lienzo(1400, 2400), cx = l.getContext("2d");
  cx.fillStyle = "#03050a"; cx.fillRect(0, 0, 1400, 2400);
  cx.globalCompositeOperation = "lighter";
  cx.globalAlpha = 0.55; cx.drawImage(tenir(n1, "#2c1a4c"), 0, 0, 1400, 2400);
  cx.globalAlpha = 0.45; cx.drawImage(tenir(n2, "#0d2c40"), -200, -150, 1800, 2700); // que cubra todo: si empieza más abajo, su borde se ve como una raya
  return l;
})();
const polvo = (() => {
  const az = azar(77), p = [];
  for (let q = 0; q < 4200; q++) {
    let x = az() * 1400, y = az() * 2400;
    if (q % 2 === 0) { const bx = az(); x = bx * 1400; y = 400 + bx * 1500 + (az() - 0.5) * (260 + 200 * az()); }
    p.push([x, y, 0.25 + az() * 0.6, az() < 0.14 ? "255,205,175" : az() < 0.24 ? "185,205,255" : "236,239,255", az() < 0.06 ? 2.4 : 1.5]);
  }
  return p;
})();

// El fondo del espacio: negro azulado, una nebulosa suave y polvo de estrellas lejanas. Solo se mueve un poco con
// hacia dónde mira la cámara, como lo que está infinitamente lejos. brillo: de 0 a 1.
export function fondo(g, cam, brillo = 1) {
  const mx = Math.max(-150, Math.min(150, cam.e.f[0] * -600)), my = Math.max(-230, Math.min(230, cam.e.f[1] * 900)), A = g.globalAlpha;
  g.save();
  g.globalCompositeOperation = "source-over";
  g.fillStyle = "#03050a"; g.fillRect(0, 0, 1080, 1920);
  g.globalAlpha = A * brillo;
  g.drawImage(nebulosa, -160 + mx, -240 + my);
  for (const pv of polvo) {
    const px = (((pv[0] - 160 + mx * 0.9) % 1400) + 1400) % 1400 - 160, py = (((pv[1] - 240 + my * 0.9) % 2400) + 2400) % 2400 - 240;
    g.fillStyle = `rgba(${pv[3]},${pv[2]})`; g.fillRect(px, py, pv[4], pv[4]);
  }
  g.restore();
}

const clases = ["roja", "roja", "roja", "naranja", "naranja", "amarilla", "amarilla", "blanca", "blanca", "azul"];
// n estrellas al azar en una caja de lado `lado` alrededor de centro, ninguna a menos de `hueco` de él.
// Cada una: { p: posición, c: color, b: brillo, r: radio }. Añade { grande: true } a las que deban poder verse enormes.
export function cielo(semilla, n, centro = [0, 0, 0], lado = 520, hueco = 30) {
  const az = azar(semilla), lista = [];
  while (lista.length < n) {
    const X = sum(centro, [(az() - 0.5) * lado, (az() - 0.5) * lado, (az() - 0.5) * lado]), d = res(X, centro);
    if (pto(d, d) < hueco * hueco) continue;
    lista.push({ p: X, c: clases[Math.floor(az() * clases.length)], b: 0.35 + Math.pow(az(), 3) * 2.4, r: 0.05 + az() * 0.08 });
  }
  return lista;
}

// Dibuja las estrellas de la lista vistas desde cam. antes: la cámara del fotograma anterior (cam de t - 1/60): si la
// cámara corre, cada estrella deja su estela (110 px como mucho, para que no parezcan rayos). brillo: de 0 a 1.
export function estrellas(g, cam, antes, lista, brillo = 1) {
  const A = g.globalAlpha;
  g.save();
  g.globalCompositeOperation = "lighter";
  for (const s of lista) {
    const a = proyecta(cam, s.p);
    if (!a || a.x < -80 || a.x > 1160 || a.y < -80 || a.y > 2000) continue;
    const tam = Math.max(7, Math.min(s.grande ? 200 : 110, ((F * s.r) / a.z) * 7 + 8 * s.b)), al = brillo * Math.min(1, s.b * Math.min(1, 160 / a.z));
    const b0 = antes && proyecta(antes, s.p);
    if (b0) {
      const dx = a.x - b0.x, dy = a.y - b0.y, l = Math.sqrt(dx * dx + dy * dy);
      if (l > 3) {
        const corta = Math.min(1, 110 / l);
        g.globalAlpha = A;
        g.strokeStyle = `rgba(${COLORES[s.c]},${al * 0.7})`; g.lineWidth = Math.max(1.4, tam * 0.15); g.lineCap = "round";
        g.beginPath(); g.moveTo(a.x - dx * corta, a.y - dy * corta); g.lineTo(a.x, a.y); g.stroke();
      }
    }
    g.globalAlpha = A * Math.min(1, al); g.drawImage(halo(s.c), a.x - tam / 2, a.y - tam / 2, tam, tam);
  }
  g.restore();
}

// Una galaxia espiral vista de frente (1600 × 1600): núcleo, dos brazos con sus estrellas, nubes rosas y polvo.
// Se dibuja girada y achatada: g.translate(x, y); g.scale(1, 0.62); g.rotate(giro); g.drawImage(galaxia(), -800*s, -800*s, 1600*s, 1600*s).
let laGalaxia = null;
export function galaxia() {
  if (laGalaxia) return laGalaxia;
  const N = 1600, l = lienzo(N), cx = l.getContext("2d"), az = azar(141);
  const h = cx.createRadialGradient(N / 2, N / 2, 0, N / 2, N / 2, N / 2);
  h.addColorStop(0, "rgba(255,236,200,0.9)"); h.addColorStop(0.08, "rgba(255,220,170,0.55)"); h.addColorStop(0.3, "rgba(170,180,230,0.12)"); h.addColorStop(1, "rgba(120,140,220,0)");
  cx.fillStyle = h; cx.fillRect(0, 0, N, N);
  cx.globalCompositeOperation = "lighter";
  for (let brazo = 0; brazo < 2; brazo++) for (let k = 0; k < 15000; k++) {
    const th = Math.pow(az(), 0.7) * 3.4 * Math.PI, r = 70 * Math.exp(0.27 * th), ab = (az() + az() + az() - 1.5) * (24 + r * 0.16), a = th + brazo * Math.PI;
    const x = N / 2 + (r + ab) * Math.cos(a) + (az() - 0.5) * 18, y = N / 2 + (r + ab) * Math.sin(a) + (az() - 0.5) * 18;
    const p = az(), col = p < 0.06 ? "255,150,200" : p < 0.5 ? "190,210,255" : "255,245,230";
    cx.fillStyle = `rgba(${col},${0.25 + az() * 0.6})`; const s = p < 0.06 ? 3 : az() < 0.05 ? 2.6 : 1.4; cx.fillRect(x, y, s, s);
  }
  for (let k = 0; k < 9000; k++) { const rr = Math.pow(az(), 2.2) * 640, aa = az() * 6.2832; cx.fillStyle = `rgba(255,240,220,${0.15 + az() * 0.4})`; cx.fillRect(N / 2 + rr * Math.cos(aa), N / 2 + rr * Math.sin(aa), 1.3, 1.3); }
  return (laGalaxia = l);
}

