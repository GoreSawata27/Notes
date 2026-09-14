# React Evolution

A long-term reference for what changed from React 16 through React 19.3 — not a changelog paraphrase. Fundamentals stay on the [React learning track](/notes/learn/react).

## Profile

Read this hub first, then follow the chapter order in the sidebar. Every important API in later chapters names the **version that introduced it**, the **problem it solved**, and **when not to use it**.

| Kind | How this reference treats it |
| --- | --- |
| React core, stable | Documented as a normal API with `Introduced in: React X.X` |
| RSC-only | Labeled `[RSC]` — needs a React Server Components runtime (usually a framework) |
| Framework (Next.js, etc.) | Labeled `[framework]` — not a React-only feature |
| React Compiler | A separate Babel plugin, not a React runtime hook |
| Experimental / Canary | Labeled `[experimental]` — never presented as stable |

---

## Timeline & learning path

### Lesson 1. Architectural timeline [React 16]

**Takeaway:** Introduced in: React 16. React’s public story from 16 to 19.3 is one idea: make rendering interruptible, then make async UI (forms, server, optimistic updates) a first-class model. Each major release solved a different bottleneck.

**Explain:**
React did not add random APIs. Each era unblocked the next.

```text
React 16  Fiber, Error Boundaries, Fragments, Portals
    |
    v
16.3      New Context, createRef, forwardRef, Strict Mode
    |
    v
16.6      memo, lazy, Suspense (code splitting)
    |
    v
16.8      Hooks
    |
    v
React 17  JSX transform, event delegation, gradual upgrades
    |
    v
React 18  Concurrent rendering, createRoot, Transitions, automatic batching
    |
    v
React 19  Actions, use(), optimistic UI, ref-as-prop, document metadata
    |
    v
19.1      Owner Stack, useId format, hydration/scheduling
    |
    v
19.2      Activity, useEffectEvent, Performance Tracks, partial prerender
    |
    v
19.3      ViewTransition (stable), Fragment refs (stable), browser()
```

### Why this timeline matters

If you skip Fiber, concurrent APIs feel like magic. If you skip React 17, you will not understand why `createRoot` and the new JSX runtime exist. If you skip React 18, React 19 Actions look like “forms got a new hook” instead of “async UI is now scheduled work.”

### Recommended learning flow

1. This hub (tables + labels)
2. [Fiber & Reconciliation](/notes/learn/react/fiber)
3. [React 16](/notes/learn/react/react-16)
4. [Hooks Evolution](/notes/learn/react/hooks-evolution) — skip if you just finished [fundamentals L8–L20](/notes/learn/react)
5. [React 17](/notes/learn/react/react-17)
6. [Concurrent Rendering](/notes/learn/react/concurrent)
7. [React 18 APIs](/notes/learn/react/react-18-apis)
8. [Suspense & Streaming SSR](/notes/learn/react/suspense-ssr)
9. [React 19](/notes/learn/react/react-19)
10. [Forms & Actions](/notes/learn/react/forms-actions)
11. [Server-oriented React](/notes/learn/react/server-react)
12. [19.1](/notes/learn/react/react-19-1) → [19.2](/notes/learn/react/react-19-2) → [19.3](/notes/learn/react/react-19-3)
13. [Deprecated APIs](/notes/learn/react/deprecated) and [Migrations](/notes/learn/react/migrations)
14. [Interview & Cheat Sheet](/notes/learn/react/interview)

**Tip:** Do not memorize patch numbers. Memorize the *job* of each era: 16 = new engine, 17 = install safely, 18 = schedule work, 19 = async UI.

**Try it:** After this page, open [Fiber](/notes/learn/react/fiber) and explain render vs commit out loud before you touch `useTransition`.

---

### Lesson 2. Why each major release existed [React 16]

**Takeaway:** Introduced in: React 16 (the pattern continues through 19). A “why this release mattered” answer is architectural, not a bullet list of APIs.

**Explain:**
Release notes list features. This table lists **the problem the team was actually solving**.

