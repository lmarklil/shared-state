import { createSharedState, SharedState } from "@shared-state/core";
import {
  PersistedSharedState,
  PersistentOptions,
  PersistentValue,
} from "./types";

export function persist<T>(
  sharedState: SharedState<T>,
  options: PersistentOptions<T>
): PersistedSharedState<T> {
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

    const finishHydration = () => {
      hydrationState.set(false);
      onHydrationEnd?.();
    };

    const getStorageResult = storage.get(key);

    const setSharedState = (persistentValue: PersistentValue<T> | null) => {
      if (ignoreHydration || !persistentValue) {
        finishHydration();

        return;
      }

      if (persistentValue.version === version) {
        sharedState.set(persistentValue.value);
      } else if (persistentValue.version !== version && migrate) {
        sharedState.set(
          migrate(persistentValue.value, persistentValue.version)
        );
      }

      finishHydration();
    };

    if (getStorageResult instanceof Promise) {
      getStorageResult
        .then((persistentValue) => setSharedState(persistentValue))
        .catch((error: any) => onHydrationFailed?.(error));
    } else {
      setSharedState(getStorageResult);
    }
  };

  hydrate();

  const unsubscribeStorage = storage.subscribe?.(key, () => hydrate());

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
    destroy: () => {
      ignoreHydration = true;
      unsubscribeStorage?.();
      hydrationState.destroy();
      sharedState.destroy();
    },
  };
}
