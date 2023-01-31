import { SharedStateMiddleware } from "@shared-state/core";
import { StorageValue, Storage } from "./types";

export function persist<T>(options: {
  key: string;
  storage: Storage;
  serialize?: (value: StorageValue<T>) => string;
  deserialize?: (value: string) => StorageValue<T>;
  version?: number;
  migrate?: (value: any, version?: number) => T;
}): SharedStateMiddleware<T> {
  const {
    key,
    storage,
    version,
    migrate,
    serialize = JSON.stringify,
    deserialize = JSON.parse,
  } = options;

  return (sharedState) => {
    const persistValue = storage.getItem(key);

    if (persistValue) {
      try {
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
      } catch {
        migrate && sharedState.set(migrate(persistValue, -1)); // 当persistValue不是JSON字符串时，调用migrate函数，版本标识为-1
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
