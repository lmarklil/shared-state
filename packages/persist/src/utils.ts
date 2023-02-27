import { PersistentValue, PersistentStorage } from "./types";

export function withConverter<T, SerializedValue = any>(
  storage: PersistentStorage<SerializedValue>,
  options: {
    serialize: (value: T) => SerializedValue;
    deserialize: (value: SerializedValue) => T;
  }
): PersistentStorage<T> {
  const { serialize, deserialize } = options;

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
    subscribe: (key, handler) =>
      storage.subscribe(key, (nextValue, previousValue) =>
        handler(
          nextValue !== null ? deserializeValue(nextValue) : null,
          previousValue !== null ? deserializeValue(previousValue) : null
        )
      ),
  };
}

export function createWebPersistentStorage<T>(
  webStorage: Storage,
  options?: {
    migrate?: (value: string) => T;
    serialize?: (value: PersistentValue<T>) => string;
    deserialize?: (value: string) => PersistentValue<T>;
  }
): PersistentStorage<PersistentValue<T>> {
  return withConverter<PersistentValue<T>, string>(
    {
      get: (key) => webStorage.getItem(key),
      set: (key, value) => webStorage.setItem(key, value),
      remove: (key) => webStorage.removeItem(key),
      subscribe: (key, handler) => {
        const eventHandler = (event: StorageEvent) => {
          if (
            !event.key ||
            event.key !== key ||
            event.newValue === event.oldValue
          )
            return;

          handler(event.newValue, event.oldValue);
        };

        window.addEventListener("storage", eventHandler);

        return () => window.removeEventListener("storage", eventHandler);
      },
    },
    {
      serialize: options?.serialize || JSON.stringify,
      deserialize: options?.deserialize || JSON.parse,
    }
  );
}
