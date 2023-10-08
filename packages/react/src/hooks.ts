import { useCallback } from "react";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/shim/with-selector";
import { SharedState } from "@shared-state/core";
import { Selector, Comparator } from "./types";

export function useSharedStateValueWithSelector<Value, SelectedValue>(
  sharedState: SharedState<Value>,
  selector: Selector<Value, SelectedValue>,
  comparator?: Comparator<SelectedValue>
) {
  const subscribe = useCallback((onStoreChange: () => void) => {
    sharedState.subscribe(onStoreChange);

    return () => sharedState.unsubscribe(onStoreChange);
  }, []);

  return useSyncExternalStoreWithSelector(
    subscribe,
    sharedState.get,
    sharedState.get,
    selector,
    comparator
  );
}

function defaultSelector<T>(value: T) {
  return value;
}

export function useSharedStateValue<T>(sharedState: SharedState<T>) {
  return useSharedStateValueWithSelector(sharedState, defaultSelector);
}

export function useSetSharedState<T>(sharedState: SharedState<T>) {
  return sharedState.set;
}

export function useSharedState<T>(
  sharedState: SharedState<T>
): [T, SharedState<T>["set"]] {
  return [useSharedStateValue(sharedState), useSetSharedState(sharedState)];
}
