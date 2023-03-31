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
  };
}

export function createDerivedSharedState<T>(
  valueGetter: DerivedSharedStateValueGetter<T>,
  valueSetter?: DerivedSharedStateValueSetter<T>
): SharedState<T> {
  let dependencyMap = new Map<SharedState<any>, () => void>();

  const update = () => {
    const nextDependencyMap = new Map<SharedState<any>, () => void>();

    const nextValue = valueGetter((sharedState) => {
      // 订阅新增依赖
      nextDependencyMap.set(
        sharedState,
        dependencyMap.get(sharedState) || sharedState.subscribe(update)
      );

      return sharedState.get();
    });

    // 取消订阅不再使用的依赖
    for (const [sharedState, unsubscribe] of dependencyMap) {
      if (!nextDependencyMap.has(sharedState)) {
        unsubscribe();
      }
    }

    dependencyMap = nextDependencyMap;

    internalSharedState.set(nextValue);
  };

  const internalSharedState = createSharedState(
    valueGetter((sharedState) => {
      dependencyMap.set(sharedState, sharedState.subscribe(update));

      return sharedState.get();
    })
  );

  return {
    get: internalSharedState.get,
    set: (valueOrUpdater) => {
      if (valueSetter) {
        const previousValue = internalSharedState.get();

        const nextValue =
          typeof valueOrUpdater === "function"
            ? (valueOrUpdater as Updater<T>)(previousValue)
            : valueOrUpdater;

        if (Object.is(nextValue, previousValue)) return;

        valueSetter(nextValue, previousValue);
      }
    },
    reset: update,
    subscribe: internalSharedState.subscribe,
  };
}
