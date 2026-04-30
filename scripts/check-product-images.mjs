import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), "..");
const require = createRequire(import.meta.url);

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

function fileExists(p) {
  try {
    fs.accessSync(p, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function stripDiacritics(input) {
  return String(input ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function slugify(input) {
  return stripDiacritics(String(input ?? ""))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeBaseName(fileName) {
  const noExt = String(fileName ?? "").replace(/\.[^.]+$/, "");
  return noExt.replace(/-\d+$/, "").trim();
}

function tokenOverlapScore(aSlug, bSlug) {
  const a = String(aSlug ?? "").split("-").filter(Boolean);
  const b = String(bSlug ?? "").split("-").filter(Boolean);
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  let common = 0;
  for (const t of a) if (setB.has(t)) common++;
  return common / Math.max(a.length, b.length);
}

const dirIndexCache = new Map();

function listImageEntries(photoDirDisk) {
  const cached = dirIndexCache.get(photoDirDisk);
  if (cached) return cached;

  const out = [];
  const exts = new Set(["avif", "webp", "jpg", "jpeg", "png", "gif", "svg"]);
  let entries = [];
  try {
    entries = fs.readdirSync(photoDirDisk, { withFileTypes: true });
  } catch {
    dirIndexCache.set(photoDirDisk, out);
    return out;
  }

  for (const e of entries) {
    if (!e.isFile()) continue;
    const ext = path.extname(e.name).slice(1).toLowerCase();
    if (!exts.has(ext)) continue;
    const baseName = normalizeBaseName(e.name);
    const s = slugify(baseName);
    if (!s) continue;
    out.push({ baseName, slug: s, compact: s.replace(/-/g, "") });
  }

  dirIndexCache.set(photoDirDisk, out);
  return out;
}

function buildImageCandidates(photoDir, productName) {
  if (!photoDir) return [];
  const raw = String(productName ?? "").trim();

  const safeSpaces = raw
    .replace(/[<>:"/\\|?*]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const pipeUnderscore = raw.replace(/\|/g, "_");

  const slashRemoved = raw
    .replace(/[\/\\]/g, "")
    .replace(/[<>:"|?*]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const stems = Array.from(new Set([raw, pipeUnderscore, safeSpaces, slashRemoved].filter(Boolean)));
  const exts = ["avif", "webp", "jpg", "jpeg", "png", "gif", "svg"];
  const suffixes = ["", "-1", "-2", "-3", "-4", "-5"];
  const out = [];
  for (const stem of stems) {
    const base = `${photoDir}/${stem}`;
    const encodedBase = encodeURI(base);
    for (const suf of suffixes) {
      for (const ext of exts) {
        out.push(`${encodedBase}${suf}.${ext}`);
      }
    }
  }
  return out;
}

function findAnyImage({ photoDirUrl, productName, productSlug }) {
  if (!photoDirUrl || (!productName && !productSlug)) return null;

  const publicDir = path.join(repoRoot, "public");
  const photoDirDisk = path.join(publicDir, photoDirUrl.replace(/^\//, ""));
  if (!fileExists(photoDirDisk)) return { ok: false, reason: "missing-photoDir", photoDirDisk };

  const candidates = buildImageCandidates(photoDirUrl, productName);
  for (const url of candidates) {
    const rel = String(url).replace(/^\//, "");
    const abs = path.join(publicDir, decodeURI(rel));
    if (fileExists(abs)) return { ok: true, match: "candidate", file: abs, photoDirDisk };
  }

  // Fallback: image exists in folder but name does not match current candidate rules.
  const targetSlug = String(productSlug ?? "") || slugify(productName);
  const targetCompact = targetSlug.replace(/-/g, "");
  const files = listImageEntries(photoDirDisk);

  for (const f of files) {
    if (f.slug === targetSlug) return { ok: true, match: "fuzzy", example: f.baseName, photoDirDisk };
    if (targetSlug.startsWith(`${f.slug}-`) && f.slug.split("-").length >= 3) {
      return { ok: true, match: "fuzzy", example: f.baseName, photoDirDisk };
    }
    if (f.slug.startsWith(`${targetSlug}-`) && targetSlug.split("-").length >= 3) {
      return { ok: true, match: "fuzzy", example: f.baseName, photoDirDisk };
    }
    if (f.compact === targetCompact) return { ok: true, match: "fuzzy", example: f.baseName, photoDirDisk };
    if (targetCompact.length >= 6 && f.compact.includes(targetCompact)) {
      return { ok: true, match: "fuzzy", example: f.baseName, photoDirDisk };
    }
    if (f.compact.length >= 6 && targetCompact.includes(f.compact)) {
      return { ok: true, match: "fuzzy", example: f.baseName, photoDirDisk };
    }
  }

  let best = 0;
  let bestExample = null;
  for (const f of files) {
    const score = tokenOverlapScore(targetSlug, f.slug);
    if (score > best) {
      best = score;
      bestExample = f.baseName;
    }
  }

  if (best >= 0.55) return { ok: true, match: "fuzzy", example: bestExample, score: best, photoDirDisk };
  return { ok: false, reason: "no-image-file", bestScore: best, photoDirDisk };
}

const productsModule = loadTsAsCjsModule(path.join(repoRoot, "src", "data", "products.index.ts"));
const sourcesModule = loadTsAsCjsModule(path.join(repoRoot, "src", "data", "materialSources.ts"));

const productsIndex = productsModule.productsIndex ?? [];
const materialSourceById = sourcesModule.materialSourceById ?? {};

const missing = [];
const missingSource = [];
let okCandidate = 0;
let okFuzzy = 0;

for (const p of productsIndex) {
  const src = materialSourceById[p.sourceId];
  if (!src) {
    missingSource.push({ id: p.id, slug: p.slug, name: p.name, sourceId: p.sourceId });
    continue;
  }

  const res = findAnyImage({ photoDirUrl: src.photoDir, productName: p.name, productSlug: p.slug });
  if (res?.ok) {
    if (res.match === "candidate") okCandidate++;
    else okFuzzy++;
    continue;
  }
  {
    missing.push({
      id: p.id,
      slug: p.slug,
      name: p.name,
      sourceId: p.sourceId,
      photoDir: src.photoDir,
      reason: res?.reason ?? "unknown",
      photoDirDisk: res?.photoDirDisk,
    });
  }
}

const total = productsIndex.length;
const okCount = okCandidate + okFuzzy;

console.log(`Total products: ${total}`);
console.log(`With image:     ${okCount}`);
console.log(`- candidate:    ${okCandidate}`);
console.log(`- fuzzy only:   ${okFuzzy}`);
console.log(`Missing image:  ${missing.length}`);
console.log(`Missing source: ${missingSource.length}`);

if (missingSource.length) {
  console.log("\nProducts with missing sourceId mapping:");
  for (const m of missingSource.slice(0, 50)) {
    console.log(`- ${m.name} (slug: ${m.slug}) sourceId=${m.sourceId}`);
  }
  if (missingSource.length > 50) console.log(`... +${missingSource.length - 50} more`);
}

if (missing.length) {
  const byDir = new Map();
  for (const m of missing) {
    const key = String(m.photoDir ?? "");
    byDir.set(key, (byDir.get(key) ?? 0) + 1);
  }

  const topDirs = Array.from(byDir.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  console.log("\nMissing images by folder (top 20):");
  for (const [dir, count] of topDirs) {
    console.log(`- ${count} \t ${dir}`);
  }

  console.log("\nProducts with no image file found:");
  for (const m of missing.slice(0, 200)) {
    console.log(`- ${m.name} (slug: ${m.slug}) dir=${m.photoDir} reason=${m.reason}`);
  }
  if (missing.length > 200) console.log(`... +${missing.length - 200} more`);
}

process.exitCode = missing.length || missingSource.length ? 1 : 0;
