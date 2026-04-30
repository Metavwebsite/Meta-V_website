import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Section, CTAButton } from "@/components/Section";
import { Breadcrumb } from "@/components/Breadcrumb";
import { productBySlug, loadProductById } from "@/data/products";
import { productsIndex } from "@/data/products.index";
import { categoryById } from "@/data/categories";
import { brandById } from "@/data/brands";

export const Route = createFileRoute("/produits/$slug")({
  component: ProductPage,
  notFoundComponent: () => (
    <div className="container-wide py-24 text-center">
      <p className="eyebrow">Produit introuvable</p>
      <Link to="/materiel" className="mt-4 inline-block text-petrol underline">Retour au catalogue</Link>
    </div>
  ),
  loader: ({ params }) => {
    const idx = productBySlug[params.slug];
    if (!idx) throw notFound();
    return idx;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.name} — Meta-V Solutions` },
          { name: "description", content: loaderData.subtitle || loaderData.shortDescription || loaderData.name },
        ]
      : [],
  }),
});

function ProductImage({ candidates, alt }: { candidates: string[]; alt: string }) {
  const [i, setI] = useState(0);
  const [hover, setHover] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });

  const src = candidates[i];
  if (!src) return null;

  const onMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  };

  return (
    <div
      className="w-full aspect-4/3 bg-card border border-border rounded-md overflow-hidden"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setOrigin({ x: 50, y: 50 });
      }}
      onMouseMove={onMove}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-contain cursor-zoom-in select-none"
        style={{
          transformOrigin: `${origin.x}% ${origin.y}%`,
          transform: hover ? "scale(1.8)" : "scale(1)",
          transition: "transform 150ms ease-out",
        }}
        onError={() => setI((x) => (x + 1 < candidates.length ? x + 1 : x))}
        loading="lazy"
        draggable={false}
      />
    </div>
  );
}

function ProductPage() {
  const idx = Route.useLoaderData();
  const [p, setP] = useState<Awaited<ReturnType<typeof loadProductById>>>(null);

  const product = p ?? idx;
  const tags = (p?.tags ?? idx.tags ?? []) as string[];

  useEffect(() => {
    let alive = true;
    loadProductById(idx.id).then((full) => {
      if (alive) setP(full);
    });
    return () => {
      alive = false;
    };
  }, [idx.id]);

  const cat = categoryById[idx.categoryId];
  const sub = cat?.subCategories.find((sc) => sc.id === idx.subCategoryId);
  const brand = cat?.brandId ? brandById[cat.brandId] : null;

  const techRows = useMemo(() => {
    const specs = p?.technical_sheet?.technical_specs ?? [];
    return specs.filter((s) => s.label || s.value);
  }, [p?.technical_sheet]);

  const productsLookup = useMemo(() => {
    const normalizeName = (s: string) =>
      s
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const normalizeSlug = (s: string) =>
      s
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");

    const slugifyLike = (s: string) => normalizeName(s).replace(/\s+/g, "-");

    const byNormName = new Map<string, string>();
    const byNormSlug = new Map<string, string>();
    const list: Array<{ normName: string; slug: string }> = [];

    for (const it of productsIndex) {
      const normName = normalizeName(it.name);
      if (normName) byNormName.set(normName, it.slug);
      byNormSlug.set(normalizeSlug(it.slug), it.slug);
      list.push({ normName, slug: it.slug });
    }

    const resolveSlugFromName = (name: string): string | null => {
      const norm = normalizeName(name);
      if (!norm) return null;

      const direct = byNormName.get(norm);
      if (direct) return direct;

      const guessedSlug = slugifyLike(name);
      const bySlug = byNormSlug.get(normalizeSlug(guessedSlug));
      if (bySlug) return bySlug;

      const candidates = list.filter((it) => it.normName && (it.normName.includes(norm) || norm.includes(it.normName)));
      if (candidates.length === 1) return candidates[0].slug;

      return null;
    };

    return { resolveSlugFromName };
  }, []);

  const relatedLinks = useMemo(() => {
    const related = p?.related_products ?? [];
    return related.map((rp) => ({
      ...rp,
      slug: productsLookup.resolveSlugFromName(rp.name),
    }));
  }, [p?.related_products, productsLookup]);

  return (
    <>
      <section className="border-b border-border">
        <div className="container-wide py-10">
          <Breadcrumb
            items={[
              { label: "Accueil", to: "/" },
              { label: "Matériel", to: "/materiel" },
              ...(cat ? [{ label: cat.title, to: "/categories/$slug" as const, params: { slug: cat.slug } }] : []),
              ...(sub && cat ? [{ label: sub.title, to: "/sous-categories/$slug" as const, params: { slug: sub.slug } }] : []),
              { label: product.name },
            ]}
          />
        </div>
      </section>

      <Section>
        <div className="grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8">
            {brand && <p className="eyebrow">{brand.name}</p>}
            <h1 className="mt-3 text-4xl md:text-5xl font-display font-semibold tracking-tight leading-[1.05]">
              {product.name}
            </h1>
            {(p?.subtitle ?? idx.subtitle) && (
              <p className="mt-4 text-base text-ink-soft max-w-3xl">{p?.subtitle ?? idx.subtitle}</p>
            )}
            {!((p?.subtitle ?? idx.subtitle) && (p?.subtitle ?? idx.subtitle).length > 0) && idx.shortDescription && (
              <p className="mt-4 text-base text-ink-soft max-w-3xl">{idx.shortDescription}</p>
            )}

            {tags.length > 0 && (
              <div className="mt-6">
                <p className="eyebrow">Tags</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {tags.slice(0, 16).map((t) => (
                    <span key={t} className="inline-flex items-center h-8 px-3 text-sm bg-surface border border-border rounded-sm">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {p?.description_text && (
              <div className="mt-10">
                <p className="eyebrow">Description</p>
                <div className="mt-4 whitespace-pre-line text-ink-soft leading-relaxed">
                  {p.description_text}
                </div>
              </div>
            )}

            {p?.bullet_points && p.bullet_points.length > 0 && (
              <div className="mt-10">
                <p className="eyebrow">Points clés</p>
                <ul className="mt-4 grid sm:grid-cols-2 gap-3">
                  {p.bullet_points.map((b) => (
                    <li key={b} className="flex items-start gap-3 p-4 bg-card border border-border rounded-md">
                      <CheckCircle2 className="h-5 w-5 text-petrol shrink-0 mt-0.5" />
                      <span className="text-sm font-medium">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {p && (p.technical_sheet?.pdf_url || p.technical_sheet?.content_text || techRows.length > 0) && (
              <div className="mt-12">
                <p className="eyebrow">Fiche technique</p>

                {p.technical_sheet.pdf_url && (
                  <a
                    href={p.technical_sheet.pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center h-10 px-4 bg-surface border border-border rounded-sm hover:border-petrol/50"
                  >
                    Ouvrir le PDF
                  </a>
                )}

                {techRows.length > 0 ? (
                  <div className="mt-6 overflow-x-auto border border-border rounded-md bg-card">
                    <table className="w-full text-sm">
                      <tbody>
                        {techRows.map((row, idx) => (
                          <tr key={idx} className="border-b border-border last:border-0">
                            <td className="p-3 font-medium w-1/2">{row.label}</td>
                            <td className="p-3 text-ink-soft">
                              {row.value}{row.unit ? ` ${row.unit}` : ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : p.technical_sheet.content_text ? (
                  <div className="mt-4 whitespace-pre-line text-sm text-ink-soft">
                    {p.technical_sheet.content_text}
                  </div>
                ) : null}
              </div>
            )}

            {relatedLinks.length > 0 && (
              <div className="mt-12">
                <p className="eyebrow">Produits liés</p>
                <ul className="mt-4 grid sm:grid-cols-2 gap-3">
                  {relatedLinks.slice(0, 12).map((rp) => (
                    <li key={`${rp.category_label}-${rp.name}`}>
                      {rp.slug ? (
                        <Link
                          to="/produits/$slug"
                          params={{ slug: rp.slug }}
                          className="block p-4 bg-card border border-border rounded-md hover:border-petrol/50"
                        >
                          <p className="font-medium">{rp.name}</p>
                          {rp.category_label && (
                            <p className="mt-1 text-xs text-ink-soft font-mono uppercase tracking-wider">{rp.category_label}</p>
                          )}
                        </Link>
                      ) : (
                        <div className="p-4 bg-card border border-border rounded-md">
                          <p className="font-medium">{rp.name}</p>
                          {rp.category_label && (
                            <p className="mt-1 text-xs text-ink-soft font-mono uppercase tracking-wider">{rp.category_label}</p>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <aside className="lg:col-span-4 space-y-5">
            {p?.image_candidates && p.image_candidates.length > 0 && (
              <ProductImage candidates={p.image_candidates} alt={product.name} />
            )}
            <div className="p-6 bg-foreground text-background rounded-md">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-copper">Devis</p>
              <p className="mt-3 font-display text-xl font-semibold leading-snug">
                Disponibilité, configuration, intégration — parlons-en.
              </p>
              <Link to="/contact" className="mt-5 inline-flex items-center gap-2 h-10 px-4 bg-copper text-copper-foreground rounded-sm text-sm font-medium">
                Demander un devis <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {brand && (
              <Link to="/marques" className="block p-6 bg-card border border-border rounded-md hover:border-petrol/50 transition-all">
                <p className="eyebrow">Marque</p>
                <p className="mt-2 font-display text-xl font-semibold">{brand.name}</p>
                <p className="mt-1 text-sm text-petrol">{brand.tagline}</p>
              </Link>
            )}
            {cat && (
              <Link to="/categories/$slug" params={{ slug: cat.slug }} className="block p-6 bg-surface border border-border rounded-md hover:border-petrol/50">
                <p className="eyebrow">Catégorie</p>
                <p className="mt-2 font-medium">{cat.title}</p>
              </Link>
            )}
            {sub && cat && (
              <Link to="/sous-categories/$slug" params={{ slug: sub.slug }} className="block p-6 bg-surface border border-border rounded-md hover:border-petrol/50">
                <p className="eyebrow">Sous-catégorie</p>
                <p className="mt-2 font-medium">{sub.title}</p>
              </Link>
            )}
          </aside>
        </div>

        <div className="mt-16 border-t border-border pt-10">
          <CTAButton to="/materiel" variant="ghost">← Retour au catalogue</CTAButton>
        </div>
      </Section>
    </>
  );
}
