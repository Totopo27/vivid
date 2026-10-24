---
name: video-audio-sfx
description: "Trigger: sonido, sfx, efectos de sonido, audio track. Compone la pista de efectos de sonido alineada a las colisiones y animaciones 3D."
license: Apache-2.0
metadata:
  author: "architect"
  version: "1.0"
---

# Skill: video-audio-sfx

## Activation Contract
Activar cuando se configuren, sincronicen o auditen los efectos de sonido y colisiones del vídeo (`sonidos.js`).

## Hard Rules
- Usar únicamente efectos de sonido aprobados existentes en la carpeta `sonidos/`.
- El timing del sonido debe importarse de las constantes exportadas por los planos (ej. `export const choques = [...]`).
- Mantener volumen equilibrado sin saturar la pista vocal.
- Generar la pista y firma con `node motor/sonido.mjs <proyecto>`.

## Decision Gates

| Evento visual | Efecto recomendado |
| --- | --- |
| Impacto o colisión contundente | `golpe.wav`, `golpe-hondo.wav` o `roca.wav` |
| Movimiento veloz, desplazamiento o cámara | `aire.mp3` o `desliza.mp3` |
| Aparición de texto clave o dato | `toque.mp3`, `clic.mp3` o `timbre.wav` |
| Tensión sostenida o expectativa | `late.mp3` o `tic.mp3` |

## Execution Steps
1. Extraer los instantes de colisión y transición desde los planos en `video/planos/`.
2. Estructurar `sonidos.js` asociando cada segundo `t` con su efecto correspondiente.
3. Compilar la pista con `node motor/sonido.mjs <proyecto>`.
4. Validar que `sonidos/efectos.wav` y `sonidos/efectos.json` coincidan sin artefactos.

## Output Contract
- Archivo `sonidos.js` sincronizado con la geometría del proyecto.
- Archivo de audio `sonidos/efectos.wav` renderizado y validado.

## References
- `references/sonidos.md` — Listado de efectos aprobados.
- `guia/sonido.md` — Principios de diseño sonoro y mezcla.
