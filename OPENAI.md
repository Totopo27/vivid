# Directivas para OpenAI (Codex / GPT-4o / GPT-5+)

@AGENTS.md

## Directivas Específicas para Modelos OpenAI

1. **Carga Contextual Modular:** Cargar bajo demanda la skill en `skills/<nombre>/SKILL.md` acorde a la fase de trabajo en lugar de inyectar todo el histórico de guías.
2. **Determinismo Gráfico en Canvas:** Cada plano es función pura de tiempo $f(t) \to \text{Lienzo}$. Prohibido `Math.random()`; usar exclusivamente `k.azar(semilla)`. No persistir mutaciones en `g` sin envolverlas en `g.save()` y `g.restore()`.
3. **Coordinación de Voz y Movimiento:** Extraer marcas de tiempo exactas usando `#voz` (`v.t("palabra")`) sin asumir duraciones estáticas por frase.
4. **Verificación Local:** Ejecutar `node motor/pruebas-rapidas.mjs` como compuerta de validación obligatoria.
