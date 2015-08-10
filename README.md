# plug-modules

Maps plug.dj defined modules to reasonable names, so you can more easily
access internal plug.dj javascript.

[![NPM](https://nodei.co/npm/plug-modules.png?downloads)](https://nodei.co/npm/plug-modules)

## Warning!

`plug-modules` makes it easy to use plug.dj's client-side internals.
Remember that plug.dj's internal JavaScript is *not* meant to be a
public API. It changes a lot! Modules that you used yesterday, may not
exist tomorrow, so make sure to code very defensively and to fall back
gracefully.

## Usage

`plug-modules` is available on npm:
```
$ npm install plug-modules
```

You can then use it as a CommonJS module, or an AMD module, or just as
`window.plugModules` when loaded in a `<script>` tag.

Initialise the name mapping using `plugModules.run()`, and then you
can access plug.dj modules like:

```javascript
var SubClass = plugModules.require('plug/core/Class').extend({
  /* class definition */
});

plugModules.require('plug/core/Events')
  .trigger('notify', 'icon-plug-dj', 'Notification text');
```

Or make yourself an admin locally: (Fun fact! This will make plug.dj
log some more debug info to the console :smile: )

```javascript
var currentUser = plugModules.require('plug/models/currentUser');
currentUser.set('gRole', 5);
```

See the Wiki for more examples!

`plugModules.require()` modules in your browser's developer console or
use [replug](https://github.com/PlugLynn/replug) to figure out what the
different modules are for, and what you can do with/to them.

## API

### require.js plugin

`plug-modules` can be used as a require.js plugin:

```javascript
require([ 'plug-modules!plug/core/Events' ], function (Events) {
  Events.trigger('notify', 'icon-plug-dj', 'Hello from plug-modules!');
});
```

### plugModules.run()

Initialises plug-modules and computes all the module name mappings. You
need to run this before using `plugModules.register`. It's done for you
if you're using the require.js plugin.

### plugModules.require(modulename)

Returns a plug.dj module. You can use any of the remapped module names,
as well as original (obfuscated) names.

### plugModules.register()

Defines all the remapped names on the global `require()` object, so you
can use `require()` to access modules via the remapped names, too. In
general, it's better to use `plugModules.require` instead.

### plugModules.isDefined(modulename)

Checks if a module with the given name has been defined. Accepts both
remapped and original module names. Note that a module that actually
equals `undefined` also returns `false`:

```javascript
define('module', function () { return undefined })
plugModules.isDefined('module') === false
```

### plugModules.getUnknownModules()

Returns an array of **original** module names that were *not* remapped.
This is mostly useful for finding more modules to reverse-engineer.
Note that this is only useful if you've run _all_ detectives, otherwise
modules that haven't yet been used won't be remapped.

## How It Works

`plug-modules` contains several hundred "Detectives" who find different
modules by duck-typing. They then associate those modules with a
descriptive and readable name each. You can call
`plugModules.register()` to inject all those names back into require.js,
so you can use the global `require()` function on plug.dj.
Or better, you can use `plugModules.require()` if you don't want to
contaminate the global module-space.
