import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, CheckCircle2, Wrench, Factory, Sparkles } from "lucide-react";
import heroImg from "@/assets/hero-industrial.jpg";
import { Section, CTAButton } from "@/components/Section";
import { SolutionCard } from "@/components/SolutionCard";
import { SectorCard } from "@/components/SectorCard";
import { solutions } from "@/data/solutions";
import { sectors } from "@/data/sectors";
import { brands } from "@/data/brands";
import { categoryGroups } from "@/data/categories";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Meta-V Solutions — Équipements industriels & solutions techniques au Maroc" },
      { name: "description", content: "Aspiration, soudage, gaz, machines, outillage. Meta-V Solutions équipe les industriels avec du matériel premium et des solutions adaptées aux problématiques terrain." },
      { property: "og:title", content: "Meta-V Solutions — Équipements industriels" },
      { property: "og:description", content: "Matériel industriel premium et solutions techniques B2B." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const prioritySolutions = solutions.filter((s) => s.priority);
  const prioritySectors = sectors.filter((s) => s.priority);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="container-wide pt-12 lg:pt-20 pb-16 lg:pb-24">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 xl:col-span-5">
              <div className="inline-flex items-center gap-2 h-7 px-2.5 border border-border rounded-sm bg-surface">
                <span className="h-1.5 w-1.5 rounded-full bg-copper" />
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">
                  Industrial Equipment · Maroc
                </span>
              </div>
              <h1 className="mt-6 text-[42px] sm:text-5xl lg:text-[64px] xl:text-[72px] leading-[0.98] tracking-[-0.025em] font-display font-semibold">
                Le matériel <span className="text-petrol">industriel</span><br />
                qui répond à vos contraintes terrain.
              </h1>
              <p className="mt-7 text-lg lg:text-xl text-ink-soft max-w-xl leading-relaxed">
                Meta-V Solutions accompagne les industriels marocains avec des équipements techniques
                et des solutions adaptées à chaque problématique de production, de maintenance et de sécurité.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <CTAButton to="/materiel" variant="primary">
                  Découvrir le matériel <ArrowRight className="h-4 w-4" />
                </CTAButton>
                <CTAButton to="/prestations-services" variant="outline">
                  Explorer nos solutions
                </CTAButton>
              </div>

              <dl className="mt-12 grid grid-cols-3 gap-6 max-w-md">
                {[
                  { k: "10+", v: "Marques partenaires" },
                  { k: "18", v: "Solutions terrain" },
                  { k: "15", v: "Secteurs couverts" },
                ].map((s) => (
                  <div key={s.v}>
                    <dt className="font-display text-3xl font-semibold tracking-tight">{s.k}</dt>
                    <dd className="mt-1 text-xs text-ink-soft uppercase tracking-wider font-mono">{s.v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="lg:col-span-6 xl:col-span-7 relative">
              <div className="relative corner-marks">
                <img
                  src={heroImg}
                  alt="Atelier industriel premium avec robot de soudage, machine CNC et bras d'aspiration"
                  width={1920}
                  height={1280}
                  className="w-full aspect-[4/3] object-cover rounded-sm"
                />
                <div className="absolute inset-0 ring-1 ring-foreground/5 pointer-events-none rounded-sm" />
              </div>
              <div className="absolute -bottom-6 -left-4 lg:-left-8 bg-card border border-border p-4 max-w-[260px] shadow-card hidden md:block">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-petrol">Approche</p>
                <p className="mt-2 text-sm font-medium leading-snug">
                  Du matériel + du conseil + une intégration adaptée à votre process.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — DOUBLE ENTRÉE */}
      <Section
        eyebrow="Deux entrées · Une expertise"
        title={<>Choisissez votre point d'entrée.</>}
        intro="Vous savez quel équipement vous cherchez, ou vous partez d'une problématique de production : Meta-V vous accompagne dans les deux logiques."
      >
        <div className="grid md:grid-cols-2 gap-5">
          {/* Bloc A — Matériel */}
          <Link
            to="/materiel"
            className="group relative bg-foreground text-background p-8 lg:p-10 rounded-sm overflow-hidden hover:bg-foreground/95 transition-colors"
          >
            <div className="absolute top-0 right-0 w-40 h-40 opacity-[0.07]">
              <Wrench className="w-full h-full" strokeWidth={1} />
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-copper">A · Matériel</p>
            <h3 className="mt-4 text-3xl lg:text-4xl font-display font-semibold leading-tight">
              Parcourir<br />les catégories produit
            </h3>
            <p className="mt-4 text-base text-background/70 max-w-md">
              Naviguez dans une arborescence claire : catégories, sous-catégories et fiches produits.
              Aspiration, gaz, soudage, machines, outillage et maintenance.
            </p>
            <div className="mt-8 flex items-center gap-2 text-sm font-medium">
              Voir les catégories
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Bloc B — Solutions */}
          <Link
            to="/prestations-services"
            className="group relative bg-petrol text-petrol-foreground p-8 lg:p-10 rounded-sm overflow-hidden hover:bg-petrol/95 transition-colors"
          >
            <div className="absolute top-0 right-0 w-40 h-40 opacity-[0.12]">
              <Factory className="w-full h-full" strokeWidth={1} />
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-copper">B · Prestations & Services</p>
            <h3 className="mt-4 text-3xl lg:text-4xl font-display font-semibold leading-tight">
              Partir d'une<br />problématique métier
            </h3>
            <p className="mt-4 text-base text-petrol-foreground/80 max-w-md">
              Décrivez votre besoin terrain — captation, dépoussiérage, soudage, gaz —
              et accédez aux secteurs concernés et aux gammes adaptées.
            </p>
            <div className="mt-8 flex items-center gap-2 text-sm font-medium">
              Voir les solutions
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </Section>

      {/* SECTION 3 — UNIVERS MATÉRIEL */}
      <Section
        eyebrow="Univers matériel"
        title="Six grandes familles d'équipements."
        intro="Une couverture cohérente du besoin atelier au besoin process : sécurité, productivité, maintenance."
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border rounded-sm overflow-hidden">
          {categoryGroups.map((g, i) => (
            <Link
              key={g.id}
              to="/materiel"
              className="group bg-card p-7 lg:p-8 hover:bg-surface transition-colors relative"
            >
              <div className="flex items-start justify-between">
                <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-petrol">
                  {String(i + 1).padStart(2, "0")} / 06
                </span>
                <ArrowUpRight className="h-4 w-4 text-ink-soft opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold">{g.title}</h3>
              <p className="mt-2 text-sm text-ink-soft">{g.description}</p>
            </Link>
          ))}
        </div>
        <div className="mt-10 flex justify-center">
          <CTAButton to="/materiel" variant="ghost">
            Explorer toutes les catégories <ArrowRight className="h-4 w-4" />
          </CTAButton>
        </div>
      </Section>

      {/* SECTION 4 — SOLUTIONS */}
      <Section
        className="bg-surface"
        eyebrow="Solutions par problématique"
        title={<>Une réponse <span className="text-petrol">par besoin métier</span>.</>}
        intro="Survolez chaque solution pour découvrir les secteurs concernés. Chaque secteur ouvre les gammes produits adaptées."
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {prioritySolutions.map((s) => (
            <SolutionCard key={s.id} solution={s} />
          ))}
        </div>
        <div className="mt-12 flex justify-center">
          <CTAButton to="/prestations-services" variant="outline">
            Voir toutes les solutions
          </CTAButton>
        </div>
      </Section>

      {/* SECTION 5 — SECTEURS */}
      <Section
        eyebrow="Secteurs couverts"
        title="Une approche par industrie."
        intro="Chaque secteur a ses contraintes. Meta-V combine matériel et expertise pour répondre concrètement aux enjeux de chaque filière."
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {prioritySectors.map((s) => (
            <SectorCard key={s.id} sector={s} />
          ))}
        </div>
        <div className="mt-10 flex justify-center">
          <Link to="/prestations-services" className="text-sm font-medium text-petrol inline-flex items-center gap-2 hover:gap-3 transition-all">
            Voir les 15 secteurs <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Section>

      {/* SECTION 6 — MARQUES */}
      <Section
        className="bg-surface"
        eyebrow="Partenaires techniques"
        title="Des marques choisies pour leur expertise."
        intro="Meta-V Solutions sélectionne des constructeurs reconnus, capables de tenir la promesse industrielle sur le long terme."
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-px bg-border border border-border rounded-sm overflow-hidden">
          {brands.map((b) => (
            <Link
              key={b.id}
              to="/marques"
              className="group bg-card p-6 hover:bg-surface transition-colors text-center"
            >
              <p className="font-display text-lg font-semibold tracking-tight">{b.name}</p>
              <p className="mt-1 text-[11px] uppercase tracking-wider text-ink-soft font-mono">
                {b.expertise[0]}
              </p>
            </Link>
          ))}
        </div>
      </Section>

      {/* SECTION 7 — POURQUOI META-V */}
      <Section
        eyebrow="Pourquoi Meta-V Solutions"
        title="Plus qu'un catalogue : une orientation solution."
      >
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { t: "Compréhension terrain", d: "Nous partons toujours du contexte de production avant de proposer un équipement." },
            { t: "Sélection technique", d: "Marques choisies pour leur fiabilité industrielle, leur SAV et leur disponibilité long terme." },
            { t: "Intégration & support", d: "De l'étude à la mise en route, jusqu'à l'accompagnement maintenance." },
            { t: "Approche sectorielle", d: "Une connaissance des contraintes propres à chaque filière industrielle." },
          ].map((b) => (
            <div key={b.t} className="border-t-2 border-petrol pt-5">
              <CheckCircle2 className="h-5 w-5 text-petrol" />
              <h3 className="mt-3 font-display text-lg font-semibold">{b.t}</h3>
              <p className="mt-2 text-sm text-ink-soft leading-relaxed">{b.d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* SECTION 8 — CTA FINAL */}
      <section className="container-wide pb-24">
        <div className="relative bg-foreground text-background rounded-sm overflow-hidden p-10 lg:p-16">
          <div className="absolute inset-0 rule-grid opacity-[0.04] pointer-events-none" />
          <div className="relative grid lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2">
              <Sparkles className="h-6 w-6 text-copper" />
              <h2 className="mt-4 text-3xl lg:text-5xl font-display font-semibold leading-[1.05] tracking-tight">
                Un équipement à choisir ?<br />
                <span className="text-background/60">Une solution à intégrer ?</span>
              </h2>
              <p className="mt-5 text-lg text-background/70 max-w-2xl">
                Décrivez-nous votre contexte de production. Nous vous orientons vers la combinaison
                matériel + intégration la plus adaptée.
              </p>
            </div>
            <div className="flex flex-col gap-3 lg:items-end">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 h-12 px-6 bg-copper text-copper-foreground rounded-sm font-medium hover:bg-copper/90 transition-colors"
              >
                Demander un devis <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 h-12 px-6 border border-background/30 text-background hover:bg-background/10 rounded-sm font-medium transition-colors"
              >
                Nous contacter
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
