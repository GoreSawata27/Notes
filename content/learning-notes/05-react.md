# React Learning Notes

A progressive, hands-on guide to React — from the mental model and JSX through hooks, composition, performance, React 19 features, and TypeScript patterns. Each lesson builds on the last. Read the takeaway first, study the explanation and code, then try the exercise in a small Vite + React project or [StackBlitz](https://stackblitz.com/).

## Profile

This page is the **fundamentals track** (32 lessons). After you can build components, hooks, and forms, continue in **[React Evolution](/notes/learn/react/evolution)** — a React 16 → 19.3 reference covering Fiber, concurrent rendering, Actions, migrations, and recent 19.x APIs.

- Start here if you are learning React.
- Open [React Evolution](/notes/learn/react/evolution) if you already know hooks and want version-by-version depth.
- Interview-style Q&A lives at [React notes](/notes/react).

---

## Mental model & JSX

### Lesson 1. React is a UI library, not a framework

**Takeaway:** React renders a tree of components from data. It is a library you compose with routing, data fetching, and state tools — not an all-in-one framework like Next.js (which *uses* React).

**Explain:** At its core, React answers one question: **given current data, what should appear on screen?** You describe UI as a function of state. When state changes, React computes a new description and updates the DOM efficiently through **reconciliation** — comparing the new tree to the previous one and applying minimal changes.

```jsx
// UI = f(state)
function Greeting({ name }) {
  return <h1>Hello, {name}!</h1>;
}

// React renders this into the DOM:
// <div id="root"></div>  →  <h1>Hello, Ada!</h1>
import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root")).render(
  <Greeting name="Ada" />
);
```

React does **not** ship a router, global store, or HTTP client. That separation keeps the core small and lets you pick tools (React Router, TanStack Query, Zustand, etc.). Think of React as the **view layer** in a larger architecture.

**Tip:** When learning, focus on components, state, and effects first. Add routing and data libraries only after the mental model clicks.

**Try it:** Create a Vite React app (`npm create vite@latest my-app -- --template react`). Replace `App.jsx` with `Greeting` above and render it with your name.

---

### Lesson 2. JSX is syntax sugar for `React.createElement`

**Takeaway:** JSX looks like HTML but compiles to JavaScript function calls. Every JSX tag becomes a `createElement` (or `_jsx` in modern runtimes) call that returns a plain object — a **React element**, not a DOM node.

**Explain:** Browsers do not understand JSX. Your bundler (Vite, Webpack) transforms it at build time. A self-closing tag, an expression in `{}`, and a fragment all have precise JavaScript equivalents.

```jsx
// What you write:
const element = (
  <>
    <h1 className="title">Welcome</h1>
    <p>{user.name} has {user.score} points</p>
  </>
);

// What the compiler produces (simplified):
const element = React.createElement(
  React.Fragment,
  null,
  React.createElement("h1", { className: "title" }, "Welcome"),
  React.createElement(
    "p",
    null,
    user.name,
    " has ",
    user.score,
    " points"
  )
);
```

A React element is a lightweight description: `{ type, props, key }`. React reads these descriptions and creates or updates real DOM nodes during **commit**.

**Tip:** Use `className` instead of `class`, `htmlFor` instead of `for`, and camelCase for DOM attributes (`tabIndex`, `onClick`). JSX is JavaScript, not HTML.

**Try it:** In DevTools, log a JSX expression before returning it: `console.log(<span>test</span>)`. Inspect the object shape in the console.

---

### Lesson 3. Embedding expressions, conditionals, and fragments

**Takeaway:** Curly braces `{}` embed any JavaScript expression in JSX. Conditionals use ternaries, `&&`, or early returns — not `if` statements inside JSX tags.

**Explain:** JSX children and attributes accept expressions, not statements. For branching UI, pick the pattern that reads clearest for your team.

```jsx
function StatusBadge({ status, count }) {
  // Early return for loading / error states
  if (status === "loading") return <span className="badge">Loading…</span>;
  if (status === "error") return <span className="badge error">Failed</span>;

  return (
    <>
      {/* Ternary for two clear branches */}
      <span className={count > 0 ? "badge active" : "badge"}>
        {count > 0 ? `${count} items` : "Empty"}
      </span>

      {/* && for "render when truthy" — beware: 0 renders "0" */}
      {count > 0 && <button>Clear all</button>}
    </>
  );
}
```

**Fragments** (`<>...</>` or `<React.Fragment>`) group siblings without adding an extra DOM node. Use the keyed form `<Fragment key={id}>` when mapping lists of fragments.

**Tip:** Avoid nested ternaries beyond one level. Extract a helper component or variable: `const content = status === "ok" ? <Ok /> : <Fail />;`

**Try it:** Build a `UserCard` that shows an avatar image when `avatarUrl` exists, a placeholder div when it does not, and a "Premium" badge only when `isPremium` is true.

---

### Lesson 4. The component tree and one-way data flow

**Takeaway:** React apps are trees of components. Data flows **down** via props; events flow **up** via callback props. Parent components own state; children request changes through functions passed as props.

**Explain:** Imagine your UI as a hierarchy. The root (`App`) holds top-level state and passes slices down. A child never mutates props directly — it calls `onSave(data)` and lets the parent update state and re-render the tree.

```jsx
function App() {
  const [query, setQuery] = useState("");

  return (
    <div>
      <SearchBar value={query} onChange={setQuery} />
      <ResultsList query={query} />
    </div>
  );
}

function SearchBar({ value, onChange }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search…"
    />
  );
}

function ResultsList({ query }) {
  const items = useMemo(() => filterItems(query), [query]);
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.label}</li>
      ))}
    </ul>
  );
}
```

This **unidirectional flow** makes bugs easier to trace: find the component that owns the state, then follow props downward and callbacks upward.

**Tip:** Draw your component tree on paper with arrows for props (down) and event handlers (up). If data needs to jump sideways across distant cousins, lift state to their nearest common ancestor or use Context (Lesson 20).

**Try it:** Build a tiny counter app where `App` holds `count` and `CounterDisplay` shows it while `CounterButtons` receives `onIncrement` and `onDecrement` callbacks.

---

## Components & props

### Lesson 5. Function components and returning UI

**Takeaway:** Modern React uses function components — plain JavaScript functions that accept props and return JSX (or `null`). They replace class components for virtually all new code.

**Explain:** A component is any function whose name starts with a capital letter (by convention). React calls it during render, reads the returned element description, and reconciles the result.

```jsx
function Avatar({ src, alt, size = 48 }) {
  const style = {
    width: size,
    height: size,
    borderRadius: "50%",
    objectFit: "cover",
  };

  if (!src) return null; // render nothing

  return <img src={src} alt={alt} style={style} />;
}

function ProfileHeader({ user }) {
  return (
    <header>
      <Avatar src={user.avatarUrl} alt={user.name} size={64} />
      <h2>{user.name}</h2>
      <p>{user.bio}</p>
    </header>
  );
}
```

Components can be defined in the same file or exported from modules. Keep components focused: if a function returns JSX and has a clear name, it is probably a component.

**Tip:** Do not call components like regular functions (`Avatar(props)`). Always use JSX (`<Avatar {...props} />`) so React can track hooks, keys, and reconciliation correctly.

**Try it:** Split a hard-coded profile page into `Avatar`, `ProfileHeader`, and `ProfileStats` components in separate files and compose them in `App`.

---

### Lesson 6. Props: reading, defaults, and the children prop

**Takeaway:** Props are read-only inputs to a component. Destructure them in the parameter list, provide defaults, and use `children` for composition slots.

**Explain:** Props are a single object argument. React passes whatever attributes you write on a JSX tag. Spread syntax forwards props cleanly.

```jsx
function Card({ title, footer, children, variant = "default" }) {
  return (
    <article className={`card card--${variant}`}>
      {title && <h3>{title}</h3>}
      <div className="card__body">{children}</div>
      {footer && <footer className="card__footer">{footer}</footer>}
    </article>
  );
}

function App() {
  return (
    <Card
      title="Weekly summary"
      footer={<button>Export PDF</button>}
      variant="highlight"
    >
      <p>You completed 12 tasks this week.</p>
    </Card>
  );
}
```

The special prop **`children`** is whatever you nest between opening and closing tags. It enables flexible layout without prop drilling every possible slot name.

**Tip:** Avoid mutating props or reassigning destructured props. If you need local editable copy, copy into state on first render (Lesson 8).

**Try it:** Create a reusable `Panel` component with optional `title`, required `children`, and an optional `actions` prop that renders a button row in the header.

---

### Lesson 7. PropTypes, key rules, and component boundaries

**Takeaway:** Document props with TypeScript (preferred) or PropTypes in JavaScript. Never generate `key` inside a child — keys belong on the outermost element returned from a `.map()` in the **parent**.

**Explain:** Keys help React identify list items across re-reorders. Props validation catches mistakes early during development.

```jsx
import PropTypes from "prop-types";

function TagList({ tags }) {
  return (
    <ul>
      {tags.map((tag) => (
        // key on the element returned from map — here in the parent
        <li key={tag.id}>
          <Tag label={tag.label} color={tag.color} />
        </li>
      ))}
    </ul>
  );
}

function Tag({ label, color }) {
  // Do NOT: key={label} here — Tag does not know its list context
  return <span style={{ background: color }}>{label}</span>;
}

Tag.propTypes = {
  label: PropTypes.string.isRequired,
  color: PropTypes.string,
};
```

Keys must be **stable, unique among siblings**. Index-as-key is acceptable only for static lists that never reorder, filter, or insert in the middle.

**Tip:** Treat props as a public API. If a component needs more than 8–10 props, consider composition (Lesson 24) or splitting the component.

**Try it:** Build a `TodoList` that maps todos to `TodoItem` components. Reorder todos with up/down buttons and confirm items keep correct state when keys use `id` vs array index.

---

## State & re-renders

### Lesson 8. Local state with `useState`

**Takeaway:** `useState` adds reactive state to a function component. Calling the setter schedules a re-render; React preserves state between renders by hook call order.

**Explain:** Destructure `[value, setValue] = useState(initialValue)`. The initial value is used only on the first render. Functional updates receive the previous state and avoid stale closures.

```jsx
import { useState } from "react";

function SignupForm() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1);

  function nextStep() {
    setStep((prev) => prev + 1); // functional update — safe in async paths
  }

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      {step === 1 && (
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
      )}
      {step === 2 && <p>Confirm: {email}</p>}
      <button type="button" onClick={nextStep}>Next</button>
    </form>
  );
}
```

Each `useState` call is a separate slice of state. Group related fields in one object only when they always update together — otherwise prefer multiple hooks for simpler updates.

**Tip:** Never mutate state directly (`state.items.push(x)`). Always create new references so React detects change: `setItems((prev) => [...prev, x])`.

**Try it:** Build a tabs component with `useState` tracking the active tab index. Switching tabs should preserve each panel's internal input values (lift inputs into tab state if needed).

---

### Lesson 9. What triggers a re-render and render purity

**Takeaway:** A component re-renders when its state changes, its parent re-renders, or its context value changes. Render functions must be **pure** — same props/state produce the same JSX, with no side effects during render.

**Explain:** Re-rendering does not always mean DOM updates. React runs your component function, diffs the output, and patches the DOM only where needed. Side effects belong in event handlers or `useEffect`, not in the render body.

```jsx
function ExpensiveList({ items, filter }) {
  // BAD — side effect during render
  // document.title = `Showing ${items.length} items`;

  // GOOD — derive during render (pure)
  const visible = items.filter((item) =>
    item.label.toLowerCase().includes(filter.toLowerCase())
  );

  console.log("ExpensiveList render"); // runs every time parent or local state changes

  return (
    <ul>
      {visible.map((item) => (
        <li key={item.id}>{item.label}</li>
      ))}
    </ul>
  );
}
```

Calling `setState` during render (except in rare controlled patterns) causes infinite loops. Batch multiple `setState` calls in event handlers — React 18+ batches them automatically, even across async boundaries in many cases.

**Tip:** If a computation is expensive and depends on specific inputs, memoize it with `useMemo` (Lesson 16) — but do not optimize prematurely.

**Try it:** Add `console.log` to several nested components. Click a button that updates state in the root and observe which components re-render. Wrap one child in `React.memo` (Lesson 27) and compare.

---

### Lesson 10. Lifting state up and controlled vs uncontrolled inputs

**Takeaway:** When two components must share state, move it to their closest common parent and pass value + onChange down. Inputs whose value comes from React state are **controlled**; DOM-owned inputs are **uncontrolled**.

**Explain:** Lifted state keeps a single source of truth. Controlled inputs mirror state on every keystroke; uncontrolled inputs use refs to read DOM values when needed (forms, file inputs).

```jsx
function TemperatureConverter() {
  const [celsius, setCelsius] = useState("");

  const fahrenheit =
    celsius === "" ? "" : String((Number(celsius) * 9) / 5 + 32);

  return (
    <div>
      <LabeledInput
        label="Celsius"
        value={celsius}
        onChange={setCelsius}
      />
      <LabeledInput
        label="Fahrenheit"
        value={fahrenheit}
        onChange={(f) => setCelsius(String(((Number(f) - 32) * 5) / 9))}
      />
    </div>
  );
}

function LabeledInput({ label, value, onChange }) {
  return (
    <label>
      {label}
      <input value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
```

Use controlled inputs for live validation and instant UI feedback. Use uncontrolled + ref for simple forms where you read values only on submit.

**Tip:** For number inputs, decide whether empty string is valid state or coalesce to `0` — mixing `""` and `0` causes subtle bugs in calculations.

**Try it:** Build a mini shopping cart where `Cart` holds `items` array state and `ProductList` / `CartSummary` siblings both read from and update through callbacks passed from `App`.

---

## Hooks: useState, useEffect, useRef

### Lesson 11. Rules of Hooks and hook call order

**Takeaway:** Call hooks only at the top level of function components or custom hooks — never inside loops, conditions, or nested functions. React identifies hooks by **call order**, which must be identical every render.

**Explain:** Breaking the rules causes state to attach to the wrong hook slot, leading to crashes or silent corruption.

```jsx
// WRONG — conditional hook
function Bad({ show }) {
  if (show) {
    const [x, setX] = useState(0); // violates rules
  }
  return null;
}

// RIGHT — hook always called; condition inside
function Good({ show }) {
  const [x, setX] = useState(0);

  if (!show) return null;

  return <button onClick={() => setX(x + 1)}>{x}</button>;
}

// Custom hooks extract reusable logic — they follow the same rules
function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = () => setOn((v) => !v);
  return [on, toggle];
}
```

ESLint plugin `eslint-plugin-react-hooks` enforces these rules. Enable it in every React project.

**Tip:** Name custom hooks `useSomething` so linters and teammates recognize them as hooks.

**Try it:** Refactor duplicated toggle logic in two components into `useToggle` and confirm both still work after a conditional early return *below* the hook call.

---

### Lesson 12. `useEffect` for synchronizing with external systems

**Takeaway:** `useEffect` runs **after** paint to sync React state with the outside world: DOM APIs, subscriptions, timers, and network fetches. The optional cleanup function runs before the next effect and on unmount.

**Explain:** Effects are for **synchronization**, not for deriving data that could be computed during render. Dependencies in the array tell React when to re-run the effect.

```jsx
import { useEffect, useState } from "react";

function DocumentTitle({ title }) {
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous; // cleanup on title change or unmount
    };
  }, [title]);

  return null;
}

function ChatRoom({ roomId }) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const connection = createConnection(roomId);
    connection.on("message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    connection.connect();

    return () => connection.disconnect(); // leave room on roomId change
  }, [roomId]);

  return <MessageList messages={messages} />;
}
```

An empty dependency array `[]` means "run once after mount" (plus cleanup on unmount). Omitting the array means "run after every render" — rarely what you want.

**Tip:** If your effect only computes something from props/state with no external system, delete the effect and compute during render instead.

**Try it:** Build a `WindowWidth` component that listens to `resize` events and displays the current inner width. Verify the listener is removed in cleanup by logging in the effect and cleanup.

---

### Lesson 13. Effect dependencies and stale closures

**Takeaway:** Every value from the component body that the effect reads must appear in the dependency array, or you risk **stale closures** — the effect sees old prop/state values.

**Explain:** ESLint's `exhaustive-deps` rule helps, but understanding *why* matters. Functional state updates and refs are tools to reduce dependency churn.

```jsx
function Timer({ intervalMs }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      // Functional update — does not need `seconds` in deps
      setSeconds((s) => s + 1);
    }, intervalMs);

    return () => clearInterval(id);
  }, [intervalMs]); // re-subscribe when interval changes

  return <p>{seconds}s</p>;
}

function SearchResults({ query }) {
  const [results, setResults] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const data = await fetchResults(query);
      if (!cancelled) setResults(data);
    }

    run();
    return () => {
      cancelled = true; // ignore outdated responses when query changes fast
    };
  }, [query]);

  return <ul>{results.map((r) => <li key={r.id}>{r.title}</li>)}</ul>;
}
```

**Tip:** For "run once on mount" effects that need latest callbacks, consider `useEffectEvent` (React 19) or storing callbacks in refs — but do not disable `exhaustive-deps` without a documented reason.

**Try it:** Create a search box that fetches on every query change. Type quickly and confirm old responses do not overwrite newer ones without a cancellation flag.

---

### Lesson 14. `useRef` for mutable values and DOM access

**Takeaway:** `useRef` returns a mutable `{ current }` object that persists across renders without causing re-renders when mutated. Use it for DOM nodes, timer IDs, and instance variables.

**Explain:** Unlike state, updating `ref.current` does not trigger a render. Assign the ref to a JSX element via the `ref` attribute.

```jsx
import { useEffect, useRef, useState } from "react";

function FocusableInput() {
  const inputRef = useRef(null);

  function focusInput() {
    inputRef.current?.focus();
  }

  return (
    <>
      <input ref={inputRef} placeholder="Click button to focus me" />
      <button type="button" onClick={focusInput}>Focus</button>
    </>
  );
}

function Stopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);

  function start() {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
  }

  function stop() {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }

  return (
    <div>
      <p>{elapsed}s</p>
      <button onClick={start}>Start</button>
      <button onClick={stop}>Stop</button>
    </div>
  );
}
```

**Tip:** Do not read or write `ref.current` during render (except initialization patterns documented by React). DOM refs are populated after commit; use effects or event handlers to interact with them.

**Try it:** Build an auto-resizing textarea: use a ref to measure `scrollHeight` and set inline height on input events.

---

### Lesson 15. Custom hooks: extracting reusable logic

**Takeaway:** Custom hooks share stateful logic, not state itself. Each component that calls a custom hook gets its **own** independent state and effects.

**Explain:** If you copy the same `useState` + `useEffect` combo into three components, extract a function named `useSomething`.

```jsx
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key);
    return stored !== null ? JSON.parse(stored) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

function SettingsPanel() {
  const [theme, setTheme] = useLocalStorage("theme", "light");

  return (
    <select value={theme} onChange={(e) => setTheme(e.target.value)}>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  );
}

function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
```

Custom hooks can call other hooks. They are the primary mechanism for sharing behavior in modern React codebases.

**Tip:** Return arrays for tuple-like APIs (`useState` style) and objects for named fields when there are many return values.

**Try it:** Extract `useDebouncedValue` and wire it to a search input that filters a list only after 300 ms of idle typing.

---

## Hooks: useMemo, useCallback, useReducer, useContext

### Lesson 16. `useMemo` for expensive derived values

**Takeaway:** `useMemo` caches the result of a computation between renders, recomputing only when dependencies change. Use it for measurable expensive work — not for every inline object.

**Explain:** React compares dependency values with `Object.is`. The memoized value survives re-renders caused by unrelated state updates.

```jsx
import { useMemo, useState } from "react";

function DataGrid({ rows, sortKey, filterText }) {
  const processedRows = useMemo(() => {
    console.log("sorting and filtering…");
    const filtered = rows.filter((row) =>
      row.name.toLowerCase().includes(filterText.toLowerCase())
    );
    return [...filtered].sort((a, b) =>
      String(a[sortKey]).localeCompare(String(b[sortKey]))
    );
  }, [rows, sortKey, filterText]);

  return (
    <table>
      <tbody>
        {processedRows.map((row) => (
          <tr key={row.id}>
            <td>{row.name}</td>
            <td>{row.score}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

If no dependency changed, React skips the function and returns the cached value. This pairs well with `React.memo` on child components that receive the memoized result as props.

**Tip:** Profile before memoizing. Simple filters on small arrays rarely need `useMemo`; the hook itself has a cost.

**Try it:** Add `console.log` inside a heavy `useMemo` callback. Toggle unrelated UI state and confirm the log does not run until `rows`, `sortKey`, or `filterText` change.

---

### Lesson 17. `useCallback` for stable function references

**Takeaway:** `useCallback` returns a memoized function identity, recomputing the function only when dependencies change. It helps prevent unnecessary re-renders of memoized children that compare props by reference.

**Explain:** Inline arrow functions in JSX create a **new function every render**. Usually that is fine. When a memoized child treats a callback prop as a dependency, stabilize it with `useCallback`.

```jsx
import { memo, useCallback, useState } from "react";

const Row = memo(function Row({ item, onSelect }) {
  console.log("Row render", item.id);
  return (
    <tr onClick={() => onSelect(item.id)}>
      <td>{item.label}</td>
    </tr>
  );
});

function Table({ items }) {
  const [selectedId, setSelectedId] = useState(null);

  const handleSelect = useCallback((id) => {
    setSelectedId(id);
  }, []); // stable — setSelectedId identity is stable

  return (
    <table>
      <tbody>
        {items.map((item) => (
          <Row key={item.id} item={item} onSelect={handleSelect} />
        ))}
      </tbody>
    </table>
  );
}
```

`useCallback(fn, deps)` is equivalent to `useMemo(() => fn, deps)`. Do not wrap every handler — only those passed to optimized children or listed in other hooks' dependency arrays.

**Tip:** Fix render performance by component structure first (splitting, lifting memo boundaries). Reach for `useCallback` when profiling shows avoidable child renders.

**Try it:** Remove `useCallback` and `memo` from the example above, click unrelated state in `Table`, and watch all rows re-render in the console. Re-add optimizations and compare.

---

### Lesson 18. `useReducer` for complex state transitions

**Takeaway:** `useReducer` models state as `(state, action) => newState`. Prefer it when the next state depends on multiple fields, previous state, or a sequence of discrete event types.

**Explain:** It mirrors Redux-style updates without leaving the component. Dispatch actions as plain objects; the reducer must stay pure.

```jsx
const initialState = { status: "idle", data: null, error: null };

function fetchReducer(state, action) {
  switch (action.type) {
    case "fetch/start":
      return { ...state, status: "loading", error: null };
    case "fetch/success":
      return { status: "success", data: action.payload, error: null };
    case "fetch/error":
      return { status: "error", data: null, error: action.payload };
    case "reset":
      return initialState;
    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
}

function UserProfile({ userId }) {
  const [state, dispatch] = useReducer(fetchReducer, initialState);

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: "fetch/start" });

    fetchUser(userId)
      .then((data) => {
        if (!cancelled) dispatch({ type: "fetch/success", payload: data });
      })
      .catch((err) => {
        if (!cancelled) dispatch({ type: "fetch/error", payload: err.message });
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (state.status === "loading") return <p>Loading…</p>;
  if (state.status === "error") return <p>Error: {state.error}</p>;
  return <pre>{JSON.stringify(state.data, null, 2)}</pre>;
}
```

You can pass a third argument to `useReducer` for lazy initialization: `useReducer(reducer, initialArg, initFn)`.

**Tip:** Colocate action types as constants or a small object map. For app-wide complex state, consider Zustand or Redux Toolkit instead of giant local reducers.

**Try it:** Rewrite a multi-field form with a dozen `useState` calls into one `useReducer` with actions like `SET_FIELD`, `SUBMIT_START`, and `SUBMIT_ERROR`.

---

### Lesson 19. `useReducer` vs `useState` and combining with context

**Takeaway:** Start with `useState` until updates become hard to reason about — then switch to `useReducer`. Pair `useReducer` with Context to distribute dispatch without prop drilling.

**Explain:** `useState` is simpler for independent values. `useReducer` shines when actions are enumerated and transitions are testable in isolation.

```jsx
function cartReducer(state, action) {
  switch (action.type) {
    case "add": {
      const existing = state.items.find((i) => i.id === action.item.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === action.item.id
              ? { ...i, qty: i.qty + 1 }
              : i
          ),
        };
      }
      return { items: [...state.items, { ...action.item, qty: 1 }] };
    }
    case "remove":
      return {
        items: state.items.filter((i) => i.id !== action.id),
      };
    default:
      return state;
  }
}

