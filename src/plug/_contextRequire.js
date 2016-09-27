import Context from '../requirejs-finder/Context';

let target;
try {
  target = window.requirejs.s.contexts._.defined;
} catch (e) {
  throw new Error('Could not find the plug.dj require.js context.');
}

const context = new Context(target);

export default function contextRequire(name, fn) {
  const origPath = fn(context);
  if (!origPath) {
    throw new Error(`Could not find module '${name}'.`);
  }
  return context.define(name, origPath).require(name);
}
