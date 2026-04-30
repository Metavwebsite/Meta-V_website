import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  to?: string;
  params?: Record<string, string>;
}

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className="flex items-center flex-wrap gap-1 text-xs text-ink-soft">
      {items.map((c, i) => (
        <span key={i} className="inline-flex items-center gap-1">
          {c.to ? (
            <Link to={c.to as never} params={c.params as never} className="hover:text-foreground transition-colors">
              {c.label}
            </Link>
          ) : (
            <span className="text-foreground">{c.label}</span>
          )}
          {i < items.length - 1 && <ChevronRight className="h-3 w-3 opacity-50" />}
        </span>
      ))}
    </nav>
  );
}
