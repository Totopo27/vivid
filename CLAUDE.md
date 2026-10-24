# Directivas para Claude (Claude Code / Anthropic)

@AGENTS.md

## Directivas Específicas para Modelos Claude 3.5 / 3.7+ Sonnet & Opus

1. **Carga Contextual Modular:** Cargar bajo demanda únicamente la skill requerida en `skills/<nombre>/SKILL.md` según la fase activa del pipeline. No precargar el manual completo si la tarea es acotada.
2. **Determinismo y Rendimiento:** Toda escena en `video/planos/*.js` es función pura de `t`: $f(t) \to \text{Lienzo}$. Prohibido `Math.random` o closures que acumulen estado entre frames.
3. **Sincronización Fonética:** Coordinar los eventos de animación (`k.tramo`, `k.entra`, `k.pulso`) estrictamente con las marcas temporales de voz provistas por `v.t("palabra")`.
4. **Verificación Automática:** Ejecutar `node motor/pruebas-rapidas.mjs` antes de reportar completada cualquier tarea sobre el motor o los planos.