| Release | Why it mattered |
| --- | --- |
| React 16 | Replace the old stack reconciler with **Fiber** so rendering can pause, resume, and recover from errors |
| React 16.8 | Make stateful logic **reusable without classes** (Hooks) |
| React 17 | Make upgrades **gradual** (two Reacts on one page) and modernize JSX/events without new UI APIs |
| React 18 | Turn Fiber’s concurrency into a **public model**: Transitions, batching, streaming SSR |
| React 19 | Treat **async work** (forms, data, optimistic UI, documents) as React’s job, not ad-hoc `useEffect` |
| React 19.1 | Debug + hydration quality (Owner Stack, `useId` CSS-safe IDs) |
| React 19.2 | Hide/show UI without losing state (`Activity`), Effect Events, prerender/resume for frameworks |
| React 19.3 | Stable **View Transitions** and **Fragment refs**; client-only `browser()`; Trusted Types |

### What did *not* change

React’s public contract is still: **UI = f(state)**. Fiber, concurrent rendering, and Actions change *how* React computes and commits that function, not the mental model of components and props.

**Tip:** In interviews, lead with the era’s job, then name two APIs. “React 18 made rendering interruptible; `createRoot` and `startTransition` are the public switches.”

**Try it:** Write one sentence per major version (16, 17, 18, 19) without naming more than two APIs.

---

## Version → features

### Lesson 3. Feature map by version [React 16]

**Takeaway:** Introduced in: the version in each row. Use this table to jump to the right chapter. Tiny patches are omitted unless they changed how you write React.

**Explain:**
This is the index. Depth lives on the linked chapters.

| Feature | Version | Kind | Chapter |
| --- | --- | --- | --- |
| Fiber reconciler | 16.0 | Rendering architecture | [Fiber](/notes/learn/react/fiber) |
| Error Boundaries | 16.0 | Major API | [React 16](/notes/learn/react/react-16) |
| Portals | 16.0 | Major API | [React 16](/notes/learn/react/react-16) |
| Fragments (`<>`) | 16.2 | API | [React 16](/notes/learn/react/react-16) |
| New Context, `createRef`, `forwardRef`, Strict Mode | 16.3 | Major API | [React 16](/notes/learn/react/react-16) |
| Pointer Events | 16.4 | API | [React 16](/notes/learn/react/react-16) |
| `Profiler` | 16.5 | DX / performance | [React 16](/notes/learn/react/react-16) |
| `memo`, `lazy`, Suspense (code split) | 16.6 | Major API | [React 16](/notes/learn/react/react-16) |
| Hooks | 16.8 | Major API | [Hooks Evolution](/notes/learn/react/hooks-evolution) |
| `UNSAFE_` lifecycles, `act()` | 16.9 | Deprecation / DX | [Deprecated](/notes/learn/react/deprecated) |
| New JSX transform backport | 16.14 | DX | [React 17](/notes/learn/react/react-17) |
| New JSX transform, event delegation | 17.0 | DX / rendering | [React 17](/notes/learn/react/react-17) |
| `createRoot`, automatic batching, concurrent | 18.0 | Rendering architecture | [Concurrent](/notes/learn/react/concurrent) |
| `useTransition`, `useDeferredValue`, `useId`, `useSyncExternalStore`, `useInsertionEffect` | 18.0 | Hooks | [React 18 APIs](/notes/learn/react/react-18-apis) |
| Streaming SSR, `hydrateRoot` | 18.0 | SSR | [Suspense & SSR](/notes/learn/react/suspense-ssr) |
| Actions, `useActionState`, `useFormStatus`, `useOptimistic`, `use()` | 19.0 | Major API | [React 19](/notes/learn/react/react-19) |
| Ref as a prop, Context as `<Context>` | 19.0 | API change | [React 19](/notes/learn/react/react-19) |
| Document metadata, stylesheets, resource hints | 19.0 | DX / loading | [React 19](/notes/learn/react/react-19) |
| Owner Stack, `useId` `«r»` format | 19.1 | DX | [19.1](/notes/learn/react/react-19-1) |
| `<Activity>`, `useEffectEvent` | 19.2 | Major API | [19.2](/notes/learn/react/react-19-2) |
| `cacheSignal` | 19.2 | RSC-only | [19.2](/notes/learn/react/react-19-2) |
| `ViewTransition`, Fragment refs, `browser()` | 19.3 | Major API (stable) | [19.3](/notes/learn/react/react-19-3) |