const CartContext = createContext(null);

function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
```

Export a custom hook `useCart()` that reads context and throws if used outside the provider — a pattern you'll refine in Lesson 20.

**Tip:** Keep reducer logic in its own file and unit-test it without React — reducers are pure functions.

**Try it:** Test `cartReducer` with a table of `[previousState, action, expectedState]` cases in Vitest or Jest without rendering any components.

---

### Lesson 20. `useContext` for avoiding prop drilling

**Takeaway:** Context passes a value to all descendants that call `useContext`, skipping intermediate components. It is for **global-ish** data (theme, locale, auth session) — not a replacement for every prop.

**Explain:** Create context with `createContext(defaultValue)`, provide with `<Context.Provider value={...}>`, consume with `useContext`. Changing the `value` re-renders all consuming components unless you split contexts or memoize carefully.

```jsx
import { createContext, useContext, useMemo, useState } from "react";

const ThemeContext = createContext("light");

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");

  const value = useMemo(
    () => ({ theme, setTheme, isDark: theme === "dark" }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

function ThemeToggle() {
  const { theme, setTheme, isDark } = useTheme();

  return (
    <button onClick={() => setTheme(isDark ? "light" : "dark")}>
      Current: {theme}
    </button>
  );
}
```

Split **state** and **dispatch** into separate contexts if consumers only need dispatch and should not re-render on state changes.

**Tip:** Default context values are fallbacks for components rendered without a provider — useful in tests, dangerous in production if they hide missing providers.

**Try it:** Wrap your app in `ThemeProvider` and style components with `isDark` from `useTheme`. Confirm intermediate layout components do not pass theme props manually.

---

## Lists & keys, forms

### Lesson 21. Rendering lists and choosing keys

**Takeaway:** Transform arrays to elements with `.map()`. Keys must identify each sibling stably across inserts, deletes, and reorders — prefer database IDs over array indices for dynamic lists.

**Explain:** React uses keys during reconciliation to match old and new element instances. Wrong keys cause lost focus, wrong animation, and preserved state attached to the wrong row.

```jsx
function TodoApp() {
  const [todos, setTodos] = useState([
    { id: "a1", text: "Learn JSX", done: false },
    { id: "b2", text: "Learn hooks", done: false },
  ]);

  function toggle(id) {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, done: !todo.done } : todo
      )
    );
  }

  return (
    <ul>
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} onToggle={() => toggle(todo.id)} />
      ))}
    </ul>
  );
}

