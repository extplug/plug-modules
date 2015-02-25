# plug-modules

Maps plug.dj defined modules to reasonable names, so you can more easily access internal plug.dj javascript.

After applying this script, you can access plug.dj modules like:

```javascript
var SubClass = require('plug/core/Class').extend({ /* class definition */ });

require('plug/core/Events').trigger('notify', 'icon-plug-dj', 'Notification text');
```

Or make yourself an admin locally:

```javascript
var currentUser = require('plug/models/currentUser');
currentUser.set('gRole', 5);
```

`require()` modules in your browser's developer console or use [replug](https://github.com/PlugLynn/replug) to figure out what the different modules are for, and what you can do with/to them.

## Warning!

Plug.dj's internal JavaScript is *not* meant to be a public API. It changes a lot! Modules that you used yesterday, may not exist tomorrow, so make sure to code very defensively and to fall back as best you can.

## How It Works

`plug-modules` contains several hundred "Detectives" who find different modules by duck-typing.
They then associate those modules with a descriptive and readable name each.
You can call `plugModules.register()` to inject all those names back into require.js, so you can use the global `require()` function on plug.dj.
Alternatively, you can use `plugModules.require()` if you don't want to contaminate the global module-space.