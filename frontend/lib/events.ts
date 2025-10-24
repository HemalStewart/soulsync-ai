import { EventEmitter } from 'events';

const events = new EventEmitter();

if (typeof window !== 'undefined') {
  // Limit to avoid memory leak warnings when many listeners mount/unmount.
  events.setMaxListeners(50);
}

export type AppEventMap = {
  'media:generated': {
    type: 'image' | 'video';
    url: string;
    title: string | null;
  };
};

type EventKey = keyof AppEventMap;
type EventPayload<K extends EventKey> = AppEventMap[K];

export const emitAppEvent = <K extends EventKey>(event: K, payload: EventPayload<K>) => {
  events.emit(event, payload);
};

export const subscribeToAppEvent = <K extends EventKey>(
  event: K,
  listener: (payload: EventPayload<K>) => void,
) => {
  events.on(event, listener as (payload: AppEventMap[EventKey]) => void);
  return () => {
    events.off(event, listener as (payload: AppEventMap[EventKey]) => void);
  };
};

export default events;
