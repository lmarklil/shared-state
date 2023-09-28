export type Subscriber<T> = (nextValue: T, previousValue: T) => void;

export type Updater<T> = (previousValue: T) => T;

export type ValueOrUpdater<T> = T | Updater<T>;

export type SharedState<T> = {
  get: () => T;
  set: (valueOrUpdater: ValueOrUpdater<T>) => void;
  subscribe: (handler: Subscriber<T>) => void;
  unsubscribe: (handler: Subscriber<T>) => void;
};
