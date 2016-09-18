export default function match(fn) {
  return context => {
    const defines = context.target;
    for (const name in defines) if (defines.hasOwnProperty(name)) {
      if (defines[name] && fn(defines[name], name, context)) {
        return name;
      }
    }
  };
}
