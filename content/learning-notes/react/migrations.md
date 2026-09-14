# Migration Guides

What actually changes when you jump majors. **Optional vs strongly recommended** is called out per step. Pair with [Deprecated APIs](/notes/learn/react/deprecated).

## Profile

Codemods exist (`npx types-react-codemod`, React 19 upgrade guide). This page is the **why** and the **checklist**, not a substitute for the official [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide).

---

## 15 → 16

### Lesson 1. React 15 to 16: new engine, mostly compatible [React 16]

**Takeaway:** Introduced in: React 16.0. This upgrade is **strongly recommended** if you are somehow still on 15. The reconciler changes; most components keep working. Errors no longer white-screen the whole app if you add boundaries.

**Explain:**

### What changed

- Fiber
- Error Boundaries, Portals, fragments
- `React.createClass` already gone (use `class`)
- Unknown DOM attributes passed through
- Rendering `null`, arrays, strings from components more freely

### What breaks

- Anything that **reached into private React internals**
- Addons that assumed the stack reconciler
- Some `ReactDOM.render` callbacks timing
- Tests using removed test utils

### Before / after

```jsx
// 15: extra wrapper everywhere
return <div>{a}{b}</div>;

// 16.2
return <>{a}{b}</>;
```

### Checklist

- [ ] Upgrade `react` and `react-dom` together (always)
- [ ] Upgrade `react-addons-*` off deprecated addons
- [ ] Add an Error Boundary at the route shell
- [ ] Run the app; look for console warnings
- [ ] Replace `React.createClass` if any remain

### Common mistakes

Upgrading `react` without `react-dom` (invalid hook / dispatcher errors).

### Optional vs required

**Required** to receive any later feature. 15 is unmaintained.

**Tip:** 16.0 does **not** include Hooks. Plan 16.8 as a second step.

**Try it:** If you maintain a museum 15 app, jump to 16.14 (JSX transform backport) not 16.0.

---

## 16 → 17

### Lesson 2. React 16 to 17: low-drama infrastructure [React 17]

**Takeaway:** Introduced in: React 17. **Strongly recommended**, usually **safe**. No concurrent features. Test click-outside and nested Reacts.

**Explain:**

### What changed

- Event delegation on the **root**
- New JSX transform (or keep classic)
- Event pooling gone (`e.persist` unnecessary)
- Effect cleanup ordering

### What breaks

- Homemade click-outside that assumed document-level React 16 ordering
- Microfrontends that depended on two Reacts fighting on `document` (they may **start working**)
- Classic JSX + deleted `import React` too early

### Before / after JSX

```json
// tsconfig
{ "compilerOptions": { "jsx": "react-jsx" } }
```

### Checklist

- [ ] `react` + `react-dom` 17
- [ ] Turn on automatic JSX runtime when ready
- [ ] Search `e.persist` and delete
- [ ] QA dropdowns, modals, nested apps
- [ ] ESLint: disable `react/react-in-jsx-scope` if using the new transform

### Optional vs required

Upgrade is **strongly recommended**. New JSX transform is **optional** but cheap (also works on 16.14).

**Tip:** You can stay on `ReactDOM.render`. Concurrent APIs wait until 18.

**Try it:** One PR for 17.0 only — do not mix `createRoot` into this PR.

---

## 17 → 18

### Lesson 3. React 17 to 18: new root, batching, Strict Mode [React 18]

**Takeaway:** Introduced in: React 18. **Strongly recommended.** The behavioral jumps: `createRoot`, automatic batching, Strict Mode double-invoking effects, hydration warnings.

**Explain:**

### What changed

- `createRoot` / `hydrateRoot`
- Automatic batching in promises/timeouts
- Concurrent features available
- Strict Mode remount check in development
- Streaming SSR APIs

### What breaks

- Impure render (will surface)
- Effects without cleanup (double fetch in **dev**)
- Libraries using `ReactDOM.render` internally
- Code that **depended** on two paints in a `.then` (batching now one paint)
- TypeScript types (`@types/react` 18)

