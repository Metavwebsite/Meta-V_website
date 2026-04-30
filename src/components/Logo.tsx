import { cn } from "@/lib/utils";

export function Logo({ className, dark = false }: { className?: string; dark?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative">
        <div
          className={cn(
            "h-8 w-8 grid place-items-center rounded-sm",
            dark ? "bg-petrol/15" : "bg-petrol"
          )}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke={dark ? "var(--petrol)" : "white"} strokeWidth="2.2" strokeLinecap="square">
            <path d="M3 19V5l4.5 8L12 5l4.5 8L21 5v14" />
          </svg>
        </div>
        <span className="absolute -right-1 -bottom-1 h-1.5 w-1.5 bg-copper" aria-hidden />
      </div>
      <div className="flex flex-col leading-none">
        <span className="font-display text-[15px] font-semibold tracking-tight">
          Meta-V <span className="text-petrol">Solutions</span>
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mt-0.5">
          Industrial Equipment
        </span>
      </div>
    </div>
  );
}
