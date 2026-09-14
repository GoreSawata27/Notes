# Concurrent Rendering

React 18’s architectural release: rendering can be interruptible, updates can be prioritized, and the public switch is `createRoot`.

## Profile

**Why React 18 mattered:** Fiber could already pause in theory. 18 made **concurrent rendering** a product: Transitions, automatic batching, streaming SSR, and a new root API. Deep hook APIs are in [React 18 APIs](/notes/learn/react/react-18-apis). SSR is in [Suspense & Streaming SSR](/notes/learn/react/suspense-ssr).

---

## Concurrent rendering

### Lesson 1. Concurrent rendering can be interrupted [React 18]

**Takeaway:** Introduced in: React 18.0. Concurrent rendering means React may **start** rendering an update, **pause** to handle a more urgent event, **throw away** unfinished work, and **render again** — without showing a torn UI.

**Explain:**
This is not multithreading. React still runs on the main thread. It **time-slices** work using the browser’s idle/yield points.

### What is it?

```text
legacy (ReactDOM.render):
  start render ────────────────────────── finish  → commit
  (clicks wait)

concurrent (createRoot):
  render… yield… render…  [click!]  restart urgent work → commit
                             └── unfinished tree discarded
```

Users see **consistent** trees. React does not commit a half-diffed product grid.

### Why was it introduced?

Large screens (filters, maps, markdown preview) made the UI feel frozen. The team needed a way to say “this update is not as urgent as typing.”

### Before React 18

Every `setState` in the same event flushed together (partial batching). Updates in `setTimeout` / promises flushed **synchronously one by one**. There was no supported “render this in the background.” Experimental Concurrent Mode existed in 16.x canaries — **not** for production.

### With React 18

`createRoot` enables concurrent features. `startTransition` marks non-urgent updates. Suspense can **hide** a part of the tree that is not ready without aborting the rest of the commit.

### How it works (practical)

1. You call `setState` / `startTransition`.
2. React assigns a **lane**.
3. The work-in-progress tree is built. If the scheduler yields and a higher-priority update exists, React may abandon that tree.
4. When a tree is complete, **commit** runs synchronously (DOM, layout effects).

Interruptible = **render phase**. Commit is still all-or-nothing for that tree.

### Real-world examples

**1. E-commerce faceted search** — typing in “red shoes” must not wait 80ms of grid render. Transition the grid.

**2. Admin: switch a heavy report tab** — show the previous tab until the new one is ready (`isPending`), instead of a white flash.

**3. SaaS docs: live Markdown preview** — keep the textarea snappy; defer preview rendering with `useDeferredValue`.

### When should I use concurrent features?

Heavy CPU renders that compete with input. Not for every `setState`.

### When should I NOT?

Tiny forms. Also: **do not** stay on `ReactDOM.render` and expect Transitions to work as designed.

### Common mistakes

- Calling 18 APIs under `ReactDOM.render` (legacy root)
- Equating concurrent with “faster” — it is **more responsive**, sometimes **more total CPU**
- Mutating during render (unsafe; concurrent will punish you)

### Interview notes

- Concurrent = interruptible render, not Web Workers.
- Opt in with `createRoot`.
- Experimental “Concurrent Mode” as a `<ConcurrentMode>` wrapper is **obsolete**.

**Tip:** Purity of render is no longer optional. Strict Mode double-rendering exists to catch impurities.

**Try it:** Intentionally log a side effect in render. In Strict Mode you will see it twice in development.

---

## createRoot and hydrateRoot

### Lesson 2. createRoot replaced ReactDOM.render [React 18]

**Takeaway:** Introduced in: React 18.0. `createRoot(domNode).render(<App />)` creates a **root** that can use concurrent features. `hydrateRoot` is the SSR counterpart. `ReactDOM.render` is the **legacy** root.

**Explain:**
The root is the object that owns scheduling for a React tree.

### Before React 18

```jsx
import ReactDOM from "react-dom";

ReactDOM.render(<App />, document.getElementById("root"));
```

Hydration:

```jsx
ReactDOM.hydrate(<App />, document.getElementById("root"));
```

### React 18

```jsx
import { createRoot } from "react-dom/client";

const root = createRoot(document.getElementById("root"));
root.render(<App />);

// later, for tests or teardown:
root.unmount();
```

