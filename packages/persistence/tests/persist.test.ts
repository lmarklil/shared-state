import {
  PersistenceStorage,
  PersistenceValue,
  createPersistenceSharedState,
} from "../src";

const storage = new Map<string, PersistenceValue>();

storage.set("count", { value: 10, lastModified: 10 });

const AsyncStorage: PersistenceStorage<PersistenceValue> = {
  get: (key) =>
    new Promise((resolve) =>
      setTimeout(() => {
        resolve(storage.get(key) ?? null);
      }, 300)
    ),
  set: (key, value) =>
    new Promise<void>((resolve) =>
      setTimeout(() => {
        storage.set(key, value);
        resolve();
      }, 300)
    ),
};

test("Async storage mutation", (done) => {
  const CountState = createPersistenceSharedState<number>(
    AsyncStorage,
    "count",
    0,
    {
      onMutationEnd: () => {
        const count = CountState.get();

        expect(count).toBe(11);

        done();
      },
    }
  );

  CountState.set((count) => count + 1);
});
