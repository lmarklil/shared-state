import { useSyncExternalStore } from "use-sync-external-store/shim";
import { SharedState, Subscriber } from "@shared-state/core";
import { useCallback } from "react";

export function useSharedStateValueWithSelector<T, SelectedValue>(
  sharedState: SharedState<T>,
  selector: (value: T) => SelectedValue,
  isEqual: (
    nextValue: SelectedValue,
    previousValue: SelectedValue
  ) => boolean = Object.is
) {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const handler: Subscriber<T> = (nextValue, previousValue) => {
        if (!isEqual(selector(nextValue), selector(previousValue))) {
          onStoreChange();
        }
      };

      sharedState.subscribe(handler);

      return () => sharedState.unsubscribe(handler);
    },
    [sharedState, selector]
  );

  const getSnapshot = useCallback(
    () => selector(sharedState.get()),
    [sharedState, selector]
  );

  const value = useSyncExternalStore(subscribe, getSnapshot);

  return value;
}

function defaultSelector<T>(value: T) {
  return value;
}

export function useSharedStateValue<T>(sharedState: SharedState<T>) {
  return useSharedStateValueWithSelector(sharedState, defaultSelector);
}

export function useSetSharedState<T>(
  sharedState: SharedState<T>
): SharedState<T>["set"] {
  return sharedState.set;
}

export function useSharedState<T>(
  sharedState: SharedState<T>
): [T, SharedState<T>["set"]] {
  return [useSharedStateValue(sharedState), useSetSharedState(sharedState)];
}
