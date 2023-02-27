import { useSyncExternalStore } from "use-sync-external-store/shim";
import { SharedState } from "@shared-state/core";
import { DerivedSharedState } from "packages/core/src";

export function useSharedStateValue<T>(
  sharedState: SharedState<T> | DerivedSharedState<T>
) {
  return useSyncExternalStore(sharedState.subscribe, sharedState.get);
}

export function useSharedState<T>(
  sharedState: SharedState<T>
): [T, SharedState<T>["set"]] {
  return [useSharedStateValue(sharedState), sharedState.set];
}
