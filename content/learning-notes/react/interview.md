# Interview & Cheat Sheet

Quick revision for React 16–19.3. Depth lives in the other chapters. Fundamentals remain on [React learning](/notes/learn/react).

## Profile

If you can fill the tables from memory and answer the questions out loud, you are at interview level for this era.

---

## Version tables

### Lesson 1. Version → feature cheat sheet [React 16]

**Takeaway:** Introduced in: the Version column. This is the flashcard.

**Explain:**

| Feature | Version | Problem solved | Related / replacement |
| --- | --- | --- | --- |
| Fiber | 16.0 | Interruptible reconciler | Stack reconciler |
| Error Boundaries | 16.0 | Render errors unmount everything | Class `getDerivedStateFromError` (16.6) |
| Portals | 16.0 | Modals trapped in overflow | `createPortal` |
| Fragments `<>` | 16.2 | Extra DOM wrappers | `React.Fragment` + key |
| New Context / createRef / forwardRef / StrictMode | 16.3 | Legacy context, string refs | `useContext` 16.8 |
| Pointer Events | 16.4 | Mouse vs touch split | `onPointerDown` |
| Profiler | 16.5 | Measure render cost | DevTools |
| memo, lazy, Suspense (code split) | 16.6 | PureComponent + splitting | Data Suspense later |
| Hooks | 16.8 | Reuse stateful logic | Classes still exist |
| UNSAFE_ names, act() | 16.9 | Concurrent-unsafe lifecycles | Effects |
| JSX transform backport | 16.14 | `React` in scope | 17 automatic runtime |
| Root event delegation, gradual upgrade | 17.0 | Nested Reacts, JSX | No new UI API |
| createRoot, concurrent, batching | 18.0 | Jank, partial batching | `ReactDOM.render` legacy |
| useTransition, useDeferredValue, useId, useSyncExternalStore, useInsertionEffect | 18.0 | Priority, hydration ids, tearing, CSS-in-JS | — |
| Streaming SSR, hydrateRoot | 18.0 | Slow TTFB | `renderToString` |
| Actions, useActionState, useFormStatus, useOptimistic, use() | 19.0 | Async UI boilerplate | Manual pending state |
| Ref as prop, Context as provider | 19.0 | forwardRef / .Provider noise | Still supported |
| Document metadata / preload | 19.0 | Helmet / useEffect title | Next metadata **[framework]** |
| Owner Stack, useId «r» | 19.1 | Debug / CSS-invalid ids | captureOwnerStack **dev** |
| Activity, useEffectEvent, Performance Tracks | 19.2 | Hidden state, stale effects, profiling | cacheSignal **[RSC]** |
| ViewTransition, Fragment refs, browser() | 19.3 | Animation, group DOM, client-only | Were experimental before 19.3 |

**Tip:** Hooks = **16.8**, not 16.7. Concurrent public API = **18**, not 17. ViewTransition stable = **19.3**, not 19.0.

**Try it:** Cover the Version column and recite it.

---

### Lesson 2. Hook → use case [React 16.8]

**Takeaway:** Introduced in: each hook’s version. Pick the hook from the job, not from habit.

**Explain:**

| Hook | Use when | Do not use when |
| --- | --- | --- |
| useState | Local, simple state | Complex interdependent transitions → reducer |
| useReducer | Many next-states, or pass dispatch down | One boolean |
| useEffect | Sync with **external** systems | Transforming data for render (`useMemo` / plain) |
| useLayoutEffect | Measure/write DOM before paint | Fetching |
| useContext | Tree-wide, rare updates | High-frequency mouse state |
| useMemo | Expensive derive, proven | Every variable “just in case” |
| useCallback | Stable fn for memoized children | Every handler |
| useRef | Mutable box / DOM | “Latest state” forever — consider 19.2 `useEffectEvent` |
| useImperativeHandle | Tiny child API on a ref | Passing data up |
| useTransition | Heavy view, keep input instant | The input’s own value |
| useDeferredValue | One value, expensive child | Cheap lists |
| useId | a11y ids + SSR | List keys |
| useSyncExternalStore | External stores | React state |
| useInsertionEffect | CSS-in-JS libraries | App code |
| useActionState | Form Action + last result | Read-only UI |
| useFormStatus | Submit button in a child | Outside `<form>` |
| useOptimistic | Predictable mutation UI | Payments / irreversible |
| use | Unwrap existing Promise / conditional context | `use(fetch())` each render |
| useEffectEvent | Latest props inside a subscription | Click handlers as a style |

