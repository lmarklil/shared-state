import { useCallback, useRef } from "react";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/shim/with-selector";
import { SharedState } from "@shared-state/core";
import { Selector, Comparator } from "./types";

function defaultSelector<T>(value: T) {
  return value;
}

export function useSharedStateValue<Value, SelectedValue = Value>(
  sharedState: SharedState<Value>,
  selector: Selector<Value, SelectedValue> = defaultSelector as any,
  comparator?: Comparator<SelectedValue>
) {
  const cacheRef = useRef<Value>();

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

  return useSyncExternalStoreWithSelector(
    subscribe,
    getSnapshot,
    getSnapshot,
    selector,
    comparator
  );
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
