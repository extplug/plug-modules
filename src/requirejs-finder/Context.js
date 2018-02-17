import { difference, values } from 'underscore';
import originalModuleName from './originalModuleName';
import rewrittenModuleName from './rewrittenModuleName';

// Extract the "namespace"/dirname from a full module name.
const getNamespace = full => full.substr(0, full.lastIndexOf('/'));

/**
 * The Context keeps track of the long names, and provides some convenience methods
 * for working with renamed modules.
 */
export default class Context {
  constructor(target) {
    this._nameMapping = {};
    this._notFound = [];
    this._detectives = {};
    this._ran = false;

    this.target = target
    if (!target) try {
      this.target = requirejs.s.contexts._.defined;
    } catch (e) {
      this.target = null;
    }

    if (this.target) {
      Object.keys(this.target).forEach(key => {
        if (this.target[key]) {
          this.target[key][originalModuleName] = key;
        }
      });
    }
  }

  // adds a Detective to this context. these detectives will
  // be run by Context#run.
  add(name, getter) {
    this._detectives[name] = {
      getName: getter,
      ran: false
    };
    return this;
  }
  // runs all known detectives.
  run() {
    if (this._ran) {
      return this;
    }

    Object.keys(this._detectives).forEach(this.require, this);

    this._ran = true;
    return this;
  }

  findModule(name) {
    const detective = this._detectives[name];
    if (detective && !detective.ran) {
      const moduleName = detective.getName(this);
      if (moduleName) {
        this.define(name, moduleName);
        detective.ran = true;
        return this.require(name);
      }
      detective.ran = true;
    }
  }

  resolveName(path) {
    return this._nameMapping[path] ? this.resolveName(this._nameMapping[path]) : path;
  }

  require(path) {
    if (this.target[path]) {
      return this.target[path];
    }
    // known module
    if (this._nameMapping[path]) {
      var mod = this.require(this._nameMapping[path])
      if (mod) {
        return mod;
      }
    }
    return this.findModule(path);
  }

  isDefined(path) {
    return typeof this.require(path) !== 'undefined';
  }

  define(newPath, oldPath) {
    this._nameMapping[newPath] = oldPath;
    const mod = this.require(oldPath);
    if (mod) {
      mod[rewrittenModuleName] = newPath;
    }
    return this;
  }

  setNotFound(path) {
    this._notFound.push(path);
  }

  getUnknownModules() {
    const knownModules = values(this._nameMapping);
    const allModules = Object.keys(this.target).filter(moduleName => (
      moduleName.substr(0, 5) !== 'plug/' &&
        moduleName.substr(0, 4) !== 'hbs!' &&
        this.require(moduleName) !== undefined
    ), this);

    return difference(allModules, knownModules);
  }

  isInSameNamespace(name, otherModuleName) {
    const otherName = this.resolveName(otherModuleName);
    return otherName &&
      otherName.substr(0, otherName.lastIndexOf('/')) === name.substr(0, name.lastIndexOf('/'));
  }

  // Add the new names to the global module registry
  register() {
    Object.keys(this._nameMapping).forEach(newName => {
      this.target[newName] = this.require(newName);
    });
  }

  // require.js loader API.
  load(name, req, cb, config) {
    const result = this.require(name);
    if (result) {
      cb(result);
    } else {
      cb.error(new Error(`module "${name}" not found`));
    }
  }
}
