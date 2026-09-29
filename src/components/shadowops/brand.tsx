import { ShadowLogo } from "@/components/shadowops/ShadowLogo";
import { cn } from "@/lib/utils";

/**
 * Legacy brand surface now backed by the official ShadowOps logo.
 * Used across dashboard, shell, landing, and system pages.
 */
export function BrandMark({ className, size = 36 }: { className?: string; size?: number }) {
  return (
    <ShadowLogo
      variant="mark"
      className={cn("shrink-0", className)}
      style={{ width: size, height: size }}
    />
  );
}

export function Wordmark({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("flex items-baseline gap-2 leading-none", className)}>
      <span className="text-[15px] font-bold tracking-[0.18em] text-foreground">SHADOWOPS</span>
      {!compact && (
        <span className="hidden text-[10px] font-medium tracking-[0.28em] text-muted-foreground sm:inline">
          MEMORY INTELLIGENCE
        </span>
      )}
    </span>
  );
}

/** The continuous intelligence loop: MEMORY → UNDERSTANDING → ACTION → NEW MEMORY */
export function MemoryLoop({ className }: { className?: string }) {
  const loop = ["Memory", "Understanding", "Action", "New Memory"];
  return (
    <div className={cn("flex flex-wrap items-center gap-x-1 gap-y-2 font-mono text-[11px]", className)}>
      {loop.map((step, i) => (
        <span key={step} className="flex items-center gap-1">
          <span className={i === 0 || i === 3 ? "text-memory" : "text-muted-foreground"}>
            {step.toUpperCase()}
          </span>
          {i < loop.length - 1 && <span className="text-discovery/70">→</span>}
        </span>
      ))}
    </div>
  );
}
