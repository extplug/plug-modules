import originalModuleName from './originalModuleName';

/**
 * Create a matcher from a function that simply returns the module.
 */
export default function fetch(fn) {
  return context => {
    const module = fn(context);
    if (module) return module[originalModuleName];
  };
}
