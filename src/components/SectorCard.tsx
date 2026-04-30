import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import type { Sector } from "@/types/catalog";

export function SectorCard({ sector }: { sector: Sector }) {
  return (
    <Link
      to="/secteurs/$slug"
      params={{ slug: sector.slug }}
      className="group relative block p-6 bg-card border border-border rounded-md hover:border-petrol/60 transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-petrol">{sector.id}</p>
        <ArrowUpRight className="h-4 w-4 text-ink-soft group-hover:text-petrol transition-colors" />
      </div>
      <h3 className="mt-3 font-display text-lg font-semibold leading-snug">{sector.title}</h3>
      <p className="mt-2 text-sm text-ink-soft leading-relaxed">{sector.shortDescription}</p>
      <div className="mt-4 flex items-center gap-3 text-xs text-ink-soft">
        <span>{sector.solutionIds.length} solutions</span>
        <span className="h-3 w-px bg-border" />
        <span>{sector.brandIds.length} marques</span>
      </div>
    </Link>
  );
}
