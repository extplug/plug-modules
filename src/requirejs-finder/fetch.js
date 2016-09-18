import originalModuleName from './originalModuleName';

export default function fetch(fn) {
  return context => {
    const module = fn(context);
    if (module) return module[originalModuleName];
  };
}
