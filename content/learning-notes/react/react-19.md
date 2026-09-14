# React 19

React 19 (stable: December 2024) makes **async UI** a first-class model: Actions, `use()`, optimistic updates, simpler refs/context, and document resources.

## Profile

**Why this release mattered:** React 18 taught the scheduler to prioritize renders. React 19 teaches React to **manage async work** (form submits, promises, metadata) instead of leaving it in `useEffect` + four `useState`s. Forms detail: [Forms & Actions](/notes/learn/react/forms-actions). RSC vs framework: [Server-oriented React](/notes/learn/react/server-react). Fundamentals L29–L30 stay the short intro — this chapter is the reference.

---

## Why this release mattered

### Lesson 1. React 19 is the async-UI release [React 19]

**Takeaway:** Introduced in: React 19.0. The theme is **Actions** (async functions in Transitions), **`use()`** to read promises/context, and **less boilerplate** (ref as prop, Context as `<ThemeContext>`).

**Explain:**
18 gave you `isPending` for **renders**. 19 gives you `isPending` for **async functions** you pass to Transitions and forms.

| Area | 19 addition |
| --- | --- |
| Async | Actions, `useActionState`, `useFormStatus`, `useOptimistic` |
| Reading | `use()` for Promises and Context |
| Refs | `ref` is a prop; `forwardRef` optional on new components |
| Context | `<ThemeContext value={...}>` works (Provider still valid) |
| Document | `<title>`, `<meta>`, `<link>` in the tree; stylesheets/scripts |
| Resources | `preload`, `preinit`, `prefetchDNS`, `preconnect` |
| Hydration / errors | Clearer mismatch diffs; better error recovery |
| Compiler | Separate [React Compiler](/notes/learn/react/server-react) — not a runtime API |

**Tip:** `useFormState` was the RC name. Stable 19 uses **`useActionState`**.

**Try it:** After this page, implement a login form with `useActionState` on [Forms & Actions](/notes/learn/react/forms-actions).

---

## Actions

### Lesson 2. An Action is an async function handled as a Transition [React 19]

**Takeaway:** Introduced in: React 19. Passing an `async` function to `startTransition` (or `<form action={fn}>`) makes React treat it as an **Action**: pending state, errors, and (on forms) sequential submits.

**Explain:**
In 18, `startTransition(async () => { await fetch(); setX(); })` did **not** keep `isPending` true during the `await`. In 19, it does.

### What is it?

```jsx
const [isPending, startTransition] = useTransition();

function save(name) {
  startTransition(async () => {
    const error = await updateName(name);
    if (error) throw error;
  });
}
```

`isPending` stays true until the async function finishes (and resulting renders commit).

### Why was it introduced?

Every product had the same pile: `isPending`, `error`, disable the button, ignore stale responses. Actions standardize that.

### Before React 19

```jsx
const [isPending, setIsPending] = useState(false);
const [error, setError] = useState(null);

async function onClick() {
  setIsPending(true);
  setError(null);
  try {
    await updateName(name);
  } catch (e) {
    setError(e.message);
  } finally {
    setIsPending(false);
  }
}
```

### With Actions

Pending is free. Errors can bubble to an Error Boundary or be returned from `useActionState`. Forms can use `action={fn}` without `onSubmit` + `preventDefault`.

### Real-world examples

**1. Profile “save display name” (SaaS)** — button disabled via `isPending`.

**2. Admin: archive order** — row action that PATCHes; pending on that row.

**3. Social: follow user** — click triggers an Action; pair with `useOptimistic` for instant UI.

### When should I use Actions?

User-triggered mutations (submit, delete, toggle) that hit a server.

### When should I NOT?

- Background polling
- Keyboard-controlled inputs (still urgent `setState`)
- Treating every `fetch` in `useEffect` as an Action (effects are not Actions)

### Common mistakes

- Expecting 18’s `startTransition` to track `await` (it does not)
- Using Actions without error UI

### Related APIs

`useActionState`, `useFormStatus`, `useOptimistic`, Server Functions **[RSC]** / **[framework]**

### Interview notes

- Action = async in a transition (19).
- Forms: `action` prop can be a function.
- Pending includes the await.

