// Lo que comparten los planos de este vídeo: el mismo cielo, la misma estrella y las mismas piezas, para que de un
// plano al siguiente sea siempre la misma cosa, del mismo tamaño.
import * as k from "#kit";

// Un velo oscuro suave arriba, para que se lea el subtítulo cuando una superficie clara llena la pantalla (rad: el
// radio en pantalla de lo que la llena). Lo usan el hook y el plano siguiente, para que el paso entre los dos sea igual.
export function veloArriba(g, rad) {
  const velo = 0.5 * k.tramo(rad, 650, 1100);
  if (velo <= 0.01) return;
  const vg = g.createLinearGradient(0, 120, 0, 720);
  vg.addColorStop(0, `rgba(3,5,10,${velo})`); vg.addColorStop(0.55, `rgba(3,5,10,${velo * 0.75})`); vg.addColorStop(1, "rgba(3,5,10,0)");
  g.fillStyle = vg; g.fillRect(0, 0, 1080, 720);
}

// Una temperatura en su pastilla: «5.500 °C», del color de su estrella.
export const pastillaTemperatura = (g, x, y, grados, rgb, al = 1, tam = 112) => k.pastilla(g, x, y, k.fmt(Math.round(grados)), "°C", rgb, al, tam);

// Un salero de cristal con su tapa de metal, boca abajo según ang, con el centro del cristal en (x, y). Mide unos 200
// × 420 px. La sal se dibuja antes que el cristal, para que se vea a través de él.
export function salero(g, x, y, ang) {
  g.save(); g.translate(x, y); g.rotate(ang);
  // la sal de dentro (con el salero boca abajo, en el lado de la tapa)
  k.redondo(g, -84, -148, 168, 150, 20);
  const sg = g.createLinearGradient(-84, 0, 84, 0);
  sg.addColorStop(0, "#d9dde4"); sg.addColorStop(0.5, "#ffffff"); sg.addColorStop(1, "#c9ced8");
  g.fillStyle = sg; g.fill();
  g.save(); g.globalCompositeOperation = "multiply"; g.globalAlpha *= 0.25; g.drawImage(k.manchas, -84, -148, 168, 150); g.restore();
  // el cristal, con su reflejo
  k.redondo(g, -98, -152, 196, 368, 30);
  k.vidrio(g, -98, 98);
  k.reflejo(g, 52, -120, 12, 300);
  // la tapa de metal, con sus agujeros
  g.beginPath(); g.moveTo(-104, -150); g.lineTo(-104, -186); g.quadraticCurveTo(0, -262, 104, -186); g.lineTo(104, -150); g.closePath();
  k.metal(g, -104, 104);
  g.fillStyle = "#1a1d22";
  for (const [hx, hy] of [[-40, -196], [0, -206], [40, -196], [-20, -178], [20, -178], [-60, -172], [60, -172]]) { g.beginPath(); g.arc(hx, hy, 6, 0, Math.PI * 2); g.fill(); }
  g.restore();
}
