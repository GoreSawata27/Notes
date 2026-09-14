# Forms & Actions

How React 19 forms actually work: `action` as a function, `useActionState`, pending buttons, optimistic UI, and validation — including what is React vs a framework.

## Profile

Core APIs were introduced in [React 19](/notes/learn/react/react-19). This chapter is the **forms playbook** with three distinct product examples per idea. Server Functions need a bundler — labeled **[RSC]** / **[framework]**.

---

## Form Actions

### Lesson 1. A form action can be a function [React 19]

**Takeaway:** Introduced in: React 19. `<form action={fn}>` runs `fn(formData)` as an **Action**. Progressive enhancement: without JavaScript, a **server** action URL can still submit; with JS, React intercepts and stays on the page.

**Explain:**
HTML always had `action="/url"` and `method="POST"`. React 19 lets `action` be a **function**.

```jsx
async function createTicket(formData) {
  const title = formData.get("title");
  await api.tickets.create({ title });
}

function TicketForm() {
  return (
    <form action={createTicket}>
      <input name="title" required />
      <button type="submit">Open ticket</button>
    </form>
  );
}
```

No `onSubmit`, no `preventDefault` for the happy path. Inputs can stay **uncontrolled** (`name=`) which is how `FormData` works.

### Why it was introduced?

Controlled forms + `useState` for every field + pending + error is a lot of React for what HTML already modeled. Actions reconnect React to **native forms**.

### Before React 19

```jsx
const [title, setTitle] = useState("");
const [pending, setPending] = useState(false);

async function onSubmit(e) {
  e.preventDefault();
  setPending(true);
  await api.tickets.create({ title });
  setPending(false);
  setTitle("");
}
```

### With Form Actions

The browser builds `FormData`. React runs the function as a transition. Empty the form yourself on success if you need to (or use `useActionState` to reset).

### How it works

1. User submits.
2. React calls your function with `FormData` (and, with `useActionState`, previous state).
3. `useFormStatus` in children sees `pending`.
4. If this is a **Server Function**, the bundler POSTs to a server endpoint **[framework]**. If it is a client function, it just `await`s your `fetch`.

### Real-world examples

**1. Support ticket (SaaS)** — title + body, uncontrolled fields, `action={createTicket}`.

**2. Newsletter footer** — email only; works even before JS if you point `action` at a real URL **and** a server.

**3. Admin “rename project”** — one field modal form; pending disables Save via `useFormStatus`.

### When should I use function actions?

Mutations from forms. Especially with `useActionState` for error text.

### When should I NOT?

Instant search filters (not a mutation). Complex wizards that are 100% controlled and already built — you can migrate incrementally.

### Common mistakes

- Missing `name` attributes
- Putting `action` on a `<div>` (must be `<form>`)
- `button` without `type="submit"` inside nested buttons

### Related APIs

`useActionState`, `useFormStatus`, HTML `formAction` on a button (per-button actions)

### Interview notes

- `action` can be a function in 19.
- Uncontrolled + `FormData` is the native path.
- Server Functions are extra (framework).

**Tip:** A second button can have `formAction={saveDraft}` while the form’s `action={publish}`.

**Try it:** Two buttons, Publish vs Draft, different `formAction`s, shared fields.

---

## Async Actions and pending UI

### Lesson 2. Pending UI is built into Actions [React 19]

**Takeaway:** Introduced in: React 19. You should not keep a parallel `useState(false)` for submit pending if you already have an Action.

**Explain:**
Three ways to read pending:

| API | Where |
| --- | --- |
| `useTransition` → `isPending` | You called `startTransition(async () => …)` |
| `useActionState` → third element | Form bound to that hook |
| `useFormStatus` → `pending` | Child of `<form>` |

### Real-world examples

**1. Checkout “Place order”** — `useFormStatus` on the button; spinner; `aria-busy` on the form.

**2. Settings: upload avatar** — `isPending` from `useActionState`; disable file input too (avoid double file send).

**3. Chat: send on Enter** — not a `<form>`? Use `startTransition(async () => send(text))` and disable the composer with `isPending`.

### Validation

