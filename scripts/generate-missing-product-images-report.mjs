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

function fileExists(p) {
  try {
    fs.accessSync(p, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
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

function findAnyImage({ photoDirUrl, productName, productSlug }) {
  if (!photoDirUrl || !productName) return { ok: false, reason: "missing-input" };

  const publicDir = path.join(repoRoot, "public");
  const photoDirDisk = path.join(publicDir, photoDirUrl.replace(/^\//, ""));
  if (!fileExists(photoDirDisk)) return { ok: false, reason: "missing-photoDir", photoDirDisk };

  const candidates = buildImageCandidates(photoDirUrl, productName);
  for (const url of candidates) {
    const rel = String(url).replace(/^\//, "");
    const abs = path.join(publicDir, decodeURI(rel));
    if (fileExists(abs)) return { ok: true, match: "candidate", file: abs, photoDirDisk };
  }

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

function escapeMd(text) {
  return String(text ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function groupLabel(group) {
  switch (group) {
    case "aspiration":
      return "Aspiration";
    case "gaz":
      return "Gaz";
    case "soudage":
      return "Soudage";
    case "machines":
      return "Machines";
    case "outils":
      return "Outils";
    case "maintenance":
      return "Maintenance";
    default:
      return String(group ?? "");
  }
}

const productsModule = loadTsAsCjsModule(path.join(repoRoot, "src", "data", "products.index.ts"));
const sourcesModule = loadTsAsCjsModule(path.join(repoRoot, "src", "data", "materialSources.ts"));
const categoriesModule = loadTsAsCjsModule(path.join(repoRoot, "src", "data", "categories.ts"));

const productsIndex = productsModule.productsIndex ?? [];
const materialSourceById = sourcesModule.materialSourceById ?? {};
const categories = categoriesModule.categories ?? [];

const categoryById = new Map();
const subCategoryById = new Map();
for (const cat of categories) {
  categoryById.set(cat.id, cat);
  for (const sc of cat.subCategories ?? []) {
    subCategoryById.set(sc.id, { ...sc, categoryId: cat.id });
  }
}

const missing = [];
const fuzzyOnly = [];

for (const p of productsIndex) {
  const src = materialSourceById[p.sourceId];
  if (!src) continue;

  const cat = categoryById.get(p.categoryId);
  const sub = subCategoryById.get(p.subCategoryId);

  const res = findAnyImage({ photoDirUrl: src.photoDir, productName: p.name, productSlug: p.slug });
  if (res.ok) {
    if (res.match === "candidate") continue;
    fuzzyOnly.push({
      id: p.id,
      slug: p.slug,
      name: p.name,
      group: cat?.group ?? "",
      categoryTitle: cat?.title ?? "",
      subCategoryTitle: sub?.title ?? "",
      photoDir: src.photoDir,
      example: res.example ?? "",
    });
    continue;
  }

  missing.push({
    id: p.id,
    slug: p.slug,
    name: p.name,
    group: cat?.group ?? "",
    categoryTitle: cat?.title ?? "",
    subCategoryTitle: sub?.title ?? "",
    photoDir: src.photoDir,
  });
}

missing.sort((a, b) =>
  groupLabel(a.group).localeCompare(groupLabel(b.group), "fr") ||
  String(a.categoryTitle).localeCompare(String(b.categoryTitle), "fr") ||
  String(a.subCategoryTitle).localeCompare(String(b.subCategoryTitle), "fr") ||
  String(a.name).localeCompare(String(b.name), "fr"),
);

const outPath = path.join(repoRoot, "reports", "produits-sans-image.md");

let md = "# Produits sans image\n\n";
md += `Généré le ${new Date().toISOString()}\n\n`;
md += `- Total produits: ${productsIndex.length}\n`;
md += `- Produits sans image (aucun fichier trouvé): ${missing.length}\n`;
md += `- Images présentes mais nom différent (à renommer pour affichage): ${fuzzyOnly.length}\n\n`;
md += "Colonnes: **Catégorie** = groupe (Aspiration/Gaz/...), **Sous-catégorie** = catégorie du catalogue, **Sous-sous-catégorie** = sous-catégorie du catalogue.\n\n";
md += "## Sans fichier image\n\n";
md += "| Produit | Catégorie | Sous-catégorie | Sous-sous-catégorie | Slug | PhotoDir |\n";
md += "|---|---|---|---|---|---|\n";

for (const m of missing) {
  const productLink = `/produits/${m.slug}`;
  md += `| [${escapeMd(m.name)}](${productLink}) | ${escapeMd(groupLabel(m.group))} | ${escapeMd(m.categoryTitle)} | ${escapeMd(m.subCategoryTitle)} | ${escapeMd(m.slug)} | ${escapeMd(m.photoDir)} |\n`;
}

fuzzyOnly.sort((a, b) =>
  groupLabel(a.group).localeCompare(groupLabel(b.group), "fr") ||
  String(a.categoryTitle).localeCompare(String(b.categoryTitle), "fr") ||
  String(a.subCategoryTitle).localeCompare(String(b.subCategoryTitle), "fr") ||
  String(a.name).localeCompare(String(b.name), "fr"),
);

md += "\n## Image présente mais nom différent\n\n";
md += "Ces produits ont au moins une image dans le bon dossier, mais pas sous un nom compatible avec la logique actuelle (basée sur le nom produit).\n\n";
md += "| Produit | Catégorie | Sous-catégorie | Sous-sous-catégorie | Slug | PhotoDir | Exemple fichier |\n";
md += "|---|---|---|---|---|---|---|\n";

for (const m of fuzzyOnly) {
  const productLink = `/produits/${m.slug}`;
  md += `| [${escapeMd(m.name)}](${productLink}) | ${escapeMd(groupLabel(m.group))} | ${escapeMd(m.categoryTitle)} | ${escapeMd(m.subCategoryTitle)} | ${escapeMd(m.slug)} | ${escapeMd(m.photoDir)} | ${escapeMd(m.example)} |\n`;
}

fs.writeFileSync(outPath, md, "utf8");
console.log(`Wrote ${missing.length} rows to ${outPath}`);
process.exitCode = missing.length ? 1 : 0;
