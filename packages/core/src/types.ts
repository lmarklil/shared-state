export type Subscriber<T> = (nextValue: T, previousValue: T) => void;

export type NextStateGetter<T> = (previousValue: T) => T;

export type Partial<T> = T | NextStateGetter<T>;

export type SharedState<T> = {
  get: () => T;
  set: (partial: Partial<T>) => void;
  subscribe: (handler: Subscriber<T>) => () => void;
  destroy: () => void;
};

export type SharedStateFamilyMemberKey = string | number | symbol;

export type SharedStateFamily<T> = {
  get: (key: SharedStateFamilyMemberKey) => SharedState<T>;
  destroy: (key?: SharedStateFamilyMemberKey) => void;
};

export type DerivedSharedStateValueGetter<T> = (
  getSharedStateValue: <SharedStateValue>(
    sharedState: SharedState<SharedStateValue>
  ) => SharedStateValue
) => T;
