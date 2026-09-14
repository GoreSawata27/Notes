# Suspense & Streaming SSR

How Suspense grew from a spinner around `lazy()` into a first-class loading boundary, and how React 18 streams HTML instead of waiting for the whole tree.

## Profile

Code-splitting Suspense started in [React 16.6](/notes/learn/react/react-16). This chapter is **18+**: data-ready UI, streaming SSR, and hydration. Server Components are [Server-oriented React](/notes/learn/react/server-react) — a different (related) model.

---

## Suspense evolution

### Lesson 1. Suspense is a boundary for “not ready yet” [React 16.6]

**Takeaway:** Introduced in: React 16.6 for **`lazy()`**. React 18 treats Suspense as a **loading UI boundary** that also works with streaming SSR and (with a compatible cache/framework) data.

**Explain:**
When a child **suspends** (throws a Promise React understands), the nearest `<Suspense fallback={...}>` shows the fallback. The rest of the tree can continue.

### What is it?

```jsx
<Suspense fallback={<ProductGridSkeleton />}>
  <ProductGrid />
</Suspense>
```

`ProductGrid` might `lazy()` import, or in a React 18+ data framework **read** a promise that is not resolved.

### Why was it introduced?

Loading states were ad-hoc (`if (!data) return <Spinner />`) and **blocked the parent** from rendering siblings. Suspense **lifts** the loading UI to a boundary you choose.

### Before Suspense

```jsx
function Page() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then(setData);
  }, []);
  if (!data) return <FullPageSpinner />; // nav disappears too if this is the page root
  return <ProductGrid products={data} />;
}
```

### With a boundary

The header can render immediately. Only the grid hole shows a skeleton. On the server (18), that hole can **stream** later.

### How it works (practical)

1. Child suspends.
2. React commits the fallback at the boundary (or, on the client after first paint, may wait a beat to avoid a flash — details evolved).
3. When the promise resolves, React retries render and replaces the fallback.

This is **not** an Error Boundary. Failed promises / throws that are Errors bubble to Error Boundaries.

### Real-world examples

**1. E-commerce PDP** — images and related products suspend independently:

```jsx
<Suspense fallback={<GallerySkeleton />}>
  <Gallery id={productId} />
</Suspense>
<Suspense fallback={<RelatedSkeleton />}>
  <Related id={productId} />
</Suspense>
```

**2. Admin dashboard** — each widget is its own boundary so one slow query does not skeleton the whole home.

**3. Social feed** — `lazy()` the composer’s GIF picker; the feed stays interactive.

### When should I use Suspense?

Code splitting. Framework data that is designed to suspend. Nested holes in a layout.

### When should I NOT?

- Wrapping a random `fetch` in 16.x / a Vite SPA **without** a cache that integrates with Suspense (you will throw an uncaught Promise)
- Replacing **error** UI (use Error Boundaries)
- A single boolean `isLoading` for a tiny local toggle

### Common mistakes

- One giant Suspense at `_app` — one spinner for the whole site
- Forgetting an Error Boundary next to data Suspense
- Using `lazy` without a boundary (React warns)

### Related APIs

`lazy`, Error Boundaries, `useTransition` (avoid hiding the whole page on a refresh), React 19 `use()`

### Interview notes

- 16.6 = code split. 18 = SSR + concurrent story.
- Suspend = throw a Promise React handles.
- Fallback is committed at the boundary.

**Tip:** Boundaries are a **UX design** tool (where skeletons appear), not just a technical wrapper.

**Try it:** Nest two `lazy()` widgets with two boundaries vs one. Throttle the network.

---

## Streaming SSR

### Lesson 2. React 18 can stream HTML as Suspense resolves [React 18]

**Takeaway:** Introduced in: React 18. Instead of `renderToString` waiting for the **entire** tree, `renderToPipeableStream` / `renderToReadableStream` send a **shell** immediately and **stream** missing pieces as fallbacks resolve.

**Explain:**
Classic SSR: CPU + data for the whole page → one HTML blob → browser paints. Streaming: send the layout + fallbacks, then extra HTML + inline scripts that **pop in** the real content.

### Before React 18

```jsx
import { renderToString } from "react-dom/server";

const html = renderToString(<App />);
res.send("<!doctype html>" + html);
```

`renderToString` is **synchronous**. `lazy` and data Suspense do not stream. TTFB waits for everything.

### With React 18 streams

```jsx
import { renderToPipeableStream } from "react-dom/server";

const { pipe } = renderToPipeableStream(<App />, {
  onShellReady() {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html");
    pipe(res);
  },
  onShellError(err) {
    res.statusCode = 500;
    res.send("Error");
  },
});
```