SSR:

```jsx
import { hydrateRoot } from "react-dom/client";

hydrateRoot(document.getElementById("root"), <App />);
```

### What changed

| | Legacy `render` | `createRoot` |
| --- | --- | --- |
| Concurrent features | No | Yes |
| Automatic batching | Events only | All updates |
| Strict Mode extra checks | Limited | Double invoke in dev |
| Hydration mismatches | Often silent-ish | Noisier, recoverable in 18+ |

### Why it changed

The team could not turn on interruptible rendering for every existing app — it would expose impure renders. A **new root API** is an explicit opt-in.

### Migration required?

- **Strongly recommended** for new features (`useTransition`, streaming hydration).
- Legacy `ReactDOM.render` still ran in 18 with a **warning** (deprecated). **Removed in React 19.** See [Migrations](/notes/learn/react/migrations).

If you keep the old API on React 18, you get React 17-like behavior (no concurrent features, less batching).

### Real-world examples

**1. Vite SPA** — `main.jsx` uses `createRoot` (scaffolds already do).

**2. Next.js App Router** — the framework owns the root; you do not call `createRoot` yourself. Still React 18+ concurrent.

**3. Microfrontend** — each widget may `createRoot` on its own node. Multiple roots do not share Transitions.

### When should I use createRoot?

Always for client-only 18+ apps.

### When should I NOT?

Inside a framework that already hydrates for you. Do not `createRoot` on a node Next.js hydrates.

### Common mistakes

- `createRoot(node).render()` **every** HMR update without reusing the root (use the same `root` instance)
- Hydrating with `createRoot` instead of `hydrateRoot` (wipes server HTML)

### Interview notes

- `createRoot` = concurrent opt-in.
- `hydrateRoot` = attach to server HTML.
- React 19: legacy `render` is gone.

**Tip:** `root.render` can be called again to replace the tree (tests, some kiosks). Prefer state for app updates.

**Try it:** Log whether your app imports `react-dom/client`. If it imports `react-dom`’s `render`, you are on the legacy path.

---

## Automatic batching

### Lesson 3. React 18 batches all setState calls, not just those in events [React 18]

**Takeaway:** Introduced in: React 18 (on `createRoot`). Automatic batching means multiple `setState`s in the same tick flush **once**, including inside promises, timeouts, and native handlers.

**Explain:**
Batching is “wait until I finish this event/task, then render once.”

### Before React 18

```jsx
function handleFetch() {
  fetch("/api/cart")
    .then((r) => r.json())
    .then((data) => {
      setItems(data.items); // render 1
      setTotal(data.total); // render 2
    });
}
```

In a **click** handler, two `setState`s already batched. In `.then`, they did not.

### With React 18 createRoot

```jsx
.then((data) => {
  setItems(data.items);
  setTotal(data.total);
}); // one render
```

### How to opt out

Rare: you need the DOM to update between two states (measure, then animate).

```jsx
import { flushSync } from "react-dom";

flushSync(() => setOpen(true));
const h = panelRef.current.offsetHeight;
setHeight(h);
```

`flushSync` forces a commit. Overuse = jank.

### Real-world examples

**1. Login** — `setUser` + `setStatus('idle')` after `await login()` should be one paint.

**2. Chat: receive message** — `setMessages` + `setUnread` in a WebSocket handler: one render.

**3. File upload** — `setProgress` + `setEta` from an XHR callback: batched.

### When should I use flushSync?

CSS/layout that must see the new DOM in the same function. Almost never in application business logic.

### When should I NOT rely on extra renders?

Do not “toggle loading then data” as two conceptual paints unless you `flushSync` or split with `await` + a microtask you understand. Prefer one state object / `useReducer`.

### Common mistakes

- Assuming batching works under **legacy** `ReactDOM.render` the 18 way
- Wrapping everything in `flushSync` “to be safe”

### Performance considerations

Batching **reduces** renders. It is free correctness for async code.

### Related APIs

`unstable_batchedUpdates` (legacy, mostly obsolete), `flushSync`

### Interview notes

- 18 batches everywhere (createRoot).
- 17 batched mostly in React event handlers.
- `flushSync` is the escape hatch.

**Tip:** If you still see two renders, you have two **separate** tasks (`await` between them).

