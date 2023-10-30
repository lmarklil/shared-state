import { SharedState } from "@shared-state/core";

export type PersistenceValue = {
  value: any;
  version?: string | number | undefined;
  lastModified: number;
};

export type PersistenceStorageSubscriber<T> = (
  key: string,
  nextValue: T | null,
  previousValue: T | null
) => void;

export type PersistenceStorage<T> = {
  get: (key: string) => (T | null) | Promise<T | null>;
  set: (key: string, value: T) => void | Promise<void>;
  subscribe: ((handler: PersistenceStorageSubscriber<T>) => void) | undefined;
  unsubscribe: ((handler: PersistenceStorageSubscriber<T>) => void) | undefined;
};

export type PersistenceSharedState<T> = SharedState<T> & {
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
