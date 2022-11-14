export type Storage = {
  getItem: (key: string) => string;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

export type StorageValue<T> = {
  value: T;
  version?: number;
};
