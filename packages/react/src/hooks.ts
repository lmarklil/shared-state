import { useCallback } from "react";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/shim/with-selector";
import { SharedState } from "@shared-state/core";
import { Selector, Comparator } from "./types";

function defaultSelector<T>(value: T) {
  return value;
}

export function useSharedStateValue<Value, SelectedValue>(
  sharedState: SharedState<Value>,
  selector: Selector<Value, SelectedValue> = defaultSelector as any,
  comparator?: Comparator<SelectedValue>
) {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      sharedState.subscribe(onStoreChange);

      return () => sharedState.unsubscribe(onStoreChange);
    },
    [sharedState]
  );

  return useSyncExternalStoreWithSelector(
    subscribe,
    sharedState.get,
    sharedState.get,
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
