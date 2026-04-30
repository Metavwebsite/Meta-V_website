import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Section, CTAButton } from "@/components/Section";
import { Breadcrumb } from "@/components/Breadcrumb";
import { subCategoryBySlug, categoryById } from "@/data/categories";
import { productById } from "@/data/products";

export const Route = createFileRoute("/sous-categories/$slug")({
  component: SubCategoryPage,
  notFoundComponent: () => (
    <div className="container-wide py-24 text-center">
      <p className="eyebrow">Sous-catégorie introuvable</p>
      <Link to="/materiel" className="mt-4 inline-block text-petrol underline">Retour au matériel</Link>
    </div>
  ),
  loader: ({ params }) => {
    const sc = subCategoryBySlug[params.slug];
    if (!sc) throw notFound();
    const cat = categoryById[sc.categoryId];
    return { sc, cat };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.sc.title} — ${loaderData.cat.title} | Meta-V Solutions` },
          { name: "description", content: loaderData.sc.shortDescription ?? `Découvrez les produits de la sous-catégorie ${loaderData.sc.title}.` },
        ]
      : [],
  }),
});

function SubCategoryPage() {
  const { sc, cat } = Route.useLoaderData();
  const products = sc.productIds.map((id) => productById[id]).filter(Boolean);

  return (
    <>
      <section className="border-b border-border">
        <div className="container-wide py-12">
          <Breadcrumb
            items={[
              { label: "Accueil", to: "/" },
              { label: "Matériel", to: "/materiel" },
              { label: cat.title, to: "/categories/$slug", params: { slug: cat.slug } },
              { label: sc.title },
            ]}
          />
          <div className="mt-6 grid lg:grid-cols-12 gap-6 items-end">
            <div className="lg:col-span-8">
              <p className="eyebrow">{cat.title}</p>
              <h1 className="mt-3 text-3xl md:text-4xl lg:text-5xl font-display font-semibold tracking-tight">
                {sc.title}
              </h1>
              <p className="mt-4 text-ink-soft">{products.length} produits dans cette sous-catégorie.</p>
            </div>
            <div className="lg:col-span-4 flex lg:justify-end">
              <CTAButton to="/contact" variant="primary">Demander un devis</CTAButton>
            </div>
          </div>
        </div>
      </section>

      <Section>
        <ul className="divide-y divide-border border border-border rounded-md bg-card">
          {products.map((p) => (
            <li key={p.id}>
              <Link
                to="/produits/$slug"
                params={{ slug: p.slug }}
                className="flex items-center justify-between gap-4 p-4 lg:p-5 hover:bg-surface transition-colors group"
              >
                <div className="min-w-0">
                  <h3 className="font-medium group-hover:text-petrol transition-colors">{p.name}</h3>
                  {(p.subtitle || p.shortDescription) && (
                    <p className="text-sm text-ink-soft mt-1 line-clamp-1">{p.shortDescription || p.subtitle}</p>
                  )}
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <ArrowRight className="h-4 w-4 text-ink-soft transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