Client HTML: `required`, `type="email"`, `minLength`. This runs **before** the Action.

```jsx
<input name="email" type="email" required />
```

Server / Action-level:

```jsx
async function register(prev, formData) {
  const email = String(formData.get("email") || "");
  if (!email.includes("@")) return { error: "Enter a valid email" };
  await api.register(email);
  return { error: null };
}
```

Do both: HTML for instant UX, Action return value for **business** rules (email taken).

### When should I add extra pending state?

When pending is **per-row** in a list (not the whole form). Then a row-level `useTransition` or optimistic flag is clearer than one form status.

**Tip:** `aria-busy={pending}` on the form helps assistive tech.

**Try it:** Double-click submit; confirm the Action does not fire twice while pending (React queues/disables by design for form actions — still `disabled={pending}` for UX).

---

## Optimistic UI in forms

### Lesson 3. Optimistic updates belong next to the Action [React 19]

**Takeaway:** Introduced in: React 19 (`useOptimistic`). For forms, show the **next list** immediately, then let the Action confirm.

**Explain:**
Pattern: `useOptimistic` + form Action.

```jsx
function Todos({ todos, addTodo }) {
  const [optimisticTodos, addOptimistic] = useOptimistic(todos, (current, title) => [
    ...current,
    { id: "tmp", title, sending: true },
  ]);

  async function action(formData) {
    const title = formData.get("title");
    addOptimistic(title);
    await addTodo(title);
  }

  return (
    <>
      <ul>
        {optimisticTodos.map((t) => (
          <li key={t.id} style={{ opacity: t.sending ? 0.6 : 1 }}>
            {t.title}
          </li>
        ))}
      </ul>
      <form action={action}>
        <input name="title" />
        <button>Add</button>
      </form>
    </>
  );
}
```

### Real-world examples

**1. Todo / issue tracker** — new row appears grayed until the server id exists.

**2. Chat composer** — message at the bottom instantly.

**3. E-commerce cart drawer** — qty stepper optimistic; revert if inventory fails.

### When should I NOT be optimistic?

Checkout pay, “delete account”, anything legally/financially sensitive.

### Common mistakes

- Using `Date.now()` as a key that changes on confirm (remounts the row)
- Forgetting the item is `sending` in CSS so users double-add

**Tip:** Keep a stable `tmp` key; when `todos` from the server updates, `useOptimistic` resets to the real list.

**Try it:** Add three todos quickly; fail the second request; confirm only that one disappears.

---

## Validation playbook

### Lesson 4. Combine HTML, Action returns, and (optionally) a schema [React 19]

**Takeaway:** Introduced in: React 19 (Action return values). Validation is not a new hook. It is **where** you put rules.

**Explain:**

| Layer | Good for | Example |
| --- | --- | --- |
| HTML attributes | Format / required | `type="email"`, `min="1"` |
| Action return | Business rules, i18n errors | `{ fieldErrors: { coupon: "Expired" } }` |
| Schema (Zod, etc.) | Shared client/server types | Parse `formData` once |

```jsx
async function checkout(prev, formData) {
  const qty = Number(formData.get("qty"));
  if (qty < 1) return { fieldErrors: { qty: "Minimum 1" }, ok: false };
  try {
    await api.checkout({ qty });
    return { ok: true, fieldErrors: {} };
  } catch (e) {
    return { ok: false, fieldErrors: { form: e.message } };
  }
}
```

Render:

```jsx
{state.fieldErrors.qty ? <p>{state.fieldErrors.qty}</p> : null}
```

### Real-world examples

**1. Coupon field** — HTML cannot know “expired”; Action can.

**2. Signup username uniqueness** — only the server knows.

**3. Quantity vs stock** — Action returns remaining stock error.

### When should I use a full form library?

Huge wizards, multi-step with dependent fields, already-on-React-Hook-Form codebases. React 19 Actions do not obsolete RHF; they obsolete **pending boilerplate** for simple forms.

**Tip:** Map `fieldErrors` with the same `name` as the input for a11y (`aria-invalid`, `aria-describedby`).

**Try it:** Return `{ fieldErrors }` from a fake Action and wire `aria-describedby` to the error id from `useId`.
