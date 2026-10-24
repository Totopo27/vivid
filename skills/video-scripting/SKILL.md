---
name: video-scripting
description: "Trigger: guion, idea, nuevo video, hook, formato de video. Disena la estructura narrativa, investiga datos y genera guion.json."
license: Apache-2.0
metadata:
  author: "architect"
  version: "1.0"
---

# Skill: video-scripting

## Activation Contract
Activar al recibir una idea de vídeo, solicitud de guion, reel o planificación narrativa antes de generar planos 3D.

## Hard Rules
- El hook debe durar entre 8 y 10 s (primeras 2 o 3 frases). La primera frase nombra el tema de forma directa e impactante desde el fotograma 0.
- Cada frase debe describir una acción visible o una comparación tangible con objetos cotidianos.
- Todo número o término técnico debe aterrizarse a comparaciones cotidianas de escala humana.
- Todo guion debe generarse mediante `node motor/nuevo.mjs "<idea>" --formato <formato>`.
- Generar el audio con `node motor/voz.mjs <proyecto>` de una sola toma sin recortar palabras.

## Decision Gates

| Tipo de idea | Formato a elegir |
| --- | --- |
| Duda o incógnita intrigante ("¿Por qué...?") | `pregunta` |
| Fenómeno que desafía la física o intuición | `imposible` |
| Creencia popular incorrecta | `mito` |
| Proporciones astronómicas o microscópicas | `escala` |
| Evento cronológico con giro de tuerca | `historia` |
| Dos elementos enfrentados con datos | `comparacion` |

## Execution Steps
1. Seleccionar el formato narrativo adecuado consultando `references/guia.md`.
2. Crear la estructura del proyecto con `node motor/nuevo.mjs "<idea>" --formato <formato>`.
3. Documentar en `idea.md` los 5 elementos clave: dato sorprendente, regla que rompe, mecanismo paso a paso, cifras y comparaciones cotidianas.
4. Redactar `guion.json` con palabras clave destacadas y etiquetas de fonética (`dicho`) si se leen distinto.
5. Invocar `node motor/voz.mjs <proyecto>` para validar el guion y generar `voz/tiempos.json`.

## Output Contract
- Carpeta en `proyectos/<slug>/` creada.
- Archivo `idea.md` documentado con fuentes.
- Archivo `guion.json` válido con hook y frases estructuradas.
- Pistas de voz generadas con marcas de tiempo fonéticas palabra por palabra.

## References
- `references/guia.md` — Resumen de formatos y reglas narrativas.
- `guia/formatos.md` — Definición detallada de los 8 formatos.
- `guia/guion.md` — Principios de redacción para impacto visual.
