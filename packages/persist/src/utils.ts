import { PersistValue, Storage as AbstractStorage } from "./types";

export function withConverter<T, SerializedValue = any>(options: {
  storage: AbstractStorage<SerializedValue>;
  migrate?: ((value: any) => T) | undefined;
  serialize: (value: T) => SerializedValue;
  deserialize: (value: SerializedValue) => T;
}): AbstractStorage<T> {
  const { storage, migrate, serialize, deserialize } = options;

  return {
    get: async (key) => {
      const value = await storage.get(key);

      if (value === null) return null;

      try {
        return deserialize(value);
      } catch {
        return migrate?.(value) || null;
      }
    },
    set: async (key, value) => storage.set(key, serialize(value)),
  };
}

export function createWebPersistStorage(
  webStorage: Storage,
  options?: {
    migrate?: (persistValue: string) => any;
    serialize?: (value: PersistValue) => string;
    deserialize?: (value: string) => PersistValue;
  }
): AbstractStorage<PersistValue> {
  return withConverter<PersistValue, string>({
    storage: {
      get: async (key) => webStorage.getItem(key),
      set: async (key, value) => webStorage.setItem(key, value),
    },
    serialize: options?.serialize || JSON.stringify,
    deserialize: options?.deserialize || JSON.parse,
    migrate: options?.migrate,
  });
}
