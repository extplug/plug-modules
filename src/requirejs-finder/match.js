import internalGetMatcher from './internalGetMatcher';
import rewrittenModuleName from './rewrittenModuleName';

export default function match(fn) {
  const matcher = (context) => {
    const defines = context.target;
    for (const name in defines) if (defines.hasOwnProperty(name)) {
      // Skip empty modules.
      if (!defines[name]) {
        continue;
      }
      // Skip modules that were already found.
      if (rewrittenModuleName in defines[name]) {
        continue;
      }

      if (fn(defines[name], name, context)) {
        return name;
      }
    }
  };
  matcher[internalGetMatcher] = fn;
  return matcher;
}
