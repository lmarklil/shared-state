import {
  createDerivedSharedState,
  DerivedSharedStateValueGetter,
} from "@shared-state/core";
import { ComponentType, createElement } from "react";
import { useSharedStateValue } from "./hooks";

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
