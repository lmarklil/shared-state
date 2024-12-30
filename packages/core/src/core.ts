import {
  Getter,
  ValueOrGetter,
  SharedState,
  Subscriber,
  Updater,
  ValueOrUpdater,
  DerivedSharedStateGetter,
  DerivedSharedStateSetter,
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
  let value: T | undefined;

  let dependencySet: Set<SharedState<any>> | undefined;

  const subscriberSet = new Set<Subscriber<T>>();

  const get = () =>
    subscriberSet.size > 0
      ? (value as T)
      : getter((sharedState) => sharedState.get());

  const set = (valueOrUpdater: ValueOrUpdater<T>) => {
    if (!setter) return;

    const previousValue = get();

    const nextValue =
      typeof valueOrUpdater === "function"
        ? (valueOrUpdater as Updater<T>)(previousValue)
        : valueOrUpdater;

    if (Object.is(nextValue, previousValue)) return;

    setter(nextValue);
  };

  const updateValueAndDependencySet = () => {
    const previousValue = get();

    const previousDependencySet = dependencySet;

    const nextDependencySet = new Set<SharedState<any>>();

    const nextValue = getter((sharedState) => {
      nextDependencySet.add(sharedState);

      return sharedState.get();
    });

    if (previousDependencySet !== undefined) {
      nextDependencySet.forEach(
        (sharedState) =>
          !previousDependencySet.has(sharedState) &&
          sharedState.subscribe(updateValueAndDependencySet)
      );

      previousDependencySet.forEach(
        (sharedState) =>
          !nextDependencySet.has(sharedState) &&
          sharedState.unsubscribe(updateValueAndDependencySet)
      );
    }

    dependencySet = nextDependencySet;

    if (Object.is(nextValue, previousValue)) return;

    value = nextValue;

    subscriberSet.forEach((subscriber) => subscriber(nextValue, previousValue));
  };

  return {
    get,
    set,
    subscribe: (handler) => {
      if (subscriberSet.size === 0) {
        const nextDependencySet = new Set<SharedState<any>>();

        value = getter((sharedState) => {
          sharedState.subscribe(updateValueAndDependencySet);

          nextDependencySet.add(sharedState);

          return sharedState.get();
        });

        dependencySet = nextDependencySet;
      }

      subscriberSet.add(handler);
    },
    unsubscribe: (handler) => {
      subscriberSet.delete(handler);

      if (subscriberSet.size === 0) {
        if (dependencySet !== undefined) {
          dependencySet.forEach((sharedState) =>
            sharedState.unsubscribe(updateValueAndDependencySet)
          );

          dependencySet = undefined;
        }

        value = undefined;
      }
    },
  };
}