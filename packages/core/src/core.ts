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

      if (nextValue === previousValue) return;

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
    destroy: () => subscriberSet.clear(),
  };
}

export function createDerivedSharedState<T>(
  getValue: DerivedSharedStateValueGetter<T>,
  setValue?: DerivedSharedStateValueSetter<T>
): SharedState<T> {
  let dependencyMap = new Map<SharedState<any>, () => void>();

  const getDerivedSharedStateValue = () => {
    const nextDependencyMap = new Map<SharedState<any>, () => void>();

    const value = getValue((sharedState) => {
      if (!nextDependencyMap.has(sharedState)) {
        nextDependencyMap.set(
          sharedState,
          dependencyMap.get(sharedState) ||
            sharedState.subscribe(() =>
              internalSharedState.set(getDerivedSharedStateValue())
            )
        );
      }

      return sharedState.get();
    });

    for (const [sharedState, unsubscribe] of dependencyMap) {
      if (!nextDependencyMap.has(sharedState)) {
        unsubscribe();
      }
    }

    dependencyMap = nextDependencyMap;

    return value;
  };

  const internalSharedState = createSharedState(getDerivedSharedStateValue());

  return {
    get: internalSharedState.get,
    set: (valueOrUpdater) => {
      if (setValue) {
        const previousValue = internalSharedState.get();

        const nextValue =
          typeof valueOrUpdater === "function"
            ? (valueOrUpdater as Updater<T>)(previousValue)
            : valueOrUpdater;

        setValue(nextValue, previousValue);
      }
    },
    reset: () => internalSharedState.set(getDerivedSharedStateValue()),
    subscribe: internalSharedState.subscribe,
    destroy: () => {
      for (const [, unsubscribe] of dependencyMap) {
        unsubscribe();
      }

      internalSharedState.destroy();
    },
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
