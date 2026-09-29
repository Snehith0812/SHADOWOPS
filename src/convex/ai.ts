"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { vly } from "../lib/vly-integrations";

const SYSTEM_PROMPT = `You are ShadowOps, an AI organizational intelligence assistant.
Your specialty is explaining how organizations actually operate, based on observed
organizational memory: events, decisions, approvals, incidents, and discovered workflows.

Answer rules:
- Be concise, structured and operational. Prefer short paragraphs and compact lists.
- When the question is about the user's organization, ground the answer in the provided
  ORGANIZATIONAL MEMORY CONTEXT and reference observed sequences when available.
- For general real-world questions (business, process, technology, security, etc.), answer
  directly with practical, accurate information. You may answer from general knowledge when
  no memory context is relevant, and briefly note that it is general knowledge.
- Never fabricate internal evidence, IDs, or statistics. If memory context is thin, say what
  is known and what is not.
- Close with one actionable next step when natural.
- Keep the tone: enterprise intelligence, confident, precise. No emojis.`;

interface ChatMsg {
  role: "system" | "user" | "assistant";
  content: string;
}

export const ask = action({
  args: {
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      }),
    ),
    memoryContext: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const messages: ChatMsg[] = [{ role: "system", content: SYSTEM_PROMPT }];
    if (args.memoryContext) {
      messages.push({ role: "system", content: `ORGANIZATIONAL MEMORY CONTEXT:\n${args.memoryContext}` });
    }
    // keep the payload bounded
    messages.push(...args.messages.slice(-12));

    const result = await vly.ai.completion({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.4,
      maxTokens: 700,
    });

    if (!result.success || !result.data) {
      throw new Error(result.error ?? "ShadowOps could not reach the reasoning engine.");
    }

    const content = result.data.choices?.[0]?.message?.content ?? "";
    return {
      answer: content.trim(),
      tokens: result.data.usage?.totalTokens ?? 0,
    };
  },
});