Web Streams (browsers, some serverless): `renderToReadableStream`. Node historically used pipeable streams; **19.2** added more Web Stream helpers for Node — [React 19.2](/notes/learn/react/react-19-2).

### Why it was needed

Waiting for a slow “related products” query blocked the **buy box** HTML. Streaming lets the buy box ship in the shell.

### How it works

1. React renders until it hits a suspended boundary.
2. It emits the fallback HTML.
3. When ready, it emits a chunk that replaces the fallback (and a small script to wire it).
4. The client **hydrates** as code arrives (`hydrateRoot`), not only after the full document.

### Real-world examples

**1. Product page** — shell: nav, product title, price. Stream: reviews widget.

**2. News article** — shell: headline + body. Stream: comments.

**3. SaaS billing** — shell: plan table. Stream: usage graphs that hit a slow warehouse.

### When should I use streaming SSR?

Content sites and dashboards with **uneven** data speed. You typically get this **through a framework** (Next.js App Router), not by hand.

### When should I NOT?

- Tiny static pages (the machinery costs more than it saves)
- Environments that cannot flush bytes (some old CDNs buffering the whole response — defeat streaming)
- When you still call `renderToString` for email or tests — that API still exists for **non-streaming** cases

### Common mistakes

- Thinking streaming is a React-only one-liner in a SPA (you need a server)
- Putting all data in the shell (nothing left to stream)
- Confusing streaming SSR with RSC (RSC can **use** streaming; they are not the same)

### Related APIs

`renderToPipeableStream`, `renderToReadableStream`, `hydrateRoot`, Next.js `loading.tsx` **[framework]**

### Interview notes

- 18 streaming SSR + selective hydration.
- `renderToString` does not stream.
- Shell vs delayed boundaries.

**Tip:** “Selective hydration” means the browser can hydrate the part the user clicks first.

**Try it:** In Next.js, add a slow `await` inside a child wrapped by `Suspense` and view “Disable cache” + slow 3G. The shell appears first.

---

## Hydration

### Lesson 3. Hydration attaches event handlers to server HTML [React 18]

**Takeaway:** Introduced in: SSR era (React 16 had `ReactDOM.hydrate`); **React 18** replaced it with `hydrateRoot` and made hydration **concurrent and selective**. Hydration is “this HTML is already there; React takes over.”

**Explain:**
If you `createRoot().render` on server HTML, React **throws the HTML away** and client-renders. That is a wasted SSR. You must **hydrate**.

### Before React 18

```jsx
ReactDOM.hydrate(<App />, document.getElementById("root"));
```

Mismatches were often recovered poorly. Hydration was largely all-or-nothing.

### React 18

```jsx
import { hydrateRoot } from "react-dom/client";

hydrateRoot(document.getElementById("root"), <App />);
```

React 18 can hydrate **deeper trees as they stream in**, and can prioritize hydrating a component the user is interacting with.

### Why mismatches happen

Server rendered `Hello, Ada`. Client first paint had no `user` yet → `Hello, `. React warns. Causes: `Date.now()`, `Math.random()`, `window`, `typeof window !== 'undefined'` branches that skip server HTML, invalid HTML (`<p><div/></p>` browser-fixed).

### Real-world examples

**1. Auth-aware nav** — server rendered logged-out; client has a cookie. Use a pattern that **does not** lie: render a placeholder on both, or pass the user from the server (RSC/cookies).

**2. Markdown in a CMS** — extra whitespace in server HTML vs client parser.

**3. Browser extension** injecting nodes into `#root` before hydration — classic mismatch.

### When should I hydrate?

Always when HTML came from React SSR.

### When should I NOT?

Pure CSR SPAs (`createRoot` on an empty `#root`).

### Common mistakes

- `suppressHydrationWarning` on a large tree to hide bugs (only for tiny known diffs like timestamps)
- Using `localStorage` in the initial render

### Related APIs

React 19 improved hydration error diffs. `useId` for stable ids. `browser()` in **19.3** for client-only subtrees — [React 19.3](/notes/learn/react/react-19-3).

### Interview notes

- Hydrate ≠ render.
- 18: `hydrateRoot`, selective hydration.
- Mismatch = server text !== client first render.

**Tip:** The first client render during hydration **must** match the server HTML. Effects can then “upgrade” to client-only UI.

**Try it:** Render `{typeof window === 'undefined' ? 'server' : 'client'}` and watch the warning — then lift that into `useEffect`.
