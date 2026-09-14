# React 19.1

React 19.1 (GitHub: 19.1.0 on **March 28, 2025**) is a quality and debugging release, not a new programming model. Owner Stack is the headline. Label anything RSC-prerender-related as **framework / experimental** if it is not in your app’s documented stable surface.

## Profile

Official notes: [React 19.1.0 release](https://github.com/facebook/react/releases/tag/v19.1.0). This page does **not** invent APIs. Tiny bugfix patches (19.1.x) are omitted unless they change how you write React.

---

## Why 19.1 mattered

### Lesson 1. 19.1 is Owner Stack + hydration/scheduling polish [React 19.1]

**Takeaway:** Introduced in: React 19.1. The architectural story of 19 (Actions, `use()`) does not change. You upgrade 19.0 → 19.1 for **debuggability**, **safer `useId` strings**, and **hydration/effect scheduling** fixes.

**Explain:**

| Area | 19.1 change | Kind |
| --- | --- | --- |
| Debugging | `captureOwnerStack` (development) | DX |
| `useId` | IDs become valid CSS selectors (`«r123»` instead of `:r123:`) | API / behavior |
| DOM | `<dialog>` `onBeforeToggle` / `onToggle` | API |
| Effects | Passive effect scheduling / yielding | Performance |
| Hydration | Mismatch and frozen-state fixes | Rendering |
| Production | `React.act` no longer exported in production builds | DX / testing |
| RSC | Streaming in more edge environments; experimental prerender work | RSC / experimental |

**Tip:** If a tutorial says “19.1 added Actions,” it is wrong. Actions are **19.0**.

**Try it:** After upgrading, search CSS/`querySelector` for `useId()` strings — the format changed.

---

## Owner Stack

### Lesson 2. captureOwnerStack tells you who rendered a component [React 19.1]

**Takeaway:** Introduced in: React 19.1. An **Owner Stack** is a string of components **responsible for rendering** a node (the “created this element” chain), which is not always the same as the parent Fiber stack. `captureOwnerStack()` is **development-only**.

**Explain:**
Component stack = “where in the tree am I.” Owner stack = “which component’s render created this element.” HOCs and `children` as data make those different.

```jsx
import { captureOwnerStack } from "react";

if (process.env.NODE_ENV !== "production") {
  console.log(captureOwnerStack());
}
```

Error overlays and DevTools can show Owner Stacks so “this `input` was created by `Field` called from `AddressForm`” is obvious.

### Why it was needed

Hydration and “invalid hook” errors dumped parent trees that did not match how humans think about composition (`props.children` rendered far away).

### Before 19.1

You got a component stack. You did not get a first-class owner stack API.

### Real-world examples

**1. Design system** — a `TextField` warns; owner stack shows `CheckoutForm` not `App`.

**2. Hydration mismatch** — overlay points at the `DateTime` that called `new Date()` during render.

**3. Third-party table** — owner stack shows *your* `Cell` wrapper, not only `GridInternals`.

### When should I use captureOwnerStack?

Custom error overlays, internal debug logging in **development**.

### When should I NOT?

Production telemetry (the API is not for production). Do not ship `captureOwnerStack` in a minified prod bundle expecting data.

### Common mistakes

- Feature-detecting it in production user paths
- Confusing owner stack with `componentDidCatch`’s `info.componentStack`

### Interview notes

- 19.1, **dev-only**.
- Owner ≠ parent.
- Helps overlays, not a state API.

**Tip:** If you write an error boundary logger, prefer React’s overlay / DevTools in 19.1+ rather than rolling a stack parser.

**Try it:** Log `captureOwnerStack()` inside a nested `Modal` → `Dialog` → `Button` and compare to the parent tree.

---

## useId format

### Lesson 3. useId strings became CSS-selector safe [React 19.1]

**Takeaway:** Introduced in: React 19.1 (format `«r…»`). React 18 used colons (`:r1:`) which **break `querySelector` / CSS**. 19.2 later switched the default prefix toward **underscores** — see [19.2](/notes/learn/react/react-19-2).

**Explain:**
Do not snapshot the exact string in tests if you upgrade minors. Do not write `.css` files that target `:r0:` internals.

### Real-world examples

**1. Playwright tests** using `page.locator('#:r1:')` — **will break** on 19.1.

**2. CSS-in-JS** that interpolated `useId()` into a selector — 18 was already fragile; 19.1 is at least valid.

**3. Two roots on a page** — still set `identifierPrefix` on `createRoot`.

### When should I care?

E2E tests and any `querySelector(id)`. Prefer **refs** over selecting by generated id.

**Tip:** `document.getElementById(id)` works with the new characters; CSS `querySelector('#«r1»')` is awkward — use refs.

**Try it:** Print `useId()` in 18 vs 19.1 vs 19.2 mentally: colons → guillemets → underscore prefix.

---

## Dialog events and other DOM

### Lesson 4. Dialog toggle events and smaller 19.1 DOM fixes [React 19.1]

**Takeaway:** Introduced in: React 19.1. React DOM listens to `<dialog>` **`beforetoggle` / `toggle`** so you can write `onBeforeToggle` / `onToggle`.

**Explain:**

```jsx
function Drawer({ open, onClose }) {
  return (
    <dialog
      open={open}
      onToggle={(e) => {
        if (e.newState === "closed") onClose();
      }}
    >
      Filters
    </dialog>
  );
}
```

Native `<dialog>` is how modern browsers model modals. React 19.1 keeps the event names in the React system.

### Real-world examples

**1. Mobile filter sheet (e-commerce)** — close state when the user dismisses the dialog.

**2. Command palette** — `onBeforeToggle` to pause keyboard shortcuts.

**3. Accessibility: confirm delete** — prefer `<dialog>` over a `div` + `role="dialog"` when you can.

### Other 19.1 notes (not full lessons)

- **Hydration / frozen trees** — bugfixes; upgrade if you saw stuck Suspense.
- **`React.act` in production** — if a library imported `act` from `react` in production, 19.1 stops that export. Tests should import `act` from `react` in **dev/test** or from testing libraries.
- **RSC streaming on the edge** — relevant if you author a framework; not an app-level hook.

**Tip:** Native dialog + React events beat yet another portal modal if browser support matches your baseline.

**Try it:** Wire `onToggle` on a `<dialog>` and log `e.newState`.
