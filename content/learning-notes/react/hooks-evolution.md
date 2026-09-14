# Hooks Evolution

Why Hooks shipped in 16.8, how they replaced class patterns, and the 16.8 hooks the [fundamentals track](/notes/learn/react) does not drill into: `useLayoutEffect`, `useImperativeHandle`, `useDebugValue`.

## Profile

Do **not** re-learn `useState` / `useEffect` / `useMemo` here. Those are [Lessons 8–20](/notes/learn/react). This chapter is the **version story** and the leftover APIs.

---

## Why Hooks existed

### Lesson 1. Hooks made stateful logic reusable without classes [React 16.8]

**Takeaway:** Introduced in: React 16.8 (February 2019). Hooks let function components hold state, subscribe to external systems, and share logic via **custom hooks** instead of mixins, HOCs, or classes.

**Explain:**
Classes worked. They did not compose. Wrapper hell (`withRouter(withTheme(withAuth(Button)))`) and `this` bugs were the tax.

### What is it?

A Hook is a function whose name starts with `use` that may call other Hooks. React associates hook state with the **fiber** and the **call order**.

### Why was it introduced?

Three problems:

1. **Reuse stateful logic** — mixins conflicted; HOCs added fake nodes; render props nested pyramids
2. **Giant classes** — unrelated logic in `componentDidMount` (fetch + subscription + DOM)
3. **Classes confuse humans and compilers** — `this` binding, experimental class properties, minification of methods

### Before React 16.8

```jsx
class WindowWidth extends React.Component {
  state = { width: window.innerWidth };
  onResize = () => this.setState({ width: window.innerWidth });
  componentDidMount() {
    window.addEventListener("resize", this.onResize);
  }
  componentWillUnmount() {
    window.removeEventListener("resize", this.onResize);
  }
  render() {
    return this.props.children(this.state.width);
  }
}

function Page() {
  return (
    <WindowWidth>
      {(width) => <p>{width < 640 ? "Mobile nav" : "Desktop nav"}</p>}
    </WindowWidth>
  );
}
```

### With Hooks

```jsx
function useWindowWidth() {
  const [width, setWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return width;
}

function Page() {
  const width = useWindowWidth();
  return <p>{width < 640 ? "Mobile nav" : "Desktop nav"}</p>;
}
```

Same behavior, no extra component in the tree, reusable in any function component.

### How it works

On each render of a function fiber, React walks the **hook list** in call order. That is why you cannot call Hooks inside conditions. The Rules of Hooks are an implementation constraint, not a style preference. Fundamentals: [Lesson 11](/notes/learn/react).

### Real-world examples

**1. Auth in a SaaS app** — `useAuth()` reads token from context + localStorage sync. Classes needed `AuthProvider` **and** a consumer class or HOC.

**2. Infinite scroll** — `useInfiniteList(fetchPage)` owns the sentinel `IntersectionObserver`. Previously a 200-line class.

**3. Checkout field validation** — `useField(schema)` shared across billing and shipping forms without a Formik-sized class.

### When should I use Hooks?

All new React code. Classes still work; they are not the default.

### When should I NOT?

- You cannot write an Error Boundary as a hook (still a class, or a library that wraps one)
- Do not “hook-ify” a 10-line presentational component that has no state

### Common mistakes

- Conditional `useEffect`
- Copying class lifecycle 1:1 (`useEffect(() => {}, [])` is not always `componentDidMount`)
- Believing Hooks replaced Redux by themselves (they replaced **component local + reusable** logic)

### Performance considerations

Function components are not automatically faster. They avoid some class ceremony. `useMemo`/`useCallback` are **not** required “because hooks.”

### Related APIs

Custom hooks, later: `useTransition` (18), `use` (19), `useEffectEvent` (19.2)

### Interview notes

- 16.8, not 16.7.
- Rules of Hooks = stable call order on a fiber.
- Classes were not removed.

**Tip:** If you are migrating a class, translate **behaviors** (sync with X, store Y), not lifecycle method names.

**Try it:** Rewrite a `componentDidMount` + `componentDidUpdate` fetch with `useEffect` and a cleanup abort controller.

---

## Class → Hooks map

### Lesson 2. How class patterns map to Hooks [React 16.8]

**Takeaway:** Introduced in: React 16.8. This is a translation table, not a promise that every line maps 1:1.

**Explain:**
Interviewers love this table. Production bugs happen when people assume 1:1.

