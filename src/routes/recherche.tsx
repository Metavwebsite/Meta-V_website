import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Section } from "@/components/Section";
import { Breadcrumb } from "@/components/Breadcrumb";
import { searchAll } from "@/lib/catalog";

export const Route = createFileRoute("/recherche")({
  head: () => ({
    meta: [
      { title: "Recherche — Meta-V Solutions" },
      { name: "description", content: "Recherchez dans le catalogue Meta-V : produits, catégories, solutions, secteurs, marques." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const [q, setQ] = useState("");
  const results = useMemo(() => searchAll(q), [q]);

  return (
    <>
      <section className="border-b border-border">
        <div className="container-wide py-12">
          <Breadcrumb items={[{ label: "Accueil", to: "/" }, { label: "Recherche" }]} />
          <div className="mt-6 max-w-3xl">
            <p className="eyebrow">Recherche locale</p>
            <h1 className="mt-3 text-4xl md:text-5xl font-display font-semibold tracking-tight">
              Trouvez un produit, une solution, un secteur.
            </h1>
            <div className="mt-8 relative">
              <Search className="h-5 w-5 text-ink-soft absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ex. ATEX, soudage, KEMPER, générateur azote..."
                className="w-full h-14 pl-12 pr-4 text-base border border-input bg-background rounded-sm focus:outline-none focus:ring-2 focus:ring-petrol/30 focus:border-petrol"
              />
            </div>
          </div>
        </div>
      </section>

      <Section>
        {!q && <p className="text-ink-soft">Saisissez un terme pour démarrer la recherche.</p>}
        {q && results.length === 0 && <p className="text-ink-soft">Aucun résultat pour « {q} ».</p>}
        {results.length > 0 && (
          <ul className="divide-y divide-border border border-border rounded-md bg-card">
            {results.map((r, i) => (
              <li key={i}>
                <Link
                  to={r.to as never}
                  params={r.params as never}
                  className="flex items-center justify-between gap-4 p-4 hover:bg-surface transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-petrol">{r.type}</span>
                      <span className="font-medium truncate">{r.title}</span>
                    </div>
                    {r.description && <p className="text-sm text-ink-soft mt-1 line-clamp-1">{r.description}</p>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
