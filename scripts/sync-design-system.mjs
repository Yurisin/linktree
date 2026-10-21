#!/usr/bin/env node
// Gera src/styles/tokens.css (variáveis CSS) e src/styles/ad.css (classes ad-) a partir de design-system/.
// Rode depois de exportar o design system de novo: npm run ds:sync. Com --check, só verifica se está em dia.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ds = join(root, "design-system");
const out = join(root, "src/styles");

export function buildTokensCss(tokens) {
  const theme = tokens.color.themes[0].id;
  const lines = [];
  const add = (name, value) => lines.push(`  --${name}: ${value};`);

  for (const t of tokens.color.tokens) add(t.name, t.value[theme]);
  // famílias: o next/font define --font-geist e --font-geist-mono; o fallback vem do tokens.json
  add("font-sans", `var(--font-geist), ${tokens.type.families.sans}`);
  add("font-mono", `var(--font-geist-mono), ${tokens.type.families.mono}`);
  for (const t of tokens.spacing.tokens) add(t.name, t.value);
  for (const t of tokens.radius.tokens) add(t.name, t.value);
  for (const t of tokens.shadow.tokens) add(t.name, t.value[theme]);
  for (const t of tokens.gradient.tokens) add(t.name, t.value);

  return `/* Gerado por scripts/sync-design-system.mjs a partir de design-system/tokens.json. Não edite à mão. */\n:root {\n${lines.join("\n")}\n}\n`;
}

export function buildAdCss(bundle) {
  // as fontes vêm do next/font (sem pedido externo); o resto do bundle segue igual
  const body = bundle.replace(/^@import url\([^)]*fonts\.googleapis[^)]*\);\n*/m, "");
  return `/* Gerado por scripts/sync-design-system.mjs a partir de design-system/components/bundle.css. Não edite à mão. */\n${body}`;
}

export function generate() {
  const tokens = JSON.parse(readFileSync(join(ds, "tokens.json"), "utf8"));
  const bundle = readFileSync(join(ds, "components/bundle.css"), "utf8");
  return {
    [join(out, "tokens.css")]: buildTokensCss(tokens),
    [join(out, "ad.css")]: buildAdCss(bundle),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const files = generate();
  if (process.argv.includes("--check")) {
    const stale = Object.entries(files).filter(([path, css]) => {
      try {
        return readFileSync(path, "utf8") !== css;
      } catch {
        return true;
      }
    });
    for (const [path] of stale) console.error(`desatualizado: ${path} (rode npm run ds:sync)`);
    process.exit(stale.length ? 1 : 0);
  }
  mkdirSync(out, { recursive: true });
  for (const [path, css] of Object.entries(files)) writeFileSync(path, css);
  console.log(`gerado: ${Object.keys(files).join(", ")}`);
}
