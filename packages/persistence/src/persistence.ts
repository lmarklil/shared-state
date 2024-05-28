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
  PersistenceKey,
  PersistenceStorageSubscriber,
} from "./types";

export function createPersistenceSharedState<T>(
  storage: PersistenceStorage<PersistenceValue>,
  key: PersistenceKey,
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

  let subscriberCount = 0;

  const hydrationState = createSharedState(false);

  const mutationState = createSharedState(false);

  let lastModified = 0;

  let hydrated = false;

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

  const pendingTaskQueue: (() => void)[] = [];

  const resolveNextPendingTask = () => {
    if (pendingTaskQueue.length > 0) {
      const task = pendingTaskQueue.shift();

      task?.();
    }
  };

  const hydrate = () => {
    const pending = hydrationState.get() || mutationState.get();

    if (pending) {
      pendingTaskQueue.splice(0);
      pendingTaskQueue.push(() => hydrate());
      return;
    }

    hydrated = true;

    onHydrationStart?.();

    hydrationState.set(true);

    const commit = (persistentValue: PersistenceValue | null) => {
      if (
        persistentValue !== null &&
        persistentValue.lastModified > lastModified
      ) {
        sharedState.set(persistentValueToSharedStateValue(persistentValue));

        lastModified = persistentValue.lastModified;
      }

      hydrationState.set(false);

      onHydrationEnd?.();

      resolveNextPendingTask();
    };

    const throwError = (error: any) => {
      hydrationState.set(false);

      onHydrationEnd?.(error);

      resolveNextPendingTask();
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

  const mutate = (valueOrUpdater: ValueOrUpdater<T>) => {
    if (typeof valueOrUpdater === "function" && !hydrated && !lastModified) {
      hydrate();

      pendingTaskQueue.push(() => mutate(valueOrUpdater));

      return;
    }

    const pending = hydrationState.get() || mutationState.get();

    if (pending) {
      if (typeof valueOrUpdater !== "function") {
        pendingTaskQueue.splice(0);
      }

      pendingTaskQueue.push(() => mutate(valueOrUpdater));

      return;
    }

    const previousValue = sharedState.get();

    const nextValue =
      typeof valueOrUpdater === "function"
        ? (valueOrUpdater as Updater<T>)(previousValue)
        : valueOrUpdater;

    if (Object.is(nextValue, previousValue)) return;

    onMutationStart?.();

    mutationState.set(true);

    const time = new Date().getTime();

    const commit = () => {
      if (time > lastModified) {
        sharedState.set(nextValue);

        lastModified = time;
      }

      mutationState.set(false);

      onMutationEnd?.();

      resolveNextPendingTask();
    };

    const throwError = (error: any) => {
      mutationState.set(false);

      onMutationEnd?.(error);

      resolveNextPendingTask();
    };

    try {
      const setStorageResult = storage.set(key, {
        value: nextValue,
        version,
        lastModified: time,
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

  const storageSubscribeHandler: PersistenceStorageSubscriber<
    PersistenceValue
  > = (updateKey, nextValue, previousValue) => {
    if (
      updateKey !== key ||
      Object.is(nextValue, previousValue) ||
      (nextValue && nextValue.lastModified < lastModified)
    )
      return;

    sharedState.set(persistentValueToSharedStateValue(nextValue));

    lastModified = nextValue?.lastModified ?? new Date().getTime();
  };

  return {
    hydrate,
    get: () => {
      if (!hydrated && !lastModified) hydrate();

      return sharedState.get();
    },
    set: mutate,
    subscribe: (handler) => {
      if (subscriberCount === 0) {
        storage.subscribe?.(storageSubscribeHandler);
      }

      sharedState.subscribe(handler);

      subscriberCount++;
    },
    unsubscribe: (handler) => {
      sharedState.unsubscribe(handler);

      subscriberCount--;

      if (subscriberCount === 0) {
        storage.unsubscribe?.(storageSubscribeHandler);
      }
    },
    hydrationState,
    mutationState,
  };
}
