#!/usr/bin/env node
// clave.mjs: abre una página en este ordenador para pegar la clave de ElevenLabs. La guarda en .env.local y se
// cierra. La clave nunca pasa por el chat ni sale del ordenador: la página (motor/clave.html) la sirve este mismo
// ordenador, no carga nada de internet y solo puede enviar el formulario a sí misma (lib/pagina-local.mjs).
import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { RAIZ, argumentos, ayuda } from "./lib/comun.mjs";
import { paginaLocal } from "./lib/pagina-local.mjs";

ayuda(`
node motor/clave.mjs [--sin-abrir]

Abre en el navegador una página de este ordenador para que el creador pegue su clave de ElevenLabs (empieza por sk_),
con los pasos para sacarla y los permisos que hay que marcar. La guarda en .env.local y se cierra sola. Espera hasta
10 minutos: lánzala en segundo plano. La clave nunca se pide en el chat.
--sin-abrir: no abre el navegador; solo dice la dirección (para abrirla a mano).
`);

const { op } = argumentos();
const ENV = join(RAIZ, ".env.local");

// Lo que se pega, sin lo que sobra (espacios, comillas, «ELEVENLABS_API_KEY=» delante), y qué le pasa si no vale.
const limpia = (x) => String(x || "").replace(/["'`\s]/g, "").replace(/^(ELEVENLABS_API_KEY=|xi-api-key:)/i, "");
const problema = (k) => !k ? "Pega la clave en el recuadro."
  : !k.startsWith("sk_") ? "Esa no es la clave: la buena empieza por sk_. El código corto de la lista de claves (el ID) no sirve."
  : !/^sk_[A-Za-z0-9]{20,}$/.test(k) ? "Le falta un trozo o le sobra algo: cópiala entera, tal cual." : "";

// .env.local con la clave nueva (lo demás que hubiera, se queda). Solo la puede leer quien la escribe.
function guardar(k) {
  const antes = existsSync(ENV) ? readFileSync(ENV, "utf8").replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim() && !/^\s*(export\s+)?ELEVENLABS_API_KEY\s*=/.test(l)) : [];
  writeFileSync(ENV, [...antes, `ELEVENLABS_API_KEY=${k}`].join("\n") + "\n", { mode: 0o600 });
  try { chmodSync(ENV, 0o600); } catch { /* en Windows los permisos van por usuario */ }
}

const web = paginaLocal({
  nombre: "de la clave", plantilla: join(RAIZ, "motor", "clave.html"), abrir: !op["sin-abrir"],
  rutas: {
    "GET /": (req, res) => web.pagina(res, { ESTADO: "pedir", ERROR: "" }),
    "POST /": async (req, res) => {
      const cuerpo = await web.cuerpo(req);
      if (cuerpo === null) return;
      const datos = new URLSearchParams(cuerpo), mal = (error, codigo) => web.pagina(res, { ESTADO: "pedir", ERROR: error }, codigo);
      if (datos.get("t") !== web.token) return mal("Esta página ha caducado: vuelve a abrirla desde el chat.", 403);
      const k = limpia(datos.get("k")), p = problema(k);
      if (p) return mal(p, 400);
      try { guardar(k); }
      catch (e) { return mal(`No he podido guardarla en .env.local (${e.code || e.message}). Mira que la carpeta no sea de solo lectura.`, 500); }
      web.pagina(res, { ESTADO: "guardada", ERROR: "" });
      web.acabar("clave guardada en .env.local"); // nunca la clave
    },
  },
});