function TodoItem({ todo, onToggle }) {
  return (
    <li>
      <label>
        <input type="checkbox" checked={todo.done} onChange={onToggle} />
        {todo.text}
      </label>
    </li>
  );
}
```

Never `key={Math.random()}` — keys must be stable for a given item across renders.

**Tip:** If items lack IDs, generate stable IDs when creating them (`crypto.randomUUID()`), not at render time.

**Try it:** Build a list with checkboxes. Reorder items with drag-and-drop or up/down buttons. Compare behavior using `key={id}` vs `key={index}` when toggling checkboxes before reordering.

---

### Lesson 22. Forms: controlled inputs, validation, and submission

**Takeaway:** Controlled forms store field values in React state, validate on change or submit, and call `preventDefault()` on submit. Group related fields in one state object or `useReducer` for larger forms.

**Explain:** Native form submission reloads the page; React apps intercept submit, validate, then call APIs or update client state.

```jsx
function LoginForm({ onSubmit }) {
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});

  function validate(v) {
    const next = {};
    if (!v.email.includes("@")) next.email = "Enter a valid email";
    if (v.password.length < 8) next.password = "At least 8 characters";
    return next;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      onSubmit(values);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label>
        Email
        <input name="email" value={values.email} onChange={handleChange} />
        {errors.email && <span role="alert">{errors.email}</span>}
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          value={values.password}
          onChange={handleChange}
        />
        {errors.password && <span role="alert">{errors.password}</span>}
      </label>
      <button type="submit">Sign in</button>
    </form>
  );
}
```

For large forms, libraries like React Hook Form reduce re-renders by registering uncontrolled inputs — learn controlled forms first to understand the underlying model.

**Tip:** Associate errors with `aria-invalid` and `aria-describedby` for accessible forms.

**Try it:** Add a "confirm password" field with cross-field validation that only runs on submit, and disable the submit button while `status === "submitting"`.

---

### Lesson 23. Uncontrolled forms, refs, and file inputs

**Takeaway:** Uncontrolled inputs keep values in the DOM. Use refs to read values on submit — ideal for simple forms, file pickers, and integrating non-React widgets.

**Explain:** File inputs cannot be controlled by setting `value` for security reasons. Refs bridge imperative DOM APIs into React.

```jsx
import { useRef } from "react";

