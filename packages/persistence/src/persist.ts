import { createSharedState } from "@shared-state/core";
import {
  PersistentSharedState,
  PersistentOptions,
  PersistentValue,
  PersistentStorage,
} from "./types";

export function createPersistentSharedState<T>(
  storage: PersistentStorage<PersistentValue<T>>,
  key: string,
  initialValue: T,
  options: PersistentOptions<T>
): PersistentSharedState<T> {
  const { version, migrate, onHydrationStart, onHydrationEnd } = options;

  const sharedState = createSharedState(initialValue);

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
    ignoreHydration = false;

    hydrationState.set(true);

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
      getStorageResult.then(hydrateValueToSharedState).catch(onHydrationEnd);
    } else {
      try {
        hydrateValueToSharedState(getStorageResult);
      } catch (error) {
        onHydrationEnd?.(error);
      }
    }
  };

  hydrate();

  storage.subscribe?.((updateKey, nextValue, previousValue) => {
    if (updateKey !== key || Object.is(nextValue, previousValue)) return;

    ignoreHydration = true;

    if (nextValue !== null) {
      setSharedStateWithPersistentValue(nextValue);
    } else {
      storage.remove(key);
      sharedState.set(initialValue);
    }
  });

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
    subscribe: sharedState.subscribe,
    unsubscribe: sharedState.unsubscribe,
    hydrationState,
  };
}
