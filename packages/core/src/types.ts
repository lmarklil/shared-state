export type Subscriber<T> = (nextValue: T, previousValue: T) => void;

export type Updater<T> = (previousValue: T) => T;

export type ValueOrUpdater<T> = T | Updater<T>;

export type SharedState<T = unknown> = {
  get: () => T;
  set: (valueOrUpdater: ValueOrUpdater<T>) => void;
  reset: () => void;
  subscribe: (handler: Subscriber<T>) => () => void;
  destroy: () => void;
};

export type DerivedSharedStateValueGetter<T> = (
  getSharedStateValue: <SharedStateValue>(
    sharedState: SharedState<SharedStateValue>
  ) => SharedStateValue
) => T;

export type DerivedSharedState<T> = Omit<SharedState<T>, "set" | "reset">;

export type AsyncDerivedSharedState<T> = DerivedSharedState<T | undefined> & {
  hydrationState: SharedState<boolean>;
};

export type SharedStateFamilyMemberKey = string | number;

export type SharedStateFamily<T> = {
  get: (key: SharedStateFamilyMemberKey) => SharedState<T>;
  destroy: (key?: SharedStateFamilyMemberKey) => void;
};