**Tip:** Client-only Vite apps can use Actions with `fetch`. Server Functions need a framework.

**Try it:** Compare `isPending` around `await` in 18 mental model vs 19.

---

## useActionState

### Lesson 3. useActionState wraps an Action with state, pending, and the last result [React 19]

**Takeaway:** Introduced in: React 19 (`useActionState`; RC name `useFormState`). `const [state, formAction, isPending] = useActionState(action, initialState)`.

**Explain:**
The hook’s `action` receives `(previousState, formData)` when used as a form action, or you can call `formAction` yourself.

### Syntax

```jsx
async function updateBio(prev, formData) {
  const bio = formData.get("bio");
  try {
    await api.patchBio(bio);
    return { ok: true, message: "Saved" };
  } catch (e) {
    return { ok: false, message: e.message };
  }
}

function BioForm() {
  const [state, formAction, isPending] = useActionState(updateBio, { ok: true, message: "" });
  return (
    <form action={formAction}>
      <textarea name="bio" />
      <button disabled={isPending}>{isPending ? "Saving…" : "Save"}</button>
      <p>{state.message}</p>
    </form>
  );
}
```

### Why it was needed

`useState` × 3 (data, error, pending) plus a submit handler that forgets to reset error.

### Real-world examples

**1. Login form** — state `{ error: string | null }`; pending disables submit.

**2. Checkout coupon** — last result is `{ valid, discount }`.

**3. Support ticket** — returns `{ ticketId }` on success for a “view ticket” link.

### When should I use it?

Forms and any Action that needs **the last return value** in UI.

### When should I NOT?

Read-only pages. Local-only filters (`useState` is enough).

### Common mistakes

- Mutating `prev` instead of returning new state
- Forgetting `name` on inputs (`formData.get` is empty)
- Mixing controlled `value` + uncontrolled form fields carelessly

### Related APIs

`useFormStatus` (child of the form), `useOptimistic`

### Interview notes

- Replaced the name `useFormState`.
- Works with `<form action={formAction}>`.
- Signature `(prev, formData)`.

**Tip:** Return **serializable** state if this Action is a Server Function.

**Try it:** Build a newsletter signup that shows the server’s error string from the returned state.

---

## useFormStatus

### Lesson 4. useFormStatus reads the parent form’s pending status [React 19]

**Takeaway:** Introduced in: React 19. `useFormStatus()` from `react-dom` returns `{ pending, data, method, action }` for the **nearest parent `<form>`**. It does not take arguments.

**Explain:**
Design-system buttons should not receive `isPending` through ten props. They ask the form.

```jsx
import { useFormStatus } from "react-dom";

function SubmitButton({ children }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? "Please wait…" : children}
    </button>
  );
}

function CheckoutForm() {
  return (
    <form action={placeOrder}>
      {/* fields */}
      <SubmitButton>Pay now</SubmitButton>
    </form>
  );
}
```

### Why it was introduced?

`SubmitButton` in a UI kit cannot call `useActionState` without owning the action.

### Real-world examples

**1. Checkout Pay button** — spinner from status, not from page-level state.

**2. Auth “Create account”** — disable double-submit.

**3. Admin “Bulk delete”** — pending on the nested form in a modal.

### When should I use it?

Reusable submit controls **inside** a form.

### When should I NOT?

Outside a `<form>` (it will not see pending). For pending of a non-form Action, use `useTransition` / `useActionState`’s `isPending`.

### Common mistakes

- Calling it in the **same** component that renders `<form>` (it reads **parent** form — move the button to a child)
- Importing from `react` instead of `react-dom`

### Interview notes

- `react-dom`.
- Parent form only.
- Perfect for design-system submit buttons.

**Tip:** The “same component as form” pitfall is the #1 bug.

**Try it:** Log `useFormStatus()` in the form component vs a child button.

---

## useOptimistic

### Lesson 5. useOptimistic shows a temporary value until the Action finishes [React 19]

**Takeaway:** Introduced in: React 19. `const [optimistic, addOptimistic] = useOptimistic(state, updateFn)` lets you render **as if the mutation succeeded**, then React rolls back if the Action fails.

**Explain:**
Optimistic UI used to be a pile of local flags that drifted from server state.

