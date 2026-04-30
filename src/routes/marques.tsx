import { createFileRoute } from "@tanstack/react-router";
import { Section } from "@/components/Section";
import { Breadcrumb } from "@/components/Breadcrumb";
import { brands } from "@/data/brands";

export const Route = createFileRoute("/marques")({
  head: () => ({
    meta: [
      { title: "Marques partenaires — Meta-V Solutions" },
      { name: "description", content: "KEMPER, Dupuy, Spectron, VICI DBS, Lincoln Electric, Kemppi, Siegmund, AXXAIR, FICEP, Einhell : nos partenaires industriels." },
      { property: "og:title", content: "Marques partenaires Meta-V Solutions" },
      { property: "og:description", content: "Constructeurs reconnus, sélectionnés pour leur expertise et leur fiabilité." },
    ],
  }),
  component: MarquesPage,
});

function MarquesPage() {
  return (
    <>
      <section className="border-b border-border">
        <div className="container-wide py-12 lg:py-16">
          <Breadcrumb items={[{ label: "Accueil", to: "/" }, { label: "Marques" }]} />
          <div className="mt-6 max-w-3xl">
            <p className="eyebrow">Partenaires techniques</p>
            <h1 className="mt-3 text-4xl md:text-5xl lg:text-6xl font-display font-semibold tracking-tight leading-[1.05]">
              Les constructeurs<br />que nous distribuons.
            </h1>
            <p className="mt-6 text-lg text-ink-soft">
              Chaque marque a été choisie pour son expertise verticale, sa fiabilité long terme et la qualité de son support technique.
            </p>
          </div>
        </div>
      </section>

      <Section>
        <div className="grid md:grid-cols-2 gap-5">
          {brands.map((b) => (
            <article key={b.id} className="p-7 lg:p-8 bg-card border border-border rounded-md">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl lg:text-3xl font-semibold tracking-tight">{b.name}</h2>
                  <p className="mt-1 text-sm text-petrol font-medium">{b.tagline}</p>
                </div>
              </div>
              <p className="mt-5 text-sm text-ink-soft leading-relaxed">{b.description}</p>
              <div className="mt-5 pt-5 border-t border-border flex flex-wrap gap-1.5">
                {b.expertise.map((e) => (
                  <span key={e} className="text-[11px] font-mono uppercase tracking-wide text-ink-soft border border-border px-2 h-6 inline-flex items-center rounded-sm">
                    {e}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </Section>
    </>
  );
}
