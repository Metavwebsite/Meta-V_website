import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { company } from "@/data/navigation";
import { categoryGroups } from "@/data/categories";

export function Footer() {
  return (
    <footer className="bg-surface-strong border-t border-border mt-32">
      <div className="container-wide py-16 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10">
        <div className="col-span-2">
          <Logo />
          <p className="mt-4 text-sm text-ink-soft max-w-sm">
            {company.description}
          </p>
          <div className="mt-6 space-y-1.5 text-sm">
            <p className="text-ink-soft"><span className="text-foreground font-medium">Email · </span>{company.email}</p>
            <p className="text-ink-soft"><span className="text-foreground font-medium">Tél · </span>{company.phone}</p>
            <p className="text-ink-soft"><span className="text-foreground font-medium">Adresse · </span>{company.address}</p>
          </div>
        </div>

        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-petrol mb-4">Activités</p>
          <ul className="space-y-2 text-sm">
            {categoryGroups.map((g) => (
              <li key={g.id}>
                <Link to="/materiel" className="text-ink-soft hover:text-foreground transition-colors">
                  {g.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-petrol mb-4">Navigation</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/materiel" className="text-ink-soft hover:text-foreground">Matériel</Link></li>
            <li><Link to="/prestations-services" className="text-ink-soft hover:text-foreground">Prestations & Services</Link></li>
            <li><Link to="/marques" className="text-ink-soft hover:text-foreground">Marques</Link></li>
            <li><Link to="/a-propos" className="text-ink-soft hover:text-foreground">À propos</Link></li>
            <li><Link to="/contact" className="text-ink-soft hover:text-foreground">Contact</Link></li>
          </ul>
        </div>

        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-petrol mb-4">Devis</p>
          <p className="text-sm text-ink-soft mb-4">
            Décrivez-nous votre besoin terrain, nous revenons rapidement avec une proposition adaptée.
          </p>
          <Link
            to="/contact"
            className="inline-flex h-9 items-center px-3 text-sm bg-foreground text-background rounded-sm hover:bg-foreground/85"
          >
            Nous contacter
          </Link>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-wide py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} {company.name}. Tous droits réservés.</p>
          <p className="font-mono uppercase tracking-[0.18em]">Industrial Equipment · Morocco</p>
        </div>
      </div>
    </footer>
  );
}
