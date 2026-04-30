import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, Search, ArrowRight } from "lucide-react";
import { Logo } from "./Logo";
import { navigation } from "@/data/navigation";
import { cn } from "@/lib/utils";

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-colors duration-300",
        scrolled
          ? "bg-background/85 backdrop-blur-md border-border"
          : "bg-background border-transparent"
      )}
    >
      <div className="container-wide flex h-16 items-center justify-between">
        <Link to="/" className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {navigation.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "text-petrol" }}
              className="px-3 py-2 text-sm font-medium text-ink-soft hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/recherche"
            className="hidden sm:grid h-9 w-9 place-items-center rounded-sm text-ink-soft hover:text-foreground hover:bg-surface transition-colors"
            aria-label="Rechercher"
          >
            <Search className="h-4 w-4" />
          </Link>
          <Link
            to="/contact"
            className="hidden md:inline-flex items-center gap-2 h-9 px-4 bg-petrol text-petrol-foreground text-sm font-medium rounded-sm hover:bg-petrol/90 transition-colors group"
          >
            Demander un devis
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <button
            className="lg:hidden grid h-9 w-9 place-items-center rounded-sm hover:bg-surface"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-background">
          <nav className="container-wide py-4 flex flex-col">
            {navigation.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="py-3 text-base font-medium border-b border-border last:border-0"
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/contact"
              onClick={() => setOpen(false)}
              className="mt-4 inline-flex items-center justify-center gap-2 h-11 px-4 bg-petrol text-petrol-foreground rounded-sm font-medium"
            >
              Demander un devis <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
