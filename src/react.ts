import { ComponentType, createElement, useMemo } from "react";
import { useSyncExternalStore } from "use-sync-external-store/shim";
import { createDerivedSharedState } from "./core";

import {
  DerivedSharedStateValueGetter,
  SharedState,
  SharedStateFamily,
  SharedStateFamilyMemberKey,
} from "./types";
import { getSharedStateFamilyMember } from "./utils";

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

export function connectSharedState<T extends Record<string, any>>(
  getValue: DerivedSharedStateValueGetter<T>
) {
  const derivedSharedState = createDerivedSharedState(getValue);

  return function withSharedState<Props extends T>(
    WrappedComponent: ComponentType<Props>
  ) {
    function ComponentWithSharedState(props: Props) {
      const derivedSharedStateValue = useSharedStateValue(derivedSharedState);

      return createElement(WrappedComponent, {
        ...props,
        ...derivedSharedStateValue,
      });
    }

    ComponentWithSharedState.displayName = `withSharedState(${
      WrappedComponent.displayName || WrappedComponent.name || "Component"
    })`;

    return ComponentWithSharedState;
  };
}
