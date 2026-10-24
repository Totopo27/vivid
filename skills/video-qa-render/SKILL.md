---
name: video-qa-render
description: "Trigger: render, comprobar, revisar, exportar mp4, calidad de video. Audita fotogramas, detecta anomalias de corte y renderiza en MP4."
license: Apache-2.0
metadata:
  author: "architect"
  version: "1.0"
---

# Skill: video-qa-render

## Activation Contract
Activar antes y durante la entrega final del vídeo para validar cortes, revisar quietud/solapamientos y exportar a MP4.

## Hard Rules
- Correr `node motor/comprobar.mjs <proyecto>` a 4 fps antes de cualquier render final. Corregir cualquier advertencia crítica.
- La duración total del vídeo debe apegarse al rango establecido en la marca o guion.
- Nunca renderizar si el guion fue alterado después de generar la pista de voz sin haber actualizado el audio primero.
- El render final en MP4 se ejecuta mediante `node motor/render.mjs <proyecto>`.

## Decision Gates

| Hallazgo en QA | Acción correctiva |
| --- | --- |
| Texto de subtítulo colisiona con objeto clave | Reposicionar cámara o añadir velo oscuro suave |
| Fotogramas estáticos por más de 1.5 s | Añadir movimiento continuo de cámara o partícula |
| Animación cruza abruptamente el corte del plano | Ajustar tramo temporal para culminar antes del cambio |
| Validación exitosa | Ejecutar `node motor/render.mjs <proyecto>` |

## Execution Steps
1. Correr `node motor/revisar.mjs <proyecto>` y generar hojas de contacto (`corte-2.jpg`, `planos.jpg`).
2. Abrir visualizaciones con `node motor/abrir.mjs` para confirmación visual humana.
3. Ejecutar `node motor/comprobar.mjs <proyecto>` para verificar umbrales automáticos.
4. Renderizar el vídeo final con `node motor/render.mjs <proyecto>`.
5. Comprobar que el archivo resultante en `salida/<slug>.mp4` reproduzca sin pérdida de cuadros ni desfase de audio.

## Output Contract
- Reporte de validación técnica sin errores de corte.
- Hojas de revisión generadas en `revisar/`.
- Archivo de vídeo final en `salida/<slug>.mp4` listo para distribución.

## References
- `motor/LEEME.md` — Parámetros de render y umbrales de comprobación.
