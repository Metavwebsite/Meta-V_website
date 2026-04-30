import { sectors, sectorById } from "@/data/sectors";
import { solutions, solutionById } from "@/data/solutions";
import { brands, brandById } from "@/data/brands";
import { categories, categoryById } from "@/data/categories";
import { products } from "@/data/products";

export {
  sectors, sectorById,
  solutions, solutionById,
  brands, brandById,
  categories, categoryById,
  products,
};

export function sectorsForSolution(solutionId: string) {
  const sol = solutionById[solutionId];
  if (!sol) return [];
  return sol.sectorIds.map((id) => sectorById[id]).filter(Boolean);
}

export function solutionsForSector(sectorId: string) {
  const sec = sectorById[sectorId];
  if (!sec) return [];
  return sec.solutionIds.map((id) => solutionById[id]).filter(Boolean);
}

export function brandsForSolution(solutionId: string) {
  const sol = solutionById[solutionId];
  if (!sol) return [];
  return sol.brandIds.map((id) => brandById[id]).filter(Boolean);
}

export function brandsForSector(sectorId: string) {
  const sec = sectorById[sectorId];
  if (!sec) return [];
  return sec.brandIds.map((id) => brandById[id]).filter(Boolean);
}

export function categoriesForBrand(brandId: string) {
  return categories.filter((c) => c.brandId === brandId || c.brandIds?.includes(brandId));
}

export function productsForCategory(categoryId: string) {
  return products.filter((p) => p.categoryId === categoryId);
}

export function productsForSubCategory(subCategoryId: string) {
  return products.filter((p) => p.subCategoryId === subCategoryId);
}

export interface SearchResult {
  type: "product" | "category" | "solution" | "sector" | "brand";
  title: string;
  to: string;
  params?: Record<string, string>;
  description?: string;
}

export function searchAll(query: string): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const r: SearchResult[] = [];

  for (const s of solutions) {
    if (s.title.toLowerCase().includes(q) || s.shortDescription.toLowerCase().includes(q)) {
      r.push({ type: "solution", title: s.title, to: "/solutions/$slug", params: { slug: s.slug }, description: s.shortDescription });
    }
  }
  for (const s of sectors) {
    if (s.title.toLowerCase().includes(q) || s.shortDescription.toLowerCase().includes(q)) {
      r.push({ type: "sector", title: s.title, to: "/secteurs/$slug", params: { slug: s.slug }, description: s.shortDescription });
    }
  }
  for (const c of categories) {
    if (c.title.toLowerCase().includes(q) || c.shortDescription.toLowerCase().includes(q)) {
      r.push({ type: "category", title: c.title, to: "/categories/$slug", params: { slug: c.slug }, description: c.shortDescription });
    }
  }
  for (const b of brands) {
    if (b.name.toLowerCase().includes(q) || b.tagline.toLowerCase().includes(q)) {
      r.push({ type: "brand", title: b.name, to: "/marques", description: b.tagline });
    }
  }
  for (const p of products) {
    const inName = p.name.toLowerCase().includes(q);
    const inSubtitle = (p.subtitle ?? "").toLowerCase().includes(q);
    const inTags = (p.tags ?? []).some((t) => t.toLowerCase().includes(q));
    const inCats = (p.categories ?? []).some((c) => c.toLowerCase().includes(q));
    if (inName || inSubtitle || inTags || inCats) {
      r.push({ type: "product", title: p.name, to: "/produits/$slug", params: { slug: p.slug }, description: p.shortDescription || p.subtitle });
      if (r.length > 50) break;
    }
  }
  return r.slice(0, 60);
}