function AvatarUpload({ onUpload }) {
  const fileRef = useRef(null);

  function handleSubmit(e) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (file) onUpload(file);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input ref={fileRef} type="file" accept="image/*" />
      <button type="submit">Upload</button>
    </form>
  );
}

function QuickNoteForm({ onSave }) {
  const textRef = useRef(null);

  function handleSave() {
    const text = textRef.current?.value?.trim() ?? "";
    if (text) {
      onSave(text);
      textRef.current.value = "";
    }
  }

  return (
    <>
      <textarea ref={textRef} placeholder="Jot a note…" rows={3} />
      <button type="button" onClick={handleSave}>Save</button>
    </>
  );
}
```

React 19 adds ref-as-prop on function components, reducing `forwardRef` boilerplate (Lesson 30).

**Tip:** Reset uncontrolled fields by resetting the form element: `formRef.current.reset()`.

**Try it:** Build a feedback form with uncontrolled name/email fields read on submit, plus a controlled star-rating component — mix both styles where each fits best.

---

## Composition patterns

### Lesson 24. `children` and compound components

**Takeaway:** Composition beats configuration. Instead of dozens of boolean props (`showHeader`, `showFooter`), nest components and use `children` or small compound subcomponents (`Card.Header`, `Card.Body`).

**Explain:** Compound components share implicit state via context while presenting a flexible JSX API.

```jsx
const TabsContext = createContext(null);

