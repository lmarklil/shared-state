import {
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
