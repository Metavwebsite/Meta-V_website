import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Section({
  eyebrow,
  title,
  intro,
  children,
  className,
  align = "left",
}: {
  eyebrow?: string;
  title?: ReactNode;
  intro?: ReactNode;
  children: ReactNode;
  className?: string;
  align?: "left" | "center";
}) {
  return (
    <section className={cn("py-20 lg:py-28", className)}>
      <div className="container-wide">
        {(eyebrow || title || intro) && (
          <div className={cn("max-w-3xl mb-12 lg:mb-16", align === "center" && "mx-auto text-center")}>
            {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
            {title && <h2 className="text-3xl md:text-4xl lg:text-[42px] leading-[1.1] tracking-tight">{title}</h2>}
            {intro && <p className="mt-5 text-lg text-ink-soft leading-relaxed">{intro}</p>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 h-6 px-2 text-[11px] font-mono uppercase tracking-[0.12em] bg-surface text-ink-soft border border-border rounded-sm">
      {children}
    </span>
  );
}

export function CTAButton({
  to,
  children,
  variant = "primary",
  params,
}: {
  to: string;
  children: ReactNode;
  variant?: "primary" | "ghost" | "outline";
  params?: Record<string, string>;
}) {
  const styles = {
    primary: "bg-petrol text-petrol-foreground hover:bg-petrol/90",
    ghost: "text-foreground hover:bg-surface",
    outline: "border border-foreground text-foreground hover:bg-foreground hover:text-background",
  } as const;
  return (
    <Link
      to={to as never}
      params={params as never}
      className={cn(
        "inline-flex items-center gap-2 h-11 px-5 rounded-sm text-sm font-medium transition-colors",
        styles[variant]
      )}
    >
      {children}
    </Link>
  );
}
