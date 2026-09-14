# React 16 (16.0–16.14)

Fiber-era public APIs. Architecture internals live in [Fiber](/notes/learn/react/fiber). Hooks as a *version shift* live in [Hooks Evolution](/notes/learn/react/hooks-evolution).

## Profile

**Why React 16 mattered:** it replaced the stack reconciler with Fiber, which made Error Boundaries, Fragments, Portals, and later Hooks/Suspense possible. Most 16.x minors are small; the table at the end lists them so you do not invent APIs for 16.10–16.12.

---

## Why this release mattered

### Lesson 1. React 16 is a new engine with a familiar API [React 16]

**Takeaway:** Introduced in: React 16.0 (September 2017). The public component model stayed. The reconciler, error handling, and host tree (fragments/portals) changed.

**Explain:**
React 15 apps mostly kept working. What you gained was not a new `setState` — it was an engine that could **split work**, **catch render errors**, and **return multiple children** without a dummy DOM node.

### Before React 16

- Render errors unmounted the whole tree
- Every component had to return one node (usually a wrapping `div`)
- Modals were `position: fixed` hacks inside overflow-hidden parents
- Context used undocumented `contextTypes` that were easy to break

### After React 16

Error Boundaries, Fragments, Portals, and (in 16.3) a supported Context API. Fiber is underneath all of them.

### Real-world examples

**1. SaaS shell** — a crash in a widget must not blank the nav. Error Boundaries (16.0).

**2. Design system Table** — `Table` / `tr` / `td` cannot have extra `div`s. Fragments (16.0 arrays, 16.2 `<>`).

**3. Checkout modal** — render the dialog into `document.body` so the page scroll lock and `z-index` work. Portals (16.0).

**Tip:** If someone says “we upgraded to 16 for Hooks,” they mean 16.8. 16.0 was Fiber + recovery + host tree flexibility.

**Try it:** Name the 16.0 vs 16.8 vs 16.6 milestones without looking: Fiber, Hooks, `lazy`/`Suspense`.

---

## Error Boundaries

### Lesson 2. Error Boundaries catch render-time failures [React 16]

**Takeaway:** Introduced in: React 16.0. An Error Boundary is a **class** component that implements `componentDidCatch` and/or `static getDerivedStateFromError` (the latter added in **16.6**) to render a fallback when a child throws during render.

**Explain:**
JavaScript `try/catch` does not wrap render of children. React 16 runs render in a try path and looks **up the Fiber tree** for a boundary.

### What is it?

```jsx
class WidgetBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    reportToSentry(error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return <p role="alert">This widget failed. Try refresh.</p>;
    }
    return this.props.children;
  }
}
```

`getDerivedStateFromError` (16.6) is for **updating state** to show a fallback. `componentDidCatch` (16.0) is for **side effects** (logging). You usually want both.

### Why was it introduced?

In React 15, a throw in render often left the UI in a corrupted state. Production users saw a blank page. Fiber can unmount the broken subtree and keep the rest.

### Before React 16

```jsx
function Dashboard() {
  return (
    <div>
      <RevenueChart /> {/* throw → entire app unmounts */}
      <ActivityFeed />
    </div>
  );
}
```

### With Error Boundaries

```jsx
function Dashboard() {
  return (
    <div>
      <WidgetBoundary>
        <RevenueChart />
      </WidgetBoundary>
      <ActivityFeed />
    </div>
  );
}
```

### How it works

Throw during **render** of a descendant → React unwinds fibers → finds the nearest boundary → re-renders it with fallback. Throws in **event handlers** are *not* caught (use `try/catch` there). Throws in `useEffect` are not caught by Error Boundaries in the same way — they are effect-time errors (in 18+, some are reported; still wrap async work yourself).

### Real-world examples

**1. Analytics dashboard** — one third-party chart throws on bad data. Isolate each card.

**2. E-commerce PDP** — recommended-products widget fails; the buy box must stay.

**3. Chat app** — message parser throws on a malformed payload; the composer stays mounted.

