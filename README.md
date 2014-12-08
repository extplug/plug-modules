# plug-modules

Maps plug.dj defined modules to reasonable names, so you can more easily access internal plug.dj javascript.

`plug-modules` is just a bunch of module names, and matching functions that duck-type the modules. This way your extensions will keep working even if plug.dj redeploys and changes all their module names.

Take care when using plug.dj internals, as they may change at any point without notice.

After applying this script, you can access plug.dj modules like:

```javascript
var SubClass = require('plug/core/Class').extend({ /* class definition */ });

require('plug/core/Events').trigger('notify', 'icon-plug-dj', 'Notification text');
```

`require()` modules in your browser's developer console to figure out what they do, and what you can do to them.
