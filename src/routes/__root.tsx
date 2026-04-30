import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center container-wide">
      <div className="max-w-md text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-petrol mb-4">Erreur 404</p>
        <h1 className="text-5xl font-display font-semibold">Page introuvable</h1>
        <p className="mt-4 text-ink-soft">Cette page n'existe pas ou a été déplacée.</p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center h-11 px-5 bg-petrol text-petrol-foreground rounded-sm text-sm font-medium hover:bg-petrol/90"
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Meta-V Solutions — Équipements industriels & solutions techniques" },
      { name: "description", content: "Distributeur et intégrateur d'équipements industriels au Maroc : aspiration, gaz, soudage, machines, outils. Solutions adaptées aux problématiques terrain." },
      { name: "author", content: "Meta-V Solutions" },
      { property: "og:title", content: "Meta-V Solutions — Équipements & solutions industrielles" },
      { property: "og:description", content: "Matériel industriel premium et solutions techniques pour les industries marocaines." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
