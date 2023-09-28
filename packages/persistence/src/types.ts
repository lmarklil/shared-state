import { SharedState } from "@shared-state/core";

export type PersistenceValue<T = any> = {
  value: T;
  version?: string | number | undefined;
};

export type PersistenceStorageSubscriber<T> = (
  key: string,
  nextValue: T | null,
  previousValue: T | null
) => void;

export type PersistenceStorage<T> = {
  get: (key: string) => (T | null) | Promise<T | null>;
  set: (key: string, value: T) => void | Promise<void>;
  remove: (key: string) => void;
  subscribe: (handler: PersistenceStorageSubscriber<T>) => void;
  unsubscribe: (handler: PersistenceStorageSubscriber<T>) => void;
};

export type PersistenceSharedState<T> = SharedState<T> & {
  hydrationState: SharedState<boolean>;
};

export type PersistenceOptions<T> = {
  key: string;
  storage: PersistenceStorage<PersistenceValue<T>>;
  version?: string | number;
  migrate?: (value: any, version: string | number | undefined) => T;
  onHydrationStart?: () => void;
  onHydrationEnd?: (error?: any) => void;
};
