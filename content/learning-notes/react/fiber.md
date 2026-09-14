# Fiber & Reconciliation

How React turns `UI = f(state)` into DOM updates — and why React 16’s Fiber rewrite is the foundation for everything concurrent.

## Profile

This chapter is conceptual. APIs that *use* Fiber (`createRoot`, `startTransition`, Suspense) are in later chapters. Pair with [React 16](/notes/learn/react/react-16) for Error Boundaries and [Concurrent Rendering](/notes/learn/react/concurrent) for scheduling.

---

## Reconciliation

### Lesson 1. Reconciliation is how React diffs trees [React 16]

**Takeaway:** Introduced in: React 0.x conceptually; **Fiber reimplemented it in React 16**. Reconciliation is React’s algorithm for comparing the previous element tree to the next one and deciding the smallest DOM update.

**Explain:**
You never call “reconcile()”. You call `setState` / a hook updater. React renders a new description (`{ type, props, key }`) and diffs it against the last description.

### What is it?

Reconciliation is **not** “Virtual DOM is faster than DOM.” It is “avoid touching the DOM unless the description changed.” The Virtual DOM is a **description**. The DOM is the **output**.

### Why was it introduced?

Naive `innerHTML = wholePage` is simple and slow. React’s bet: developers describe UI as a function of state; the library computes the delta.

### Before Fiber (stack reconciler)

The pre-16 reconciler walked the tree recursively and **could not pause**. A deep update locked the main thread until the whole tree finished. That is why large lists felt janky even when “only one row changed” if the parent re-rendered a huge subtree.

### With Fiber

The same public API (`render` a tree) is implemented as a **linked list of Fiber nodes** that can be interrupted. Reconciliation became a unit of work, not a single stack call.

```text
setState
  → render phase (may restart, may be interrupted in concurrent mode)
  → commit phase (DOM mutations, refs, layout effects — synchronous)
```

### Real-world examples

**1. Product filter on an e-commerce grid**

Problem: ticking “In stock” re-renders 800 cards. Reconciliation still walks those 800 fibers, but only cards whose props changed should hit the DOM.

```jsx
function ProductGrid({ products, inStockOnly }) {
  const visible = inStockOnly ? products.filter((p) => p.inStock) : products;
  return (
    <ul>
      {visible.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </ul>
  );
}
```

Why it matters: **`key={p.id}`** tells reconciliation “this is the same product,” so it updates in place instead of unmounting. Wrong keys (index, after sort) cause input state to jump between rows.

**2. Admin dashboard tab switch**

Problem: switching from “Orders” to “Users” should unmount Orders and mount Users, not try to morph a table into a user list.

```jsx
{tab === "orders" ? <OrdersTable key="orders" /> : <UsersTable key="users" />}
```

Different `type` (and/or `key`) → React throws away the old subtree. That is reconciliation, not CSS hiding.

**3. Chat thread append**

Problem: a new message should add one bubble, not rebuild the transcript.

```jsx
function Thread({ messages }) {
  return messages.map((m) => <Bubble key={m.id} body={m.body} />);
}
```

Stable keys at the end of a list are O(1) inserts at the tail. Reversing without keys makes React reuse DOM nodes in the wrong order.

### When should I use this knowledge?

Whenever something “randomly remounts,” focus is lost, or CSS transitions replay — you are debugging reconciliation, not CSS.

### When should I NOT use it?

Do not hand-optimize “to help the Virtual DOM.” Prefer correct `key`s, pulling state down, and `memo` only when profiling says so.

### Common mistakes

- Index keys on a sortable list
- Using a new `key` on every render (`key={Math.random()}`) — forced remount
- Expecting reconciliation to skip children of a parent that re-rendered (it will visit them unless you memo)

### Performance considerations

Reconciliation is CPU work on the main thread. Concurrent rendering (React 18) can **time-slice** the render phase. The commit phase is still synchronous.

### Related APIs

[Fiber](/notes/learn/react/fiber), [React.memo](/notes/learn/react), `key`, [createRoot](/notes/learn/react/concurrent)

### Interview notes

- Reconciliation compares element `type` and `key`.
- Same type + same key → update props. Different type → tear down and mount.
- Keys are for siblings, not globally unique IDs across the app.

**Tip:** “Virtual DOM” in interviews is a trap if you stop at the buzzword. Say “element tree + diff + commit.”

**Try it:** Put an `<input>` inside a list item, sort the list with `key={index}`, and type in the first row. Watch the text jump.

---

## Fiber

### Lesson 2. A Fiber is a unit of work [React 16]

**Takeaway:** Introduced in: React 16.0. A Fiber is an internal object for one component (or host node) that can be walked as a linked list: `child`, `sibling`, `return` (parent). That list is what makes pausing and resuming possible.

**Explain:**
Fiber is the **engine**, not a hook you import. You will never write `new Fiber()`. You will debug it in DevTools as the component tree.

### What is it?

Each Fiber stores:

