import { useSyncExternalStore } from "use-sync-external-store/shim";
import {
  SharedState,
  SharedStateFamily,
  SharedStateFamilyMemberKey,
} from "@shared-state/core";
import { useMemo } from "react";

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
  return useMemo(() => sharedStateFamily.get(key), [sharedStateFamily, key]);
}