function Tabs({ value, onChange, children }) {
  return (
    <TabsContext.Provider value={{ value, onChange }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
}

Tabs.List = function TabsList({ children }) {
  return <div role="tablist">{children}</div>;
};

Tabs.Tab = function Tab({ id, children }) {
  const { value, onChange } = useContext(TabsContext);
  const selected = value === id;
  return (
    <button
      role="tab"
      aria-selected={selected}
      onClick={() => onChange(id)}
    >
      {children}
    </button>
  );
};

Tabs.Panel = function TabPanel({ id, children }) {
  const { value } = useContext(TabsContext);
  if (value !== id) return null;
  return <div role="tabpanel">{children}</div>;
};

// Usage:
// <Tabs value={tab} onChange={setTab}>
//   <Tabs.List>
//     <Tabs.Tab id="a">General</Tabs.Tab>
//     <Tabs.Tab id="b">Security</Tabs.Tab>
//   </Tabs.List>
//   <Tabs.Panel id="a">…</Tabs.Panel>
//   <Tabs.Panel id="b">…</Tabs.Panel>
// </Tabs>
```

**Tip:** Static subcomponents (`Tabs.List`) document structure in JSX and avoid invalid combinations at a glance.

**Try it:** Refactor a prop-heavy `Modal` (`title`, `body`, `footer`, `size`, `closable`) into composable `Modal`, `Modal.Header`, `Modal.Body`, and `Modal.Footer` parts.

---

### Lesson 25. Render props and inversion of control

**Takeaway:** A **render prop** is a function prop that lets a parent component delegate *what* to render while the child owns *when* and *what data* to expose. It inverts control for flexible UI.

**Explain:** Before hooks, render props shared logic widely. They remain useful for headless components and cross-cutting concerns.

```jsx
function MouseTracker({ render }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    function handleMove(e) {
      setPos({ x: e.clientX, y: e.clientY });
    }
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return render(pos);
}

function App() {
  return (
    <MouseTracker
      render={({ x, y }) => (
        <p style={{ position: "fixed", top: y, left: x }}>
          Cursor: {x}, {y}
        </p>
      )}
    />
  );
}

// Same idea as children-as-function:
// <MouseTracker>{(pos) => <Crosshair {...pos} />}</MouseTracker>
```

Custom hooks often replace render props today (`useMousePosition`), but headless UI libraries still expose render-prop or slot APIs for maximum flexibility.

**Tip:** Name render props `renderX` or use `children` as a function — be consistent within your design system.

**Try it:** Implement a `DataLoader` component that accepts `url` and `children(status, data)` and handles loading/error/success states internally.

---

### Lesson 26. Lifting content with `portal` and layout composition

**Takeaway:** `createPortal` renders children into a different DOM node (often `document.body`) while preserving React tree context — essential for modals, tooltips, and toasts. Layout composition nests shells without prop explosion.

**Explain:** Portals solve z-index and overflow clipping. Event bubbling still follows the React tree, not the DOM tree.

```jsx
import { createPortal } from "react-dom";

function Modal({ open, onClose, children }) {
  if (!open) return null;

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button className="modal__close" onClick={onClose} aria-label="Close">
          ×
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}

function AppShell({ sidebar, header, children }) {
  return (
    <div className="shell">
      <aside>{sidebar}</aside>
      <div className="shell__main">
        <header>{header}</header>
        <main>{children}</main>
      </div>
    </div>
  );
}
```

Compose pages by slotting regions: `<AppShell sidebar={<Nav />} header={<TopBar />}>…</AppShell>`.

**Tip:** Trap focus and restore it on close for accessible modals. Consider `@radix-ui/react-dialog` or similar battle-tested primitives.

**Try it:** Open a modal from a deeply nested button via portal. Confirm theme context still applies inside the modal even though the DOM node is under `body`.

---

## Performance & memo

### Lesson 27. `React.memo` and when memoization helps

**Takeaway:** `React.memo` skips re-rendering a component if props are shallowly equal to the previous render. It helps when a child is expensive and often receives identical props while siblings update frequently.

**Explain:** Memoization is a narrow tool. Profile first, then wrap leaf components that render large subtrees or heavy lists.

```jsx
import { memo, useState } from "react";

const HeavyChart = memo(function HeavyChart({ data, width, height }) {
  console.log("HeavyChart render");
  // imagine D3 or canvas work here
  return <svg width={width} height={height}>{/* … */}</svg>;
});

function Dashboard() {
  const [filter, setFilter] = useState("");
  const [data] = useState(() => generateLargeDataset());

  return (
    <div>
      <input value={filter} onChange={(e) => setFilter(e.target.value)} />
      {/* Chart ignores filter — memo avoids re-render on every keystroke */}
      <HeavyChart data={data} width={600} height={400} />
      <FilteredTable data={data} filter={filter} />
    </div>
  );
}
```

Custom compare function as second argument: `memo(Component, (prev, next) => prev.id === next.id)`.

**Tip:** Passing new object/array literals as props (`style={{}}`) defeats `memo`. Stabilize with `useMemo` or move constants outside the component.

**Try it:** Wrap a chart component in `memo`, type in a sibling input, and count renders with and without inline object props passed to the chart.

---

### Lesson 28. Code splitting, lazy loading, and virtualization

**Takeaway:** Split bundles with `React.lazy` and `Suspense` so users download code when needed. Virtualize long lists so React renders only visible rows.

**Explain:** Route-level splitting is the highest-impact default. List virtualization (react-window, TanStack Virtual) handles thousands of items by rendering a window of DOM nodes.

```jsx
import { lazy, Suspense, useState } from "react";

const AdminPanel = lazy(() => import("./AdminPanel"));

function App() {
  const [route, setRoute] = useState("home");

  return (
    <div>
      <nav>
        <button onClick={() => setRoute("home")}>Home</button>
        <button onClick={() => setRoute("admin")}>Admin</button>
      </nav>
      <Suspense fallback={<p>Loading module…</p>}>
        {route === "admin" ? <AdminPanel /> : <HomePage />}
      </Suspense>
    </div>
  );
}

// Virtual list sketch (conceptual API):
// <FixedSizeList height={400} itemCount={items.length} itemSize={36}>
//   {({ index, style }) => <Row style={style} item={items[index]} />}
// </FixedSizeList>
```

**Suspense** boundaries catch lazy components and data loaders (with supporting frameworks). Place fallbacks at meaningful UI granularity — skeleton cards, not one global spinner for the entire app.

**Tip:** Measure Largest Contentful Paint and bundle size in Lighthouse after adding lazy routes. Split at route boundaries first, then heavy modals or charts.

**Try it:** Lazy-load a heavy chart library only when a "Show analytics" tab is selected. Observe the separate chunk in Network DevTools.

---

## React 19 basics

### Lesson 29. Actions, `useActionState`, and pending UI

**Takeaway:** React 19 formalizes **Actions** — async functions passed to forms or called from transitions that handle pending state, errors, and optimistic updates. `useActionState` wraps an action with state returned to the component.

**Explain:** Actions integrate with `useTransition` semantics: the UI can show pending feedback while an async operation runs, without manual `isLoading` boilerplate in every form.

```jsx
import { useActionState } from "react";

async function subscribe(prevState, formData) {
  const email = formData.get("email");
  if (!email || !String(email).includes("@")) {
    return { ok: false, message: "Valid email required" };
  }

  try {
    await fetch("/api/subscribe", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    return { ok: true, message: "Subscribed!" };
  } catch {
    return { ok: false, message: "Network error — try again" };
  }
}

function NewsletterForm() {
  const [state, formAction, isPending] = useActionState(subscribe, {
    ok: null,
    message: "",
  });

  return (
    <form action={formAction}>
      <input name="email" type="email" placeholder="you@example.com" />
      <button disabled={isPending}>
        {isPending ? "Subscribing…" : "Subscribe"}
      </button>
      {state.message && (
        <p role="status">{state.message}</p>
      )}
    </form>
  );
}
```

Server Components in frameworks like Next.js extend this model — actions can run on the server. In client-only Vite apps, actions still improve form state ergonomics.

**Tip:** Reset form fields after successful actions with `formRef.current.reset()` or keyed remounts (`key={state.ok}`).

**Try it:** Convert a manual `useState` loading flag form to `useActionState`. Handle validation errors returned from the action without separate `errors` state.

---

### Lesson 30. `use`, ref as prop, and Document Metadata

**Takeaway:** React 19 adds `use(promise)` for reading promises in render (with Suspense), allows `ref` as a regular prop on function components, and supports `<title>`, `<meta>`, and `<link>` anywhere in the tree for document head management.

**Explain:** These features reduce boilerplate and align client React closer to full-stack patterns.

```jsx
import { Suspense, use, useState } from "react";

// ref as prop — no forwardRef required
function TextInput({ ref, label, ...props }) {
  return (
    <label>
      {label}
      <input ref={ref} {...props} />
    </label>
  );
}

function UserDetails({ userPromise }) {
  const user = use(userPromise); // suspends until promise resolves
  return (
    <>
      <title>{user.name} — Profile</title>
      <meta name="description" content={user.bio} />
      <h1>{user.name}</h1>
      <p>{user.bio}</p>
    </>
  );
}

function ProfilePage({ fetchUser }) {
  const [userPromise] = useState(() => fetchUser());

  return (
    <Suspense fallback={<p>Loading profile…</p>}>
      <UserDetails userPromise={userPromise} />
    </Suspense>
  );
}
```

`use` can also read context conditionally — unlike `useContext`, which must be unconditional — but still follow hook rules for production code paths.

**Tip:** Prefer established data libraries (TanStack Query) until Suspense + `use` patterns are stable in your stack. Adopt ref-as-prop when upgrading component libraries to React 19.

**Try it:** Refactor a `forwardRef` input wrapper to accept `ref` as a prop. Add a `<title>` inside a nested component and confirm it updates `document.title` when data loads.

---

## TypeScript patterns

### Lesson 31. Typing components, props, and events

**Takeaway:** TypeScript catches prop mismatches at compile time. Define props with interfaces or type aliases, type `children` explicitly, and use React's event types for handlers.

**Explain:** For function components, annotate props on the parameter object. Export prop types so consumers and Storybook stories stay in sync.

```tsx
import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  useState,
} from "react";

interface SearchFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  children?: ReactNode;
}

function SearchField({
  label,
  value,
  onChange,
  placeholder,
  children,
}: SearchFieldProps) {
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value);
  }

  return (
    <label>
      {label}
      <input value={value} onChange={handleChange} placeholder={placeholder} />
      {children}
    </label>
  );
}

