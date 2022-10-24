export type Subscriber<T> = (nextValue: T, previousValue: T) => void;

export type NextStateGetter<T> = (previousValue: T) => T;

export type Partial<T> = T | NextStateGetter<T>;

export type SharedState<T> = {
  get: () => T;
  set: (partial: Partial<T>) => void;
  subscribe: (handler: Subscriber<T>) => () => void;
  destroy: () => void;
};

export type ReadOnlySharedState<T> = Omit<SharedState<T>, "set">;

export type SharedStateMiddleware<T> = (
  sharedState: SharedState<T>
) => SharedState<T>;

export type SharedStateFamilyMemberKey = string;

export type SharedStateFamily<T> = {
  get: (key: SharedStateFamilyMemberKey) => T;
  set: (key: SharedStateFamilyMemberKey, partial: Partial<T>) => void;
  subscribe: (
    key: SharedStateFamilyMemberKey,
    handler: Subscriber<T>
  ) => () => void;
  destroy: (key?: SharedStateFamilyMemberKey) => void;
};

export type DerivedSharedStateValueGetter<T> = (
  getSharedStateValue: <SharedStateValue>(
    sharedState: SharedState<SharedStateValue>
  ) => SharedStateValue
) => T;
