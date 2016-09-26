import match from './match';
import internalGetMatcher from './internalGetMatcher';

export default function both(getA, getB) {
  const a = getA[internalGetMatcher];
  const b = getB[internalGetMatcher];

  if (!a) {
    throw new Error('both: First argument is not a matcher function');
  }
  if (!b) {
    throw new Error('both: Second argument is not a matcher function');
  }

  return match((m, name, ctx) =>
    a(m, name, ctx) && b(m, name, ctx)
  );
}
