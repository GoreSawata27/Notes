# React 19.3

React 19.3 (September 9, 2026) graduates **View Transitions** and **Fragment refs** from experimental to **stable**. It also adds `browser()` (client-only rendering), Trusted Types integration, and Server Components rendering client Context. Official post: [React 19.3](https://react.dev/blog/2026/09/09/react-19-3).

## Profile

These APIs are **stable in 19.3**. Older blog posts (2025 Labs) called View Transitions experimental — **do not copy that label** if you are on 19.3. `cacheSignal` remains RSC (19.2). The Compiler is still a separate plugin.

---

## Why 19.3 mattered

### Lesson 1. 19.3 makes animation and fragment DOM access first-class [React 19.3]

**Takeaway:** Introduced in: React 19.3 (stable). The release is about **animating React updates** (`ViewTransition`), **refs that target a fragment’s DOM children as a group**, and a few platform/security/RSC polish items.

**Explain:**

| Feature | Status in 19.3 |
| --- | --- |
| `<ViewTransition>` / `addTransitionType` | **Stable** |
| Fragment refs (`<Fragment ref>` / `<>` cannot take ref — use `Fragment`) | **Stable** |
| `browser()` from `react-dom` | **Stable** (client-only helper) |
| Trusted Types | **Stable** integration |
| Server Components render imported client Context | **Stable** RSC |
| Independent transitions | Behavior change (slow transition no longer blocks unrelated ones) |

**Tip:** View Transitions only animate updates that are **Transitions**, **Suspense reveals**, or **deferred** — not every urgent `setState`.

**Try it:** Wrap a list item in `ViewTransition` and add/remove it inside `startTransition`.

---

## ViewTransition

### Lesson 2. ViewTransition animates enter, exit, move, and share [React 19.3]

**Takeaway:** Introduced in: experimental in Labs / canary; **stable in React 19.3**. `<ViewTransition>` uses the browser [View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) to animate elements that enter, leave, update, or **share** (morph from one place to another).

**Explain:**

```jsx
import { ViewTransition, startTransition, useState } from "react";

function Gallery({ items }) {
  const [selected, setSelected] = useState(null);
  return (
    <ul>
      {items.map((item) => (
        <ViewTransition key={item.id}>
          <li>
            <button
              onClick={() => startTransition(() => setSelected(item.id))}
            >
              {item.title}
            </button>
          </li>
        </ViewTransition>
      ))}
    </ul>
  );
}
```

React picks an animation based on how the tree changed:

- **enter** — boundary added
- **exit** — boundary removed
- **update** — children changed
- **share** — a **named** transition moved from one place to another

Urgent `setState` (typing) does **not** start a View Transition. That is intentional: typing should not cross-fade.

### Why it was introduced?

CSS animations on mount/unmount are painful with React’s render model (the node is gone before CSS can run). The View Transition API captures old/new snapshots. React coordinates `startViewTransition` with **its own** commit, fonts, and images.

### Before 19.3

- CSS `transition` only when the node stays mounted
- `react-transition-group` / FLIP libraries
- Experimental `<ViewTransition>` in canary (API could still change)

### With 19.3

Stable import from `react`. Pair with `startTransition` / `useDeferredValue` / Suspense.

### How it works (practical)

React calls `document.startViewTransition`. Inside the update callback it mutates the DOM, waits (fonts, images, navigation), measures, then lets the browser animate. You can customize with CSS `::view-transition-old/new` and named transitions.

### Real-world examples

**1. E-commerce: product thumbnail → PDP hero (shared element)** — named `ViewTransition` so the image appears to fly.

**2. Tab content in a dashboard** — cross-fade panels when the tab switch is a transition.

**3. Todo complete: row exits** — wrap the row; removing it inside `startTransition` plays an exit.

### When should I use it?

Route-level or list-level animation **already modeled as a Transition**. List reordering. Shared element navigation.

### When should I NOT?

- Every keystroke
- Replacing all CSS hover animations
- Unsupported browsers without a fallback plan (feature-detect; allow reduced motion)

`prefers-reduced-motion`: respect it (disable or shorten).

### Common mistakes

- Forgetting `startTransition` (nothing animates)
- Animating urgent updates
- Fighting a second library that also calls `startViewTransition` (let React coordinate)

### Related APIs

`useTransition`, `Activity` (19.2), Suspense, `addTransitionType`

### Interview notes

- Stable in **19.3**, not 19.0.
- Only non-urgent / Suspense / deferred updates trigger it.
- Browser View Transition API underneath.

**Tip:** Named shares need the **same name** on old and new `ViewTransition`.

**Try it:** Toggle a card with and without wrapping `startTransition`; only one animates.

---

## Fragment refs

### Lesson 3. Fragment refs expose a FragmentInstance over a group of DOM nodes [React 19.3]

**Takeaway:** Introduced in: experimental earlier; **stable in React 19.3**. `ref` on `<Fragment>` (the long form) yields a **FragmentInstance** with group operations: `focus`, observers, `scrollIntoView`, `getClientRects`, event listeners on the **children as a group** — without adding a wrapper `div`.

**Explain:**
`<>` **cannot** take a ref (no props). Use:

```jsx
import { Fragment, useRef, useLayoutEffect } from "react";

function TableRowGroup({ cells }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <Fragment ref={ref}>
      {cells.map((c) => (
        <td key={c.id}>{c.text}</td>
      ))}
    </Fragment>
  );
}
```

`FragmentInstance` operates on the children’s DOM **as a group** (focus first focusable, observe bounds, etc.) without changing HTML structure — critical for tables and CSS grids.

### Why it was introduced?

`forwardRef` to a single node fails when a component must return **multiple** nodes. Wrapping in `div` breaks `<tr>` / flex. `findDOMNode` is deprecated.

### Before 19.3

- Extra `div` (breaks tables)
- `querySelectorAll` in `useLayoutEffect` (fragile)
- `findDOMNode` (gone)

### Real-world examples

**1. Table row that is a component returning several `<td>`s** — focus the row group after insert.

**2. Design-system `ButtonPair`** — two buttons as flex children of the parent; observe visibility as a unit.

**3. Form field + error + hint** — scroll the **group** into view on validation error without a wrapper that breaks grid.

### When should I use it?

Composite components that must not emit a DOM wrapper, but parents still need **imperative** access.

### When should I NOT?

Single-element components — pass `ref` to the DOM node (19 `ref` as prop). You do not need a fragment.

### Common mistakes

- `ref` on `<>` (invalid)
- Assuming `ref.current` is an `HTMLElement` (it is a **FragmentInstance**)

### Related APIs

Fragments (16.2), `useImperativeHandle`, 19 ref-as-prop

### Interview notes

- Stable 19.3.
- Group DOM APIs without a wrapper node.
- Short fragment syntax cannot take ref.

**Tip:** TypeScript: `FragmentInstance` type from React 19.3 types.

**Try it:** `scrollIntoView` on a fragment wrapping `dt`+`dd` inside a `<dl>`.

---

## browser(), Trusted Types, RSC Context

### Lesson 4. Client-only `browser()`, Trusted Types, and Context from the server [React 19.3]

**Takeaway:** Introduced in: React 19.3. Three smaller but important items: **`browser()`** to opt a subtree into client-only rendering, **Trusted Types** pass-through for XSS policies, and **Server Components importing a client Context** without a wrapper Provider component.

**Explain:**

### `browser()` (`react-dom`)

A helper that **suspends on the server** (and during SSR) until you are in the real browser, so client-only APIs (`useQuery` without `initialData`, `window`, `matchMedia`) do not run during SSR/hydration unsafely.

```jsx
import { browser } from "react-dom";
import { use } from "react";

function ClientOnlyChart({ fallbackData }) {
  if (fallbackData === undefined) {
    use(browser());
  }
  return <Chart />;
}
```

Pattern from the 19.3 blog: skip `browser()` when the server already provided `initialData`. This is **not** Next.js `dynamic(..., { ssr: false })` **[framework]**, but it solves a similar problem at the React layer.

### Trusted Types

With CSP `require-trusted-types-for 'script'`, the browser rejects raw strings at XSS sinks. React used to coerce values with `'' + value`, **stripping** Trusted Type objects. 19.3 **passes them through** so sanitizer policies work.

If you do not use Trusted Types, you can ignore this. If you do, upgrade before enforcing the CSP.

### Context in Server Components

Server Components still **cannot create** Context, but in 19.3 they can **render** a Context imported from a `'use client'` module:

```jsx
// user-context.js
"use client";
import { createContext } from "react";
export const UserContext = createContext(null);

// layout — Server Component
import { UserContext } from "./user-context";

export async function Layout({ children }) {
  const currentUser = await getCurrentUser();
  return <UserContext value={currentUser}>{children}</UserContext>;
}
```

Before 19.3 you needed a client `UserProvider` wrapper that only forwarded props.

### Independent transitions

19.3 **renders transitions independently** so a slow transition does not stall an unrelated one (they used to be entangled). UX: typing in a search box should not wait on a slow tab transition elsewhere.

### Real-world examples

**1. `useQuery` in a Client Component** — `use(browser())` when no `initialData` from RSC.

**2. Bank/admin CSP** — Trusted Types + React 19.3 so `innerHTML` policies hold.

**3. App Router layout** — pass `currentUser` into `UserContext` directly from a Server Component.

### When should I use browser()?

Client-only libraries without a server snapshot. Prefer passing `initialData` from a Server Component when you can — faster HTML.

### When should I NOT?

Everything — it **delays** HTML for that subtree (suspends). Overuse = empty holes.

### Interview notes

- ViewTransition + Fragment refs **stable 19.3**.
- `browser()` = client-only suspend helper.
- RSC can render client Context in 19.3.
- Transitions are independent.

**Tip:** Label `browser()` as React DOM 19.3, not as Next.js `ssr: false`.

**Try it:** Compare a chart with `initialData` from the server vs `use(browser())` — one is in the HTML, the other waits for the client.
