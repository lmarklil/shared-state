import {
  createDerivedSharedState,
  DerivedSharedStateValueGetter,
} from "@shared-state/core";
import { ComponentType, createElement, forwardRef } from "react";
import { useSharedStateValue } from "./hooks";

export function connectSharedState<T extends Record<string, any>, Ref = any>(
  getValue: DerivedSharedStateValueGetter<T>
) {
  const derivedSharedState = createDerivedSharedState(getValue);

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
