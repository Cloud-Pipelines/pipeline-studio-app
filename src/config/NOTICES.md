# Host notice source

Tangle UI renders notices — as banners at the top of the page, and in the notice
inbox — from a source the **host page** installs on `window`. There is no default
source: with nothing installed, the UI shows nothing and behaves exactly as it
did before this contract existed.

## Installing a source

```js
window.__TANGLE_NOTICE_SOURCE__ = {
  version: 1,
  getSnapshot: () => notices,
  subscribe: (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  refresh: () => fetchNotices(),
};

window.dispatchEvent(new CustomEvent("tangle:notice-source"));
```

**The event is required.** The UI subscribes as soon as it mounts, which may be
before the source exists. `tangle:notice-source` is what tells it to (re)bind, so
a host that assigns the global without dispatching never shows a notice.
Dispatching again after replacing the global is safe and rebinds.

| Member        | Required | Notes                                                                |
| ------------- | -------- | -------------------------------------------------------------------- |
| `version`     | yes      | Must be exactly `1`. Anything else is ignored wholesale.             |
| `getSnapshot` | yes      | Called on every render of every subscriber — must be cheap and pure. |
| `subscribe`   | yes      | Returns an unsubscribe function. A non-function return is tolerated. |
| `refresh`     | no       | Called when the tab regains visibility.                              |

## Notice shape

```ts
{
  id: string,          // required; a finite number is coerced to a string
  title?: string,      // at least one of title / body must be non-blank
  body?: string,       // Markdown, rendered as untrusted input
  variant?: "info" | "warning" | "success" | "error",   // default "info"
  dismissible?: true,  // only the literal `true` counts
  action?: { url: string, text?: string }               // absolute http(s) only
}
```

Everything is validated at the boundary and the UI never throws on bad input.
Entries that fail validation are dropped silently, as are actions whose `url` is
not absolute `http(s)`. Duplicate ids collapse to the first occurrence, and at
most 20 notices are read per snapshot.

`getSnapshot` may return a freshly built array on every call — the UI compares
content and hands subscribers a stable reference, so this will not loop. The
returned notices are frozen; mutating them is not a supported way to update the
UI. Publish new data and notify instead.
