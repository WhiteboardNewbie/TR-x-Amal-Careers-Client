import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const allowed = new Set([
  "app/globals.css",
  "docs/branding.md",
  "scripts/check-amal-colours.mjs",
]);
const skipNames = new Set(["node_modules", ".next", ".git", "public"]);

const banned = [
  {
    name: "Tailwind red/blue (use amal-red or amal-blue)",
    re: /(?<!amal-)(?:text|bg|border|ring|from|to|via|outline|fill|stroke|decoration)-(?:red|blue|indigo|rose|orange|sky|cyan)-/,
  },
  {
    name: "hex other than tokens (tokens live in globals.css)",
    re: /#(?:002060|002[Bb]5[Cc]|f{3}|ff0000|0000ff)\b/i,
  },
  {
    name: "raw Amal hex outside globals.css / branding.md",
    re: /#(?:ff3333|334cff)/i,
  },
  {
    name: "raw Amal rgb outside tokens",
    re: /rgba?\(\s*(?:255\s*,\s*51\s*,\s*51|51\s*,\s*76\s*,\s*255)/,
  },
];

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (skipNames.has(name)) {
      continue;
    }
    const full = join(dir, name);
    const rel = relative(root, full).replaceAll("\\", "/");
    if (rel.startsWith("docs/mockups")) {
      continue;
    }
    const info = statSync(full);
    if (info.isDirectory()) {
      walk(full, files);
      continue;
    }
    if (/\.(ts|tsx|css|mjs|js)$/.test(name)) {
      files.push(rel);
    }
  }
  return files;
}

const failures = [];

for (const file of walk(root)) {
  if (allowed.has(file)) {
    continue;
  }
  const text = readFileSync(join(root, file), "utf8");
  for (const rule of banned) {
    if (rule.re.test(text)) {
      failures.push(`${file}: ${rule.name}`);
    }
  }
}

if (failures.length) {
  console.error("Other red or blue found. Use --amal-red / --amal-blue.");
  for (const line of failures) {
    console.error(`  ${line}`);
  }
  process.exit(1);
}

console.log("Amal red and blue only.");