| Class | Hook-era equivalent | Caveat |
| --- | --- | --- |
| `this.state` / `setState` | `useState` / `useReducer` | Functional updaters still exist |
| `componentDidMount` | `useEffect(..., [])` | Also runs setup after paint, not before |
| `componentDidUpdate` | `useEffect(..., [deps])` | You must name the deps; it also runs after mount |
| `componentWillUnmount` | Effect **cleanup** | Same function returns a disposer |
| `shouldComponentUpdate` | `React.memo` | Shallow compare; write a custom comparer |
| `this.props.x` in async | Stale closure | Functional updates / refs / `useEffectEvent` (19.2) |
| `componentDidCatch` | Still a **class** | `react-error-boundary` |
| `getSnapshotBeforeUpdate` | `useLayoutEffect` | Read DOM before paint |
| `createRef` | `useRef` | Object `{ current }` |
| `contextType` / Consumer | `useContext` | Same Context object |

### Real-world examples

**1. Analytics page class that fetched in `didMount` and `didUpdate` when `userId` changed** — one `useEffect` with `[userId]`.

**2. Video player `getSnapshotBeforeUpdate` for scroll position** — `useLayoutEffect`.

**3. PureComponent row in a 1000-row table** — `React.memo(Row)`.

### When should I still use a class?

Error Boundaries, or a library that has not shipped a function API. Not “because this file is old” forever.

**Tip:** `setState` in classes batched in events (pre-18). Hooks `useState` in async `fetch().then` did **not** batch until **React 18 automatic batching**. See [Concurrent](/notes/learn/react/concurrent).

**Try it:** Convert a class modal (open state + `Esc` listener) to a function. Put the listener in an effect with cleanup.

---

## useLayoutEffect

### Lesson 3. useLayoutEffect runs before the browser paints [React 16.8]

**Takeaway:** Introduced in: React 16.8. Same signature as `useEffect`, but it fires **synchronously after DOM updates and before paint**. Use it to read layout and adjust the DOM without a visible flash.

**Explain:**
`useEffect` is **passive** (after paint). `useLayoutEffect` is **layout** (before paint). Wrong choice = flicker or dropped frames.

### What is it?

```jsx
useLayoutEffect(() => {
  const { height } = ref.current.getBoundingClientRect();
  if (height !== measured) setMeasured(height);
  return () => {};
}, [children]);
```

### Why was it introduced?

Classes had `componentDidMount` / `DidUpdate` which ran before the browser painted (layout). `useEffect` is *later* than that. A 1:1 port of “measure then setState” using `useEffect` flashes.

### Before (class)

```jsx
componentDidMount() {
  this.adjustTooltip();
}
componentDidUpdate() {
  this.adjustTooltip();
}
```

### With useLayoutEffect

```jsx
useLayoutEffect(() => {
  adjustTooltip(ref.current);
}, [open, text]);
```

### Real-world examples

**1. Tooltip / popover positioning** — measure the trigger, set `top`/`left` so the first painted frame is already in place (SaaS data table actions).

**2. Chat thread** — pin scroll to bottom when the user is already at the bottom; doing it in `useEffect` shows one frame of the old scroll.

**3. Autocomplete list** — if the menu would overflow the viewport, flip upward before paint.

### When should I use it?

Measuring DOM, restoring scroll, synchronous third-party DOM libs that must not flash, keeping a caret position.

### When should I NOT?

- Data fetching
- Logging / analytics
- Anything that can wait until after paint
- SSR: `useLayoutEffect` warns on the server (`useEffect` or `useIsomorphicLayoutEffect` gated)

### Common mistakes

- `useLayoutEffect` that `setState` in a loop (layout thrash)
- Using it “because it feels more like componentDidMount”

### Performance considerations

It **blocks paint**. A 20ms layout effect is a dropped frame. Keep it tiny.

### Related APIs

`useEffect`, `useInsertionEffect` (18, for CSS-in-JS injection even earlier)

### Interview notes

- Timeline: render → commit DOM → **useLayoutEffect** → paint → **useEffect**.
- Prefer `useEffect` by default.

**Tip:** If you cannot see a flash, you probably wanted `useEffect`.

**Try it:** Position a tooltip with `useEffect` vs `useLayoutEffect` and record the first frame (slow 6x CPU in DevTools).

---

## useImperativeHandle

### Lesson 4. useImperativeHandle customizes the ref value [React 16.8]

**Takeaway:** Introduced in: React 16.8. Used with `forwardRef` (or React 19 `ref` prop) to expose a **small imperative API** to a parent instead of the raw DOM node.

**Explain:**
Most apps should pass callbacks and state down. Sometimes a parent must call `focus()`, `play()`, or `scrollToRow(i)` on a child that wraps several nodes.

### What is it?

```jsx
const SearchField = forwardRef(function SearchField({ onSubmit }, ref) {
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    clear: () => {
      inputRef.current.value = "";
      inputRef.current.focus();
    },
  }), []);

  return <input ref={inputRef} onKeyDown={(e) => e.key === "Enter" && onSubmit()} />;
});
```

