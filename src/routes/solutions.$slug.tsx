import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Section, CTAButton } from "@/components/Section";
import { Breadcrumb } from "@/components/Breadcrumb";
import { SectorCard } from "@/components/SectorCard";
import { solutionBySlug } from "@/data/solutions";
import { sectorById } from "@/data/sectors";
import { brandById } from "@/data/brands";

export const Route = createFileRoute("/solutions/$slug")({
  component: SolutionDetailPage,
  notFoundComponent: () => (
    <div className="container-wide py-24 text-center">
      <p className="eyebrow">Solution introuvable</p>
      <Link to="/prestations-services" className="mt-4 inline-block text-petrol underline">Voir toutes les solutions</Link>
    </div>
  ),
  loader: ({ params }) => {
    const sol = solutionBySlug[params.slug];
    if (!sol) throw notFound();
    return sol;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — Solution Meta-V Solutions` },
          { name: "description", content: loaderData.shortDescription },
          { property: "og:title", content: loaderData.title },
          { property: "og:description", content: loaderData.shortDescription },
        ]
      : [],
  }),
});

function SolutionDetailPage() {
  const sol = Route.useLoaderData();
  const sectors = sol.sectorIds.map((id) => sectorById[id]).filter(Boolean);
  const brands = sol.brandIds.map((id) => brandById[id]).filter(Boolean);

  return (
    <>
      <section className="border-b border-border bg-surface">
        <div className="container-wide py-12 lg:py-16">
          <Breadcrumb
            items={[
              { label: "Accueil", to: "/" },
              { label: "Prestations & Services", to: "/prestations-services" },
              { label: sol.title },
            ]}
          />
          <div className="mt-6 grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <p className="eyebrow">{sol.id} · Solution</p>
              <h1 className="mt-3 text-4xl md:text-5xl lg:text-[56px] font-display font-semibold tracking-tight leading-[1.05]">
                {sol.title}
              </h1>
              <p className="mt-6 text-lg text-ink-soft max-w-2xl">{sol.shortDescription}</p>
              <div className="mt-8">
                <CTAButton to="/contact" variant="primary">Demander une étude <ArrowRight className="h-4 w-4" /></CTAButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Section>
        <div className="grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-12">
            {sol.problem && (
              <div>
                <p className="eyebrow">Problématique</p>
                <h2 className="mt-3 text-2xl font-display font-semibold">Le contexte terrain</h2>
                <p className="mt-4 text-ink-soft leading-relaxed">{sol.problem}</p>
              </div>
            )}
            {sol.proposal && (
              <div>
                <p className="eyebrow">Notre proposition</p>
                <h2 className="mt-3 text-2xl font-display font-semibold">Ce que propose Meta-V</h2>
                <p className="mt-4 text-ink-soft leading-relaxed">{sol.proposal}</p>
              </div>
            )}
            {sol.stakes && sol.stakes.length > 0 && (
              <div>
                <p className="eyebrow">Enjeux</p>
                <h2 className="mt-3 text-2xl font-display font-semibold">Les enjeux clés</h2>
                <ul className="mt-5 grid sm:grid-cols-2 gap-3">
                  {sol.stakes.map((s) => (
                    <li key={s} className="flex items-start gap-3 p-4 bg-card border border-border rounded-md">
                      <CheckCircle2 className="h-5 w-5 text-petrol shrink-0 mt-0.5" />
                      <span className="text-sm">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <aside className="lg:col-span-4 space-y-6">
            <div className="p-6 bg-card border border-border rounded-md">
              <p className="eyebrow">Marques associées</p>
              <ul className="mt-4 space-y-2">
                {brands.map((b) => (
                  <li key={b.id}>
                    <Link to="/marques" className="block py-2 px-3 bg-surface hover:bg-petrol hover:text-petrol-foreground rounded-sm text-sm font-medium transition-colors">
                      {b.name}
                      <span className="block text-[11px] opacity-70 font-normal mt-0.5">{b.tagline}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-6 bg-foreground text-background rounded-md">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-copper">Devis</p>
              <p className="mt-3 text-xl font-display font-semibold">Une étude personnalisée pour votre cas.</p>
              <Link to="/contact" className="mt-5 inline-flex items-center gap-2 h-10 px-4 bg-copper text-copper-foreground rounded-sm text-sm font-medium">
                Demander un devis <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </aside>
        </div>
      </Section>

      <Section className="bg-surface" eyebrow="Secteurs concernés" title="Cette solution s'applique à :">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sectors.map((s) => (
            <SectorCard key={s.id} sector={s} />
          ))}
        </div>
      </Section>
    </>
  );
}
