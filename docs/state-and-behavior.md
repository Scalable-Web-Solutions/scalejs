# State and Behavior

The `<script>` block at the top of a `.scale` file defines the data model and imperative API for the generated component class. During compilation ScaleJS hoists supported declarations, rewrites state references, and emits lifecycle plumbing around them.

## Supported script declarations
Only certain top-level constructs are currently analyzed:

| Pattern                          | Meaning                                                   |
|----------------------------------|-----------------------------------------------------------|
| `export let prop = default;`     | Declares a prop. An accessor is generated and the value reflects to an attribute (with boolean/number coercion). |
| `let internal = value;`          | Declares internal state stored on `this.state.internal`.  |
| `function doThing(...) { ... }`  | Defines an instance method. State identifiers in the body are rewritten to `this.state.*`. Dirty bits are raised automatically. |
| `export const method = () => { ... }` | Also becomes an instance method (arrow or function expression). |

Other statements (imports, arbitrary expressions, top-level awaits) are ignored by the compiler. Keep business logic inside methods.

You can place multiple `<script>` blocks; their contents are concatenated before hoisting.

### Working with state
- In templates, reference props and state by name: `{count}`, `{email}`.
- Inside methods, mutate via plain assignments: `count += 1;` or `user = {...user, name}`. The generator rewrites these to `this.state.count += 1;` and marks the corresponding dirty bit so the UI updates on the next animation frame.
- When you need the current snapshot explicitly, use `const { count } = this.state;`.

### Props and attributes
- Each `export let` produces a property with automatic reflection. Setting `element.quantity = 3` updates the attribute and schedules a render. Updating the attribute triggers the setter with type coercion (numbers, booleans, JSON-like values).
- Property upgrades are handled in the constructor, so you can assign to props before the element is defined.

### Lifecycle methods
Define optional lifecycle handlers as methods:

- `onMount()` runs after the component is connected and the compiled block is mounted. Return a cleanup function to run on destroy.
- `beforeUpdate()` runs before the DOM patch whenever dirty state exists.
- `afterUpdate()` runs after the DOM patch when something changed.
- `onDestroy()` runs during `disconnectedCallback`.

For ad-hoc listeners, register callbacks via helpers that automatically clean up:

```js
this.$onMount(() => {
  const off = this.$listen(window, 'resize', this.handleResize, { raf: true });
  return () => off();
});

this.$beforeUpdate(() => console.log('about to flush'));
this.$afterUpdate(() => console.log('flushed'));
```

Helper registry methods return a disposer you can call manually if needed.

### Event utilities
- `$listen(target, type, handler, { raf, throttle, options })` wraps `addEventListener`, optionally throttling calls or dispatching through `requestAnimationFrame`. Listeners are removed automatically on destroy or when an `AbortSignal` aborts.
- `$bindEvent(target, type, map)` composes `$listen` with state updates. Your `map` function returns a partial state object; keys that correspond to props go through their accessors, other keys update `this.state` directly and set dirty bits.
- `$interval(fn, ms)` / `$timeout(fn, ms)` mirror their browser equivalents with automatic teardown.
- `$debounce(key, fn, ms)` coalesces calls; multiple debounces with the same key reuse the same timer.
- `$watch(keys, fn)` fires after each DOM flush when one of the tracked keys changed. `keys` accepts a string or array, and `fn` receives `(dirtyMask, state)`.

### Scheduler and dirty tracking
All state changes funnel through `_schedule()`, which batches work on the next animation frame. Before patching, derived values are recomputed (see below), `beforeUpdate` hooks run, blocks receive `(dirtyMask, this.state)`, watchers execute, then `afterUpdate` hooks fire.

## Derived state
`compileFile` and the CLI accept a `derived` array that lists computed state values:

```js
compileFile({
  input: 'hero.scale',
  out: 'dist/hero.js',
  tag: 'scale-hero',
  derived: [{ name: 'priceLabel', expr: "`$${(price/100).toFixed(2)}`", deps: ['price'] }]
});
```

Each derived entry recomputes inside `_flush()` with access to `this.state` and raises its dirty bit when the value changes. Use this for cached view models or snapshots derived from props.

## Rendering modes and host attributes
### Shadow vs Light DOM
- Components render into an open Shadow DOM by default.
- Add `light-dom` to the element tag to opt into light DOM rendering. The shell assigns a unique `data-sws` attribute to the host and scopes injected CSS selectors accordingly.

### Intelligems bridge
Add `ig-bridge` to expose a light-DOM mirror that third-party tools can read. The bridge renders hidden nodes containing price, compare-at, and variant fields plus an add-to-cart button. Mutations to those nodes sync back into component state.

## Working from the template
Event handlers declared in markup should call methods defined in `<script>` so that state rewrites and dirty tracking work:

```scale
<button @click={increment()}>Add one</button>

<script>
  let count = 0;
  function increment() {
    count += 1; // rewritten to this.state.count += 1;
  }
</script>
```

Inline statements like `@click={count++}` currently execute in the component context but do not rewrite identifiers, so prefer calling a method or destructuring the needed state (`const { count } = this.state`) before the handler runs.

The compiled instance exposes `this.state`, public methods, and the helper APIs shown above, giving you a predictable mental model for component behavior.
