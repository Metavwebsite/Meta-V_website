// Domain model — Meta-V Solutions catalog
// All data is local TypeScript: 100% statique, prêt pour SSG.

export type Slug = string;

export interface Brand {
  id: string;
  slug: Slug;
  name: string;
  tagline: string;
  description: string;
  expertise: string[];
}

export interface Sector {
  id: string;       // S1..S15
  slug: Slug;
  title: string;
  shortTitle: string;
  shortDescription: string;
  longDescription?: string;
  challenges?: string[];
  solutionIds: string[];     // SOL-XX
  brandIds: string[];
  categoryIds?: string[];
  priority?: boolean;
}

export interface Solution {
  id: string;       // SOL-01..SOL-18
  slug: Slug;
  title: string;
  shortDescription: string;
  longDescription?: string;
  problem?: string;
  proposal?: string;
  stakes?: string[];
  sectorIds: string[];
  brandIds: string[];
  categoryIds?: string[];
  priority?: boolean;
}

export interface SubCategory {
  id: string;
  slug: Slug;
  title: string;
  shortDescription?: string;
  productIds: string[];
}

export interface Category {
  id: string;
  slug: Slug;
  title: string;
  group: "aspiration" | "gaz" | "soudage" | "machines" | "outils" | "maintenance";
  shortDescription: string;
  longDescription?: string;
  brandId?: string;
  brandIds?: string[];
  subCategories: SubCategory[];
}

export interface MaterialSource {
  id: string;
  group: Category["group"];
  brandId?: string;
  title: string;
  slug: Slug;
  jsonUrl: string;   // served static (copied at build)
  photoDir: string;  // served static (copied at build)
  categoryId: string;
}

export interface TechnicalSpec {
  label: string;
  unit: string;
  value: string;
}

export type TechnicalSheetType = "none" | "inline" | "pdf";

export interface TechnicalSheet {
  type: TechnicalSheetType;
  pdf_url: string;
  content_text: string;
  technical_specs: TechnicalSpec[];
}

export interface RelatedProduct {
  name: string;
  category_label: string;
}

// Lightweight index: used for lists, routing and search.
export interface ProductIndexEntry {
  id: string;
  slug: Slug;
  name: string;
  subtitle: string;
  categories: string[];
  tags: string[];
  shortDescription: string;
  categoryId: string;
  subCategoryId: string;
  sourceId: string;
}

// Full product sheet: loaded on-demand from Matériel JSON.
export interface Product extends ProductIndexEntry {
  url?: string;
  description_text: string;
  bullet_points: string[];
  technical_sheet: TechnicalSheet;
  related_products: RelatedProduct[];

  // Local images: candidates in /photo/... (UI can fallback on error).
  image_candidates: string[];
}
