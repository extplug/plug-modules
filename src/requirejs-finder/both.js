export default function both(a, b) {
  return context => {
    return a(context) && b(context);
  };
}
