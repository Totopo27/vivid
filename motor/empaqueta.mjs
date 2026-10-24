#!/usr/bin/env node
// empaqueta.mjs: el .zip de la carpeta para dársela a otra persona, sin nada de quien la usa (su clave, sus
// preferencias, su marca, sus vídeos): solo lo que está en git, tal cual está en el último commit.
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { RAIZ, ayuda, fallo, leerJson } from "./lib/comun.mjs";

const paquete = leerJson(join(RAIZ, "package.json")), producto = paquete.productName || "Videos-virales-3d";

ayuda(`
node motor/empaqueta.mjs

Hace ../${producto}-<versión>.zip (al lado de esta carpeta) con lo del último commit de git, dentro de una carpeta
${producto}/ (el nombre sale de "productName" en package.json). Nunca lleva .env.local, preferencias.md, marca.json,
maquina.md, proyectos/ ni salida/ (no están en git). Antes: node motor/pruebas.mjs, y que git status no tenga nada sin
guardar. Solo necesita git: vale igual en Mac, Windows y Linux.
`);

const git = (...a) => { try { return execFileSync("git", ["-C", RAIZ, ...a], { encoding: "utf8", maxBuffer: 1 << 26 }).trim(); } catch (e) { fallo(`git ${a[0]}: ${String(e.stderr || e.message).trim()} (empaquetar necesita git y el repositorio de la carpeta).`); } };
const cambios = git("status", "--porcelain", "--untracked-files=no");
if (cambios) fallo(`Hay cambios sin guardar en git (no irían en el zip):\n${cambios}\nGuárdalos (git commit) o deshazlos antes de empaquetar.`);
// lo que va a llevar el zip es lo del último commit: se mira antes de hacerlo (sin unzip, que no hay en Windows)
const dentro = git("ls-tree", "-r", "-z", "--name-only", "HEAD").split("\0").filter(Boolean);
const malos = dentro.filter((f) => /(^|\/)(\.env\.local|preferencias\.md|marca\.json|maquina\.md)$/.test(f) || /^(proyectos|salida)\/(?!\.gitkeep$)/.test(f));
if (malos.length) fallo(`El zip llevaría cosas de quien la usa: ${malos.join(", ")}. Sácalas de git (git rm --cached).`);
const zip = join(RAIZ, "..", `${producto}-${paquete.version}.zip`);
git("archive", "--format=zip", `--prefix=${producto}/`, "-o", zip, "HEAD");
console.log(`${zip} (${dentro.length} archivos), versión ${paquete.version}`);
