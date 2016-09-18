import Context from './requirejs-finder/Context';
import match from './requirejs-finder/match';
import modules from './plugModules';

// build default context
const context = new Context();
Object.keys(modules).forEach(name => {
  context.add(name, modules[name]);
});

export default context;

export { modules };

window.PMM = context;
