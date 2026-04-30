import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), "..");

function loadTsAsCjsModule(absPath) {
  const source = fs.readFileSync(absPath, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
    },
    fileName: absPath,
  }).outputText;

  const module = { exports: {} };
  const sandbox = {
    module,
    exports: module.exports,
    require,
    __filename: absPath,
    __dirname: path.dirname(absPath),
    console,
  };

  vm.runInNewContext(compiled, sandbox, { filename: absPath });
  return module.exports;
}

function stripDiacritics(input) {
  return String(input ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeText(input) {
  return stripDiacritics(String(input ?? ""))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCompact(input) {
  return stripDiacritics(String(input ?? ""))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function tokenSet(input) {
  const n = normalizeText(input);
  if (!n) return new Set();
  return new Set(n.split(" ").filter(Boolean));
}

function overlapScore(a, b) {
  const ta = tokenSet(a);
  const tb = tokenSet(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let common = 0;
  for (const t of ta) if (tb.has(t)) common++;
  return common / Math.max(ta.size, tb.size);
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function isImageFileName(name) {
  const ext = path.extname(name).slice(1).toLowerCase();
  return ["avif", "webp", "jpg", "jpeg", "png", "gif", "svg"].includes(ext);
}

function safeImageStem(name) {
  const raw = String(name ?? "").trim();
  // Prefer slash-removed variant for Einhell codes like 2025/2 -> 20252
  return raw
    .replace(/[\/\\]/g, "")
    .replace(/[<>:"|?*]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const productsModule = loadTsAsCjsModule(path.join(repoRoot, "src", "data", "products.index.ts"));
const sourcesModule = loadTsAsCjsModule(path.join(repoRoot, "src", "data", "materialSources.ts"));

const productsIndex = productsModule.productsIndex ?? [];
const materialSourceById = sourcesModule.materialSourceById ?? {};

const publicDir = path.join(repoRoot, "public");
const einhellFlatDir = path.join(publicDir, "photo", "EINHELL");

if (!fs.existsSync(einhellFlatDir)) {
  console.error(`Missing folder: ${einhellFlatDir}`);
  process.exitCode = 2;
  process.exit(2);
}

const flatFiles = fs
  .readdirSync(einhellFlatDir, { withFileTypes: true })
  .filter((e) => e.isFile() && isImageFileName(e.name))
  .map((e) => ({
    name: e.name,
    abs: path.join(einhellFlatDir, e.name),
    norm: normalizeText(e.name.replace(/\.[^.]+$/, "")),
    compact: normalizeCompact(e.name.replace(/\.[^.]+$/, "")),
    ext: path.extname(e.name).toLowerCase(),
  }));

const einhellProducts = productsIndex.filter((p) => {
  const src = materialSourceById[p.sourceId];
  return src?.photoDir?.startsWith("/photo/Einhell/");
});

let copied = 0;
let skipped = 0;
let missing = 0;

for (const p of einhellProducts) {
  const src = materialSourceById[p.sourceId];
  const photoDirUrl = src.photoDir; // /photo/Einhell/<CATEGORY>
  const targetDir = path.join(publicDir, photoDirUrl.replace(/^\//, ""));
  ensureDir(targetDir);

  const stem = safeImageStem(p.name);
  const targetBase = `${stem}-1`;
  const existing = [".avif", ".webp", ".jpg", ".jpeg", ".png", ".gif", ".svg"]
    .map((ext) => path.join(targetDir, `${targetBase}${ext}`))
    .find((abs) => fs.existsSync(abs));
  if (existing) {
    skipped++;
    continue;
  }

  const nameNorm = normalizeText(p.name);
  const nameCompact = normalizeCompact(p.name);
  if (!nameNorm) {
    missing++;
    continue;
  }

  // Prefer strong substring matches on the code/name (common for Einhell).
  const strong = flatFiles.filter((f) =>
    (nameNorm && f.norm.includes(nameNorm)) || (nameCompact && f.compact.includes(nameCompact)),
  );

  let candidates = strong;
  if (candidates.length === 0) {
    // Fallback: token overlap.
    const scored = flatFiles
      .map((f) => ({ f, score: overlapScore(p.name, f.name) }))
      .filter((x) => x.score >= 0.55)
      .sort((a, b) => b.score - a.score || a.f.name.length - b.f.name.length);
    candidates = scored.map((x) => x.f);
  }

  if (candidates.length === 0) {
    missing++;
    continue;
  }

  // Choose the shortest strong match to avoid "produit_page" etc.
  const best = candidates.slice().sort((a, b) => a.name.length - b.name.length)[0];
  const dest = path.join(targetDir, `${targetBase}${best.ext}`);

  fs.copyFileSync(best.abs, dest);
  copied++;
}

console.log(`Einhell products: ${einhellProducts.length}`);
console.log(`Copied:          ${copied}`);
console.log(`Skipped:         ${skipped}`);
console.log(`Still missing:   ${missing}`);
console.log(`Source flat dir: ${einhellFlatDir}`);
console.log(`Target base dir: ${path.join(publicDir, "photo", "Einhell")}`);

process.exitCode = missing ? 1 : 0;
