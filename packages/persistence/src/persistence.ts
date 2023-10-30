import { Updater, ValueOrUpdater, createSharedState } from "@shared-state/core";
import {
  PersistenceSharedState,
  PersistenceOptions,
  PersistenceValue,
  PersistenceStorage,
} from "./types";

export function createPersistenceSharedState<T>(
  storage: PersistenceStorage<PersistenceValue>,
  key: string,
  initialValue: T,
  options?: PersistenceOptions<T>
): PersistenceSharedState<T> {
  const version = options?.version;

  const migrator = options?.migrator;

  const onHydrationStart = options?.onHydrationStart;

  const onHydrationEnd = options?.onHydrationEnd;

  const onMutationStart = options?.onMutationStart;

  const onMutationEnd = options?.onMutationEnd;

  const sharedState = createSharedState(initialValue);

  const hydrationState = createSharedState(false);

  const mutationState = createSharedState(false);

  let lastHydrationTime: number | null = null;

  let lastMutationTime: number | null = null;

  const hydratePersistenceValueToSharedState = (
    persistentValue: PersistenceValue | null
  ) => {
    if (persistentValue !== null) {
      if (persistentValue.version === version) {
        sharedState.set(persistentValue.value);
      } else {
        if (!migrator) return;

        if (Object.hasOwn(persistentValue, "value")) {
          sharedState.set(
            migrator(persistentValue.value, persistentValue.version)
          );
        } else {
          sharedState.set(migrator(persistentValue)); // persistentValue有可能是不支持的数据结构，此时将完整的值返回给用户处理
        }
      }
    }
  };

  const hydrate = async () => {
    onHydrationStart?.();

    hydrationState.set(true);

    const hydrationTime = new Date().getTime();

    lastHydrationTime = hydrationTime;

    try {
      const getStorageResult = await storage.get(key);

      if (lastHydrationTime !== hydrationTime) return;

      if (lastMutationTime === null || hydrationTime > lastMutationTime) {
        hydratePersistenceValueToSharedState(getStorageResult);
      }

      hydrationState.set(false);

      onHydrationEnd?.();
    } catch (error) {
      if (lastHydrationTime !== hydrationTime) return;

      hydrationState.set(false);

      onHydrationEnd?.(error);
    }
  };

  hydrate();

  storage.subscribe?.((updateKey, nextValue, previousValue) => {
    if (updateKey !== key || Object.is(nextValue, previousValue)) return;

    onHydrationStart?.();

    hydrationState.set(true);

    const hydrationTime = new Date().getTime();

    lastHydrationTime = hydrationTime;

    try {
      if (lastHydrationTime !== hydrationTime) return;

      if (nextValue !== null) {
        // 根据数据最后修改时间来确定是否用存储数据覆盖本地状态
        if (
          lastMutationTime === null ||
          nextValue.lastModified > lastMutationTime
        ) {
          hydratePersistenceValueToSharedState(nextValue);
        }
      } else {
        // 清空操作暂时无法判断是在lastMutation之前还是之后发生的，所以我们还是按照数据至上的原则，根据hydrationTime是否大于lastMutationTime来确定是否清除数据
        if (lastMutationTime === null || hydrationTime > lastMutationTime) {
          sharedState.set(initialValue);
        }
      }

      hydrationState.set(false);

      onHydrationEnd?.();
    } catch (error) {
      if (lastHydrationTime !== hydrationTime) return;

      hydrationState.set(false);

      onHydrationEnd?.(error);
    }
  });

  const mutate = async (valueOrUpdater: ValueOrUpdater<T>) => {
    onMutationStart?.();

    mutationState.set(true);

    const mutationTime = new Date().getTime();

    lastMutationTime = mutationTime;

    const previousValue = sharedState.get();

    const nextValue =
      typeof valueOrUpdater === "function"
        ? (valueOrUpdater as Updater<T>)(previousValue)
        : valueOrUpdater;

    try {
      await storage.set(key, {
        value: nextValue,
        version,
        lastModified: mutationTime,
      });

      if (lastMutationTime !== mutationTime) return;

      sharedState.set(nextValue);

      mutationState.set(false);

      onMutationEnd?.();
    } catch (error) {
      if (lastMutationTime !== mutationTime) return;

      mutationState.set(false);

      onMutationEnd?.(error);
    }
  };

  return {
    get: sharedState.get,
    set: mutate,
    subscribe: sharedState.subscribe,
    unsubscribe: sharedState.unsubscribe,
    hydrationState,
    mutationState,
  };
}
