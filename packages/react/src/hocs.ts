import { ComponentType, createElement, forwardRef } from "react";

import {
  createDerivedSharedState,
  DerivedSharedStateGetter,
} from "@shared-state/core";

import { useSharedStateValue } from "./hooks";

export function connectSharedState<
  T extends Record<string, any>,
  Ref = unknown
>(getProps: DerivedSharedStateGetter<T>) {
  const derivedSharedState = createDerivedSharedState(getProps);

  return function withSharedState<Props>(
    WrappedComponent: ComponentType<Props & T>
  ) {
    const ComponentWithSharedState = forwardRef<Ref, Props>(
      function ComponentWithSharedState(props, ref) {
        const derivedSharedStateValue = useSharedStateValue(derivedSharedState);

        return createElement(WrappedComponent, {
          ref,
          ...props,
          ...derivedSharedStateValue,
        });
      }
    );

    ComponentWithSharedState.displayName = `withSharedState(${
      WrappedComponent.displayName || WrappedComponent.name || "Component"
    })`;

    return ComponentWithSharedState;
  };
}
