# React 19.2

React 19.2 (October 1, 2025) is a **feature** minor: `<Activity>`, `useEffectEvent`, Performance Tracks, and (for frameworks) partial prerender/resume. Official post: [React 19.2](https://react.dev/blog/2025/10/01/react-19-2).

## Profile

`cacheSignal` is **[RSC] only**. Partial prerender APIs are for **framework authors** (`react-dom/server`, `react-dom/static`). `useEffectEvent` and `<Activity>` are core `react` APIs for application developers.

---

## Why 19.2 mattered

### Lesson 1. 19.2 adds Activity, Effect Events, and prerender resume [React 19.2]

**Takeaway:** Introduced in: React 19.2. Three developer-facing stories: **hide UI without killing state** (`Activity`), **read latest props in effects without re-subscribing** (`useEffectEvent`), and **see React work in Chrome Performance** (Performance Tracks).

**Explain:**

| Feature | Package | Audience |
| --- | --- | --- |
| `<Activity>` | `react` | App / design systems |
| `useEffectEvent` | `react` | App |
| `cacheSignal` | `react` | **RSC only** |
| Performance Tracks | DevTools | Debugging |
| `resume` / `resumeAndPrerender` / … | `react-dom/server` & `static` | Frameworks |
| Batched SSR Suspense reveals | `react-dom` | SSR UX |
| Node Web Streams | `react-dom/server` | Node SSR |
| `useId` default prefix `_` | `react` | All |
| `eslint-plugin-react-hooks` v6 | eslint | DX / compiler |

**Tip:** `ViewTransition` is **not** the 19.2 headline as a stable API — it is **stable in 19.3**. 19.2 mentions it as upcoming when explaining batched Suspense reveals.

**Try it:** After this page, replace a CSS `hidden` tab panel with `<Activity>` if you need to keep form state.

---

## Activity

### Lesson 2. Activity hides children but can keep their state [React 19.2]

**Takeaway:** Introduced in: React 19.2. `<Activity mode="visible" | "hidden">` shows or hides a subtree. Hidden content is not visible, effects are torn down, but **state can be preserved** so coming back is instant.

**Explain:**

```jsx
import { Activity } from "react";

function Settings({ tab }) {
  return (
    <>
      <Activity mode={tab === "profile" ? "visible" : "hidden"}>
        <ProfileForm />
      </Activity>
      <Activity mode={tab === "billing" ? "visible" : "hidden"}>
        <BillingForm />
      </Activity>
    </>
  );
}
```

Unlike `{tab === "profile" && <ProfileForm />}`, switching away from Profile does **not** necessarily destroy `useState` inside `ProfileForm`. Unlike CSS `display: none` alone, React can **skip rendering work** and **not run effects** while hidden.

### Why it was introduced?

Tabs, sidebars, and mobile stacks either:

- Unmounted (lost draft text), or
- Stayed mounted with `hidden` (effects, subscriptions, and CPU still ran)

Activity is the third mode: **hidden to React’s scheduler**, state retained.

### Before 19.2

```jsx
{tab === "profile" ? <ProfileForm /> : null}
// or
<div hidden={tab !== "profile"}><ProfileForm /></div>
```

### Real-world examples

**1. SaaS settings tabs** — keep the profile form draft when the user peeks at billing.

**2. E-commerce filters drawer** — hide the filter panel on mobile without resetting selected facets.

**3. Chat: conversation list vs thread on a small screen** — keep scroll position in the list.

### When should I use it?

UI that is **toggled often** and is expensive to remount, where keeping state is **desired**.

### When should I NOT?

- Truly leaving a flow (logout, completed checkout) — you **want** to reset
- Giant hidden trees you will never reopen (waste memory)
- Replacing routing; this is not a router

### Common mistakes

- Using Activity instead of unmounting when you **must** re-run `useEffect` setup (you might want unmount)
- Forgetting hidden trees still cost **memory**

### Related APIs

`display: none`, tabs, 19.3 `ViewTransition` (animate Activity reveals)

### Interview notes

- 19.2.
- Preserve state, drop effects while hidden.
- Not a modal API.

**Tip:** Prefer unmount for “create new entity” screens so the next visit is blank.

**Try it:** Type in a tabbed form, switch tabs with Activity vs conditional render, compare whether the text is still there.

---

## useEffectEvent

### Lesson 3. useEffectEvent extracts non-reactive logic from Effects [React 19.2]

**Takeaway:** Introduced in: React 19.2. `useEffectEvent(fn)` returns a stable function that **always sees the latest props/state** when called, without being a dependency that re-runs the Effect.

**Explain:**
The classic bug: an Effect subscribes once, but the handler closes over **stale** `theme` / `userId`. If you put `theme` in the dependency array, you **resubscribe** on every theme change — wrong if the socket should stay open.

```jsx
function Chat({ roomId, theme }) {
  const onMessage = useEffectEvent((message) => {
    showToast(message, theme);
  });

  useEffect(() => {
    const conn = connect(roomId);
    conn.on("message", onMessage);
    return () => conn.disconnect();
  }, [roomId]);
}
```

`onMessage` is **not** listed in deps. It is not reactive. `theme` updates do not reconnect. Incoming messages still use the current theme.

### Why it was introduced?

`eslint-disable-line react-hooks/exhaustive-deps` + `useRef` “latest” pattern was the unofficial API. 19.2 makes it official.

### Before 19.2

```jsx
const themeRef = useRef(theme);
themeRef.current = theme;

useEffect(() => {
  const conn = connect(roomId);
  conn.on("message", (m) => showToast(m, themeRef.current));
  return () => conn.disconnect();
}, [roomId]);
```

### Real-world examples

**1. Chat socket** — reconnect only when `roomId` changes; log with latest `user`.

**2. Analytics `page_view`** — Effect depends on `pathname`; event handler reads latest `experimentFlags` without re-firing.

**3. IntersectionObserver infinite scroll** — observer created once per sentinel; callback reads latest `hasMore` / `page`.

### When should I use it?

Logic that **happens inside an Effect’s subscription** but should **not resubscribe** when that data changes.

### When should I NOT?

- Values that **should** re-run the Effect (put them in the dependency array)
- Event handlers for `onClick` (plain functions / `useCallback` as usual — this is not a click helper)
- As a replacement for `useCallback` everywhere

### Common mistakes

- Calling `useEffectEvent` functions during **render** (they are for events/effects)
- Putting the Effect Event into the dependency array (defeats the point)

### Related APIs

`useEffect`, `useRef` latest pattern, `useCallback`

### Interview notes

- 19.2.
- Latest props without re-running the effect.
- Official “effect event” from the docs on separating events from effects.

**Tip:** If changing `theme` *should* reconnect, `theme` belongs in the Effect deps, not in an Effect Event.

**Try it:** A socket demo: change theme, confirm one connection; receive a message, confirm toast uses new theme.

---

## cacheSignal (RSC)

### Lesson 4. cacheSignal tells you when a cache() lifetime ends [React 19.2] [RSC]

**Takeaway:** Introduced in: React 19.2. `cacheSignal()` is **only for React Server Components**. It relates to `cache()` from `react` — a per-request memo for server functions.

**Explain:**
`cache(fn)` dedupes `fn` for the rest of a server request. `cacheSignal()` gives an `AbortSignal` (or equivalent lifetime) so you can **abort fetches** when that cache lifetime is over (navigation, cancel).

You **cannot** use this in a Vite CSR app. There is no `cache()` request scope.

### Real-world examples (RSC / Next.js)

**1. Server Component product fetch** — abort if the request is cancelled.

**2. Deduped `getUser()`** across layout + page in one request.

**3. Downstream HTTP** with `fetch(url, { signal: cacheSignal() })` **if** your runtime documents that pattern.

### When should I NOT?

Client Components. SPAs. Pretending `cache()` is `useMemo`.

**Tip:** If you do not write Server Components, skip this API.

**Try it:** Only in an App Router server file. Do not import it into `'use client'`.

---

## Performance Tracks, prerender, and other 19.2

### Lesson 5. Performance Tracks and framework SSR APIs [React 19.2]

**Takeaway:** Introduced in: React 19.2. **Performance Tracks** add custom tracks to the Chrome Performance panel (priorities, components, effects). **Partial prerender** `resume*` APIs let a framework prerender a shell and resume later.

**Explain:**

### Performance Tracks

Open Performance in Chrome, record an interaction. React 19.2 can show **scheduler / component** tracks so you see a transition vs an urgent update without guessing. This is **DX**, not a hook.

### Partial prerender (frameworks)

```text
prerender(app) → HTML shell + postponed state
later: resume(postponed, ...) → stream the rest
```

Next.js Partial Prerendering **[framework]** is the product name; React’s `resume` / `resumeAndPrerender` / Node variants are the primitives. App developers use the framework’s config, not these functions directly.

### Batched SSR Suspense reveals

SSR now **batches** revealing multiple Suspense holes more like the client, which matters for animation (and 19.3 View Transitions). You may see fewer one-by-one pops on first paint.

### Node Web Streams

`prerender` / `renderToReadableStream` style APIs on Node without only Pipeable streams. Framework authors / custom servers.

### useId prefix

Default IDs use `_` instead of `:` — another reason not to hard-code generated ids in tests.

### eslint-plugin-react-hooks v6

Supports the latest hook rules (including Effect Events / compiler-related). Upgrade ESLint with React 19.2.

### Real-world examples

**1. Debugging a janky filter** — Performance Tracks show the transition lane.

**2. Next.js PPR commerce homepage** — static shell, dynamic cart hole resumed on request **[framework]**.

**3. Custom Node SSR** — Web Streams on Node 22 for a streaming response.

**Tip:** Do not put `resumeAndPrerender` in an application component file.

**Try it:** Record a `useTransition` search in Performance with React 19.2 and look for React’s tracks.