### When should I use it?

Around **untrusted**, optional, or third-party subtrees. Route-level boundaries in a SPA so a page crash keeps the chrome.

### When should I NOT use it?

- Do not wrap every tiny component (you will hide bugs)
- Do not use them to handle expected validation (`email is invalid` is not an exception)
- Function components **cannot** be boundaries (no `getDerivedStateFromError` on functions). `react-error-boundary` is a class wrapper.

### Common mistakes

- Catching fetch failures with a boundary instead of rendering `{error && <p>…</p>}`
- Expecting `onClick` throws to be caught
- Forgetting a reset (`key={location}` on the boundary) so the fallback never goes away after navigation

### Performance considerations

Boundaries are cheap. Logging in `componentDidCatch` should be async (beacon), not a sync 200ms HTTP call.

### Related APIs

Suspense (sibling idea: “not ready yet” vs “threw”), React 18 `hydrateRoot` error options, React 19 improved error reporting

### Interview notes

- Class-only.
- Catches render/lifecycle/constructor errors in descendants, not events.
- `getDerivedStateFromError` = 16.6.

**Tip:** Pair with a `key` on the boundary that changes when the user navigates or hits Retry.

**Try it:** Throw in a child render, wrap it, then throw in an `onClick` and confirm the boundary does *not* catch it.

---

## Fragments

### Lesson 3. Fragments return multiple children without a DOM node [React 16.2]

**Takeaway:** Introduced in: React **16.0** as `React.Fragment` / arrays; the `<>` **short syntax landed in 16.2**. A Fragment groups elements without adding a wrapper node.

**Explain:**
HTML has rules (`<tr>` cannot sit in a random `<div>`). CSS has rules (flex/grid children). Dummy wrappers break both.

### What is it?

```jsx
function Columns() {
  return (
    <>
      <td>SKU</td>
      <td>Qty</td>
    </>
  );
}
```

Keyed fragments need the long form:

```jsx
<React.Fragment key={group.id}>
  {group.cells}
</React.Fragment>
```

`<>` cannot take a `key`.

### Why was it introduced?

React 15 forced a single root. Teams wrapped everything in `<div className="fragment-hack">` and broke tables and CSS.

### Before

```jsx
function UserMeta({ user }) {
  return (
    <div>
      <dt>Role</dt>
      <dd>{user.role}</dd>
    </div>
  );
}
```

That extra `div` inside a `<dl>` is invalid-ish and can wreck grid layouts.

### After

```jsx
function UserMeta({ user }) {
  return (
    <>
      <dt>Role</dt>
      <dd>{user.role}</dd>
    </>
  );
}
```

### Real-world examples

**1. Admin table** — `Row` component returns several `<td>`s.

**2. Design-system ButtonGroup** — fragment of buttons as flex children of the parent.

**3. Auth layout** — `<> <SeoTitle /> <Main /> </>` without a wrapper that breaks `min-height: 100%`.

### When should I use it?

Whenever the parent should own the DOM structure.

### When should I NOT?

If you need a hook target for CSS (`display: flex` on *this* group) or a ref on a box, use a real element. (Fragment refs are a **19.3** feature — [React 19.3](/notes/learn/react/react-19-3).)

### Common mistakes

- Putting `key` on `<>`
- Using a fragment when a `<div>` is the correct layout box

### Performance considerations

Fewer nodes → slightly less DOM. Not a reason to fragment everything.

### Related APIs

Arrays as children (16.0), Fragment refs (19.3)

### Interview notes

- 16.0 Fragment component; 16.2 short syntax.
- Only `React.Fragment` accepts `key`.

**Tip:** If DevTools shows a node named `Fragment`, that is expected — it is not a DOM node.

**Try it:** Render two `<td>`s from a component inside a `<tr>` with and without a wrapping `div`. Inspect the table.

---

## Portals

### Lesson 4. Portals render children into a different DOM node [React 16]

**Takeaway:** Introduced in: React 16.0. `createPortal(child, container)` mounts `child` under `container` while keeping React parent context (events, context).

