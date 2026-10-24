// Las muestras de la ciudad (guia/muestras/ciudad.jpg): un edificio de día y de noche, los cuatro tipos de fachada, la
// ciudad entera de día, de noche y al anochecer, volando entre los edificios, y el perfil de una ciudad para los fondos.
// Cada una pinta un cuadrado de 1080 × 1080 (lo de arriba del lienzo de 1080 × 1920): se baja la imagen 420 píxeles
// para que el centro de la cámara (y = 960) quede en el centro del cuadrado.
import * as k from "#kit";

const L = 1080;
const una = {};
const laCiudad = () => una.c || (una.c = k.ciudad(7, {}));
// un edificio con sus vecinos, sobre su suelo
const calle = () => una.calle || (una.calle = { edificios: [k.unEdificio(4, { h: 150, w: 34, d: 28, tipo: "cristal", antena: 30 }), k.unEdificio(9, { x: -46, z: -34, h: 66, w: 28, d: 26, tipo: "viviendas" }), k.unEdificio(11, { x: 38, z: -52, h: 42, w: 24, d: 30, tipo: "ladrillo" }), k.unEdificio(13, { x: -40, z: 34, h: 28, w: 26, d: 22, tipo: "oficinas" })], manzanas: [{ x0: -70, z0: -80, x1: 60, z1: 60 }] });
const vista = (g, cam, c, t, op) => { g.translate(0, -420); k.cieloCiudad(g, cam, op); k.dibujaCiudad(g, cam, c, t, op); };

export default [
  ["edificio(g, cam, unEdificio(semilla, …), t)", (g) => vista(g, k.mira([130, 34, 250], [0, 78, 0]), calle(), 0.3, { noche: 0 })],
  ["… de noche (noche: 1)", (g) => vista(g, k.mira([130, 34, 250], [0, 78, 0]), calle(), 0.3, { noche: 1 })],
  ["FACHADAS: cristal, oficinas, viviendas, ladrillo", (g) => {
    const c = una.tipos || (una.tipos = { edificios: k.FACHADAS.map((tipo, i) => k.unEdificio(20 + i, { x: (i - 1.5) * 34, z: 0, h: [96, 70, 52, 40][i], w: 24, d: 24, tipo })), manzanas: [{ x0: -75, z0: -20, x1: 75, z1: 20 }] });
    vista(g, k.mira([30, 30, 150], [0, 42, 0]), c, 0, { noche: 0 });
  }],
  ["ciudad(semilla) · dibujaCiudad(g, cam, c, t)", (g) => vista(g, k.mira([-310, 210, 430], [10, 30, -40]), laCiudad(), 1, { noche: 0 })],
  ["… de noche: ventanas, farolas, coches", (g) => vista(g, k.mira([-310, 210, 430], [10, 30, -40]), laCiudad(), 1, { noche: 1 })],
  ["… al anochecer (noche: 0,6)", (g) => vista(g, k.mira([380, 150, 380], [0, 60, 0]), laCiudad(), 1, { noche: 0.6, sol: [0.7, 0.12, -0.7] })],
  ["volando entre los edificios (de día)", (g) => vista(g, k.mira([45, 26, 230], [45, 34, 0]), laCiudad(), 1, { noche: 0 })],
  ["… y de noche", (g) => vista(g, k.mira([45, 26, 230], [45, 34, 0]), laCiudad(), 1, { noche: 1 })],
  ["perfilCiudad(g, semilla, y, { noche })", (g) => {
    let gr = g.createLinearGradient(0, 0, 0, 540); gr.addColorStop(0, "#5e8ccc"); gr.addColorStop(1, "#d6e0ea"); g.fillStyle = gr; g.fillRect(0, 0, L, 540);
    k.perfilCiudad(g, 5, 540, { noche: 0, alto: 430 });
    gr = g.createLinearGradient(0, 540, 0, L); gr.addColorStop(0, "#090b1c"); gr.addColorStop(1, "#4a3050"); g.fillStyle = gr; g.fillRect(0, 540, L, 540);
    k.perfilCiudad(g, 3, L, { noche: 1, alto: 430 });
  }],
];