**Tip:** If a blog post mixes Next.js App Router with `use()`, ask: “Does this API exist in `react` / `react-dom`, or only if a bundler implements RSC?”

**Try it:** Pick one production bug you have seen and name the *version* that introduced the right tool (batching, Error Boundary, `useTransition`, Action).

---

### Lesson 4. Stable vs experimental vs framework [React 19]

**Takeaway:** Introduced in: React 19 era (the distinction matters most here). Mixing React core, Canary, RSC, Next.js, and the Compiler is the #1 way this reference would lie to you.

**Explain:**
React ships on multiple tracks.

### React core (`react`, `react-dom`)

What you import in a Vite SPA: hooks, `createRoot`, `<Suspense>`, `<Activity>`, `useEffectEvent`, `ViewTransition` (19.3).

### React Server Components

RSC is a **React architecture** implemented by a bundler/framework. `cache()`, `cacheSignal`, and `'use server'` as a file convention are **not** things a client-only CRA/Vite app can use by importing `react`.

### Next.js (and other frameworks)

App Router, `loading.tsx`, file-system routing, `cookies()`, `redirect()`, and many “Server Action” ergonomics are **framework**. React 19 documents the underlying Actions / Server Functions model; Next.js is the common implementation.

### React Compiler

`babel-plugin-react-compiler` (often via `react-compiler`). It auto-memoizes. It is **not** a new hook and not tied to a single React minor the way `useTransition` is.

### Canary / experimental

APIs can land in `react@canary` or `react@experimental` before a stable minor. This reference labels them `[experimental]` and will not call them production-default.

**Tip:** When reading a tweet about a “new React API,” check [react.dev/blog](https://react.dev/blog) and the [changelog](https://github.com/facebook/react/blob/main/CHANGELOG.md) before you put it in a design doc.

**Try it:** For `cacheSignal`, `useOptimistic`, and `loading.tsx`, write core / RSC / framework next to each.

---

## Quick maps

### Lesson 5. Old API → new API [React 16]

**Takeaway:** Introduced in: various (see Replacement column). Evolution is easier if you remember pairs, not isolated names.

**Explain:**
Use this as a flashcard table. Details and caveats are in [Deprecated APIs](/notes/learn/react/deprecated).

| Old | Status | Replacement |
| --- | --- | --- |
| Stack reconciler | Replaced in 16 | Fiber |
| Legacy context (`contextTypes`) | Deprecated, then removed | `createContext` (16.3) |
| String refs | Deprecated / removed | `createRef` (16.3) / ref callback / `useRef` |
| `componentWillMount` etc. | Renamed `UNSAFE_` (16.9), removed in 19 | `constructor` / `useEffect` / `getDerivedStateFromProps` |
| `ReactDOM.render` | Deprecated 18, removed 19 | `createRoot` (18) |
| `ReactDOM.hydrate` | Deprecated 18, removed 19 | `hydrateRoot` (18) |
| `findDOMNode` | Deprecated | Refs |
| `defaultProps` on function components | Removed in 19 | Default parameters |
| Classes for state | Still valid | Hooks (16.8) for new code |
| Manual pending/error around `fetch` in submit handlers | Still valid | Actions + `useActionState` (19) |
| Manual optimistic flags | Still valid | `useOptimistic` (19) |
| `forwardRef` everywhere | Still valid | `ref` as a prop (19) |
| `<Context.Provider>` | Still valid | `<Context>` (19) |

**Tip:** “Removed in 19” means `react@19` will not include the old entry point. “Deprecated in 18” means it still ran, with warnings, until 19.

**Try it:** Open a legacy app’s `index.js`. If you still see `ReactDOM.render`, that app is on the React 17-or-earlier bootstrap path — see [Migrations](/notes/learn/react/migrations).
