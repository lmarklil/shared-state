import { useCallback, useRef } from "react";
import { useSyncExternalStore } from "use-sync-external-store/shim";
import { SharedState } from "@shared-state/core";

export function useSharedStateValue<T>(sharedState: SharedState<T>) {
  const cacheRef = useRef<T>();

  const subscribedRef = useRef(false);

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      sharedState.subscribe(onStoreChange);

      subscribedRef.current = true;

      return () => {
        sharedState.unsubscribe(onStoreChange);

        subscribedRef.current = false;
      };
    },
    [sharedState]
  );

  const getSnapshot = useCallback(() => {
    if (subscribedRef.current) {
      cacheRef.current = undefined;

      return sharedState.get();
    } else {
      if (cacheRef.current === undefined) {
        cacheRef.current = sharedState.get();
      }

      return cacheRef.current;
    }
  }, [sharedState]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useSetSharedStateValue<T>(sharedState: SharedState<T>) {
  return sharedState.set;
}

export function useSharedState<T>(
  sharedState: SharedState<T>
): [T, SharedState<T>["set"]] {
  return [
    useSharedStateValue(sharedState),
    useSetSharedStateValue(sharedState),
  ];
}