**Explain:**
Visual parent (DOM) and React parent (tree) can differ.

```jsx
import { createPortal } from "react-dom";

function Modal({ children, onClose }) {
  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.getElementById("modal-root"),
  );
}
```

### Why was it introduced?

`overflow: hidden`, `transform`, and stacking contexts trap `position: absolute` UI. Tooltips, dialogs, and toasts need to escape.

### Before

```jsx
// Inside a sidebar with overflow: auto — modal is clipped
function Sidebar() {
  return (
    <aside className="overflow-auto">
      {open && <div className="modal-absolute">…</div>}
    </aside>
  );
}
```

### After

Portal to `body` / `#modal-root`. React still treats the modal as a child of `Sidebar` for **context** and **event bubbling in the React tree**.

Event bubbling: a click inside the portal bubbles to React parents, not necessarily through the DOM ancestors of `#modal-root`. That is intentional.

### Real-world examples

**1. Checkout: confirm address dialog** — must cover the full viewport.

**2. Data table: row action menu** — must not clip at the table’s overflow.

**3. Chat: emoji picker** — anchored visually to the composer, DOM under `body` for z-index.

### When should I use it?

Dialogs, toasts, popovers, full-screen lightboxes, hover cards that would clip.

### When should I NOT?

Normal layout. Portals make focus management and SSR harder (`document` is missing on the server — gate with `useEffect` or a framework modal).

### Common mistakes

- Forgetting an accessible title / focus trap / `Esc` to close
- Creating a new `container` every render
- Assuming DOM bubbling equals React bubbling

### Performance considerations

Portals are cheap. Re-creating portal roots is not.

### Related APIs

`createRoot` on a node, React 19 document metadata (different problem: `<title>` in the tree)

### Interview notes

- Portal = DOM escape hatch, React tree preserved.
- Context still flows from the React parent.

**Tip:** Put `#modal-root` in `index.html` next to `#root`.

**Try it:** Portal a button; put `onClick` on the React parent; confirm the parent still receives the React click.

---

## Refs, forwarding, Context, Strict Mode

### Lesson 5. createRef, forwardRef, and the supported Context API [React 16.3]

**Takeaway:** Introduced in: React 16.3. `createRef` replaced string refs. `forwardRef` lets a child attach a parent’s ref to a DOM node. `createContext` replaced legacy context.

**Explain:**
16.3 was the “we will not break you next year” cleanup: official APIs for things people already did unsafely.

### createRef (classes) / useRef later

```jsx
class SearchBox extends React.Component {
  inputRef = React.createRef();
  componentDidMount() {
    this.inputRef.current.focus();
  }
  render() {
    return <input ref={this.inputRef} />;
  }
}
```

String refs (`ref="input"`) are gone. Function components use `useRef` (16.8). React 19 also allows `ref` as a normal prop — [React 19](/notes/learn/react/react-19).

### forwardRef

```jsx
const FancyInput = React.forwardRef(function FancyInput({ error }, ref) {
  return <input ref={ref} aria-invalid={!!error} />;
});
```

Needed because `ref` was not a regular prop. Libraries (design systems) must forward refs so parents can focus the inner `<input>`.

### New Context API

```jsx
const ThemeContext = React.createContext("light");

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Page />
    </ThemeContext.Provider>
  );
}

function Button() {
  const theme = useContext(ThemeContext); // 16.8; or ThemeContext.Consumer / class contextType (16.6)
  return <button className={theme}>Save</button>;
}
```

Legacy `childContextTypes` re-rendered poorly and was error-prone. The 16.3 API bails out if `value` is referentially equal.

### Strict Mode (16.3)

`<React.StrictMode>` is a **dev-only** wrapper. In 16.3 it warned about unsafe lifecycles, legacy context, and findDOMNode. In **React 18** it also double-invokes render/effects in development. See [Concurrent](/notes/learn/react/concurrent).

### Real-world examples

