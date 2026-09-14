# Server-oriented React

SSR, React Server Components, Server Functions, and the React Compiler — and **which of those are React vs Next.js vs a Babel plugin**.

## Profile

If you only build Vite SPAs, you still need SSR vocabulary for interviews. You do **not** get RSC by importing `react`. RSC requires a **bundler integration** (Next.js App Router, experimental Vite RSC, etc.).

---

## Map of the landscape

### Lesson 1. Four different ideas people mash together [React 19]

**Takeaway:** Introduced in: various (see table). Never say “React 19 is Server Components” without this split.

**Explain:**

| Idea | What it is | Where it lives | Version |
| --- | --- | --- | --- |
| **CSR** | Browser downloads JS, `createRoot`, empty HTML | `react-dom/client` | always |
| **SSR** | Server sends HTML, client hydrates | `react-dom/server` | 16+; **streaming in 18** |
| **RSC (Server Components)** | Some components run **only on the server**, send a payload, never ship their JS to the client | React + **bundler** | Canary for years; **frameworks ship it** with React 19 |
| **Server Functions / Actions** | Functions that run on the server, called from client/forms | `'use server'` convention + bundler | React 19 model; **implemented by frameworks** |
| **React Compiler** | Build-time auto-memo | `babel-plugin-react-compiler` | Separate from React minors |

### Why this distinction matters

You can use React 19 **Actions** with `fetch` in a SPA **without** RSC. You cannot use `cache()` / `cacheSignal` in that SPA. Next.js `loading.tsx` is **[framework]**, not a React export.

### Real-world examples

**1. Marketing site on Next.js** — SSR/SSG + maybe RSC for the CMS fetch.

**2. Admin SPA on Vite** — CSR, React 19 form Actions calling your REST API. No `'use server'`.

**3. E-commerce hybrid** — RSC for the product query; Client Component for the cart drawer.

**Tip:** `'use client'` / `'use server'` are **bundler directives**, not JavaScript. They do nothing in a file that never goes through an RSC compiler.

**Try it:** Search your repo for `'use client'`. If you only have Vite + no RSC plugin, those strings are dead comments.

---

## SSR vs RSC

### Lesson 2. SSR sends HTML; RSC sends a component payload [React 18]

**Takeaway:** Introduced in: SSR is old; **RSC** is the architecture frameworks adopted alongside React 18/19. SSR can render **Client Components** to HTML. RSC can keep **data-fetching components off the client bundle**.

**Explain:**

```text
SSR (Client Components):
  Server: renderToPipeableStream(<App />) → HTML
  Client: hydrateRoot → JS for the whole App still downloads

RSC:
  Server: run Server Components (fetch, fs, secrets)
       → RSC payload + HTML for the client leaves
  Client: JS only for 'use client' islands
```

A Server Component:

- Can `async function Page() { const data = await db.q(); return <div>{data}</div> }`
- **Cannot** use `useState`, `useEffect`, or browser APIs
- Can import a Client Component and pass **serializable** props (or a Promise for `use()`)

A Client Component (`'use client'`):

- The React you already know
- May call Server Functions
- Hydrates in the browser

### Why RSC was needed

SSR still shipped a huge JS bundle. “We SSR for SEO” did not mean “we shipped less JS.” RSC attacks **bundle size** and **data waterfalls** (fetch on the server next to the component).

### Real-world examples

**1. Product page** — Server Component loads product from DB; Client Component is the image carousel.

**2. Dashboard** — Server Component streams widgets; charts are client because they need `resize`.

**3. Blog** — MDX as Server Components; like-button is a client island.

### When should I use RSC?

When a framework offers it and most of the page is data + documents. Default in **Next.js App Router**.

### When should I NOT?

Existing CRA/Vite app with no RSC toolchain. Tiny widgets. Highly interactive canvases that would all be `'use client'` anyway.

### Interview notes

- RSC ≠ SSR (you can SSR client trees; you can RSC without thinking “classic hydrate everything”).
- Server Components cannot use Hooks that need the client.
- Directives are bundler-level.

**Tip:** Passing a function from Server to Client as a prop only works if it is a **Server Function** (serializable reference), not a closure over server memory.

**Try it:** In Next.js App Router, `console.log` in a Server Component vs a Client Component — one logs in the terminal, the other in the browser.

---

## Server Functions

### Lesson 3. Server Functions are typed RPC created by a bundler [React 19] [RSC]

**Takeaway:** Introduced in: React 19 (as the **Actions / Server Functions** model). A function marked `'use server'` compiles to a **POST endpoint** the client can call. This is **not** available in a vanilla Vite React app.

**Explain:**