### Before / after bootstrap

```jsx
// 17
ReactDOM.render(
  <StrictMode>
    <App />
  </StrictMode>,
  document.getElementById("root"),
);

// 18
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

### Checklist

- [ ] Upgrade types
- [ ] Replace `render`/`hydrate` with `createRoot`/`hydrateRoot` (**strongly recommended**; required for 19)
- [ ] Fix Strict Mode double-effect (abort fetches, close sockets)
- [ ] Search `UNSAFE_`, `findDOMNode`, string refs (warnings)
- [ ] QA forms that set two states after `await`
- [ ] If SSR: switch to streaming when the framework supports it

### Optional vs required

- `createRoot`: **strongly recommended** in 18; **required** to get concurrent APIs; **required** in 19
- `useTransition` in app code: **optional** until you have a janky view
- Staying on `ReactDOM.render` in 18: **allowed with warning**, not a good idea

### Common mistakes

- “I’ll skip createRoot until we need Transitions” then upgrading to 19 in a panic
- Disabling Strict Mode to hide double fetch

**Tip:** Split PRs: (1) 18 + createRoot + types (2) adopt `useId` / transitions where needed.

**Try it:** After `createRoot`, log render counts around an async submit — they should drop.

---

## 18 → 19

### Lesson 4. React 18 to 19: removals plus Actions [React 19]

**Takeaway:** Introduced in: React 19. **Strongly recommended** if you want Actions/`use()`. **Required removals** make this a real breaking major. Follow the official upgrade guide.

**Explain:**

### What changed (features)

- Actions, `useActionState`, `useFormStatus`, `useOptimistic`, `use()`
- Ref as prop, Context as `<Context>`
- Document metadata / resources
- Better hydration errors

### What breaks (removals)

- `ReactDOM.render` / `hydrate`
- `findDOMNode`
- String refs
- Legacy context
- Old lifecycles (`componentWillMount` without having migrated)
- Function `defaultProps`
- Some `react-test-renderer` / `act` import paths
- Children as a prop in some secret ways; `element.props.ref` access patterns — see upgrade guide
- TypeScript: `JSX` namespace moves; refs on functions

### Before / after defaultProps

```jsx
function Icon({ size = 16 }) {
  return <svg width={size} height={size} />;
}
```

### Checklist

- [ ] Be on **18 createRoot** first (do not 17 → 19)
- [ ] Run official codemods
- [ ] Delete `ReactDOM.render`
- [ ] Replace function `defaultProps`
- [ ] Grep `findDOMNode`, `contextTypes`, `componentWillMount`
- [ ] Upgrade `react-dom` peer packages (router, query, styled-components)
- [ ] Fix new TypeScript errors (`Ref`, `ReactNode`)
- [ ] QA hydration messages (they are stricter / clearer)
- [ ] Optionally adopt Actions on one form as a pilot

### Optional vs required

| Item | 18→19 |
| --- | --- |
| createRoot | **Required** (legacy root gone) |
| Rewrite all forms to Actions | **Optional** |
| `use()` everywhere | **Optional** |
| Remove `forwardRef` | **Optional** |
| Function defaultProps | **Required** if you had them |

### Common mistakes

- Upgrading `react` 19 with a library that still calls `ReactDOM.render`
- Using `useFormState` (old name) — it is `useActionState`
- Expecting RSC in a Vite SPA after the 19 bump

### 19.0 → 19.1 → 19.2 → 19.3

These are **incremental minors**:

- 19.1: Owner Stack, `useId` format — **recommended**, watch E2E selectors
- 19.2: Activity, `useEffectEvent` — **recommended**; adopt APIs as needed
- 19.3: ViewTransition, Fragment refs — **recommended** if you animate; not mandatory to use the APIs

**Tip:** Never skip 18. Go 17 → 18 (createRoot) → 19.

**Try it:** A dry-run `npm i react@19 react-dom@19` on a branch and fix compile errors before runtime QA.
