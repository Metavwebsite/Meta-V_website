import { createFileRoute } from "@tanstack/react-router";
import { Section, CTAButton } from "@/components/Section";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/a-propos")({
  head: () => ({
    meta: [
      { title: "À propos — Meta-V Solutions" },
      { name: "description", content: "Meta-V Solutions, partenaire technique des industriels marocains : équipements, intégration, conseil et support." },
      { property: "og:title", content: "À propos de Meta-V Solutions" },
      { property: "og:description", content: "Distributeur et intégrateur d'équipements industriels au Maroc." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <>
      <section className="border-b border-border bg-surface">
        <div className="container-wide py-12 lg:py-16">
          <Breadcrumb items={[{ label: "Accueil", to: "/" }, { label: "À propos" }]} />
          <div className="mt-6 max-w-3xl">
            <p className="eyebrow">L'entreprise</p>
            <h1 className="mt-3 text-4xl md:text-5xl lg:text-6xl font-display font-semibold tracking-tight leading-[1.05]">
              Partenaire technique<br />des industriels <span className="text-petrol">marocains</span>.
            </h1>
            <p className="mt-6 text-lg text-ink-soft">
              Meta-V Solutions est un distributeur et intégrateur d'équipements industriels.
              Nous combinons matériel premium, expertise terrain et accompagnement long terme pour répondre aux problématiques de production, maintenance et sécurité.
            </p>
          </div>
        </div>
      </section>

      <Section eyebrow="Notre approche" title="Du matériel, du conseil, une intégration.">
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-petrol">01</span>
            <h3 className="mt-3 font-display text-2xl font-semibold">Comprendre</h3>
            <p className="mt-3 text-ink-soft text-sm leading-relaxed">
              Avant de proposer un équipement, nous prenons le temps de comprendre le process, les contraintes terrain et les enjeux opérateurs.
            </p>
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-petrol">02</span>
            <h3 className="mt-3 font-display text-2xl font-semibold">Proposer</h3>
            <p className="mt-3 text-ink-soft text-sm leading-relaxed">
              Nous sélectionnons la combinaison matériel adaptée parmi nos marques partenaires, en transparence sur les choix techniques.
            </p>
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-petrol">03</span>
            <h3 className="mt-3 font-display text-2xl font-semibold">Accompagner</h3>
            <p className="mt-3 text-ink-soft text-sm leading-relaxed">
              De la mise en route à la maintenance préventive, nous restons impliqués dans la vie du matériel.
            </p>
          </div>
        </div>
      </Section>

      <Section className="bg-surface" eyebrow="Nos domaines d'expertise" title="Six familles d'équipements industriels.">
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            "Soudage et coupage thermique",
            "Aspiration et filtration industrielle",
            "Distribution et génération de gaz",
            "Machines, automation et lignes CNC",
            "Outils industriels et consommables",
            "Maintenance, atelier et chantier",
          ].map((t) => (
            <li key={t} className="flex items-start gap-3 p-5 bg-card border border-border rounded-md">
              <CheckCircle2 className="h-5 w-5 text-petrol shrink-0 mt-0.5" />
              <span className="font-medium">{t}</span>
            </li>
          ))}
        </ul>
        <div className="mt-12 text-center">
          <CTAButton to="/contact" variant="primary">Échanger avec nos équipes</CTAButton>
        </div>
      </Section>
    </>
  );
}
