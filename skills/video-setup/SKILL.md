---
name: video-setup
description: "Trigger: doctor, clave, voces, configurar, settings, diagnostico. Diagnostica y configura el entorno de render y audio."
license: Apache-2.0
metadata:
  author: "architect"
  version: "1.0"
---

# Skill: video-setup

## Activation Contract
Activar cuando el usuario solicite configurar el entorno, diagnosticar dependencias (Node, FFmpeg, canvas), configurar la clave de ElevenLabs o seleccionar voces e idiomas.

## Hard Rules
- NUNCA pedir claves de API en el chat. Ejecutar en segundo plano `node motor/clave.mjs`.
- NUNCA pedir al creador que ejecute comandos en la terminal; ejecutarlos con las herramientas locales.
- Validar siempre con `node motor/doctor.mjs` y `node motor/doctor.mjs --red`.
- Si falta una voz de ElevenLabs de la biblioteca, vincularla a la cuenta antes de seleccionarla.

## Decision Gates

| Situación | Acción |
| --- | --- |
| Primera vez o falta Node/canvas/ffmpeg | Correr `npm install` y ejecutar `node motor/doctor.mjs` |
| Falta clave de voz | Lanzar en background `node motor/clave.mjs`, esperar y validar con `doctor.mjs --red` |
| Cambio o selección de voz | Lanzar en background `node motor/voces.mjs` o listar con `node motor/voces.mjs lista` |
| Ajuste de idioma o marca | Ejecutar `node motor/marca.mjs poner idioma <codigo>` |

## Execution Steps
1. Ejecutar `node motor/doctor.mjs` para verificar Node, `@napi-rs/canvas` y FFmpeg.
2. Si la clave no está configurada, iniciar `node motor/clave.mjs` y reportar la URL local.
3. Verificar conectividad y cuota con `node motor/doctor.mjs --red`.
4. Consultar o fijar idioma y voz preferida mediante `node motor/voces.mjs` y `node motor/marca.mjs`.
5. Confirmar estado operativo listo para generación.

## Output Contract
- Estado del entorno (ok/faltan dependencias).
- Idioma y voz configurados.
- Notificación al usuario de que el sistema está listo para recibir ideas de vídeo.

## References
- `motor/LEEME.md` — Arquitectura interna del motor y herramientas CLI.
