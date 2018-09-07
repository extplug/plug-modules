/**
 * Create a matcher function that depends on some other module.
 * This will only match once that dependency is available. The dependencies
 * are passed to the wrapped function as arguments.
 */
export default function depends(paths, fn) {
  const l = paths.length;
  return (context) => {
    const deps = [];
    for (let i = 0; i < l; i++) {
      deps[i] = context.require(paths[i]);
      if (!deps[i]) return;
    }
    return fn(...deps)(context);
  };
}
