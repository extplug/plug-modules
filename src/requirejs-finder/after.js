export default function after(teardown) {
  return fn => context => {
    const result = fn(context);
    teardown(context.require(result), context);
    return result;
  };
}
