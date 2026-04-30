import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Section, CTAButton } from "@/components/Section";
import { Breadcrumb } from "@/components/Breadcrumb";
import { SolutionCard } from "@/components/SolutionCard";
import { sectorBySlug } from "@/data/sectors";
import { solutionById } from "@/data/solutions";
import { brandById } from "@/data/brands";

export const Route = createFileRoute("/secteurs/$slug")({
  component: SectorDetailPage,
  notFoundComponent: () => (
    <div className="container-wide py-24 text-center">
      <p className="eyebrow">Secteur introuvable</p>
      <Link to="/prestations-services" className="mt-4 inline-block text-petrol underline">Retour aux secteurs</Link>
    </div>
  ),
  loader: ({ params }) => {
    const s = sectorBySlug[params.slug];
    if (!s) throw notFound();
    return s;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — Secteur Meta-V Solutions` },
          { name: "description", content: loaderData.shortDescription },
          { property: "og:title", content: loaderData.title },
          { property: "og:description", content: loaderData.shortDescription },
        ]
      : [],
  }),
});

function SectorDetailPage() {
  const sec = Route.useLoaderData();
  const solutions = sec.solutionIds.map((id) => solutionById[id]).filter(Boolean);
  const brands = sec.brandIds.map((id) => brandById[id]).filter(Boolean);

  return (
    <>
      <section className="border-b border-border">
        <div className="container-wide py-12 lg:py-16">
          <Breadcrumb
            items={[
              { label: "Accueil", to: "/" },
              { label: "Prestations & Services", to: "/prestations-services" },
              { label: sec.title },
            ]}
          />
          <div className="mt-6 grid lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <p className="eyebrow">{sec.id} · Secteur</p>
              <h1 className="mt-3 text-4xl md:text-5xl lg:text-[56px] font-display font-semibold tracking-tight leading-[1.05]">
                {sec.title}
              </h1>
              <p className="mt-6 text-lg text-ink-soft max-w-2xl">{sec.longDescription ?? sec.shortDescription}</p>
            </div>
            <div className="lg:col-span-4 flex lg:justify-end">
              <CTAButton to="/contact" variant="primary">Demander une étude <ArrowRight className="h-4 w-4" /></CTAButton>
            </div>
          </div>
        </div>
      </section>

      {sec.challenges && sec.challenges.length > 0 && (
        <Section eyebrow="Problématiques fréquentes" title="Les enjeux de ce secteur">
          <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {sec.challenges.map((c, i) => (
              <li key={c} className="p-5 bg-card border border-border rounded-md">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-petrol">{String(i + 1).padStart(2, "0")}</p>
                <p className="mt-3 font-medium">{c}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section className="bg-surface" eyebrow="Solutions adaptées" title={`${solutions.length} solutions Meta-V pour ce secteur`}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {solutions.map((s) => (
            <SolutionCard key={s.id} solution={s} compact />
          ))}
        </div>
      </Section>

      <Section eyebrow="Gammes & marques" title="Marques recommandées pour ce secteur">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {brands.map((b) => (
            <Link key={b.id} to="/marques" className="group p-6 bg-card border border-border rounded-md hover:border-petrol/50 transition-all">
              <h3 className="font-display text-xl font-semibold group-hover:text-petrol transition-colors">{b.name}</h3>
              <p className="mt-1 text-sm text-petrol">{b.tagline}</p>
              <p className="mt-3 text-sm text-ink-soft">{b.description}</p>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
