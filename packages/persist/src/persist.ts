import { SharedStateMiddleware } from "@shared-state/core";
import { PersistentValue, Storage } from "./types";

export function persist<T>(options: {
  key: string;
  storage: Storage<PersistentValue>;
  version?: string | number;
  migrate?: (value: any, version: string | number | undefined) => T;
  onHydrationBegin?: () => void;
  onHydrationFinish?: () => void;
  onHydrationFailed?: (error: any) => void;
}): SharedStateMiddleware<T> {
  const {
    key,
    storage,
    version,
    migrate,
    onHydrationBegin,
    onHydrationFinish,
    onHydrationFailed,
  } = options;

  return (sharedState) => {
    let ignoreHydration = false;

    onHydrationBegin?.();

    storage
      .get(key)
      .then((persistentValue) => {
        if (ignoreHydration || !persistentValue) return;

        if (persistentValue.version === version) {
          sharedState.set(persistentValue.value);
        } else if (persistentValue.version !== version && migrate) {
          sharedState.set(migrate(persistentValue.value, persistentValue.version));
        }

        onHydrationFinish?.();
      })
      .catch((error: any) => onHydrationFailed?.(error));

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
