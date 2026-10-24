# Videos-Virales-3D

Motor local en Node.js que genera vídeos verticales en 9:16 listos para publicar. Toma un texto o guion estructurado, renderiza escenas 3D cuadro por cuadro sobre Canvas sin levantar navegadores, sincroniza las palabras exactas con audio neuronal de ElevenLabs y monta subtítulos y efectos de sonido en un archivo MP4 final con FFmpeg.

Todo corre en tu máquina. Nada se envía a servidores de terceros salvo la petición de voz a ElevenLabs.

---

## Cómo funciona

El proceso evita frameworks pesados de frontend o capturas de pantalla de Chrome:

1. **Guion y tiempos:** Cada escena define su texto y sus planos. El motor calcula las marcas de tiempo exactas por palabra desde la respuesta de voz (`v.t("palabra")`).
2. **Dibujo Canvas 2D/3D:** Los planos en `motor/kit/` y `guia/dibujar.md` son funciones deterministas $f(t) \to \text{Lienzo}$. Dado un tiempo $t$, el fotograma resultante es idéntico en cualquier ejecución.
3. **Subtítulos y audio:** Monta estilos de texto (karaoke palabra por palabra, minimal, gigante, etc.) usando fuentes locales Figtree y mezcla pistas de efectos de sonido (`sonidos/`) directo en el canal de audio.
4. **Compilación de video:** Los buffers RGBA pasan por tubería directa a un subproceso de FFmpeg para codificar H.264 a 60 fotogramas por segundo.

---

## Requisitos

- **Node.js**: Versión 20 o superior.
- **FFmpeg**: Instalado en el sistema y visible en PATH o en las rutas estándar del sistema operativo.

---

## Puesta en marcha

1. Clona el repositorio e instala dependencias:
   ```bash
   git clone https://github.com/Totopo27/vivid.git
   cd vivid
   npm install
   ```

2. Verifica que tu entorno tiene todo lo necesario:
   ```bash
   npm run doctor
   ```
   El diagnóstico te dirá si falta FFmpeg, si la fuente tipográfica cargó bien o si necesitas configurar la voz.

3. Configura tu voz de ElevenLabs:
   ```bash
   npm run clave
   ```
   Abre una interfaz web local en tu navegador para ingresar la API key. La clave se almacena exclusivamente en tu archivo local `.env.local` (ignorado por Git).

---

## Comandos habituales

- `npm run doctor`  
  Revisa Node, FFmpeg, Canvas nativo, tipografía y estado de claves locales.
- `npm run clave`  
  Abre el asistente local para guardar o validar tu clave de ElevenLabs.
- `npm run pruebas`  
  Ejecuta las pruebas de regresión gráfica comparando fotogramas de prueba contra las referencias aprobadas.
- `npm run marca`  
  Muestra o actualiza los ajustes globales (idioma predeterminado, estilo de subtítulos, firma y volumen).
- `npm run muestras`  
  Regenera las hojas de contacto visual con los estilos y componentes 3D disponibles.

---

## Estructura del proyecto

- `motor/`: Código fuente del motor, utilidades de compilación, parser de argumentos y scripts CLI.
- `motor/kit/`: Librería de dibujo 3D determinista (cámara, iluminación, personas, ciudades, agua, escalas).
- `guia/`: Documentación técnica sobre dibujo, formatos, composición y diseño de guiones.
- `ejemplo/`: Casos de prueba completos listos para renderizar (`alcohol`, `estrella-verde`).
- `letra/`: Tipografías Figtree en formato TTF para renderizado tipográfico sin dependencias del sistema.
- `sonidos/`: Biblioteca de efectos de audio en WAV/MP3 organizados para colisiones y eventos.
- `proyectos/`: Directorio donde se crean las carpetas de trabajo de cada vídeo nuevo.
- `salida/`: Destino de exportación de los vídeos MP4 finales.
- `skills/`: Instrucciones modulares para agentes de asistencia en el flujo de trabajo.

---

## Configuración y variables

Copia `.env.example` a `.env.local` si prefieres definir tus credenciales a mano:

```bash
ELEVENLABS_API_KEY=tu_api_key_aqui
```

Los archivos de configuración personal (`preferencias.md`, `marca.json`, `maquina.md`) y las carpetas de salida (`salida/`, `proyectos/`) están excluidos del control de versiones para evitar filtraciones accidentales.