**Try it:** Count renders with a `useEffect` log around two `setState`s in a `setTimeout`. Compare mental model with 17 vs 18.

---

## Urgent vs transition updates

### Lesson 4. Transitions mark updates as interruptible and non-urgent [React 18]

**Takeaway:** Introduced in: React 18. **Urgent** updates (typing, clicking, dragging) should commit ASAP. **Transition** updates may wait, may be interrupted, and may keep showing the old UI until ready.

**Explain:**
This is the user-facing scheduling model. APIs: `startTransition`, `useTransition` (next chapter).

```text
urgent:     setQuery(e.target.value)      → input stays in sync
transition: setListQuery(e.target.value)  → list may lag, isPending true
```

### Why it was needed

One `setState` cannot be both “instant input” and “expensive list” if they share the same state.

### Before

You debounced (delay correctness) or janked (delay input). Debounce **drops** intermediate values. Transitions **render** them when possible, without blocking input.

### After

Split state: urgent field + transitioned derived view.

### Real-world examples

**1. Product search** — input urgent; grid transition.

**2. Tab control** — highlight tab urgent; mount `HeavyChart` in a transition.

**3. Pagination** — page number in the URL urgent; table body as a transition so the old page stays until the new one is ready.

### When should I use a transition?

State that is **not** the text the user is staring at typing, and that causes **heavy render**.

### When should I NOT?

The controlled input’s own value. Toggles that are already cheap. Server fetches — Transitions do not wait for the network by themselves unless paired with Suspense.

### Interview notes

- Transition ≠ debounce.
- `isPending` is for pending **renders**, not pending **HTTP**, unless you integrate Suspense.

**Tip:** If `isPending` never flips, the update was cheap or you marked the wrong state.

**Try it:** After reading this, implement the split-state search in [React 18 APIs](/notes/learn/react/react-18-apis).

---

## Strict Mode in React 18

### Lesson 5. Strict Mode double-invokes render and effects in development [React 18]

**Takeaway:** Introduced in: extra **behavior** in React 18 (the component existed since 16.3). In development, React 18 Strict Mode simulates unmounting and remounting: it **re-runs setup + cleanup + setup** for effects, and may render twice, to catch missing cleanups.

**Explain:**
This is **not** a production double-fetch by React itself. Production runs effects once.

### What you will see

```jsx
useEffect(() => {
  console.log("subscribe");
  return () => console.log("unsubscribe");
}, []);
```

Development Strict Mode (18):

```text
subscribe
unsubscribe
subscribe
```

If you fetch inside the effect without abort/ignore flags, you will see **two network calls** in development.

### Why it was introduced

Concurrent rendering will **start, stop, and retry** effects more often. Missing cleanup is a future production bug. Strict Mode makes it loud now.

### Before React 18 Strict Mode

Effects ran once on mount in dev (aside from Fast Refresh). People wrote `useEffect(() => { fetch(); }, [])` with no abort and thought they were safe.

### After

You must:

```jsx
useEffect(() => {
  const ac = new AbortController();
  fetch(url, { signal: ac.signal }).then(/* setState if !aborted */);
  return () => ac.abort();
}, [url]);
```

Or use a library (React Query) that handles this.

### Real-world examples

**1. Chat WebSocket** — without cleanup you open two sockets in dev and duplicate messages.

**2. Maps `new mapboxgl.Map`** — without cleanup you leak WebGL contexts.

**3. Analytics `page_view`** — you might log twice in dev; do not disable Strict Mode; gate analytics on a ref or accept dev double-fire.

### When should I keep Strict Mode on?

Always for new 18+ apps.

### When should I NOT “fix” it by removing Strict Mode?

That hides the bug. Fix cleanup. (React 18.0 had a brief extra strictness that was later adjusted; 18.2+ is the behavior described here.)

### Related APIs

React 19 still uses Strict Mode. Owner Stack in 19.1 helps debug *which* component owns a node.

### Interview notes

- Dev-only remount check in 18.
- Production is once.
- Double fetch in Strict Mode is usually **your** missing abort.

**Tip:** `AbortController` is the default fetch cleanup, not a ref `let cancelled`.

**Try it:** Break a WebSocket effect (no close in cleanup), watch two connections in the Network panel in development.