**1. Design system `TextField`** — `forwardRef` so a form can `ref.current.focus()` on validation error.

**2. Auth session** — `UserContext` from a login shell instead of prop-drilling `user` through 12 layers.

**3. Theme / i18n** — one provider at the app root; buttons consume without props.

### When should I use Context?

For **rarely changing, tree-wide** values (theme, locale, current user id). Not for high-frequency mouse coordinates.

### When should I NOT use forwardRef?

Leaf DOM components you never focus. React 19 reduces the need for `forwardRef` on new components (`ref` as prop).

### Common mistakes

- New object as context `value` every render (`value={{ user }}}` without memo) → all consumers re-render
- Using Context instead of a state library for the entire store
- Forgetting `displayName` on `forwardRef` components (DevTools)

### Related APIs

`useContext` (16.8), `contextType` (16.6), React 19 `<Context>` without `.Provider`

### Interview notes

- 16.3 = createRef, forwardRef, createContext, StrictMode, getDerivedStateFromProps, getSnapshotBeforeUpdate.
- Legacy context vs new context is a classic question.

**Tip:** `getDerivedStateFromProps` is overused. Prefer fully controlled components.

**Try it:** Log a consumer when the provider’s `value={{ theme }}` is inline vs `useMemo`.

---

## memo, lazy, Suspense

### Lesson 6. React.memo, lazy, and Suspense for code splitting [React 16.6]

**Takeaway:** Introduced in: React 16.6. `React.memo` is a pure-component for functions. `React.lazy` + `Suspense` load a component bundle on demand. In 16.x, **Suspense did not wait for data** — only for `lazy()`. Data Suspense is a later (18+) story.

**Explain:**
16.6 is the “function components get class feature-parity extras” release, plus the start of Suspense.

### React.memo

```jsx
const PriceCell = React.memo(function PriceCell({ amount, currency }) {
  return <td>{formatMoney(amount, currency)}</td>;
});
```

Shallow-compares props. Skip render if they are equal. Same idea as `PureComponent`.

Fundamentals: [Lesson 27](/notes/learn/react).

### lazy + Suspense (code splitting)

```jsx
const Editor = React.lazy(() => import("./MarkdownEditor"));

function ArticlePage() {
  return (
    <Suspense fallback={<p>Loading editor…</p>}>
      <Editor />
    </Suspense>
  );
}
```

`lazy` requires a `default` export. The fallback is committed until the promise resolves. Error if the import fails — pair with an Error Boundary.

### Why it was needed

Class `PureComponent` had no function equivalent. Huge admin bundles shipped the JSON editor to every page.

### Before

```jsx
import Editor from "./MarkdownEditor"; // always in the main bundle

function ArticlePage() {
  return <Editor />;
}
```

### After

Dynamic `import()` with a declared loading UI. Route-based splitting (React Router) uses the same primitives.

### Real-world examples

**1. CMS: Markdown editor** — load CodeMirror only on `/articles/:id/edit`.

**2. Settings: billing** — load Stripe.js UI when the user opens the billing tab.

**3. Social: emoji picker** — large dataset; lazy the picker on first open.

### When should I use memo?

When a component is **pure**, **re-renders often with the same props**, and profiling shows it is hot. Not on every component.

### When should I NOT use lazy?

Tiny components (the request costs more than the module). Anything needed for LCP on first paint (hero). SSR needs framework support (`lazy` + SSR was painful until 18 streaming).

### Common mistakes

- `memo` of a component that receives new inline `onClick={() => ...}` every time
- Nested `Suspense` missing so one slow lazy blanks a whole page
- Using 16.x Suspense to wrap `fetch` (not supported then)

### Performance considerations

`memo` adds a compare. `lazy` adds a network round trip. Measure.

### Related APIs

Concurrent Suspense for data (18), `useTransition` to avoid hiding the whole page

### Interview notes

- `memo` ≈ `PureComponent`.
- 16.6 Suspense = code splitting only.
- `lazy` + named exports need a re-export wrapper.

