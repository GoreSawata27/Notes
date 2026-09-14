import type { ReactCatalogEntry } from "./types";

export const REACT_EVOLUTION: ReactCatalogEntry[] = [
  {
    slug: "evolution",
    title: "React Evolution",
    description:
      "Timeline from React 16 through 19.3: why each era existed, what to learn next, and how to tell stable APIs from RSC, framework, and experimental features.",
    file: "evolution.md",
    pill: "Timeline hub",
  },
  {
    slug: "fiber",
    title: "Fiber & Reconciliation",
    description:
      "How React walks a tree, what a Fiber is, render vs commit, and why scheduling made concurrent rendering possible.",
    file: "fiber.md",
    pill: "Core concepts",
  },
  {
    slug: "react-16",
    title: "React 16",
    description:
      "Fiber-era APIs: Error Boundaries, Fragments, Portals, the new Context API, memo, lazy, Suspense beginnings, and Strict Mode.",
    file: "react-16.md",
    pill: "React 16.0–16.14",
  },
  {
    slug: "hooks-evolution",
    title: "Hooks Evolution",
    description:
      "Why Hooks replaced classes, the hooks the fundamentals track does not cover in depth, and how class patterns map to modern React.",
    file: "hooks-evolution.md",
    pill: "React 16.8",
  },
  {
    slug: "react-17",
    title: "React 17",
    description:
      "An infrastructure release: the new JSX transform, root-level event delegation, and gradual upgrades with no new developer-facing features.",
    file: "react-17.md",
    pill: "React 17",
  },
  {
    slug: "concurrent",
    title: "Concurrent Rendering",
    description:
      "Interruptible rendering, urgent vs transition updates, automatic batching, createRoot, hydrateRoot, and Strict Mode in development.",
    file: "concurrent.md",
    pill: "React 18 architecture",
  },
  {
    slug: "react-18-apis",
    title: "React 18 APIs",
    description:
      "startTransition, useTransition, useDeferredValue, useId, useSyncExternalStore, and useInsertionEffect — when each one is the right tool.",
    file: "react-18-apis.md",
    pill: "React 18 APIs",
  },
  {
    slug: "suspense-ssr",
    title: "Suspense & Streaming SSR",
    description:
      "How Suspense evolved from code-splitting to data-ready UI, plus streaming SSR and hydration in React 18.",
    file: "suspense-ssr.md",
    pill: "Suspense + SSR",
  },
  {
    slug: "react-19",
    title: "React 19",
    description:
      "Actions, use(), optimistic UI, ref-as-prop, Context as provider, document metadata, resource hints, and better hydration errors.",
    file: "react-19.md",
    pill: "React 19 core",
  },
  {
    slug: "forms-actions",
    title: "Forms & Actions",
    description:
      "Form Actions, async functions, pending UI, optimistic updates, and validation without a pile of local loading state.",
    file: "forms-actions.md",
    pill: "Forms",
  },
  {
    slug: "server-react",
    title: "Server-oriented React",
    description:
      "SSR, RSC, Server Functions, and the React Compiler — what belongs to React, what belongs to a framework, and what is a separate compiler.",
    file: "server-react.md",
    pill: "SSR · RSC · Compiler",
  },
  {
    slug: "react-19-1",
    title: "React 19.1",
    description:
      "Owner Stack, useId selector format, dialog toggle events, hydration and scheduling fixes, and what stayed experimental.",
    file: "react-19-1.md",
    pill: "React 19.1",
  },
  {
    slug: "react-19-2",
    title: "React 19.2",
    description:
      "Activity, useEffectEvent, cacheSignal (RSC-only), Performance Tracks, partial prerender APIs, and batched SSR Suspense reveals.",
    file: "react-19-2.md",
    pill: "React 19.2",
  },
  {
    slug: "react-19-3",
    title: "React 19.3",
    description:
      "Stable ViewTransition and Fragment refs, browser(), Trusted Types, Server Components rendering client Context, and independent transitions.",
    file: "react-19-3.md",
    pill: "React 19.3",
  },
  {
    slug: "deprecated",
    title: "Deprecated APIs",
    description:
      "What was deprecated, what was removed, what is still legacy, and the modern replacement for each API.",
    file: "deprecated.md",
    pill: "Removals",
  },
  {
    slug: "migrations",
    title: "Migration Guides",
    description:
      "React 15→16, 16→17, 17→18, and 18→19: what breaks, what is optional, checklists, and common mistakes.",
    file: "migrations.md",
    pill: "Migrations",
  },
  {
    slug: "interview",
    title: "Interview & Cheat Sheet",
    description:
      "Version tables, old vs new APIs, hook use-cases, and interview-level questions covering React 16 through 19.3.",
    file: "interview.md",
    pill: "Quick revision",
  },
];

export function getReactChapter(slug: string): ReactCatalogEntry | undefined {
  return REACT_EVOLUTION.find((entry) => entry.slug === slug);
}

export function getReactChapterNeighbors(slug: string) {
  const index = REACT_EVOLUTION.findIndex((entry) => entry.slug === slug);
  if (index < 0) return null;
  const prev = REACT_EVOLUTION[(index - 1 + REACT_EVOLUTION.length) % REACT_EVOLUTION.length];
  const next = REACT_EVOLUTION[(index + 1) % REACT_EVOLUTION.length];
  return { index, prev, next };
}
