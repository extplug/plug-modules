import match from './requirejs-finder/match';

export default function matchEvent(name) {
  return match(m => m._name === name);
}
