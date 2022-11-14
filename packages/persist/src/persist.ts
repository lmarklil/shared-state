import { SharedStateMiddleware } from "@shared-state/core";
import { StorageValue } from "./types";

export function persist<T>(options: {
  key: string;
  version?: number;
  migrate?: (value: any, version?: number) => T;
  storage?: Storage;
  serialize?: (value: StorageValue<T>) => string;
  deserialize?: (value: string) => StorageValue<T>;
}): SharedStateMiddleware<T> {
  const {
    key,
    storage = localStorage,
    version = 0,
    migrate,
    serialize = JSON.stringify,
    deserialize = JSON.parse,
  } = options;

  return (sharedState) => {
    const persistValue = storage.getItem(key);

    if (persistValue) {
      const deserializedPersistValue = deserialize(persistValue);

      if (deserializedPersistValue.version === version) {
        sharedState.set(deserializedPersistValue.value);
      } else if (deserializedPersistValue.version !== version && migrate) {
        sharedState.set(
          migrate(
            deserializedPersistValue.value,
            deserializedPersistValue.version
          )
        );
      }
    }

    return {
      ...sharedState,
      set: (...args) => {
        sharedState.set(...args);

        storage.setItem(
          key,
          serialize({
            value: sharedState.get(),
            version,
          })
        );
      },
    };
  };
}