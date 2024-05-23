import {
  DerivedSharedStateGetter,
  DerivedSharedStateSetter,
  Getter,
  ValueOrGetter,
  SharedState,
  Subscriber,
  Updater,
  ValueOrUpdater,
} from "./types";

export function createSharedState<T>(
  initialValueOrGetter: ValueOrGetter<T>
): SharedState<T> {
  let value: T;

  const subscriberSet = new Set<Subscriber<T>>();

  const get = () => {
    if (value === undefined) {
      value =
        typeof initialValueOrGetter === "function"
          ? (initialValueOrGetter as Getter<T>)()
          : initialValueOrGetter;
    }

    return value;
  };

  const set = (valueOrUpdater: ValueOrUpdater<T>) => {
    const previousValue = get();

    const nextValue =
      typeof valueOrUpdater === "function"
        ? (valueOrUpdater as Updater<T>)(previousValue)
        : valueOrUpdater;

    if (Object.is(nextValue, previousValue)) return;

    value = nextValue;

    subscriberSet.forEach((subscriber) => subscriber(nextValue, previousValue));
  };

  const subscribe = (handler: Subscriber<T>) => subscriberSet.add(handler);

  const unsubscribe = (handler: Subscriber<T>) => subscriberSet.delete(handler);

  return {
    get,
    set,
    subscribe,
    unsubscribe,
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
