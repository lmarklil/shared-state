import { useMemo } from "react";
import { useSyncExternalStore } from "use-sync-external-store/shim";
import {
  SharedState,
  SharedStateFamily,
  SharedStateFamilyMemberKey,
  getSharedStateFamilyMember,
} from "@shared-state/core";

export function useSharedStateValue<T>(sharedState: SharedState<T>) {
  return useSyncExternalStore(sharedState.subscribe, sharedState.get);
}

export function useSharedState<T>(
  sharedState: SharedState<T>
): [T, SharedState<T>["set"]] {
  return [useSharedStateValue(sharedState), sharedState.set];
}

export function useSharedStateFamily<T>(
  sharedStateFamily: SharedStateFamily<T>,
  key: SharedStateFamilyMemberKey
) {
  const sharedState = useMemo(
    () => getSharedStateFamilyMember(sharedStateFamily, key),
    [key, sharedStateFamily]
  );

  return useSharedState(sharedState);
}
