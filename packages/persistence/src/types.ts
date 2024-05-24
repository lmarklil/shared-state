import { SharedState } from "@shared-state/core";

export type PersistenceKey = string | number;

export type PersistenceValue = {
  value: any;
  version?: string | number | undefined;
  lastModified: number;
};

export type PersistenceStorageSubscriber<T> = (
  key: PersistenceKey,
  nextValue: T | null,
  previousValue: T | null
) => void;

export type PersistenceStorage<T> = {
  get: (key: PersistenceKey) => (T | null) | Promise<T | null>;
  set: (key: PersistenceKey, value: T) => void | Promise<void>;
  subscribe?: ((handler: PersistenceStorageSubscriber<T>) => void) | undefined;
  unsubscribe?:
    | ((handler: PersistenceStorageSubscriber<T>) => void)
    | undefined;
};

export type PersistenceSharedState<T> = SharedState<T> & {
  hydrate: () => void;
  hydrationState: SharedState<boolean>;
  mutationState: SharedState<boolean>;
};

export type PersistenceOptions<T> = {
  version?: string | number;
  migrator?: (value: PersistenceValue, version?: number | string) => T;
  onHydrationStart?: () => void;
  onHydrationEnd?: (error?: any) => void;
  onMutationStart?: () => void;
  onMutationEnd?: (error?: any) => void;
};
