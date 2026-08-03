/* Empaqueta public/ en un único nappy.html autocontenido.
   Útil para abrir la app sin servidor o compartirla como un solo archivo.
   Uso: node build-standalone.mjs                                        */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => fs.readFileSync(path.join(root, "public", p), "utf8");

const css = read("styles.css");
const js = read("app.js");
const icon = fs.readFileSync(path.join(root, "public/icons/apple-touch-icon.png")).toString("base64");

let html = read("index.html");
const body = html.match(/<body>([\s\S]*)<\/body>/)[1]
  .replace(/\s*<script src="app\.js"><\/script>/, "");

const out = `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="theme-color" content="#070a1c">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Nappy">
<link rel="apple-touch-icon" href="data:image/png;base64,${icon}">
<title>Nappy — Sueño del bebé</title>
<style>
${css}
</style>
${body}
<script>
${js.replace(/if \("serviceWorker"[\s\S]*?\n}\n/, "")}
</script>
`;

fs.writeFileSync(path.join(root, "nappy.html"), out);
console.log(`nappy.html — ${(out.length / 1024).toFixed(1)} kB`);
