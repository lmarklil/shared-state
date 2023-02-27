import { SharedState } from "@shared-state/core";

export type PersistentValue<T = any> = {
  value: T;
  version?: string | number | undefined;
};

export type PersistentStorage<T> = {
  get: (key: string) => (T | null) | Promise<T | null>;
  set: (key: string, value: T) => void | Promise<void>;
  remove: (key: string) => void;
  subscribe: (
    key: string,
    handler: (nextValue: T | null, previousValue: T | null) => void
  ) => () => void;
};

export type PersistedSharedState<T> = SharedState<T> & {
  hydrate: () => void;
  hydrationState: SharedState<boolean>;
};

export type PersistentOptions<T> = {
  key: string;
  storage: PersistentStorage<PersistentValue<T>>;
  version?: string | number;
  migrate?: (value: any, version: string | number | undefined) => T;
  onHydrationStart?: () => void;
  onHydrationEnd?: () => void;
  onHydrationFailed?: (error: any) => void;
};