```jsx
function Like({ likes, onLike }) {
  const [optimisticLikes, addOptimistic] = useOptimistic(likes, (current, next) => next);

  async function like() {
    addOptimistic(likes + 1);
    await onLike(); // Action / transition
  }

  return <button onClick={like}>{optimisticLikes} likes</button>;
}
```

The reducer `(current, optimisticValue) => next` defines how to merge.

### Why it was needed

Likes, follow, checkboxes in tables, chat sends — users will not wait 300ms. Manual optimistic state often **stuck** after errors.

### Before React 19

```jsx
const [optimistic, setOptimistic] = useState(null);
const shown = optimistic ?? likes;
async function like() {
  setOptimistic(likes + 1);
  try {
    await api.like();
  } catch {
    setOptimistic(null);
  }
}
```

Race: two clicks, a failing request, stale `likes` prop — easy to get wrong.

### Real-world examples

**1. Social like/reposts** — increment immediately.

**2. Chat send** — append a gray “sending” bubble; replace when the server id returns.

**3. Admin: toggle user active** — switch UI instantly; revert on 403.

### When should I use it?

Mutations where the **happy path is obvious** and failure is rare/acceptable to undo.

### When should I NOT?

- Payments / irreversible deletes (wait for the server)
- Values you cannot predict (server-assigned prices)

### Common mistakes

- Calling `addOptimistic` outside an Action/transition (React expects it tied to an async Action)
- A reducer that ignores `current` and always returns a constant

### Related APIs

Actions, `useActionState`

### Interview notes

- Temporary UI during an Action.
- Auto-revert on failure when used as intended.
- 19.

**Tip:** Keep the reducer **pure** and small.

**Try it:** Optimistic follow button; force the API to fail; confirm the UI snaps back.

---

## use()

### Lesson 6. use() reads a Promise or Context [React 19]

**Takeaway:** Introduced in: React 19. `use(promise)` suspends until the promise resolves. `use(Context)` reads context and **may be called conditionally** (unlike `useContext`).

**Explain:**
`use` is a Hook-like API with **looser rules**: it can be in conditionals and loops, but still only in render (not in event handlers).

```jsx
function Comments({ commentsPromise }) {
  const comments = use(commentsPromise);
  return comments.map((c) => <p key={c.id}>{c.body}</p>);
}

function Page({ commentsPromise }) {
  return (
    <Suspense fallback={<p>Loading comments…</p>}>
      <Comments commentsPromise={commentsPromise} />
    </Suspense>
  );
}
```

Create the promise in a **parent** or cache — not `use(fetch())` inside the child on every render (new promise every time → infinite suspend).

### Context

```jsx
function Heading({ children }) {
  const theme = use(ThemeContext);
  return <h1 className={theme}>{children}</h1>;
}
```

Conditional:

```jsx
if (shouldRead) {
  const theme = use(ThemeContext);
}
```

### Why it was introduced?

Data components had to be hooks (`useQuery`) even when they only needed to unwrap a promise the parent already started. Server Components pass promises to clients; `use` unwraps them.

### Real-world examples

**1. Product reviews streamed from the server** — parent starts fetch, child `use`s.

**2. Optional theme** — read context only if the heading is in a themed region.

**3. I18n dictionaries** — `use(dictPromise)` inside `Suspense`.

### When should I use it?

Unwrapping a promise you **already have**. Conditional context.

### When should I NOT?

- `use(fetch(url))` in the same component that creates the fetch every render
- Event handlers (`use` is render-only)
- Replacing `useEffect` load-on-mount in a CSR app without a cache (you still need a stable promise)

### Common mistakes

- New Promise identity every render
- Missing `Suspense` / Error Boundary
- Confusing `use` with the React Compiler

### Related APIs

Suspense, RSC, `React.cache` **[RSC]**

### Interview notes

- 19.
- Promises + context.
- Can be conditional; still render-only.

**Tip:** Stabilize promises with props from a parent, `cache()`, or a library.

**Try it:** Pass `commentsPromise` from a parent `useState` initializer (`useState(() => fetchComments())`) so the promise is created once.

---

## Ref as a prop and Context as provider

### Lesson 7. ref is a normal prop; Context can render as the provider [React 19]

