import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Section, CTAButton } from "@/components/Section";
import { Breadcrumb } from "@/components/Breadcrumb";
import { categories, categoryGroups } from "@/data/categories";
import { brands } from "@/data/brands";

export const Route = createFileRoute("/materiel")({
  head: () => ({
    meta: [
      { title: "Matériel industriel — Catégories & marques | Meta-V Solutions" },
      { name: "description", content: "Catalogue complet du matériel industriel Meta-V Solutions : aspiration, gaz, soudage, machines, outils, maintenance. Toutes les marques partenaires." },
      { property: "og:title", content: "Matériel industriel — Meta-V Solutions" },
      { property: "og:description", content: "Catégories produit, sous-catégories et marques partenaires." },
    ],
  }),
  component: MaterielPage,
});

function MaterielPage() {
  return (
    <>
      <section className="border-b border-border">
        <div className="container-wide py-12 lg:py-16">
          <Breadcrumb items={[{ label: "Accueil", to: "/" }, { label: "Matériel" }]} />
          <div className="mt-6 grid lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <p className="eyebrow">Catalogue matériel</p>
              <h1 className="mt-3 text-4xl md:text-5xl lg:text-6xl font-display font-semibold tracking-tight leading-[1.05]">
                Du matériel industriel<br />choisi pour la <span className="text-petrol">production</span>.
              </h1>
              <p className="mt-6 text-lg text-ink-soft max-w-2xl">
                Six grandes familles, des marques partenaires reconnues, et une arborescence pensée pour aller vite : du besoin général à la fiche produit.
              </p>
            </div>
            <div className="lg:col-span-4 flex lg:justify-end gap-3">
              <Link to="/recherche" className="h-11 inline-flex items-center px-4 border border-border rounded-sm text-sm hover:bg-surface">Recherche catalogue</Link>
              <CTAButton to="/contact" variant="primary">Demander un devis</CTAButton>
            </div>
          </div>
        </div>
      </section>

      {categoryGroups.map((group) => {
        const groupCats = categories.filter((c) => c.group === group.id);
        return (
          <Section key={group.id} className="border-b border-border last:border-0">
            <div className="grid lg:grid-cols-12 gap-10">
              <div className="lg:col-span-3">
                <p className="eyebrow">Famille</p>
                <h2 className="mt-3 text-2xl lg:text-3xl font-display font-semibold">{group.title}</h2>
                <p className="mt-3 text-sm text-ink-soft">{group.description}</p>
              </div>
              <div className="lg:col-span-9 grid sm:grid-cols-2 gap-4">
                {groupCats.map((cat) => (
                  <Link
                    key={cat.id}
                    to="/categories/$slug"
                    params={{ slug: cat.slug }}
                    className="group p-6 bg-card border border-border rounded-md hover:border-petrol/50 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-lg font-semibold leading-snug group-hover:text-petrol transition-colors">{cat.title}</h3>
                      <ArrowRight className="h-4 w-4 text-ink-soft mt-1 transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <p className="mt-2 text-sm text-ink-soft leading-relaxed">{cat.shortDescription}</p>
                    <div className="mt-4 flex items-center gap-3 text-xs text-ink-soft">
                      <span>{cat.subCategories.length} sous-catégories</span>
                      <span className="h-3 w-px bg-border" />
                      <span>{cat.subCategories.reduce((n, sc) => n + sc.productIds.length, 0)} produits</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </Section>
        );
      })}

      <Section className="bg-surface" eyebrow="Marques partenaires" title="Une sélection rigoureuse de constructeurs.">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-border border border-border rounded-sm overflow-hidden">
          {brands.map((b) => (
            <Link key={b.id} to="/marques" className="bg-card p-6 hover:bg-surface text-center transition-colors">
              <p className="font-display text-lg font-semibold">{b.name}</p>
              <p className="mt-1 text-xs text-ink-soft">{b.expertise[0]}</p>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
