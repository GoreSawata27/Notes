# React 17

React 17 (October 2020) is famous for **not** adding a new developer-facing UI API. It exists so teams can **upgrade gradually** and so the platform (JSX, events) matches how browsers actually work.

## Profile

**Why this release mattered:** infrastructure. Two Reacts on one page, a JSX transform that does not need `import React`, and event delegation attached to the **root** instead of `document`.

---

## Why this release mattered

### Lesson 1. React 17 is an upgrade-path release [React 17]

**Takeaway:** Introduced in: React 17.0. No Hooks sequel. No concurrent mode as a public product. The headline is: **you can embed a React 17 tree inside a React 15/16 tree (or the reverse) more safely.**

**Explain:**
Large companies cannot flip `package.json` in one PR. React 17 changed **where** events attach and how JSX compiles so two copies of React interfere less.

### What changed for you as a developer

- New JSX transform (also backported to 16.14 / 15.7)
- Events delegated to the root DOM node, not `document`
- Effect cleanup timing aligned (cleanup of one tree runs before the next tree’s setup in more cases)
- Native component stacks in more places
- No new component API

### Why it was needed

`document.addEventListener` from two Reacts meant nested “legacy + modern” microfrontends stole each other’s events. The old JSX transform required `React` in scope even if you never wrote `React.createElement`.

### Before React 17

```jsx
import React from "react"; // required for JSX
import ReactDOM from "react-dom";

ReactDOM.render(<App />, document.getElementById("root"));
```

Events: React listened on `document` for clicks, then ran your `onClick`.

### After React 17

```jsx
import { createRoot } from "react-dom/client"; // 18+; 17 still uses ReactDOM.render

function App() {
  return <h1>Hello</h1>; // no React import if the new JSX transform is on
}
```

In **17**, you still typically `ReactDOM.render`. `createRoot` is **18**. Do not mix those versions.

### Real-world examples

**1. Microfrontend dashboard** — a Shell on React 16 hosts a Payments widget on React 17. Root-delegated events keep clicks inside the widget.

**2. Design-system migration** — publish buttons compiled with the new JSX runtime; consumers on 16.14+ can use them.

**3. Gradual SPA upgrade** — route `/legacy` stays on 16; `/app` is 17. Not fun, but *possible* in a way 16→18 concurrent would not have been.

### When should I care about 17?

When reading old upgrade docs, configuring `tsconfig`/`babel` `runtime: automatic`, or debugging “click does not reach React” in nested apps.

### When should I NOT?

Do not wait for a “React 17 feature” to write better UI. There isn’t one. If you are on 17 today, plan [17 → 18](/notes/learn/react/migrations).

### Interview notes

- “What is new in React 17?” → **gradual upgrades, JSX transform, event delegation change.**
- Concurrent rendering is **18**.

**Tip:** React 17 is the last version where `ReactDOM.render` is the official bootstrap without deprecation.

**Try it:** Open a file that still `import React from "react"` only for JSX. With the automatic runtime, that import can go.

---

## New JSX transform

### Lesson 2. JSX no longer needs React in scope [React 17]

**Takeaway:** Introduced in: React 17 (and backported to **16.14** and **15.7**). Compilers call `jsx()` from `react/jsx-runtime` instead of `React.createElement`.

**Explain:**
This is a **compiler** change plus a **runtime** module. Your source looks the same. The emit changes.

### Before (classic transform)

```jsx
import React from "react";

export function Title() {
  return <h1 className="hero">Home</h1>;
}

// emit:
// React.createElement("h1", { className: "hero" }, "Home")
```

If you forgot the import, the browser said `React is not defined`.

### After (automatic transform)

```jsx
export function Title() {
  return <h1 className="hero">Home</h1>;
}

// emit (simplified):
// import { jsx as _jsx } from "react/jsx-runtime";
// _jsx("h1", { className: "hero", children: "Home" })
```

You still import React to use hooks, `memo`, `Fragment` as a named export, etc.

### Why it was needed

- Dead `React` imports everywhere
- Better minification and a bit less bundle for the classic `createElement` path
- Key handling / static children optimizations in the new runtime

### How to turn it on

- Create React App 4+, Vite, Next.js: usually **on by default**
- Babel: `"runtime": "automatic"` in `@babel/preset-react`
- TypeScript: `"jsx": "react-jsx"` in `tsconfig.json`

### Real-world examples

**1. Component library publish** — emit using automatic runtime so consumers do not need React 17 *as long as they have 16.14+* with the backport.

**2. ESLint `react/react-in-jsx-scope`** — turn the rule off once the transform is on (otherwise every file is a false positive).

**3. Storybook** — mismatch between Storybook’s Babel and the app’s `react-jsx` causes `jsx is not defined`. Align compilers.

### When should I use it?

