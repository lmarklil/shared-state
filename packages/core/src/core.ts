import {
  DerivedSharedStateValueGetter,
  DerivedSharedStateValueSetter,
  SharedState,
  Subscriber,
  Updater,
  ValueOrUpdater,
} from "./types";

export function createSharedState<T>(initialValue: T): SharedState<T> {
  let value = initialValue;
  const subscriberSet = new Set<Subscriber<T>>();

  const set = (valueOrUpdater: ValueOrUpdater<T>) => {
    const previousValue = value;

    const nextValue =
      typeof valueOrUpdater === "function"
        ? (valueOrUpdater as Updater<T>)(previousValue)
        : valueOrUpdater;

    if (Object.is(nextValue, previousValue)) return;

    value = nextValue;

    subscriberSet.forEach((subscriber) => subscriber(nextValue, previousValue));
  };

  return {
    get: () => value,
    set,
    reset: () => set(initialValue),
    subscribe: (handler) => {
      subscriberSet.add(handler);

      return () => subscriberSet.delete(handler);
    },
    hasSubscriber: () => subscriberSet.size > 0,
  };
}

export function createDerivedSharedState<T>(
  valueGetter: DerivedSharedStateValueGetter<T>,
  valueSetter?: DerivedSharedStateValueSetter<T>
): SharedState<T> {
  let value = valueGetter((sharedState) => sharedState.get());

  let dependencyMap = new Map<SharedState<any>, () => void>();

  const subscriberSet = new Set<Subscriber<T>>();

  const notify = () => {
    const nextDependencyMap = new Map<SharedState<any>, () => void>();

    const previousValue = value;

    const nextValue = valueGetter((sharedState) => {
      // 订阅新增依赖
      if (nextDependencyMap.has(sharedState)) {
        nextDependencyMap.set(
          sharedState,
          dependencyMap.get(sharedState) || sharedState.subscribe(notify)
        );
      }

      return sharedState.get();
    });

    value = nextValue;

    // 取消订阅不再使用的依赖
    for (const [sharedState, unsubscribe] of dependencyMap) {
      if (!nextDependencyMap.has(sharedState)) {
        unsubscribe();
      }
    }

    dependencyMap = nextDependencyMap;

    if (Object.is(nextValue, previousValue)) return;

    subscriberSet.forEach((handler) => handler(nextValue, previousValue));
  };

  return {
    get: () => {
      const nextValue = valueGetter((sharedState) => sharedState.get());

      value = nextValue;

      return nextValue;
    },
    set: (valueOrUpdater) => {
      if (valueSetter) {
        const previousValue = value;

        const nextValue =
          typeof valueOrUpdater === "function"
            ? (valueOrUpdater as Updater<T>)(previousValue)
            : valueOrUpdater;

        if (Object.is(nextValue, previousValue)) return;

        valueSetter(nextValue, previousValue);
      }
    },
    reset: notify,
    subscribe: (handler) => {
      if (subscriberSet.size === 0) {
        valueGetter((sharedState) => {
          dependencyMap.set(sharedState, sharedState.subscribe(notify));

          return sharedState.get();
        });
      }

      subscriberSet.add(handler);

      return () => {
        subscriberSet.delete(handler);

        if (subscriberSet.size === 0) {
          for (const [sharedState, unsubscribe] of dependencyMap) {
            unsubscribe();

            dependencyMap.delete(sharedState);
          }
        }
      };
    },
    hasSubscriber: () => subscriberSet.size > 0,
  };
}
