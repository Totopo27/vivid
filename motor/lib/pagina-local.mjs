// Una página que sirve este ordenador (127.0.0.1) para que el creador haga algo en su navegador (pegar su clave,
// escuchar y elegir su voz) sin que nada pase por el chat. Solo contesta a sí misma (otra web no puede hacerse pasar
// por ella: se mira el Host, y lo que cambia algo lleva el token de la página), no carga nada de fuera salvo el sonido
// de `media` (lo bloquea su política de seguridad) y se cierra sola al acabar o cuando pasa `espera`.
//
//   paginaLocal({ plantilla, nombre, rutas: { "GET /": (req, res, url) => ..., "POST /": ... }, espera, abrir, media })
// La plantilla es un .html con __NONCE__ y __TOKEN__ (y los __NOMBRE__ que se le pasen a pagina(), escapados).
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { abrirEnSistema } from "./comun.mjs";

const html = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export function paginaLocal({ plantilla, nombre, rutas, espera = 10 * 60 * 1000, abrir = true, media = "" }) {
  const PLANTILLA = readFileSync(plantilla, "utf8"), token = randomBytes(18).toString("hex");
  let puerto = 0;
  const util = {
    token,
    // la página, con su política de seguridad: nada de fuera (letras, imágenes, scripts); los datos, solo de sí misma
    pagina(res, vars = {}, codigo = 200) {
      const nonce = randomBytes(16).toString("base64");
      res.writeHead(codigo, {
        "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "referrer-policy": "no-referrer",
        "x-content-type-options": "nosniff", "x-frame-options": "DENY",
        "content-security-policy": `default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'; img-src data:; connect-src 'self'; ` +
          `${media ? `media-src ${media}; ` : ""}form-action 'self'; base-uri 'none'; frame-ancestors 'none'`,
      });
      let s = PLANTILLA.replaceAll("__NONCE__", nonce).replaceAll("__TOKEN__", token);
      for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`__${k}__`, html(v));
      res.end(s);
    },
    json(res, datos, codigo = 200) {
      res.writeHead(codigo, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" });
      res.end(JSON.stringify(datos));
    },
    texto(res, codigo, t = "") { res.writeHead(codigo, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" }); res.end(t); },
    // lo que llega en una petición (null si es demasiado: aquí solo llegan una clave o una voz)
    cuerpo(req) {
      return new Promise((ok) => {
        let b = "";
        req.on("data", (c) => { b += c; if (b.length > 16384) { ok(null); req.destroy(); } });
        req.on("end", () => ok(b));
        req.on("error", () => ok(null));
      });
    },
    // ya está: lo dice y se cierra (un momento después, para que la respuesta llegue al navegador)
    acabar(msg) { console.log(msg); setTimeout(() => process.exit(0), 300); },
  };
  const srv = createServer(async (req, res) => {
    if (![`127.0.0.1:${puerto}`, `localhost:${puerto}`].includes(req.headers.host)) return util.texto(res, 403, "Solo desde este ordenador.");
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    if (url.pathname === "/favicon.ico") return util.texto(res, 204);
    const ruta = rutas[`${req.method} ${url.pathname}`];
    if (!ruta) return util.texto(res, url.pathname === "/" ? 405 : 404);
    try { await ruta(req, res, url); }
    catch (e) { if (!res.headersSent) util.json(res, { error: `Algo ha fallado: ${e.message}` }, 500); }
  });
  srv.listen(0, "127.0.0.1", async () => {
    puerto = srv.address().port;
    const dir = `http://127.0.0.1:${puerto}/`;
    console.log(`página ${nombre}: ${dir}`);
    // si no se puede abrir el navegador (un Linux sin escritorio), la página sigue esperando: que la abra a mano
    if (abrir && !(await abrirEnSistema(dir))) console.log(`no he podido abrir el navegador: abre tú esa dirección (${dir}) en este ordenador`);
  });
  setTimeout(() => { console.log(`la página ${nombre} se cerró sin acabar (${Math.round(espera / 60000)} min)`); process.exit(1); }, espera);
  return util;
}
