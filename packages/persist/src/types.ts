export type PersistValue = {
  value: any;
  version: string | number | undefined;
};

export type Storage<T> = {
  get: (key: string) => Promise<T | null>;
  set: (key: string, value: T) => Promise<void>;
};
