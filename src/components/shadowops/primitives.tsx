import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getMemory,
  MEMORY_KIND_META,
  type MemoryKind,
  type MemoryTone,
} from "@/lib/shadowops-data";
import { motion } from "framer-motion";
import { ArrowDown, BrainCircuit, ChevronRight, FileText, GitBranch, Sparkles } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router";

/* ---------------- tone system ---------------- */

export const TONE: Record<
  MemoryTone,
  { text: string; bg: string; border: string; dot: string; glow: string }
> = {
  memory: {
    text: "text-[#8B93F8]",
    bg: "bg-[#6366F1]/10",
    border: "border-[#6366F1]/30",
    dot: "bg-[#6366F1]",
    glow: "shadow-[0_0_16px_rgb(99_102_241_/_0.25)]",
  },
  discovery: {
    text: "text-discovery",
    bg: "bg-[#22D3EE]/10",
    border: "border-[#22D3EE]/30",
    dot: "bg-discovery",
    glow: "shadow-[0_0_16px_rgb(34_211_238_/_0.25)]",
  },
  success: {
    text: "text-[#4ADE80]",
    bg: "bg-[#22C55E]/10",
    border: "border-[#22C55E]/25",
    dot: "bg-[#22C55E]",
    glow: "",
  },
  warning: {
    text: "text-[#FBBF24]",
    bg: "bg-[#F59E0B]/10",
    border: "border-[#F59E0B]/25",
    dot: "bg-[#F59E0B]",
    glow: "",
  },
  critical: {
    text: "text-[#F87171]",
    bg: "bg-[#EF4444]/10",
    border: "border-[#EF4444]/25",
    dot: "bg-[#EF4444]",
    glow: "",
  },
  neutral: {
    text: "text-muted-foreground",
    bg: "bg-white/[0.03]",
    border: "border-border",
    dot: "bg-[#4A5568]",
    glow: "",
  },
};

export function ToneDot({ tone, pulse = false, className }: { tone: MemoryTone; pulse?: boolean; className?: string }) {
  return (
    <span
      className={cn("inline-block size-2 rounded-full", TONE[tone].dot, pulse && "so-pulse", className)}
    />
  );
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground", className)}>
      {children}
    </p>
  );
}

/* ---------------- badges ---------------- */

const kindTone: Record<MemoryKind, MemoryTone> = {
  episodic: "memory",
  decision: "memory",
  workflow: "discovery",
  incident: "critical",
  outcome: "success",
  procedural: "neutral",
};

export function KindBadge({ kind, className }: { kind: MemoryKind; className?: string }) {
  const tone = TONE[kindTone[kind]];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        tone.bg,
        tone.border,
        tone.text,
        className,
      )}
    >
      {MEMORY_KIND_META[kind].label}
    </span>
  );
}

export function StateBadge({ state }: { state: "active" | "drifting" | "new" }) {
  const map = {
    active: { label: "Active", tone: TONE.success },
    drifting: { label: "Drifting", tone: TONE.warning },
    new: { label: "Newly discovered", tone: TONE.discovery },
  } as const;
  const { label, tone } = map[state];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        tone.bg,
        tone.border,
        tone.text,
      )}
    >
      {state === "new" && <Sparkles className="size-3" />}
      {label}
    </span>
  );
}

/* ---------------- structural pieces ---------------- */

export function StageCard({
  title,
  subtitle,
  icon,
  tone = "neutral",
  highlight = false,
  className,
  children,
  onClick,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  tone?: MemoryTone;
  highlight?: boolean;
  className?: string;
  children?: ReactNode;
  onClick?: () => void;
}) {
  const t = TONE[tone];
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={cn(
        "group relative w-full rounded-xl border bg-card p-4 text-left transition-all duration-300",
        t.border,
        highlight && t.glow,
        onClick && "cursor-pointer hover:-translate-y-0.5 hover:border-foreground/25",
        className,
      )}
    >
      <div className={cn("absolute inset-x-0 top-0 h-px rounded-t-xl", t.dot, "opacity-40")} />
      <div className="flex items-center gap-2.5">
        {icon && <span className={cn("flex size-7 items-center justify-center rounded-lg", t.bg, t.text)}>{icon}</span>}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{title}</p>
          {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {children}
    </Comp>
  );
}

/** Vertical connector with flowing animation between stacked stages. */
export function FlowConnector({ active = true, className }: { active?: boolean; className?: string }) {
  return (
    <div className={cn("flex justify-center py-1", className)} aria-hidden>
      <svg width="12" height="22" viewBox="0 0 12 22" className="overflow-visible">
        <line
          x1="6"
          y1="0"
          x2="6"
          y2="22"
          className={cn(active ? "so-flow" : "", "stroke-[#3B4160]")}
          strokeWidth="1.5"
        />
        <path d="M2 17 L6 22 L10 17" className="fill-none stroke-[#5865F2]" strokeWidth="1.5" opacity="0.8" />
      </svg>
    </div>
  );
}

