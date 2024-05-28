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

  const hasSubscriber = () => subscriberSet.size > 0;

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
    hasSubscriber,
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

  const hasSubscriber = () => subscriberSet.size > 0;

  const get = () =>
    value !== undefined ? value : getter((sharedState) => sharedState.get());

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

  const updateValueAndDependency = () => {
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
          sharedState.subscribe(updateValueAndDependency)
      );

      previousDependencySet.forEach(
        (sharedState) =>
          !nextDependencySet.has(sharedState) &&
          sharedState.unsubscribe(updateValueAndDependency)
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
    hasSubscriber,
    subscribe: (handler) => {
      if (!hasSubscriber()) {
        const nextDependencySet = new Set<SharedState<any>>();

        value = getter((sharedState) => {
          sharedState.subscribe(updateValueAndDependency);

          nextDependencySet.add(sharedState);

          return sharedState.get();
        });

        dependencySet = nextDependencySet;
      }

      subscriberSet.add(handler);
    },
    unsubscribe: (handler) => {
      subscriberSet.delete(handler);

      if (!hasSubscriber()) {
        if (dependencySet !== undefined) {
          dependencySet.forEach((sharedState) =>
            sharedState.unsubscribe(updateValueAndDependency)
          );

          dependencySet = undefined;

          value = undefined;
        }
      }
    },
  };
}
