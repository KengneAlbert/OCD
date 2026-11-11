// Copie les drapeaux (SVG 3:2) des pays de config/countries.ts dans public/flags/.
// Source : country-flag-icons (licence MIT). Usage : npm run flags
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const source = join(dirname(require.resolve("country-flag-icons/package.json")), "3x2");
const codes = [...readFileSync("config/countries.ts", "utf8").matchAll(/code: "([A-Z]{2})"/g)].map((m) => m[1]);
mkdirSync("public/flags", { recursive: true });

let copied = 0;
const missing = [];
for (const code of new Set(codes)) {
  const file = join(source, `${code}.svg`);
  if (!existsSync(file)) {
    missing.push(code);
    continue;
  }
  copyFileSync(file, join("public/flags", `${code.toLowerCase()}.svg`));
  copied++;
}
console.log(`${copied} drapeaux copiés dans public/flags.${missing.length ? ` Introuvables : ${missing.join(", ")}` : ""}`);
