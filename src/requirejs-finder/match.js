import internalGetMatcher from './internalGetMatcher';

export default function match(fn) {
  const matcher = (context) => {
    const defines = context.target;
    for (const name in defines) if (defines.hasOwnProperty(name)) {
      // Skip modules that were already found.
      if (rewrittenModuleName in defines[name]) {
        continue;
      }

      if (defines[name] && fn(defines[name], name, context)) {
        return name;
      }
    }
  };
  matcher[internalGetMatcher] = fn;
  return matcher;
}
