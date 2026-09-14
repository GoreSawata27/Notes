# React 18 APIs

The hooks and functions that make concurrent rendering usable: Transitions, deferred values, IDs, external stores, and CSS insertion.

## Profile

Architecture: [Concurrent Rendering](/notes/learn/react/concurrent). This page is **how to use the APIs**. Each major hook has three different product examples.

---

## startTransition and useTransition

### Lesson 1. useTransition marks a setState as non-urgent [React 18]

**Takeaway:** Introduced in: React 18. `useTransition` returns `[isPending, startTransition]`. Updates inside `startTransition` are interruptible. `isPending` is true until that transition’s render commits.

**Explain:**
`startTransition` (imported from `react`) is the same marking function without `isPending`. Use the hook when the UI should reflect “still switching.”

### What is it?

```jsx
import { useState, useTransition } from "react";

function Tabs({ panels }) {
  const [tab, setTab] = useState("overview");
  const [isPending, startTransition] = useTransition();

  function select(next) {
    startTransition(() => setTab(next));
  }

  return (
    <>
      {panels.map((p) => (
        <button key={p.id} onClick={() => select(p.id)} disabled={isPending && tab !== p.id}>
          {p.label}
        </button>
      ))}
      {isPending ? <span>Loading view…</span> : null}
      <HeavyPanel id={tab} />
    </>
  );
}
```

### Why was it introduced?

Urgent input and heavy views shared one update pipeline. See [Concurrent](/notes/learn/react/concurrent).

### Before React 18

```jsx
function select(next) {
  setTab(next); // whole tree waits; or you fake it with local `loading` + debounce
}
```

Teams invented `const [pending, setPending] = useState` plus `setTimeout` to paint a spinner — not interruptible, not coordinated with Suspense.

### With useTransition

React knows the in-flight tree can be abandoned if the user clicks another tab.

### How it works

`startTransition(fn)` runs `fn` immediately. Any `setState` inside is tagged as a transition lane. React may keep the **current** UI on screen (`isPending === true`) until the new tree is ready. Nested `useDeferredValue` also participates in this model.

### Real-world examples

**1. Search / filter a large catalog (e-commerce)**

Problem: 8,000 product cards. Each keystroke must not stall the search box.

```jsx
function Catalog({ products }) {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <input
        value={input}
        onChange={(e) => {
          const v = e.target.value;
          setInput(v);
          startTransition(() => setQuery(v));
        }}
      />
      <div style={{ opacity: isPending ? 0.6 : 1 }}>
        <ProductGrid products={products.filter((p) => p.name.includes(query))} />
      </div>
    </>
  );
}
```

Useful here: the input stays urgent; the grid is the transition.

**2. Tab switching in an analytics dashboard**

Problem: “Revenue” vs “Cohorts” mounts different 200kb chart trees.

```jsx
startTransition(() => setTab("cohorts"));
```

Keep the old chart visible (`isPending`) instead of unmounting to a blank `null`.

**3. Navigation-style content in an SPA (settings sections)**

Problem: clicking “Billing” should feel instant on the nav item, while the billing form (with many fields) can lag by a frame.

```jsx
function SettingsNav({ current, onChange }) {
  const [isPending, startTransition] = useTransition();
  return (
    <nav aria-busy={isPending}>
      {items.map((id) => (
        <button
          key={id}
          aria-current={current === id}
          onClick={() => startTransition(() => onChange(id))}
        >
          {id}
        </button>
      ))}
    </nav>
  );
}
```

### When should I use it?

Heavy CPU renders triggered by a click/type where you can split “immediate feedback” from “next view.”

### When should I NOT use it?

- The state **is** the controlled input
- Updates that must commit in order with layout (`flushSync` territory)
- Treating `isPending` as “fetch still in flight” without Suspense — it only tracks **React render** of that transition

### Common mistakes

```jsx
// WRONG: input is also deferred
startTransition(() => setInput(e.target.value));
```

```jsx
// WRONG: wrapping fetch
startTransition(async () => {
  const data = await fetch("/api"); // the await is NOT a React transition
  setData(data);
});
```

`startTransition` does not wait for promises (React 19 **Actions** do a better job for async functions). In 18, do the fetch yourself, then `startTransition(() => setData(data))` if the commit is heavy.

### Performance considerations

Improves **interaction responsiveness**. Does not shrink bundle size.

### Related APIs

`startTransition` (no pending flag), `useDeferredValue`, Suspense, React 19 Actions

### Interview notes

- `isPending` = transition render not committed yet.
- Do not put the text input’s value only inside the transition.
- 18 API; concurrent root required.

**Tip:** Dim the stale list (`opacity`) when `isPending` — a cheap UX that signals “this is old.”

**Try it:** Filter 5,000 rows with and without a transition; type quickly and watch the input.

---

## useDeferredValue

### Lesson 2. useDeferredValue lags a value so urgent UI can update first [React 18]

**Takeaway:** Introduced in: React 18. `useDeferredValue(value)` returns a **deferred** copy that may still be the previous value during urgent updates.

