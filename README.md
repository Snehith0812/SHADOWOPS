
# ShadowOps

**AI Organizational Intelligence Command Center — workflow through memory.**

ShadowOps turns an organization's history into something you can see and question.
Instead of a hand-drawn flowchart or a policy document nobody reads, it looks at
what actually happened — every vendor approval, every security review, every
incident — and shows you the pattern underneath it, the workflow that pattern
forms, and the exact evidence behind every claim it makes.

> **The idea in one line:** Memory → Pattern → Workflow → Evidence → Intelligence.

---

## What it does

| Page | What you'll find there |
|---|---|
| **Dashboard** | The big picture: how many memories are on record, the newest discoveries, and the signature "cases merging into a pattern" visual. |
| **Intelligence** | Ask a plain-English question ("How do we approve a new vendor?") and get an answer grounded in real cases, with the evidence attached. |
| **Memory Explorer** | Browse the organization's history directly — a timeline of everything ShadowOps has recorded. |
| **Workflows** | See workflows ShadowOps *discovered* from repeated behavior, not ones someone manually diagrammed. |
| **Organization 3D** | A 3D view of how work actually flows between teams, including "what-if" comparisons against the official process. |
| **System Health** | The technical status of the memory engine (sync time, memory count, connection health) — kept separate from the day-to-day experience on purpose. |

Every answer ShadowOps gives can be traced backward:

```

Answer → Observed Pattern → Workflow → Historical Cases → Memories
```

Nothing is asserted without a memory behind it.

> **Note on "Hindsight":** the app currently refers to its memory engine as
> "Hindsight" in the UI, but this is a placeholder — the memory data you see
> (12,842 records, patterns, evidence) is mock data built into the frontend,
> not a live connection to an external service. There is no Hindsight API key
> configured anywhere in this project.

---

## Project structure

```
shadow-ops-main/
├── src/
│   ├── main.tsx           App entry point and route definitions
│   ├── pages/             One file per screen (Dashboard, Intelligence, Workflows, ...)
│   ├── components/
│   │   ├── shadowops/     ShadowOps-specific UI (brand, visualizations, primitives)
│   │   ├── shadowops3d/   The Three.js organization-twin scene
│   │   └── ui/            shadcn/ui primitives (button, dialog, card, ...)
│   ├── hooks/             use-auth (Convex session), use-mobile (viewport)
│   ├── lib/               Client-side data, the demo "agent", 3D scene data
│   ├── convex/            Database schema, queries, mutations, actions, and auth
│   ├── assets/            Images and static assets
│   └── index.css          Theme colors and global styles
│
├── public/                Files served as-is (favicon, manifest)
├── index.html             The single HTML page the app boots from
├── main.ts                Static file server used when deploying the built app
├── vite.config.ts         Build tool configuration
├── convex.json            Tells Convex where to find backend functions (src/convex)
└── package.json           Dependencies and npm/bun scripts

```

---

## Tech stack

- **Vite** — build tool and dev server
- **React 19** + **TypeScript**
- **React Router v7** — page routing
- **Tailwind CSS v4** + **shadcn/ui** — styling and UI components
- **Framer Motion** — animations
- **Three.js** — the 3D organization view
- **Convex** — backend database, functions, and authentication
- **Convex Auth** — email OTP + anonymous sign-in

---

## Getting started

This project uses **bun** as its package manager.

```bash
# 1. Install dependencies
bun install

# 2. Set up environment variables (see below)
cp .env.example .env.local

# 3. Start the Convex backend
npx convex dev

# 4. In a separate terminal, start the frontend
bun run dev
```

The app will be available at `http://localhost:5173`.

### Available scripts

| Command | What it does |
|---|---|
| `bun run dev` | Start the frontend in development mode |
| `bun run build` | Type-check and build for production |
| `bun run preview` | Preview the production build locally |
| `bun run lint` | Run ESLint |
| `bun run format` | Format all files with Prettier |

---

## Environment variables

Set these in `.env.local` (see `.env.example` for the template):

| Variable | Used for |
|---|---|
| `VITE_CONVEX_URL` | The Convex deployment the frontend talks to |
| `CONVEX_DEPLOYMENT` | Which Convex deployment `npx convex dev` connects to |
| `CONVEX_SITE_URL` | Used by Convex Auth for redirects |

Convex-side secrets (JWT keys, integration keys) live in the Convex dashboard's
own environment variables, not in this repository.

> ⚠️ `.env.keys` in this repo contains a real decryption key. Make sure it's
> listed in `.gitignore` and was never committed before making this repository
> public — if it was, rotate the key.

---

## Authentication

Auth is already wired up using Convex Auth (email OTP + anonymous users).

- Sign-in/sign-up lives at `/auth`
- Protected pages are wrapped in `RequireAuth` (see `src/components/RequireAuth.tsx`)
- On the frontend, get the current user with:
  ```tsx
  import { useAuth } from "@/hooks/use-auth";
  const { isLoading, isAuthenticated, user, signIn, signOut } = useAuth();
  ```
- On the backend, get the current user with `getCurrentUser` in `src/convex/users.ts`

**Do not modify** `src/convex/auth.ts`, `src/convex/auth.config.ts`, or
`src/convex/auth/emailOtp.ts` — these are pre-configured and load-bearing.

---

## Design system

ShadowOps uses a dark, enterprise color palette where one accent color always
means the same thing:

| Color | Hex | Meaning |
|---|---|---|
| Background | `#080B12` | App background |
| Surface | `#0D111A` | Panels, sidebar |
| Card | `#111722` | Cards, elevated content |
| Border | `#202938` | All borders |
| Primary | `#5865F2` | Primary actions |
| Secondary | `#3B82F6` | Secondary accents |
| Memory | `#6366F1` | Anything representing stored memory |
| **Discovery** | `#22D3EE` | **Reserved exclusively for newly discovered intelligence** |
| Success | `#22C55E` | Healthy / confirmed |
| Warning | `#F59E0B` | Needs attention |
| Critical | `#EF4444` | Incidents, errors |

Colors live in `src/index.css` as CSS variables — change them there, not by
hardcoding hex values in components.

---

## Deployment

The production build is served by a small Deno static server (`main.ts`) that
serves `dist/` and falls back to `index.html` for client-side routing. Build
with `bun run build` before deploying.
```renced as `Doc<"TableName">`.
- Keep schemaValidation to false in the schema file.
- You must correctly type your code so that it passes the type checker.
- You must handle null / undefined cases of your convex queries for both frontend and backend, or else it will throw an error that your data could be null or undefined.
- Always use the `@/folder` path, with `@/convex/folder/file.ts` syntax for importing convex files.
- This includes importing generated files like `@/convex/_generated/server`, `@/convex/_generated/api`
- Remember to import functions like useQuery, useMutation, useAction, etc. from `convex/react`
- NEVER have return type validators.