**Takeaway:** Introduced in: React 19. Function components receive `ref` like any prop (no `forwardRef` required for **new** components). `<ThemeContext value={theme}>` works instead of `<ThemeContext.Provider>`.

**Explain:**

### Ref as a prop

```jsx
function Input({ ref, ...props }) {
  return <input ref={ref} {...props} />;
}

function Form() {
  const ref = useRef(null);
  return <Input ref={ref} />;
}
```

`forwardRef` still works for old libraries. You do not need to rewrite the world.

### Context without `.Provider`

```jsx
<ThemeContext value="dark">
  <Page />
</ThemeContext>
```

`ThemeContext.Provider` remains valid.

### Why it was needed

`forwardRef` was ceremony. `.Provider` was noise. 19 also helps RSC: [19.3](/notes/learn/react/react-19-3) lets Server Components render a client Context without a wrapper component.

### Real-world examples

**1. Design system `TextField`** — new components skip `forwardRef`.

**2. App providers** — `<UserContext value={user}>` in the shell.

**3. Tests** — less wrapping.

### When should I still use forwardRef?

Published packages that support React 18 consumers. Dual-write if you must.

### Common mistakes

- Destructure `ref` and forget to pass it to the DOM
- Assuming 18 apps can use ref-as-prop (they cannot)

### Interview notes

- 19: ref prop, Context as provider.
- `forwardRef` not removed.

**Tip:** TypeScript: `ref` on function components is in `@types/react` 19.

**Try it:** Convert a `forwardRef` input to a `ref` prop and focus it from a parent.

---

## Document metadata, stylesheets, resource hints

### Lesson 8. React 19 can hoist title, meta, and styles into the document [React 19]

**Takeaway:** Introduced in: React 19. Rendering `<title>`, `<meta>`, `<link rel="stylesheet">` (and similar) **inside components** lets React move them to `document.head`. Resource APIs (`preload`, `preinit`, …) live in `react-dom`.

**Explain:**
In a SPA you used `useEffect(() => { document.title = ... })` or `react-helmet`. In SSR you needed a framework head manager. 19 makes **the component tree** the source of truth.

```jsx
function ProductPage({ product }) {
  return (
    <>
      <title>{product.name} · Shop</title>
      <meta name="description" content={product.blurb} />
      <h1>{product.name}</h1>
    </>
  );
}
```

Stylesheets with precedence:

```jsx
<link rel="stylesheet" href="/product.css" precedence="default" />
```

React dedupes and orders them. Scripts and styles can be **Suspense-aware** (wait for CSS before revealing).

### Resource APIs (`react-dom`)

```jsx
import { preload, preinit, prefetchDNS, preconnect } from "react-dom";

preload("/fonts/inter.woff2", { as: "font", type: "font/woff2", crossOrigin: "" });
preinit("/analytics.js", { as: "script" });
prefetchDNS("https://cdn.example.com");
preconnect("https://api.example.com");
```

These are **hints** to the browser. Frameworks often call them for you.

### Why it was needed

Helmet + Next `<Head>` + `useEffect` title bugs (wrong title on back navigation).

### Real-world examples

**1. E-commerce PDP** — unique title/description per product.

**2. Nested routes in a dashboard** — inner page title wins while mounted.

**3. Preload LCP image** — `preload(heroUrl, { as: 'image' })` in the product hero component.

### When should I use it?

Titles, SEO tags, route-level CSS. In **Next.js App Router**, `export const metadata` / `generateMetadata` is still the idiomatic **framework** API — do not fight it. In a Vite SPA, React 19 document tags are very useful.

### When should I NOT?

Duplicating the same tags in 12 components (last/deepest rules can surprise you). Random `preinit` of huge scripts on every page.

### Common mistakes

- Assuming this replaces Next.js Metadata API
- Client-only `useEffect` title **and** `<title>` together fighting

### Related APIs

Next.js Metadata **[framework]**, 18 `renderToPipeableStream`

### Interview notes

- 19 hoists document tags from the tree.
- Resource hints are `react-dom`.
- Frameworks may still own SEO.

**Tip:** Treat `<title>` like any UI: it should describe the **currently mounted** page.

**Try it:** In a SPA, put `<title>` in two nested routes and navigate; confirm the title follows the mounted page.
