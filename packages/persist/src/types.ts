export type PersistentValue<T = any> = {
  value: T;
  version?: string | number | undefined;
};

export type PersistentStorage<T> = {
  get: (key: string) => Promise<T | null>;
  set: (key: string, value: T) => Promise<void>;
  subscribe: (
    key: string,
    handler: (nextValue: T | null, previousValue: T | null) => void
  ) => () => void;
};
