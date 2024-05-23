import {
  Getter,
  ValueOrGetter,
  Updater,
  ValueOrUpdater,
  createSharedState,
} from "@shared-state/core";
import {
  PersistenceSharedState,
  PersistenceOptions,
  PersistenceValue,
  PersistenceStorage,
} from "./types";

export function createPersistenceSharedState<T>(
  storage: PersistenceStorage<PersistenceValue>,
  key: string,
  initialValueOrGetter: ValueOrGetter<T>,
  options?: PersistenceOptions<T>
): PersistenceSharedState<T> {
  const version = options?.version;

  const migrator = options?.migrator;

  const onHydrationStart = options?.onHydrationStart;

  const onHydrationEnd = options?.onHydrationEnd;

  const onMutationStart = options?.onMutationStart;

  const onMutationEnd = options?.onMutationEnd;

  const sharedState = createSharedState(initialValueOrGetter);

  const hydrationState = createSharedState(false);

  const mutationState = createSharedState(false);

  let lastHydrationTime = 0;

  let lastMutationTime = 0;

  const getInitialValue = () =>
    typeof initialValueOrGetter === "function"
      ? (initialValueOrGetter as Getter<T>)()
      : initialValueOrGetter;

  const persistentValueToSharedStateValue: (
    persistentValue: PersistenceValue | null
  ) => T = (persistentValue) => {
    if (persistentValue === null) return getInitialValue();

    if (persistentValue.version === version) {
      return persistentValue.value;
    } else {
      if (!migrator) return getInitialValue();

      if (Object.hasOwn(persistentValue, "value")) {
        return migrator(persistentValue.value, persistentValue.version);
      } else {
        return migrator(persistentValue); // persistentValue有可能是不支持的数据结构，此时将完整的值返回给用户处理
      }
    }
  };

  const hydrate = () => {
    onHydrationStart?.();

    hydrationState.set(true);

    const hydrationTime = new Date().getTime();

    lastHydrationTime = hydrationTime;

    const commit = (persistentValue: PersistenceValue | null) => {
      if (lastHydrationTime > hydrationTime) return;

      sharedState.set(persistentValueToSharedStateValue(persistentValue));

      hydrationState.set(false);

      onHydrationEnd?.();
    };

    const throwError = (error: any) => {
      if (lastHydrationTime > hydrationTime) return;

      hydrationState.set(false);

      onHydrationEnd?.(error);
    };

    try {
      const getStorageResult = storage.get(key);

      if (getStorageResult instanceof Promise) {
        getStorageResult
          .then((persistentValue) => commit(persistentValue))
          .catch((error) => throwError(error));
      } else {
        commit(getStorageResult);
      }
    } catch (error) {
      throwError(error);
    }
  };

  storage.subscribe?.((updateKey, nextValue, previousValue) => {
    if (updateKey !== key || Object.is(nextValue, previousValue)) return;

    onHydrationStart?.();

    hydrationState.set(true);

    const hydrationTime = new Date().getTime();

    lastHydrationTime = hydrationTime;

    try {
      if (lastHydrationTime > hydrationTime) return;

      // 解决hydartion冲突，默认的策略是保留最新的数据，当nextValue为null时保留本地数据
      if (options?.merge) {
        sharedState.set(
          options.merge(
            persistentValueToSharedStateValue(nextValue),
            sharedState.get()
          )
        );
      } else if (
        nextValue !== null &&
        nextValue.lastModified > lastMutationTime
      ) {
        sharedState.set(persistentValueToSharedStateValue(nextValue));
      }

      hydrationState.set(false);

      onHydrationEnd?.();
    } catch (error) {
      if (lastHydrationTime > hydrationTime) return;

      hydrationState.set(false);

      onHydrationEnd?.(error);
    }
  });

  const mutate = (valueOrUpdater: ValueOrUpdater<T>) => {
    onMutationStart?.();

    mutationState.set(true);

    const mutationTime = new Date().getTime();

    lastMutationTime = mutationTime;

    const previousValue = sharedState.get();

    const nextValue =
      typeof valueOrUpdater === "function"
        ? (valueOrUpdater as Updater<T>)(previousValue)
        : valueOrUpdater;

    const commit = () => {
      if (lastMutationTime !== mutationTime) return;

      sharedState.set(nextValue);

      mutationState.set(false);

      onMutationEnd?.();
    };

    const throwError = (error: any) => {
      if (lastMutationTime !== mutationTime) return;

      mutationState.set(false);

      onMutationEnd?.(error);
    };

    try {
      const setStorageResult = storage.set(key, {
        value: nextValue,
        version,
        lastModified: mutationTime,
      });

      if (setStorageResult instanceof Promise) {
        setStorageResult
          .then(() => commit())
          .catch((error) => throwError(error));
      } else {
        commit();
      }
    } catch (error) {
      throwError(error);
    }
  };

  return {
    hydrate,
    get: () => {
      if (!lastHydrationTime && !lastMutationTime) {
        hydrate();
      }

      return sharedState.get();
    },
    set: (valueOrUpdator) => {
      if (hydrationState.get()) {
        const handler = (hydrating: boolean) => {
          if (!hydrating) {
            mutate(valueOrUpdator);

            hydrationState.unsubscribe(handler);
          }
        };

        hydrationState.subscribe(handler);
      } else {
        mutate(valueOrUpdator);
      }
    },
    subscribe: sharedState.subscribe,
    unsubscribe: sharedState.unsubscribe,
    hydrationState,
    mutationState,
  };
}