**Explain:**
Use it when you **cannot** or **do not want** to split state into two `useState`s. One state; React defers the expensive consumers.

### What is it?

```jsx
function Search({ items }) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const stale = deferredQuery !== query;

  const results = useMemo(
    () => items.filter((item) => item.name.includes(deferredQuery)),
    [items, deferredQuery],
  );

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <ul style={{ opacity: stale ? 0.6 : 1 }}>
        {results.map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </>
  );
}
```

### Why was it introduced?

`useTransition` needs **two** state variables if the urgent value and the heavy value are the same conceptually. `useDeferredValue` is “please use the old value for expensive children until you can catch up.”

### Before React 18

Debounce `query` with `setTimeout` (feels laggy, skips values) or `useMemo` on the hot path (still runs on the same urgent render).

### How it works

During an urgent render, React may pass the **previous** deferred value to children. A later render updates it. Similar to a transition, but driven by a **value** instead of a `setState` wrapper.

### Real-world examples

**1. Autocomplete (SaaS command palette)**

Problem: filtering commands is CPU-heavy; the field must stay in sync.

```jsx
const deferred = useDeferredValue(query);
<CommandList query={deferred} />
```

**2. Live preview of a newsletter (marketing tool)**

Problem: the HTML preview reflows slowly; the textarea is urgent.

```jsx
const deferredHtml = useDeferredValue(html);
<Preview html={deferredHtml} />
```

**3. Map markers from a filter (logistics dashboard)**

Problem: re-clustering 20k points is expensive.

```jsx
const deferredBounds = useDeferredValue(bounds);
<MarkerLayer bounds={deferredBounds} />
```

### When should I use useDeferredValue vs useTransition?

| Prefer | When |
| --- | --- |
| `useTransition` | You control the `setState` (tab click, navigation) and want `isPending` |
| `useDeferredValue` | A value already exists (from props or one `useState`) and a **child** is expensive |

They can combine. Do not stack them meaninglessly.

### When should I NOT use it?

Cheap lists. Values that must never be stale (prices at click-to-buy — do not defer the SKU the user clicked).

### Common mistakes

- Deferring the `<input value={deferred}>` — the field lags
- Forgetting `useMemo` on the expensive derive — you still compute on the urgent render if you filter with `query` instead of `deferredQuery`

### Performance considerations

Same as transitions: responsiveness, not less work overall.

### Related APIs

`useTransition`, `memo` on the heavy child (so it skips when deferred value is unchanged)

### Interview notes

- Deferred value may be stale by design.
- Compare `deferred !== value` for a pending UI.
- React 18.

**Tip:** `memo(ProductGrid)` + deferred props is the usual combo.

**Try it:** Log `query` and `deferredQuery` on each render while typing fast.

---

## useId

### Lesson 3. useId generates stable unique IDs for accessibility and SSR [React 18]

**Takeaway:** Introduced in: React 18. `useId()` returns a unique string **stable across server and client** for that component instance. Use it to wire `htmlFor` / `id` / `aria-describedby`.

**Explain:**
`Math.random()` and incrementing counters **mismatch on hydration**.

### What is it?

```jsx
function Field({ label, error }) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input id={id} aria-describedby={error ? errorId : undefined} />
      {error ? <p id={errorId}>{error}</p> : null}
    </div>
  );
}
```

### Why was it introduced?

SSR + lists of inputs: server said `id="1"`, client said `id="2"` after a diverging render. Hydration warnings and broken labels.

### Before React 18

```jsx
let c = 0;
function useBrokenId() {
  const ref = useRef(null);
  if (!ref.current) ref.current = `field-${c++}`;
  return ref.current;
}
```

This breaks if server and client increment differently, or if Strict Mode double-invokes.

### How it works

React generates an ID from the **tree position** (and a root prefix). Same tree → same ID on server and client.

**Do not** use `useId` as a React `key`. Keys must come from your data.

### Format changes (know this so CSS does not surprise you)

| Version | Example shape (simplified) |
| --- | --- |
| 18.0 | `:r1:` (colon — **invalid in CSS selectors / `querySelector`**) |
| 19.1 | `«r1»` (valid in CSS) |
| 19.2 | prefix `_` (underscores instead of colons in the default prefix) |

If you concatenated `useId()` into a CSS selector on React 18, it could fail. Prefer `document.getElementById` or refs, not CSS selectors, for these IDs.

### Real-world examples

**1. Checkout form** — every `AddressField` instance needs unique label/input ids.

**2. Modal in a design system** — `aria-labelledby` pointing at the title id.

**3. Password field with “show” toggle** — describe the toggle with `aria-controls={inputId}`.

### When should I use it?

Accessibility relationships. SSR-safe ids.

### When should I NOT?

- List `key`s
- Database ids
- CSS module class names

### Common mistakes

- Calling `useId` in a loop instead of in a child component
- Assuming the string format is stable across React minors (it is not; see table)

