export default function before(setup) {
  return fn => context => {
    setup(context);
    return fn(context);
  };
}
