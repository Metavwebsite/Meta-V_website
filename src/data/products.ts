import type { Product, ProductIndexEntry, TechnicalSheet } from "@/types/catalog";
import { productsIndex } from "./products.index";
import { materialSourceById } from "./materialSources";

export const products: ProductIndexEntry[] = productsIndex;
export const productById: Record<string, ProductIndexEntry> = Object.fromEntries(products.map((p) => [p.id, p]));
export const productBySlug: Record<string, ProductIndexEntry> = Object.fromEntries(products.map((p) => [p.slug, p]));

type RawMatProduct = {
  url?: string;
  name?: string;
  subtitle?: string;
  categories?: unknown;
  tags?: unknown;
  description_text?: string;
  bullet_points?: unknown;
  technical_sheet?: unknown;
  related_products?: unknown;
};

const sourceCache = new Map<string, RawMatProduct[]>();
const productCache = new Map<string, Product>();

function stripDiacritics(input: string): string {
  return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function slugify(input: string): string {
  return stripDiacritics(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function idsForName(name: string) {
  const s = slugify(name);
  const full = `p-${s}`;
  const trimmed = s.replace(/-[a-z]$/, "");
  const trimId = trimmed !== s ? `p-${trimmed}` : null;
  return { full, trimId };
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x)).filter(Boolean);
}

function normalizeTechnicalSheet(v: unknown): TechnicalSheet {
  const o = (v && typeof v === "object") ? (v as Record<string, unknown>) : {};
  const type = String(o.type ?? "none");
  const safeType = type === "pdf" || type === "inline" || type === "none" ? type : "none";
  return {
    type: safeType,
    pdf_url: String(o.pdf_url ?? ""),
    content_text: String(o.content_text ?? ""),
    technical_specs: Array.isArray(o.technical_specs)
      ? (o.technical_specs as unknown[]).map((s) => {
          const spec = (s && typeof s === "object") ? (s as Record<string, unknown>) : {};
          return {
            label: String(spec.label ?? ""),
            unit: String(spec.unit ?? ""),
            value: String(spec.value ?? ""),
          };
        })
      : [],
  };
}

function buildImageCandidates(photoDir: string, productName: string): string[] {
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
  const suffixes = ["", "-1", "-2", "-3", "-4", "-5"]; // most folders use -1/-2...
  const out: string[] = [];
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

async function loadSource(sourceId: string): Promise<RawMatProduct[]> {
  const cached = sourceCache.get(sourceId);
  if (cached) return cached;

  const src = materialSourceById[sourceId];
  if (!src) return [];

  const res = await fetch(encodeURI(src.jsonUrl));
  if (!res.ok) {
    sourceCache.set(sourceId, []);
    return [];
  }

  const json = (await res.json()) as unknown;
  const arr = Array.isArray(json) ? (json as RawMatProduct[]) : [];
  sourceCache.set(sourceId, arr);
  return arr;
}

export async function loadProductById(id: string): Promise<Product | null> {
  const cached = productCache.get(id);
  if (cached) return cached;

  const idx = productById[id];
  if (!idx) return null;

  const src = materialSourceById[idx.sourceId];
  const items = await loadSource(idx.sourceId);

  const raw = items.find((it) => {
    const n = String(it.name ?? "").trim();
    if (!n) return false;
    const ids = idsForName(n);
    return ids.full === id || (ids.trimId ? ids.trimId === id : false);
  });

  if (!raw) return null;

  const name = String(raw.name ?? idx.name);
  const product: Product = {
    ...idx,
    url: raw.url ? String(raw.url) : undefined,
    name,
    subtitle: String(raw.subtitle ?? idx.subtitle ?? ""),
    categories: asStringArray(raw.categories).length > 0 ? asStringArray(raw.categories) : idx.categories,
    tags: asStringArray(raw.tags).length > 0 ? asStringArray(raw.tags) : idx.tags,
    description_text: String(raw.description_text ?? ""),
    bullet_points: asStringArray(raw.bullet_points),
    technical_sheet: normalizeTechnicalSheet(raw.technical_sheet),
    related_products: Array.isArray(raw.related_products)
      ? (raw.related_products as unknown[]).map((r) => {
          const rr = (r && typeof r === "object") ? (r as Record<string, unknown>) : {};
          return { name: String(rr.name ?? ""), category_label: String(rr.category_label ?? "") };
        })
      : [],
    image_candidates: src ? buildImageCandidates(src.photoDir, name) : [],
  };

  productCache.set(id, product);
  return product;
}

export async function loadProductBySlug(slug: string): Promise<Product | null> {
  const idx = productBySlug[slug];
  if (!idx) return null;
  return loadProductById(idx.id);
}
