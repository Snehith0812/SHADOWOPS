import { SectionLabel, TONE } from "@/components/shadowops/primitives";
import { cn } from "@/lib/utils";
import { MEMORY_TIMELINE } from "@/lib/shadowops-data";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";

/**
 * ShadowOps signature identity graph:
 * MEMORY → PATTERNS + EVENTS → WORKFLOWS → DEPENDENCIES → OUTCOMES
 * Hovering a node illuminates its connected paths in discovery cyan.
 */
export function CommandGraph({ className }: { className?: string }) {
  const [hovered, setHovered] = useState<string | null>(null);

  const nodes: Record<string, { label: string; x: number; y: number; tone: "memory" | "discovery" | "neutral" }> = {
    memory: { label: "MEMORY", x: 50, y: 8, tone: "memory" },
    patterns: { label: "PATTERNS", x: 22, y: 38, tone: "memory" },
    events: { label: "EVENTS", x: 78, y: 38, tone: "memory" },
    workflows: { label: "WORKFLOWS", x: 50, y: 62, tone: "discovery" },
    dependencies: { label: "DEPENDENCIES", x: 50, y: 84, tone: "discovery" },
    outcomes: { label: "OUTCOMES", x: 50, y: 106, tone: "neutral" },
  };

  const edges: { from: string; to: string }[] = [
    { from: "memory", to: "patterns" },
    { from: "memory", to: "events" },
    { from: "patterns", to: "workflows" },
    { from: "events", to: "workflows" },
    { from: "workflows", to: "dependencies" },
    { from: "dependencies", to: "outcomes" },
  ];

  const connected = useMemo(() => {
    if (!hovered) return null;
    const set = new Set<string>([hovered]);
    for (const e of edges) {
      if (e.from === hovered) set.add(e.to);
      if (e.to === hovered) set.add(e.from);
    }
    return set;
  }, [hovered]);

  const isLit = (id: string) => !connected || connected.has(id);

  return (
    <div
      className={cn("relative w-full select-none", className)}
      onMouseLeave={() => setHovered(null)}
    >
      <svg viewBox="0 -8 100 126" className="w-full" role="img" aria-label="ShadowOps intelligence graph">
        {edges.map((e) => {
          const a = nodes[e.from];
          const b = nodes[e.to];
          const lit = isLit(e.from) && isLit(e.to);
          return (
            <g key={`${e.from}-${e.to}`}>
              <line
                x1={a.x}
                y1={a.y + 4}
                x2={b.x}
                y2={b.y - 4}
                stroke={lit ? (hovered ? "#22D3EE" : "#3B4160") : "#1A2230"}
                strokeWidth={lit && hovered ? 1.1 : 0.9}
                className={lit && hovered ? "so-flow" : ""}
                style={{ transition: "stroke 0.3s" }}
              />
              <circle cx={b.x} cy={b.y - 4} r="0.7" fill={lit ? "#5865F2" : "#1A2230"} />
            </g>
          );
        })}
        {Object.entries(nodes).map(([id, n]) => {
          const lit = isLit(id);
          const color = n.tone === "discovery" ? "#22D3EE" : n.tone === "memory" ? "#8B93F8" : "#E7ECF5";
          return (
            <g
              key={id}
              onMouseEnter={() => setHovered(id)}
              style={{ cursor: "default", opacity: lit ? 1 : 0.28, transition: "opacity 0.3s" }}
            >
              <circle cx={n.x} cy={n.y} r="6.5" fill="#111722" stroke={color} strokeWidth="0.7" />
              <circle cx={n.x} cy={n.y} r="2.4" fill={color} opacity={lit ? 0.95 : 0.5} />
              {hovered === id && (
                <circle cx={n.x} cy={n.y} r="9.5" fill="none" stroke={color} strokeWidth="0.5" opacity="0.6" />
              )}
              <text
                x={n.x}
                y={n.y + (id === "memory" ? -10.5 : id === "outcomes" ? 13.5 : id === "patterns" || id === "events" ? -10 : id === "workflows" || id === "dependencies" ? -10 : 0)}
                textAnchor="middle"
                fill={lit ? color : "#5B6579"}
                fontSize="4.6"
                fontFamily="JetBrains Mono, monospace"
                letterSpacing="1"
                fontWeight={hovered === id ? 600 : 500}
              >
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="mt-1 text-center font-mono text-[10px] text-muted-foreground/70">
        Hover a layer to trace its connections
      </p>
    </div>
  );
}

/**
 * Organizational memory timeline — repeated sequences grow visually stronger.
 */
export function MemoryTimeline({ compact = false }: { compact?: boolean }) {
  const max = Math.max(...MEMORY_TIMELINE.map((y) => y.events));
  const stages = [
    { label: "Vendor Request", tone: "memory" as const },
    { label: "Security Review", tone: "memory" as const },
    { label: "Finance Approval", tone: "memory" as const },
    { label: "IT Approval", tone: "memory" as const },
    { label: "Successful Onboarding", tone: "success" as const },
  ];

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <SectionLabel>Accumulated Memory</SectionLabel>
          <span className="font-mono text-[10px] text-muted-foreground">2023 — 2026</span>
        </div>
        <div className="flex items-end gap-3">
          {MEMORY_TIMELINE.map((y, i) => (
            <div key={y.year} className="flex flex-1 flex-col items-center gap-1.5">
              <motion.div
                initial={{ height: 0 }}
                whileInView={{ height: `${(y.events / max) * (compact ? 48 : 72)}px` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                className="w-full rounded-t-md bg-gradient-to-t from-[#5865F2]/40 via-[#6366F1]/60 to-[#8B93F8]"
                style={{ boxShadow: "0 0 14px rgb(99 102 241 / 0.18)" }}
              />
              <span className="font-mono text-[10px] text-muted-foreground">{y.year}</span>
              <span className="font-mono text-[10px] text-[#8B93F8]">{y.events.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {!compact && (
        <div className="border-t border-border pt-4">
          <SectionLabel className="mb-3">One sequence, observed over and over</SectionLabel>
          <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
            {stages.map((s, i) => (
              <div key={s.label} className="flex min-w-0 items-center gap-1">
                <div className="flex flex-col items-center gap-1.5">
                  <span
                    className={cn(
                      "size-2.5 rounded-full ring-4",
                      TONE[s.tone].dot,
                      s.tone === "success" ? "ring-[#22C55E]/15" : "ring-[#6366F1]/10",
                    )}
                  />
                  <span
                    className={cn(
                      "whitespace-nowrap text-center text-[10px] leading-tight",
                      i === 0 ? "text-muted-foreground" : i === stages.length - 1 ? "text-[#4ADE80]" : "text-secondary-foreground",
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {i < stages.length - 1 && (
                  <svg width="26" height="8" className="-mt-4 shrink-0" aria-hidden>
                    <line x1="0" y1="4" x2="26" y2="4" stroke="#3B4160" strokeWidth="1.2" className="so-flow-slow" />
                  </svg>
                )}
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Each repetition strengthens the memory. 84 cycles of this sequence are now indexed.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Workflow discovery path — how ShadowOps derives a workflow from raw memory.
 */
export function DiscoveryPath() {
  const stages = [
    "Historical Memories",
    "Repeated Sequence",
    "Observed Pattern",
    "Discovered Workflow",
  ];
  const [active, setActive] = useState(stages.length - 1);
  return (
    <div className="flex flex-col items-stretch">
      {stages.map((s, i) => {
        const reached = i <= active;
        const isNew = i === stages.length - 1;
        return (
          <div key={s} className="flex flex-col items-center">
            <button
              onClick={() => setActive(i)}
              className={cn(
                "w-full max-w-[280px] rounded-lg border px-3 py-2 text-center font-mono text-[11px] tracking-wide transition-all duration-300",
                reached
                  ? isNew
                    ? "border-[#22D3EE]/50 bg-[#22D3EE]/10 text-discovery shadow-[0_0_18px_rgb(34_211_238_/_0.18)]"
                    : "border-[#6366F1]/40 bg-[#6366F1]/10 text-[#8B93F8]"
                  : "border-border bg-card/50 text-muted-foreground/60",
              )}
            >
              {s.toUpperCase()}
            </button>
            {i < stages.length - 1 && (
              <svg width="12" height="18" viewBox="0 0 12 18" aria-hidden>
                <line
                  x1="6" y1="0" x2="6" y2="18"
                  className={reached ? "so-flow stroke-[#22D3EE]" : "stroke-[#2A3345]"}
                  strokeWidth="1.4"
                  style={{ transition: "stroke 0.4s" }}
                />
              </svg>
            )}
          </div>
        );
      })}
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        Discovered from memory — not manually created
      </p>
    </div>
  );
}
