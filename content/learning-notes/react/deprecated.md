# Deprecated APIs

Precise language: **deprecated** (still exists, warning), **removed** (gone from that major), **legacy** (works, do not use in new code), **still supported** (ok, but there is a better default).

## Profile

Always pair a row with [Migrations](/notes/learn/react/migrations). Dates/minors below follow official React blogs and the [changelog](https://github.com/facebook/react/blob/main/CHANGELOG.md).

---

## Lifecycle and context

### Lesson 1. Unsafe lifecycles and legacy context [React 16.9]

**Takeaway:** Introduced in: deprecation names in **React 16.3** (`UNSAFE_` aliases) and **16.9** (warnings). **Removed in React 19** for the old names / legacy context / several related APIs. Use `useEffect` / `useLayoutEffect` / constructor / `getDerivedStateFromError`.

**Explain:**

| API | Status | Replacement |
| --- | --- | --- |
| `componentWillMount` | Deprecated (use `UNSAFE_` in 16.9); **removed in 19** | `constructor` (sync setup) or `useEffect` (side effects) |
| `componentWillReceiveProps` | Same | Derive in render, or `useEffect` on deps |
| `componentWillUpdate` | Same | `useLayoutEffect` / `getSnapshotBeforeUpdate` |
| `UNSAFE_componentWillMount` etc. | Legacy until 19; **do not write new ones** | Same replacements |
| Legacy context (`contextTypes`, `childContextTypes`, `getChildContext`) | Deprecated; **removed in 19** | `createContext` (16.3) + `useContext` |
| String refs (`ref="x"`) | Deprecated for years; **removed in 19** | `createRef` / `useRef` / callback ref |
| `findDOMNode` | Deprecated; **removed in 19** | Refs |
| `PropTypes` on the `react` package | Moved out long ago (`prop-types`) | TypeScript or `prop-types` package |
| `React.createClass` / mixins | Removed in 16.0 | `class` / function components |
| `ReactDOM.render` | **Deprecated in 18**; **removed in 19** | `createRoot` |
| `ReactDOM.hydrate` | **Deprecated in 18**; **removed in 19** | `hydrateRoot` |
| `defaultProps` on **function** components | **Removed in 19** | Default parameters `function Btn({ size = "md" })` |
| `defaultProps` on **class** components | Still supported | Prefer default params on functions |
| `forwardRef` | **Still supported** | Optional in 19 (ref as prop) |
| `Context.Provider` | **Still supported** | Optional `<Context>` in 19 |
| Classes / `this.state` | **Still supported** | Hooks for new code |
| `useFormState` | **Renamed** | `useActionState` (19) |

### Why lifecycles were deprecated

They ran at times that **break concurrent rendering** (side effects during render, unsafe reads of next props). Fiber needs a **pure render phase**.

### Before (willMount fetch)

```jsx
class Profile extends React.Component {
  componentWillMount() {
    fetch("/api/me").then((r) => r.json()).then((u) => this.setState({ u }));
  }
}
```

This also ran on the server in some paths and raced.

### After

```jsx
useEffect(() => {
  const ac = new AbortController();
  fetch("/api/me", { signal: ac.signal })
    .then((r) => r.json())
    .then(setU);
  return () => ac.abort();
}, []);
```

Or a Server Component / router loader.

### Real-world examples

**1. Class dashboard widgets still on `willReceiveProps`** — rewrite to fully controlled props.

**2. String refs in a 2017 modal** — `this.refs.ok` → `okRef.current`.

**3. `findDOMNode(this)` in a tooltip library** — `forwardRef` / fragment ref (19.3).

**Tip:** `UNSAFE_` was a **migration name**, not a recommendation. The prefix means “this will bite you in concurrent mode.”

**Try it:** Search the repo for `componentWillMount` and `ReactDOM.render`.

---

## Roots and DOM helpers

### Lesson 2. ReactDOM.render, hydrate, and findDOMNode [React 18]

**Takeaway:** Introduced in: `createRoot` **18**; deprecation of `render`/`hydrate` in **18**; **removal in 19**. `findDOMNode` removed in 19.

**Explain:**

### ReactDOM.render

```jsx
// Removed in 19
ReactDOM.render(<App />, node);

// 18+
createRoot(node).render(<App />);
```

Keeping `render` on React 18: **legacy root**, no concurrent features, deprecation warning. On React 19: **it throws / is missing**.

### hydrate

```jsx
// Removed in 19
ReactDOM.hydrate(<App />, node);

hydrateRoot(node, <App />);
```

### findDOMNode

```jsx
// Removed
findDOMNode(this).scrollIntoView();

// Use
ref.current.scrollIntoView();
```

### Real-world examples

**1. Vite `main.jsx` still on `render`** — blocks 19 upgrade.

**2. Tests using `ReactDOM.render`** — `@testing-library/react` `render` uses `createRoot` on 18+.

**3. Enzyme + findDOMNode** — reason many teams froze on 17.

**Tip:** The upgrade is mechanical except where you relied on **legacy batching** or **silent hydration**.

**Try it:** If `npm ls react` is 19 and the app boots, you already left `ReactDOM.render`.

---

## Function defaultProps and other 19 removals

### Lesson 3. defaultProps on functions and other 19 breaking cleanups [React 19]

**Takeaway:** Introduced in: removal in **React 19**. Function components should use **default parameters**. Class `defaultProps` remain.

**Explain:**

```jsx
// Removed for functions in 19
function Button({ size }) {}
Button.defaultProps = { size: "md" };

// Modern
function Button({ size = "md" }) {}
```

Why: `defaultProps` on functions interacted poorly with how React compares props / compiler / `undefined` vs missing.

### Still OK

- `defaultProps` on **classes**
- Default values in destructuring
- `Context` default argument to `createContext(defaultValue)`

### Real-world examples

**1. Design system** — hundreds of `defaultProps` on functions: a codemod to default params.

**2. Tests that set `Cmp.defaultProps`** — update.

**3. `prop-types` + defaultProps** — TypeScript defaults instead.

### Other 19-era cleanups to remember

- No more **string refs**
- No more **legacy context**
- No more **module pattern factories** / old undocumented APIs
- Error handling: some old `unstable_` names gone

**Tip:** React 19 upgrade guide is the checklist — this page is the mental model.

**Try it:** `rg "defaultProps" --type js` and split class vs function.