interface FormValues {
  query: string;
}

function SearchForm({ onSearch }: { onSearch: (query: string) => void }) {
  const [values, setValues] = useState<FormValues>({ query: "" });

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSearch(values.query);
  }

  return (
    <form onSubmit={handleSubmit}>
      <SearchField
        label="Search"
        value={values.query}
        onChange={(query) => setValues({ query })}
      />
      <button type="submit">Go</button>
    </form>
  );
}
```

Use `ComponentPropsWithoutRef<"button">` to extend native elements. Prefer `interface` for public component APIs; use `type` for unions and utility compositions.

**Tip:** Enable `strict` in `tsconfig.json`. Use `satisfies` for config objects that must infer narrow literals while checking shape.

**Try it:** Convert a JavaScript component with PropTypes to TypeScript. Fix intentional prop typos and confirm the compiler catches them before runtime.

---

### Lesson 32. Typing hooks, generics, and discriminated unions

**Takeaway:** Type custom hooks' return values explicitly. Use generics for reusable components (`List<T>`). Model async UI state with **discriminated unions** so TypeScript narrows fields correctly in each branch.

**Explain:** Discriminated unions eliminate optional chaining soup for loading/error/success states.

```tsx
type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: string };

interface User {
  id: string;
  name: string;
}

function useUser(userId: string): AsyncState<User> {
  const [state, setState] = useState<AsyncState<User>>({ status: "idle" });

  useEffect(() => {
    setState({ status: "loading" });
    fetchUser(userId)
      .then((data) => setState({ status: "success", data }))
      .catch((err: unknown) =>
        setState({
          status: "error",
          error: err instanceof Error ? err.message : "Unknown error",
        })
      );
  }, [userId]);

  return state;
}

function UserCard({ userId }: { userId: string }) {
  const state = useUser(userId);

  switch (state.status) {
    case "idle":
    case "loading":
      return <p>Loading…</p>;
    case "error":
      return <p role="alert">{state.error}</p>;
    case "success":
      return <h2>{state.data.name}</h2>; // `data` is narrowed to User
  }
}

interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return <ul>{items.map((item) => <li key={keyExtractor(item)}>{renderItem(item)}</li>)}</ul>;
}
```

For context, use `createContext<T | null>(null)` and a type guard in the consumer hook. For `useReducer`, type actions as a discriminated union and infer state from the reducer return type.

**Tip:** Reach for `@types/react` and `@types/react-dom` versions matching your React major version. Run `tsc --noEmit` in CI to prevent prop drift.

**Try it:** Type a `useFetch<T>(url)` hook returning `AsyncState<T>`. Build a `List<User>` that only compiles when `renderItem` receives a `User`. Intentionally access `data` in the error branch and fix the compiler error with proper narrowing.

---

*End of React Learning Notes — 32 lessons from JSX fundamentals through React 19 and TypeScript patterns. Next steps: build a small project (todo app → dashboard with routing and data fetching), then explore a meta-framework (Next.js or Remix) and a headless component library (Radix UI).*
