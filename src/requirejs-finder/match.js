import internalGetMatcher from './internalGetMatcher';

export default function match(fn) {
  const matcher = (context, action) => {
    const defines = context.target;
    for (const name in defines) if (defines.hasOwnProperty(name)) {
      if (defines[name] && fn(defines[name], name, context)) {
        return name;
      }
    }
  };
  matcher[internalGetMatcher] = fn;
  return matcher;
}
