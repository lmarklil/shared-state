import {
  AsyncDerivedSharedState,
  AsyncDerivedSharedStateValueGetter,
  AsyncDerivedSharedStateValueSetter,
  DerivedSharedStateValueGetter,
  DerivedSharedStateValueSetter,
  SharedState,
  SharedStateFamily,
  SharedStateFamilyMemberCreater,
  SharedStateFamilyMemberKey,
  Subscriber,
  Updater,
} from "./types";

export function createSharedState<T>(initialValue: T): SharedState<T> {
  let value = initialValue;
  const subscriberSet = new Set<Subscriber<T>>();

  return {
    get: () => value,
    set: (valueOrUpdater) => {
      const previousValue = value;

      const nextValue =
        typeof valueOrUpdater === "function"
          ? (valueOrUpdater as Updater<T>)(previousValue)
          : valueOrUpdater;

      if (Object.is(nextValue, previousValue)) return;

      value = nextValue;

      subscriberSet.forEach((subscriber) =>
        subscriber(nextValue, previousValue)
      );
    },
    reset: () => (value = initialValue),
    subscribe: (handler) => {
      subscriberSet.add(handler);

      return () => subscriberSet.delete(handler);
    },
    unsubscribe: (handler) => subscriberSet.delete(handler),
    destroy: () => subscriberSet.clear(),
  };
}

export function createDerivedSharedState<T>(
  valueGetter: DerivedSharedStateValueGetter<T>,
  valueSetter?: DerivedSharedStateValueSetter<T>
): SharedState<T> {
  let value: T;

  let dependenceSet = new Set<SharedState<any>>();

  const subscriberSet = new Set<Subscriber<T>>();

  const isTrackingDependencies = () => subscriberSet.size > 0;

  const dependenceSubscrptionHandler = () =>
    subscriberSet.forEach((handler) => handler(getValue(), value));

  const getValue = () => {
    const nextDependencySet = new Set<SharedState<any>>();

    const value = valueGetter((sharedState) => {
      isTrackingDependencies() &&
        sharedState.subscribe(dependenceSubscrptionHandler);

      dependenceSet.add(sharedState);

      return sharedState.get();
    });

    // 取消订阅不再使用的依赖
    dependenceSet.forEach((sharedState) => {
      if (!nextDependencySet.has(sharedState) && isTrackingDependencies()) {
        sharedState.unsubscribe(dependenceSubscrptionHandler);
      }
    });

    dependenceSet = nextDependencySet;

    return value;
  };

  const unsubscribe = (handler: Subscriber<T>) => {
    subscriberSet.delete(handler);

    if (subscriberSet.size === 0) {
      dependenceSet.forEach((sharedState) => sharedState.unsubscribe(handler));
    }
  };

  value = getValue();

  return {
    get: () => {
      value = getValue();

      return value;
    },
    set: (valueOrUpdater) => {
      if (valueSetter) {
        const previousValue = value;

        const nextValue =
          typeof valueOrUpdater === "function"
            ? (valueOrUpdater as Updater<T>)(previousValue)
            : valueOrUpdater;

        valueSetter(nextValue, previousValue);
      }
    },
    reset: () => (value = getValue()),
    subscribe: (handler) => {
      if (subscriberSet.size === 0) {
        dependenceSet.forEach((sharedState) =>
          sharedState.subscribe(dependenceSubscrptionHandler)
        );
      }

      subscriberSet.add(handler);

      return () => unsubscribe(handler);
    },
    unsubscribe,
    destroy: () => {},
  };
}

export function createAsyncDerivedSharedState<T>(
  getValue: AsyncDerivedSharedStateValueGetter<T>,
  setValue?: AsyncDerivedSharedStateValueSetter<T>
): AsyncDerivedSharedState<T> {
  const internalSharedState = createSharedState<T | undefined>(undefined);

  const hydrationState = createSharedState(false);

  let dependencyMap = new Map<SharedState<any>, () => void>();

  let currentTaskId = 0;

  const hydrate = () => {
    const taskId = ++currentTaskId;

    hydrationState.set(true);

    const nextDependencyMap = new Map<SharedState<any>, () => void>();

    getValue((sharedState) => {
      if (!nextDependencyMap.has(sharedState)) {
        nextDependencyMap.set(
          sharedState,
          dependencyMap.get(sharedState) ||
            sharedState.subscribe(() => hydrate())
        );
      }

      return sharedState.get();
    }).then((value) => {
      if (currentTaskId !== taskId) return;

      internalSharedState.set(value);

      hydrationState.set(false);
    });

    for (const [sharedState, unsubscribe] of dependencyMap) {
      if (!nextDependencyMap.has(sharedState)) {
        unsubscribe();
      }
    }

    dependencyMap = nextDependencyMap;
  };

  hydrate();

  return {
    get: internalSharedState.get,
    set: (valueOrUpdater) => {
      if (setValue) {
        const previousValue = internalSharedState.get();

        const nextValue =
          typeof valueOrUpdater === "function"
            ? (valueOrUpdater as Updater<T | undefined>)(previousValue)
            : valueOrUpdater;

        setValue(nextValue, previousValue);
      }
    },
    reset: hydrate,
    subscribe: internalSharedState.subscribe,
    unsubscribe: internalSharedState.unsubscribe,
    destroy: () => {
      for (const [, unsubscribe] of dependencyMap) {
        unsubscribe();
      }

      internalSharedState.destroy();
    },
    hydrationState,
  };
}

export function createSharedStateFamily<T>(
  create: SharedStateFamilyMemberCreater<T>
): SharedStateFamily<T> {
  const memberMap = new Map<SharedStateFamilyMemberKey, SharedState<T>>();

  return {
    get: (key) => {
      const member = memberMap.get(key);

      if (member) {
        return member;
      } else {
        const member = create(key);

        memberMap.set(key, member);

        return member;
      }
    },
    destroy: (key) => {
      const destroySharedState = (key: SharedStateFamilyMemberKey) => {
        const member = memberMap.get(key);

        if (member) {
          member.destroy();
          memberMap.delete(key);
        }
      };

      if (key) {
        destroySharedState(key);
      } else {
        for (const [key] of memberMap) {
          destroySharedState(key);
        }
      }
    },
  };
}
