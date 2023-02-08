import { createSharedState, SharedState } from "@shared-state/core";
import { PersistentValue, PersistentStorage } from "./types";

export function persist<T>(
  sharedState: SharedState<T>,
  options: {
    key: string;
    storage: PersistentStorage<PersistentValue<T>>;
    version?: string | number;
    migrate?: (value: any, version: string | number | undefined) => T;
    onHydrationStart?: () => void;
    onHydrationEnd?: () => void;
    onHydrationFailed?: (error: any) => void;
  }
): SharedState<T> & {
  hydrate: () => void;
  hydrationState: SharedState<boolean>;
} {
  const {
    key,
    storage,
    version,
    migrate,
    onHydrationStart,
    onHydrationEnd,
    onHydrationFailed,
  } = options;

  const hydrationState = createSharedState(false);

  let ignoreHydration = false;

  const hydrate = () => {
    hydrationState.set(true);
    ignoreHydration = false;
    onHydrationStart?.();

    storage
      .get(key)
      .then((persistentValue) => {
        if (ignoreHydration || !persistentValue) return;

        if (persistentValue.version === version) {
          sharedState.set(persistentValue.value);
        } else if (persistentValue.version !== version && migrate) {
          sharedState.set(
            migrate(persistentValue.value, persistentValue.version)
          );
        }

        hydrationState.set(false);
        onHydrationEnd?.();
      })
      .catch((error: any) => onHydrationFailed?.(error));
  };

  hydrate();

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
    hydrate,
    hydrationState,
  };
}
