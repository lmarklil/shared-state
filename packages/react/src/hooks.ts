import { useMemo } from "react";
import { useSyncExternalStore } from "use-sync-external-store/shim";
import {
  SharedState,
  SharedStateFamily,
  SharedStateFamilyMemberKey,
  selectSharedStateFamilyMember,
} from "@shared-state/core";

export function useSharedStateValue<T>(sharedState: SharedState<T>) {
  return useSyncExternalStore(sharedState.subscribe, sharedState.get);
}

export function useSharedState<T>(
  sharedState: SharedState<T>
): [T, SharedState<T>["set"]] {
  return [useSharedStateValue(sharedState), sharedState.set];
}

export function useSharedStateFamilyMember<T>(
  sharedStateFamily: SharedStateFamily<T>,
  key: SharedStateFamilyMemberKey
) {
  const sharedState = useMemo(
    () => selectSharedStateFamilyMember(sharedStateFamily, key),
    [key, sharedStateFamily]
  );

  return useSharedState(sharedState);
}
