export default typeof Symbol === 'undefined'
  ? `__${Math.random()}rewritten module name`
  : Symbol('rewritten module name');
