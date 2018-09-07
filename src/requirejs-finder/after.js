/**
 * Run a teardown function after running a matcher.
 */
export default function after(teardown) {
  return fn => context => {
    const result = fn(context);
    teardown(context.require(result), context);
    return result;
  };
}
