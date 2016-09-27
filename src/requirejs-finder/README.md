# requirejs-finder

Library for finding require.js modules by duck-typing instead of by name.

```js
import { Context, match } from './requirejs-finder';

const context = new Context();

context.add(
  'plug/core/Events',
  match(m => m.dispatch && m.dispatch.length === 1)
);

const Events = context.require('plug/core/Events');
```

## Resolver utils

Resolvers are functions that find modules. They receive a single parameter:

 - `context` - The Context instance.

Below are several utilities to create resolvers.

### match(fn)

Find a module that matches a function. `fn` is called on each module, until it
returns `true`.

`fn` receives three parameters:

 - `module` - The module itself.
 - `name` - The original module name.
 - `context` - The Context instance.

```js
const resolver = match(m =>
  m instanceof Backbone.View && m.className.includes('interesting-view')
);
```

### both(matcher, matcher)

Find a module that matches two matchers.

```js
const resolver = both(
  match(m => m.hasOwnProperty('a')),
  match(m => m.hasOwnProperty('b'))
);
```

### fetch(fn)

Find a module directly. Should return the module. This is generally only useful
when combined with `depends`, for modules that aren't easy to distinguish with a
matcher.

### depends(deps, fn)

Create dependencies. Modules listed in `deps` will be resolved first and passed
to `fn`. `fn` should return a resolver function.

```js
// Fetch the room history collection by getting it from another module's
// prototype. The other module has to resolve first.
const resolver = depends(['plug/handlers/RoomHistoryHandler'], RoomHistoryHandler =>
  fetch(() => RoomHistoryHandler.prototype.collection)
);
```

### before(setup)

Run some code before running the resolver function. Returns a function that
decorates a resolver function.

```js
const resolver = before(() => { /* some setup here */ })(
  match(m => /* match */)
);
```

### after(teardown)

Run some code after running the resolver function. Returns a function that
decorates a resolver function.

`teardown` receives a single parameter:

 - `resolvedModule` - The module returned from the resolver function.

```js
const resolver = after((resolvedModule) => { /* some teardown here */ })(
  match(m => /* match */)
);
```

Usually you'll want to use `before` and `after` together. You can do so by
composing functions, eg. using underscore:

```js
const resolver = _.compose(
  match(m => /* something */),
  before(() => /* some setup */),
  after(() => /* teardown */)
);
```
