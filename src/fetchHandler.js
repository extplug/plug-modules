import depends from './requirejs-finder/depends'
import fetch from './requirejs-finder/fetch'

export default function fetchHandler(eventName) {
  return depends(
    ['plug/core/EventManager'],
    EventManager => fetch(() => {
      const events = EventManager.eventTypeMap;
      if (!events) return false;
      const eventTypes = events[eventName];
      // Luckily for us, none of the events have multiple handlers at the moment!
      return eventTypes && eventTypes[0];
    })
  );
}