**Tip:** Default export: `export default function Editor`. Named: `lazy(() => import('./E').then(m => ({ default: m.Editor })))`.

**Try it:** Network-throttle and click a route wrapped in `lazy`. Confirm the fallback.

---

## Notable 16.x minors

### Lesson 7. What actually changed in 16.4–16.14 [React 16.4]

**Takeaway:** Introduced in: each row. Do not invent features for quiet minors. If a patch only fixed bugs, skip it.

**Explain:**
Use this as the honest 16.x map.

| Version | What React developers actually felt |
| --- | --- |
| 16.0 | Fiber, Error Boundaries, Portals, fragments as arrays, custom DOM attributes, error recovery |
| 16.1 | Bugfixes, `React.createContext` experimental prep |
| 16.2 | `<>` Fragment syntax |
| 16.3 | Context, `createRef`, `forwardRef`, StrictMode, `getDerivedStateFromProps`, `getSnapshotBeforeUpdate` |
| 16.4 | Pointer Events (`onPointerDown` …), `getDerivedStateFromProps` bugfix, experimental Profiler |
| 16.5 | `<Profiler>` for measuring render cost; DevTools integration |
| 16.6 | `memo`, `lazy`, `Suspense`, `contextType`, `getDerivedStateFromError`, `StrictMode` additions |
| 16.7 | Bugfixes (Hooks were *not* in 16.7 — they shipped in **16.8**) |
| 16.8 | Hooks |
| 16.9 | `UNSAFE_` lifecycle names, `act()` testing helper, `<Profiler>` `id` |
| 16.10–16.12 | Mostly internals / experimental concurrent work — not new public APIs you should study as features |
| 16.13 | Warnings: some deprecated patterns, `forwardRef` + `memo` stacking |
| 16.14 | Backport of the **new JSX transform** so React 16 apps can skip `import React from 'react'` |

### Profiler (16.5)

```jsx
<Profiler id="Checkout" onRender={(id, phase, actualDuration) => {
  if (actualDuration > 16) logSlow(id, actualDuration);
}}>
  <CheckoutFlow />
</Profiler>
```

Use in performance investigations, not in every production view without sampling.

### Pointer Events (16.4)

`onPointerUp` unifies mouse/touch/pen. Prefer them for drawing tools and drag handles.

### 16.7 trap

Blog posts and Stack Overflow sometimes say “Hooks in 16.7.” **Wrong.** Hooks are **16.8** (February 2019). 16.7 was a bugfix release.

**Tip:** If an interview asks “when did Hooks ship?”, say **16.8**. If they ask Fiber, **16.0**.

**Try it:** Check `package.json` of an old app: `react` 16.7 means **no Hooks** yet.

---

### Lesson 8. Strict Mode’s original job [React 16.3]

**Takeaway:** Introduced in: React 16.3. Strict Mode is a development helper that flags unsafe patterns. It does not affect production builds.

**Explain:**
16.3 Strict Mode warned about:

- Unsafe lifecycles (`componentWillMount`, …)
- Legacy string refs
- Legacy context
- Unexpected side effects (later expanded)

It is a **tree wrapper**, not a global compiler flag:

```jsx
createRoot(node).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

You can wrap only a subtree (a new widget) to harden it first.

### Real-world examples

**1. Gradual migration of a design system** — StrictMode around new packages only.

**2. Finding double-fetch bugs** — 18’s double-invoke of effects (later behavior) exposes missing cleanup.

**3. Third-party maps** — a vendor widget that breaks under Strict Mode is not Strict Mode’s bug; it is missing cleanup.

### When should I use it?

Always in development for new apps. On legacy apps, wrap incrementally.

### When should I NOT?

Do not disable Strict Mode to “fix” double effects — fix the effect.

**Tip:** React 18 changed Strict Mode **behavior** (double render). The *component* is still 16.3. Details: [Concurrent](/notes/learn/react/concurrent).

**Try it:** Wrap a form, watch console warnings, and map each warning to [Deprecated APIs](/notes/learn/react/deprecated).