- What to render (`type`, `pendingProps`)
- The last rendered output (`memoizedProps`, `memoizedState`)
- Links to the rest of the tree
- Flags for what the commit phase should do (Placement, Update, Deletion, …)
- For hooks: a linked list of hook states on function-component fibers

### Why was it introduced?

The stack reconciler used the JavaScript call stack. You cannot yield mid-stack without losing the walk. Fiber **reified** that stack into objects in the heap so React can:

- Pause work to handle a click
- Reuse finished work
- Hydrate incrementally
- Show a Suspense fallback without aborting the whole page
- Recover from render errors (Error Boundaries)

### Before React 16

```text
render(App)
  render(Layout)
    render(Sidebar)   // cannot pause here
    render(Main)
      render(Table)   // 20ms of work — click waits
```

A long render meant dropped frames and delayed input.

### With Fiber

```text
workInProgress fiber: Table
  → complete unit
  → shouldYield()?  if yes, pause
  → later: resume at the next fiber
```

In **legacy** `ReactDOM.render` (16–17), this architecture existed but most updates still ran as if they were synchronous. **Concurrent features are opt-in in 18 via `createRoot`.**

### How it works (practical)

React keeps two trees conceptually:

- **current** — what is on screen
- **workInProgress** — the tree being built

On commit, workInProgress becomes current. This is double buffering.

```text
current:        App → Layout → Main
workInProgress: App → Layout → Main'  (new props)
commit:         swap pointers, run DOM ops
```

### Real-world examples

**1. Search-as-you-type on a 10k-row table**

Problem: each keystroke must update the input (urgent) while filtering can wait (non-urgent). Fiber is why [useTransition](/notes/learn/react/react-18-apis) can deprioritize the filter render.

**2. Route change in a SaaS app**

Problem: navigating to `/settings` should not freeze a running chart animation on the previous page forever — concurrent rendering can abandon an in-progress tree if a newer update supersedes it.

**3. Infinite scroll in a social feed**

Problem: appending 20 posts should not block tapping “Like” on a visible card. The like is a small urgent update; the append is more work. Scheduling (built on Fiber) distinguishes them.

### When should I use this knowledge?

When explaining jank, Error Boundaries, Suspense, or “why did this effect run twice in Strict Mode.” Fiber is the shared substrate.

### When should I NOT use it?

Do not poke `internal` fiber fields in app code. They change between versions. Use DevTools and public APIs.

### Common mistakes

- Saying “Fiber is the Virtual DOM” (Fiber is the reconciler’s data structure)
- Assuming React 16 apps are concurrent (they are not, unless you later use `createRoot` + concurrent APIs)

### Performance considerations

Fiber overhead is real (more objects than a recursive stack). The payoff is schedulable work and features that were impossible on the stack reconciler.

### Related APIs

Error Boundaries (16), `lazy`/`Suspense` (16.6), concurrent rendering (18)

### Interview notes

- Fiber = incremental reconciler shipped in React 16.
- Two phases: **render** (pure, interruptible in concurrent mode) and **commit** (DOM, not interruptible).
- Hooks live on the function component’s fiber (`memoizedState` chain).

**Tip:** Draw `child / sibling / return` once. That drawing is worth more than memorizing lane numbers.

**Try it:** In React DevTools, enable “Highlight updates” and type in a form. You are watching which fibers re-render, not which DOM nodes exist.

---

## Render vs commit

### Lesson 3. Rendering computes; committing mutates [React 16]

**Takeaway:** Introduced in: React 16 (the split is how Fiber is implemented). **Render** calls your components and diffs. **Commit** applies DOM updates, attaches refs, and runs layout/passive effects.

**Explain:**
Mixing these two phases is the source of “Cannot update during render” and of layout-vs-paint bugs.

### Render phase

- Call function components / `render()` methods
- Compare elements
- May run **twice in development** under Strict Mode (React 18+)
- Must be **pure**: same props/state → same output, no DOM writes, no subscriptions

```jsx
function Price({ cents }) {
  const dollars = (cents / 100).toFixed(2); // OK: derived during render
  return <span>${dollars}</span>;
}
```

### Commit phase

1. **Before mutation:** `getSnapshotBeforeUpdate`
2. **Mutation:** DOM inserts/updates/deletes
3. **Layout:** `useLayoutEffect`, `componentDidMount`/`DidUpdate`, ref callbacks
4. **Passive:** `useEffect` (after paint)

### Before you knew the split

People put `document.getElementById` or `window.addEventListener` directly in the component body. That ran during render — including during interrupted or double renders.

### With the split

```jsx
function ChatScroll({ messages }) {
  const endRef = useRef(null);

  useLayoutEffect(() => {
    endRef.current?.scrollIntoView();
  }, [messages]);

  return (
    <div>
      {messages.map((m) => (
        <p key={m.id}>{m.text}</p>
      ))}
      <div ref={endRef} />
    </div>
  );
}
```

Measurement and scroll belong in **layout** (before the browser paints) so the user does not see a flash at the wrong scroll position. Network fetching belongs in **`useEffect`** (after paint) or in a router/RSC loader.