**Try it:** For “chat socket + current theme,” name `useEffect` + `useEffectEvent`.

---

### Lesson 3. Feature → real-world scenario [React 18]

**Takeaway:** Introduced in: various. Interviewers ask “when would you use X.”

**Explain:**

| Scenario | Feature |
| --- | --- |
| Chart widget throws | Error Boundary |
| Modal clipped | Portal |
| `<tr>` children | Fragment (or 19.3 fragment ref) |
| 800-row grid keystroke jank | useDeferredValue / useTransition |
| SSR label mismatch | useId |
| Zustand/Redux + concurrent | useSyncExternalStore (inside the lib) |
| Save profile form | Form Action + useActionState |
| Like button | useOptimistic |
| RSC child needs user | use() on a promise or Context |
| Settings tabs keep drafts | Activity (19.2) |
| Product image morph to PDP | ViewTransition (19.3) |
| Client-only chart, no snapshot | browser() (19.3) or framework `ssr: false` |

**Try it:** Invent a fourth scenario for `Activity` that is **not** tabs.

---

## Interview questions

### Lesson 4. Questions you should be able to answer [React 16]

**Takeaway:** Introduced in: n/a — this is revision. Speak in **version + problem + API**.

**Explain:**

### Architecture

- What is reconciliation? (diff type+key, then commit)
- What is a Fiber? (unit of work, linked list, React 16)
- Render vs commit? (pure calculate vs DOM/effects)
- What does concurrent rendering mean? (interruptible **render**, 18, `createRoot`)
- Urgent vs transition?

### Version traps

- When did Hooks ship? (**16.8**)
- What did React 17 add? (**upgrade path**, JSX transform, event root)
- Is Concurrent Mode a wrapper in 18? (**No** — `createRoot` + features)
- Is Suspense for data in 16.6? (**No** — `lazy` only)
- Stable ViewTransition version? (**19.3**)

### Hooks / 18 / 19

- Why not put `useId` in `key`?
- Why `useSyncExternalStore` vs `useEffect` subscribe?
- Why `useFormStatus` in a **child** of `form`?
- `use()` rules vs `useContext`?
- Action vs `useEffect` fetch?
- RSC vs SSR vs Server Functions vs Compiler?

### Sample concise answers

**“What changed in React 18?”**  
Public concurrent rendering: `createRoot`, automatic batching, Transitions, streaming SSR, Strict Mode remount in dev.

**“What is an Action in React 19?”**  
An async function run as a transition (including form `action`), so pending/error/optimistic have a standard model. Server Functions are the same idea compiled to HTTP by a **framework**.

**“Why Fiber?”**  
So React can pause, resume, recover from errors, and later schedule work. Stack reconciler could not yield.

**Tip:** If you do not know, say **stable vs experimental vs framework** instead of guessing a version.

**Try it:** Record a 90-second answer to “Walk me through React 16 to 19.” Use [Evolution](/notes/learn/react/evolution) as the outline.

---

### Lesson 5. Old vs new one-liners [React 19]

**Takeaway:** Introduced in: Replacement column’s version.

**Explain:**

| Old | New |
| --- | --- |
| `ReactDOM.render` | `createRoot` (18) |
| `ReactDOM.hydrate` | `hydrateRoot` (18) |
| `componentWillMount` | `useEffect` / constructor |
| String refs | `useRef` |
| Legacy context | `createContext` |
| `findDOMNode` | refs / FragmentInstance 19.3 |
| Function `defaultProps` | default parameters (19) |
| `forwardRef` required | `ref` prop (19) |
| `<C.Provider>` only | `<C>` (19) |
| Manual pending + error | Actions + `useActionState` (19) |
| `themeRef.current` in effects | `useEffectEvent` (19.2) |
| Unmount tabs to reset | Keep with `Activity` **or** unmount on purpose (19.2) |
| `react-transition-group` for route morph | `ViewTransition` (19.3) |
| `useFormState` | `useActionState` |

**Try it:** Write the left column from memory, then the right.
