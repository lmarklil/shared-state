import { DebounceSettings } from "lodash";
import debounce from "lodash/debounce";

import { SharedStateMiddleware } from "../types";
import { getPartialValue } from "../utils";

export type Storage = {
  getItem: (key: string) => string;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

export type StorageValue<T> = {
  state: T;
  version: number;
};

export function persist<T>(options: {
  key: string;
  version?: number;
  migrate?: (value: any, version: number) => T;
  storage?: Storage;
  serialize?: (value: StorageValue<T>) => string;
  deserialize?: (value: string) => StorageValue<T>;
  debounceWait?: number;
  debounceOptions?: DebounceSettings;
}): SharedStateMiddleware<T> {
  const {
    key,
    storage = localStorage,
    version = 0,
    migrate,
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    debounceWait,
    debounceOptions,
  } = options;

  return (sharedState) => {
    let hasHydrated = false; // Storage锁，用于在读取完成前锁定Storage

    const persistValue = storage.getItem(key);

    if (persistValue) {
      try {
        const deserializedPersistValue = deserialize(persistValue);

        if (deserializedPersistValue.version === version) {
          sharedState.set(deserializedPersistValue.state);
        } else if (deserializedPersistValue.version !== version && migrate) {
          sharedState.set(
            migrate(
              deserializedPersistValue.state,
              deserializedPersistValue.version
            )
          );
        }

        hasHydrated = true;
      } catch {
        hasHydrated = true;
      }
    } else {
      hasHydrated = true;
    }

    const debouncedSetStorage = debounce(
      (value) => {
        if (!hasHydrated) return;

        storage.setItem(
          key,
          serialize({
            value,
            version,
          })
        );
      },
      debounceWait,
      debounceOptions
    );

    return {
      ...sharedState,
      set: (partial) => {
        const nextValue = getPartialValue(sharedState.get(), partial);

        sharedState.set(nextValue);

        debouncedSetStorage(nextValue);
      },
    };
  };
}
