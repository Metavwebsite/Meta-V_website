import { createFileRoute } from "@tanstack/react-router";
import { Section, CTAButton } from "@/components/Section";
import { Breadcrumb } from "@/components/Breadcrumb";
import { SolutionCard } from "@/components/SolutionCard";
import { SectorCard } from "@/components/SectorCard";
import { solutions } from "@/data/solutions";
import { sectors } from "@/data/sectors";

export const Route = createFileRoute("/prestations-services")({
  head: () => ({
    meta: [
      { title: "Prestations & Services — Solutions par problématique | Meta-V Solutions" },
      { name: "description", content: "18 solutions techniques pour 15 secteurs industriels : captation, dépoussiérage, ATEX, soudage, gaz, machines. Partez de votre problématique métier." },
      { property: "og:title", content: "Prestations & Services — Meta-V Solutions" },
      { property: "og:description", content: "Solutions par problématique terrain, par secteur industriel." },
    ],
  }),
  component: PrestationsPage,
});

function PrestationsPage() {
  return (
    <>
      <section className="border-b border-border bg-surface">
        <div className="container-wide py-12 lg:py-16">
          <Breadcrumb items={[{ label: "Accueil", to: "/" }, { label: "Prestations & Services" }]} />
          <div className="mt-6 max-w-3xl">
            <p className="eyebrow">Logique solution</p>
            <h1 className="mt-3 text-4xl md:text-5xl lg:text-6xl font-display font-semibold tracking-tight leading-[1.05]">
              Partez de votre <span className="text-petrol">problématique</span>.
            </h1>
            <p className="mt-6 text-lg text-ink-soft">
              Captation des fumées, dépoussiérage, ATEX, soudage, distribution gaz, automatisation : chaque carte regroupe la combinaison matériel + intégration adaptée. Cliquez sur un secteur pour accéder aux gammes correspondantes.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <CTAButton to="/contact" variant="primary">Demander une étude</CTAButton>
              <CTAButton to="/materiel" variant="ghost">Parcourir le matériel</CTAButton>
            </div>
          </div>
        </div>
      </section>

      <Section
        eyebrow={`${solutions.length} solutions`}
        title="Toutes les solutions Meta-V"
        intro="Survolez (desktop) ou dépliez (mobile) chaque carte pour révéler les secteurs concernés. Chaque secteur est cliquable."
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {solutions.map((s) => (
            <SolutionCard key={s.id} solution={s} />
          ))}
        </div>
      </Section>

      <Section className="bg-surface" eyebrow={`${sectors.length} secteurs`} title="Tous les secteurs couverts">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sectors.map((s) => (
            <SectorCard key={s.id} sector={s} />
          ))}
        </div>
      </Section>
    </>
  );
}
