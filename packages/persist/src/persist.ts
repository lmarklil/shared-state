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

  const setSharedStateWithPersistentValue = (
    persistentValue: PersistentValue<T>
  ) => {
    if (persistentValue.version === version) {
      sharedState.set(persistentValue.value);
    } else if (persistentValue.version !== version && migrate) {
      sharedState.set(migrate(persistentValue.value, persistentValue.version));
    }
  };

  const hydrate = () => {
    hydrationState.set(true);
    ignoreHydration = false;
    onHydrationStart?.();

    const getStorageResult = storage.get(key);

    const hydrateValueToSharedState = (
      persistentValue: PersistentValue<T> | null
    ) => {
      if (!ignoreHydration && persistentValue !== null) {
        setSharedStateWithPersistentValue(persistentValue);
      }

      hydrationState.set(false);
      onHydrationEnd?.();
    };

    if (getStorageResult instanceof Promise) {
      getStorageResult.then(hydrateValueToSharedState).catch(onHydrationFailed);
    } else {
      hydrateValueToSharedState(getStorageResult);
    }
  };

  hydrate();

  let unsubscribeStorage: () => void;

  return {
    get: sharedState.get,
    set: (valueOrUpdater) => {
      ignoreHydration = true;

      sharedState.set(valueOrUpdater);

      storage.set(key, {
        value: sharedState.get(),
        version,
      });
    },
    subscribe: (handler) => {
      if (!sharedState.hasSubscriber()) {
        unsubscribeStorage = storage.subscribe?.(key, (persistentValue) => {
          ignoreHydration = true;

          if (persistentValue !== null) {
            setSharedStateWithPersistentValue(persistentValue);
          } else {
            sharedState.reset();
          }
        });
      }

      let unsubscribeSharedState = sharedState.subscribe(handler);

      return () => {
        unsubscribeSharedState();

        if (!sharedState.hasSubscriber()) {
          unsubscribeStorage?.();
        }
      };
    },
    hasSubscriber: sharedState.hasSubscriber,
    reset: () => {
      ignoreHydration = true;

      storage.remove(key);
      sharedState.reset();
    },
    hydrate,
    hydrationState,
  };
}
