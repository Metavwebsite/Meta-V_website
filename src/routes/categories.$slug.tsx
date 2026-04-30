import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Section, CTAButton } from "@/components/Section";
import { Breadcrumb } from "@/components/Breadcrumb";
import { categoryBySlug } from "@/data/categories";
import { brandById } from "@/data/brands";

export const Route = createFileRoute("/categories/$slug")({
  component: CategoryDetailPage,
  notFoundComponent: () => (
    <div className="container-wide py-24 text-center">
      <p className="eyebrow">Catégorie introuvable</p>
      <Link to="/materiel" className="mt-4 inline-block text-petrol underline">Retour au matériel</Link>
    </div>
  ),
  loader: ({ params }) => {
    const c = categoryBySlug[params.slug];
    if (!c) throw notFound();
    return c;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — Catégorie Meta-V Solutions` },
          { name: "description", content: loaderData.shortDescription },
          { property: "og:title", content: loaderData.title },
          { property: "og:description", content: loaderData.shortDescription },
        ]
      : [],
  }),
});

function CategoryDetailPage() {
  const cat = Route.useLoaderData();
  const brand = cat.brandId ? brandById[cat.brandId] : null;

  return (
    <>
      <section className="border-b border-border">
        <div className="container-wide py-12 lg:py-16">
          <Breadcrumb
            items={[
              { label: "Accueil", to: "/" },
              { label: "Matériel", to: "/materiel" },
              { label: cat.title },
            ]}
          />
          <div className="mt-6 grid lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <p className="eyebrow">{brand ? brand.name : "Catégorie"}</p>
              <h1 className="mt-3 text-4xl md:text-5xl lg:text-[52px] font-display font-semibold tracking-tight leading-[1.05]">
                {cat.title}
              </h1>
              <p className="mt-6 text-lg text-ink-soft max-w-2xl">{cat.longDescription ?? cat.shortDescription}</p>
            </div>
            <div className="lg:col-span-4 flex lg:justify-end">
              <CTAButton to="/contact" variant="primary">Demander un devis</CTAButton>
            </div>
          </div>
        </div>
      </section>

      <Section eyebrow={`${cat.subCategories.length} sous-catégories`} title="Parcourir la gamme">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cat.subCategories.map((sc) => (
            <Link
              key={sc.id}
              to="/sous-categories/$slug"
              params={{ slug: sc.slug }}
              className="group p-5 bg-card border border-border rounded-md hover:border-petrol/50 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-lg font-semibold group-hover:text-petrol transition-colors leading-snug">{sc.title}</h3>
                <ArrowRight className="h-4 w-4 text-ink-soft transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="mt-3 text-xs text-ink-soft font-mono uppercase tracking-wider">
                {sc.productIds.length} produits
              </p>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
