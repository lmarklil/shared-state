import {
  DerivedSharedStateValueGetter,
  SharedState,
  SharedStateFamily,
  SharedStateFamilyMemberKey,
  Subscriber,
} from "./types";
import { getPartialValue } from "./utils";

export function createSharedState<T>(initialValue: T): SharedState<T> {
  let value = initialValue;
  const subscriberSet = new Set<Subscriber<T>>();

  return {
    get: () => value,
    set: (partial) => {
      const previousValue = value;

      const nextValue = getPartialValue(value, partial);

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
  setValue?: () => void
): SharedState<T> {
  const subscriberSet = new Set<Subscriber<T>>();
  const dependenceMap = new Map();

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
      for (const unsubscribe of dependenceMap.values()) {
        unsubscribe();
      }

      subscriberSet.clear();
    },
  };
}

export function createSharedStateFamily<T>(
  initialValue: T,
  setup?: (
    sharedState: SharedState<T>,
    key: SharedStateFamilyMemberKey
  ) => SharedState<T>
): SharedStateFamily<T> {
  const sharedStateMap = new Map();

  const getOrCreateSharedState = (key: SharedStateFamilyMemberKey) => {
    if (!sharedStateMap.has(key)) {
      const sharedState = createSharedState(initialValue);

      sharedStateMap.set(key, setup?.(sharedState, key) || sharedState);
    }

    return sharedStateMap.get(key);
  };

  return {
    get: (key) => sharedStateMap.get(key)?.get() || initialValue,
    set: (key, partial) => getOrCreateSharedState(key).set(partial),
    subscribe: (key, handler) => getOrCreateSharedState(key).subscribe(handler),
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
