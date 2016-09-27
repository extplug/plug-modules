// Tests if an object is a Backbone collection of a certain type of Model.
export function isCollectionOf(m, Model) {
  return Model && m instanceof Backbone.Collection && m.model === Model;
}

// Checks if the given module is a plug.dj Dialog view class.
export function isDialog(m) {
  return m.prototype && m.prototype.className && m.prototype.className.indexOf('dialog') !== -1;
}

// Checks if two functions are "kind of similar" by comparing their source.
export function functionsSeemEqual(a, b) {
  // ignore whitespace
  return (a + '').replace(/\s/g, '') === (b + '').replace(/\s/g, '');
}

// Checks if a function's source contains a given string.
export function functionContains(fn, match) {
  return _.isFunction(fn) && fn.toString().indexOf(match) !== -1;
}

// Checks if a given object looks like a Backbone View class.
export function isView(m) {
  return m.prototype && _.isFunction(m.prototype.render) && _.isFunction(m.prototype.$);
}

// Checks if a given Backbone Model class has a defaults property (plug.dj models).
export function hasDefaults(m) {
  return m.prototype && m.prototype.defaults;
}

// Checks if an object has some set of attributes (Backbone models).
export function hasAttributes(m, attributes) {
  return m instanceof Backbone.Model && attributes.every(attr => attr in m.attributes);
}

// Checks if a View template contains an element matching a given CSS selector.
export function viewHasElement(View, sel) {
  const stubEl = $('<div>');
  try {
    const x = new View({ el: stubEl });
    x.render();
    const has = x.$(sel).length > 0;
    x.destroy();
    return has;
  } catch (e) {
    return false;
  }
}