### Related APIs

19.1 / 19.2 `useId` format notes, `identifierPrefix` on `createRoot` / `hydrateRoot` for multiple roots on one page

### Interview notes

- Hydration-safe ids.
- Not for keys.
- Format changed in 19.1 and 19.2.

**Tip:** Multiple roots: set `identifierPrefix: 'dash-'` so ids do not collide.

**Try it:** SSR a form (or inspect HTML in Next.js) and confirm server `id` equals client `id`.

---

## useSyncExternalStore

### Lesson 4. useSyncExternalStore subscribes to external stores without tearing [React 18]

**Takeaway:** Introduced in: React 18. The correct way to subscribe to data **outside** React (Redux, Zustand, `window.matchMedia`, a WebSocket module) under concurrent rendering.

**Explain:**
`useEffect` + `useState` subscriptions can **tear**: one component sees store version A, another sees B in the same paint, because concurrent render interleaved with a store update.

### What is it?

```jsx
function useOnlineStatus() {
  return useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("online", onStoreChange);
      window.addEventListener("offline", onStoreChange);
      return () => {
        window.removeEventListener("online", onStoreChange);
        window.removeEventListener("offline", onStoreChange);
      };
    },
    () => navigator.onLine,
    () => true, // server snapshot
  );
}
```

Signature: `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot?)`.

`getSnapshot` must return an **immutable** value. If you return a new object every call, you infinite-loop.

### Why was it introduced?

Concurrent rendering reads the store at different times during one render pass. This hook forces a consistent snapshot or retriggers.

### Before React 18

```jsx
const [online, setOnline] = useState(true);
useEffect(() => {
  const on = () => setOnline(navigator.onLine);
  window.addEventListener("online", on);
  return () => window.removeEventListener("online", on);
}, []);
```

Fine on React 17. Can tear on 18 concurrent.

### Real-world examples

**1. Redux / Zustand selector** — libraries already wrap this hook. You call `useSelector`. Under the hood: `useSyncExternalStore`.

**2. `prefers-reduced-motion` in a design system**

```jsx
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia("(prefers-reduced-motion: reduce)");
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}
```

**3. Chat connection singleton** — module-level `client.getStatus()` with `client.subscribe(cb)`.

### When should I use it?

Any external mutable store. Browser APIs that change over time. **Library authors** must use it; app authors often use it indirectly.

### When should I NOT?

React state (`useState`) is already inside React. Do not mirror React state through an external store “for concurrent safety.”

### Common mistakes

- `getSnapshot` returning `store.getState()` object that is a new identity every time
- Omitting `getServerSnapshot` and hydrating `navigator.onLine` mismatches

### Related APIs

`useEffect` subscriptions (legacy), Redux `useSelector`

### Interview notes

- Prevents tearing with concurrent renders.
- `getSnapshot` referential stability.
- 18.

**Tip:** If you write a `useStore` for a module singleton, this is the hook, not `useEffect`.

**Try it:** Log snapshot identity; if it changes every render without store updates, you will loop.

---

## useInsertionEffect

### Lesson 5. useInsertionEffect injects CSS before layout effects [React 18]

**Takeaway:** Introduced in: React 18. It runs **after DOM mutation but before `useLayoutEffect`**. It exists for **CSS-in-JS libraries** to insert styles so layout effects measure the right CSS.

**Explain:**
Timeline:

```text
DOM update → useInsertionEffect → useLayoutEffect → paint → useEffect
```

### What is it?

```jsx
// Library code, not app code
useInsertionEffect(() => {
  if (!document.getElementById(ruleId)) {
    const tag = document.createElement("style");
    tag.id = ruleId;
    tag.textContent = `.${className}{color:red}`;
    document.head.appendChild(tag);
  }
}, [ruleId, className]);
```

### Why was it introduced?

`useLayoutEffect` in a styled component ran **after** a child `useLayoutEffect` that measured width — too late; the CSS was not in the document yet. `useInsertionEffect` fires earlier and does not have access to refs (by design).

### Before React 18

CSS-in-JS used `useLayoutEffect` or rendered `<style>` tags and hoped.

### Real-world examples

These are **library** scenarios:

**1. Emotion / styled-components** inserting a rule before a popover measures itself.

**2. A runtime theme package** injecting CSS variables on the root before layout.

**3. CSS Modules runtime (rare)** — dynamic style tags.

### When should I use it in an application?

Almost **never**. If you are not writing a styling library, skip it.

### When should I NOT?

- Data fetching
- Event listeners
- `ref` access (not allowed the same way; this effect is not for DOM measurement)

### Common mistakes

Using it as a “faster useLayoutEffect.” It is not. It has **stricter rules** (no subscribing, no refs).

### Interview notes

- For CSS-in-JS authors.
- Runs before layout effects.
- 18.

**Tip:** If an interviewer asks “which effect for subscriptions?” the answer is still `useEffect`.

**Try it:** You do not need a demo in app code. Remember the order: insertion → layout → paint → passive.