```js
"use server";

export async function updateBio(formData) {
  const bio = formData.get("bio");
  await db.user.update({ bio });
}
```

Client:

```jsx
"use client";
import { updateBio } from "./actions";

<form action={updateBio}>...</form>
```

The client bundle does **not** contain your DB code. It contains a **stub** that POSTs `FormData` / arguments.

### Why it was needed

You were already writing API routes + `fetch` + syncing types. Server Functions collapse that for **mutations** colocated with UI. They are still HTTP underneath.

### Security caveats (important)

- **Every export is a public endpoint.** Check auth **inside** the function. Never trust the client.
- Validate inputs. `formData` is user-controlled.
- Do not pass untrusted closures.

This is why “Server Actions” in Next.js docs spend so much time on auth.

### Real-world examples

**1. Update profile** — `updateBio` as the form action.

**2. Delete comment** — `deleteComment(id)` called from a button `startTransition(() => deleteComment(id))`.

**3. Checkout** — prefer a dedicated, audited endpoint; still possible as a Server Function with extra care.

### When should I use them?

Framework apps, colocated mutations, forms. Combine with `useActionState`.

### When should I NOT?

Public APIs needed by a mobile app (use a real REST/GraphQL surface). File uploads at huge scale (use signed URLs). SPAs without RSC.

### Interview notes

- `'use server'` = bundler RPC, not magic in the JS runtime.
- Always authenticate on the server.
- React 19 documents the model; **Next.js implements it**.

**Tip:** Treat Server Functions like **POST handlers**, because they are.

**Try it:** In Next.js, open the Network tab on submit — you will see a POST, not a database in the browser.

---

## React Compiler

### Lesson 4. The Compiler auto-memoizes; it is not a React hook [framework]

**Takeaway:** Introduced in: as a **separate** tool (`babel-plugin-react-compiler`, often `react-compiler`). It is **not** “React 19 includes a compiler in `react-dom`.” You opt in at build time.

**Explain:**
The Compiler analyzes your components and inserts memoization so you write fewer `useMemo` / `useCallback` / `React.memo` by hand — **when your code follows the Rules of React** (purity, immutable props).

```jsx
// You write:
function Item({ product, onSelect }) {
  const label = product.name.toUpperCase();
  return <button onClick={() => onSelect(product.id)}>{label}</button>;
}

// Compiler may emit the equivalent of memoized callbacks/values
```

### Why it exists

Hooks made performance **manual**. People either memoized everything (noise) or nothing (jank). A compiler can do the mechanical part.

### What it is not

- Not a replacement for `useEffect` design
- Not RSC
- Not a reason to mutate props
- Not automatically on in every React 19 app

### Real-world examples

**1. Design system Button** — stop wrapping every `onClick` in `useCallback` if the compiler is on and verified.

**2. Large table** — still virtualize; the compiler will not invent windowing.

**3. New Next.js app** — follow the Next + compiler docs; this is **[framework]** config.

### When should I use it?

New codebases that already pass React’s purity rules. After reading the official compiler docs for your toolchain.

### When should I NOT?

- Mutative class-era code
- As an excuse to skip `key`s and virtualization
- Production without the compatibility set (eslint-plugin-react-hooks + compiler)

### Interview notes

- Separate Babel plugin.
- Auto-memo, not a new runtime hook.
- Still obey Rules of React.

**Tip:** `eslint-plugin-react-hooks` v6 (shipped with the **19.2** era tooling) includes compiler-aware rules — [React 19.2](/notes/learn/react/react-19-2).

**Try it:** If the compiler is not in your `package.json`, do not claim it in a design review.

---

## Hydration, SSR APIs, and frameworks

### Lesson 5. Who calls renderToPipeableStream? [React 18]

**Takeaway:** Introduced in: React 18 (streams); static `prerender` APIs expanded in 19 / 19.2. **You** rarely call them if you use Next.js. **Framework authors** do.

**Explain:**

| API | Role |
| --- | --- |
| `renderToPipeableStream` | Streaming HTML (Node) |
| `renderToReadableStream` | Web Streams |
| `prerender` / `resume` | Partial prerender — **19.2** |
| Next.js App Router | Calls the above for you **[framework]** |

### Real-world examples

**1. Next.js commerce** — PPR (partial prerender) uses postpone/resume under the hood **[framework]**.

**2. Custom Express SSR** — you call `renderToPipeableStream` yourself.

**3. Email templates** — `renderToStaticMarkup` / string APIs, not hydration.

**Tip:** If you are not a framework author, learn the **user-facing** model (Suspense holes, Client vs Server Components), not every `resumeAndPrerender` signature.

**Try it:** Read [Suspense & SSR](/notes/learn/react/suspense-ssr) for the developer-facing streaming story.
