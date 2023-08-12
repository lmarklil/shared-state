import {
  PersistentValue,
  PersistentStorageSubscriber,
  PersistentStorage,
} from "./types";

export function withConverter<T, SerializedValue = any>(
  storage: PersistentStorage<SerializedValue>,
  options: {
    serialize: (value: T) => SerializedValue;
    deserialize: (value: SerializedValue) => T;
  }
): PersistentStorage<T> {
  const { serialize, deserialize } = options;

  const internalHandlerMap = new Map<
    PersistentStorageSubscriber<T>,
    PersistentStorageSubscriber<SerializedValue>
  >();

  const deserializeValue = (value: SerializedValue | null) => {
    if (value === null) return null;

    try {
      return deserialize(value);
    } catch {
      return null;
    }
  };

  return {
    ...storage,
    get: (key) => {
      const getStorageResult = storage.get(key);

      if (getStorageResult instanceof Promise) {
        return getStorageResult.then(deserializeValue);
      } else {
        return deserializeValue(getStorageResult);
      }
    },
    set: (key, value) => storage.set(key, serialize(value)),
    subscribe: (handler) => {
      const internalHandler: PersistentStorageSubscriber<SerializedValue> = (
        key,
        nextValue,
        previousValue
      ) =>
        handler(
          key,
          nextValue !== null ? deserializeValue(nextValue) : null,
          previousValue !== null ? deserializeValue(previousValue) : null
        );

      internalHandlerMap.set(handler, internalHandler);

      storage.subscribe(internalHandler);
    },
    unsubscribe: (handler) => {
      const internalHandler = internalHandlerMap.get(handler);

      if (internalHandler) {
        storage.unsubscribe(internalHandler);

        internalHandlerMap.delete(handler);
      }
    },
  };
}

export function createWebPersistentStorage<T>(
  webStorage: Storage,
  options?: {
    serialize?: (value: PersistentValue<T>) => string;
    deserialize?: (value: string) => PersistentValue<T>;
  }
): PersistentStorage<PersistentValue<T>> {
  const storageEventHandlerMap = new Map<
    PersistentStorageSubscriber<string>,
    (event: StorageEvent) => void
  >();

  return withConverter<PersistentValue<T>, string>(
    {
      get: (key) => webStorage.getItem(key),
      set: (key, value) => webStorage.setItem(key, value),
      remove: (key) => webStorage.removeItem(key),
      subscribe: (handler) => {
        const storageEventHandler = (event: StorageEvent) =>
          event.key && handler(event.key, event.newValue, event.oldValue);

        storageEventHandlerMap.set(handler, storageEventHandler);

        window.addEventListener("storage", storageEventHandler);
      },
      unsubscribe: (handler) => {
        const storageEventHandler = storageEventHandlerMap.get(handler);

        if (storageEventHandler) {
          window.removeEventListener("storage", storageEventHandler);

          storageEventHandlerMap.delete(handler);
        }
      },
    },
    {
      serialize: options?.serialize || JSON.stringify,
      deserialize: options?.deserialize || JSON.parse,
    }
  );
}
