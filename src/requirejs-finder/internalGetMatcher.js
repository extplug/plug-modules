/**
 * Used to reach into matcher functions.
 */
export default typeof Symbol === 'undefined'
  ? `__${Math.random()}internal matcher function`
  : Symbol('internal matcher function');
