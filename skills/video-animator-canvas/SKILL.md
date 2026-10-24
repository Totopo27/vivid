---
name: video-animator-canvas
description: "Trigger: dibujar, plano, camara 3d, canvas, animacion, look. Construye planos matematicos y animacion 3D determinista sobre Canvas."
license: Apache-2.0
metadata:
  author: "architect"
  version: "1.0"
---

# Skill: video-animator-canvas

## Activation Contract
Activar al crear, editar o revisar planos de animación (`video/planos/*.js`), mundos compartidos (`mundo.js`), cámaras 3D o acabados visuales.

## Hard Rules
- Todo fotograma es función pura de `t`: $f(t) \to \text{Lienzo}$. Prohibido acumular estado entre cuadros.
- Prohibido `Math.random()`. Usar exclusivamente `k.azar(semilla)` para estabilidad determinista.
- Lo pesado (texturas, geometría, estrellas) debe precalculares una sola vez al tope del módulo.
- El tiempo de la voz rige las animaciones: sincronizar usando `v.t("palabra")` o `v.frase(n).t("palabra")`.
- Respetar márgenes seguros de redes sociales y no sobreescribir el área reservada para subtítulos.

## Decision Gates

| Escenario de animación | Técnica requerida |
| --- | --- |
| Objetos en el espacio o rotación | Usar `k.mira(pos, mira)` y proyectar con `k.proyecta(cam, X)` |
| Transición entre planos sin corte | `entrada: "sigue"` y mezclar posiciones con `k.mezV` |
| Movimiento de entrada impactante | `k.entra(k.tramo(t, t0, t1))` |
| Brillos, rayos y fuentes de luz | `g.globalCompositeOperation = "lighter"` restaurando con `save/restore` |

## Execution Steps
1. Revisar los tiempos de las frases en `voz/tiempos.json`.
2. Modelar en `video/mundo.js` los assets compartidos entre planos.
3. Crear planos ordenados `NN-nombre.js` exportando `desde`, `entrada`, `dibuja(g, t)` y eventos de sonido.
4. Validar fotogramas clave sin renderizar mediante `node motor/ver.mjs <proyecto> <segundos>`.
5. Comprobar que cada cuadro compute en menos de 40 ms.

## Output Contract
- Módulos de planos en `video/planos/*.js` limpios, deterministas y comentados.
- Hojas de comprobación generadas en `revisar/` para inspección visual.

## References
- `references/dibujo.md` — Reglas de pantalla y kit 3D.
- `guia/dibujar.md` — Documentación exhaustiva de la API de dibujo y cámara.
- `guia/looks.md` — Parámetros de post-procesamiento de estilos visuales.
