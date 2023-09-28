import { SharedState, Subscriber, Updater, ValueOrUpdater } from "./types";

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
