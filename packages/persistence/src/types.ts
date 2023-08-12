import { SharedState } from "@shared-state/core";

export type PersistentValue<T = any> = {
  value: T;
  version?: string | number | undefined;
};

export type PersistentStorageSubscriber<T> = (
  key: string,
  nextValue: T | null,
  previousValue: T | null
) => void;

export type PersistentStorage<T> = {
  get: (key: string) => (T | null) | Promise<T | null>;
  set: (key: string, value: T) => void | Promise<void>;
  remove: (key: string) => void;
  subscribe: (handler: PersistentStorageSubscriber<T>) => void;
  unsubscribe: (handler: PersistentStorageSubscriber<T>) => void;
};

export type PersistentSharedState<T> = SharedState<T> & {
  hydrationState: SharedState<boolean>;
};

export type PersistentOptions<T> = {
  key: string;
  storage: PersistentStorage<PersistentValue<T>>;
  version?: string | number;
  migrate?: (value: any, version: string | number | undefined) => T;
  onHydrationStart?: () => void;
  onHydrationEnd?: (error?: any) => void;
};
