export type PersistentValue<T = any> = {
  value: T;
  version?: string | number | undefined;
};

export type Storage<T> = {
  get: (key: string) => Promise<T | null>;
  set: (key: string, value: T) => Promise<void>;
};
