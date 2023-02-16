import {
  DerivedSharedStateValueGetter,
  NextStateGetter,
  SharedState,
  SharedStateFamily,
  SharedStateFamilyMemberKey,
  Subscriber,
} from "./types";

export function createSharedState<T>(initialValue: T): SharedState<T> {
  let value = initialValue;
  const subscriberSet = new Set<Subscriber<T>>();

  return {
    get: () => value,
    set: (partial) => {
      const previousValue = value;

      const nextValue =
        typeof partial === "function"
          ? (partial as NextStateGetter<T>)(previousValue)
          : partial;

      if (nextValue === previousValue) return;

      value = nextValue;

      subscriberSet.forEach((subscriber) =>
        subscriber(nextValue, previousValue)
      );
    },
    subscribe: (handler) => {
      subscriberSet.add(handler);

      return () => subscriberSet.delete(handler);
    },
    destroy: () => subscriberSet.clear(),
  };
}

export function createDerivedSharedState<T>(
  getValue: DerivedSharedStateValueGetter<T>,
  setValue?: () => void // TODO 重新设计
): SharedState<T> {
  const subscriberSet = new Set<Subscriber<T>>();
  const dependenceMap = new Map<SharedState<any>, () => void>();

  let value = getValue((sharedState) => {
    if (!dependenceMap.has(sharedState)) {
      dependenceMap.set(
        sharedState,
        sharedState.subscribe(() => {
          const previousValue = value;
          const nextValue = getValue((sharedState) => sharedState.get());

          if (nextValue === previousValue) return;

          value = nextValue;

          subscriberSet.forEach((subscriber) =>
            subscriber(nextValue, previousValue)
          );
        })
      );
    }

    return sharedState.get();
  });

  return {
    get: () => value,
    set: () => setValue?.(),
    subscribe: (handler) => {
      subscriberSet.add(handler);

      return () => subscriberSet.delete(handler);
    },
    destroy: () => {
      for (const [, unsubscribe] of dependenceMap) {
        unsubscribe();
      }

      subscriberSet.clear();
    },
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
