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
    subscribe: (handler) => subscriberSet.add(handler),
    unsubscribe: (handler) => subscriberSet.delete(handler),
  };
}

export function createDerivedSharedState<T>(
  valueGetter: DerivedSharedStateValueGetter<T>,
  valueSetter?: DerivedSharedStateValueSetter<T>
): SharedState<T> {
  const dependencySet = new Set<SharedState<any>>();

  const getValueAndSubscribeState = () =>
    valueGetter((sharedState) => {
      sharedState.subscribe(update);

      dependencySet.add(sharedState);

      return sharedState.get();
    });

  const update = () => {
    dependencySet.forEach((sharedState) => sharedState.unsubscribe(update));
    dependencySet.clear();

    internalSharedState.set(getValueAndSubscribeState());
  };

  const internalSharedState = createSharedState(getValueAndSubscribeState());

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
    subscribe: internalSharedState.subscribe,
    unsubscribe: internalSharedState.unsubscribe,
  };
}