Parent:

```jsx
function Header() {
  const searchRef = useRef(null);
  return (
    <>
      <button onClick={() => searchRef.current.focus()}>Jump to search</button>
      <SearchField ref={searchRef} onSubmit={runSearch} />
    </>
  );
}
```

### Why was it introduced?

`forwardRef` would otherwise expose the inner DOM node (or nothing). Design systems want `focus()` without letting parents set `input.style`.

### Before

Parents used `findDOMNode` (now deprecated) or reached into `ref.current.querySelector('input')`.

### Real-world examples

**1. Design system Modal** — expose `open()` / `close()` / `focusTitle()` while the DOM is a portal subtree.

**2. Data grid** — `scrollToRow(index)` on a virtualized table (admin orders).

**3. Media player** — `play()`, `pause()`, `seek(t)` wrapping `<video>` plus custom controls.

### When should I use it?

Library-quality components with a **narrow** imperative surface. Pair with `forwardRef`.

### When should I NOT?

- To pass data up (use props / callbacks / state)
- To expose the whole component instance (`this` nostalgia)
- Everyday forms (controlled inputs are enough)

### Common mistakes

- New object identity every render without deps → parent effects re-run
- Exposing too many methods (becomes an untyped API)

### Performance considerations

Cheap. The cost is architectural (imperative escape hatch).

### Related APIs

`forwardRef`, React 19 `ref` as prop (you can drop `forwardRef` on new components)

### Interview notes

- Customizes what the parent’s `ref.current` is.
- Always with a ref forwarded from the parent.

**Tip:** Prefer `onReady(api)` only if you cannot use refs — refs are the React-native channel.

**Try it:** Expose `{ focus, selectAll }` from a comment composer and call it when the user hits `Ctrl+K`.

---

## useDebugValue

### Lesson 5. useDebugValue labels custom hooks in DevTools [React 16.8]

**Takeaway:** Introduced in: React 16.8. `useDebugValue(value)` shows a label next to a custom hook in React DevTools. It does not change runtime behavior in production.

**Explain:**
When you have `useAuth`, `useQuery`, `useTheme`, DevTools can show “Auth: signed in (Ada)” instead of a mysterious hook index.

```jsx
function useAuth() {
  const [user, setUser] = useState(null);
  useDebugValue(user ? user.email : "signed out");
  // ...
  return { user, setUser };
}
```

Defer expensive labels:

```jsx
useDebugValue(user, (u) => expensiveSerialize(u));
```

The formatter runs only when DevTools is open.

### Why was it introduced?

Custom hooks are flattened into a list. Without names/values, debugging `useSomething` stacks is painful.

### Real-world examples

**1. `useCart` in e-commerce** — show item count.

**2. `usePermissions` in an admin app** — show role names.

**3. `useConnection` in chat** — show `connected` / `reconnecting`.

### When should I use it?

Custom hooks you publish or debug weekly.

### When should I NOT?

One-off hooks in a single file. Do not use it to log to the console (that is not what it does).

### Interview notes

- DevTools-only helper for **custom** hooks.
- Optional formatter function for expensive display.

**Tip:** This is a 30-second interview answer. Spend your depth on `useLayoutEffect` vs `useEffect`.

**Try it:** Add `useDebugValue` to `useWindowWidth` and inspect the hooks panel.

---

## Built-in 16.8 hook checklist

### Lesson 6. The original Hooks API surface [React 16.8]

**Takeaway:** Introduced in: React 16.8. These ten (plus `useContext` already listed) are the original set. Later hooks are 18/19.

**Explain:**

| Hook | Job | Fundamentals? |
| --- | --- | --- |
| `useState` | Local state | [L8](/notes/learn/react) |
| `useEffect` | Sync with external systems after paint | [L12](/notes/learn/react) |
| `useContext` | Read context | [L20](/notes/learn/react) |
| `useReducer` | Complex state transitions | [L18](/notes/learn/react) |
| `useCallback` | Stable function identity | [L17](/notes/learn/react) |
| `useMemo` | Cache expensive derived values | [L16](/notes/learn/react) |
| `useRef` | Mutable box / DOM | [L14](/notes/learn/react) |
| `useLayoutEffect` | Sync with DOM before paint | This chapter |
| `useImperativeHandle` | Customize ref | This chapter |
| `useDebugValue` | DevTools label | This chapter |

Nothing named `useTransition` exists yet. If you see it, you are in [React 18](/notes/learn/react/react-18-apis).

**Tip:** Custom hooks are not a 16.9 feature — they are a pattern on top of 16.8.

**Try it:** List the 16.8 hooks from memory, then list 18 and 19 hooks separately so you never mix versions in an interview.