/** Horizontal memory→pattern merge visualization (signature interaction). */
export function PatternMerge({
  cases,
  patternName,
  frequency,
  totalCases,
  confidence,
  steps,
  autoPlay = true,
}: {
  cases: string[];
  patternName: string;
  frequency: number;
  totalCases: number;
  confidence: number;
  steps: string[];
  autoPlay?: boolean;
}) {
  const [phase, setPhase] = useState(0); // 0 = cases, 1 = merging, 2 = pattern
  const pct = Math.round((frequency / totalCases) * 100);

  const advance = () => {
    setPhase((p) => (p >= 2 ? 0 : p + 1));
  };

  // Auto-play the signature transition once on mount.
  useEffect(() => {
    if (!autoPlay) return;
    const t1 = window.setTimeout(() => setPhase(1), 1100);
    const t2 = window.setTimeout(() => setPhase(2), 2100);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [autoPlay]);

  return (
    <div className="rounded-xl border border-border bg-card/60 p-5">
      <button
        onClick={advance}
        className="mb-4 flex w-full items-center justify-between text-left"
        aria-label="Replay memory to pattern transition"
      >
        <SectionLabel>Memory → Pattern</SectionLabel>
        <span className="font-mono text-[10px] text-discovery/80 hover:text-discovery">
          {phase === 2 ? "REPLAY ⟳" : "NEXT STEP ▸"}
        </span>
      </button>

      <div className="grid items-center gap-4 md:grid-cols-[1fr_auto_1.4fr]">
        {/* historical cases */}
        <div className="relative">
          {cases.map((c, i) => (
            <motion.div
              key={c}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="flex items-center gap-2 py-1"
              style={{ opacity: phase === 2 ? 0.45 : 1 }}
            >
              <span className={cn("size-1.5 rounded-full", TONE.memory.dot)} />
              <span className="font-mono text-xs text-[#8B93F8]">{c}</span>
            </motion.div>
          ))}
          <p className="mt-2 text-[11px] text-muted-foreground">Historical cases</p>
        </div>

        {/* merge arrows */}
        <div className="relative hidden h-24 w-24 md:block" aria-hidden>
          <svg viewBox="0 0 96 96" className={cn("size-full", phase >= 1 ? "opacity-100" : "opacity-40")}>
            {cases.map((_, i) => {
              const y = cases.length === 1 ? 48 : 14 + (i * 68) / (cases.length - 1);
              const spread = cases.length === 1 ? 0 : ((y - 48) / 48) * 10;
              return (
                <motion.path
                  key={i}
                  d={`M 0 ${y} C 36 ${y}, 52 ${48 + spread * 0.4}, 96 ${48 + spread * 0.15}`}
                  fill="none"
                  stroke={phase >= 1 ? "#22D3EE" : "#3B4160"}
                  strokeWidth="1.2"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: phase >= 1 ? 1 : 0.2 }}
                  transition={{ duration: 0.7, delay: phase >= 1 ? i * 0.1 : 0 }}
                />
              );
            })}
            <motion.circle
              cx="96"
              cy="48"
              r="5"
              fill={phase >= 1 ? "#22D3EE" : "#3B4160"}
              animate={{ scale: phase >= 1 ? [0.8, 1.35, 1] : 1 }}
              transition={{ duration: 0.6, delay: 0.45 }}
            />
          </svg>
        </div>

        {/* resulting pattern */}
        <div>
          {phase < 2 ? (
            <motion.div
              animate={{ opacity: [0.4, 0.75, 0.4] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              className="rounded-lg border border-dashed border-discovery/40 bg-discovery/5 p-4 text-center"
            >
              <p className="font-mono text-xs uppercase tracking-widest text-discovery/70">
                {phase === 0 ? "Awaiting analysis" : "Detecting repetition..."}
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className={cn("rounded-lg border bg-card p-4", TONE.discovery.glow, "border-[#22D3EE]/30")}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <GitBranch className="size-4 text-discovery" />
                  {patternName}
                </p>
                <span className="font-mono text-xs text-discovery">{pct}% frequency</span>
              </div>
              <div className="mt-3 space-y-0">
                {steps.map((s, i) => (
                  <div key={s}>
                    <div className="flex items-center gap-2 text-xs text-secondary-foreground">
                      <span className={cn("size-1.5 rounded-full", TONE.discovery.dot)} />
                      {s}
                    </div>
                    {i < steps.length - 1 && (
                      <div className="ml-[3px] h-3 w-px bg-gradient-to-b from-discovery/60 to-[#5865F2]/40" />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
                <span className="font-mono text-[11px] text-muted-foreground">
                  {frequency} / {totalCases} cases · confidence {confidence}
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- evidence ---------------- */

export function EvidenceChip({ id, onOpen }: { id: string; onOpen?: (id: string) => void }) {
  const memory = getMemory(id);
  const tone = TONE.memory;
  const inner = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[11px] transition-colors",
        tone.bg,
        tone.border,
        tone.text,
        "hover:border-[#6366F1]/60 hover:bg-[#6366F1]/20",
      )}
    >
      <FileText className="size-3" />
      {id}
      {memory && <span className="hidden max-w-[180px] truncate text-muted-foreground sm:inline">{memory.title}</span>}
    </span>
  );
  return onOpen ? (
    <button onClick={() => onOpen(id)}>{inner}</button>
  ) : (
    <Link to="/memory" state={{ focusMemory: id }}>{inner}</Link>
  );
}

/** Expandable Answer → Pattern → Workflow → Cases → Memories trail. */
export function EvidenceTrail({
  patternId,
  workflowId,
  memoryIds,
}: {
  patternId?: string;
  workflowId?: string;
  memoryIds: string[];
}) {
  const [open, setOpen] = useState(false);
  const layers: { label: string; icon: ReactNode; content: ReactNode }[] = [
    {
      label: "AI Answer",
      icon: <BrainCircuit className="size-3.5" />,
      content: <span className="text-xs text-muted-foreground">Synthesized from observed organizational behavior</span>,
    },
    patternId
      ? {
          label: "Observed Pattern",
          icon: <GitBranch className="size-3.5" />,
          content: (
            <Link to="/workflows" className="font-mono text-xs text-discovery hover:underline">
              {patternId} → view in Workflows
            </Link>
          ),
        }
      : null,
    workflowId
      ? {
          label: "Discovered Workflow",
          icon: <WorkflowIcon />,
          content: (
            <Link to="/workflows" className="font-mono text-xs text-discovery hover:underline">
              {workflowId} → view sequence
            </Link>
          ),
        }
      : null,
    {
      label: "Historical Cases",
      icon: <FileText className="size-3.5" />,
      content: <span className="font-mono text-xs text-muted-foreground">{memoryIds.length} cases matched this sequence</span>,
    },
    {
      label: "Hindsight Memories",
      icon: <span className={cn("size-2 rounded-full", TONE.memory.dot)} />,
      content: (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {memoryIds.map((id) => (
            <EvidenceChip key={id} id={id} />
          ))}
        </div>
      ),
    },
  ].filter(Boolean) as { label: string; icon: ReactNode; content: ReactNode }[];

  return (
    <div className="rounded-xl border border-border bg-surface">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2">
          <SectionLabel>Evidence Trail</SectionLabel>
          <span className="font-mono text-[10px] text-muted-foreground/70">
            {layers.length} layers · answer → memory
          </span>
        </span>
        <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
          {open ? "COLLAPSE" : "EXPAND"}
          <ChevronRight className={cn("size-3.5 transition-transform", open && "rotate-90")} />
        </span>
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="overflow-hidden border-t border-border/70"
        >
          <div className="p-4">
            {layers.map((layer, i) => (
              <div key={layer.label}>
                <div className="flex items-center gap-3 py-2">
                  <span className={cn("flex size-6 items-center justify-center rounded-md", TONE.memory.bg, TONE.memory.text)}>
                    {layer.icon}
                  </span>
                  <span className="w-40 shrink-0 font-mono text-[11px] uppercase tracking-wider text-foreground/90">
                    {layer.label}
                  </span>
                  <div className="min-w-0 flex-1">{layer.content}</div>
                </div>
                {i < layers.length - 1 && (
                  <div className="ml-[11px] flex h-4 items-center">
                    <ArrowDown className="size-3 text-border" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function WorkflowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[#8B93F8]">
      <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6 6 L8 8" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

/** Animated confidence meter 0-100. */
export function ConfidenceMeter({ value, tone = "discovery" }: { value: number; tone?: MemoryTone }) {
  const t = TONE[tone];
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 w-20 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className={cn("h-full rounded-full", t.dot)}
        />
      </div>
      <span className={cn("font-mono text-[11px]", t.text)}>{value}</span>
    </div>
  );
}

export function StatPill({ label, value, tone = "neutral" }: { label: string; value: string; tone?: MemoryTone }) {
  return (
    <div className={cn("rounded-lg border px-3 py-2", TONE[tone].border, TONE[tone].bg)}>
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 text-sm font-semibold", TONE[tone].text)}>{value}</p>
    </div>
  );
}

export { Badge };
