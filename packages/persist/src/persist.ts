import { SharedStateMiddleware } from "@shared-state/core";
import { PersistValue, Storage } from "./types";

export function persist<T>(options: {
  key: string;
  storage: Storage<PersistValue>;
  version?: string | number;
  migrate?: (value: any, version: string | number | undefined) => T;
  onStartHydration?: () => void;
  onHydrationFinish?: () => void;
  onHydrationError?: (error: any) => void;
}): SharedStateMiddleware<T> {
  const {
    key,
    storage,
    version,
    migrate,
    onStartHydration,
    onHydrationFinish,
    onHydrationError,
  } = options;

  return (sharedState) => {
    let ignoreHydration = false;

    onStartHydration?.();

    storage
      .get(key)
      .then((persistValue) => {
        if (ignoreHydration || !persistValue) return;

        if (persistValue.version === version) {
          sharedState.set(persistValue.value);
        } else if (persistValue.version !== version && migrate) {
          sharedState.set(migrate(persistValue.value, persistValue.version));
        }

        onHydrationFinish?.();
      })
      .catch((error: any) => onHydrationError?.(error));

    return {
      ...sharedState,
      set: (...args) => {
        ignoreHydration = true;

        sharedState.set(...args);

        storage.set(key, {
          value: sharedState.get(),
          version,
        });
      },
    };
  };
}
