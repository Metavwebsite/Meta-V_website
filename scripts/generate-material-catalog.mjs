import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function stripDiacritics(input) {
  return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function slugify(input) {
  return stripDiacritics(String(input))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeText(input) {
  return stripDiacritics(String(input))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordSet(input) {
  const n = normalizeText(input);
  if (!n) return new Set();
  return new Set(n.split(" ").filter(Boolean));
}

function similarityScore(a, b) {
  const wa = wordSet(a);
  const wb = wordSet(b);
  if (wa.size === 0 || wb.size === 0) return 0;
  let common = 0;
  for (const w of wa) if (wb.has(w)) common++;
  return common / Math.max(wa.size, wb.size);
}

function walkFiles(dir, predicate) {
  const out = [];
  const stack = [dir];
  while (stack.length > 0) {
    const cur = stack.pop();
    const entries = fs.readdirSync(cur, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(cur, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (e.isFile() && predicate(p)) out.push(p);
    }
  }
  return out;
}

function detectGroup(filePath) {
  const p = filePath.replace(/\\/g, "/");
  if (p.includes("/Meta-V ASPIRATION V4/")) return "aspiration";
  if (p.includes("/Meta-V GAZ V4/")) return "gaz";
  if (p.includes("/Meta-V SOUDAGE V4/")) return "soudage";
  if (p.includes("/Meta-V MACHINES V4/")) return "machines";
  if (p.includes("/Meta-V OUTILS INDUSTRIELS V4/")) return "outils";
  if (p.includes("/Einhell/")) return "maintenance";
  return "maintenance";
}

function detectBrandId(filePath) {
  const p = normalizeText(filePath);
  if (p.includes("einhell")) return "einhell";
  if (p.includes("dupuy")) return "dupuy";
  if (p.includes("kemper")) return "kemper";
  if (p.includes("spectron")) return "spectron";
  if (p.includes("vici") || p.includes("dbs")) return "vici-dbs";
  if (p.includes("lincolnelectric") || p.includes("lincoln")) return "lincoln";
  if (p.includes("kemppi")) return "kemppi";
  if (p.includes("axxair")) return "axxair";
  if (p.includes("siegmund")) return "siegmund";
  if (p.includes("ficep")) return "ficep";
  if (p.includes("armoires") && p.includes("securite")) return "armoires-securite";
  return undefined;
}

function prettifyFolderTitle(folderName) {
  const raw = folderName
    .replace(/^Meta-V_/i, "")
    .replace(/^(ASPIRATION|GAZ|SOUDAGE|MACHINES|OUTILS)_/i, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!raw) return folderName;
  return raw;
}

function toUrlPath(fsPath) {
  return fsPath.replace(/\\/g, "/");
}

function deriveSourceMeta(jsonFilePath) {
  const rel = path.relative(ROOT, jsonFilePath);
  const relPosix = toUrlPath(rel);
  const relFromMaterial = relPosix.startsWith("Matériel/") ? relPosix.slice("Matériel/".length) : relPosix;

  const group = detectGroup(relPosix);
  const brandId = detectBrandId(relPosix);
  const dirName = path.basename(path.dirname(jsonFilePath));
  const fallbackTitle = prettifyFolderTitle(dirName);

  const sourceId = `src-${slugify(relFromMaterial.replace(/\.json$/i, ""))}`;
  const jsonUrl = `/${relPosix}`;

  const relDir = toUrlPath(path.dirname(rel));
  const photoDir = `/${relDir.replace(/^Matériel\//, "photo/")}`;

  return { sourceId, group, brandId, fallbackTitle, jsonUrl, photoDir, relPosix };
}

function idsForName(name) {
  const s = slugify(name);
  const full = `p-${s}`;
  const trimmed = s.replace(/-[a-z]$/, "");
  const trimId = trimmed !== s ? `p-${trimmed}` : null;
  return { full, trimId };
}

function chooseCategoryTitleForSource(source, items) {
  const folderTitle = source.fallbackTitle;
  const counts = new Map();

  for (const it of items) {
    const cats = Array.isArray(it.categories) ? it.categories : [];
    for (const c of cats) {
      const key = String(c);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  if (counts.size === 0) return folderTitle;

  let best = null;
  let bestScore = -Infinity;
  for (const [label, count] of counts) {
    const sim = similarityScore(folderTitle, label);
    const score = count + sim * 10;
    if (score > bestScore) {
      bestScore = score;
      best = label;
    }
  }

  return best ?? folderTitle;
}

function deriveSubCategoryTitle(itemCategories, categoryTitle) {
  const cats = Array.isArray(itemCategories) ? itemCategories.map(String) : [];
  if (cats.length === 0) return "Général";

  const normCat = normalizeText(categoryTitle);
  const filtered = cats.filter((c) => normalizeText(c) !== normCat);

  const meaningful = filtered.filter((c) => {
    const n = normalizeText(c);
    if (!n) return false;
    if (n.startsWith("meta v")) return false;
    if (n.startsWith("suche")) return false;
    if (n === "outillage") return false;
    return true;
  });

  if (meaningful.length === 0) {
    if (filtered.length > 0) return filtered[0];
    return cats[0];
  }

  let best = meaningful[0];
  let bestScore = -Infinity;
  for (const c of meaningful) {
    const score = similarityScore(c, categoryTitle) * -5 + normalizeText(c).length / 50;
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}

function safeReadJsonArray(jsonFilePath) {
  const txt = fs.readFileSync(jsonFilePath, "utf8");
  const data = JSON.parse(txt);
  if (!Array.isArray(data)) {
    throw new Error(`Expected array JSON in ${jsonFilePath}`);
  }
  return data;
}

function writeTs(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

function sortByTitle(a, b) {
  return a.title.localeCompare(b.title, "fr", { sensitivity: "base" });
}

function main() {
  const materialDir = path.join(ROOT, "Matériel");
  const jsonFiles = walkFiles(materialDir, (p) => p.toLowerCase().endsWith(".json"));

  const sources = [];
  const categories = [];
  const productsIndex = [];

  for (const jsonFilePath of jsonFiles) {
    const source = deriveSourceMeta(jsonFilePath);
    const items = safeReadJsonArray(jsonFilePath);

    const categoryTitle = chooseCategoryTitleForSource(source, items);
    const categorySlug = slugify(categoryTitle || source.fallbackTitle);
    const categoryId = `cat-${categorySlug}${source.brandId ? `-${source.brandId}` : ""}`;

    const subMap = new Map();

    for (const it of items) {
      const name = String(it.name ?? "").trim();
      if (!name) continue;

      const subtitle = String(it.subtitle ?? "");
      const cats = Array.isArray(it.categories) ? it.categories.map(String) : [];
      const tags = Array.isArray(it.tags) ? it.tags.map(String) : [];

      const { full: productId } = idsForName(name);
      const productSlug = productId.replace(/^p-/, "");

      const subTitle = deriveSubCategoryTitle(cats, categoryTitle);
      const subSlug = slugify(subTitle);
      const subSlugUnique = `${categorySlug}-${subSlug}`;
      const subId = `sc-${subSlugUnique}`;

      if (!subMap.has(subId)) {
        subMap.set(subId, {
          id: subId,
          slug: subSlugUnique,
          title: subTitle,
          productIds: [],
        });
      }
      subMap.get(subId).productIds.push(productId);

      const shortDescription = subtitle || (String(it.description_text ?? "").split("\n").find((l) => l.trim()) ?? "");

      productsIndex.push({
        id: productId,
        slug: productSlug,
        name,
        subtitle,
        categories: cats,
        tags,
        shortDescription,
        categoryId,
        subCategoryId: subId,
        sourceId: source.sourceId,
      });
    }

    const subCategories = Array.from(subMap.values())
      .map((sc) => ({ ...sc, productIds: Array.from(new Set(sc.productIds)).sort() }))
      .sort(sortByTitle);

    categories.push({
      id: categoryId,
      slug: categorySlug,
      title: categoryTitle || source.fallbackTitle,
      group: source.group,
      brandId: source.brandId,
      shortDescription: `${productsIndex.filter((p) => p.categoryId === categoryId).length} produits`,
      subCategories,
    });

    sources.push({
      id: source.sourceId,
      group: source.group,
      brandId: source.brandId,
      title: categoryTitle || source.fallbackTitle,
      slug: categorySlug,
      jsonUrl: source.jsonUrl,
      photoDir: source.photoDir,
      categoryId,
    });
  }

  categories.sort(sortByTitle);
  sources.sort(sortByTitle);

  const categoriesTs = `import type { Category } from "@/types/catalog";

// Auto-generated from Matériel/**/*.json
// Do not edit manually. Run: node scripts/generate-material-catalog.mjs

export const categories: Category[] = ${JSON.stringify(categories, null, 2)} as const;

export const categoryById = Object.fromEntries(categories.map((c) => [c.id, c]));
export const categoryBySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));

export const subCategoryBySlug = Object.fromEntries(
  categories.flatMap((c) => c.subCategories.map((sc) => [sc.slug, { ...sc, categoryId: c.id, categorySlug: c.slug }]))
);

export const categoryGroups = [
  { id: "aspiration", title: "Aspiration & Filtration", description: "Captation, dépoussiérage, ATEX, centralisé." },
  { id: "gaz", title: "Gaz & Sécurité gaz", description: "Distribution, génération, armoires de sécurité." },
  { id: "soudage", title: "Soudage & Coupage", description: "MIG / TIG / MMA, plasma, oxy-fuel, tables." },
  { id: "machines", title: "Machines & Automation", description: "Lignes CNC, automatisation, usinage, tôlerie." },
  { id: "outils", title: "Outils industriels", description: "Outils copeaux, lames, consommables." },
  { id: "maintenance", title: "Maintenance / Atelier", description: "Outillage atelier, énergie, chantier." },
] as const;
`;

  const sourcesTs = `import type { MaterialSource } from "@/types/catalog";

// Auto-generated from Matériel/**/*.json
// Do not edit manually. Run: node scripts/generate-material-catalog.mjs

export const materialSources: MaterialSource[] = ${JSON.stringify(sources, null, 2)} as const;

export const materialSourceById = Object.fromEntries(materialSources.map((s) => [s.id, s]));
`;

  const indexTs = `import type { ProductIndexEntry } from "@/types/catalog";

// Auto-generated from Matériel/**/*.json
// Do not edit manually. Run: node scripts/generate-material-catalog.mjs

export const productsIndex: ProductIndexEntry[] = ${JSON.stringify(productsIndex, null, 2)} as const;
`;

  writeTs(path.join(ROOT, "src/data/categories.ts"), categoriesTs);
  writeTs(path.join(ROOT, "src/data/materialSources.ts"), sourcesTs);
  writeTs(path.join(ROOT, "src/data/products.index.ts"), indexTs);

  console.log(`Generated: categories=${categories.length}, sources=${sources.length}, productsIndex=${productsIndex.length}`);
}

main();
