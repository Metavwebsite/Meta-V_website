import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import type { Solution } from "@/types/catalog";
import { sectorById } from "@/data/sectors";
import { brandById } from "@/data/brands";
import { cn } from "@/lib/utils";

export function SolutionCard({ solution, compact = false }: { solution: Solution; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const sectors = solution.sectorIds.map((id) => sectorById[id]).filter(Boolean);
  const brands = solution.brandIds.map((id) => brandById[id]).filter(Boolean);

  return (
    <article
      className={cn(
        "group relative bg-card border border-border rounded-md transition-all duration-300",
        "hover:border-petrol/50 hover:shadow-[0_8px_28px_-12px_rgba(0,0,0,0.12)]",
        compact ? "p-5" : "p-6 lg:p-7"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-petrol">{solution.id}</p>
        <Link
          to="/solutions/$slug"
          params={{ slug: solution.slug }}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-ink-soft hover:text-foreground"
          aria-label={`Voir la solution ${solution.title}`}
        >
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <h3 className="mt-2 text-xl lg:text-[22px] font-semibold leading-snug">
        <Link to="/solutions/$slug" params={{ slug: solution.slug }} className="hover:text-petrol transition-colors">
          {solution.title}
        </Link>
      </h3>
      <p className="mt-3 text-sm text-ink-soft leading-relaxed">{solution.shortDescription}</p>

      {brands.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {brands.slice(0, 3).map((b) => (
            <span key={b.id} className="text-[11px] font-mono uppercase tracking-wide text-ink-soft border border-border px-2 h-5 inline-flex items-center rounded-sm">
              {b.name}
            </span>
          ))}
        </div>
      )}

      {/* Desktop: hover reveal — Mobile: tap to expand */}
      <div className="mt-5 pt-5 border-t border-border">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="lg:hidden w-full flex items-center justify-between text-sm font-medium"
          aria-expanded={open}
        >
          <span>Secteurs concernés ({sectors.length})</span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        </button>

        <div className="hidden lg:block">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft mb-3">
            Secteurs concernés
          </p>
        </div>

        <div
          className={cn(
            "overflow-hidden transition-all",
            "lg:max-h-none lg:opacity-100 lg:mt-0",
            open ? "max-h-[600px] opacity-100 mt-4" : "max-h-0 opacity-0 lg:opacity-100"
          )}
        >
          <div className="flex flex-wrap gap-1.5">
            {sectors.map((s) => (
              <Link
                key={s.id}
                to="/secteurs/$slug"
                params={{ slug: s.slug }}
                className="inline-flex items-center h-7 px-2.5 text-xs bg-surface hover:bg-petrol hover:text-petrol-foreground text-foreground rounded-sm border border-border hover:border-petrol transition-colors"
              >
                {s.shortTitle}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
