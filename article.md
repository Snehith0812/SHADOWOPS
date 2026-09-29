
## How I Designed Evidence-Based Memory Retrieval With Hindsight

## From operational records to organizational context

ShadowOps ingests historical cases, decisions, approvals, incidents, outcomes, and documents. It normalizes that material into records and memories, then derives patterns, workflow models, dependencies, and relationships. The user can explore those results directly or ask a question through the Ask interface.

The application is a React and TypeScript single-page app built with Vite. It talks to Convex for queries, mutations, and actions; Convex also provides the reactive document database, so there is no separate application server to deploy. The backend is divided by responsibility: ingestion, retrieval, workflow discovery, pattern analysis, recommendations, governance, graph construction, and the Ask pipeline. More than thirty tables hold the underlying records, each scoped to an organization.

That architecture matters because the UI is not meant to be a collection of hand-authored operational claims. A pattern shown in the interface should be traceable to the cases that support it—and, just as importantly, to cases that contradict it.

## The core problem is process drift

A policy document describes an intended workflow. Historical cases describe what happened under real constraints: deadlines, missing information, handoffs, exceptions, and local workarounds. Those two views can diverge without anyone formally changing the policy.

ShadowOps models that distinction explicitly:

- **Official process:** the documented sequence of steps.
- **Observed process:** the sequence repeated in historical cases.
- **Organizational memory:** decisions, incidents, outcomes, and evidence that help explain the sequence.
- **Hidden dependencies:** repeated relationships between steps that are absent from official documentation.

For example, a vendor onboarding policy might specify Procurement followed by Manager approval. The historical cases may repeatedly show Security and Finance reviews between those steps, with IT involved at the end. The point is not to declare the policy wrong. It is to make the difference visible, quantify how often it occurs, and let an operator inspect the source cases before deciding whether the policy or the practice should change.

## Hindsight means looking at outcomes, not just sequences

The Hindsight view is the most opinionated part of ShadowOps. It asks a retrospective question: now that we know how cases played out, what does the record suggest we should have noticed earlier?

The implementation computes its signals from stored cases, official workflows, dependencies, and patterns at query time. It does not rely on a manually curated list of conclusions. The current signal types cover the cost of skipped steps, faded practices, emerged practices, and silent shifts in dependencies.

One signal compares cases that bypassed an official step with cases that followed the documented sequence. The code first identifies the official workflow for each family, then separates cases based on whether any official step is missing:

```ts
const skipped = cases.filter((row) => {
  const official = officialByFamily.get(row.workflowFamily);
  if (!official) return false;
  return official.some((step) => !row.sequence.includes(step));
});

const clean = cases.filter((row) => {
  const official = officialByFamily.get(row.workflowFamily);
  if (!official) return false;
  return !official.some((step) => !row.sequence.includes(step));
});
```

It then compares incident rates. The wording is deliberately associational: if bypass cases have a higher incident rate, ShadowOps reports that relationship; it does not claim that skipping the step caused the incident. That distinction is essential. Operational records are observational data, and correlation is not a postmortem.

Hindsight also looks for practices that quietly disappear. It splits cases into earlier and more recent periods, groups them by workflow family, and checks whether an official step’s observed frequency has dropped substantially. A policy can remain unchanged while the actual process drifts away from it. That is precisely the sort of organizational change that tends to be missed when teams only review policy documents.

A third signal looks at undocumented dependencies that appear repeatedly and have incident-bearing cases. If one step is frequently followed by another, but no official workflow lists that edge, the system can surface it as a silent shift. The evidence remains attached to the signal so an operator can move from the summary to the cases behind it.

## Evidence is part of the answer

Pattern discovery starts from raw cases rather than treating previous conclusions as ground truth. It computes adjacent-step statistics, failure sequences, recurring decision clusters, deviations from common workflow prefixes, and dependencies. Patterns below a minimum sample size are discarded; confidence uses a Wilson lower bound rather than a raw percentage alone. Supporting and contradicting case IDs are persisted as evidence.

That gives the product a useful discipline: a plausible story is not enough. A claim needs a sample, a confidence treatment, and source records that a person can inspect.

The Ask pipeline follows the same principle. It classifies the question—workflow, dependency, failure, policy comparison, decision, cases, change over time, pattern strength, or general—then retrieves relevant memories and operational records. A deterministic reasoner builds an analysis containing the answer, observed and official workflows, confidence, evidence, sources, and a recommendation. An optional OpenAI-compatible provider can refine the prose, but the local reasoner remains available when no provider key is configured.

The retrieval score combines several signals rather than relying on semantic similarity alone:

```ts
hybrid =
  semantic * 0.42 +
  keyword * 0.28 +
  recency * 0.10 +
  importance * 0.10 +
  confidence * 0.10;
```

The semantic component currently uses deterministic, 256-dimensional hashed embeddings: tokens are stemmed, mapped into buckets with FNV-1a, weighted, and normalized. This is a conscious trade-off. It is reproducible, dependency-light, and works offline, but it is not equivalent to a modern learned embedding model. The model tag is stored with each embedding, which makes a future re-embedding migration additive rather than silently mixing incompatible vectors.

## Where Hindsight and agent memory fit

There are two ideas worth separating. ShadowOps has a feature named **Hindsight**, implemented as retrospective analysis over its operational database. It also has an organizational memory and retrieval layer that supplies historical context to Ask and other workflows. Those capabilities are related, but Hindsight is not simply another name for vector search.

For teams exploring agent memory as a broader engineering discipline, [Hindsight on GitHub](https://github.com/vectorize-io/hindsight) and the [Hindsight documentation](https://hindsight.vectorize.io/) are useful references, as is Vectorize’s explanation of [agent memory and persistent context](https://vectorize.io/what-is-agent-memory). The underlying design lesson applies directly here: a useful system needs to preserve context across interactions and retrieve it when it changes the answer. But memory should not be confused with a transcript dump. In ShadowOps, durable memories are tied to source records, while patterns and retrospective signals are derived from the accumulated evidence.

That separation also keeps responsibilities clear. The memory layer helps find relevant experience. The pattern engine summarizes repeated behavior. Hindsight asks what changed or what the outcomes reveal. Ask turns retrieved context into an explanation. Each layer can be inspected and improved without making one opaque agent responsible for the entire system.

## A recommendation should close the loop

The system’s learning loop does not end when it displays a recommendation. A user can accept, review, or dismiss a recommendation, then record the outcome after the workflow is executed. The outcome is classified as success, partial success, or failure; an outcome memory is written; and pattern and workflow discovery run again.

In simplified form:

```text
Recommendation
    → decision by an operator
    → workflow execution
    → recorded outcome
    → outcome memory
    → pattern and workflow rediscovery
```

This is a more defensible form of “learning” than changing behavior based on an unverified generated answer. The system gets new evidence from an observed outcome, and its derived views can change accordingly. Human action remains explicit, and the result becomes part of the record.

## Security and operational boundaries

Because this is organizational data, tenant isolation cannot be a UI convention. ShadowOps resolves organization context from the caller’s membership on the server, not from an organization ID supplied by the browser. Queries are scoped by organization, and sensitive reads and mutations pass through permission checks. Roles distinguish administrators, analysts, managers, and viewers. Sensitive actions such as uploads, memory changes, and exports are auditable.

The Ask pipeline also treats retrieved documents as untrusted data. Retrieved content is placed inside an organizational-data fence and cannot override the system’s instructions. This does not eliminate every risk associated with model-based systems, but it establishes an important boundary: a document being analyzed is evidence, not authority over the application.

## What I learned

**First, the documented process is only one source of truth.** Policies tell us what should happen; case histories show what repeatedly does happen. Comparing the two is often more informative than reading either in isolation.

**Second, confidence needs sample size and counter-evidence.** A percentage without its denominator can create false certainty. Showing contradictory cases makes a pattern more useful, not less.

**Third, retrospective analysis should avoid causal overreach.** If skipped-step cases have more incidents, that is a signal worth investigating—not proof that the skipped step caused them. The language and interface should preserve that distinction.

**Fourth, memory is most useful when it remains connected to provenance.** A conclusion without source cases is hard to validate, correct, or trust. Durable context should lead back to the records that justify it.

**Finally, keep the reasoning system decomposed.** Retrieval, pattern discovery, retrospective analysis, deterministic checks, and language generation solve different problems. Separating them makes the system easier to test and gives operators a way to understand where an answer came from.

## The system should remember experience, not manufacture certainty

ShadowOps is built around a fairly practical premise: organizations already produce a great deal of evidence about how work gets done, but that evidence is fragmented across records and time. A system that can connect those records can expose process drift, recurring dependencies, and lessons that otherwise remain buried in old cases.

Hindsight gives that premise a retrospective interface. The memory and retrieval layers make the history available to current questions. Pattern discovery turns repeated behavior into inspectable claims, and outcome recording gives those claims a way to evolve as new evidence arrives.

I don't want ShadowOps to replace an operator's judgment. I want it to make the organization's past easier to examine before someone has to make the next decision. That is a narrower goal than automated decision-making—and a much more useful one to build carefully.
