export default typeof Symbol === 'undefined'
  ? `__${Math.random()}original module name`
  : Symbol('original module name');
