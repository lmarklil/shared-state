export type Subscriber<T> = (nextValue: T, previousValue: T) => void;

export type Updater<T> = (previousValue: T) => T;

export type ValueOrUpdater<T> = T | Updater<T>;

export type SharedState<T> = {
  get: () => T;
  set: (valueOrUpdater: ValueOrUpdater<T>) => void;
  reset: () => void;
  subscribe: (handler: Subscriber<T>) => () => void;
  hasSubscriber: () => boolean;
};

export type DerivedSharedStateValueGetter<T> = (
  getSharedStateValue: <SharedStateValue>(
    sharedState: SharedState<SharedStateValue>
  ) => SharedStateValue
) => T;

export type DerivedSharedStateValueSetter<T> = (
  nextValue: T,
  previousValue: T
) => void;

export type AsyncDerivedSharedStateValueGetter<T> =
  DerivedSharedStateValueGetter<Promise<T>>;

export type AsyncDerivedSharedStateValueSetter<T> =
  DerivedSharedStateValueSetter<T | undefined>;

export type AsyncDerivedSharedState<T> = SharedState<T | undefined> & {
  hydrationState: SharedState<boolean>;
};
