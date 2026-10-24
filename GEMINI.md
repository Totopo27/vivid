# Directivas para Gemini (Google AI / Gemini CLI)

@AGENTS.md

## Directivas Específicas para Modelos Gemini 3+ / 3.8+ (Flash & Pro)

1. **Carga Contextual Modular:** Invocar la skill atómica correspondiente en `skills/<nombre>/SKILL.md` según la etapa (scripting, dibujo Canvas 3D, audio SFX, QA/render). Evitar arrastrar todo el contexto del repositorio innecesariamente.
2. **Determinismo Estricto:** Los planos en `video/planos/*.js` deben ser funciones puras $f(t) \to \text{Lienzo}$. Prohibido generar código que asuma frameworks de frontend, hooks o timers asíncronos (`setTimeout`, `setInterval`).
3. **Mapeo de Tiempos de Audio:** El audio y los fonemas provienen de ElevenLabs vía `node motor/voz.mjs`; usar exclusivamente `v.t("palabra")` para guiar keyframes matemáticos.
4. **Verificación de Regresión:** Validar siempre con `node motor/pruebas-rapidas.mjs` antes de finalizar cualquier cambio.
