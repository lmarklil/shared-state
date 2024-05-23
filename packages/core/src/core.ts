import {
  DerivedSharedStateGetter,
  DerivedSharedStateSetter,
  SharedState,
  Subscriber,
  Updater,
  ValueOrUpdater,
} from "./types";

export function createSharedState<T>(initialValue: T): SharedState<T> {
  let value = initialValue;

  const subscriberSet = new Set<Subscriber<T>>();

  return {
    get: () => value,
    set: (valueOrUpdater: ValueOrUpdater<T>) => {
      const previousValue = value;

      const nextValue =
        typeof valueOrUpdater === "function"
          ? (valueOrUpdater as Updater<T>)(previousValue)
          : valueOrUpdater;

      if (Object.is(nextValue, previousValue)) return;

      value = nextValue;

      subscriberSet.forEach((subscriber) =>
        subscriber(nextValue, previousValue)
      );
    },
    subscribe: (handler) => subscriberSet.add(handler),
    unsubscribe: (handler) => subscriberSet.delete(handler),
  };
}

export function createDerivedSharedState<T>(
  getter: DerivedSharedStateGetter<T>,
  setter?: DerivedSharedStateSetter<T>
): SharedState<T> {
  let value: T;

  let dependencySet = new Set<SharedState<any>>();

  const subscriberSet = new Set<Subscriber<T>>();

  const hydrate = () => {
    const previousValue = value;

    const nextDependencySet = new Set<SharedState<any>>();

    const nextValue = getter((sharedState) => {
      nextDependencySet.add(sharedState);

      return sharedState.get();
    });

    nextDependencySet.forEach(
      (sharedState) =>
        !dependencySet.has(sharedState) && sharedState.subscribe(hydrate)
    );

    dependencySet.forEach(
      (sharedState) =>
        !nextDependencySet.has(sharedState) && sharedState.unsubscribe(hydrate)
    );

    dependencySet = nextDependencySet;

    value = nextValue;

    subscriberSet.forEach((subscriber) => subscriber(nextValue, previousValue));
  };

  hydrate();

  return {
    get: () => value,
    set: (valueOrUpdater) => {
      if (!setter) return;

      const previousValue = value;

      const nextValue =
        typeof valueOrUpdater === "function"
          ? (valueOrUpdater as Updater<T>)(previousValue)
          : valueOrUpdater;

      if (Object.is(nextValue, previousValue)) return;

      setter(nextValue, previousValue);
    },
    subscribe: (handler) => subscriberSet.add(handler),
    unsubscribe: (handler) => subscriberSet.delete(handler),
  };
}