### Real-world examples

**1. Checkout: focus the OTP field**

Problem: after the SMS step mounts, focus the first input. `useLayoutEffect` + ref, not render-body `focus()`.

**2. Analytics dashboard: chart library**

Problem: `new Chart(canvas)` needs a real DOM node. Create it in `useEffect`, destroy on cleanup. Render only returns `<canvas ref={ref} />`.

**3. Notification toasts: measure height for stack**

Problem: stacking toasts needs `getBoundingClientRect`. That is commit-time layout work, not render-time.

### When should I use render vs commit knowledge?

Any time you touch the DOM, a third-party widget, or “I need the width of this node.”

### When should I NOT use it?

Do not use `useLayoutEffect` for data fetching — it blocks paint. Do not use `useEffect` for “hide flicker of wrong layout” if the flicker is a layout issue.

### Common mistakes

- Updating state in render without a condition (infinite loop)
- Reading `ref.current` during render to decide JSX (ref is not set yet)
- Assuming `useEffect` ran before the user saw the screen (it did not)

### Performance considerations

Long `useLayoutEffect` delays paint (like a sync layout). Long `useEffect` does not block first paint but can delay interactivity.

### Related APIs

`useEffect`, `useLayoutEffect`, `useInsertionEffect` (18, for CSS-in-JS libraries)

### Interview notes

- Render = calculate next tree. Commit = apply it.
- Effects are commit-phase (passive after paint).
- Strict Mode double-invoking render/effects is a **dev-only** check that your render is pure and your effects clean up.

**Tip:** If a bug only happens in development, ask whether it is Strict Mode exposing an impure render.

**Try it:** `console.log` in the component body vs in `useEffect`. Navigate away and back. Note cleanup.

---

## Scheduling

### Lesson 4. Scheduling decides which update wins the CPU [React 18]

**Takeaway:** Introduced in: internally with Fiber (16); **public** with concurrent rendering in **React 18**. Scheduling assigns priority (lanes) so a click is not stuck behind a huge list filter.

**Explain:**
Not every `setState` is equal. Typing in a search box is **urgent**. Filtering 50k rows is **important but delayable**.

```text
urgent (click, input, discrete events)
    |
    +-- React wants this on screen immediately
    |
transition / deferred
    |
    +-- React may show the old UI, then replace when the new tree is ready
```

### Why it was needed

Users blame “React is slow” when the **input lags**, even if the filter is correctly expensive. The old model: one update queue, all synchronous.

### Before React 18

```jsx
function Search({ items }) {
  const [query, setQuery] = useState("");
  const results = items.filter((item) => item.name.includes(query));
  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <ResultList rows={results} />
    </>
  );
}
```

Each keystroke filters immediately. The input waits for the list.

### With transitions (React 18)

```jsx
const [query, setQuery] = useState("");
const [isPending, startTransition] = useTransition();

<input
  value={query}
  onChange={(e) => {
    const next = e.target.value;
    setQuery(next); // urgent: keep the input live
    startTransition(() => setDeferredQuery(next)); // list can wait
  }}
/>
```

(See the full pattern on [React 18 APIs](/notes/learn/react/react-18-apis).)

### How it works

React 18+ uses **lanes** (bitmasks) on updates. The scheduler picks the highest-priority unfinished work. Concurrent render can **throw away** a half-built tree if a higher-priority update arrives.

You do not assign lanes yourself. You mark updates with `startTransition` or `useDeferredValue`.

### Real-world examples

**1. Product search (e-commerce)** — keep the query input instant; defer the grid.

**2. Sidebar nav in an admin app** — highlight the clicked item immediately; load the heavy report inside a transition.

**3. Chat: send button vs message list virtualization** — the composer should never hitch because the list is measuring rows.

### When should I use scheduling APIs?

When a state update is **not** a direct reflection of a user-controlled input (filters, tabs that mount heavy trees, typeahead result lists).

### When should I NOT?

Do not wrap the controlled input’s own `setQuery` in a transition — the keystrokes will feel delayed. Do not use transitions for really cheap updates.

### Common mistakes

- Putting both input and list on the same transitioned state
- Expecting transitions to make a slow API faster (they schedule **rendering**, not the network)

### Performance considerations

Scheduling improves **responsiveness**, not necessarily **throughput**. Total CPU can be similar; the click still lands on time.

### Related APIs

`startTransition`, `useTransition`, `useDeferredValue`, `useSyncExternalStore` (tears if the store updates at the wrong time)

### Interview notes

- Fiber enabled scheduling; React 18 exposed it.
- Urgent vs transition is the user-facing model.
- Lanes are an implementation detail.

**Tip:** “Concurrent Mode” as a separate opt-in mode is the **old** (experimental) name. In 18, you use `createRoot` and concurrent **features**.

**Try it:** Profile a keystroke in a huge list with and without `useDeferredValue` using the Performance panel — then read [19.2 Performance Tracks](/notes/learn/react/react-19-2).
