import {
  AsyncDerivedSharedState,
  DerivedSharedState,
  DerivedSharedStateValueGetter,
  SharedState,
  SharedStateFamily,
  SharedStateFamilyMemberKey,
  Subscriber,
  Updater,
} from "./types";

export function createSharedState<T>(initialValue: T): SharedState<T> {
  let value = initialValue;
  const subscriberSet = new Set<Subscriber<T>>();

  return {
    get: () => value,
    set: (valueOrUpdater) => {
      const previousValue = value;

      const nextValue =
        typeof valueOrUpdater === "function"
          ? (valueOrUpdater as Updater<T>)(previousValue)
          : valueOrUpdater;

      if (nextValue === previousValue) return;

      value = nextValue;

      subscriberSet.forEach((subscriber) =>
        subscriber(nextValue, previousValue)
      );
    },
    reset: () => (value = initialValue),
    subscribe: (handler) => {
      subscriberSet.add(handler);

      return () => subscriberSet.delete(handler);
    },
    destroy: () => subscriberSet.clear(),
  };
}

export function createDerivedSharedState<T>(
  getValue: DerivedSharedStateValueGetter<T>
): DerivedSharedState<T> {
  let dependencyMap = new Map<SharedState<any>, () => void>();

  const getDerivedSharedStateValue = () => {
    const nextDependencyMap = new Map<SharedState<any>, () => void>();

    const value = getValue((sharedState) => {
      if (!nextDependencyMap.has(sharedState)) {
        nextDependencyMap.set(
          sharedState,
          dependencyMap.get(sharedState) ||
            sharedState.subscribe(() =>
              internalSharedState.set(getDerivedSharedStateValue())
            )
        );
      }

      return sharedState.get();
    });

    for (const [sharedState, unsubscribe] of dependencyMap) {
      if (!nextDependencyMap.has(sharedState)) {
        unsubscribe();
      }
    }

    dependencyMap = nextDependencyMap;

    return value;
  };

  const internalSharedState = createSharedState(getDerivedSharedStateValue());

  return {
    ...internalSharedState,
    destroy: () => {
      for (const [, unsubscribe] of dependencyMap) {
        unsubscribe();
      }

      internalSharedState.destroy();
    },
  };
}

export function createAsyncDerivedSharedState<T>(
  getValue: DerivedSharedStateValueGetter<Promise<T>>
): AsyncDerivedSharedState<T> {
  const internalSharedState = createSharedState<T | undefined>(undefined);

  const hydrationState = createSharedState(false);

  let dependencyMap = new Map<SharedState<any>, () => void>();

  let currentTaskId = 0;

  const hydrate = () => {
    const taskId = ++currentTaskId;

    hydrationState.set(true);

    const nextDependencyMap = new Map<SharedState<any>, () => void>();

    getValue((sharedState) => {
      if (!nextDependencyMap.has(sharedState)) {
        nextDependencyMap.set(
          sharedState,
          dependencyMap.get(sharedState) ||
            sharedState.subscribe(() => hydrate())
        );
      }

      return sharedState.get();
    }).then((value) => {
      if (currentTaskId !== taskId) return;

      internalSharedState.set(value);

      hydrationState.set(false);
    });

    for (const [sharedState, unsubscribe] of dependencyMap) {
      if (!nextDependencyMap.has(sharedState)) {
        unsubscribe();
      }
    }

    dependencyMap = nextDependencyMap;
  };

  hydrate();

  return {
    ...internalSharedState,
    destroy: () => {
      for (const [, unsubscribe] of dependencyMap) {
        unsubscribe();
      }

      internalSharedState.destroy();
    },
    hydrationState,
  };
}

export function createSharedStateFamily<T>(
  setup: (key: SharedStateFamilyMemberKey) => SharedState<T>
): SharedStateFamily<T> {
  const sharedStateMap = new Map<SharedStateFamilyMemberKey, SharedState<T>>();

  return {
    get: (key) => {
      const sharedState = sharedStateMap.get(key);

      if (sharedState) {
        return sharedState;
      } else {
        const sharedState = setup(key);

        sharedStateMap.set(key, sharedState);

        return sharedState;
      }
    },
    destroy: (key) => {
      const destroySharedState = (key: SharedStateFamilyMemberKey) => {
        if (!sharedStateMap.has(key)) return;

        sharedStateMap.get(key)?.destroy();
        sharedStateMap.delete(key);
      };

      if (key) {
        destroySharedState(key);
      } else {
        for (const [key] of sharedStateMap) {
          destroySharedState(key);
        }
      }
    },
  };
}
