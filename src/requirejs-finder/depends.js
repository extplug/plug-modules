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
