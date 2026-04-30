import { createFileRoute } from "@tanstack/react-router";
import { Section } from "@/components/Section";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Mail, Phone, MapPin, ArrowRight } from "lucide-react";
import { company } from "@/data/navigation";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact & Devis — Meta-V Solutions" },
      { name: "description", content: "Contactez Meta-V Solutions pour un devis ou une étude technique. Équipements industriels et solutions B2B au Maroc." },
      { property: "og:title", content: "Contact Meta-V Solutions" },
      { property: "og:description", content: "Demandez un devis ou une étude pour votre besoin industriel." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <>
      <section className="border-b border-border">
        <div className="container-wide py-12 lg:py-16">
          <Breadcrumb items={[{ label: "Accueil", to: "/" }, { label: "Contact" }]} />
          <div className="mt-6 max-w-3xl">
            <p className="eyebrow">Devis & étude</p>
            <h1 className="mt-3 text-4xl md:text-5xl lg:text-6xl font-display font-semibold tracking-tight leading-[1.05]">
              Parlons de votre <span className="text-petrol">besoin terrain</span>.
            </h1>
            <p className="mt-6 text-lg text-ink-soft">
              Décrivez votre contexte (procédé, secteur, contrainte). Nous revenons rapidement avec une proposition technique adaptée.
            </p>
          </div>
        </div>
      </section>

      <Section>
        <div className="grid lg:grid-cols-12 gap-10">
          {/* Form */}
          <form className="lg:col-span-7 space-y-5 bg-card border border-border rounded-md p-6 lg:p-8" onSubmit={(e) => e.preventDefault()}>
            <p className="eyebrow">Demande de devis</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Nom & prénom" id="name" />
              <Field label="Société" id="company" />
              <Field label="Email" id="email" type="email" />
              <Field label="Téléphone" id="phone" type="tel" />
            </div>
            <Field label="Secteur d'activité" id="sector" placeholder="Ex. usinage, soudage, alimentaire..." />
            <Field label="Besoin / problématique" id="need" placeholder="Ex. captation des fumées de soudage sur 8 postes" />
            <div>
              <label htmlFor="message" className="block text-xs font-mono uppercase tracking-wider text-ink-soft mb-1.5">Détails complémentaires</label>
              <textarea
                id="message"
                rows={5}
                className="w-full px-3 py-2 text-sm border border-input bg-background rounded-sm focus:outline-none focus:ring-2 focus:ring-petrol/30 focus:border-petrol"
                placeholder="Volumes, configuration de l'atelier, délais..."
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 h-11 px-5 bg-petrol text-petrol-foreground rounded-sm text-sm font-medium hover:bg-petrol/90"
            >
              Envoyer la demande <ArrowRight className="h-4 w-4" />
            </button>
            <p className="text-xs text-ink-soft">Formulaire de démonstration — branchement back-end à venir.</p>
          </form>

          {/* Coordinates */}
          <aside className="lg:col-span-5 space-y-5">
            <div className="p-6 bg-surface border border-border rounded-md">
              <p className="eyebrow">Coordonnées directes</p>
              <ul className="mt-5 space-y-4 text-sm">
                <li className="flex gap-3">
                  <Mail className="h-5 w-5 text-petrol shrink-0 mt-0.5" />
                  <div>
                    <p className="text-ink-soft text-xs uppercase tracking-wider font-mono">Email</p>
                    <p className="font-medium">{company.email}</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <Phone className="h-5 w-5 text-petrol shrink-0 mt-0.5" />
                  <div>
                    <p className="text-ink-soft text-xs uppercase tracking-wider font-mono">Téléphone</p>
                    <p className="font-medium">{company.phone}</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <MapPin className="h-5 w-5 text-petrol shrink-0 mt-0.5" />
                  <div>
                    <p className="text-ink-soft text-xs uppercase tracking-wider font-mono">Adresse</p>
                    <p className="font-medium">{company.address}</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="p-6 bg-foreground text-background rounded-md">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-copper">Réactivité</p>
              <p className="mt-3 font-display text-xl font-semibold leading-snug">
                Réponse sous 48h ouvrées sur les demandes de devis qualifiées.
              </p>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}

function Field({ label, id, type = "text", placeholder }: { label: string; id: string; type?: string; placeholder?: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-mono uppercase tracking-wider text-ink-soft mb-1.5">{label}</label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        className="w-full h-10 px-3 text-sm border border-input bg-background rounded-sm focus:outline-none focus:ring-2 focus:ring-petrol/30 focus:border-petrol"
      />
    </div>
  );
}
