import { PersistentValue, PersistentStorage } from "./types";

export function withConverter<T, SerializedValue = any>(
  storage: PersistentStorage<SerializedValue>,
  options: {
    migrate: (value: any) => T | undefined;
    serialize: (value: T) => SerializedValue;
    deserialize: (value: SerializedValue) => T;
  }
): PersistentStorage<T> {
  const { migrate, serialize, deserialize } = options;

  return {
    get: async (key) => {
      const value = await storage.get(key);

      if (value === null) return null;

      try {
        return deserialize(value);
      } catch {
        const migratedValue = migrate?.(value);

        return migratedValue !== undefined ? migratedValue : null;
      }
    },
    set: async (key, value) => storage.set(key, serialize(value)),
    subscribe: (key, handler) =>
      storage.subscribe(key, (nextValue, previousValue) =>
        handler(
          nextValue !== null ? deserialize(nextValue) : null,
          previousValue !== null ? deserialize(previousValue) : null
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
      get: async (key) => webStorage.getItem(key),
      set: async (key, value) => webStorage.setItem(key, value),
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
      migrate: (value) => {
        const migratedValue = options?.migrate?.(value);

        return migratedValue !== undefined
          ? { value: migratedValue }
          : undefined;
      },
    }
  );
}