Always on new projects. On old projects, it is a safe compiler upgrade if `react` is ≥ 16.14.

### When should I NOT?

If you are stuck on React 16.13 or earlier without the backport packages. Then keep the classic transform.

### Common mistakes

- Removing `import React` while still on classic transform
- Importing `jsx-runtime` yourself (the compiler should)

### Related APIs

`react/jsx-runtime`, `react/jsx-dev-runtime` (dev: extra debug info)

### Interview notes

- New JSX transform = 17, backported 16.14.
- You still need the `react` package.

**Tip:** `React.Fragment` vs `<>` is unchanged. Fragments still exist.

**Try it:** Set `"jsx": "react-jsx"` in a Vite app and delete unused `import React` lines.

---

## Event delegation

### Lesson 3. React 17 attaches events to the root, not document [React 17]

**Takeaway:** Introduced in: React 17. React still uses **delegation** (one listener handles many child `onClick`s), but the listener sits on the **root DOM node** you passed to `render`.

**Explain:**
This is not “React stopped using delegation.” It is “delegation moved closer to your app.”

```text
React 16:  document  →  React event system  →  your onClick
React 17:  #root     →  React event system  →  your onClick
```

### Why it was needed

1. **Nested Reacts** — a v17 widget inside a v16 shell: document-level listeners from both copies fought (`e.stopPropagation` mysteries).
2. **Non-React code** — `document.addEventListener('click', …)` from analytics ran in surprising order relative to React 16.
3. **Portals** — still work; React’s synthetic system is not the same as DOM bubbling to `document`.

### Before vs after, in practice

```jsx
// Vanilla code outside React
document.addEventListener("click", () => {
  console.log("document saw click");
});

function Item() {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        console.log("react");
      }}
    >
      Buy
    </button>
  );
}
```

In **16**, `stopPropagation` in React often **prevented** the document listener (React got there first on document). In **17**, the document listener may still run because React is only listening on `#root`. This broke some “click outside” hacks and also **fixed** nested-React bugs.

### Real-world examples

**1. “Click outside to close” dropdown** — a document listener that assumed React 16 ordering. After 17, prefer `pointerdown` on document **and** check `root.contains(event.target)`, or use a well-tested library.

**2. Microfrontend: Buy button** — click must not be swallowed by the host’s React 16 document listener.

**3. Third-party chat widget** injecting its own `document` listeners — fewer collisions with React 17 roots.

### When should I worry?

If you mix React versions, portals + `stopPropagation`, or homemade click-outside.

### When should I NOT?

Everyday `onClick` on a button — you write the same code.

### Common mistakes

- Re-attaching React 16 mental model of `stopPropagation` vs `document`
- Creating **multiple roots** accidentally and wondering why events do not see each other the same way

### Related APIs

Portals, `createRoot` (18, still root-attached)

### Interview notes

- Delegation **moved from document to root** in 17.
- This enabled gradual upgrades.

**Tip:** `e.nativeEvent` is the real DOM event if you need to debug ordering.

**Try it:** Add a `document` click listener and a React `onClick` with `stopPropagation`. Compare 16 vs 17 mental models (even if you only run 18 — 18 kept 17’s root attachment).

---

## Other 17 changes

### Lesson 4. Effect cleanup, stacks, and what 17 did *not* ship [React 17]

**Takeaway:** Introduced in: React 17. A few behavioral fixes; still **no** concurrent rendering, **no** automatic batching everywhere, **no** `useTransition`.

**Explain:**

### Effect cleanup timing

React 17 runs **all** layout/passive cleanups of the previous tree more consistently before running the next effects. If you swapped a component that subscribed to the same global store, 16 could overlap subscriptions briefly. 17 is stricter about dispose-then-subscribe.

### No event pooling

React 16 reused (pooled) synthetic event objects. You had to `e.persist()` to read `e.target` inside `setTimeout`. **React 17 stopped pooling.** You can read the event asynchronously without `persist()`. (People often credit 17; do not write `persist()` in new code.)

### What React 17 did **not** include

| Feature | Actual version |
| --- | --- |
| `createRoot` / concurrent features | 18 |
| Automatic batching in promises | 18 |
| `useTransition` | 18 |
| Actions / `use()` | 19 |
| Hooks | 16.8 |

### Real-world examples

**1. `setTimeout(() => console.log(e.target))` in a form** — works without `persist()` after 17.

**2. Subscription custom hook** — cleanup of user A before subscribe of user B when switching profiles.

**3. Error stacks** — component stacks in DevTools / logs improved; still bring Source Maps.

### Migration 16 → 17

Usually **low risk**. See [Migrations](/notes/learn/react/migrations). Test click-outside and microfrontends.

**Tip:** If a blog titles “React 17 concurrent mode,” it is wrong. Concurrent is 18.

**Try it:** Search the codebase for `e.persist`. You can delete it on 17+.
