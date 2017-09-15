import match from './requirejs-finder/match';

export default function matchAction(method, url, regex, params) {
  if (url) {
    return match(m =>
      m.prototype &&
        m.prototype.type === method &&
        m.prototype.route === url
    );
  } else if (regex) {
    return match(m => {
      if (!m.prototype || m.prototype.type !== method) {
        return false;
      }

      const fakeInstance = Object.assign(Object.create(m.prototype), {
        execute() {},
      });
      Object.defineProperty(fakeInstance, '_super', {
        get () {
          return () => {};
        },
        set (fn) {},
      });

      try {
        m.prototype.init.apply(fakeInstance, params || []);
      } catch (e) {
        return false;
      }

      return fakeInstance.route && (
        typeof regex === 'string'
          ? fakeInstance.route.indexOf(regex) === 0
          : regex.test(fakeInstance.route)
      );
    });
  }
}
