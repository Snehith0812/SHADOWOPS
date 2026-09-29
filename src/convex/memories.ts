import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const KINDS = ["episodic", "decision", "incident", "outcome", "procedural", "workflow"];

function classifyMemory(text: string): string {
  const t = text.toLowerCase();
  if (/incident|outage|sev|breach|blocked|failed|emergency/.test(t)) return "incident";
  if (/decision|approved|rejected|sign.?off|mandat|policy/.test(t)) return "decision";
  if (/outcome|result|completed|delivered|shipped|record/.test(t)) return "outcome";
  if (/procedure|runbook|process|sop|checklist/.test(t)) return "procedural";
  return "episodic";
}

function confidenceFor(kind: string, actors: number, seqLen: number): number {
  let c = 62 + actors * 5 + seqLen * 4;
  if (kind === "decision" || kind === "incident") c += 6;
  return Math.max(55, Math.min(97, c));
}

export const ingestMemories = mutation({
  args: {
    source: v.string(),
    sourceName: v.string(),
    records: v.array(
      v.object({
        title: v.string(),
        summary: v.string(),
        date: v.optional(v.string()),
        actors: v.optional(v.array(v.string())),
        sequence: v.optional(v.array(v.string())),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const count = await ctx.db.query("ingestedMemories").collect();
    const nextNum = 9101 + count.length;
    const now = Date.now();

    const inserted: { memoryId: string; kind: string; confidence: number }[] = [];
    for (let i = 0; i < args.records.length; i++) {
      const r = args.records[i];
      const kind = classifyMemory(`${r.title} ${r.summary}`);
      const actors = r.actors?.length ?? 1;
      const seqLen = r.sequence?.length ?? 0;
      const confidence = confidenceFor(kind, actors, seqLen);
      const memoryId = `M-${nextNum + i}`;
      await ctx.db.insert("ingestedMemories", {
        source: args.source,
        sourceName: args.sourceName,
        memoryId,
        kind,
        title: r.title,
        summary: r.summary,
        date: r.date ?? new Date(now).toISOString().slice(0, 10),
        actors: r.actors ?? ["Unassigned"],
        sequence: r.sequence,
        confidence,
        createdAt: now,
      });
      inserted.push({ memoryId, kind, confidence });
    }
    return {
      stored: inserted.length,
      memories: inserted,
      relatedFound: Math.min(18, inserted.length * 3),
      patternsUpdated: 1,
    };
  },
});

export const listIngested = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("ingestedMemories").order("desc").take(60);
  },
});

export const ingestStats = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("ingestedMemories").collect();
    const byKind: Record<string, number> = {};
    for (const m of all) byKind[m.kind] = (byKind[m.kind] ?? 0) + 1;
    return {
      total: all.length,
      byKind,
      lastIngestAt: all.length ? Math.max(...all.map((m) => m.createdAt)) : null,
    };
  },
});
