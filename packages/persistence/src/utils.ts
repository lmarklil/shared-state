import {
  PersistenceValue,
  PersistenceStorageSubscriber,
  PersistenceStorage,
} from "./types";

export function withConverter<SerializedValue = any>(
  storage: PersistenceStorage<SerializedValue>,
  options: {
    serialize: (value: PersistenceValue) => SerializedValue;
    deserialize: (value: SerializedValue) => PersistenceValue;
  }
): PersistenceStorage<PersistenceValue> {
  const { serialize, deserialize } = options;

  const internalHandlerMap = new Map<
    PersistenceStorageSubscriber<PersistenceValue>,
    PersistenceStorageSubscriber<SerializedValue>
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
    get: (key) => {
      const getStorageResult = storage.get(key);

      if (getStorageResult instanceof Promise) {
        return getStorageResult.then(deserializeValue);
      } else {
        return deserializeValue(getStorageResult);
      }
    },
    set: (key, value) => storage.set(key, serialize(value)),
    subscribe: storage.subscribe
      ? (handler) => {
          const internalHandler: PersistenceStorageSubscriber<
            SerializedValue
          > = (key, nextValue, previousValue) =>
            handler(
              key,
              nextValue !== null ? deserializeValue(nextValue) : null,
              previousValue !== null ? deserializeValue(previousValue) : null
            );

          internalHandlerMap.set(handler, internalHandler);

          storage.subscribe?.(internalHandler);
        }
      : undefined,
    unsubscribe: storage.unsubscribe
      ? (handler) => {
          const internalHandler = internalHandlerMap.get(handler);

          if (internalHandler) {
            storage.unsubscribe?.(internalHandler);

            internalHandlerMap.delete(handler);
          }
        }
      : undefined,
  };
}

export function createWebPersistenceStorage(
  webStorage: Storage,
  options?: {
    serialize?: (value: PersistenceValue) => string;
    deserialize?: (value: string) => PersistenceValue;
  }
): PersistenceStorage<PersistenceValue> {
  const storageEventHandlerMap = new Map<
    PersistenceStorageSubscriber<string>,
    (event: StorageEvent) => void
  >();

  return withConverter(
    {
      get: (key) => webStorage.getItem(key),
      set: (key, value) => webStorage.setItem(key, value),
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
